import { supabase } from '@/utils/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  is_vip: boolean;
  is_admin: boolean;
  is_banned?: boolean;
  is_blocked?: boolean;
  warning_count?: number;
  created_at?: string;
};

export type PredictionOption = {
  id?: string;
  match_id: string;
  code: string;
  bookmaker: string;
  tip: string;
  is_vip: boolean;
};

export const PREDICTION_CATEGORIES = [
  {
    label: 'Résultat du match (1X2)',
    code: '1X2',
    options: [
      { tip: '1', label: 'Victoire Domicile' },
      { tip: 'X', label: 'Match Nul' },
      { tip: '2', label: 'Victoire Extérieur' },
    ],
  },
  {
    label: 'Double Chance',
    code: 'DOUBLE_CHANCE',
    options: [
      { tip: '1X', label: '1X (Dom ou Nul)' },
      { tip: 'X2', label: 'X2 (Ext ou Nul)' },
      { tip: '12', label: '12 (Dom ou Ext)' },
    ],
  },
  {
    label: 'Les Deux Équipes Marquent (BTTS)',
    code: 'BTTS',
    options: [
      { tip: 'Oui', label: 'Oui' },
      { tip: 'Non', label: 'Non' },
    ],
  },
  {
    label: 'Plus / Moins de buts',
    code: 'OVER_UNDER',
    options: [
      { tip: 'Over 0.5', label: 'Plus de 0.5' },
      { tip: 'Under 0.5', label: 'Moins de 0.5' },
      { tip: 'Over 1.5', label: 'Plus de 1.5' },
      { tip: 'Under 1.5', label: 'Moins de 1.5' },
      { tip: 'Over 2.5', label: 'Plus de 2.5' },
      { tip: 'Under 2.5', label: 'Moins de 2.5' },
      { tip: 'Over 3.5', label: 'Plus de 3.5' },
      { tip: 'Under 3.5', label: 'Moins de 3.5' },
      { tip: 'Over 4.5', label: 'Plus de 4.5' },
      { tip: 'Under 4.5', label: 'Moins de 4.5' },
    ],
  },
  {
    label: 'Mi-Temps (1X2)',
    code: 'HT_1X2',
    options: [
      { tip: 'HT-1', label: 'Dom à la MT' },
      { tip: 'HT-X', label: 'Nul à la MT' },
      { tip: 'HT-2', label: 'Ext à la MT' },
    ],
  },
  {
    label: 'Clean Sheet',
    code: 'CLEAN_SHEET',
    options: [
      { tip: 'CS-Home-Oui', label: 'Clean Sheet Domicile' },
      { tip: 'CS-Home-Non', label: 'Pas de Clean Sheet Dom.' },
      { tip: 'CS-Away-Oui', label: 'Clean Sheet Extérieur' },
      { tip: 'CS-Away-Non', label: 'Pas de Clean Sheet Ext.' },
    ],
  },
  {
    label: 'Nombre de corners',
    code: 'CORNERS',
    options: [
      { tip: 'Corners Over 8.5', label: 'Plus de 8.5 corners' },
      { tip: 'Corners Under 8.5', label: 'Moins de 8.5 corners' },
      { tip: 'Corners Over 10.5', label: 'Plus de 10.5 corners' },
      { tip: 'Corners Under 10.5', label: 'Moins de 10.5 corners' },
    ],
  },
  {
    label: 'Cartons',
    code: 'CARDS',
    options: [
      { tip: 'Cards Over 3.5', label: 'Plus de 3.5 cartons' },
      { tip: 'Cards Under 3.5', label: 'Moins de 3.5 cartons' },
      { tip: 'Cards Over 4.5', label: 'Plus de 4.5 cartons' },
      { tip: 'Cards Under 4.5', label: 'Moins de 4.5 cartons' },
    ],
  },
];

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as UserProfile[];
}

export async function updateUserStatus(
  userId: string,
  updates: Partial<Pick<UserProfile, 'is_vip' | 'is_admin' | 'is_banned' | 'is_blocked' | 'warning_count'>>
) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

export async function deleteUser(userId: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}

// ─── Predictions ──────────────────────────────────────────────────────────────

export async function getMatchPredictions(matchId: string): Promise<PredictionOption[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', matchId);
  if (error) throw error;
  return (data || []) as PredictionOption[];
}

export async function savePrediction(pred: PredictionOption): Promise<{ valid: boolean; id?: string }> {
  if (pred.id) {
    const { error } = await supabase
      .from('predictions')
      .update({ code: pred.code, bookmaker: pred.bookmaker, tip: pred.tip, is_vip: pred.is_vip })
      .eq('id', pred.id);
    if (error) return { valid: false };
    return { valid: true, id: pred.id };
  } else {
    const { data, error } = await supabase
      .from('predictions')
      .insert({ match_id: pred.match_id, code: pred.code, bookmaker: pred.bookmaker, tip: pred.tip, is_vip: pred.is_vip })
      .select('id')
      .single();
    if (error) return { valid: false };
    return { valid: true, id: data?.id };
  }
}

export async function deletePrediction(predId: string): Promise<void> {
  const { error } = await supabase.from('predictions').delete().eq('id', predId);
  if (error) throw error;
}

export async function updateMatchVipStatus(matchId: string, isVip: boolean): Promise<void> {
  const { error } = await supabase.from('matches').update({ is_vip: isVip }).eq('id', matchId);
  if (error) throw error;
}
