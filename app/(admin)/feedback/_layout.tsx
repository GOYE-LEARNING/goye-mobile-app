// app/(admin)/feedback/_layout.tsx
import { Stack } from 'expo-router';

export default function FeedbackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
