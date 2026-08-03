// components/ShekiAIOrb.tsx
//
// Mobile port of the web app's ShekiAIOrb.tsx "face" — the same idle-life
// touches (blink, smile, a left head-turn) on independent loops so it reads
// as alive rather than a mechanical repeat, using RN's built-in Animated API
// (this app's chat screens already animate typing-dots that way rather than
// Reanimated, so this matches the existing convention).
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ShekiAIOrb({ size = 40, active = false }: { size?: number; active?: boolean }) {
  const glow = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: active ? 900 : 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: active ? 900 : 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );

    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(active ? 1600 : 3200),
        Animated.timing(blink, { toValue: 0.1, duration: 90, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 110, useNativeDriver: true }),
      ]),
    );

    const turnLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2800),
        Animated.timing(turn, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(1000),
        Animated.timing(turn, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(700),
      ]),
    );

    glowLoop.start();
    blinkLoop.start();
    turnLoop.start();
    return () => {
      glowLoop.stop();
      blinkLoop.stop();
      turnLoop.stop();
    };
  }, [active, glow, blink, turn]);

  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, active ? 1.08 : 1.02] });
  const faceX = turn.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.08] });
  const faceRotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-6deg'] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={['#FBB041', '#FFA500']}
          start={{ x: 0.35, y: 0.3 }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          alignItems: 'center',
          transform: [{ translateX: faceX }, { rotate: faceRotate }],
        }}
      >
        <View style={{ flexDirection: 'row', gap: size * 0.08 }}>
          <Animated.View
            style={{
              width: size * 0.09,
              height: size * 0.2,
              borderRadius: size * 0.05,
              backgroundColor: 'rgba(255,255,255,0.9)',
              transform: [{ scaleY: blink }],
            }}
          />
          <Animated.View
            style={{
              width: size * 0.09,
              height: size * 0.2,
              borderRadius: size * 0.05,
              backgroundColor: 'rgba(255,255,255,0.9)',
              transform: [{ scaleY: blink }],
            }}
          />
        </View>
        <View
          style={{
            marginTop: size * 0.06,
            width: size * 0.28,
            height: size * 0.1,
            borderBottomLeftRadius: size * 0.14,
            borderBottomRightRadius: size * 0.14,
            backgroundColor: 'rgba(255,255,255,0.85)',
          }}
        />
      </Animated.View>
    </View>
  );
}
