// app/(tabs)/courses/index.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { API_CONFIG } from '@/constants/config';
import StudentCourseCard from '@/components/courses/StudentCourseCard';
import InstructorCourseCard from '@/components/courses/InstructorCourseCard';
import { getEnrolledCourses } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';


export default function Courses() {
  const { user, token, isInstructor } = useUser();
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async (filterType: string = 'all') => {
    try {
      setLoading(true);
      setError(null);
      if (isInstructor) {
        await fetchInstructorCourses(filterType);
      } else {
        if (filterType === 'enrolled') {
          await fetchEnrolledCourses();
        } else {
          await fetchAllCoursesForStudent(filterType);
        }
      }
    } catch (err) {
      setError('Unable to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructorCourses = async (filterType: string) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/course/get-all-courses`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    if (response.ok) {
      let coursesData = Array.isArray(result.data) ? result.data
        : result.data && Array.isArray(result.data.getAllCourses) ? result.data.getAllCourses : [];
      const myCourses = coursesData.filter((c: any) => c.createdUserId === user?.id);
      let filtered = [...myCourses];
      if (filterType === 'published') filtered = filtered.filter((c: any) => c.isPublished === true);
      else if (filterType === 'draft') filtered = filtered.filter((c: any) => c.isPublished === false);
      setCourses(filtered);
    } else {
      setError(result.message || 'Failed to load courses');
    }
  };

  const fetchEnrolledCourses = async () => {
  const result = await getEnrolledCourses(token);
  console.log('=== ENROLLED COURSES RESPONSE ===');
  console.log(JSON.stringify(result, null, 2));

  if (result.data && Array.isArray(result.data.courses)) {
    const enrolledCourses = result.data.courses.map((item: any) => ({
      ...item.course,
      isEnrolled: true,
      status: 'Enrolled',
      enrollment_id: item.enrollment_id,
      enrollment_status: item.enrollment_status,
      course_progress: item.course_progress,
      course_score: item.course_score,
    }));
    setCourses(enrolledCourses);
  } else {
    setError(result.message || 'Failed to load enrolled courses');
    setCourses([]);
  }
};


const fetchAllCoursesForStudent = async (filterType: string) => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/course/get-all-courses`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const result = await response.json();
  if (response.ok) {
    let allCourses = Array.isArray(result.data) ? result.data
      : result.data && Array.isArray(result.data.getAllCourses) ? result.data.getAllCourses : [];
    
    // ✅ First, fetch enrolled courses to get progress data
    let enrolledData = null;
    try {
      const enrolledResult = await getEnrolledCourses(token);
      if (enrolledResult.data && Array.isArray(enrolledResult.data.courses)) {
        enrolledData = enrolledResult.data.courses;
      }
    } catch (err) {
      console.log('Could not fetch enrolled courses for progress data');
    }
    
    let filtered = allCourses.map((c: any) => {
      // ✅ Check if this course is in the enrolled list
      let isEnrolled = c.isEnrolled || false;
      let progress = 0;
      let enrollmentStatus = 'Available';
      
      if (enrolledData) {
        const enrolled = enrolledData.find((e: any) => e.course?.id === c.id);
        if (enrolled) {
          isEnrolled = true;
          progress = enrolled.course_progress || 0;
          enrollmentStatus = enrolled.enrollment_status || 'Enrolled';
        }
      }
      
      // ✅ Determine status based on enrollment and progress
      let status = 'Available';
      if (isEnrolled) {
        status = progress >= 100 ? 'Done' : 'Enrolled';
      }
      
      return {
        ...c,
        isEnrolled: isEnrolled,
        status: status,
        saved: c.saved || false,
        isCompleted: c.isCompleted || false,
        course_progress: progress,
        enrollment_status: enrollmentStatus,
      };
    });
    
    if (filterType === 'saved') filtered = filtered.filter((c: any) => c.saved === true);
    else if (filterType === 'done') filtered = filtered.filter((c: any) => c.isCompleted === true);
    else if (filterType === 'enrolled') filtered = filtered.filter((c: any) => c.isEnrolled === true);
    
    setCourses(filtered);
  } else {
    setError(result.message || 'Failed to load courses');
  }
};

  useEffect(() => { fetchCourses(activeFilter); }, [activeFilter]);

  const filteredCourses = !Array.isArray(courses) ? [] : courses.filter(course => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return course.course_title?.toLowerCase().includes(q)
      || course.course_description?.toLowerCase().includes(q)
      || course.createdBy?.toLowerCase().includes(q);
  });

  const s = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryButton} onPress={() => fetchCourses(activeFilter)}>
            <Text style={s.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const instructorFilters = ['all', 'published', 'draft'];
  const studentFilters    = ['all', 'enrolled', 'saved', 'done'];
  const filters = isInstructor ? instructorFilters : studentFilters;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>{isInstructor ? 'My Courses' : 'Courses'}</Text>
        {isInstructor && (
          <TouchableOpacity style={s.addButton} onPress={() => router.push('/(tabs)/courses/create')}>
            <Ionicons name="add-circle" size={32} color={colors.brand} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder={isInstructor ? 'Search my courses...' : 'Search courses...'}
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

      {/* Filter Tabs */}
      <View style={s.filters}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterTab, activeFilter === f && s.filterTabActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results count */}
      <View style={s.resultsHeader}>
        <Text style={s.resultsText}>
          {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
          {activeFilter !== 'all' && ` in ${activeFilter}`}
        </Text>
      </View>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} style={s.scrollView}>
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) =>
            isInstructor
              ? <InstructorCourseCard key={course.id} course={course} />
              : <StudentCourseCard key={course.id} course={course} />
          )
        ) : (
          <View style={s.emptyState}>
            <Ionicons
              name={activeFilter === 'enrolled' ? 'bookmark-outline' : 'book-outline'}
              size={64}
              color={colors.borderMid}
            />
            <Text style={s.emptyText}>
              {searchQuery ? 'No courses found'
                : activeFilter === 'enrolled' ? 'No enrolled courses'
                : activeFilter === 'saved'    ? 'No saved courses'
                : activeFilter === 'done'     ? 'No completed courses'
                : 'No courses found'}
            </Text>
            <Text style={s.emptySubtext}>
              {searchQuery ? 'Try adjusting your search'
                : activeFilter === 'enrolled' ? 'Enroll in courses to see them here'
                : 'Check back later for new courses'}
            </Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: c.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText:      { fontSize: 16, color: c.textSecondary },
    errorContainer:   { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 16 },
    errorText:        { fontSize: 16, color: c.textSecondary, textAlign: 'center' },
    retryButton:      { backgroundColor: c.brand, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
    retryButtonText:  { color: '#fff', fontSize: 16, fontWeight: '600' },

    headerRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    pageTitle:        { fontSize: 28, fontWeight: '700', color: c.text },
    addButton:        { padding: 4 },

    searchContainer:  { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, marginHorizontal: 20, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, gap: 10, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
    searchInput:      { flex: 1, fontSize: 15, color: c.text },

    filters:          { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
    filterTab:        { paddingVertical: 8, paddingHorizontal: 20, backgroundColor: c.backgroundMuted },
    filterTabActive:  { backgroundColor: c.brandLighter },
    filterText:       { fontSize: 14, fontWeight: '500', color: c.textSecondary },
    filterTextActive: { color: c.brand, fontWeight: '600' },

    resultsHeader:    { paddingHorizontal: 20, marginBottom: 12 },
    resultsText:      { fontSize: 14, color: c.textMuted },

    scrollView:       { flex: 1, paddingHorizontal: 20 },
    emptyState:       { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    emptyText:        { fontSize: 18, fontWeight: '600', color: c.textMuted, marginTop: 16 },
    emptySubtext:     { fontSize: 14, color: c.textMuted, marginTop: 8, textAlign: 'center' },
  });
}