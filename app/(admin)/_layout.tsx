import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminLayout() {
  const { isAdmin, isSuperAdmin } = useUser();
  // These were hardcoded light-mode colours, so the whole admin tab bar
  // stayed white-on-white in dark mode while every other tab bar in the app
  // followed the theme. Matches (tabs)/_layout.tsx now.
  const { colors, isDark } = useTheme();

  // Protect admin routes - only admins can access
  if (!isAdmin) {
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