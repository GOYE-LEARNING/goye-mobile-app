// app/(tabs)/courses/[id]/quiz-results/[quizId].tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { API_CONFIG } from '@/constants/config';

export default function QuizResults() {
  const params = useLocalSearchParams();
  const { id: courseId, quizId } = params;
  const { token } = useUser();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      console.log('=== FETCHING QUIZ DATA ===');
      console.log('Course ID:', courseId);
      console.log('Quiz ID:', quizId);

      // Fetch the full course to get quiz details
      const response = await fetch(`${API_CONFIG.BASE_URL}/course/get-course/${courseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      console.log('=== COURSE RESPONSE ===');
      console.log('Status:', response.status);

      if (response.ok) {
        // Find the specific quiz
        const foundQuiz = result.data.quiz?.find((q: any) => q.id === quizId);
        
        if (foundQuiz) {
          console.log('✅ Quiz found:', foundQuiz.title);
          console.log('Questions:', foundQuiz.questions?.length);
          setQuiz(foundQuiz);
        } else {
          console.error('❌ Quiz not found with ID:', quizId);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching quiz:', err);
    } finally {
      setLoading(false);
    }
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

  if (!quiz) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#999" />
          <Text style={styles.errorText}>Quiz not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quiz.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quiz Info */}
        <View style={styles.quizInfo}>
          <Text style={styles.quizTitle}>{quiz.title}</Text>
          <Text style={styles.quizDescription}>{quiz.description}</Text>
          
          <View style={styles.quizMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="help-circle-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{quiz.questions?.length || 0} questions</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{quiz.duration} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="trophy-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{quiz.passingScore}% to pass</Text>
            </View>
          </View>
        </View>

        {/* Questions */}
        {quiz.questions && quiz.questions.length > 0 ? (
          quiz.questions.map((question: any, index: number) => (
            <View key={question.id} style={styles.questionCard}>
              {/* Question Number Badge */}
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>{index + 1}</Text>
              </View>

              {/* Question Text */}
              <Text style={styles.questionText}>{question.question}</Text>

              {/* Points */}
              <View style={styles.pointsBadge}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.pointsText}>{question.points} {question.points === 1 ? 'point' : 'points'}</Text>
              </View>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {question.options && question.options.map((optionText: string, optionIndex: number) => {
                  const isCorrect = optionText === question.correctAnswer;
                  
                  return (
                    <View
                      key={optionIndex}
                      style={[
                        styles.optionCard,
                        isCorrect && styles.optionCardCorrect,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isCorrect && styles.optionTextCorrect,
                        ]}
                      >
                        {optionText}
                      </Text>
                      {isCorrect && (
                        <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Explanation (if available) */}
              {question.explanation && (
                <View style={styles.explanationBox}>
                  <View style={styles.explanationHeader}>
                    <Ionicons name="information-circle" size={20} color="#2563EB" />
                    <Text style={styles.explanationTitle}>Explanation</Text>
                  </View>
                  <Text style={styles.explanationText}>{question.explanation}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="help-circle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No questions in this quiz</Text>
          </View>
        )}

        {/* Done Button */}
        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  backButtonText: {
    color: '#3F1F22',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  content: {
    flex: 1,
    padding: 20,
  },
  quizInfo: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  quizMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  questionCard: {
    backgroundColor: '#fff',
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  questionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  questionBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  pointsText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22c55e',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  optionTextCorrect: {
    fontWeight: '600',
    color: '#22c55e',
  },
  explanationBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#EBF5FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
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
    color: '#2563EB',
  },
  explanationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3F1F22',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 8,
  },
  doneButtonText: {
    color: '#3F1F22',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
});