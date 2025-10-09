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

// Detecta o idioma salvo ou usa português como padrão
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
const defaultLanguage = savedLanguage || 'pt';

// Força reinicialização das traduções limpando cache do i18next
if (typeof window !== 'undefined') {
  const currentVersion = '1.0.4'; // Incrementar para forçar reload
  const storedVersion = localStorage.getItem('i18n-version');
  if (storedVersion !== currentVersion) {
    localStorage.setItem('i18n-version', currentVersion);
  }
}

// Inicializa i18next de forma síncrona
i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
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

// Adiciona listener para permitir troca de idioma via LanguageSwitcher
i18next.on('languageChanged', (lng) => {
  console.log(`Language changed to: ${lng}`);
});

export default i18next;
