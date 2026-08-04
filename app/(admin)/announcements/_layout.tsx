// app/(admin)/announcements/_layout.tsx
//
// Platform-wide screens are super-admin only. The nested Stack also keeps
// these routes out of the parent Tabs bar (see users/_layout.tsx).
import { Stack, Redirect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';

export default function AdminannouncementsLayout() {
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
