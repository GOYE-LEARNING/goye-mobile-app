// app/(tabs)/community/chat/[userId].tsx
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getPrivateMessages,
  clearConversation,
} from "@/services/api";
import { getImageUri } from "@/utils/helpers";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://goye-platform-backend.onrender.com";

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
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
    senderId: string;
  };
}

export default function ChatRoom() {
  const {
    userId: otherId,
    name: otherName,
    avatarUri: otherAvatar,
  } = useLocalSearchParams<{
    userId: string;
    name: string;
    avatarUri: string;
  }>();
  const { token, user } = useUser();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [socketReady, setSocketReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const isMountedRef = useRef(true);
  const authTokenRef = useRef<string | null>(null);
  const isSocketSetupRef = useRef(false);

  // Separate timers
  const sendTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const s = makeStyles(colors);

  // Animated typing dots
  const [dot1Opacity] = useState(new Animated.Value(0.3));
  const [dot2Opacity] = useState(new Animated.Value(0.3));
  const [dot3Opacity] = useState(new Animated.Value(0.3));

  useEffect(() => {
    if (isTyping) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(dot1Opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
              delay: 150,
            }),
            Animated.timing(dot3Opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
              delay: 300,
            }),
          ]),
          Animated.parallel([
            Animated.timing(dot1Opacity, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Opacity, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
              delay: 150,
            }),
            Animated.timing(dot3Opacity, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
              delay: 300,
            }),
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

  // ─── Fetch Socket Token ──────────────────────────────────────────────────────
  const fetchSocketToken = async (): Promise<string | null> => {
    try {
      console.log("[Socket] 🔑 Fetching socket token...");

      // Option 1: Try to get a dedicated socket token from the API
      const API_URL = "https://goye-platform-backend.onrender.com";
      const response = await fetch(`${API_URL}/api/user/socket-token`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          console.log("[Socket] ✅ Got dedicated socket token");
          return data.token;
        }
      } else {
        console.log("[Socket] ⚠️ Socket token endpoint failed, using REST token");
      }
    } catch (error) {
      console.log("[Socket] ⚠️ Error fetching socket token:", error);
    }

    // Option 2: Fallback to the REST token
    console.log("[Socket] Using REST token as fallback");
    return token || null;
  };

  // ─── Socket Setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log("[Socket] useEffect running");
    console.log(
      "[Socket] token from context:",
      token ? `${token.substring(0, 20)}...` : "null"
    );
    console.log("[Socket] user:", user?.id);

    if (!token || !user?.id) {
      console.log("[Socket] RETURNING - missing token or user");
      return;
    }

    // Prevent multiple socket setups
    if (isSocketSetupRef.current) {
      console.log("[Socket] Socket already set up, skipping");
      return;
    }

    // Store token for later use
    authTokenRef.current = token;

    // Clean up existing socket
    if (socketRef.current) {
      console.log("[Socket] Disconnecting existing socket");
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log("[Socket] CREATING SOCKET...");
    setSocketReady(false);
    setIsAuthenticated(false);
    setAuthError(false);

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;
    isSocketSetupRef.current = true;
    console.log("[Socket] Socket created");

    // ─── Connection events ──────────────────────────────────────────────────────

    socket.on("connect", () => {
      if (!isMountedRef.current) return;

      console.log("[Chat] ✅ socket connected, id:", socket.id);
      console.log("[Chat] Socket ref matches:", socketRef.current === socket);

      // 🔑 Send authenticate event immediately after connect
      console.log("[Chat] 🔐 Sending authenticate event...");

      fetchSocketToken().then((socketToken) => {
        if (socketToken && isMountedRef.current && socket.connected) {
          console.log("[Chat] Sending authenticate with token");
          socket.emit("authenticate", { token: socketToken });
        } else if (isMountedRef.current && socket.connected) {
          console.log("[Chat] Sending authenticate with REST token");
          socket.emit("authenticate", { token: authTokenRef.current });
        }
      });

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    });

    socket.on("connect_error", (err) => {
      if (!isMountedRef.current) return;

      console.log("[Chat] ❌ connect_error:", err.message);
      setSocketReady(false);
      setIsAuthenticated(false);

      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (socketRef.current && !socketRef.current.connected && isMountedRef.current) {
          console.log("[Chat] Reconnecting after error...");
          socketRef.current.connect();
        }
      }, 3000);
    });

    socket.on("disconnect", (reason) => {
      if (!isMountedRef.current) return;

      console.log("[Chat] 🔌 socket disconnected:", reason);
      setSocketReady(false);
      setIsAuthenticated(false);

      if (
        reason === "io server disconnect" ||
        reason === "transport close" ||
        reason === "ping timeout"
      ) {
        console.log("[Chat] Will attempt to reconnect");
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          if (socketRef.current && !socketRef.current.connected && isMountedRef.current) {
            console.log("[Chat] Attempting reconnect...");
            socketRef.current.connect();
          }
        }, 1000);
      }
    });

    socket.on("reconnect_attempt", (attempt) => {
      if (!isMountedRef.current) return;
      console.log("[Chat] 🔄 reconnect attempt:", attempt);
      setSocketReady(false);
      setIsAuthenticated(false);
    });

    socket.on("reconnect", (attempt) => {
      if (!isMountedRef.current) return;
      console.log("[Chat] ✅ reconnected after", attempt, "attempts");

      if (authTokenRef.current) {
        console.log("[Chat] 🔐 Sending authenticate after reconnect...");
        fetchSocketToken().then((socketToken) => {
          if (socketToken && isMountedRef.current && socket.connected) {
            socket.emit("authenticate", { token: socketToken });
          } else if (isMountedRef.current && socket.connected) {
            socket.emit("authenticate", { token: authTokenRef.current });
          }
        });
      }
    });

    // ─── Authentication response ──────────────────────────────────────────────

    socket.off("authenticated");
    socket.on("authenticated", (data: any) => {
      if (!isMountedRef.current) return;

      console.log("[Chat] 🔐 authenticated event received:", data);

      if (data.success) {
        console.log("[Chat] ✅ Socket authenticated for user:", data.userId);
        setIsAuthenticated(true);
        setSocketReady(true);
        setAuthError(false);

        setTimeout(() => {
          if (socket.connected && isMountedRef.current) {
            console.log("[Chat] Emitting users:online");
            socket.emit("users:online");

            console.log("[Chat] Fetching messages after authentication");
            fetchMessages(1, false);
          }
        }, 300);
      } else {
        console.error("[Chat] ❌ Socket authentication failed:", data.error);
        setIsAuthenticated(false);
        setSocketReady(false);
        setAuthError(true);

        if (authTokenRef.current) {
          setTimeout(() => {
            if (socket.connected && isMountedRef.current) {
              console.log("[Chat] 🔐 Retrying authentication with REST token...");
              socket.emit("authenticate", { token: authTokenRef.current });
            }
          }, 2000);
        }
      }
    });

    socket.off("auth_timeout");
    socket.on("auth_timeout", (data: any) => {
      if (!isMountedRef.current) return;

      console.error("[Chat] ⏰ Authentication timeout:", data);
      setIsAuthenticated(false);
      setSocketReady(false);
      setAuthError(true);

      setTimeout(() => {
        if (socket.connected && isMountedRef.current && authTokenRef.current) {
          console.log("[Chat] 🔐 Retrying authentication after timeout...");
          socket.emit("authenticate", { token: authTokenRef.current });
        }
      }, 2000);
    });

    // ─── Incoming private message ──────────────────────────────────────────────
    socket.off("private:message");
    socket.on("private:message", (data: any) => {
      if (!isMountedRef.current) return;

      const senderId = data.sender?.id || data.senderId;
      const receiverId = data.receiver?.id || data.receiverId;

      console.log("[Chat] 📩 private:message received:", {
        senderId,
        receiverId,
        otherId,
        match: String(senderId) === String(otherId),
        messageId: data.id,
      });

      if (String(senderId) === String(otherId) || String(receiverId) === String(otherId)) {
        // Check if message already exists to prevent duplicates
        setMessages((prev) => {
          // Check if message already exists in the list
          const exists = prev.some((m) => m.id === data.id);
          if (exists) {
            console.log("[Chat] ⚠️ Duplicate message detected, skipping:", data.id);
            return prev;
          }

          const msg: Message = {
            id: data.id,
            content: data.content,
            senderId,
            createdAt: data.createdAt || new Date().toISOString(),
            delivered: true,
            isEdited: data.isEdited || false,
            replyTo: data.replyTo,
          };
          console.log("[Chat] ✅ Adding new message:", data.id);
          return [msg, ...prev];
        });

        // Send read receipt
        if (socket.connected && isAuthenticated) {
          socket.emit("private:read", { messageIds: [data.id], senderId: otherId });
        }

        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      }
    });

    // ─── Sent confirmation ─────────────────────────────────────────────────────
    socket.off("private:message:sent");
    socket.on("private:message:sent", (data: any) => {
      if (!isMountedRef.current) return;
      console.log("[Chat] ✅ private:message:sent:", data.id);
      setMessages((prev) =>
        prev.map((m) =>
          (m.tempId && m.tempId === data.tempId) || m.id === data.id
            ? { ...m, id: data.id, delivered: true }
            : m
        )
      );
    });

    // ─── Message edited ────────────────────────────────────────────────────────
    socket.off("private:message:updated");
    socket.on("private:message:updated", (data: any) => {
      if (!isMountedRef.current) return;
      console.log("[Chat] ✏️ private:message:updated:", data.id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.id ? { ...m, content: data.content, isEdited: true } : m
        )
      );
    });

    // ─── Message deleted ───────────────────────────────────────────────────────
    socket.off("private:message:deleted");
    socket.on("private:message:deleted", (data: any) => {
      if (!isMountedRef.current) return;
      console.log("[Chat] 🗑️ private:message:deleted:", data.id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.id
            ? { ...m, content: "This message was deleted", isDeleted: true }
            : m
        )
      );
    });

    // ─── Read receipts ─────────────────────────────────────────────────────────
    socket.off("private:message:read");
    socket.on("private:message:read", (data: any) => {
      if (!isMountedRef.current) return;
      setMessages((prev) =>
        prev.map((m) =>
          data.messageIds?.includes(m.id) ? { ...m, read: true } : m
        )
      );
    });

    socket.off("private:read");
    socket.on("private:read", (data: any) => {
      if (!isMountedRef.current) return;
      setMessages((prev) =>
        prev.map((m) =>
          data.messageIds?.includes(m.id) ? { ...m, read: true } : m
        )
      );
    });

    // ─── Chat cleared ──────────────────────────────────────────────────────────
    socket.off("private:chat:cleared");
    socket.on("private:chat:cleared", (data: any) => {
      if (!isMountedRef.current) return;
      if (String(data.with) === String(otherId)) {
        setMessages([]);
      }
    });

    // ─── Typing indicator ──────────────────────────────────────────────────────
    socket.off("private:typing");
    socket.on("private:typing", (data: any) => {
      if (!isMountedRef.current) return;

      console.log("[Chat] ⌨️ private:typing received:", {
        data,
        otherId,
        match: String(data.userId) === String(otherId),
      });

      if (String(data.userId) === String(otherId)) {
        if (data.isTyping) {
          setIsTyping(true);
          if (clearTypingTimer.current) clearTimeout(clearTypingTimer.current);
          clearTypingTimer.current = setTimeout(() => setIsTyping(false), 3000);
        } else {
          if (clearTypingTimer.current) clearTimeout(clearTypingTimer.current);
          setIsTyping(false);
        }
      }
    });

    // ─── User online/offline ───────────────────────────────────────────────────
    socket.off("user:online");
    socket.on("user:online", (data: any) => {
      if (!isMountedRef.current) return;
      if (String(data.userId) === String(otherId)) {
        console.log("[Chat] 👤 user:online:", data);
        setIsOnline(data.online);
        if (!data.online && data.lastSeen) setLastSeen(data.lastSeen);
      }
    });

    // ─── Online users list ─────────────────────────────────────────────────────
    socket.off("users:online:list");
    socket.on("users:online:list", (data: any) => {
      if (!isMountedRef.current) return;
      if (Array.isArray(data)) {
        const isUserOnline = data.map(String).includes(String(otherId));
        console.log("[Chat] 📋 users:online:list - user online:", isUserOnline);
        setIsOnline(isUserOnline);
      }
    });

    // ─── Errors ────────────────────────────────────────────────────────────────
    socket.off("private:error");
    socket.on("private:error", (data: any) => {
      if (!isMountedRef.current) return;
      console.error("[Chat] ❌ private:error:", data);

      if (data.message && data.message.includes("Not authenticated")) {
        setIsAuthenticated(false);
        setSocketReady(false);
        setAuthError(true);
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please log out and log in again.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", data.message || "Failed to send message");
      }
    });

    // ─── Cleanup ────────────────────────────────────────────────────────────────

    return () => {
      console.log("[Chat] 🧹 Cleaning up socket...");
      isMountedRef.current = false;
      isSocketSetupRef.current = false;

      if (sendTypingTimer.current) clearTimeout(sendTypingTimer.current);
      if (clearTypingTimer.current) clearTimeout(clearTypingTimer.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, user?.id, otherId]);

  // ─── Load Messages ────────────────────────────────────────────────────────────

  const fetchMessages = async (p: number, append: boolean) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      console.log("[Chat] Fetching messages, page:", p, "append:", append);
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

      const sorted = [...normalised].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (append) {
        setMessages((prev) => [...prev, ...sorted]);
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
      console.error("[Chat] fetchMessages error:", err);
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
    const socket = socketRef.current;

    console.log("[Send] ========== SEND ATTEMPT ==========");
    console.log("[Send] socket exists:", !!socket);
    console.log("[Send] socket.connected:", socket?.connected);
    console.log("[Send] socketReady (authenticated):", socketReady);
    console.log("[Send] isAuthenticated:", isAuthenticated);
    console.log("[Send] text:", text);

    if (!text) return;

    // ⚠️ CRITICAL: Check socketReady (authenticated), not just socket.connected
    if (!socket || !socket.connected || !socketReady) {
      console.log(
        "[Send] ❌ Not ready - socket connected:",
        socket?.connected,
        "authenticated:",
        socketReady
      );

      if (!socketReady) {
        Alert.alert("Authenticating", "Please wait while we authenticate...", [
          { text: "OK" },
        ]);
        // Try to re-authenticate
        if (socket?.connected && authTokenRef.current) {
          fetchSocketToken().then((socketToken) => {
            if (socketToken && socket.connected) {
              socket.emit("authenticate", { token: socketToken });
            } else if (authTokenRef.current && socket.connected) {
              socket.emit("authenticate", { token: authTokenRef.current });
            }
          });
        }
      } else {
        Alert.alert("Reconnecting", "Please wait a moment and try again.");
        if (socket) {
          socket.connect();
        }
      }
      return;
    }

    // Stop typing
    if (sendTypingTimer.current) clearTimeout(sendTypingTimer.current);
    socket.emit("private:typing", { receiverId: otherId, isTyping: false });

    if (editingMsg) {
      console.log("[Send] ✏️ Editing message:", editingMsg.id);
      socket.emit("private:message:updated", {
        messageId: editingMsg.id,
        content: text,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMsg.id ? { ...m, content: text, isEdited: true } : m
        )
      );
      setEditingMsg(null);
      setInput("");
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      tempId,
      content: text,
      senderId: user?.id || "",
      createdAt: new Date().toISOString(),
      delivered: false,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content.substring(0, 80),
            senderName: replyingTo.senderId === user?.id ? "You" : (otherName || "Them"),
            senderId: replyingTo.senderId,
          }
        : undefined,
    };

    console.log("[Send] 📤 Emitting private:message with tempId:", tempId);
    setMessages((prev) => [tempMsg, ...prev]);

    socket.emit("private:message", {
      receiverId: otherId,
      content: text,
      replyToId: replyingTo?.id,
      tempId,
    });

    setInput("");
    setReplyingTo(null);

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  };

  // ─── Typing ───────────────────────────────────────────────────────────────────

  const handleInputChange = (text: string) => {
    setInput(text);
    const socket = socketRef.current;
    if (!socket || !socket.connected || !socketReady) return;

    socket.emit("private:typing", { receiverId: otherId, isTyping: true });

    if (sendTypingTimer.current) clearTimeout(sendTypingTimer.current);
    sendTypingTimer.current = setTimeout(() => {
      if (socketRef.current && socketRef.current.connected && socketReady) {
        socketRef.current.emit("private:typing", {
          receiverId: otherId,
          isTyping: false,
        });
      }
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
    Alert.alert("Delete Message", "Delete this message for everyone?", [
      { text: "Cancel", style: "cancel", onPress: () => setMenuVisible(false) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setMenuVisible(false);
          socketRef.current?.emit("private:message:delete", {
            messageId: selectedMsg.id,
          });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === selectedMsg.id
                ? { ...m, content: "This message was deleted", isDeleted: true }
                : m
            )
          );
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
    Alert.alert("Clear Chat", `Clear all messages with ${otherName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await clearConversation(token, otherId);
            socketRef.current?.emit("private:clear", { receiverId: otherId });
            setMessages([]);
          } catch {
            Alert.alert("Error", "Failed to clear chat");
          }
        },
      },
    ]);
  };

  // ─── Formatters ───────────────────────────────────────────────────────────────

  const formatTime = (str: string) => {
    if (!str) return "";
    const d = new Date(str);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Now";
    if (diff < 86400000)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const formatLastSeen = (str: string) => {
    if (!str) return "Offline";
    const d = new Date(str);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Last seen just now";
    if (diff < 3600000) return `Last seen ${Math.floor(diff / 60000)}m ago`;
    return `Last seen ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // ─── Render Message ───────────────────────────────────────────────────────────

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = String(item.senderId) === String(user?.id);
    const prevItem = messages[index + 1];
    const showTime =
      !prevItem ||
      new Date(item.createdAt).getTime() -
        new Date(prevItem.createdAt).getTime() >
        300000;

    return (
      <View style={[s.msgWrapper, isMine ? s.msgWrapperRight : s.msgWrapperLeft]}>
        {item.replyTo && !item.isDeleted && (
          <View
            style={[
              s.replyPreview,
              isMine ? s.replyPreviewRight : s.replyPreviewLeft,
            ]}
          >
            <Ionicons
              name="return-down-forward"
              size={12}
              color={isMine ? "rgba(255,255,255,0.7)" : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  s.replyPreviewName,
                  { color: isMine ? "rgba(255,255,255,0.8)" : colors.brand },
                ]}
              >
                {item.replyTo.senderName}
              </Text>
              <Text
                style={[
                  s.replyPreviewText,
                  { color: isMine ? "rgba(255,255,255,0.6)" : colors.textMuted },
                ]}
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
            <Text
              style={[
                s.bubbleTextDeleted,
                { color: isMine ? "rgba(255,255,255,0.5)" : colors.textMuted },
              ]}
            >
              This message was deleted
            </Text>
          ) : (
            <Text style={[s.bubbleText, { color: isMine ? "#fff" : colors.text }]}>
              {item.content}
              {item.isEdited && (
                <Text style={{ opacity: 0.6, fontSize: 11 }}> (edited)</Text>
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
                <Ionicons
                  name="checkmark-done"
                  size={12}
                  color={colors.textMuted}
                />
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
    <SafeAreaView
      style={[s.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View
            style={[s.headerAvatar, { backgroundColor: colors.brandLighter }]}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                contentFit="cover"
              />
            ) : (
              <Text style={[s.headerAvatarInitial, { color: colors.brand }]}>
                {otherName?.charAt(0).toUpperCase() || "?"}
              </Text>
            )}
            {isOnline && isAuthenticated && (
              <View style={[s.onlineDot, { borderColor: colors.background }]} />
            )}
          </View>
          <View>
            <Text style={[s.headerName, { color: colors.text }]} numberOfLines={1}>
              {otherName}
            </Text>
            <Text
              style={[
                s.headerStatus,
                {
                  color: authError
                    ? "#ef4444"
                    : !isAuthenticated
                    ? "#f59e0b"
                    : isTyping
                    ? colors.brand
                    : isOnline
                    ? "#22c55e"
                    : colors.textMuted,
                },
              ]}
            >
              {authError
                ? "Auth Error - Re-login"
                : !isAuthenticated
                ? "Authenticating..."
                : isTyping
                ? "typing..."
                : isOnline
                ? "Online"
                : formatLastSeen(lastSeen)}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleClearChat} style={s.headerMenu}>
          <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
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
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color={colors.brand} style={{ paddingVertical: 12 }} />
              ) : null
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
        {isTyping && isAuthenticated && (
          <View style={[s.typingBar, { backgroundColor: colors.backgroundMuted }]}>
            <View style={s.typingDots}>
              <Animated.View
                style={[
                  s.typingDot,
                  { opacity: dot1Opacity, backgroundColor: colors.textMuted },
                ]}
              />
              <Animated.View
                style={[
                  s.typingDot,
                  { opacity: dot2Opacity, backgroundColor: colors.textMuted },
                ]}
              />
              <Animated.View
                style={[
                  s.typingDot,
                  { opacity: dot3Opacity, backgroundColor: colors.textMuted },
                ]}
              />
            </View>
            <Text style={[s.typingText, { color: colors.textMuted }]}>
              {otherName} is typing...
            </Text>
          </View>
        )}

        {/* Auth error banner */}
        {authError && (
          <View style={[s.authErrorBanner, { backgroundColor: "#fee2e2" }]}>
            <Ionicons name="alert-circle" size={16} color="#dc2626" />
            <Text style={[s.authErrorText, { color: "#dc2626" }]}>
              Authentication failed. Please log out and log in again.
            </Text>
          </View>
        )}

        {/* Reply bar */}
        {replyingTo && (
          <View
            style={[
              s.replyBar,
              {
                backgroundColor: colors.backgroundMuted,
                borderTopColor: colors.border,
              },
            ]}
          >
            <View style={[s.replyBarAccent, { backgroundColor: colors.brand }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.replyBarName, { color: colors.brand }]}>
                Replying to {replyingTo.senderId === user?.id ? "yourself" : otherName}
              </Text>
              <Text
                style={[s.replyBarContent, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
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
          <View
            style={[
              s.replyBar,
              {
                backgroundColor: colors.backgroundMuted,
                borderTopColor: colors.border,
              },
            ]}
          >
            <View style={[s.replyBarAccent, { backgroundColor: "#F59E0B" }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.replyBarName, { color: "#F59E0B" }]}>
                Editing message
              </Text>
              <Text
                style={[s.replyBarContent, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {editingMsg.content}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditingMsg(null);
                setInput("");
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View
          style={[
            s.inputBar,
            { borderTopColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <TextInput
            style={[
              s.input,
              {
                backgroundColor: colors.backgroundMuted,
                color: colors.text,
                opacity: !isAuthenticated || authError ? 0.5 : 1,
              },
            ]}
            placeholder={
              !isAuthenticated
                ? "Authenticating..."
                : authError
                ? "Auth Error - Re-login"
                : `Message ${otherName || ""}…`
            }
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={handleInputChange}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={isAuthenticated && !authError}
          />
          <TouchableOpacity
            style={[
              s.sendBtn,
              {
                backgroundColor:
                  input.trim() && isAuthenticated && !authError
                    ? colors.brand
                    : colors.backgroundMuted,
              },
            ]}
            onPress={handleSend}
            disabled={!input.trim() || !isAuthenticated || authError}
          >
            <Ionicons
              name={editingMsg ? "checkmark" : "send"}
              size={18}
              color={
                input.trim() && isAuthenticated && !authError
                  ? "#fff"
                  : colors.textMuted
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Long-press context menu */}
      {menuVisible && selectedMsg && (
        <TouchableOpacity
          style={s.menuOverlay}
          activeOpacity={1}
          onPress={() => {
            setMenuVisible(false);
            setSelectedMsg(null);
          }}
        >
          <View
            style={[
              s.menu,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity style={s.menuItem} onPress={handleReply}>
              <Ionicons name="return-down-forward-outline" size={18} color={colors.text} />
              <Text style={[s.menuItemText, { color: colors.text }]}>Reply</Text>
            </TouchableOpacity>
            {String(selectedMsg.senderId) === String(user?.id) &&
              !selectedMsg.isDeleted && (
                <TouchableOpacity style={s.menuItem} onPress={handleEdit}>
                  <Ionicons name="pencil-outline" size={18} color={colors.text} />
                  <Text style={[s.menuItemText, { color: colors.text }]}>Edit</Text>
                </TouchableOpacity>
              )}
            {String(selectedMsg.senderId) === String(user?.id) && (
              <TouchableOpacity style={s.menuItem} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color="#E53E3E" />
                <Text style={[s.menuItemText, { color: "#E53E3E" }]}>Delete</Text>
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
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      gap: 10,
    },
    backBtn: { padding: 4 },
    headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
    },
    headerAvatarInitial: { fontSize: 16, fontWeight: "700" },
    headerName: { fontSize: 15, fontWeight: "600", maxWidth: 180 },
    headerStatus: { fontSize: 11, marginTop: 1 },
    headerMenu: { padding: 6 },
    onlineDot: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: "#22c55e",
      borderWidth: 2,
    },
    authErrorBanner: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
      marginHorizontal: 12,
      marginBottom: 8,
      borderRadius: 8,
    },
    authErrorText: {
      fontSize: 13,
      flex: 1,
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    msgWrapper: { marginVertical: 2 },
    msgWrapperRight: { alignItems: "flex-end" },
    msgWrapperLeft: { alignItems: "flex-start" },
    messageFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
      marginHorizontal: 8,
    },
    timeText: { fontSize: 10 },
    replyPreview: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      marginBottom: 2,
      maxWidth: "80%",
    },
    replyPreviewRight: { backgroundColor: "rgba(0,0,0,0.15)", alignSelf: "flex-end" },
    replyPreviewLeft: { backgroundColor: "rgba(0,0,0,0.06)", alignSelf: "flex-start" },
    replyPreviewName: { fontSize: 11, fontWeight: "600" },
    replyPreviewText: { fontSize: 12 },
    bubble: {
      maxWidth: "78%",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
    },
    bubbleMine: { borderBottomRightRadius: 4 },
    bubbleOther: { borderBottomLeftRadius: 4 },
    bubbleSelected: { opacity: 0.75 },
    bubbleText: { fontSize: 15, lineHeight: 21 },
    bubbleTextDeleted: { fontSize: 14, fontStyle: "italic" },
    statusRow: { flexDirection: "row", alignItems: "center" },
    typingBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 20,
      alignSelf: "flex-start",
      gap: 8,
    },
    typingText: { fontSize: 12, fontStyle: "italic" },
    typingDots: { flexDirection: "row", alignItems: "center", gap: 3 },
    typingDot: { width: 4, height: 4, borderRadius: 2 },
    replyBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: 1,
      gap: 10,
    },
    replyBarAccent: { width: 3, height: "100%", borderRadius: 2, minHeight: 32 },
    replyBarName: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
    replyBarContent: { fontSize: 13 },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
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
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
    emptyChatText: { fontSize: 15 },
    menuOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
    },
    menu: { borderRadius: 14, borderWidth: 1, overflow: "hidden", minWidth: 180 },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    menuItemText: { fontSize: 15, fontWeight: "500" },
  });
}