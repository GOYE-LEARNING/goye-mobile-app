// app/(tabs)/profile/notifications.tsx - Notification Settings
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { getSettings, updateNotificationSettings } from '@/services/api';

interface NotificationSetting {
  id: 'enable_push_notification' | 'course_updates' | 'event' | 'achievement' | 'daily_reminders' | 'group_activity' | 'email_notification';
  title: string;
  description: string;
}

const SETTING_FIELDS: NotificationSetting[] = [
  { id: 'enable_push_notification', title: 'Enable Push Notifications', description: 'Receive notifications on your device' },
  { id: 'course_updates', title: 'Course Updates', description: 'New lessons, completions, and assignments' },
  { id: 'event', title: 'Events', description: 'Event reminders and live notifications' },
  { id: 'achievement', title: 'Achievements', description: 'Badges, milestones, and progress updates' },
  { id: 'daily_reminders', title: 'Daily Reminders', description: 'Get reminded to complete your daily study' },
  { id: 'group_activity', title: 'Group Activity', description: 'Get updates from your groups' },
  { id: 'email_notification', title: 'Email Notifications', description: 'Receive updates via email' },
];

type SettingsState = Record<NotificationSetting['id'], boolean> & { id?: string; darkMode?: boolean };

const DEFAULT_SETTINGS: SettingsState = {
  enable_push_notification: true,
  course_updates: true,
  event: true,
  achievement: true,
  daily_reminders: false,
  group_activity: true,
  email_notification: true,
  darkMode: false,
};

export default function NotificationSettings() {
  const { token } = useUser();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [])
  );

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const result = await getSettings(token!);
      if (result.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.settings });
      }
    } catch (err) {
      console.error('[NotificationSettings] Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (id: NotificationSetting['id']) => {
    if (!settings.id) {
      Alert.alert('Unavailable', 'Notification settings are not set up for this account yet.');
      return;
    }
    const updated = { ...settings, [id]: !settings[id] };
    setSettings(updated);
    setSaving(true);
    try {
      await updateNotificationSettings(settings.id, {
        enable_push_notification: updated.enable_push_notification,
        course_updates: updated.course_updates,
        event: updated.event,
        achievement: updated.achievement,
        daily_reminders: updated.daily_reminders,
        group_activity: updated.group_activity,
        email_notification: updated.email_notification,
        darkMode: !!updated.darkMode,
      }, token!);
    } catch (err: any) {
      // Revert on failure
      setSettings(settings);
      Alert.alert('Error', err?.message || 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {saving ? <ActivityIndicator size="small" color="#3F1F22" /> : <View style={{ width: 24 }} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.viewAllLink}
          onPress={() => router.push('/(tabs)/home/notifications')}
        >
          <Ionicons name="notifications" size={18} color="#3F1F22" />
          <Text style={styles.viewAllLinkText}>View all notifications</Text>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#3F1F22" style={styles.loading} />
        ) : (
          <View style={styles.content}>
            {SETTING_FIELDS.map((setting) => (
              <View key={setting.id} style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
                <Switch
                  value={!!settings[setting.id]}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                  thumbColor={settings[setting.id] ? '#22c55e' : '#f4f3f4'}
                  ios_backgroundColor="#E0E0E0"
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  viewAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
  },
  viewAllLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#3F1F22',
  },
  loading: {
    marginTop: 40,
  },
  content: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
});
