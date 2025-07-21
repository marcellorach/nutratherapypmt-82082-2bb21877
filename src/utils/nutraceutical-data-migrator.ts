
import { nutraceuticals } from "@/data";
import { toast } from "@/hooks/use-toast";
import { CategoryMigrator } from "./data-migration/category-migrator";
import { ConditionMigrator } from "./data-migration/condition-migrator";
import { NutraceuticalMigrator } from "./data-migration/nutraceutical-migrator";
import { ValidationUtils } from "./data-migration/validation-utils";
import { supabase } from "@/integrations/supabase/client";

/**
 * Utilitário para migrar dados dos arquivos .ts para o Supabase
 */
export const NutraceuticalDataMigrator = {
  /**
   * Migra todos os nutracêuticos para o Supabase como dados de produção
   */
  async migrateAll() {
    try {
      // 1. Verificar se já existem dados no banco
      const existingDataCheck = await ValidationUtils.checkExistingData();
      if (existingDataCheck.hasExistingData) {
        return {
          success: false,
          message: existingDataCheck.message
        };
      }
      
      // 2. Migrar categorias
      const categoryMap = await CategoryMigrator.migrateCategories(nutraceuticals);
      
      // 3. Migrar condições de saúde
      const conditionMap = await ConditionMigrator.migrateConditions(nutraceuticals);
      
      // 4. Migrar nutracêuticos e suas relações
      const migrationStats = await NutraceuticalMigrator.migrateNutraceuticals(
        nutraceuticals, 
        categoryMap, 
        conditionMap
      );
      
      return {
        success: true,
        message: `Migração concluída. Processados ${migrationStats.nutraceuticosProcessados} nutracêuticos, ${migrationStats.categoriesCount} categorias e ${migrationStats.conditionsCount} condições de saúde.`
      };
      
    } catch (error) {
      console.error("Erro durante a migração:", error);
      return {
        success: false,
        message: `Erro na migração: ${error.message}`
      };
    }
  },

  /**
   * Gera dados seed para desenvolvimento com batch_id único
   */
  async generateSeedData(batchId?: string) {
    try {
      const seedBatchId = batchId || `seed_${Date.now()}`;
      
      // Atualizar configuração do batch atual
      await supabase
        .from('data_management_settings')
        .update({ setting_value: seedBatchId })
        .eq('setting_key', 'current_seed_batch');

      // Por enquanto, usar os migradores existentes e depois marcar como seed
      // 1. Migrar categorias
      const categoryMap = await CategoryMigrator.migrateCategories(nutraceuticals);
      
      // 2. Migrar condições de saúde
      const conditionMap = await ConditionMigrator.migrateConditions(nutraceuticals);
      
      // 3. Migrar nutracêuticos e suas relações
      const migrationStats = await NutraceuticalMigrator.migrateNutraceuticals(
        nutraceuticals, 
        categoryMap, 
        conditionMap
      );

      // 4. Marcar os dados recém-inseridos como seed
      await supabase
        .from('nutraceuticals')
        .update({ data_type: 'seed', batch_id: seedBatchId })
        .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Últimos 60 segundos

      await supabase
        .from('health_conditions')
        .update({ data_type: 'seed', batch_id: seedBatchId })
        .gte('created_at', new Date(Date.now() - 60000).toISOString());

      await supabase
        .from('scientific_studies')
        .update({ data_type: 'seed', batch_id: seedBatchId })
        .gte('created_at', new Date(Date.now() - 60000).toISOString());
      
      return {
        success: true,
        batchId: seedBatchId,
        message: `Dados seed gerados. Batch: ${seedBatchId}. Processados ${migrationStats.nutraceuticosProcessados} nutracêuticos, ${migrationStats.categoriesCount} categorias e ${migrationStats.conditionsCount} condições.`
      };
      
    } catch (error) {
      console.error("Erro ao gerar dados seed:", error);
      return {
        success: false,
        message: `Erro na geração de dados seed: ${error.message}`
      };
    }
  }
};
