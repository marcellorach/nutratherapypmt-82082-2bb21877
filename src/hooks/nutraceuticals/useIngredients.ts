
import { useState } from 'react';
import { ActiveIngredientsService } from '@/services/active-ingredients-service';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para gerenciar ingredientes ativos
 */
export const useIngredients = () => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Carregar ingredientes
  const fetchIngredients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await ActiveIngredientsService.getAllIngredients();
      setIngredients(data || []);
      return data;
    } catch (err: any) {
      console.error('Erro ao carregar ingredientes:', err);
      setError('Não foi possível carregar os ingredientes ativos');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os ingredientes ativos',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ações para ingredientes ativos
  const createIngredient = async (data: any) => {
    try {
      const result = await ActiveIngredientsService.createIngredient(data);
      setIngredients(prev => [...prev, result]);
      
      toast({
        title: 'Sucesso',
        description: 'Ingrediente ativo criado com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao criar ingrediente ativo:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o ingrediente ativo',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    ingredients,
    isLoading,
    error,
    fetchIngredients,
    createIngredient
  };
};
