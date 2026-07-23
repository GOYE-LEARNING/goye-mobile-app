// app/(tabs)/courses/[id]/add-quiz.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { API_CONFIG } from '@/constants/config';
import { useUser } from '@/contexts/UserContext';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
  order: number;
  points: number;
  explanation: string;
  correctAnswer: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: string;
  passingScore: string;
  maxAttempts: string;
  questions: Question[];
}

export default function AddQuiz() {
  const params = useLocalSearchParams();
  const { id: courseId } = params;
  const { token } = useUser();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([
    {
      id: '1',
      title: '',
      description: '',
      duration: '',
      passingScore: '',
      maxAttempts: '3',
      questions: [],
    }
  ]);
  const [loading, setLoading] = useState(false);

  const addQuiz = () => {
    const newQuiz: Quiz = {
      id: Date.now().toString(),
      title: '',
      description: '',
      duration: '',
      passingScore: '',
      maxAttempts: '3',
      questions: [],
    };
    setQuizzes([...quizzes, newQuiz]);
  };

  const updateQuiz = (quizId: string, field: keyof Quiz, value: string) => {
    setQuizzes(quizzes.map(q => 
      q.id === quizId ? { ...q, [field]: value } : q
    ));
  };

  const deleteQuiz = (quizId: string) => {
    if (quizzes.length === 1) {
      Alert.alert('Error', 'You must have at least one quiz');
      return;
    }
    setQuizzes(quizzes.filter(q => q.id !== quizId));
  };

  const addQuestion = (quizId: string) => {
    setQuizzes(quizzes.map(q => {
      if (q.id === quizId) {
        const newQuestion: Question = {
          id: Date.now().toString(),
          text: '',
          options: [
            { id: '1', text: '', isCorrect: false },
            { id: '2', text: '', isCorrect: false },
            { id: '3', text: '', isCorrect: false },
            { id: '4', text: '', isCorrect: false },
          ],
          order: q.questions.length,
          points: 1,
          explanation: '',
          correctAnswer: ''
        };
        return {
          ...q,
          questions: [...q.questions, newQuestion]
        };
      }
      return q;
    }));
  };

  const updateQuestion = (quizId: string, questionId: string, field: string, value: string) => {
    setQuizzes(quizzes.map(q => {
      if (q.id === quizId) {
        return {
          ...q,
          questions: q.questions.map(question => 
            question.id === questionId ? { ...question, [field]: value } : question
          )
        };
      }
      return q;
    }));
  };

  const updateOption = (quizId: string, questionId: string, optionId: string, text: string) => {
    setQuizzes(quizzes.map(q => {
      if (q.id === quizId) {
        return {
          ...q,
          questions: q.questions.map(question => {
            if (question.id === questionId) {
              return {
                ...question,
                options: question.options.map(opt =>
                  opt.id === optionId ? { ...opt, text } : opt
                )
              };
            }
            return question;
          })
        };
      }
      return q;
    }));
  };

  const toggleCorrectAnswer = (quizId: string, questionId: string, optionId: string) => {
    setQuizzes(quizzes.map(q => {
      if (q.id === quizId) {
        return {
          ...q,
          questions: q.questions.map(question => {
            if (question.id === questionId) {
              const updatedOptions = question.options.map(opt => ({
                ...opt,
                isCorrect: opt.id === optionId
              }));
              
              // Update correctAnswer with the selected option text
              const correctOption = updatedOptions.find(opt => opt.isCorrect);
              const correctAnswer = correctOption ? correctOption.text : '';
              
              return {
                ...question,
                options: updatedOptions,
                correctAnswer: correctAnswer
              };
            }
            return question;
          })
        };
      }
      return q;
    }));
  };

  const deleteQuestion = (quizId: string, questionId: string) => {
    setQuizzes(quizzes.map(q => {
      if (q.id === quizId) {
        // Update order for remaining questions
        const remainingQuestions = q.questions
          .filter(question => question.id !== questionId)
          .map((question, index) => ({
            ...question,
            order: index
          }));
          
        return {
          ...q,
          questions: remainingQuestions
        };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validate quizzes
      for (const quiz of quizzes) {
        if (!quiz.title.trim()) {
          Alert.alert('Validation Error', 'Quiz title is required');
          return;
        }
        if (!quiz.duration.trim()) {
          Alert.alert('Validation Error', 'Quiz duration is required');
          return;
        }
        if (!quiz.passingScore.trim()) {
          Alert.alert('Validation Error', 'Passing score is required');
          return;
        }
        
        // Validate questions
        for (const question of quiz.questions) {
          if (!question.text.trim()) {
            Alert.alert('Validation Error', 'All questions must have text');
            return;
          }
          if (!question.correctAnswer.trim()) {
            Alert.alert('Validation Error', 'All questions must have a correct answer selected');
            return;
          }
          for (const option of question.options) {
            if (!option.text.trim()) {
              Alert.alert('Validation Error', 'All options must have text');
              return;
            }
          }
        }
      }

      const results = [];

      for (const quiz of quizzes) {
        const quizData = {
          courseId: courseId,
          title: quiz.title,
          description: quiz.description,
          duration: parseInt(quiz.duration) || 0,
          passingScore: parseInt(quiz.passingScore) || 0,
          maxAttempts: parseInt(quiz.maxAttempts) || 3,
          questions: quiz.questions.map((question, index) => ({
            order: index,
            points: question.points,
            explanation: question.explanation,
            correctAnswer: question.correctAnswer,
            options: question.options.map(opt => opt.text),
            question: question.text
          }))
        };

        console.log('Sending quiz data:', JSON.stringify(quizData, null, 2));

        const response = await fetch(`${API_CONFIG.BASE_URL}/course/create-quiz/${courseId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quizData),
        });

        const result = await response.json();

        if (!response.ok) {
          console.log('Full error details:', {
            status: response.status,
            statusText: response.statusText,
            result: result
          });
          throw new Error(result.message || `HTTP ${response.status}: Failed to create quiz`);
        }

        results.push(result);
      }

      Alert.alert('Success', 'Quizzes created successfully', [
        { 
          text: 'OK', 
          onPress: () => router.back() 
        }
      ]);

    } catch (error: any) {
      console.error('Error saving quizzes:', error);
      Alert.alert('Error', error.message || 'Failed to save quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Quiz</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#3F1F22" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Add Quiz button */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Course Quizzes</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={addQuiz}
            disabled={loading}
          >
            <Ionicons name="add-circle-outline" size={18} color="#3F1F22" />
            <Text style={styles.addButtonText}>Quiz</Text>
          </TouchableOpacity>
        </View>

        {/* Quizzes */}
        {quizzes.map((quiz, quizIndex) => (
          <View key={quiz.id} style={styles.quizCard}>
            {/* Quiz Header */}
            <View style={styles.quizHeader}>
              <View style={styles.quizNumber}>
                <Text style={styles.quizNumberText}>{quizIndex + 1}</Text>
              </View>
              <Text style={styles.quizLabel}>Quiz</Text>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteQuiz(quiz.id)}
                disabled={loading}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {/* Quiz Fields */}
            <View style={styles.field}>
              <Text style={styles.label}>Quiz Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Sharing your Faith"
                value={quiz.title}
                onChangeText={(text) => updateQuiz(quiz.id, 'title', text)}
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Test your understanding of practical discipleship principle"
                value={quiz.description}
                onChangeText={(text) => updateQuiz(quiz.id, 'description', text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Duration (Min) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  value={quiz.duration}
                  onChangeText={(text) => updateQuiz(quiz.id, 'duration', text)}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <View style={[styles.field, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Passing Score (%) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="70"
                  value={quiz.passingScore}
                  onChangeText={(text) => updateQuiz(quiz.id, 'passingScore', text)}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Max Attempts</Text>
              <TextInput
                style={styles.input}
                placeholder="3"
                value={quiz.maxAttempts}
                onChangeText={(text) => updateQuiz(quiz.id, 'maxAttempts', text)}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            {/* Questions */}
            {quiz.questions.map((question, questionIndex) => (
              <View key={question.id} style={styles.questionCard}>
                <View style={styles.field}>
                  <Text style={styles.label}>Question *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="According to the course material, which of these is NOT a key element of a disciple?"
                    value={question.text}
                    onChangeText={(text) => updateQuestion(quiz.id, question.id, 'text', text)}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Explanation</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Explain why this is the correct answer..."
                    value={question.explanation}
                    onChangeText={(text) => updateQuestion(quiz.id, question.id, 'explanation', text)}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Points</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    value={question.points.toString()}
                    onChangeText={(text) => updateQuestion(quiz.id, question.id, 'points', text)}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>

                {question.correctAnswer ? (
                  <View style={styles.correctAnswerIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                    <Text style={styles.correctAnswerText}>
                      Correct answer: {question.correctAnswer}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.correctAnswerIndicator}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.correctAnswerWarning}>
                      No correct answer selected
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.deleteQuestionButton}
                  onPress={() => deleteQuestion(quiz.id, question.id)}
                  disabled={loading}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.deleteQuestionText}>Delete</Text>
                </TouchableOpacity>

                <Text style={styles.answerLabel}>Answer Options *</Text>
                {question.options.map((option, optionIndex) => (
                  <View key={option.id} style={styles.optionRow}>
                    <View style={styles.optionInputContainer}>
                      <Text style={styles.optionLabel}>Option {String.fromCharCode(65 + optionIndex)}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={
                          optionIndex === 0 ? "Honest communication with God" :
                          optionIndex === 1 ? "Regular thanksgiving" :
                          optionIndex === 2 ? "Listening to gospel music" :
                          "Using only formal prayers"
                        }
                        value={option.text}
                        onChangeText={(text) => updateOption(quiz.id, question.id, option.id, text)}
                        editable={!loading}
                      />
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.checkButton,
                        option.isCorrect && styles.checkButtonActive
                      ]}
                      onPress={() => toggleCorrectAnswer(quiz.id, question.id, option.id)}
                      disabled={loading}
                    >
                      {option.isCorrect && (
                        <Ionicons name="checkmark" size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}

            {/* Add Question Button */}
            <TouchableOpacity 
              style={styles.addQuestionButton}
              onPress={() => addQuestion(quiz.id)}
              disabled={loading}
            >
              <Ionicons name="add-outline" size={20} color="#666" />
              <Text style={styles.addQuestionText}>Add Question</Text>
            </TouchableOpacity>
          </View>
        ))}

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
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3F1F22',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3F1F22',
  },
  quizCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  quizNumber: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  quizLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  deleteButton: {
    padding: 4,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  deleteQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 16,
  },
  deleteQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 12,
  },
  optionInputContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  checkButton: {
    width: 40,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  checkButtonActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8E8E8',
    paddingVertical: 14,
    borderRadius: 8,
  },
  addQuestionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  correctAnswerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  correctAnswerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#22c55e',
  },
  correctAnswerWarning: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
});