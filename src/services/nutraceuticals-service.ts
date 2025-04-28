
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para gerenciar nutracêuticos no Supabase
 */
export const NutraceuticalsService = {
  /**
   * Busca todos os nutracêuticos
   */
  async getAllNutraceuticals() {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceuticals')
      .select(`
        *,
        category:category_id (
          id,
          name
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
   * Busca um nutracêutico pelo ID
   */
  async getNutraceuticalById(id: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceuticals')
      .select(`
        *,
        category:category_id (
          id,
          name
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
   * Busca nutracêuticos por categoria
   */
  async getNutraceuticalsByCategory(categoryId: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceuticals')
      .select(`
        *,
        category:category_id (
          id,
          name
        )
      `)
      .eq('category_id', categoryId)
      .order('name');

    if (error) {
      console.error('Erro ao buscar nutracêuticos por categoria:', error);
      throw new Error('Não foi possível carregar os nutracêuticos');
    }

    return data;
  },

  /**
   * Busca nutracêuticos por condição de saúde
   */
  async getNutraceuticalsByCondition(conditionId: string, relationshipType?: 'prevention' | 'treatment' | 'support') {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    let query = client
      .from('nutraceutical_conditions')
      .select(`
        id,
        efficacy_score,
        relationship_type,
        nutraceutical:nutraceutical_id (
          id,
          name,
          description,
          dosage,
          source,
          chemical_compound,
          contraindications,
          category:category_id (
            id,
            name
          )
        )
      `)
      .eq('condition_id', conditionId);

    if (relationshipType) {
      query = query.eq('relationship_type', relationshipType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar nutracêuticos por condição:', error);
      throw new Error('Não foi possível carregar os nutracêuticos');
    }

    return data;
  },

  /**
   * Cria um novo nutracêutico
   */
  async createNutraceutical(nutraceutical: {
    name: string,
    description?: string,
    dosage?: string,
    source?: string,
    chemical_compound?: string,
    category_id?: string,
    contraindications?: string[]
  }) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceuticals')
      .insert([nutraceutical])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar nutracêutico:', error);
      throw new Error('Não foi possível criar o nutracêutico');
    }

    return data;
  },

  /**
   * Atualiza um nutracêutico existente
   */
  async updateNutraceutical(
    id: string,
    nutraceutical: {
      name?: string,
      description?: string,
      dosage?: string,
      source?: string,
      chemical_compound?: string,
      category_id?: string,
      contraindications?: string[]
    }
  ) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceuticals')
      .update(nutraceutical)
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
  },

  /**
   * Adiciona um benefício a um nutracêutico
   */
  async addBenefit(nutraceuticalId: string, benefit: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_benefits')
      .insert([{ nutraceutical_id: nutraceuticalId, benefit }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar benefício:', error);
      throw new Error('Não foi possível adicionar o benefício');
    }

    return data;
  },

  /**
   * Remove um benefício de um nutracêutico
   */
  async removeBenefit(benefitId: string) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { error } = await client
      .from('nutraceutical_benefits')
      .delete()
      .eq('id', benefitId);

    if (error) {
      console.error('Erro ao remover benefício:', error);
      throw new Error('Não foi possível remover o benefício');
    }

    return true;
  },

  /**
   * Atualiza metadados científicos de um nutracêutico
   */
  async updateScientificMetadata(
    nutraceuticalId: string,
    metadata: {
      efficacy_score?: number,
      sustainability_score?: number,
      notes?: string
    }
  ) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_scientific_metadata')
      .upsert([{ 
        nutraceutical_id: nutraceuticalId,
        ...metadata
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
    efficacyScore: number = 0
  ) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_conditions')
      .upsert([{
        nutraceutical_id: nutraceuticalId,
        condition_id: conditionId,
        relationship_type: relationshipType,
        efficacy_score: efficacyScore
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao relacionar nutracêutico a condição:', error);
      throw new Error('Não foi possível relacionar o nutracêutico à condição');
    }

    return data;
  },

  /**
   * Relaciona um nutracêutico a um estudo científico
   */
  async relateToStudy(
    nutraceuticalId: string,
    studyId: string,
    relevanceScore: number = 0
  ) {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    const { data, error } = await client
      .from('nutraceutical_studies')
      .upsert([{
        nutraceutical_id: nutraceuticalId,
        study_id: studyId,
        relevance_score: relevanceScore
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao relacionar nutracêutico a estudo:', error);
      throw new Error('Não foi possível relacionar o nutracêutico ao estudo');
    }

    return data;
  }
};
