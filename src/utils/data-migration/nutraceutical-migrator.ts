
import { NutraceuticalsService } from "@/services/nutraceuticals-service";

/**
 * Utilidade para migrar nutracêuticos
 */
export const NutraceuticalMigrator = {
  /**
   * Cria nutracêuticos e suas relações no banco de dados
   * @param nutraceuticals Array de nutracêuticos a serem migrados
   * @param categoryMap Mapa de categorias (nome -> ID)
   * @param conditionMap Mapa de condições (nome -> ID)
   * @returns Estatísticas sobre a migração
   */
  async migrateNutraceuticals(nutraceuticals: any[], categoryMap: Map<string, string>, conditionMap: Map<string, string>) {
    console.log("Iniciando migração de nutracêuticos...");
    let nutraceuticosProcessados = 0;
    
    // Manter um registro dos nutracêuticos já criados para evitar duplicações
    const nutraceuticalCreated = new Map();
    
    for (const nutra of nutraceuticals) {
      try {
        // Verificar se o nutracêutico já foi criado
        if (nutraceuticalCreated.has(nutra.name)) {
          console.log(`Nutracêutico ${nutra.name} já foi processado, pulando...`);
          continue;
        }
        
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
        
        // Registrar que este nutracêutico foi criado
        nutraceuticalCreated.set(nutra.name, newNutraceutical.id);
        
        console.log(`Criado nutracêutico: ${nutra.name} (ID: ${newNutraceutical.id})`);
        nutraceuticosProcessados++;
        
        // Adicionar metadados e relacionamentos
        await this.addNutraceuticalDetails(newNutraceutical.id, nutra, conditionMap);
      } catch (err) {
        console.error(`Erro ao processar nutracêutico ${nutra.name}:`, err);
      }
    }
    
    return {
      nutraceuticosProcessados,
      categoriesCount: categoryMap.size,
      conditionsCount: conditionMap.size
    };
  },
  
  /**
   * Adiciona detalhes e relacionamentos ao nutracêutico
   * @param nutraId ID do nutracêutico
   * @param nutraData Dados do nutracêutico
   * @param conditionMap Mapa de condições (nome -> ID)
   */
  async addNutraceuticalDetails(nutraId: string, nutraData: any, conditionMap: Map<string, string>) {
    // Adicionar benefícios
    if (nutraData.benefits) {
      for (const benefit of nutraData.benefits) {
        await NutraceuticalsService.addBenefit(nutraId, benefit);
      }
      console.log(`Adicionados ${nutraData.benefits.length} benefícios para ${nutraData.name}`);
    }
    
    // Adicionar metadados científicos
    if (nutraData.scientificEvidence) {
      await NutraceuticalsService.updateScientificMetadata(
        nutraId,
        {
          efficacy_score: nutraData.scientificEvidence.efficacyScore || 0,
          sustainability_score: nutraData.scientificEvidence.sustainabilityScore || 0
        }
      );
      console.log(`Adicionados metadados científicos para ${nutraData.name}`);
    }
    
    // Adicionar relações de condições (prevenção)
    await this.processRelationships(
      nutraId,
      nutraData.name,
      nutraData.preventionConditions,
      conditionMap,
      'prevention'
    );
    
    // Adicionar relações de condições (tratamento)
    await this.processRelationships(
      nutraId,
      nutraData.name,
      nutraData.treatmentConditions,
      conditionMap,
      'treatment'
    );
    
    // Adicionar relações de condições (suporte)
    await this.processRelationships(
      nutraId,
      nutraData.name,
      nutraData.supportConditions,
      conditionMap,
      'support'
    );
  },
  
  /**
   * Processa relacionamentos entre nutracêuticos e condições
   * @param nutraId ID do nutracêutico
   * @param nutraName Nome do nutracêutico (para log)
   * @param conditions Array de condições
   * @param conditionMap Mapa de condições (nome -> ID)
   * @param relationshipType Tipo de relacionamento
   */
  async processRelationships(
    nutraId: string,
    nutraName: string,
    conditions: any[] | undefined,
    conditionMap: Map<string, string>,
    relationshipType: 'prevention' | 'treatment' | 'support'
  ) {
    if (!conditions || conditions.length === 0) return 0;
    
    let processadas = 0;
    for (const condition of conditions) {
      const conditionId = conditionMap.get(condition.name);
      if (conditionId) {
        await NutraceuticalsService.relateToCondition(
          nutraId,
          conditionId,
          relationshipType,
          condition.efficacyScore || 0
        );
        processadas++;
      }
    }
    
    console.log(`Adicionadas ${processadas} condições de ${relationshipType} para ${nutraName}`);
    return processadas;
  }
};
