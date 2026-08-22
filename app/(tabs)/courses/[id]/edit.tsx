// app/(tabs)/courses/[id]/edit.tsx
import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
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
  const { colors } = useTheme();
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

  const s = makeStyles(colors);

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
      
      console.log('📤 Submitting course update...');
      console.log('📦 API Data:', JSON.stringify(apiData, null, 2));
      
      // Call update API
      const result = await updateCourse(params.id as string, apiData, token);
      
      console.log('📥 Update response:', JSON.stringify(result, null, 2));
      
      // ✅ FIX: Check for success properly
      // The response has a "message" field with "Course updated successfully"
      if (result?.message && result.message.includes('successfully')) {
        // ✅ Show success screen directly
        setShowSuccess(true);
      } else if (result?.data) {
        // If we have data, it was successful
        setShowSuccess(true);
      } else {
        // ❌ Show error message
        const errorMessage = result?.message || 'Failed to update course';
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error updating course:', error);
      const errorMessage = error?.message || 'Failed to update course. Please try again.';
      Alert.alert('Error', errorMessage);
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
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading course...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showSuccess) {
    return <SuccessScreen courseName={courseData.title} onDone={handleDone} />;
  }

  const CurrentStepComponent = steps[activeStep].component;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Course</Text>
        <View style={s.placeholder} />
      </View>

      {/* Progress Steps */}
      <View style={s.stepsContainer}>
        {steps.map((step, index) => (
          <View key={index} style={s.stepItem}>
            <View style={[
              s.stepCircle,
              index <= activeStep && s.stepCircleActive
            ]}>
              <Text style={[
                s.stepNumber,
                index <= activeStep && s.stepNumberActive
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              s.stepTitle,
              index === activeStep && s.stepTitleActive
            ]}>
              {step.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <CurrentStepComponent data={courseData} onChange={updateCourseData} />
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={s.navigationContainer}>
        {activeStep > 0 && (
          <TouchableOpacity style={s.backBtn} onPress={handleBack}>
            <Text style={s.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {activeStep < steps.length - 1 ? (
          <TouchableOpacity 
            style={[s.nextButton, activeStep === 0 && s.nextButtonFull]} 
            onPress={handleNext}
          >
            <Text style={s.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={s.submitButton} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.submitButtonText}>Update Course</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: c.textSecondary,
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
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
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
      backgroundColor: c.backgroundMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepCircleActive: {
      backgroundColor: c.brand,
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
    },
    stepNumberActive: {
      color: '#fff',
    },
    stepTitle: {
      fontSize: 11,
      color: c.textMuted,
      textAlign: 'center',
    },
    stepTitleActive: {
      color: c.brand,
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
      borderTopColor: c.border,
      backgroundColor: c.background,
    },
    backBtn: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.brand,
    },
    backBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.brand,
    },
    nextButton: {
      flex: 1,
      backgroundColor: c.brand,
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
      backgroundColor: c.brand,
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
}