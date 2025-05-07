
import { useState, useEffect } from 'react';
import { Nutraceutical } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mapDbToUiFormat } from '@/utils/nutraceuticals-mapper';
import { nutraceuticals as mockNutraceuticals } from '@/data';

export const useNutraceuticalsData = () => {
  const [dbNutraceuticals, setDbNutraceuticals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Carregar nutracêuticos do banco de dados com suas relações
  const loadNutraceuticals = async () => {
    setIsLoading(true);
    try {
      console.log('Iniciando carregamento de nutracêuticos com relações...');
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select(`
          *,
          outcome:outcome_id(*),
          nutraceutical_benefits(id, benefit),
          nutraceutical_scientific_metadata(*),
          nutraceutical_conditions!nutraceutical_conditions(
            id, 
            relationship_type,
            efficacy_score,
            notes,
            condition:health_conditions(*)
          ),
          nutraceutical_studies!nutraceutical_studies(
            id,
            relevance_score,
            study:scientific_studies(*)
          )
        `)
        .order('name');
        
      if (error) {
        throw error;
      }
      
      console.log(`Carregados ${data?.length || 0} nutracêuticos com suas relações`);
      
      // Para cada nutracêutico, conte as relações
      const enhancedData = (data || []).map(nutra => {
        const conditionCount = nutra.nutraceutical_conditions?.length || 0;
        const studyCount = nutra.nutraceutical_studies?.length || 0;
        
        console.log(`Nutracêutico ${nutra.name}: ${conditionCount} condições, ${studyCount} estudos`);
        
        return {
          ...nutra,
          conditionCount,
          studyCount
        };
      });
      
      setDbNutraceuticals(enhancedData);
    } catch (err: any) {
      console.error('Erro ao carregar nutracêuticos:', err);
      toast({
        title: "Erro ao carregar dados",
        description: err.message || "Não foi possível carregar os nutracêuticos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadNutraceuticals();
    
    // Adicionar listener para recarregar após importação
    const handleImport = () => {
      console.log('Evento de importação detectado, recarregando nutracêuticos...');
      loadNutraceuticals();
    };
    
    window.addEventListener('nutraceuticals-imported', handleImport);
    
    return () => {
      window.removeEventListener('nutraceuticals-imported', handleImport);
    };
  }, []);

  // Função para atualizar os dados
  const handleRefreshData = () => {
    setIsRefreshing(true);
    
    loadNutraceuticals().then(() => {
      setIsRefreshing(false);
      toast({
        title: "Dados atualizados",
        description: "A lista de nutracêuticos foi atualizada com sucesso."
      });
    });
  };

  // Combinar dados do banco com dados de exemplo
  const allNutraceuticals: Nutraceutical[] = [
    ...mapDbToUiFormat(dbNutraceuticals),
    ...mockNutraceuticals
  ];

  return {
    nutraceuticals: allNutraceuticals,
    isLoading,
    isRefreshing,
    handleRefreshData
  };
};
