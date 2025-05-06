
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para gerenciar relacionamentos de nutracêuticos
 * com outcomes, condições e estudos
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
        .insert({
          nutraceutical_id: nutraceuticalId,
          condition_id: outcomeId,
          relationship_type: relationshipType,
          efficacy_score: efficacyScore,
          notes
        })
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a outcome');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a outcome');
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
        .insert({
          nutraceutical_id: nutraceuticalId,
          study_id: studyId,
          relevance_score: relevanceScore
        })
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a estudo');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a estudo');
    }
  },

  /**
   * Atualiza a relação entre nutracêutico e outcome
   */
  async updateOutcomeRelation(
    nutraceuticalId: string,
    notes: string
  ) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_scientific_metadata')
        .update({
          notes,
          updated_at: new Date()
        })
        .eq('nutraceutical_id', nutraceuticalId)
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'atualizar relação com outcome');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'atualizar relação com outcome');
    }
  },

  /**
   * Remove uma relação entre nutracêutico e outcome
   */
  async removeOutcomeRelation(relationId: string) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_conditions')
        .delete()
        .eq('id', relationId)
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'remover relação com outcome');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'remover relação com outcome');
    }
  },

  /**
   * Remove uma relação entre nutracêutico e estudo
   */
  async removeStudyRelation(relationId: string) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_studies')
        .delete()
        .eq('id', relationId)
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'remover relação com estudo');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'remover relação com estudo');
    }
  },
  
  /**
   * Obtém as relações de um nutracêutico com estudos científicos
   */
  async getStudyRelations(nutraceuticalId: string) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_studies')
        .select(`
          *,
          study:scientific_studies(id, title, journal)
        `)
        .eq('nutraceutical_id', nutraceuticalId);

      if (error) {
        NutraceuticalBaseService.handleError(error, 'obter relações com estudos');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'obter relações com estudos');
      return [];
    }
  },

  /**
   * Obtém as relações de um nutracêutico com outcomes
   */
  async getOutcomeRelations(nutraceuticalId: string) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_conditions')
        .select(`
          *,
          condition:health_conditions(id, name, description)
        `)
        .eq('nutraceutical_id', nutraceuticalId);

      if (error) {
        NutraceuticalBaseService.handleError(error, 'obter relações com outcomes');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'obter relações com outcomes');
      return [];
    }
  }
};
