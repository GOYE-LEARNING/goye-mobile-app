// app/(admin)/events/index.tsx
//
// Mobile counterpart to web's dashboard/super-admin/events — every event
// across every organization, with delete.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getSuperAdminEvents, deleteSuperAdminEvent } from '@/services/api';
import { getFriendlyErrorMessage } from '@/utils/errorMessages';

interface PlatformEvent {
  id: string;
  name: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  type: string | null;
  status: string | null;
  capacity: number | null;
  organizationName: string;
  attendees: number;
}

export default function EventsScreen() {
  const { token } = useUser();
  const { colors } = useTheme();
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const result = await getSuperAdminEvents(token!);
      setEvents(result.data || []);
      setError(null);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err, 'loading events'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (event: PlatformEvent) => {
    Alert.alert('Delete event?', `"${event.name}" will be removed for everyone. This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setPendingId(event.id);
          try {
            await deleteSuperAdminEvent(event.id, token!);
            setEvents((prev) => prev.filter((e) => e.id !== event.id));
          } catch (err: any) {
            Alert.alert('Error', getFriendlyErrorMessage(err, 'deleting that event'));
          } finally {
            setPendingId(null);
          }
        },
      },
    ]);
  };

  const filtered = events.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.organizationName.toLowerCase().includes(search.toLowerCase()),
  );

  const renderEvent = ({ item }: { item: PlatformEvent }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: colors.brandLight }]}>
        <Ionicons name="calendar" size={18} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
          {item.organizationName}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {new Date(item.date).toLocaleDateString()}
          {item.time ? ` · ${item.time}` : ''}
          {` · ${item.attendees} attending`}
        </Text>
        {!!item.location && (
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>{item.location}</Text>
        )}
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Events</Text>
        <Text style={[styles.count, { color: colors.textMuted }]}>{events.length}</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundMuted }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by event or organization..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.brand} style={styles.loading} />
      ) : error ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>{error}</Text>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No events found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  count: { fontSize: 12, minWidth: 24, textAlign: 'right' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16 },
  list: { padding: 20, gap: 10 },
  loading: { marginTop: 40 },
  empty: { textAlign: 'center', fontSize: 14, marginTop: 40, paddingHorizontal: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  meta: { fontSize: 12, marginTop: 1 },
});
