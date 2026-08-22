// app/(tabs)/home/students/[studentId].tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
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
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('courses');
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const s = makeStyles(colors);
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
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Student Profile</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading student details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !studentData) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Student Profile</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={s.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={s.errorText}>{error || 'Student not found'}</Text>
          <TouchableOpacity 
            style={s.retryButton}
            onPress={fetchStudentDetails}
          >
            <Text style={s.retryText}>Try Again</Text>
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
    let color = colors.textSecondary;
    let text = 'Unknown';
    
    if (statusLower.includes('complete') || statusLower === 'done') {
      color = colors.success;
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
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Student Profile</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={s.profileSection}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.profileAvatar} />
          ) : (
            <View style={[s.profileAvatar, s.avatarPlaceholder]}>
              <Text style={s.avatarText}>
                {studentData.student.full_name?.charAt(0).toUpperCase() || 'S'}
              </Text>
            </View>
          )}
          <Text style={s.profileName}>{studentData.student.full_name}</Text>
          <Text style={s.profileEmail}>{studentData.student.email}</Text>
          
          {/* Level Badge */}
          <View style={s.levelBadge}>
            <Text style={s.levelBadgeText}>
              {studentData.student.level ? 
                studentData.student.level.charAt(0).toUpperCase() + studentData.student.level.slice(1) 
                : 'Beginner'}
            </Text>
          </View>

          {/* Message Button */}
          <TouchableOpacity
            style={s.messageButton}
            onPress={() => router.push({
              pathname: '/(tabs)/community/chat/[userId]',
              params: {
                userId: studentId,
                name: studentData.student.full_name,
                avatarUri: avatarUri || '',
              },
            } as any)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={s.messageButtonText}>Message Student</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={s.tabsContainer}>
          <View style={s.tabsBackground}>
            <TouchableOpacity
              style={[s.tab, activeTab === 'courses' && s.activeTab]}
              onPress={() => setActiveTab('courses')}
            >
              <Text style={[s.tabText, activeTab === 'courses' && s.activeTabText]}>
                Courses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, activeTab === 'groups' && s.activeTab]}
              onPress={() => setActiveTab('groups')}
            >
              <Text style={[s.tabText, activeTab === 'groups' && s.activeTabText]}>
                Groups
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Courses List */}
        <View style={s.content}>
          {studentData.enrollments && studentData.enrollments.length > 0 ? (
            studentData.enrollments.map((enrollment, index) => {
              // Safety check
              if (!enrollment) return null;
              
              const statusInfo = enrollment.course_title;
              const progress = getProgress(enrollment);
              const courseTitle = enrollment.course_title || `Course ${index + 1}`;

              return (
                <View key={enrollment.id || `enrollment-${index}`} style={s.courseCard}>
                  <View style={s.courseHeader}>
                    <Text style={s.courseTitle}>{courseTitle}</Text>
                    <View style={[
                      s.statusBadge,
                      { backgroundColor: getStatusInfo(enrollment).color }
                    ]}>
                      <Text style={s.statusText}>{getStatusInfo(enrollment).text}</Text>
                    </View>
                  </View>
                  
                  {/* Progress Bar */}
                  <View style={s.progressContainer}>
                    <View style={s.progressBar}>
                      <View style={[s.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={s.progressText}>{progress}% completed</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={s.emptyState}>
              <Ionicons name="book-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyText}>No enrolled courses</Text>
              <Text style={s.emptySubtext}>
                This student hasn't enrolled in any courses yet
              </Text>
            </View>
          )}
        </View>

        {/* Stats Section */}
        {studentData.enrollment_stats && (
          <View style={s.statsSection}>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{studentData.enrollment_stats.total_enrollments}</Text>
              <Text style={s.statLabel}>Total Courses</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{studentData.enrollment_stats.completed_enrollments}</Text>
              <Text style={s.statLabel}>Completed</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{Math.round(studentData.enrollment_stats.average_progress)}%</Text>
              <Text style={s.statLabel}>Avg Progress</Text>
            </View>
          </View>
        )}

        {/* Done Button */}
        <TouchableOpacity style={s.doneButton} onPress={() => router.back()}>
          <Text style={s.doneButtonText}>Done</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
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
      color: c.textSecondary,
    },
    errorText: {
      fontSize: 14,
      color: c.textMuted,
      marginBottom: 16,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: c.brand,
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
      backgroundColor: c.borderMid,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '600',
      color: c.textSecondary,
    },
    profileName: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      color: c.textSecondary,
      marginBottom: 12,
    },
    levelBadge: {
      backgroundColor: c.success,
      paddingHorizontal: 16,
      paddingVertical: 6,
      marginBottom: 16,
      borderRadius: 4,
    },
    levelBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#fff',
    },
    messageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.brand,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    messageButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
    },
    tabsContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    tabsBackground: {
      flexDirection: 'row',
      backgroundColor: c.backgroundMuted,
      padding: 4,
      borderRadius: 8,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 6,
    },
    activeTab: {
      backgroundColor: c.card,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '500',
      color: c.textSecondary,
    },
    activeTabText: {
      color: c.text,
      fontWeight: '600',
    },
    content: {
      padding: 20,
    },
    courseCard: {
      backgroundColor: c.card,
      padding: 16,
      marginBottom: 16,
      borderRadius: 8,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 1,
      borderColor: c.border,
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
      color: c.text,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginLeft: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    progressContainer: {
      gap: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: c.backgroundMuted,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: c.success,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      color: c.textSecondary,
      textAlign: 'right',
    },
    doneButton: {
      backgroundColor: c.card,
      marginHorizontal: 20,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textMuted,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: c.textLight,
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    statsSection: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: c.cardContent,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: c.textSecondary,
    },
  });
}