// app/(tabs)/courses/[id]/add-module.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { API_CONFIG } from '@/constants/config';
import { useUser } from '@/contexts/UserContext';

interface Lesson {
  id: string;
  lesson_title: string;
  lesson_video: string | null;
  moduleId?: string;
}

interface Module {
  id: string;
  module_title: string;
  module_description: string;
  module_duration: string;
  lesson: Lesson[];
}

export default function AddModule() {
  const params = useLocalSearchParams();
  const { id: courseId } = params;
  const { token } = useUser();
  
  const [modules, setModules] = useState<Module[]>([
    {
      id: '1',
      module_title: '',
      module_description: '',
      module_duration: '',
      lesson: [],
    }
  ]);
  const [loading, setLoading] = useState(false);

  const addModule = () => {
    const newModule: Module = {
      id: Date.now().toString(),
      module_title: '',
      module_description: '',
      module_duration: '',
      lesson: [],
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (moduleId: string, field: keyof Module, value: string) => {
    setModules(modules.map(m => 
      m.id === moduleId ? { ...m, [field]: value } : m
    ));
  };

  const deleteModule = (moduleId: string) => {
    if (modules.length === 1) {
      Alert.alert('Error', 'You must have at least one module');
      return;
    }
    setModules(modules.filter(m => m.id !== moduleId));
  };

  const addLesson = (moduleId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lesson: [
            ...m.lesson,
            { 
              id: Date.now().toString(), 
              lesson_title: '', 
              lesson_video: null,
              moduleId: moduleId
            }
          ]
        };
      }
      return m;
    }));
  };

  const updateLesson = (moduleId: string, lessonId: string, field: string, value: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lesson: m.lesson.map(l => 
            l.id === lessonId ? { ...l, [field]: value } : l
          )
        };
      }
      return m;
    }));
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lesson: m.lesson.filter(l => l.id !== lessonId)
        };
      }
      return m;
    }));
  };

  const pickVideo = async (moduleId: string, lessonId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        updateLesson(moduleId, lessonId, 'lesson_video', result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video file');
    }
  };

  const uploadVideo = async (courseId: string, moduleId: string, videoUri: string): Promise<string> => {
    const fileName = videoUri.split('/').pop() || `lesson-video-${Date.now()}.mp4`;
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeType = extension === 'mov' ? 'video/quicktime' : extension === 'avi' ? 'video/x-msvideo' : 'video/mp4';

    const formData = new FormData();
    formData.append('file', {
      uri: videoUri,
      name: fileName,
      type: mimeType,
    } as any);

    const response = await fetch(`${API_CONFIG.BASE_URL}/course/upload-lesson-video/${courseId}/${moduleId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Do not set Content-Type — fetch sets the correct multipart boundary automatically.
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}: Failed to upload lesson video`);
    }
    return result.data.url;
  };

  const attachLessonVideo = async (lessonId: string, videoUrl: string) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/course/update-lesson/${lessonId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lesson_video: videoUrl }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}: Failed to attach lesson video`);
    }
  };

  const validateModule = (module: Module): boolean => {
    if (!module.module_title.trim()) {
      Alert.alert('Validation Error', 'Module title is required');
      return false;
    }
    if (!module.module_duration.trim()) {
      Alert.alert('Validation Error', 'Module duration is required');
      return false;
    }
    
    // Validate lessons
    for (const lesson of module.lesson) {
      if (!lesson.lesson_title.trim()) {
        Alert.alert('Validation Error', 'All lessons must have a title');
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validate all modules
      for (const module of modules) {
        if (!validateModule(module)) {
          return;
        }
      }

      const results = [];

      for (const module of modules) {
        // Create the module first (without videos — real lesson IDs don't
        // exist until the module/lessons are persisted, and the upload
        // endpoint needs a real moduleId).
        const moduleData = {
          courseId: courseId,
          module_title: module.module_title,
          module_description: module.module_description,
          module_duration: module.module_duration,
          lesson: module.lesson.map((lesson) => ({
            lesson_title: lesson.lesson_title,
            lesson_video: '',
          })),
        };

        const response = await fetch(`${API_CONFIG.BASE_URL}/course/create-module/${courseId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(moduleData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || `HTTP ${response.status}: Failed to create module`);
        }

        const createdModuleId = result.data.id;
        const createdLessons = result.data.lesson as { id: string }[];

        // Upload each lesson's local video (if any) now that we have real
        // module/lesson ids, then attach the uploaded URL to that lesson.
        for (let i = 0; i < module.lesson.length; i++) {
          const lesson = module.lesson[i];
          const createdLesson = createdLessons[i];
          if (lesson.lesson_video && lesson.lesson_video.startsWith('file://') && createdLesson) {
            const videoUrl = await uploadVideo(courseId as string, createdModuleId, lesson.lesson_video);
            await attachLessonVideo(createdLesson.id, videoUrl);
          }
        }

        results.push(result);
      }

      Alert.alert('Success', 'Modules created successfully', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);

    } catch (error: any) {
      console.error('Error saving modules:', error);
      Alert.alert('Error', error.message || 'Failed to save modules. Please try again.');
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
        <Text style={styles.headerTitle}>Add Module</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#3F1F22" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Add Module button */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Module</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={addModule}
            disabled={loading}
          >
            <Ionicons name="add-circle-outline" size={18} color="#3F1F22" />
            <Text style={styles.addButtonText}>Add Module</Text>
          </TouchableOpacity>
        </View>

        {/* Modules */}
        {modules.map((module, moduleIndex) => (
          <View key={module.id} style={styles.moduleCard}>
            {/* Module Header */}
            <View style={styles.moduleHeader}>
              <View style={styles.moduleNumber}>
                <Text style={styles.moduleNumberText}>{moduleIndex + 1}</Text>
              </View>
              <Text style={styles.moduleLabel}>Module</Text>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteModule(module.id)}
                disabled={loading}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {/* Module Fields */}
            <View style={styles.field}>
              <Text style={styles.label}>Module Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Introduction to Discipleship"
                value={module.module_title}
                onChangeText={(text) => updateModule(module.id, 'module_title', text)}
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="This introduces the meaning of discipleship, exploring its biblical foundation and the call to follow Jesus."
                value={module.module_description}
                onChangeText={(text) => updateModule(module.id, 'module_description', text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Duration (Min) *</Text>
              <TextInput
                style={styles.input}
                placeholder="35"
                value={module.module_duration}
                onChangeText={(text) => updateModule(module.id, 'module_duration', text)}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            {/* Lessons */}
            {module.lesson.map((lesson, lessonIndex) => (
              <View key={lesson.id} style={styles.lessonCard}>
                <View style={styles.lessonHeader}>
                  <Text style={styles.lessonLabel}>Lesson {lessonIndex + 1}</Text>
                  <TouchableOpacity 
                    onPress={() => deleteLesson(module.id, lesson.id)}
                    disabled={loading}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Lesson Title *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Discipleship 101"
                    value={lesson.lesson_title}
                    onChangeText={(text) => updateLesson(module.id, lesson.id, 'lesson_title', text)}
                    editable={!loading}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Lesson Video</Text>
                  {lesson.lesson_video ? (
                    <View style={styles.videoPreview}>
                      <View style={styles.videoPlaceholder}>
                        <Ionicons name="videocam" size={32} color="#666" />
                        <Text style={styles.videoText}>
                          {lesson.lesson_video.startsWith('file://') 
                            ? 'Local video (will upload on save)' 
                            : 'Video attached'
                          }
                        </Text>
                      </View>
                      <View style={styles.videoActions}>
                        <TouchableOpacity 
                          style={styles.videoActionButton}
                          onPress={() => updateLesson(module.id, lesson.id, 'lesson_video', '')}
                          disabled={loading}
                        >
                          <Ionicons name="trash-outline" size={16} color="#fff" />
                          <Text style={styles.videoActionText}>Remove</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.videoActionButton}
                          onPress={() => pickVideo(module.id, lesson.id)}
                          disabled={loading}
                        >
                          <Ionicons name="reload-outline" size={16} color="#fff" />
                          <Text style={styles.videoActionText}>Replace</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.uploadBox}
                      onPress={() => pickVideo(module.id, lesson.id)}
                      disabled={loading}
                    >
                      <Ionicons name="cloud-upload-outline" size={28} color="#999" />
                      <Text style={styles.uploadText}>Upload lesson video (Optional)</Text>
                      <Text style={styles.uploadSubtext}>Supports MP4, MOV, AVI</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Add Lesson Button */}
            <TouchableOpacity 
              style={styles.addLessonButton}
              onPress={() => addLesson(module.id)}
              disabled={loading}
            >
              <Ionicons name="add-outline" size={20} color="#666" />
              <Text style={styles.addLessonText}>Add Lesson</Text>
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
  moduleCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  moduleNumber: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  moduleLabel: {
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
  lessonCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lessonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  videoPreview: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoPlaceholder: {
    height: 160,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  videoActions: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 12,
  },
  videoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    borderRadius: 6,
  },
  videoActionText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  addLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8E8E8',
    paddingVertical: 14,
    borderRadius: 8,
  },
  addLessonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
});