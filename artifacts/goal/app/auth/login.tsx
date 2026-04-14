import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { GoalLogo } from '@/components/GoalLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: W, height: H } = Dimensions.get('window');

function PitchBackground() {
  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#060E07" />
          <Stop offset="50%" stopColor="#0A1A0C" />
          <Stop offset="100%" stopColor="#071209" />
        </LinearGradient>
        <LinearGradient id="field" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#00D084" stopOpacity="0.08" />
          <Stop offset="100%" stopColor="#00D084" stopOpacity="0.02" />
        </LinearGradient>
        <LinearGradient id="heroGlow" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor="#00D084" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#00D084" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {/* Base background */}
      <Rect width={W} height={H} fill="url(#bg)" />

      {/* Top glow orb */}
      <Rect x={0} y={0} width={W} height={H * 0.55} fill="url(#heroGlow)" />

      {/* Football pitch lines - center circle */}
      <G opacity={0.07} stroke="#00D084" strokeWidth={1} fill="none">
        {/* Center circle */}
        <Circle cx={W / 2} cy={H * 0.3} r={70} />
        <Circle cx={W / 2} cy={H * 0.3} r={8} />
        {/* Center line */}
        <Line x1={0} y1={H * 0.3} x2={W} y2={H * 0.3} />
        {/* Goal area top */}
        <Rect x={W * 0.25} y={0} width={W * 0.5} height={H * 0.1} />
        <Rect x={W * 0.35} y={0} width={W * 0.3} height={H * 0.06} />
        {/* Corner arcs */}
        <Path d={`M ${W * 0.02} ${H * 0.55} A 20 20 0 0 1 ${W * 0.02} ${H * 0.45}`} />
        <Path d={`M ${W * 0.98} ${H * 0.55} A 20 20 0 0 0 ${W * 0.98} ${H * 0.45}`} />
      </G>

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <Circle
          key={i}
          cx={20 + (i * W * 0.09)}
          cy={50 + (i % 4) * 70}
          r={1.5}
          fill="#00D084"
          fillOpacity={0.25}
        />
      ))}
    </Svg>
  );
}

function FloatingBall({ x, delay, size }: { x: number; delay: number; size: number }) {
  const y = useRef(new Animated.Value(-size * 2)).current;
  const op = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = () => {
      y.setValue(-size * 2);
      op.setValue(0);
      rot.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(op, { toValue: 0.22, duration: 600, useNativeDriver: true }),
          Animated.timing(y, { toValue: H + size, duration: 9000 + delay * 0.3, useNativeDriver: true }),
          Animated.timing(rot, { toValue: 1, duration: 9000 + delay * 0.3, useNativeDriver: true }),
        ]),
        Animated.timing(op, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start(loop);
    };
    loop();
  }, []);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { left: x, opacity: op, transform: [{ translateY: y }, { rotate: spin }], width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Circle cx={16} cy={16} r={15} fill="none" stroke="#00D084" strokeWidth={1} strokeOpacity={0.7} />
        <Polygon points="16,7 19,12 16,14 13,12" fill="#00D084" fillOpacity={0.5} />
        <Path d="M16,14 L19,12 L22,16 L19,21 L13,21 L10,16 L13,12 Z" fill="none" stroke="#00D084" strokeWidth={0.8} strokeOpacity={0.5} />
      </Svg>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState<string | null>(null);

  const logoY = useRef(new Animated.Value(-100)).current;
  const logoOp = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(60)).current;
  const cardOp = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoY, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
        Animated.timing(logoOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardY, { toValue: 0, tension: 55, friction: 12, useNativeDriver: true }),
        Animated.timing(cardOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setLoading(true);
    setError('');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error: err } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (err) {
      setError(err);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const ACCENT = '#00D084';

  return (
    <View style={styles.root}>
      <PitchBackground />

      {/* Floating balls */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <FloatingBall x={W * 0.05} delay={0} size={30} />
        <FloatingBall x={W * 0.8} delay={2500} size={22} />
        <FloatingBall x={W * 0.45} delay={5000} size={36} />
        <FloatingBall x={W * 0.25} delay={7000} size={18} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero: Logo drops from top */}
          <Animated.View style={[styles.hero, { opacity: logoOp, transform: [{ translateY: logoY }] }]}>
            <View style={styles.logoGlowWrap}>
              <View style={[styles.logoGlow, { backgroundColor: ACCENT + '15' }]}>
                <GoalLogo size={88} />
              </View>
            </View>
            <Text style={styles.heroTitle}>GOAL</Text>
            <Text style={styles.heroSub}>Football Predictions Platform</Text>
          </Animated.View>

          {/* Form card */}
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: 'rgba(12,22,14,0.85)', borderColor: 'rgba(0,208,132,0.12)', opacity: cardOp, transform: [{ translateY: cardY }] },
            ]}
          >
            <Text style={styles.cardTitle}>Connexion</Text>
            <Text style={styles.cardSub}>Bon retour parmi nous 👋</Text>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Adresse email</Text>
              <View style={[
                styles.inputBox,
                {
                  borderColor: focusField === 'email' ? ACCENT : error ? '#EF4444' : 'rgba(255,255,255,0.1)',
                  backgroundColor: focusField === 'email' ? 'rgba(0,208,132,0.05)' : 'rgba(255,255,255,0.04)',
                },
              ]}>
                <Ionicons name="mail-outline" size={17} color={focusField === 'email' ? ACCENT : 'rgba(255,255,255,0.35)'} style={styles.inputIco} />
                <TextInput
                  style={styles.input}
                  placeholder="vous@email.com"
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  onFocus={() => setFocusField('email')}
                  onBlur={() => setFocusField(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Mot de passe</Text>
                <Pressable onPress={() => router.push('/auth/forgot-password' as any)}>
                  <Text style={[styles.forgotLink, { color: ACCENT }]}>Oublié ?</Text>
                </Pressable>
              </View>
              <View style={[
                styles.inputBox,
                {
                  borderColor: focusField === 'pass' ? ACCENT : error ? '#EF4444' : 'rgba(255,255,255,0.1)',
                  backgroundColor: focusField === 'pass' ? 'rgba(0,208,132,0.05)' : 'rgba(255,255,255,0.04)',
                },
              ]}>
                <Ionicons name="lock-closed-outline" size={17} color={focusField === 'pass' ? ACCENT : 'rgba(255,255,255,0.35)'} style={styles.inputIco} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoComplete="password"
                  onFocus={() => setFocusField('pass')}
                  onBlur={() => setFocusField(null)}
                />
                <Pressable onPress={() => setShowPass(v => !v)} hitSlop={12}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color="rgba(255,255,255,0.35)" />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Sign in button */}
            <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 6 }}>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: ACCENT, opacity: loading ? 0.85 : 1 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Ionicons name="football-outline" size={18} color="#000" />
                    <Text style={styles.ctaBtnText}>{t('signIn')}</Text>
                    <Ionicons name="arrow-forward" size={16} color="rgba(0,0,0,0.45)" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.divRow}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>Pas encore membre ?</Text>
              <View style={styles.divLine} />
            </View>

            {/* Register */}
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => router.push('/auth/register' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={17} color={ACCENT} />
              <Text style={[styles.outlineBtnText, { color: ACCENT }]}>{t('signUp')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const CARD_RADIUS = 24;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060E07' },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  hero: { alignItems: 'center', marginBottom: 32, gap: 10 },
  logoGlowWrap: { marginBottom: 4 },
  logoGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 14,
    fontFamily: 'Inter_700Bold',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '500',
  },

  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  cardSub: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: -8 },

  fieldWrap: { gap: 8 },
  fieldLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotLink: { fontSize: 12, fontWeight: '700' },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  inputIco: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 15, fontFamily: 'Inter_400Regular' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { flex: 1, color: '#EF4444', fontSize: 13, lineHeight: 18 },

  ctaBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaBtnText: { flex: 1, textAlign: 'center', color: '#000', fontSize: 16, fontWeight: '800', fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },

  divRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)' },
  divText: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },

  outlineBtn: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,208,132,0.35)',
    backgroundColor: 'rgba(0,208,132,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  outlineBtnText: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
});
