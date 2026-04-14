import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: W } = Dimensions.get('window');

function AnimatedLockIcon({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring1, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.delay(400),
        ]),
        Animated.timing(ring1, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring2, { toValue: 1, duration: 1600, useNativeDriver: true }),
          ]),
          Animated.timing(ring2, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    }, 800);
  }, []);

  const ring1Scale = ring1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const ring1Op = ring1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.2, 0] });
  const ring2Scale = ring2.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const ring2Op = ring2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.1, 0] });

  return (
    <View style={styles.lockIconContainer}>
      <Animated.View
        style={[
          styles.lockRing,
          { borderColor: color, transform: [{ scale: ring2Scale }], opacity: ring2Op },
        ]}
      />
      <Animated.View
        style={[
          styles.lockRing,
          { borderColor: color, transform: [{ scale: ring1Scale }], opacity: ring1Op },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <View style={[styles.lockIconCircle, { backgroundColor: color + '18', borderColor: color + '40' }]}>
          <Svg width={38} height={38} viewBox="0 0 38 38">
            <Defs>
              <LinearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={color} stopOpacity="1" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
              </LinearGradient>
            </Defs>
            <Path
              d="M9 17 V13 A10 10 0 0 1 29 13 V17"
              fill="none"
              stroke="url(#lockGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <Path
              d="M6 17 H32 Q33 17 33 18 V31 Q33 32 32 32 H6 Q5 32 5 31 V18 Q5 17 6 17 Z"
              fill="url(#lockGrad)"
              fillOpacity="0.25"
              stroke="url(#lockGrad)"
              strokeWidth="1.5"
            />
            <Circle cx="19" cy="24.5" r="3" fill="url(#lockGrad)" />
            <Path d="M19 24.5 L19 28.5" stroke="url(#lockGrad)" strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </View>
      </Animated.View>
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { resetPassword } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);

  const contentY = useRef(new Animated.Value(30)).current;
  const contentOp = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.5)).current;
  const successOp = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(contentY, { toValue: 0, tension: 55, friction: 12, useNativeDriver: true }),
      Animated.timing(contentOp, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleReset = async () => {
    if (!email) return;
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setLoading(true);
    setError('');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error: err } = await resetPassword(email.trim());
    setLoading(false);
    if (err) {
      setError(err);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      setSent(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.timing(successOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Decorative arc */}
      <View style={[styles.arcBg, { backgroundColor: isDark ? 'rgba(0,208,132,0.06)' : 'rgba(0,168,101,0.05)' }]} />

      {/* Back button */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <View style={[styles.backBtnInner, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </View>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + 28, opacity: contentOp, transform: [{ translateY: contentY }] },
        ]}
      >
        {/* Lock Icon */}
        <AnimatedLockIcon color={colors.accent} />

        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.text }]}>{t('resetPassword')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {sent
              ? t('checkEmail')
              : 'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.'}
          </Text>
        </View>

        {sent ? (
          <Animated.View
            style={[
              styles.successCard,
              {
                backgroundColor: isDark ? 'rgba(0,208,132,0.12)' : 'rgba(0,208,132,0.1)',
                borderColor: colors.accent + '50',
                transform: [{ scale: successScale }],
                opacity: successOp,
              },
            ]}
          >
            <View style={[styles.successIconWrap, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="checkmark-circle" size={32} color={colors.accent} />
            </View>
            <View style={styles.successText}>
              <Text style={[styles.successTitle, { color: colors.accent }]}>{t('resetSent')}</Text>
              <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
                Vérifiez votre boîte mail et suivez les instructions.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.backToLoginBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={16} color="#000" />
              <Text style={styles.backToLoginText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Adresse email</Text>
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
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
              {email.length > 3 && email.includes('@') && (
                <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
              )}
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: 'rgba(255,59,48,0.1)', borderColor: 'rgba(255,59,48,0.25)' }]}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.live} />
                <Text style={[styles.errorText, { color: colors.live }]}>{error}</Text>
              </View>
            ) : null}

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: colors.accent }]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.87}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={18} color="#000" />
                    <Text style={styles.sendBtnText}>{t('sendResetEmail')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Pressable onPress={() => router.back()} style={styles.cancelRow}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>
                Retour à la{' '}
                <Text style={{ color: colors.accent, fontWeight: '700' }}>connexion</Text>
              </Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  arcBg: {
    position: 'absolute',
    top: -100,
    left: '5%',
    right: '5%',
    height: 320,
    borderBottomLeftRadius: 240,
    borderBottomRightRadius: 240,
  },
  topBar: { paddingHorizontal: 24, paddingBottom: 8 },
  backBtn: { alignSelf: 'flex-start' },
  backBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    gap: 24,
  },
  lockIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  lockRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  lockIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { alignItems: 'center', gap: 10 },
  title: { fontSize: 26, fontWeight: '800', fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },
  successCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: { alignItems: 'center', gap: 6 },
  successTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  successDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  backToLoginText: { color: '#000', fontWeight: '700', fontSize: 14 },
  form: { gap: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: -6 },
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
  sendBtn: {
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
    marginTop: 4,
  },
  sendBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.4,
  },
  cancelRow: { alignItems: 'center', paddingVertical: 4 },
  cancelText: { fontSize: 14 },
});
