import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import ha from '@/locales/ha.json';
import yo from '@/locales/yo.json';
import ig from '@/locales/ig.json';
import sw from '@/locales/sw.json';

const LANGUAGE_KEY = '@app_language';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ha: { translation: ha },
  yo: { translation: yo },
  ig: { translation: ig },
  sw: { translation: sw },
};

export const initI18n = async () => {
  if (i18n.isInitialized) return i18n;

  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

  if (!savedLanguage) {
    const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
    savedLanguage = Object.keys(resources).includes(deviceLanguage) ? deviceLanguage : 'en';
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

  return i18n;
};

export const changeAppLanguage = async (languageCode: string) => {
  if (!Object.keys(resources).includes(languageCode)) {
    console.warn(`Language ${languageCode} not supported, falling back to English`);
    languageCode = 'en';
  }

  await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
  await i18n.changeLanguage(languageCode);
  return i18n;
};

export default i18n;