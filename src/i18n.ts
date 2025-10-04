
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Carrega traduções
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

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    debug: true, // Ativado para debug
    interpolation: {
      escapeValue: false
    }
  });

// Log para verificar se as traduções foram carregadas
console.log('i18n initialized with languages:', Object.keys(resources));
console.log('Current language:', i18next.language);
console.log('Sample translation (admin.sidebar.actions.analytics):', i18next.t('admin.sidebar.actions.analytics'));

export default i18next;
