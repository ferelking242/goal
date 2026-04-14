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
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: W, height: H } = Dimensions.get('window');
const ACCENT = '#00D084';

function Background() {
  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#060E07" />
          <Stop offset="100%" stopColor="#081408" />
        </LinearGradient>
        <LinearGradient id="glow2" x1="30%" y1="0%" x2="70%" y2="60%">
          <Stop offset="0%" stopColor="#00D084" stopOpacity="0.12" />
          <Stop offset="100%" stopColor="#00D084" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width={W} height={H} fill="url(#bg2)" />
      <Rect width={W} height={H} fill="url(#glow2)" />
      {/* Pitch arc */}
      <Path
        d={`M ${W * 0.5} ${H * -0.1} A ${W * 0.6} ${W * 0.6} 0 0 1 ${W * 1.1} ${H * 0.3}`}
        fill="none"
        stroke="#00D084"
        strokeWidth={0.8}
        strokeOpacity={0.06}
      />
      <Circle cx={W * 0.5} cy={H * 0.1} r={80} fill="none" stroke="#00D084" strokeWidth={0.8} strokeOpacity={0.05} />
      {[...Array(8)].map((_, i) => (
        <Circle key={i} cx={30 + i * W * 0.14} cy={H * 0.85} r={1.2} fill={ACCENT} fillOpacity={0.2} />
      ))}
    </Svg>
  );
}

function StrengthBar({ password }: { password: string }) {
  const len = password.length;
  const score = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : len < 14 ? 3 : 4;
  const colors = ['', '#EF4444', '#F59E0B', '#10B981', ACCENT];
  const labels = ['', 'Très faible', 'Faible', 'Bon', 'Fort'];
  if (len === 0) return null;
  return (
    <View style={sb.wrap}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[sb.bar, { backgroundColor: i <= score ? colors[score] : 'rgba(255,255,255,0.1)' }]} />
      ))}
      <Text style={[sb.label, { color: colors[score] }]}>{labels[score]}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '600', minWidth: 60, textAlign: 'right' },
});

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focus, setFocus] = useState<string | null>(null);

  const cardY = useRef(new Animated.Value(50)).current;
  const cardOp = useRef(new Animated.Value(0)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(cardY, { toValue: 0, tension: 52, friction: 12, useNativeDriver: true }),
      Animated.timing(cardOp, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!email || !password || !fullName) return;
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setLoading(true);
    setError('');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error: err } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);
    if (err) {
      setError(err);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const inputStyle = (field: string, hasError: boolean = false) => [
    styles.inputBox,
    {
      borderColor: focus === field ? ACCENT : hasError ? '#EF4444' : 'rgba(255,255,255,0.1)',
      backgroundColor: focus === field ? 'rgba(0,208,132,0.05)' : 'rgba(255,255,255,0.04)',
    },
  ];

  return (
    <View style={styles.root}>
      <Background />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Animated.View style={{ opacity: headerOp }}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <View style={styles.backBtnInner}>
                <Ionicons name="arrow-back" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Page header */}
          <Animated.View style={[styles.pageHeader, { opacity: headerOp }]}>
            <View style={styles.headerBall}>
              <Svg width={44} height={44} viewBox="0 0 44 44">
                <Circle cx={22} cy={22} r={21} fill={ACCENT} fillOpacity={0.15} stroke={ACCENT} strokeWidth={1.5} strokeOpacity={0.5} />
                <Polygon points="22,11 26,17 22,20 18,17" fill={ACCENT} fillOpacity={0.7} />
                <Path d="M22,20 L26,17 L30,22 L27,28 L17,28 L14,22 L18,17 Z" fill="none" stroke={ACCENT} strokeWidth={1} strokeOpacity={0.6} />
              </Svg>
            </View>
            <View>
              <Text style={styles.pageTitle}>Créer un compte</Text>
              <Text style={styles.pageSub}>Rejoins la communauté GOAL</Text>
            </View>
          </Animated.View>

          {/* Form card */}
          <Animated.View
            style={[
              styles.card,
              { opacity: cardOp, transform: [{ translateY: cardY }] },
            ]}
          >
            {/* Full name */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Nom complet</Text>
              <View style={inputStyle('name')}>
                <Ionicons name="person-outline" size={17} color={focus === 'name' ? ACCENT : 'rgba(255,255,255,0.35)'} style={styles.ico} />
                <TextInput
                  style={styles.input}
                  placeholder="Prénom Nom"
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  value={fullName}
                  onChangeText={setFullName}
                  autoComplete="name"
                  onFocus={() => setFocus('name')}
                  onBlur={() => setFocus(null)}
                />
                {fullName.length > 2 && (
                  <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
                )}
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Adresse email</Text>
              <View style={inputStyle('email')}>
                <Ionicons name="mail-outline" size={17} color={focus === 'email' ? ACCENT : 'rgba(255,255,255,0.35)'} style={styles.ico} />
                <TextInput
                  style={styles.input}
                  placeholder="vous@email.com"
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  onFocus={() => setFocus('email')}
                  onBlur={() => setFocus(null)}
                />
                {email.includes('@') && email.includes('.') && (
                  <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
                )}
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <View style={inputStyle('pass')}>
                <Ionicons name="lock-closed-outline" size={17} color={focus === 'pass' ? ACCENT : 'rgba(255,255,255,0.35)'} style={styles.ico} />
                <TextInput
                  style={styles.input}
                  placeholder="Min. 8 caractères"
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  onFocus={() => setFocus('pass')}
                  onBlur={() => setFocus(null)}
                />
                <Pressable onPress={() => setShowPass(v => !v)} hitSlop={12}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color="rgba(255,255,255,0.35)" />
                </Pressable>
              </View>
              <StrengthBar password={password} />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Terms note */}
            <Text style={styles.termsText}>
              En créant un compte, vous acceptez nos{' '}
              <Text style={{ color: ACCENT }}>Conditions d'utilisation</Text> et notre{' '}
              <Text style={{ color: ACCENT }}>Politique de confidentialité</Text>.
            </Text>

            {/* CTA */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.ctaBtn, { opacity: loading ? 0.85 : 1 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.87}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Ionicons name="football-outline" size={18} color="#000" />
                    <Text style={styles.ctaBtnText}>Créer mon compte</Text>
                    <Ionicons name="arrow-forward" size={16} color="rgba(0,0,0,0.45)" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Back to login */}
            <TouchableOpacity onPress={() => router.back()} style={styles.loginRow} activeOpacity={0.7}>
              <Text style={styles.loginRowText}>
                Déjà un compte ?{' '}
                <Text style={{ color: ACCENT, fontWeight: '700' }}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060E07' },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },

  backBtn: { alignSelf: 'flex-start', marginBottom: 4 },
  backBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerBall: { },
  pageTitle: { color: '#fff', fontSize: 24, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  pageSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 },

  card: {
    backgroundColor: 'rgba(12,22,14,0.88)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,208,132,0.12)',
    padding: 24,
    gap: 16,
  },

  fieldWrap: { gap: 8 },
  fieldLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  ico: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 15 },

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

  termsText: { color: 'rgba(255,255,255,0.3)', fontSize: 11, lineHeight: 16, textAlign: 'center' },

  ctaBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaBtnText: {
    flex: 1,
    textAlign: 'center',
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },

  loginRow: { alignItems: 'center', paddingVertical: 4 },
  loginRowText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
