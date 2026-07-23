// app/(tabs)/courses/[id]/_layout.tsx
import { Stack } from "expo-router";

export default function CourseIdLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="overview" />
      <Stack.Screen name="quizzes" />
      <Stack.Screen name="materials" />
      <Stack.Screen name="forums" />
      <Stack.Screen name="quiz/[quizId]" />
    </Stack>
  );
}
// ```

// **File structure should be:**
// ```
// app/
// (auth)
//   (tabs)/
//     courses/
//       _layout.tsx
//       index.tsx
//       details.tsx
//       [id]/
//         _layout.tsx
//         overview.tsx
//         quizzes.tsx
//         materials.tsx
//         forums.tsx
//         quiz/
//           [quizId].tsx
//     home/