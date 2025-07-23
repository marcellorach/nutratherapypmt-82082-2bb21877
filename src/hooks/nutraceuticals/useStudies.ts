
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useStudies = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar estudos
  const {
    data: studies = [],
    isLoading: isQueryLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['studies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scientific_studies')
        .select('*')
        .order('title');

      if (error) {
        console.error('Erro ao buscar estudos:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar estudo
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('scientific_studies')
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
        description: "Estudo criado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['studies'] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar estudo:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar estudo",
        variant: "destructive"
      });
    }
  });

  // Mutation para associar estudo ao nutracêutico
  const associateMutation = useMutation({
    mutationFn: async ({ 
      studyId, 
      nutraceuticalId, 
      relevanceScore 
    }: {
      studyId: string;
      nutraceuticalId: string;
      relevanceScore: number;
    }) => {
      const { data: result, error } = await supabase
        .from('nutraceutical_studies')
        .insert([{
          study_id: studyId,
          nutraceutical_id: nutraceuticalId,
          relevance_score: relevanceScore
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
      console.error('Erro ao associar estudo ao nutracêutico:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar associação",
        variant: "destructive"
      });
    }
  });

  const fetchStudies = useCallback(() => {
    refetch();
  }, [refetch]);

  const createStudy = useCallback((data: any) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const associateStudyToNutraceutical = useCallback(async (
    studyId: string,
    nutraceuticalId: string,
    relevanceScore: number
  ) => {
    return associateMutation.mutateAsync({
      studyId,
      nutraceuticalId,
      relevanceScore
    });
  }, [associateMutation]);

  return {
    studies,
    isLoading: isQueryLoading || isLoading,
    error: queryError?.message || error,
    fetchStudies,
    createStudy,
    associateStudyToNutraceutical,
    refetch
  };
};
