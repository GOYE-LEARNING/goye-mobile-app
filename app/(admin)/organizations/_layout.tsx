// app/(admin)/organizations/_layout.tsx
//
// Platform-wide org management is super-admin only — the tab is already
// hidden for content_admin/user_admin, but guard here too so a deep link
// can't reach these screens. Mirrors (tabs)/organization/_layout.tsx.
import { Stack, Redirect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';

export default function AdminOrganizationsLayout() {
  const { isSuperAdmin } = useUser();

  if (!isSuperAdmin) {
    return <Redirect href="/(admin)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
