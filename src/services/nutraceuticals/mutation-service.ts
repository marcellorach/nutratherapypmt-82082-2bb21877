
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from './base-service';

/**
 * Serviço para operações de mutação de nutracêuticos (criar, atualizar, excluir)
 */
export const NutraceuticalMutationService = {
  /**
   * Cria um novo nutracêutico
   */
  async createNutraceutical({
    name,
    description,
    dosage,
    source,
    chemical_compound,
    outcome_id,
    contraindications
  }) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceuticals')
        .insert([{
          name,
          description,
          dosage,
          source,
          chemical_compound,
          outcome_id,
          contraindications
        }])
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'criar nutracêutico');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'criar nutracêutico');
    }
  },

  /**
   * Atualiza um nutracêutico existente
   */
  async updateNutraceutical(
    id: string,
    {
      name,
      description,
      dosage,
      source,
      chemical_compound,
      outcome_id,
      contraindications
    }
  ) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceuticals')
        .update({
          name,
          description,
          dosage,
          source,
          chemical_compound,
          outcome_id,
          contraindications
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        NutraceuticalBaseService.handleError(error, 'atualizar nutracêutico');
      }

      return data;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'atualizar nutracêutico');
    }
  },

  /**
   * Exclui um nutracêutico
   */
  async deleteNutraceutical(id: string) {
    try {
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { error } = await client
        .from('nutraceuticals')
        .delete()
        .eq('id', id);

      if (error) {
        NutraceuticalBaseService.handleError(error, 'excluir nutracêutico');
      }

      return true;
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'excluir nutracêutico');
    }
  }
};
