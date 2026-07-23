// app/(tabs)/home/students/[studentId].tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getStudentDetails } from '@/services/api';
import { getImageUri } from '@/utils/helpers';



interface Enrollment {
  id: string;
  course_id: string;
  course_title: string;
  status?: string;
  progress?: number;
  completed?: boolean;
  enrollment_status?: string;
  created_at: string;
  updated_at: string;
}

interface StudentDetailData {
  student: {
    id: string;
    full_name: string;
    email: string;
    profile_picture: string | null;
    level: string;
    is_online: boolean;
    joined_date: string;
    last_active: string;
  };
  enrollments: Enrollment[];
  enrollment_stats: {
    total_enrollments: number;
    completed_enrollments: number;
    in_progress_enrollments: number;
    average_progress: number;
    completion_rate: number;
  };
  group: any[];
}

export default function StudentDetail() {
  const params = useLocalSearchParams();
  const { token } = useUser();
  const [activeTab, setActiveTab] = useState('courses');
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const studentId = params.studentId as string;

  useFocusEffect(
    useCallback(() => {
      if (studentId) {
        fetchStudentDetails();
      }
    }, [studentId])
  );

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getStudentDetails(studentId, token);
      console.log('Student details response:', JSON.stringify(response, null, 2));
      
      if (response?.data) {
        // Log enrollments in detail
        if (response.data.enrollments && Array.isArray(response.data.enrollments)) {
          
        }
        
        setStudentData(response.data);
      } else {
        setError(response?.message || 'No student data found');
      }
    } catch (err: any) {
      console.error('Error fetching student details:', err);
      setError(err.message || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Profile</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3F1F22" />
          <Text style={styles.loadingText}>Loading student details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !studentData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Profile</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#999" />
          <Text style={styles.errorText}>{error || 'Student not found'}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchStudentDetails}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Helper functions with safety checks
  const getStatusInfo = (enrollment: Enrollment) => {
    // Try different possible status fields
    const status = enrollment.status || enrollment.enrollment_status || 
                   (enrollment.completed ? 'completed' : 'in_progress') || 
                   'unknown';
    
    const statusLower = status.toLowerCase();
    
    // Determine color and text
    let color = '#666';
    let text = 'Unknown';
    
    if (statusLower.includes('complete') || statusLower === 'done') {
      color = '#22c55e';
      text = 'Completed';
    } else if (statusLower.includes('progress') || statusLower === 'ongoing') {
      color = '#2563EB';
      text = 'In Progress';
    } else if (statusLower === 'enrolled') {
      color = '#8B5CF6';
      text = 'Enrolled';
    }
    
    return { color, text };
  };

  const getProgress = (enrollment: Enrollment) => {
    return enrollment.progress || 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const avatarUri = studentData.student.profile_picture 
    ? getImageUri(studentData.student.profile_picture) 
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Profile</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {studentData.student.full_name?.charAt(0).toUpperCase() || 'S'}
              </Text>
            </View>
          )}
          <Text style={styles.profileName}>{studentData.student.full_name}</Text>
          <Text style={styles.profileEmail}>{studentData.student.email}</Text>
          
          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>
              {studentData.student.level ? 
                studentData.student.level.charAt(0).toUpperCase() + studentData.student.level.slice(1) 
                : 'Beginner'}
            </Text>
          </View>

          {/* Message Button */}
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => router.push(`/(tabs)/home/students/${studentId}/chat` as any)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="white" />
            <Text style={styles.messageButtonText}>Message Student</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsBackground}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'courses' && styles.activeTab]}
              onPress={() => setActiveTab('courses')}
            >
              <Text style={[styles.tabText, activeTab === 'courses' && styles.activeTabText]}>
                Courses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
              onPress={() => setActiveTab('groups')}
            >
              <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
                Groups
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Courses List */}
        <View style={styles.content}>
          {studentData.enrollments && studentData.enrollments.length > 0 ? (
            studentData.enrollments.map((enrollment, index) => {
              // Safety check
              if (!enrollment) return null;
              
              const statusInfo = enrollment.course_title;
              const progress = getProgress(enrollment);
              const courseTitle = enrollment.course_title || `Course ${index + 1}`;

              return (
                <View key={enrollment.id || `enrollment-${index}`} style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <Text style={styles.courseTitle}>{courseTitle}</Text>
                    <View style={[
                      styles.statusBadge,
                      
                    ]}>
                      <Text style={styles.statusText}>{statusInfo}</Text>
                    </View>
                  </View>
                  
                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progress}% completed</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No enrolled courses</Text>
              <Text style={styles.emptySubtext}>
                This student hasn't enrolled in any courses yet
              </Text>
            </View>
          )}
        </View>

        {/* Stats Section */}
        {studentData.enrollment_stats && (
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{studentData.enrollment_stats.total_enrollments}</Text>
              <Text style={styles.statLabel}>Total Courses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{studentData.enrollment_stats.completed_enrollments}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(studentData.enrollment_stats.average_progress)}%</Text>
              <Text style={styles.statLabel}>Avg Progress</Text>
            </View>
          </View>
        )}

        {/* Done Button */}
        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3F1F22',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#666',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3F1F22',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabsBackground: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#333',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  doneButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f8f8',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
});