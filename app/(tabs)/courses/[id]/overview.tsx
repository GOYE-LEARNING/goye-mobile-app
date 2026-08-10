// app/(tabs)/courses/[id]/overview.tsx
import InstructorOverviewContent from '@/components/course-view/InstructorOverviewContent';
import StudentOverviewContent from '@/components/course-view/StudentOverviewContent';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, VideoViewRef } from 'expo-video';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  getCourse, 
  trackVideo, 
  updateVideoTrack, 
  getTrackerByLesson,
  completeLesson,
  generateCertificate
} from '@/services/api';
import { getImageUri, getVideoUri } from '@/utils/helpers';
import { useTranslation } from 'react-i18next';

export default function CourseOverview() {
  const params = useLocalSearchParams();
  const { user, token, isInstructor } = useUser();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  // ── Video tracking refs ────────────────────────────────────────────────────────
  const trackerMap = useRef<Record<string, string>>({});
  const currentTrackerId = useRef<string | null>(null);
  const pendingSeekTime = useRef<number>(0);
  const isInitializing = useRef<boolean>(false);
  const videoViewRef = useRef<VideoViewRef>(null);
  const currentTimeRef = useRef<number>(0);
  const timeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Completion tracking refs
  const hasCompletedCurrentLesson = useRef<boolean>(false);
  const isSubmittingCompletion = useRef<boolean>(false);
  const hasGeneratedCertificate = useRef<boolean>(false);

  const player = useVideoPlayer(null, (p) => { p.loop = false; });

  // ── Poll playback time, auto-save on pause, detect video end ───────────────
  useEffect(() => {
    if (!player) return;

    const playSub = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
      if (event.isPlaying) {
        if (timeInterval.current) clearInterval(timeInterval.current);
        timeInterval.current = setInterval(() => {
          currentTimeRef.current = player.currentTime ?? 0;
        }, 1000);
      } else {
        if (timeInterval.current) {
          clearInterval(timeInterval.current);
          timeInterval.current = null;
        }
        saveProgress(false);
      }
    });

    // Fires when video plays all the way to the end
    const endSub = player.addListener('playToEnd', async () => {
      console.log('[VideoTracking] video finished - playToEnd event');
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
        timeInterval.current = null;
      }
      
      // Save progress with videoFinished = true
      await saveProgress(true);
      
      // Mark lesson as completed - but only once per lesson
      if (currentLesson && !hasCompletedCurrentLesson.current && !isSubmittingCompletion.current) {
        console.log('[Lesson] Attempting to complete lesson:', currentLesson.id);
        await handleCompleteLesson(currentLesson.id);
      } else {
        console.log('[Lesson] Skipping completion - already completed or in progress');
      }
    });

    return () => {
      playSub.remove();
      endSub.remove();
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
        timeInterval.current = null;
      }
    };
  }, [player, currentLesson]);

  // ── Swap video source on lesson change ────────────────────────────────────
  useEffect(() => {
    if (!player) return;
    const url = getVideoUri(currentLesson?.lesson_video);
    if (url) {
      player.replaceAsync({ uri: url }).catch((err: any) =>
        console.log('[VideoDebug] replaceAsync error:', err?.message ?? err)
      );
    } else {
      player.replaceAsync(null as any).catch(() => {});
    }
    setIsPlaying(false);
    currentTimeRef.current = 0;
    currentTrackerId.current = null;
    pendingSeekTime.current = 0;
    
    // Reset completion flags when lesson changes
    hasCompletedCurrentLesson.current = false;
    isSubmittingCompletion.current = false;
    console.log('[Lesson] Reset completion flags for new lesson');
  }, [currentLesson]);

  useEffect(() => { fetchCourseData(); }, [params.id]);

  useEffect(() => {
    if (course?.module) {
      const first = findFirstLessonWithVideo(course.module);
      if (first) setCurrentLesson(first);
    }
  }, [course]);

  // Save progress when screen unmounts
  useEffect(() => {
    return () => {
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
        timeInterval.current = null;
      }
      saveProgress(false);
    };
  }, []);

  // ── Tracking helpers ──────────────────────────────────────────────────────

  /** POST track-video once per lesson per session. Stores returned trackerId. */
  const initTracker = async () => {
    if (!currentLesson || !token) return;
    const lessonId = currentLesson.id;

    if (trackerMap.current[lessonId]) {
      currentTrackerId.current = trackerMap.current[lessonId];
      return;
    }

    if (isInitializing.current) return;
    isInitializing.current = true;

    try {
      const existing = await getTrackerByLesson(token, lessonId);
      const existingId: string | undefined = existing?.data?.id;
      if (existingId) {
        trackerMap.current[lessonId] = existingId;
        currentTrackerId.current = existingId;
        console.log('[VideoTracking] reusing existing tracker:', existingId);
        return;
      }

      const result = await trackVideo(token, {
        courseId: params.id as string,
        lessonId,
        videoFinished: false,
        videoTrackTime: 1,
      });

      const trackerId: string | undefined = result?.data?.id ?? result?.data;

      if (trackerId) {
        trackerMap.current[lessonId] = trackerId;
        currentTrackerId.current = trackerId;
        console.log('[VideoTracking] tracker created:', trackerId);
      } else {
        console.warn('[VideoTracking] no trackerId in response:', result);
      }
    } catch (err) {
      console.error('[VideoTracking] initTracker failed:', err);
    } finally {
      isInitializing.current = false;
    }
  };

  /** PUT update-track-video — saves current time & finished flag */
  const saveProgress = async (videoFinished: boolean) => {
    if (!currentTrackerId.current || !token) return;
    const t = Math.floor(currentTimeRef.current);
    if (t <= 0 && !videoFinished) return;
    try {
      await updateVideoTrack(token, currentTrackerId.current, {
        videoFinished,
        videoTrackTime: t > 0 ? t : 1,
      });
      console.log('[VideoTracking] saved at', t, 's, finished:', videoFinished);
    } catch (err) {
      console.error('[VideoTracking] saveProgress failed:', err);
    }
  };

  /**
   * GET /video/get-tracker-id/{lessonId}
   * Looks up any existing tracker for this lesson.
   */
  const loadExistingTracker = async (lessonId: string) => {
    try {
      const result = await getTrackerByLesson(token!, lessonId);
      const tracker = result?.data;
      if (tracker?.id) {
        trackerMap.current[lessonId] = tracker.id;
        currentTrackerId.current = tracker.id;
        const savedTime: number = tracker.videoTrackTime ?? 0;
        console.log('[VideoTracking] existing tracker loaded:', tracker.id, '| saved time:', savedTime, 's');
        
        if (savedTime > 1) {
          pendingSeekTime.current = savedTime;
          console.log('[VideoTracking] pending seek set to', savedTime, 's');
        }
        
        // Check if lesson was already completed
        if (tracker.videoFinished === true) {
          hasCompletedCurrentLesson.current = true;
          setCompletedLessons(prev => new Set(prev).add(lessonId));
          console.log('[Lesson] ✅ Already completed from tracker:', lessonId);
        } else {
          console.log('[Lesson] Not completed yet, ready to track');
        }
      } else {
        console.log('[VideoTracking] no existing tracker for this lesson');
      }
    } catch (err) {
      console.error('[VideoTracking] loadExistingTracker failed:', err);
    }
  };

  // Handle lesson completion
  const handleCompleteLesson = async (lessonId: string) => {
    if (!token || !params.id) {
      console.log('[Lesson] Missing token or courseId');
      return;
    }
    
    // Prevent duplicate submissions
    if (isSubmittingCompletion.current) {
      console.log('[Lesson] Completion already in progress, skipping');
      return;
    }
    
    // Check if already completed
    if (hasCompletedCurrentLesson.current) {
      console.log('[Lesson] Lesson already completed, skipping');
      return;
    }

    try {
      isSubmittingCompletion.current = true;
      console.log('[Lesson] Completing lesson:', lessonId);
      
      const result = await completeLesson(token, params.id as string, lessonId);
      console.log('[Lesson] Complete lesson response:', result);
      
      if (result?.success !== false) {
        hasCompletedCurrentLesson.current = true;
        setCompletedLessons(prev => new Set(prev).add(lessonId));
        console.log('[Lesson] ✅ Lesson completed successfully');
        
        // Show success message
        Alert.alert(
          t('courses.lessonCompleteTitle'),
          t('courses.lessonCompleteMessage'),
          [{ text: t('courses.ok') }]
        );
        
        // Check if all lessons are completed - this will trigger certificate generation
        await checkAllLessonsCompleted();
      } else {
        console.log('[Lesson] Failed to complete lesson:', result?.message || 'Unknown error');
        if (result?.message?.includes('already completed')) {
          hasCompletedCurrentLesson.current = true;
          setCompletedLessons(prev => new Set(prev).add(lessonId));
        }
      }
    } catch (error: any) {
      console.error('[Lesson] Error completing lesson:', error);
      if (error?.message?.includes('already completed')) {
        hasCompletedCurrentLesson.current = true;
        setCompletedLessons(prev => new Set(prev).add(lessonId));
      }
    } finally {
      isSubmittingCompletion.current = false;
    }
  };

  // Check if all lessons are completed and generate certificate
  const checkAllLessonsCompleted = async () => {
    if (!course || !course.module) return;
    
    // Get all lesson IDs from the course
    const allLessonIds: string[] = [];
    course.module.forEach((mod: any) => {
      mod.lesson?.forEach((lesson: any) => {
        if (lesson.id) allLessonIds.push(lesson.id);
      });
    });

    console.log('[Lesson] Checking all lessons completed:', {
      total: allLessonIds.length,
      completed: completedLessons.size
    });

    // Check if all lessons are in the completed set
    const allCompleted = allLessonIds.every(id => completedLessons.has(id));
    
    if (allCompleted && allLessonIds.length > 0 && !hasGeneratedCertificate.current) {
      console.log('[Lesson] 🎉 All lessons completed! Generating certificate...');
      hasGeneratedCertificate.current = true;
      
      try {
        // Generate certificate for the completed course
        const certResult = await generateCertificate(token!, {
          courseId: params.id as string,
        });
        
        console.log('[Certificate] Generation result:', certResult);
        
        if (certResult?.success !== false) {
          // Show success message with certificate
          Alert.alert(
            t('courses.certificateReadyTitle'),
            t('courses.certificateReadyMessage'),
            [
              {
                text: t('courses.viewCertificate'),
                onPress: () => router.push('/(tabs)/home/growth?tab=certificates' as any)
              },
              { text: t('courses.continueLabel'), style: 'cancel' }
            ]
          );
        } else {
          // Show generic completion message if certificate generation failed
          Alert.alert(
            t('courses.courseCompleteTitle'),
            t('courses.courseCompleteMessage'),
            [{ text: t('courses.ok') }]
          );
        }
      } catch (error: any) {
        console.error('[Certificate] Generation error:', error);

        // Still show completion message even if certificate generation fails
        Alert.alert(
          t('courses.courseCompleteTitle'),
          t('courses.courseCompleteMessagePendingCert'),
          [{ text: t('courses.ok') }]
        );
      }
    }
  };

  // ── Playback controls ─────────────────────────────────────────────────────

  const handlePlayPause = async () => {
    if (!player) return;
    if (!isPlaying) {
      if (!currentTrackerId.current && currentLesson?.id) {
        await loadExistingTracker(currentLesson.id);
        if (!currentTrackerId.current) {
          await initTracker();
        }
      }
      player.play();
      if (pendingSeekTime.current > 1) {
        const seekTo = pendingSeekTime.current;
        pendingSeekTime.current = 0;
        setTimeout(() => {
          player.seekBy(seekTo);
          currentTimeRef.current = seekTo;
          console.log('[VideoTracking] seeked to', seekTo, 's');
        }, 400);
      }
    } else {
      player.pause();
    }
  };

  const handleLessonSelect = async (lesson: any) => {
    // Save current lesson before switching
    if (currentTrackerId.current) {
      await saveProgress(false);
    }
    
    // Reset completion flags for new lesson
    hasCompletedCurrentLesson.current = false;
    isSubmittingCompletion.current = false;
    
    setCurrentLesson(lesson);
    console.log('[Lesson] Switched to lesson:', lesson?.id);
  };

  // ── Course helpers ────────────────────────────────────────────────────────

  const findFirstLessonWithVideo = (modules: any[]) => {
    for (const mod of modules) {
      for (const lesson of mod.lesson ?? []) {
        if (lesson.lesson_video?.trim()) return lesson;
      }
    }
    return null;
  };

  const fetchCourseData = async () => {
    try {
      const result = await getCourse(params.id as string, token);
      if (result?.data) {
        setCourse(result.data);
        if (result.data?.module?.[0]?.id) setExpandedModules([result.data.module[0].id]);
      } else {
        setError(result.message || t('courses.unableToLoadCourse'));
      }
    } catch (err) {
      setError(t('courses.unableToLoadCourse'));
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) =>
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );

  const handleEdit = () => router.push(`/(tabs)/courses/${params.id}/edit` as any);

  const handleDelete = () => {
    Alert.alert(t('courses.deleteCourseTitle'), t('courses.deleteCourseMessage'), [
      { text: t('courses.cancel'), style: 'cancel' },
      {
        text: t('courses.delete'), style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `https://goye-platform-backend.onrender.com/api/course/delete-course/${params.id}`,
              { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            const result = await response.json();
            if (response.ok) {
              Alert.alert(t('courses.success'), result.message || t('courses.courseDeletedSuccess'), [
                { text: t('courses.ok'), onPress: () => router.back() }
              ]);
            } else {
              Alert.alert(t('courses.error'), result.message || t('courses.failedToDeleteCourse'));
            }
          } catch {
            Alert.alert(t('courses.error'), t('courses.failedToDeleteCourse'));
          }
        },
      },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const s = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>{t('courses.loadingCourse')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={s.errorText}>{error || t('courses.courseNotFound')}</Text>
          <TouchableOpacity style={s.retryButton} onPress={fetchCourseData}>
            <Text style={s.retryButtonText}>{t('courses.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
            <Text style={s.backButtonText}>{t('courses.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = isInstructor && course.createdUserId === user?.id;
  const totalLessons  = course.module?.reduce((s: number, m: any) => s + (m.lesson?.length || 0), 0) || 0;
  const totalDuration = course.module?.reduce((s: number, m: any) => s + (parseInt(m.module_duration) || 0), 0) || 0;
  const hasVideo  = !!getVideoUri(currentLesson?.lesson_video);
  const imageUri  = getImageUri(course.course_image);

  return (
    <MenuProvider>
      <SafeAreaView style={s.container} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={s.headerTitleContainer}>
            <Text style={s.headerTitle} numberOfLines={1}>
              {isOwner ? t('courses.courseDetails') : course.course_title}
            </Text>
          </View>
          {isOwner ? (
            <Menu>
              <MenuTrigger>
                <View style={s.menuButton}>
                  <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
                </View>
              </MenuTrigger>
              <MenuOptions customStyles={{
                optionsContainer: {
                  backgroundColor: colors.card,
                  padding: 8,
                  borderRadius: 8,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                },
              }}>
                <MenuOption onSelect={handleEdit}>
                  <View style={s.menuItem}>
                    <Ionicons name="pencil-outline" size={20} color={colors.text} />
                    <Text style={s.menuText}>{t('courses.edit')}</Text>
                  </View>
                </MenuOption>
                <MenuOption onSelect={handleDelete}>
                  <View style={s.menuItem}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text style={[s.menuText, { color: '#EF4444' }]}>{t('courses.delete')}</Text>
                  </View>
                </MenuOption>
              </MenuOptions>
            </Menu>
          ) : (
            <View style={s.placeholder} />
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title — instructor */}
          {isOwner && (
            <View style={s.titleSection}>
              <Text style={s.courseTitle}>{course.course_title}</Text>
              <View style={s.courseMetaInfo}>
                <View style={s.metaTag}>
                  <Ionicons name="bar-chart-outline" size={14} color={colors.success} />
                  <Text style={s.metaTagText}>{course.course_level}</Text>
                </View>
                <View style={[s.metaDivider, { backgroundColor: colors.borderMid }]} />
                <Text style={s.metaInfoText}>{t('courses.minutes', { count: totalDuration })}</Text>
                <View style={[s.metaDivider, { backgroundColor: colors.borderMid }]} />
                <Text style={s.metaInfoText}>{t('courses.lessonsCount', { count: totalLessons })}</Text>
              </View>
            </View>
          )}

          {/* Video player — student */}
          {!isOwner && (
            <View style={s.videoContainer}>
              {hasVideo ? (
                <VideoView
                  ref={videoViewRef}
                  player={player}
                  style={s.videoPlayer}
                  fullscreenOptions={{ 
                    allowsFullscreen: true,
                    allowsPictureInPicture: true 
                  }}
                  contentFit="contain"
                />
              ) : (
                <View style={[s.noVideoPlaceholder, { backgroundColor: colors.backgroundMuted }]}>
                  <Ionicons name="videocam-off-outline" size={48} color={colors.textMuted} />
                  <Text style={s.noVideoText}>
                    {currentLesson ? t('courses.noVideoForLesson') : t('courses.selectLessonToWatch')}
                  </Text>
                </View>
              )}

              {hasVideo && !isPlaying && (
                <TouchableOpacity style={s.playButton} onPress={handlePlayPause}>
                  <Ionicons name="play" size={40} color="#fff" />
                </TouchableOpacity>
              )}

              {currentLesson && (
                <View style={s.videoInfoBar}>
                  <Text style={s.currentLessonTitle} numberOfLines={1}>
                    {currentLesson.lesson_title}
                  </Text>
                  <View style={s.videoControls}>
                    <TouchableOpacity onPress={handlePlayPause} style={s.videoControlBtn}>
                      <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => videoViewRef.current?.enterFullscreen()}
                      style={s.videoControlBtn}
                    >
                      <Ionicons name="expand-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Hero image — instructor */}
          {isOwner && imageUri && (
            <View style={s.imageContainer}>
              <Image source={{ uri: imageUri }} style={s.heroImage} contentFit="cover" />
            </View>
          )}

          {/* Tabs */}
          <View style={s.tabs}>
            <TouchableOpacity style={[s.tab, s.tabActive]}>
              <Text style={[s.tabText, s.tabTextActive]}>{t('courses.tabOverview')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.tab} onPress={() => router.push(`/(tabs)/courses/${params.id}/quizzes` as any)}>
              <Text style={s.tabText}>{t('courses.tabQuizzes')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.tab} onPress={() => router.push(`/(tabs)/courses/${params.id}/materials` as any)}>
              <Text style={s.tabText}>{t('courses.tabMaterials')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.tab} onPress={() => router.push(`/(tabs)/courses/${params.id}/forums` as any)}>
              <Text style={s.tabText}>{t('courses.tabForums')}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.content}>
            {isOwner ? (
              <InstructorOverviewContent courseData={course} token={token} />
            ) : (
              <StudentOverviewContent
                courseData={course}
                expandedModules={expandedModules}
                toggleModule={toggleModule}
                token={token}
                onLessonSelect={handleLessonSelect}
                currentLessonId={currentLesson?.id}
                completedLessons={completedLessons}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </MenuProvider>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { fontSize: 16, color: c.textSecondary },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 16 },
    errorText: { fontSize: 16, color: c.textSecondary, textAlign: 'center' },
    retryButton: { backgroundColor: c.brand, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    backButton: { paddingVertical: 12, paddingHorizontal: 32 },
    backButtonText: { color: c.textSecondary, fontSize: 16 },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      borderBottomWidth: 1, 
      borderBottomColor: c.border 
    },
    backBtn: { padding: 4 },
    headerTitleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
    headerTitle: { fontSize: 16, fontWeight: '600', color: c.text },
    menuButton: { padding: 4 },
    placeholder: { width: 24 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
    menuText: { fontSize: 16, color: c.text },
    titleSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    courseTitle: { fontSize: 20, fontWeight: '700', color: c.text, marginBottom: 12 },
    courseMetaInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaTagText: { fontSize: 12, fontWeight: '600', color: c.success },
    metaDivider: { width: 1, height: 12 },
    metaInfoText: { fontSize: 12, color: c.textSecondary },
    videoContainer: { backgroundColor: '#000', width: '100%', height: 220, position: 'relative' },
    videoPlayer: { width: '100%', height: '100%' },
    noVideoPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    noVideoText: { color: c.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
    playButton: { 
      position: 'absolute', 
      top: '50%', 
      left: '50%', 
      transform: [{ translateX: -35 }, { translateY: -35 }], 
      width: 70, 
      height: 70, 
      borderRadius: 35, 
      backgroundColor: 'rgba(255,255,255,0.3)', 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    videoInfoBar: { 
      position: 'absolute', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      padding: 12, 
      backgroundColor: 'rgba(0,0,0,0.6)', 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between' 
    },
    currentLessonTitle: { color: '#fff', fontSize: 13, flex: 1, marginRight: 12 },
    videoControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    videoControlBtn: { padding: 6 },
    imageContainer: { paddingHorizontal: 20, marginBottom: 16, marginTop: 16 },
    heroImage: { width: '100%', height: 180, backgroundColor: c.backgroundMuted, borderRadius: 8 },
    tabs: { 
      flexDirection: 'row', 
      backgroundColor: c.background, 
      paddingHorizontal: 20, 
      paddingVertical: 8, 
      gap: 8 
    },
    tab: { 
      flex: 1, 
      paddingVertical: 12, 
      alignItems: 'center', 
      backgroundColor: c.backgroundSoft, 
      borderRadius: 6 
    },
    tabActive: { backgroundColor: c.brandLighter },
    tabText: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
    tabTextActive: { color: c.brand, fontWeight: '600' },
    content: { padding: 20 },
  });
}