import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter, usePathname } from 'expo-router';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarProvider, useTabBar } from '@/contexts/TabBarContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useTheme } from '@/contexts/ThemeContext';

type TabDef = {
  name: string;
  path: string;
  icon: string;
  label: string;
};

function FloatingTabBar() {
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const { tabBarAnim } = useTabBar();

  const tabs: TabDef[] = [
    { name: 'index', path: '/', icon: 'home-variant', label: t('home') },
    { name: 'vip', path: '/vip', icon: 'crown', label: 'VIP' },
    ...(profile?.is_admin
      ? [{ name: 'dashboard', path: '/dashboard', icon: 'chart-bar', label: t('dashboard') }]
      : []),
    { name: 'me', path: '/me', icon: 'account-circle', label: t('me') },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index' || pathname === '';
    }
    const seg = path.replace('/', '');
    return pathname.endsWith(seg) || pathname.includes(`/${seg}`);
  };

  const bg = isIOS
    ? 'transparent'
    : isDark
    ? 'rgba(14,14,22,0.97)'
    : 'rgba(253,253,255,0.97)';

  const translateY = tabBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

  return (
    <Animated.View
      style={[
        styles.floatingWrapper,
        { bottom: Math.max(insets.bottom, 10) + 6, transform: [{ translateY }] },
        { pointerEvents: 'box-none' } as any,
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: bg,
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        {isIOS && (
          <BlurView
            intensity={85}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <TabItem
              key={tab.name}
              icon={tab.icon}
              label={tab.label}
              active={active}
              colors={colors}
              onPress={() => {
                if (tab.path === '/') {
                  router.replace('/(tabs)' as any);
                } else {
                  router.replace(tab.path as any);
                }
              }}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

type TabItemProps = {
  icon: string;
  label: string;
  active: boolean;
  colors: any;
  onPress: () => void;
};

function TabItem({ icon, label, active, colors, onPress }: TabItemProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.80, duration: 65, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 280, friction: 7 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.tabItemOuter}>
      <Animated.View
        style={[
          styles.tabItemInner,
          active && { backgroundColor: colors.accentDim },
          { transform: [{ scale }] },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={active ? colors.accent : colors.textMuted}
        />
        {active && (
          <Text style={[styles.tabLabel, { color: colors.accent }]} numberOfLines={1}>
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

function AdminModeBanner() {
  const { colors } = useTheme();
  const { adminMode, setAdminMode, isGodMode, isUserView } = useAdmin();
  const router = useRouter();

  if (!isGodMode && !isUserView) return null;

  const isGod = adminMode === 'god_mode';
  const label = isGod ? '⚡ GOD MODE — Appuyez sur un match pour éditer' : '👁 VUE UTILISATEUR';
  const bg = isGod ? 'rgba(255,107,53,0.95)' : 'rgba(30,100,255,0.92)';

  return (
    <View style={[adminBannerStyles.banner, { backgroundColor: bg }]}>
      <Text style={adminBannerStyles.label} numberOfLines={1}>{label}</Text>
      <Pressable
        onPress={() => {
          setAdminMode('normal');
          router.replace('/dashboard' as any);
        }}
        style={adminBannerStyles.exitBtn}
      >
        <Text style={adminBannerStyles.exitText}>Quitter</Text>
      </Pressable>
    </View>
  );
}

const adminBannerStyles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    zIndex: 1000,
  },
  label: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  exitBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  exitText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export default function TabLayout() {
  return (
    <TabBarProvider>
      <View style={styles.root}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="vip" />
          <Tabs.Screen name="dashboard" />
          <Tabs.Screen name="me" />
        </Tabs>
        <AdminModeBanner />
        <FloatingTabBar />
      </View>
    </TabBarProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  floatingWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 18,
    overflow: 'hidden',
  },
  tabItemOuter: { alignItems: 'center', justifyContent: 'center' },
  tabItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 40,
  },
  tabLabel: { fontSize: 13, fontWeight: '600' },
});
