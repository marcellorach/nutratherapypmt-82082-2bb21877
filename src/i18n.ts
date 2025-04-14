
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationEN from './locales/en/translation.json';
import translationPT from './locales/pt/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  pt: {
    translation: translationPT
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'pt', // Default language
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false // React already escapes by default
    },
    react: {
      useSuspense: false // Disable suspense to prevent issues during loading
    }
  });

export default i18n;
