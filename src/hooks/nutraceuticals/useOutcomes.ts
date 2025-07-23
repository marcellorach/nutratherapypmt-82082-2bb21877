
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOutcomes = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar outcomes
  const {
    data: outcomes = [],
    isLoading: isQueryLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['outcomes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_conditions')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao buscar outcomes:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar outcome
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('health_conditions')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Outcome criado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['outcomes'] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar outcome:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar outcome",
        variant: "destructive"
      });
    }
  });

  const fetchOutcomes = useCallback(() => {
    refetch();
  }, [refetch]);

  const createOutcome = useCallback((data: any) => {
    createMutation.mutate(data);
  }, [createMutation]);

  return {
    outcomes,
    isLoading: isQueryLoading || isLoading,
    error: queryError?.message || error,
    fetchOutcomes,
    createOutcome,
    refetch
  };
};
