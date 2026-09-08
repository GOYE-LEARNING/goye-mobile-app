// components/course-view/InstructorOverviewContent.tsx
import { lightColors, useTheme } from "@/contexts/ThemeContext";
import { getCourse } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  courseData?: any;
  token?: string;
  onLessonSelect?: (lesson: any) => void;
  currentLessonId?: string;
}

export default function InstructorOverviewContent({
  courseData: initialCourseData,
  token,
  onLessonSelect,
  currentLessonId,
}: Props) {
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const [courseData, setCourseData] = useState(initialCourseData);
  const [loading, setLoading] = useState(!initialCourseData);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const s = makeStyles(colors);

  useEffect(() => {
    if (!initialCourseData && params.id) {
      loadCourseData();
    }
  }, [params.id, initialCourseData]);

  useEffect(() => {
    if (initialCourseData) {
      setCourseData(initialCourseData);
      if (initialCourseData.module && initialCourseData.module.length > 0) {
        setExpandedModules([initialCourseData.module[0].id]);
      }
    }
  }, [initialCourseData]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCourse(params.id as string, token);
      setCourseData(response.data || response);
    } catch (err) {
      setError("Failed to load course data");
      console.error("Error loading course:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
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
        {courseData.course_description ||
          courseData.course_short_description ||
          "Discover what it means to truly follow Jesus in your daily life."}
      </Text>

      {/* Language and Students Info */}
      <View style={s.infoRow}>
        <View style={s.infoItem}>
          <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
          <Text style={s.infoText}>English (Auto)</Text>
        </View>
        <View style={s.infoItem}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={s.infoText}>
            {courseData.enrollment?.length || 0} students
          </Text>
        </View>
        <View style={s.infoItem}>
          <Ionicons name="bar-chart-outline" size={16} color={colors.textSecondary} />
          <Text style={s.infoText}>{courseData.course_level || "All Levels"}</Text>
        </View>
      </View>

      {/* Stats Cards */}
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

      {/* Course Content - Modules (clickable lessons, no edit icons) */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Course Content</Text>

        {courseData.module && courseData.module.length > 0 ? (
          courseData.module.map((module: any, index: number) => {
            const isExpanded = expandedModules.includes(module.id);
            const hasLessons = module.lesson && module.lesson.length > 0;
            const totalDuration =
              module.lesson?.reduce(
                (total: number, lesson: any) => total + (parseInt(lesson.duration) || 0),
                0
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
                      name={isExpanded ? "chevron-down" : "chevron-forward"}
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
                      const hasVideo =
                        lesson.lesson_video && lesson.lesson_video.trim() !== "";
                      const isCurrent = currentLessonId === lesson.id;

                      return (
                        <TouchableOpacity
                          key={lesson.id}
                          style={[
                            s.lessonItem,
                            lessonIndex % 2 === 0 ? s.lessonItemEven : s.lessonItemOdd,
                            isCurrent && s.lessonItemActive,
                          ]}
                          onPress={() => onLessonSelect && onLessonSelect(lesson)}
                        >
                          {/* Empty checkbox placeholder */}
                          <View style={s.lessonCheckbox}>
                            <View style={s.checkboxEmpty} />
                          </View>
                          <View style={s.lessonInfo}>
                            <Text
                              style={[
                                s.lessonTitle,
                                isCurrent && s.lessonTitleActive,
                              ]}
                            >
                              {lesson.lesson_title || `Lesson ${lessonIndex + 1}`}
                            </Text>
                            <View style={s.lessonDuration}>
                              {hasVideo ? (
                                <Ionicons
                                  name="play-circle"
                                  size={14}
                                  color={isCurrent ? colors.brand : colors.textSecondary}
                                />
                              ) : (
                                <Ionicons
                                  name="document-text-outline"
                                  size={14}
                                  color={colors.textMuted}
                                />
                              )}
                              <Text style={s.durationText}>
                                {lesson.duration || 0} min
                                {!hasVideo && " • No video"}
                              </Text>
                            </View>
                          </View>
                          {/* ✅ No pencil icon */}
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

      {/* Quick Actions - Add Module/Quiz */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickActionsRow}>
          <TouchableOpacity
            style={s.quickActionCard}
            onPress={() =>
              router.push(`/(tabs)/courses/${params.id}/add-module` as any)
            }
          >
            <Ionicons name="add-circle-outline" size={28} color={colors.brand} />
            <Text style={s.quickActionText}>Add Module</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.quickActionCard}
            onPress={() =>
              router.push(`/(tabs)/courses/${params.id}/add-quiz` as any)
            }
          >
            <Ionicons name="document-text-outline" size={28} color={colors.brand} />
            <Text style={s.quickActionText}>Create Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </>
  );
}

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      fontSize: 14,
      color: c.textMuted,
      marginBottom: 16,
      textAlign: "center",
    },
    retryButton: {
      backgroundColor: c.brand,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    courseDescription: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 24,
      flexWrap: "wrap",
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    infoText: {
      fontSize: 13,
      color: c.textSecondary,
    },
    statsContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 16,
      backgroundColor: c.cardContent,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: "700",
      color: c.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 11,
      color: c.textSecondary,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: c.text,
      marginBottom: 16,
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
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.border,
    },
    moduleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: 16,
    },
    moduleHeaderContent: {
      flex: 1,
    },
    moduleTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    moduleTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
      flex: 1,
      marginRight: 12,
    },
    moduleInfo: {
      fontSize: 12,
      color: c.textSecondary,
      fontWeight: "500",
    },
    moduleDescription: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 18,
    },
    lessonsList: {
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    lessonItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 12,
    },
    lessonItemEven: {
      backgroundColor: c.backgroundSoft,
    },
    lessonItemOdd: {
      backgroundColor: c.card,
    },
    lessonItemActive: {
      backgroundColor: c.brandLighter,
      borderLeftWidth: 3,
      borderLeftColor: c.brand,
    },
    lessonCheckbox: {
      width: 20,
      height: 20,
    },
    checkboxEmpty: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: c.brand,
      backgroundColor: c.background,
      borderRadius: 4,
    },
    lessonInfo: {
      flex: 1,
    },
    lessonTitle: {
      fontSize: 14,
      color: c.text,
      marginBottom: 4,
    },
    lessonTitleActive: {
      color: c.brand,
      fontWeight: "600",
    },
    lessonDuration: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    durationText: {
      fontSize: 12,
      color: c.textSecondary,
    },
    noContentText: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: "center",
      paddingVertical: 20,
      fontStyle: "italic",
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: 12,
    },
    quickActionCard: {
      flex: 1,
      backgroundColor: c.card,
      padding: 24,
      borderRadius: 8,
      alignItems: "center",
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
      fontWeight: "600",
      color: c.text,
      textAlign: "center",
    },
  });
}