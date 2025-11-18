import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import i18next from 'i18next';

/**
 * Hook para gerenciar atualizações em tempo real de traduções
 * Retorna a versão atual das traduções para forçar re-renders quando necessário
 */
export function useTranslations() {
  const [version, setVersion] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe a mudanças na tabela translations
    const channel = supabase
      .channel('translations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'translations'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em translations:', payload.eventType);
          setVersion((v) => v + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Força o reload das traduções do banco de dados
   */
  const reloadTranslations = async () => {
    setIsLoading(true);
    try {
      // Incrementa versão para forçar re-render
      setVersion((v) => v + 1);
      
      // Aguarda um pequeno delay para garantir que o i18next processou as mudanças
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    version,
    isLoading,
    reloadTranslations,
    currentLanguage: i18next.language
  };
}
