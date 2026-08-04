// app/(admin)/announcements/index.tsx
//
// Mobile counterpart to web's dashboard/super-admin/announcements — send a
// platform-wide in-app announcement or a broadcast email to an audience.
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { sendSuperAdminAnnouncement, sendSuperAdminEmail } from '@/services/api';
import { getFriendlyErrorMessage } from '@/utils/errorMessages';

type Audience = 'all' | 'students' | 'tutors' | 'org_admins';
type Channel = 'in_app' | 'email';

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'students', label: 'Students' },
  { value: 'tutors', label: 'Tutors' },
  { value: 'org_admins', label: 'Org admins' },
];

export default function AnnouncementsScreen() {
  const { token } = useUser();
  const { colors } = useTheme();
  const [channel, setChannel] = useState<Channel>('in_app');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [sending, setSending] = useState(false);

  const isEmail = channel === 'email';

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Required', `Please enter both a ${isEmail ? 'subject' : 'title'} and a message.`);
      return;
    }

    const audienceLabel = AUDIENCES.find((a) => a.value === audience)?.label ?? 'Everyone';
    Alert.alert(
      isEmail ? 'Send email?' : 'Post announcement?',
      `This goes out to ${audienceLabel.toLowerCase()} and can't be recalled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              if (isEmail) {
                await sendSuperAdminEmail({ subject: title.trim(), message: message.trim(), audience }, token!);
              } else {
                await sendSuperAdminAnnouncement({ title: title.trim(), message: message.trim(), audience }, token!);
              }
              setTitle('');
              setMessage('');
              Alert.alert('Sent', isEmail ? 'Your email is on its way.' : 'Your announcement has been posted.');
            } catch (err: any) {
              Alert.alert('Error', getFriendlyErrorMessage(err, 'sending that'));
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Announcements</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Channel */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Send as</Text>
        <View style={styles.chipRow}>
          {([
            { value: 'in_app' as Channel, label: 'In-app', icon: 'notifications' as const },
            { value: 'email' as Channel, label: 'Email', icon: 'mail' as const },
          ]).map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setChannel(opt.value)}
              style={[
                styles.chip,
                { backgroundColor: channel === opt.value ? colors.brand : colors.backgroundMuted },
              ]}
            >
              <Ionicons
                name={opt.icon}
                size={14}
                color={channel === opt.value ? '#fff' : colors.textMuted}
              />
              <Text style={[styles.chipText, { color: channel === opt.value ? '#fff' : colors.textSecondary }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Audience */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Audience</Text>
        <View style={styles.chipRow}>
          {AUDIENCES.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setAudience(opt.value)}
              style={[
                styles.chip,
                { backgroundColor: audience === opt.value ? colors.brand : colors.backgroundMuted },
              ]}
            >
              <Text style={[styles.chipText, { color: audience === opt.value ? '#fff' : colors.textSecondary }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title / subject */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>{isEmail ? 'Subject' : 'Title'}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundMuted, color: colors.text }]}
          placeholder={isEmail ? 'Email subject' : 'Announcement title'}
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />

        {/* Message */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Message</Text>
        <TextInput
          style={[styles.input, styles.textarea, { backgroundColor: colors.backgroundMuted, color: colors.text }]}
          placeholder="What would you like to say?"
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={sending}
          style={[styles.sendBtn, { backgroundColor: colors.brand, opacity: sending ? 0.6 : 1 }]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={16} color="#fff" />
              <Text style={styles.sendBtnText}>{isEmail ? 'Send email' : 'Post announcement'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '600', marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { minHeight: 140 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 28,
  },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
