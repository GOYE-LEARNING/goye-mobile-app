// app/(tabs)/courses/[id]/edit.tsx
import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { getCourse, updateCourse } from '@/services/api';
import { transformApiToFormData, transformFormToApiData } from '@/utils/courseTransformers';

// Import your existing components
import CourseInformation from '@/components/course-creation/CourseInformation';
import CourseObjectives from '@/components/course-creation/CourseObjectives';
import CourseStructure from '@/components/course-creation/CourseStructure';
import CourseMaterials from '@/components/course-creation/CourseMaterials';
import CourseQuizzes from '@/components/course-creation/CourseQuizzes';
import SuccessScreen from '@/components/course-creation/SuccessScreen';

export default function EditCourse() {
  const params = useLocalSearchParams();
  const { token } = useUser();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Form data state
  const [courseData, setCourseData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    level: 'Beginner',
    thumbnail: null,
    objectives: ['', '', '', '', ''],
    modules: [],
    materials: [],
    quizzes: [],
    objectivesId: null,
  });

  const steps = [
    { title: 'Information', component: CourseInformation },
    { title: 'Objectives', component: CourseObjectives },
    { title: 'Structure', component: CourseStructure },
    { title: 'Materials', component: CourseMaterials },
    { title: 'Quizzes', component: CourseQuizzes },
  ];

  // Load existing course data
  useEffect(() => {
    loadCourseData();
  }, [params.id]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const result = await getCourse(params.id as string, token);
      
      if (result?.data) {
        // Transform API data to match your component format
        const formData = transformApiToFormData(result.data);
        setCourseData(formData);
      } else {
        Alert.alert('Error', 'Failed to load course data');
        router.back();
      }
    } catch (error) {
      console.error('Error loading course:', error);
      Alert.alert('Error', 'Unable to load course data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateCourseData = (newData: any) => {
    setCourseData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Transform form data to API format
      const apiData = transformFormToApiData(courseData);
      
      // Call update API
      const result = await updateCourse(params.id as string, apiData, token);
      
      if (result.success || result.statusCode === 200) {
        setShowSuccess(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to update course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      Alert.alert('Error', 'Failed to update course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    setShowSuccess(false);
    router.back(); // Go back to course overview
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3F1F22" />
          <Text style={styles.loadingText}>Loading course...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showSuccess) {
    return <SuccessScreen courseName={courseData.title} onDone={handleDone} />;
  }

  const CurrentStepComponent = steps[activeStep].component;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Course</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index <= activeStep && styles.stepCircleActive
            ]}>
              <Text style={[
                styles.stepNumber,
                index <= activeStep && styles.stepNumberActive
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              styles.stepTitle,
              index === activeStep && styles.stepTitleActive
            ]}>
              {step.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <CurrentStepComponent data={courseData} onChange={updateCourseData} />
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {activeStep > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {activeStep < steps.length - 1 ? (
          <TouchableOpacity 
            style={[styles.nextButton, activeStep === 0 && styles.nextButtonFull]} 
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Update Course</Text>
            )}
          </TouchableOpacity>
        )}
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
  },
  placeholder: {
    width: 24,
  },
  stepsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#3F1F22',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepTitle: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  stepTitleActive: {
    color: '#3F1F22',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  backBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F1F22',
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3F1F22',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});