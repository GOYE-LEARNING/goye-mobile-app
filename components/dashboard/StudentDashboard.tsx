// app/(tabs)/home/index.tsx (Student Dashboard)
import { useSignUp } from '@/contexts/SignUpContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Image } from 'expo-image';
import { startGrowthJourney, getGrowthByProgressId } from '@/services/api';
import { getStudentGroupEvents, getUserProfile } from '@/services/api';
import { getImageUri } from '@/utils/helpers';
import { getEnrolledCourses } from '@/services/api';
import EventCard from '@/components/community/EventCard';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get('window');

export default function Dashboard() {
  const { data } = useSignUp();
  const { user, token } = useUser();
  const { colors } = useTheme();
  const unreadCount = useUnreadNotificationCount();
  const { t } = useTranslation();

  const [journeyStarted, setJourneyStarted] = useState(false);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [growthData, setGrowthData] = useState<any>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [enrolledCourse, setEnrolledCourse] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(true);

  const fetchEnrolledCourse = async () => {
    setCourseLoading(true);
    try {
      const result = await getEnrolledCourses(token!);
      if (result.data && Array.isArray(result.data.courses) && result.data.courses.length > 0) {
        setEnrolledCourse(result.data.courses[0]);
      }
    } catch (err) {
      console.error('[Dashboard] enrolled course error:', err);
    } finally {
      setCourseLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchProfilePic();
    checkJourneyStatus();
    fetchEnrolledCourse();
  }, []);

  const checkJourneyStatus = async () => {
    try {
      const result = await startGrowthJourney(token!);
      if (result?.data) {
        const progressIdFromResponse = result.data.id || result.data.progressId;
        if (progressIdFromResponse) {
          setProgressId(progressIdFromResponse);
          setJourneyStarted(true);
          await fetchGrowthData(progressIdFromResponse);
        }
      }
    } catch (err: any) {
      console.log('[Dashboard] No active journey or error checking:', err?.message);
      if (err?.message?.includes('already started') && err?.data?.id) {
        const existingProgressId = err.data.id;
        setProgressId(existingProgressId);
        setJourneyStarted(true);
        await fetchGrowthData(existingProgressId);
      }
    }
  };

  const fetchGrowthData = async (id: string) => {
    try {
      const result = await getGrowthByProgressId(id, token!);
      if (result?.data) {
        setGrowthData(result.data);
        console.log('[Dashboard] Growth data loaded:', JSON.stringify(result.data, null, 2));
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching growth data:', err);
    }
  };

  const fetchProfilePic = async () => {
    try {
      const result = await getUserProfile(token!);
      const userData = result.user ?? result.data ?? result;
      if (userData?.user_pic) setProfilePic(getImageUri(userData.user_pic));
    } catch (err) {
      console.error('[Dashboard] profile pic error:', err);
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const result = await getStudentGroupEvents(token!);
      const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
      setEvents(list);
    } catch (err) {
      console.error('[Dashboard] events error:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleGrowthPress = () => {
    if (progressId) {
      router.push(`/(tabs)/home/growth?progressId=${progressId}` as any);
    } else {
      Alert.alert(t('common.error'), t('home.studentDashboard.alertUnableToLoadGrowth'));
    }
  };

  const handleStartJourney = async () => {
    setJourneyLoading(true);
    try {
      const result = await startGrowthJourney(token!);
      if (result?.data) {
        const newProgressId = result.data.id || result.data.progressId;
        setProgressId(newProgressId);
        setJourneyStarted(true);
        await fetchGrowthData(newProgressId);
        Alert.alert(t('common.success'), t('home.studentDashboard.alertJourneyStartedMessage'));
      }
    } catch (err: any) {
      console.error('[Dashboard] Start journey error:', err);
      if (err?.message?.includes('already started')) {
        if (err?.data?.id) {
          setProgressId(err.data.id);
          setJourneyStarted(true);
          await fetchGrowthData(err.data.id);
          Alert.alert(t('home.studentDashboard.alertJourneyAlreadyStartedTitle'), t('home.studentDashboard.alertJourneyAlreadyStartedMessage'));
        } else {
          await checkJourneyStatus();
        }
      } else {
        Alert.alert(t('common.error'), err?.message ?? t('home.studentDashboard.alertStartJourneyErrorFallback'));
      }
    } finally {
      setJourneyLoading(false);
    }
  };

  // Data extraction
  const stats = growthData?.stats || {};
  const userData = growthData?.user || {};
  const achievements = growthData?.achievements || {};
  const levelProgress = achievements?.levelProgress || {};
  const badges = achievements?.badges || [];

  const levelName = levelProgress?.name || userData?.currentLevel?.replace(/_/g, ' ') || t('home.studentDashboard.defaultLevelSeeker');
  const currentLevelNumber = levelProgress?.level || userData?.levelNumber || 1;
  const totalPoints = userData?.totalXP || stats?.totalPoints || 0;
  const totalBadges = stats?.totalBadges || badges.length;
  const totalAchievements = stats?.totalAchievements || 0;
  const completedCourses = stats?.completedCourses || 0;

  const nextLevelXP = userData?.nextLevelXP || levelProgress?.nextLevelXP || 460;
  const progressToNext = userData?.progressToNextLevel || levelProgress?.progressToNext || 0;
  const progressPercentage = nextLevelXP > 0 ? (progressToNext / nextLevelXP) * 100 : 0;

  const journey = growthData?.journey || {};
  const journeyProgressBar = journey?.progressBar || 0;

  const s = makeStyles(colors);

  return (
    <View style={s.wrapper}>
      {/* Header - Now with proper notification badge like instructor */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>{user?.first_name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
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

          {/* Course Card */}
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
                <>
                  <Text style={s.courseTitle}>{enrolledCourse.course?.course_title}</Text>
                  <Text style={s.courseSubtitle}>{enrolledCourse.course?.course_short_description}</Text>
                  <Text style={s.courseDescription} numberOfLines={2}>
                    {enrolledCourse.course?.course_description}
                  </Text>
                  <View style={s.progressHeader}>
                    <Text style={s.progressLabel}>{t('home.studentDashboard.yourProgress')}</Text>
                    <Text style={s.progressLabel}>
                      {t('home.studentDashboard.percentToComplete', { percent: enrolledCourse.course_progress?.percentage ?? 0 })}
                    </Text>
                  </View>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${enrolledCourse.course_progress?.percentage ?? 0}%` }]} />
                  </View>
                  <TouchableOpacity
                    style={s.continueButton}
                    onPress={() => router.push(`/(tabs)/courses/details?id=${enrolledCourse.course?.id}` as any)}
                  >
                    <Text style={s.continueButtonText}>{t('home.studentDashboard.continueCourse')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={s.courseDescription}>{t('home.studentDashboard.noCourseEnrolled')}</Text>
                  <TouchableOpacity style={s.continueButton} onPress={() => router.push('/(tabs)/courses')}>
                    <Text style={s.continueButtonText}>{t('home.studentDashboard.browseCourses')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Spiritual Growth Milestone */}
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{t('home.studentDashboard.spiritualGrowthMilestone')}</Text>
            </View>

            {!journeyStarted && (
              <View style={s.journeyStartContainer}>
                <View style={s.journeyIconWrapper}>
                  <Ionicons name="leaf-outline" size={48} color={colors.brand} />
                </View>
                <Text style={s.journeyHeading}>{t('home.studentDashboard.beginGrowthJourney')}</Text>
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
                      <Ionicons name="rocket-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={s.startJourneyButtonText}>{t('home.studentDashboard.startYourJourney')}</Text>
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
                  <Text style={s.pointsText}>{t('home.studentDashboard.xpSuffix', { points: totalPoints })}</Text>
                </View>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${Math.min(progressPercentage, 100)}%` }]} />
                </View>
                <Text style={s.levelProgress}>
                  {t('home.studentDashboard.xpToNextLevel', { progress: progressToNext, max: nextLevelXP })}
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

                {/* Action Row: View Growth + Leaderboard Banner */}
                <TouchableOpacity style={s.viewGrowthButton} onPress={handleGrowthPress}>
                  <Text style={s.viewGrowthButtonText}>{t('home.studentDashboard.viewGrowth')}</Text>
                </TouchableOpacity>

                {/* Leaderboard Banner Card */}
                <TouchableOpacity
                  style={s.leaderboardBanner}
                  onPress={() => router.push('/(tabs)/home/leaderboard' as any)}
                  activeOpacity={0.85}
                >
                  {/* Left: podium icon + text */}
                  <View style={s.leaderboardBannerLeft}>
                    <View style={s.leaderboardIconRing}>
                      <Ionicons name="trophy" size={22} color="#F59E0B" />
                    </View>
                    <View style={s.leaderboardBannerTextBlock}>
                      <Text style={s.leaderboardBannerTitle}>{t('home.studentDashboard.leaderboard')}</Text>
                      <Text style={s.leaderboardBannerSub}>{t('home.studentDashboard.leaderboardSubtitle')}</Text>
                    </View>
                  </View>

                  {/* Right: rank avatars stack + arrow */}
                  <View style={s.leaderboardBannerRight}>
                    <View style={s.avatarStack}>
                      {['#F59E0B', '#9CA3AF', '#B45309'].map((color, i) => (
                        <View
                          key={i}
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
              </View>
            )}
          </View>

          {/* Upcoming Events */}
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{t('home.studentDashboard.upcomingEvents')}</Text>
              <TouchableOpacity><Text style={s.viewAll}>{t('home.studentDashboard.viewAll')}</Text></TouchableOpacity>
            </View>
            <View style={s.eventsContainer}>
              {eventsLoading ? (
                <ActivityIndicator size="small" color={colors.brand} style={{ marginVertical: 20 }} />
              ) : events.length === 0 ? (
                <View style={s.noEventsContainer}>
                  <Ionicons name="calendar-outline" size={32} color={colors.borderMid} />
                  <Text style={s.noEventsText}>{t('home.studentDashboard.noUpcomingEvents')}</Text>
                  <Text style={s.noEventsSubText}>{t('home.studentDashboard.joinGroupForEvents')}</Text>
                </View>
              ) : (
                events.slice(0, 3).map((event: any) => (
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
    </View>
  );
}

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
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
    avatarFallback: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)' },
    avatarInitial: { fontSize: 18, fontWeight: '700', color: '#fff' },
    greetingSmall: { fontSize: 12, color: c.headerTextMuted },
    userName: { fontSize: 18, color: c.headerText, fontWeight: '600' },
    notificationButton: {
      padding: 4,
      position: 'relative',
    },

    modalContainer: {
      flex: 1,
      backgroundColor: c.modalBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
    },
    headerRow: { paddingHorizontal: 20, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '700', color: c.text },

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
    courseDescription: { fontSize: 12, color: c.textLight, lineHeight: 18, marginBottom: 16 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { fontSize: 13, color: c.textSecondary },
    progressTrack: { width: '100%', height: 6, backgroundColor: c.borderMid, marginBottom: 16, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: c.success },
    continueButton: { backgroundColor: c.brand, paddingVertical: 14, alignItems: 'center' },
    continueButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    journeyStartContainer: { alignItems: 'center', padding: 30, margin: 10, backgroundColor: c.cardContent },
    journeyIconWrapper: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.brandLighter,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    journeyHeading: { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 8, textAlign: 'center' },
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

    milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    levelBadge: { backgroundColor: c.brandLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
    levelText: { color: c.brand, fontSize: 13, fontWeight: '700' },
    pointsText: { fontSize: 13, color: c.textSecondary },
    levelProgress: { fontSize: 11, color: c.textMuted, marginBottom: 16, textAlign: 'center' },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    statItem: { alignItems: 'center', flex: 1 },
    statNumber: { fontSize: 24, fontWeight: '700', color: c.text, marginBottom: 4 },
    statLabel: { fontSize: 11, color: c.textSecondary, textAlign: 'center' },
    viewGrowthButton: { backgroundColor: c.brandLight, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
    viewGrowthButtonText: { color: c.brand, fontSize: 15, fontWeight: '600' },

    // Leaderboard Banner
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
    leaderboardBannerTextBlock: {
      flex: 1,
    },
    leaderboardBannerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 2,
    },
    leaderboardBannerSub: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.75)',
    },
    leaderboardBannerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarStack: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stackAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.brand,
    },
    stackAvatarText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#fff',
    },

    eventsContainer: { paddingHorizontal: 10, paddingBottom: 10 },
    noEventsContainer: { alignItems: 'center', paddingVertical: 30, gap: 8 },
    noEventsText: { fontSize: 14, fontWeight: '600', color: c.textMuted },
    noEventsSubText: { fontSize: 12, color: c.textMuted, textAlign: 'center', paddingHorizontal: 20 },
  });
}