
import { Nutraceutical } from "@/types";

/**
 * Mapeia os dados dos nutracêuticos do formato do banco para o formato utilizado na UI
 */
export const mapDbToUiFormat = (dbItems: any[]): Nutraceutical[] => {
  return dbItems.map(item => {
    // Extrair condições de saúde associadas
    const healthConditions = (item.nutraceutical_health_conditions || [])
      .filter((nch: any) => nch.condition)
      .map((nch: any) => ({
        id: nch.condition.id,
        name: nch.condition.name,
        description: nch.condition.description,
        efficacyScore: nch.efficacy_score,
        relationshipType: nch.relationship_type
      }));
      
    // Separar as condições pelo tipo de relacionamento EXATO especificado no banco de dados
    // Não fazemos mais nenhuma inferência ou modificação do tipo aqui
    const preventionConditions = healthConditions.filter(
      (c: any) => c.relationshipType === 'prevention' || c.relationshipType === 'prevenção' || c.relationshipType === 'prevencao'
    );
    
    const treatmentConditions = healthConditions.filter(
      (c: any) => c.relationshipType === 'treatment' || c.relationshipType === 'tratamento'
    );
    
    const supportConditions = healthConditions.filter(
      (c: any) => c.relationshipType === 'support' || c.relationshipType === 'suporte'
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
        relevanceScore: ns.relevance_score
      }));
      
    // Dados científicos
    const scientificData = item.nutraceutical_scientific_metadata && 
      item.nutraceutical_scientific_metadata.length > 0 ? 
      item.nutraceutical_scientific_metadata[0] : 
      { efficacy_score: 0, sustainability_score: 0 };
    
    // Benefícios
    const benefits = (item.nutraceutical_benefits || [])
      .map((b: any) => b.benefit);
      
    return {
      id: item.id,
      name: item.name,
      description: item.description || '',
      chemicalCompound: item.chemical_compound || '',
      source: item.source || '',
      dosage: item.dosage || '',
      category: item.category_id?.name || 'Sem categoria',
      scientificEvidence: {
        efficacyScore: scientificData.efficacy_score || 0,
        sustainabilityScore: scientificData.sustainability_score || 0,
        studies: studies.length,
      },
      condition: item.category_id?.name || 'Geral',
      contraindications: item.contraindications || [],
      benefits: benefits,
      healthConditions: healthConditions,
      studies: studies,
      preventionConditions: preventionConditions,
      treatmentConditions: treatmentConditions,
      supportConditions: supportConditions,
      activeIngredients: []
    };
  });
};
