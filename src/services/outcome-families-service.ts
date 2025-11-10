import { supabase } from '@/integrations/supabase/client';

export interface OutcomeFamily {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOutcomeFamilyData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
}

export const OutcomeFamiliesService = {
  async getAllFamilies(): Promise<OutcomeFamily[]> {
    const { data, error } = await supabase
      .from('outcome_families')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Erro ao buscar famílias de outcomes:', error);
      throw error;
    }

    return data || [];
  },

  async createFamily(familyData: CreateOutcomeFamilyData): Promise<OutcomeFamily> {
    const { data, error } = await supabase
      .from('outcome_families')
      .insert([familyData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar família:', error);
      throw error;
    }

    return data;
  },

  async updateFamily(id: string, familyData: Partial<CreateOutcomeFamilyData>): Promise<OutcomeFamily> {
    const { data, error } = await supabase
      .from('outcome_families')
      .update(familyData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar família:', error);
      throw error;
    }

    return data;
  },

  async deleteFamily(id: string): Promise<boolean> {
    // Verificar se há outcomes usando esta família
    const { data: outcomes } = await supabase
      .from('nutraceutical_outcomes')
      .select('id')
      .eq('outcome_family_id', id)
      .limit(1);

    if (outcomes && outcomes.length > 0) {
      throw new Error('Não é possível excluir uma família que possui outcomes associados');
    }

    const { error } = await supabase
      .from('outcome_families')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir família:', error);
      throw error;
    }

    return true;
  },

  async getOutcomesByFamily(familyId: string): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from('nutraceutical_outcomes')
      .select('*')
      .eq('outcome_family_id', familyId)
      .order('name');

    if (error) {
      console.error('Erro ao buscar outcomes da família:', error);
      throw error;
    }

    return data || [];
  }
};