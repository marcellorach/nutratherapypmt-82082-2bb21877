
import { useState } from 'react';
import { ScientificStudiesService } from '@/services/scientific-studies-service';
import { NutraceuticalsService } from '@/services/nutraceuticals-service';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para gerenciar estudos científicos
 */
export const useStudies = () => {
  const [studies, setStudies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Carregar estudos
  const fetchStudies = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await ScientificStudiesService.getAllStudies();
      setStudies(data || []);
      return data;
    } catch (err: any) {
      console.error('Erro ao carregar estudos científicos:', err);
      setError('Não foi possível carregar os estudos científicos');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os estudos científicos',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
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
    studies,
    isLoading,
    error,
    fetchStudies,
    createStudy,
    associateStudyToNutraceutical
  };
};
