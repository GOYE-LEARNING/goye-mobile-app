import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';

export default function AdminDashboard() {
  const { user } = useUser();
  const [timeFilter, setTimeFilter] = useState('This Week');

  const stats = {
    activeUsers: 403,
    newUsers: 14,
    avgCompletion: 75,
    engagement: 55,
  };

  const userBreakdown = {
    allUsers: 1340,
    students: 840,
    instructors: 553,
    beginners: 856,
    intermediate: 453,
    advanced: 52,
  };

  const activities = [
    {
      id: 1,
      text: '3 students completed "Biblical Foundation" quiz',
      time: '12h ago',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={
              user?.user_pic 
                ? { uri: user.user_pic }
                : require('@/assets/images/icon.png')
            }
            style={styles.avatar}
          />
          <View>
            <Text style={styles.greeting}>Good evening</Text>
            <Text style={styles.userName}>
              {user?.first_name || 'Admin'}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Dashboard Card */}
      <View style={styles.dashboardCard}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
        </View>

        {/* Overview Section */}
        <View style={styles.overviewHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>{timeFilter}</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
            <Ionicons
              name="trending-up"
              size={20}
              color="#666"
              style={styles.statIcon}
            />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.newUsers}</Text>
            <Text style={styles.statLabel}>New Users</Text>
            <Ionicons
              name="people"
              size={20}
              color="#666"
              style={styles.statIcon}
            />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgCompletion}%</Text>
            <Text style={styles.statLabel}>Avg. Completion</Text>
            <Ionicons
              name="stats-chart"
              size={20}
              color="#666"
              style={styles.statIcon}
            />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.engagement}%</Text>
            <Text style={styles.statLabel}>Engagement</Text>
            <Ionicons
              name="bar-chart"
              size={20}
              color="#666"
              style={styles.statIcon}
            />
          </View>
        </View>

        {/* Users Breakdown */}
        <Text style={styles.sectionTitle}>Users Breakdown</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>
              {userBreakdown.allUsers.toLocaleString()}
            </Text>
            <Text style={styles.breakdownLabel}>All Users</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{userBreakdown.students}</Text>
            <Text style={styles.breakdownLabel}>Students</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>
              {userBreakdown.instructors}
            </Text>
            <Text style={styles.breakdownLabel}>Instructors</Text>
          </View>
        </View>

        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{userBreakdown.beginners}</Text>
            <Text style={styles.breakdownLabel}>Beginners</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>
              {userBreakdown.intermediate}
            </Text>
            <Text style={styles.breakdownLabel}>Intermediate</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{userBreakdown.advanced}</Text>
            <Text style={styles.breakdownLabel}>Advanced</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(admin)/users')}
          >
            <Ionicons name="people" size={24} color="#3F1F22" />
            <Text style={styles.actionText}>Manage Users</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(admin)/courses')}
          >
            <Ionicons name="book" size={24} color="#3F1F22" />
            <Text style={styles.actionText}>Review Courses</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="people-circle" size={24} color="#3F1F22" />
            <Text style={styles.actionText}>Manage Groups</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="megaphone" size={24} color="#3F1F22" />
            <Text style={styles.actionText}>Announcement</Text>
          </TouchableOpacity>
        </View>

        {/* Activities */}
        <Text style={styles.sectionTitle}>Activities</Text>
        {activities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <Ionicons name="book-outline" size={24} color="#3F1F22" />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>{activity.text}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3F1F22',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  dashboardCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: '100%',
  },
  dashboardHeader: {
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    marginTop: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#3F1F22',
    fontWeight: '500',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
});