
import { useState } from 'react';
import { NutraceuticalCategoriesService } from '@/services/nutraceutical-categories-service';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para gerenciar categorias de nutracêuticos
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Carregar categorias
  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await NutraceuticalCategoriesService.getAllCategories();
      setCategories(data || []);
      return data;
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
      setError('Não foi possível carregar as categorias');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ações para categorias
  const createCategory = async (data: any) => {
    try {
      const result = await NutraceuticalCategoriesService.createCategory(data);
      setCategories(prev => [...prev, result]);
      
      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao criar categoria:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a categoria',
        variant: 'destructive',
      });
      
      throw err;
    }
  };
  
  const updateCategory = async (id: string, data: any) => {
    try {
      const result = await NutraceuticalCategoriesService.updateCategory(id, data);
      setCategories(prev => prev.map(cat => cat.id === id ? result : cat));
      
      toast({
        title: 'Sucesso',
        description: 'Categoria atualizada com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao atualizar categoria:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a categoria',
        variant: 'destructive',
      });
      
      throw err;
    }
  };
  
  const deleteCategory = async (id: string) => {
    try {
      await NutraceuticalCategoriesService.deleteCategory(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Categoria removida com sucesso',
      });
      
      return true;
    } catch (err: any) {
      console.error('Erro ao remover categoria:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a categoria',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};
