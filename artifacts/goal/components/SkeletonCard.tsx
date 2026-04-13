import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

function Bone({ width, height, style }: { width?: number | string; height: number; style?: object }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        { width: width || '100%', height, borderRadius: 8, backgroundColor: colors.backgroundElevated, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Bone width={60} height={22} />
        <Bone width={32} height={32} />
      </View>
      <View style={styles.matchRow}>
        <View style={styles.teamBlock}>
          <Bone width={40} height={40} style={{ borderRadius: 20 }} />
          <Bone width={70} height={14} />
        </View>
        <Bone width={50} height={26} />
        <View style={styles.teamBlock}>
          <Bone width={40} height={40} style={{ borderRadius: 20 }} />
          <Bone width={70} height={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
});
