
import { useState } from 'react';
import { NutraceuticalsService } from '@/services/nutraceuticals-service';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para gerenciar nutracêuticos
 */
export const useNutraceuticals = () => {
  const [nutraceuticals, setNutraceuticals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  const { toast } = useToast();
  
  // Função para forçar a atualização dos dados
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Carregar nutracêuticos
  const fetchNutraceuticals = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await NutraceuticalsService.getAllNutraceuticals();
      setNutraceuticals(data || []);
      return data;
    } catch (err: any) {
      console.error('Erro ao carregar nutracêuticos:', err);
      setError('Não foi possível carregar os dados dos nutracêuticos');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados dos nutracêuticos',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ações de gerenciamento
  const createNutraceutical = async (data: any) => {
    try {
      const result = await NutraceuticalsService.createNutraceutical(data);
      refreshData();
      
      toast({
        title: 'Sucesso',
        description: 'Nutracêutico criado com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao criar nutracêutico:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o nutracêutico',
        variant: 'destructive',
      });
      
      throw err;
    }
  };
  
  const updateNutraceutical = async (id: string, data: any) => {
    try {
      const result = await NutraceuticalsService.updateNutraceutical(id, data);
      refreshData();
      
      toast({
        title: 'Sucesso',
        description: 'Nutracêutico atualizado com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao atualizar nutracêutico:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o nutracêutico',
        variant: 'destructive',
      });
      
      throw err;
    }
  };
  
  const deleteNutraceutical = async (id: string) => {
    try {
      await NutraceuticalsService.deleteNutraceutical(id);
      refreshData();
      
      toast({
        title: 'Sucesso',
        description: 'Nutracêutico removido com sucesso',
      });
      
      return true;
    } catch (err: any) {
      console.error('Erro ao remover nutracêutico:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o nutracêutico',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    nutraceuticals,
    isLoading,
    error,
    refreshData,
    fetchNutraceuticals,
    createNutraceutical,
    updateNutraceutical,
    deleteNutraceutical
  };
};
