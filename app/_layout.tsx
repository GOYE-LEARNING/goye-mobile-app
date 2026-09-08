// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SignUpProvider } from '@/contexts/SignUpContext';
import { UserProvider } from '@/contexts/UserContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext'; // ✅ ADD THIS
import { OfflineBanner } from '@/components/OfflineBanner';
import { ShekiAIFab } from '@/components/ShekiAIFab';
import { initI18n } from '@/lib/i18n';
import Toast from 'react-native-toast-message';
import { useUser } from '@/contexts/UserContext';
import { useSignUp } from '@/contexts/SignUpContext';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import eventEmitter from '@/utils/eventEmitter';

const HAS_ONBOARDED_LANGUAGE_KEY = '@has_selected_language';

// ─── Session Handler Component ───────────────────────────────────────────────
function SessionHandler() {
  const { clearUserData, isAuthenticated, logout } = useUser();
  const { reset } = useSignUp();
  const { signOutGoogle } = useGoogleSignIn();

  useEffect(() => {
    const handleSessionExpired = async () => {
      console.log('[App] Session expired, redirecting to login...');
      
      try {
        await clearUserData();
        reset();

        if (signOutGoogle) {
          await signOutGoogle();
        }

        router.replace('/(auth)/start');
      } catch (error) {
        console.error('[App] Error handling session expiry:', error);
        router.replace('/(auth)/start');
      }
    };

    const unsubscribe = eventEmitter.on('SESSION_EXPIRED', handleSessionExpired);

    return () => {
      unsubscribe();
    };
  }, [clearUserData, reset, signOutGoogle]);

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

// ─── Language Check Component ────────────────────────────────────────────────
function LanguageCheck() {
  const { isAuthenticated, user } = useUser();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkInitialRoute();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const checkInitialRoute = async () => {
    try {
      if (isAuthenticated && user) {
        console.log('🔒 User already logged in, skipping language check');
        setIsChecking(false);
        return;
      }

      console.log('👤 User not logged in, checking language...');
      const hasSelectedLanguage = await AsyncStorage.getItem(HAS_ONBOARDED_LANGUAGE_KEY);
      
      if (!hasSelectedLanguage) {
        console.log('🔀 First time user - go to language select');
        router.replace('/(auth)/language-select');
      } else {
        console.log('🔀 Returning user - go to start');
        router.replace('/(auth)/start');
      }
    } catch (error) {
      console.error('❌ Error checking language:', error);
      if (!isAuthenticated && !user) {
        router.replace('/(auth)/start');
      }
    } finally {
      setIsChecking(false);
    }
  };

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
        <OrganizationProvider> {/* ✅ ADD THIS - WRAPS EVERYTHING */}
          <ThemeProvider>
            <NetworkProvider>
              <LanguageCheck />
              <SessionHandler />
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                <Stack.Screen name="ai-assistant" options={{ presentation: 'modal' }} />
              </Stack>
              <StatusBar style="auto" />
              <OfflineBanner />
              <ShekiAIFab />
              <Toast />
            </NetworkProvider>
          </ThemeProvider>
        </OrganizationProvider> {/* ✅ CLOSE */}
      </UserProvider>
    </SignUpProvider>
  );
}