
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useConditions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar condições
  const {
    data: conditions = [],
    isLoading: isQueryLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['conditions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_conditions')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao buscar condições:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar condição
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
        description: "Condição criada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar condição:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar condição",
        variant: "destructive"
      });
    }
  });

  // Mutation para associar nutracêutico à condição
  const associateMutation = useMutation({
    mutationFn: async ({ 
      nutraceuticalId, 
      conditionId, 
      relationshipType, 
      efficacyScore, 
      notes 
    }: {
      nutraceuticalId: string;
      conditionId: string;
      relationshipType: "prevention" | "treatment" | "support";
      efficacyScore: number;
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('nutraceutical_conditions')
        .insert([{
          nutraceutical_id: nutraceuticalId,
          condition_id: conditionId,
          relationship_type: relationshipType,
          efficacy_score: efficacyScore,
          notes
        }])
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
        description: "Associação criada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['nutraceuticals'] });
    },
    onError: (error: any) => {
      console.error('Erro ao associar nutracêutico à condição:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar associação",
        variant: "destructive"
      });
    }
  });

  const fetchConditions = useCallback(() => {
    refetch();
  }, [refetch]);

  const createCondition = useCallback((data: any) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const associateNutraceuticalToCondition = useCallback(async (
    nutraceuticalId: string,
    conditionId: string,
    relationshipType: "prevention" | "treatment" | "support",
    efficacyScore: number,
    notes?: string
  ) => {
    return associateMutation.mutateAsync({
      nutraceuticalId,
      conditionId,
      relationshipType,
      efficacyScore,
      notes
    });
  }, [associateMutation]);

  return {
    conditions,
    isLoading: isQueryLoading || isLoading,
    error: queryError?.message || error,
    fetchConditions,
    createCondition,
    associateNutraceuticalToCondition,
    refetch
  };
};
