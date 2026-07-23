// app/(tabs)/courses/[id]/forums/new-post.tsx
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { createPost } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert } from '@/components/CustomAlert';

export default function NewPost() {
  const params = useLocalSearchParams();
  const courseId = params.id;
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    primaryLabel?: string;
    secondaryLabel?: string;
    onPrimary: () => void;
    onSecondary?: () => void;
  } | null>(null);

  const dismissAlert = () => setAlert(null);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      setAlert({
        visible: true,
        type: 'info',
        title: 'Missing info',
        message: 'Please fill in both title and content before posting.',
        primaryLabel: 'Got it',
        onPrimary: dismissAlert,
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        setAlert({
          visible: true,
          type: 'error',
          title: 'Not signed in',
          message: 'Please log in to create a post.',
          primaryLabel: 'OK',
          onPrimary: dismissAlert,
        });
        setIsLoading(false);
        return;
      }

      console.log('Creating post for course:', courseId);

      const result = await createPost(
        courseId as string,
        {
          title: title.trim(),
          content: content.trim(),
        },
        token
      );

      console.log('Post created successfully:', result);

      setAlert({
        visible: true,
        type: 'success',
        title: 'Post created!',
        message: result.message || 'Your post is now live in the forum.',
        primaryLabel: 'Back to forum',
        onPrimary: () => {
          dismissAlert();
          router.back();
        },
      });
    } catch (error: any) {
      console.error('Error creating post:', error);

      let errorMessage = 'Failed to create post. Please try again.';

      if (error.message.includes('404')) {
        errorMessage = 'API endpoint not found. Please check the server configuration.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      setAlert({
        visible: true,
        type: 'error',
        title: 'Something went wrong',
        message: errorMessage,
        primaryLabel: 'Try again',
        secondaryLabel: 'Cancel',
        onPrimary: dismissAlert,
        onSecondary: () => {
          dismissAlert();
          router.back();
        },
      });
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={s.content}>
          {/* Title Input */}
          <View style={s.inputContainer}>
            <Text style={[s.inputLabel, { color: colors.textMuted }]}>Title</Text>
            <TextInput
              style={[
                s.titleInput,
                {
                  borderColor: colors.borderMid,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Best Bible study methods for beginners?"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              editable={!isLoading}
            />
          </View>

          {/* Content Input */}
          <View style={s.inputContainer}>
            <Text style={[s.inputLabel, { color: colors.textMuted }]}>Content</Text>
            <TextInput
              style={[
                s.contentInput,
                {
                  borderColor: colors.borderMid,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="I'm new to systematic Bible study. The course mentions several methods, but I'm wondering which ones work best for beginners. Any recommendations?"
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>

          {/* Post Button */}
          <TouchableOpacity
            style={[s.postButton, isLoading && s.buttonDisabled]}
            onPress={handlePost}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.postButtonText}>Post</Text>
                <Ionicons name="send" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[s.cancelButton, { backgroundColor: colors.backgroundSoft }]}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={[s.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Alert — always last so it renders on top */}
      {alert && (
        <CustomAlert
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          primaryLabel={alert.primaryLabel}
          secondaryLabel={alert.secondaryLabel}
          onPrimary={alert.onPrimary}
          onSecondary={alert.onSecondary}
        />
      )}
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
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 12,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    titleInput: {
      borderWidth: 1,
      padding: 16,
      fontSize: 16,
      borderRadius: 8,
    },
    contentInput: {
      borderWidth: 1,
      padding: 16,
      fontSize: 15,
      minHeight: 150,
      borderRadius: 8,
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
    postButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    buttonDisabled: {
      opacity: 0.6,
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