// app/(admin)/users/_layout.tsx
//
// Without this nested Stack, the parent Tabs navigator treats every file in
// this folder as its own tab-level route and renders raw path names
// ("users/index", "users/[id]") straight into the tab bar. Mirrors how every
// folder under (tabs) already does it.
import { Stack } from 'expo-router';

export default function AdminUsersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
