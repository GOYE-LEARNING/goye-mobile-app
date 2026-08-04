import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { getAdminDashboardStats, sendSuperAdminAnnouncement } from '@/services/api';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalOrganizations: number;
  totalCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  avgCompletionRate: number;
  engagementRate: number;
  userTypeBreakdown: {
    orgOwners: number;
    invitedMembers: number;
    individualUsers: number;
  };
}

interface AdminActivity {
  type: string;
  id: string;
  title: string;
  detail: string;
  createdAt: string;
}

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
};

const activityIcon = (type: string) => {
  if (type === 'organization_created') return 'business-outline';
  if (type === 'course_created') return 'book-outline';
  return 'person-add-outline';
};

export default function AdminDashboard() {
  const { user, token, isSuperAdmin } = useUser();
  const unreadCount = useUnreadNotificationCount();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const result = await getAdminDashboardStats(token!);
      setStats(result.stats);
      setActivities(result.activities || []);
    } catch (err) {
      console.error('[AdminDashboard] Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      Alert.alert('Required Fields', 'Please enter both a title and a message');
      return;
    }
    setSendingAnnouncement(true);
    try {
      const result = await sendSuperAdminAnnouncement(
        { title: announcementTitle.trim(), message: announcementMessage.trim(), audience: 'all' },
        token!
      );
      Alert.alert('Announcement Sent', `Delivered to ${result.data?.recipientCount ?? 0} user(s).`);
      setShowAnnouncementModal(false);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to send announcement');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F1F22" />
      </View>
    );
  }

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
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>
              {user?.first_name || 'Admin'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/(tabs)/home/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          <NotificationBadge count={unreadCount} />
        </TouchableOpacity>
      </View>

      {/* Dashboard Card */}
      <View style={styles.dashboardCard}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
        </View>

        {/* Overview Section */}
        <Text style={styles.sectionTitle}>Overview</Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.activeUsers ?? 0}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
            <Ionicons name="trending-up" size={20} color="#666" style={styles.statIcon} />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.newUsersToday ?? 0}</Text>
            <Text style={styles.statLabel}>New Today</Text>
            <Ionicons name="people" size={20} color="#666" style={styles.statIcon} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.avgCompletionRate ?? 0}%</Text>
            <Text style={styles.statLabel}>Avg. Completion</Text>
            <Ionicons name="stats-chart" size={20} color="#666" style={styles.statIcon} />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.engagementRate ?? 0}%</Text>
            <Text style={styles.statLabel}>Engagement</Text>
            <Ionicons name="bar-chart" size={20} color="#666" style={styles.statIcon} />
          </View>
        </View>

        {/* Users Breakdown */}
        <Text style={styles.sectionTitle}>Users Breakdown</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{stats?.totalUsers?.toLocaleString() ?? 0}</Text>
            <Text style={styles.breakdownLabel}>All Users</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{stats?.userTypeBreakdown?.individualUsers ?? 0}</Text>
            <Text style={styles.breakdownLabel}>Individual</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{stats?.userTypeBreakdown?.orgOwners ?? 0}</Text>
            <Text style={styles.breakdownLabel}>Org Owners</Text>
          </View>
        </View>

        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{stats?.userTypeBreakdown?.invitedMembers ?? 0}</Text>
            <Text style={styles.breakdownLabel}>Invited Members</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{stats?.totalOrganizations ?? 0}</Text>
            <Text style={styles.breakdownLabel}>Organizations</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>{stats?.totalCourses ?? 0}</Text>
            <Text style={styles.breakdownLabel}>Courses</Text>
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
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/community')}
          >
            <Ionicons name="people-circle" size={24} color="#3F1F22" />
            <Text style={styles.actionText}>Manage Groups</Text>
          </TouchableOpacity>

          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(admin)/announcements')}
            >
              <Ionicons name="megaphone" size={24} color="#3F1F22" />
              <Text style={styles.actionText}>Announcement</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Platform-wide screens, mirroring web's super-admin sidenav. These
            aren't in the tab bar (8 bottom tabs would be unusable), so this
            is how they're reached. */}
        {isSuperAdmin && (
          <>
            <Text style={styles.sectionTitle}>Platform</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(admin)/organizations')}
              >
                <Ionicons name="business" size={24} color="#3F1F22" />
                <Text style={styles.actionText}>Organizations</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(admin)/activity')}
              >
                <Ionicons name="pulse" size={24} color="#3F1F22" />
                <Text style={styles.actionText}>Activity</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(admin)/events')}
              >
                <Ionicons name="calendar" size={24} color="#3F1F22" />
                <Text style={styles.actionText}>All Events</Text>
              </TouchableOpacity>
              <View style={styles.actionCardSpacer} />
            </View>
          </>
        )}

        {/* Activities */}
        <Text style={styles.sectionTitle}>Activities</Text>
        {activities.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity</Text>
        ) : (
          activities.map((activity) => (
            <View key={`${activity.type}-${activity.id}`} style={styles.activityItem}>
              <Ionicons name={activityIcon(activity.type) as any} size={24} color="#3F1F22" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.detail}</Text>
                <Text style={styles.activityTime}>{getTimeAgo(activity.createdAt)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Modal
        visible={showAnnouncementModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAnnouncementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Announcement</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              value={announcementTitle}
              onChangeText={setAnnouncementTitle}
              editable={!sendingAnnouncement}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Message"
              value={announcementMessage}
              onChangeText={setAnnouncementMessage}
              multiline
              editable={!sendingAnnouncement}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAnnouncementModal(false)}
                disabled={sendingAnnouncement}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSendButton}
                onPress={handleSendAnnouncement}
                disabled={sendingAnnouncement}
              >
                {sendingAnnouncement ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSendText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3F1F22',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  notificationButton: {
    position: 'relative',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    marginTop: 20,
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
  // Keeps a lone card in a 2-up row at half width instead of stretching it
  // across the whole row.
  actionCardSpacer: {
    flex: 1,
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
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    color: '#000',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  modalCancelText: {
    color: '#3F1F22',
    fontWeight: '600',
  },
  modalSendButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#3F1F22',
  },
  modalSendText: {
    color: '#fff',
    fontWeight: '600',
  },
});
