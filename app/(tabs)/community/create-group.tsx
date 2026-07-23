import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useUser } from '@/contexts/UserContext';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
import { createGroup } from '@/services/api';

export default function CreateGroup() {
  const { user, token, isInstructor } = useUser();
  const { colors } = useTheme();
  
  const [groupTitle, setGroupTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const s = makeStyles(colors);

  // Protect this route
  if (!isInstructor) {
    router.replace('/(tabs)/community');
    return null;
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setThumbnail(result.assets[0].uri);
    }
  };

  // Convert file to base64 using the NEW expo-file-system API (same as create course)
  const fileToBase64 = async (uri: string): Promise<string | null> => {
    try {
      console.log(' Converting image:', uri.substring(0, 50) + '...');
      
      // Use the new File API from expo-file-system
      const file = new FileSystem.File(uri);
      const base64 = await file.base64();
      
      const sizeKB = (base64.length * 0.75 / 1024).toFixed(2);
      console.log(` Converted successfully (${sizeKB} KB)`);
      return base64;
    } catch (error) {
      console.error(' Conversion failed:', error);
      return null;
    }
  };

  const handleCreate = async () => {
    if (!groupTitle.trim()) {
      Alert.alert('Error', 'Please enter a group title');
      return;
    }

    if (!shortDescription.trim()) {
      Alert.alert('Error', 'Please enter a short description');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!thumbnail) {
      Alert.alert('Error', 'Please upload a group thumbnail');
      return;
    }

    try {
      setLoading(true);
      
      console.log(' Converting thumbnail to base64...');
      const thumbnailBase64 = await fileToBase64(thumbnail);
      
      if (!thumbnailBase64) {
        Alert.alert('Error', 'Failed to process image. Please try another image.');
        return;
      }

      const groupData = {
        group_title: groupTitle,
        group_short_description: shortDescription,
        group_description: description,
        group_image: thumbnailBase64,
      };

      console.log('📤 Creating group...');
      const result = await createGroup(groupData, token);
      
      console.log(' Group created successfully!');
      Alert.alert('Success', result.message || 'Group created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(' Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create Group</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Group Title */}
        <View style={s.field}>
          <Text style={s.label}>Group Title</Text>
          <TextInput
            style={s.input}
            placeholder="Foundations of Discipleship"
            value={groupTitle}
            onChangeText={setGroupTitle}
            placeholderTextColor={colors.textMuted}
            editable={!loading}
          />
        </View>

        {/* Short Description */}
        <View style={s.field}>
          <Text style={s.label}>Short Description</Text>
          <TextInput
            style={s.input}
            placeholder="Weekly Bible Study & Prayers"
            value={shortDescription}
            onChangeText={setShortDescription}
            placeholderTextColor={colors.textMuted}
            editable={!loading}
          />
        </View>

        {/* Description */}
        <View style={s.field}>
          <Text style={s.label}>Description</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="A vibrant community of young adults (18-30) growing together in faith through weekly Bible studies, prayer, fellowship, and community service. We meet every Sunday at 6 PM for worship and discussion."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor={colors.textMuted}
            editable={!loading}
          />
        </View>

        {/* Group Thumbnail */}
        <View style={s.field}>
          <Text style={s.label}>Group Thumbnail</Text>
          {thumbnail ? (
            <View style={s.imagePreview}>
              <Image source={{ uri: thumbnail }} style={s.thumbnailImage} />
              <View style={s.imageActions}>
                <TouchableOpacity 
                  style={s.imageActionButton}
                  onPress={() => setThumbnail(null)}
                  disabled={loading}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={s.imageActionText}>Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={s.imageActionButton}
                  onPress={pickImage}
                  disabled={loading}
                >
                  <Ionicons name="reload-outline" size={16} color="#fff" />
                  <Text style={s.imageActionText}>Replace</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={s.uploadBox} 
              onPress={pickImage}
              disabled={loading}
            >
              <Ionicons name="cloud-upload-outline" size={32} color={colors.textMuted} />
              <Text style={s.uploadText}>Upload thumbnail image</Text>
              <Text style={s.uploadSubtext}>Supports JPEG or PNG</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer Buttons */}
      <View style={s.footer}>
        <TouchableOpacity 
          style={[s.createButton, loading && s.createButtonDisabled]} 
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={s.createButtonText}>Create Group</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={s.cancelButton} 
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={s.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    field: {
      marginBottom: 24,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textSecondary,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: c.inputBorder,
      padding: 14,
      fontSize: 15,
      color: c.text,
      borderRadius: 8,
      backgroundColor: c.inputBg,
    },
    textArea: {
      height: 150,
      textAlignVertical: 'top',
    },
    uploadBox: {
      borderWidth: 2,
      borderColor: c.borderMid,
      borderStyle: 'dashed',
      borderRadius: 8,
      padding: 40,
      alignItems: 'center',
      backgroundColor: c.backgroundMuted,
    },
    uploadText: {
      fontSize: 15,
      fontWeight: '500',
      color: c.text,
      marginTop: 12,
    },
    uploadSubtext: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 4,
    },
    imagePreview: {
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
    },
    thumbnailImage: {
      width: '100%',
      height: 200,
      backgroundColor: c.backgroundMuted,
    },
    imageActions: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      flexDirection: 'row',
      gap: 12,
    },
    imageActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingVertical: 10,
      borderRadius: 6,
    },
    imageActionText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
    footer: {
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.background,
    },
    createButton: {
      backgroundColor: c.brand,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    createButtonDisabled: {
      opacity: 0.6,
    },
    createButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: 'transparent',
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 8,
    },
    cancelButtonText: {
      color: c.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}