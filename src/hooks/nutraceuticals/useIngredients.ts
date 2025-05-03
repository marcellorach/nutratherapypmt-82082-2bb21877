
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para gerenciar ingredientes ativos
 */
export const useIngredients = () => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchIngredients = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Aqui teríamos a chamada para o serviço de ingredientes
      // Por enquanto, vamos usar dados fictícios
      const mockIngredients = [
        { id: '1', name: 'Resveratrol', description: 'Composto fenólico encontrado em uvas' },
        { id: '2', name: 'Curcumina', description: 'Princípio ativo da cúrcuma' },
        { id: '3', name: 'NMN', description: 'Mononucleotídeo de Nicotinamida, um precursor do NAD+' },
        { id: '4', name: 'Quercetina', description: 'Flavonóide encontrado em frutas e vegetais' },
        { id: '5', name: 'Ômega-3', description: 'Ácido graxo essencial' },
      ];
      
      setIngredients(mockIngredients);
      return mockIngredients;
    } catch (err: any) {
      const errorMessage = 'Erro ao carregar ingredientes ativos';
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error fetching ingredients:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    ingredients,
    isLoading,
    error,
    fetchIngredients
  };
};
