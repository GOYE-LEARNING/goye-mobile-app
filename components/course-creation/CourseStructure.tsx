// components/course-creation/CourseStructure.tsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { CustomAlert } from '@/components/CustomAlert';

interface Lesson {
  id: string;
  title: string;
  video: string | null;
}

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: Lesson[];
  expanded: boolean;
}

interface Props {
  data: any;
  onChange: (data: any) => void;
}

export default function CourseStructure({ data, onChange }: Props) {
  const { colors } = useTheme();
  const [modules, setModules] = useState<Module[]>(data.modules || []);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    primaryLabel?: string;
    secondaryLabel?: string;
    onPrimary: () => void;
    onSecondary?: () => void;
  } | null>(null);

  const addModule = () => {
    const newModule: Module = {
      id: Date.now().toString(),
      title: '',
      description: '',
      duration: '',
      lessons: [],
      expanded: true,
    };
    const updated = [...modules, newModule];
    setModules(updated);
    setExpandedModule(newModule.id);
    onChange({ modules: updated });
  };

  const updateModule = (moduleId: string, field: string, value: string) => {
    const updated = modules.map(m => 
      m.id === moduleId ? { ...m, [field]: value } : m
    );
    setModules(updated);
    onChange({ modules: updated });
  };

  const deleteModule = (moduleId: string) => {
    setAlert({
      visible: true,
      type: 'warning',
      title: 'Delete Module',
      message: 'Are you sure you want to delete this module? All lessons in this module will also be deleted.',
      primaryLabel: 'Delete',
      secondaryLabel: 'Cancel',
      onPrimary: () => {
        setAlert(null);
        const updated = modules.filter(m => m.id !== moduleId);
        setModules(updated);
        onChange({ modules: updated });
      },
      onSecondary: () => {
        setAlert(null);
      }
    });
  };

  const addLesson = (moduleId: string) => {
    const updated = modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: [
            ...m.lessons,
            { id: Date.now().toString(), title: '', video: null }
          ]
        };
      }
      return m;
    });
    setModules(updated);
    onChange({ modules: updated });
  };

  const updateLesson = (moduleId: string, lessonId: string, field: string, value: string) => {
    const updated = modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => 
            l.id === lessonId ? { ...l, [field]: value } : l
          )
        };
      }
      return m;
    });
    setModules(updated);
    onChange({ modules: updated });
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    setAlert({
      visible: true,
      type: 'warning',
      title: 'Delete Lesson',
      message: 'Are you sure you want to delete this lesson?',
      primaryLabel: 'Delete',
      secondaryLabel: 'Cancel',
      onPrimary: () => {
        setAlert(null);
        const updated = modules.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: m.lessons.filter(l => l.id !== lessonId)
            };
          }
          return m;
        });
        setModules(updated);
        onChange({ modules: updated });
      },
      onSecondary: () => {
        setAlert(null);
      }
    });
  };

  const pickVideo = async (moduleId: string, lessonId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const fileSizeInMB = file.size ? file.size / (1024 * 1024) : 0;
        
        // Check if file size exceeds 45MB
        if (fileSizeInMB > 45) {
          setAlert({
            visible: true,
            type: 'error',
            title: 'File Too Large',
            message: `Video file size is ${fileSizeInMB.toFixed(1)}MB. Please upload a video smaller than 45MB.`,
            primaryLabel: 'OK',
            onPrimary: () => setAlert(null)
          });
          return;
        }
        
        updateLesson(moduleId, lessonId, 'video', file.uri);
      }
    } catch (error) {
      console.log('Error picking video:', error);
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to select video. Please try again.',
        primaryLabel: 'OK',
        onPrimary: () => setAlert(null)
      });
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.sectionTitle}>Course Structure</Text>
        <TouchableOpacity style={s.addButton} onPress={addModule}>
          <Ionicons name="add-circle-outline" size={18} color={colors.brand} />
          <Text style={[s.addButtonText, { color: colors.brand }]}>Add Module</Text>
        </TouchableOpacity>
      </View>

      {modules.map((module, moduleIndex) => (
        <View key={module.id} style={[s.moduleCard, { backgroundColor: colors.card }]}>
          {/* Module Header */}
          <View style={s.moduleHeader}>
            <View style={[s.moduleNumber, { backgroundColor: colors.success }]}>
              <Text style={s.moduleNumberText}>{moduleIndex + 1}</Text>
            </View>
            <TouchableOpacity 
              style={s.moduleHeaderContent}
              onPress={() => toggleModule(module.id)}
            >
              <Text style={[s.moduleLabel, { color: colors.text }]}>Module</Text>
              <Ionicons 
                name={expandedModule === module.id ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.deleteButton}
              onPress={() => deleteModule(module.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Expanded Module Content */}
          {expandedModule === module.id && (
            <>
              <View style={s.field}>
                <Text style={[s.label, { color: colors.textSecondary }]}>Module Title</Text>
                <TextInput
                  style={[s.input, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Introduction to Discipleship"
                  placeholderTextColor={colors.textMuted}
                  value={module.title}
                  onChangeText={(text) => updateModule(module.id, 'title', text)}
                />
              </View>

              <View style={s.field}>
                <Text style={[s.label, { color: colors.textSecondary }]}>Description</Text>
                <TextInput
                  style={[s.input, s.textArea, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="This introduces the meaning of discipleship..."
                  placeholderTextColor={colors.textMuted}
                  value={module.description}
                  onChangeText={(text) => updateModule(module.id, 'description', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={s.field}>
                <Text style={[s.label, { color: colors.textSecondary }]}>Duration (Min)</Text>
                <TextInput
                  style={[s.input, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="35"
                  placeholderTextColor={colors.textMuted}
                  value={module.duration}
                  onChangeText={(text) => updateModule(module.id, 'duration', text)}
                  keyboardType="numeric"
                />
              </View>

              {/* Lessons */}
              {module.lessons.map((lesson, lessonIndex) => (
                <View key={lesson.id} style={[s.lessonCard, { backgroundColor: colors.backgroundSoft }]}>
                  <View style={s.field}>
                    <Text style={[s.label, { color: colors.textSecondary }]}>Lesson Title</Text>
                    <TextInput
                      style={[s.input, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                      placeholder="Discipleship 101"
                      placeholderTextColor={colors.textMuted}
                      value={lesson.title}
                      onChangeText={(text) => updateLesson(module.id, lesson.id, 'title', text)}
                    />
                  </View>

                  <View style={s.field}>
                    <Text style={[s.label, { color: colors.textSecondary }]}>Lesson Video</Text>
                    {lesson.video ? (
                      <View style={s.videoPreview}>
                        <View style={[s.videoPlaceholder, { backgroundColor: colors.backgroundMuted }]}>
                          <Ionicons name="videocam" size={32} color={colors.textSecondary} />
                          <Text style={[s.videoText, { color: colors.textSecondary }]}>Video attached</Text>
                          <Text style={[s.videoSizeText, { color: colors.textMuted }]}>Max 45MB</Text>
                        </View>
                        <View style={s.videoActions}>
                          <TouchableOpacity 
                            style={s.videoActionButton}
                            onPress={() => updateLesson(module.id, lesson.id, 'video', '')}
                          >
                            <Ionicons name="trash-outline" size={16} color="#fff" />
                            <Text style={s.videoActionText}>Remove</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={s.videoActionButton}
                            onPress={() => pickVideo(module.id, lesson.id)}
                          >
                            <Ionicons name="reload-outline" size={16} color="#fff" />
                            <Text style={s.videoActionText}>Replace</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={[s.uploadBox, { borderColor: colors.borderMid, backgroundColor: colors.backgroundSoft }]}
                        onPress={() => pickVideo(module.id, lesson.id)}
                      >
                        <Ionicons name="cloud-upload-outline" size={28} color={colors.textMuted} />
                        <Text style={[s.uploadText, { color: colors.text }]}>Upload lesson video</Text>
                        <Text style={[s.uploadSubtext, { color: colors.textMuted }]}>Supports MP4, MOV, etc. (Max 45MB)</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity 
                    style={s.deleteLessonButton}
                    onPress={() => deleteLesson(module.id, lesson.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={s.deleteLessonText}>Delete Lesson</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Lesson Button */}
              <TouchableOpacity 
                style={[s.addLessonButton, { backgroundColor: colors.brandLighter }]}
                onPress={() => addLesson(module.id)}
              >
                <Ionicons name="add-outline" size={20} color={colors.textSecondary} />
                <Text style={[s.addLessonText, { color: colors.textSecondary }]}>Add Lesson</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ))}

      {modules.length === 0 && (
        <View style={s.emptyState}>
          <Ionicons name="book-outline" size={48} color={colors.textMuted} />
          <Text style={[s.emptyText, { color: colors.textMuted }]}>No modules yet</Text>
          <Text style={[s.emptySubtext, { color: colors.textMuted }]}>Click "Add Module" to get started</Text>
        </View>
      )}
      
      {/* Custom Alert */}
      {alert && (
        <CustomAlert
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          primaryLabel={alert.primaryLabel || 'OK'}
          secondaryLabel={alert.secondaryLabel}
          onPrimary={alert.onPrimary}
          onSecondary={alert.onSecondary}
        />
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
    moduleCard: {
      padding: 16,
      marginBottom: 16,
      borderRadius: 8,
    },
    moduleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    moduleNumber: {
      width: 32,
      height: 32,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    moduleNumberText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    moduleHeaderContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    moduleLabel: {
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
    lessonCard: {
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    uploadBox: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 8,
      padding: 32,
      alignItems: 'center',
    },
    uploadText: {
      fontSize: 14,
      fontWeight: '500',
      marginTop: 8,
    },
    uploadSubtext: {
      fontSize: 12,
      marginTop: 4,
    },
    videoPreview: {
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
    },
    videoPlaceholder: {
      height: 160,
      alignItems: 'center',
      justifyContent: 'center',
    },
    videoText: {
      fontSize: 14,
      marginTop: 8,
    },
    videoSizeText: {
      fontSize: 11,
      marginTop: 4,
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
      color: '#fff',
      fontSize: 13,
      fontWeight: '500',
    },
    deleteLessonButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      marginTop: 8,
    },
    deleteLessonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#EF4444',
    },
    addLessonButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 8,
    },
    addLessonText: {
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