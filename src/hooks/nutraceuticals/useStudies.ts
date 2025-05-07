import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ScientificStudiesService } from '@/services/scientific-studies-service';
import { NutraceuticalsService } from '@/services/nutraceuticals';

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
      console.log('Buscando estudos científicos...');
      
      // Buscar estudos do serviço real
      const studiesData = await ScientificStudiesService.getAllStudies();
      console.log('Estudos obtidos:', studiesData?.length || 0);
      
      // Adicionar URLs públicas dos arquivos
      const studiesWithUrls = studiesData?.map(study => {
        if (study.file_path) {
          const publicUrl = ScientificStudiesService.getPublicFileUrl(study.file_path);
          return { ...study, fileUrl: publicUrl };
        }
        return study;
      });
      
      setStudies(studiesWithUrls || []);
      return studiesWithUrls;
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
      console.log('Criando novo estudo com dados:', data);
      
      // Usar o serviço real para criar o estudo
      const newStudy = await ScientificStudiesService.createStudy(data);
      console.log('Novo estudo criado:', newStudy);
      
      // Adicionar URL pública do arquivo
      if (newStudy && newStudy.file_path) {
        const publicUrl = ScientificStudiesService.getPublicFileUrl(newStudy.file_path);
        newStudy.fileUrl = publicUrl;
      }
      
      // Atualizar a lista local
      setStudies(prev => [newStudy, ...prev]);
      
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
      console.log(`Associando estudo ${studyId} ao nutracêutico ${nutraceuticalId} com relevância ${relevanceScore}`);
      setIsLoading(true);
      
      // Usar o serviço real de Nutraceuticals
      const result = await NutraceuticalsService.relateToStudy(
        nutraceuticalId,
        studyId,
        relevanceScore
      );
      
      console.log('Resultado da associação:', result);
      
      toast({
        title: 'Sucesso',
        description: 'Estudo associado com sucesso ao nutracêutico',
      });
      
      return result;
    } catch (err: any) {
      const errorMessage = 'Erro ao associar estudo ao nutracêutico';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error associating study:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getStudyFileUrl = useCallback((study: any) => {
    if (!study || !study.file_path) return null;
    return study.fileUrl || ScientificStudiesService.getPublicFileUrl(study.file_path);
  }, []);
  
  const deleteStudy = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      console.log('Excluindo estudo:', id);
      
      await ScientificStudiesService.deleteStudy(id);
      
      // Remover da lista local
      setStudies(prevStudies => prevStudies.filter(study => study.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Estudo excluído com sucesso',
      });
      
      return true;
    } catch (err: any) {
      const errorMessage = 'Erro ao excluir estudo científico';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error deleting study:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    studies,
    isLoading,
    error,
    fetchStudies,
    createStudy,
    associateStudyToNutraceutical,
    getStudyFileUrl,
    deleteStudy,
  };
};
