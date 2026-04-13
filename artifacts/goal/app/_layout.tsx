import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { initAppStorage } from '@/utils/storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import '@/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password'];

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Handle redirect based on auth state
  useEffect(() => {
    if (loading) return;
    const isAuthRoute = AUTH_ROUTES.some(r => pathname.includes(r.replace('/', '')));
    if (!session && !isAuthRoute) {
      router.replace('/auth/login' as any);
    } else if (session && isAuthRoute) {
      router.replace('/(tabs)' as any);
    }
  }, [session, loading, pathname]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/forgot-password" />
      <Stack.Screen name="admin/users" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="admin/match-predictions/[matchId]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [forceRender, setForceRender] = useState(Platform.OS === 'web');
  const [fontsLoaded, fontError] = useFonts(
    Platform.OS === 'web'
      ? {}
      : { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold }
  );

  useEffect(() => {
    initAppStorage().catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const t = setTimeout(() => setForceRender(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError || forceRender) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, forceRender]);

  if (!fontsLoaded && !fontError && !forceRender) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <AdminProvider>
              <QueryClientProvider client={queryClient}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </QueryClientProvider>
            </AdminProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
