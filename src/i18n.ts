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

// Inicializa i18next
i18next
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
      useSuspense: false // Evita problemas de timing na renderização
    },
    keySeparator: '.',
    nsSeparator: false
  });

// Garante que o idioma inicial seja português
i18next.changeLanguage('pt');

// Adiciona listener para permitir troca de idioma via LanguageSwitcher
i18next.on('languageChanged', (lng) => {
  console.log(`Language changed to: ${lng}`);
});

export default i18next;
