// app/(tabs)/profile/edit-profile.tsx
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '@/contexts/UserContext';
import { getUserProfile, updateUser } from '@/services/api';
import { getImageUri } from '@/utils/helpers';

const COUNTRIES = ['Nigeria', 'United States', 'United Kingdom', 'Canada'];
const STATES: Record<string, string[]> = {
  Nigeria: ['Lagos', 'Abuja', 'Kano', 'Rivers', 'Oyo', 'Delta', 'Anambra'],
  'United States': ['California', 'Texas', 'New York', 'Florida', 'Illinois'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  Canada: ['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
};

export default function EditProfile() {
  const { token } = useUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing profile data into the form
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await getUserProfile(token!);
        const user = result.user ?? result.data ?? result;
        setFirstName(user.first_name ?? '');
        setLastName(user.last_name ?? '');
        setPhone(user.phone_number ?? '');
        setCountry(user.country ?? 'Nigeria');
        setState(user.state ?? '');
        if (user.user_pic) {
          setAvatarUri(getImageUri(user.user_pic));
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation', 'First and last name are required.');
      return;
    }

    setSaving(true);
    try {
      const result = await updateUser(token!, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim(),
        country,
        state,
      });
      Alert.alert('Success', result.message ?? 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3F1F22" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar — display only, upload is done from profile page */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {firstName ? firstName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.form}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor="#bbb"
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor="#bbb"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              placeholderTextColor="#bbb"
              keyboardType="phone-pad"
            />
          </View>

          {/* Country */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={country}
                onValueChange={(value) => {
                  setCountry(value);
                  setState('');
                }}
                style={styles.picker}
              >
                {COUNTRIES.map((c) => (
                  <Picker.Item key={c} label={c} value={c} />
                ))}
              </Picker>
            </View>
          </View>

          {/* State */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={state}
                onValueChange={setState}
                style={styles.picker}
              >
                <Picker.Item label="Select state..." value="" />
                {(STATES[country] ?? []).map((s) => (
                  <Picker.Item key={s} label={s} value={s} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333', flex: 1, textAlign: 'center' },
  avatarSection: { alignItems: 'center', paddingVertical: 30 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0E0E0' },
  avatarInitial: { fontSize: 40, fontWeight: '600', color: '#666' },
  form: { paddingHorizontal: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, color: '#999', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', padding: 16, fontSize: 16, color: '#333' },
  pickerContainer: { borderWidth: 1, borderColor: '#E0E0E0', overflow: 'hidden' },
  picker: { height: 50 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  saveButton: { backgroundColor: '#3F1F22', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});