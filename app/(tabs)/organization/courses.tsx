// app/(tabs)/organization/courses.tsx
//
// Mobile counterpart to web's dashboard/[org_name]/admin/course (rendered
// via ReviewCourses.tsx) — every course this organization owns, with
// enrollment/completion stats and delete. This is org-scoped, distinct
// from the global (tabs)/courses tab.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getOrgCoursesWithStats, deleteCourse } from '@/services/api';
import { getFriendlyErrorMessage } from '@/utils/errorMessages';

interface OrgCourse {
  id: string;
  course_title: string;
  course_short_description: string | null;
  course_level: string | null;
  createdBy: string;
  stats: {
    totalEnrollments: number;
    completionRate: number;
    averageProgress: number;
  };
}

export default function OrganizationCourses() {
  const { user, token } = useUser();
  const { colors } = useTheme();
  const organizationId = user?.organizationId;
  const s = makeStyles(colors);

  const [courses, setCourses] = useState<OrgCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [organizationId]);

  const fetchCourses = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await getOrgCoursesWithStats(organizationId, token!);
      setCourses(result.data?.courses || []);
      setError(null);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err, 'loading your courses'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (course: OrgCourse) => {
    Alert.alert('Delete course?', `"${course.course_title}" and all its content will be removed. This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setPendingId(course.id);
          try {
            await deleteCourse(course.id, token!);
            setCourses((prev) => prev.filter((c) => c.id !== course.id));
          } catch (err: any) {
            Alert.alert('Error', getFriendlyErrorMessage(err, 'deleting that course'));
          } finally {
            setPendingId(null);
          }
        },
      },
    ]);
  };

  const filtered = courses.filter((c) => c.course_title.toLowerCase().includes(search.toLowerCase()));

  const renderCourse = ({ item }: { item: OrgCourse }) => (
    <View style={s.card}>
      <View style={s.cardIcon}>
        <Ionicons name="book" size={18} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.courseName} numberOfLines={1}>{item.course_title}</Text>
        {!!item.course_level && <Text style={s.meta} numberOfLines={1}>{item.course_level}</Text>}
        <Text style={s.meta} numberOfLines={1}>
          {item.stats.totalEnrollments} enrolled · {item.stats.completionRate}% completion
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item)} disabled={pendingId === item.id} hitSlop={8}>
        {pendingId === item.id ? (
          <ActivityIndicator size="small" color="#C62828" />
        ) : (
          <Ionicons name="trash-outline" size={19} color="#C62828" />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Review Courses</Text>
        <Text style={s.headerCount}>{courses.length}</Text>
      </View>

      <View style={s.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search your courses..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.brand} style={s.loading} />
      ) : error ? (
        <Text style={s.empty}>{error}</Text>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderCourse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No courses yet</Text>}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitle: { fontSize: 16, fontWeight: '600', color: c.text },
    headerCount: { fontSize: 12, color: c.textSecondary, minWidth: 24, textAlign: 'right' },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.backgroundMuted,
      marginHorizontal: 20,
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 16, color: c.text },
    list: { padding: 20, gap: 10 },
    loading: { marginTop: 40 },
    empty: { textAlign: 'center', fontSize: 14, marginTop: 40, paddingHorizontal: 24, color: c.textMuted },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.backgroundMuted,
      gap: 12,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.brandLight,
    },
    courseName: { fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 2 },
    meta: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
  });
}
