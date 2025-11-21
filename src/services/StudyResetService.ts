import { supabase } from '@/integrations/supabase/client';

export interface HealthStats {
  totalStudies: number;
  newStudies: number;
  processedStudies: number;
  erroredStudies: number;
  processingRate: number;
  avgProcessingTime: string;
  accumulatedImports: number;
  hasWarnings: boolean;
}

/**
 * Service Layer para operações de reset e cleanup de estudos
 * Centraliza toda lógica de manutenção do sistema
 */
export class StudyResetService {
  /**
   * Reseta um estudo específico para reprocessamento
   * @param studyId - UUID do estudo a ser resetado
   * @returns Promise<void>
   */
  static async resetStudy(studyId: string): Promise<void> {
    const { error } = await supabase
      .from('processed_studies')
      .update({
        kanban_status: 'new',
        analysis_data: null,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', studyId);

    if (error) {
      throw new Error(`Falha ao resetar estudo: ${error.message}`);
    }
  }

  /**
   * Reseta todos os estudos com erro para nova tentativa
   * @returns Promise<number> - Quantidade de estudos resetados
   */
  static async resetAllErroredStudies(): Promise<number> {
    const { data: erroredStudies, error: selectError } = await supabase
      .from('processed_studies')
      .select('id')
      .not('error_message', 'is', null);

    if (selectError) {
      throw new Error(`Falha ao buscar estudos com erro: ${selectError.message}`);
    }

    if (!erroredStudies || erroredStudies.length === 0) {
      return 0;
    }

    const { error: updateError } = await supabase
      .from('processed_studies')
      .update({
        kanban_status: 'new',
        analysis_data: null,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .not('error_message', 'is', null);

    if (updateError) {
      throw new Error(`Falha ao resetar estudos: ${updateError.message}`);
    }

    return erroredStudies.length;
  }

  /**
   * Limpa importações antigas, mantendo apenas as N mais recentes
   * @param keepLast - Quantidade de importações recentes a manter (padrão: 5)
   * @returns Promise<number> - Quantidade de importações removidas
   */
  static async cleanOldImports(keepLast: number = 5): Promise<number> {
    // Buscar IDs das importações mais recentes
    const { data: recentImports, error: selectError } = await supabase
      .from('scispace_imports')
      .select('id')
      .order('imported_at', { ascending: false })
      .limit(keepLast);

    if (selectError) {
      throw new Error(`Falha ao buscar importações: ${selectError.message}`);
    }

    if (!recentImports || recentImports.length === 0) {
      return 0;
    }

    const recentIds = recentImports.map(imp => imp.id);

    // Contar importações antigas antes de deletar
    const { count: oldCount, error: countError } = await supabase
      .from('scispace_imports')
      .select('*', { count: 'exact', head: true })
      .not('id', 'in', `(${recentIds.join(',')})`);

    if (countError) {
      throw new Error(`Falha ao contar importações antigas: ${countError.message}`);
    }

    if (!oldCount || oldCount === 0) {
      return 0;
    }

    // Deletar importações antigas
    const { error: deleteError } = await supabase
      .from('scispace_imports')
      .delete()
      .not('id', 'in', `(${recentIds.join(',')})`);

    if (deleteError) {
      throw new Error(`Falha ao deletar importações antigas: ${deleteError.message}`);
    }

    return oldCount;
  }

  /**
   * Verifica a saúde geral do sistema
   * @returns Promise<HealthStats> - Estatísticas de saúde do sistema
   */
  static async checkSystemHealth(): Promise<HealthStats> {
    // Buscar total de estudos por status
    const { data: allStudies, error: studiesError } = await supabase
      .from('processed_studies')
      .select('kanban_status, created_at, updated_at, error_message, analysis_data');

    if (studiesError) {
      throw new Error(`Falha ao buscar estudos: ${studiesError.message}`);
    }

    // Contar importações
    const { count: importCount, error: importError } = await supabase
      .from('scispace_imports')
      .select('*', { count: 'exact', head: true });

    if (importError) {
      throw new Error(`Falha ao contar importações: ${importError.message}`);
    }

    const totalStudies = allStudies?.length || 0;
    const newStudies = allStudies?.filter(s => s.kanban_status === 'new').length || 0;
    const processedStudies = allStudies?.filter(s => s.kanban_status === 'processed' && s.analysis_data).length || 0;
    const erroredStudies = allStudies?.filter(s => s.error_message).length || 0;
    
    const processingRate = totalStudies > 0 ? (processedStudies / totalStudies) * 100 : 0;
    
    // Calcular tempo médio de processamento
    let avgTime = 'N/A';
    const processedWithTime = allStudies?.filter(s => 
      s.kanban_status === 'processed' && s.created_at && s.updated_at
    ) || [];
    
    if (processedWithTime.length > 0) {
      const totalMs = processedWithTime.reduce((sum, study) => {
        const created = new Date(study.created_at!).getTime();
        const updated = new Date(study.updated_at!).getTime();
        return sum + (updated - created);
      }, 0);
      
      const avgMs = totalMs / processedWithTime.length;
      const avgMinutes = Math.round(avgMs / 60000);
      avgTime = `${avgMinutes} min`;
    }

    const hasWarnings = (importCount || 0) > 10 || erroredStudies > 5;

    return {
      totalStudies,
      newStudies,
      processedStudies,
      erroredStudies,
      processingRate: Math.round(processingRate),
      avgProcessingTime: avgTime,
      accumulatedImports: importCount || 0,
      hasWarnings
    };
  }

  /**
   * Remove estudos duplicados baseado em título
   * @returns Promise<number> - Quantidade de duplicatas removidas
   */
  static async removeDuplicateStudies(): Promise<number> {
    const { data: allStudies, error: selectError } = await supabase
      .from('processed_studies')
      .select('id, title, created_at')
      .order('created_at', { ascending: true });

    if (selectError) {
      throw new Error(`Falha ao buscar estudos: ${selectError.message}`);
    }

    if (!allStudies || allStudies.length === 0) {
      return 0;
    }

    const titleMap = new Map<string, string>(); // title -> oldest id
    const duplicateIds: string[] = [];

    allStudies.forEach(study => {
      const normalizedTitle = study.title?.toLowerCase().trim();
      if (!normalizedTitle) return;

      if (titleMap.has(normalizedTitle)) {
        duplicateIds.push(study.id);
      } else {
        titleMap.set(normalizedTitle, study.id);
      }
    });

    if (duplicateIds.length === 0) {
      return 0;
    }

    const { error: deleteError } = await supabase
      .from('processed_studies')
      .delete()
      .in('id', duplicateIds);

    if (deleteError) {
      throw new Error(`Falha ao remover duplicatas: ${deleteError.message}`);
    }

    return duplicateIds.length;
  }

  /**
   * Busca estudos com problemas (erro ou analysis_data NULL)
   * @returns Promise<Array> - Lista de estudos problemáticos
   */
  static async getProblematicStudies() {
    const { data, error } = await supabase
      .from('processed_studies')
      .select('id, title, error_message, analysis_data, kanban_status, created_at')
      .or('error_message.not.is.null,and(kanban_status.eq.new,analysis_data.is.null)')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Falha ao buscar estudos problemáticos: ${error.message}`);
    }

    return data || [];
  }
}

export default StudyResetService;
