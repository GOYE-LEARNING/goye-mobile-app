// app/(tabs)/courses/[id]/materials.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/constants/config';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function Materials() {
  const params = useLocalSearchParams();
  const { user, token, isInstructor } = useUser();
  const { colors } = useTheme();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchCourseData();
    testFileSystem();
  }, [params.id]);

  // Test FileSystem availability
  const testFileSystem = () => {
    console.log('=== FILE SYSTEM TEST ===');
    console.log('documentDirectory:', FileSystem.documentDirectory);
    console.log('cacheDirectory:', FileSystem.cacheDirectory);
    console.log('bundleDirectory:', FileSystem.bundleDirectory);
    console.log('========================');
  };

  const fetchCourseData = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/course/get-course/${params.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        setCourse(result.data);
      }
    } catch (err) {
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (material: any) => {
    if (!material.material_document) {
      Alert.alert('No Document', 'This material has no document attached');
      return;
    }

    try {
      setDownloading(material.id);
      console.log('=== DOWNLOAD DEBUG ===');
      console.log('📥 Starting download for:', material.material_title);
      console.log('📦 Material document length:', material.material_document?.length);
      
      // Use legacy API - more reliable
      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      console.log('📁 Using directory:', baseDir);
      
      if (!baseDir) {
        // If still no directory, try a hardcoded approach
        console.warn('⚠️ No FileSystem directory, attempting direct share');
        
        // Try direct sharing without saving to file
        Alert.alert('Download', 'This material will be shared directly');
        return;
      }
      
      const filename = material.material_title 
        ? `${material.material_title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        : `Material_${material.id}.pdf`;
      const fileUri = `${baseDir}${filename}`;
      
      console.log('📝 Saving to:', fileUri);
      
      // Use legacy writeAsStringAsync
      await FileSystem.writeAsStringAsync(fileUri, material.material_document, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('✅ File written successfully');

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      console.log('📤 Sharing available?', isAvailable);
      
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: material.material_title,
        });
        console.log('✅ Share dialog opened');
      } else {
        Alert.alert('Download Complete', `Material saved to: ${filename}`);
      }
      console.log('======================');
    } catch (error) {
      console.error('❌ Download error:', error);
      Alert.alert(
        'Download Failed', 
        error instanceof Error ? error.message : 'Unable to download the material'
      );
    } finally {
      setDownloading(null);
    }
  };

  const s = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.errorContainer}>
          <Text style={{ color: colors.text }}>Course not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.brand }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = isInstructor && course.createdUserId === user?.id;
  const materials = course.material || [];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {isOwner ? 'Course Details' : course.course_title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Course Info Section */}
        {isOwner && (
          <View style={s.courseInfo}>
            <Text style={s.courseTitle}>{course.course_title}</Text>
            <View style={s.courseMeta}>
              <View style={s.metaItem}>
                <Ionicons name="bar-chart-outline" size={14} color={colors.success} />
                <Text style={s.metaText}>{course.course_level}</Text>
              </View>
              <View style={[s.metaDivider, { backgroundColor: colors.borderMid }]} />
              <Text style={s.metaText}>{course.module?.length || 0} modules</Text>
            </View>
          </View>
        )}

        {/* Course Image */}
        {course.course_image ? (
          <Image 
            source={{ uri: `data:image/jpeg;base64,${course.course_image}` }}
            style={s.courseImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[s.courseImage, { backgroundColor: colors.backgroundMuted, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="book-outline" size={48} color={colors.textMuted} />
          </View>
        )}

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity 
            style={s.tab}
            onPress={() => router.replace(`/(tabs)/courses/${params.id}/overview` as any)}
          >
            <Text style={s.tabText}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={s.tab}
            onPress={() => router.replace(`/(tabs)/courses/${params.id}/quizzes` as any)}
          >
            <Text style={s.tabText}>Quizzes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, s.tabActive]}>
            <Text style={[s.tabText, s.tabTextActive]}>Materials</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={s.tab}
            onPress={() => router.replace(`/(tabs)/courses/${params.id}/forums` as any)}
          >
            <Text style={s.tabText}>Forums</Text>
          </TouchableOpacity>
        </View>

        <View style={s.content}>
          {isOwner && (
            <View style={s.instructorHeader}>
              <Text style={s.sectionTitle}>All Materials ({materials.length})</Text>
              <TouchableOpacity 
                style={s.addButton}
                onPress={() => router.push(`/(tabs)/courses/${params.id}/add-material` as any)}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.brand} />
                <Text style={[s.addButtonText, { color: colors.brand }]}>Add Material</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isOwner && (
            <Text style={s.sectionTitle}>All Materials ({materials.length})</Text>
          )}

          {/* Material Cards */}
          {materials.length > 0 ? (
            materials.map((material: any, index: number) => (
              <View 
                key={material.id} 
                style={[
                  s.materialCard,
                  index === materials.length - 1 && s.lastMaterialCard
                ]}
              >
                <View style={s.materialHeader}>
                  <Ionicons name="document-text" size={32} color={colors.brand} />
                  <View style={s.materialInfo}>
                    <Text style={s.materialTitle}>{material.material_title}</Text>
                    <Text style={s.materialDescription} numberOfLines={2}>
                      {material.material_description}
                    </Text>
                  </View>
                </View>

                <View style={s.materialMeta}>
                  <View style={s.metaItem}>
                    <Ionicons name="book-outline" size={14} color={colors.textSecondary} />
                    <Text style={s.materialMetaText}>{material.material_pages} pages</Text>
                  </View>
                  {material.material_document && (
                    <View style={s.metaItem}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={s.materialMetaText}>Document attached</Text>
                    </View>
                  )}
                  {!material.material_document && (
                    <View style={s.metaItem}>
                      <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                      <Text style={s.materialMetaText}>No document</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={[
                    s.downloadButton,
                    !material.material_document && s.downloadButtonDisabled
                  ]}
                  onPress={() => handleDownload(material)}
                  disabled={downloading === material.id || !material.material_document}
                >
                  {downloading === material.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons 
                        name="download-outline" 
                        size={18} 
                        color={material.material_document ? "#fff" : colors.textMuted} 
                      />
                      <Text style={[
                        s.downloadButtonText,
                        !material.material_document && s.downloadButtonTextDisabled
                      ]}>
                        {material.material_document ? 'Download' : 'No Document Available'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={s.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
              <Text style={s.emptyText}>No materials yet</Text>
              {isOwner && (
                <Text style={s.emptySubtext}>Add materials for your students</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
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
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      flex: 1,
      textAlign: 'center',
    },
    courseInfo: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    courseTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
    },
    courseMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: c.textSecondary,
    },
    metaDivider: {
      width: 1,
      height: 12,
    },
    courseImage: {
      width: '100%',
      height: 200,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: c.background,
      paddingHorizontal: 20,
      paddingVertical: 8,
      gap: 8,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: c.backgroundSoft,
      borderRadius: 6,
    },
    tabActive: {
      backgroundColor: c.brandLighter,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textSecondary,
    },
    tabTextActive: {
      color: c.brand,
      fontWeight: '600',
    },
    content: {
      padding: 20,
    },
    instructorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
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
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 20,
    },
    materialCard: {
      backgroundColor: c.card,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
    },
    lastMaterialCard: {
      marginBottom: 0,
    },
    materialHeader: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    materialInfo: {
      flex: 1,
    },
    materialTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
      marginBottom: 6,
    },
    materialDescription: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 20,
    },
    materialMeta: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 16,
    },
    materialMetaText: {
      fontSize: 13,
      color: c.textSecondary,
    },
    downloadButton: {
      flexDirection: 'row',
      backgroundColor: c.brand,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 4,
    },
    downloadButtonDisabled: {
      backgroundColor: c.backgroundMuted,
    },
    downloadButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
    downloadButtonTextDisabled: {
      color: c.textMuted,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: c.textMuted,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: c.textMuted,
      marginTop: 8,
    },
  });
}