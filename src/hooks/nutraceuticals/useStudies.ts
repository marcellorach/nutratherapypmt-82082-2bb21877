
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error: apiError } = await client
        .from('scientific_studies')
        .select('*')
        .order('title');
      
      if (apiError) {
        throw apiError;
      }
      
      setStudies(data || []);
      return data;
    } catch (err: any) {
      console.error('Erro ao carregar estudos:', err);
      setError('Não foi possível carregar os dados dos estudos científicos');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados dos estudos científicos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Criar um novo estudo
  const createStudy = async (data: any) => {
    try {
      // Garantir que o campo link não seja nulo
      const studyData = {
        ...data,
        link: data.link || 'https://placeholder-url.com',
      };
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data: newStudy, error: apiError } = await client
        .from('scientific_studies')
        .insert([studyData])
        .select()
        .single();
      
      if (apiError) {
        throw apiError;
      }
      
      // Atualizar o estado local
      setStudies(prev => [...prev, newStudy]);
      
      toast({
        title: 'Sucesso',
        description: 'Estudo científico criado com sucesso',
      });
      
      return newStudy;
    } catch (err: any) {
      console.error('Erro ao criar estudo:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o estudo científico',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  // Associar estudo a um nutracêutico
  const associateStudyToNutraceutical = async (
    studyId: string,
    nutraceuticalId: string,
    relevanceScore: number
  ) => {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error: apiError } = await client
        .from('nutraceutical_studies')
        .insert([{
          study_id: studyId,
          nutraceutical_id: nutraceuticalId,
          relevance_score: relevanceScore
        }])
        .select()
        .single();
      
      if (apiError) {
        throw apiError;
      }
      
      toast({
        title: 'Sucesso',
        description: 'Estudo associado ao nutracêutico com sucesso',
      });
      
      return data;
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
  
  // Upload de arquivo de estudo
  const uploadStudyFile = async (file: File, path: string) => {
    try {
      const client = supabase as any;
      const { data, error: uploadError } = await client.storage
        .from('studies')
        .upload(path, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      return data;
    } catch (err: any) {
      console.error('Erro ao fazer upload do arquivo:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer o upload do arquivo',
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
    associateStudyToNutraceutical,
    uploadStudyFile
  };
};
