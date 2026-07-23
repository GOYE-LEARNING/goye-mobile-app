// app/(tabs)/courses/[id]/quiz/[quizId]/detailed-review.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { API_CONFIG } from '@/constants/config';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  userAnswer?: string;
  isCorrect?: boolean;
}

interface QuizData {
  title: string;
  questions: Question[];
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
}

export default function DetailedQuizReview() {
  const params = useLocalSearchParams();
  const { 
    id: courseId, 
    quizId,
    score: scoreParam,
    passed: passedParam,
    correctCount: correctCountParam,
    totalQuestions: totalQuestionsParam
  } = params;
  
  const { token } = useUser();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});

  useEffect(() => {
    fetchQuizWithUserAnswers();
  }, [quizId]);

  const fetchQuizWithUserAnswers = async () => {
    try {
      // First, get the quiz data
      const response = await fetch(`${API_CONFIG.BASE_URL}/course/get-course/${courseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        const foundQuiz = result.data.quiz?.find((q: any) => q.id === quizId);
        
        if (foundQuiz) {
          // For now, we'll simulate user answers based on the score
          // In a real app, you'd fetch the actual user answers from the backend
          const score = parseInt(scoreParam as string) || 0;
          const correctCount = parseInt(correctCountParam as string) || 0;
          const totalQuestions = parseInt(totalQuestionsParam as string) || 0;
          const passed = passedParam === 'true';

          // Generate simulated user answers based on correct count
          const questionsWithAnswers = foundQuiz.questions.map((question: any, index: number) => {
            const isCorrect = index < correctCount;
            const userAnswer = isCorrect 
              ? question.correctAnswer 
              : getRandomWrongAnswer(question.options, question.correctAnswer);
            
            return {
              ...question,
              userAnswer,
              isCorrect
            };
          });

          setQuizData({
            title: foundQuiz.title,
            questions: questionsWithAnswers,
            score,
            correctCount,
            totalQuestions,
            passed
          });

          // Store user answers for easy access
          const answers: {[key: number]: string} = {};
          questionsWithAnswers.forEach((question: Question, index: number) => {
            answers[index] = question.userAnswer || '';
          });
          setUserAnswers(answers);
        }
      }
    } catch (err) {
      console.error('Error fetching quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRandomWrongAnswer = (options: string[], correctAnswer: string): string => {
    const wrongOptions = options.filter(opt => opt !== correctAnswer);
    return wrongOptions[Math.floor(Math.random() * wrongOptions.length)] || options[0];
  };

  const getOptionStatus = (questionIndex: number, option: string) => {
    const question = quizData?.questions[questionIndex];
    if (!question) return 'neutral';
    
    const isCorrectAnswer = option === question.correctAnswer;
    const isUserAnswer = option === question.userAnswer;
    
    if (isCorrectAnswer && isUserAnswer) return 'correct-selected';
    if (isCorrectAnswer) return 'correct';
    if (isUserAnswer) return 'incorrect';
    return 'neutral';
  };

  if (loading || !quizData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text>Loading review...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detailed Review</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.quizTitle}>{quizData.title}</Text>
          <View style={[
            styles.scoreBadge,
            quizData.passed ? styles.scoreBadgePassed : styles.scoreBadgeFailed
          ]}>
            <Text style={styles.scoreText}>{quizData.score}%</Text>
          </View>
        </View>
        <Text style={styles.summaryText}>
          {quizData.correctCount} of {quizData.totalQuestions} questions correct
          {quizData.passed ? ' - Passed ✓' : ' - Not Passed ✗'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Questions Review */}
        {quizData.questions.map((question, questionIndex) => (
          <View key={question.id} style={styles.questionCard}>
            {/* Question Header */}
            <View style={styles.questionHeader}>
              <View style={[
                styles.questionNumber,
                question.isCorrect ? styles.questionNumberCorrect : styles.questionNumberIncorrect
              ]}>
                <Text style={styles.questionNumberText}>{questionIndex + 1}</Text>
                <Ionicons 
                  name={question.isCorrect ? "checkmark" : "close"} 
                  size={14} 
                  color="white" 
                />
              </View>
              <View style={styles.questionInfo}>
                <Text style={styles.questionText}>{question.question}</Text>
                {question.points > 0 && (
                  <Text style={styles.pointsText}>{question.points} points</Text>
                )}
              </View>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {question.options.map((option, optionIndex) => {
                const status = getOptionStatus(questionIndex, option);
                return (
                  <View
                    key={optionIndex}
                    style={[
                      styles.optionCard,
                      status === 'correct-selected' && styles.optionCardCorrectSelected,
                      status === 'correct' && styles.optionCardCorrect,
                      status === 'incorrect' && styles.optionCardIncorrect,
                    ]}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.optionIndicator}>
                        <Text style={styles.optionLabel}>
                          {String.fromCharCode(65 + optionIndex)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.optionText,
                        (status === 'correct-selected' || status === 'correct') && styles.optionTextCorrect,
                        status === 'incorrect' && styles.optionTextIncorrect,
                      ]}>
                        {option}
                      </Text>
                    </View>

                    {/* Status Icons */}
                    <View style={styles.statusIcons}>
                      {status === 'correct-selected' && (
                        <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                      )}
                      {status === 'correct' && (
                        <Ionicons name="checkmark-circle-outline" size={20} color="#22c55e" />
                      )}
                      {status === 'incorrect' && (
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Explanation */}
            {question.explanation && (
              <View style={styles.explanationCard}>
                <View style={styles.explanationHeader}>
                  <Ionicons name="information-circle" size={16} color="#3B82F6" />
                  <Text style={styles.explanationTitle}>Explanation</Text>
                </View>
                <Text style={styles.explanationText}>{question.explanation}</Text>
              </View>
            )}

            {/* Question Separator */}
            {questionIndex < quizData.questions.length - 1 && (
              <View style={styles.questionSeparator} />
            )}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.retakeButton}
          onPress={() => router.replace(`/(tabs)/courses/${courseId}/quiz/${quizId}` as any)}
        >
          <Ionicons name="refresh" size={20} color="#333" />
          <Text style={styles.retakeButtonText}>Retake Quiz</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButtonFull}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonFullText}>Back to Summary</Text>
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
  summaryCard: {
    backgroundColor: '#FAFAFA',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3F1F22',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreBadgePassed: {
    backgroundColor: '#DCFCE7',
  },
  scoreBadgeFailed: {
    backgroundColor: '#FEE2E2',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  questionNumberCorrect: {
    backgroundColor: '#22c55e',
  },
  questionNumberIncorrect: {
    backgroundColor: '#EF4444',
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  questionInfo: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 24,
    marginBottom: 4,
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
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    
  },
  optionCardCorrectSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#F0FDF4',
  },
  optionCardCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#F0FDF4',
  },
  optionCardIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  optionTextCorrect: {
    color: '#22c55e',
    fontWeight: '500',
  },
  optionTextIncorrect: {
    color: '#EF4444',
    fontWeight: '500',
  },
  statusIcons: {
    marginLeft: 8,
  },
  explanationCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  explanationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
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
    gap: 12,
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
  backButtonFull: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonFullText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});