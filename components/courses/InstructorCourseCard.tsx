// components/courses/InstructorCourseCard.tsx
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getImageUri } from '@/utils/helpers';
import { useTheme } from '@/contexts/ThemeContext';

interface Course {
  id: string;
  course_title: string;
  course_short_description: string;
  course_description: string;
  course_level: string;
  course_image: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdUserId: string;
  saved: boolean;
  enrolledCount?: number;
  completionRate?: number;
  total_enrollments?: number;
}

export default function InstructorCourseCard({ course }: { course: Course }) {
  const { colors } = useTheme();
  const imageUri = getImageUri(course.course_image);
  const s = makeStyles(colors);

  return (
    <TouchableOpacity
      style={s.courseCard}
      onPress={() => router.push(`/(tabs)/courses/${course.id}/overview`)}
    >
      <View style={s.courseCardContent}>
        <View style={s.thumbnailContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={s.courseThumbnail} resizeMode="cover" />
          ) : (
            <View style={[s.courseThumbnail, s.placeholderImage]}>
              <Ionicons name="book-outline" size={32} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={s.courseContent}>
          <Text style={s.courseTitle} numberOfLines={2}>{course.course_title}</Text>

          <Text style={s.courseDescription} numberOfLines={2}>
            {course.course_description || course.course_short_description}
          </Text>

          <View style={s.courseMeta}>
            <Ionicons name="bar-chart-outline" size={14} color={colors.success} />
            <Text style={s.metaText}>{course.course_level}</Text>
          </View>

          <View style={s.courseMeta}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={s.metaText}>Created: {new Date(course.createdAt).toLocaleDateString()}</Text>
          </View>

          <View style={s.instructorStats}>
            <View style={s.statItem}>
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
              <Text style={s.metaText}>{course.total_enrollments || 0} enrolled</Text>
            </View>
            <View style={s.statItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
              <Text style={s.metaText}>{course.completionRate || 0}% completion</Text>
            </View>
          </View>

          <View style={s.instructorInfo}>
            <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
            <Text style={s.instructorText}>By {course.createdBy}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={s.actionButton}
        onPress={() => router.push(`/(tabs)/courses/${course.id}/overview`)}
      >
        <Text style={s.actionButtonText}>View Course</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    courseCard:        { backgroundColor: c.card, marginBottom: 20, borderRadius: 8, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
    courseCardContent: { flexDirection: 'row', padding: 16, gap: 12 },
    thumbnailContainer:{ position: 'relative' },
    courseThumbnail:   { width: 80, height: 120, borderRadius: 6, backgroundColor: c.backgroundMuted },
    placeholderImage:  { alignItems: 'center', justifyContent: 'center' },
    courseContent:     { flex: 1, justifyContent: 'space-between' },
    courseTitle:       { fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 6 },
    courseDescription: { fontSize: 12, color: c.textSecondary, lineHeight: 16, marginBottom: 8 },
    courseMeta:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    metaText:          { fontSize: 11, color: c.textSecondary },
    instructorStats:   { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 4 },
    statItem:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
    instructorInfo:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    instructorText:    { fontSize: 11, color: c.textSecondary, fontStyle: 'italic' },
    actionButton:      { backgroundColor: c.brand, paddingVertical: 12, alignItems: 'center', marginHorizontal: 16, marginBottom: 16, borderRadius: 6 },
    actionButtonText:  { color: '#fff', fontSize: 15, fontWeight: '600' },
  });
}