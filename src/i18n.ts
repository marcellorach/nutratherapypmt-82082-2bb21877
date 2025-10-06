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
    lng: 'pt',
    fallbackLng: false, // Não usar fallback, só PT existe
    supportedLngs: ['pt'], // BLOQUEAR outros idiomas
    load: 'languageOnly', // Ignorar regionalizações
    debug: false,
    interpolation: {
      escapeValue: false
    },
    pluralSeparator: '_',
    contextSeparator: '_',
    react: {
      useSuspense: false // Evitar problemas de sincronização
    }
  })
  .then(() => {
    // FORÇAR português após inicialização
    i18next.changeLanguage('pt');
    console.log('i18next forçado para PT, idioma atual:', i18next.language);
  });

// Proteção contra mudanças automáticas de idioma
i18next.on('languageChanged', (lng) => {
  if (lng !== 'pt') {
    console.warn(`Tentativa de mudar idioma para ${lng} bloqueada`);
    i18next.changeLanguage('pt');
  }
});

export default i18next;
