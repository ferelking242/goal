import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdmin } from '@/contexts/AdminContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getDashboardStats, getMatchesByDate, type Match } from '@/services/matchService';

function formatToday() {
  return new Date().toISOString().split('T')[0];
}

function formatDateLabel(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

type StatCardProps = {
  icon: string;
  label: string;
  value: number | string;
  color: string;
  bg: string;
  colors: any;
  subtitle?: string;
};

function StatCard({ icon, label, value, color, bg, colors, subtitle }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      {subtitle ? <Text style={[styles.statSub, { color: color }]}>{subtitle}</Text> : null}
    </View>
  );
}

function ModeButton({
  icon,
  label,
  subtitle,
  color,
  bg,
  active,
  onPress,
  colors,
}: {
  icon: string;
  label: string;
  subtitle: string;
  color: string;
  bg: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.modeBtn,
        {
          backgroundColor: active ? bg : colors.backgroundCard,
          borderColor: active ? color : colors.border,
          borderWidth: active ? 2 : 1,
        },
      ]}
    >
      <View style={[styles.modeBtnIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.modeBtnLabel, { color: active ? color : colors.text }]}>{label}</Text>
        <Text style={[styles.modeBtnSub, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      {active && (
        <View style={[styles.activeDot, { backgroundColor: color }]} />
      )}
    </TouchableOpacity>
  );
}

function TodayMatchRow({ match, isGodMode, colors }: { match: Match; isGodMode: boolean; colors: any }) {
  const home = match.team_home?.name ?? '?';
  const away = match.team_away?.name ?? '?';
  const time = match.match_time
    ? new Date(match.match_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const predsCount = match.predictions?.length ?? 0;

  return (
    <TouchableOpacity
      style={[styles.matchRow, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => {
        if (isGodMode) {
          router.push({ pathname: '/admin/match-predictions/[matchId]', params: { matchId: match.id, matchLabel: `${home} vs ${away}` } } as any);
        }
      }}
    >
      <View style={styles.matchRowLeft}>
        <View style={styles.matchTeams}>
          {match.team_home?.logo_url ? (
            <Image source={{ uri: match.team_home.logo_url }} style={styles.teamLogo} resizeMode="contain" />
          ) : (
            <View style={[styles.teamLogoPlaceholder, { backgroundColor: colors.backgroundElevated }]} />
          )}
          <Text style={[styles.matchTeamName, { color: colors.text }]} numberOfLines={1}>{home}</Text>
        </View>
        <Text style={[styles.vsText, { color: colors.textMuted }]}>vs</Text>
        <View style={styles.matchTeams}>
          {match.team_away?.logo_url ? (
            <Image source={{ uri: match.team_away.logo_url }} style={styles.teamLogo} resizeMode="contain" />
          ) : (
            <View style={[styles.teamLogoPlaceholder, { backgroundColor: colors.backgroundElevated }]} />
          )}
          <Text style={[styles.matchTeamName, { color: colors.text }]} numberOfLines={1}>{away}</Text>
        </View>
      </View>
      <View style={styles.matchRowRight}>
        <Text style={[styles.matchTime, { color: colors.textMuted }]}>{time}</Text>
        {match.is_vip && (
          <View style={[styles.vipChip, { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: 'rgba(255,215,0,0.4)' }]}>
            <Text style={{ fontSize: 9, color: '#FFD700', fontWeight: '700' }}>VIP</Text>
          </View>
        )}
        <View style={[styles.predChip, { backgroundColor: predsCount > 0 ? colors.accentDim : colors.backgroundElevated }]}>
          <Text style={{ fontSize: 10, color: predsCount > 0 ? colors.accent : colors.textMuted, fontWeight: '600' }}>
            {predsCount} pred
          </Text>
        </View>
        {isGodMode && (
          <View style={[styles.editChip, { backgroundColor: '#FF6B3520' }]}>
            <Feather name="edit-3" size={12} color="#FF6B35" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { adminMode, setAdminMode, isGodMode, isUserView } = useAdmin();
  const queryClient = useQueryClient();
  const today = formatToday();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const { data: todayMatches, isLoading: matchesLoading, refetch: refetchMatches } = useQuery({
    queryKey: ['matches-today-admin', today],
    queryFn: () => getMatchesByDate(today, true),
  });

  const handleRefresh = () => {
    refetchStats();
    refetchMatches();
  };

  const handleModeChange = (mode: typeof adminMode) => {
    setAdminMode(adminMode === mode ? 'normal' : mode);
    if (mode === 'user_view') {
      router.replace('/(tabs)' as any);
    } else if (mode === 'god_mode') {
      router.replace('/(tabs)' as any);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.adminBadge, { backgroundColor: colors.accentDim }]}>
          <Feather name="shield" size={13} color={colors.accent} />
          <Text style={[styles.adminText, { color: colors.accent }]}>ADMIN</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
          onPress={handleRefresh}
        >
          <Feather name="refresh-cw" size={15} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Mode Selector */}
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MODES D'AFFICHAGE</Text>
      <ModeButton
        icon="account-eye-outline"
        label="Vue Utilisateur"
        subtitle="Simulez l'expérience de vos users"
        color={colors.blue}
        bg={colors.blue + '20'}
        active={isUserView}
        onPress={() => handleModeChange('user_view')}
        colors={colors}
      />
      <ModeButton
        icon="pencil-ruler"
        label="God Mode"
        subtitle="Éditez les prédictions en temps réel"
        color="#FF6B35"
        bg="rgba(255,107,53,0.15)"
        active={isGodMode}
        onPress={() => handleModeChange('god_mode')}
        colors={colors}
      />

      {/* Stats */}
      {statsLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 8 }]}>VUE D'ENSEMBLE</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="calendar"
              label="Aujourd'hui"
              value={stats?.todayMatches || 0}
              color={colors.accent}
              bg={colors.accentDim}
              colors={colors}
              subtitle="matchs"
            />
            <StatCard
              icon="star"
              label="VIP Matchs"
              value={stats?.vipMatches || 0}
              color={colors.gold}
              bg={colors.goldDim}
              colors={colors}
            />
            <StatCard
              icon="users"
              label="Utilisateurs"
              value={stats?.totalUsers || 0}
              color={colors.blue}
              bg={colors.blue + '20'}
              colors={colors}
            />
            <StatCard
              icon="award"
              label="VIP Users"
              value={stats?.vipUsers || 0}
              color="#FF6B35"
              bg="rgba(255,107,53,0.15)"
              colors={colors}
            />
          </View>
        </>
      )}

      {/* Navigation */}
      <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 8 }]}>GESTION</Text>
      <View style={[styles.actionsCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
        {[
          {
            icon: 'users',
            label: 'Gestion des utilisateurs',
            sub: 'Bannir, bloquer, avertir',
            color: colors.blue,
            onPress: () => router.push('/admin/users' as any),
          },
          {
            icon: 'plus-circle',
            label: 'Ajouter un match',
            sub: 'Créer un match manuellement',
            color: colors.accent,
            onPress: () => {},
          },
          {
            icon: 'bar-chart-2',
            label: 'Statistiques détaillées',
            sub: 'Performances et analytics',
            color: '#FF6B35',
            onPress: () => {},
          },
        ].map((action, idx, arr) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.actionRow, idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={action.onPress}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
              <Feather name={action.icon as any} size={18} color={action.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
              <Text style={[styles.actionSub, { color: colors.textMuted }]}>{action.sub}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's Matches */}
      <View style={styles.todayHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MATCHS DU JOUR</Text>
        <Text style={[styles.todayDate, { color: colors.textSecondary }]}>
          {formatDateLabel(today)}
        </Text>
      </View>

      {isGodMode && (
        <View style={[styles.godModeHint, { backgroundColor: 'rgba(255,107,53,0.12)', borderColor: '#FF6B35' }]}>
          <MaterialCommunityIcons name="pencil-ruler" size={14} color="#FF6B35" />
          <Text style={{ color: '#FF6B35', fontSize: 12, fontWeight: '600', flex: 1 }}>
            God Mode actif — appuyez sur un match pour éditer ses prédictions
          </Text>
        </View>
      )}

      {matchesLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
      ) : !todayMatches || todayMatches.length === 0 ? (
        <View style={[styles.emptyMatches, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <Text style={{ fontSize: 28 }}>📅</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun match aujourd'hui</Text>
        </View>
      ) : (
        <View style={styles.matchesList}>
          {todayMatches.map((match) => (
            <TodayMatchRow key={match.id} match={match} isGodMode={isGodMode} colors={colors} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 10 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  adminText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', flex: 1 },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    paddingHorizontal: 2,
  },

  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  modeBtnIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnLabel: { fontSize: 15, fontWeight: '600' },
  modeBtnSub: { fontSize: 12, marginTop: 2 },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 12 },
  statSub: { fontSize: 11, fontWeight: '600' },

  actionsCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 14, fontWeight: '600' },
  actionSub: { fontSize: 11, marginTop: 2 },

  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  todayDate: { fontSize: 11, fontStyle: 'italic' },

  godModeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },

  matchesList: { gap: 8 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  matchRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  matchTeams: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamLogo: { width: 20, height: 20 },
  teamLogoPlaceholder: { width: 20, height: 20, borderRadius: 4 },
  matchTeamName: { fontSize: 12, fontWeight: '600', flex: 1 },
  vsText: { fontSize: 10, fontWeight: '600' },
  matchRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  matchTime: { fontSize: 11 },
  vipChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  predChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editChip: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyMatches: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  emptyText: { fontSize: 14 },
});
