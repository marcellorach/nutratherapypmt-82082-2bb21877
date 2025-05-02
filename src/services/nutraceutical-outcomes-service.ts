
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar outcomes de nutracêuticos no Supabase
 */
export const NutraceuticalOutcomesService = {
  /**
   * Busca todos os outcomes
   */
  async getAllOutcomes() {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_outcomes')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar outcomes:', error);
      throw new Error('Não foi possível carregar os outcomes');
    }

    return data;
  },

  /**
   * Busca um outcome pelo ID
   */
  async getOutcomeById(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_outcomes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar outcome:', error);
      throw new Error('Não foi possível carregar o outcome');
    }

    return data;
  },

  /**
   * Cria um novo outcome
   */
  async createOutcome({ name, description }: { name: string, description?: string }) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_outcomes')
      .insert([{ name, description }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar outcome:', error);
      throw new Error('Não foi possível criar o outcome');
    }

    return data;
  },

  /**
   * Atualiza um outcome existente
   */
  async updateOutcome(id: string, { name, description }: { name: string, description?: string }) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_outcomes')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar outcome:', error);
      throw new Error('Não foi possível atualizar o outcome');
    }

    return data;
  },

  /**
   * Exclui um outcome
   */
  async deleteOutcome(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { error } = await client
      .from('nutraceutical_outcomes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir outcome:', error);
      throw new Error('Não foi possível excluir o outcome');
    }

    return true;
  }
};
