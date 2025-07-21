import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type DataMode = 'hybrid' | 'production' | 'development';

interface DataManagementSettings {
  data_mode: DataMode;
  use_seed_data: boolean;
  current_seed_batch: string;
  auto_cleanup_seeds: boolean;
}

export const useDataManagement = () => {
  const [settings, setSettings] = useState<DataManagementSettings>({
    data_mode: 'hybrid',
    use_seed_data: true,
    current_seed_batch: '',
    auto_cleanup_seeds: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get data types based on settings
  const getDataTypes = (): string[] => {
    const { data_mode, use_seed_data } = settings;
    
    switch (data_mode) {
      case 'production':
        return ['production'];
      case 'development':
        return use_seed_data ? ['seed', 'mock'] : ['production'];
      case 'hybrid':
      default:
        return use_seed_data 
          ? ['production', 'seed', 'mock'] 
          : ['production'];
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('data_management_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      if (data) {
        const settingsMap: Partial<DataManagementSettings> = {};
        data.forEach(({ setting_key, setting_value }) => {
          switch (setting_key) {
            case 'data_mode':
              settingsMap.data_mode = setting_value as DataMode;
              break;
            case 'use_seed_data':
              settingsMap.use_seed_data = setting_value === 'true';
              break;
            case 'current_seed_batch':
              settingsMap.current_seed_batch = setting_value;
              break;
            case 'auto_cleanup_seeds':
              settingsMap.auto_cleanup_seeds = setting_value === 'true';
              break;
          }
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações do sistema",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof DataManagementSettings, value: string | boolean) => {
    try {
      const stringValue = typeof value === 'boolean' ? value.toString() : value;
      
      const { error } = await supabase
        .from('data_management_settings')
        .update({ setting_value: stringValue })
        .eq('setting_key', key);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: "Sucesso",
        description: "Configuração atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração",
        variant: "destructive"
      });
    }
  };

  const cleanSeedData = async (batchId?: string) => {
    try {
      const { data, error } = await supabase.rpc('clean_seed_data', {
        batch_id_param: batchId || null
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: data || "Dados de teste removidos com sucesso",
      });

      return { success: true, message: data };
    } catch (error) {
      console.error('Erro ao limpar dados seed:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar dados de teste",
        variant: "destructive"
      });
      return { success: false, message: error.message };
    }
  };

  const generateNewSeedBatch = () => {
    const batchId = `seed_${Date.now()}`;
    updateSetting('current_seed_batch', batchId);
    return batchId;
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    isLoading,
    getDataTypes,
    updateSetting,
    cleanSeedData,
    generateNewSeedBatch,
    reload: loadSettings
  };
};