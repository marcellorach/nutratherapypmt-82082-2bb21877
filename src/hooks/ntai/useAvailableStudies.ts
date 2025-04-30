
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
        .is('analysis_data', null); // Filtrar estudos ainda não processados
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mappedStudies: AvailableStudy[] = data.map(study => ({
          id: study.id,
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
        // Se não encontrar nada, usar dados simulados para fins de demonstração
        setAvailableStudies([
          {
            id: "1",
            title: "Efeitos de Glucosamina na Saúde Articular",
            description: "Estudo randomizado sobre glucosamina",
            journal: "Journal of Veterinary Medicine",
            kanban_status: "new",
            import_type: "manual",
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            title: "Ômega 3 e Saúde Cardiovascular em Cães",
            description: "Meta-análise de estudos sobre ômega 3",
            journal: "Animal Health Research",
            kanban_status: "new",
            import_type: "scispace",
            created_at: new Date().toISOString(),
          },
          {
            id: "3",
            title: "Curcumina como Anti-inflamatório Natural",
            description: "Revisão sistemática sobre curcumina",
            journal: "Nutraceutical Research",
            kanban_status: "new",
            import_type: "scispace",
            created_at: new Date().toISOString(),
          }
        ]);
      }
    } catch (err) {
      console.error('Erro ao carregar estudos disponíveis:', err);
      // Dados simulados para fallback
      setAvailableStudies([
        {
          id: "1",
          title: "Efeitos de Glucosamina na Saúde Articular",
          description: "Estudo randomizado sobre glucosamina",
          journal: "Journal of Veterinary Medicine",
          kanban_status: "new",
          import_type: "manual",
          created_at: new Date().toISOString(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar estudos ao inicializar
  useEffect(() => {
    refreshAvailableStudies();
  }, []);

  return {
    availableStudies,
    isLoading,
    refreshAvailableStudies
  };
};
