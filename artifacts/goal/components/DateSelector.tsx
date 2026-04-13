import { Feather } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { DatePickerModal } from '@/components/DatePickerModal';
import { useTheme } from '@/contexts/ThemeContext';

const SCREEN_W = Dimensions.get('window').width;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function addMonths(d: Date, n: number): Date {
  const r = new Date(d); r.setMonth(r.getMonth() + n); if (r.getDate() !== 1) r.setDate(1); return r;
}
function addYears(d: Date, n: number): Date {
  const r = new Date(d); r.setFullYear(r.getFullYear() + n); r.setMonth(0); r.setDate(1); return r;
}
function fmt(d: Date): string { return d.toISOString().split('T')[0]; }

// ─── Locale data ─────────────────────────────────────────────────────────────

const DAY_LETTERS: Record<string, string[]> = {
  fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};
const MONTH_LETTERS: Record<string, string[]> = {
  fr: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  en: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
};
const MONTH_NAMES: Record<string, string[]> = {
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

type CollapseLevel = 0 | 1 | 2 | 3;
type Props = { selectedDate: string; onSelectDate: (date: string) => void };

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DateSelector({ selectedDate, onSelectDate }: Props) {
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'fr';
  const [pickerVisible, setPickerVisible] = useState(false);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayStr = fmt(today);

  const [weekStart, setWeekStart] = useState(() => getMonday(today));
  const [collapseLevel, setCollapseLevel] = useState<CollapseLevel>(0);

  const dayLetters = DAY_LETTERS[lang];
  const monthLetters = MONTH_LETTERS[lang];
  const monthNames = MONTH_NAMES[lang];

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const navigate = useCallback((dir: -1 | 1) => {
    if (collapseLevel <= 1) setWeekStart(p => addDays(p, dir * 7));
    else if (collapseLevel === 2) setWeekStart(p => getMonday(addMonths(p, dir)));
    else setWeekStart(p => getMonday(addYears(p, dir)));
  }, [collapseLevel]);

  const goToToday = useCallback(() => {
    setWeekStart(getMonday(today));
    setCollapseLevel(0);
    onSelectDate(todayStr);
  }, [today, todayStr, onSelectDate]);

  const toggleCollapse = useCallback(() => setCollapseLevel(p => ((p + 1) % 4) as CollapseLevel), []);

  const handlePickerConfirm = (date: string) => {
    const d = new Date(date);
    setWeekStart(getMonday(d));
    setCollapseLevel(0);
    onSelectDate(date);
    setPickerVisible(false);
  };

  const midDay = addDays(weekStart, 3);
  const headerLabel = `${monthNames[midDay.getMonth()]} ${midDay.getFullYear()}`;
  const weekEnd = addDays(weekStart, 6);

  const weekSummary = useMemo(() => {
    const s = weekStart.getDate(), e = weekEnd.getDate();
    const sm = monthNames[weekStart.getMonth()], em = monthNames[weekEnd.getMonth()];
    return weekStart.getMonth() === weekEnd.getMonth()
      ? `${s}~${e} ${sm}` : `${s} ${sm.slice(0, 3)} ~ ${e} ${em.slice(0, 3)}`;
  }, [weekStart, weekEnd, monthNames]);

  const summaryLabel = useMemo(() => {
    if (collapseLevel === 1) return weekSummary;
    if (collapseLevel === 2) return monthNames[midDay.getMonth()];
    if (collapseLevel === 3) return String(midDay.getFullYear());
    return weekSummary;
  }, [collapseLevel, weekSummary, monthNames, midDay]);

  const isTodayVisible = weekDays.some(d => fmt(d) === todayStr);

  return (
    <>
      <View style={styles.wrapper}>
        <View style={[
          styles.box,
          {
            backgroundColor: isDark ? 'rgba(14,16,28,0.97)' : 'rgba(255,255,255,0.97)',
            borderColor: isDark ? 'rgba(0,208,132,0.20)' : 'rgba(0,208,132,0.25)',
            shadowColor: '#00D084',
          },
        ]}>
          {/* Top gloss */}
          <View style={[styles.innerHighlight, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
          }]} />

          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerLabel, { color: colors.textMuted }]}>
              {collapseLevel === 0 ? headerLabel : summaryLabel}
            </Text>

            <View style={styles.headerActions}>
              {/* Today button */}
              {!isTodayVisible && (
                <Pressable
                  onPress={goToToday}
                  hitSlop={10}
                  style={[styles.actionBtn, { backgroundColor: colors.accentDim }]}
                >
                  <Feather name="home" size={10} color={colors.accent} />
                </Pressable>
              )}

              {/* Date picker button */}
              <Pressable
                onPress={() => setPickerVisible(true)}
                hitSlop={10}
                style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}
              >
                <Feather name="calendar" size={10} color={colors.textMuted} />
              </Pressable>

              {/* Collapse toggle */}
              <Pressable
                onPress={toggleCollapse}
                hitSlop={10}
                style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}
              >
                <Feather name={collapseLevel === 0 ? 'minimize-2' : 'maximize-2'} size={10} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* Day letters row */}
          {collapseLevel === 0 && (
            <View style={styles.dayLettersRow}>
              <View style={styles.navPlaceholder} />
              {dayLetters.map((letter, i) => {
                const day = weekDays[i];
                const isToday = fmt(day) === todayStr;
                return (
                  <View key={i} style={[styles.dayLetterCell, { width: CELL_W }]}>
                    <Text style={[styles.dayLetter, { color: isToday ? colors.accent : colors.textMuted }]}>
                      {letter}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.navPlaceholder} />
            </View>
          )}

          {/* Main row: arrows + content */}
          <View style={styles.mainRow}>
            <Pressable onPress={() => navigate(-1)} hitSlop={10} style={styles.navBtn}>
              <Feather name="chevron-left" size={15} color={colors.textMuted} />
            </Pressable>

            {collapseLevel === 0 ? (
              <View style={styles.daysRow}>
                {weekDays.map((day, idx) => {
                  const dateStr = fmt(day);
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === todayStr;
                  return (
                    <DayCell
                      key={dateStr}
                      dayNum={day.getDate()}
                      monthLetter={monthLetters[day.getMonth()]}
                      isSelected={isSelected}
                      isToday={isToday}
                      onPress={() => onSelectDate(dateStr)}
                      colors={colors}
                    />
                  );
                })}
              </View>
            ) : (
              <Pressable
                style={[styles.summaryPill, { borderColor: colors.accent, backgroundColor: colors.accentDim }]}
                onPress={() => { onSelectDate(fmt(weekDays[0])); setCollapseLevel(0); }}
              >
                <Text style={[styles.summaryText, { color: colors.accent }]}>{summaryLabel}</Text>
              </Pressable>
            )}

            <Pressable onPress={() => navigate(1)} hitSlop={10} style={styles.navBtn}>
              <Feather name="chevron-right" size={15} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Today dot indicator */}
          {isTodayVisible && (
            <View style={styles.todayRow}>
              <Pressable onPress={goToToday} style={[styles.todayPill, { backgroundColor: colors.accentDim }]}>
                <View style={[styles.todayDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.todayPillText, { color: colors.accent }]}>
                  {lang === 'fr' ? "Aujourd'hui" : 'Today'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <DatePickerModal
        visible={pickerVisible}
        initialDate={selectedDate}
        onConfirm={handlePickerConfirm}
        onClose={() => setPickerVisible(false)}
      />
    </>
  );
}

// ─── DayCell ─────────────────────────────────────────────────────────────────

type DayCellProps = {
  dayNum: number;
  monthLetter: string;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
  colors: any;
};

function DayCell({ dayNum, monthLetter, isSelected, isToday, onPress, colors }: DayCellProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.8, duration: 65, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 260, friction: 8 }),
    ]).start();
    onPress();
  };

  const bg = isSelected ? colors.accent : isToday ? colors.accentDim : 'transparent';
  const numColor = isSelected ? '#000' : isToday ? colors.accent : colors.text;
  const mColor = isSelected ? 'rgba(0,0,0,0.6)' : isToday ? colors.accent : colors.textMuted;

  // Today cell is wider + taller
  const cellW = isToday ? CELL_W + 4 : CELL_W;
  const cellH = isToday ? 38 : 32;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.dayCell,
          {
            width: cellW,
            height: cellH,
            backgroundColor: bg,
            borderRadius: isToday ? 11 : 9,
          },
          isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.accent },
          isSelected && { shadowColor: colors.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
        ]}
      >
        <Text style={[styles.dayCellNum, { color: numColor, fontSize: isToday ? 14 : 13 }]}>
          {dayNum}
        </Text>
        <Text style={[styles.dayCellMonth, { color: mColor }]}>{monthLetter}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const NAV_W = 26;
const CELL_W = Math.floor((SCREEN_W - 32 - NAV_W * 2 - 12) / 7);

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 12, paddingVertical: 10 },
  box: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  innerHighlight: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, marginBottom: 6,
  },
  headerLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionBtn: { padding: 5, borderRadius: 7 },
  dayLettersRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  navPlaceholder: { width: NAV_W },
  dayLetterCell: { alignItems: 'center' },
  dayLetter: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  mainRow: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { width: NAV_W, alignItems: 'center', justifyContent: 'center', height: 38 },
  daysRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', justifyContent: 'center', gap: 1 },
  dayCellNum: { fontWeight: '700', lineHeight: 15 },
  dayCellMonth: { fontSize: 8, fontWeight: '600' },
  summaryPill: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, borderWidth: 1, paddingVertical: 8, marginHorizontal: 4,
  },
  summaryText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  todayRow: { alignItems: 'center', marginTop: 6, marginBottom: 2 },
  todayPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  todayDot: { width: 6, height: 6, borderRadius: 3 },
  todayPillText: { fontSize: 11, fontWeight: '600' },
});
