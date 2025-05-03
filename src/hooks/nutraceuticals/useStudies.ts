
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

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
      
      // Aqui teríamos a chamada para o serviço de estudos
      // Por enquanto, vamos usar dados fictícios
      const mockStudies = [
        {
          id: '1',
          title: 'Efeitos do Resveratrol na Longevidade',
          year: 2021,
          journal: 'Journal of Nutraceutical Research',
          link: 'https://example.com/study1',
        },
        {
          id: '2',
          title: 'Curcumina como Anti-inflamatório Natural',
          year: 2020,
          journal: 'Natural Medicine Reviews',
          link: 'https://example.com/study2',
        },
        {
          id: '3',
          title: 'NMN e a Regeneração Celular em Idosos',
          year: 2022,
          journal: 'Aging Research Reviews',
          link: 'https://example.com/study3',
        },
      ];
      
      setStudies(mockStudies);
      return mockStudies;
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

  const createStudy = useCallback(async (data: any) => {
    try {
      setIsLoading(true);
      
      // Aqui teríamos a chamada para o serviço de criação de estudo
      // Por enquanto, simulamos uma resposta
      const newStudy = {
        id: `new-${Date.now()}`,
        ...data,
      };
      
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
      // Aqui teríamos a chamada para o serviço de associação
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
