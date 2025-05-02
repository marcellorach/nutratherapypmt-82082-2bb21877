
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para gerenciar relações de nutracêuticos com condições e estudos
 */
export const NutraceuticalRelationsService = {
  /**
   * Relaciona um nutracêutico a uma condição de saúde
   */
  async relateToCondition(
    nutraceuticalId: string,
    conditionId: string,
    relationshipType: 'prevention' | 'treatment' | 'support',
    efficacyScore: number,
    notes?: string
  ) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_conditions')
        .insert([{
          nutraceutical_id: nutraceuticalId,
          condition_id: conditionId,
          relationship_type: relationshipType,
          efficacy_score: efficacyScore,
          notes: notes
        }])
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'relacionar com condição de saúde');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'relacionar com condição de saúde');
    }
  },

  /**
   * Relaciona um nutracêutico a um estudo científico
   */
  async relateToStudy(
    nutraceuticalId: string,
    studyId: string,
    relevanceScore: number
  ) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_studies')
        .insert([{
          nutraceutical_id: nutraceuticalId,
          study_id: studyId,
          relevance_score: relevanceScore
        }])
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'relacionar com estudo científico');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'relacionar com estudo científico');
    }
  }
};
