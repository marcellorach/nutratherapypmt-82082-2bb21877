
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar condições de saúde no Supabase
 */
export const HealthConditionsService = {
  /**
   * Busca todas as condições de saúde
   */
  async getAllConditions() {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('health_conditions')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar condições de saúde:', error);
      throw new Error('Não foi possível carregar as condições de saúde');
    }

    return data;
  },

  /**
   * Busca uma condição de saúde pelo ID
   */
  async getConditionById(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('health_conditions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar condição de saúde:', error);
      throw new Error('Não foi possível carregar a condição de saúde');
    }

    return data;
  },

  /**
   * Cria uma nova condição de saúde
   */
  async createCondition({ name, description }: { name: string, description: string }) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('health_conditions')
      .insert([{ name, description }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar condição de saúde:', error);
      throw new Error('Não foi possível criar a condição de saúde');
    }

    return data;
  },

  /**
   * Atualiza uma condição de saúde existente
   */
  async updateCondition(id: string, { name, description }: { name: string, description: string }) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('health_conditions')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar condição de saúde:', error);
      throw new Error('Não foi possível atualizar a condição de saúde');
    }

    return data;
  },

  /**
   * Remove uma condição de saúde
   */
  async deleteCondition(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { error } = await client
      .from('health_conditions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir condição de saúde:', error);
      throw new Error('Não foi possível excluir a condição de saúde');
    }

    return true;
  }
};
