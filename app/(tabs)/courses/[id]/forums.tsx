// app/(tabs)/courses/[id]/forums.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { API_CONFIG } from '@/constants/config';
import { getCourse } from '@/services/api';
import { getImageUri } from '@/utils/helpers';

interface Post {
  id: string;
  courseId: string;
  title: string;
  content: string;
  createdAt: string;
  userId: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    user_pic: string | null;
  };
  _count?: {
    likes: number;
    replies: number;
  };
  likes?: any[];
  replies?: any[];
  isPinned?: boolean;
}

export default function Forums() {
  const params = useLocalSearchParams();
  const courseId = params.id;
  const { token, user } = useUser();
  const { colors } = useTheme();
  
  const [course, setCourse] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Like states
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likingInProgress, setLikingInProgress] = useState<Set<string>>(new Set());

  // Fetch course data
  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  // Fetch posts when screen is focused (to refresh after creating new post)
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  const fetchCourseData = async () => {
    try {
      const result = await getCourse(courseId as string, token);
      if (result && result.data) {
        setCourse(result.data);
      }
    } catch (err) {
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/socials/get-all-posts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('Posts API Response:', JSON.stringify(result, null, 2));

      if (response.ok) {
        // Handle different response structures
        let allPosts: Post[] = [];
        
        if (result.data && Array.isArray(result.data)) {
          allPosts = result.data;
        } else if (Array.isArray(result)) {
          allPosts = result;
        }

        console.log('All posts:', allPosts.length);
        console.log('Looking for courseId:', courseId);

        // Filter posts for this course using courseId (not postId)
        const coursePosts = allPosts.filter((post: Post) => {
          console.log('Post courseId:', post.courseId, 'Match:', post.courseId === courseId);
          return post.courseId === courseId;
        });

        console.log('Filtered posts for this course:', coursePosts.length);
        setPosts(coursePosts);
        
        // Initialize like counts from posts
        const counts: Record<string, number> = {};
        coursePosts.forEach((post: Post) => {
          counts[post.id] = post._count?.likes ?? post.likes?.length ?? 0;
        });
        setLikeCounts(counts);
      } else {
        console.error('Failed to fetch posts:', result);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Unable to load posts');
    } finally {
      setPostsLoading(false);
    }
  };

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Like/Unlike a post
  const handleLikePost = async (postId: string) => {
    if (likingInProgress.has(postId)) return;
    
    const isCurrentlyLiked = likedPosts.has(postId);
    
    try {
      setLikingInProgress(prev => new Set(prev).add(postId));
      
      // Use different endpoint for like vs unlike
      const url = isCurrentlyLiked
        ? `${API_CONFIG.BASE_URL}/socials/unlike-post/${postId}`
        : `${API_CONFIG.BASE_URL}/socials/like-post/${postId}`;
      
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log(`${isCurrentlyLiked ? 'Unlike' : 'Like'} post result:`, result);
      
      if (response.ok) {
        // Toggle like state
        setLikedPosts(prev => {
          const next = new Set(prev);
          if (isCurrentlyLiked) {
            next.delete(postId);
            setLikeCounts(counts => ({ ...counts, [postId]: Math.max(0, (counts[postId] || 0) - 1) }));
          } else {
            next.add(postId);
            setLikeCounts(counts => ({ ...counts, [postId]: (counts[postId] || 0) + 1 }));
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Error liking/unliking post:', err);
    } finally {
      setLikingInProgress(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  // Calculate course stats
  const totalLessons = course?.module?.reduce(
    (sum: number, mod: any) => sum + (mod.lesson?.length || 0), 0
  ) || 0;
  const totalDuration = course?.module?.reduce(
    (sum: number, mod: any) => sum + (parseInt(mod.module_duration) || 0), 0
  ) || 0;

  const imageUri = getImageUri(course?.course_image);

  const s = makeStyles(colors);

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
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Course Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Course Info Section */}
        <View style={s.courseInfo}>
          <Text style={s.courseTitle}>
            {course?.course_title || 'Course Forum'}
          </Text>
          <View style={s.courseMeta}>
            <View style={s.metaItem}>
              <Ionicons name="bar-chart-outline" size={14} color={colors.success} />
              <Text style={s.metaText}>{course?.course_level || 'All Levels'}</Text>
            </View>
            <View style={[s.metaDivider, { backgroundColor: colors.borderMid }]} />
            <Text style={s.metaText}>
              {totalDuration} min - {totalLessons} Lessons
            </Text>
          </View>
        </View>

        {/* Course Image */}
        {imageUri ? (
          <Image 
            source={{ uri: imageUri }}
            style={s.courseImage}
            contentFit="cover"
          />
        ) : (
          <View style={[s.courseImage, s.placeholderImage, { backgroundColor: colors.backgroundMuted }]}>
            <Ionicons name="book-outline" size={48} color={colors.textMuted} />
          </View>
        )}

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity 
            style={s.tab}
            onPress={() => router.replace(`/(tabs)/courses/${courseId}/overview` as any)}
          >
            <Text style={s.tabText}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={s.tab}
            onPress={() => router.replace(`/(tabs)/courses/${courseId}/quizzes` as any)}
          >
            <Text style={s.tabText}>Quizzes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={s.tab}
            onPress={() => router.replace(`/(tabs)/courses/${courseId}/materials` as any)}
          >
            <Text style={s.tabText}>Materials</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, s.tabActive]}>
            <Text style={[s.tabText, s.tabTextActive]}>Forums</Text>
          </TouchableOpacity>
        </View>

        <View style={s.content}>
          {/* Section Header */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Course Forum</Text>
            <TouchableOpacity 
              style={s.newPostButton}
              onPress={() => router.push(`/(tabs)/courses/${courseId}/forums/new-post` as any)}
            >
              <Ionicons name="add" size={18} color={colors.brand} />
              <Text style={[s.newPostText, { color: colors.brand }]}>New Post</Text>
            </TouchableOpacity>
          </View>

          {/* Forum Posts */}
          {postsLoading ? (
            <View style={s.postsLoading}>
              <ActivityIndicator size="small" color={colors.brand} />
              <Text style={s.loadingText}>Loading posts...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyTitle}>No posts yet</Text>
              <Text style={s.emptyText}>
                Be the first to start a discussion in this course forum!
              </Text>
              <TouchableOpacity 
                style={s.createPostButton}
                onPress={() => router.push(`/(tabs)/courses/${courseId}/forums/new-post` as any)}
              >
                <Text style={s.createPostButtonText}>Create Post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            posts.map((post, index) => {
              // Get author name from user object
              const authorName = post.user 
                ? `${post.user.first_name || ''} ${post.user.last_name || ''}`.trim() 
                : 'Anonymous';
              
              // Get likes and replies count
              const likesCount = post._count?.likes ?? post.likes?.length ?? 0;
              const repliesCount = post._count?.replies ?? post.replies?.length ?? 0;
              
              // Check if current user is author
              const isCurrentUser = post.userId === user?.id;
              
              // Get avatar
              const avatarUri = post.user?.user_pic ? getImageUri(post.user.user_pic) : null;

              return (
                <TouchableOpacity 
                  key={post.id}
                  style={[
                    s.postCard,
                    index === posts.length - 1 && s.lastPostCard
                  ]}
                  onPress={() => router.push(`/(tabs)/courses/${courseId}/forums/${post.id}` as any)}
                >
                  <View style={s.postHeader}>
                    {avatarUri ? (
                      <Image 
                        source={{ uri: avatarUri }} 
                        style={s.avatar} 
                      />
                    ) : (
                      <View style={[s.avatar, s.avatarPlaceholder, { backgroundColor: colors.backgroundMuted }]}>
                        <Text style={[s.avatarText, { color: colors.textSecondary }]}>
                          {authorName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={s.postAuthorInfo}>
                      <Text style={[s.authorName, { color: colors.text }]}>
                        {authorName}
                        {isCurrentUser && ' (You)'}
                      </Text>
                      <View style={s.timeContainer}>
                        <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                        <Text style={[s.timeText, { color: colors.textMuted }]}>{getTimeAgo(post.createdAt)}</Text>
                      </View>
                    </View>
                    {post.isPinned && (
                      <Ionicons name="pin" size={18} color={colors.brand} />
                    )}
                  </View>

                  <Text style={[s.postTitle, { color: colors.text }]}>{post.title}</Text>
                  <Text style={[s.postContent, { color: colors.textSecondary }]} numberOfLines={2}>
                    {post.content}
                  </Text>

                  <View style={s.postFooter}>
                    <TouchableOpacity 
                      style={s.postAction}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleLikePost(post.id);
                      }}
                      disabled={likingInProgress.has(post.id)}
                    >
                      {likingInProgress.has(post.id) ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <Ionicons 
                          name={likedPosts.has(post.id) ? "thumbs-up" : "thumbs-up-outline"} 
                          size={16} 
                          color={likedPosts.has(post.id) ? colors.brand : colors.textSecondary} 
                        />
                      )}
                      <Text style={[
                        s.postActionText,
                        likedPosts.has(post.id) && { color: colors.brand, fontWeight: '600' }
                      ]}>
                        {likeCounts[post.id] ?? likesCount}
                      </Text>
                    </TouchableOpacity>
                    <View style={s.postAction}>
                      <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                      <Text style={[s.postActionText, { color: colors.textSecondary }]}>{repliesCount}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
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
      borderBottomColor: c.border 
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text, flex: 1, textAlign: 'center' },
    courseInfo: { paddingHorizontal: 20, paddingTop: 16 },
    courseTitle: { fontSize: 20, fontWeight: '700', color: c.text, marginBottom: 8 },
    courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: c.textSecondary },
    metaDivider: { width: 1, height: 12 },
    courseImage: { width: '100%', height: 200 },
    placeholderImage: { justifyContent: 'center', alignItems: 'center' },
    tabs: { 
      flexDirection: 'row', 
      backgroundColor: c.background, 
      paddingHorizontal: 20, 
      paddingVertical: 8, 
      gap: 8 
    },
    tab: { 
      flex: 1, 
      paddingVertical: 12, 
      alignItems: 'center', 
      backgroundColor: c.backgroundSoft, 
      borderRadius: 6 
    },
    tabActive: { backgroundColor: c.brandLighter },
    tabText: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
    tabTextActive: { color: c.brand, fontWeight: '600' },
    content: { padding: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: c.text },
    newPostButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    newPostText: { fontSize: 14, fontWeight: '600' },
    
    // Loading & Empty States
    postsLoading: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    loadingText: { fontSize: 14, color: c.textSecondary },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: c.text, marginTop: 16 },
    emptyText: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
    createPostButton: { backgroundColor: c.brand, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 20 },
    createPostButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    
    // Post Card
    postCard: { backgroundColor: c.card, padding: 16, borderBottomWidth: 1, borderBottomColor: c.border },
    lastPostCard: { borderBottomWidth: 0 },
    postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 16, fontWeight: '600' },
    postAuthorInfo: { flex: 1, marginLeft: 12 },
    authorName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 12 },
    postTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    postContent: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
    postFooter: { flexDirection: 'row', gap: 20 },
    postAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    postActionText: { fontSize: 13 },
  });
}