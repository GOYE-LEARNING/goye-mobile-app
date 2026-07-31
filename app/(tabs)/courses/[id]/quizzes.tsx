// app/(tabs)/courses/[id]/quizzes.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/constants/config';

export default function Quizzes() {
  const params = useLocalSearchParams();
  const { user, token, isInstructor } = useUser();
  const { colors } = useTheme();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [params.id]);

  const fetchCourseData = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/course/get-course/${params.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        setCourse(result.data);
      }
    } catch (err) {
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.errorContainer}>
          <Text style={{ color: colors.text }}>Course not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.brand }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = isInstructor && course.createdUserId === user?.id;
  const quizzes = course.quiz || [];

  // Each quiz already includes every student's QuizAttempt records (from
  // GET /course/get-course/:id) — filter to the current user's own
  // completed attempt to get real completion/score, no extra fetch needed.
  const getMyAttempt = (quiz: any) =>
    quiz.QuizAttempt?.find((a: any) => a.userId === user?.id && a.completed);

  const completedQuizzes = quizzes.filter((q: any) => !!getMyAttempt(q)).length;
  const totalQuizzes = quizzes.length;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {isOwner ? 'Course Details' : course.course_title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Course Info - Show for instructors */}
        {isOwner && (
          <View style={s.courseInfo}>
            <Text style={s.courseTitle}>{course.course_title}</Text>
            <View style={s.courseMeta}>
              <View style={s.metaItem}>
                <Ionicons name="bar-chart-outline" size={14} color={colors.success} />
                <Text style={s.metaText}>{course.course_level}</Text>
              </View>
              <View style={[s.metaDivider, { backgroundColor: colors.borderMid }]} />
              <Text style={s.metaText}>{course.module?.length || 0} modules</Text>
            </View>
          </View>
        )}

        {/* Image */}
        {course.course_image ? (
          <Image 
            source={{ uri: `data:image/jpeg;base64,${course.course_image}` }}
            style={s.imagePlaceholder}
            contentFit="cover"
          />
        ) : (
          <View style={[s.imagePlaceholder, { backgroundColor: colors.backgroundMuted, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="book-outline" size={48} color={colors.textMuted} />
          </View>
        )}

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity 
            style={s.tab}
            onPress={() => router.replace(`/(tabs)/courses/${params.id}/overview` as any)}
          >
            <Text style={s.tabText}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, s.tabActive]}>
            <Text style={[s.tabText, s.tabTextActive]}>Quizzes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={s.tab}
            onPress={() => router.replace(`/(tabs)/courses/${params.id}/materials` as any)}
          >
            <Text style={s.tabText}>Materials</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={s.tab}
            onPress={() => router.replace(`/(tabs)/courses/${params.id}/forums` as any)}
          >
            <Text style={s.tabText}>Forums</Text>
          </TouchableOpacity>
        </View>

        <View style={s.content}>
          {/* CONDITIONAL CONTENT */}
          {isOwner ? (
            <InstructorQuizzesContent courseId={params.id} quizzes={quizzes} colors={colors} />
          ) : (
            <StudentQuizzesContent
              courseId={params.id}
              quizzes={quizzes}
              completed={completedQuizzes}
              total={totalQuizzes}
              userId={user?.id}
              colors={colors}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// STUDENT VIEW
// ==========================================
function StudentQuizzesContent({ courseId, quizzes, completed, total, userId, colors }: any) {
  const getStatusButton = (quiz: any) => {
    const myAttempt = quiz.QuizAttempt?.find((a: any) => a.userId === userId && a.completed);
    const isCompleted = !!myAttempt;
    const score = myAttempt?.score ?? 0;

    if (isCompleted) {
      const totalQuestions = quiz.questions?.length || 0;
      const correctCount = Array.isArray(myAttempt.answers)
        ? myAttempt.answers.filter((a: any) => a.correct).length
        : 0;

      return (
        <View>
          <View style={stylesLocal.scoreContainer}>
            <Text style={[stylesLocal.scoreText, { color: colors.success }]}>Score: {score}%</Text>
            <View style={[stylesLocal.completedBadge, { backgroundColor: colors.success }]}>
              <Text style={stylesLocal.completedText}>Completed</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[stylesLocal.reviewButton, { borderColor: colors.brand }]}
            onPress={() => router.push({
              pathname: `/(tabs)/courses/${courseId}/quiz/review`,
              params: {
                quizId: quiz.id,
                score: score.toString(),
                passed: (score >= quiz.passingScore).toString(),
                correctCount: correctCount.toString(),
                totalQuestions: totalQuestions.toString(),
                answers: JSON.stringify(myAttempt.answers || []),
              },
            } as any)}
          >
            <Text style={[stylesLocal.reviewButtonText, { color: colors.brand }]}>Review Quiz</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <TouchableOpacity
          style={[stylesLocal.startButton, { backgroundColor: colors.brand }]}
          onPress={() => router.push(`/(tabs)/courses/${courseId}/quiz/${quiz.id}` as any)}
        >
          <Text style={stylesLocal.startButtonText}>Start Quiz</Text>
        </TouchableOpacity>
      );
    }
  };

  const stylesLocal = makeStyles(colors);
  
  return (
    <>
      {/* Quiz Progress */}
      <View style={stylesLocal.progressSection}>
        <Text style={stylesLocal.progressLabel}>Quiz Progress</Text>
        <Text style={stylesLocal.progressValue}>{completed}/{total} completed</Text>
      </View>
      <View style={stylesLocal.progressBar}>
        <View style={[stylesLocal.progressFill, { width: `${(completed / total) * 100}%`, backgroundColor: colors.success }]} />
      </View>

      {/* All Quizzes */}
      <Text style={stylesLocal.sectionTitle}>All Quizzes ({quizzes.length})</Text>

      {quizzes.length > 0 ? (
        quizzes.map((quiz: any) => (
          <View key={quiz.id} style={stylesLocal.quizCard}>
            <Text style={stylesLocal.quizTitle}>{quiz.title}</Text>
            <Text style={stylesLocal.quizDescription}>{quiz.description}</Text>
            
            <View style={stylesLocal.quizMeta}>
              <View style={stylesLocal.metaItem}>
                <Ionicons name="help-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={stylesLocal.metaText}>{quiz.questions?.length || 0} questions</Text>
              </View>
              <View style={stylesLocal.metaItem}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={stylesLocal.metaText}>{quiz.duration} min</Text>
              </View>
              <View style={stylesLocal.metaItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={stylesLocal.metaText}>{quiz.passingScore}% to pass</Text>
              </View>
            </View>

            {getStatusButton(quiz)}
          </View>
        ))
      ) : (
        <View style={stylesLocal.emptyState}>
          <Ionicons name="help-circle-outline" size={64} color={colors.textMuted} />
          <Text style={stylesLocal.emptyText}>No quizzes available</Text>
        </View>
      )}
    </>
  );
}

// ==========================================
// INSTRUCTOR VIEW
// ==========================================
function InstructorQuizzesContent({ courseId, quizzes, colors }: any) {
  const stylesLocal = makeStyles(colors);
  
  return (
    <>
      {/* Header with Add Quiz button */}
      <View style={stylesLocal.instructorHeader}>
        <Text style={stylesLocal.sectionTitle}>All Quizzes ({quizzes.length})</Text>
        <TouchableOpacity 
          style={stylesLocal.addQuizButton}
          onPress={() => router.push(`/(tabs)/courses/${courseId}/add-quiz` as any)}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.brand} />
          <Text style={[stylesLocal.addQuizText, { color: colors.brand }]}>Add Quiz</Text>
        </TouchableOpacity>
      </View>

      {/* Quiz List for Instructors */}
      {quizzes.length > 0 ? (
        quizzes.map((quiz: any) => (
          <View key={quiz.id} style={stylesLocal.instructorQuizCard}>
            <Text style={stylesLocal.quizTitle}>{quiz.title}</Text>
            <Text style={stylesLocal.quizDescription}>{quiz.description}</Text>
            
            <View style={stylesLocal.quizMeta}>
              <View style={stylesLocal.metaItem}>
                <Ionicons name="help-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={stylesLocal.metaText}>{quiz.questions?.length || 0} questions</Text>
              </View>
              <View style={stylesLocal.metaItem}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={stylesLocal.metaText}>{quiz.duration} min</Text>
              </View>
              <View style={stylesLocal.metaItem}>
                <Ionicons name="trophy-outline" size={16} color={colors.textSecondary} />
                <Text style={stylesLocal.metaText}>{quiz.passingScore}% passing</Text>
              </View>
            </View>

            {/* View Quiz Button */}
            <TouchableOpacity 
              style={[stylesLocal.viewQuizButton, { borderColor: colors.brand }]}
              onPress={() => router.push(`/(tabs)/courses/${courseId}/quiz-results/${quiz.id}` as any)}
            >
              <Text style={[stylesLocal.viewQuizButtonText, { color: colors.brand }]}>View Quiz Details</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={stylesLocal.emptyState}>
          <Ionicons name="help-circle-outline" size={64} color={colors.textMuted} />
          <Text style={stylesLocal.emptyText}>No quizzes yet</Text>
          <Text style={[stylesLocal.emptySubtext, { color: colors.textMuted }]}>Add your first quiz to test students</Text>
        </View>
      )}
    </>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      flex: 1,
      textAlign: 'center',
    },
    courseInfo: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    courseTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
    },
    courseMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: c.textSecondary,
    },
    metaDivider: {
      width: 1,
      height: 12,
    },
    imagePlaceholder: {
      width: '100%',
      height: 200,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: c.background,
      paddingHorizontal: 20,
      paddingVertical: 8,
      gap: 8,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: c.backgroundSoft,
      borderRadius: 6,
    },
    tabActive: {
      backgroundColor: c.brandLighter,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textSecondary,
    },
    tabTextActive: {
      color: c.brand,
      fontWeight: '600',
    },
    content: {
      padding: 20,
    },
    progressSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: 14,
      color: c.textSecondary,
    },
    progressValue: {
      fontSize: 14,
      color: c.textSecondary,
    },
    progressBar: {
      width: '100%',
      height: 8,
      backgroundColor: c.brandLighter,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 24,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 20,
    },
    quizCard: {
      backgroundColor: c.card,
      padding: 16,
      marginBottom: 16,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      borderRadius: 8,
    },
    quizTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
      marginBottom: 8,
    },
    quizDescription: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    quizMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 16,
    },
    scoreContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    scoreText: {
      fontSize: 14,
      fontWeight: '600',
    },
    completedBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 4,
    },
    completedText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    reviewButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 4,
    },
    reviewButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    startButton: {
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 4,
    },
    startButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
    instructorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    addQuizButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    addQuizText: {
      fontSize: 15,
      fontWeight: '600',
    },
    instructorQuizCard: {
      backgroundColor: c.card,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
    },
    viewQuizButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 4,
    },
    viewQuizButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: c.textMuted,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      marginTop: 8,
    },
  });
}