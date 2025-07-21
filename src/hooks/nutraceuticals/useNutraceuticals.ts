
/**
 * Hook consolidado para operações com nutracêuticos
 * Substitui múltiplos hooks específicos por uma interface unificada
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutraceuticalsService } from '@/services/nutraceuticals';
import { useDataManagement } from '@/hooks/useDataManagement';
import { useToast } from '@/hooks/use-toast';
import { 
  NutraceuticalWithRelations, 
  NutraceuticalCore, 
  NutraceuticalQueryOptions,
  NutraceuticalFilters 
} from '@/types/nutraceuticals';

interface UseNutraceuticalsOptions {
  enabledQuery?: boolean;
  initialFilters?: NutraceuticalFilters;
  autoRefresh?: boolean;
}

export const useNutraceuticals = (options: UseNutraceuticalsOptions = {}) => {
  const { enabledQuery = true, initialFilters = {}, autoRefresh = false } = options;
  const [filters, setFilters] = useState<NutraceuticalFilters>(initialFilters);
  const { getDataTypes } = useDataManagement();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar nutracêuticos
  const {
    data: nutraceuticals = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['nutraceuticals', filters, getDataTypes()],
    queryFn: async () => {
      const queryOptions: NutraceuticalQueryOptions = {
        dataTypes: getDataTypes(),
        filters,
        includeRelations: true
      };
      return nutraceuticalsService.getAll(queryOptions);
    },
    enabled: enabledQuery,
    refetchInterval: autoRefresh ? 30000 : false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar nutracêutico
  const createMutation = useMutation({
    mutationFn: (data: Omit<NutraceuticalCore, 'id' | 'created_at' | 'updated_at'>) =>
      nutraceuticalsService.create(data),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Nutracêutico criado",
          description: "O nutracêutico foi criado com sucesso."
        });
        queryClient.invalidateQueries({ queryKey: ['nutraceuticals'] });
      } else {
        toast({
          title: "Erro ao criar nutracêutico",
          description: result.error,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar nutracêutico",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para atualizar nutracêutico
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NutraceuticalCore> }) =>
      nutraceuticalsService.update(id, data),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Nutracêutico atualizado",
          description: "O nutracêutico foi atualizado com sucesso."
        });
        queryClient.invalidateQueries({ queryKey: ['nutraceuticals'] });
      } else {
        toast({
          title: "Erro ao atualizar nutracêutico",
          description: result.error,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar nutracêutico",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para deletar nutracêutico
  const deleteMutation = useMutation({
    mutationFn: (id: string) => nutraceuticalsService.delete(id),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Nutracêutico excluído",
          description: "O nutracêutico foi excluído com sucesso."
        });
        queryClient.invalidateQueries({ queryKey: ['nutraceuticals'] });
      } else {
        toast({
          title: "Erro ao excluir nutracêutico",
          description: result.error,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir nutracêutico",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Query para verificar dados migrados
  const { data: hasMigratedData = false } = useQuery({
    queryKey: ['nutraceuticals-migrated'],
    queryFn: () => nutraceuticalsService.hasMigratedData(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Filtros e utilitários
  const filteredNutraceuticals = nutraceuticals.filter(nutra => {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return nutra.name.toLowerCase().includes(searchLower) ||
             nutra.description?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const updateFilters = useCallback((newFilters: Partial<NutraceuticalFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Funções de conveniência
  const createNutraceutical = useCallback(
    (data: Omit<NutraceuticalCore, 'id' | 'created_at' | 'updated_at'>) => {
      createMutation.mutate(data);
    },
    [createMutation]
  );

  const updateNutraceutical = useCallback(
    (id: string, data: Partial<NutraceuticalCore>) => {
      updateMutation.mutate({ id, data });
    },
    [updateMutation]
  );

  const deleteNutraceutical = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const refreshData = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['nutraceuticals'] });
  }, [refetch, queryClient]);

  return {
    // Dados
    nutraceuticals,
    filteredNutraceuticals,
    isLoading,
    error: error?.message || null,
    hasMigratedData,
    
    // Filtros
    filters,
    updateFilters,
    clearFilters,
    
    // Ações
    createNutraceutical,
    updateNutraceutical,
    deleteNutraceutical,
    refreshData,
    
    // Estados de loading
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Contadores
    totalCount: nutraceuticals.length,
    filteredCount: filteredNutraceuticals.length,
  };
};

export default useNutraceuticals;
