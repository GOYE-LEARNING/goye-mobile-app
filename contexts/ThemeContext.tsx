// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme_dark';

// ── Color tokens ─────────────────────────────────────────────────────────────
export const lightColors = {
  background:      '#ffffff',
  backgroundSoft:  '#FAF8F8',
  backgroundMuted: '#F8F8F8',
  card:            '#ffffff',
  cardContent:     '#FAF8F8',
  text:            '#333333',
  textSecondary:   '#666666',
  textMuted:       '#999999',
  textLight:       '#71748C',
  brand:           '#3F1F22',
  brandLight:      '#EBE5E7',
  brandLighter:    '#F0E6E6',
  border:          '#f0f0f0',
  borderMid:       '#E0E0E0',
  success:         '#22c55e',
  headerBg:        '#3F1F22',
  headerText:      '#ffffff',
  headerTextMuted: 'rgba(255,255,255,0.8)',
  modalBg:         '#ffffff',
  inputBg:         '#ffffff',
  inputBorder:     '#E0E0E0',
  shadow:          '#000000',
};

export const darkColors: typeof lightColors = {
  background:      'rgb(18, 18, 18)',
  backgroundSoft:  '#1E1E1E',
  backgroundMuted: '#1A1A1A',
  card:            '#1E1E1E',
  cardContent:     '#252525',
  text:            '#F0F0F0',
  textSecondary:   '#AAAAAA',
  textMuted:       '#777777',
  textLight:       '#9999AA',
  brand:           '#de7621',
  brandLight:      '#3A2A2C',
  brandLighter:    '#2E1F21',
  border:          '#2A2A2A',
  borderMid:       '#333333',
  success:         '#22c55e',
  headerBg:        '#2A1315',
  headerText:      '#ffffff',
  headerTextMuted: 'rgba(255,255,255,0.7)',
  modalBg:         '#121212',
  inputBg:         '#1E1E1E',
  inputBorder:     '#333333',
  shadow:          '#000000',
};

// ── Context ───────────────────────────────────────────────────────────────────
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof lightColors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'true') setIsDark(true);
      setLoaded(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(THEME_KEY, String(next));
  };

  const colors = isDark ? darkColors : lightColors;

  // Don't render children until theme preference is loaded — avoids light flash
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);