// app/(tabs)/organization/members.tsx
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getOrgMembers } from '@/services/api';
import { getImageUri } from '@/utils/helpers';

export default function OrganizationMembers() {
  const { user, token } = useUser();
  const { colors } = useTheme();
  const organizationId = user?.organizationId;

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const s = makeStyles(colors);

  useEffect(() => {
    fetchMembers();
  }, [organizationId]);

  const fetchMembers = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await getOrgMembers(organizationId, token!);
      setMembers(result.data || []);
    } catch (err) {
      console.error('[OrganizationMembers] Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = `${m.user?.first_name || ''} ${m.user?.last_name || ''}`.toLowerCase();
    return name.includes(q) || m.user?.email_address?.toLowerCase().includes(q);
  });

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';

  const renderMember = ({ item }: { item: any }) => {
    const name = `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || 'Unknown';
    const avatarUri = item.user?.user_pic ? getImageUri(item.user.user_pic) : null;

    return (
      <TouchableOpacity
        style={s.memberCard}
        onPress={() => router.push(`/(tabs)/organization/members/${item.userId}` as any)}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={s.avatar} />
        ) : (
          <View style={s.avatarPlaceholder}>
            <Text style={s.initials}>{getInitials(name)}</Text>
          </View>
        )}
        <View style={s.memberInfo}>
          <Text style={s.memberName}>{name}</Text>
          <Text style={s.memberEmail}>{item.user?.email_address}</Text>
        </View>
        {item.user?.isSuspended && (
          <View style={s.suspendedBadge}>
            <Text style={s.suspendedBadgeText}>Suspended</Text>
          </View>
        )}
        <Text style={s.roleText}>{item.role}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Members</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search members..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.brand} style={s.loading} />
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderMember}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={<Text style={s.emptyText}>No members found</Text>}
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
    searchInput: { flex: 1, fontSize: 15, color: c.text },
    loading: { marginTop: 40 },
    listContent: { padding: 20 },
    emptyText: { textAlign: 'center', color: c.textMuted, marginTop: 40 },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    avatarPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.backgroundMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 15, fontWeight: '600', color: c.text },
    memberEmail: { fontSize: 13, color: c.textSecondary },
    roleText: { fontSize: 12, color: c.textMuted, textTransform: 'capitalize' },
    suspendedBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: '#FFEBEE',
      marginRight: 4,
    },
    suspendedBadgeText: { fontSize: 10, fontWeight: '600', color: '#F44336' },
  });
}
