// components/course-view/InstructorOverviewContent.tsx
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getCourse } from '@/services/api';
import { useTheme, lightColors } from '@/contexts/ThemeContext';

interface Props {
  courseData?: any;
  token?: string;
}

export default function InstructorOverviewContent({ courseData: initialCourseData, token }: Props) {
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const [courseData, setCourseData] = useState(initialCourseData);
  const [loading, setLoading] = useState(!initialCourseData);
  const [error, setError] = useState<string | null>(null);

  const s = makeStyles(colors);

  useEffect(() => {
    if (!initialCourseData && params.id) {
      loadCourseData();
    }
  }, [params.id, initialCourseData]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCourse(params.id as string, token);
      // Handle the response.data structure from your API
      setCourseData(response.data || response);
    } catch (err) {
      setError('Failed to load course data');
      console.error('Error loading course:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.centerContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.centerContainer}>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity 
          style={s.retryButton}
          onPress={loadCourseData}
        >
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!courseData) {
    return null;
  }

  return (
    <>
      {/* Course Description */}
      <Text style={s.courseDescription}>
        {courseData.course_description || courseData.course_short_description || 'Discover what it means to truly follow Jesus in your daily life. This foundational course helps you build strong spiritual habits, understand key biblical principles, and live as a disciple in your community.'}
      </Text>

      {/* Language and Students Info */}
      <View style={s.infoRow}>
        <View style={s.infoItem}>
          <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
          <Text style={s.infoText}>English (Auto)</Text>
        </View>
        <View style={s.infoItem}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={s.infoText}>{courseData.enrollment?.length || 0} students</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Action</Text>
        <View style={s.quickActionsRow}>
          <TouchableOpacity
            style={s.quickActionCard}
            onPress={() => router.push(`/(tabs)/courses/${params.id}/add-module` as any)}
          >
            <Ionicons name="add-circle-outline" size={28} color={colors.brand} />
            <Text style={s.quickActionText}>Add Module</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.quickActionCard}
            onPress={() => router.push(`/(tabs)/courses/${params.id}/add-quiz` as any)}
          >
            <Ionicons name="document-text-outline" size={28} color={colors.brand} />
            <Text style={s.quickActionText}>Create Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsContainer}>
        <View style={s.statCard}>
          <Text style={s.statNumber}>{courseData.enrollment?.length || 0}</Text>
          <Text style={s.statLabel}>Enrolled</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNumber}>{courseData.module?.length || 0}</Text>
          <Text style={s.statLabel}>Modules</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNumber}>{courseData.quiz?.length || 0}</Text>
          <Text style={s.statLabel}>Quizzes</Text>
        </View>
      </View>

      {/* View Content Button */}
      <TouchableOpacity 
        style={s.viewContentButton}
        onPress={() => {
          // Navigate to content view or handle accordingly
          console.log('View content pressed');
        }}
      >
        <Text style={s.viewContentText}>View Content</Text>
      </TouchableOpacity>

      {/* Activities */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Course Content</Text>

        {/* Modules */}
        {courseData.module && courseData.module.length > 0 ? (
          courseData.module.map((module: any, index: number) => (
            <View key={module.id} style={s.activityItem}>
              <View style={[s.activityIcon, { backgroundColor: colors.brandLighter }]}>
                <Ionicons name="book" size={20} color={colors.brand} />
              </View>
              <View style={s.activityContent}>
                <Text style={s.activityText}>
                  {module.module_title}
                </Text>
                <View style={s.activityTimeRow}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={s.activityTime}>
                    {module.module_duration} min • {module.lesson?.length || 0} lessons
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={s.noActivitiesText}>No modules yet</Text>
        )}

        {/* Materials */}
        {courseData.material && courseData.material.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 16 }]}>Materials</Text>
            {courseData.material.map((material: any, index: number) => (
              <View key={material.id} style={s.activityItem}>
                <View style={[s.activityIcon, { backgroundColor: colors.brandLighter }]}>
                  <Ionicons name="document-text" size={20} color={colors.brand} />
                </View>
                <View style={s.activityContent}>
                  <Text style={s.activityText}>
                    {material.material_title}
                  </Text>
                  <View style={s.activityTimeRow}>
                    <Text style={s.activityTime}>
                      {material.material_pages} pages
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      <View style={{ height: 40 }} />
    </>
  );
}

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 14,
      color: c.textMuted,
      marginBottom: 16,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: c.brand,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    courseDescription: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    infoText: {
      fontSize: 13,
      color: c.textSecondary,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
      marginBottom: 16,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    quickActionCard: {
      flex: 1,
      backgroundColor: c.card,
      padding: 24,
      borderRadius: 8,
      alignItems: 'center',
      gap: 12,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: 1,
      borderColor: c.border,
    },
    quickActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
      textAlign: 'center',
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 16,
      backgroundColor: c.cardContent,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: '700',
      color: c.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 11,
      color: c.textSecondary,
    },
    viewContentButton: {
      backgroundColor: c.backgroundSoft,
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: 8,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: c.border,
    },
    viewContentText: {
      color: c.text,
      fontSize: 15,
      fontWeight: '600',
    },
    activityItem: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityContent: {
      flex: 1,
      justifyContent: 'center',
    },
    activityText: {
      fontSize: 14,
      color: c.text,
      marginBottom: 4,
    },
    activityTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    activityTime: {
      fontSize: 12,
      color: c.textMuted,
    },
    noActivitiesText: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: 20,
    },
  });
}