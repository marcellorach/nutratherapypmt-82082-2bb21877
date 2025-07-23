
import { useState, useCallback } from 'react';

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
      // Implementar limpeza de dados de teste
      console.log('Limpando dados de teste...');
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
