import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/contexts/ThemeContext';

type IconPair = { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap };

// Mirrors the web sidenav icon set (outline when idle, filled when active).
const ICONS: Record<string, IconPair> = {
  home: { outline: 'home-outline', filled: 'home' },
  courses: { outline: 'school-outline', filled: 'school' },
  community: { outline: 'compass-outline', filled: 'compass' },
  leaderboard: { outline: 'podium-outline', filled: 'podium' },
  profile: { outline: 'person-outline', filled: 'person' },
  users: { outline: 'people-outline', filled: 'people' },
  organizations: { outline: 'business-outline', filled: 'business' },
};

const ACTIVE = '#FFA500';
const INACTIVE = '#9CA3B0';

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const barBackground = isDark ? '#121318' : '#ffffff';
  const barBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(204,204,204,0.25)';

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: colors.background, paddingBottom: Math.max(10, insets.bottom) },
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: barBackground,
            borderColor: barBorder,
            shadowOpacity: isDark ? 0.45 : 0.12,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          // Routes declared with `href: null` are reachable but not tabs.
          if ((options as any).href === null) return null;

          const icons = ICONS[route.name];
          if (!icons) return null;

          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={[styles.item, focused && styles.itemActive]}
            >
              <Ionicons
                name={focused ? icons.filled : icons.outline}
                size={25}
                color={focused ? ACTIVE : INACTIVE}
              />
              {focused && (
                <Text style={styles.label} numberOfLines={1}>
                  {label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    gap: 6,
  },
  itemActive: {
    backgroundColor: 'rgba(255,165,0,0.15)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: ACTIVE,
  },
});
