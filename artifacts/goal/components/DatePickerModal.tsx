import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

const SCREEN_H = Dimensions.get('window').height;
const ITEM_H = 44;
const VISIBLE = 5;
const PICKER_H = ITEM_H * VISIBLE;

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

type Props = {
  visible: boolean;
  initialDate: string; // YYYY-MM-DD
  onConfirm: (date: string) => void;
  onClose: () => void;
};

export function DatePickerModal({ visible, initialDate, onConfirm, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const lang = i18n.language === 'en' ? 'en' : 'fr';
  const monthNames = lang === 'en' ? MONTHS_EN : MONTHS_FR;

  const today = new Date();
  const parsed = new Date(initialDate || today.toISOString().split('T')[0]);

  const [selDay, setSelDay] = useState(parsed.getDate() - 1); // 0-indexed
  const [selMonth, setSelMonth] = useState(parsed.getMonth()); // 0-indexed
  const [selYear, setSelYear] = useState(parsed.getFullYear());

  const yearList = Array.from({ length: 80 }, (_, i) => 2010 + i);
  const maxDay = daysInMonth(selMonth, selYear);
  const dayList = Array.from({ length: maxDay }, (_, i) => i + 1);

  // Clamp day when month/year changes
  useEffect(() => {
    const max = daysInMonth(selMonth, selYear);
    if (selDay >= max) setSelDay(max - 1);
  }, [selMonth, selYear]);

  const handleConfirm = () => {
    const d = selDay + 1;
    const m = selMonth + 1;
    const y = selYear;
    const str = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onConfirm(str);
  };

  const bg = isDark ? '#0E0E1C' : '#FFFFFF';
  const overlay = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: overlay }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: bg, paddingBottom: insets.bottom + 16, borderColor: colors.border }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            {lang === 'fr' ? 'Choisir une date' : 'Pick a date'}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Feather name="x" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Pickers row */}
        <View style={styles.pickersRow}>
          {/* Day */}
          <PickerColumn
            data={dayList.map(String)}
            selectedIndex={selDay}
            onSelect={setSelDay}
            colors={colors}
            isDark={isDark}
            flex={1}
          />
          {/* Month */}
          <PickerColumn
            data={monthNames}
            selectedIndex={selMonth}
            onSelect={setSelMonth}
            colors={colors}
            isDark={isDark}
            flex={2}
          />
          {/* Year */}
          <PickerColumn
            data={yearList.map(String)}
            selectedIndex={yearList.indexOf(selYear)}
            onSelect={(i) => setSelYear(yearList[i])}
            colors={colors}
            isDark={isDark}
            flex={1.4}
          />
        </View>

        {/* Selection highlight */}
        <View
          pointerEvents="none"
          style={[styles.selHighlight, { borderColor: colors.accent, top: (PICKER_H - ITEM_H) / 2 + 60 }]}
        />

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.accent }]}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmText}>
            {lang === 'fr' ? 'Confirmer' : 'Confirm'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

type PickerColumnProps = {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  colors: any;
  isDark: boolean;
  flex?: number;
};

function PickerColumn({ data, selectedIndex, onSelect, colors, isDark, flex = 1 }: PickerColumnProps) {
  const listRef = useRef<FlatList>(null);
  const padded = ['', '', ...data, '', ''];

  useEffect(() => {
    listRef.current?.scrollToIndex({
      index: selectedIndex + 2,
      animated: false,
      viewOffset: 0,
    });
  }, [selectedIndex]);

  const handleScrollEnd = useCallback(
    (e: any) => {
      const offset = e.nativeEvent.contentOffset.y;
      const idx = Math.round(offset / ITEM_H);
      const realIdx = Math.max(0, Math.min(data.length - 1, idx));
      onSelect(realIdx);
      listRef.current?.scrollToIndex({ index: realIdx + 2, animated: true });
    },
    [data.length, onSelect]
  );

  return (
    <FlatList
      ref={listRef}
      data={padded}
      keyExtractor={(_, i) => String(i)}
      style={{ flex }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      onMomentumScrollEnd={handleScrollEnd}
      getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
      renderItem={({ item, index }) => {
        const realIndex = index - 2;
        const isSelected = realIndex === selectedIndex;
        const dist = Math.abs(realIndex - selectedIndex);
        const opacity = item === '' ? 0 : dist === 0 ? 1 : dist === 1 ? 0.55 : 0.25;
        return (
          <View style={[styles.pickerItem, { height: ITEM_H }]}>
            <Text
              style={[
                styles.pickerText,
                {
                  color: isSelected ? colors.accent : colors.text,
                  opacity,
                  fontWeight: isSelected ? '700' : '400',
                  fontSize: isSelected ? 17 : 15,
                },
              ]}
              numberOfLines={1}
            >
              {item}
            </Text>
          </View>
        );
      }}
      style={{ height: PICKER_H }}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 4,
    overflow: 'hidden',
  },
  pickerItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: {
    textAlign: 'center',
  },
  selHighlight: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: ITEM_H,
    borderWidth: 1.5,
    borderRadius: 12,
    pointerEvents: 'none',
  },
  confirmBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
