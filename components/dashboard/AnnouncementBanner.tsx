import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { getAnnouncementsByAdmin, markNotificationAsRead } from '@/services/api';

interface Announcement {
  id: string;
  title: string;
  message: string;
}

/**
 * The latest unread announcement addressed to the signed-in user, from the
 * server. Cancel hides it at once and marks it read on the server, so it does
 * not come back on the next visit or on another device. Renders nothing when
 * there is no announcement.
 */
export default function AnnouncementBanner() {
  const { token } = useUser();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let active = true;
      getAnnouncementsByAdmin(token)
        .then((result) => {
          if (!active) return;
          const list = Array.isArray(result?.data) ? result.data : [];
          setAnnouncement(list[0] ?? null);
        })
        .catch((err) => console.error('[Announcement] fetch failed:', err));
      return () => {
        active = false;
      };
    }, [token]),
  );

  const dismiss = () => {
    const current = announcement;
    setAnnouncement(null);
    if (current && token) {
      markNotificationAsRead(current.id, token).catch((err) =>
        console.error('[Announcement] could not mark as read:', err),
      );
    }
  };

  if (!announcement) return null;

  return (
    <View style={s.card}>
      <View style={s.topRow}>
        <View style={s.labelRow}>
          <Ionicons name="megaphone-outline" size={14} color={colors.success} />
          <Text style={[s.label, { color: colors.success }]}>
            {t('home.studentDashboard.announcementLabel')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss announcement"
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={[s.title, { color: colors.text }]}>{announcement.title}</Text>
      <Text style={[s.message, { color: colors.textSecondary }]}>{announcement.message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#30A46F1A',
    borderRadius: 12,
    marginHorizontal: 10,
    marginBottom: 16,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  message: { fontSize: 13, marginTop: 4, lineHeight: 18 },
});
