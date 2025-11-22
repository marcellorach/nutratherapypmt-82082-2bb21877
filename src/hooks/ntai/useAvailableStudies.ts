import { useState, useEffect } from 'react';
import { AvailableStudy } from './types/processing';
import { supabase } from '@/integrations/supabase/client';

// Tipo para analysis_data
interface AnalysisData {
  extractedNutraceuticals?: any[];
  extractedConditions?: any[];
  [key: string]: any;
}

export const useAvailableStudies = () => {
  const [availableStudies, setAvailableStudies] = useState<AvailableStudy[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAvailableStudies = async () => {
    setIsLoading(true);
    try {
      // Buscar estudos com status 'new' (não verificamos analysis_data porque agora sempre é inicializado)
      const { data, error } = await supabase
        .from('processed_studies')
        .select('*')
        .eq('kanban_status', 'new')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Filtrar no client-side para pegar apenas estudos sem dados extraídos
        const unprocessedStudies = data.filter(study => {
          const analysisData = study.analysis_data as AnalysisData | null;
          const hasExtractedData = 
            (analysisData?.extractedNutraceuticals?.length > 0) ||
            (analysisData?.extractedConditions?.length > 0);
          return !hasExtractedData; // Retorna apenas estudos sem dados
        });

        const mappedStudies: AvailableStudy[] = unprocessedStudies.map(study => ({
          id: study.id,
          title: study.title || `Estudo ${study.study_id.substring(0, 8)}`,
          description: study.description || 'Aguardando processamento',
          journal: study.journal || 'Fonte desconhecida',
          kanban_status: study.kanban_status,
          import_type: study.import_type,
          created_at: study.created_at
        }));
        
        setAvailableStudies(mappedStudies);
        console.log('✅ Estudos disponíveis carregados:', mappedStudies.length);
      } else {
        console.log('ℹ️ Nenhum estudo disponível para processamento');
        setAvailableStudies([]);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar estudos disponíveis:', err);
      setAvailableStudies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAvailableStudies();

    // Subscribe to new studies being inserted
    const subscription = supabase
      .channel('new-studies')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'processed_studies',
          filter: 'kanban_status=eq.new'
        },
        (payload) => {
          console.log('📥 Novo estudo detectado:', payload.new);
          refreshAvailableStudies();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    availableStudies,
    isLoading,
    refreshAvailableStudies
  };
};
