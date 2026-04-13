import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateSelector } from '@/components/DateSelector';
import { MatchCard } from '@/components/MatchCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getMatchesByDate, type Match } from '@/services/matchService';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

function formatToday() {
  return new Date().toISOString().split('T')[0];
}

function LockedScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.lockedContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.goldGlow, { backgroundColor: colors.goldDim }]} />
      <View style={[styles.lockIconCircle, { backgroundColor: colors.goldDim, borderColor: colors.gold }]}>
        <Feather name="lock" size={36} color={colors.gold} />
      </View>
      <View style={[styles.vipBadgeLarge, { backgroundColor: colors.goldDim, borderColor: colors.gold }]}>
        <Feather name="star" size={14} color={colors.gold} />
        <Text style={[styles.vipBadgeText, { color: colors.gold }]}>VIP</Text>
      </View>
      <Text style={[styles.lockedTitle, { color: colors.text }]}>{t('vipLocked')}</Text>
      <Text style={[styles.lockedDesc, { color: colors.textSecondary }]}>{t('vipLockedDesc')}</Text>
      <TouchableOpacity
        style={[styles.vipBtn, { backgroundColor: colors.gold }]}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        activeOpacity={0.85}
      >
        <Feather name="star" size={16} color="#000" />
        <Text style={styles.vipBtnText}>{t('becomeVip')}</Text>
      </TouchableOpacity>

      <View style={styles.featuresRow}>
        {['Pronostics exclusifs', 'Codes bookmakers', 'Analyse premium'].map((f) => (
          <View key={f} style={[styles.featureChip, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Feather name="check" size={12} color={colors.gold} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function VIPScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { isGodMode } = useAdmin();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(formatToday());
  const [toast, setToast] = useState({ visible: false, msg: '' });
  const [refreshing, setRefreshing] = useState(false);

  const { data: matches, isLoading, refetch } = useQuery({
    queryKey: ['matches-vip', selectedDate],
    queryFn: () => getMatchesByDate(selectedDate, true),
    enabled: !!profile?.is_vip,
  });

  const showToast = useCallback((msg: string) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast({ visible: false, msg: '' }), 2200);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (!profile?.is_vip) {
    return <LockedScreen />;
  }

  const renderMatch = ({ item }: { item: Match }) => (
    <View style={{ position: 'relative' }}>
      <MatchCard match={item} onToast={showToast} />
      {isGodMode && (
        <TouchableOpacity
          style={vipGodStyles.editBtn}
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
          <Feather name="edit-3" size={12} color="#fff" />
          <Text style={vipGodStyles.editText}>Éditer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.vipBadge, { backgroundColor: colors.goldDim, borderColor: colors.gold }]}>
              <Feather name="star" size={12} color={colors.gold} />
              <Text style={[styles.vipText, { color: colors.gold }]}>VIP</Text>
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Section VIP</Text>
          </View>
        </View>
        <Text style={[styles.headerSub, { color: colors.textMuted }]}>
          Pronostics exclusifs Premium
        </Text>
      </View>

      <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <FlatList
        data={isLoading ? [] : (matches || [])}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        ListHeaderComponent={isLoading ? () => (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : null}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Feather name="star" size={32} color={colors.gold} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noMatches')}</Text>
            </View>
          ) : null
        }
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      />
      <Toast message={toast.msg} visible={toast.visible} />
    </View>
  );
}

const vipGodStyles = StyleSheet.create({
  editBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  editText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  vipText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  list: { paddingTop: 8 },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  // Locked
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  goldGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: '20%',
    opacity: 0.5,
  },
  lockIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  vipBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  vipBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  lockedDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  vipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  vipBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  featuresRow: {
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
