
import { Nutraceutical } from "@/types";

/**
 * Mapeia os dados dos nutracêuticos do formato do banco para o formato utilizado na UI
 */
export const mapDbToUiFormat = (dbItems: any[]): Nutraceutical[] => {
  console.log('🔍 [MAPPER] Total de itens recebidos:', dbItems?.length);
  
  if (!dbItems || dbItems.length === 0) {
    console.log('🔍 [MAPPER] Nenhum item para processar');
    return [];
  }
  
  console.log('🔍 [MAPPER] Primeiro item completo:', JSON.stringify(dbItems[0], null, 2));
  
  // Verificar se já processamos algum item para evitar duplicações
  const processedIds = new Set<string>();
  
  return dbItems.filter(item => {
    // Filtrar itens duplicados baseado no ID
    if (!item || !item.id || processedIds.has(item.id)) {
      return false;
    }
    processedIds.add(item.id);
    return true;
  }).map(item => {
    try {
      console.log(`🔍 [MAPPER] Processando ${item.name}:`, {
        nutraceutical_conditions: item.nutraceutical_conditions,
        total_conditions: item.nutraceutical_conditions?.length || 0
      });
      
      // Extrair condições de saúde associadas (outcomes)
      const healthConditions = Array.isArray(item.nutraceutical_conditions) ? 
        item.nutraceutical_conditions
          .filter((nch: any) => {
            console.log(`🔍 [MAPPER] Condição raw:`, nch);
            return nch && nch.condition;
          })
          .map((nch: any) => {
            // Garantir que o tipo de relacionamento esteja normalizado
            let relationshipType = nch.relationship_type || 'support';
            
            console.log(`🔍 [MAPPER] Tipo original: ${relationshipType}`);
            
            // Normalizar o tipo de relacionamento (garantindo consistência)
            relationshipType = relationshipType.toLowerCase();
            if (relationshipType.includes('prev')) {
              relationshipType = 'prevention';
            } else if (relationshipType.includes('trat') || relationshipType.includes('treat')) {
              relationshipType = 'treatment';
            } else {
              relationshipType = 'support';
            }
            
            console.log(`🔍 [MAPPER] Tipo normalizado: ${relationshipType}`);
            
            const mappedCondition = {
              id: nch.condition.id,
              name: nch.condition.name,
              description: nch.condition.description,
              efficacyScore: Number(nch.efficacy_score) || 0,
              relationshipType: relationshipType
            };
            
            console.log(`🔍 [MAPPER] Condição mapeada:`, mappedCondition);
            return mappedCondition;
          }) : [];
          
      console.log(`🔍 [MAPPER] Total de condições processadas para ${item.name}:`, healthConditions.length);
      
      // Separar as condições pelo tipo de relacionamento
      const preventionConditions = healthConditions.filter(
        (c: any) => c.relationshipType === 'prevention'
      );
      
      const treatmentConditions = healthConditions.filter(
        (c: any) => c.relationshipType === 'treatment'
      );
      
      const supportConditions = healthConditions.filter(
        (c: any) => c.relationshipType === 'support'
      );
      
      console.log(`🔍 [MAPPER] ${item.name} - Distribuição de condições:`, {
        prevention: preventionConditions.length,
        treatment: treatmentConditions.length,
        support: supportConditions.length
      });
        
      // Extrair estudos científicos associados
      const studies = Array.isArray(item.nutraceutical_studies) ?
        item.nutraceutical_studies
          .filter((ns: any) => ns && ns.study)
          .map((ns: any) => ({
            id: ns.study.id,
            title: ns.study.title,
            authors: ns.study.authors,
            year: ns.study.year,
            journal: ns.study.journal,
            relevanceScore: ns.relevance_score || 0
          })) : [];
          
      // Dados científicos
      const scientificData = item.scientific_metadata || 
        (item.nutraceutical_scientific_metadata && 
        item.nutraceutical_scientific_metadata.length > 0 ? 
        item.nutraceutical_scientific_metadata[0] : 
        { efficacy_score: 0, sustainability_score: 0 });
      
      // Benefícios
      const benefits = Array.isArray(item.nutraceutical_benefits) ?
        item.nutraceutical_benefits
          .filter((b: any) => b && b.benefit)
          .map((b: any) => b.benefit) : [];

      // Adicionar contadores explícitos para outcomes e estudos
      const outcomeCount = healthConditions.length;
      const studyCount = studies.length;
      
      const finalResult = {
        id: item.id,
        name: item.name || 'Sem nome',
        description: item.description || '',
        chemicalCompound: item.chemical_compound || '',
        source: item.source || '',
        dosage: item.dosage || '',
        category: item.outcome?.name || 'Sem categoria',
        scientificEvidence: {
          efficacyScore: scientificData ? (scientificData.efficacy_score || 0) : 0,
          sustainabilityScore: scientificData ? (scientificData.sustainability_score || 0) : 0,
          studies: studies.length,
        },
        condition: item.outcome?.name || 'Geral',
        contraindications: item.contraindications || [],
        benefits: benefits,
        healthConditions: healthConditions,
        studies: studies,
        preventionConditions: preventionConditions,
        treatmentConditions: treatmentConditions,
        supportConditions: supportConditions,
        activeIngredients: [],
        outcomeCount: outcomeCount,
        studyCount: studyCount,
        outcome: item.outcome || null
      };
      
      console.log(`✅ [MAPPER] ${item.name} mapeado com sucesso:`, {
        totalConditions: finalResult.healthConditions.length,
        prevention: finalResult.preventionConditions.length,
        treatment: finalResult.treatmentConditions.length,
        support: finalResult.supportConditions.length
      });
      
      return finalResult;
    } catch (error) {
      console.error(`❌ [MAPPER] Erro ao processar o nutracêutico ${item?.name || 'desconhecido'}:`, error);
      // Retorna um objeto válido com informações básicas para evitar quebrar a interface
      return {
        id: item?.id || `error-${Date.now()}`,
        name: item?.name || 'Erro de processamento',
        description: 'Houve um erro ao processar este nutracêutico',
        chemicalCompound: '',
        source: '',
        dosage: '',
        category: 'Erro',
        scientificEvidence: {
          efficacyScore: 0,
          sustainabilityScore: 0,
          studies: 0,
        },
        condition: 'Erro',
        contraindications: [],
        benefits: [],
        healthConditions: [],
        studies: [],
        preventionConditions: [],
        treatmentConditions: [],
        supportConditions: [],
        activeIngredients: [],
        outcomeCount: 0,
        studyCount: 0,
        outcome: null
      };
    }
  });
};
