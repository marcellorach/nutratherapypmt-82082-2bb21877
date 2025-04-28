
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar nutracêuticos no Supabase
 */
export const NutraceuticalsService = {
  /**
   * Busca todos os nutracêuticos com suas categorias
   */
  async getAllNutraceuticals() {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceuticals')
      .select(`
        *,
        category_id:nutraceutical_categories(*),
        nutraceutical_benefits(id, benefit),
        nutraceutical_scientific_metadata(*),
        nutraceutical_health_conditions:nutraceutical_conditions(
          id, 
          relationship_type,
          efficacy_score,
          condition:health_conditions(*)
        ),
        nutraceutical_studies(
          id,
          relevance_score,
          study:scientific_studies(*)
        )
      `)
      .order('name');

    if (error) {
      console.error('Erro ao buscar nutracêuticos:', error);
      throw new Error('Não foi possível carregar os nutracêuticos');
    }

    return data;
  },

  /**
   * Busca um nutracêutico pelo ID com todas as suas relações
   */
  async getNutraceuticalById(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceuticals')
      .select(`
        *,
        category_id:nutraceutical_categories(*),
        nutraceutical_benefits(id, benefit),
        nutraceutical_scientific_metadata(*),
        nutraceutical_health_conditions:nutraceutical_conditions(
          id, 
          relationship_type,
          efficacy_score,
          condition:health_conditions(*)
        ),
        nutraceutical_studies(
          id,
          relevance_score,
          study:scientific_studies(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar nutracêutico:', error);
      throw new Error('Não foi possível carregar o nutracêutico');
    }

    return data;
  },

  /**
   * Cria um novo nutracêutico
   */
  async createNutraceutical({
    name,
    description,
    dosage,
    source,
    chemical_compound,
    category_id,
    contraindications
  }) {
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
        category_id,
        contraindications
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar nutracêutico:', error);
      throw new Error('Não foi possível criar o nutracêutico');
    }

    return data;
  },

  /**
   * Adiciona um benefício ao nutracêutico
   */
  async addBenefit(nutraceuticalId: string, benefit: string) {
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
      console.error('Erro ao adicionar benefício:', error);
      throw new Error('Não foi possível adicionar o benefício');
    }

    return data;
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
      console.error('Erro ao atualizar metadados científicos:', error);
      throw new Error('Não foi possível atualizar os metadados científicos');
    }

    return data;
  },

  /**
   * Relaciona um nutracêutico a uma condição de saúde
   */
  async relateToCondition(
    nutraceuticalId: string,
    conditionId: string,
    relationshipType: 'prevention' | 'treatment' | 'support',
    efficacyScore: number
  ) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_conditions')
      .insert([{
        nutraceutical_id: nutraceuticalId,
        condition_id: conditionId,
        relationship_type: relationshipType,
        efficacy_score: efficacyScore
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao relacionar com condição de saúde:', error);
      throw new Error('Não foi possível relacionar o nutracêutico com a condição de saúde');
    }

    return data;
  },

  /**
   * Relaciona um nutracêutico a um estudo científico
   */
  async relateToStudy(
    nutraceuticalId: string,
    studyId: string,
    relevanceScore: number
  ) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_studies')
      .insert([{
        nutraceutical_id: nutraceuticalId,
        study_id: studyId,
        relevance_score: relevanceScore
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao relacionar com estudo científico:', error);
      throw new Error('Não foi possível relacionar o nutracêutico com o estudo científico');
    }

    return data;
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
      category_id,
      contraindications
    }
  ) {
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
        category_id,
        contraindications
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar nutracêutico:', error);
      throw new Error('Não foi possível atualizar o nutracêutico');
    }

    return data;
  },

  /**
   * Exclui um nutracêutico
   */
  async deleteNutraceutical(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { error } = await client
      .from('nutraceuticals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir nutracêutico:', error);
      throw new Error('Não foi possível excluir o nutracêutico');
    }

    return true;
  }
};
