// components/dashboard/InstructorDashboard.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTutorOverview, getCourseActivities } from '@/services/api';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import { useTranslation } from 'react-i18next';

interface TopCourse {
  id: string;
  course_title: string;
  course_short_description: string;
  course_image: string | null;
  course_level: string;
  totalStudents: number;
}

interface CourseActivity {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

const getTimeAgo = (dateString: string, t: (key: string, opts?: any) => string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return t('home.instructorDashboard.timeJustNow');
  if (diffHours < 24) return t('home.instructorDashboard.timeHoursAgo', { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return t('home.instructorDashboard.timeDaysAgo', { count: diffDays });
  return t('home.instructorDashboard.timeWeeksAgo', { count: Math.floor(diffDays / 7) });
};

export default function InstructorDashboard() {
  const { user, token } = useUser();
  const { colors } = useTheme();
  const unreadCount = useUnreadNotificationCount();
  const { t } = useTranslation();

  const [topCourse, setTopCourse] = useState<TopCourse | null>(null);
  const [totalPublishedCourses, setTotalPublishedCourses] = useState(0);
  const [avgCompletionPercentage, setAvgCompletionPercentage] = useState(0);
  const [activities, setActivities] = useState<CourseActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const result = await getTutorOverview(token!);
      setTopCourse(result.data?.topCourse ?? null);
      setTotalPublishedCourses(result.data?.totalPublishedCourses ?? 0);
      setAvgCompletionPercentage(result.data?.avgCompletionPercentage ?? 0);

      if (result.data?.topCourse?.id) {
        const activityResult = await getCourseActivities(result.data.topCourse.id, token!);
        setActivities(activityResult.data || []);
      }
    } catch (err) {
      console.error('[InstructorDashboard] Error fetching overview:', err);
    } finally {
      setLoading(false);
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

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Image
            source={user?.user_pic ? { uri: user.user_pic } : require('@/assets/images/icon.png')}
            style={s.avatar}
          />
          <View>
            <Text style={s.greeting}>{t('home.instructorDashboard.greeting')}</Text>
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

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Dashboard Title */}
        <Text style={s.dashboardTitle}>{t('home.instructorDashboard.dashboardTitle')}</Text>

        {/* Overview Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('home.instructorDashboard.overview')}</Text>

          {topCourse ? (
            <View style={s.topCourseCard}>
              <View style={s.topCourseBadge}>
                <Ionicons name="trophy" size={16} color="#F59E0B" />
                <Text style={s.topCourseBadgeText}>{t('home.instructorDashboard.topPerformingCourse')}</Text>
              </View>
              <Text style={s.topCourseTitle}>{topCourse.course_title}</Text>
              <Text style={s.topCourseDescription} numberOfLines={2}>
                {topCourse.course_short_description}
              </Text>

              <View style={s.topCourseStats}>
                <View style={s.topCourseStat}>
                  <Text style={s.topCourseStatNumber}>{topCourse.totalStudents}</Text>
                  <Text style={s.topCourseStatLabel}>{t('home.instructorDashboard.totalStudents')}</Text>
                </View>
                <View style={s.topCourseStat}>
                  <Text style={s.topCourseStatNumber}>{totalPublishedCourses}</Text>
                  <Text style={s.topCourseStatLabel}>{t('home.instructorDashboard.publishedCourses')}</Text>
                </View>
                <View style={s.topCourseStat}>
                  <Text style={s.topCourseStatNumber}>{avgCompletionPercentage}%</Text>
                  <Text style={s.topCourseStatLabel}>{t('home.instructorDashboard.avgCompletion')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={s.viewCourseButton}
                onPress={() => router.push(`/(tabs)/courses/details?id=${topCourse.id}` as any)}
              >
                <Text style={s.viewCourseButtonText}>{t('home.instructorDashboard.viewCourse')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.emptyCourseCard}>
              <Ionicons name="book-outline" size={32} color={colors.textMuted} />
              <Text style={s.emptyCourseText}>{t('home.instructorDashboard.noCoursesYet')}</Text>
              <TouchableOpacity
                style={s.viewCourseButton}
                onPress={() => router.push('/(tabs)/courses/create')}
              >
                <Text style={s.viewCourseButtonText}>{t('home.instructorDashboard.createFirstCourse')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('home.instructorDashboard.quickActions')}</Text>

          <View style={s.quickActionsRow}>
            <TouchableOpacity
              style={s.quickActionCard}
              onPress={() => router.push('/(tabs)/courses/create')}
            >
              <Ionicons name="add-circle-outline" size={32} color={colors.brand} />
              <Text style={s.quickActionText}>{t('home.instructorDashboard.createACourse')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.quickActionCard}
              onPress={() => router.push('/(tabs)/home/students')}
            >
              <Ionicons name="people-outline" size={32} color={colors.brand} />
              <Text style={s.quickActionText}>{t('home.instructorDashboard.myStudents')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activities */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('home.instructorDashboard.activities')}</Text>

          {activities.length === 0 ? (
            <Text style={s.emptyText}>{t('home.instructorDashboard.noRecentActivity')}</Text>
          ) : (
            activities.map((activity) => (
              <View key={activity.id} style={s.activityItem}>
                <View style={[s.activityIcon, { backgroundColor: '#EBF5FF' }]}>
                  <Ionicons name="document-text" size={20} color="#2563EB" />
                </View>
                <View style={s.activityContent}>
                  <Text style={s.activityText}>{activity.message}</Text>
                  <View style={s.activityTimeRow}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={s.activityTime}>{getTimeAgo(activity.createdAt, t)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.headerBg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    greeting: {
      fontSize: 13,
      color: c.headerTextMuted,
    },
    userName: {
      fontSize: 18,
      fontWeight: '700',
      color: c.headerText,
    },
    notificationButton: {
      padding: 4,
      position: 'relative',
    },
    content: {
      flex: 1,
      backgroundColor: c.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 24,
    },
    dashboardTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: c.text,
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
      marginBottom: 16,
    },
    topCourseCard: {
      backgroundColor: c.cardContent,
      padding: 20,
      borderRadius: 12,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    emptyCourseCard: {
      backgroundColor: c.cardContent,
      padding: 32,
      borderRadius: 12,
      alignItems: 'center',
      gap: 12,
    },
    emptyCourseText: {
      fontSize: 14,
      color: c.textMuted,
    },
    topCourseBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    topCourseBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#F59E0B',
    },
    topCourseTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
    },
    topCourseDescription: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    topCourseStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    topCourseStat: {
      alignItems: 'center',
    },
    topCourseStatNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
      marginBottom: 4,
    },
    topCourseStatLabel: {
      fontSize: 11,
      color: c.textSecondary,
    },
    viewCourseButton: {
      backgroundColor: c.brandLight,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
    },
    viewCourseButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.brand,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    quickActionCard: {
      flex: 1,
      backgroundColor: c.cardContent,
      padding: 24,
      alignItems: 'center',
      gap: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    quickActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
      textAlign: 'center',
    },
    activityItem: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
      justifyContent: 'center',
    },
    activityText: {
      fontSize: 14,
      color: c.text,
      marginBottom: 4,
    },
    activityTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    activityTime: {
      fontSize: 12,
      color: c.textMuted,
    },
    emptyText: {
      fontSize: 14,
      color: c.textMuted,
      fontStyle: 'italic',
    },
  });
}
