// components/course-view/InstructorOverviewContent.tsx
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getCourse } from '@/services/api';

interface Props {
  courseData?: any;
  token?: string;
}

export default function InstructorOverviewContent({ courseData: initialCourseData }: Props) {
  const params = useLocalSearchParams();
  const [courseData, setCourseData] = useState(initialCourseData);
  const [loading, setLoading] = useState(!initialCourseData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialCourseData && params.id) {
      loadCourseData();
    }
  }, [params.id, initialCourseData]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCourse(params.id as string);
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3F1F22" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadCourseData}
        >
          <Text style={styles.retryText}>Retry</Text>
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
      <Text style={styles.courseDescription}>
        {courseData.course_description || courseData.course_short_description || 'Discover what it means to truly follow Jesus in your daily life. This foundational course helps you build strong spiritual habits, understand key biblical principles, and live as a disciple in your community.'}
      </Text>

      {/* Language and Students Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="globe-outline" size={16} color="#666" />
          <Text style={styles.infoText}>English (Auto)</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{courseData.enrollment?.length || 0} students</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Action</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push(`/(tabs)/courses/${params.id}/add-module` as any)}
          >
            <Ionicons name="add-circle-outline" size={28} color="#3F1F22" />
            <Text style={styles.quickActionText}>Add Module</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push(`/(tabs)/courses/${params.id}/add-quiz` as any)}
          >
            <Ionicons name="document-text-outline" size={28} color="#3F1F22" />
            <Text style={styles.quickActionText}>Create Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{courseData.enrollment?.length || 0}</Text>
          <Text style={styles.statLabel}>Enrolled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{courseData.module?.length || 0}</Text>
          <Text style={styles.statLabel}>Modules</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{courseData.quiz?.length || 0}</Text>
          <Text style={styles.statLabel}>Quizzes</Text>
        </View>
      </View>

      {/* View Content Button */}
      <TouchableOpacity 
        style={styles.viewContentButton}
        onPress={() => {
          // Navigate to content view or handle accordingly
          console.log('View content pressed');
        }}
      >
        <Text style={styles.viewContentText}>View Content</Text>
      </TouchableOpacity>

      {/* Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Course Content</Text>

        {/* Modules */}
        {courseData.module && courseData.module.length > 0 ? (
          courseData.module.map((module: any, index: number) => (
            <View key={module.id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#EBF5FF' }]}>
                <Ionicons name="book" size={20} color="#2563EB" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  {module.module_title}
                </Text>
                <View style={styles.activityTimeRow}>
                  <Ionicons name="time-outline" size={14} color="#999" />
                  <Text style={styles.activityTime}>
                    {module.module_duration} min • {module.lesson?.length || 0} lessons
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noActivitiesText}>No modules yet</Text>
        )}

        {/* Materials */}
        {courseData.material && courseData.material.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Materials</Text>
            {courseData.material.map((material: any, index: number) => (
              <View key={material.id} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="document-text" size={20} color="#F59E0B" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    {material.material_title}
                  </Text>
                  <View style={styles.activityTimeRow}>
                    <Text style={styles.activityTime}>
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

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3F1F22',
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
    color: '#666',
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
    color: '#666',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  viewContentButton: {
    backgroundColor: '#E8E8E8',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 24,
  },
  viewContentText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    color: '#333',
    marginBottom: 4,
  },
  activityTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  noActivitiesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});