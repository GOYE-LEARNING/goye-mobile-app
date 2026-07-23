// components/dashboard/InstructorDashboard.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InstructorDashboard() {
  const { user } = useUser();
  const { colors } = useTheme();

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={s.avatar} 
          />
          <View>
            <Text style={s.greeting}>Good evening</Text>
            <Text style={s.userName}>Pst. {user?.first_name}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={colors.headerText} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Dashboard Title */}
        <Text style={s.dashboardTitle}>Dashboard</Text>

        {/* Overview Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Overview</Text>
          
          {/* Top Performing Course Card */}
          <View style={s.topCourseCard}>
            <View style={s.topCourseBadge}>
              <Ionicons name="trophy" size={16} color="#F59E0B" />
              <Text style={s.topCourseBadgeText}>Top Performing Course</Text>
            </View>
            <Text style={s.topCourseTitle}>Empowering Children to Lead</Text>
            <Text style={s.topCourseDescription}>
              This introduces the meaning of discipleship, exploring its biblical foundation and the call to follow Jesus.
            </Text>
            
            {/* Stats Row */}
            <View style={s.topCourseStats}>
              <View style={s.topCourseStat}>
                <Text style={s.topCourseStatNumber}>43</Text>
                <Text style={s.topCourseStatLabel}>Total Students</Text>
              </View>
              <View style={s.topCourseStat}>
                <Text style={s.topCourseStatNumber}>6</Text>
                <Text style={s.topCourseStatLabel}>Published Courses</Text>
              </View>
              <View style={s.topCourseStat}>
                <Text style={s.topCourseStatNumber}>65%</Text>
                <Text style={s.topCourseStatLabel}>Avg. Completion</Text>
              </View>
            </View>

            <TouchableOpacity style={s.viewCourseButton}>
              <Text style={s.viewCourseButtonText}>View Course</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          
          <View style={s.quickActionsRow}>
            <TouchableOpacity 
              style={s.quickActionCard}
              onPress={() => router.push('/(tabs)/courses/create')}
            >
              <Ionicons name="add-circle-outline" size={32} color={colors.brand} />
              <Text style={s.quickActionText}>Create a Course</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={s.quickActionCard}
              onPress={() => router.push('/(tabs)/home/students')}
            >
              <Ionicons name="people-outline" size={32} color={colors.brand} />
              <Text style={s.quickActionText}>My Students</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activities */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Activities</Text>

          <View style={s.activityItem}>
            <View style={[s.activityIcon, { backgroundColor: '#EBF5FF' }]}>
              <Ionicons name="document-text" size={20} color="#2563EB" />
            </View>
            <View style={s.activityContent}>
              <Text style={s.activityText}>
                3 students completed "Biblical Foundation" quiz
              </Text>
              <View style={s.activityTimeRow}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={s.activityTime}>12h ago</Text>
              </View>
            </View>
          </View>

          <View style={s.activityItem}>
            <View style={[s.activityIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="people" size={20} color="#22c55e" />
            </View>
            <View style={s.activityContent}>
              <Text style={s.activityText}>
                3 new students enrolled in "Prayer & Worship"
              </Text>
              <View style={s.activityTimeRow}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={s.activityTime}>12h ago</Text>
              </View>
            </View>
          </View>

          <View style={s.activityItem}>
            <View style={[s.activityIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="people" size={20} color="#22c55e" />
            </View>
            <View style={s.activityContent}>
              <Text style={s.activityText}>
                Taves Anderson joined the group "Men's Prayer..."
              </Text>
              <View style={s.activityTimeRow}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={s.activityTime}>12h ago</Text>
              </View>
            </View>
          </View>

          <View style={s.activityItem}>
            <View style={[s.activityIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
            </View>
            <View style={s.activityContent}>
              <Text style={s.activityText}>
                Sarah Johnson completed "Biblical Foundation"
              </Text>
              <View style={s.activityTimeRow}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={s.activityTime}>12h ago</Text>
              </View>
            </View>
          </View>
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
  });
}