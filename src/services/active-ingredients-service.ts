
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar ingredientes ativos no Supabase
 */
export const ActiveIngredientsService = {
  /**
   * Busca todos os ingredientes ativos
   */
  async getAllIngredients() {
    const { data, error } = await supabase
      .from('active_ingredients')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar ingredientes:', error);
      throw new Error('Não foi possível carregar os ingredientes');
    }

    return data;
  },

  /**
   * Busca um ingrediente pelo ID
   */
  async getIngredientById(id: string) {
    const { data, error } = await supabase
      .from('active_ingredients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar ingrediente:', error);
      throw new Error('Não foi possível carregar o ingrediente');
    }

    return data;
  },

  /**
   * Cria um novo ingrediente ativo
   */
  async createIngredient({ name, description }: { name: string, description?: string }) {
    const { data, error } = await supabase
      .from('active_ingredients')
      .insert([{ name, description }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar ingrediente:', error);
      throw new Error('Não foi possível criar o ingrediente');
    }

    return data;
  },

  /**
   * Atualiza um ingrediente ativo existente
   */
  async updateIngredient(id: string, { name, description }: { name: string, description?: string }) {
    const { data, error } = await supabase
      .from('active_ingredients')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ingrediente:', error);
      throw new Error('Não foi possível atualizar o ingrediente');
    }

    return data;
  },

  /**
   * Exclui um ingrediente ativo
   */
  async deleteIngredient(id: string) {
    const { error } = await supabase
      .from('active_ingredients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir ingrediente:', error);
      throw new Error('Não foi possível excluir o ingrediente');
    }

    return true;
  }
};
