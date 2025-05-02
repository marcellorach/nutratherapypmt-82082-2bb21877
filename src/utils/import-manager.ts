
import { supabase } from "@/integrations/supabase/client";

/**
 * Interface para os dados de importação
 */
interface NutraceuticalImport {
  id: string;
  name: string;
  description?: string;
  source_type: string;
  nutraceutical_count?: number;
  created_at: string;
  created_by?: string;
  source_file_name?: string;
  source_file_path?: string;
  is_processed?: boolean;
}

/**
 * Utilitário para gerenciar importações de nutracêuticos
 */
export const NutraceuticalImportManager = {
  /**
   * Lista importações recentes de nutracêuticos
   * @param limit Número máximo de registros para retornar (padrão: 20)
   * @returns Dados de importações recentes
   */
  async listRecentImports(limit = 20): Promise<NutraceuticalImport[]> {
    try {
      // Como a tabela 'nutraceutical_imports' foi recém-criada, precisamos explicitamente
      // utilizar o método `.from` com `any` para evitar erros de tipagem até que
      // os tipos do Supabase sejam atualizados
      const { data, error } = await supabase
        .from('nutraceutical_imports' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao listar importações recentes:', error);
      throw error;
    }
  },

  /**
   * Exclui uma importação e todos os nutracêuticos associados a ela
   * @param importId ID da importação a ser excluída
   * @returns Resultado da operação
   */
  async deleteImport(importId: string) {
    try {
      // 1. Excluir as relações na tabela nutraceutical_conditions
      await this.deleteNutraceuticalRelations(importId);
      
      // 2. Excluir os nutracêuticos associados à importação
      const { error: deleteNutraceuticalsError } = await supabase
        .from('nutraceuticals')
        .delete()
        .eq('import_id', importId);

      if (deleteNutraceuticalsError) {
        throw deleteNutraceuticalsError;
      }

      // 3. Excluir o registro da importação
      const { error: deleteImportError } = await supabase
        .from('nutraceutical_imports' as any)
        .delete()
        .eq('id', importId);

      if (deleteImportError) {
        throw deleteImportError;
      }

      return { success: true, message: 'Importação excluída com sucesso' };
    } catch (error) {
      console.error('Erro ao excluir importação:', error);
      return { 
        success: false, 
        message: 'Erro ao excluir importação', 
        error 
      };
    }
  },

  /**
   * Exclui relações de nutracêuticos de uma importação específica
   * @param importId ID da importação
   */
  async deleteNutraceuticalRelations(importId: string) {
    try {
      // Obter IDs dos nutracêuticos dessa importação
      const { data: nutraceuticals, error: fetchError } = await supabase
        .from('nutraceuticals')
        .select('id')
        .eq('import_id', importId);
        
      if (fetchError) throw fetchError;
      
      const nutraceuticalIds = nutraceuticals?.map(n => n.id) || [];
      
      if (nutraceuticalIds.length === 0) return;
      
      // Excluir relações em nutraceutical_conditions
      const { error: conditionsError } = await supabase
        .from('nutraceutical_conditions')
        .delete()
        .in('nutraceutical_id', nutraceuticalIds);
        
      if (conditionsError) throw conditionsError;
      
      // Excluir relações em nutraceutical_benefits
      const { error: benefitsError } = await supabase
        .from('nutraceutical_benefits')
        .delete()
        .in('nutraceutical_id', nutraceuticalIds);
        
      if (benefitsError) throw benefitsError;
      
      // Excluir relações em nutraceutical_scientific_metadata
      const { error: metadataError } = await supabase
        .from('nutraceutical_scientific_metadata')
        .delete()
        .in('nutraceutical_id', nutraceuticalIds);
        
      if (metadataError) throw metadataError;
      
      // Excluir relações em nutraceutical_studies
      const { error: studiesError } = await supabase
        .from('nutraceutical_studies')
        .delete()
        .in('nutraceutical_id', nutraceuticalIds);
        
      if (studiesError) throw studiesError;
      
    } catch (error) {
      console.error('Erro ao excluir relações de nutracêuticos:', error);
      throw error;
    }
  }
};
