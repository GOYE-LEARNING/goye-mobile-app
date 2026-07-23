// app/(tabs)/courses/[id]/quiz/[quizId]/index.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { API_CONFIG } from '@/constants/config';

export default function QuizTaking() {
  const params = useLocalSearchParams();
  const { id: courseId, quizId } = params;
  const { token } = useUser();

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Ref to always capture the latest timeRemaining inside callbacks
  const timeRemainingRef = useRef(timeRemaining);
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  // Ref to always capture the latest quiz inside the timer callback
  const quizRef = useRef(quiz);
  useEffect(() => {
    quizRef.current = quiz;
  }, [quiz]);

  // Ref to always capture the latest selectedAnswers inside the timer callback
  const selectedAnswersRef = useRef(selectedAnswers);
  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          Alert.alert(
            "Time's Up!",
            'The quiz time has expired. Your answers will be submitted.',
            [{ text: 'OK', onPress: () => handleSubmit(true) }]
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const fetchQuizData = async () => {
    try {
      console.log('=== FETCHING QUIZ FOR TAKING ===');
      console.log('Course ID:', courseId);
      console.log('Quiz ID:', quizId);

      const response = await fetch(`${API_CONFIG.BASE_URL}/course/get-course/${courseId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        const foundQuiz = result.data.quiz?.find((q: any) => q.id === quizId);

        if (foundQuiz) {
          console.log('✅ Quiz found:', foundQuiz.title);
          console.log('Questions:', foundQuiz.questions?.length);
          console.log('Duration:', foundQuiz.duration, 'minutes');

          setQuiz(foundQuiz);
          // Convert minutes to seconds
          setTimeRemaining(foundQuiz.duration * 60);
        } else {
          console.error('❌ Quiz not found');
          Alert.alert('Error', 'Quiz not found', [
            { text: 'Go Back', onPress: () => router.back() },
          ]);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching quiz:', err);
      Alert.alert('Error', 'Failed to load quiz', [
        { text: 'Go Back', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answer,
    });
  };

  // isTimeout flag is used when called from the timer alert to use refs instead of stale state
  const handleSubmit = async (isTimeout = false) => {
    const currentQuiz = isTimeout ? quizRef.current : quiz;
    const currentAnswers = isTimeout ? selectedAnswersRef.current : selectedAnswers;
    const currentTimeRemaining = timeRemainingRef.current;

    if (!currentQuiz) {
      console.error('❌ No quiz data available');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);

    // Calculate score locally for the results screen
    let correctCount = 0;
    let totalPoint = 0;

    const answers = currentQuiz.questions.map((question: any, index: number) => {
      const selectedAnswer = currentAnswers[index] ?? '';
      const isCorrect = selectedAnswer === question.correctAnswer;
      const pointValue = question.points ?? 0;

      if (isCorrect) {
        correctCount++;
        totalPoint += pointValue;
      }

      return {
        questionId: question.id,
        answer: selectedAnswer,
        correct: isCorrect,
        point: isCorrect ? pointValue : 0,
      };
    });

    const score = Math.round((correctCount / currentQuiz.questions.length) * 100);
    const passed = score >= currentQuiz.passingScore;

    // timeFinished = how many seconds were used (total duration minus remaining)
    const timeUsed = currentQuiz.duration * 60 - currentTimeRemaining;

    const payload = {
      answers,
      timeFinished: timeUsed,
      completed: true,
      totalPoint,
      passingScore: currentQuiz.passingScore, // ✅ ADD THIS - required by server
    };

    console.log('=== QUIZ SUBMISSION ===');
    console.log('Total Questions:', currentQuiz.questions.length);
    console.log('Correct Answers:', correctCount);
    console.log('Score:', score);
    console.log('Passed:', passed);
    console.log('Passing Score:', currentQuiz.passingScore);
    console.log('Time Used (seconds):', timeUsed);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/course/submit-quiz/${courseId}/${quizId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Submission failed:', result);
        Alert.alert('Submission Failed', result.message ?? 'Please try again.');
        setSubmitting(false);
        return;
      }

      console.log('✅ Quiz submitted successfully:', result.message);

      router.replace({
        pathname: `/(tabs)/courses/${courseId}/quiz/submitted`,
        params: {
          quizId,
          score: score.toString(),
          passed: passed.toString(),
          correctCount: correctCount.toString(),
          totalQuestions: currentQuiz.questions.length.toString(),
        },
      } as any);
    } catch (err) {
      console.error('❌ Network error submitting quiz:', err);
      Alert.alert('Error', 'Failed to submit quiz. Please check your connection.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3F1F22" />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#999" />
          <Text style={styles.errorText}>No questions available</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = quiz.questions.length;
  const progressPercentage = (answeredCount / totalQuestions) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Exit Quiz?',
              'Your progress will be lost. Are you sure you want to exit?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', style: 'destructive', onPress: () => router.back() },
              ]
            );
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quiz.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {answeredCount}/{totalQuestions} answered
          </Text>
          <View style={[styles.timerContainer, timeRemaining < 60 && styles.timerWarning]}>
            <Ionicons
              name="time-outline"
              size={16}
              color={timeRemaining < 60 ? '#EF4444' : '#666'}
            />
            <Text
              style={[styles.timerText, timeRemaining < 60 && styles.timerTextWarning]}
            >
              {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quiz Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>• Answer all {totalQuestions} questions</Text>
          <Text style={styles.instructionsText}>
            • You need {quiz.passingScore}% to pass
          </Text>
          <Text style={styles.instructionsText}>
            • Each question has one correct answer
          </Text>
          {quiz.maxAttempts && (
            <Text style={styles.instructionsText}>
              • You have {quiz.maxAttempts} attempts for this quiz
            </Text>
          )}
        </View>

        {/* Questions */}
        {quiz.questions.map((question: any, index: number) => {
          const isAnswered = selectedAnswers[index] !== undefined;
          return (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View
                  style={[
                    styles.questionNumber,
                    isAnswered && styles.questionNumberAnswered,
                  ]}
                >
                  <Text
                    style={[
                      styles.questionNumberText,
                      isAnswered && styles.questionNumberTextAnswered,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.questionTextContainer}>
                  <Text style={styles.questionText}>{question.question}</Text>
                  {question.points && (
                    <View style={styles.pointsBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.pointsText}>{question.points} pts</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.optionsContainer}>
                {question.options &&
                  question.options.map((option: string, optionIndex: number) => {
                    const isSelected = selectedAnswers[index] === option;
                    return (
                      <TouchableOpacity
                        key={optionIndex}
                        style={[
                          styles.optionCard,
                          isSelected && styles.optionCardSelected,
                        ]}
                        onPress={() => handleSelectAnswer(index, option)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color="#49151B" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>

              {/* Separator line between questions */}
              {index < totalQuestions - 1 && (
                <View style={styles.questionSeparator} />
              )}
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (answeredCount !== totalQuestions || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={() => {
            if (answeredCount === totalQuestions && !submitting) {
              Alert.alert(
                'Submit Quiz?',
                `You have answered all ${totalQuestions} questions. Submit now?`,
                [
                  { text: 'Review', style: 'cancel' },
                  { text: 'Submit', onPress: () => handleSubmit(false) },
                ]
              );
            }
          }}
          disabled={answeredCount !== totalQuestions || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              Submit Quiz{' '}
              {answeredCount !== totalQuestions && `(${answeredCount}/${totalQuestions})`}
            </Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    color: '#3F1F22',
    fontSize: 16,
    fontWeight: '600',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#F5E6E6',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3F1F22',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerWarning: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timerTextWarning: {
    color: '#EF4444',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionsCard: {
    backgroundColor: '#EBF5FF',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  questionCard: {
    paddingVertical: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  questionNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  questionNumberAnswered: {
    backgroundColor: '#22c55e',
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  questionNumberTextAnswered: {
    color: 'white',
  },
  questionTextContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  optionCardSelected: {
    borderColor: '#49151B80',
    backgroundColor: '#49151B70',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  optionTextSelected: {
    color: '#41415A',
    fontWeight: '500',
  },
  questionSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginTop: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});