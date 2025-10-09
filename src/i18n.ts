import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Detecta o idioma salvo ou usa português como padrão
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
const defaultLanguage = savedLanguage || 'pt';

// Força reinicialização das traduções limpando cache do i18next
if (typeof window !== 'undefined') {
  const currentVersion = '1.0.7'; // Incrementar para forçar reload
  const storedVersion = localStorage.getItem('i18n-version');
  if (storedVersion !== currentVersion) {
    localStorage.setItem('i18n-version', currentVersion);
  }
}

// Inicializa i18next de forma assíncrona
i18next
  .use(initReactI18next)
  .init({
    resources: {},
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

// Carrega as traduções de forma assíncrona
Promise.all([
  fetch('/src/locales/pt/translation.json').then(r => r.json()),
  fetch('/src/locales/en/translation.json').then(r => r.json())
]).then(([translationPT, translationEN]) => {
  i18next.addResourceBundle('pt', 'translation', translationPT);
  i18next.addResourceBundle('en', 'translation', translationEN);
  i18next.changeLanguage(defaultLanguage);
});

// Adiciona listener para permitir troca de idioma via LanguageSwitcher
i18next.on('languageChanged', (lng) => {
  console.log(`Language changed to: ${lng}`);
});

export default i18next;
