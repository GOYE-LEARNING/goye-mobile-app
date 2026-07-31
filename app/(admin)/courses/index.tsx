import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { getCourses, deleteSuperAdminCourse } from '@/services/api';
import { getImageUri } from '@/utils/helpers';

export default function AdminCourses() {
  const { token, isSuperAdmin } = useUser();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const result = await getCourses(token!);
      setCourses(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('[AdminCourses] Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (courseId: string, title: string) => {
    Alert.alert('Delete Course', `Are you sure you want to delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(courseId);
          try {
            await deleteSuperAdminCourse(courseId, token!);
            setCourses((prev) => prev.filter((c) => c.id !== courseId));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete course');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const filteredCourses = courses.filter((course) =>
    !searchQuery.trim() ||
    course.course_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCourse = ({ item }: { item: any }) => (
    <View style={styles.courseCard}>
      {getImageUri(item.course_image) ? (
        <Image source={{ uri: getImageUri(item.course_image)! }} style={styles.courseImage} />
      ) : (
        <View style={styles.courseImagePlaceholder}>
          <Ionicons name="book" size={24} color="#999" />
        </View>
      )}
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={1}>{item.course_title}</Text>
        <Text style={styles.courseLevel}>{item.course_level}</Text>
      </View>
      {isSuperAdmin && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.course_title)}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator size="small" color="#F44336" />
          ) : (
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Courses</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3F1F22" style={styles.loading} />
      ) : (
        <FlatList
          data={filteredCourses}
          renderItem={renderCourse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No courses found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  loading: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 40,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  courseImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  courseImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  courseLevel: {
    fontSize: 13,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
});
