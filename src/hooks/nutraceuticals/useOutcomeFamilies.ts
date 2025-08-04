import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { OutcomeFamiliesService, OutcomeFamily, CreateOutcomeFamilyData } from '@/services/outcome-families-service';

export const useOutcomeFamilies = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar famílias
  const {
    data: families = [],
    isLoading: isQueryLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['outcome-families'],
    queryFn: OutcomeFamiliesService.getAllFamilies,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar família
  const createMutation = useMutation({
    mutationFn: (data: CreateOutcomeFamilyData) => 
      OutcomeFamiliesService.createFamily(data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Família criada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['outcome-families'] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar família:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar família",
        variant: "destructive"
      });
    }
  });

  // Mutation para atualizar família
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateOutcomeFamilyData> }) =>
      OutcomeFamiliesService.updateFamily(id, data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Família atualizada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['outcome-families'] });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar família:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar família",
        variant: "destructive"
      });
    }
  });

  // Mutation para deletar família
  const deleteMutation = useMutation({
    mutationFn: (id: string) => OutcomeFamiliesService.deleteFamily(id),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Família excluída com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['outcome-families'] });
    },
    onError: (error: any) => {
      console.error('Erro ao excluir família:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir família",
        variant: "destructive"
      });
    }
  });

  const createFamily = useCallback((data: CreateOutcomeFamilyData) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const updateFamily = useCallback((id: string, data: Partial<CreateOutcomeFamilyData>) => {
    updateMutation.mutate({ id, data });
  }, [updateMutation]);

  const deleteFamily = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const fetchFamilies = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    families,
    isLoading: isQueryLoading || isLoading,
    error: queryError?.message || error,
    fetchFamilies,
    createFamily,
    updateFamily,
    deleteFamily,
    refetch
  };
};