import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para gerenciar relações de nutracêuticos com outcomes e estudos
 */
export const NutraceuticalRelationsService = {
  /**
   * Relaciona um nutracêutico a um outcome
   */
  async relateToOutcome(
    nutraceuticalId: string,
    outcomeId: string,
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
          condition_id: outcomeId, // mantido como condition_id para compatibilidade
          relationship_type: relationshipType,
          efficacy_score: efficacyScore,
          notes: notes
        }])
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'relacionar com outcome');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'relacionar com outcome');
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
  },

  /**
   * Remove a relação entre um nutracêutico e um outcome
   */
  async removeOutcomeRelation(relationId: string) {
    try {
      const client = supabase as any;
      const { error } = await client
        .from('nutraceutical_conditions')
        .delete()
        .eq('id', relationId);

      if (error) {
        NutraceuticalBaseService.handleError(error, 'remover relação com outcome');
      }

      return true;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'remover relação com outcome');
    }
  },

  /**
   * Remove a relação entre um nutracêutico e um estudo
   */
  async removeStudyRelation(relationId: string) {
    try {
      const client = supabase as any;
      const { error } = await client
        .from('nutraceutical_studies')
        .delete()
        .eq('id', relationId);

      if (error) {
        NutraceuticalBaseService.handleError(error, 'remover relação com estudo');
      }

      return true;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'remover relação com estudo');
    }
  },
  
  /**
   * Atualiza ou adiciona informações de relação entre um nutracêutico e um outcome específico
   * Inclui metadados científicos como eficácia, sustentabilidade e notas
   */
  async updateOutcomeRelation(
    nutraceuticalId: string,
    notes: string
  ) {
    try {
      // Atualiza os metadados científicos do nutracêutico
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_scientific_metadata')
        .upsert({
          nutraceutical_id: nutraceuticalId,
          notes: notes,
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'atualizar relação com outcome');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'atualizar relação com outcome');
    }
  }
};
