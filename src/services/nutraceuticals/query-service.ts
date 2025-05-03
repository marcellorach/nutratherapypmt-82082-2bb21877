
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para operações de consulta de nutracêuticos
 */
export const NutraceuticalQueryService = {
  /**
   * Busca todos os nutracêuticos com suas categorias
   */
  async getAllNutraceuticals() {
    try {
      const query = NutraceuticalBaseService.getBaseQuery()
        // Incluir outcomes (antigas categorias)
        .select(`
          *,
          outcome:outcome_id(*),
          nutraceutical_health_conditions:nutraceutical_conditions(
            id, relationship_type, efficacy_score, notes,
            condition:condition_id(*)
          ),
          nutraceutical_studies:nutraceutical_studies(
            id, relevance_score,
            study:study_id(*)
          )
        `)
        .order('name');
      
      const { data, error } = await query;

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar nutracêuticos');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar nutracêuticos');
      return [];
    }
  },

  /**
   * Busca um nutracêutico específico por ID
   */
  async getNutraceuticalById(id: string) {
    try {
      const query = NutraceuticalBaseService.getBaseQuery()
        .select(`
          *,
          outcome:outcome_id(*),
          nutraceutical_health_conditions:nutraceutical_conditions(
            id, relationship_type, efficacy_score, notes,
            condition:condition_id(*)
          ),
          nutraceutical_studies:nutraceutical_studies(
            id, relevance_score,
            study:study_id(*)
          ),
          nutraceutical_benefits:nutraceutical_benefits(*)
        `)
        .eq('id', id)
        .single();
      
      const { data, error } = await query;

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar nutracêutico');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar nutracêutico');
      return null;
    }
  }
};
