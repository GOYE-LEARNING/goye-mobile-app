// app/(tabs)/community/chat/[userId].tsx
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getPrivateMessages,
  clearConversation,
} from '@/services/api';
import { getImageUri } from '@/utils/helpers';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://goye-platform-backend.onrender.com';

interface Message {
  id: string;
  tempId?: string;
  content: string;
  senderId: string;
  createdAt: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  delivered?: boolean;
  read?: boolean;
  replyTo?: { id: string; content: string; senderName: string; senderId: string };
}

export default function ChatRoom() {
  const { userId: otherId, name: otherName, avatarUri: otherAvatar } = useLocalSearchParams<{
    userId: string; name: string; avatarUri: string;
  }>();
  const { token, user } = useUser();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Separate timers: one for emitting stop-typing, one for auto-clearing the indicator
  const sendTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const s = makeStyles(colors);

  // Animated typing dots
  const [dot1Opacity] = useState(new Animated.Value(0.3));
  const [dot2Opacity] = useState(new Animated.Value(0.3));
  const [dot3Opacity] = useState(new Animated.Value(0.3));

  useEffect(() => {
  const checkStorage = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const user = await AsyncStorage.getItem('userData');
    console.log('[Storage] token:', token?.substring(0, 20));
    console.log('[Storage] user:', user ? JSON.parse(user)?.id : null);
  };
  checkStorage();
}, []);

  useEffect(() => {
    if (isTyping) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(dot1Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dot2Opacity, { toValue: 1, duration: 300, useNativeDriver: true, delay: 150 }),
            Animated.timing(dot3Opacity, { toValue: 1, duration: 300, useNativeDriver: true, delay: 300 }),
          ]),
          Animated.parallel([
            Animated.timing(dot1Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
            Animated.timing(dot2Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true, delay: 150 }),
            Animated.timing(dot3Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true, delay: 300 }),
          ]),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      dot1Opacity.setValue(0.3);
      dot2Opacity.setValue(0.3);
      dot3Opacity.setValue(0.3);
    }
  }, [isTyping]);

  // ─── Socket Setup ────────────────────────────────────────────────────────────
  useEffect(() => {
      console.log('[Socket] useEffect running, token:', !!token, 'userId:', user?.id);
      console.log('[Socket] token value:', token);
      console.log('[Socket] user id:', user?.id);
     if (!token || !user?.id) {
    console.log('[Socket] RETURNING EARLY - missing token or user');
    return;
  }
  console.log('[Socket] CREATING SOCKET...');

    const socket = io(SOCKET_URL, {
  transports: ['polling', 'websocket'],  // polling first like his
  reconnection: true,
  withCredentials: true,
});
console.log('[Socket] socket created:', socket);
socketRef.current = socket;
console.log('[Socket] socketRef assigned:', !!socketRef.current);

socket.on('connect', () => {
  console.log('[Chat] socket connected');
  // Send authenticate event like his web version
  socket.emit('authenticate', { token });
  socket.emit('users:online');
});

// Handle authentication response
socket.on('authenticated', (data: any) => {
  console.log('[Chat] authenticated:', data);
  if (!data.success) {
    console.error('[Chat] auth failed:', data.error);
  }
});
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Chat] socket connected, id:', socket.id);
      socket.emit('users:online');
    });

    // ── Incoming private message ──────────────────────────────────────────────
    // Backend sends: { id, content, sender: { id, ... }, receiver: { id, ... }, createdAt }
    socket.on('private:message', (data: any) => {
      const senderId = data.sender?.id || data.senderId;
      const receiverId = data.receiver?.id || data.receiverId;

      console.log('[Chat] private:message received:', {
        senderId,
        receiverId,
        otherId,
        match: String(senderId) === String(otherId),
      });

      if (String(senderId) === String(otherId) || String(receiverId) === String(otherId)) {
        const msg: Message = {
          id: data.id,
          content: data.content,
          senderId,
          createdAt: data.createdAt || new Date().toISOString(),
          delivered: true,
          isEdited: data.isEdited || false,
          replyTo: data.replyTo,
        };
        setMessages(prev => [msg, ...prev]);

        socket.emit('private:read', { messageIds: [data.id], senderId: otherId });

        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      }
    });

    // ── Sent confirmation ─────────────────────────────────────────────────────
    socket.on('private:message:sent', (data: any) => {
      console.log('[Chat] private:message:sent:', data);
      setMessages(prev => prev.map(m =>
        (m.tempId && m.tempId === data.tempId) || m.id === data.id
          ? { ...m, id: data.id, delivered: true }
          : m
      ));
    });

    // ── Message edited — matches web client event name ────────────────────────
    socket.on('private:message:updated', (data: any) => {
      console.log('[Chat] private:message:updated:', data);
      setMessages(prev => prev.map(m =>
        m.id === data.id ? { ...m, content: data.content, isEdited: true } : m
      ));
    });

    // ── Message deleted — matches web client event name ───────────────────────
    socket.on('private:message:deleted', (data: any) => {
      console.log('[Chat] private:message:deleted:', data);
      setMessages(prev => prev.map(m =>
        m.id === data.id
          ? { ...m, content: 'This message was deleted', isDeleted: true }
          : m
      ));
    });

    // ── Read receipts — matches web client event name ─────────────────────────
    socket.on('private:message:read', (data: any) => {
      setMessages(prev => prev.map(m =>
        data.messageIds?.includes(m.id) ? { ...m, read: true } : m
      ));
    });

    // ── Also handle older read event name as fallback ─────────────────────────
    socket.on('private:read', (data: any) => {
      setMessages(prev => prev.map(m =>
        data.messageIds?.includes(m.id) ? { ...m, read: true } : m
      ));
    });

    // ── Chat cleared — matches web client event name ──────────────────────────
    socket.on('private:chat:cleared', (data: any) => {
      if (String(data.with) === String(otherId)) {
        setMessages([]);
      }
    });

    // ── Typing indicator ──────────────────────────────────────────────────────
    // Backend emits: { userId: senderId, isTyping }  →  user:{receiverId}
    socket.on('private:typing', (data: any) => {
      console.log('[Chat] private:typing received:', {
        data,
        otherId,
        otherIdType: typeof otherId,
        dataUserIdType: typeof data.userId,
        match: String(data.userId) === String(otherId),
      });

      if (String(data.userId) === String(otherId)) {
        if (data.isTyping) {
          setIsTyping(true);
          // Reset the auto-clear fallback every ping
          if (clearTypingTimer.current) clearTimeout(clearTypingTimer.current);
          clearTypingTimer.current = setTimeout(() => setIsTyping(false), 3000);
        } else {
          // Explicit stop — clear immediately
          if (clearTypingTimer.current) clearTimeout(clearTypingTimer.current);
          setIsTyping(false);
        }
      }
    });

    // ── User online/offline ───────────────────────────────────────────────────
    socket.on('user:online', (data: any) => {
      if (String(data.userId) === String(otherId)) {
        setIsOnline(data.online);
        if (!data.online && data.lastSeen) setLastSeen(data.lastSeen);
      }
    });

    // ── Online users list ─────────────────────────────────────────────────────
    socket.on('users:online:list', (data: any) => {
      if (Array.isArray(data)) {
        setIsOnline(data.map(String).includes(String(otherId)));
      }
    });

    // ── Errors ────────────────────────────────────────────────────────────────
    socket.on('private:error', (data: any) => {
      console.error('[Chat] private:error:', data);
      Alert.alert('Error', data.message || 'Failed to send message');
    });

    return () => {
      if (sendTypingTimer.current) clearTimeout(sendTypingTimer.current);
      if (clearTypingTimer.current) clearTimeout(clearTypingTimer.current);
      socket.disconnect();
    };
  }, [token, user?.id, otherId]);
  console.log('[ChatRoom] token:', !!token, 'user:', user?.id);

  // ─── Load Messages ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMessages(1, false);
  }, [otherId]);

  const fetchMessages = async (p: number, append: boolean) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const result = await getPrivateMessages(token, otherId, p, 50);

      let msgs: any[] = [];
      if (Array.isArray(result?.data?.messages)) msgs = result.data.messages;
      else if (Array.isArray(result?.data)) msgs = result.data;
      else if (Array.isArray(result)) msgs = result;

      const normalised: Message[] = msgs.map((m: any) => ({
        id: m.id,
        content: m.content,
        senderId: m.sender?.id || m.senderId,
        createdAt: m.createdAt,
        isDeleted: m.isDeleted || false,
        isEdited: m.isEdited || false,
        delivered: true,
        read: !!m.readAt,
        replyTo: m.replyTo,
      }));

      const sorted = [...normalised].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (append) {
        setMessages(prev => [...prev, ...sorted]);
      } else {
        setMessages(sorted);
      }

      const pagination = result?.data?.pagination;
      setHasMore(pagination ? p < pagination.totalPages : normalised.length === 50);
      setPage(p);

      if (!append && sorted.length > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }, 100);
      }
    } catch (err) {
      console.error('[Chat] fetchMessages error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchMessages(page + 1, true);
  };

  // ─── Send / Edit ──────────────────────────────────────────────────────────────
  const handleSend = () => {
     const text = input.trim();
  console.log('[Send] socket connected:', socketRef.current?.connected);
  console.log('[Send] text:', text);
    if (!text || !socketRef.current) return;

    // Stop any pending typing emit immediately
    if (sendTypingTimer.current) clearTimeout(sendTypingTimer.current);
    socketRef.current.emit('private:typing', { receiverId: otherId, isTyping: false });

    if (editingMsg) {
      // Matches web: "private:message:updated"
      socketRef.current.emit('private:message:updated', {
        messageId: editingMsg.id,
        content: text,
      });
      setMessages(prev => prev.map(m =>
        m.id === editingMsg.id ? { ...m, content: text, isEdited: true } : m
      ));
      setEditingMsg(null);
      setInput('');
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      tempId,
      content: text,
      senderId: user?.id || '',
      createdAt: new Date().toISOString(),
      delivered: false,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content.substring(0, 80),
            senderName: replyingTo.senderId === user?.id ? 'You' : (otherName || 'Them'),
            senderId: replyingTo.senderId,
          }
        : undefined,
    };

    setMessages(prev => [tempMsg, ...prev]);

    socketRef.current.emit('private:message', {
      receiverId: otherId,
      content: text,
      replyToId: replyingTo?.id,
      tempId,
    });

    setInput('');
    setReplyingTo(null);

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  };

  // ─── Typing ───────────────────────────────────────────────────────────────────
  const handleInputChange = (text: string) => {
    setInput(text);
    if (!socketRef.current) return;

    socketRef.current.emit('private:typing', { receiverId: otherId, isTyping: true });

    if (sendTypingTimer.current) clearTimeout(sendTypingTimer.current);
    sendTypingTimer.current = setTimeout(() => {
      socketRef.current?.emit('private:typing', { receiverId: otherId, isTyping: false });
    }, 1500);
  };

  // ─── Message Actions ──────────────────────────────────────────────────────────
  const handleLongPress = (msg: Message) => {
    setSelectedMsg(msg);
    setMenuVisible(true);
  };

  const handleEdit = () => {
    if (!selectedMsg || selectedMsg.isDeleted) return;
    setEditingMsg(selectedMsg);
    setInput(selectedMsg.content);
    setMenuVisible(false);
    setSelectedMsg(null);
  };

  const handleDelete = () => {
    if (!selectedMsg) return;
    Alert.alert('Delete Message', 'Delete this message for everyone?', [
      { text: 'Cancel', style: 'cancel', onPress: () => setMenuVisible(false) },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          setMenuVisible(false);
          // Matches web: "private:message:delete"
          socketRef.current?.emit('private:message:delete', { messageId: selectedMsg.id });
          setMessages(prev => prev.map(m =>
            m.id === selectedMsg.id
              ? { ...m, content: 'This message was deleted', isDeleted: true }
              : m
          ));
          setSelectedMsg(null);
        },
      },
    ]);
  };

  const handleReply = () => {
    if (!selectedMsg) return;
    setReplyingTo(selectedMsg);
    setMenuVisible(false);
    setSelectedMsg(null);
  };

  const handleClearChat = () => {
    Alert.alert('Clear Chat', `Clear all messages with ${otherName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          try {
            await clearConversation(token, otherId);
            // Matches web: "private:clear"
            socketRef.current?.emit('private:clear', { receiverId: otherId });
            setMessages([]);
          } catch {
            Alert.alert('Error', 'Failed to clear chat');
          }
        },
      },
    ]);
  };

  // ─── Formatters ───────────────────────────────────────────────────────────────
  const formatTime = (str: string) => {
    if (!str) return '';
    const d = new Date(str);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Now';
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const formatLastSeen = (str: string) => {
    if (!str) return 'Offline';
    const d = new Date(str);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Last seen just now';
    if (diff < 3600000) return `Last seen ${Math.floor(diff / 60000)}m ago`;
    return `Last seen ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // ─── Render Message ───────────────────────────────────────────────────────────
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = String(item.senderId) === String(user?.id);
    const prevItem = messages[index + 1];
    const showTime = !prevItem ||
      new Date(item.createdAt).getTime() - new Date(prevItem.createdAt).getTime() > 300000;

    return (
      <View style={[s.msgWrapper, isMine ? s.msgWrapperRight : s.msgWrapperLeft]}>
        {item.replyTo && !item.isDeleted && (
          <View style={[s.replyPreview, isMine ? s.replyPreviewRight : s.replyPreviewLeft]}>
            <Ionicons
              name="return-down-forward"
              size={12}
              color={isMine ? 'rgba(255,255,255,0.7)' : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.replyPreviewName, { color: isMine ? 'rgba(255,255,255,0.8)' : colors.brand }]}>
                {item.replyTo.senderName}
              </Text>
              <Text
                style={[s.replyPreviewText, { color: isMine ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}
                numberOfLines={1}
              >
                {item.replyTo.content}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            s.bubble,
            isMine ? s.bubbleMine : s.bubbleOther,
            { backgroundColor: isMine ? colors.brand : colors.card },
            selectedMsg?.id === item.id && s.bubbleSelected,
          ]}
          onLongPress={() => handleLongPress(item)}
          activeOpacity={0.85}
        >
          {item.isDeleted ? (
            <Text style={[s.bubbleTextDeleted, { color: isMine ? 'rgba(255,255,255,0.5)' : colors.textMuted }]}>
              This message was deleted
            </Text>
          ) : (
            <Text style={[s.bubbleText, { color: isMine ? '#fff' : colors.text }]}>
              {item.content}
              {item.isEdited && (
                <Text style={{ opacity: 0.6, fontSize: 11 }}>{' '}(edited)</Text>
              )}
            </Text>
          )}
        </TouchableOpacity>

        <View style={s.messageFooter}>
          {showTime && (
            <Text style={[s.timeText, { color: colors.textMuted }]}>
              {formatTime(item.createdAt)}
            </Text>
          )}
          {isMine && (
            <View style={s.statusRow}>
              {!item.delivered ? (
                <Ionicons name="checkmark" size={12} color={colors.textMuted} />
              ) : item.read ? (
                <Ionicons name="checkmark-done" size={12} color={colors.brand} />
              ) : (
                <Ionicons name="checkmark-done" size={12} color={colors.textMuted} />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const avatarUri = otherAvatar ? getImageUri(otherAvatar) : null;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={[s.headerAvatar, { backgroundColor: colors.brandLighter }]}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                borderRadius={20}
              />
            ) : (
              <Text style={[s.headerAvatarInitial, { color: colors.brand }]}>
                {otherName?.charAt(0).toUpperCase() || '?'}
              </Text>
            )}
            {isOnline && <View style={[s.onlineDot, { borderColor: colors.background }]} />}
          </View>
          <View>
            <Text style={[s.headerName, { color: colors.text }]} numberOfLines={1}>
              {otherName}
            </Text>
            {/* typing... replaces the online/last-seen status, same as WhatsApp */}
            <Text style={[
              s.headerStatus,
              { color: isTyping ? colors.brand : isOnline ? '#22c55e' : colors.textMuted },
            ]}>
              {isTyping ? 'typing...' : isOnline ? 'Online' : formatLastSeen(lastSeen)}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleClearChat} style={s.headerMenu}>
          <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, i) => item.id || String(i)}
            renderItem={renderMessage}
            inverted
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
            ListFooterComponent={loadingMore 
              ? <ActivityIndicator color={colors.brand} style={{ paddingVertical: 12 }} />
              : null
            }
            ListEmptyComponent={
              <View style={s.emptyChat}>
                <Text style={[s.emptyChatText, { color: colors.textMuted }]}>
                  Say hi to {otherName}! 👋
                </Text>
              </View>
            }
          />
        )}

        {/* Typing indicator bubble */}
        {isTyping && (
          <View style={[s.typingBar, { backgroundColor: colors.backgroundMuted }]}>
            <View style={s.typingDots}>
              <Animated.View style={[s.typingDot, { opacity: dot1Opacity, backgroundColor: colors.textMuted }]} />
              <Animated.View style={[s.typingDot, { opacity: dot2Opacity, backgroundColor: colors.textMuted }]} />
              <Animated.View style={[s.typingDot, { opacity: dot3Opacity, backgroundColor: colors.textMuted }]} />
            </View>
            <Text style={[s.typingText, { color: colors.textMuted }]}>
              {otherName} is typing...
            </Text>
          </View>
        )}

        {/* Reply bar */}
        {replyingTo && (
          <View style={[s.replyBar, { backgroundColor: colors.backgroundMuted, borderTopColor: colors.border }]}>
            <View style={[s.replyBarAccent, { backgroundColor: colors.brand }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.replyBarName, { color: colors.brand }]}>
                Replying to {replyingTo.senderId === user?.id ? 'yourself' : otherName}
              </Text>
              <Text style={[s.replyBarContent, { color: colors.textSecondary }]} numberOfLines={1}>
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setReplyingTo(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Edit bar */}
        {editingMsg && (
          <View style={[s.replyBar, { backgroundColor: colors.backgroundMuted, borderTopColor: colors.border }]}>
            <View style={[s.replyBarAccent, { backgroundColor: '#F59E0B' }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.replyBarName, { color: '#F59E0B' }]}>Editing message</Text>
              <Text style={[s.replyBarContent, { color: colors.textSecondary }]} numberOfLines={1}>
                {editingMsg.content}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { setEditingMsg(null); setInput(''); }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View style={[s.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TextInput
            style={[s.input, { backgroundColor: colors.backgroundMuted, color: colors.text }]}
            placeholder={`Message ${otherName || ''}…`}
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={handleInputChange}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: input.trim() ? colors.brand : colors.backgroundMuted }]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Ionicons
              name={editingMsg ? 'checkmark' : 'send'}
              size={18}
              color={input.trim() ? '#fff' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Long-press context menu */}
      {menuVisible && selectedMsg && (
        <TouchableOpacity
          style={s.menuOverlay}
          activeOpacity={1}
          onPress={() => { setMenuVisible(false); setSelectedMsg(null); }}
        >
          <View style={[s.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={s.menuItem} onPress={handleReply}>
              <Ionicons name="return-down-forward-outline" size={18} color={colors.text} />
              <Text style={[s.menuItemText, { color: colors.text }]}>Reply</Text>
            </TouchableOpacity>
            {String(selectedMsg.senderId) === String(user?.id) && !selectedMsg.isDeleted && (
              <TouchableOpacity style={s.menuItem} onPress={handleEdit}>
                <Ionicons name="pencil-outline" size={18} color={colors.text} />
                <Text style={[s.menuItemText, { color: colors.text }]}>Edit</Text>
              </TouchableOpacity>
            )}
            {String(selectedMsg.senderId) === String(user?.id) && (
              <TouchableOpacity style={s.menuItem} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color="#E53E3E" />
                <Text style={[s.menuItemText, { color: '#E53E3E' }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      gap: 10,
    },
    backBtn: { padding: 4 },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    },
    headerAvatarInitial: { fontSize: 16, fontWeight: '700' },
    headerName: { fontSize: 15, fontWeight: '600', maxWidth: 180 },
    headerStatus: { fontSize: 11, marginTop: 1 },
    headerMenu: { padding: 6 },
    onlineDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: '#22c55e',
      borderWidth: 2,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    msgWrapper: { marginVertical: 2 },
    msgWrapperRight: { alignItems: 'flex-end' },
    msgWrapperLeft: { alignItems: 'flex-start' },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
      marginHorizontal: 8,
    },
    timeText: { fontSize: 10 },
    replyPreview: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      marginBottom: 2,
      maxWidth: '80%',
    },
    replyPreviewRight: { backgroundColor: 'rgba(0,0,0,0.15)', alignSelf: 'flex-end' },
    replyPreviewLeft: { backgroundColor: 'rgba(0,0,0,0.06)', alignSelf: 'flex-start' },
    replyPreviewName: { fontSize: 11, fontWeight: '600' },
    replyPreviewText: { fontSize: 12 },
    bubble: {
      maxWidth: '78%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
    },
    bubbleMine: { borderBottomRightRadius: 4 },
    bubbleOther: { borderBottomLeftRadius: 4 },
    bubbleSelected: { opacity: 0.75 },
    bubbleText: { fontSize: 15, lineHeight: 21 },
    bubbleTextDeleted: { fontSize: 14, fontStyle: 'italic' },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    typingBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 20,
      alignSelf: 'flex-start',
      gap: 8,
    },
    typingText: { fontSize: 12, fontStyle: 'italic' },
    typingDots: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    typingDot: { width: 4, height: 4, borderRadius: 2 },
    replyBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: 1,
      gap: 10,
    },
    replyBarAccent: { width: 3, height: '100%', borderRadius: 2, minHeight: 32 },
    replyBarName: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
    replyBarContent: { fontSize: 13 },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      gap: 8,
    },
    input: {
      flex: 1,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      maxHeight: 120,
    },
    sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyChatText: { fontSize: 15 },
    menuOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    menu: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', minWidth: 180 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
    menuItemText: { fontSize: 15, fontWeight: '500' },
  });
}
