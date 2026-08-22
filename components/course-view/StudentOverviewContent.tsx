// components/course-view/StudentOverviewContent.tsx
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getCourse } from '@/services/api';
import { useTheme, lightColors } from '@/contexts/ThemeContext';

interface Props {
  courseData?: any;
  expandedModules: string[];
  toggleModule: (moduleId: string) => void;
  token?: string;
  onLessonSelect?: (lesson: any) => void;
  currentLessonId?: string;
}

export default function StudentOverviewContent({ 
  courseData: initialCourseData, 
  expandedModules, 
  toggleModule,
  token,
  onLessonSelect,
  currentLessonId
}: Props) {
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

  useEffect(() => {
    if (initialCourseData) {
      setCourseData(initialCourseData);
    }
  }, [initialCourseData]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCourse(params.id as string, token);
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
        <TouchableOpacity style={s.retryButton} onPress={loadCourseData}>
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
        {courseData.course_description || courseData.course_short_description || 'Discover what it means to truly follow Jesus in your daily life.'}
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
        <View style={s.infoItem}>
          <Ionicons name="bar-chart-outline" size={16} color={colors.textSecondary} />
          <Text style={s.infoText}>{courseData.course_level || 'All Levels'}</Text>
        </View>
      </View>

      {/* Course Content - Modules */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Course Content</Text>
        
        {courseData.module && courseData.module.length > 0 ? (
          courseData.module.map((module: any, index: number) => {
            const isExpanded = expandedModules.includes(module.id);
            const hasLessons = module.lesson && module.lesson.length > 0;
            const totalDuration = module.lesson?.reduce((total: number, lesson: any) => 
              total + (parseInt(lesson.duration) || 0), 0
            ) || parseInt(module.module_duration) || 0;

            return (
              <View key={module.id} style={s.moduleSection}>
                <TouchableOpacity 
                  style={s.moduleHeader}
                  onPress={() => hasLessons && toggleModule(module.id)}
                >
                  <View style={s.moduleHeaderContent}>
                    <View style={s.moduleTitleRow}>
                      <Text style={s.moduleTitle}>
                        {module.module_title || `Module ${index + 1}`}
                      </Text>
                      <Text style={s.moduleInfo}>
                        {module.lesson?.length || 0} lessons • {totalDuration} min
                      </Text>
                    </View>
                    {module.module_description && (
                      <Text style={s.moduleDescription}>
                        {module.module_description}
                      </Text>
                    )}
                  </View>
                  {hasLessons ? (
                    <Ionicons 
                      name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  ) : (
                    <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                  )}
                </TouchableOpacity>

                {/* Lessons List */}
                {isExpanded && hasLessons && (
                  <View style={s.lessonsList}>
                    {module.lesson.map((lesson: any, lessonIndex: number) => {
                      const isCurrentLesson = currentLessonId === lesson.id;
                      const hasVideo = lesson.lesson_video && lesson.lesson_video.trim() !== '';
                      
                      return (
                        <TouchableOpacity 
                          key={lesson.id} 
                          style={[
                            s.lessonItem,
                            lessonIndex % 2 === 0 ? s.lessonItemEven : s.lessonItemOdd,
                            isCurrentLesson && s.lessonItemActive
                          ]}
                          onPress={() => onLessonSelect && onLessonSelect(lesson)}
                        >
                          <View style={s.lessonCheckbox}>
                            {lesson.isCompleted ? (
                              <View style={s.checkboxFilled}>
                                <Ionicons name="checkmark" size={14} color="#fff" />
                              </View>
                            ) : isCurrentLesson ? (
                              <View style={s.checkboxPlaying}>
                                <Ionicons name="play" size={10} color="#fff" />
                              </View>
                            ) : (
                              <View style={s.checkboxEmpty} />
                            )}
                          </View>
                          <View style={s.lessonInfo}>
                            <Text style={[
                              s.lessonTitle,
                              isCurrentLesson && s.lessonTitleActive
                            ]}>
                              {lesson.lesson_title || `Lesson ${lessonIndex + 1}`}
                            </Text>
                            <View style={s.lessonDuration}>
                              {hasVideo ? (
                                <Ionicons 
                                  name="play-circle" 
                                  size={14} 
                                  color={isCurrentLesson ? colors.brand : colors.textSecondary} 
                                />
                              ) : (
                                <Ionicons name="document-text-outline" size={14} color={colors.textMuted} />
                              )}
                              <Text style={s.durationText}>
                                {lesson.duration || 0} min
                                {!hasVideo && ' • No video'}
                              </Text>
                            </View>
                          </View>
                          {hasVideo && (
                            <Ionicons 
                              name={isCurrentLesson ? 'volume-high' : 'play'} 
                              size={18} 
                              color={isCurrentLesson ? colors.brand : colors.textMuted} 
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={s.noContentText}>No course content available yet.</Text>
        )}
      </View>

      {/* Instructor Info */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Instructor</Text>
        <View style={s.instructorCard}>
          <View style={[s.instructorAvatar, { backgroundColor: colors.backgroundMuted }]}>
            <Text style={s.avatarText}>
              {courseData.createdBy?.charAt(0)?.toUpperCase() || 'I'}
            </Text>
          </View>
          <View>
            <Text style={s.instructorName}>
              {courseData.createdBy || 'Course Instructor'}
            </Text>
            <Text style={s.instructorTitle}>Course Creator</Text>
          </View>
        </View>
      </View>

      {/* Course Objectives - Dynamic from API */}
      {courseData.objectives && courseData.objectives.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>What You'll Learn</Text>
          <View style={s.outcomesList}>
            {courseData.objectives.map((objective: any, index: number) => {
              const titles = [
                objective.objective_title1,
                objective.objective_title2,
                objective.objective_title3,
                objective.objective_title4,
                objective.objective_title5,
              ].filter(t => t && t.trim() !== '');

              return titles.map((title: string, i: number) => (
                <View key={`${index}-${i}`} style={s.outcomeItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={s.outcomeText}>{title}</Text>
                </View>
              ));
            })}
          </View>
        </View>
      )}

      {/* Start Learning Button */}
      <TouchableOpacity 
        style={s.startButton}
        onPress={() => {
          // Find first lesson with video and select it
          if (courseData.module) {
            for (const mod of courseData.module) {
              if (mod.lesson) {
                const lessonWithVideo = mod.lesson.find(
                  (l: any) => l.lesson_video && l.lesson_video.trim() !== ''
                );
                if (lessonWithVideo && onLessonSelect) {
                  onLessonSelect(lessonWithVideo);
                  return;
                }
              }
            }
          }
        }}
      >
        <Text style={s.startButtonText}>Start Learning</Text>
      </TouchableOpacity>

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
      padding: 20 
    },
    errorText: { 
      fontSize: 14, 
      color: c.textMuted, 
      marginBottom: 16,
      textAlign: 'center'
    },
    retryButton: { 
      backgroundColor: c.brand, 
      paddingHorizontal: 24, 
      paddingVertical: 12, 
      borderRadius: 8 
    },
    retryText: { 
      color: '#fff', 
      fontSize: 14, 
      fontWeight: '600' 
    },
    courseDescription: { 
      fontSize: 14, 
      color: c.textSecondary, 
      lineHeight: 22, 
      marginBottom: 16 
    },
    infoRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 16, 
      marginBottom: 24, 
      flexWrap: 'wrap' 
    },
    infoItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 6 
    },
    infoText: { 
      fontSize: 13, 
      color: c.textSecondary 
    },
    section: { 
      marginTop: 24 
    },
    sectionTitle: { 
      fontSize: 18, 
      fontWeight: '600', 
      color: c.text, 
      marginBottom: 16 
    },
    moduleSection: { 
      backgroundColor: c.card, 
      borderRadius: 8, 
      marginBottom: 12, 
      shadowColor: c.shadow, 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 2, 
      elevation: 1, 
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border
    },
    moduleHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      padding: 16 
    },
    moduleHeaderContent: { 
      flex: 1 
    },
    moduleTitleRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      marginBottom: 6 
    },
    moduleTitle: { 
      fontSize: 16, 
      fontWeight: '600', 
      color: c.text, 
      flex: 1, 
      marginRight: 12 
    },
    moduleInfo: { 
      fontSize: 12, 
      color: c.textSecondary, 
      fontWeight: '500' 
    },
    moduleDescription: { 
      fontSize: 13, 
      color: c.textSecondary, 
      lineHeight: 18 
    },
    lessonsList: { 
      borderTopWidth: 1, 
      borderTopColor: c.border 
    },
    lessonItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingVertical: 12, 
      paddingHorizontal: 16, 
      gap: 12 
    },
    lessonItemEven: { 
      backgroundColor: c.backgroundSoft 
    },
    lessonItemOdd: { 
      backgroundColor: c.card 
    },
    lessonItemActive: { 
      backgroundColor: c.brandLighter, 
      borderLeftWidth: 3, 
      borderLeftColor: c.brand 
    },
    lessonCheckbox: { 
      width: 20, 
      height: 20 
    },
    checkboxEmpty: { 
      width: 20, 
      height: 20, 
      borderWidth: 2, 
      borderColor: c.brand, 
      backgroundColor: c.background, 
      borderRadius: 4 
    },
    checkboxFilled: { 
      width: 20, 
      height: 20, 
      backgroundColor: c.brand, 
      alignItems: 'center', 
      justifyContent: 'center', 
      borderRadius: 4 
    },
    checkboxPlaying: { 
      width: 20, 
      height: 20, 
      backgroundColor: c.brand, 
      borderRadius: 10, 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    lessonInfo: { 
      flex: 1 
    },
    lessonTitle: { 
      fontSize: 14, 
      color: c.text, 
      marginBottom: 4 
    },
    lessonTitleActive: { 
      color: c.brand, 
      fontWeight: '600' 
    },
    lessonDuration: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 4 
    },
    durationText: { 
      fontSize: 12, 
      color: c.textSecondary 
    },
    noContentText: { 
      fontSize: 14, 
      color: c.textMuted, 
      textAlign: 'center', 
      paddingVertical: 20, 
      fontStyle: 'italic' 
    },
    instructorCard: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 12, 
      backgroundColor: c.card, 
      padding: 16, 
      borderRadius: 8, 
      shadowColor: c.shadow, 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 2, 
      elevation: 1,
      borderWidth: 1,
      borderColor: c.border
    },
    instructorAvatar: { 
      width: 50, 
      height: 50, 
      borderRadius: 25, 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    avatarText: { 
      fontSize: 20, 
      fontWeight: '600', 
      color: c.textSecondary 
    },
    instructorName: { 
      fontSize: 16, 
      fontWeight: '600', 
      color: c.text 
    },
    instructorTitle: { 
      fontSize: 13, 
      color: c.textSecondary 
    },
    outcomesList: { 
      gap: 12 
    },
    outcomeItem: { 
      flexDirection: 'row', 
      alignItems: 'flex-start', 
      gap: 10 
    },
    outcomeText: { 
      fontSize: 14, 
      color: c.textSecondary, 
      flex: 1, 
      lineHeight: 20 
    },
    startButton: { 
      backgroundColor: c.brand, 
      paddingVertical: 16, 
      alignItems: 'center', 
      borderRadius: 8, 
      marginTop: 24 
    },
    startButtonText: { 
      color: '#fff', 
      fontSize: 16, 
      fontWeight: '600' 
    },
  });
}