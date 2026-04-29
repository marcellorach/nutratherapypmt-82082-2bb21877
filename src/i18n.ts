import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Carrega traduções diretamente (bundled)
import translationEN from './locales/en/translation.json';
import translationPT from './locales/pt/translation.json';

// Versão para controle de cache - incrementar quando houver mudanças significativas
const I18N_VERSION = '1.39.0';

const resources = {
  en: {
    translation: translationEN
  },
  pt: {
    translation: translationPT
  }
};

// Detecta o idioma salvo ou usa inglês como padrão
const getSavedLanguage = (): string => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('language') || 'en';
};

// Limpa cache de forma segura SEM reload automático
const clearI18nCache = () => {
  if (typeof window === 'undefined') return;
  
  const storedVersion = localStorage.getItem('i18n-version');
  
  if (storedVersion !== I18N_VERSION) {
    console.log('🔄 Atualizando cache i18n:', storedVersion, '->', I18N_VERSION);
    
    // Limpa apenas chaves relacionadas ao i18next (não o idioma salvo pelo usuário)
    const keysToRemove = ['i18nextLng'];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Limpa prefixos i18next* do localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('i18next') && key !== 'i18n-version') {
        localStorage.removeItem(key);
      }
    });
    
    // Atualiza versão
    localStorage.setItem('i18n-version', I18N_VERSION);
    console.log('✅ Cache i18n atualizado para versão:', I18N_VERSION);
  }
};

// Limpa cache antes de inicializar
clearI18nCache();

// Inicializa i18next de forma síncrona e robusta
i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    keySeparator: '.',
    nsSeparator: false,
    // Configurações para melhor fallback
    returnEmptyString: false,
    returnNull: false,
    saveMissing: false,
    missingKeyHandler: (lng, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Missing translation key: ${key} [${lng}/${ns}]`);
      }
    }
  });

// Listener para mudança de idioma
i18next.on('languageChanged', (lng) => {
  console.log(`🌍 Language changed to: ${lng}`);
  // Salva a preferência do usuário
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lng);
  }
});

// Função utilitária para validar se as traduções foram carregadas corretamente
export const validateTranslations = (): boolean => {
  const criticalKeys = [
    'common.save',
    'common.cancel',
    'navbar.home'
  ];
  
  const missing = criticalKeys.filter(key => {
    const result = i18next.t(key);
    return result === key;
  });
  
  if (missing.length > 0) {
    console.error('❌ Critical translations missing:', missing);
    return false;
  }
  
  console.log('✅ All critical translations loaded successfully');
  return true;
};

// Valida traduções após inicialização
if (typeof window !== 'undefined') {
  // Aguarda um tick para garantir que o i18next está pronto
  setTimeout(() => {
    validateTranslations();
  }, 100);
}

export default i18next;
