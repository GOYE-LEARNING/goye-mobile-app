// hooks/usePushNotifications.ts
//
// Registers this device for Expo push notifications once the user is
// authenticated, so notifications reach them even while the app is closed
// or backgrounded (the one delivery path neither this app nor the web app
// had before). Also routes a tap on a push notification to the right
// in-app screen, matching how tapping an in-app notification row navigates.
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { registerPushToken, unregisterPushToken } from '@/services/api';

// Show an in-app banner/sound when a push arrives while the app is in the
// foreground — otherwise iOS/Android would silently drop it since there's no
// OS banner to show for an app that's already frontmost.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function getExpoPushToken(): Promise<string | null> {
  // Push tokens require a real device — the simulator/emulator has no APNs/FCM
  // registration and getExpoPushTokenAsync throws if forced to run there.
  if (!Device.isDevice) {
    console.log('[Push] Skipping registration on simulator/emulator');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('[Push] Permission not granted');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFA500',
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.error('[Push] No EAS projectId configured — cannot get a push token');
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (error) {
    console.error('[Push] Failed to get Expo push token:', error);
    return null;
  }
}

/** Where a push notification's own payload should take the reader — mirrors
 * the path logic the in-app notification list already uses (see
 * getNotificationPath on web), kept intentionally simple since a push
 * payload only carries a type/courseId/groupId, not a full role-aware path. */
function pathForNotification(data: Record<string, any> | undefined): string | null {
  if (!data) return null;
  if (data.courseId) return `/(tabs)/courses/${data.courseId}/overview`;
  if (data.groupId) return `/(tabs)/community/${data.groupId}`;
  switch (data.type) {
    case 'MESSAGE':
      return '/(tabs)/community/messages';
    case 'ACHIEVEMENT_UNLOCKED':
      return '/(tabs)/home/growth';
    default:
      return '/(tabs)/home/notifications';
  }
}

export function usePushNotifications() {
  const { isAuthenticated, token } = useUser();
  const registeredTokenRef = useRef<string | null>(null);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    if (isAuthenticated && token) {
      getExpoPushToken().then((expoPushToken) => {
        if (cancelled || !expoPushToken || expoPushToken === registeredTokenRef.current) return;
        registerPushToken(expoPushToken, token)
          .then(() => {
            registeredTokenRef.current = expoPushToken;
          })
          .catch((err) => console.error('[Push] Failed to register token with backend:', err));
      });
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  // A signed-out device shouldn't keep receiving push for whoever logs in
  // next on it.
  useEffect(() => {
    if (!isAuthenticated && registeredTokenRef.current && token) {
      unregisterPushToken(token).catch(() => {});
      registeredTokenRef.current = null;
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const path = pathForNotification(response.notification.request.content.data as any);
      if (path) router.push(path as any);
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);
}
