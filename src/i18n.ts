import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

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

// Limpa qualquer configuração de idioma anterior no localStorage
if (typeof window !== 'undefined') {
  localStorage.removeItem('i18nextLng');
}

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt', // Força português como idioma fixo
    fallbackLng: 'pt',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18next;
