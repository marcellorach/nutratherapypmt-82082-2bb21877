
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar estudos científicos no Supabase
 */
export const ScientificStudiesService = {
  /**
   * Busca todos os estudos científicos
   */
  async getAllStudies() {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('scientific_studies')
      .select('*')
      .order('year', { ascending: false });

    if (error) {
      console.error('Erro ao buscar estudos científicos:', error);
      throw new Error('Não foi possível carregar os estudos científicos');
    }

    return data;
  },

  /**
   * Busca um estudo científico pelo ID
   */
  async getStudyById(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('scientific_studies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar estudo científico:', error);
      throw new Error('Não foi possível carregar o estudo científico');
    }

    return data;
  },

  /**
   * Cria um novo estudo científico
   */
  async createStudy({ 
    title, 
    link, 
    year,
    journal,
    authors,
    abstract
  }) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('scientific_studies')
      .insert([{
        title,
        link,
        year,
        journal,
        authors,
        abstract
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar estudo científico:', error);
      throw new Error('Não foi possível criar o estudo científico');
    }

    return data;
  },

  /**
   * Atualiza um estudo científico existente
   */
  async updateStudy(
    id: string, 
    { 
      title, 
      link, 
      year,
      journal,
      authors,
      abstract
    }
  ) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('scientific_studies')
      .update({
        title,
        link,
        year,
        journal,
        authors,
        abstract
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar estudo científico:', error);
      throw new Error('Não foi possível atualizar o estudo científico');
    }

    return data;
  },

  /**
   * Remove um estudo científico
   */
  async deleteStudy(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { error } = await client
      .from('scientific_studies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir estudo científico:', error);
      throw new Error('Não foi possível excluir o estudo científico');
    }

    return true;
  }
};
