// File: app/(auth)/start.tsx
// First screen new users see: circle collage, big headline, and a dark Sign Up button.

import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');

const AVATARS: ImageSourcePropType[] = [
  require('@/assets/images/avatars/avatar-1.png'),
  require('@/assets/images/avatars/avatar-2.png'),
  require('@/assets/images/avatars/avatar-3.png'),
  require('@/assets/images/avatars/avatar-4.png'),
  require('@/assets/images/avatars/avatar-5.png'),
  require('@/assets/images/avatars/avatar-6.png'),
  require('@/assets/images/avatars/avatar-7.png'),
];

const PINK = '#F9B3C6';
const BLUE = '#2F3CE0';
const GREEN = '#18B58F';
const YELLOW = '#F6C21A';
const INK = '#16161A';

interface Bubble {
  avatar: number;
  size: number;
  x: number;
  y: number;
  ring: string;
  ringWidth: number;
}

// Positions are fractions of the screen width so the collage scales on any device.
const BUBBLES: Bubble[] = [
  { avatar: 2, size: 0.4, x: 0.28, y: 0.26, ring: PINK, ringWidth: 8 },
  { avatar: 0, size: 0.24, x: -0.05, y: 0.1, ring: '#E3E8F2', ringWidth: 4 },
  { avatar: 4, size: 0.1, x: 0.5, y: 0.04, ring: YELLOW, ringWidth: 3 },
  { avatar: 3, size: 0.22, x: 0.78, y: 0.05, ring: BLUE, ringWidth: 6 },
  { avatar: 1, size: 0.26, x: -0.07, y: 0.5, ring: GREEN, ringWidth: 7 },
  { avatar: 6, size: 0.1, x: 0.44, y: 0.74, ring: BLUE, ringWidth: 3 },
  { avatar: 5, size: 0.26, x: 0.74, y: 0.6, ring: YELLOW, ringWidth: 7 },
];

export default function Start() {
  const router = useRouter();
  const scales = useRef(BUBBLES.map(() => new Animated.Value(0.6))).current;
  const fades = useRef(BUBBLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      90,
      BUBBLES.map((_, i) =>
        Animated.parallel([
          Animated.spring(scales[i], { toValue: 1, damping: 12, stiffness: 140, useNativeDriver: true }),
          Animated.timing(fades[i], { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ),
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.backdrop} pointerEvents="none" />

      <View style={styles.header}>
        <View style={styles.brand}>
          <Image source={require('@/assets/images/icon.png')} style={styles.brandMark} />
          <Text style={styles.brandName}>GOYE</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')} hitSlop={12} accessibilityRole="button">
          <Text style={styles.loginLink}>LOGIN</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.collage} pointerEvents="none">
        {BUBBLES.map((b, i) => {
          const d = b.size * W;
          return (
            <Animated.View
              key={i}
              style={[
                styles.bubble,
                {
                  width: d,
                  height: d,
                  borderRadius: d / 2,
                  left: b.x * W,
                  top: b.y * W,
                  borderColor: b.ring,
                  borderWidth: b.ringWidth,
                  opacity: fades[i],
                  transform: [{ scale: scales[i] }],
                },
              ]}
            >
              <Image source={AVATARS[b.avatar]} style={styles.avatar} />
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{"Let's Get\nStarted"}</Text>
        <Text style={styles.subtitle}>Grow in faith, together.</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(auth)/account-type')}
          activeOpacity={0.9}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>SIGN UP</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backdrop: {
    position: 'absolute',
    width: W * 1.3,
    height: W * 1.3,
    borderRadius: W * 0.65,
    backgroundColor: '#F1F4F9',
    right: -W * 0.45,
    top: -W * 0.1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    color: INK,
  },
  loginLink: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: INK,
  },
  collage: {
    height: W * 1.0,
    marginTop: 4,
  },
  bubble: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '700',
    color: INK,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#8A8F9C',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
});
