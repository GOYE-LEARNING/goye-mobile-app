// app/index.tsx
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native'; // ✅ Add Text import
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useUser();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!isLoading && !hasNavigated.current) {
      hasNavigated.current = true;
      console.log('🔍 Index: Auth state determined, isAuthenticated:', isAuthenticated);
      
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          console.log('➡️ Index: Navigating to /(tabs)/home');
          router.replace('/(tabs)/home');
        } else {
          console.log('➡️ Index: Navigating to /(auth)/start');
          router.replace('/(auth)/start');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3F1F22" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3F1F22',
  },
});