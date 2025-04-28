
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar estudos científicos no Supabase
 */
export const ScientificStudiesService = {
  /**
   * Busca todos os estudos científicos
   */
  async getAllStudies() {
    const { data, error } = await supabase
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
   * Busca um estudo pelo ID
   */
  async getStudyById(id: string) {
    const { data, error } = await supabase
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
   * Busca estudos associados a um nutracêutico
   */
  async getStudiesByNutraceutical(nutraceuticalId: string) {
    const { data, error } = await supabase
      .from('nutraceutical_studies')
      .select(`
        id,
        relevance_score,
        study_id (*)
      `)
      .eq('nutraceutical_id', nutraceuticalId)
      .order('relevance_score', { ascending: false });

    if (error) {
      console.error('Erro ao buscar estudos do nutracêutico:', error);
      throw new Error('Não foi possível carregar os estudos do nutracêutico');
    }

    return data;
  },

  /**
   * Cria um novo estudo científico
   */
  async createStudy(study: {
    title: string,
    link: string,
    year: number,
    journal?: string,
    authors?: string[],
    abstract?: string
  }) {
    const { data, error } = await supabase
      .from('scientific_studies')
      .insert([study])
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
    study: {
      title?: string,
      link?: string,
      year?: number,
      journal?: string,
      authors?: string[],
      abstract?: string
    }
  ) {
    const { data, error } = await supabase
      .from('scientific_studies')
      .update(study)
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
   * Exclui um estudo científico
   */
  async deleteStudy(id: string) {
    const { error } = await supabase
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
