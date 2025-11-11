import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedCallback } from '@/hooks/performance/useDebounce';

type TranslatingState = Record<string, boolean>;
type ManualEditTracking = {
  pt: Record<string, number>;
  en: Record<string, number>;
};

/**
 * Hook reutilizável para tradução automática bidirecional (PT ↔ EN)
 * 
 * @example
 * const { translating, translateField, lastManualEdit } = useAutoTranslate();
 * 
 * // Em um onChange handler:
 * onChange={(e) => {
 *   setFormData({ ...formData, name: e.target.value });
 *   lastManualEdit.current.pt.name = Date.now();
 *   translateField('name', e.target.value, 'pt');
 * }}
 */
export const useAutoTranslate = () => {
  const [translating, setTranslating] = useState<TranslatingState>({});

  // Track last manual edits to prevent overwriting user input
  const lastManualEdit = useRef<ManualEditTracking>({
    pt: {},
    en: {}
  });

  /**
   * Traduz um campo automaticamente usando a edge function translate-text
   * 
   * @param field - Nome do campo (ex: 'name', 'description')
   * @param value - Valor a ser traduzido
   * @param sourceLang - Idioma de origem ('pt' ou 'en')
   * @param context - Contexto específico para melhor tradução (ex: 'nutraceutical_name', 'title')
   */
  const translateField = useDebouncedCallback(
    async (
      field: string,
      value: string,
      sourceLang: 'pt' | 'en',
      context?: string,
      formData?: any,
      setFormData?: (data: any) => void
    ) => {
      if (!value.trim() || !setFormData || !formData) return;

      const targetLang = sourceLang === 'pt' ? 'en' : 'pt';
      const targetField = sourceLang === 'pt' ? `${field}_en` : field;
      const currentTargetValue = formData[targetField];

      // Don't translate if target field was manually edited in the last 30 seconds
      const timeSinceManualEdit = Date.now() - (lastManualEdit.current[targetLang][field] || 0);
      if (timeSinceManualEdit < 30000 && currentTargetValue) {
        console.log(`Skipping translation: ${field} was manually edited ${timeSinceManualEdit}ms ago`);
        return;
      }

      setTranslating(prev => ({ ...prev, [field]: true }));

      try {
        const { data, error } = await supabase.functions.invoke('translate-text', {
          body: {
            text: value,
            sourceLang,
            targetLang,
            context: context || field
          }
        });

        if (error) throw error;

        if (data?.translatedText) {
          setFormData((prev: any) => ({
            ...prev,
            [targetField]: data.translatedText
          }));
        }
      } catch (error) {
        console.error('Translation error:', error);
        // Don't show toast for translation errors to avoid disrupting user experience
      } finally {
        setTranslating(prev => ({ ...prev, [field]: false }));
      }
    },
    1500,
    []
  );

  /**
   * Reseta o tracking de edições manuais
   * Útil ao abrir/fechar diálogos
   */
  const resetManualEditTracking = () => {
    lastManualEdit.current = {
      pt: {},
      en: {}
    };
  };

  return {
    translating,
    translateField,
    lastManualEdit,
    resetManualEditTracking
  };
};
