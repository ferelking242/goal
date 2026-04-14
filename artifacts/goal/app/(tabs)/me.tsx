import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: W } = Dimensions.get('window');
const COVER_H = 190;
const APP_VERSION = '1.0.0 (build 1)';

function CoverBackground({ isDark }: { isDark: boolean }) {
  return (
    <View style={{ width: W, height: COVER_H, overflow: 'hidden' }}>
      <Svg width={W} height={COVER_H}>
        <Defs>
          <LinearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0A1628" />
            <Stop offset="40%" stopColor="#112240" />
            <Stop offset="100%" stopColor="#0D2818" />
          </LinearGradient>
          <LinearGradient id="glowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00D084" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#00D084" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width={W} height={COVER_H} fill="url(#skyGrad)" />
        <Rect width={W} height={COVER_H} fill="url(#glowGrad)" />
        {/* City silhouette */}
        {[
          { x: 0, w: 22, h: 90 }, { x: 18, w: 18, h: 70 }, { x: 32, w: 30, h: 110 },
          { x: 58, w: 16, h: 75 }, { x: 70, w: 25, h: 95 }, { x: 90, w: 20, h: 60 },
          { x: 106, w: 35, h: 120 }, { x: 136, w: 18, h: 85 }, { x: 150, w: 28, h: 100 },
          { x: 173, w: 22, h: 65 }, { x: 190, w: 40, h: 130 }, { x: 225, w: 20, h: 80 },
          { x: 240, w: 30, h: 95 }, { x: 265, w: 18, h: 70 }, { x: 278, w: 45, h: 115 },
          { x: 318, w: 22, h: 75 }, { x: 335, w: 28, h: 90 }, { x: 358, w: 16, h: 60 },
          { x: 369, w: 35, h: 105 }, { x: 399, w: 20, h: 80 }, { x: 414, w: 30, h: 90 },
        ].map((b, i) => (
          <Rect key={i} x={b.x} y={COVER_H - b.h} width={b.w} height={b.h}
            fill="#1A2F4A" fillOpacity={0.85} />
        ))}
        {/* Window lights */}
        {[
          [35, 50], [40, 65], [112, 40], [120, 55], [160, 45], [196, 30],
          [210, 50], [285, 30], [295, 45], [382, 35], [390, 55],
        ].map(([x, y], i) => (
          <Rect key={`w${i}`} x={x} y={y} width={3} height={3}
            fill="#FFD700" fillOpacity={Math.random() > 0.5 ? 0.9 : 0.5} />
        ))}
        {/* Green city glow at bottom */}
        <Rect x={0} y={COVER_H - 60} width={W} height={60} fill="#00D084" fillOpacity={0.06} />
      </Svg>
    </View>
  );
}

type AccordionSectionProps = {
  title: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
  colors: any;
  defaultOpen?: boolean;
};

function AccordionSection({ title, icon, iconColor, children, colors, defaultOpen = false }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(rotateAnim, { toValue: next ? 1 : 0, duration: 220, useNativeDriver: true }),
      Animated.timing(heightAnim, { toValue: next ? 1 : 0, duration: 220, useNativeDriver: false }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.accordion, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
      <TouchableOpacity onPress={toggle} style={styles.accordionHeader} activeOpacity={0.75}>
        <View style={[styles.accordionIconWrap, { backgroundColor: iconColor + '22' }]}>
          <Ionicons name={icon as any} size={15} color={iconColor} />
        </View>
        <Text style={[styles.accordionTitle, { color: colors.text }]}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <View style={[styles.accordionBody, { borderTopColor: colors.border }]}>
          {children}
        </View>
      )}
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
        <Ionicons name={icon as any} size={15} color={iconColor || colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: destructive ? colors.live : colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSublabel, { color: colors.textMuted }]}>{sublabel}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text> : null}
        {right}
        {onPress && !right ? <Ionicons name="chevron-forward" size={14} color={colors.textMuted} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function SegmentControl({ options, selected, onSelect, colors }: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
  colors: any;
}) {
  return (
    <View style={[styles.segment, { backgroundColor: colors.backgroundElevated }]}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[
            styles.segmentOption,
            selected === opt.value && { backgroundColor: colors.accent },
          ]}
          onPress={() => { onSelect(opt.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.segmentLabel,
            { color: selected === opt.value ? '#000' : colors.textSecondary },
          ]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function MeScreen() {
  const { t } = useTranslation();
  const { colors, mode, isDark, setMode } = useTheme();
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
  const [textSize, setTextSize] = useState('normal');

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || t('myProfile');

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

  const sw = (val: boolean, set: (v: boolean) => void) => (
    <Switch
      value={val}
      onValueChange={(v) => { set(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      trackColor={{ false: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)', true: colors.accentDim }}
      thumbColor={val ? colors.accent : colors.textMuted}
      ios_backgroundColor={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}
    />
  );

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Cover + Avatar Header ── */}
      <View style={styles.coverWrap}>
        <CoverBackground isDark={isDark} />

        {/* Top right cover modifier button */}
        <TouchableOpacity style={[styles.coverModifyBtn, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          <Ionicons name="camera-outline" size={13} color="#fff" />
          <Text style={styles.coverModifyText}>Modifier</Text>
        </TouchableOpacity>

        {/* Status bar spacer */}
        <View style={{ height: insets.top, position: 'absolute', top: 0 }} />
      </View>

      {/* ── Profile section ── */}
      <View style={[styles.profileSection, { backgroundColor: colors.background }]}>
        {/* Avatar */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: colors.accentDim, borderColor: colors.background }]}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={30} color={colors.accent} />
              )}
              {profile?.is_vip && (
                <View style={[styles.vipBadge, { backgroundColor: '#F5A623' }]}>
                  <Ionicons name="star" size={8} color="#000" />
                </View>
              )}
            </View>
            <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: colors.accent, borderColor: colors.background }]}>
              <Ionicons name="camera" size={12} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Edit profile button */}
          <TouchableOpacity style={[styles.editProfileBtn, { backgroundColor: 'transparent', borderColor: colors.border }]}>
            <Ionicons name="pencil-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.editProfileText, { color: colors.textSecondary }]}>Modifier</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.profileName, { color: colors.text }]}>Mon profil</Text>
        {profile && (
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profile.email}</Text>
        )}

        {/* CTA button */}
        {!profile ? (
          <TouchableOpacity
            style={[styles.loginCta, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/auth/login' as any)}
            activeOpacity={0.87}
          >
            <Ionicons name="log-in-outline" size={18} color="#000" />
            <Text style={styles.loginCtaText}>Se connecter / S'inscrire</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.badgeRow}>
            {profile.is_vip && (
              <View style={[styles.badge, { backgroundColor: '#F5A62320', borderColor: '#F5A623' }]}>
                <Ionicons name="star" size={10} color="#F5A623" />
                <Text style={[styles.badgeText, { color: '#F5A623' }]}>VIP</Text>
              </View>
            )}
            {profile.is_admin && (
              <View style={[styles.badge, { backgroundColor: colors.accentDim, borderColor: colors.accent + '60' }]}>
                <Ionicons name="shield-checkmark-outline" size={10} color={colors.accent} />
                <Text style={[styles.badgeText, { color: colors.accent }]}>Admin</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Accordion Sections ── */}
      <View style={styles.sections}>

        {/* APPARENCE */}
        <AccordionSection title="APPARENCE" icon="sunny-outline" iconColor="#3B82F6" colors={colors}>
          {/* Theme */}
          <View style={[styles.innerRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="contrast-outline" size={15} color="#3B82F6" />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text, flex: 1 }]}>Thème</Text>
          </View>
          <View style={[styles.innerPad, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <SegmentControl
              options={[{ label: 'Claire', value: 'light' }, { label: 'Sombre', value: 'dark' }, { label: 'Système', value: 'auto' }]}
              selected={mode}
              onSelect={setMode as any}
              colors={colors}
            />
          </View>

          {/* Text size */}
          <View style={[styles.innerRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="text-outline" size={15} color={colors.accent} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text, flex: 1 }]}>Taille du texte</Text>
          </View>
          <View style={[styles.innerPad, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <SegmentControl
              options={[{ label: 'Petite', value: 'small' }, { label: 'Normale', value: 'normal' }, { label: 'Grande', value: 'large' }]}
              selected={textSize}
              onSelect={setTextSize}
              colors={colors}
            />
          </View>

          <Row icon="grid-outline" label="Mode compact" sublabel="Afficher plus de biens à l'écran" colors={colors} iconColor="#8B5CF6"
            right={sw(compactMode, setCompactMode)} />
          <Row icon="pricetag-outline" label="Afficher les prix" sublabel="Visible sur les cartes pronostics" colors={colors} iconColor="#F59E0B"
            last right={sw(showPrices, setShowPrices)} />
        </AccordionSection>

        {/* PRÉFÉRENCES */}
        <AccordionSection title="PRÉFÉRENCES" icon="settings-outline" iconColor="#10B981" colors={colors}>
          {/* Language */}
          <View style={[styles.innerPad, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <View style={styles.langRow}>
              <TouchableOpacity
                style={[styles.langBtn, { borderColor: i18n.language === 'fr' ? colors.accent : colors.border, backgroundColor: i18n.language === 'fr' ? colors.accentDim : 'transparent' }]}
                onPress={() => handleLanguage('fr')} activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20 }}>🇫🇷</Text>
                <Text style={[styles.langLabel, { color: i18n.language === 'fr' ? colors.accent : colors.textSecondary }]}>Français</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, { borderColor: i18n.language === 'en' ? colors.accent : colors.border, backgroundColor: i18n.language === 'en' ? colors.accentDim : 'transparent' }]}
                onPress={() => handleLanguage('en')} activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20 }}>🇬🇧</Text>
                <Text style={[styles.langLabel, { color: i18n.language === 'en' ? colors.accent : colors.textSecondary }]}>English</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Row icon="notifications-outline" label="Toutes les notifications" sublabel="Activez ou désactivez toutes les alertes" colors={colors} right={sw(notifAll, setNotifAll)} />
          <Row icon="eye-outline" label="Demandes de visite" sublabel="Quand quelqu'un veut visiter votre bien" colors={colors} iconColor="#06B6D4" right={sw(notifVisits, setNotifVisits)} />
          <Row icon="bar-chart-outline" label="Vues sur vos biens" sublabel="Suivez vos statistiques de visibilité" colors={colors} iconColor="#8B5CF6" right={sw(notifViews, setNotifViews)} />
          <Row icon="heart-outline" label="Likes sur vos biens" sublabel="Quand quelqu'un met un cœur" colors={colors} iconColor="#EF4444" right={sw(notifLikes, setNotifLikes)} />
          <Row icon="chatbubble-outline" label="Nouveaux messages" sublabel="Conversations avec des intéressés" colors={colors} iconColor="#3B82F6" right={sw(notifMessages, setNotifMessages)} />
          <Row icon="trending-down-outline" label="Baisses de prix" sublabel="Vos biens sauvegardés" colors={colors} iconColor="#F59E0B" right={sw(notifPriceDrops, setNotifPriceDrops)} />
          <Row icon="add-circle-outline" label="Nouvelles annonces" sublabel="Vos alertes sauvegardées" colors={colors} iconColor="#10B981" right={sw(notifNewAds, setNotifNewAds)} />
          <Row icon="gift-outline" label="Promotions & Actualités" colors={colors} iconColor="#EC4899" last right={sw(notifPromo, setNotifPromo)} />
        </AccordionSection>

        {/* SUPPORT */}
        <AccordionSection title="SUPPORT" icon="help-circle-outline" iconColor="#10B981" colors={colors}>
          <Row icon="headset-outline" label="Centre d'aide" colors={colors} iconColor="#3B82F6" onPress={() => {}} />
          <Row icon="list-outline" label="Questions fréquentes" colors={colors} iconColor="#8B5CF6" onPress={() => {}} />
          <Row icon="flag-outline" label="Signaler un problème" colors={colors} iconColor="#EF4444" onPress={() => {}} />
          <Row icon="logo-whatsapp" label="Support WhatsApp" colors={colors} iconColor="#25D366" iconBg="rgba(37,211,102,0.12)" onPress={() => {}} />
          <Row icon="star-outline" label="Évaluer l'app" colors={colors} iconColor="#F59E0B" last onPress={() => {}} />
        </AccordionSection>

        {/* À PROPOS */}
        <AccordionSection title="À PROPOS" icon="information-circle-outline" iconColor="#6B7280" colors={colors}>
          <Row icon="document-text-outline" label="Politique de confidentialité" colors={colors} iconColor="#6B7280" onPress={() => {}} />
          <Row icon="reader-outline" label="Conditions d'utilisation" colors={colors} iconColor="#6B7280" onPress={() => {}} />
          <Row icon="code-slash-outline" label="Licences open-source" colors={colors} iconColor="#6B7280" onPress={() => {}} />
          <Row icon="logo-instagram" label="Nous suivre" colors={colors} iconColor="#E1306C" iconBg="rgba(225,48,108,0.1)" onPress={() => {}} />
          <Row icon="information-circle-outline" label="Version de l'application" value={APP_VERSION} colors={colors} iconColor="#6B7280" last />
        </AccordionSection>

        {/* Logout */}
        {profile && (
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: '#EF4444' }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={[styles.logoutText, { color: '#EF4444' }]}>{t('logout')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  coverWrap: { position: 'relative' },
  coverModifyBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coverModifyText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginTop: -24,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  avatarImg: { width: 82, height: 82, borderRadius: 41 },
  vipBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 6,
  },
  editProfileText: { fontSize: 13, fontWeight: '500' },
  profileName: { fontSize: 24, fontWeight: '800', fontFamily: 'Inter_700Bold', marginBottom: 2 },
  profileEmail: { fontSize: 13, marginBottom: 12 },
  loginCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 4,
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  loginCtaText: { color: '#000', fontSize: 15, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  sections: { paddingHorizontal: 16, gap: 10, paddingTop: 4 },
  accordion: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  accordionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: { flex: 1, fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  accordionBody: { borderTopWidth: StyleSheet.hairlineWidth },

  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  innerPad: { paddingHorizontal: 16, paddingVertical: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 14, fontWeight: '500' },
  rowSublabel: { fontSize: 11, marginTop: 1, lineHeight: 15 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 12 },

  segment: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentLabel: { fontSize: 13, fontWeight: '600' },

  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  langLabel: { fontSize: 13, fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
});
