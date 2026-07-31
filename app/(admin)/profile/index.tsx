import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@/contexts/UserContext';
import { getUserProfile, updateUser, uploadProfilePicture } from '@/services/api';

export default function AdminProfile() {
  const { token, user, isSuperAdmin, logout } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null | undefined>(user?.user_pic);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const result = await getUserProfile(token!);
      const data = result.user || result.data || {};
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setPhoneNumber(data.phone_number || '');
      setProfilePic(data.profile_pic || data.user_pic || null);
    } catch (err) {
      console.error('[AdminProfile] Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) return;

    setUploadingPic(true);
    try {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const extension = mimeType.split('/')[1] ?? 'jpg';
      await uploadProfilePicture(token!, {
        mimeType,
        fileName: asset.fileName ?? `admin_profile_${Date.now()}.${extension}`,
        file: asset.base64,
      });
      await fetchProfile();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to upload profile picture.');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(token!, { first_name: firstName, last_name: lastName, phone_number: phoneNumber });
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/start');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F1F22" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUploadProfilePicture} disabled={uploadingPic}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={36} color="#666" />
            </View>
          )}
          {uploadingPic ? (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          ) : (
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.roleBadgeText}>
          {isSuperAdmin ? 'Super Admin' : 'Admin'}
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={[styles.input, styles.inputDisabled]} value={user?.email_address} editable={false} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#F44336" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 24,
    backgroundColor: '#F5F5F5',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3F1F22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  roleBadgeText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#3F1F22',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#000',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  saveButton: {
    marginTop: 28,
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  logoutButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '500',
  },
});
