import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getMatchPredictions,
  savePrediction,
  deletePrediction,
  updateMatchVipStatus,
  PREDICTION_CATEGORIES,
  type PredictionOption,
} from '@/services/adminService';
import { supabase } from '@/utils/supabase';

type SaveStatus = 'idle' | 'saving' | 'valid' | 'invalid';

type PredRow = {
  category: string;
  code: string;
  tip: string;
  tipLabel: string;
  existingId?: string;
  isVip: boolean;
  status: SaveStatus;
};

function buildRows(existing: PredictionOption[]): Record<string, PredRow> {
  const map: Record<string, PredRow> = {};
  for (const p of existing) {
    map[`${p.code}::${p.tip}`] = {
      category: p.code,
      code: p.code,
      tip: p.tip,
      tipLabel: p.tip,
      existingId: p.id,
      isVip: p.is_vip,
      status: 'valid',
    };
  }
  return map;
}

export default function MatchPredictionsScreen() {
  const { matchId, matchLabel } = useLocalSearchParams<{ matchId: string; matchLabel: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [selections, setSelections] = useState<Record<string, PredRow>>({});
  const [isVipMatch, setIsVipMatch] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const { data: existingPreds, isLoading } = useQuery({
    queryKey: ['match-predictions', matchId],
    queryFn: () => getMatchPredictions(matchId!),
    enabled: !!matchId,
  });

  useEffect(() => {
    if (existingPreds) {
      setSelections(buildRows(existingPreds));
    }
  }, [existingPreds]);

  const { data: matchData } = useQuery({
    queryKey: ['match-detail', matchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches')
        .select('is_vip, team_home:team_home_id(name), team_away:team_away_id(name)')
        .eq('id', matchId!)
        .single();
      return data;
    },
    enabled: !!matchId,
  });

  useEffect(() => {
    if (matchData) setIsVipMatch(matchData.is_vip);
  }, [matchData]);

  const vipMutation = useMutation({
    mutationFn: (isVip: boolean) => updateMatchVipStatus(matchId!, isVip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches-today-admin'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const toggleSelection = (catCode: string, tip: string, tipLabel: string) => {
    const key = `${catCode}::${tip}`;
    setSelections((prev) => {
      const existing = prev[key];
      if (existing) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: {
          category: catCode,
          code: catCode,
          tip,
          tipLabel,
          isVip: isVipMatch,
          status: 'idle',
        },
      };
    });
  };

  const saveAll = async () => {
    setSavingAll(true);
    const toSave = Object.values(selections);

    for (const row of toSave) {
      if (row.status === 'valid') continue;
      const key = `${row.code}::${row.tip}`;
      setSelections((prev) => ({ ...prev, [key]: { ...prev[key], status: 'saving' } }));

      const result = await savePrediction({
        match_id: matchId!,
        code: row.code,
        bookmaker: 'GOAL',
        tip: row.tip,
        is_vip: row.isVip,
        id: row.existingId,
      });

      setSelections((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          status: result.valid ? 'valid' : 'invalid',
          existingId: result.id ?? prev[key].existingId,
        },
      }));
    }

    queryClient.invalidateQueries({ queryKey: ['match-predictions', matchId] });
    queryClient.invalidateQueries({ queryKey: ['matches-today-admin'] });
    setSavingAll(false);
  };

  const handleDeletePred = async (key: string, row: PredRow) => {
    if (row.existingId) {
      await deletePrediction(row.existingId);
      queryClient.invalidateQueries({ queryKey: ['match-predictions', matchId] });
    }
    setSelections((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const selectionCount = Object.keys(selections).length;
  const pendingCount = Object.values(selections).filter((r) => r.status !== 'valid').length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {matchLabel || 'Prédictions'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {selectionCount} prédiction{selectionCount !== 1 ? 's' : ''} sélectionnée{selectionCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={saveAll}
          disabled={savingAll || pendingCount === 0}
          style={[
            styles.saveBtn,
            {
              backgroundColor: pendingCount > 0 ? colors.accent : colors.backgroundCard,
              borderColor: pendingCount > 0 ? colors.accent : colors.border,
            },
          ]}
        >
          {savingAll ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="save" size={15} color={pendingCount > 0 ? '#fff' : colors.textMuted} />
              <Text style={{ color: pendingCount > 0 ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '600' }}>
                Sauver
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* VIP toggle */}
        <View style={[styles.vipRow, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <View style={[styles.vipIcon, { backgroundColor: 'rgba(255,215,0,0.15)' }]}>
            <Feather name="star" size={16} color="#FFD700" />
          </View>
          <Text style={[styles.vipLabel, { color: colors.text }]}>Match VIP</Text>
          <Switch
            value={isVipMatch}
            onValueChange={(v) => {
              setIsVipMatch(v);
              vipMutation.mutate(v);
            }}
            trackColor={{ false: colors.backgroundElevated, true: 'rgba(255,215,0,0.4)' }}
            thumbColor={isVipMatch ? '#FFD700' : colors.textMuted}
          />
        </View>

        {/* Selected predictions summary */}
        {selectionCount > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.textMuted }]}>PRÉDICTIONS ACTIVES</Text>
            {Object.entries(selections).map(([key, row]) => {
              const statusColor =
                row.status === 'valid'
                  ? '#34C759'
                  : row.status === 'invalid'
                  ? colors.live
                  : row.status === 'saving'
                  ? colors.gold
                  : colors.textMuted;
              return (
                <View key={key} style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.summaryDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.summaryCode, { color: colors.textSecondary }]}>{row.code}</Text>
                  <Text style={[styles.summaryTip, { color: colors.text }]}>{row.tip}</Text>
                  {row.isVip && (
                    <Text style={{ fontSize: 10, color: '#FFD700', fontWeight: '700' }}>VIP</Text>
                  )}
                  <TouchableOpacity onPress={() => handleDeletePred(key, row)} hitSlop={8}>
                    <Feather name="x" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Categories */}
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }} />
        ) : (
          PREDICTION_CATEGORIES.map((cat) => (
            <View key={cat.code} style={[styles.catCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <Text style={[styles.catTitle, { color: colors.textMuted }]}>{cat.label.toUpperCase()}</Text>
              <View style={styles.optionsGrid}>
                {cat.options.map((opt) => {
                  const key = `${cat.code}::${opt.tip}`;
                  const sel = selections[key];
                  const isSelected = !!sel;
                  const status = sel?.status ?? 'idle';

                  const borderColor =
                    status === 'valid'
                      ? '#34C759'
                      : status === 'invalid'
                      ? colors.live
                      : isSelected
                      ? colors.accent
                      : colors.border;
                  const bg =
                    status === 'valid'
                      ? 'rgba(52,199,89,0.12)'
                      : status === 'invalid'
                      ? colors.liveDim
                      : isSelected
                      ? colors.accentDim
                      : colors.backgroundElevated;

                  return (
                    <TouchableOpacity
                      key={opt.tip}
                      style={[styles.optBtn, { backgroundColor: bg, borderColor }]}
                      onPress={() => toggleSelection(cat.code, opt.tip, opt.label)}
                      activeOpacity={0.75}
                    >
                      {status === 'saving' ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : status === 'valid' ? (
                        <Feather name="check-circle" size={13} color="#34C759" />
                      ) : status === 'invalid' ? (
                        <Feather name="x-circle" size={13} color={colors.live} />
                      ) : isSelected ? (
                        <Feather name="check" size={13} color={colors.accent} />
                      ) : null}
                      <Text style={[styles.optLabel, { color: isSelected || status === 'valid' ? (status === 'valid' ? '#34C759' : colors.accent) : colors.textSecondary }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },

  scroll: { paddingHorizontal: 14, paddingTop: 14, gap: 14 },

  vipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  vipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipLabel: { flex: 1, fontSize: 15, fontWeight: '600' },

  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  summaryTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryCode: { fontSize: 11, fontWeight: '600' },
  summaryTip: { flex: 1, fontSize: 13, fontWeight: '600' },

  catCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  catTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  optLabel: { fontSize: 13, fontWeight: '500' },
});
