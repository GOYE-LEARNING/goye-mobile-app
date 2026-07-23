// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { AppState, Alert } from 'react-native';
import { router } from 'expo-router';

import { SignUpProvider } from '@/contexts/SignUpContext';
import { UserProvider } from '@/contexts/UserContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { initI18n } from '@/lib/i18n';
import Toast from 'react-native-toast-message';
import { useUser } from '@/contexts/UserContext';
import { useSignUp } from '@/contexts/SignUpContext';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import eventEmitter from '@/utils/eventEmitter';

// ─── Session Handler Component ───────────────────────────────────────────────
function SessionHandler() {
  const { clearUserData, isAuthenticated, logout } = useUser();
  const { reset } = useSignUp();
  const { signOutGoogle } = useGoogleSignIn();

  // Handle session expiry globally
  useEffect(() => {
    const handleSessionExpired = async () => {
      console.log('[App] Session expired, redirecting to login...');
      
      try {
        // Clear all data
        await clearUserData();
        reset();
        
        // Sign out of Google if needed
        if (signOutGoogle) {
          await signOutGoogle();
        }
        
        // Show alert to user
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(auth)/start');
              }
            }
          ]
        );
      } catch (error) {
        console.error('[App] Error handling session expiry:', error);
        router.replace('/(auth)/start');
      }
    };

    // ✅ Subscribe to session expired event
    const unsubscribe = eventEmitter.on('SESSION_EXPIRED', handleSessionExpired);

    return () => {
      unsubscribe();
    };
  }, [clearUserData, reset, signOutGoogle]);

  // Listen for app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated) {
        console.log('[App] App came to foreground');
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  return null;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) return null;

  return (
    <SignUpProvider>
      <UserProvider>
        <ThemeProvider>
          <SessionHandler />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
          <Toast />
        </ThemeProvider>
      </UserProvider>
    </SignUpProvider>
  );
}