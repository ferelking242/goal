import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateSelector } from '@/components/DateSelector';
import { GoalLogo } from '@/components/GoalLogo';
import { MatchCard } from '@/components/MatchCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useTabBar } from '@/contexts/TabBarContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getMatchesByDate, type Match } from '@/services/matchService';

function formatToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

// Group matches into sections by league
type LeagueSection = {
  key: string;
  league_name: string;
  league_logo_url: string | null;
  data: Match[];
};

function groupByLeague(matches: Match[]): LeagueSection[] {
  const map = new Map<string, LeagueSection>();
  for (const m of matches) {
    const key = m.league_name ?? 'Autre';
    if (!map.has(key)) {
      map.set(key, { key, league_name: key, league_logo_url: m.league_logo_url ?? null, data: [] });
    }
    map.get(key)!.data.push(m);
  }
  return Array.from(map.values());
}

// ─── League Section Header (collapsible) ──────────────────────────────────────

function LeagueHeader({
  section,
  collapsed,
  onToggle,
  colors,
}: {
  section: LeagueSection;
  collapsed: boolean;
  onToggle: () => void;
  colors: any;
}) {
  const rot = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  const toggle = () => {
    Animated.timing(rot, {
      toValue: collapsed ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    onToggle();
  };

  const arrowRot = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.75}
      style={[styles.leagueHeader, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}
    >
      <View style={styles.leagueHeaderLeft}>
        {section.league_logo_url ? (
          <Image source={{ uri: section.league_logo_url }} style={styles.leagueHeaderLogo} resizeMode="contain" />
        ) : (
          <View style={[styles.leagueHeaderLogoPlaceholder, { backgroundColor: colors.border }]} />
        )}
        <Text style={[styles.leagueHeaderName, { color: colors.text }]} numberOfLines={1}>
          {section.league_name}
        </Text>
        <View style={[styles.leagueCount, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.leagueCountText, { color: colors.textMuted }]}>
            {section.data.length}
          </Text>
        </View>
      </View>
      <Animated.View style={{ transform: [{ rotate: arrowRot }] }}>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { isGodMode } = useAdmin();
  const insets = useSafeAreaInsets();
  const { onScrollEvent } = useTabBar();

  const [selectedDate, setSelectedDate] = useState(formatToday());
  const [toast, setToast] = useState({ visible: false, msg: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const { data: matches, isLoading, refetch } = useQuery({
    queryKey: ['matches', selectedDate],
    queryFn: () => getMatchesByDate(selectedDate, false),
  });

  const sections = useMemo(() => groupByLeague(matches ?? []), [matches]);

  const showToast = useCallback((msg: string) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast({ visible: false, msg: '' }), 2200);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const toggleLeague = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          borderBottomColor: colors.border,
          backgroundColor: isDark ? 'rgba(10,10,18,0.98)' : 'rgba(250,250,255,0.98)',
        },
      ]}>
        <View style={styles.headerLeft}>
          <GoalLogo size={40} />
          <View>
            <Text style={[styles.logoTitle, { color: colors.text }]}>GOAL</Text>
            <Text style={[styles.logoSub, { color: colors.textMuted }]}>Pronostics</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Notification */}
          <Pressable
            hitSlop={10}
            style={[styles.iconBtn, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              borderColor: isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.09)',
            }]}
          >
            <MaterialCommunityIcons
              name="bell-badge-outline"
              size={20}
              color={isDark ? '#b0b4cc' : '#5a5f8a'}
            />
          </Pressable>

          {/* Account */}
          <Pressable
            hitSlop={10}
            style={[styles.iconBtn, {
              backgroundColor: profile?.is_vip ? 'rgba(255,215,0,0.12)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              borderColor: profile?.is_vip ? 'rgba(255,215,0,0.35)' : isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.09)',
            }]}
            onPress={() => router.push('/me' as any)}
          >
            {profile?.full_name || profile?.email ? (
              <View style={[styles.avatarCircle, { backgroundColor: profile?.is_vip ? 'rgba(255,215,0,0.25)' : colors.accentDim }]}>
                <Text style={[styles.avatarLetter, { color: profile?.is_vip ? colors.gold : colors.accent }]}>
                  {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={22}
                color={isDark ? '#b0b4cc' : '#5a5f8a'}
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* ── Date Selector ───────────────────────────────────── */}
      <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* ── Match list grouped by league ────────────────────── */}
      {isLoading ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </ScrollView>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 36 }}>📅</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noMatches')}</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>Aucun match disponible</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          onScroll={onScrollEvent}
          scrollEventThrottle={16}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <LeagueHeader
              section={section as LeagueSection}
              collapsed={!!collapsed[section.key]}
              onToggle={() => toggleLeague(section.key)}
              colors={colors}
            />
          )}
          renderItem={({ item, section }) =>
            collapsed[(section as LeagueSection).key] ? null : (
              <View>
                <MatchCard match={item} onToast={showToast} />
                {isGodMode && (
                  <Pressable
                    style={[godModeStyles.editOverlay]}
                    onPress={() =>
                      router.push({
                        pathname: '/admin/match-predictions/[matchId]',
                        params: {
                          matchId: item.id,
                          matchLabel: `${item.team_home?.name ?? ''} vs ${item.team_away?.name ?? ''}`,
                        },
                      } as any)
                    }
                  >
                    <View style={godModeStyles.editBtn}>
                      <MaterialCommunityIcons name="pencil" size={14} color="#fff" />
                      <Text style={godModeStyles.editBtnText}>Éditer</Text>
                    </View>
                  </Pressable>
                )}
              </View>
            )
          }
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
      )}

      <Toast message={toast.msg} visible={toast.visible} />
    </View>
  );
}

const godModeStyles = StyleSheet.create({
  editOverlay: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  editBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 4, lineHeight: 24 },
  logoSub: { fontSize: 9, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 14, fontWeight: '800' },

  // League section header
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leagueHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  leagueHeaderLogo: { width: 22, height: 22 },
  leagueHeaderLogoPlaceholder: { width: 22, height: 22, borderRadius: 4 },
  leagueHeaderName: { fontSize: 13, fontWeight: '700', flex: 1 },
  leagueCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  leagueCountText: { fontSize: 11, fontWeight: '600' },

  list: { paddingTop: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center' },
});
