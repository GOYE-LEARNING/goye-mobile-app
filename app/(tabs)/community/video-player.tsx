// app/(tabs)/community/video-player.tsx
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
 
export default function VideoPlayer() {
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();
  const { colors } = useTheme();
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});

  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Video'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={true}
          shouldPlay={true}
          isLooping={false}
          onPlaybackStatusUpdate={status => setStatus(() => status)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.5)' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#fff', flex: 1, textAlign: 'center' },
  videoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  video: { width: width, height: height * 0.6 },
});