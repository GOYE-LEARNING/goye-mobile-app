// components/community/EventCard.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface EventCardProps {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'Session' | 'Fellowship' | 'Service' | 'Meeting';
  eventLink?: string;
  hasNotification?: boolean;
  isLocked?: boolean;
}

export default function EventCard({
  title, description, date, time, type,
  eventLink, hasNotification = false, isLocked = false,
}: EventCardProps) {
  const { colors } = useTheme();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Session':    return '#EF4444';
      case 'Fellowship': return '#2563EB';
      case 'Service':    return '#8B5CF6';
      case 'Meeting':    return '#14B8A6';
      default:           return colors.textMuted;
    }
  };

  const s = makeStyles(colors);

  return (
    <View style={s.eventCard}>
      <View style={s.eventHeader}>
        <Text style={s.eventTitle}>{title}</Text>
        <View style={[s.typeBadge, { backgroundColor: getTypeColor(type) }]}>
          <Text style={s.typeBadgeText}>{type}</Text>
        </View>
      </View>

      <Text style={s.eventDescription}>{description}</Text>

      <View style={s.eventMeta}>
        <View style={s.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={s.metaText}>{date}</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={s.metaText}>{time}</Text>
        </View>
      </View>

      <View style={s.eventFooter}>
        <TouchableOpacity style={s.eventLinkButton}>
          <Text style={s.eventLinkText}>Event Link</Text>
          {isLocked
            ? <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
            : <Ionicons name="open-outline" size={16} color={colors.textSecondary} />}
        </TouchableOpacity>

        {!isLocked && (
          <TouchableOpacity style={s.notificationButton}>
            <Ionicons
              name={hasNotification ? 'notifications' : 'notifications-outline'}
              size={20}
              color={hasNotification ? colors.brand : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    eventCard:          { backgroundColor: c.card, padding: 16, marginBottom: 16 },
    eventHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    eventTitle:         { flex: 1, fontSize: 16, fontWeight: '600', color: c.text, marginRight: 8 },
    typeBadge:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    typeBadgeText:      { color: '#fff', fontSize: 11, fontWeight: '600' },
    eventDescription:   { fontSize: 14, color: c.textSecondary, lineHeight: 20, marginBottom: 12 },
    eventMeta:          { flexDirection: 'row', gap: 16, marginBottom: 12 },
    metaItem:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText:           { fontSize: 13, color: c.textSecondary },
    eventFooter:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
    eventLinkButton:    { flex: 1, flexDirection: 'row', backgroundColor: c.backgroundMuted, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
    eventLinkText:      { fontSize: 14, fontWeight: '600', color: c.text },
    notificationButton: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: c.borderMid, alignItems: 'center', justifyContent: 'center' },
  });
}