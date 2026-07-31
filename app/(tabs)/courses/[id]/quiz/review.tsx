// app/(tabs)/courses/[id]/quiz/review.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

export default function QuizReview() {
  const params = useLocalSearchParams();
  const {
    id: courseId,
    quizId,
    score: scoreParam,
    passed: passedParam,
    correctCount: correctCountParam,
    totalQuestions: totalQuestionsParam,
    answers: answersParam
  } = params;

  const [reviewData, setReviewData] = useState({
    score: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    totalQuestions: 0,
    timeTaken: '00:00', // You might want to pass this from the quiz taking screen
    passingGrade: false,
    questions: [] as { id: number; isCorrect: boolean }[]
  });

  useEffect(() => {
    // Convert URL params to actual data
    const score = parseInt(scoreParam as string) || 0;
    const correctAnswers = parseInt(correctCountParam as string) || 0;
    const totalQuestions = parseInt(totalQuestionsParam as string) || 0;
    const passed = passedParam === 'true';
    const incorrectAnswers = totalQuestions - correctAnswers;

    // Real per-question results from the submission, not a guess.
    let realAnswers: { correct: boolean }[] = [];
    try {
      realAnswers = answersParam ? JSON.parse(answersParam as string) : [];
    } catch {
      realAnswers = [];
    }

    const questions = realAnswers.length > 0
      ? realAnswers.map((a, index) => ({ id: index + 1, isCorrect: a.correct }))
      : Array.from({ length: totalQuestions }, (_, index) => ({ id: index + 1, isCorrect: index < correctAnswers }));

    setReviewData({
      score,
      correctAnswers,
      incorrectAnswers,
      totalQuestions,
      timeTaken: '10:34', // You can pass this as a param too if you track time
      passingGrade: passed,
      questions
    });
  }, [scoreParam, correctCountParam, totalQuestionsParam, passedParam, answersParam]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Review</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreIcon}>
            <Ionicons 
              name={reviewData.passingGrade ? "checkmark-circle" : "close-circle"} 
              size={48} 
              color={reviewData.passingGrade ? "#22c55e" : "#EF4444"} 
            />
          </View>
          <Text style={[
            styles.scorePercentage,
            !reviewData.passingGrade && styles.scorePercentageFailed
          ]}>
            {reviewData.score}%
          </Text>
          <Text style={styles.scoreDescription}>
            {reviewData.correctAnswers} out of {reviewData.totalQuestions} correct
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reviewData.correctAnswers}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statNumberIncorrect]}>
                {reviewData.incorrectAnswers}
              </Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reviewData.timeTaken}</Text>
              <Text style={styles.statLabel}>Time Taken</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Performance Breakdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics-outline" size={20} color="#333" />
              <Text style={styles.sectionTitle}>Performance Breakdown</Text>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${reviewData.score}%`,
                      backgroundColor: reviewData.passingGrade ? '#22c55e' : '#EF4444'
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.overallScore}>
              <Text style={styles.overallScoreLabel}>Overall score</Text>
              <Text style={[
                styles.overallScoreValue,
                !reviewData.passingGrade && styles.overallScoreValueFailed
              ]}>
                {reviewData.score}%
              </Text>
            </View>

            {reviewData.passingGrade ? (
              <View style={styles.passMessage}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.passMessageText}>
                  Passing grade achieved! Great understanding of the course.
                </Text>
              </View>
            ) : (
              <View style={styles.failMessage}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.failMessageText}>
                  You didn't reach the passing grade. Review the material and try again.
                </Text>
              </View>
            )}
          </View>

          {/* Question Overview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={20} color="#333" />
              <Text style={styles.sectionTitle}>Question Overview</Text>
            </View>

            <View style={styles.questionsGrid}>
              {reviewData.questions.map((question) => (
                <View
                  key={question.id}
                  style={[
                    styles.questionBox,
                    question.isCorrect ? styles.questionBoxCorrect : styles.questionBoxIncorrect,
                  ]}
                >
                  <Text
                    style={[
                      styles.questionBoxNumber,
                      question.isCorrect ? styles.questionBoxNumberCorrect : styles.questionBoxNumberIncorrect,
                    ]}
                  >
                    {question.id}
                  </Text>
                  <Ionicons
                    name={question.isCorrect ? 'checkmark' : 'close'}
                    size={16}
                    color={question.isCorrect ? '#22c55e' : '#EF4444'}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => {
            // Navigate to detailed question-by-question review
            router.push({
              pathname: `/(tabs)/courses/${courseId}/quiz/${quizId}/detailed-review`,
              params: {
                score: reviewData.score.toString(),
                correctCount: reviewData.correctAnswers.toString(),
                totalQuestions: reviewData.totalQuestions.toString(),
                passed: reviewData.passingGrade.toString(),
                answers: answersParam
              }
            } as any);
          }}
        >
          <Text style={styles.detailsButtonText}>Review in Details</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.retakeButton}
          onPress={() => router.replace(`/(tabs)/courses/${courseId}/quiz/${quizId}` as any)}
        >
          <Ionicons name="refresh" size={20} color="#333" />
          <Text style={styles.retakeButtonText}>
            {reviewData.passingGrade ? 'Retake Quiz' : 'Try Again'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: '#FAFAFA',
    margin: 20,
    padding: 30,
    alignItems: 'center',
  },
  scoreIcon: {
    marginBottom: 16,
  },
  scorePercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  scorePercentageFailed: {
    color: '#EF4444',
  },
  scoreDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statNumberIncorrect: {
    color: '#EF4444',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F5E6E6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  overallScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallScoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  overallScoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  overallScoreValueFailed: {
    color: '#EF4444',
  },
  passMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  passMessageText: {
    flex: 1,
    fontSize: 14,
    color: '#22c55e',
    lineHeight: 20,
  },
  failMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  failMessageText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    lineHeight: 20,
  },
  questionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  questionBox: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  questionBoxCorrect: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  questionBoxIncorrect: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  questionBoxNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  questionBoxNumberCorrect: {
    color: '#22c55e',
  },
  questionBoxNumberIncorrect: {
    color: '#EF4444',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  detailsButton: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retakeButton: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retakeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});