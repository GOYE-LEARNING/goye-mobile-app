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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { getSuperAdminOrganizations, suspendSuperAdminOrganization } from '@/services/api';

type StatusFilter = 'all' | 'active' | 'suspended';

interface Organization {
  id: string;
  name: string;
  type: string;
  email: string;
  country: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  isOnline: boolean;
  createdAt: string;
  memberCount: number;
  courseCount: number;
}

export default function OrganizationsScreen() {
  const { token } = useUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const result = await getSuperAdminOrganizations(token!);
      setOrganizations(result.data || []);
    } catch (err) {
      console.error('[OrganizationsScreen] Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = (org: Organization) => {
    Alert.alert(
      org.isSuspended ? 'Reactivate organization?' : 'Suspend organization?',
      org.isSuspended
        ? `"${org.name}" and its members will regain access.`
        : `"${org.name}"'s members will lose access until reactivated.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: org.isSuspended ? 'Reactivate' : 'Suspend',
          style: org.isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            setPendingId(org.id);
            try {
              await suspendSuperAdminOrganization(org.id, !org.isSuspended, token!);
              setOrganizations((prev) =>
                prev.map((o) => (o.id === org.id ? { ...o, isSuspended: !o.isSuspended } : o)),
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update organization status');
            } finally {
              setPendingId(null);
            }
          },
        },
      ],
    );
  };

  const filtered = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'suspended' && org.isSuspended) ||
      (statusFilter === 'active' && !org.isSuspended);
    return matchesSearch && matchesStatus;
  });

  const renderOrg = ({ item }: { item: Organization }) => (
    <View style={styles.orgCard}>
      <View style={styles.orgIcon}>
        <Ionicons name="business" size={20} color="#3F1F22" />
      </View>

      <View style={styles.orgInfo}>
        <Text style={styles.orgName}>{item.name}</Text>
        <Text style={styles.orgEmail}>{item.email}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {item.type?.toLowerCase()} · {item.memberCount} members · {item.courseCount} courses
          </Text>
        </View>
      </View>

      <View style={styles.actionsCol}>
        <View style={[styles.statusBadge, item.isSuspended ? styles.suspendedBadge : styles.activeBadge]}>
          <Text style={[styles.statusBadgeText, item.isSuspended ? styles.suspendedText : styles.activeText]}>
            {item.isSuspended ? 'Suspended' : 'Active'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleToggleSuspend(item)}
          disabled={pendingId === item.id}
          style={[styles.actionButton, item.isSuspended ? styles.reactivateButton : styles.suspendButton]}
        >
          {pendingId === item.id ? (
            <ActivityIndicator size="small" color={item.isSuspended ? '#2E7D32' : '#C62828'} />
          ) : (
            <Text style={[styles.actionButtonText, item.isSuspended ? styles.reactivateText : styles.suspendText]}>
              {item.isSuspended ? 'Reactivate' : 'Suspend'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organizations</Text>
        <Text style={styles.headerCount}>{organizations.length} total</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'active', 'suspended'] as StatusFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, statusFilter === filter && styles.filterButtonActive]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text style={[styles.filterText, statusFilter === filter && styles.filterTextActive]}>
              {filter === 'all' ? 'All statuses' : filter[0].toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3F1F22" style={styles.loading} />
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderOrg}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={28} color="#999" />
              <Text style={styles.emptyText}>No organizations found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  headerCount: { fontSize: 12, color: '#666' },
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
  searchInput: { flex: 1, fontSize: 16, color: '#000' },
  filterContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 20, marginBottom: 16 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5' },
  filterButtonActive: { backgroundColor: '#3F1F22' },
  filterText: { fontSize: 13, color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: '500' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  loading: { marginTop: 40 },
  emptyState: { alignItems: 'center', gap: 8, marginTop: 60 },
  emptyText: { color: '#999', fontSize: 14 },
  orgCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  orgIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBE5E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgInfo: { flex: 1 },
  orgName: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 2 },
  orgEmail: { fontSize: 13, color: '#666', marginBottom: 4 },
  metaRow: { flexDirection: 'row' },
  metaText: { fontSize: 12, color: '#999', textTransform: 'capitalize' },
  actionsCol: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadge: { backgroundColor: '#E8F5E9' },
  suspendedBadge: { backgroundColor: '#FFEBEE' },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  activeText: { color: '#2E7D32' },
  suspendedText: { color: '#C62828' },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, minWidth: 84, alignItems: 'center' },
  suspendButton: { backgroundColor: '#FFEBEE' },
  reactivateButton: { backgroundColor: '#E8F5E9' },
  actionButtonText: { fontSize: 12, fontWeight: '600' },
  suspendText: { color: '#C62828' },
  reactivateText: { color: '#2E7D32' },
});
