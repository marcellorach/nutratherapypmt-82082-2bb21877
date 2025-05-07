
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para gerenciar condições de saúde
 */
export const useConditions = () => {
  const [conditions, setConditions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar condições
  const fetchConditions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error: apiError } = await client
        .from('health_conditions')
        .select('*')
        .order('name');
      
      if (apiError) {
        throw apiError;
      }
      
      setConditions(data || []);
      return data;
    } catch (err: any) {
      console.error('Erro ao carregar condições:', err);
      setError('Não foi possível carregar os dados das condições de saúde');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados das condições de saúde',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Criar uma nova condição
  const createCondition = async (data: { name: string; description: string }) => {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data: newCondition, error: apiError } = await client
        .from('health_conditions')
        .insert([data])
        .select()
        .single();
      
      if (apiError) {
        throw apiError;
      }
      
      // Atualizar o estado local
      setConditions(prev => [...prev, newCondition]);
      
      toast({
        title: 'Sucesso',
        description: 'Condição de saúde criada com sucesso',
      });
      
      return newCondition;
    } catch (err: any) {
      console.error('Erro ao criar condição:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a condição de saúde',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  // Relacionar nutracêutico a uma condição
  const associateNutraceuticalToCondition = async (
    nutraceuticalId: string,
    conditionId: string,
    relationshipType: 'prevention' | 'treatment' | 'support',
    efficacyScore: number,
    notes?: string
  ) => {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error: apiError } = await client
        .from('nutraceutical_conditions')
        .insert([{
          nutraceutical_id: nutraceuticalId,
          condition_id: conditionId,
          relationship_type: relationshipType,
          efficacy_score: efficacyScore,
          notes
        }])
        .select()
        .single();
      
      if (apiError) {
        throw apiError;
      }
      
      toast({
        title: 'Sucesso',
        description: 'Nutracêutico associado à condição com sucesso',
      });
      
      return data;
    } catch (err: any) {
      console.error('Erro ao associar nutracêutico à condição:', err);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível associar o nutracêutico à condição',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    conditions,
    isLoading,
    error,
    fetchConditions,
    createCondition,
    associateNutraceuticalToCondition
  };
};
