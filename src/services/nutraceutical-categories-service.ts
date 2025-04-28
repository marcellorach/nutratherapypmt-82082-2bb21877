
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar categorias de nutracêuticos no Supabase
 */
export const NutraceuticalCategoriesService = {
  /**
   * Busca todas as categorias
   */
  async getAllCategories() {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      throw new Error('Não foi possível carregar as categorias');
    }

    return data;
  },

  /**
   * Busca uma categoria pelo ID
   */
  async getCategoryById(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar categoria:', error);
      throw new Error('Não foi possível carregar a categoria');
    }

    return data;
  },

  /**
   * Cria uma nova categoria
   */
  async createCategory({ name, description }: { name: string, description?: string }) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_categories')
      .insert([{ name, description }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error);
      throw new Error('Não foi possível criar a categoria');
    }

    return data;
  },

  /**
   * Atualiza uma categoria existente
   */
  async updateCategory(id: string, { name, description }: { name: string, description?: string }) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_categories')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw new Error('Não foi possível atualizar a categoria');
    }

    return data;
  },

  /**
   * Exclui uma categoria
   */
  async deleteCategory(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { error } = await client
      .from('nutraceutical_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir categoria:', error);
      throw new Error('Não foi possível excluir a categoria');
    }

    return true;
  }
};
