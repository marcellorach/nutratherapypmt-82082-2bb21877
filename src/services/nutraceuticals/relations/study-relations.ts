
import { supabase } from '@/integrations/supabase/client';
import { NutraceuticalBaseService } from '../base-service';

/**
 * Serviço para gerenciar relacionamentos entre nutracêuticos e estudos científicos
 */
export const StudyRelationsService = {
  /**
   * Relaciona um nutracêutico a um estudo científico
   */
  async relateToStudy(
    nutraceuticalId: string,
    studyId: string,
    relevanceScore: number
  ) {
    try {
      console.log('Relacionando nutracêutico ao estudo:', { nutraceuticalId, studyId, relevanceScore });
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_studies')
        .insert({
          nutraceutical_id: nutraceuticalId,
          study_id: studyId,
          relevance_score: relevanceScore
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao relacionar nutracêutico a estudo:', error);
        NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a estudo');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao relacionar nutracêutico a estudo:', error);
      NutraceuticalBaseService.handleError(error, 'relacionar nutracêutico a estudo');
    }
  },

  /**
   * Remove uma relação entre nutracêutico e estudo
   */
  async removeStudyRelation(relationId: string) {
    try {
      console.log('Removendo relação com estudo:', { relationId });
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_studies')
        .delete()
        .eq('id', relationId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao remover relação com estudo:', error);
        NutraceuticalBaseService.handleError(error, 'remover relação com estudo');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao remover relação com estudo:', error);
      NutraceuticalBaseService.handleError(error, 'remover relação com estudo');
    }
  },
  
  /**
   * Obtém as relações de um nutracêutico com estudos científicos
   */
  async getStudyRelations(nutraceuticalId: string) {
    try {
      console.log('Obtendo relações com estudos para o nutracêutico:', nutraceuticalId);
      
      // Usando type assertion para contornar a verificação de tipos do TypeScript
      const client = supabase as any;
      const { data, error } = await client
        .from('nutraceutical_studies')
        .select(`
          *,
          study:study_id(id, title, journal)
        `)
        .eq('nutraceutical_id', nutraceuticalId);

      if (error) {
        console.error('Erro ao obter relações com estudos:', error);
        NutraceuticalBaseService.handleError(error, 'obter relações com estudos');
      }

      return data;
    } catch (error) {
      console.error('Exceção ao obter relações com estudos:', error);
      NutraceuticalBaseService.handleError(error, 'obter relações com estudos');
      return [];
    }
  }
};
