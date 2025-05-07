
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para operações de consulta de nutracêuticos
 */
export const NutraceuticalQueryService = {
  /**
   * Obtém um nutracêutico pelo ID
   */
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select(`
          *,
          scientific_metadata:nutraceutical_scientific_metadata(*),
          nutraceutical_conditions(*),
          nutraceutical_studies(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'obter nutracêutico');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'obter nutracêutico');
    }
  },

  /**
   * Obtém todos os nutracêuticos
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select(`
          *,
          scientific_metadata:nutraceutical_scientific_metadata(*),
          nutraceutical_conditions(*),
          nutraceutical_studies(*)
        `)
        .order('name');

      if (error) {
        NutraceuticalBaseService.handleError(error, 'obter nutracêuticos');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'obter nutracêuticos');
    }
  },

  /**
   * Obtém todos os nutracêuticos com metadados e relacionamentos
   */
  async getAllNutraceuticals() {
    try {
      console.log('Buscando todos os nutracêuticos com relacionamentos');
      
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select(`
          *,
          scientific_metadata:nutraceutical_scientific_metadata(*),
          nutraceutical_conditions(
            id,
            relationship_type,
            efficacy_score,
            notes,
            condition:health_conditions(id, name, description)
          ),
          nutraceutical_studies(
            id,
            relevance_score,
            study:scientific_studies(id, title, journal)
          )
        `)
        .order('name');

      if (error) {
        console.error('Erro ao obter nutracêuticos completos:', error);
        NutraceuticalBaseService.handleError(error, 'obter todos os nutracêuticos');
      }

      console.log(`Encontrados ${data?.length || 0} nutracêuticos`);
      return data || [];
    } catch (error) {
      console.error('Exceção ao obter nutracêuticos completos:', error);
      NutraceuticalBaseService.handleError(error, 'obter todos os nutracêuticos');
      return [];
    }
  },
  
  /**
   * Obtém as relações de um nutracêutico com outcomes
   */
  async getOutcomeRelations(nutraceuticalId: string) {
    try {
      const { data, error } = await supabase
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
  },
  
  /**
   * Obtém as relações de um nutracêutico com estudos científicos
   */
  async getStudyRelations(nutraceuticalId: string) {
    try {
      const { data, error } = await supabase
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
  }
};
