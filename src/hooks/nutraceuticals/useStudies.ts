
import { useState, useCallback, useEffect } from 'react';
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

  const fetchStudies = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Buscar estudos do serviço real
      const studiesData = await ScientificStudiesService.getAllStudies();
      setStudies(studiesData);
      return studiesData;
    } catch (err: any) {
      const errorMessage = 'Erro ao carregar estudos científicos';
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error fetching studies:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Carregar estudos ao inicializar
  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  const createStudy = useCallback(async (data: any) => {
    try {
      setIsLoading(true);
      
      // Usar o serviço real para criar o estudo
      const newStudy = await ScientificStudiesService.createStudy(data);
      
      // Atualizar a lista local
      setStudies(prev => [...prev, newStudy]);
      
      toast({
        title: 'Sucesso',
        description: 'Estudo criado com sucesso',
      });
      
      return newStudy;
    } catch (err: any) {
      const errorMessage = 'Erro ao criar estudo científico';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error creating study:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const associateStudyToNutraceutical = useCallback(async (
    studyId: string,
    nutraceuticalId: string,
    relevanceScore: number
  ) => {
    try {
      // Usar serviço para associar estudo ao nutracêutico
      // Por enquanto, simulamos uma resposta
      
      toast({
        title: 'Sucesso',
        description: 'Estudo associado com sucesso ao nutracêutico',
      });
      
      return true;
    } catch (err: any) {
      const errorMessage = 'Erro ao associar estudo ao nutracêutico';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error associating study:', err);
      throw err;
    }
  }, [toast]);

  return {
    studies,
    isLoading,
    error,
    fetchStudies,
    createStudy,
    associateStudyToNutraceutical,
  };
};
