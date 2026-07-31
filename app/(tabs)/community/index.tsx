// app/(tabs)/community/index.tsx
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal,
  KeyboardAvoidingView, Platform, FlatList, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useRef } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import {
  getGroups, inviteUsersToOrganization,
  getPublicDiscussions, createPublicDiscussion,
  uploadDiscussionImage, uploadDiscussionVideo,
  likeDiscussion, deleteDiscussion, getDiscussion, getPrivateUnreadCount,
  DiscussionCategory
} from '@/services/api';
import GroupCard from '@/components/community/GroupCard';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@/contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { getImageUri } from '@/utils/helpers';
import Toast from 'react-native-toast-message';
import { CustomAlert } from '@/components/CustomAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PendingInvite { email: string; role: string; }
interface MediaItem { uri: string; type: 'image' | 'video'; filename: string; mimeType: string; base64?: string; uploaded?: boolean; remoteUrl?: string; }

type CategoryTab = 'ALL' | DiscussionCategory;

const CATEGORY_TABS: { id: CategoryTab; label: string; icon: string }[] = [
  { id: 'ALL', label: 'All', icon: 'albums-outline' },
  { id: DiscussionCategory.PRAYER, label: 'Prayer', icon: 'heart-outline' },
  { id: DiscussionCategory.DISCUSSION, label: 'Discussion', icon: 'chatbubbles-outline' },
  { id: DiscussionCategory.DEVOTION, label: 'Devotion', icon: 'book-outline' },
  { id: DiscussionCategory.BLESSING, label: 'Blessing', icon: 'gift-outline' },
  { id: DiscussionCategory.TESTIMONY, label: 'Testimony', icon: 'megaphone-outline' },
  { id: DiscussionCategory.QUESTION, label: 'Question', icon: 'help-circle-outline' },
];

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Community() {
  const { isOrganizationAdmin } = useUser();
  if (isOrganizationAdmin) return <InviteMembersScreen />;
  return <RegularCommunityScreen />;
}

// ─── Org: Invite Members ──────────────────────────────────────────────────────

function InviteMembersScreen() {
  const { user, token } = useUser();
  const { colors } = useTheme();
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState('Member');
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [sending, setSending] = useState(false);
  
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    onPrimary: () => void;
    onSecondary?: () => void;
    secondaryLabel?: string;
  } | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleAddToList = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!emailRegex.test(trimmed)) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        onPrimary: () => setAlert(null)
      });
      return;
    }
    if (pendingInvites.find((i) => i.email === trimmed)) {
      setAlert({
        visible: true,
        type: 'info',
        title: 'Duplicate',
        message: 'This email is already in the invite list.',
        onPrimary: () => setAlert(null)
      });
      return;
    }
    setPendingInvites((prev) => [...prev, { email: trimmed, role: roleInput }]);
    setEmailInput('');
  };

  const handleRemove = (email: string) => setPendingInvites((prev) => prev.filter((i) => i.email !== email));

  const handleSendInvites = async () => {
    if (pendingInvites.length === 0) {
      setAlert({
        visible: true,
        type: 'info',
        title: 'No Invites',
        message: 'Add at least one email address to invite.',
        onPrimary: () => setAlert(null)
      });
      return;
    }
    const orgId = user?.organizationId || user?.id;
    const sentByUserId = user?.id;
    if (!orgId || !sentByUserId) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Unable to determine organization. Please log in again.',
        onPrimary: () => setAlert(null)
      });
      return;
    }
    try {
      setSending(true);
      await inviteUsersToOrganization(token, orgId, sentByUserId, pendingInvites);
      setAlert({
        visible: true,
        type: 'success',
        title: 'Invites Sent! 🎉',
        message: `${pendingInvites.length} invite${pendingInvites.length > 1 ? 's' : ''} sent successfully.`,
        onPrimary: () => {
          setAlert(null);
          setPendingInvites([]);
        }
      });
    } catch (err: any) {
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to send invites. Please try again.',
        onPrimary: () => setAlert(null)
      });
    } finally {
      setSending(false);
    }
  };

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>Members</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.inviteScroll}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Invite members</Text>
          <Text style={s.cardSubtitle}>Add new members by entering their email addresses.</Text>
          <View style={s.inputRow}>
            <TextInput
              style={s.emailInput}
              placeholder="Email Address"
              placeholderTextColor={colors.textMuted}
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleAddToList}
              returnKeyType="done"
            />
            <View style={s.rolePickerWrapper}>
              <Picker selectedValue={roleInput} onValueChange={setRoleInput} style={s.rolePicker} dropdownIconColor={colors.brand}>
                <Picker.Item label="Member" value="Member" />
                <Picker.Item label="Admin" value="Admin" />
              </Picker>
            </View>
          </View>
          <TouchableOpacity style={s.inviteButton} onPress={handleAddToList}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.inviteButtonText}>Add to List</Text>
          </TouchableOpacity>
        </View>

        {pendingInvites.length > 0 && (
          <View style={s.card}>
            <View style={s.pendingHeader}>
              <Text style={s.cardTitle}>Pending Invites</Text>
              <View style={s.badge}><Text style={s.badgeText}>{pendingInvites.length}</Text></View>
            </View>
            {pendingInvites.map((invite) => (
              <View key={invite.email} style={s.inviteRow}>
                <View style={s.inviteAvatar}>
                  <Text style={s.inviteAvatarText}>{invite.email.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={s.inviteInfo}>
                  <Text style={s.inviteEmail} numberOfLines={1}>{invite.email}</Text>
                </View>
                <View style={s.roleBadge}><Text style={s.roleBadgeText}>{invite.role}</Text></View>
                <TouchableOpacity onPress={() => handleRemove(invite.email)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={[s.sendButton, sending && s.sendButtonDisabled]} onPress={handleSendInvites} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                  <Text style={s.sendButtonText}>Invite {pendingInvites.length} {pendingInvites.length === 1 ? 'Person' : 'People'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {pendingInvites.length === 0 && (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}><Ionicons name="people-outline" size={40} color="#C4A882" /></View>
            <Text style={s.emptyTitle}>No invites queued</Text>
            <Text style={s.emptySubtitle}>Enter an email above and tap "Add to List" to queue bulk invites before sending.</Text>
          </View>
        )}
      </ScrollView>
      
      {alert && (
        <CustomAlert
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          primaryLabel="OK"
          onPrimary={alert.onPrimary}
          secondaryLabel={alert.secondaryLabel}
          onSecondary={alert.onSecondary}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Regular Community Screen ─────────────────────────────────────────────────

type CommunityTab = 'feed' | 'groups';

function RegularCommunityScreen() {
  const { user, token, isInstructor } = useUser();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [unreadCount, setUnreadCount] = useState(0);
  const s = makeStyles(colors);

  useFocusEffect(useCallback(() => {
    const fetchUnread = async () => {
      try {
        const result = await getPrivateUnreadCount(token);
        setUnreadCount(result?.data?.count || result?.count || 0);
      } catch (err) {
        console.error('fetchUnread:', err);
      }
    };
    fetchUnread();
  }, []));

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>Community</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            style={s.iconButton}
            onPress={() => router.push('/(tabs)/community/messages' as any)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
            {unreadCount > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          {isInstructor && activeTab === 'groups' && (
            <TouchableOpacity
              style={s.newGroupButton}
              onPress={() => router.push('/(tabs)/community/create-group' as any)}
            >
              <Ionicons name="add" size={20} color={colors.brand} />
              <Text style={s.newGroupText}>New</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={s.tabSwitcher}>
        <TouchableOpacity
          style={[s.tabSwitchBtn, activeTab === 'feed' && s.tabSwitchBtnActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Ionicons name="newspaper-outline" size={16} color={activeTab === 'feed' ? colors.brand : colors.textMuted} />
          <Text style={[s.tabSwitchText, activeTab === 'feed' && s.tabSwitchTextActive]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabSwitchBtn, activeTab === 'groups' && s.tabSwitchBtnActive]}
          onPress={() => setActiveTab('groups')}
        >
          <Ionicons name="people-outline" size={16} color={activeTab === 'groups' ? colors.brand : colors.textMuted} />
          <Text style={[s.tabSwitchText, activeTab === 'groups' && s.tabSwitchTextActive]}>Groups</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'feed' ? (
        <DiscussionFeed />
      ) : (
        <GroupsFeed />
      )}
    </SafeAreaView>
  );
}

// ─── Discussion Feed ──────────────────────────────────────────────────────────

function DiscussionFeed() {
  const { user, token } = useUser();
  const { colors } = useTheme();
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('ALL');
  const [composerVisible, setComposerVisible] = useState(false);
  
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    onPrimary: () => void;
    onSecondary?: () => void;
    secondaryLabel?: string;
  } | null>(null);

  const s = makeStyles(colors);

  useFocusEffect(useCallback(() => { 
    fetchDiscussions(); 
  }, [sort, selectedCategory]));

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      // Convert 'ALL' to undefined for the API call
      const categoryParam = selectedCategory === 'ALL' ? undefined : selectedCategory;
      console.log(`📡 Fetching discussions - Category: ${selectedCategory}, Sort: ${sort}`);
      
      const result = await getPublicDiscussions(token, sort, categoryParam);
      
      let discussionsArray = [];
      if (result?.data?.discussions) {
        discussionsArray = result.data.discussions;
      } else if (Array.isArray(result?.data)) {
        discussionsArray = result.data;
      } else if (Array.isArray(result)) {
        discussionsArray = result;
      }
      
      console.log(`📊 Received ${discussionsArray.length} discussions for category ${selectedCategory}`);
      
      // Optional: Double-check filter on client side (in case API doesn't filter properly)
      let filteredDiscussions = discussionsArray;
      if (selectedCategory !== 'ALL') {
        filteredDiscussions = discussionsArray.filter(
          (d: any) => d.category === selectedCategory
        );
        console.log(`🔍 Client-side filter: ${filteredDiscussions.length} discussions match category ${selectedCategory}`);
      }
      
      const initialDiscussions = filteredDiscussions.map((discussion: any) => ({
        ...discussion,
        _liked: discussion.liked || false,
        _count: {
          ...discussion._count,
          likes: discussion._count?.likes || discussion.likes?.length || 0
        }
      }));
      
      setDiscussions(initialDiscussions);
      setLoading(false);
      
      const hasLikedField = filteredDiscussions.some((d: any) => d.liked !== undefined);
      if (!hasLikedField && filteredDiscussions.length > 0) {
        await fetchLikeStatusesInBatches(initialDiscussions);
      }
      
    } catch (err) {
      console.error('fetchDiscussions error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load discussions',
      });
      setLoading(false);
    }
  };

  const fetchLikeStatusesInBatches = async (discussionsList: any[]) => {
    const BATCH_SIZE = 5;
    const batches = [];
    
    for (let i = 0; i < discussionsList.length; i += BATCH_SIZE) {
      batches.push(discussionsList.slice(i, i + BATCH_SIZE));
    }
    
    for (const batch of batches) {
      const promises = batch.map(async (discussion) => {
        try {
          const result = await getDiscussion(token, discussion.id);
          let liked = false;
          
          if (result?.data?.liked !== undefined) {
            liked = result.data.liked;
          } else if (result?.liked !== undefined) {
            liked = result.liked;
          }
          
          return { id: discussion.id, liked };
        } catch (error) {
          console.error(`Error fetching like status for ${discussion.id}:`, error);
          return { id: discussion.id, liked: false };
        }
      });
      
      const results = await Promise.all(promises);
      
      setDiscussions(prev => prev.map(discussion => {
        const status = results.find(r => r.id === discussion.id);
        return status ? { ...discussion, _liked: status.liked } : discussion;
      }));
      
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  const onRefresh = async () => { 
    setRefreshing(true); 
    await fetchDiscussions(); 
    setRefreshing(false); 
  };

  const handleLike = async (id: string) => {
    try {
      const result = await likeDiscussion(token, id);
      const newLikedState = result?.data?.liked ?? false;
      const newLikeCount = result?.data?.likeCount ?? 0;
      
      setDiscussions(prev => prev.map(d => 
        d.id === id ? { 
          ...d,
          _liked: newLikedState,
          _count: { 
            ...d._count,
            likes: newLikeCount
          } 
        } : d
      ));
      
    } catch (err) {
      console.error('Like error:', err);
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to update like',
        onPrimary: () => setAlert(null)
      });
    }
  };

  const handleDelete = (id: string) => {
    setAlert({
      visible: true,
      type: 'warning',
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      primaryLabel: 'Delete',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        setAlert(null);
        try {
          await deleteDiscussion(token, id);
          setDiscussions(prev => prev.filter(d => d.id !== id));
          Toast.show({
            type: 'success',
            text1: 'Deleted',
            text2: 'Post deleted successfully',
          });
        } catch (err: any) { 
          setAlert({
            visible: true,
            type: 'error',
            title: 'Error',
            message: err.message || 'Failed to delete',
            onPrimary: () => setAlert(null)
          });
        }
      },
      onSecondary: () => {
        setAlert(null);
      }
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.categoryTabsContainer}
        style={{ maxHeight: 50 }}
      >
        {CATEGORY_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              s.categoryTab,
              selectedCategory === tab.id && s.categoryTabActive
            ]}
            onPress={() => {
              console.log(`🔄 Switching to category: ${tab.label}`);
              setSelectedCategory(tab.id);
            }}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={16} 
              color={selectedCategory === tab.id ? colors.brand : colors.textMuted} 
            />
            <Text style={[
              s.categoryTabText,
              selectedCategory === tab.id && s.categoryTabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Options */}
      <View style={s.sortRow}>
        {(['latest', 'popular'] as const).map(opt => (
          <TouchableOpacity
            key={opt}
            style={[s.sortPill, sort === opt && s.sortPillActive]}
            onPress={() => setSort(opt)}
          >
            <Text style={[s.sortPillText, sort === opt && s.sortPillTextActive]}>
              {opt === 'latest' ? '🕐 Latest' : '🔥 Popular'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading discussions...</Text>
        </View>
      ) : (
        <FlatList
          data={discussions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brand]} />}
          ListEmptyComponent={
            <View style={s.centerContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.borderMid} />
              <Text style={s.emptyText}>
                {selectedCategory === 'ALL' 
                  ? 'No posts yet. Be the first!' 
                  : `No ${selectedCategory.toLowerCase()} posts yet. Be the first to post!`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <DiscussionCard
              discussion={item}
              currentUserId={user?.id}
              onLike={() => handleLike(item.id)}
              onDelete={() => handleDelete(item.id)}
              onPress={() => router.push(`/(tabs)/community/discussion/${item.id}` as any)}
              colors={colors}
            />
          )}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => setComposerVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <PostComposerModal
        visible={composerVisible}
        onClose={() => setComposerVisible(false)}
        onPosted={() => { 
          setComposerVisible(false); 
          fetchDiscussions();
          Toast.show({
            type: 'success',
            text1: 'Posted!',
            text2: 'Your post has been published',
          });
        }}
        token={token}
        user={user}
        colors={colors}
      />
      
      {alert && (
        <CustomAlert
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          primaryLabel={alert.primaryLabel || 'OK'}
          secondaryLabel={alert.secondaryLabel}
          onPrimary={alert.onPrimary}
          onSecondary={alert.onSecondary}
        />
      )}
    </View>
  );
}

// ─── Discussion Card ──────────────────────────────────────────────────────────

function DiscussionCard({ discussion, currentUserId, onLike, onDelete, onPress, colors }: any) {
  const s = makeStyles(colors);
  const isOwner = discussion.userId === currentUserId || discussion.user?.id === currentUserId || discussion.authorId === currentUserId;
  
  const author = discussion.user || discussion.author;
  const authorName = author
    ? `${author.first_name || ''} ${author.last_name || ''}`.trim()
    : 'Community Member';
  const avatarUri = author?.user_pic || author?.avatar ? getImageUri(author.user_pic || author.avatar) : null;
  const likeCount = discussion._count?.likes ?? discussion.likesCount ?? 0;
  const replyCount = discussion._count?.replies ?? discussion.repliesCount ?? 0;
  const images = (discussion.mediaUrls || []).filter((m: any) => m.type === 'image');
  const videos = (discussion.mediaUrls || []).filter((m: any) => m.type === 'video');

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      PRAYER: 'heart-outline',
      DISCUSSION: 'chatbubbles-outline',
      DEVOTION: 'book-outline',
      BLESSING: 'gift-outline',
      TESTIMONY: 'megaphone-outline',
      QUESTION: 'help-circle-outline',
    };
    return icons[category] || 'albums-outline';
  };

  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      PRAYER: '#E53E3E',
      DISCUSSION: '#3182CE',
      DEVOTION: '#38A169',
      BLESSING: '#D69E2E',
      TESTIMONY: '#805AD5',
      QUESTION: '#DD6B20',
    };
    return colorMap[category] || colors.brand;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <TouchableOpacity style={s.discussionCard} onPress={onPress} activeOpacity={0.9}>
      <View style={s.cardAuthorRow}>
        <View style={s.cardAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.cardAvatarImg} />
          ) : (
            <Text style={s.cardAvatarInitial}>{authorName.charAt(0).toUpperCase() || '?'}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardAuthorName}>{authorName}</Text>
          <Text style={s.cardDate}>{formatDate(discussion.createdAt)}</Text>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Badge */}
      {discussion.category && (
        <View style={[s.categoryBadge, { backgroundColor: `${getCategoryColor(discussion.category)}15` }]}>
          <Ionicons name={getCategoryIcon(discussion.category)} size={12} color={getCategoryColor(discussion.category)} />
          <Text style={[s.categoryBadgeText, { color: getCategoryColor(discussion.category) }]}>
            {discussion.category.charAt(0) + discussion.category.slice(1).toLowerCase()}
          </Text>
        </View>
      )}

      {discussion.content ? (
        <Text style={s.cardContent} numberOfLines={4}>{discussion.content}</Text>
      ) : null}

      {images.length > 0 && (
        <View style={s.mediaGrid}>
          {images.slice(0, 4).map((img: any, idx: number) => (
            <View key={idx} style={[s.mediaThumb, images.length === 1 && s.mediaThumbFull]}>
              <Image source={{ uri: img.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              {idx === 3 && images.length > 4 && (
                <View style={s.mediaMore}>
                  <Text style={s.mediaMoreText}>+{images.length - 4}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {videos.length > 0 && (
        <TouchableOpacity 
          onPress={() => {
            router.push({
              pathname: '/(tabs)/community/video-player',
              params: { url: videos[0].url, title: 'Video' }
            });
          }}
        >
          <View style={s.videoThumbContainer}>
            <Video
              source={{ uri: videos[0].url }}
              style={s.videoThumb}
              resizeMode={ResizeMode.COVER}
              useNativeControls={false}
              shouldPlay={false}
              paused={true}
            />
            <View style={s.videoPlayOverlay}>
              <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
        </TouchableOpacity>
      )}

      <View style={s.cardActions}>
        <TouchableOpacity style={s.cardAction} onPress={onLike}>
          <Ionicons name={discussion._liked ? 'heart' : 'heart-outline'} size={20} color={discussion._liked ? '#E53E3E' : colors.textMuted} />
          <Text style={[s.cardActionText, discussion._liked && { color: '#E53E3E' }]}>
            {likeCount > 0 ? (likeCount >= 1000 ? `${(likeCount / 1000).toFixed(0)}k` : likeCount) : 'Like'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cardAction} onPress={onPress}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
          <Text style={s.cardActionText}>{replyCount > 0 ? replyCount : 'Reply'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cardAction}>
          <Ionicons name="share-social-outline" size={20} color={colors.textMuted} />
          <Text style={s.cardActionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Post Composer Modal ──────────────────────────────────────────────────────

function PostComposerModal({ visible, onClose, onPosted, token, user, colors }: any) {
  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [posting, setPosting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DiscussionCategory>(DiscussionCategory.DISCUSSION);
  
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    onPrimary: () => void;
  } | null>(null);
  
  const s = makeStyles(colors);

  const reset = () => { 
    setContent(''); 
    setMediaItems([]); 
    setSelectedCategory(DiscussionCategory.DISCUSSION);
  };

  const handleClose = () => { reset(); onClose(); };

  const pickMedia = async (type: 'image' | 'video') => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { 
      setAlert({
        visible: true,
        type: 'error',
        title: 'Permission needed',
        message: 'Please allow access to your media library.',
        onPrimary: () => setAlert(null)
      });
      return; 
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image'
        ? ImagePicker.MediaTypeOptions.Images
        : ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: type === 'image',
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;

    const newItems: MediaItem[] = result.assets.map(asset => ({
      uri: asset.uri,
      type,
      filename: asset.fileName || `${type}_${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`,
      mimeType: asset.mimeType || (type === 'image' ? 'image/jpeg' : 'video/mp4'),
      base64: asset.base64,
    }));

    setMediaItems(prev => [...prev, ...newItems]);
  };

  const removeMedia = (idx: number) => setMediaItems(prev => prev.filter((_, i) => i !== idx));

  const handlePost = async () => {
    if (!content.trim() && mediaItems.length === 0) {
      setAlert({
        visible: true,
        type: 'info',
        title: 'Empty post',
        message: 'Please write something or add media.',
        onPrimary: () => setAlert(null)
      });
      return;
    }
    try {
      setPosting(true);

      const mediaUrls: any[] = [];
      for (const item of mediaItems) {
        if (!item.base64) continue;
        
        console.log(`📤 Uploading ${item.type}: ${item.filename}`);
        const uploader = item.type === 'image' ? uploadDiscussionImage : uploadDiscussionVideo;
        const result = await uploader(token, {
          mimeType: item.mimeType,
          fileName: item.filename,
          file: item.base64,
        });
        
        const url = result?.data?.url || result?.url || result;
        mediaUrls.push({ type: item.type, url, filename: item.filename, caption: '' });
        console.log(`✅ Uploaded ${item.type}:`, url);
      }

      console.log(`📝 Creating ${selectedCategory} post with`, mediaUrls.length, 'media items');
      await createPublicDiscussion(token, {
        content: content.trim(),
        isPublic: true,
        category: selectedCategory,
        mediaUrls,
      });

      reset();
      onPosted();
      
    } catch (err: any) {
      console.error('Post error:', err);
      setAlert({
        visible: true,
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to post. Please try again.',
        onPrimary: () => setAlert(null)
      });
    } finally {
      setPosting(false);
    }
  };

  const authorName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'You';
  const avatarUri = user?.user_pic ? getImageUri(user.user_pic) : null;

  const categoryOptions = [
    { label: '💬 Discussion', value: DiscussionCategory.DISCUSSION },
    { label: '🙏 Prayer', value: DiscussionCategory.PRAYER },
    { label: '📖 Devotion', value: DiscussionCategory.DEVOTION },
    { label: '✨ Blessing', value: DiscussionCategory.BLESSING },
    { label: '🗣️ Testimony', value: DiscussionCategory.TESTIMONY },
    { label: '❓ Question', value: DiscussionCategory.QUESTION },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[s.composerHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={s.composerCloseBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.composerTitle, { color: colors.text }]}>New Post</Text>
          <TouchableOpacity
            style={[s.composerPostBtn, (posting || (!content.trim() && mediaItems.length === 0)) && s.composerPostBtnDisabled]}
            onPress={handlePost}
            disabled={posting || (!content.trim() && mediaItems.length === 0)}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.composerPostBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <View style={[s.composerAuthorRow, { padding: 16 }]}>
            <View style={s.cardAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={s.cardAvatarImg} />
              ) : (
                <Text style={s.cardAvatarInitial}>{authorName.charAt(0).toUpperCase() || 'Y'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardAuthorName, { color: colors.text }]}>{authorName}</Text>
              <View style={[s.composerPublicBadge, { backgroundColor: colors.backgroundMuted }]}>
                <Ionicons name="globe-outline" size={12} color={colors.textSecondary} />
                <Text style={[s.composerPublicText, { color: colors.textSecondary }]}>Public</Text>
              </View>
            </View>
          </View>

          {/* Category Selector */}
          <View style={s.categorySelector}>
            <Text style={[s.categoryLabel, { color: colors.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryOptionsContainer}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    s.categoryOption,
                    selectedCategory === option.value && s.categoryOptionActive
                  ]}
                  onPress={() => setSelectedCategory(option.value)}
                >
                  <Text style={[
                    s.categoryOptionText,
                    selectedCategory === option.value && s.categoryOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TextInput
            style={[s.composerInput, { color: colors.text }]}
            placeholder="Say anything… Have fun!"
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
            textAlignVertical="top"
          />

          {mediaItems.length > 0 && (
            <View style={s.composerMediaRow}>
              {mediaItems.map((item, idx) => (
                <View key={idx} style={s.composerMediaThumb}>
                  {item.type === 'image' ? (
                    <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="videocam" size={32} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }} numberOfLines={1}>{item.filename}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={s.composerMediaRemove} onPress={() => removeMedia(idx)}>
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[s.composerToolbar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity style={s.composerToolBtn} onPress={() => pickMedia('image')}>
            <Ionicons name="image-outline" size={24} color={colors.brand} />
            <Text style={[s.composerToolText, { color: colors.brand }]}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.composerToolBtn} onPress={() => pickMedia('video')}>
            <Ionicons name="videocam-outline" size={24} color={colors.brand} />
            <Text style={[s.composerToolText, { color: colors.brand }]}>Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.composerToolBtn}>
            <Ionicons name="happy-outline" size={24} color={colors.textMuted} />
            <Text style={[s.composerToolText, { color: colors.textMuted }]}>Feeling</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {alert && (
        <CustomAlert
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          primaryLabel="OK"
          onPrimary={alert.onPrimary}
        />
      )}
    </Modal>
  );
}

// ─── Groups Feed ──────────────────────────────────────────────────────────────

function GroupsFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, token, isInstructor } = useUser();
  const { colors } = useTheme();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const s = makeStyles(colors);

  useFocusEffect(useCallback(() => { fetchGroups(); }, []));

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getGroups(token);
      const groupsData = result.data || result || [];
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (err) {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchGroups(); setRefreshing(false); };

  const filteredGroups = groups.filter(
    (group) =>
      group.group_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.group_short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.group_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={[s.searchContainer, { marginHorizontal: 16, marginBottom: 8 }]}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search groups..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {loading ? (
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading groups...</Text>
        </View>
      ) : error ? (
        <View style={s.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryButton} onPress={fetchGroups}>
            <Text style={s.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredGroups.length === 0 ? (
        <View style={s.centerContainer}>
          <Ionicons name="people-outline" size={48} color={colors.borderMid} />
          <Text style={s.emptyText}>{searchQuery ? 'No groups found' : 'No groups available'}</Text>
          {isInstructor && !searchQuery && (
            <TouchableOpacity style={s.createFirstButton} onPress={() => router.push('/(tabs)/community/create-group' as any)}>
              <Text style={s.createFirstButtonText}>Create First Group</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(group) => group.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scrollContent, { paddingBottom: 20 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brand]} />}
          renderItem={({ item: group }) => {
            const isUserMember = group.member?.some((m: any) => {
              if (m.userId) return m.userId === user?.id;
              if (m.student?.id) return m.student.id === user?.id;
              return false;
            }) || false;
            const memberCount = group._count?.member || group.member?.length || 0;
            return (
              <GroupCard
                id={group.id}
                name={group.group_title}
                description={group.group_short_description || group.group_description}
                memberCount={memberCount}
                lastActive={group.updatedAt || group.createdAt}
                leader={{
                  name: group.createdBy
                    ? `${group.createdBy.first_name} ${group.createdBy.last_name}`
                    : group.userId === user?.id ? 'You' : 'Group Leader',
                  avatar: group.createdBy?.user_pic || null,
                }}
                isMember={isUserMember}
                isModerator={isInstructor && group.userId === user?.id}
                thumbnail={group.group_image}
              />
            );
          }}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: c.background },

    headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
    pageTitle:   { fontSize: 26, fontWeight: '700', color: c.text },
    iconButton:  { position: 'relative', padding: 4 },
    unreadBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#E53E3E', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    unreadBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    newGroupButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    newGroupText:   { fontSize: 15, fontWeight: '600', color: c.brand },

    tabSwitcher:         { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: c.backgroundMuted, borderRadius: 10, padding: 4 },
    tabSwitchBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, gap: 6 },
    tabSwitchBtnActive:  { backgroundColor: c.card, shadowColor: c.shadow, shadowOpacity: 0.08, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 2 },
    tabSwitchText:       { fontSize: 14, fontWeight: '500', color: c.textMuted },
    tabSwitchTextActive: { color: c.brand, fontWeight: '600' },

    // Category Tabs
    categoryTabsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    categoryTab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.backgroundMuted,
      gap: 6,
      marginRight: 8,
    },
    categoryTabActive: {
      backgroundColor: c.brandLighter,
      borderWidth: 1,
      borderColor: c.brand,
    },
    categoryTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textSecondary,
    },
    categoryTabTextActive: {
      color: c.brand,
      fontWeight: '600',
    },

    // Category Selector in Composer
    categorySelector: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: c.border,
      marginBottom: 12,
    },
    categoryLabel: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 8,
      color: c.textSecondary,
    },
    categoryOptionsContainer: {
      gap: 8,
    },
    categoryOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.backgroundMuted,
      marginRight: 8,
    },
    categoryOptionActive: {
      backgroundColor: c.brand,
    },
    categoryOptionText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    categoryOptionTextActive: {
      color: '#fff',
      fontWeight: '600',
    },

    // Category Badge on Cards
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
      marginBottom: 10,
      marginHorizontal: 14,
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.3,
    },

    sortRow:          { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8, },
    sortPill:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: c.backgroundMuted, borderWidth: 1, borderColor: c.border },
    sortPillActive:   { backgroundColor: c.brand, borderColor: c.brand },
    sortPillText:     { fontSize: 13, fontWeight: '500', color: c.textSecondary },
    sortPillTextActive: { color: '#fff' },

    discussionCard:  { backgroundColor: c.card, borderRadius: 14, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: c.border },
    cardAuthorRow:   { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10, gap: 10 },
    cardAvatar:      { width: 42, height: 42, borderRadius: 21, backgroundColor: c.brandLighter, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    cardAvatarImg:   { width: '100%', height: '100%' },
    cardAvatarInitial: { fontSize: 17, fontWeight: '700', color: c.brand },
    cardAuthorName:  { fontSize: 14, fontWeight: '600', color: c.text },
    cardDate:        { fontSize: 12, color: c.textMuted, marginTop: 1 },
    cardContent:     { fontSize: 14, color: c.text, lineHeight: 21, paddingHorizontal: 14, paddingBottom: 12 },

    mediaGrid:        { flexDirection: 'row', flexWrap: 'wrap', margin: 8, gap: 4 },
    mediaThumb:       { width: (SCREEN_WIDTH - 80) / 2, height: 120, borderRadius: 8, backgroundColor: c.backgroundMuted, overflow: 'hidden' },
    mediaThumbFull:   { width: SCREEN_WIDTH - 64, height: 200 },
    mediaMore:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    mediaMoreText:    { color: '#fff', fontSize: 20, fontWeight: '700' },
    videoThumbContainer: { margin: 8, borderRadius: 10, overflow: 'hidden', height: 180, position: 'relative' },
    videoThumb:       { width: '100%', height: '100%' },
    videoPlayOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },

    cardActions:      { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border },
    cardAction:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
    cardActionText:   { fontSize: 13, color: c.textMuted, fontWeight: '500' },

    fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center', shadowColor: c.brand, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 8 },

    composerHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    composerCloseBtn:    { padding: 4 },
    composerTitle:       { fontSize: 17, fontWeight: '600' },
    composerPostBtn:     { backgroundColor: c.brand, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
    composerPostBtnDisabled: { opacity: 0.4 },
    composerPostBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    composerAuthorRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
    composerPublicBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' },
    composerPublicText:  { fontSize: 11, fontWeight: '500' },
    composerInput:       { fontSize: 16, lineHeight: 24, paddingHorizontal: 16, paddingBottom: 16, minHeight: 120 },
    composerMediaRow:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, paddingBottom: 16 },
    composerMediaThumb:  { width: 90, height: 90, borderRadius: 10, overflow: 'hidden', backgroundColor: '#111', position: 'relative' },
    composerMediaRemove: { position: 'absolute', top: 4, right: 4 },
    composerToolbar:     { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, gap: 8 },
    composerToolBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: c.backgroundMuted },
    composerToolText:    { fontSize: 13, fontWeight: '500' },

    searchContainer:      { flexDirection: 'row', alignItems: 'center', backgroundColor: c.backgroundMuted, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, gap: 10 },
    searchInput:          { flex: 1, fontSize: 15, color: c.text },
    centerContainer:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 16, minHeight: 240 },
    loadingText:          { fontSize: 16, color: c.textSecondary },
    errorText:            { fontSize: 16, color: c.textSecondary, textAlign: 'center' },
    emptyText:            { fontSize: 16, color: c.textMuted, textAlign: 'center' },
    retryButton:          { backgroundColor: c.brand, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, marginTop: 8 },
    retryButtonText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
    createFirstButton:    { backgroundColor: c.brand, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, marginTop: 16 },
    createFirstButtonText:{ color: '#fff', fontSize: 16, fontWeight: '600' },
    scrollContent:        { paddingHorizontal: 16 },

    inviteScroll:      { padding: 16, gap: 16, paddingBottom: 40 },
    card:              { backgroundColor: c.card, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: c.border, shadowColor: c.shadow, shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
    cardTitle:         { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 6 },
    cardSubtitle:      { fontSize: 13, color: c.textMuted, lineHeight: 19, marginBottom: 16 },
    inputRow:          { flexDirection: 'row', gap: 8, marginBottom: 12 },
    emailInput:        { flex: 1, borderWidth: 1, borderColor: c.borderMid, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: c.text, backgroundColor: c.inputBg },
    rolePickerWrapper: { borderWidth: 1, borderColor: c.borderMid, borderRadius: 8, overflow: 'hidden', width: 110, justifyContent: 'center', backgroundColor: c.inputBg },
    rolePicker:        { height: 46, marginHorizontal: -4, color: c.text },
    inviteButton:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.brand, paddingVertical: 12, borderRadius: 8 },
    inviteButtonText:  { color: '#fff', fontSize: 14, fontWeight: '600' },
    pendingHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    badge:             { backgroundColor: c.brand, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText:         { color: '#fff', fontSize: 12, fontWeight: '700' },
    inviteRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    inviteAvatar:      { width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandLighter, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    inviteAvatarText:  { fontSize: 16, fontWeight: '700', color: c.brand },
    inviteInfo:        { flex: 1 },
    inviteEmail:       { fontSize: 14, color: c.text, fontWeight: '500' },
    roleBadge:         { borderWidth: 1, borderColor: c.borderMid, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
    roleBadgeText:     { fontSize: 12, color: c.textSecondary, fontWeight: '500' },
    sendButton:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#C85C1A', paddingVertical: 14, borderRadius: 8, marginTop: 16 },
    sendButtonDisabled:{ opacity: 0.6 },
    sendButtonText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
    emptyState:        { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
    emptyIcon:         { width: 80, height: 80, borderRadius: 40, backgroundColor: c.backgroundSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle:        { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 8 },
    emptySubtitle:     { fontSize: 13, color: c.textMuted, textAlign: 'center', lineHeight: 19 },
  });
}