// app/(tabs)/organization/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getOrgOverviewStats, getOrgUserBreakdown } from '@/services/api';

export default function OrganizationOverview() {
  const { user, token } = useUser();
  const { colors } = useTheme();
  const organizationId = user?.organizationId;

  const [stats, setStats] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const s = makeStyles(colors);

  useEffect(() => {
    fetchOverview();
  }, [organizationId]);

  const fetchOverview = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [statsResult, breakdownResult] = await Promise.all([
        getOrgOverviewStats(organizationId, token!),
        getOrgUserBreakdown(organizationId, token!),
      ]);
      setStats(statsResult.data);
      setBreakdown(breakdownResult.data);
    } catch (err) {
      console.error('[OrganizationOverview] Error fetching overview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Manage Organization</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Stats */}
        <Text style={s.sectionTitle}>Overview</Text>
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{stats?.total_members ?? 0}</Text>
            <Text style={s.statLabel}>Total Members</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{stats?.online_members ?? 0}</Text>
            <Text style={s.statLabel}>Online Now</Text>
          </View>
        </View>
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{stats?.new_members_in_range ?? 0}</Text>
            <Text style={s.statLabel}>New Members</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{stats?.avg_completion ?? 0}%</Text>
            <Text style={s.statLabel}>Avg. Completion</Text>
          </View>
        </View>

        {breakdown && (
          <>
            <Text style={s.sectionTitle}>Members Breakdown</Text>
            <View style={s.statsGrid}>
              <View style={s.statCard}>
                <Text style={s.statValue}>{breakdown.students ?? 0}</Text>
                <Text style={s.statLabel}>Students</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statValue}>{breakdown.instructors ?? 0}</Text>
                <Text style={s.statLabel}>Instructors</Text>
              </View>
            </View>
          </>
        )}

        {/* Quick Links */}
        <Text style={s.sectionTitle}>Manage</Text>
        <View style={s.linksGrid}>
          <TouchableOpacity style={s.linkCard} onPress={() => router.push('/(tabs)/organization/members' as any)}>
            <Ionicons name="people" size={24} color={colors.brand} />
            <Text style={s.linkText}>Members</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.linkCard} onPress={() => router.push('/(tabs)/organization/events' as any)}>
            <Ionicons name="calendar" size={24} color={colors.brand} />
            <Text style={s.linkText}>Events</Text>
          </TouchableOpacity>
        </View>
        <View style={s.linksGrid}>
          <TouchableOpacity style={s.linkCard} onPress={() => router.push('/(tabs)/organization/announcements' as any)}>
            <Ionicons name="megaphone" size={24} color={colors.brand} />
            <Text style={s.linkText}>Announcements</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.linkCard} onPress={() => router.push('/(tabs)/organization/invited' as any)}>
            <Ionicons name="mail" size={24} color={colors.brand} />
            <Text style={s.linkText}>Invited Users</Text>
          </TouchableOpacity>
        </View>
        {/* Mirrors web's org-admin quick actions ("Review Courses" and the
            activity feed) — the two org-scoped screens mobile was missing. */}
        <View style={s.linksGrid}>
          <TouchableOpacity style={s.linkCard} onPress={() => router.push('/(tabs)/organization/courses' as any)}>
            <Ionicons name="book" size={24} color={colors.brand} />
            <Text style={s.linkText}>Review Courses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.linkCard} onPress={() => router.push('/(tabs)/organization/activity' as any)}>
            <Ionicons name="pulse" size={24} color={colors.brand} />
            <Text style={s.linkText}>Activity</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    content: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 12, marginTop: 12 },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    statCard: {
      flex: 1,
      backgroundColor: c.backgroundMuted,
      padding: 16,
      borderRadius: 12,
    },
    statValue: { fontSize: 24, fontWeight: '700', color: c.text, marginBottom: 4 },
    statLabel: { fontSize: 12, color: c.textSecondary },
    linksGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    linkCard: {
      flex: 1,
      backgroundColor: c.backgroundMuted,
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      gap: 8,
    },
    linkText: { fontSize: 13, fontWeight: '500', color: c.text, textAlign: 'center' },
  });
}
