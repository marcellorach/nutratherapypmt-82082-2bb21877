
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from '../base-service';
import { RelationshipType } from '@/types';

/**
 * Serviço para gerenciar relações entre nutracêuticos e condições/outcomes
 */
export const ConditionRelationsService = {
  /**
   * Relaciona um nutracêutico a uma condição/outcome
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
      
      const { data, error } = await supabase
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
        console.error('Erro ao relacionar nutracêutico à condição:', error);
        NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico à condição');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao relacionar nutracêutico à condição:', error);
      NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico à condição');
      return null;
    }
  },
  
  /**
   * Obtém as relações de um nutracêutico com condições
   */
  async getConditionRelations(nutraceuticalId: string) {
    try {
      console.log('Obtendo relações com condições para o nutracêutico:', nutraceuticalId);
      
      const { data, error } = await supabase
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

      return data || [];
    } catch (error) {
      console.error('Exceção ao obter relações com condições:', error);
      NutraceuticalBaseService.handleError(error, 'obter relações com condições');
      return [];
    }
  },
  
  /**
   * Remove uma relação entre nutracêutico e condição
   */
  async removeConditionRelation(relationId: string) {
    try {
      console.log('Removendo relação com condição:', { relationId });
      
      const { data, error } = await supabase
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
      return null;
    }
  },
};
