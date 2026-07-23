import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function UserDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'Courses' | 'Groups'>('Courses');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);

  // Mock user data
  const user = {
    name: 'Kurt Bates',
    email: 'alex_halmiton@gmail.com',
    level: 'Beginner',
    joined: '02, May 2024',
    lastActive: '15, May 2025',
    status: isRevoked ? 'Revoked' : 'Active',
    avatar: '',
    courses: [
      {
        id: 1,
        name: 'Introduction to Discipleship',
        level: 'Beginner',
        progress: 100,
        status: 'Done',
      },
      {
        id: 2,
        name: 'Biblical Foundation',
        level: 'Beginner',
        progress: 100,
        status: 'Ongoing',
      },
      {
        id: 3,
        name: 'Prayer & Worship',
        level: 'Beginner',
        progress: 100,
        status: 'Ongoing',
      },
    ],
    groups: [
      {
        id: 1,
        name: 'Young Adult Fellowship',
        joined: '23, May 2024',
        role: 'Member',
      },
      {
        id: 2,
        name: 'Devoted Women Disciples',
        joined: '23, May 2024',
        role: 'Member',
      },
    ],
  };

  const handleRemoveUser = () => {
    setShowRemoveModal(false);
    // Handle user removal logic
    router.back();
  };

  const handleSuspendAccess = () => {
    setIsRevoked(true);
  };

  const handleRestoreUser = () => {
    setIsRevoked(false);
  };

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
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#666" />
              </View>
            )}
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          <View style={styles.levelBadge}>
            <Ionicons name="trending-up" size={14} color="#2E7D32" />
            <Text style={styles.levelText}>{user.level}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>{user.joined}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last active</Text>
              <Text style={styles.infoValue}>{user.lastActive}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text
                style={[
                  styles.statusText,
                  isRevoked ? styles.revokedStatus : styles.activeStatus,
                ]}
              >
                {user.status}
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Courses' && styles.activeTab]}
              onPress={() => setActiveTab('Courses')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'Courses' && styles.activeTabText,
                ]}
              >
                Courses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Groups' && styles.activeTab]}
              onPress={() => setActiveTab('Groups')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'Groups' && styles.activeTabText,
                ]}
              >
                Groups
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'Courses' ? (
            <View style={styles.content}>
              {user.courses.map((course) => (
                <View key={course.id} style={styles.courseItem}>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{course.name}</Text>
                    <Text style={styles.courseLevel}>{course.level}</Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${course.progress}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      course.status === 'Done'
                        ? styles.doneBadge
                        : styles.ongoingBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        course.status === 'Done'
                          ? styles.doneBadgeText
                          : styles.ongoingBadgeText,
                      ]}
                    >
                      {course.status}
                    </Text>
                  </View>
                  <Text style={styles.completionText}>
                    {course.progress}% completed
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.content}>
              {user.groups.map((group) => (
                <View key={group.id} style={styles.groupItem}>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupJoined}>
                      Joined {group.joined}
                    </Text>
                  </View>
                  <Text style={styles.groupRole}>{group.role}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>

            {isRevoked ? (
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestoreUser}
              >
                <Ionicons name="refresh" size={16} color="#2196F3" />
                <Text style={styles.restoreButtonText}>Restore User</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.suspendButton}
                onPress={handleSuspendAccess}
              >
                <Ionicons name="close-circle-outline" size={16} color="#F44336" />
                <Text style={styles.suspendButtonText}>Suspend Access</Text>
              </TouchableOpacity>
            )}
          </View>

          {!isRevoked && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setShowRemoveModal(true)}
            >
              <Ionicons name="trash-outline" size={16} color="#F44336" />
              <Text style={styles.removeButtonText}>Remove User</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Remove Confirmation Modal */}
      <Modal
        visible={showRemoveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRemoveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Remove User</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to switch to remove {user.name}?
            </Text>

            <TouchableOpacity
              style={styles.removeConfirmButton}
              onPress={handleRemoveUser}
            >
              <Text style={styles.removeConfirmButtonText}>Remove</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowRemoveModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 3,
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
    marginBottom: 12,
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
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
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F44336',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  removeConfirmButton: {
    backgroundColor: '#F44336',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  removeConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});