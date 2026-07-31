// app/(tabs)/community/discussion/[id].tsx

import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  RefreshControl
} from 'react-native';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getDiscussion, replyToDiscussion, likeDiscussion, getDiscussionComments } from '@/services/api';
import { getImageUri } from '@/utils/helpers';

export default function DiscussionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useUser();
  const { colors } = useTheme();
  const [discussion, setDiscussion] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [postingReply, setPostingReply] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [totalComments, setTotalComments] = useState(0);

  useEffect(() => {
    if (id) {
      fetchDiscussion();
      fetchComments(1, false);
    }
  }, [id]);

  const fetchDiscussion = async () => {
    try {
      setLoading(true);
      const result = await getDiscussion(token, id);
      
      let discussionData = null;
      
      if (result?.data) {
        if (result.data.discussion) {
          discussionData = result.data.discussion;
        } else if (result.data.id) {
          discussionData = result.data;
        } else {
          discussionData = result.data;
        }
      } else if (result?.id) {
        discussionData = result;
      }
      
      if (discussionData) {
        // Use the 'liked' field directly from the API response if available
        // The API returns "liked": true/false in the discussion detail
        let userLiked = false;
        
        if (discussionData.liked !== undefined) {
          // Priority 1: Use the 'liked' field from API
          userLiked = discussionData.liked;
        } else if (discussionData.likes && Array.isArray(discussionData.likes)) {
          // Fallback: Check likes array
          userLiked = discussionData.likes.some((like: any) => like.userId === user?.id);
        }
        
        setLiked(userLiked);
        setLikeCount(discussionData._count?.likes || discussionData.likes?.length || 0);
        setTotalComments(discussionData._count?.replies || 0);
        setDiscussion(discussionData);
        
        console.log('📱 Discussion like status:', { 
          id: discussionData.id, 
          liked: userLiked, 
          likeCount: discussionData._count?.likes 
        });
      }
      
    } catch (error) {
      console.error('Error fetching discussion:', error);
      Alert.alert('Error', 'Failed to load discussion');
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments using the dedicated comments endpoint
  const fetchComments = async (page = 1, append = false) => {
    try {
      setLoadingComments(true);
      
      const result = await getDiscussionComments(token, id, page, 20);
      
      let commentsData = [];
      if (result?.data?.comments) {
        commentsData = result.data.comments;
      } else if (Array.isArray(result?.data)) {
        commentsData = result.data;
      } else if (Array.isArray(result)) {
        commentsData = result;
      }
      
      console.log('📱 Fetched comments:', commentsData.length, 'for page', page);
      
      if (append) {
        setComments(prev => [...prev, ...commentsData]);
      } else {
        setComments(commentsData);
      }
      
      // Update pagination info if available
      if (result?.data?.pagination) {
        const { page: currentPage, totalPages } = result.data.pagination;
        setHasMoreComments(currentPage < totalPages);
      } else if (result?.pagination) {
        const { page: currentPage, totalPages } = result.pagination;
        setHasMoreComments(currentPage < totalPages);
      } else {
        // If no pagination info, assume no more comments if we got less than limit
        setHasMoreComments(commentsData.length === 20);
      }
      
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadMoreComments = () => {
    if (!hasMoreComments || loadingComments) return;
    const nextPage = commentsPage + 1;
    setCommentsPage(nextPage);
    fetchComments(nextPage, true);
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      setPostingReply(true);
      const result = await replyToDiscussion(token, id, {
        content: replyContent.trim(),
        mediaUrls: []
      });
      
      console.log('📱 Reply response:', result);
      
      setReplyContent('');
      
      // Reset to page 1 and fetch comments again
      setCommentsPage(1);
      await fetchComments(1, false);
      
      // Update total comments count
      setTotalComments(prev => prev + 1);
      
      Alert.alert('Success', 'Reply posted!');
    } catch (error: any) {
      console.error('Reply error:', error);
      Alert.alert('Error', error.message || 'Failed to post reply');
    } finally {
      setPostingReply(false);
    }
  };

  const handleLike = async () => {
    try {
      const result = await likeDiscussion(token, id);
      
      const newLikedState = result?.data?.liked ?? false;
      const newLikeCount = result?.data?.likeCount ?? 0;
      
      console.log('📱 Like result:', { newLikedState, newLikeCount });
      
      setLiked(newLikedState);
      setLikeCount(newLikeCount);
      
    } catch (error) {
      console.error('Like error:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCommentsPage(1);
    await Promise.all([
      fetchDiscussion(),
      fetchComments(1, false)
    ]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading discussion...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!discussion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <Ionicons name="chatbubble-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Discussion not found</Text>
          <TouchableOpacity style={[styles.backButtonFull, { backgroundColor: colors.brand }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const author = discussion.author;
  const authorName = author 
    ? `${author.first_name || ''} ${author.last_name || ''}`.trim() 
    : 'Anonymous User';
  const avatarUri = author?.user_pic ? getImageUri(author.user_pic) : null;

  // Handle media display
  const renderMedia = () => {
    if (!discussion.mediaUrls || discussion.mediaUrls.length === 0) return null;
    
    return (
      <View style={styles.mediaContainer}>
        {discussion.mediaUrls.map((media: any, idx: number) => {
          if (media.type === 'image') {
            return (
              <Image 
                key={idx} 
                source={{ uri: media.url }}
                style={styles.mediaImage}
                contentFit="cover"
              />
            );
          } else if (media.type === 'video') {
            return (
              <TouchableOpacity 
                key={idx}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/community/video-player',
                    params: { url: media.url, title: 'Video' }
                  });
                }}
              >
                <View style={styles.videoContainer}>
                  <Ionicons name="play-circle" size={50} color="#fff" />
                  <Text style={styles.videoText}>Tap to play video</Text>
                </View>
              </TouchableOpacity>
            );
          }
          return null;
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Discussion</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brand]} />
          }
        >
          {/* Original Post */}
          <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.authorRow}>
              <View style={[styles.avatar, { backgroundColor: colors.brandLighter }]}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.brand }]}>
                    {authorName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.authorName, { color: colors.text }]}>{authorName}</Text>
                <Text style={[styles.date, { color: colors.textMuted }]}>
                  {new Date(discussion.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.content, { color: colors.text }]}>{discussion.content}</Text>
            
            {/* Media if any */}
            {renderMedia()}
            
            {/* Like Button */}
            <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
              <Ionicons 
                name={liked ? 'heart' : 'heart-outline'} 
                size={22} 
                color={liked ? '#E53E3E' : colors.textMuted} 
              />
              <Text style={[styles.likeText, { color: liked ? '#E53E3E' : colors.textMuted }]}>
                {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.repliesHeader}>
            <Text style={[styles.repliesTitle, { color: colors.text }]}>
              {totalComments} {totalComments === 1 ? 'Comment' : 'Comments'}
            </Text>
          </View>

          {loadingComments && comments.length === 0 ? (
            <View style={styles.loadingReplies}>
              <ActivityIndicator size="small" color={colors.brand} />
              <Text style={[styles.loadingRepliesText, { color: colors.textSecondary }]}>Loading comments...</Text>
            </View>
          ) : comments.length > 0 ? (
            <>
              {comments.map((comment: any, index: number) => {
                const commentAuthor = comment.author;
                const commentAuthorName = commentAuthor 
                  ? `${commentAuthor.first_name || ''} ${commentAuthor.last_name || ''}`.trim()
                  : 'Anonymous User';
                const commentAvatarUri = commentAuthor?.user_pic ? getImageUri(commentAuthor.user_pic) : null;
                
                return (
                  <View key={comment.id || index} style={[styles.replyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.authorRow}>
                      <View style={[styles.smallAvatar, { backgroundColor: colors.brandLighter }]}>
                        {commentAvatarUri ? (
                          <Image source={{ uri: commentAvatarUri }} style={styles.smallAvatarImage} />
                        ) : (
                          <Text style={[styles.smallAvatarText, { color: colors.brand }]}>
                            {commentAuthorName.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.authorName, { color: colors.text }]}>{commentAuthorName}</Text>
                        <Text style={[styles.date, { color: colors.textMuted }]}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.replyContent, { color: colors.text }]}>{comment.content}</Text>
                    
                    {/* Nested replies if any */}
                    {comment.replies && comment.replies.length > 0 && (
                      <View style={styles.nestedRepliesContainer}>
                        {comment.replies.map((nestedReply: any, nestedIdx: number) => {
                          const nestedAuthor = nestedReply.author;
                          const nestedAuthorName = nestedAuthor 
                            ? `${nestedAuthor.first_name || ''} ${nestedAuthor.last_name || ''}`.trim()
                            : 'Anonymous User';
                          
                          return (
                            <View key={nestedIdx} style={[styles.nestedReplyCard, { borderLeftColor: colors.brand }]}>
                              <Text style={[styles.nestedReplyAuthor, { color: colors.brand }]}>
                                {nestedAuthorName}
                              </Text>
                              <Text style={[styles.nestedReplyContent, { color: colors.textSecondary }]}>
                                {nestedReply.content}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
              
              {hasMoreComments && (
                <TouchableOpacity 
                  style={[styles.loadMoreButton, { backgroundColor: colors.backgroundMuted }]}
                  onPress={loadMoreComments}
                  disabled={loadingComments}
                >
                  {loadingComments ? (
                    <ActivityIndicator size="small" color={colors.brand} />
                  ) : (
                    <Text style={[styles.loadMoreText, { color: colors.brand }]}>Load more comments</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.noReplies}>
              <Ionicons name="chatbubble-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.noRepliesText, { color: colors.textMuted }]}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Reply Input */}
        <View style={[styles.replyInputContainer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TextInput
            style={[styles.replyInput, { backgroundColor: colors.backgroundMuted, color: colors.text }]}
            placeholder="Write a comment..."
            placeholderTextColor={colors.textMuted}
            value={replyContent}
            onChangeText={setReplyContent}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!replyContent.trim() || postingReply) && styles.sendButtonDisabled]}
            onPress={handleReply}
            disabled={!replyContent.trim() || postingReply}
          >
            {postingReply ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 8 },
  backButtonFull: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  postCard: { borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  smallAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  smallAvatarImage: { width: '100%', height: '100%' },
  smallAvatarText: { fontSize: 14, fontWeight: '700' },
  authorName: { fontSize: 15, fontWeight: '600' },
  date: { fontSize: 12, marginTop: 2 },
  content: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  mediaContainer: { marginBottom: 12, gap: 8 },
  mediaImage: { width: '100%', height: 200, borderRadius: 8 },
  videoContainer: { 
    width: '100%', 
    height: 200, 
    backgroundColor: '#000', 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8
  },
  videoText: { color: '#fff', fontSize: 14, marginTop: 8 },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, marginTop: 4, borderTopWidth: 0.5, borderTopColor: '#E5E5E5' },
  likeText: { fontSize: 13, fontWeight: '500' },
  repliesHeader: { marginTop: 8, marginBottom: 12 },
  repliesTitle: { fontSize: 16, fontWeight: '600' },
  loadingReplies: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  loadingRepliesText: { fontSize: 13 },
  replyCard: { borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1 },
  replyContent: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  nestedRepliesContainer: { marginTop: 12, marginLeft: 20, gap: 8 },
  nestedReplyCard: { paddingLeft: 12, borderLeftWidth: 2, marginTop: 4 },
  nestedReplyAuthor: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  nestedReplyContent: { fontSize: 13, lineHeight: 18 },
  replyInputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, alignItems: 'flex-end', gap: 8 },
  replyInput: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 14 },
  sendButton: { backgroundColor: '#C85C1A', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  noReplies: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  noRepliesText: { fontSize: 14, textAlign: 'center' },
  loadMoreButton: { alignItems: 'center', paddingVertical: 12, borderRadius: 8, marginTop: 8, marginBottom: 16 },
  loadMoreText: { fontSize: 14, fontWeight: '500' },
});