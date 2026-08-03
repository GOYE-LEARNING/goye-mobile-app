// components/ShekiAIFab.tsx
//
// Persistent floating trigger for the ShekiAI assistant, mounted once at the
// root layout (mirrors web's ShekiAIWidget being mounted at the dashboard
// layout level) so it's reachable from every tab and the admin stack alike.
import { Pressable, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import ShekiAIOrb from './ShekiAIOrb';

export function ShekiAIFab() {
  const { isAuthenticated } = useUser();
  const pathname = usePathname();

  // Don't float over its own screen, and don't show before login (isAuthenticated
  // is already false throughout (auth), but this is the explicit guard).
  if (!isAuthenticated || pathname === '/ai-assistant') return null;

  return (
    <Pressable
      onPress={() => router.push('/ai-assistant')}
      accessibilityLabel="Open ShekiAI assistant"
      style={styles.wrapper}
    >
      <ShekiAIOrb size={56} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 18,
    bottom: 100,
    zIndex: 50,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});
