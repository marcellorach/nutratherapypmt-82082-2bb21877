
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
        .from('nutraceutical_outcomes')
        .select(`
          *,
          outcome_families (
            id,
            name,
            color,
            icon
          )
        `)
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
        .from('nutraceutical_outcomes')
        .insert([data])
        .select(`
          *,
          outcome_families (
            id,
            name,
            color,
            icon
          )
        `)
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

  // Mutation para atualizar outcome
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: result, error } = await supabase
        .from('nutraceutical_outcomes')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          outcome_families (
            id,
            name,
            color,
            icon
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Outcome atualizado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['outcomes'] });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar outcome:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar outcome",
        variant: "destructive"
      });
    }
  });

  // Mutation para deletar outcome
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('nutraceutical_outcomes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Outcome excluído com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['outcomes'] });
    },
    onError: (error: any) => {
      console.error('Erro ao excluir outcome:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir outcome",
        variant: "destructive"
      });
    }
  });

  const updateOutcome = useCallback((id: string, data: any) => {
    updateMutation.mutate({ id, data });
  }, [updateMutation]);

  const deleteOutcome = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  return {
    outcomes,
    isLoading: isQueryLoading || isLoading,
    error: queryError?.message || error,
    fetchOutcomes,
    createOutcome,
    updateOutcome,
    deleteOutcome,
    refetch
  };
};
