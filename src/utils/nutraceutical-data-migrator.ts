
import { nutraceuticals } from "@/data";
import { NutraceuticalsService } from "@/services/nutraceuticals-service";
import { NutraceuticalCategoriesService } from "@/services/nutraceutical-categories-service";
import { HealthConditionsService } from "@/services/health-conditions-service";
import { ActiveIngredientsService } from "@/services/active-ingredients-service";
import { ScientificStudiesService } from "@/services/scientific-studies-service";

/**
 * Utilitário para migrar dados dos arquivos .ts para o Supabase
 */
export const NutraceuticalDataMigrator = {
  /**
   * Migra todos os nutracêuticos para o Supabase
   */
  async migrateAll() {
    try {
      // 1. Primeiro criamos as categorias únicas
      const categories = new Map();
      nutraceuticals.forEach(n => {
        if (n.condition) {
          categories.set(n.condition, { name: n.condition });
        }
      });
      
      const categoryMap = new Map(); // Mapear nomes de categorias para IDs
      for (const [name, data] of categories.entries()) {
        try {
          const category = await NutraceuticalCategoriesService.createCategory({
            name,
            description: `Categoria para nutracêuticos relacionados a ${name}`
          });
          categoryMap.set(name, category.id);
        } catch (err) {
          console.warn(`Categoria ${name} já pode existir, tentando buscar existente...`);
          // Buscar as categorias existentes e adicionar ao mapa
          const existingCategories = await NutraceuticalCategoriesService.getAllCategories();
          const found = existingCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
          if (found) {
            categoryMap.set(name, found.id);
          }
        }
      }
      console.log(`${categoryMap.size} categorias processadas`);
      
      // 2. Criar condições de saúde únicas
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
      
      // 3. Para cada nutracêutico, criar registro e suas relações
      for (const nutra of nutraceuticals) {
        try {
          // Criar nutracêutico base
          const categoryId = categoryMap.get(nutra.condition);
          const newNutraceutical = await NutraceuticalsService.createNutraceutical({
            name: nutra.name,
            description: nutra.description,
            dosage: nutra.dosage,
            source: nutra.source,
            chemical_compound: nutra.chemicalCompound,
            category_id: categoryId,
            contraindications: nutra.contraindications || []
          });
          console.log(`Criado nutracêutico: ${nutra.name}`);
          
          // Adicionar benefícios
          if (nutra.benefits) {
            for (const benefit of nutra.benefits) {
              await NutraceuticalsService.addBenefit(newNutraceutical.id, benefit);
            }
            console.log(`Adicionados ${nutra.benefits.length} benefícios para ${nutra.name}`);
          }
          
          // Adicionar metadados científicos
          if (nutra.scientificEvidence) {
            await NutraceuticalsService.updateScientificMetadata(
              newNutraceutical.id,
              {
                efficacy_score: nutra.scientificEvidence.efficacyScore || 0,
                sustainability_score: nutra.scientificEvidence.sustainabilityScore || 0
              }
            );
            console.log(`Adicionados metadados científicos para ${nutra.name}`);
          }
          
          // Adicionar relações de condições (prevenção)
          if (nutra.preventionConditions) {
            for (const prevention of nutra.preventionConditions) {
              const conditionId = conditionMap.get(prevention.name);
              if (conditionId) {
                await NutraceuticalsService.relateToCondition(
                  newNutraceutical.id,
                  conditionId,
                  'prevention',
                  prevention.efficacyScore || 0
                );
              }
            }
            console.log(`Adicionadas ${nutra.preventionConditions.length} condições de prevenção para ${nutra.name}`);
          }
          
          // Adicionar relações de condições (tratamento)
          if (nutra.treatmentConditions) {
            for (const treatment of nutra.treatmentConditions) {
              const conditionId = conditionMap.get(treatment.name);
              if (conditionId) {
                await NutraceuticalsService.relateToCondition(
                  newNutraceutical.id,
                  conditionId,
                  'treatment',
                  treatment.efficacyScore || 0
                );
              }
            }
            console.log(`Adicionadas ${nutra.treatmentConditions.length} condições de tratamento para ${nutra.name}`);
          }
          
          // Adicionar relações de condições (suporte)
          if (nutra.supportConditions) {
            for (const supportive of nutra.supportConditions) {
              const conditionId = conditionMap.get(supportive.name);
              if (conditionId) {
                await NutraceuticalsService.relateToCondition(
                  newNutraceutical.id,
                  conditionId,
                  'support',
                  supportive.efficacyScore || 0
                );
              }
            }
            console.log(`Adicionadas ${nutra.supportConditions.length} condições de suporte para ${nutra.name}`);
          }
          
        } catch (err) {
          console.error(`Erro ao processar nutracêutico ${nutra.name}:`, err);
        }
      }
      
      return {
        success: true,
        message: `Migração concluída. Processados ${nutraceuticals.length} nutracêuticos, ${categoryMap.size} categorias e ${conditionMap.size} condições de saúde.`
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
