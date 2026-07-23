// app/(tabs)/home/students/[studentId]/chat.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';

// Mock student data
const studentData = {
  id: 'student1',
  name: 'Kurt Bates',
  avatar: require('@/assets/images/icon.png'),
};

// Mock chat messages
const initialMessages = [
  {
    id: '1',
    senderId: '1761439198553',
    text: 'Hi Kurt! How are you finding the Biblical Foundation course?',
    timestamp: new Date('2024-01-15T10:00:00'),
    isRead: true,
  },
  {
    id: '2',
    senderId: 'student1',
    text: "Hello! It's going well, thank you. I'm really enjoying the lessons on prayer.",
    timestamp: new Date('2024-01-15T10:05:00'),
    isRead: true,
  },
  {
    id: '3',
    senderId: '1761439198553',
    text: "That's wonderful to hear! Do you have any questions about the material?",
    timestamp: new Date('2024-01-15T10:10:00'),
    isRead: true,
  },
  {
    id: '4',
    senderId: 'student1',
    text: "Yes, I have a question about the quiz in module 2. Could you explain the concept of spiritual disciplines a bit more?",
    timestamp: new Date('2024-01-15T10:15:00'),
    isRead: true,
  },
];

export default function StudentChat() {
  const params = useLocalSearchParams();
  const { user } = useUser();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim() === '') return;

    const message = {
      id: Date.now().toString(),
      senderId: user?.id || '1761439198553',
      text: newMessage.trim(),
      timestamp: new Date(),
      isRead: false,
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // TODO: Save to storage
    // await storage.set(`message:${message.id}`, JSON.stringify(message));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const isInstructor = (senderId: string) => senderId === user?.id;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Image source={studentData.avatar} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerName}>{studentData.name}</Text>
            <Text style={styles.headerStatus}>Student</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date Divider */}
          <View style={styles.dateDivider}>
            <View style={styles.dateDividerLine} />
            <Text style={styles.dateDividerText}>{formatDate(new Date())}</Text>
            <View style={styles.dateDividerLine} />
          </View>

          {/* Messages */}
          {messages.map((message, index) => {
            const isSender = isInstructor(message.senderId);
            const showTime = index === messages.length - 1 || 
              messages[index + 1]?.senderId !== message.senderId;

            return (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  isSender ? styles.senderWrapper : styles.receiverWrapper,
                ]}
              >
                {!isSender && (
                  <Image source={studentData.avatar} style={styles.messageAvatar} />
                )}
                <View style={styles.messageGroup}>
                  <View
                    style={[
                      styles.messageBubble,
                      isSender ? styles.senderBubble : styles.receiverBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isSender ? styles.senderText : styles.receiverText,
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                  {showTime && (
                    <Text
                      style={[
                        styles.messageTime,
                        isSender && styles.senderTime,
                      ]}
                    >
                      {formatTime(message.timestamp)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={28} color="#666" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendButton, newMessage.trim() === '' && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={newMessage.trim() === ''}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() === '' ? '#999' : 'white'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerStatus: {
    fontSize: 13,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10, // Add some bottom padding
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dateDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dateDividerText: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 12,
    fontWeight: '500',
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  senderWrapper: {
    justifyContent: 'flex-end',
  },
  receiverWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageGroup: {
    maxWidth: '70%',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  senderBubble: {
    backgroundColor: '#3F1F22',
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  senderText: {
    color: 'white',
  },
  receiverText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginLeft: 12,
  },
  senderTime: {
    textAlign: 'right',
    marginLeft: 0,
    marginRight: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  attachButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3F1F22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
});