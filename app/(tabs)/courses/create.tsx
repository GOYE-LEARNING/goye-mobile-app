// app/(tabs)/courses/create.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { API_CONFIG } from '@/constants/config';
import * as FileSystem from 'expo-file-system';

// Import step components
import CourseInformation from '@/components/course-creation/CourseInformation';
import CourseStructure from '@/components/course-creation/CourseStructure';
import CourseObjectives from '@/components/course-creation/CourseObjectives';
import CourseQuizzes from '@/components/course-creation/CourseQuizzes';
import CourseMaterials from '@/components/course-creation/CourseMaterials';
import SuccessScreen from '@/components/course-creation/SuccessScreen';

const STEPS = [
  { id: 1, title: 'Course Information' },
  { id: 2, title: 'Course Structure' },
  { id: 3, title: 'Course Objectives' },
  { id: 4, title: 'Course Quizzes' },
  { id: 5, title: 'Course Materials' },
];

export default function CreateCourse() {
  const { user, token, isInstructor } = useUser();
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Course data state
  const [courseData, setCourseData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    level: 'beginner',
    thumbnail: null,
    modules: [],
    objectives: ['', '', '', '', ''],
    quizzes: [],
    materials: [],
  });

  // Protect this route
  if (!isInstructor) {
    router.replace('/(tabs)/home');
    return null;
  }

  // Convert file to base64 using the NEW expo-file-system API
  const fileToBase64 = async (uri: string): Promise<string | null> => {
    try {
      console.log('📁 Converting file:', uri.substring(0, 50) + '...');
      
      // Use the new File API from expo-file-system
      const file = new FileSystem.File(uri);
      const base64 = await file.base64();
      
      const sizeKB = (base64.length * 0.75 / 1024).toFixed(2);
      console.log(`✅ Converted successfully (${sizeKB} KB)`);
      return base64;
    } catch (error) {
      console.error('❌ Conversion failed:', error);
      return null;
    }
  };

  // Transform course data to match API format
  const transformCourseData = async () => {
    try {
      console.log('🔄 Starting data transformation...');
      
      // Convert thumbnail to base64
      let thumbnailBase64 = null;
      if (courseData.thumbnail) {
        console.log('📸 Converting thumbnail...');
        thumbnailBase64 = await fileToBase64(courseData.thumbnail);
      }

      // Transform modules with lessons
      console.log(`📚 Transforming ${courseData.modules.length} modules...`);
      const transformedModules = await Promise.all(
        courseData.modules.map(async (module: any, index: number) => {
          console.log(`  Module ${index + 1}: "${module.title}"`);
          
          const transformedLessons = await Promise.all(
            module.lessons.map(async (lesson: any, lessonIndex: number) => {
              let videoBase64 = null;
              if (lesson.video) {
                console.log(`    🎥 Converting video for lesson "${lesson.title}"...`);
                videoBase64 = await fileToBase64(lesson.video);
              }

              return {
                lesson_title: lesson.title,
                lesson_video: videoBase64 || '',
                order: lessonIndex + 1,
                duration: parseInt(module.duration) || 0,
              };
            })
          );

          return {
            module_title: module.title,
            module_description: module.description,
            module_duration: module.duration,
            order: index + 1,
            lessons: transformedLessons,
          };
        })
      );

      // Transform materials
      console.log(`📄 Transforming ${courseData.materials.length} materials...`);
      const transformedMaterials = await Promise.all(
        courseData.materials.map(async (material: any) => {
          let documentBase64 = null;
          if (material.document) {
            console.log(`  📎 Converting document "${material.title}"...`);
            documentBase64 = await fileToBase64(material.document);
          }

          return {
            material_title: material.title,
            material_description: material.description,
            material_pages: parseInt(material.pages) || 0,
            material_document: documentBase64 || '',
          };
        })
      );

      // Transform objectives (API expects array with one object containing 5 fields)
      const objectives = [{
        objective_title1: courseData.objectives[0] || '',
        objective_title2: courseData.objectives[1] || '',
        objective_title3: courseData.objectives[2] || '',
        objective_title4: courseData.objectives[3] || '',
        objective_title5: courseData.objectives[4] || '',
      }];

      // Transform quizzes
      console.log(`❓ Transforming ${courseData.quizzes.length} quizzes...`);
      const transformedQuizzes = courseData.quizzes.map((quiz: any) => {
        const transformedQuestions = quiz.questions.map((question: any, index: number) => {
          // Get the correct answer text
          const correctOption = question.options.find((opt: any) => opt.isCorrect);
          
          return {
            question: question.text,
            options: question.options.map((opt: any) => opt.text),
            correctAnswer: correctOption?.text || '',
            explanation: '', // Add if you have this field
            points: 1, // Default points
            order: index + 1,
          };
        });

        return {
          title: quiz.title,
          description: quiz.description,
          duration: parseInt(quiz.duration) || 10,
          passingScore: parseInt(quiz.passingScore) || 70,
          maxAttempts: 3, // Default max attempts
          questions: transformedQuestions,
        };
      });

      console.log('✅ Data transformation complete!');

      return {
        course_title: courseData.title,
        course_short_description: courseData.shortDescription,
        course_description: courseData.description,
        course_level: courseData.level,
        course_image: thumbnailBase64 || '',
        module: transformedModules,
        material: transformedMaterials,
        objectives: objectives,
        quiz: transformedQuizzes,
      };
    } catch (error) {
      console.error('❌ Error transforming course data:', error);
      throw error;
    }
  };

  const validateCourseData = () => {
    if (!courseData.title.trim()) {
      Alert.alert('Missing Information', 'Please enter a course title');
      setCurrentStep(1);
      return false;
    }
    if (!courseData.description.trim()) {
      Alert.alert('Missing Information', 'Please enter a course description');
      setCurrentStep(1);
      return false;
    }
    if (courseData.modules.length === 0) {
      Alert.alert('Missing Content', 'Please add at least one module');
      setCurrentStep(2);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!validateCourseData()) return;

    setLoading(true);

    try {
      console.log('=== CREATING COURSE ===');
      console.log('Transforming course data...');
      
      const payload = await transformCourseData();
      
      console.log('Course Payload (without base64 data):');
      const payloadPreview = {
        ...payload,
        course_image: payload.course_image ? `[${(payload.course_image.length * 0.75 / 1024).toFixed(2)} KB]` : '',
        module: payload.module.map((m: any) => ({
          ...m,
          lessons: m.lessons.map((l: any) => ({
            ...l,
            lesson_video: l.lesson_video ? `[${(l.lesson_video.length * 0.75 / 1024).toFixed(2)} KB]` : ''
          }))
        })),
        material: payload.material.map((m: any) => ({
          ...m,
          material_document: m.material_document ? `[${(m.material_document.length * 0.75 / 1024).toFixed(2)} KB]` : ''
        }))
      };
      console.log(JSON.stringify(payloadPreview, null, 2));
      console.log('Making API request...');

      const response = await fetch(`${API_CONFIG.BASE_URL}/course/create-course`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      console.log('=== COURSE CREATION RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('================================');

      if (response.ok) {
        console.log('✅ Course created successfully!');
        setShowSuccess(true);
      } else {
        console.error('❌ Course creation failed:', result);
        
        let errorMessage = 'Failed to create course. Please try again.';
        if (result.message) {
          errorMessage = result.message;
        } else if (result.error) {
          errorMessage = result.error;
        }
        
        Alert.alert('Creation Failed', errorMessage);
      }
    } catch (error) {
      console.error('=== COURSE CREATION ERROR ===');
      console.error('Error:', error);
      
      Alert.alert(
        'Error',
        'Unable to create course. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    router.push('/(tabs)/courses');
  };

  const s = makeStyles(colors);

  if (showSuccess) {
    return <SuccessScreen courseName={courseData.title} onDone={handleDone} />;
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} disabled={loading}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create Course</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={s.progressContainer}>
        {STEPS.map((step, index) => (
          <View
            key={step.id}
            style={[
              s.progressBar,
              index < currentStep && s.progressBarActive,
            ]}
          />
        ))}
      </View>

      {/* Step Content */}
      <ScrollView 
        style={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 1 && (
          <CourseInformation 
            data={courseData} 
            onChange={(data) => setCourseData({ ...courseData, ...data })} 
          />
        )}
        {currentStep === 2 && (
          <CourseStructure 
            data={courseData} 
            onChange={(data) => setCourseData({ ...courseData, ...data })} 
          />
        )}
        {currentStep === 3 && (
          <CourseObjectives 
            data={courseData} 
            onChange={(data) => setCourseData({ ...courseData, ...data })} 
          />
        )}
        {currentStep === 4 && (
          <CourseQuizzes 
            data={courseData} 
            onChange={(data) => setCourseData({ ...courseData, ...data })} 
          />
        )}
        {currentStep === 5 && (
          <CourseMaterials 
            data={courseData} 
            onChange={(data) => setCourseData({ ...courseData, ...data })} 
          />
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={s.footer}>
        <TouchableOpacity 
          style={[s.nextButton, loading && s.buttonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={s.nextButtonText}>
              {currentStep === STEPS.length ? 'Create Course' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>

        {currentStep > 1 && (
          <TouchableOpacity 
            style={s.backButton}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={s.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        {currentStep === 1 && (
          <TouchableOpacity 
            style={s.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={s.backButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
    },
    progressContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 8,
    },
    progressBar: {
      flex: 1,
      height: 3,
      backgroundColor: c.borderMid,
      borderRadius: 2,
    },
    progressBarActive: {
      backgroundColor: c.brand,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    footer: {
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    nextButton: {
      backgroundColor: c.brand,
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 8,
    },
    nextButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    backButton: {
      backgroundColor: c.backgroundSoft,
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 8,
    },
    backButtonText: {
      color: c.text,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  });
}