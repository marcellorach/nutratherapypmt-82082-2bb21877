
import { useState, useEffect } from 'react';
import { useNutraceuticals } from './useNutraceuticals';
import { useOutcomes } from './useOutcomes';
import { useConditions } from './useConditions';
import { useIngredients } from './useIngredients';
import { useStudies } from './useStudies';

/**
 * Hook principal para gerenciar toda a base de dados de nutracêuticos
 */
export const useNutraceuticalManager = () => {
  const {
    nutraceuticals,
    isLoading: isLoadingNutraceuticals,
    error: nutraceuticalsError,
    refreshData,
    fetchNutraceuticals,
    createNutraceutical,
    updateNutraceutical,
    deleteNutraceutical
  } = useNutraceuticals();
  
  const {
    outcomes,
    isLoading: isLoadingOutcomes,
    error: outcomesError,
    fetchOutcomes,
    createOutcome
  } = useOutcomes();
  
  const {
    conditions,
    isLoading: isLoadingConditions,
    error: conditionsError,
    fetchConditions,
    createCondition,
    associateNutraceuticalToCondition
  } = useConditions();
  
  const {
    ingredients,
    isLoading: isLoadingIngredients,
    error: ingredientsError,
    fetchIngredients
  } = useIngredients();
  
  const {
    studies,
    isLoading: isLoadingStudies,
    error: studiesError,
    fetchStudies,
    createStudy,
    associateStudyToNutraceutical
  } = useStudies();
  
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Estado combinado de carregamento e erro
  const isLoading = 
    isLoadingNutraceuticals || 
    isLoadingOutcomes || 
    isLoadingConditions || 
    isLoadingIngredients || 
    isLoadingStudies;
  
  const error = 
    nutraceuticalsError || 
    outcomesError || 
    conditionsError || 
    ingredientsError || 
    studiesError;
  
  // Carregar todos os dados
  useEffect(() => {
    const loadAllData = async () => {
      console.log('Carregando todos os dados...');
      try {
        // Aguardar todas as operações de carregamento
        await Promise.allSettled([
          fetchNutraceuticals(),
          fetchOutcomes(),
          fetchConditions(),
          fetchIngredients(),
          fetchStudies()
        ]);
        console.log('Todos os dados carregados com sucesso');
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    };
    
    loadAllData();
  }, [refreshTrigger, fetchNutraceuticals, fetchOutcomes, fetchConditions, fetchIngredients, fetchStudies]);
  
  // Função para atualizar todos os dados
  const refreshAllData = () => {
    console.log('Atualizando todos os dados...');
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    // Dados
    nutraceuticals,
    outcomes,
    conditions,
    ingredients,
    studies,
    
    // Estados
    isLoading,
    error,
    
    // Funções de atualização
    refreshData: refreshAllData,
    
    // Funções de gerenciamento de nutracêuticos
    createNutraceutical,
    updateNutraceutical,
    deleteNutraceutical,
    
    // Funções de gerenciamento de outcomes
    createOutcome,
    
    // Funções de gerenciamento de condições
    createCondition,
    
    // Funções de gerenciamento de estudos
    createStudy,
    
    // Funções de associações
    associateStudyToNutraceutical,
    associateNutraceuticalToCondition
  };
};
