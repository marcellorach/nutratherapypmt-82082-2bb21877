
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export type DataMode = 'production' | 'development' | 'hybrid';

interface DataSettings {
  data_mode: DataMode;
  use_seed_data: boolean;
  current_seed_batch?: string;
}

/**
 * Hook para gerenciar tipos de dados e configurações de dados
 */
export const useDataManagement = () => {
  const [dataTypes, setDataTypes] = useState<string[]>(['production', 'seed', 'mock']);
  const [settings, setSettings] = useState<DataSettings>({
    data_mode: 'hybrid',
    use_seed_data: true,
    current_seed_batch: undefined
  });
  const [isLoading, setIsLoading] = useState(false);

  const getDataTypes = useCallback(() => {
    return dataTypes;
  }, [dataTypes]);

  const updateDataTypes = useCallback((newTypes: string[]) => {
    setDataTypes(newTypes);
  }, []);

  const updateSetting = useCallback((key: keyof DataSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const cleanSeedData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🗑️ Iniciando limpeza de dados seed...');
      
      // Importar supabase client dinamicamente
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Limpar dados na ordem correta (primeiro relacionamentos, depois tabelas principais)
      
      // 1. Limpar relacionamentos de nutracêuticos com condições
      const { error: conditionsError } = await supabase
        .from('nutraceutical_conditions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos exceto UUID impossível
      
      if (conditionsError) {
        console.error('Erro ao limpar nutraceutical_conditions:', conditionsError);
      } else {
        console.log('✅ Relacionamentos condições limpos');
      }
      
      // 2. Limpar benefícios
      const { error: benefitsError } = await supabase
        .from('nutraceutical_benefits')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (benefitsError) {
        console.error('Erro ao limpar nutraceutical_benefits:', benefitsError);
      } else {
        console.log('✅ Benefícios limpos');
      }
      
      // 3. Limpar contraindicações
      const { error: contraindicationsError } = await supabase
        .from('nutraceutical_contraindications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (contraindicationsError) {
        console.error('Erro ao limpar nutraceutical_contraindications:', contraindicationsError);
      } else {
        console.log('✅ Contraindicações limpas');
      }
      
      // 4. Limpar metadados científicos
      const { error: metadataError } = await supabase
        .from('nutraceutical_scientific_metadata')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (metadataError) {
        console.error('Erro ao limpar nutraceutical_scientific_metadata:', metadataError);
      } else {
        console.log('✅ Metadados científicos limpos');
      }
      
      // 5. Limpar estudos (relacionamentos)
      const { error: studiesError } = await supabase
        .from('nutraceutical_studies')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (studiesError) {
        console.error('Erro ao limpar nutraceutical_studies:', studiesError);
      } else {
        console.log('✅ Relacionamentos estudos limpos');
      }
      
      // 6. Limpar nutracêuticos
      const { error: nutraceuticalsError } = await supabase
        .from('nutraceuticals')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (nutraceuticalsError) {
        console.error('Erro ao limpar nutraceuticals:', nutraceuticalsError);
      } else {
        console.log('✅ Nutracêuticos limpos');
      }
      
      // 7. Limpar condições de saúde
      const { error: healthConditionsError } = await supabase
        .from('health_conditions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (healthConditionsError) {
        console.error('Erro ao limpar health_conditions:', healthConditionsError);
      } else {
        console.log('✅ Condições de saúde limpas');
      }
      
      // 8. Limpar categorias
      const { error: categoriesError } = await supabase
        .from('nutraceutical_categories')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (categoriesError) {
        console.error('Erro ao limpar nutraceutical_categories:', categoriesError);
      } else {
        console.log('✅ Categorias limpas');
      }
      
      console.log('✅ Limpeza de dados concluída com sucesso!');
      
      // Resetar batch atual
      setSettings(prev => ({ ...prev, current_seed_batch: undefined }));
      
      // Toast de sucesso
      toast({
        title: "✅ Limpeza concluída com sucesso!",
        description: "Todos os dados seed foram removidos do banco de dados. Agora você pode executar a Fase 1 novamente.",
        duration: 5000,
      });
      
    } catch (error) {
      console.error('❌ Erro crítico ao limpar dados:', error);
      
      // Toast de erro
      toast({
        title: "❌ Erro ao limpar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido ao limpar dados seed.",
        variant: "destructive",
        duration: 6000,
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateNewSeedBatch = useCallback(() => {
    const batchId = `batch_${Date.now()}`;
    setSettings(prev => ({ ...prev, current_seed_batch: batchId }));
    return batchId;
  }, []);

  return {
    dataTypes,
    getDataTypes,
    updateDataTypes,
    settings,
    isLoading,
    updateSetting,
    cleanSeedData,
    generateNewSeedBatch
  };
};
