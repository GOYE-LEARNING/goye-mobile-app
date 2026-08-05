// app/(tabs)/organization/activity.tsx
//
// Mobile counterpart to web's dashboard_org_admin_activities — a merged feed
// of course joins/completions, event/group joins, posts, quiz completions,
// and achievements across this organization's members.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getOrgActivities } from '@/services/api';
import { getFriendlyErrorMessage } from '@/utils/errorMessages';

interface OrgActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  icon: string;
}

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

export default function OrganizationActivity() {
  const { user, token } = useUser();
  const { colors } = useTheme();
  const organizationId = user?.organizationId;
  const s = makeStyles(colors);

  const [activities, setActivities] = useState<OrgActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!organizationId) {
        setLoading(false);
        return;
      }
      try {
        const result = await getOrgActivities(organizationId, token!);
        setActivities(result.data?.activities || []);
      } catch (err: any) {
        setError(getFriendlyErrorMessage(err, 'loading organization activity'));
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationId]);

  const renderItem = ({ item }: { item: OrgActivity }) => (
    <View style={s.row}>
      <View style={s.icon}>
        <Text style={{ fontSize: 16 }}>{item.icon || '🔔'}</Text>
      </View>
      <Text style={s.message} numberOfLines={2}>{item.message}</Text>
      <Text style={s.time}>{timeAgo(item.timestamp)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Activity</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.brand} style={s.loading} />
      ) : error ? (
        <Text style={s.empty}>{error}</Text>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No recent activity</Text>}
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
    list: { paddingHorizontal: 20, paddingVertical: 10 },
    loading: { marginTop: 40 },
    empty: { textAlign: 'center', fontSize: 14, marginTop: 40, paddingHorizontal: 24, color: c.textMuted },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.brandLight,
    },
    message: { flex: 1, fontSize: 14, color: c.text },
    time: { fontSize: 11, color: c.textMuted },
  });
}
