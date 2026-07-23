// app/(tabs)/courses/[id]/forums/[postId].tsx
import { API_CONFIG } from '@/constants/config';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageUri } from '@/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  parentId: string | null;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    user_pic: string | null;
  };
  _count?: { likes: number };
  likes?: any[];
  children?: Reply[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  courseId: string;
  userId: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    user_pic: string | null;
  };
  _count?: { likes: number; replies: number };
  likes?: any[];
  replies?: Reply[];
}

export default function PostDetail() {
  const params = useLocalSearchParams();
  const { id: courseId, postId } = params;
  const { token, user } = useUser();
  const { colors } = useTheme();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());
  const [childrenReplies, setChildrenReplies] = useState<Record<string, Reply[]>>({});
  
  // Like states
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likingInProgress, setLikingInProgress] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      fetchPostWithReplies();
    }, [postId])
  );

  // Check if user has liked the post when it loads
  useEffect(() => {
    if (post) {
      checkPostLikeStatus();
      // Initialize like counts
      const counts: Record<string, number> = {};
      counts[post.id] = post._count?.likes ?? post.likes?.length ?? 0;
      post.replies?.forEach(reply => {
        counts[reply.id] = reply._count?.likes ?? reply.likes?.length ?? 0;
      });
      setLikeCounts(counts);
    }
  }, [post?.id]);

  // Check if current user has liked the post
  const checkPostLikeStatus = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/socials/check-like?postId=${postId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      if (response.ok && result.liked) {
        setLikedPosts(prev => new Set(prev).add(postId as string));
      }
    } catch (err) {
      console.error('Error checking like status:', err);
    }
  };

  // Delete Post
  const handleDeletePost = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/socials/delete-post/${postId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              const result = await response.json();

              if (response.ok) {
                Alert.alert('Success', 'Post deleted successfully', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              } else {
                Alert.alert('Error', result.message || 'Failed to delete post');
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Delete Reply
  const handleDeleteReply = (replyId: string) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/socials/delete-reply/${replyId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              const result = await response.json();

              if (response.ok) {
                Alert.alert('Success', 'Reply deleted successfully');
                // Refresh the post to show updated replies
                fetchPostWithReplies();
              } else {
                Alert.alert('Error', result.message || 'Failed to delete reply');
              }
            } catch (error) {
              console.error('Error deleting reply:', error);
              Alert.alert('Error', 'Failed to delete reply. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Like/Unlike a post
  const handleLikePost = async (id: string) => {
    if (likingInProgress.has(id)) return;
    
    const isCurrentlyLiked = likedPosts.has(id);
    
    try {
      setLikingInProgress(prev => new Set(prev).add(id));
      
      const url = isCurrentlyLiked
        ? `${API_CONFIG.BASE_URL}/socials/unlike-post/${id}`
        : `${API_CONFIG.BASE_URL}/socials/like-post/${id}`;
      
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setLikedPosts(prev => {
          const next = new Set(prev);
          if (isCurrentlyLiked) {
            next.delete(id);
            setLikeCounts(counts => ({ ...counts, [id]: Math.max(0, (counts[id] || 0) - 1) }));
          } else {
            next.add(id);
            setLikeCounts(counts => ({ ...counts, [id]: (counts[id] || 0) + 1 }));
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Error liking/unliking post:', err);
    } finally {
      setLikingInProgress(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Like/Unlike a reply
  const handleLikeReply = async (replyId: string) => {
    if (likingInProgress.has(replyId)) return;
    
    const isCurrentlyLiked = likedReplies.has(replyId);
    
    try {
      setLikingInProgress(prev => new Set(prev).add(replyId));
      
      const url = isCurrentlyLiked
        ? `${API_CONFIG.BASE_URL}/socials/unlike-reply/${replyId}`
        : `${API_CONFIG.BASE_URL}/socials/like-reply/${replyId}`;
      
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setLikedReplies(prev => {
          const next = new Set(prev);
          if (isCurrentlyLiked) {
            next.delete(replyId);
            setLikeCounts(counts => ({ ...counts, [replyId]: Math.max(0, (counts[replyId] || 0) - 1) }));
          } else {
            next.add(replyId);
            setLikeCounts(counts => ({ ...counts, [replyId]: (counts[replyId] || 0) + 1 }));
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Error liking/unliking reply:', err);
    } finally {
      setLikingInProgress(prev => {
        const next = new Set(prev);
        next.delete(replyId);
        return next;
      });
    }
  };

  const fetchPostWithReplies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/socials/get-post-with-replies/${postId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      if (response.ok) {
        setPost(result.data || result);
      } else {
        setError(result.message || 'Failed to load post');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Unable to load post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch nested replies for a specific reply
  const fetchNestedReplies = async (replyId: string) => {
    try {
      setLoadingChildren(prev => new Set(prev).add(replyId));
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/socials/get-replies-from-replies/${replyId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const result = await response.json();
      
      if (response.ok) {
        const replies = result.data || result || [];
        setChildrenReplies(prev => ({
          ...prev,
          [replyId]: Array.isArray(replies) ? replies : []
        }));
      }
    } catch (err) {
      console.error('Error fetching nested replies:', err);
    } finally {
      setLoadingChildren(prev => {
        const next = new Set(prev);
        next.delete(replyId);
        return next;
      });
    }
  };

  // Toggle expanded state for a reply
  const toggleExpanded = (replyId: string, hasChildren: boolean) => {
    const newExpanded = new Set(expandedReplies);
    
    if (newExpanded.has(replyId)) {
      newExpanded.delete(replyId);
    } else {
      newExpanded.add(replyId);
      if (hasChildren && !childrenReplies[replyId]) {
        fetchNestedReplies(replyId);
      }
    }
    
    setExpandedReplies(newExpanded);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const getAuthorName = (userObj?: { first_name: string; last_name: string }) => {
    if (!userObj) return 'Anonymous';
    return `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() || 'Anonymous';
  };

  const isCurrentUser = (userId: string) => userId === user?.id;

  const s = makeStyles(colors);

  // Render a single reply with optional nesting
  const renderReply = (reply: Reply, depth: number = 0) => {
    const authorName = getAuthorName(reply.user);
    const avatarUri = reply.user?.user_pic ? getImageUri(reply.user.user_pic) : null;
    const likes = reply._count?.likes ?? reply.likes?.length ?? 0;
    const isExpanded = expandedReplies.has(reply.id);
    const isLoadingChildren = loadingChildren.has(reply.id);
    
    const children = reply.children?.length ? reply.children : (childrenReplies[reply.id] || []);
    const hasChildren = (reply.children && reply.children.length > 0) || children.length > 0;
    const childCount = reply.children?.length || children.length || 0;

    return (
      <View key={reply.id} style={[s.replyCard, depth > 0 && s.nestedReply]}>
        {depth > 0 && <View style={[s.threadLine, { backgroundColor: colors.borderMid }]} />}
        
        <View style={s.replyHeader}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.replyAvatar} />
          ) : (
            <View style={[s.replyAvatar, s.avatarPlaceholder, { backgroundColor: colors.backgroundMuted }]}>
              <Text style={[s.smallAvatarText, { color: colors.textSecondary }]}>{authorName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={s.replyAuthorInfo}>
            <Text style={[s.replyAuthorName, { color: colors.text }]}>
              {authorName}
              {isCurrentUser(reply.userId) && ' (You)'}
            </Text>
            <View style={s.timeContainer}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={[s.timeText, { color: colors.textMuted }]}>{getTimeAgo(reply.createdAt)}</Text>
            </View>
          </View>
        </View>

        <Text style={[s.replyContent, { color: colors.textSecondary }]}>{reply.content}</Text>

        <View style={s.replyFooter}>
          <TouchableOpacity 
            style={s.replyAction}
            onPress={() => handleLikeReply(reply.id)}
            disabled={likingInProgress.has(reply.id)}
          >
            {likingInProgress.has(reply.id) ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Ionicons 
                name={likedReplies.has(reply.id) ? "heart" : "heart-outline"} 
                size={16} 
                color={likedReplies.has(reply.id) ? "#EF4444" : colors.textSecondary} 
              />
            )}
            {(likeCounts[reply.id] ?? likes) > 0 && (
              <Text style={[
                s.replyActionText,
                likedReplies.has(reply.id) && { color: "#EF4444", fontWeight: '500' }
              ]}>
                {likeCounts[reply.id] ?? likes}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={s.replyAction}
            onPress={() => router.push(
              `/(tabs)/courses/${courseId}/forums/reply?postId=${postId}&replyId=${reply.id}&replyTo=${encodeURIComponent(authorName)}` as any
            )}
          >
            <Ionicons name="arrow-undo-outline" size={16} color={colors.textSecondary} />
            <Text style={[s.replyActionText, { color: colors.textSecondary }]}>Reply</Text>
          </TouchableOpacity>

          {/* Delete button for reply owner */}
          {isCurrentUser(reply.userId) && (
            <TouchableOpacity 
              style={s.replyAction}
              onPress={() => handleDeleteReply(reply.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={[s.replyActionText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          )}

          {(hasChildren || childCount > 0) && (
            <TouchableOpacity 
              style={s.viewRepliesButton}
              onPress={() => toggleExpanded(reply.id, true)}
            >
              {isLoadingChildren ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <>
                  <Ionicons 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={14} 
                    color={colors.brand} 
                  />
                  <Text style={[s.viewRepliesText, { color: colors.brand }]}>
                    {isExpanded ? 'Hide' : `View ${childCount}`} {childCount === 1 ? 'reply' : 'replies'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {isExpanded && children.length > 0 && (
          <View style={s.childrenContainer}>
            {children.map(child => renderReply(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[s.errorText, { color: colors.textSecondary }]}>{error || 'Post not found'}</Text>
          <TouchableOpacity style={s.retryButton} onPress={fetchPostWithReplies}>
            <Text style={s.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const authorName = getAuthorName(post.user);
  const authorAvatar = post.user?.user_pic ? getImageUri(post.user.user_pic) : null;
  const likesCount = post._count?.likes ?? post.likes?.length ?? 0;
  const topLevelReplies = (post.replies || []).filter(r => r.parentId === null);

  return (
    <MenuProvider>
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Original Post */}
          <View style={[s.postCard, { backgroundColor: colors.card }]}>
            <View style={s.postHeader}>
              {authorAvatar ? (
                <Image source={{ uri: authorAvatar }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarPlaceholder, { backgroundColor: colors.backgroundMuted }]}>
                  <Text style={[s.avatarText, { color: colors.textSecondary }]}>{authorName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={s.authorInfo}>
                <Text style={[s.authorName, { color: colors.text }]}>
                  {authorName}{isCurrentUser(post.userId) && ' (You)'}
                </Text>
                <View style={s.timeContainer}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={[s.timeText, { color: colors.textMuted }]}>{getTimeAgo(post.createdAt)}</Text>
                </View>
              </View>
             
              {isCurrentUser(post.userId) && (
                <Menu>
                  <MenuTrigger>
                    <View style={s.menuButton}>
                      <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
                    </View>
                  </MenuTrigger>
                  <MenuOptions customStyles={{
                    optionsContainer: {
                      backgroundColor: colors.card,
                      padding: 8,
                      borderRadius: 8,
                      shadowColor: colors.shadow,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      elevation: 5,
                    },
                  }}>
                    <MenuOption onSelect={handleDeletePost}>
                      <View style={s.menuItem}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        <Text style={[s.menuText, { color: '#EF4444' }]}>Delete</Text>
                      </View>
                    </MenuOption>
                  </MenuOptions>
                </Menu>
              )}
            </View>

            <Text style={[s.postTitle, { color: colors.text }]}>{post.title}</Text>
            <Text style={[s.postContent, { color: colors.textSecondary }]}>{post.content}</Text>

            <View style={[s.postFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity 
                style={s.actionButton}
                onPress={() => handleLikePost(post.id)}
                disabled={likingInProgress.has(post.id)}
              >
                {likingInProgress.has(post.id) ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <Ionicons 
                    name={likedPosts.has(post.id) ? "thumbs-up" : "thumbs-up-outline"} 
                    size={18} 
                    color={likedPosts.has(post.id) ? colors.brand : colors.textSecondary} 
                  />
                )}
                <Text style={[
                  s.actionText,
                  likedPosts.has(post.id) && { color: colors.brand, fontWeight: '600' }
                ]}>
                  {likeCounts[post.id] ?? likesCount}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={s.actionButton}
                onPress={() => router.push(`/(tabs)/courses/${courseId}/forums/reply?postId=${postId}` as any)}
              >
                <Ionicons name="arrow-undo-outline" size={18} color={colors.textSecondary} />
                <Text style={[s.actionText, { color: colors.textSecondary }]}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Replies Section */}
          <View style={[s.repliesSection, { backgroundColor: colors.card }]}>
            <View style={s.repliesHeader}>
              <Text style={[s.repliesTitle, { color: colors.text }]}>
                Replies ({post._count?.replies || post.replies?.length || 0})
              </Text>
              <TouchableOpacity
                style={s.replyButton}
                onPress={() => router.push(`/(tabs)/courses/${courseId}/forums/reply?postId=${postId}` as any)}
              >
                <Ionicons name="add" size={18} color={colors.brand} />
                <Text style={[s.replyButtonText, { color: colors.brand }]}>Reply</Text>
              </TouchableOpacity>
            </View>

            {topLevelReplies.length === 0 ? (
              <View style={s.emptyReplies}>
                <Ionicons name="chatbubble-outline" size={32} color={colors.textMuted} />
                <Text style={[s.emptyText, { color: colors.textMuted }]}>No replies yet. Be the first!</Text>
              </View>
            ) : (
              topLevelReplies.map(reply => renderReply(reply, 0))
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </MenuProvider>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 20 },
    errorText: { fontSize: 14, textAlign: 'center' },
    retryButton: { backgroundColor: c.brand, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      backgroundColor: c.background, 
      borderBottomWidth: 1, 
      borderBottomColor: c.border 
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text, flex: 1, textAlign: 'center' },
    postCard: { padding: 20, marginBottom: 8 },
    postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: '600' },
    smallAvatarText: { fontSize: 12, fontWeight: '600' },
    authorInfo: { flex: 1, marginLeft: 12 },
    authorName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 12 },
    menuButton: { padding: 4 },
    postTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, lineHeight: 24 },
    postContent: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
    postFooter: { flexDirection: 'row', gap: 20, paddingTop: 16, borderTopWidth: 1 },
    actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { fontSize: 14, fontWeight: '500' },
    repliesSection: { padding: 20 },
    repliesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    repliesTitle: { fontSize: 16, fontWeight: '600' },
    replyButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    replyButtonText: { fontSize: 14, fontWeight: '600' },
    emptyReplies: { alignItems: 'center', paddingVertical: 30 },
    emptyText: { fontSize: 14, marginTop: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
    menuText: { fontSize: 16 },
    replyCard: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.border },
    nestedReply: { marginLeft: 20, paddingLeft: 16, borderLeftWidth: 2, borderBottomWidth: 0, marginBottom: 12, paddingBottom: 0 },
    threadLine: { position: 'absolute', left: -11, top: 0, bottom: 0, width: 2 },
    replyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    replyAvatar: { width: 32, height: 32, borderRadius: 16 },
    replyAuthorInfo: { flex: 1, marginLeft: 10 },
    replyAuthorName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
    replyContent: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
    replyFooter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    replyAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    replyActionText: { fontSize: 12 },
    viewRepliesButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
    viewRepliesText: { fontSize: 12, fontWeight: '500' },
    childrenContainer: { marginTop: 12 },
  });
}