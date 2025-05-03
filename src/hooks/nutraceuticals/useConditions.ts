
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { NutraceuticalsService } from '@/services/nutraceuticals';

/**
 * Hook para gerenciar condições de saúde
 */
export const useConditions = () => {
  const [conditions, setConditions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConditions = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Aqui teríamos a chamada para o serviço de condições
      // Por enquanto, vamos usar dados fictícios
      const mockConditions = [
        { id: '1', name: 'Hipertensão', description: 'Pressão arterial elevada' },
        { id: '2', name: 'Diabetes', description: 'Distúrbio metabólico caracterizado por hiperglicemia' },
        { id: '3', name: 'Artrite', description: 'Inflamação das articulações' },
        { id: '4', name: 'Alzheimer', description: 'Doença neurodegenerativa progressiva' },
        { id: '5', name: 'Osteoporose', description: 'Redução da densidade óssea' },
      ];
      
      setConditions(mockConditions);
      return mockConditions;
    } catch (err: any) {
      const errorMessage = 'Erro ao carregar condições de saúde';
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error fetching conditions:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createCondition = useCallback(async (data: any) => {
    try {
      setIsLoading(true);
      
      // Aqui teríamos a chamada para o serviço de criação de condição
      // Por enquanto, simulamos uma resposta
      const newCondition = {
        id: `new-${Date.now()}`,
        ...data,
      };
      
      setConditions(prev => [...prev, newCondition]);
      
      toast({
        title: 'Sucesso',
        description: 'Condição de saúde criada com sucesso',
      });
      
      return newCondition;
    } catch (err: any) {
      const errorMessage = 'Erro ao criar condição de saúde';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error creating condition:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const associateNutraceuticalToCondition = useCallback(async (
    nutraceuticalId: string,
    conditionId: string,
    relationshipType: 'prevention' | 'treatment' | 'support',
    efficacyScore: number,
    notes?: string
  ) => {
    try {
      const result = await NutraceuticalsService.relateToCondition(
        nutraceuticalId,
        conditionId,
        relationshipType,
        efficacyScore,
        notes
      );
      
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    conditions,
    isLoading,
    error,
    fetchConditions,
    createCondition,
    associateNutraceuticalToCondition,
  };
};
