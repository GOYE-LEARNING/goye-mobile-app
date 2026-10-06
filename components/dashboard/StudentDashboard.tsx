// app/(tabs)/home/index.tsx (Student Dashboard)
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import EventCard from '@/components/community/EventCard';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useAlert } from '@/hooks/useAlert';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import { useSignUp } from '@/contexts/SignUpContext';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import {
  getAnnouncementsByAdmin,
  getEnrolledCourses,
  getGrowthByProgressId,
  getStudentGroupEvents,
  getUserProfile,
  startGrowthJourney,
} from '@/services/api';
import { getImageUri } from '@/utils/helpers';

const { height } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Progress bar color scales from brand orange → warning yellow → success green. */
function getProgressColor(percentage: number): string {
  if (percentage >= 80) return '#10B981';
  if (percentage >= 50) return '#F59E0B';
  return '#FFA500';
}

/** Single source of truth for the local avatar cache key. */
function profilePicStorageKey(userId?: string): string | null {
  return userId ? `user_pic_${userId}` : null;
}

/** Normalizes the various shapes our APIs return. */
function unwrap<T>(result: any): T {
  return (result?.user ?? result?.data ?? result) as T;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: signUpData } = useSignUp();
  const { user, token } = useUser();
  const { colors } = useTheme();
  const unreadCount = useUnreadNotificationCount();
  const { t } = useTranslation();
  const { alert, AlertComponent } = useAlert();

  const [journeyStarted, setJourneyStarted] = useState(false);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [growthData, setGrowthData] = useState<any>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [enrolledCourse, setEnrolledCourse] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<{ id: string; title: string; message: string } | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  const s = makeStyles(colors);

  // ─── Data fetchers ──────────────────────────────────────────────────────────

  const fetchEnrolledCourse = useCallback(async () => {
    if (!token) return;
    setCourseLoading(true);
    try {
      const result = await getEnrolledCourses(token);
      const courses = result?.data?.courses;
      if (Array.isArray(courses) && courses.length > 0) {
        setEnrolledCourse(courses[0]);
      } else {
        setEnrolledCourse(null);
      }
    } catch (err) {
      console.error('[Dashboard] enrolled course error:', err);
    } finally {
      setCourseLoading(false);
    }
  }, [token]);

  const fetchAnnouncement = useCallback(async () => {
    if (!token) return;
    try {
      const result = await getAnnouncementsByAdmin(token);
      const list = Array.isArray(result?.data) ? result.data : [];
      if (list.length > 0) setAnnouncement(list[0]);
    } catch (err) {
      console.error('[Dashboard] announcement error:', err);
    }
  }, [token]);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setEventsLoading(true);
    try {
      const result = await getStudentGroupEvents(token);
      const list = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
        ? result
        : [];
      setEvents(list);
    } catch (err) {
      console.error('[Dashboard] events error:', err);
    } finally {
      setEventsLoading(false);
    }
  }, [token]);

  /**
   * Prefers a locally-uploaded Cloudinary avatar from AsyncStorage over the
   * API response, because the backend's /user/profile endpoint returns a
   * stale Google OAuth URL for Google-authenticated accounts even after the
   * user uploads a new one. Falling back to the API preserves avatars for
   * users who have never uploaded.
   */
  const fetchProfilePic = useCallback(async () => {
    if (!token) return;
    try {
      const cacheKey = profilePicStorageKey(user?.id);
      if (cacheKey) {
        const localPic = await AsyncStorage.getItem(cacheKey);
        if (localPic) {
          setProfilePic(localPic);
          return;
        }
      }

      const result = await getUserProfile(token);
      const userData = unwrap<any>(result);
      if (userData?.user_pic) {
        setProfilePic(getImageUri(userData.user_pic));
      }
    } catch (err) {
      console.error('[Dashboard] profile pic error:', err);
    }
  }, [token, user?.id]);

  const fetchGrowthData = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        const result = await getGrowthByProgressId(id, token);
        if (result?.data) setGrowthData(result.data);
      } catch (err) {
        console.error('[Dashboard] Error fetching growth data:', err);
      }
    },
    [token]
  );

  const checkJourneyStatus = useCallback(async () => {
    if (!token) return;
    try {
      const result = await startGrowthJourney(token);
      const progressFromResponse = result?.data?.id ?? result?.data?.progressId;
      if (progressFromResponse) {
        setProgressId(progressFromResponse);
        setJourneyStarted(true);
        await fetchGrowthData(progressFromResponse);
      }
    } catch (err: any) {
      // The API returns "already started" as a non-fatal path; the journey ID
      // may be present in the error payload.
      const progressFromError = err?.data?.id ?? err?.data?.progressId;
      if (progressFromError) {
        setProgressId(progressFromError);
        setJourneyStarted(true);
        await fetchGrowthData(progressFromError);
      } else {
        console.log('[Dashboard] No active journey or error checking:', err?.message);
      }
    }
  }, [token, fetchGrowthData]);

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchEvents();
    checkJourneyStatus();
    fetchEnrolledCourse();
    fetchAnnouncement();
  }, [fetchEvents, checkJourneyStatus, fetchEnrolledCourse, fetchAnnouncement]);

  // Avatar is refreshed every time the tab gains focus so an upload on the
  // Profile screen is reflected here without a full app reload.
  useFocusEffect(
    useCallback(() => {
      fetchProfilePic();
    }, [fetchProfilePic])
  );

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleGrowthPress = () => {
    if (progressId) {
      router.push(`/(tabs)/home/growth?progressId=${progressId}` as any);
    } else {
      alert(t('common.error'), t('home.studentDashboard.alertUnableToLoadGrowth'));
    }
  };

  const handleStartJourney = async () => {
    if (!token) return;
    setJourneyLoading(true);
    try {
      const result = await startGrowthJourney(token);
      const newProgressId = result?.data?.id ?? result?.data?.progressId;
      if (newProgressId) {
        setProgressId(newProgressId);
        setJourneyStarted(true);
        await fetchGrowthData(newProgressId);
        alert(t('common.success'), t('home.studentDashboard.alertJourneyStartedMessage'));
      }
    } catch (err: any) {
      console.error('[Dashboard] Start journey error:', err);
      const existingProgressId = err?.data?.id ?? err?.data?.progressId;
      if (existingProgressId) {
        setProgressId(existingProgressId);
        setJourneyStarted(true);
        await fetchGrowthData(existingProgressId);
        alert(
          t('home.studentDashboard.alertJourneyAlreadyStartedTitle'),
          t('home.studentDashboard.alertJourneyAlreadyStartedMessage')
        );
      } else if (err?.message?.includes('already started')) {
        await checkJourneyStatus();
      } else {
        alert(
          t('common.error'),
          err?.message ?? t('home.studentDashboard.alertStartJourneyErrorFallback')
        );
      }
    } finally {
      setJourneyLoading(false);
    }
  };

  // ─── Derived data ───────────────────────────────────────────────────────────

  const stats = growthData?.stats ?? {};
  const userData = growthData?.user ?? {};
  const achievements = growthData?.achievements ?? {};
  const levelProgress = achievements?.levelProgress ?? {};
  const badges = achievements?.badges ?? [];

  const levelName =
    levelProgress?.name ||
    userData?.currentLevel?.replace(/_/g, ' ') ||
    t('home.studentDashboard.defaultLevelSeeker');
  const totalPoints = Math.round(userData?.totalXP ?? stats?.totalPoints ?? 0);
  const totalBadges = stats?.totalBadges ?? badges.length;
  const totalAchievements = stats?.totalAchievements ?? 0;
  const completedCourses = stats?.completedCourses ?? 0;

  // currentLevelXP / xpForCurrentLevel are raw XP counts. progressToNext is
  // already a 0-100 percentage from the backend — it must NOT be divided again.
  const currentLevelXP = Math.round(userData?.currentLevelXP ?? levelProgress?.currentLevelXP ?? 0);
  const xpForCurrentLevel = Math.round(userData?.xpForCurrentLevel ?? levelProgress?.xpForCurrentLevel ?? 0);
  const progressPercentage = Math.round(
    userData?.progressToNextLevel ?? levelProgress?.progressToNext ?? 0
  );

  const recentActivity: any[] = Array.isArray(growthData?.recentActivity)
    ? growthData.recentActivity
    : [];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={s.wrapper}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>
                {user?.first_name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View>
            <Text style={s.greetingSmall}>{t('home.studentDashboard.greeting')}</Text>
            <Text style={s.userName}>{user?.first_name}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.notificationButton}
          onPress={() => router.push('/(tabs)/home/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.headerText} />
          <NotificationBadge count={unreadCount} />
        </TouchableOpacity>
      </View>

      <View style={s.modalContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.headerRow}>
            <Text style={s.title}>{t('home.studentDashboard.dashboardTitle')}</Text>
          </View>

          {/* Announcement */}
          {announcement && showAnnouncement && (
            <View style={s.announcementCard}>
              <View style={s.announcementTopRow}>
                <View style={s.announcementLabelRow}>
                  <Ionicons name="megaphone-outline" size={14} color={colors.success} />
                  <Text style={s.announcementLabel}>
                    {t('home.studentDashboard.announcementLabel')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowAnnouncement(false)}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={s.announcementTitle}>{announcement.title}</Text>
              <Text style={s.announcementMessage}>{announcement.message}</Text>
            </View>
          )}

          {/* My Courses */}
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{t('home.studentDashboard.myCourses')}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/courses')}>
                <Text style={s.viewAll}>{t('home.studentDashboard.viewAll')}</Text>
              </TouchableOpacity>
            </View>

            <View style={s.cardContent}>
              {courseLoading ? (
                <ActivityIndicator size="small" color={colors.brand} style={{ marginVertical: 20 }} />
              ) : enrolledCourse ? (
                <CoursePreview
                  course={enrolledCourse}
                  onContinue={() =>
                    router.push(
                      `/(tabs)/courses/details?id=${enrolledCourse.course?.id}` as any
                    )
                  }
                  s={s}
                  t={t}
                />
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={s.courseDescription}>
                    {t('home.studentDashboard.noCourseEnrolled')}
                  </Text>
                  <TouchableOpacity
                    style={s.continueButton}
                    onPress={() => router.push('/(tabs)/courses')}
                  >
                    <Text style={s.continueButtonText}>
                      {t('home.studentDashboard.browseCourses')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Spiritual Growth */}
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                {t('home.studentDashboard.spiritualGrowthMilestone')}
              </Text>
            </View>

            {!journeyStarted && (
              <View style={s.journeyStartContainer}>
                <View style={s.journeyIconWrapper}>
                  <Ionicons name="leaf-outline" size={48} color={colors.brand} />
                </View>
                <Text style={s.journeyHeading}>
                  {t('home.studentDashboard.beginGrowthJourney')}
                </Text>
                <Text style={s.journeySubtext}>
                  {t('home.studentDashboard.growthJourneyDescription')}
                </Text>
                <TouchableOpacity
                  style={[s.startJourneyButton, journeyLoading && s.buttonDisabled]}
                  onPress={handleStartJourney}
                  disabled={journeyLoading}
                >
                  {journeyLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="rocket-outline"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={s.startJourneyButtonText}>
                        {t('home.studentDashboard.startYourJourney')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {journeyStarted && growthData && (
              <View style={s.cardContent}>
                <View style={s.milestoneHeader}>
                  <View style={s.levelBadge}>
                    <Text style={s.levelText}>{levelName}</Text>
                  </View>
                  <Text style={s.pointsText}>
                    {t('home.studentDashboard.xpSuffix', { points: totalPoints })}
                  </Text>
                </View>

                <View style={s.progressTrack}>
                  <View
                    style={[
                      s.progressFill,
                      {
                        width: `${Math.min(progressPercentage, 100)}%`,
                        backgroundColor: getProgressColor(progressPercentage),
                      },
                    ]}
                  />
                </View>

                <Text style={s.levelProgress}>
                  {t('home.studentDashboard.xpToNextLevel', {
                    progress: currentLevelXP,
                    max: xpForCurrentLevel,
                  })}
                </Text>

                <View style={s.statsGrid}>
                  {[
                    { num: totalAchievements, label: t('home.studentDashboard.statAchievements') },
                    { num: completedCourses, label: t('home.studentDashboard.statCertificates') },
                    { num: totalBadges, label: t('home.studentDashboard.statBadges') },
                    { num: totalPoints, label: t('home.studentDashboard.statTotalPoints') },
                  ].map(({ num, label }) => (
                    <View key={label} style={s.statItem}>
                      <Text style={s.statNumber}>{num}</Text>
                      <Text style={s.statLabel}>{label}</Text>
                    </View>
                  ))}
                </View>

                {recentActivity.length > 0 && (
                  <View style={s.recentActivitySection}>
                    <Text style={s.recentActivityHeading}>
                      {t('home.studentDashboard.recentActivity')}
                    </Text>
                    {recentActivity.slice(0, 5).map((activity, idx) => (
                      <View key={idx} style={s.recentActivityRow}>
                        <Text style={s.recentActivityAction}>{activity.action}</Text>
                        {activity.points != 0 && (
                          <Text style={s.recentActivityPoints}>+{activity.points} XP</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={s.viewGrowthButton} onPress={handleGrowthPress}>
                  <Text style={s.viewGrowthButtonText}>
                    {t('home.studentDashboard.viewGrowth')}
                  </Text>
                </TouchableOpacity>

                <LeaderboardBanner
                  onPress={() => router.push('/(tabs)/home/leaderboard' as any)}
                  s={s}
                  t={t}
                />
              </View>
            )}
          </View>

          {/* Upcoming Events */}
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                {t('home.studentDashboard.upcomingEvents')}
              </Text>
              <TouchableOpacity>
                <Text style={s.viewAll}>{t('home.studentDashboard.viewAll')}</Text>
              </TouchableOpacity>
            </View>

            <View style={s.eventsContainer}>
              {eventsLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.brand}
                  style={{ marginVertical: 20 }}
                />
              ) : events.length === 0 ? (
                <View style={s.noEventsContainer}>
                  <Ionicons name="calendar-outline" size={32} color={colors.borderMid} />
                  <Text style={s.noEventsText}>
                    {t('home.studentDashboard.noUpcomingEvents')}
                  </Text>
                  <Text style={s.noEventsSubText}>
                    {t('home.studentDashboard.joinGroupForEvents')}
                  </Text>
                </View>
              ) : (
                events.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    title={event.event_name ?? event.title ?? ''}
                    description={event.event_description ?? event.description ?? ''}
                    date={event.event_date ?? event.date ?? ''}
                    time={event.event_time ?? event.time ?? ''}
                    type={event.event_type ?? event.type ?? 'Meeting'}
                    eventLink={event.event_link ?? event.link}
                    hasNotification={event.hasNotification}
                    isLocked={event.isLocked}
                  />
                ))
              )}
            </View>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>

      {AlertComponent}
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type StyleSheetShape = ReturnType<typeof makeStyles>;
type TranslateFn = (key: string, opts?: any) => string;

function CoursePreview({
  course,
  onContinue,
  s,
  t,
}: {
  course: any;
  onContinue: () => void;
  s: StyleSheetShape;
  t: TranslateFn;
}) {
  const percentage = course?.course_progress?.percentage ?? 0;
  return (
    <>
      <Text style={s.courseTitle}>{course.course?.course_title}</Text>
      <Text style={s.courseSubtitle}>{course.course?.course_short_description}</Text>
      <Text style={s.courseDescription} numberOfLines={2}>
        {course.course?.course_description}
      </Text>

      <View style={s.progressHeader}>
        <Text style={s.progressLabel}>{t('home.studentDashboard.yourProgress')}</Text>
        <Text style={s.progressLabel}>
          {t('home.studentDashboard.percentToComplete', { percent: percentage })}
        </Text>
      </View>

      <View style={s.progressTrack}>
        <View
          style={[
            s.progressFill,
            { width: `${percentage}%`, backgroundColor: getProgressColor(percentage) },
          ]}
        />
      </View>

      <TouchableOpacity style={s.continueButton} onPress={onContinue}>
        <Text style={s.continueButtonText}>
          {t('home.studentDashboard.continueCourse')}
        </Text>
      </TouchableOpacity>
    </>
  );
}

function LeaderboardBanner({
  onPress,
  s,
  t,
}: {
  onPress: () => void;
  s: StyleSheetShape;
  t: TranslateFn;
}) {
  const podiumColors = ['#F59E0B', '#9CA3AF', '#B45309'];

  return (
    <TouchableOpacity style={s.leaderboardBanner} onPress={onPress} activeOpacity={0.85}>
      <View style={s.leaderboardBannerLeft}>
        <View style={s.leaderboardIconRing}>
          <Ionicons name="trophy" size={22} color="#F59E0B" />
        </View>
        <View style={s.leaderboardBannerTextBlock}>
          <Text style={s.leaderboardBannerTitle}>
            {t('home.studentDashboard.leaderboard')}
          </Text>
          <Text style={s.leaderboardBannerSub}>
            {t('home.studentDashboard.leaderboardSubtitle')}
          </Text>
        </View>
      </View>

      <View style={s.leaderboardBannerRight}>
        <View style={s.avatarStack}>
          {podiumColors.map((color, i) => (
            <View
              key={color}
              style={[
                s.stackAvatar,
                { backgroundColor: color, marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i },
              ]}
            >
              <Text style={s.stackAvatarText}>{i + 1}</Text>
            </View>
          ))}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: c.headerBg },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    avatarFallback: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    avatarInitial: { fontSize: 18, fontWeight: '700', color: '#fff' },
    greetingSmall: { fontSize: 12, color: c.headerTextMuted },
    userName: { fontSize: 18, color: c.headerText, fontWeight: '600' },
    notificationButton: { padding: 4, position: 'relative' },

    modalContainer: {
      flex: 1,
      backgroundColor: c.modalBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
    },
    headerRow: { paddingHorizontal: 20, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '700', color: c.text },

    announcementCard: {
      backgroundColor: '#30A46F1A',
      borderRadius: 12,
      marginHorizontal: 10,
      marginBottom: 16,
      padding: 16,
    },
    announcementTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    announcementLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    announcementLabel: { fontSize: 12, fontWeight: '600', color: c.success },
    announcementTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginTop: 8 },
    announcementMessage: {
      fontSize: 13,
      color: c.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 5,
    },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: c.text, paddingTop: 10 },
    viewAll: { fontSize: 14, color: c.brand, fontWeight: '500' },

    card: {
      backgroundColor: c.card,
      marginBottom: 20,
      marginHorizontal: 10,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    },
    cardContent: { backgroundColor: c.cardContent, padding: 20, margin: 10 },

    courseTitle: { fontSize: 16, fontWeight: '600', color: c.text },
    courseSubtitle: { fontSize: 13, fontWeight: '500', color: c.text, marginBottom: 8 },
    courseDescription: {
      fontSize: 12,
      color: c.textLight,
      lineHeight: 18,
      marginBottom: 16,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressLabel: { fontSize: 13, color: c.textSecondary },
    progressTrack: {
      width: '100%',
      height: 6,
      backgroundColor: c.borderMid,
      marginBottom: 16,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: c.success },
    continueButton: { backgroundColor: c.brand, paddingVertical: 14, alignItems: 'center' },
    continueButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    journeyStartContainer: {
      alignItems: 'center',
      padding: 30,
      margin: 10,
      backgroundColor: c.cardContent,
    },
    journeyIconWrapper: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.brandLighter,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    journeyHeading: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    journeySubtext: {
      fontSize: 13,
      color: c.textLight,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
      paddingHorizontal: 10,
    },
    startJourneyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.brand,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    startJourneyButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    milestoneHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    levelBadge: {
      backgroundColor: c.brandLight,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
    },
    levelText: { color: c.brand, fontSize: 13, fontWeight: '700' },
    pointsText: { fontSize: 13, color: c.textSecondary },
    levelProgress: {
      fontSize: 11,
      color: c.textMuted,
      marginBottom: 16,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statItem: { alignItems: 'center', flex: 1 },
    statNumber: { fontSize: 24, fontWeight: '700', color: c.text, marginBottom: 4 },
    statLabel: { fontSize: 11, color: c.textSecondary, textAlign: 'center' },

    recentActivitySection: { marginTop: 16 },
    recentActivityHeading: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
      marginBottom: 8,
    },
    recentActivityRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.backgroundMuted,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 6,
    },
    recentActivityAction: {
      fontSize: 12,
      color: c.textSecondary,
      flex: 1,
      marginRight: 8,
    },
    recentActivityPoints: { fontSize: 12, fontWeight: '600', color: c.success },

    viewGrowthButton: {
      backgroundColor: c.brandLight,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    viewGrowthButtonText: { color: c.brand, fontSize: 15, fontWeight: '600' },

    leaderboardBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.brand,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      shadowColor: c.brand,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    leaderboardBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    leaderboardIconRing: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    leaderboardBannerTextBlock: { flex: 1 },
    leaderboardBannerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 2,
    },
    leaderboardBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
    leaderboardBannerRight: { flexDirection: 'row', alignItems: 'center' },
    avatarStack: { flexDirection: 'row', alignItems: 'center' },
    stackAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.brand,
    },
    stackAvatarText: { fontSize: 10, fontWeight: '800', color: '#fff' },

    eventsContainer: { paddingHorizontal: 10, paddingBottom: 10 },
    noEventsContainer: { alignItems: 'center', paddingVertical: 30, gap: 8 },
    noEventsText: { fontSize: 14, fontWeight: '600', color: c.textMuted },
    noEventsSubText: {
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
  });
}