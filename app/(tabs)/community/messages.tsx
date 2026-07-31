// app/(tabs)/community/messages.tsx
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getConversations,
  getMessagableTutors,
  getMessagableStudents,
  getPrivateUnreadCount,
} from '@/services/api';
import { getImageUri } from '@/utils/helpers';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://goye-platform-backend.onrender.com';
type Tab = 'inbox' | 'people';

export default function MessagesScreen() {
  const { token, user, isInstructor } = useUser();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [conversations, setConversations] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const s = makeStyles(colors);

  // Socket connection for typing indicators
  useEffect(() => {
    if (!token || !user?.id) return;
    
    const socket = io(SOCKET_URL, {
      auth: { token, userId: user.id },
      transports: ['websocket'],
    });
    
    socket.on('private:typing', (data: any) => {
      // data.userId is the person who is typing
      // data.isTyping indicates if they're typing
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (data.isTyping) {
          newMap.set(data.userId, true);
        } else {
          newMap.delete(data.userId);
        }
        return newMap;
      });
      
      // Auto-remove after 3 seconds if no update
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            if (newMap.get(data.userId) === true) {
              newMap.delete(data.userId);
            }
            return newMap;
          });
        }, 3000);
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, [token, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  const loadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchConversations(),
        fetchPeople(),
        fetchUnreadCount()
      ]);
    } catch (error) {
      console.error('loadAll error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const result = await getConversations(token);
      let convos: any[] = [];
      
      // Handle different response structures
      if (Array.isArray(result?.data?.conversations)) {
        convos = result.data.conversations;
      } else if (Array.isArray(result?.data)) {
        convos = result.data;
      } else if (Array.isArray(result)) {
        convos = result;
      }
      
      // Sort conversations by latest message time
      convos.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt || a.updatedAt || '';
        const timeB = b.lastMessage?.createdAt || b.updatedAt || '';
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
      
      setConversations(convos);
    } catch (err) {
      console.error('fetchConversations:', err);
    }
  };

  const fetchPeople = async () => {
    try {
      const fetcher = isInstructor ? getMessagableStudents : getMessagableTutors;
      const result = await fetcher(token);
      
      let list: any[] = [];
      
      // Handle the structure with today/yesterday/persons
      if (result?.data) {
        const today = Array.isArray(result.data.today) ? result.data.today : [];
        const yesterday = Array.isArray(result.data.yesterday) ? result.data.yesterday : [];
        const persons = Array.isArray(result.data.persons) ? result.data.persons : [];
        list = [...today, ...yesterday, ...persons];
      } 
      // Fallback for other structures
      else if (Array.isArray(result?.data)) {
        list = result.data;
      } 
      else if (Array.isArray(result?.data?.tutors)) {
        list = result.data.tutors;
      } 
      else if (Array.isArray(result?.data?.students)) {
        list = result.data.students;
      } 
      else if (Array.isArray(result)) {
        list = result;
      }
      
      // If still empty, try to extract from conversations as fallback
      if (list.length === 0 && conversations.length > 0) {
        const uniquePeople = new Map();
        conversations.forEach(conv => {
          const other = conv.otherUser || conv.participant || conv.user;
          if (other?.id && !uniquePeople.has(other.id)) {
            uniquePeople.set(other.id, other);
          }
        });
        list = Array.from(uniquePeople.values());
      }
      
      setPeople(list);
    } catch (err) {
      console.error('fetchPeople:', err);
      // Fallback to conversations on error
      if (conversations.length > 0) {
        const uniquePeople = new Map();
        conversations.forEach(conv => {
          const other = conv.otherUser || conv.participant || conv.user;
          if (other?.id && !uniquePeople.has(other.id)) {
            uniquePeople.set(other.id, other);
          }
        });
        setPeople(Array.from(uniquePeople.values()));
      }
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const result = await getPrivateUnreadCount(token);
      const count = result?.data?.count || result?.count || 0;
      setTotalUnread(count);
    } catch (err) {
      console.error('fetchUnreadCount:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const personName = (p: any) => {
    if (!p) return 'Unknown';
    const firstName = p?.first_name || p?.firstName || '';
    const lastName = p?.last_name || p?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || p?.name || 'Unknown';
  };

  const personAvatar = (p: any) => {
    if (!p) return null;
    const pic = p?.user_pic || p?.userPic || p?.avatar || p?.profilePic;
    return pic ? getImageUri(pic) : null;
  };

  const filteredConvos = conversations.filter(c => {
    const other = c.otherUser || c.participant || c.user;
    return personName(other).toLowerCase().includes(search.toLowerCase());
  });

  const filteredPeople = people.filter(p =>
    personName(p).toLowerCase().includes(search.toLowerCase())
  );

  const openChat = (userId: string, name: string, avatarUri: string | null) => {
    router.push({
      pathname: '/(tabs)/community/chat/[userId]' as any,
      params: { userId, name, avatarUri: avatarUri || '' },
    });
  };

  // Animated Typing Dots Component
  const TypingDots = () => {
    const [opacity1] = useState(new Animated.Value(0.3));
    const [opacity2] = useState(new Animated.Value(0.3));
    const [opacity3] = useState(new Animated.Value(0.3));

    useEffect(() => {
      const animate = () => {
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(opacity1, { toValue: 1, duration: 300, useNativeDriver: true }),
              Animated.timing(opacity2, { toValue: 1, duration: 300, useNativeDriver: true, delay: 150 }),
              Animated.timing(opacity3, { toValue: 1, duration: 300, useNativeDriver: true, delay: 300 }),
            ]),
            Animated.parallel([
              Animated.timing(opacity1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
              Animated.timing(opacity2, { toValue: 0.3, duration: 300, useNativeDriver: true, delay: 150 }),
              Animated.timing(opacity3, { toValue: 0.3, duration: 300, useNativeDriver: true, delay: 300 }),
            ]),
          ])
        ).start();
      };
      
      animate();
    }, []);

    return (
      <View style={s.typingDots}>
        <Animated.View style={[s.typingDot, { opacity: opacity1, backgroundColor: colors.brand }]} />
        <Animated.View style={[s.typingDot, { opacity: opacity2, backgroundColor: colors.brand }]} />
        <Animated.View style={[s.typingDot, { opacity: opacity3, backgroundColor: colors.brand }]} />
      </View>
    );
  };

  const AvatarCircle = ({ person, size = 48 }: { person: any; size?: number }) => {
    const avatarUrl = person.user_pic || person.userPic || person.avatar || person.profilePic;
    const uri = avatarUrl ? getImageUri(avatarUrl) : null;
    const firstName = person.first_name || person.firstName || '';
    const lastName = person.last_name || person.lastName || '';
    const name = `${firstName} ${lastName}`.trim() || person.name || 'Unknown';
    const r = size / 2;
    
    return (
      <View style={[s.avatar, { width: size, height: size, borderRadius: r }]}>
        {uri ? (
          <Image source={{ uri }} style={[StyleSheet.absoluteFill, { borderRadius: r }]} contentFit="cover" />
        ) : (
          <Text style={[s.avatarInitial, { fontSize: size * 0.38 }]}>
            {name.charAt(0).toUpperCase() || '?'}
          </Text>
        )}
      </View>
    );
  };

  const ConversationRow = ({ item }: { item: any }) => {
    const other = item.otherUser || item.participant || item.user || {};
    const name = personName(other);
    const avatarUri = personAvatar(other);
    const lastMsg = item.lastMessage?.content || item.lastMessageContent || '';
    const time = item.lastMessage?.createdAt || item.lastMessageAt || item.updatedAt || '';
    const unread = item.unreadCount || 0;
    const isDeleted = item.lastMessage?.isDeleted || false;
    const isTyping = typingUsers.get(other.id || item.userId) === true;

    return (
      <TouchableOpacity
        style={s.row}
        onPress={() => openChat(other.id || item.userId, name, avatarUri)}
        activeOpacity={0.75}
      >
        <View style={{ position: 'relative' }}>
          <AvatarCircle person={other} />
          {other.isOnline && <View style={s.onlineDot} />}
        </View>

        <View style={s.rowContent}>
          <View style={s.rowTop}>
            <Text style={[s.rowName, unread > 0 && s.rowNameBold]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={s.rowTime}>{formatTime(time)}</Text>
          </View>
          <View style={s.rowBottom}>
            {isTyping ? (
              <View style={s.typingIndicator}>
                <TypingDots />
                <Text style={[s.typingText, { color: colors.brand }]}>typing...</Text>
              </View>
            ) : (
              <Text
                style={[
                  s.rowPreview,
                  unread > 0 && s.rowPreviewBold,
                  isDeleted && s.rowPreviewDeleted
                ]}
                numberOfLines={1}
              >
                {isDeleted ? 'Message deleted' : (lastMsg || 'Start a conversation')}
              </Text>
            )}
            {unread > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadBadgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const PersonRow = ({ item }: { item: any }) => {
    const name = `${item.first_name || item.firstName || ''} ${item.last_name || item.lastName || ''}`.trim() || 
                 item.name || 'Unknown';
    const avatarUri = item.user_pic || item.userPic || item.avatar || item.profilePic;
    const finalAvatarUri = avatarUri ? getImageUri(avatarUri) : null;
    const role = item.role === 'instructor' ? 'Tutor' : 'Student';
    const lastMessage = item.lastMessage?.text;
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={s.row}
        onPress={() => openChat(item.id, name, finalAvatarUri)}
        activeOpacity={0.75}
      >
        <View style={{ position: 'relative' }}>
          <AvatarCircle person={item} />
          {item.online && <View style={s.onlineDot} />}
        </View>

        <View style={s.rowContent}>
          <View style={s.rowTop}>
            <Text style={[s.rowName, hasUnread && s.rowNameBold]} numberOfLines={1}>
              {name}
            </Text>
            <View style={[s.rolePill, { backgroundColor: colors.backgroundMuted }]}>
              <Text style={[s.rolePillText, { color: colors.textSecondary }]}>{role}</Text>
            </View>
          </View>
          <Text style={[s.rowPreview, hasUnread && s.rowPreviewBold]} numberOfLines={1}>
            {lastMessage ? (hasUnread ? `📩 ${lastMessage}` : lastMessage) : (item.online ? '🟢 Online' : 'Tap to message')}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Messages</Text>
        {totalUnread > 0 && (
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>
              {totalUnread > 99 ? '99+' : totalUnread}
            </Text>
          </View>
        )}
        <View style={{ width: 32 }} />
      </View>

      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={[s.searchInput, { color: colors.text }]}
          placeholder="Search messages or people..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.tabRow}>
        {(['inbox', 'people'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'inbox' ? 'chatbubbles-outline' : 'people-outline'}
              size={15}
              color={activeTab === tab ? colors.brand : colors.textMuted}
            />
            <Text style={[s.tabBtnText, activeTab === tab && s.tabBtnTextActive]}>
              {tab === 'inbox' ? 'Inbox' : isInstructor ? 'Students' : 'Tutors'}
            </Text>
            {tab === 'inbox' && totalUnread > 0 && (
              <View style={s.tabBadge}>
                <Text style={s.tabBadgeText}>{totalUnread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : activeTab === 'inbox' ? (
        <FlatList
          data={filteredConvos}
          keyExtractor={(item, i) => item.id || String(i)}
          renderItem={({ item }) => <ConversationRow item={item} />}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[colors.brand]} 
              tintColor={colors.brand}
            />
          }
          contentContainerStyle={filteredConvos.length === 0 ? s.emptyContainer : { paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="chatbubbles-outline" size={52} color={colors.borderMid} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>No conversations yet</Text>
              <Text style={[s.emptySubtitle, { color: colors.textMuted }]}>
                {isInstructor 
                  ? 'Message your students to start a conversation' 
                  : 'Message your tutors to get help with your courses'}
              </Text>
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: colors.brand }]}
                onPress={() => setActiveTab('people')}
              >
                <Text style={s.emptyBtnText}>
                  Find {isInstructor ? 'Students' : 'Tutors'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredPeople}
          keyExtractor={(item, i) => item.id || String(i)}
          renderItem={({ item }) => <PersonRow item={item} />}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[colors.brand]} 
              tintColor={colors.brand}
            />
          }
          contentContainerStyle={filteredPeople.length === 0 ? s.emptyContainer : { paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={52} color={colors.borderMid} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>
                No {isInstructor ? 'students' : 'tutors'} found
              </Text>
              <Text style={[s.emptySubtitle, { color: colors.textMuted }]}>
                {isInstructor
                  ? 'Students enrolled in your courses will appear here'
                  : 'Enrol in a course to message your instructors'}
              </Text>
              {conversations.length > 0 && (
                <TouchableOpacity
                  style={[s.emptyBtn, { backgroundColor: colors.backgroundMuted }]}
                  onPress={() => setActiveTab('inbox')}
                >
                  <Text style={[s.emptyBtnText, { color: colors.brand }]}>
                    View your conversations
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    headerBadge: {
      backgroundColor: c.brand,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    headerBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      backgroundColor: c.backgroundMuted,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 10,
    },
    searchInput: { flex: 1, fontSize: 14 },
    tabRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginVertical: 12,
      backgroundColor: c.backgroundMuted,
      borderRadius: 10,
      padding: 4,
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: 8,
      position: 'relative',
    },
    tabBtnActive: {
      backgroundColor: c.card,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      elevation: 2,
    },
    tabBtnText: { fontSize: 13, fontWeight: '500', color: c.textMuted },
    tabBtnTextActive: { color: c.brand, fontWeight: '600' },
    tabBadge: {
      position: 'absolute',
      top: -4,
      right: -8,
      backgroundColor: c.brand,
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    tabBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 13,
      gap: 13,
      backgroundColor: c.background,
    },
    rowContent: { flex: 1, gap: 4 },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowName: { fontSize: 15, fontWeight: '500', color: c.text, flex: 1, marginRight: 8 },
    rowNameBold: { fontWeight: '700' },
    rowTime: { fontSize: 11, color: c.textMuted },
    rowPreview: { fontSize: 13, color: c.textMuted, flex: 1 },
    rowPreviewBold: { color: c.text, fontWeight: '500' },
    rowPreviewDeleted: { fontStyle: 'italic', opacity: 0.6 },
    avatar: {
      backgroundColor: c.brandLighter,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarInitial: { fontWeight: '700', color: c.brand },
    onlineDot: {
      position: 'absolute',
      bottom: 1,
      right: 1,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#22c55e',
      borderWidth: 2,
      borderColor: c.background,
    },
    unreadBadge: {
      backgroundColor: c.brand,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
      marginLeft: 8,
    },
    unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    rolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    rolePillText: { fontSize: 11, fontWeight: '500' },
    separator: { height: 1, backgroundColor: c.border, marginLeft: 77 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyContainer: { flex: 1 },
    empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
    emptyTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
    emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
    emptyBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
    emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    typingText: {
      fontSize: 13,
      fontWeight: '500',
    },
    typingDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    typingDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
  });
}