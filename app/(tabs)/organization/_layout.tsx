// app/(tabs)/organization/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { useUser } from "@/contexts/UserContext";

export default function OrganizationLayout() {
  const { isOrganizationAdmin } = useUser();

  // These screens manage a single organization's members, events and invites.
  // The backend also enforces org_admin, but guard here so a deep link from a
  // non-admin account redirects instead of rendering empty management screens.
  if (!isOrganizationAdmin) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="members" />
      <Stack.Screen name="members/[userId]" />
      <Stack.Screen name="events" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="invited" />
      <Stack.Screen name="courses" />
      <Stack.Screen name="activity" />
    </Stack>
  );
}
