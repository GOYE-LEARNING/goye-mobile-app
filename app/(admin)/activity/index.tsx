// app/(admin)/activity/index.tsx
//
// Mobile counterpart to web's dashboard/super-admin/activity — a merged feed
// of recent signups, new organizations, and new courses across the platform.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getSuperAdminActivity } from '@/services/api';
import { getFriendlyErrorMessage } from '@/utils/errorMessages';

type ActivityType = 'user_signup' | 'organization_created' | 'course_created';

interface ActivityItem {
  type: ActivityType;
  id: string;
  title: string;
  detail: string;
  createdAt: string;
}

const ICONS: Record<ActivityType, keyof typeof Ionicons.glyphMap> = {
  user_signup: 'person-add',
  organization_created: 'business',
  course_created: 'book',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ActivityScreen() {
  const { token } = useUser();
  const { colors } = useTheme();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await getSuperAdminActivity(token!);
        setActivity(result.data || []);
      } catch (err: any) {
        setError(getFriendlyErrorMessage(err, 'loading platform activity'));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const renderItem = ({ item }: { item: ActivityItem }) => (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: colors.brandLight }]}>
        <Ionicons name={ICONS[item.type] ?? 'ellipse'} size={17} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.detail, { color: colors.textSecondary }]} numberOfLines={2}>{item.detail}</Text>
      </View>
      <Text style={[styles.time, { color: colors.textMuted }]}>{timeAgo(item.createdAt)}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Platform Activity</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.brand} style={styles.loading} />
      ) : error ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>{error}</Text>
      ) : (
        <FlatList
          data={activity}
          renderItem={renderItem}
          keyExtractor={(item, i) => `${item.type}-${item.id}-${i}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No recent activity</Text>}
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
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  loading: { marginTop: 40 },
  empty: { textAlign: 'center', fontSize: 14, marginTop: 40, paddingHorizontal: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  detail: { fontSize: 13 },
  time: { fontSize: 11 },
});
