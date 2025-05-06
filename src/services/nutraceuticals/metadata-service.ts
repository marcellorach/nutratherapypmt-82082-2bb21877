
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para gerenciar metadados científicos de nutracêuticos
 */
export const NutraceuticalMetadataService = {
  /**
   * Atualiza os metadados científicos de um nutracêutico
   * Incluindo escore de eficácia e outros metadados
   */
  async updateScientificMetadata(
    nutraceuticalId: string, 
    efficacyScore?: number
  ) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_scientific_metadata')
        .upsert({
          nutraceutical_id: nutraceuticalId,
          efficacy_score: efficacyScore !== undefined ? efficacyScore : null,
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
