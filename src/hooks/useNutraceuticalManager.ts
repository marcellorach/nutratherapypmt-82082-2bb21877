
import { useState, useEffect } from 'react';
import { NutraceuticalsService } from '@/services/nutraceuticals-service';
import { NutraceuticalCategoriesService } from '@/services/nutraceutical-categories-service';
import { HealthConditionsService } from '@/services/health-conditions-service';
import { ActiveIngredientsService } from '@/services/active-ingredients-service';
import { ScientificStudiesService } from '@/services/scientific-studies-service';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para gerenciar nutracêuticos
 */
export const useNutraceuticalManager = () => {
  const [nutraceuticals, setNutraceuticals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [studies, setStudies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  const { toast } = useToast();
  
  // Função para forçar a atualização dos dados
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Carregar nutracêuticos
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [nutraData, catData, condData, ingData, studiesData] = await Promise.all([
          NutraceuticalsService.getAllNutraceuticals(),
          NutraceuticalCategoriesService.getAllCategories(),
          HealthConditionsService.getAllConditions(),
          ActiveIngredientsService.getAllIngredients(),
          ScientificStudiesService.getAllStudies()
        ]);
        
        setNutraceuticals(nutraData || []);
        setCategories(catData || []);
        setConditions(condData || []);
        setIngredients(ingData || []);
        setStudies(studiesData || []);
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError('Não foi possível carregar os dados. Por favor, tente novamente.');
        
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados dos nutracêuticos',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [refreshTrigger, toast]);
  
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
  
  // Ações para estudos científicos
  const createStudy = async (data: any) => {
    try {
      const result = await ScientificStudiesService.createStudy(data);
      setStudies(prev => [...prev, result]);
      
      toast({
        title: 'Sucesso',
        description: 'Estudo científico criado com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao criar estudo científico:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o estudo científico',
        variant: 'destructive',
      });
      
      throw err;
    }
  };
  
  // Função para associar um estudo a um nutracêutico
  const associateStudyToNutraceutical = async (
    nutraceuticalId: string, 
    studyId: string, 
    relevanceScore: number
  ) => {
    try {
      const result = await NutraceuticalsService.relateToStudy(
        nutraceuticalId, 
        studyId, 
        relevanceScore
      );
      refreshData();
      
      toast({
        title: 'Sucesso',
        description: 'Estudo associado ao nutracêutico com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao associar estudo ao nutracêutico:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível associar o estudo ao nutracêutico',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    nutraceuticals,
    categories,
    conditions,
    ingredients,
    studies,
    isLoading,
    error,
    refreshData,
    createNutraceutical,
    updateNutraceutical,
    deleteNutraceutical,
    createCategory,
    createCondition,
    createStudy,
    associateStudyToNutraceutical,
  };
};
