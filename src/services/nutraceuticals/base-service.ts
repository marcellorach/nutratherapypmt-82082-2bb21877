
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço base com funções comuns para consultas
 */
export const NutraceuticalBaseService = {
  /**
   * Configuração base para consultas de nutracêuticos com todas as suas relações
   */
  getBaseQuery() {
    // Usando type assertion para contornar a verificação de tipos do TypeScript
    const client = supabase as any;
    return client
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
      `);
  },

  /**
   * Lida com erros comuns das operações
   * @param error Erro retornado pelo Supabase
   * @param operationName Nome da operação para mensagem de erro
   */
  handleError(error: any, operationName: string) {
    console.error(`Erro ao ${operationName}:`, error);
    throw new Error(`Não foi possível ${operationName}`);
  }
};
