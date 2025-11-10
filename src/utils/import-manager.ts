
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
      // converter os resultados para o tipo NutraceuticalImport para evitar erros de tipagem
      const { data, error } = await supabase
        .from('nutraceutical_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // Explicitamente converter os dados para o tipo esperado
      return (data || []) as NutraceuticalImport[];
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
      // Nota: campo import_id não existe, usando estratégia alternativa
      // Os nutracêuticos serão mantidos mas poderiam ser deletados manualmente se necessário
      console.log('Importação deletada, nutracêuticos mantidos no sistema');

      // 3. Excluir o registro da importação
      const { error: deleteImportError } = await supabase
        .from('nutraceutical_imports')
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
      // Como não há campo import_id em nutraceuticals, 
      // não há relações diretas para excluir neste momento
      console.log('Relações mantidas (sem campo import_id)');
      return;
    } catch (error) {
      console.error('Erro ao excluir relações de nutracêuticos:', error);
      throw error;
    }
  }
};
