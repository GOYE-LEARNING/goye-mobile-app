// app/(admin)/feedback/index.tsx
//
// Platform-admin view of feedback submitted by users across GOYE.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllFeedback } from '@/services/api';
import { getFriendlyErrorMessage } from '@/utils/errorMessages';

type FeedbackType = 'COURSE' | 'GROUP' | 'OTHER';

interface FeedbackItem {
  id: string;
  message: string;
  type: FeedbackType;
  createdAt: string;
  user?: { first_name?: string; last_name?: string; email_address?: string; role?: string } | null;
  organization?: { organization_name?: string } | null;
}

const ICONS: Record<FeedbackType, keyof typeof Ionicons.glyphMap> = {
  COURSE: 'book-outline',
  GROUP: 'people-outline',
  OTHER: 'chatbox-ellipses-outline',
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

export default function AdminFeedbackScreen() {
  const { token } = useUser();
  const { colors } = useTheme();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await getAllFeedback(token!);
        setFeedback(result.data || []);
      } catch (err: any) {
        setError(getFriendlyErrorMessage(err, 'loading feedback'));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const renderItem = ({ item }: { item: FeedbackItem }) => {
    const name = `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || item.user?.email_address || 'Unknown user';
    return (
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: colors.brandLight }]}>
          <Ionicons name={ICONS[item.type] ?? 'chatbox-ellipses-outline'} size={17} color={colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.message, { color: colors.text }]}>{item.message}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {name}{item.organization?.organization_name ? ` · ${item.organization.organization_name}` : ''}
          </Text>
        </View>
        <Text style={[styles.time, { color: colors.textMuted }]}>{timeAgo(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>User Feedback</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.brand} style={styles.loading} />
      ) : error ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>{error}</Text>
      ) : (
        <FlatList
          data={feedback}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No feedback submitted yet</Text>}
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
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  message: { fontSize: 14, marginBottom: 4, lineHeight: 19 },
  meta: { fontSize: 12 },
  time: { fontSize: 11 },
});
