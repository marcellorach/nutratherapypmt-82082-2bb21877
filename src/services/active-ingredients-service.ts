
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar ingredientes ativos no Supabase
 */
export const ActiveIngredientsService = {
  /**
   * Busca todos os ingredientes ativos
   */
  async getAllIngredients() {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('active_ingredients')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar ingredientes ativos:', error);
      throw new Error('Não foi possível carregar os ingredientes ativos');
    }

    return data;
  },

  /**
   * Busca um ingrediente pelo ID
   */
  async getIngredientById(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('active_ingredients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar ingrediente ativo:', error);
      throw new Error('Não foi possível carregar o ingrediente ativo');
    }

    return data;
  },

  /**
   * Cria um novo ingrediente ativo
   */
  async createIngredient({ name, description }: { name: string, description?: string }) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('active_ingredients')
      .insert([{ name, description }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar ingrediente ativo:', error);
      throw new Error('Não foi possível criar o ingrediente ativo');
    }

    return data;
  },

  /**
   * Atualiza um ingrediente existente
   */
  async updateIngredient(id: string, { name, description }: { name: string, description?: string }) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('active_ingredients')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ingrediente ativo:', error);
      throw new Error('Não foi possível atualizar o ingrediente ativo');
    }

    return data;
  },

  /**
   * Remove um ingrediente
   */
  async deleteIngredient(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { error } = await client
      .from('active_ingredients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir ingrediente ativo:', error);
      throw new Error('Não foi possível excluir o ingrediente ativo');
    }

    return true;
  }
};
