
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para gerenciar benefícios e metadados de nutracêuticos
 */
export const NutraceuticalMetadataService = {
  /**
   * Adiciona um benefício ao nutracêutico
   */
  async addBenefit(nutraceuticalId: string, benefit: string) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_benefits')
        .insert([{
          nutraceutical_id: nutraceuticalId,
          benefit
        }])
        .select()
        .single();

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
    { efficacy_score, sustainability_score, notes }: {
      efficacy_score: number,
      sustainability_score: number,
      notes?: string
    }
  ) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_scientific_metadata')
        .insert([{
          nutraceutical_id: nutraceuticalId,
          efficacy_score,
          sustainability_score,
          notes
        }])
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
