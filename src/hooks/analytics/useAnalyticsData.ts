import { useMemo } from 'react';
import { useNutraceuticalContext } from '@/contexts/NutraceuticalContext';

interface AnalyticsMetrics {
  totalNutraceuticals: number;
  averageEfficacy: number;
  totalConditions: number;
  totalStudies: number;
  treatabilityIndex: number;
  sustainabilityIndex: number;
  prescriptionCoverage: number;
  therapeuticGaps: number;
}

interface TreatabilityData {
  condition: string;
  prevention: number;
  treatment: number;
  support: number;
  coverage: number;
}

interface PrescriptionIntelligence {
  nutraceutical: string;
  efficacy: number;
  sustainability: number;
  conditionsCount: number;
  studiesCount: number;
}

export const useAnalyticsData = () => {
  const { nutraceuticals, conditions, studies, isLoading } = useNutraceuticalContext();

  const metrics = useMemo((): AnalyticsMetrics => {
    // Verificar se os dados existem e são arrays válidos
    const validNutraceuticals = Array.isArray(nutraceuticals) ? nutraceuticals : [];
    const validConditions = Array.isArray(conditions) ? conditions : [];
    const validStudies = Array.isArray(studies) ? studies : [];

    // Se não há dados reais, usar dados simulados para demo
    if (validNutraceuticals.length === 0) {
      return {
        totalNutraceuticals: 24,
        averageEfficacy: 3.8,
        totalConditions: 18,
        totalStudies: 45,
        treatabilityIndex: 72.5,
        sustainabilityIndex: 4.1,
        prescriptionCoverage: 68.3,
        therapeuticGaps: 5
      };
    }

    const totalNutraceuticals = validNutraceuticals.length;
    const totalConditions = validConditions.length;
    const totalStudies = validStudies.length;

    // Calcular eficácia média com verificações de segurança
    const efficacyScores = validNutraceuticals.flatMap(n => 
      (n.nutraceutical_scientific_metadata || []).map(m => m?.efficacy_score).filter(score => typeof score === 'number')
    );
    const averageEfficacy = efficacyScores.length > 0 
      ? efficacyScores.reduce((a, b) => a + b, 0) / efficacyScores.length 
      : 3.5; // Valor padrão simulado

    // Calcular índice de tratabilidade com verificações de segurança
    const conditionsWithTreatment = validConditions.filter(condition => 
      validNutraceuticals.some(n => 
        (n.nutraceutical_health_conditions || []).some(hc => 
          hc.condition?.id === condition.id
        )
      )
    ).length;
    const treatabilityIndex = totalConditions > 0 ? (conditionsWithTreatment / totalConditions) * 100 : 65.0;

    // Calcular índice de sustentabilidade com verificações de segurança
    const sustainabilityScores = validNutraceuticals.flatMap(n => 
      (n.nutraceutical_scientific_metadata || []).map(m => m?.sustainability_score).filter(score => typeof score === 'number')
    );
    const sustainabilityIndex = sustainabilityScores.length > 0 
      ? sustainabilityScores.reduce((a, b) => a + b, 0) / sustainabilityScores.length 
      : 4.1; // Valor padrão simulado

    // Calcular cobertura de prescrição com verificações de segurança
    const prescriptionCoverage = totalNutraceuticals > 0 ? 
      (validNutraceuticals.filter(n => (n.nutraceutical_health_conditions || []).length > 0).length / totalNutraceuticals) * 100 : 0;

    // Calcular gaps terapêuticos
    const therapeuticGaps = totalConditions - conditionsWithTreatment;

    return {
      totalNutraceuticals,
      averageEfficacy,
      totalConditions,
      totalStudies,
      treatabilityIndex,
      sustainabilityIndex,
      prescriptionCoverage,
      therapeuticGaps
    };
  }, [nutraceuticals, conditions, studies]);

  const treatabilityData = useMemo((): TreatabilityData[] => {
    const validNutraceuticals = Array.isArray(nutraceuticals) ? nutraceuticals : [];
    const validConditions = Array.isArray(conditions) ? conditions : [];
    
    // Se não há dados reais, usar dados simulados
    if (validNutraceuticals.length === 0 || validConditions.length === 0) {
      return [
        { condition: "Artrite", prevention: 8, treatment: 12, support: 5, coverage: 85.2 },
        { condition: "Inflamação", prevention: 6, treatment: 10, support: 4, coverage: 78.3 },
        { condition: "Estresse Oxidativo", prevention: 7, treatment: 8, support: 6, coverage: 72.1 },
        { condition: "Digestão", prevention: 5, treatment: 7, support: 8, coverage: 68.5 },
        { condition: "Imunidade", prevention: 9, treatment: 6, support: 3, coverage: 65.7 },
        { condition: "Cardiopatia", prevention: 4, treatment: 9, support: 2, coverage: 58.9 },
        { condition: "Neuroproteção", prevention: 3, treatment: 5, support: 4, coverage: 45.2 },
        { condition: "Dermatite", prevention: 2, treatment: 4, support: 3, coverage: 38.7 }
      ];
    }

    return validConditions.map(condition => {
      const relations = validNutraceuticals.flatMap(n => 
        (n.nutraceutical_health_conditions || []).filter(hc => hc.condition?.id === condition.id)
      );

      const prevention = relations.filter(r => r.relationship_type === 'prevention').length;
      const treatment = relations.filter(r => r.relationship_type === 'treatment').length;
      const support = relations.filter(r => r.relationship_type === 'support').length;
      const total = prevention + treatment + support;
      const coverage = total > 0 && validNutraceuticals.length > 0 ? (total / validNutraceuticals.length) * 100 : 0;

      return {
        condition: condition.name || 'Sem nome',
        prevention,
        treatment,
        support,
        coverage
      };
    }).sort((a, b) => b.coverage - a.coverage);
  }, [nutraceuticals, conditions]);

  const prescriptionIntelligence = useMemo((): PrescriptionIntelligence[] => {
    const validNutraceuticals = Array.isArray(nutraceuticals) ? nutraceuticals : [];
    
    // Se não há dados reais, usar dados simulados
    if (validNutraceuticals.length === 0) {
      return [
        { nutraceutical: "Curcumina", efficacy: 4.5, sustainability: 4.2, conditionsCount: 8, studiesCount: 12 },
        { nutraceutical: "Ômega-3", efficacy: 4.3, sustainability: 3.8, conditionsCount: 6, studiesCount: 15 },
        { nutraceutical: "Resveratrol", efficacy: 4.1, sustainability: 4.0, conditionsCount: 5, studiesCount: 9 },
        { nutraceutical: "Probióticos", efficacy: 3.9, sustainability: 4.5, conditionsCount: 7, studiesCount: 8 },
        { nutraceutical: "Glucosamina", efficacy: 3.8, sustainability: 3.5, conditionsCount: 4, studiesCount: 6 },
        { nutraceutical: "Coenzima Q10", efficacy: 3.7, sustainability: 3.9, conditionsCount: 3, studiesCount: 7 }
      ];
    }

    return validNutraceuticals.map(nutraceutical => {
      const metadata = (nutraceutical.nutraceutical_scientific_metadata || [])[0];
      const efficacy = metadata?.efficacy_score || 0;
      const sustainability = metadata?.sustainability_score || 0;
      const conditionsCount = (nutraceutical.nutraceutical_health_conditions || []).length;
      const studiesCount = (nutraceutical.nutraceutical_studies || []).length;

      return {
        nutraceutical: nutraceutical.name || 'Sem nome',
        efficacy,
        sustainability,
        conditionsCount,
        studiesCount
      };
    }).sort((a, b) => b.efficacy - a.efficacy);
  }, [nutraceuticals]);

  return {
    metrics,
    treatabilityData,
    prescriptionIntelligence,
    isLoading
  };
};