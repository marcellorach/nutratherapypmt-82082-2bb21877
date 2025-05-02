
import { nutraceuticals } from "@/data";
import { toast } from "@/hooks/use-toast";
import { CategoryMigrator } from "./data-migration/category-migrator";
import { ConditionMigrator } from "./data-migration/condition-migrator";
import { NutraceuticalMigrator } from "./data-migration/nutraceutical-migrator";
import { ValidationUtils } from "./data-migration/validation-utils";

/**
 * Utilitário para migrar dados dos arquivos .ts para o Supabase
 */
export const NutraceuticalDataMigrator = {
  /**
   * Migra todos os nutracêuticos para o Supabase
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
  }
};
