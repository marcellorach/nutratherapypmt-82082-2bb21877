
import { useState, useEffect } from 'react';
import { Nutraceutical } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mapDbToUiFormat } from '@/utils/nutraceuticals-mapper';
// Mock data removed — production mode only uses DB data
import { useDataManagement } from '@/hooks/useDataManagement';

export const useNutraceuticalsData = () => {
  const [dbNutraceuticals, setDbNutraceuticals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { settings } = useDataManagement();

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
    
    // Adicionar listener para mudanças nas configurações de dados
    const handleDataUpdate = () => {
      console.log('Dados atualizados, recarregando nutracêuticos...');
      loadNutraceuticals();
    };
    
    window.addEventListener('nutraceuticals-imported', handleImport);
    window.addEventListener('nutraceuticals-updated', handleDataUpdate);
    
    // Disparar evento de atualização após limpeza de duplicatas
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('nutraceuticals-updated'));
    }, 500);
    
    return () => {
      window.removeEventListener('nutraceuticals-imported', handleImport);
      window.removeEventListener('nutraceuticals-updated', handleDataUpdate);
    };
  }, []);

  // Função para atualizar os dados
  const handleRefreshData = () => {
    setIsRefreshing(true);
    
    loadNutraceuticals().then(() => {
      setIsRefreshing(false);
      // Disparar evento para notificar outros componentes
      window.dispatchEvent(new CustomEvent('nutraceuticals-updated'));
      toast({
        title: "Dados atualizados",
        description: "A lista de nutracêuticos foi atualizada com sucesso."
      });
    });
  };

  // Combinar dados baseado no modo configurado
  const getAllNutraceuticals = (): Nutraceutical[] => {
    const dbData = mapDbToUiFormat(dbNutraceuticals);
    
    switch (settings.data_mode) {
      case 'production':
        // Apenas dados do banco (sem mock)
        return dbData;
      
      case 'development':
        // Priorizar dados mock sobre dados do banco
        return [...mockNutraceuticals, ...dbData];
      
      case 'hybrid':
      default:
        // Combinar dados do banco com dados mock (padrão atual)
        return [...dbData, ...mockNutraceuticals];
    }
  };

  const allNutraceuticals: Nutraceutical[] = getAllNutraceuticals();

  return {
    nutraceuticals: allNutraceuticals,
    isLoading,
    isRefreshing,
    error,
    handleRefreshData
  };
};
