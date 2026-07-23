// components/course-creation/CourseQuizzes.tsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';


interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}


interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: string;
  passingScore: string;
  questions: Question[];
  expanded: boolean;
}

interface Props {
  data: any;
  onChange: (data: any) => void;
}

export default function CourseQuizzes({ data, onChange }: Props) {
  const { colors } = useTheme();
  const [quizzes, setQuizzes] = useState<Quiz[]>(data.quizzes || []);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);

  const addQuiz = () => {
    const newQuiz: Quiz = {
      id: Date.now().toString(),
      title: '',
      description: '',
      duration: '',
      passingScore: '',
      questions: [],
      expanded: true,
    };
    const updated = [...quizzes, newQuiz];
    setQuizzes(updated);
    setExpandedQuiz(newQuiz.id);
    onChange({ quizzes: updated });
  };

  const updateQuiz = (quizId: string, field: string, value: string) => {
    const updated = quizzes.map(q =>
      q.id === quizId ? { ...q, [field]: value } : q
    );
    setQuizzes(updated);
    onChange({ quizzes: updated });
  };

  const deleteQuiz = (quizId: string) => {
    Alert.alert(
      'Delete Quiz',
      'Are you sure you want to delete this quiz?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = quizzes.filter(q => q.id !== quizId);
            setQuizzes(updated);
            onChange({ quizzes: updated });
          },
        },
      ]
    );
  };

  const addQuestion = (quizId: string) => {
    const updated = quizzes.map(q => {
      if (q.id === quizId) {
        return {
          ...q,
          questions: [
            ...q.questions,
            {
              id: Date.now().toString(),
              text: '',
              options: [
                { id: '1', text: '', isCorrect: false },
                { id: '2', text: '', isCorrect: false },
                { id: '3', text: '', isCorrect: false },
                { id: '4', text: '', isCorrect: false },
              ]
            }
          ]
        };
      }
      return q;
    });
    setQuizzes(updated);
    onChange({ quizzes: updated });
  };

  const updateQuestion = (quizId: string, questionId: string, text: string) => {
    const updated = quizzes.map(q => {
      if (q.id === quizId) {
        return {
          ...q,
          questions: q.questions.map(question => 
            question.id === questionId ? { ...question, text } : question
          )
        };
      }
      return q;
    });
    setQuizzes(updated);
    onChange({ quizzes: updated });
  };

  const updateOption = (quizId: string, questionId: string, optionId: string, text: string) => {
    const updated = quizzes.map(q => {
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
    });
    setQuizzes(updated);
    onChange({ quizzes: updated });
  };

  const toggleCorrectAnswer = (quizId: string, questionId: string, optionId: string) => {
    const updated = quizzes.map(q => {
      if (q.id === quizId) {
        return {
          ...q,
          questions: q.questions.map(question => {
            if (question.id === questionId) {
              return {
                ...question,
                options: question.options.map(opt =>
                  ({ ...opt, isCorrect: opt.id === optionId })
                )
              };
            }
            return question;
          })
        };
      }
      return q;
    });
    setQuizzes(updated);
    onChange({ quizzes: updated });
  };

  const deleteQuestion = (quizId: string, questionId: string) => {
    const updated = quizzes.map(q => {
      if (q.id === quizId) {
        return {
          ...q,
          questions: q.questions.filter(question => question.id !== questionId)
        };
      }
      return q;
    });
    setQuizzes(updated);
    onChange({ quizzes: updated });
  };

  const toggleQuiz = (quizId: string) => {
    setExpandedQuiz(expandedQuiz === quizId ? null : quizId);
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.sectionTitle}>Course Quizzes</Text>
        <TouchableOpacity style={s.addButton} onPress={addQuiz}>
          <Ionicons name="add-circle-outline" size={18} color={colors.brand} />
          <Text style={[s.addButtonText, { color: colors.brand }]}>Quiz</Text>
        </TouchableOpacity>
      </View>

      {quizzes.map((quiz, quizIndex) => (
        <View key={quiz.id} style={[s.quizCard, { backgroundColor: colors.backgroundSoft }]}>
          {/* Quiz Header */}
          <View style={s.quizHeader}>
            <View style={[s.quizNumber, { backgroundColor: colors.success }]}>
              <Text style={s.quizNumberText}>{quizIndex + 1}</Text>
            </View>
            <TouchableOpacity 
              style={s.quizHeaderContent}
              onPress={() => toggleQuiz(quiz.id)}
            >
              <Text style={[s.quizLabel, { color: colors.text }]}>Quiz</Text>
              <Ionicons 
                name={expandedQuiz === quiz.id ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={s.deleteButton}
              onPress={() => deleteQuiz(quiz.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Expanded Quiz Content */}
          {expandedQuiz === quiz.id && (
            <>
              <View style={s.field}>
                <Text style={[s.label, { color: colors.textSecondary }]}>Quiz Title</Text>
                <TextInput
                  style={[s.input, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Faith in Action"
                  placeholderTextColor={colors.textMuted}
                  value={quiz.title}
                  onChangeText={(text) => updateQuiz(quiz.id, 'title', text)}
                />
              </View>

              <View style={s.field}>
                <Text style={[s.label, { color: colors.textSecondary }]}>Description</Text>
                <TextInput
                  style={[s.input, s.textArea, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Test your understanding of practical discipleship principle"
                  placeholderTextColor={colors.textMuted}
                  value={quiz.description}
                  onChangeText={(text) => updateQuiz(quiz.id, 'description', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={s.row}>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={[s.label, { color: colors.textSecondary }]}>Duration (Min)</Text>
                  <TextInput
                    style={[s.input, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                    placeholder="10"
                    placeholderTextColor={colors.textMuted}
                    value={quiz.duration}
                    onChangeText={(text) => updateQuiz(quiz.id, 'duration', text)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[s.field, { flex: 1, marginLeft: 12 }]}>
                  <Text style={[s.label, { color: colors.textSecondary }]}>Passing Score (%)</Text>
                  <TextInput
                    style={[s.input, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                    placeholder="70"
                    placeholderTextColor={colors.textMuted}
                    value={quiz.passingScore}
                    onChangeText={(text) => updateQuiz(quiz.id, 'passingScore', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Questions */}
              {quiz.questions.map((question, questionIndex) => (
                <View key={question.id} style={[s.questionCard, { backgroundColor: colors.background }]}>
                  <View style={s.field}>
                    <Text style={[s.label, { color: colors.textSecondary }]}>Question</Text>
                    <TextInput
                      style={[s.input, s.textArea, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                      placeholder="According to the course material, which of these is NOT a key element of a disciple?"
                      placeholderTextColor={colors.textMuted}
                      value={question.text}
                      onChangeText={(text) => updateQuestion(quiz.id, question.id, text)}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  <Text style={[s.answerLabel, { color: colors.text }]}>Answer Options</Text>
                  {question.options.map((option, optionIndex) => (
                    <View key={option.id} style={s.optionRow}>
                      <View style={s.optionInputContainer}>
                        <Text style={[s.optionLabel, { color: colors.textSecondary }]}>Option {String.fromCharCode(65 + optionIndex)}</Text>
                        <TextInput
                          style={[s.input, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                          placeholder={
                            optionIndex === 0 ? "Honest communication with God" :
                            optionIndex === 1 ? "Regular thanksgiving" :
                            optionIndex === 2 ? "Listening to gospel music" :
                            "Using only formal prayers"
                          }
                          placeholderTextColor={colors.textMuted}
                          value={option.text}
                          onChangeText={(text) => updateOption(quiz.id, question.id, option.id, text)}
                        />
                      </View>
                      <TouchableOpacity 
                        style={[
                          s.checkButton,
                          { borderColor: colors.borderMid, backgroundColor: colors.background },
                          option.isCorrect && s.checkButtonActive
                        ]}
                        onPress={() => toggleCorrectAnswer(quiz.id, question.id, option.id)}
                      >
                        {option.isCorrect && (
                          <Ionicons name="checkmark" size={20} color="#fff" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity 
                    style={s.deleteQuestionButton}
                    onPress={() => deleteQuestion(quiz.id, question.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={s.deleteQuestionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Question Button */}
              <TouchableOpacity 
                style={[s.addQuestionButton, { backgroundColor: colors.brandLighter }]}
                onPress={() => addQuestion(quiz.id)}
              >
                <Ionicons name="add-outline" size={20} color={colors.textSecondary} />
                <Text style={[s.addQuestionText, { color: colors.textSecondary }]}>Add Question</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ))}

      {quizzes.length === 0 && (
        <View style={s.emptyState}>
          <Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[s.emptyText, { color: colors.textMuted }]}>No quizzes yet</Text>
          <Text style={[s.emptySubtext, { color: colors.textMuted }]}>Click "Quiz" to add a quiz</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      paddingVertical: 20,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    quizCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    quizHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    quizNumber: {
      width: 32,
      height: 32,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    quizNumberText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    quizHeaderContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    quizLabel: {
      fontSize: 15,
      fontWeight: '600',
    },
    deleteButton: {
      padding: 4,
      marginLeft: 8,
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      padding: 12,
      fontSize: 15,
      borderRadius: 8,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    row: {
      flexDirection: 'row',
    },
    questionCard: {
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    answerLabel: {
      fontSize: 14,
      fontWeight: '600',
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
      marginBottom: 6,
    },
    checkButton: {
      width: 40,
      height: 44,
      borderRadius: 8,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkButtonActive: {
      backgroundColor: c.success,
      borderColor: c.success,
    },
    deleteQuestionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      marginTop: 8,
    },
    deleteQuestionText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#EF4444',
    },
    addQuestionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 8,
    },
    addQuestionText: {
      fontSize: 15,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      marginTop: 4,
    },
  });
}