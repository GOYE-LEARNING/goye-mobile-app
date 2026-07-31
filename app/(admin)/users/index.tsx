import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { getAdminStudents, getAdminTutors, getSuperAdminUsers } from '@/services/api';

type UserRole = 'All' | 'Student' | 'Instructor';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Instructor';
  avatar?: string | null;
  isSuspended?: boolean;
}

export default function UsersScreen() {
  const { token, isSuperAdmin } = useUser();
  const [selectedFilter, setSelectedFilter] = useState<UserRole>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const result = await getSuperAdminUsers(token!);
        setUsers(
          (result.data || []).map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role === 'student' ? 'Student' : 'Instructor',
            avatar: u.profilePic,
            isSuspended: u.isSuspended,
          }))
        );
      } else {
        const [studentsRes, tutorsRes] = await Promise.all([
          getAdminStudents(token!),
          getAdminTutors(token!),
        ]);
        const mapEnhanced = (list: any[], role: 'Student' | 'Instructor') =>
          (list || []).map((u: any) => ({
            id: u.id,
            name: u.full_name || `${u.first_name} ${u.last_name}`,
            email: u.email_address,
            role,
            avatar: u.user_pic,
          }));
        setUsers([
          ...mapEnhanced(studentsRes.enhancedStudents, 'Student'),
          ...mapEnhanced(tutorsRes.enhancedStudents, 'Instructor'),
        ]);
      }
    } catch (err) {
      console.error('[UsersScreen] Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesFilter =
      selectedFilter === 'All' || user.role === selectedFilter;
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const renderUser = ({ item }: { item: AdminUser }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => router.push(`/(admin)/users/${item.id}`)}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.initials}>{getInitials(item.name)}</Text>
        </View>
      )}

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>

      {item.isSuspended && (
        <View style={styles.suspendedBadge}>
          <Text style={styles.suspendedBadgeText}>Suspended</Text>
        </View>
      )}

      <View
        style={[
          styles.badge,
          item.role === 'Instructor' ? styles.instructorBadge : styles.studentBadge,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            item.role === 'Instructor'
              ? styles.instructorBadgeText
              : styles.studentBadgeText,
          ]}
        >
          {item.role}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Users</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search user..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {(['All', 'Student', 'Instructor'] as UserRole[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Users List */}
      {loading ? (
        <ActivityIndicator size="large" color="#3F1F22" style={styles.loading} />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found</Text>}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#3F1F22',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500',
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  studentBadge: {
    backgroundColor: '#E8F5E9',
  },
  instructorBadge: {
    backgroundColor: '#E3F2FD',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  studentBadgeText: {
    color: '#2E7D32',
  },
  instructorBadgeText: {
    color: '#1976D2',
  },
  suspendedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    marginRight: 4,
  },
  suspendedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F44336',
  },
});
