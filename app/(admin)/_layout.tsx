import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';

export default function AdminLayout() {
  const { isAdmin, isSuperAdmin } = useUser();

  // Protect admin routes - only admins can access
  if (!isAdmin) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3F1F22',
        tabBarInactiveTintColor: 'grey',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
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

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* Hide the index route from tabs */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
    </Tabs>
  );
}