// app/(tabs)/profile/notifications.tsx - Notification Settings
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
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
  const { colors } = useTheme();
  
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const s = makeStyles(colors);

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
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        {saving ? <ActivityIndicator size="small" color={colors.brand} /> : <View style={{ width: 24 }} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={s.viewAllLink}
          onPress={() => router.push('/(tabs)/home/notifications')}
        >
          <Ionicons name="notifications" size={18} color={colors.brand} />
          <Text style={s.viewAllLinkText}>View all notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={colors.brand} style={s.loading} />
        ) : (
          <View style={s.content}>
            {SETTING_FIELDS.map((setting) => (
              <View key={setting.id} style={s.settingItem}>
                <View style={s.settingInfo}>
                  <Text style={s.settingTitle}>{setting.title}</Text>
                  <Text style={s.settingDescription}>{setting.description}</Text>
                </View>
                <Switch
                  value={!!settings[setting.id]}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ 
                    false: colors.borderMid, 
                    true: colors.success 
                  }}
                  thumbColor={settings[setting.id] ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor={colors.borderMid}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    viewAllLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 20,
      marginTop: 16,
      padding: 14,
      backgroundColor: c.brandLighter,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.brandLight,
    },
    viewAllLinkText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: c.brand,
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
      borderBottomColor: c.border,
    },
    settingInfo: {
      flex: 1,
      marginRight: 16,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      color: c.textMuted,
      lineHeight: 18,
    },
  });
}