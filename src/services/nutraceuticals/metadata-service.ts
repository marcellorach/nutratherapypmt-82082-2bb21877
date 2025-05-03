
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para operações de metadados dos nutracêuticos
 */
export const NutraceuticalMetadataService = {
  /**
   * Obtém todos os outcomes disponíveis
   */
  async getAllOutcomes() {
    try {
      const { data, error } = await supabase
        .from('nutraceutical_outcomes')
        .select('*')
        .order('name');

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar outcomes');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar outcomes');
      return [];
    }
  },

  /**
   * Obtém todas as categorias de nutracêuticos
   * (Alias para outcomes por compatibilidade)
   */
  async getAllCategories() {
    return this.getAllOutcomes();
  },

  /**
   * Obtém todos os ingredientes ativos
   */
  async getAllActiveIngredients() {
    try {
      const { data, error } = await supabase
        .from('active_ingredients')
        .select('*')
        .order('name');

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar ingredientes ativos');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar ingredientes ativos');
      return [];
    }
  },

  /**
   * Obtém todas as condições de saúde
   */
  async getAllConditions() {
    try {
      const { data, error } = await supabase
        .from('health_conditions')
        .select('*')
        .order('name');

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar condições de saúde');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar condições de saúde');
      return [];
    }
  },

  /**
   * Obtém todos os estudos científicos
   */
  async getAllStudies() {
    try {
      const { data, error } = await supabase
        .from('scientific_studies')
        .select('*')
        .order('year', { ascending: false });

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar estudos científicos');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar estudos científicos');
      return [];
    }
  },

  /**
   * Adiciona um benefício a um nutracêutico
   */
  async addBenefit(nutraceuticalId: string, benefit: string) {
    try {
      const { data, error } = await supabase
        .from('nutraceutical_benefits')
        .insert([{
          nutraceutical_id: nutraceuticalId,
          benefit: benefit
        }])
        .select();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'adicionar benefício');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'adicionar benefício');
    }
  },

  /**
   * Atualiza os metadados científicos de um nutracêutico
   */
  async updateScientificMetadata(
    nutraceuticalId: string,
    {
      efficacy_score,
      sustainability_score,
      notes
    }: {
      efficacy_score: number;
      sustainability_score: number;
      notes?: string;
    }
  ) {
    try {
      // Primeiro tenta atualizar se já existir
      const { data: existingData, error: checkError } = await supabase
        .from('nutraceutical_scientific_metadata')
        .select('id')
        .eq('nutraceutical_id', nutraceuticalId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        NutraceuticalBaseService.handleError(checkError, 'verificar metadados científicos');
      }

      if (existingData) {
        // Atualizar existente
        const { data, error } = await supabase
          .from('nutraceutical_scientific_metadata')
          .update({
            efficacy_score,
            sustainability_score,
            notes
          })
          .eq('nutraceutical_id', nutraceuticalId)
          .select();

        if (error) {
          NutraceuticalBaseService.handleError(error, 'atualizar metadados científicos');
        }

        return data;
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('nutraceutical_scientific_metadata')
          .insert([{
            nutraceutical_id: nutraceuticalId,
            efficacy_score,
            sustainability_score,
            notes
          }])
          .select();

        if (error) {
          NutraceuticalBaseService.handleError(error, 'criar metadados científicos');
        }

        return data;
      }
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'gerenciar metadados científicos');
    }
  }
};
