// app/(tabs)/courses/_layout.tsx
import { Stack } from "expo-router";

export default function CoursesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}