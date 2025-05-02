
import { useState } from 'react';
import { HealthConditionsService } from '@/services/health-conditions-service';
import { NutraceuticalsService } from '@/services/nutraceuticals';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para gerenciar condições de saúde
 */
export const useConditions = () => {
  const [conditions, setConditions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Carregar condições de saúde
  const fetchConditions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await HealthConditionsService.getAllConditions();
      setConditions(data || []);
      return data;
    } catch (err: any) {
      console.error('Erro ao carregar condições de saúde:', err);
      setError('Não foi possível carregar as condições de saúde');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as condições de saúde',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ações para condições de saúde
  const createCondition = async (data: any) => {
    try {
      const result = await HealthConditionsService.createCondition(data);
      setConditions(prev => [...prev, result]);
      
      toast({
        title: 'Sucesso',
        description: 'Condição de saúde criada com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao criar condição de saúde:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a condição de saúde',
        variant: 'destructive',
      });
      
      throw err;
    }
  };
  
  // Função para associar um nutracêutico a uma condição de saúde
  const associateNutraceuticalToCondition = async (
    nutraceuticalId: string,
    conditionId: string,
    relationshipType: 'prevention' | 'treatment' | 'support',
    efficacyScore: number
  ) => {
    try {
      const result = await NutraceuticalsService.relateToCondition(
        nutraceuticalId, 
        conditionId, 
        relationshipType,
        efficacyScore
      );
      
      toast({
        title: 'Sucesso',
        description: 'Nutracêutico associado à condição de saúde com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao associar nutracêutico à condição de saúde:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível associar o nutracêutico à condição de saúde',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    conditions,
    isLoading,
    error,
    fetchConditions,
    createCondition,
    associateNutraceuticalToCondition
  };
};
