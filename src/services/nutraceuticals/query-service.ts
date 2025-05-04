
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para consultas de nutracêuticos
 */
export const NutraceuticalQueryService = {
  /**
   * Busca um nutracêutico pelo ID
   */
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select(`
          *,
          outcome:outcome_id (
            id,
            name,
            description
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar nutracêutico');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar nutracêutico');
    }
  },

  /**
   * Lista todos os nutracêuticos
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select(`
          *,
          outcome:outcome_id (
            id,
            name
          )
        `)
        .order('name');

      if (error) {
        NutraceuticalBaseService.handleError(error, 'listar nutracêuticos');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'listar nutracêuticos');
      return [];
    }
  },

  /**
   * Busca um nutracêutico pelo nome
   */
  async getByName(name: string) {
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select()
        .ilike('name', `%${name}%`);

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar nutracêutico por nome');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar nutracêutico por nome');
      return [];
    }
  },

  /**
   * Obtém as relações entre um nutracêutico e outcomes (antiga condições)
   */
  async getOutcomeRelations(nutraceuticalId: string) {
    try {
      const { data, error } = await supabase
        .from('nutraceutical_conditions')
        .select(`
          *,
          condition:condition_id (
            id,
            name,
            description
          )
        `)
        .eq('nutraceutical_id', nutraceuticalId);

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar relações com outcomes');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar relações com outcomes');
      return [];
    }
  },

  /**
   * Obtém as relações entre um nutracêutico e estudos
   */
  async getStudyRelations(nutraceuticalId: string) {
    try {
      const { data, error } = await supabase
        .from('nutraceutical_studies')
        .select(`
          *,
          study:study_id (
            id,
            title,
            journal,
            year
          )
        `)
        .eq('nutraceutical_id', nutraceuticalId);

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar relações com estudos');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar relações com estudos');
      return [];
    }
  },

  /**
   * @deprecated Use getOutcomeRelations instead
   * Mantido para compatibilidade com código existente
   * Obtém as relações entre um nutracêutico e condições
   */
  async getConditionRelations(nutraceuticalId: string) {
    return this.getOutcomeRelations(nutraceuticalId);
  }
};
