// components/CustomAlert.tsx
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
}

const CONFIG: Record<AlertType, { icon: string; bg: string; ring: string }> = {
  success:  { icon: 'checkmark',      bg: '#1D9E75', ring: '#E1F5EE' },
  error:    { icon: 'close',          bg: '#E24B4A', ring: '#FCEBEB' },
  info:     { icon: 'information',    bg: '#378ADD', ring: '#E6F1FB' },
  warning:  { icon: 'warning-outline', bg: '#EF9F27', ring: '#FAEEDA' },
};

export function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  primaryLabel = 'OK',
  secondaryLabel,
  onPrimary,
  onSecondary,
}: CustomAlertProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cfg = CONFIG[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 180 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[s.overlay, { opacity }]}>
        <Animated.View style={[s.card, { backgroundColor: colors.background, transform: [{ scale }] }]}>
          {/* Icon ring */}
          <View style={[s.ringOuter, { backgroundColor: cfg.ring }]}>
            <View style={[s.ringInner, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon as any} size={30} color="#fff" />
            </View>
          </View>

          <Text style={[s.title, { color: colors.text }]}>{title}</Text>
          <Text style={[s.message, { color: colors.textMuted }]}>{message}</Text>

          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: cfg.bg }]} onPress={onPrimary} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>{primaryLabel}</Text>
          </TouchableOpacity>

          {secondaryLabel && onSecondary && (
            <TouchableOpacity style={[s.secondaryBtn, { backgroundColor: colors.backgroundSoft, borderColor: colors.borderMid }]} onPress={onSecondary} activeOpacity={0.7}>
              <Text style={[s.secondaryBtnText, { color: colors.text }]}>{secondaryLabel}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ringInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
});