
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useIngredients = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query para buscar ingredientes
  const {
    data: ingredients = [],
    isLoading: isQueryLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select('id, name, chemical_compound')
        .order('name');

      if (error) {
        console.error('Erro ao buscar ingredientes:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const fetchIngredients = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    ingredients,
    isLoading: isQueryLoading || isLoading,
    error: queryError?.message || error,
    fetchIngredients,
    refetch
  };
};
