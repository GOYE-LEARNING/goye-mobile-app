// app/(tabs)/community/_layout.tsx
import { Stack } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[groupId]" />
    </Stack>
  );
}