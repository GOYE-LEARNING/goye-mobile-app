// app/(tabs)/home/leaderboard.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getLeaderboard } from '@/services/api';
import { getImageUri } from '@/utils/helpers';

const { width } = Dimensions.get('window');

const RANK_COLORS: Record<number, string> = {
  1: '#F59E0B',
  2: '#9CA3AF',
  3: '#B45309',
};

const RANK_LABELS: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
};

export default function Leaderboard() {
  const { token, user } = useUser();
  const { colors } = useTheme();

  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserEntry, setCurrentUserEntry] = useState<any>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      console.log('[Leaderboard] Fetching global leaderboard...');
      const result = await getLeaderboard(token!, 'global', undefined, 50);
      console.log('[Leaderboard] API Response:', JSON.stringify(result, null, 2));
      
      // Handle the actual response structure
      let list: any[] = [];
      
      if (result?.data?.leaderboard && Array.isArray(result.data.leaderboard)) {
        list = result.data.leaderboard;
        console.log('[Leaderboard] Extracted from data.leaderboard');
      } else if (result?.data && Array.isArray(result.data)) {
        list = result.data;
        console.log('[Leaderboard] Extracted from data array');
      } else if (Array.isArray(result)) {
        list = result;
        console.log('[Leaderboard] Result is array');
      } else if (result?.leaderboard && Array.isArray(result.leaderboard)) {
        list = result.leaderboard;
        console.log('[Leaderboard] Extracted from leaderboard');
      }
      
      console.log('[Leaderboard] Extracted list:', JSON.stringify(list, null, 2));
      setEntries(list);

      // Find current user in the list
      const me = list.find(
        (e: any) =>
          e.id === user?.id ||
          e.userId === user?.id ||
          e._id === user?.id
      );
      setCurrentUserEntry(me ?? null);
      
      console.log('[Leaderboard] Loaded entries:', list.length);
      console.log('[Leaderboard] Current user entry:', me);
    } catch (err) {
      console.error('[Leaderboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = entries.filter((entry: any) => {
    const name = entry.name ?? entry.user?.name ?? '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  // UPDATED: Field mappings to match API response
  const getEntryName = (entry: any) =>
    entry.name ?? entry.user?.name ?? entry.fullName ?? 'Unknown';

  const getEntryAvatar = (entry: any) => {
    const avatar = entry.avatar ?? entry.user?.user_pic ?? entry.user?.avatar;
    return avatar ? getImageUri(avatar) : null;
  };

  const getEntryCountry = (entry: any) =>
    entry.country ?? entry.user?.country ?? entry.user?.location ?? '';

  const getEntryGroups = (entry: any) =>
    entry.groupjoined ?? entry.groupsJoined ?? entry.groups_joined ?? 0;

  const getEntryCourses = (entry: any) =>
    entry.courses_completed ?? entry.coursesCompleted ?? entry.courseCount ?? 0;

  const getEntryPoints = (entry: any) =>
    entry.total_xp ?? entry.totalPoints ?? entry.total_points ?? entry.xp ?? entry.points ?? 0;

  const getRankIndex = (entry: any, index: number) =>
    entry.rank ?? entry.position ?? index + 1;

  const s = makeStyles(colors);

  const renderTopThree = () => {
    const top3 = filtered.slice(0, 3);
    if (top3.length === 0) return null;

    // Reorder: 2nd, 1st, 3rd for the podium effect
    const podiumOrder =
      top3.length === 3
        ? [top3[1], top3[0], top3[2]]
        : top3.length === 2
        ? [top3[1], top3[0]]
        : [top3[0]];

    const podiumRanks =
      top3.length === 3 ? [2, 1, 3] : top3.length === 2 ? [2, 1] : [1];

    return (
      <View style={s.podiumContainer}>
        {podiumOrder.map((entry, idx) => {
          const rank = podiumRanks[idx];
          const isFirst = rank === 1;
          const avatar = getEntryAvatar(entry);
          const name = getEntryName(entry);
          const points = getEntryPoints(entry);

          return (
            <View
              key={idx}
              style={[s.podiumItem, isFirst && s.podiumItemFirst]}
            >
              <View style={s.podiumAvatarWrapper}>
                {isFirst && (
                  <View style={s.crownWrapper}>
                    <Text style={s.crownIcon}>👑</Text>
                  </View>
                )}
                <View
                  style={[
                    s.podiumRankBadge,
                    { backgroundColor: RANK_COLORS[rank] ?? '#ccc' },
                  ]}
                >
                  <Text style={s.podiumRankText}>{RANK_LABELS[rank]}</Text>
                </View>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={[s.podiumAvatar, isFirst && s.podiumAvatarFirst]} />
                ) : (
                  <View style={[s.podiumAvatar, s.podiumAvatarFallback, isFirst && s.podiumAvatarFirst]}>
                    <Text style={[s.podiumAvatarInitial, isFirst && { fontSize: 22 }]}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[s.podiumName, isFirst && s.podiumNameFirst]} numberOfLines={1}>
                {name.split(' ')[0]}
              </Text>
              <View style={s.podiumPoints}>
                <Ionicons name="trophy" size={12} color="#F59E0B" />
                <Text style={s.podiumPointsText}>{points} XP</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.headerText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Leaderboard</Text>
          <Ionicons name="bar-chart" size={20} color={colors.headerText} style={{ marginLeft: 6 }} />
        </View>
        {/* Current user XP badge */}
        {currentUserEntry && (
          <View style={s.myXpBadge}>
            <View style={s.myXpAvatar}>
              <Text style={s.myXpAvatarText}>
                {user?.first_name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <Text style={s.myXpName}>{user?.first_name}</Text>
            <Ionicons name="trophy" size={14} color="#F59E0B" style={{ marginLeft: 4 }} />
            <Text style={s.myXpPoints}>{getEntryPoints(currentUserEntry)} XP</Text>
          </View>
        )}
      </View>

      <View style={s.body}>
        {/* Search */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Search users..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {loading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={s.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyContainer}>
            <Ionicons name="trophy-outline" size={56} color={colors.borderMid} />
            <Text style={s.emptyText}>No entries found</Text>
            <Text style={s.emptySubText}>Complete courses and earn XP to appear here!</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Podium for top 3 */}
            {search === '' && renderTopThree()}

            {/* Table Header */}
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderCell, { width: 30 }]}>#</Text>
              <Text style={[s.tableHeaderCell, { flex: 1 }]}>Name</Text>
              <Text style={[s.tableHeaderCell, { width: 80 }]}>Country</Text>
              <Text style={[s.tableHeaderCell, { width: 70 }]}>Groups</Text>
              <Text style={[s.tableHeaderCell, { width: 70 }]}>Courses</Text>
              <Text style={[s.tableHeaderCell, { width: 70, textAlign: 'right' }]}>XP</Text>
            </View>

            {/* Rows — skip top 3 if not searching (they're in the podium) */}
            {(search !== '' ? filtered : filtered.slice(3)).map((entry, index) => {
              const rank = getRankIndex(entry, search !== '' ? index : index + 3);
              const avatar = getEntryAvatar(entry);
              const name = getEntryName(entry);
              const country = getEntryCountry(entry);
              const groups = getEntryGroups(entry);
              const courses = getEntryCourses(entry);
              const points = getEntryPoints(entry);
              const isMe =
                entry.id === user?.id ||
                entry.userId === user?.id ||
                entry._id === user?.id;

              return (
                <View key={index} style={[s.tableRow, isMe && s.tableRowMe]}>
                  <Text style={[s.rankCell, { width: 30 }]}>{rank}</Text>

                  {/* Avatar + Name */}
                  <View style={[s.nameCell, { flex: 1 }]}>
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={s.rowAvatar} />
                    ) : (
                      <View style={[s.rowAvatar, s.rowAvatarFallback]}>
                        <Text style={s.rowAvatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={s.rowName} numberOfLines={1}>
                      {name}
                    </Text>
                    {isMe && <View style={s.meBadge}><Text style={s.meBadgeText}>You</Text></View>}
                  </View>

                  <Text style={[s.rowCell, { width: 80 }]} numberOfLines={1}>{country || '—'}</Text>

                  {/* Groups */}
                  <View style={[s.rowIconCell, { width: 70 }]}>
                    <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                    <Text style={s.rowCellSmall}>{groups}</Text>
                  </View>

                  {/* Courses */}
                  <View style={[s.rowIconCell, { width: 70 }]}>
                    <Ionicons name="book-outline" size={13} color={colors.textMuted} />
                    <Text style={s.rowCellSmall}>{courses}</Text>
                  </View>

                  {/* Points */}
                  <View style={[s.rowIconCell, { width: 70, justifyContent: 'flex-end' }]}>
                    <Ionicons name="trophy" size={13} color="#F59E0B" />
                    <Text style={s.rowPoints}>{points} XP</Text>
                  </View>
                </View>
              );
            })}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.headerBg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 20,
    },
    backBtn: {
      padding: 4,
      marginRight: 8,
    },
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: c.headerText,
    },
    myXpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 4,
    },
    myXpAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    myXpAvatarText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#fff',
    },
    myXpName: {
      fontSize: 13,
      fontWeight: '600',
      color: c.headerText,
    },
    myXpPoints: {
      fontSize: 13,
      fontWeight: '700',
      color: '#F59E0B',
    },

    body: {
      flex: 1,
      backgroundColor: c.modalBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
    },

    searchRow: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: c.borderMid,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: c.text,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: c.textMuted,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      gap: 10,
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textMuted,
    },
    emptySubText: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
    },

    // Podium
    podiumContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingBottom: 24,
      gap: 12,
    },
    podiumItem: {
      alignItems: 'center',
      flex: 1,
    },
    podiumItemFirst: {
      marginBottom: 12,
    },
    podiumAvatarWrapper: {
      position: 'relative',
      marginBottom: 8,
    },
    crownWrapper: {
      position: 'absolute',
      top: -22,
      alignSelf: 'center',
      zIndex: 10,
    },
    crownIcon: {
      fontSize: 20,
    },
    podiumRankBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      zIndex: 5,
    },
    podiumRankText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#fff',
    },
    podiumAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: '#fff',
    },
    podiumAvatarFirst: {
      width: 72,
      height: 72,
      borderRadius: 36,
    },
    podiumAvatarFallback: {
      backgroundColor: c.brandLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    podiumAvatarInitial: {
      fontSize: 18,
      fontWeight: '700',
      color: c.brand,
    },
    podiumName: {
      fontSize: 12,
      fontWeight: '600',
      color: c.text,
      textAlign: 'center',
      maxWidth: 80,
    },
    podiumNameFirst: {
      fontSize: 14,
      fontWeight: '700',
    },
    podiumPoints: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 2,
    },
    podiumPointsText: {
      fontSize: 11,
      color: '#F59E0B',
      fontWeight: '600',
    },

    // Table
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.borderMid,
    },
    tableHeaderCell: {
      fontSize: 12,
      color: c.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.borderMid,
    },
    tableRowMe: {
      backgroundColor: c.brandLighter ?? '#FFF5F5',
    },
    rankCell: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textSecondary,
    },
    nameCell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      overflow: 'hidden',
    },
    rowAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    rowAvatarFallback: {
      backgroundColor: c.brandLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowAvatarInitial: {
      fontSize: 14,
      fontWeight: '700',
      color: c.brand,
    },
    rowName: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
      flexShrink: 1,
    },
    meBadge: {
      backgroundColor: c.brand,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    meBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#fff',
    },
    rowCell: {
      fontSize: 12,
      color: c.textSecondary,
    },
    rowIconCell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    rowCellSmall: {
      fontSize: 12,
      color: c.textSecondary,
    },
    rowPoints: {
      fontSize: 12,
      fontWeight: '700',
      color: '#F59E0B',
    },
  });
}