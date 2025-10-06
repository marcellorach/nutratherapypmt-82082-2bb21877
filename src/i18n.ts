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

// Inicializa i18next de forma síncrona
const initI18n = async () => {
  await i18next
    .use(initReactI18next)
    .init({
      resources,
      lng: 'pt',
      fallbackLng: 'pt',
      debug: false,
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false
      },
      keySeparator: '.',
      nsSeparator: false
    });

  // Garante que o idioma inicial seja português
  await i18next.changeLanguage('pt');
  
  // Adiciona listener para permitir troca de idioma via LanguageSwitcher
  i18next.on('languageChanged', (lng) => {
    console.log(`Language changed to: ${lng}`);
  });
};

// Inicializa imediatamente
initI18n();

export default i18next;
