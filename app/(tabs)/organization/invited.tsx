// app/(tabs)/organization/invited.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getInvitedUsers, resendInvitation } from '@/services/api';

type TabKey = 'pending' | 'expired' | 'accepted';

export default function OrganizationInvitedUsers() {
  const { user, token } = useUser();
  const { colors } = useTheme();
  const organizationId = user?.organizationId;

  const [data, setData] = useState<{ pending: any[]; expired: any[]; accepted: any[] }>({ pending: [], expired: [], accepted: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('pending');
  const [resendingId, setResendingId] = useState<string | null>(null);

  const s = makeStyles(colors);

  useEffect(() => {
    fetchInvited();
  }, [organizationId]);

  const fetchInvited = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await getInvitedUsers(organizationId, token!);
      setData(result.data || { pending: [], expired: [], accepted: [] });
    } catch (err) {
      console.error('[OrganizationInvitedUsers] Error fetching invited users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (invitationId: string) => {
    setResendingId(invitationId);
    try {
      await resendInvitation(invitationId, token!);
      Alert.alert('Success', 'Invitation resent successfully');
      fetchInvited();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to resend invitation');
    } finally {
      setResendingId(null);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'pending', label: `Pending (${data.pending.length})` },
    { key: 'expired', label: `Expired (${data.expired.length})` },
    { key: 'accepted', label: `Accepted (${data.accepted.length})` },
  ];

  const renderInvitation = ({ item }: { item: any }) => (
    <View style={s.row}>
      <View style={s.rowInfo}>
        <Text style={s.rowEmail}>{item.email}</Text>
        <Text style={s.rowMeta}>
          {item.role} • Invited {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {(tab === 'pending' || tab === 'expired') && (
        <TouchableOpacity style={s.resendButton} onPress={() => handleResend(item.id)} disabled={resendingId === item.id}>
          {resendingId === item.id ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : (
            <>
              <Ionicons name="refresh" size={14} color={colors.brand} />
              <Text style={s.resendButtonText}>Resend</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAccepted = ({ item }: { item: any }) => (
    <View style={s.row}>
      <View style={s.rowInfo}>
        <Text style={s.rowEmail}>{item.first_name} {item.last_name}</Text>
        <Text style={s.rowMeta}>{item.email_address} • {item.role}</Text>
      </View>
      <View style={s.acceptedBadge}>
        <Text style={s.acceptedBadgeText}>Joined</Text>
      </View>
    </View>
  );

  const currentList = data[tab] || [];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Invited Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity key={t.key} style={[s.tab, tab === t.key && s.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.brand} style={s.loading} />
      ) : (
        <FlatList
          data={currentList}
          renderItem={tab === 'accepted' ? renderAccepted : renderInvitation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={<Text style={s.emptyText}>No {tab} invitations</Text>}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    headerTitle: { fontSize: 16, fontWeight: '600', color: c.text },
    tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: c.backgroundMuted },
    tabActive: { backgroundColor: c.brandLighter },
    tabText: { fontSize: 12, color: c.textMuted, fontWeight: '500' },
    tabTextActive: { color: c.brand, fontWeight: '700' },
    loading: { marginTop: 40 },
    listContent: { padding: 20 },
    emptyText: { textAlign: 'center', color: c.textMuted, marginTop: 40 },
    row: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    rowInfo: { flex: 1 },
    rowEmail: { fontSize: 14, fontWeight: '600', color: c.text },
    rowMeta: { fontSize: 12, color: c.textSecondary, marginTop: 2, textTransform: 'capitalize' },
    resendButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
    resendButtonText: { fontSize: 12, color: c.brand, fontWeight: '600' },
    acceptedBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    acceptedBadgeText: { fontSize: 11, fontWeight: '600', color: '#2E7D32' },
  });
}
