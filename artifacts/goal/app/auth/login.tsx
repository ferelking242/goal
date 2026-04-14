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
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { GoalLogo } from '@/components/GoalLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: W, height: H } = Dimensions.get('window');

function FloatingBall({ delay, startX, size, duration }: { delay: number; startX: number; size: number; duration: number }) {
  const y = useRef(new Animated.Value(-size)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = () => {
      y.setValue(-size);
      rotate.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.18, duration: 400, useNativeDriver: true }),
          Animated.timing(y, { toValue: H + size, duration, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 1, duration, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => anim());
    };
    anim();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: 0,
        opacity,
        transform: [{ translateY: y }, { rotate: spin }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Circle cx="20" cy="20" r="19" fill="#ffffff" fillOpacity={0.06} stroke="#00D084" strokeWidth="1" strokeOpacity="0.3" />
        <Polygon points="20,11 22.9,15.9 20,17.5 17.1,15.9" fill="#00D084" fillOpacity="0.4" />
        <Path d="M20,17.5 L22.9,15.9 L25.3,20.5 L22,24 L18,24 L14.7,20.5 L17.1,15.9 Z" fill="none" stroke="#00D084" strokeWidth="0.8" strokeOpacity="0.35" />
      </Svg>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const bannerY = useRef(new Animated.Value(-220)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(30)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(bannerY, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
        Animated.timing(bannerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(formY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
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

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.14] });

  const balls = [
    { delay: 0, startX: W * 0.08, size: 36, duration: 8000 },
    { delay: 1800, startX: W * 0.72, size: 28, duration: 10000 },
    { delay: 3200, startX: W * 0.44, size: 44, duration: 7000 },
    { delay: 5000, startX: W * 0.2, size: 24, duration: 9500 },
    { delay: 6500, startX: W * 0.84, size: 32, duration: 8500 },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Animated background glow */}
      <Animated.View
        style={[
          styles.bgGlow,
          { backgroundColor: isDark ? '#00D084' : '#00A865', opacity: glowOpacity },
        ]}
      />

      {/* Floating balls */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {balls.map((b, i) => (
          <FloatingBall key={i} {...b} />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Logo Banner drops from top */}
          <Animated.View
            style={[
              styles.logoBlock,
              { opacity: bannerOpacity, transform: [{ translateY: bannerY }] },
            ]}
          >
            <View style={[styles.logoGlow, { shadowColor: '#00D084' }]}>
              <GoalLogo size={100} />
            </View>
            <View style={styles.titleGroup}>
              <Text style={[styles.appName, { color: colors.text }]}>GOAL</Text>
              <View style={[styles.taglineBar, { backgroundColor: colors.accent }]} />
              <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                Football Predictions
              </Text>
            </View>
          </Animated.View>

          {/* Form animates up */}
          <Animated.View
            style={[
              styles.form,
              { opacity: formOpacity, transform: [{ translateY: formY }] },
            ]}
          >
            {/* Email field */}
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: error ? colors.live : emailFocused ? colors.accent : colors.border,
                  borderWidth: emailFocused ? 1.5 : 1,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={emailFocused ? colors.accent : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('email')}
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password field */}
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: error ? colors.live : passFocused ? colors.accent : colors.border,
                  borderWidth: passFocused ? 1.5 : 1,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={passFocused ? colors.accent : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('password')}
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoComplete="password"
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <Pressable onPress={() => setShowPass(!showPass)} hitSlop={12}>
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: 'rgba(255,59,48,0.1)', borderColor: 'rgba(255,59,48,0.25)' }]}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.live} />
                <Text style={[styles.errorText, { color: colors.live }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => router.push('/auth/forgot-password' as any)}
              style={styles.forgotBtn}
            >
              <Text style={[styles.forgotText, { color: colors.accent }]}>{t('forgotPassword')}</Text>
            </Pressable>

            {/* Sign In button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: colors.accent }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
              >
                <View style={styles.loginBtnInner}>
                  {loading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Ionicons name="football-outline" size={20} color="#000" />
                      <Text style={styles.loginBtnText}>{t('signIn')}</Text>
                      <Ionicons name="arrow-forward" size={18} color="rgba(0,0,0,0.5)" />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                {t('dontHaveAccount')}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Register button */}
            <TouchableOpacity
              style={[
                styles.registerBtn,
                {
                  borderColor: colors.accent,
                  backgroundColor: isDark ? 'rgba(0,208,132,0.07)' : 'rgba(0,168,101,0.06)',
                },
              ]}
              onPress={() => router.push('/auth/register' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.accent} />
              <Text style={[styles.registerText, { color: colors.accent }]}>
                {t('signUp')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  bgGlow: {
    position: 'absolute',
    top: -60,
    left: '5%',
    right: '5%',
    height: 320,
    borderBottomLeftRadius: 240,
    borderBottomRightRadius: 240,
  },
  scroll: { paddingHorizontal: 28 },
  logoBlock: { alignItems: 'center', gap: 18, marginBottom: 44 },
  logoGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 10,
  },
  titleGroup: { alignItems: 'center', gap: 8 },
  appName: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 12,
    fontFamily: 'Inter_700Bold',
    lineHeight: 48,
  },
  taglineBar: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  form: { gap: 13 },
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
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 2 },
  forgotText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  loginBtn: {
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  loginBtnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  loginBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'Inter_700Bold',
    flex: 1,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12, fontWeight: '500' },
  registerBtn: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  registerText: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
});
