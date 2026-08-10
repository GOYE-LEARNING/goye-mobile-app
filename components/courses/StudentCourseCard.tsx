// components/courses/StudentCourseCard.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getImageUri } from '@/utils/helpers';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

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
  status: 'Enrolled' | 'Available' | 'Done';
  enrollment?: any[];
  completionRate?: number;
}

interface StudentCourseCardProps {
  course: Course;
}

export default function StudentCourseCard({ course }: StudentCourseCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Enrolled':  return '#2563EB';
      case 'Available': return '#8B5CF6';
      case 'Done':      return '#22c55e';
      default:          return colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Enrolled':  return t('courses.statusEnrolled');
      case 'Available': return t('courses.statusAvailable');
      case 'Done':      return t('courses.statusDone');
      default:          return status;
    }
  };

  const getButtonText = (status: string) => {
    switch (status) {
      case 'Enrolled':  return t('courses.continueCourse');
      case 'Available': return t('courses.startCourse');
      case 'Done':      return t('courses.reviewCourse');
      default:          return t('courses.viewCourse');
    }
  };

  const imageUri = getImageUri(course.course_image);

  const getEnrollmentCount = () => {
    if (!course.enrollment) return 0;
    if (Array.isArray(course.enrollment)) return course.enrollment.length;
    return 0;
  };

  const enrollmentCount = getEnrollmentCount();
  const s = makeStyles(colors);

  return (
    <TouchableOpacity
      style={s.courseCard}
      onPress={() => router.push(`/(tabs)/courses/details?id=${course.id}`)}
    >
      <View style={s.courseCardContent}>
        <View style={s.thumbnailContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={s.courseThumbnail} contentFit="cover" />
          ) : (
            <View style={[s.courseThumbnail, s.placeholderImage]}>
              <Ionicons name="book-outline" size={32} color={colors.textMuted} />
            </View>
          )}
          <TouchableOpacity style={s.bookmarkButton}>
            <Ionicons
              name={course.saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={colors.brand}
            />
          </TouchableOpacity>
        </View>

        <View style={s.courseContent}>
          <View style={s.courseTitleRow}>
            <Text style={s.courseTitle} numberOfLines={2}>{course.course_title}</Text>
            <Text style={[s.statusBadge, { color: getStatusColor(course.status) }]}>
              {getStatusLabel(course.status)}
            </Text>
          </View>

          <Text style={s.courseDescription} numberOfLines={2}>
            {course.course_description || course.course_short_description}
          </Text>

          <View style={s.courseMeta}>
            <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
            <Text style={s.metaText}>{course.createdBy}</Text>
          </View>

          <View style={s.courseMeta}>
            <Ionicons name="bar-chart-outline" size={14} color={colors.success} />
            <Text style={s.metaText}>{course.course_level}</Text>
          </View>

          <View style={s.studentStats}>
            <View style={s.statItem}>
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
              <Text style={s.metaText}>{t('courses.enrolledCount', { count: enrollmentCount })}</Text>
            </View>
            {course.status === 'Done' && (
              <View style={s.statItem}>
                <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                <Text style={s.metaText}>{t('courses.completed')}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={s.actionButton}
        onPress={() => router.push(`/(tabs)/courses/details?id=${course.id}`)}
      >
        <Text style={s.actionButtonText}>{getButtonText(course.status)}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    courseCard: {
      backgroundColor: c.card,
      marginBottom: 20,
      borderRadius: 8,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    },
    courseCardContent:  { flexDirection: 'row', padding: 16, gap: 12 },
    thumbnailContainer: { position: 'relative' },
    courseThumbnail:    { width: 80, height: 120, borderRadius: 6, backgroundColor: c.backgroundMuted },
    placeholderImage:   { alignItems: 'center', justifyContent: 'center' },
    bookmarkButton: {
      position: 'absolute', top: 6, right: 6,
      width: 28, height: 28,
      backgroundColor: c.background,
      alignItems: 'center', justifyContent: 'center', borderRadius: 4,
    },
    courseContent:    { flex: 1, justifyContent: 'space-between' },
    courseTitleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    courseTitle:      { flex: 1, fontSize: 15, fontWeight: '600', color: c.text, marginRight: 8 },
    statusBadge:      { fontSize: 11, fontWeight: '600' },
    courseDescription:{ fontSize: 12, color: c.textSecondary, lineHeight: 16, marginBottom: 8 },
    courseMeta:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    metaText:         { fontSize: 11, color: c.textSecondary },
    studentStats:     { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 4 },
    statItem:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionButton:     { backgroundColor: c.brand, paddingVertical: 12, alignItems: 'center', marginHorizontal: 16, marginBottom: 16, borderRadius: 6 },
    actionButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  });
}