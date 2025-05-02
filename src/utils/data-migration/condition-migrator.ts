
import { HealthConditionsService } from "@/services/health-conditions-service";

/**
 * Utilidade para migrar condições de saúde
 */
export const ConditionMigrator = {
  /**
   * Cria condições de saúde únicas a partir dos nutracêuticos
   * @param nutraceuticals Array de nutracêuticos com condições
   * @returns Mapa com nomes das condições para IDs
   */
  async migrateConditions(nutraceuticals: any[]) {
    console.log("Iniciando migração de condições de saúde...");
    
    // Extrair condições únicas de todos os tipos (prevenção, tratamento e suporte)
    const conditions = new Map();
    nutraceuticals.forEach(n => {
      // Condições de prevenção
      if (n.preventionConditions) {
        n.preventionConditions.forEach(p => {
          if (!conditions.has(p.name)) {
            conditions.set(p.name, { 
              name: p.name, 
              description: `Condição de saúde: ${p.name}` 
            });
          }
        });
      }
      
      // Condições de tratamento
      if (n.treatmentConditions) {
        n.treatmentConditions.forEach(t => {
          if (!conditions.has(t.name)) {
            conditions.set(t.name, { 
              name: t.name, 
              description: `Condição de saúde: ${t.name}` 
            });
          }
        });
      }
      
      // Condições de suporte
      if (n.supportConditions) {
        n.supportConditions.forEach(s => {
          if (!conditions.has(s.name)) {
            conditions.set(s.name, { 
              name: s.name, 
              description: `Condição de saúde: ${s.name}` 
            });
          }
        });
      }
    });
    
    // Criar condições no banco de dados
    const conditionMap = new Map(); // Mapear nomes de condições para IDs
    for (const [name, data] of conditions.entries()) {
      try {
        const condition = await HealthConditionsService.createCondition(data);
        conditionMap.set(name, condition.id);
      } catch (err) {
        console.warn(`Condição ${name} já pode existir, tentando buscar existente...`);
        // Buscar as condições existentes e adicionar ao mapa
        const existingConditions = await HealthConditionsService.getAllConditions();
        const found = existingConditions.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (found) {
          conditionMap.set(name, found.id);
        }
      }
    }
    
    console.log(`${conditionMap.size} condições de saúde processadas`);
    return conditionMap;
  }
};
