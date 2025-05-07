
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ScientificStudiesService } from '@/services/scientific-studies-service';

/**
 * Hook para gerenciar estudos científicos
 */
export const useStudies = () => {
  const [studies, setStudies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Carrega todos os estudos científicos
   */
  const fetchStudies = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await ScientificStudiesService.getAllStudies();
      setStudies(data || []);
      return data;
    } catch (err: any) {
      console.error('Erro ao carregar estudos científicos:', err);
      setError('Não foi possível carregar os dados dos estudos científicos');
      
      toast({
        title: 'Erro',
        description: 'Falha ao carregar estudos científicos',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Carrega um estudo científico específico pelo ID
   */
  const fetchStudyById = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await ScientificStudiesService.getStudyById(id);
      return data;
    } catch (err: any) {
      console.error('Erro ao carregar estudo específico:', err);
      setError('Não foi possível carregar o estudo solicitado');
      
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados do estudo',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Cria um novo estudo científico
   */
  const createStudy = async (studyData: {
    title: string;
    link?: string;
    year: number;
    journal?: string;
    authors?: string | string[];
    abstract?: string;
    file?: File;
    nutraceuticalId?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Garantindo que o link nunca seja undefined
      const safeStudyData = {
        ...studyData,
        link: studyData.link || `https://placeholder.link/${Date.now()}`
      };
      
      console.log('Criando estudo com dados:', safeStudyData);
      const result = await ScientificStudiesService.createStudy(safeStudyData);
      
      await fetchStudies(); // Atualizar a lista após criar
      
      toast({
        title: 'Sucesso',
        description: 'Estudo científico criado com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao criar estudo científico:', err);
      setError('Não foi possível criar o estudo científico');
      
      toast({
        title: 'Erro',
        description: 'Falha ao criar estudo científico',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Atualiza um estudo científico existente
   */
  const updateStudy = async (id: string, studyData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Garantindo que o link nunca seja undefined
      const safeStudyData = {
        ...studyData,
        link: studyData.link || `https://placeholder.link/${Date.now()}`
      };
      
      const result = await ScientificStudiesService.updateStudy(id, safeStudyData);
      
      await fetchStudies(); // Atualizar a lista após editar
      
      toast({
        title: 'Sucesso',
        description: 'Estudo científico atualizado com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao atualizar estudo científico:', err);
      setError('Não foi possível atualizar o estudo científico');
      
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar estudo científico',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Exclui um estudo científico
   */
  const deleteStudy = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await ScientificStudiesService.deleteStudy(id);
      
      await fetchStudies(); // Atualizar a lista após excluir
      
      toast({
        title: 'Sucesso',
        description: 'Estudo científico excluído com sucesso',
      });
      
      return true;
    } catch (err: any) {
      console.error('Erro ao excluir estudo científico:', err);
      setError('Não foi possível excluir o estudo científico');
      
      toast({
        title: 'Erro',
        description: 'Falha ao excluir estudo científico',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Associa um estudo científico a um nutracêutico
   */
  const associateStudyToNutraceutical = async (
    studyId: string, 
    nutraceuticalId: string, 
    relevanceScore: number = 4
  ) => {
    setError(null);
    
    try {
      // Importar o serviço de relações dinamicamente
      const relationsModule = await import('@/services/nutraceuticals/relations-service');
      const result = await relationsModule.NutraceuticalRelationsService.relateToStudy(
        nutraceuticalId,
        studyId,
        relevanceScore
      );
      
      toast({
        title: 'Sucesso',
        description: 'Estudo associado ao nutracêutico com sucesso',
      });
      
      return result;
    } catch (err: any) {
      console.error('Erro ao associar estudo ao nutracêutico:', err);
      setError('Não foi possível associar o estudo ao nutracêutico');
      
      toast({
        title: 'Erro',
        description: 'Falha ao associar estudo ao nutracêutico',
        variant: 'destructive',
      });
      throw err;
    }
  };
  
  /**
   * Remove a associação entre um estudo e um nutracêutico
   */
  const removeStudyFromNutraceutical = async (relationId: string) => {
    setError(null);
    
    try {
      // Importar o serviço de relações dinamicamente
      const relationsModule = await import('@/services/nutraceuticals/relations-service');
      await relationsModule.NutraceuticalRelationsService.removeStudyRelation(relationId);
      
      toast({
        title: 'Sucesso',
        description: 'Associação entre estudo e nutracêutico removida com sucesso',
      });
      
      return true;
    } catch (err: any) {
      console.error('Erro ao remover associação de estudo:', err);
      setError('Não foi possível remover a associação do estudo');
      
      toast({
        title: 'Erro',
        description: 'Falha ao remover associação de estudo',
        variant: 'destructive',
      });
      throw err;
    }
  };
  
  /**
   * Obtém o URL público de um arquivo de estudo
   */
  const getStudyFileUrl = (filePath: string | null) => {
    if (!filePath) return null;
    return ScientificStudiesService.getPublicFileUrl(filePath);
  };

  return {
    studies,
    isLoading,
    error,
    fetchStudies,
    fetchStudyById,
    createStudy,
    updateStudy,
    deleteStudy,
    associateStudyToNutraceutical,
    removeStudyFromNutraceutical,
    getStudyFileUrl
  };
};
