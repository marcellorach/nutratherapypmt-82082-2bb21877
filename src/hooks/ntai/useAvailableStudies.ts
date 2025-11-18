
import { useState, useEffect } from 'react';
import { AvailableStudy } from './types/processing';
import { supabase } from '@/integrations/supabase/client';

export const useAvailableStudies = () => {
  const [availableStudies, setAvailableStudies] = useState<AvailableStudy[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAvailableStudies = async () => {
    setIsLoading(true);
    try {
      // Buscar estudos no banco de dados com status 'new' que ainda não foram processados
      const { data, error } = await supabase
        .from('processed_studies')
        .select('*')
        .eq('kanban_status', 'new')
        .is('analysis_data', null);

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedStudies: AvailableStudy[] = data.map(study => ({
          id: study.id, // Usar o ID correto do banco
          title: study.title || `Estudo ${study.study_id.substring(0, 8)}`,
          description: study.description || 'Sem descrição disponível',
          journal: study.journal || 'Fonte desconhecida',
          kanban_status: study.kanban_status,
          import_type: study.import_type,
          created_at: study.created_at
        }));
        
        setAvailableStudies(mappedStudies);
        console.log('Estudos disponíveis carregados:', mappedStudies.length);
      } else {
        console.log('Nenhum estudo disponível para processamento');
        setAvailableStudies([]);
      }
    } catch (err) {
      console.error('Erro ao carregar estudos disponíveis:', err);
      setAvailableStudies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAvailableStudies();
  }, []);

  return {
    availableStudies,
    isLoading,
    refreshAvailableStudies
  };
};
