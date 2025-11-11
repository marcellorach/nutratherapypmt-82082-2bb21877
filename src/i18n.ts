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

// Força reinicialização COMPLETA das traduções limpando cache do i18next
if (typeof window !== 'undefined') {
  const currentVersion = '1.1.5'; // Incrementar para forçar reload
  const storedVersion = localStorage.getItem('i18n-version');
  
  if (storedVersion !== currentVersion) {
    console.log('🔄 Limpando cache de traduções...');
    
    // Limpar TUDO relacionado a i18n
    localStorage.removeItem('i18nextLng');
    localStorage.removeItem('language');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('i18next')) {
        localStorage.removeItem(key);
      }
    });
    
    localStorage.setItem('i18n-version', currentVersion);
    console.log('✅ Cache limpo - versão:', currentVersion);
    
    // Forçar reload da página para aplicar mudanças
    window.location.reload();
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
