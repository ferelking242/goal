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
import Svg, { Circle, Path } from 'react-native-svg';
import { GoalLogo } from '@/components/GoalLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: W } = Dimensions.get('window');

function BallDecoration({ x, y, size, opacity }: { x: number; y: number; size: number; opacity: number }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.1, duration: 2200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.8, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, opacity, transform: [{ scale }] }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Circle cx="20" cy="20" r="18" fill="none" stroke="#00D084" strokeWidth="1.5" strokeOpacity="0.6" />
        <Circle cx="20" cy="20" r="10" fill="none" stroke="#00D084" strokeWidth="0.8" strokeOpacity="0.3" />
        <Path d="M20,6 L26,14 L20,20 L14,14 Z" fill="#00D084" fillOpacity="0.15" />
      </Svg>
    </Animated.View>
  );
}

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const headerY = useRef(new Animated.Value(-40)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const field1 = useRef(new Animated.Value(0)).current;
  const field2 = useRef(new Animated.Value(0)).current;
  const field3 = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.parallel([
        Animated.spring(headerY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.timing(field1, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(field2, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(field3, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!email || !password || !fullName) return;
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
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

  const fieldStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }],
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Decorative background balls */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BallDecoration x={-18} y={80} size={70} opacity={0.18} />
        <BallDecoration x={W - 52} y={180} size={60} opacity={0.14} />
        <BallDecoration x={W * 0.4} y={-20} size={50} opacity={0.1} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <View style={[styles.backBtnInner, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderColor: colors.border }]}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </View>
          </TouchableOpacity>

          {/* Header */}
          <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
            <View style={styles.logoRow}>
              <GoalLogo size={48} />
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: colors.text }]}>{t('signUp')}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Rejoins la communauté GOAL ⚽
                </Text>
              </View>
            </View>
            <View style={[styles.headerDivider, { backgroundColor: colors.accent }]} />
          </Animated.View>

          <View style={styles.form}>
            {/* Full Name */}
            <Animated.View style={fieldStyle(field1)}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nom complet</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: focusedField === 'name' ? colors.accent : colors.border,
                    borderWidth: focusedField === 'name' ? 1.5 : 1,
                  },
                ]}
              >
                <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? colors.accent : colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('fullName')}
                  placeholderTextColor={colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoComplete="name"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </Animated.View>

            {/* Email */}
            <Animated.View style={fieldStyle(field2)}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: focusedField === 'email' ? colors.accent : colors.border,
                    borderWidth: focusedField === 'email' ? 1.5 : 1,
                  },
                ]}
              >
                <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? colors.accent : colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('email')}
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </Animated.View>

            {/* Password */}
            <Animated.View style={fieldStyle(field3)}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mot de passe</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: focusedField === 'pass' ? colors.accent : colors.border,
                    borderWidth: focusedField === 'pass' ? 1.5 : 1,
                  },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'pass' ? colors.accent : colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('password')}
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                />
                <Pressable onPress={() => setShowPass(!showPass)} hitSlop={12}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </Pressable>
              </View>
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[0, 1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            password.length > i * 3
                              ? password.length >= 12 ? '#00D084' : password.length >= 8 ? '#F5A623' : '#FF3B30'
                              : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        },
                      ]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, { color: colors.textMuted }]}>
                    {password.length === 0 ? '' : password.length >= 12 ? 'Fort' : password.length >= 8 ? 'Moyen' : 'Faible'}
                  </Text>
                </View>
              )}
            </Animated.View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: 'rgba(255,59,48,0.1)', borderColor: 'rgba(255,59,48,0.25)' }]}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.live} />
                <Text style={[styles.errorText, { color: colors.live }]}>{error}</Text>
              </View>
            ) : null}

            {/* Register button */}
            <Animated.View style={[{ opacity: btnOpacity, transform: [{ scale: btnScale }] }, styles.btnWrap]}>
              <TouchableOpacity
                style={[styles.registerBtn, { backgroundColor: colors.accent }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.87}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Ionicons name="football-outline" size={20} color="#000" />
                    <Text style={styles.registerBtnText}>{t('signUp')}</Text>
                    <Ionicons name="arrow-forward" size={18} color="rgba(0,0,0,0.5)" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={() => router.back()} style={styles.loginLink} activeOpacity={0.7}>
              <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
                {t('alreadyHaveAccount')}{' '}
                <Text style={{ color: colors.accent, fontWeight: '700' }}>{t('signIn')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  backBtn: { marginBottom: 20, alignSelf: 'flex-start' },
  backBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { gap: 14, marginBottom: 28 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerText: { gap: 4, flex: 1 },
  title: { fontSize: 28, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  headerDivider: { height: 2.5, width: 44, borderRadius: 2 },
  form: { gap: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: -8, textTransform: 'uppercase' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 56,
    paddingHorizontal: 18,
  },
  inputIcon: { marginRight: 13 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, marginLeft: 4, minWidth: 36 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  btnWrap: { marginTop: 4 },
  registerBtn: {
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
    paddingHorizontal: 20,
  },
  registerBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
