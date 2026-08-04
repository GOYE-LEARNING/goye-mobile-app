// app/(admin)/home/_layout.tsx
import { Stack } from 'expo-router';

export default function AdminHomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
