// app/(tabs)/profile/feedback.tsx
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Modal } from 'react-native';
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
  const [showSuccess, setShowSuccess] = useState(false);

  const TYPES: { key: FeedbackType; label: string; icon: any }[] = [
    { key: 'COURSE', label: t('feedback.typeCourse'), icon: 'book-outline' },
    { key: 'GROUP', label: t('feedback.typeGroup'), icon: 'people-outline' },
    { key: 'OTHER', label: t('feedback.typeOther'), icon: 'chatbox-ellipses-outline' },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      // You could add a toast here instead
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({ message: message.trim(), type }, token!);
      setShowSuccess(true);
    } catch (err: any) {
      // You could add a toast here instead
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    setShowSuccess(false);
    router.back();
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

        <TouchableOpacity style={s.submitButton} onPress={handleSubmit} disabled={submitting || !message.trim()}>
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.submitButtonText}>{t('feedback.submit')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Success Modal ── */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.successIconContainer}>
              <View style={s.successCircle}>
                <Ionicons name="checkmark" size={48} color="#fff" />
              </View>
            </View>

            <Text style={s.successTitle}>Thank You! 🙏</Text>
            <Text style={s.successSubtitle}>
              Your feedback has been received and will help us improve Goye for everyone.
            </Text>

            <View style={s.successDetails}>
              <View style={s.detailRow}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color={colors.textMuted} />
                <Text style={s.detailText}>Type: {TYPES.find(t => t.key === type)?.label}</Text>
              </View>
              <View style={s.detailRow}>
                <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                <Text style={s.detailText}>Submitted just now</Text>
              </View>
            </View>

            <TouchableOpacity style={s.doneButton} onPress={handleDone}>
              <Text style={s.doneButtonText}>Done</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text, flex: 1, textAlign: 'center' },
    content: { padding: 20 },
    label: { fontSize: 13, color: c.textSecondary, marginBottom: 10, fontWeight: '500' },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.backgroundSoft,
    },
    typeChipActive: { backgroundColor: c.brand, borderColor: c.brand },
    typeChipText: { fontSize: 14, color: c.text, fontWeight: '500' },
    typeChipTextActive: { color: '#fff' },
    textArea: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      padding: 16,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.backgroundSoft,
      minHeight: 140,
    },
    submitButton: {
      backgroundColor: c.brand,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      marginTop: 28,
    },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

    // ── Success Modal Styles ──
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: c.background,
      borderRadius: 24,
      padding: 32,
      width: '100%',
      maxWidth: 380,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 10,
    },
    successIconContainer: {
      marginBottom: 16,
    },
    successCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#34A853',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#34A853',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
    },
    successSubtitle: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    successDetails: {
      width: '100%',
      backgroundColor: c.backgroundSoft,
      borderRadius: 12,
      padding: 16,
      gap: 10,
      marginBottom: 24,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    detailText: {
      fontSize: 14,
      color: c.text,
      fontWeight: '500',
    },
    doneButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.brand,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      width: '100%',
      shadowColor: c.brand,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    doneButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
}