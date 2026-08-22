// app/notifications/index.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  getUserNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead 
} from '@/services/api';

export default function Notifications() {
  const { token } = useUser();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      setError(null);
      console.log('🔔 Fetching notifications...');
      
      const result = await getUserNotifications(token);
      console.log('RAW NOTIFICATION RESULT:', JSON.stringify(result, null, 2));
      
      let notificationsArray: any[] = [];
      
      // Handle different response structures
if (Array.isArray(result)) {
  notificationsArray = result;
} else if (Array.isArray(result?.data)) {
  notificationsArray = result.data;
} else if (Array.isArray(result?.data?.data)) {
  // Paginated shape: { data: { data: [...], pagination: {...} } }
  notificationsArray = result.data.data;
}
      
      setNotifications(notificationsArray);
      console.log('✅ Notifications loaded:', notificationsArray.length);
      
      if (notificationsArray.length > 0) {
        console.log('📊 First notification sample:', {
          id: notificationsArray[0]?.id,
          title: notificationsArray[0]?.title,
          isRead: notificationsArray[0]?.isRead || notificationsArray[0]?.read,
          keys: Object.keys(notificationsArray[0] || {})
        });
      }
      
    } catch (err: any) {
      console.error('❌ Error fetching notifications:', err);
      setError(err?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (markingRead.has(notificationId)) return;
    
    try {
      setMarkingRead(prev => new Set(prev).add(notificationId));
      
      // Optimistic update
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true, read: true } : n
      ));
      
      await markNotificationAsRead(notificationId, token);
      console.log('✅ Marked notification as read:', notificationId);
      
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      // Revert optimistic update on error
      await fetchNotifications();
    } finally {
      setMarkingRead(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      
      await markAllNotificationsAsRead(token);
      console.log('✅ Marked all notifications as read');
      
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      // Revert on error
      await fetchNotifications();
    }
  };

  const unreadCount = notifications.filter(n => 
    !(n.isRead || n.read)
  ).length;

  const filteredNotifications = activeFilter === 'unread' 
    ? notifications.filter(n => !(n.isRead || n.read))
    : notifications;

  const getNotificationIcon = (notification: any): any => {
    const type = notification?.type?.toLowerCase() || '';
    const title = notification?.title?.toLowerCase() || '';
    
    if (type.includes('course') || title.includes('course')) return 'book-outline';
    if (type.includes('meeting') || title.includes('meeting')) return 'people-outline';
    if (type.includes('achievement') || title.includes('milestone')) return 'trophy-outline';
    if (type.includes('reminder') || title.includes('reminder')) return 'time-outline';
    if (type.includes('event') || title.includes('event')) return 'calendar-outline';
    if (type.includes('message') || title.includes('message')) return 'chatbubble-outline';
    
    return 'notifications-outline';
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'Recently';
    
    try {
      const date = new Date(timestamp);
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
    } catch {
      return 'Recently';
    }
  };

  const s = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryButton} onPress={fetchNotifications}>
            <Text style={s.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (notifications.length === 0 || (activeFilter === 'unread' && unreadCount === 0)) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>

        {activeFilter === 'unread' && notifications.length > 0 ? (
          <View style={s.emptyState}>
            <View style={[s.emptyIcon, { backgroundColor: colors.backgroundSoft }]}>
              <Ionicons name="thumbs-up-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={s.emptyTitle}>All Caught Up!</Text>
            <Text style={s.emptyMessage}>You have no unread notifications.</Text>
            <TouchableOpacity 
              style={s.viewAllButton}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={s.viewAllText}>View All Notifications</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.emptyState}>
            <View style={[s.emptyIcon, { backgroundColor: colors.backgroundSoft }]}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={s.emptyTitle}>No Notifications</Text>
            <Text style={s.emptyMessage}>You don't have any notifications yet.</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filters and Mark All Read */}
      <View style={s.filtersRow}>
        <View style={s.filters}>
          <TouchableOpacity 
            style={[s.filterButton, activeFilter === 'all' && s.filterButtonActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[s.filterText, activeFilter === 'all' && s.filterTextActive]}>
              All
            </Text>
            {activeFilter === 'all' && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.filterButton, activeFilter === 'unread' && s.filterButtonActive]}
            onPress={() => setActiveFilter('unread')}
          >
            <Text style={[s.filterText, activeFilter === 'unread' && s.filterTextActive]}>
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={s.markAllButton}>
            <Ionicons name="checkmark-done-outline" size={16} color={colors.brand} />
            <Text style={s.markAllText}>Mark all Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={s.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.brand}
            colors={[colors.brand]} 
          />
        }
      >
        {filteredNotifications.map((notification) => {
          const isRead = notification.isRead || notification.read;
          const notificationId = notification.id;
          
          return (
            <TouchableOpacity 
              key={notificationId} 
              style={[
                s.notificationItem,
                !isRead && s.notificationItemUnread
              ]}
              onPress={() => !isRead && handleMarkAsRead(notificationId)}
            >
              <View style={[s.notificationIcon, { backgroundColor: colors.backgroundSoft }]}>
                <Ionicons 
                  name={getNotificationIcon(notification)} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </View>

              <View style={s.notificationContent}>
                <View style={s.notificationHeader}>
                  <Text style={s.notificationTitle}>
                    {notification.title || 'Notification'}
                  </Text>
                  {!isRead && <View style={[s.unreadDot, { backgroundColor: colors.brand }]} />}
                </View>
                <Text style={s.notificationMessage}>
                  {notification.message || notification.content || notification.body || 'No message'}
                </Text>
                <View style={s.notificationTime}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={s.timeText}>
                    {formatTime(notification.createdAt || notification.timestamp)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 40 },
    loadingText: { fontSize: 16, color: c.textSecondary },
    errorText: { fontSize: 16, color: c.textSecondary, textAlign: 'center' },
    retryButton: { backgroundColor: c.brand, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, marginTop: 8 },
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 8 },
    emptyMessage: { fontSize: 15, color: c.textMuted, textAlign: 'center', marginBottom: 24 },
    viewAllButton: { backgroundColor: c.brand, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    viewAllText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    filtersRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    filters: { flexDirection: 'row', gap: 12 },
    filterButton: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 6, 
      paddingVertical: 6, 
      paddingHorizontal: 12, 
      borderRadius: 16, 
      backgroundColor: c.backgroundSoft 
    },
    filterButtonActive: { backgroundColor: c.brand },
    filterText: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
    filterTextActive: { color: '#fff' },
    filterBadge: { backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center' },
    filterBadgeText: { fontSize: 11, fontWeight: '700', color: c.brand },
    markAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    markAllText: { fontSize: 13, color: c.brand, fontWeight: '500' },
    scrollView: { flex: 1 },
    notificationItem: { 
      flexDirection: 'row', 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      gap: 12, 
      borderBottomWidth: 1, 
      borderBottomColor: c.border 
    },
    notificationItemUnread: { backgroundColor: c.backgroundSoft },
    notificationIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    notificationContent: { flex: 1 },
    notificationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    notificationTitle: { fontSize: 15, fontWeight: '600', color: c.text, flex: 1 },
    unreadDot: { width: 8, height: 8, borderRadius: 4 },
    notificationMessage: { fontSize: 13, color: c.textSecondary, lineHeight: 18, marginBottom: 8 },
    notificationTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 12, color: c.textMuted },
  });
}