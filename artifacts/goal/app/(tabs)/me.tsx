import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

const APP_VERSION = '1.0.0 (build 1)';

type SectionProps = {
  title: string;
  children: React.ReactNode;
  colors: any;
  icon?: string;
  iconColor?: string;
};

function Section({ title, children, colors, icon, iconColor }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon && (
          <View style={[styles.sectionIconWrap, { backgroundColor: (iconColor || colors.accent) + '20' }]}>
            <Feather name={icon as any} size={13} color={iconColor || colors.accent} />
          </View>
        )}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      </View>
      <View style={[styles.sectionCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

type RowProps = {
  icon: string;
  label: string;
  sublabel?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  colors: any;
  iconColor?: string;
  iconBg?: string;
  last?: boolean;
  destructive?: boolean;
};

function Row({ icon, label, sublabel, value, onPress, right, colors, iconColor, iconBg, last, destructive }: RowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg || (iconColor || colors.accent) + '20' }]}>
        <Feather name={icon as any} size={16} color={iconColor || colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: destructive ? colors.live : colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSublabel, { color: colors.textMuted }]}>{sublabel}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text> : null}
        {right}
        {onPress && !right ? <Feather name="chevron-right" size={15} color={colors.textMuted} /> : null}
      </View>
    </TouchableOpacity>
  );
}

type ThemeOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
};

function ThemeOption({ label, selected, onPress, colors }: ThemeOptionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.themeOpt,
        {
          backgroundColor: selected ? colors.accent : colors.backgroundElevated,
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}
      activeOpacity={0.8}
    >
      <Text style={{ color: selected ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: selected ? '700' : '400' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function MeScreen() {
  const { t } = useTranslation();
  const { colors, mode, setMode } = useTheme();
  const { profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const [notifAll, setNotifAll] = useState(true);
  const [notifVisits, setNotifVisits] = useState(true);
  const [notifViews, setNotifViews] = useState(true);
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifPriceDrops, setNotifPriceDrops] = useState(false);
  const [notifNewAds, setNotifNewAds] = useState(false);
  const [notifPromo, setNotifPromo] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [showPrices, setShowPrices] = useState(true);
  const [textSize, setTextSize] = useState<'small' | 'normal' | 'large'>('normal');

  const langLabel = i18n.language === 'fr' ? '🇫🇷 Français' : '🇬🇧 English';

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Utilisateur';

  const handleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    AsyncStorage.setItem('language', lang);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLogout = () => {
    Alert.alert(t('logout'), 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile Header ── */}
      <View style={[styles.profileCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.accentDim }]}>
          <Feather name="user" size={32} color={colors.accent} />
          {profile?.is_vip && (
            <View style={[styles.vipBadge, { backgroundColor: colors.gold }]}>
              <Feather name="star" size={8} color="#000" />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profile?.email}</Text>
          <View style={styles.badgeRow}>
            {profile?.is_vip && (
              <View style={[styles.badge, { backgroundColor: colors.goldDim, borderColor: colors.gold }]}>
                <Feather name="star" size={9} color={colors.gold} />
                <Text style={[styles.badgeText, { color: colors.gold }]}>VIP</Text>
              </View>
            )}
            {profile?.is_admin && (
              <View style={[styles.badge, { backgroundColor: colors.accentDim, borderColor: colors.accent + '40' }]}>
                <Feather name="shield" size={9} color={colors.accent} />
                <Text style={[styles.badgeText, { color: colors.accent }]}>{t('admin')}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
          <Feather name="edit-2" size={14} color={colors.textSecondary} />
          <Text style={[styles.editText, { color: colors.textSecondary }]}>Modifier</Text>
        </TouchableOpacity>
      </View>

      {/* ── Login / Register ── */}
      {!profile && (
        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: colors.accent }]}
          activeOpacity={0.85}
        >
          <Feather name="log-in" size={16} color="#fff" />
          <Text style={styles.loginBtnText}>Se connecter / S'inscrire</Text>
        </TouchableOpacity>
      )}

      {/* ── Appearance ── */}
      <Section title="APPARENCE" colors={colors} icon="monitor" iconColor={colors.blue}>
        {/* Theme */}
        <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
          <View style={[styles.rowIcon, { backgroundColor: colors.blue + '20' }]}>
            <Feather name="sun" size={16} color={colors.blue} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.text, flex: 1 }]}>Thème</Text>
        </View>
        <View style={[styles.themeRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
          <ThemeOption label="Claire" selected={mode === 'light'} onPress={() => { setMode('light'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} colors={colors} />
          <ThemeOption label="Sombre" selected={mode === 'dark'} onPress={() => { setMode('dark'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} colors={colors} />
          <ThemeOption label="Système" selected={mode === 'auto'} onPress={() => { setMode('auto'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} colors={colors} />
        </View>
        {/* Text size */}
        <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
          <View style={[styles.rowIcon, { backgroundColor: colors.accent + '20' }]}>
            <Feather name="type" size={16} color={colors.accent} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.text, flex: 1 }]}>Taille du texte</Text>
        </View>
        <View style={[styles.themeRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
          <ThemeOption label="Petite" selected={textSize === 'small'} onPress={() => setTextSize('small')} colors={colors} />
          <ThemeOption label="Normale" selected={textSize === 'normal'} onPress={() => setTextSize('normal')} colors={colors} />
          <ThemeOption label="Grande" selected={textSize === 'large'} onPress={() => setTextSize('large')} colors={colors} />
        </View>
        <Row
          icon="layout"
          label="Mode compact"
          sublabel="Afficher plus de biens à la fois"
          colors={colors}
          iconColor="#8E44AD"
          right={
            <Switch
              value={compactMode}
              onValueChange={(v) => { setCompactMode(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              trackColor={{ false: colors.backgroundElevated, true: colors.accentDim }}
              thumbColor={compactMode ? colors.accent : colors.textMuted}
            />
          }
        />
        <Row
          icon="tag"
          label="Afficher les prix"
          sublabel="Visible sur les cartes pronostics"
          colors={colors}
          iconColor="#E67E22"
          last
          right={
            <Switch
              value={showPrices}
              onValueChange={(v) => { setShowPrices(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              trackColor={{ false: colors.backgroundElevated, true: colors.accentDim }}
              thumbColor={showPrices ? colors.accent : colors.textMuted}
            />
          }
        />
      </Section>

      {/* ── Preferences ── */}
      <Section title="PRÉFÉRENCES" colors={colors} icon="sliders" iconColor="#27AE60">
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, i18n.language === 'fr' && { borderColor: colors.accent, backgroundColor: colors.accentDim }]}
            onPress={() => handleLanguage('fr')}
          >
            <Text style={{ fontSize: 18 }}>🇫🇷</Text>
            <Text style={[styles.langLabel, { color: i18n.language === 'fr' ? colors.accent : colors.textSecondary }]}>Français</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, i18n.language === 'en' && { borderColor: colors.accent, backgroundColor: colors.accentDim }]}
            onPress={() => handleLanguage('en')}
          >
            <Text style={{ fontSize: 18 }}>🇬🇧</Text>
            <Text style={[styles.langLabel, { color: i18n.language === 'en' ? colors.accent : colors.textSecondary }]}>English</Text>
          </TouchableOpacity>
        </View>
        <Row icon="bell" label="Toutes les notifications" sublabel="Activez ou désactivez toutes les alertes" colors={colors} right={<Switch value={notifAll} onValueChange={(v) => { setNotifAll(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} trackColor={{ false: colors.backgroundElevated, true: colors.accentDim }} thumbColor={notifAll ? colors.accent : colors.textMuted} />} />
        <Row icon="eye" label="Demandes de visite" sublabel="Quand quelqu'un veut visiter votre bien" colors={colors} right={<Switch value={notifVisits} onValueChange={(v) => { setNotifVisits(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} trackColor={{ false: colors.backgroundElevated, true: colors.accentDim }} thumbColor={notifVisits ? colors.accent : colors.textMuted} />} />
        <Row icon="bar-chart-2" label="Vues sur vos biens" sublabel="Suivez vos statistiques de visibilité" colors={colors} right={<Switch value={notifViews} onValueChange={(v) => { setNotifViews(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} trackColor={{ false: colors.backgroundElevated, true: colors.accentDim }} thumbColor={notifViews ? colors.accent : colors.textMuted} />} />
        <Row icon="heart" label="Likes sur vos biens" sublabel="Quand quelqu'un met un cœur sur un bien" colors={colors} right={<Switch value={notifLikes} onValueChange={(v) => { setNotifLikes(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} trackColor={{ false: colors.backgroundElevated, true: colors.accentDim }} thumbColor={notifLikes ? colors.accent : colors.textMuted} />} />
        <Row icon="message-circle" label="Nouveaux messages" sublabel="Conversations avec des intéressés" colors={colors} right={<Switch value={notifMessages} onValueChange={(v) => { setNotifMessages(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} trackColor={{ false: colors.backgroundElevated, true: colors.accentDim }} thumbColor={notifMessages ? colors.accent : colors.textMuted} />} />
        <Row icon="trending-down" label="Baisses de prix" sublabel="Vos biens sauvegardés" colors={colors} right={<Switch value={notifPriceDrops} onValueChange={(v) => { setNotifPriceDrops(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} trackColor={{ false: colors.backgroundElevated, true: colors.accentDim }} thumbColor={notifPriceDrops ? colors.accent : colors.textMuted} />} />
        <Row icon="plus-circle" label="Nouvelles annonces" sublabel="Vos alertes sauvegardées" colors={colors} right={<Switch value={notifNewAds} onValueChange={(v) => { setNotifNewAds(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} trackColor={{ false: colors.backgroundElevated, true: colors.accentDim }} thumbColor={notifNewAds ? colors.accent : colors.textMuted} />} />
        <Row
          icon="gift"
          label="Promotions & Actualités"
          colors={colors}
          last
          right={
            <Switch
              value={notifPromo}
              onValueChange={(v) => { setNotifPromo(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              trackColor={{ false: colors.backgroundElevated, true: colors.accentDim }}
              thumbColor={notifPromo ? colors.accent : colors.textMuted}
            />
          }
        />
      </Section>

      {/* ── Support ── */}
      <Section title="SUPPORT" colors={colors} icon="life-buoy" iconColor="#2ECC71">
        <Row icon="help-circle" label="Centre d'aide" colors={colors} iconColor="#3498DB" onPress={() => {}} />
        <Row icon="list" label="Questions fréquentes" colors={colors} iconColor="#9B59B6" onPress={() => {}} />
        <Row icon="flag" label="Signaler un problème" colors={colors} iconColor="#E74C3C" onPress={() => {}} />
        <Row icon="message-square" label="Support WhatsApp" colors={colors} iconColor="#25D366" iconBg="rgba(37,211,102,0.15)" onPress={() => {}} />
        <Row icon="star" label="Évaluer l'app" colors={colors} iconColor="#F1C40F" last onPress={() => {}} />
      </Section>

      {/* ── À propos ── */}
      <Section title="À PROPOS" colors={colors} icon="info" iconColor={colors.textMuted}>
        <Row icon="shield" label="Politique de confidentialité" colors={colors} iconColor="#95A5A6" onPress={() => {}} />
        <Row icon="file-text" label="Conditions d'utilisation" colors={colors} iconColor="#95A5A6" onPress={() => {}} />
        <Row icon="code" label="Licences open-source" colors={colors} iconColor="#95A5A6" onPress={() => {}} />
        <Row icon="instagram" label="Nous suivre" colors={colors} iconColor="#E1306C" iconBg="rgba(225,48,108,0.12)" onPress={() => {}} />
        <Row
          icon="info"
          label="Version de l'application"
          value={APP_VERSION}
          colors={colors}
          iconColor={colors.textMuted}
          last
        />
      </Section>

      {/* ── Logout ── */}
      {profile && (
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.liveDim, borderColor: colors.live }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={colors.live} />
          <Text style={[styles.logoutText, { color: colors.live }]}>{t('logout')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 12 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 17, fontWeight: '700' },
  profileEmail: { fontSize: 12, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editText: { fontSize: 12, fontWeight: '500' },

  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  section: { gap: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 2 },
  sectionIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8 },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 14, fontWeight: '500' },
  rowSublabel: { fontSize: 11, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 13 },

  themeRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  themeOpt: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },

  langRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  langLabel: { fontSize: 13, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
});
