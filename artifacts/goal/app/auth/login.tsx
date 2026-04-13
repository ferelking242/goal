import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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
import { GoalLogo } from '@/components/GoalLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

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

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Background glow */}
      <View style={[styles.bgGlow, { backgroundColor: isDark ? 'rgba(0,208,132,0.06)' : 'rgba(0,168,101,0.05)' }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo block */}
          <View style={styles.logoBlock}>
            <GoalLogo size={90} />
            <View style={styles.titleGroup}>
              <Text style={[styles.appName, { color: colors.text }]}>GOAL</Text>
              <View style={[styles.taglineBar, { backgroundColor: colors.accent }]} />
              <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                Football Predictions
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  borderColor: error ? colors.live : colors.border,
                },
              ]}
            >
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('email')}
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {/* Password */}
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  borderColor: error ? colors.live : colors.border,
                },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('password')}
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoComplete="password"
              />
              <Pressable onPress={() => setShowPass(!showPass)} hitSlop={10}>
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

            {/* Sign in button */}
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.accent, opacity: loading ? 0.8 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#000" />
                  <Text style={styles.loginBtnText}>{t('signIn')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                {t('dontHaveAccount')}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Register */}
            <Pressable
              style={[styles.registerBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}
              onPress={() => router.push('/auth/register' as any)}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.accent} />
              <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                <Text style={{ color: colors.accent, fontWeight: '700' }}>{t('signUp')}</Text>
              </Text>
            </Pressable>
          </View>
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
    top: 0,
    left: '10%',
    right: '10%',
    height: 280,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
  },
  scroll: { paddingHorizontal: 28 },
  logoBlock: { alignItems: 'center', gap: 16, marginBottom: 48 },
  titleGroup: { alignItems: 'center', gap: 6 },
  appName: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 10,
    fontFamily: 'Inter_700Bold',
    lineHeight: 44,
  },
  taglineBar: {
    width: 36,
    height: 2.5,
    borderRadius: 2,
  },
  tagline: {
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  form: { gap: 12 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 54,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 2 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  loginBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  loginBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'Inter_700Bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12 },
  registerBtn: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  registerText: { fontSize: 15 },
});
