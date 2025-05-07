
import { Nutraceutical } from "@/types";

/**
 * Mapeia os dados dos nutracêuticos do formato do banco para o formato utilizado na UI
 */
export const mapDbToUiFormat = (dbItems: any[]): Nutraceutical[] => {
  // Verificar se já processamos algum item para evitar duplicações
  const processedIds = new Set<string>();
  
  return dbItems.filter(item => {
    // Filtrar itens duplicados baseado no ID
    if (processedIds.has(item.id)) {
      return false;
    }
    processedIds.add(item.id);
    return true;
  }).map(item => {
    // Extrair condições de saúde associadas (outcomes)
    const healthConditions = (item.nutraceutical_conditions || [])
      .filter((nch: any) => nch.condition)
      .map((nch: any) => {
        // Garantir que o tipo de relacionamento esteja normalizado
        let relationshipType = nch.relationship_type || 'support';
        
        // Normalizar o tipo de relacionamento (garantindo consistência)
        relationshipType = relationshipType.toLowerCase();
        if (relationshipType.includes('prev')) {
          relationshipType = 'prevention';
        } else if (relationshipType.includes('trat')) {
          relationshipType = 'treatment';
        } else {
          relationshipType = 'support';
        }
        
        return {
          id: nch.condition.id,
          name: nch.condition.name,
          description: nch.condition.description,
          efficacyScore: nch.efficacy_score || 0,
          relationshipType: relationshipType
        };
      });
      
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
      
    // Extrair estudos científicos associados
    const studies = (item.nutraceutical_studies || [])
      .filter((ns: any) => ns.study)
      .map((ns: any) => ({
        id: ns.study.id,
        title: ns.study.title,
        authors: ns.study.authors,
        year: ns.study.year,
        journal: ns.study.journal,
        relevanceScore: ns.relevance_score || 0
      }));
      
    // Dados científicos
    const scientificData = item.scientific_metadata || 
      item.nutraceutical_scientific_metadata && 
      item.nutraceutical_scientific_metadata.length > 0 ? 
      item.nutraceutical_scientific_metadata[0] : 
      { efficacy_score: 0, sustainability_score: 0 };
    
    // Benefícios
    const benefits = (item.nutraceutical_benefits || [])
      .map((b: any) => b.benefit);

    // Adicionar contadores explícitos para outcomes e estudos
    const outcomeCount = healthConditions.length;
    const studyCount = studies.length;
      
    return {
      id: item.id,
      name: item.name,
      description: item.description || '',
      chemicalCompound: item.chemical_compound || '',
      source: item.source || '',
      dosage: item.dosage || '',
      category: item.outcome?.name || 'Sem categoria',
      scientificEvidence: {
        efficacyScore: scientificData.efficacy_score || 0,
        sustainabilityScore: scientificData.sustainability_score || 0,
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
  });
};
