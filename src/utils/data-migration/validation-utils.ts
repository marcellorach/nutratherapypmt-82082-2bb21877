
import { NutraceuticalsService } from "@/services/nutraceuticals";

/**
 * Utilidades para validação na migração de dados
 */
export const ValidationUtils = {
  /**
   * Verifica se já existem dados no banco antes de iniciar a migração
   * @returns Informações sobre os dados existentes
   */
  async checkExistingData() {
    try {
      const existingData = await NutraceuticalsService.getAllNutraceuticals();
      
      if (existingData && existingData.length > 0) {
        return {
          hasExistingData: true,
          count: existingData.length,
          message: `A migração já foi realizada anteriormente. ${existingData.length} nutracêuticos já existem no banco de dados.`
        };
      }
      
      return { hasExistingData: false, count: 0, message: "Nenhum dado existente encontrado." };
    } catch (error) {
      console.error("Erro ao verificar dados existentes:", error);
      throw error;
    }
  }
};
