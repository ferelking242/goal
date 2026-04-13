import { supabase } from '@/utils/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Team = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type Match = {
  id: string;
  fixture_id: number | null;
  date: string;
  match_time: string | null;
  team_home: Team;
  team_away: Team;
  score_home: number | null;
  score_away: number | null;
  status: string;
  elapsed: number | null;
  league_name: string | null;
  league_logo_url: string | null;
  is_vip: boolean;
  predictions?: Prediction[];
};

export type Prediction = {
  id: string;
  match_id: string;
  code: string;
  bookmaker: string;
  tip: string;
  is_vip: boolean;
};

// ─── API-Football sync ────────────────────────────────────────────────────────

const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ?? '';
const API_BASE = 'https://v3.football.api-sports.io';

// Cache: dates we already attempted to sync this session (avoids duplicate fetches)
const syncedDates = new Set<string>();

export async function syncFixtures(date: string): Promise<void> {
  if (!API_KEY) return;
  if (syncedDates.has(date)) return;

  try {
    // Check if we already have synced data for this date
    const { data: existing, error: checkError } = await supabase
      .from('matches')
      .select('id')
      .gte('date', `${date}T00:00:00`)
      .lte('date', `${date}T23:59:59`)
      .not('fixture_id', 'is', null)
      .limit(1);

    if (checkError) throw checkError;

    // If we have data AND it's not today (live data can change), skip
    const today = new Date().toISOString().split('T')[0];
    if (existing && existing.length > 0 && date !== today) {
      syncedDates.add(date);
      return;
    }

    // Fetch from API-Football
    const res = await fetch(`${API_BASE}/fixtures?date=${date}`, {
      headers: { 'x-apisports-key': API_KEY },
    });

    if (!res.ok) {
      console.warn(`[API-Football] HTTP ${res.status} for date ${date}`);
      return;
    }

    const json = await res.json();
    const fixtures: any[] = json.response ?? [];

    if (fixtures.length === 0) {
      syncedDates.add(date);
      return;
    }

    // ── Upsert teams ────────────────────────────────────────────────────────

    // Collect unique teams
    const teamMap = new Map<number, { api_id: number; name: string; logo_url: string }>();
    for (const f of fixtures) {
      const h = f.teams.home;
      const a = f.teams.away;
      teamMap.set(h.id, { api_id: h.id, name: h.name, logo_url: h.logo });
      teamMap.set(a.id, { api_id: a.id, name: a.name, logo_url: a.logo });
    }

    const teamsArr = Array.from(teamMap.values());

    const { data: upsertedTeams, error: teamsError } = await supabase
      .from('teams')
      .upsert(teamsArr, { onConflict: 'api_id' })
      .select('id, api_id');

    if (teamsError) throw teamsError;

    // Build api_id → UUID map
    const apiIdToUuid: Record<number, string> = {};
    for (const t of upsertedTeams ?? []) {
      apiIdToUuid[t.api_id] = t.id;
    }

    // ── Upsert matches ───────────────────────────────────────────────────────

    const matchRows = fixtures
      .map((f: any) => {
        const homeUuid = apiIdToUuid[f.teams.home.id];
        const awayUuid = apiIdToUuid[f.teams.away.id];
        if (!homeUuid || !awayUuid) return null;

        return {
          fixture_id: f.fixture.id,
          date: f.fixture.date,
          match_time: f.fixture.date,
          team_home_id: homeUuid,
          team_away_id: awayUuid,
          score_home: f.goals.home,
          score_away: f.goals.away,
          status: f.fixture.status.short,
          elapsed: f.fixture.status.elapsed,
          league_id: f.league.id,
          league_name: f.league.name,
          league_logo_url: f.league.logo,
          is_vip: false,
        };
      })
      .filter(Boolean);

    if (matchRows.length > 0) {
      // Upsert in batches of 50 to avoid request size limits
      const BATCH = 50;
      for (let i = 0; i < matchRows.length; i += BATCH) {
        const batch = matchRows.slice(i, i + BATCH);
        const { error: matchError } = await supabase
          .from('matches')
          .upsert(batch, { onConflict: 'fixture_id' });
        if (matchError) console.warn('[sync] batch error:', matchError.message);
      }
    }

    syncedDates.add(date);
    console.log(`[API-Football] Synced ${matchRows.length} fixtures for ${date}`);
  } catch (err: any) {
    console.warn('[API-Football] Sync failed:', err?.message ?? err);
  }
}

// ─── Fetch matches from Supabase ──────────────────────────────────────────────

export async function getMatchesByDate(date: string, isVip = false): Promise<Match[]> {
  // Sync first (non-blocking failure)
  await syncFixtures(date);

  const start = `${date}T00:00:00`;
  const end = `${date}T23:59:59`;

  let query = supabase
    .from('matches')
    .select(`
      id, fixture_id, date, match_time, score_home, score_away,
      status, elapsed, league_name, league_logo_url, is_vip,
      team_home:team_home_id(id, name, logo_url),
      team_away:team_away_id(id, name, logo_url),
      predictions(id, match_id, code, bookmaker, tip, is_vip)
    `)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
    .limit(200);

  if (!isVip) {
    query = query.eq('is_vip', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as Match[];
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];

  const [matchRes, userRes, todayRes] = await Promise.all([
    supabase.from('matches').select('id, is_vip'),
    supabase.from('profiles').select('id, is_vip'),
    supabase
      .from('matches')
      .select('id')
      .gte('date', `${today}T00:00:00`)
      .lte('date', `${today}T23:59:59`),
  ]);

  const matches = matchRes.data ?? [];
  const users = userRes.data ?? [];
  const todayMatches = todayRes.data ?? [];

  return {
    totalMatches: matches.length,
    vipMatches: matches.filter((m: { is_vip: boolean }) => m.is_vip).length,
    totalUsers: users.length,
    vipUsers: users.filter((u: { is_vip: boolean }) => u.is_vip).length,
    todayMatches: todayMatches.length,
  };
}
