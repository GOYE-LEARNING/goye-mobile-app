import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminLayout() {
  const { isAdmin, isSuperAdmin, logout } = useUser();
  // These were hardcoded light-mode colours, so the whole admin tab bar
  // stayed white-on-white in dark mode while every other tab bar in the app
  // followed the theme. Matches (tabs)/_layout.tsx now.
  const { colors, isDark } = useTheme();

  // Super Admin is web-only. login.tsx and useGoogleSignIn.ts already block
  // this at sign-in, but this guard catches any session that predates that
  // change (still in AsyncStorage from an older app version) or a
  // content/user admin promoted to super_admin server-side mid-session.
  const hasWarnedSuperAdmin = useRef(false);
  useEffect(() => {
    if (isAdmin && isSuperAdmin && !hasWarnedSuperAdmin.current) {
      hasWarnedSuperAdmin.current = true;
      Alert.alert(
        'Web Only',
        'Super Admin access is only available on the GOYE web dashboard. Please sign in from a web browser.'
      );
      logout();
    }
  }, [isAdmin, isSuperAdmin]);

  // Protect admin routes - only admins can access, and super admins are
  // redirected away (handled by the effect above, which logs them out).
  if (!isAdmin || isSuperAdmin) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: isDark ? '#666666' : 'grey',
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />

      {/* Platform-wide org management is super-admin only (content_admin/
          user_admin stay on the single-scope courses/users experience) —
          mirrors web's separate dashboard/super-admin route tree. */}
      <Tabs.Screen
        name="organizations"
        options={
          isSuperAdmin
            ? {
                title: 'Orgs',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="business" size={size} color={color} />
                ),
              }
            : { href: null }
        }
      />

      {/* Reached from the dashboard's Platform section rather than the tab
          bar — web can afford 7 sidenav entries, but 8 bottom tabs would be
          unusable. Declared here (href: null) so Expo Router doesn't
          auto-add them as tabs showing raw route names. */}
      <Tabs.Screen name="activity" options={{ href: null }} />
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="announcements" options={{ href: null }} />
      <Tabs.Screen name="feedback" options={{ href: null }} />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}