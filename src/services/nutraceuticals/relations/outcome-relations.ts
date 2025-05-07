
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from '../base-service';
import { RelationshipType } from '@/types';

/**
 * Serviço para gerenciar relacionamentos entre nutracêuticos e outcomes
 */
export const OutcomeRelationsService = {
  /**
   * Relaciona um nutracêutico a um outcome
   */
  async relateToOutcome(
    nutraceuticalId: string,
    outcomeId: string,
    relationshipType: RelationshipType,
    efficacyScore: number,
    notes?: string
  ) {
    try {
      console.log('Relacionando nutracêutico ao outcome:', { nutraceuticalId, outcomeId, relationshipType, efficacyScore, notes });
      
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
        console.error('Erro ao relacionar nutracêutico a outcome:', error);
        NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a outcome');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao relacionar nutracêutico a outcome:', error);
      NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a outcome');
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
      console.log('Atualizando relação com outcome:', { nutraceuticalId, notes });
      
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
        console.error('Erro ao atualizar relação com outcome:', error);
        NutraceuticalBaseService.handleError(error, 'atualizar relação com outcome');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao atualizar relação com outcome:', error);
      NutraceuticalBaseService.handleError(error, 'atualizar relação com outcome');
    }
  },

  /**
   * Remove uma relação entre nutracêutico e outcome
   */
  async removeOutcomeRelation(relationId: string) {
    try {
      console.log('Removendo relação com outcome:', { relationId });
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_conditions')
        .delete()
        .eq('id', relationId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao remover relação com outcome:', error);
        NutraceuticalBaseService.handleError(error, 'remover relação com outcome');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao remover relação com outcome:', error);
      NutraceuticalBaseService.handleError(error, 'remover relação com outcome');
    }
  },

  /**
   * Obtém as relações de um nutracêutico com outcomes
   */
  async getOutcomeRelations(nutraceuticalId: string) {
    try {
      console.log('Obtendo relações com outcomes para o nutracêutico:', nutraceuticalId);
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_conditions')
        .select(`
          *,
          condition:condition_id(id, name, description)
        `)
        .eq('nutraceutical_id', nutraceuticalId);

      if (error) {
        console.error('Erro ao obter relações com outcomes:', error);
        NutraceuticalBaseService.handleError(error, 'obter relações com outcomes');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao obter relações com outcomes:', error);
      NutraceuticalBaseService.handleError(error, 'obter relações com outcomes');
      return [];
    }
  }
};
