
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

  // Carregar nutracêuticos do banco de dados
  const loadNutraceuticals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select(`
          *,
          category_id:nutraceutical_categories(*),
          nutraceutical_benefits(id, benefit),
          nutraceutical_scientific_metadata(*),
          nutraceutical_health_conditions:nutraceutical_conditions(
            id, 
            relationship_type,
            efficacy_score,
            condition:health_conditions(*)
          ),
          nutraceutical_studies(
            id,
            relevance_score,
            study:scientific_studies(*)
          )
        `)
        .order('name');
        
      if (error) {
        throw error;
      }
      
      setDbNutraceuticals(data || []);
      console.log('Nutracêuticos carregados:', data);
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
