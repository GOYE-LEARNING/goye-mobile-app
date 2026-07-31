// app/(tabs)/organization/members/[userId].tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getOrgMemberDetail, suspendMember, removeMember } from '@/services/api';
import { getImageUri } from '@/utils/helpers';

export default function OrganizationMemberDetail() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user, token } = useUser();
  const { colors } = useTheme();
  const organizationId = user?.organizationId;

  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const s = makeStyles(colors);

  useEffect(() => {
    fetchMember();
  }, [userId]);

  const fetchMember = async () => {
    setLoading(true);
    try {
      const result = await getOrgMemberDetail(userId, token!);
      setMember(result.data);
    } catch (err) {
      console.error('[OrganizationMemberDetail] Error fetching member:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!organizationId) return;
    setUpdating(true);
    try {
      await suspendMember(organizationId, userId, !member.isSuspended, token!);
      setMember({ ...member, isSuspended: !member.isSuspended });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update member status');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.first_name} ${member.last_name} from the organization? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!organizationId) return;
            setUpdating(true);
            try {
              await removeMember(organizationId, userId, token!);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to remove member');
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <Text style={s.emptyText}>Member not found</Text>
      </SafeAreaView>
    );
  }

  const avatarUri = member.user_pic ? getImageUri(member.user_pic) : null;
  const membership = member.organizationMemberships?.[0];

  return (
    <View style={s.container}>
      <ScrollView>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <View style={s.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.avatar} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={colors.textMuted} />
              </View>
            )}
          </View>

          <Text style={s.name}>{member.first_name} {member.last_name}</Text>
          <Text style={s.email}>{member.email_address}</Text>

          {membership?.role && (
            <View style={s.roleBadge}>
              <Text style={s.roleBadgeText}>{membership.role}</Text>
            </View>
          )}

          <View style={s.infoRow}>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Joined</Text>
              <Text style={s.infoValue}>
                {membership?.joinedAt ? new Date(membership.joinedAt).toLocaleDateString() : '—'}
              </Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Status</Text>
              <Text style={[s.infoValue, member.isSuspended ? s.statusSuspended : s.statusActive]}>
                {member.isSuspended ? 'Suspended' : member.isOnline ? 'Online' : 'Active'}
              </Text>
            </View>
          </View>

          {Array.isArray(member.enrollment) && member.enrollment.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Enrolled Courses ({member.enrollment.length})</Text>
              {member.enrollment.map((e: any) => (
                <Text key={e.id} style={s.listItem}>• {e.course?.course_title}</Text>
              ))}
            </View>
          )}

          {Array.isArray(member.Courses) && member.Courses.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Courses Taught ({member.Courses.length})</Text>
              {member.Courses.map((c: any) => (
                <Text key={c.id} style={s.listItem}>• {c.course_title}</Text>
              ))}
            </View>
          )}

          <View style={s.actions}>
            {member.isSuspended ? (
              <TouchableOpacity style={s.restoreButton} onPress={handleToggleSuspend} disabled={updating}>
                {updating ? <ActivityIndicator size="small" color="#2196F3" /> : (
                  <>
                    <Ionicons name="refresh" size={16} color="#2196F3" />
                    <Text style={s.restoreButtonText}>Restore Member</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.suspendButton} onPress={handleToggleSuspend} disabled={updating}>
                {updating ? <ActivityIndicator size="small" color="#F44336" /> : (
                  <>
                    <Ionicons name="close-circle-outline" size={16} color="#F44336" />
                    <Text style={s.suspendButtonText}>Suspend Member</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={s.removeButton} onPress={handleRemove} disabled={updating}>
            <Ionicons name="trash-outline" size={16} color="#F44336" />
            <Text style={s.removeButtonText}>Remove from Organization</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.backgroundMuted },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    card: { backgroundColor: c.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, alignItems: 'center' },
    avatarContainer: { marginBottom: 16 },
    avatar: { width: 80, height: 80, borderRadius: 40 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.backgroundMuted, alignItems: 'center', justifyContent: 'center' },
    name: { fontSize: 22, fontWeight: '600', color: c.text, marginBottom: 4 },
    email: { fontSize: 14, color: c.textSecondary, marginBottom: 12 },
    roleBadge: { backgroundColor: c.brandLighter, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, marginBottom: 20 },
    roleBadgeText: { fontSize: 13, fontWeight: '600', color: c.brand, textTransform: 'capitalize' },
    infoRow: { flexDirection: 'row', width: '100%', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border },
    infoItem: { flex: 1 },
    infoLabel: { fontSize: 12, color: c.textMuted, marginBottom: 4 },
    infoValue: { fontSize: 14, color: c.text, fontWeight: '500' },
    statusActive: { color: '#2E7D32' },
    statusSuspended: { color: '#F44336' },
    section: { width: '100%', marginTop: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 8 },
    listItem: { fontSize: 13, color: c.textSecondary, marginBottom: 4 },
    actions: { width: '100%', marginTop: 24 },
    suspendButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      borderWidth: 1, borderColor: '#F44336', paddingVertical: 14, borderRadius: 10,
    },
    suspendButtonText: { color: '#F44336', fontWeight: '600' },
    restoreButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      borderWidth: 1, borderColor: '#2196F3', paddingVertical: 14, borderRadius: 10,
    },
    restoreButtonText: { color: '#2196F3', fontWeight: '600' },
    removeButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 16, marginTop: 8,
    },
    removeButtonText: { color: '#F44336', fontWeight: '500' },
    emptyText: { color: c.textMuted },
  });
}
