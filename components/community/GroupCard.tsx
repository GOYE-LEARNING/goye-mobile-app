// components/community/GroupCard.tsx
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageUri } from '@/utils/helpers';

interface GroupCardProps {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  lastActive: string;
  leader: { name: string; avatar: any };
  isMember: boolean;
  isModerator?: boolean;
  thumbnail?: string;
}

export default function GroupCard({
  id, name, description, memberCount, lastActive,
  leader, isMember, isModerator = false, thumbnail,
}: GroupCardProps) {
  const { colors } = useTheme();

  const formatLastActive = (dateString: string) => {
    if (!dateString) return 'recently';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'recently';
      const diffDays = Math.ceil(Math.abs(Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) return 'today';
      if (diffDays <= 7) return `${diffDays} days ago`;
      if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    } catch { return 'recently'; }
  };

  const avatarUri = leader.avatar ? getImageUri(leader.avatar) : null;
  const s = makeStyles(colors);

  return (
    <TouchableOpacity style={s.groupCard} onPress={() => router.push(`/(tabs)/community/${id}` as any)}>
      <View style={s.groupHeader}>
        <Text style={s.groupName}>{name}</Text>
        {isModerator ? (
          <View style={s.moderatorBadge}>
            <Text style={s.moderatorBadgeText}>Moderator</Text>
          </View>
        ) : isMember ? (
          <View style={s.memberBadge}>
            <Text style={s.memberBadgeText}>Member</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.joinButton}>
            <Ionicons name="add" size={16} color={colors.brand} />
            <Text style={s.joinButtonText}>Join</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={s.groupDescription} numberOfLines={2}>{description}</Text>

      <View style={s.groupMeta}>
        <View style={s.metaItem}>
          <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
          <Text style={s.metaText}>{memberCount} members</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={s.metaText}>Active {formatLastActive(lastActive)}</Text>
        </View>
      </View>

      <View style={s.groupLeader}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={s.leaderAvatar} />
        ) : (
          <View style={[s.leaderAvatar, s.leaderAvatarFallback]}>
            <Text style={s.leaderAvatarText}>{leader.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <Text style={s.leaderName}>{leader.name}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    groupCard:            { backgroundColor: c.card, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: c.borderMid },
    groupHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    groupName:            { flex: 1, fontSize: 16, fontWeight: '600', color: c.text, marginRight: 8 },
    moderatorBadge:       { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: c.brand, borderRadius: 4 },
    moderatorBadgeText:   { fontSize: 12, fontWeight: '600', color: '#fff' },
    memberBadge:          { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: c.backgroundMuted, borderRadius: 4 },
    memberBadgeText:      { fontSize: 12, fontWeight: '600', color: c.textSecondary },
    joinButton:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
    joinButtonText:       { fontSize: 14, fontWeight: '600', color: c.brand },
    groupDescription:     { fontSize: 14, color: c.textSecondary, lineHeight: 20, marginBottom: 12 },
    groupMeta:            { flexDirection: 'row', gap: 16, marginBottom: 12 },
    metaItem:             { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText:             { fontSize: 13, color: c.textSecondary },
    groupLeader:          { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border },
    leaderAvatar:         { width: 24, height: 24, borderRadius: 12, backgroundColor: c.backgroundMuted },
    leaderAvatarFallback: { justifyContent: 'center', alignItems: 'center', backgroundColor: c.brandLight },
    leaderAvatarText:     { fontSize: 10, fontWeight: '700', color: c.brand },
    leaderName:           { fontSize: 13, color: c.textSecondary },
  });
}