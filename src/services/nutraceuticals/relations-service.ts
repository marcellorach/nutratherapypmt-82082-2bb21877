
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
   * Relaciona um nutracêutico a um estudo científico
   */
  async relateToStudy(
    nutraceuticalId: string,
    studyId: string,
    relevanceScore: number
  ) {
    try {
      console.log('Relacionando nutracêutico ao estudo:', { nutraceuticalId, studyId, relevanceScore });
      
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
        console.error('Erro ao relacionar nutracêutico a estudo:', error);
        NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a estudo');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao relacionar nutracêutico a estudo:', error);
      NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a estudo');
    }
  },

  /**
   * Adiciona um benefício a um nutracêutico
   */
  async addBenefit(nutraceuticalId: string, benefit: string) {
    try {
      console.log('Adicionando benefício ao nutracêutico:', { nutraceuticalId, benefit });
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_benefits')
        .insert({
          nutraceutical_id: nutraceuticalId,
          benefit
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar benefício:', error);
        NutraceuticalBaseService.handleError(error, 'adicionar benefício ao nutracêutico');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao adicionar benefício:', error);
      NutraceuticalBaseService.handleError(error, 'adicionar benefício ao nutracêutico');
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
   * Remove uma relação entre nutracêutico e estudo
   */
  async removeStudyRelation(relationId: string) {
    try {
      console.log('Removendo relação com estudo:', { relationId });
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_studies')
        .delete()
        .eq('id', relationId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao remover relação com estudo:', error);
        NutraceuticalBaseService.handleError(error, 'remover relação com estudo');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao remover relação com estudo:', error);
      NutraceuticalBaseService.handleError(error, 'remover relação com estudo');
    }
  },
  
  /**
   * Obtém as relações de um nutracêutico com estudos científicos
   */
  async getStudyRelations(nutraceuticalId: string) {
    try {
      console.log('Obtendo relações com estudos para o nutracêutico:', nutraceuticalId);
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_studies')
        .select(`
          *,
          study:study_id(id, title, journal)
        `)
        .eq('nutraceutical_id', nutraceuticalId);

      if (error) {
        console.error('Erro ao obter relações com estudos:', error);
        NutraceuticalBaseService.handleError(error, 'obter relações com estudos');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao obter relações com estudos:', error);
      NutraceuticalBaseService.handleError(error, 'obter relações com estudos');
      return [];
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
