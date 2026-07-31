// app/(tabs)/organization/announcements.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { createOrgAnnouncement } from '@/services/api';

const AUDIENCES: { value: 'all' | 'students' | 'instructors'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'all', label: 'Everyone', icon: 'globe-outline' },
  { value: 'students', label: 'Students', icon: 'people-outline' },
  { value: 'instructors', label: 'Instructors', icon: 'mail-outline' },
];

export default function OrganizationAnnouncements() {
  const { user, token } = useUser();
  const { colors } = useTheme();
  const organizationId = user?.organizationId;

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'students' | 'instructors'>('all');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<{ recipientCount: number } | null>(null);
  const [error, setError] = useState('');

  const s = makeStyles(colors);

  const handleSend = async () => {
    if (!title.trim() || !message.trim() || !organizationId) return;
    setSending(true);
    setError('');
    try {
      const result = await createOrgAnnouncement(organizationId, { title: title.trim(), message: message.trim(), audience }, token!);
      setSuccess({ recipientCount: result.data?.recipientCount ?? 0 });
      setTitle('');
      setMessage('');
      setTimeout(() => {
        setSuccess(null);
        router.back();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to create announcement');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Make an Announcement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {success ? (
          <View style={s.successBox}>
            <Ionicons name="checkmark-circle" size={64} color="#2E7D32" />
            <Text style={s.successTitle}>Announcement Sent!</Text>
            <Text style={s.successSubtitle}>Delivered to {success.recipientCount} member(s).</Text>
          </View>
        ) : (
          <>
            {error ? (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color="#F44336" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={s.label}>Announcement Title</Text>
            <TextInput
              style={s.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter announcement title"
              placeholderTextColor={colors.textMuted}
              editable={!sending}
            />

            <Text style={s.label}>Message</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Write your announcement message..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!sending}
            />

            <Text style={s.label}>Audience</Text>
            <View style={s.audienceRow}>
              {AUDIENCES.map((a) => (
                <TouchableOpacity
                  key={a.value}
                  style={[s.audienceCard, audience === a.value && s.audienceCardActive]}
                  onPress={() => setAudience(a.value)}
                  disabled={sending}
                >
                  <Ionicons name={a.icon} size={20} color={audience === a.value ? colors.brand : colors.textMuted} />
                  <Text style={[s.audienceLabel, audience === a.value && s.audienceLabelActive]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.sendButton, (!title.trim() || !message.trim()) && s.sendButtonDisabled]}
              onPress={handleSend}
              disabled={sending || !title.trim() || !message.trim()}
            >
              {sending ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="megaphone-outline" size={18} color="#fff" />
                  <Text style={s.sendButtonText}>Send Announcement</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    headerTitle: { fontSize: 16, fontWeight: '600', color: c.text },
    content: { flex: 1, padding: 20 },
    label: { fontSize: 13, fontWeight: '500', color: c.textSecondary, marginBottom: 6, marginTop: 16 },
    input: { borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 12, fontSize: 15, color: c.text },
    textArea: { height: 110 },
    audienceRow: { flexDirection: 'row', gap: 10 },
    audienceCard: {
      flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 10,
      borderWidth: 1, borderColor: c.border,
    },
    audienceCardActive: { borderColor: c.brand, backgroundColor: c.brandLighter },
    audienceLabel: { fontSize: 12, color: c.textMuted },
    audienceLabelActive: { color: c.brand, fontWeight: '600' },
    sendButton: {
      flexDirection: 'row', gap: 8, backgroundColor: c.brand, borderRadius: 10,
      paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 28,
    },
    sendButtonDisabled: { opacity: 0.5 },
    sendButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEBEE',
      padding: 12, borderRadius: 8, marginBottom: 8,
    },
    errorText: { color: '#F44336', fontSize: 13, flex: 1 },
    successBox: { alignItems: 'center', paddingVertical: 60, gap: 8 },
    successTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    successSubtitle: { fontSize: 13, color: c.textSecondary },
  });
}
