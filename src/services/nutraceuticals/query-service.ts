
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
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceuticals')
        .select(`
          *,
          scientific_metadata:nutraceutical_scientific_metadata(*)
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
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceuticals')
        .select(`
          *,
          scientific_metadata:nutraceutical_scientific_metadata(*),
          conditions:nutraceutical_conditions(*)
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
   * Obtém todos os nutracêuticos com metadados
   */
  async getAllNutraceuticals() {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceuticals')
        .select('*, scientific_metadata:nutraceutical_scientific_metadata(*)')
        .order('name');

      if (error) {
        NutraceuticalBaseService.handleError(error, 'obter todos os nutracêuticos');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'obter todos os nutracêuticos');
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
    }
  }
};
