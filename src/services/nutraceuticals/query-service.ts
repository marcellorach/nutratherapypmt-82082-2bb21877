
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

export const NutraceuticalQueryService = {
  /**
   * Obtém um nutraceutico pelo ID
   */
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select('*, outcome:outcome_id (*)')
        .eq('id', id)
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar por ID');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar por ID');
    }
  },

  /**
   * Obtém todos os nutraceuticos
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select('*, outcome:outcome_id (*)');

      if (error) {
        NutraceuticalBaseService.handleError(error, 'listar todos');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'listar todos');
      return [];
    }
  },

  /**
   * Busca nutraceuticos por nome
   */
  async getByName(name: string) {
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select('*, outcome:outcome_id (*)')
        .ilike('name', `%${name}%`);

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar por nome');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar por nome');
      return [];
    }
  },
  
  /**
   * Obter todas as relações com condições de saúde para um nutracêutico
   */
  async getConditionRelations(nutraceuticalId: string) {
    try {
      const { data, error } = await supabase
        .from('nutraceutical_conditions')
        .select('*, condition:condition_id (*)')
        .eq('nutraceutical_id', nutraceuticalId);

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar relações de condições');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar relações de condições');
      return [];
    }
  },
  
  /**
   * Obter todas as relações com estudos científicos para um nutracêutico
   */
  async getStudyRelations(nutraceuticalId: string) {
    try {
      const { data, error } = await supabase
        .from('nutraceutical_studies')
        .select('*, study:study_id (*)')
        .eq('nutraceutical_id', nutraceuticalId);

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar relações de estudos');
      }

      return data || [];
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar relações de estudos');
      return [];
    }
  }
};
