// components/dashboard/InstructorDashboard.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getTutorOverview,
  getCourseActivities,
  getOrgOverviewStats,
  getOrgUserBreakdown,
  getOrgCoursesWithStats
} from '@/services/api';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import { useTranslation } from 'react-i18next';
import {
  DonutChart,
  DonutLegend,
  ProgressRing,
  BarChart,
  AreaChart,
  StatCard,
  ChartCard,
  ChartSlice
} from '@/components/dashboard/charts/Charts';

const { width } = Dimensions.get('window');

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

interface OrgCourse {
  id: string;
  course_title: string;
  course_short_description: string | null;
  course_level: string | null;
  stats: {
    totalEnrollments: number;
    completionRate: number;
    averageProgress: number;
  };
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

const BRAND = '#FFA500';

// Simplified, cohesive palette - just 3 main colors
const COLORS = {
  blue: '#2A7DE1',
  green: '#1D9A83',
  amber: '#E8871E',
  purple: '#7C5CBF',
};

// ─── Stat Card Theme ──────────────────────────────────────────────────────────
const STAT_THEME = {
  members: { icon: 'people-outline' as const, color: COLORS.blue },
  courses: { icon: 'book-outline' as const, color: COLORS.green },
  newMembers: { icon: 'person-add-outline' as const, color: COLORS.amber },
  completion: { icon: 'stats-chart-outline' as const, color: COLORS.purple },
};

const CHART_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple];

export default function InstructorDashboard() {
  const { user, token, isOrganizationAdmin } = useUser();
  const { colors } = useTheme();
  const unreadCount = useUnreadNotificationCount();
  const { t } = useTranslation();
  const organizationId = user?.organizationId;

  const [topCourse, setTopCourse] = useState<TopCourse | null>(null);
  const [totalPublishedCourses, setTotalPublishedCourses] = useState(0);
  const [avgCompletionPercentage, setAvgCompletionPercentage] = useState(0);
  const [activities, setActivities] = useState<CourseActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Organization stats
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState<string | null>(null);

  // Real data from API
  const [stats, setStats] = useState({
    totalMembers: 0,
    onlineMembers: 0,
    totalCourses: 0,
    avgCompletion: 0,
    newMembers: 0,
  });

  const [donutData, setDonutData] = useState<ChartSlice[]>([
    { label: 'Students', value: 0, color: COLORS.blue },
    { label: 'Instructors', value: 0, color: COLORS.green },
    { label: 'Admins', value: 0, color: COLORS.amber },
  ]);

  const [barData, setBarData] = useState<ChartSlice[]>([]);
  const [enrollmentTrends, setEnrollmentTrends] = useState<{ label: string; value: number }[]>([]);

  // ── Fetch Organization Data ───────────────────────────────────────────────
  useEffect(() => {
    if (isOrganizationAdmin && organizationId) {
      setLoading(false);
      fetchOrganizationData();
    } else if (isOrganizationAdmin && !organizationId) {
      setLoading(false);
      setOrgError('No organization found');
      setOrgLoading(false);
    } else {
      setOrgLoading(false);
      fetchOverview();
    }
  }, [isOrganizationAdmin, organizationId]);

  const fetchOrganizationData = async () => {
    if (!organizationId || !token) {
      setOrgLoading(false);
      setOrgError('Missing organization data');
      return;
    }

    setOrgLoading(true);
    setOrgError(null);

    try {
      const [statsResult, breakdownResult, coursesResult] = await Promise.all([
        getOrgOverviewStats(organizationId, token),
        getOrgUserBreakdown(organizationId, token),
        getOrgCoursesWithStats(organizationId, token).catch(() => null),
      ]);

      if (statsResult?.data) {
        const data = statsResult.data;
        setStats({
          totalMembers: data.total_members ?? 0,
          onlineMembers: data.online_members ?? 0,
          totalCourses: data.total_courses_completed ?? 0,
          avgCompletion: data.avg_completion ?? 0,
          newMembers: data.new_members_in_range ?? 0,
        });
      }

      if (breakdownResult?.data) {
        const data = breakdownResult.data;
        setDonutData([
          { label: 'Students', value: data.students ?? 0, color: COLORS.blue },
          { label: 'Instructors', value: data.instructors ?? 0, color: COLORS.green },
          { label: 'Admins', value: data.admins ?? 0, color: COLORS.amber },
        ]);

        if (data.breakdown?.by_role) {
          const byRole = data.breakdown.by_role;
          const roles = Object.keys(byRole);
          const barItems = roles.map((role, index) => ({
            label: role.charAt(0).toUpperCase() + role.slice(1),
            value: byRole[role] as number,
            color: CHART_COLORS[index % CHART_COLORS.length],
          }));
          setBarData(barItems);
        }
      }

      if (coursesResult?.data?.courses) {
        const courses = coursesResult.data.courses as OrgCourse[];
        const sorted = [...courses].sort((a, b) => (b.stats?.totalEnrollments || 0) - (a.stats?.totalEnrollments || 0));
        const topCourses = sorted.slice(0, 5).map((course, index) => ({
          label: course.course_title.length > 15 ? course.course_title.substring(0, 15) + '...' : course.course_title,
          value: course.stats?.totalEnrollments || 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
        }));
        setBarData(topCourses);
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const totalEnrollments = coursesResult?.data?.courses
        ? (coursesResult.data.courses as OrgCourse[]).reduce((sum, c) => sum + (c.stats?.totalEnrollments || 0), 0)
        : stats.totalMembers;

      const trendData = months.map((month, i) => ({
        label: month,
        value: Math.round(totalEnrollments * (0.1 + (i / months.length) * 0.9)) || 0,
      }));
      setEnrollmentTrends(trendData);

      setOrgLoading(false);
    } catch (err) {
      console.error('[Organization] Error:', err);
      setOrgError('Failed to load organization data');
      setOrgLoading(false);
    }
  };

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
      console.error('[InstructorDashboard] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(colors);

  // ── Loading State ──
  const isStillLoading = isOrganizationAdmin ? orgLoading : loading;

  if (isStillLoading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render Organization Admin Dashboard ────────────────────────────────
  if (isOrganizationAdmin) {
    if (orgError) {
      return (
        <SafeAreaView style={s.container} edges={['top']}>
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Image source={user?.user_pic ? { uri: user.user_pic } : require('@/assets/images/icon.png')} style={s.avatar} />
              <View>
                <Text style={s.greeting}>Welcome back</Text>
                <Text style={s.userName}>{user?.first_name}</Text>
              </View>
            </View>
            <TouchableOpacity style={s.notificationButton} onPress={() => router.push('/(tabs)/home/notifications')}>
              <Ionicons name="notifications-outline" size={24} color={colors.headerText} />
              <NotificationBadge count={unreadCount} />
            </TouchableOpacity>
          </View>
          <View style={s.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            <Text style={s.errorTitle}>Something went wrong</Text>
            <Text style={s.errorText}>{orgError}</Text>
            <TouchableOpacity style={s.retryButton} onPress={() => { setOrgLoading(true); fetchOrganizationData(); }}>
              <Text style={s.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    const totalDonut = donutData.reduce((sum, d) => sum + d.value, 0);

    return (
      <SafeAreaView style={s.container} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Image source={user?.user_pic ? { uri: user.user_pic } : require('@/assets/images/icon.png')} style={s.avatar} />
            <View>
              <Text style={s.greeting}>Welcome back</Text>
              <Text style={s.userName}>{user?.first_name}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.notificationButton} onPress={() => router.push('/(tabs)/home/notifications')}>
            <Ionicons name="notifications-outline" size={24} color={colors.headerText} />
            <NotificationBadge count={unreadCount} />
          </TouchableOpacity>
        </View>

        <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
          {/* Dashboard Title */}
          <Text style={s.dashboardTitle}>Organization Analytics</Text>

          {/* ─── Stats Grid ─── */}
          <View style={s.statsGrid}>
            <StatCard
              icon={STAT_THEME.members.icon}
              label="Total Members"
              value={stats.totalMembers}
              color={STAT_THEME.members.color}
              valueColor={colors.text}
              delay={0}
            />
            <StatCard
              icon={STAT_THEME.courses.icon}
              label="Total Courses"
              value={stats.totalCourses}
              color={STAT_THEME.courses.color}
              valueColor={colors.text}
              delay={60}
            />
            <StatCard
              icon={STAT_THEME.newMembers.icon}
              label="New Members"
              value={stats.newMembers}
              color={STAT_THEME.newMembers.color}
              valueColor={colors.text}
              delay={120}
            />
            <StatCard
              icon={STAT_THEME.completion.icon}
              label="Completion"
              value={`${stats.avgCompletion}%`}
              color={STAT_THEME.completion.color}
              valueColor={colors.text}
              delay={180}
            />
          </View>

          {/* ─── Chart Row: Donut + Progress Ring ─── */}
          <View style={s.chartRow}>
            <View style={[s.chartCard, s.halfCard]}>
              <View style={s.chartHeader}>
                <Text style={s.chartTitle}>Member Breakdown</Text>
                <View style={[s.chartBadge, { backgroundColor: colors.brandLighter }]}>
                  <Text style={[s.chartBadgeText, { color: colors.brand }]}>{totalDonut}</Text>
                </View>
              </View>
              <View style={s.donutContainer}>
                <DonutChart
                  data={donutData}
                  size={80}
                  strokeWidth={12}
                  gapDegrees={3}
                  centerValue={totalDonut}
                  centerLabel="Total"
                  textColor={colors.text}
                  mutedColor={colors.textMuted}
                />
                <View style={s.donutLegendWrap}>
                  <DonutLegend
                    data={donutData}
                    total={totalDonut}
                    textColor={colors.text}
                    mutedColor={colors.textSecondary}
                  />
                </View>
              </View>
            </View>

            <View style={[s.chartCard, s.halfCard]}>
              <Text style={s.chartTitle}>Completion Rate</Text>
              <View style={s.progressRingContainer}>
                <ProgressRing
                  percentage={stats.avgCompletion}
                  size={100}
                  strokeWidth={10}
                  color={BRAND}
                  trackColor={colors.border ?? '#EEF0F3'}
                  label={`${stats.avgCompletion}%`}
                  sublabel="Overall"
                  textColor={colors.text}
                  mutedColor={colors.textMuted}
                />
              </View>
            </View>
          </View>

          {/* ─── Enrollment Trends ─── */}
          {enrollmentTrends.length > 0 && (
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Enrollment Trends</Text>
              <AreaChart
                data={enrollmentTrends}
                height={140}
                color={BRAND}
                padding={16}
              />
            </View>
          )}

          {/* ─── Popular Courses ─── */}
          {barData.length > 0 && (
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Popular Courses</Text>
              <BarChart
                data={barData}
                barHeight={18}
                labelColor={colors.text}
                showRank={true}
              />
            </View>
          )}

          {/* ─── Quick Actions ─── */}
          <View style={s.quickActionsSection}>
            <Text style={s.sectionTitle}>Quick Actions</Text>
            <View style={s.quickActionsGrid}>
              <TouchableOpacity style={s.quickActionCard} onPress={() => router.push('/(tabs)/organization/members' as any)}>
                <View style={[s.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="people-outline" size={22} color="#2A7DE1" />
                </View>
                <Text style={s.quickActionText}>Members</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.quickActionCard} onPress={() => router.push('/(tabs)/organization/announcements' as any)}>
                <View style={[s.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="megaphone-outline" size={22} color="#E8871E" />
                </View>
                <Text style={s.quickActionText}>Announce</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.quickActionCard} onPress={() => router.push('/(tabs)/organization/events' as any)}>
                <View style={[s.quickActionIcon, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="calendar-outline" size={22} color="#7C5CBF" />
                </View>
                <Text style={s.quickActionText}>Events</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.quickActionCard} onPress={() => router.push('/(tabs)/organization/courses' as any)}>
                <View style={[s.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="book-outline" size={22} color="#1D9A83" />
                </View>
                <Text style={s.quickActionText}>Courses</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Render Regular Instructor Dashboard ────────────────────────────────
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Image source={user?.user_pic ? { uri: user.user_pic } : require('@/assets/images/icon.png')} style={s.avatar} />
          <View>
            <Text style={s.greeting}>Welcome back</Text>
            <Text style={s.userName}>{user?.first_name}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.notificationButton} onPress={() => router.push('/(tabs)/home/notifications')}>
          <Ionicons name="notifications-outline" size={24} color={colors.headerText} />
          <NotificationBadge count={unreadCount} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.dashboardTitle}>Instructor Dashboard</Text>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Overview</Text>
          {topCourse ? (
            <View style={s.topCourseCard}>
              <View style={s.topCourseBadge}>
                <Ionicons name="trophy" size={16} color="#F59E0B" />
                <Text style={s.topCourseBadgeText}>Top Performing Course</Text>
              </View>
              <Text style={s.topCourseTitle}>{topCourse.course_title}</Text>
              <Text style={s.topCourseDescription} numberOfLines={2}>
                {topCourse.course_short_description}
              </Text>
              <View style={s.topCourseStats}>
                <View style={s.topCourseStat}>
                  <Text style={s.topCourseStatNumber}>{topCourse.totalStudents}</Text>
                  <Text style={s.topCourseStatLabel}>Students</Text>
                </View>
                <View style={s.topCourseStat}>
                  <Text style={s.topCourseStatNumber}>{totalPublishedCourses}</Text>
                  <Text style={s.topCourseStatLabel}>Published</Text>
                </View>
                <View style={s.topCourseStat}>
                  <Text style={s.topCourseStatNumber}>{avgCompletionPercentage}%</Text>
                  <Text style={s.topCourseStatLabel}>Completion</Text>
                </View>
              </View>
              <TouchableOpacity style={s.viewCourseButton} onPress={() => router.push(`/(tabs)/courses/details?id=${topCourse.id}` as any)}>
                <Text style={s.viewCourseButtonText}>View Course</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.emptyCourseCard}>
              <Ionicons name="book-outline" size={32} color={colors.textMuted} />
              <Text style={s.emptyCourseText}>No courses yet</Text>
              <TouchableOpacity style={s.viewCourseButton} onPress={() => router.push('/(tabs)/courses/create')}>
                <Text style={s.viewCourseButtonText}>Create First Course</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.quickActionsGrid}>
            <TouchableOpacity style={s.quickActionCard} onPress={() => router.push('/(tabs)/courses/create')}>
              <View style={[s.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="add-circle-outline" size={22} color="#E8871E" />
              </View>
              <Text style={s.quickActionText}>Create Course</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickActionCard} onPress={() => router.push('/(tabs)/home/students')}>
              <View style={[s.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="people-outline" size={22} color="#1D9A83" />
              </View>
              <Text style={s.quickActionText}>My Students</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Activity</Text>
          {activities.length === 0 ? (
            <Text style={s.emptyText}>No recent activity</Text>
          ) : (
            activities.map((activity) => (
              <View key={activity.id} style={s.activityItem}>
                <View style={[s.activityIcon, { backgroundColor: '#EBF5FF' }]}>
                  <Ionicons name="document-text" size={20} color="#2A7DE1" />
                </View>
                <View style={s.activityContent}>
                  <Text style={s.activityText}>{activity.message}</Text>
                  <Text style={s.activityTime}>{getTimeAgo(activity.createdAt, t)}</Text>
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
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: c.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: c.brand,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
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
      marginBottom: 20,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: 14,
    },
    // ─── Stats Grid ───
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 20,
    },
    // ─── Chart Cards ───
    chartRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 4,
    },
    halfCard: {
      flex: 1,
      minWidth: 0,
    },
    chartCard: {
      backgroundColor: c.card,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: (c.border ?? '#EEF0F3') as string,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 1,
      marginBottom: 16,
      overflow: 'hidden',
    },
    chartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    chartTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.1,
      flexShrink: 1,
    },
    chartBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      flexShrink: 0,
    },
    chartBadgeText: {
      fontSize: 10,
      fontWeight: '600',
    },
    donutContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 8,
    },
    donutLegendWrap: {
      flex: 1,
      paddingLeft: 4,
    },
    progressRingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 2,
    },
    // ─── Top Course Card ───
    topCourseCard: {
      backgroundColor: c.card,
      padding: 20,
      borderRadius: 16,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 1,
      borderWidth: 1,
      borderColor: c.border,
    },
    topCourseBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    topCourseBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#F59E0B',
    },
    topCourseTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginBottom: 4,
    },
    topCourseDescription: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    topCourseStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    topCourseStat: {
      alignItems: 'center',
    },
    topCourseStatNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    topCourseStatLabel: {
      fontSize: 10,
      color: c.textSecondary,
    },
    viewCourseButton: {
      backgroundColor: c.brandLight,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    viewCourseButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.brand,
    },
    emptyCourseCard: {
      backgroundColor: c.card,
      padding: 32,
      borderRadius: 16,
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    emptyCourseText: {
      fontSize: 14,
      color: c.textMuted,
    },
    // ─── Quick Actions ───
    quickActionsSection: {
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    quickActionCard: {
      width: (width - 60) / 4,
      alignItems: 'center',
      gap: 6,
    },
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionText: {
      fontSize: 11,
      fontWeight: '500',
      color: c.text,
      textAlign: 'center',
    },
    // ─── Activities ───
    activityItem: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    activityIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
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
      marginBottom: 2,
    },
    activityTime: {
      fontSize: 11,
      color: c.textMuted,
    },
    emptyText: {
      fontSize: 14,
      color: c.textMuted,
      fontStyle: 'italic',
    },
  });
}