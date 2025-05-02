
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para operações de consulta de nutracêuticos
 */
export const NutraceuticalQueryService = {
  /**
   * Busca todos os nutracêuticos com suas categorias
   */
  async getAllNutraceuticals() {
    try {
      const query = NutraceuticalBaseService.getBaseQuery().order('name');
      const { data, error } = await query;

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar nutracêuticos');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar nutracêuticos');
    }
  },

  /**
   * Busca um nutracêutico pelo ID com todas as suas relações
   */
  async getNutraceuticalById(id: string) {
    try {
      const query = NutraceuticalBaseService.getBaseQuery().eq('id', id).single();
      const { data, error } = await query;

      if (error) {
        NutraceuticalBaseService.handleError(error, 'buscar nutracêutico');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'buscar nutracêutico');
    }
  }
};
