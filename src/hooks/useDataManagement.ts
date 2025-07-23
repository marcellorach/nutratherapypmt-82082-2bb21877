
import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar tipos de dados e configurações de dados
 */
export const useDataManagement = () => {
  const [dataTypes, setDataTypes] = useState<string[]>(['production', 'seed', 'mock']);

  const getDataTypes = useCallback(() => {
    return dataTypes;
  }, [dataTypes]);

  const updateDataTypes = useCallback((newTypes: string[]) => {
    setDataTypes(newTypes);
  }, []);

  return {
    dataTypes,
    getDataTypes,
    updateDataTypes
  };
};
