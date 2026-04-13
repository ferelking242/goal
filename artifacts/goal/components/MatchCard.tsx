import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Match } from '@/services/matchService';

// ─── Status helpers ────────────────────────────────────────────────────────────

const LIVE_STATUSES = new Set(['1H', '2H', 'ET', 'P', 'LIVE', 'BT']);
const FT_STATUSES   = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO']);
const CANC_STATUSES = new Set(['CANC', 'PST', 'SUSP', 'INT', 'ABD']);

type StatusKind = 'live' | 'ht' | 'ft' | 'cancelled' | 'upcoming';

function classifyStatus(status: string): StatusKind {
  if (LIVE_STATUSES.has(status)) return 'live';
  if (status === 'HT') return 'ht';
  if (FT_STATUSES.has(status)) return 'ft';
  if (CANC_STATUSES.has(status)) return 'cancelled';
  return 'upcoming';
}

function formatKickoff(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (hh === '00' && mm === '00') return null;
    return `${hh}:${mm}`;
  } catch {
    return null;
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TeamLogo({ uri, name, size = 44 }: { uri?: string | null; name: string; size?: number }) {
  const { colors } = useTheme();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  return (
    <View style={[styles.logoPlaceholder, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.backgroundElevated }]}>
      <Text style={{ color: colors.textSecondary, fontSize: size * 0.34, fontWeight: '700' }}>
        {name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

// The center block: shows time/prediction before, score+prediction during/after
function CenterBlock({ match, colors }: { match: Match; colors: any }) {
  const kind = classifyStatus(match.status);
  const prediction = match.predictions?.[0];
  const kickoff = formatKickoff(match.match_time);

  const isScored = match.score_home !== null && match.score_away !== null;

  if (kind === 'upcoming') {
    return (
      <View style={styles.centerBlock}>
        {kickoff && (
          <Text style={[styles.kickoffTime, { color: colors.text }]}>{kickoff}</Text>
        )}
        {prediction ? (
          <View style={[styles.predChip, { backgroundColor: colors.goldDim }]}>
            <Text style={[styles.predChipText, { color: colors.gold }]} numberOfLines={1}>
              {prediction.tip}
            </Text>
          </View>
        ) : (
          <Text style={[styles.vsText, { color: colors.textMuted }]}>VS</Text>
        )}
      </View>
    );
  }

  if (kind === 'live') {
    return (
      <View style={styles.centerBlock}>
        <View style={styles.liveRow}>
          <View style={[styles.liveDot, { backgroundColor: colors.live }]} />
          <Text style={[styles.liveMin, { color: colors.live }]}>
            {match.elapsed ? `${match.elapsed}'` : 'LIVE'}
          </Text>
        </View>
        {isScored && (
          <Text style={[styles.scoreLive, { color: colors.live }]}>
            {match.score_home} - {match.score_away}
          </Text>
        )}
        {prediction && (
          <View style={[styles.predChip, { backgroundColor: colors.goldDim }]}>
            <Text style={[styles.predChipText, { color: colors.gold }]} numberOfLines={1}>
              {prediction.tip}
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (kind === 'ht') {
    return (
      <View style={styles.centerBlock}>
        <Text style={[styles.htLabel, { color: colors.live }]}>MI-TEMPS</Text>
        {isScored && (
          <Text style={[styles.scoreFt, { color: colors.text }]}>
            {match.score_home} - {match.score_away}
          </Text>
        )}
        {prediction && (
          <View style={[styles.predChip, { backgroundColor: colors.goldDim }]}>
            <Text style={[styles.predChipText, { color: colors.gold }]} numberOfLines={1}>
              {prediction.tip}
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (kind === 'ft') {
    return (
      <View style={styles.centerBlock}>
        <Text style={[styles.ftLabel, { color: colors.textMuted }]}>TERMINÉ</Text>
        {isScored && (
          <Text style={[styles.scoreFt, { color: colors.text }]}>
            {match.score_home} - {match.score_away}
          </Text>
        )}
        {prediction && (
          <View style={[styles.predChip, { backgroundColor: colors.goldDim }]}>
            <Text style={[styles.predChipText, { color: colors.gold }]} numberOfLines={1}>
              {prediction.tip}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // cancelled / postponed
  return (
    <View style={styles.centerBlock}>
      <Text style={[styles.ftLabel, { color: colors.textMuted }]}>
        {match.status === 'PST' ? 'REPORTÉ' : 'ANNULÉ'}
      </Text>
    </View>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

type Props = { match: Match; onToast?: (msg: string) => void };

export function MatchCard({ match, onToast }: Props) {
  const { colors } = useTheme();
  const [copyScale] = useState(new Animated.Value(1));
  const prediction = match.predictions?.[0];
  const kind = classifyStatus(match.status);
  const isLive = kind === 'live' || kind === 'ht';

  const handleCopy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onToast?.('Code copié !');
    Animated.sequence([
      Animated.timing(copyScale, { toValue: 0.82, duration: 90, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(copyScale, { toValue: 1, duration: 130, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.backgroundCard,
        borderColor: isLive ? 'rgba(255,59,48,0.20)' : colors.border,
      },
    ]}>
      {/* Copy button — top right, only if prediction has a bookmaker code */}
      {prediction?.code && (
        <Animated.View style={[styles.copyAbsolute, { transform: [{ scale: copyScale }] }]}>
          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: colors.accentDim }]}
            onPress={() => handleCopy(prediction.code)}
            activeOpacity={0.7}
          >
            <Feather name="copy" size={12} color={colors.accent} />
            <Text style={[styles.copyBtnText, { color: colors.accent }]}>{prediction.bookmaker}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Teams row */}
      <View style={styles.teamsRow}>
        <View style={styles.teamBlock}>
          <TeamLogo uri={match.team_home?.logo_url} name={match.team_home?.name ?? '?'} />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>
            {match.team_home?.name}
          </Text>
        </View>

        <CenterBlock match={match} colors={colors} />

        <View style={styles.teamBlock}>
          <TeamLogo uri={match.team_away?.logo_url} name={match.team_away?.name ?? '?'} />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>
            {match.team_away?.name}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginHorizontal: 14,
    marginVertical: 4,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 12,
    paddingBottom: 12,
  },
  copyAbsolute: {
    position: 'absolute',
    top: 8,
    right: 10,
    zIndex: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  copyBtnText: { fontSize: 10, fontWeight: '600' },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
  },
  teamBlock: { flex: 1, alignItems: 'center', gap: 6 },
  teamName: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 15 },
  logoPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  // Center block
  centerBlock: { width: 80, alignItems: 'center', gap: 4, paddingHorizontal: 2 },
  kickoffTime: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  vsText: { fontSize: 12, fontWeight: '600' },
  predChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    maxWidth: 76,
  },
  predChipText: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  // Live
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveMin: { fontSize: 12, fontWeight: '800' },
  scoreLive: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },

  // HT / FT labels
  htLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  ftLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  scoreFt: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
});
