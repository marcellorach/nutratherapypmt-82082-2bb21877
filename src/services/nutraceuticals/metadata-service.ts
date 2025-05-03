
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para gerenciar metadados de nutracêuticos
 */
export const NutraceuticalMetadataService = {
  /**
   * Obtém todos os outcomes (categorias) de nutracêuticos
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
    efficacyScore: number
  ) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_scientific_metadata')
        .upsert({
          nutraceutical_id: nutraceuticalId,
          efficacy_score: efficacyScore,
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'atualizar metadados científicos');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'atualizar metadados científicos');
    }
  }
};
