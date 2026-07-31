import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import {
  getAdminStudents,
  getAdminTutors,
  getSuperAdminUserDetail,
  suspendSuperAdminUser,
} from '@/services/api';

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  completedAt?: string | null;
  courseId: string;
  courseTitle: string;
  courseLevel: string;
}

interface Membership {
  role: string;
  joinedAt: string;
  organizationId: string;
  organizationName: string;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  level?: string;
  profilePic?: string | null;
  isOnline?: boolean;
  isSuspended?: boolean;
  lastActive?: string;
  createdAt?: string;
  enrollments?: Enrollment[];
  memberships?: Membership[];
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function UserDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isSuperAdmin } = useUser();

  const [activeTab, setActiveTab] = useState<'Courses' | 'Organizations'>('Courses');
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchUserDetail();
  }, [id, isSuperAdmin]);

  const fetchUserDetail = async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const result = await getSuperAdminUserDetail(id, token!);
        setUser(result.data);
      } else {
        // Non-super admins have no per-user detail endpoint — fall back to
        // the basic identity fields already available from the users list.
        const [studentsRes, tutorsRes] = await Promise.all([
          getAdminStudents(token!),
          getAdminTutors(token!),
        ]);
        const all = [...(studentsRes.enhancedStudents || []), ...(tutorsRes.enhancedStudents || [])];
        const match = all.find((u: any) => u.id === id);
        if (match) {
          setUser({
            id: match.id,
            name: match.full_name || `${match.first_name} ${match.last_name}`,
            email: match.email_address,
            role: match.role,
            profilePic: match.user_pic,
            isOnline: match.isCurrentlyOnline ?? match.isOnline,
            lastActive: match.lastActive,
          });
        }
      }
    } catch (err) {
      console.error('[UserDetailsScreen] Error fetching user detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!user) return;
    setUpdatingStatus(true);
    try {
      await suspendSuperAdminUser(user.id, !user.isSuspended, token!);
      setUser({ ...user, isSuspended: !user.isSuspended });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update user status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F1F22" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            {user.profilePic ? (
              <Image source={{ uri: user.profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#666" />
              </View>
            )}
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          {user.level && (
            <View style={styles.levelBadge}>
              <Ionicons name="trending-up" size={14} color="#2E7D32" />
              <Text style={styles.levelText}>{user.level}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last active</Text>
              <Text style={styles.infoValue}>{formatDate(user.lastActive)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text
                style={[
                  styles.statusText,
                  user.isSuspended ? styles.revokedStatus : styles.activeStatus,
                ]}
              >
                {user.isSuspended ? 'Suspended' : user.isOnline ? 'Online' : 'Active'}
              </Text>
            </View>
          </View>

          {isSuperAdmin ? (
            <>
              {/* Tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'Courses' && styles.activeTab]}
                  onPress={() => setActiveTab('Courses')}
                >
                  <Text style={[styles.tabText, activeTab === 'Courses' && styles.activeTabText]}>
                    Courses
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'Organizations' && styles.activeTab]}
                  onPress={() => setActiveTab('Organizations')}
                >
                  <Text style={[styles.tabText, activeTab === 'Organizations' && styles.activeTabText]}>
                    Organizations
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              {activeTab === 'Courses' ? (
                <View style={styles.content}>
                  {(user.enrollments || []).length === 0 ? (
                    <Text style={styles.emptyText}>No course enrollments</Text>
                  ) : (
                    user.enrollments!.map((course) => (
                      <View key={course.id} style={styles.courseItem}>
                        <View style={styles.courseInfo}>
                          <Text style={styles.courseName}>{course.courseTitle}</Text>
                          <Text style={styles.courseLevel}>{course.courseLevel}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            course.status === 'COMPLETED' ? styles.doneBadge : styles.ongoingBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              course.status === 'COMPLETED' ? styles.doneBadgeText : styles.ongoingBadgeText,
                            ]}
                          >
                            {course.status === 'COMPLETED' ? 'Done' : 'Ongoing'}
                          </Text>
                        </View>
                        <Text style={styles.completionText}>
                          Enrolled {formatDate(course.enrolledAt)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              ) : (
                <View style={styles.content}>
                  {(user.memberships || []).length === 0 ? (
                    <Text style={styles.emptyText}>No organization memberships</Text>
                  ) : (
                    user.memberships!.map((membership, idx) => (
                      <View key={`${membership.organizationId}-${idx}`} style={styles.groupItem}>
                        <View style={styles.groupInfo}>
                          <Text style={styles.groupName}>{membership.organizationName}</Text>
                          <Text style={styles.groupJoined}>Joined {formatDate(membership.joinedAt)}</Text>
                        </View>
                        <Text style={styles.groupRole}>{membership.role}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actions}>
                {user.isSuspended ? (
                  <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleToggleSuspend}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <ActivityIndicator size="small" color="#2196F3" />
                    ) : (
                      <>
                        <Ionicons name="refresh" size={16} color="#2196F3" />
                        <Text style={styles.restoreButtonText}>Restore User</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.suspendButton}
                    onPress={handleToggleSuspend}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <ActivityIndicator size="small" color="#F44336" />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={16} color="#F44336" />
                        <Text style={styles.suspendButtonText}>Suspend Access</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>
              Detailed activity and account actions require super admin access.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F5F5F5',
  },
  userCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  levelText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoItem: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeStatus: {
    color: '#2E7D32',
  },
  revokedStatus: {
    color: '#F44336',
  },
  tabs: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3F1F22',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
  },
  activeTabText: {
    color: '#3F1F22',
    fontWeight: '600',
  },
  content: {
    width: '100%',
    marginBottom: 20,
  },
  courseItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  courseInfo: {
    marginBottom: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  courseLevel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  doneBadge: {
    backgroundColor: '#E8F5E9',
  },
  ongoingBadge: {
    backgroundColor: '#FFF9C4',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  doneBadgeText: {
    color: '#2E7D32',
  },
  ongoingBadgeText: {
    color: '#F57F17',
  },
  completionText: {
    fontSize: 12,
    color: '#666',
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  groupJoined: {
    fontSize: 14,
    color: '#666',
  },
  groupRole: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  suspendButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F44336',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  suspendButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F44336',
  },
  restoreButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2196F3',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
});
