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

    if (validNutraceuticals.length === 0) return {
      totalNutraceuticals: 0,
      averageEfficacy: 0,
      totalConditions: 0,
      totalStudies: 0,
      treatabilityIndex: 0,
      sustainabilityIndex: 0,
      prescriptionCoverage: 0,
      therapeuticGaps: 0
    };

    const totalNutraceuticals = validNutraceuticals.length;
    const totalConditions = validConditions.length;
    const totalStudies = validStudies.length;

    // Calcular eficácia média com verificações de segurança
    const efficacyScores = validNutraceuticals.flatMap(n => 
      (n.nutraceutical_scientific_metadata || []).map(m => m?.efficacy_score).filter(score => typeof score === 'number')
    );
    const averageEfficacy = efficacyScores.length > 0 
      ? efficacyScores.reduce((a, b) => a + b, 0) / efficacyScores.length 
      : 0;

    // Calcular índice de tratabilidade com verificações de segurança
    const conditionsWithTreatment = validConditions.filter(condition => 
      validNutraceuticals.some(n => 
        (n.nutraceutical_health_conditions || []).some(hc => 
          hc.condition?.id === condition.id
        )
      )
    ).length;
    const treatabilityIndex = totalConditions > 0 ? (conditionsWithTreatment / totalConditions) * 100 : 0;

    // Calcular índice de sustentabilidade com verificações de segurança
    const sustainabilityScores = validNutraceuticals.flatMap(n => 
      (n.nutraceutical_scientific_metadata || []).map(m => m?.sustainability_score).filter(score => typeof score === 'number')
    );
    const sustainabilityIndex = sustainabilityScores.length > 0 
      ? sustainabilityScores.reduce((a, b) => a + b, 0) / sustainabilityScores.length 
      : 0;

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
    
    if (validNutraceuticals.length === 0 || validConditions.length === 0) return [];

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
    if (validNutraceuticals.length === 0) return [];

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