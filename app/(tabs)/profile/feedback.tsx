// app/(tabs)/profile/feedback.tsx
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { submitFeedback } from '@/services/api';

type FeedbackType = 'COURSE' | 'GROUP' | 'OTHER';

export default function FeedbackScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { token } = useUser();
  const s = makeStyles(colors);

  const [type, setType] = useState<FeedbackType>('OTHER');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const TYPES: { key: FeedbackType; label: string; icon: any }[] = [
    { key: 'COURSE', label: t('feedback.typeCourse'), icon: 'book-outline' },
    { key: 'GROUP', label: t('feedback.typeGroup'), icon: 'people-outline' },
    { key: 'OTHER', label: t('feedback.typeOther'), icon: 'chatbox-ellipses-outline' },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert(t('common.error'), t('feedback.messageRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({ message: message.trim(), type }, token!);
      Alert.alert(t('feedback.successTitle'), t('feedback.successMessage'), [
        { text: t('common.continue'), onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || t('feedback.errorFallback'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('feedback.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.label}>{t('feedback.typeLabel')}</Text>
        <View style={s.typeRow}>
          {TYPES.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[s.typeChip, type === opt.key && s.typeChipActive]}
              onPress={() => setType(opt.key)}
            >
              <Ionicons name={opt.icon} size={16} color={type === opt.key ? '#fff' : colors.brand} />
              <Text style={[s.typeChipText, type === opt.key && s.typeChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.label, { marginTop: 24 }]}>{t('feedback.messageLabel')}</Text>
        <TextInput
          style={s.textArea}
          value={message}
          onChangeText={setMessage}
          placeholder={t('feedback.messagePlaceholder')}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <TouchableOpacity style={s.submitButton} onPress={handleSubmit} disabled={submitting}>
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.submitButtonText}>{t('feedback.submit')}</Text>}
        </TouchableOpacity>
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
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text, flex: 1, textAlign: 'center' },
    content: { padding: 20 },
    label: { fontSize: 13, color: c.textSecondary, marginBottom: 10, fontWeight: '500' },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    typeChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14,
      borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.backgroundSoft,
    },
    typeChipActive: { backgroundColor: c.brand, borderColor: c.brand },
    typeChipText: { fontSize: 14, color: c.text, fontWeight: '500' },
    typeChipTextActive: { color: '#fff' },
    textArea: {
      borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 16, fontSize: 15,
      color: c.text, backgroundColor: c.backgroundSoft, minHeight: 140,
    },
    submitButton: {
      backgroundColor: c.brand, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
      borderRadius: 8, marginTop: 28,
    },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
}
