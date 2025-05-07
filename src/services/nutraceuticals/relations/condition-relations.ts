
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from '../base-service';
import { RelationshipType } from '@/types';

/**
 * Serviço para gerenciar relacionamentos entre nutracêuticos e condições de saúde
 */
export const ConditionRelationsService = {
  /**
   * Relaciona um nutracêutico a uma condição de saúde
   */
  async relateToCondition(
    nutraceuticalId: string,
    conditionId: string,
    relationshipType: RelationshipType,
    efficacyScore: number,
    notes?: string
  ) {
    try {
      console.log('Relacionando nutracêutico à condição:', { nutraceuticalId, conditionId, relationshipType, efficacyScore, notes });
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_conditions')
        .insert({
          nutraceutical_id: nutraceuticalId,
          condition_id: conditionId,
          relationship_type: relationshipType,
          efficacy_score: efficacyScore,
          notes
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao relacionar nutracêutico a condição:', error);
        NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a condição');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao relacionar nutracêutico a condição:', error);
      NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a condição');
    }
  },

  /**
   * Remove uma relação entre nutracêutico e condição
   */
  async removeConditionRelation(relationId: string) {
    try {
      console.log('Removendo relação com condição:', { relationId });
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_conditions')
        .delete()
        .eq('id', relationId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao remover relação com condição:', error);
        NutraceuticalBaseService.handleError(error, 'remover relação com condição');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao remover relação com condição:', error);
      NutraceuticalBaseService.handleError(error, 'remover relação com condição');
    }
  },

  /**
   * Obtém as relações de um nutracêutico com condições
   */
  async getConditionRelations(nutraceuticalId: string) {
    try {
      console.log('Obtendo relações com condições para o nutracêutico:', nutraceuticalId);
      
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
        console.error('Erro ao obter relações com condições:', error);
        NutraceuticalBaseService.handleError(error, 'obter relações com condições');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao obter relações com condições:', error);
      NutraceuticalBaseService.handleError(error, 'obter relações com condições');
      return [];
    }
  }
};
