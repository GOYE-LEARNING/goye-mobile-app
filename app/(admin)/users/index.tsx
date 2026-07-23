import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type UserRole = 'All' | 'Student' | 'Instructor';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Instructor';
  avatar?: string;
}

export default function UsersScreen() {
  const [selectedFilter, setSelectedFilter] = useState<UserRole>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const users: User[] = [
    {
      id: '1',
      name: 'Kurt Bates',
      email: 'kurt.bates@gmail.com',
      role: 'Student',
    },
    {
      id: '2',
      name: 'James Hall',
      email: 'jameshall@gmail.com',
      role: 'Student',
    },
    {
      id: '3',
      name: 'Alex Buckmaster',
      email: 'buckmaster.a@ent.com',
      role: 'Instructor',
    },
    {
      id: '4',
      name: 'Kathy Pacheco',
      email: 'k_pacheco@gmail.com',
      role: 'Student',
    },
    {
      id: '5',
      name: 'Judith Rodriguez',
      email: 'jrodriguez@outlook.com',
      role: 'Instructor',
    },
    {
      id: '6',
      name: 'Kimberly Mastrangelo',
      email: 'kva838@outlook.com',
      role: 'Student',
    },
    {
      id: '7',
      name: 'Stephanie Sharkey',
      email: 'stephaniecai@outlook.com',
      role: 'Instructor',
    },
  ];

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

  const renderUser = ({ item }: { item: User }) => (
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
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
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
});