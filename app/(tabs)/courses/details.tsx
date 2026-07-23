import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { getCourse, enrollInCourse } from '@/services/api';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageUri } from '@/utils/helpers';

export default function CourseDetails() {
  const params = useLocalSearchParams();
  const courseId = params.id as string;
  const { user, token } = useUser();
  const { colors } = useTheme();
  
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (courseId) {
        loadCourseData();
      }
    }, [courseId])
  );

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCourse(courseId, token || undefined);
      
      if (response.data) {
        setCourseData(response.data);
        
        // Check if user is enrolled
        const userIsEnrolled = response.data.enrollment?.some((e: any) => 
          e.studentId === user?.id || e.userId === user?.id
        ) || false;
        
        setIsEnrolled(userIsEnrolled);
        console.log('👤 Is user enrolled?', userIsEnrolled);
      } else {
        setError(response.message || 'No course data found');
      }
    } catch (err: any) {
      console.error('Error loading course:', err);
      setError(err.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (enrolling) return;
    
    try {
      setEnrolling(true);
      console.log('🎓 Enrolling in course...');
      
      const result = await enrollInCourse(courseId, token);
      
      console.log('✅ Enrollment successful:', result);
      setIsEnrolled(true);
      
      Alert.alert('Success', 'You have been enrolled in this course!', [
        { 
          text: 'Start Learning', 
          onPress: () => router.push(`/(tabs)/courses/${courseId}/overview` as any)
        }
      ]);
      
      // Refresh course data to get updated enrollment count
      await loadCourseData();
      
    } catch (error: any) {
      console.error('❌ Error enrolling:', error);
      
      // Check if already enrolled error
      if (error.message?.includes('already enrolled') || error.message?.includes('Already enrolled')) {
        setIsEnrolled(true);
        Alert.alert('Already Enrolled', 'You are already enrolled in this course');
      } else {
        Alert.alert('Error', error.message || 'Failed to enroll in course. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleContinue = () => {
    router.push(`/(tabs)/courses/${courseId}/overview` as any);
  };

  const toggleModule = (moduleId: string) => {
    if (expandedModules.includes(moduleId)) {
      setExpandedModules(expandedModules.filter(id => id !== moduleId));
    } else {
      setExpandedModules([...expandedModules, moduleId]);
    }
  };

  const s = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Course Details</Text>
          <View style={s.shareButton} />
        </View>
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading course details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !courseData) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Course Details</Text>
          <View style={s.shareButton} />
        </View>
        <View style={s.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={s.errorText}>{error || 'Course not found'}</Text>
          <TouchableOpacity 
            style={s.retryButton}
            onPress={loadCourseData}
          >
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate total duration and lessons from modules
  const totalDuration = courseData.module?.reduce((total: number, module: any) => {
    return total + (parseInt(module.module_duration) || 0);
  }, 0) || 0;

  const totalLessons = courseData.module?.reduce((total: number, module: any) => 
    total + (module.lesson?.length || 0), 0) || 0;

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const courseImageUri = courseData.course_image ? getImageUri(courseData.course_image) : null;
  const enrollmentCount = courseData.enrollment?.length || 0;

  // Get objectives from courseData or use defaults
  const objectives = courseData.objectives?.[0] ? [
    courseData.objectives[0].objective_title1,
    courseData.objectives[0].objective_title2,
    courseData.objectives[0].objective_title3,
    courseData.objectives[0].objective_title4,
    courseData.objectives[0].objective_title5,
  ].filter(Boolean) : [];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Course Details</Text>
        <TouchableOpacity style={s.shareButton}>
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Course Title Section */}
        <View style={s.titleSection}>
          <Text style={s.courseTitle}>{courseData.course_title}</Text>
          
          {/* Course Meta Info */}
          <View style={s.courseMetaInfo}>
            <View style={s.metaTag}>
              <Ionicons name="bar-chart-outline" size={14} color={colors.success} />
              <Text style={s.metaTagText}>{courseData.course_level || 'All Levels'}</Text>
            </View>
            <View style={[s.metaDivider, { backgroundColor: colors.borderMid }]} />
            <Text style={s.metaInfoText}>{formatDuration(totalDuration)}</Text>
            <View style={[s.metaDivider, { backgroundColor: colors.borderMid }]} />
            <Text style={s.metaInfoText}>{totalLessons} Lessons</Text>
          </View>
        </View>

        {/* Course Hero Image */}
        <View style={s.imageContainer}>
          {courseImageUri ? (
            <Image 
              source={{ uri: courseImageUri }} 
              style={s.heroImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={[s.heroImagePlaceholder, { backgroundColor: colors.backgroundMuted }]}>
              <Ionicons name="book-outline" size={40} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={s.content}>
          {/* Course Description */}
          <Text style={s.courseDescription}>
            {courseData.course_description || courseData.course_short_description || 'No description available.'}
          </Text>

          {/* Students Count */}
          <View style={s.studentsInfo}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={s.studentsText}>
              {enrollmentCount} students enrolled
            </Text>
          </View>

          {/* Learning Objectives */}
          {objectives.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Learning Objectives</Text>
              {objectives.map((objective, index) => (
                <View key={index} style={s.objectiveItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={s.objectiveText}>{objective}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Enroll / Continue Button */}
          <TouchableOpacity 
            style={[
              s.actionButton,
              isEnrolled && s.continueButton,
              enrolling && s.disabledButton
            ]}
            onPress={isEnrolled ? handleContinue : handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons 
                  name={isEnrolled ? "play-circle-outline" : "add-circle-outline"} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={s.actionButtonText}>
                  {isEnrolled ? 'Continue Course' : 'Enroll Now'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Lessons/Modules */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Course Content</Text>
            {courseData.module && courseData.module.length > 0 ? (
              courseData.module.map((module: any, moduleIndex: number) => {
                const isExpanded = expandedModules.includes(module.id);

                return (
                  <View key={module.id} style={s.moduleContainer}>
                    {/* Module Header (Accordion Trigger) */}
                    <TouchableOpacity 
                      style={s.moduleHeader}
                      onPress={() => toggleModule(module.id)}
                    >
                      <View style={s.moduleNumberBadge}>
                        <Text style={s.moduleNumberText}>{moduleIndex + 1}</Text>
                      </View>
                      <View style={s.moduleContent}>
                        <Text style={s.moduleTitle}>{module.module_title}</Text>
                        {module.module_description && (
                          <Text style={s.moduleDescription} numberOfLines={2}>
                            {module.module_description}
                          </Text>
                        )}
                        <Text style={s.moduleDuration}>
                          {module.lesson?.length || 0} lessons • {module.module_duration} min
                        </Text>
                      </View>
                      <Ionicons 
                        name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </TouchableOpacity>

                    {/* Module Lessons (Accordion Content) */}
                    {isExpanded && module.lesson && module.lesson.length > 0 && (
                      <View style={s.lessonsContainer}>
                        {module.lesson.map((lesson: any, index: number) => (
                          <View key={lesson.id} style={s.lessonItem}>
                            <View style={[s.lessonNumber, { backgroundColor: colors.backgroundSoft }]}>
                              <Text style={s.lessonNumberText}>{index + 1}</Text>
                            </View>
                            <View style={s.lessonInfo}>
                              <Text style={s.lessonTitle}>
                                {lesson.lesson_title || `Lesson ${index + 1}`}
                              </Text>
                              {lesson.lesson_duration && (
                                <Text style={s.lessonDuration}>
                                  {lesson.lesson_duration} min
                                </Text>
                              )}
                            </View>
                            <Ionicons name="play-circle-outline" size={20} color={colors.brand} />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={s.noContentText}>No course content available yet.</Text>
            )}
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      borderBottomWidth: 1, 
      borderBottomColor: c.border 
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
    shareButton: { padding: 4, width: 32 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 12, fontSize: 14, color: c.textSecondary },
    errorText: { fontSize: 14, color: c.textMuted, marginBottom: 16, textAlign: 'center' },
    retryButton: { backgroundColor: c.brand, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    titleSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    courseTitle: { fontSize: 20, fontWeight: '700', color: c.text, marginBottom: 12 },
    courseMetaInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaTag: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 4, 
      paddingHorizontal: 8, 
      paddingVertical: 4, 
      borderRadius: 4, 
      backgroundColor: c.backgroundSoft 
    },
    metaTagText: { fontSize: 12, fontWeight: '600', color: c.success },
    metaDivider: { width: 1, height: 12 },
    metaInfoText: { fontSize: 12, color: c.textSecondary, fontWeight: '500' },
    imageContainer: { paddingHorizontal: 20, marginBottom: 16 },
    heroImage: { width: '100%', height: 180, backgroundColor: c.backgroundMuted, borderRadius: 8 },
    heroImagePlaceholder: { width: '100%', height: 180, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: 20 },
    courseDescription: { fontSize: 14, color: c.textSecondary, lineHeight: 22, marginBottom: 12 },
    studentsInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
    studentsText: { fontSize: 13, color: c.textSecondary },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: c.text, marginBottom: 16 },
    objectiveItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
    objectiveText: { flex: 1, fontSize: 14, color: c.textSecondary, lineHeight: 20 },
    actionButton: { 
      backgroundColor: c.brand, 
      paddingVertical: 14, 
      borderRadius: 8, 
      alignItems: 'center', 
      marginBottom: 24, 
      flexDirection: 'row', 
      justifyContent: 'center', 
      gap: 8 
    },
    continueButton: { backgroundColor: c.brand },
    disabledButton: { opacity: 0.6 },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    moduleContainer: { 
      marginBottom: 12, 
      borderWidth: 1, 
      borderColor: c.border, 
      borderRadius: 8, 
      overflow: 'hidden' 
    },
    moduleHeader: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      padding: 16, 
      backgroundColor: c.backgroundSoft 
    },
    moduleNumberBadge: { 
      width: 32, 
      height: 32, 
      borderRadius: 4, 
      backgroundColor: c.brand, 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginRight: 12 
    },
    moduleNumberText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    moduleContent: { flex: 1 },
    moduleTitle: { fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 4 },
    moduleDescription: { fontSize: 13, color: c.textSecondary, marginBottom: 4, lineHeight: 18 },
    moduleDuration: { fontSize: 12, color: c.textMuted },
    lessonsContainer: { backgroundColor: c.card, paddingHorizontal: 16 },
    lessonItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingVertical: 12, 
      borderBottomWidth: 1, 
      borderBottomColor: c.border 
    },
    lessonNumber: { 
      width: 24, 
      height: 24, 
      borderRadius: 12, 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginRight: 12 
    },
    lessonNumberText: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
    lessonInfo: { flex: 1 },
    lessonTitle: { fontSize: 14, color: c.text, fontWeight: '500', marginBottom: 2 },
    lessonDuration: { fontSize: 12, color: c.textMuted },
    noContentText: { fontSize: 14, color: c.textMuted, textAlign: 'center', paddingVertical: 20, fontStyle: 'italic' },
  });
}