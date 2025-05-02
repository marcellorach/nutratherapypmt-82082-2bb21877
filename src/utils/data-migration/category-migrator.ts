
import { NutraceuticalCategoriesService } from "@/services/nutraceutical-categories-service";

/**
 * Utilidade para migrar categorias de nutracêuticos
 */
export const CategoryMigrator = {
  /**
   * Cria categorias únicas a partir dos nutracêuticos
   * @param nutraceuticals Array de nutracêuticos com categorias
   * @returns Mapa com nomes das categorias para IDs
   */
  async migrateCategories(nutraceuticals: any[]) {
    console.log("Iniciando migração de categorias...");
    
    // 1. Extrair categorias únicas dos nutracêuticos
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
    return categoryMap;
  }
};
