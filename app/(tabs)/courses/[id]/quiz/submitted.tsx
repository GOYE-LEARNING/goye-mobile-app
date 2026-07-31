// app/(tabs)/courses/[id]/quiz/submitted.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function QuizSubmitted() {
  const params = useLocalSearchParams();
  const {
    id: courseId,
    quizId,
    score,
    passed,
    correctCount,
    totalQuestions,
    answers
  } = params;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Success Animation/Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={60} color="#fff" />
          </View>
          {/* Confetti elements */}
          <View style={[styles.confetti, styles.confetti1]} />
          <View style={[styles.confetti, styles.confetti2]} />
          <View style={[styles.confetti, styles.confetti3]} />
          <View style={[styles.confetti, styles.confetti4]} />
          <View style={[styles.confetti, styles.confetti5]} />
          <View style={[styles.confetti, styles.confetti6]} />
          <View style={[styles.confetti, styles.confetti7]} />
          <View style={[styles.confetti, styles.confetti8]} />
          <View style={[styles.confetti, styles.confetti9]} />
          <View style={[styles.confetti, styles.confetti10]} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Quiz Submitted</Text>
        
        {/* Description */}
        <Text style={styles.description}>
          Your answers have been recorded successfully
        </Text>

        {/* Quick Score Preview */}
        {score && (
          <View style={styles.scorePreview}>
            <Text style={styles.scorePreviewText}>
              Score: {score}% ({correctCount}/{totalQuestions} correct)
            </Text>
            <Text style={[
              styles.passStatus,
              passed === 'true' ? styles.passStatusSuccess : styles.passStatusFailed
            ]}>
              {passed === 'true' ? 'Passed ✓' : 'Not Passed ✗'}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.reviewButton}
          onPress={() => router.replace({
            pathname: `/(tabs)/courses/${courseId}/quiz/review`,
            params: {
              quizId,
              score,
              passed,
              correctCount,
              totalQuestions,
              answers
            }
          } as any)}
        >
          <Text style={styles.reviewButtonText}>Review Answers</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push(`/(tabs)/courses/${courseId}/overview` as any)}
        >
          <Text style={styles.backButtonText}>Back to Course</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 18,
    borderRadius: 2,
  },
  confetti1: {
    backgroundColor: '#F59E0B',
    top: -40,
    left: 20,
    transform: [{ rotate: '15deg' }],
  },
  confetti2: {
    backgroundColor: '#EF4444',
    top: -20,
    left: -30,
    transform: [{ rotate: '-25deg' }],
  },
  confetti3: {
    backgroundColor: '#3B82F6',
    top: 10,
    left: -50,
    transform: [{ rotate: '45deg' }],
  },
  confetti4: {
    backgroundColor: '#10B981',
    bottom: 20,
    left: -40,
    transform: [{ rotate: '-15deg' }],
  },
  confetti5: {
    backgroundColor: '#F97316',
    bottom: -30,
    left: 10,
    transform: [{ rotate: '30deg' }],
  },
  confetti6: {
    backgroundColor: '#8B5CF6',
    top: -35,
    right: 15,
    transform: [{ rotate: '-45deg' }],
  },
  confetti7: {
    backgroundColor: '#EC4899',
    top: -10,
    right: -35,
    transform: [{ rotate: '20deg' }],
  },
  confetti8: {
    backgroundColor: '#14B8A6',
    top: 30,
    right: -45,
    transform: [{ rotate: '-35deg' }],
  },
  confetti9: {
    backgroundColor: '#F59E0B',
    bottom: 15,
    right: -35,
    transform: [{ rotate: '55deg' }],
  },
  confetti10: {
    backgroundColor: '#6366F1',
    bottom: -25,
    right: 20,
    transform: [{ rotate: '-20deg' }],
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  scorePreview: {
    alignItems: 'center',
    marginTop: 10,
  },
  scorePreviewText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  passStatusSuccess: {
    color: '#22c55e',
  },
  passStatusFailed: {
    color: '#EF4444',
  },
  footer: {
    padding: 20,
    gap: 12,
  },
  reviewButton: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});