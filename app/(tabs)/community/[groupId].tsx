// app/(tabs)/community/[groupId].tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
import { getGroup, deleteGroup, getGroupEvents, joinGroup, exitGroup } from '@/services/api';
import { getImageUri } from '@/utils/helpers';
import EventCard from '@/components/community/EventCard';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';

export default function GroupDetails() {
  const params = useLocalSearchParams();
  const { user, token, isInstructor } = useUser();
  const { colors } = useTheme();
  
  const [group, setGroup] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [joinLeaveLoading, setJoinLeaveLoading] = useState(false);
  const [optimisticMemberCount, setOptimisticMemberCount] = useState(0);

  const s = makeStyles(colors);

  useFocusEffect(
    useCallback(() => {
      fetchGroupData();
      fetchGroupEvents();
    }, [params.groupId])
  );

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getGroup(params.groupId as string, token);
      
      const groupData = result.data || result;
      setGroup(groupData);
      
      console.log('📊 Group data:', {
        id: groupData.id,
        title: groupData.group_title,
        memberCount: groupData._count?.member,
        memberArray: groupData.member?.length,
        userId: user?.id
      });
      
      // DEBUG: Log the actual member array structure
      if (groupData.member && groupData.member.length > 0) {
        console.log('🔍 MEMBER ARRAY STRUCTURE:', JSON.stringify(groupData.member, null, 2));
        console.log('🔍 First member:', groupData.member[0]);
        console.log('🔍 Looking for userId:', user?.id);
      }
      
      // FIX: Backend returns id inside student object (m.student.id)
      const isUserMember = groupData.member?.some((m: any) => {
        // Try m.userId first (in case backend structure changes)
        if (m.userId) {
          console.log(`  Checking m.userId: ${m.userId} === ${user?.id}?`, m.userId === user?.id);
          return m.userId === user?.id;
        }
        
        // Check m.student.id (current backend structure)
        if (m.student?.id) {
          console.log(`  Checking m.student.id: ${m.student.id} === ${user?.id}?`, m.student.id === user?.id);
          return m.student.id === user?.id;
        }
        
        console.log(`  No userId found in member object`);
        return false;
      }) || false;
      
      setIsMember(isUserMember);
      console.log('👤 Is user a member?', isUserMember);
      
      // FIX: Use 'member' (singular) from _count
      const initialMemberCount = groupData._count?.member || groupData.member?.length || 0;
      setOptimisticMemberCount(initialMemberCount);
      console.log('📈 Initial member count:', initialMemberCount);
      
    } catch (err) {
      console.error('❌ Error fetching group:', err);
      setError('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupEvents = async () => {
    try {
      setEventsLoading(true);
      const result = await getGroupEvents(params.groupId as string, token);
      const eventsData = result.data || result || [];
      
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      console.log('✅ Fetched group events:', eventsData.length);
      
    } catch (err) {
      console.error('❌ Error fetching group events:', err);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const isModerator = isInstructor && group?.userId === user?.id;

  const handleJoinLeave = async () => {
    try {
      setJoinLeaveLoading(true);
      
      console.log(`🔄 ${isMember ? 'Leaving' : 'Joining'} group...`);
      
      // OPTIMISTIC UPDATE: Update UI immediately
      const previousMemberState = isMember;
      const previousCount = optimisticMemberCount;
      
      if (isMember) {
        setOptimisticMemberCount(prev => Math.max(0, prev - 1));
        setIsMember(false);
      } else {
        setOptimisticMemberCount(prev => prev + 1);
        setIsMember(true);
      }
      
      // Call the API
      try {
        if (previousMemberState) {
          // Was a member, now leaving
          const result = await exitGroup(params.groupId as string, token);
          console.log('✅ Left group:', result.message);
          Alert.alert('Success', result.message || 'You have left the group');
        } else {
          // Was not a member, now joining
          const result = await joinGroup(params.groupId as string, token);
          console.log('✅ Joined group:', result.message);
          Alert.alert('Success', result.message || 'You have joined the group');
        }
        
        // Refresh group data to get the actual count from server
        await fetchGroupData();
        
      } catch (apiError: any) {
        // API call failed - revert optimistic update
        console.error('❌ API call failed:', apiError);
        setIsMember(previousMemberState);
        setOptimisticMemberCount(previousCount);
        
        // Show error message
        const errorMessage = apiError.message || 'Failed to update group membership';
        Alert.alert('Error', errorMessage);
      }
      
    } finally {
      setJoinLeaveLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/(tabs)/community/${params.groupId}/edit` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteGroup(params.groupId as string, token);
              Alert.alert('Success', result.message || 'Group deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'Failed to delete group. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={s.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={s.errorText}>{error || 'Group not found'}</Text>
          <TouchableOpacity style={s.retryButton} onPress={fetchGroupData}>
            <Text style={s.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const coverImageUri = group.group_image ? getImageUri(group.group_image) : null;
  
  // FIX: Use 'createdBy' instead of 'creator'
  const creatorName = group.createdBy 
    ? `${group.createdBy.first_name} ${group.createdBy.last_name}` 
    : 'Unknown';
  const creatorAvatar = group.createdBy?.user_pic ? getImageUri(group.createdBy.user_pic) : null;
  
  // FIX: Use singular 'member' from _count
  const memberCount = group._count?.member || group.member?.length || 0;
  const eventsCount = group._count?.event || events.length || 0;
  const postsCount = group._count?.post || 0;
  const createdYear = new Date(group.createdAt).getFullYear();

  return (
    <MenuProvider>
      <SafeAreaView style={s.container} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          {/* Menu for moderators */}
          {isModerator && (
            <Menu>
              <MenuTrigger>
                <View style={s.menuButton}>
                  <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
                </View>
              </MenuTrigger>
              <MenuOptions customStyles={menuOptionsStyles(colors)}>
                <MenuOption onSelect={handleEdit}>
                  <View style={s.menuItem}>
                    <Ionicons name="pencil-outline" size={20} color={colors.text} />
                    <Text style={s.menuText}>Edit</Text>
                  </View>
                </MenuOption>
                <MenuOption onSelect={handleDelete}>
                  <View style={s.menuItem}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text style={[s.menuText, { color: '#EF4444' }]}>Delete</Text>
                  </View>
                </MenuOption>
              </MenuOptions>
            </Menu>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Group Info */}
          <View style={s.groupInfo}>
            <Text style={s.groupName}>{group.group_title}</Text>
            <View style={s.groupMeta}>
              <View style={s.metaItem}>
                <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                <Text style={s.metaText}>{optimisticMemberCount} members</Text>
              </View>
              <View style={s.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={s.metaText}>Since {createdYear}</Text>
              </View>
            </View>

            <View style={s.leaderInfo}>
              {creatorAvatar ? (
                <Image source={{ uri: creatorAvatar }} style={s.leaderAvatar} />
              ) : (
                <View style={[s.leaderAvatar, s.avatarPlaceholder]}>
                  <Text style={s.avatarText}>{creatorName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <Text style={s.leaderName}>{creatorName}</Text>
            </View>
          </View>

          {/* Cover Image */}
          {coverImageUri && (
            <Image source={{ uri: coverImageUri }} style={s.coverImage} resizeMode="cover" />
          )}

          <View style={s.content}>
            {/* Description */}
            <Text style={s.description}>
              {group.group_description || group.group_short_description}
            </Text>

            {/* Conditional Button */}
            {isModerator ? (
              <TouchableOpacity 
                style={s.createEventButton}
                onPress={() => router.push(`/(tabs)/community/${params.groupId}/create-event` as any)}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={s.createEventButtonText}>Create Event</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[s.actionButton, isMember && s.exitButton]}
                onPress={handleJoinLeave}
                disabled={joinLeaveLoading}
              >
                {joinLeaveLoading ? (
                  <ActivityIndicator size="small" color={isMember ? colors.textSecondary : "#fff"} />
                ) : isMember ? (
                  <>
                    <Ionicons name="exit-outline" size={18} color={colors.textSecondary} />
                    <Text style={s.exitButtonText}>Exit Group</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={s.joinButtonText}>Join Group</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Stats */}
            <View style={s.statsContainer}>
              <View style={s.statItem}>
                <Text style={s.statNumber}>{postsCount}</Text>
                <Text style={s.statLabel}>Posts</Text>
              </View>
              <View style={s.statItem}>
                <Text style={s.statNumber}>{optimisticMemberCount}</Text>
                <Text style={s.statLabel}>Members</Text>
              </View>
              <View style={s.statItem}>
                <Text style={s.statNumber}>{eventsCount}</Text>
                <Text style={s.statLabel}>Events</Text>
              </View>
            </View>

            {/* Upcoming Events */}
            {eventsLoading ? (
              <ActivityIndicator size="small" color={colors.brand} style={{ marginVertical: 16 }} />
            ) : events.length > 0 ? (
              <>
                <Text style={s.sectionTitle}>Upcoming Events</Text>
                {events.map((event: any) => (
                  <EventCard 
                    key={event.id}
                    id={event.id}
                    title={event.event_name || event.title}
                    description={event.event_description || event.description}
                    date={event.event_date || event.date}
                    time={event.event_time || event.time}
                    type={event.event_type || event.type}
                    eventLink={event.event_link || event.link}
                    hasNotification={event.hasNotification}
                    isLocked={event.isLocked}
                  />
                ))}
              </>
            ) : (
              <View style={s.noEvents}>
                <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
                <Text style={s.noEventsText}>No upcoming events</Text>
                {isModerator && (
                  <TouchableOpacity 
                    style={s.createFirstEventButton}
                    onPress={() => router.push(`/(tabs)/community/${params.groupId}/create-event` as any)}
                  >
                    <Text style={s.createFirstEventText}>Create First Event</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </MenuProvider>
  );
}

// Menu styles with theme support
const menuOptionsStyles = (c: typeof lightColors) => ({
  optionsContainer: {
    backgroundColor: c.card,
    padding: 8,
    borderRadius: 8,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: c.background 
    },
    centerContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      gap: 16, 
      paddingHorizontal: 40 
    },
    loadingText: { 
      fontSize: 16, 
      color: c.textSecondary 
    },
    errorText: { 
      fontSize: 16, 
      color: c.textSecondary, 
      textAlign: 'center' 
    },
    retryButton: { 
      backgroundColor: c.brand, 
      paddingVertical: 12, 
      paddingHorizontal: 32, 
      borderRadius: 8, 
      marginTop: 8 
    },
    retryButtonText: { 
      color: 'white', 
      fontSize: 16, 
      fontWeight: '600' 
    },
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingVertical: 8 
    },
    backButton: { 
      padding: 4 
    },
    menuButton: { 
      padding: 4 
    },
    menuItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 12, 
      paddingVertical: 12, 
      paddingHorizontal: 16 
    },
    menuText: { 
      fontSize: 16, 
      color: c.text 
    },
    groupInfo: { 
      paddingHorizontal: 20, 
      marginBottom: 16 
    },
    groupName: { 
      fontSize: 24, 
      fontWeight: '700', 
      color: c.text, 
      marginBottom: 12 
    },
    groupMeta: { 
      flexDirection: 'row', 
      gap: 16, 
      marginBottom: 12 
    },
    metaItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 6 
    },
    metaText: { 
      fontSize: 13, 
      color: c.textSecondary 
    },
    leaderInfo: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8 
    },
    leaderAvatar: { 
      width: 32, 
      height: 32, 
      borderRadius: 16, 
      backgroundColor: c.backgroundMuted 
    },
    avatarPlaceholder: { 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: c.borderMid 
    },
    avatarText: { 
      fontSize: 14, 
      fontWeight: '600', 
      color: c.textSecondary 
    },
    leaderName: { 
      fontSize: 14, 
      color: c.textSecondary 
    },
    coverImage: { 
      width: '100%', 
      height: 200, 
      backgroundColor: c.backgroundMuted 
    },
    content: { 
      padding: 20 
    },
    description: { 
      fontSize: 14, 
      color: c.textSecondary, 
      lineHeight: 22, 
      marginBottom: 20 
    },
    actionButton: { 
      flexDirection: 'row', 
      backgroundColor: c.brand, 
      paddingVertical: 14, 
      borderRadius: 8, 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 8, 
      marginBottom: 24 
    },
    exitButton: { 
      backgroundColor: 'transparent', 
      borderWidth: 1, 
      borderColor: c.borderMid 
    },
    joinButtonText: { 
      color: '#fff', 
      fontSize: 16, 
      fontWeight: '600' 
    },
    exitButtonText: { 
      color: c.textSecondary, 
      fontSize: 16, 
      fontWeight: '600' 
    },
    createEventButton: { 
      flexDirection: 'row', 
      backgroundColor: c.brand, 
      paddingVertical: 14, 
      borderRadius: 8, 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 8, 
      marginBottom: 24 
    },
    createEventButtonText: { 
      color: '#fff', 
      fontSize: 16, 
      fontWeight: '600' 
    },
    statsContainer: { 
      flexDirection: 'row', 
      backgroundColor: c.cardContent, 
      borderRadius: 8, 
      padding: 20, 
      marginBottom: 24,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    statItem: { 
      flex: 1, 
      alignItems: 'center' 
    },
    statNumber: { 
      fontSize: 24, 
      fontWeight: '700', 
      color: c.text, 
      marginBottom: 4 
    },
    statLabel: { 
      fontSize: 12, 
      color: c.textSecondary, 
      textAlign: 'center' 
    },
    sectionTitle: { 
      fontSize: 20, 
      fontWeight: '700', 
      color: c.text, 
      marginBottom: 16 
    },
    noEvents: { 
      alignItems: 'center', 
      paddingVertical: 40, 
      gap: 12 
    },
    noEventsText: { 
      fontSize: 16, 
      color: c.textMuted, 
      textAlign: 'center' 
    },
    createFirstEventButton: { 
      backgroundColor: c.brand, 
      paddingVertical: 12, 
      paddingHorizontal: 24, 
      borderRadius: 8, 
      marginTop: 8 
    },
    createFirstEventText: { 
      color: 'white', 
      fontSize: 14, 
      fontWeight: '600' 
    },
  });
}