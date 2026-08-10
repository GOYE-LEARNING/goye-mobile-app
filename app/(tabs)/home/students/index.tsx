// app/(tabs)/students/index.tsx
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
import { getAllStudents } from '@/services/api';
import { getImageUri } from '@/utils/helpers';

interface Student {
  student_id: string;
  id: string; 
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string | null;
  level: string;
  is_online: boolean;
  joined_date: string;
  last_active: string;
  total_courses_enrolled: number;
  total_completed_courses: number;
  total_in_progress_courses: number;
  courses?: Array<{
    course_id: string;
    course_title: string;
    course_image: string;
  }>;
}

interface StudentsResponse {
  message: string;
  data: {
    total_students: number;
    total_enrollments: number;
    students: Student[];
  };
}

export default function MyStudents() {
  const { user, token, isInstructor } = useUser();
  const { colors } = useTheme();
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const s = makeStyles(colors);

  console.log('=== STUDENTS SCREEN DEBUG ===');
  console.log('User:', user);
  console.log('User role:', user?.role);
  console.log('isInstructor:', isInstructor);
  console.log('============================');

  if (!isInstructor) {
    console.log('❌ BLOCKED: isInstructor is false');
    router.replace('/(tabs)/home' as any);
    return null;
  }

  // Fetch students when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [])
  );

  const fetchStudents = async () => {
  try {
    setError(null);
    
    const result = await getAllStudents(token) as StudentsResponse;
    
    // Extract students from the response
    if (result?.data?.students && Array.isArray(result.data.students)) {
      // Map student_id to id for compatibility with existing routes
      const studentsWithId = result.data.students.map(student => ({
        ...student,
        id: student.student_id // Add id field for route compatibility
      }));
      setStudents(studentsWithId);
    } else {
      setStudents([]);
    }
    
  } catch (err: any) {
    console.error('Error fetching students:', err);
    setError(err?.message || 'Unable to load students. Please try again.');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
  };

  const getFilteredStudents = () => {
    let filtered = [...students];

    // Apply status filter (using is_online as active status)
    if (activeFilter === 'active') {
      filtered = filtered.filter(student => student.is_online === true);
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter(student => student.is_online === false);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => {
        const fullName = student.full_name.toLowerCase();
        const firstName = student.first_name.toLowerCase();
        const lastName = student.last_name.toLowerCase();
        const email = student.email.toLowerCase();
        
        return fullName.includes(query) || 
               firstName.includes(query) || 
               lastName.includes(query) || 
               email.includes(query);
      });
    }

    return filtered;
  };

  const filteredStudents = getFilteredStudents();

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? '#22c55e' : colors.textMuted;
  };

  const getStatusText = (isOnline: boolean) => {
    return isOnline ? 'Active' : 'Inactive';
  };

  const getStudentAvatar = (student: Student) => {
    return student.profile_picture ? getImageUri(student.profile_picture) : null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>My Students</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>My Students</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryButton} onPress={fetchStudents}>
            <Text style={s.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Students</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={s.filters}>
        {['all', 'active', 'inactive'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[s.filterTab, activeFilter === filter && s.filterTabActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[s.filterText, activeFilter === filter && s.filterTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Count */}
      <View style={s.resultsHeader}>
        <Text style={s.resultsText}>
          {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} found
        </Text>
      </View>

      {/* Students List */}
      <ScrollView 
        style={s.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.brand]} 
          />
        }
      >
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => {
            const avatarUri = getStudentAvatar(student);
            const statusText = getStatusText(student.is_online);
            const statusColor = getStatusColor(student.is_online);
            const formattedLastActive = formatDate(student.last_active);
            const progressPercentage = student.total_courses_enrolled > 0 
              ? Math.round((student.total_completed_courses / student.total_courses_enrolled) * 100)
              : 0;

            return (
              <TouchableOpacity
                key={student.student_id}
                style={s.studentCard}
                onPress={() => router.push(`/(tabs)/home/students/${student.id}` as any)}
              >
                <View style={s.studentHeader}>
                  <View style={s.studentInfo}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={s.avatar} />
                    ) : (
                      <View style={[s.avatar, s.avatarPlaceholder]}>
                        <Text style={s.avatarText}>
                          {student.first_name?.charAt(0).toUpperCase() || 
                           student.full_name?.charAt(0).toUpperCase() || 
                           'S'}
                        </Text>
                      </View>
                    )}
                    <View style={s.studentDetails}>
                      <Text style={s.studentName}>{student.full_name}</Text>
                      <Text style={s.studentEmail}>{student.email}</Text>
                    </View>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={s.statusText}>{statusText}</Text>
                  </View>
                </View>

                <View style={s.studentMeta}>
                  <Text style={s.metaText}>{student.level}</Text>
                  <View style={s.metaDivider} />
                  <Text style={s.metaText}>Joined {formatDate(student.joined_date)}</Text>
                </View>

                {/* Progress Bar */}
                {student.total_courses_enrolled > 0 && (
                  <View style={s.progressContainer}>
                    <Text style={s.progressLabel}>
                      Course Progress: {progressPercentage}%
                    </Text>
                    <View style={s.progressBar}>
                      <View style={[s.progressFill, { width: `${Math.min(progressPercentage, 100)}%` }]} />
                    </View>
                  </View>
                )}

                {/* Stats */}
                <View style={s.statsRow}>
                  <View style={s.stat}>
                    <Text style={s.statNumber}>{student.total_courses_enrolled}</Text>
                    <Text style={s.statLabel}>Enrolled</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statNumber}>{student.total_completed_courses}</Text>
                    <Text style={s.statLabel}>Completed</Text>
                  </View>
                  <View style={s.stat}>
                    <Text style={s.statNumber}>{student.total_in_progress_courses}</Text>
                    <Text style={s.statLabel}>In Progress</Text>
                  </View>
                </View>

                <View style={s.lastActive}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <Text style={s.lastActiveText}>
                    Last active {formattedLastActive}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={s.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={s.emptyText}>
              {students.length === 0 ? 'No students yet' : 'No students found'}
            </Text>
            <Text style={s.emptySubtext}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : activeFilter !== 'all'
                ? 'No students match this filter yet'
                : 'Students will appear here once they enroll in one of your courses'
              }
            </Text>
            {students.length === 0 && !searchQuery && (
              <TouchableOpacity
                style={s.emptyActionButton}
                onPress={() => router.push('/(tabs)/courses/create' as any)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={s.emptyActionButtonText}>Create a Course</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: c.background 
    },
    centerContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      gap: 16, 
      paddingHorizontal: 40 
    },
    loadingText: { 
      fontSize: 16, 
      color: c.textSecondary 
    },
    errorText: { 
      fontSize: 16, 
      color: c.textSecondary, 
      textAlign: 'center' 
    },
    retryButton: { 
      backgroundColor: c.brand, 
      paddingVertical: 12, 
      paddingHorizontal: 32, 
      borderRadius: 8, 
      marginTop: 8 
    },
    retryButtonText: { 
      color: 'white', 
      fontSize: 16, 
      fontWeight: '600' 
    },
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      borderBottomWidth: 1, 
      borderBottomColor: c.border 
    },
    headerTitle: { 
      fontSize: 18, 
      fontWeight: '600', 
      color: c.text 
    },
    searchContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: c.inputBg, 
      marginHorizontal: 20, 
      marginTop: 16, 
      paddingHorizontal: 16, 
      paddingVertical: 12, 
      borderRadius: 8, 
      gap: 10, 
      borderWidth: 1,
      borderColor: c.inputBorder,
      shadowColor: c.shadow, 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.1, 
      shadowRadius: 3, 
      elevation: 3 
    },
    searchInput: { 
      flex: 1, 
      fontSize: 15, 
      color: c.text 
    },
    filters: { 
      flexDirection: 'row', 
      paddingHorizontal: 20, 
      marginTop: 16, 
      marginBottom: 16, 
      gap: 8 
    },
    filterTab: { 
      paddingVertical: 8, 
      paddingHorizontal: 20, 
      borderRadius: 20, 
      backgroundColor: c.backgroundMuted 
    },
    filterTabActive: { 
      backgroundColor: c.brandLighter 
    },
    filterText: { 
      fontSize: 14, 
      fontWeight: '500', 
      color: c.textSecondary 
    },
    filterTextActive: { 
      color: c.brand, 
      fontWeight: '600' 
    },
    resultsHeader: { 
      paddingHorizontal: 20, 
      marginBottom: 12 
    },
    resultsText: { 
      fontSize: 14, 
      color: c.textMuted 
    },
    list: { 
      flex: 1, 
      paddingHorizontal: 20 
    },
    studentCard: { 
      backgroundColor: c.card, 
      padding: 16, 
      marginBottom: 16, 
      borderRadius: 8, 
      borderWidth: 1, 
      borderColor: c.border,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    studentHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      marginBottom: 12 
    },
    studentInfo: { 
      flexDirection: 'row', 
      flex: 1 
    },
    avatar: { 
      width: 48, 
      height: 48, 
      borderRadius: 24, 
      marginRight: 12, 
      backgroundColor: c.backgroundMuted 
    },
    avatarPlaceholder: { 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: c.borderMid 
    },
    avatarText: { 
      fontSize: 20, 
      fontWeight: '600', 
      color: c.textSecondary 
    },
    studentDetails: { 
      flex: 1 
    },
    studentName: { 
      fontSize: 16, 
      fontWeight: '600', 
      color: c.text, 
      marginBottom: 2 
    },
    studentEmail: { 
      fontSize: 13, 
      color: c.textSecondary 
    },
    statusBadge: { 
      paddingHorizontal: 12, 
      paddingVertical: 4, 
      borderRadius: 12 
    },
    statusText: { 
      fontSize: 12, 
      fontWeight: '600', 
      color: 'white' 
    },
    studentMeta: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: 12 
    },
    metaText: { 
      fontSize: 12, 
      color: c.textSecondary 
    },
    metaDivider: { 
      width: 1, 
      height: 12, 
      backgroundColor: c.borderMid, 
      marginHorizontal: 8 
    },
    progressContainer: { 
      marginBottom: 12 
    },
    progressLabel: { 
      fontSize: 12, 
      color: c.textSecondary, 
      marginBottom: 4 
    },
    progressBar: { 
      height: 6, 
      backgroundColor: c.backgroundMuted, 
      borderRadius: 3, 
      overflow: 'hidden' 
    },
    progressFill: { 
      height: '100%', 
      backgroundColor: c.success 
    },
    statsRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-around', 
      marginBottom: 12 
    },
    stat: { 
      alignItems: 'center' 
    },
    statNumber: { 
      fontSize: 18, 
      fontWeight: '700', 
      color: c.text, 
      marginBottom: 2 
    },
    statLabel: { 
      fontSize: 11, 
      color: c.textSecondary 
    },
    lastActive: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'flex-end', 
      gap: 4 
    },
    lastActiveText: { 
      fontSize: 11, 
      color: c.textSecondary 
    },
    emptyState: { 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingVertical: 80 
    },
    emptyText: { 
      fontSize: 18, 
      fontWeight: '600', 
      color: c.textMuted, 
      marginTop: 16 
    },
    emptySubtext: {
      fontSize: 14,
      color: c.textLight,
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 40
    },
    emptyActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.brand,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 20,
    },
    emptyActionButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
  });
}