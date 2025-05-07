
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from '../base-service';

/**
 * Serviço para gerenciar benefícios de nutracêuticos
 */
export const BenefitRelationsService = {
  /**
   * Adiciona um benefício a um nutracêutico
   */
  async addBenefit(nutraceuticalId: string, benefit: string) {
    try {
      console.log('Adicionando benefício ao nutracêutico:', { nutraceuticalId, benefit });
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_benefits')
        .insert({
          nutraceutical_id: nutraceuticalId,
          benefit
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar benefício:', error);
        NutraceuticalBaseService.handleError(error, 'adicionar benefício ao nutracêutico');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao adicionar benefício:', error);
      NutraceuticalBaseService.handleError(error, 'adicionar benefício ao nutracêutico');
    }
  },
  
  /**
   * Obtém os benefícios de um nutracêutico
   */
  async getBenefits(nutraceuticalId: string) {
    try {
      console.log('Obtendo benefícios para o nutracêutico:', nutraceuticalId);
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_benefits')
        .select('*')
        .eq('nutraceutical_id', nutraceuticalId);

      if (error) {
        console.error('Erro ao obter benefícios:', error);
        NutraceuticalBaseService.handleError(error, 'obter benefícios');
      }

      return data || [];
    } catch (error) {
      console.error('Exceção ao obter benefícios:', error);
      NutraceuticalBaseService.handleError(error, 'obter benefícios');
      return [];
    }
  },
  
  /**
   * Remove um benefício de um nutracêutico
   */
  async removeBenefit(benefitId: string) {
    try {
      console.log('Removendo benefício:', { benefitId });
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_benefits')
        .delete()
        .eq('id', benefitId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao remover benefício:', error);
        NutraceuticalBaseService.handleError(error, 'remover benefício');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao remover benefício:', error);
      NutraceuticalBaseService.handleError(error, 'remover benefício');
      return null;
    }
  }
};
