
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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar nutracêuticos do banco de dados com suas relações
  const loadNutraceuticals = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando carregamento de nutracêuticos...');
      
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select(`
          *,
          nutraceutical_benefits(id, benefit),
          scientific_metadata:nutraceutical_scientific_metadata(*),
          nutraceutical_conditions(
            id, 
            relationship_type,
            efficacy_score,
            notes,
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
      
      if (!data) {
        console.log('Nenhum nutracêutico encontrado');
        setDbNutraceuticals([]);
        return;
      }
      
      console.log(`Carregados ${data.length || 0} nutracêuticos com suas relações`);
      
      // Para cada nutracêutico, conte as relações
      const enhancedData = data.map(nutra => {
        // Verificação de segurança para evitar erros com objetos nulos/indefinidos
        const conditionCount = Array.isArray(nutra.nutraceutical_conditions) 
          ? nutra.nutraceutical_conditions.length 
          : 0;
          
        const studyCount = Array.isArray(nutra.nutraceutical_studies) 
          ? nutra.nutraceutical_studies.length 
          : 0;
        
        if (nutra.name) {
          console.log(`Nutracêutico ${nutra.name}: ${conditionCount} condições, ${studyCount} estudos`);
        }
        
        return {
          ...nutra,
          conditionCount,
          studyCount
        };
      });
      
      setDbNutraceuticals(enhancedData);
    } catch (err: any) {
      console.error('Erro ao carregar nutracêuticos:', err);
      setError(err.message || 'Não foi possível carregar os dados dos nutracêuticos');
      
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
    error,
    handleRefreshData
  };
};
