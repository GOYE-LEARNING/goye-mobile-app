// app/(admin)/profile/_layout.tsx
import { Stack } from 'expo-router';

export default function AdminProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
