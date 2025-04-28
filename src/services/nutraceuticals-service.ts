
import { supabase } from '@/integrations/supabase/client';
import { Nutraceutical } from '@/types';

/**
 * Serviço para gerenciar nutracêuticos no Supabase
 */
export const NutraceuticalsService = {
  /**
   * Busca todos os nutracêuticos
   */
  async getAllNutraceuticals() {
    const { data, error } = await supabase
      .from('nutraceuticals')
      .select(`
        *,
        category_id (id, name),
        nutraceutical_benefits (id, benefit),
        nutraceutical_scientific_metadata (*),
        nutraceutical_health_conditions (
          id, 
          efficacy_score, 
          relation_type,
          condition_id (id, name, description)
        ),
        nutraceutical_ingredients (
          ingredient_id (id, name, description)
        ),
        nutraceutical_studies (
          study_id (id, title, year, journal, authors)
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
    const { data, error } = await supabase
      .from('nutraceuticals')
      .select(`
        *,
        category_id (id, name),
        nutraceutical_benefits (id, benefit),
        nutraceutical_scientific_metadata (*),
        nutraceutical_health_conditions (
          id, 
          efficacy_score, 
          relation_type,
          condition_id (id, name, description)
        ),
        nutraceutical_ingredients (
          ingredient_id (id, name, description)
        ),
        nutraceutical_studies (
          study_id (id, title, year, journal, authors, abstract, link)
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
  async createNutraceutical(nutraceutical: any) {
    const { name, description, dosage, source, chemical_compound, category_id, contraindications } = nutraceutical;
    
    // Inserir o nutracêutico base
    const { data, error } = await supabase
      .from('nutraceuticals')
      .insert([{ 
        name, 
        description, 
        dosage, 
        source, 
        chemical_compound, 
        category_id,
        contraindications: contraindications || []
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
   * Atualiza um nutracêutico existente
   */
  async updateNutraceutical(id: string, nutraceutical: any) {
    const { name, description, dosage, source, chemical_compound, category_id, contraindications } = nutraceutical;
    
    const { data, error } = await supabase
      .from('nutraceuticals')
      .update({ 
        name, 
        description, 
        dosage, 
        source, 
        chemical_compound, 
        category_id,
        contraindications: contraindications || []
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
    const { error } = await supabase
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
   * Adiciona um benefício ao nutracêutico
   */
  async addBenefit(nutraceuticalId: string, benefit: string) {
    const { data, error } = await supabase
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
   * Remove um benefício do nutracêutico
   */
  async removeBenefit(benefitId: string) {
    const { error } = await supabase
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
   * Adiciona ou atualiza os metadados científicos de um nutracêutico
   */
  async updateScientificMetadata(nutraceuticalId: string, data: { efficacy_score: number, sustainability_score: number }) {
    // Verificar se já existe um registro
    const { data: existingData, error: checkError } = await supabase
      .from('nutraceutical_scientific_metadata')
      .select('*')
      .eq('nutraceutical_id', nutraceuticalId)
      .maybeSingle();

    if (checkError) {
      console.error('Erro ao verificar metadados científicos:', checkError);
      throw new Error('Falha ao atualizar metadados científicos');
    }

    if (existingData) {
      // Atualizar registro existente
      const { data: updatedData, error } = await supabase
        .from('nutraceutical_scientific_metadata')
        .update({ 
          efficacy_score: data.efficacy_score, 
          sustainability_score: data.sustainability_score 
        })
        .eq('id', existingData.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar metadados científicos:', error);
        throw new Error('Não foi possível atualizar os metadados científicos');
      }
      
      return updatedData;
    } else {
      // Inserir novo registro
      const { data: newData, error } = await supabase
        .from('nutraceutical_scientific_metadata')
        .insert([{ 
          nutraceutical_id: nutraceuticalId, 
          efficacy_score: data.efficacy_score, 
          sustainability_score: data.sustainability_score 
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar metadados científicos:', error);
        throw new Error('Não foi possível criar os metadados científicos');
      }
      
      return newData;
    }
  },

  /**
   * Relaciona um nutracêutico a uma condição de saúde
   */
  async relateToCondition(
    nutraceuticalId: string, 
    conditionId: string, 
    relationType: 'prevention' | 'treatment' | 'support',
    efficacyScore: number
  ) {
    const { data, error } = await supabase
      .from('nutraceutical_health_conditions')
      .insert([{ 
        nutraceutical_id: nutraceuticalId, 
        condition_id: conditionId,
        relation_type: relationType,
        efficacy_score: efficacyScore
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao relacionar nutracêutico à condição:', error);
      throw new Error('Não foi possível relacionar o nutracêutico à condição');
    }

    return data;
  },

  /**
   * Atualiza a relação entre um nutracêutico e uma condição
   */
  async updateConditionRelation(
    relationId: string,
    data: { efficacy_score: number }
  ) {
    const { data: updatedData, error } = await supabase
      .from('nutraceutical_health_conditions')
      .update({ efficacy_score: data.efficacy_score })
      .eq('id', relationId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar relação com condição:', error);
      throw new Error('Não foi possível atualizar a relação com a condição');
    }

    return updatedData;
  },

  /**
   * Remove a relação entre um nutracêutico e uma condição
   */
  async removeConditionRelation(relationId: string) {
    const { error } = await supabase
      .from('nutraceutical_health_conditions')
      .delete()
      .eq('id', relationId);

    if (error) {
      console.error('Erro ao remover relação com condição:', error);
      throw new Error('Não foi possível remover a relação com a condição');
    }

    return true;
  },

  /**
   * Relaciona um nutracêutico a um ingrediente ativo
   */
  async relateToIngredient(nutraceuticalId: string, ingredientId: string) {
    const { data, error } = await supabase
      .from('nutraceutical_ingredients')
      .insert([{ 
        nutraceutical_id: nutraceuticalId, 
        ingredient_id: ingredientId 
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao relacionar nutracêutico ao ingrediente:', error);
      throw new Error('Não foi possível relacionar o nutracêutico ao ingrediente');
    }

    return data;
  },

  /**
   * Remove a relação entre um nutracêutico e um ingrediente
   */
  async removeIngredientRelation(relationId: string) {
    const { error } = await supabase
      .from('nutraceutical_ingredients')
      .delete()
      .eq('id', relationId);

    if (error) {
      console.error('Erro ao remover relação com ingrediente:', error);
      throw new Error('Não foi possível remover a relação com o ingrediente');
    }

    return true;
  },

  /**
   * Relaciona um nutracêutico a um estudo científico
   */
  async relateToStudy(nutraceuticalId: string, studyId: string, relevanceScore: number) {
    const { data, error } = await supabase
      .from('nutraceutical_studies')
      .insert([{ 
        nutraceutical_id: nutraceuticalId, 
        study_id: studyId,
        relevance_score: relevanceScore
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao relacionar nutracêutico ao estudo:', error);
      throw new Error('Não foi possível relacionar o nutracêutico ao estudo');
    }

    return data;
  },

  /**
   * Remove a relação entre um nutracêutico e um estudo
   */
  async removeStudyRelation(relationId: string) {
    const { error } = await supabase
      .from('nutraceutical_studies')
      .delete()
      .eq('id', relationId);

    if (error) {
      console.error('Erro ao remover relação com estudo:', error);
      throw new Error('Não foi possível remover a relação com o estudo');
    }

    return true;
  }
};
