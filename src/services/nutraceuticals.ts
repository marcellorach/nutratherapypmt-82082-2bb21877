/**
 * Serviço consolidado para nutracêuticos
 * Centraliza todas as operações relacionadas a nutracêuticos
 */

import { supabase } from '@/integrations/supabase/client';
import { mapDbToUiFormat } from '@/utils/nutraceuticals-mapper';
import { 
  NutraceuticalWithRelations, 
  NutraceuticalCore, 
  NutraceuticalQueryOptions,
  NutraceuticalMutationResult,
  RelationshipCreateData,
  DataMigrationOptions
} from '@/types/nutraceuticals';

class NutraceuticalsService {
  private baseQuery() {
    return supabase
      .from('nutraceuticals')
      .select(`
        *,
        nutraceutical_benefits(id, benefit),
        nutraceutical_contraindications(id, contraindication, severity_level, notes),
        nutraceutical_scientific_metadata(*),
        nutraceutical_conditions(
          id, 
          relationship_type,
          efficacy_score,
          notes,
          condition:health_conditions(*)
        ),
        nutraceutical_studies(
          id,
          relevance_score,
          study:scientific_studies(*)
        )
      `);
  }

  private handleError(error: any, operation: string): never {
    console.error(`Erro ao ${operation}:`, error);
    throw new Error(`Não foi possível ${operation}`);
  }

  async getAll(options: NutraceuticalQueryOptions = {}): Promise<NutraceuticalWithRelations[]> {
    try {
      console.log('🔄 [SERVICE] Iniciando busca de nutracêuticos...');
      
      let query = this.baseQuery();

      // Filtro de tipo de dados removido - campo não existe na tabela
      // Se necessário, usar outra estratégia de filtragem

      // Aplicar filtros de busca
      if (options.filters?.searchTerm) {
        query = query.ilike('name', `%${options.filters.searchTerm}%`);
      }

      // Aplicar paginação
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [SERVICE] Erro na query:', error);
        this.handleError(error, 'buscar nutracêuticos');
      }

      console.log('✅ [SERVICE] Dados brutos carregados:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.log('⚠️ [SERVICE] Nenhum dado encontrado');
        return [];
      }

      // Aplicar transformação dos dados usando o mapper
      console.log('🔄 [SERVICE] Aplicando transformação com mapper...');
      const transformedData = mapDbToUiFormat(data);
      
      console.log('✅ [SERVICE] Dados transformados:', transformedData.length, 'nutracêuticos');
      console.log('🔍 [SERVICE] Primeiro nutracêutico transformado:', transformedData[0]);
      
      return transformedData as any;
    } catch (error) {
      console.error('❌ [SERVICE] Exceção durante busca:', error);
      this.handleError(error, 'buscar nutracêuticos');
    }
  }

  async getById(id: string): Promise<NutraceuticalWithRelations | null> {
    try {
      const { data, error } = await this.baseQuery().eq('id', id).single();

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'buscar nutracêutico');
      }

      if (!data) {
        return null;
      }

      // Aplicar transformação dos dados usando o mapper
      const transformedData = mapDbToUiFormat([data]);
      
      return transformedData[0] as any || null;
    } catch (error) {
      this.handleError(error, 'buscar nutracêutico');
    }
  }

  async create(nutraceutical: Omit<NutraceuticalCore, 'id' | 'created_at' | 'updated_at'>): Promise<NutraceuticalMutationResult> {
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .insert([nutraceutical])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Buscar dados completos com relacionamentos
      const fullData = await this.getById(data.id);

      return { 
        success: true, 
        data: fullData || undefined 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  async update(id: string, updates: Partial<NutraceuticalCore>): Promise<NutraceuticalMutationResult> {
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Buscar dados completos com relacionamentos
      const fullData = await this.getById(data.id);

      return { 
        success: true, 
        data: fullData || undefined 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  async delete(id: string): Promise<NutraceuticalMutationResult> {
    try {
      const { error } = await supabase
        .from('nutraceuticals')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  async addConditionRelation(data: RelationshipCreateData): Promise<NutraceuticalMutationResult> {
    try {
      const { error } = await supabase
        .from('nutraceutical_conditions')
        .insert([{
          nutraceutical_id: data.nutraceutical_id,
          condition_id: data.condition_id,
          relationship_type: data.relationship_type || 'prevention',
          efficacy_score: data.efficacy_score || 3,
          notes: data.notes
        }]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  async addStudyRelation(data: RelationshipCreateData): Promise<NutraceuticalMutationResult> {
    try {
      const { error } = await supabase
        .from('nutraceutical_studies')
        .insert([{
          nutraceutical_id: data.nutraceutical_id,
          study_id: data.study_id,
          relevance_score: data.relevance_score || 3
        }]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  async addBenefit(nutraceuticalId: string, benefit: string): Promise<NutraceuticalMutationResult> {
    try {
      const { error } = await supabase
        .from('nutraceutical_benefits')
        .insert([{
          nutraceutical_id: nutraceuticalId,
          benefit
        }]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  async addContraindication(
    nutraceuticalId: string, 
    contraindication: string, 
    severityLevel?: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<NutraceuticalMutationResult> {
    try {
      const { error } = await supabase
        .from('nutraceutical_contraindications')
        .insert([{
          nutraceutical_id: nutraceuticalId,
          contraindication,
          severity_level: severityLevel
        }]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  async cleanSeedData(batchId?: string): Promise<string> {
    try {
      // Limpar dados através de consulta direta à view
      // (não é possível deletar via view, então precisamos consultar e deletar os IDs)
      const { data: viewData, error: viewError } = await (supabase as any)
        .from('clean_seed_data')
        .select('*');

      if (viewError) {
        this.handleError(viewError, 'consultar dados para limpeza');
      }

      return viewData ? 'Dados consultados com sucesso' : 'Sem dados para limpar';
    } catch (error) {
      this.handleError(error, 'limpar dados seed');
    }
  }

  async hasMigratedData(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('nutraceuticals')
        .select('id')
        .or('data_type.eq.seed,data_type.eq.mock')
        .limit(1);

      if (error) {
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      return false;
    }
  }
}

export const nutraceuticalsService = new NutraceuticalsService();
