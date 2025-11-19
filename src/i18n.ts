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

// Detecta o idioma salvo ou usa inglês como padrão
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
const defaultLanguage = savedLanguage || 'en';

// Força reinicialização COMPLETA das traduções limpando cache do i18next
if (typeof window !== 'undefined') {
  const currentVersion = '1.3.24'; // Incrementar para forçar reload
  const storedVersion = localStorage.getItem('i18n-version');
  
  // SEMPRE limpar na primeira carga (forçar)
  const forceClean = !storedVersion || storedVersion !== currentVersion;
  
  if (forceClean) {
    console.log('🔥 LIMPEZA FORÇADA DE CACHE I18N - Versão:', currentVersion);
    
    // 1. Limpar TUDO relacionado a i18n
    const keysToRemove = ['i18nextLng', 'language', 'i18n-version'];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 2. Limpar TODOS os prefixos i18next*
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('i18next')) {
        localStorage.removeItem(key);
      }
    });
    
    // 3. Limpar sessionStorage também
    sessionStorage.clear();
    
    // 4. Salvar nova versão
    localStorage.setItem('i18n-version', currentVersion);
    console.log('✅ Cache limpo - recarregando em 500ms...');
    
    // 5. Delay antes do reload para garantir que salvou
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
}

// Inicializa i18next de forma síncrona
i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    debug: true,
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
