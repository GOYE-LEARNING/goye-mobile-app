// components/course-creation/CourseInformation.tsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  data: any;
  onChange: (data: any) => void;
}

export default function CourseInformation({ data, onChange }: Props) {
  const { colors } = useTheme();
  const [localImage, setLocalImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setLocalImage(result.assets[0].uri);
      onChange({ thumbnail: result.assets[0].uri });
    }
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <Text style={s.sectionTitle}>Course Information</Text>

      <View style={s.field}>
        <Text style={s.label}>Course Title</Text>
        <TextInput
          style={s.input}
          placeholder="Young Adult Fellowship"
          placeholderTextColor={colors.textMuted}
          value={data.title}
          onChangeText={(text) => onChange({ title: text })}
        />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Short Description</Text>
        <TextInput
          style={s.input}
          placeholder="A vibrant community of young adults"
          placeholderTextColor={colors.textMuted}
          value={data.shortDescription}
          onChangeText={(text) => onChange({ shortDescription: text })}
        />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Description</Text>
        <TextInput
          style={[s.input, s.textArea]}
          placeholder="Discover what it means to truly follow Jesus..."
          placeholderTextColor={colors.textMuted}
          value={data.description}
          onChangeText={(text) => onChange({ description: text })}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Level</Text>
        <TouchableOpacity style={s.dropdown}>
          <Text style={s.dropdownText}>{data.level || 'Beginner'}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={s.field}>
        <Text style={s.label}>Course Thumbnail</Text>
        {localImage ? (
          <View style={s.imagePreview}>
            <Image source={{ uri: localImage }} style={s.thumbnailImage} />
            <View style={s.imageActions}>
              <TouchableOpacity 
                style={s.imageActionButton}
                onPress={() => {
                  setLocalImage(null);
                  onChange({ thumbnail: null });
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={s.imageActionText}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={s.imageActionButton}
                onPress={pickImage}
              >
                <Ionicons name="reload-outline" size={16} color="#fff" />
                <Text style={s.imageActionText}>Replace</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.uploadBox} onPress={pickImage}>
            <Ionicons name="cloud-upload-outline" size={32} color={colors.textMuted} />
            <Text style={s.uploadText}>Upload thumbnail image</Text>
            <Text style={s.uploadSubtext}>Supports JPEG or PNG</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      paddingVertical: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 24,
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
      borderColor: c.borderMid,
      padding: 14,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.background,
      borderRadius: 8,
    },
    textArea: {
      height: 120,
      textAlignVertical: 'top',
    },
    dropdown: {
      borderWidth: 1,
      borderColor: c.borderMid,
      padding: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.background,
      borderRadius: 8,
    },
    dropdownText: {
      fontSize: 15,
      color: c.text,
    },
    uploadBox: {
      borderWidth: 2,
      borderColor: c.borderMid,
      borderStyle: 'dashed',
      borderRadius: 8,
      padding: 40,
      alignItems: 'center',
      backgroundColor: c.backgroundSoft,
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
      color: '#fff',
      fontSize: 14,
      fontWeight: '500',
    },
  });
}