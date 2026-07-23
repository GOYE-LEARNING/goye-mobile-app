// app/(tabs)/courses/[id]/forums/reply.tsx
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { API_CONFIG } from '@/constants/config';

export default function ReplyPost() {
  const params = useLocalSearchParams();
  const { id: courseId, postId, replyId, replyTo } = params;
  // replyId = if replying to another reply (nested)
  // replyTo = name of person being replied to (for UI display)
  
  const { token } = useUser();
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine if this is a reply to a post or a reply to another reply
  const isReplyToReply = !!replyId;

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write your reply');
      return;
    }

    try {
      setLoading(true);

      let url: string;
      
      if (isReplyToReply) {
        // Reply to another reply (nested)
        // Try different URL patterns - uncomment the one that works:
        
        // Option 1: Original
        // url = `${API_CONFIG.BASE_URL}/socials/reply-other-reply/${replyId}/${postId}`;
        
        // Option 2: Swapped parameters
        // url = `${API_CONFIG.BASE_URL}/socials/reply-other-reply/${postId}/${replyId}`;
        
        // Option 3: Different endpoint name
        // url = `${API_CONFIG.BASE_URL}/socials/reply-to-reply/${replyId}/${postId}`;
        
        // Option 4: Use parentId in body instead (fallback to direct reply endpoint)
        // For now, use direct reply and include parentId in body
        url = `${API_CONFIG.BASE_URL}/socials/create-reply/${postId}`;
      } else {
        // Reply directly to post
        url = `${API_CONFIG.BASE_URL}/socials/create-reply/${postId}`;
      }

      console.log('Posting reply to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          // Include parentId for nested replies (if backend supports it in body)
          ...(isReplyToReply && { parentId: replyId }),
        }),
      });

      const result = await response.json();
      console.log('Reply result:', result);

      if (response.ok) {
        Alert.alert('Success', 'Your reply has been posted!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to post reply. Please try again.');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      Alert.alert('Error', 'Unable to post reply. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.keyboardView}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={s.backButton}
            disabled={loading}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {isReplyToReply ? 'Reply to Comment' : 'Reply'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={s.content}>
          {/* Show who you're replying to if it's a nested reply */}
          {isReplyToReply && replyTo && (
            <View style={[s.replyingToContainer, { backgroundColor: colors.backgroundSoft }]}>
              <Ionicons name="arrow-undo" size={16} color={colors.textSecondary} />
              <Text style={[s.replyingToText, { color: colors.textSecondary }]}>
                Replying to <Text style={[s.replyingToName, { color: colors.brand }]}>{replyTo}</Text>
              </Text>
            </View>
          )}

          {/* Content Input */}
          <View style={s.inputContainer}>
            <Text style={[s.inputLabel, { color: colors.textMuted }]}>Your Reply</Text>
            <TextInput
              style={[
                s.contentInput, 
                { 
                  borderColor: colors.borderMid, 
                  color: colors.text,
                  backgroundColor: colors.background
                }
              ]}
              placeholder="Write your reply here..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              autoFocus
              editable={!loading}
              maxLength={2000}
            />
            <Text style={[s.charCount, { color: colors.textMuted }]}>{content.length}/2000</Text>
          </View>

          {/* Post Button */}
          <TouchableOpacity 
            style={[s.postButton, loading && s.buttonDisabled]} 
            onPress={handlePost}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.postButtonText}>Post Reply</Text>
                <Ionicons name="send" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity 
            style={[s.cancelButton, { backgroundColor: colors.backgroundSoft }]} 
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={[s.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    keyboardView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
      flex: 1,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    replyingToContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    replyingToText: {
      fontSize: 14,
    },
    replyingToName: {
      fontWeight: '600',
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 12,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    contentInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 16,
      fontSize: 15,
      minHeight: 180,
    },
    charCount: {
      fontSize: 11,
      textAlign: 'right',
      marginTop: 4,
    },
    postButton: {
      flexDirection: 'row',
      backgroundColor: c.brand,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 20,
      borderRadius: 8,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    postButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 12,
      borderRadius: 8,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });
}