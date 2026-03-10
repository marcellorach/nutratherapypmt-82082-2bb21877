import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import type { TOptions } from 'i18next';

/**
 * Formata uma chave de tradução em texto legível
 * Ex: "studies.search.title" -> "Title"
 */
const formatKeyAsText = (key: string): string => {
  const lastSegment = key.split('.').pop() || key;
  return lastSegment
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
};

/**
 * Hook seguro para traduções com fallback inteligente
 * 
 * Quando uma chave de tradução não existe ou retorna a própria chave,
 * este hook fornece um fallback legível em vez de mostrar a chave literal.
 * 
 * Também loga warnings no console para facilitar debugging.
 */
export function useSafeTranslation() {
  const { t, i18n, ready } = useTranslation();

  const safeT = useCallback((key: string, optionsOrDefault?: string | TOptions, maybeOptions?: TOptions): string => {
    // Determina se o segundo parâmetro é um defaultValue (string) ou options (object)
    let defaultValue: string | undefined;
    let options: TOptions | undefined;

    if (typeof optionsOrDefault === 'string') {
      defaultValue = optionsOrDefault;
      options = maybeOptions;
    } else {
      options = optionsOrDefault;
    }

    // Tenta obter a tradução
    const result = t(key, options as TOptions) as string;

    // Se retornou a própria chave, usa o fallback
    if (result === key) {
      // Log apenas em desenvolvimento
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Translation missing: ${key} [${i18n.language}]`);
      }
      
      // Usa o defaultValue se fornecido, senão formata a chave
      return defaultValue || formatKeyAsText(key);
    }

    return result;
  }, [t, i18n.language]);

  return { 
    t: safeT, 
    i18n, 
    ready,
    // Expõe a função original para casos onde precisamos do comportamento padrão
    rawT: t 
  };
}

export default useSafeTranslation;
