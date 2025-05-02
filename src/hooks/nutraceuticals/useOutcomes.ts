
import { useState } from 'react';
import { NutraceuticalOutcomesService } from '@/services/nutraceutical-outcomes-service';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para gerenciar outcomes de nutracêuticos
 */
export const useOutcomes = () => {
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Carregar outcomes
  const fetchOutcomes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await NutraceuticalOutcomesService.getAllOutcomes();
      setOutcomes(data || []);
      return data;
    } catch (err: any) {
      console.error('Erro ao carregar outcomes:', err);
      setError('Não foi possível carregar os outcomes');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os outcomes',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ações para outcomes
  const createOutcome = async (data: any) => {
    try {
      const result = await NutraceuticalOutcomesService.createOutcome(data);
      setOutcomes(prev => [...prev, result]);
      
      toast({
        title: 'Sucesso',
        description: 'Outcome criado com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao criar outcome:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o outcome',
        variant: 'destructive',
      });
      
      throw err;
    }
  };
  
  const updateOutcome = async (id: string, data: any) => {
    try {
      const result = await NutraceuticalOutcomesService.updateOutcome(id, data);
      setOutcomes(prev => prev.map(cat => cat.id === id ? result : cat));
      
      toast({
        title: 'Sucesso',
        description: 'Outcome atualizado com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao atualizar outcome:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o outcome',
        variant: 'destructive',
      });
      
      throw err;
    }
  };
  
  const deleteOutcome = async (id: string) => {
    try {
      await NutraceuticalOutcomesService.deleteOutcome(id);
      setOutcomes(prev => prev.filter(cat => cat.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Outcome removido com sucesso',
      });
      
      return true;
    } catch (err: any) {
      console.error('Erro ao remover outcome:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o outcome',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    outcomes,
    isLoading,
    error,
    fetchOutcomes,
    createOutcome,
    updateOutcome,
    deleteOutcome
  };
};
