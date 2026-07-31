import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSignUp } from '@/contexts/SignUpContext';
import { changeAppLanguage } from '@/lib/i18n';

const HAS_ONBOARDED_LANGUAGE_KEY = '@has_selected_language';

const languages = [
  { code: 'en', label: 'language.english', flag: '🇺🇸' },
  { code: 'fr', label: 'language.french', flag: '🇫🇷' },
  { code: 'ha', label: 'language.hausa', flag: '🇳🇬' },
  { code: 'yo', label: 'language.yoruba', flag: '🇳🇬' },
  { code: 'ig', label: 'language.igbo', flag: '🇳🇬' },
  { code: 'sw', label: 'language.swahili', flag: '🇹🇿' },
];

export default function LanguageSelectScreen() {
  const { t, i18n } = useTranslation();
  const { setField } = useSignUp();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSettingsMode = mode === 'settings';
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
    isSettingsMode ? i18n.language : null
  );
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
  if (!selectedLanguage) return;
  setLoading(true);

  try {
    await AsyncStorage.setItem(HAS_ONBOARDED_LANGUAGE_KEY, 'true');
    await changeAppLanguage(selectedLanguage);

    if (isSettingsMode) {
      router.back();
      return;
    }

    const languageNames: { [key: string]: string } = {
      en: 'English',
      fr: 'French',
      ha: 'Hausa',
      yo: 'Yoruba',
      ig: 'Igbo',
      sw: 'Swahili',
    };

    setField('language', languageNames[selectedLanguage] || 'English');
    setField('languageCode', selectedLanguage);

    router.replace('/(auth)/start');
  } catch (error) {
    console.error('Error saving language:', error);
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isSettingsMode && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#3F1F22" />
          </TouchableOpacity>
        )}
        <View style={styles.header}>
          <Text style={styles.title}>{t('language.title')}</Text>
          <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
        </View>

        <View style={styles.languageList}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageOption,
                selectedLanguage === lang.code && styles.selectedLanguage,
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={styles.languageName}>{t(lang.label)}</Text>
              {selectedLanguage === lang.code && (
                <Ionicons name="checkmark-circle" size={24} color="#3F1F22" style={styles.checkmark} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, !selectedLanguage && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedLanguage || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.continueText}>{t('common.continue')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3F1F22',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  languageList: {
    flex: 1,
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguage: {
    borderColor: '#3F1F22',
    backgroundColor: '#f0e8e9',
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: '#3F1F22',
    flex: 1,
  },
  checkmark: {
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    minHeight: 56,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  continueText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});