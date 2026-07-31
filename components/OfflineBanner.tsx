// components/OfflineBanner.tsx
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '@/contexts/NetworkContext';

export function OfflineBanner() {
  const { isConnected } = useNetwork();

  if (isConnected) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea} pointerEvents="none">
      <View style={styles.banner}>
        <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
        <Text style={styles.text}>No internet connection</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B71C1C',
    paddingVertical: 8,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
