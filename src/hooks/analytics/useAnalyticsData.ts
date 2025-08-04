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
    if (!nutraceuticals.length) return {
      totalNutraceuticals: 0,
      averageEfficacy: 0,
      totalConditions: 0,
      totalStudies: 0,
      treatabilityIndex: 0,
      sustainabilityIndex: 0,
      prescriptionCoverage: 0,
      therapeuticGaps: 0
    };

    const totalNutraceuticals = nutraceuticals.length;
    const totalConditions = conditions.length;
    const totalStudies = studies.length;

    // Calcular eficácia média
    const efficacyScores = nutraceuticals.flatMap(n => 
      n.nutraceutical_scientific_metadata?.map(m => m.efficacy_score) || []
    ).filter(Boolean);
    const averageEfficacy = efficacyScores.length > 0 
      ? efficacyScores.reduce((a, b) => a + b, 0) / efficacyScores.length 
      : 0;

    // Calcular índice de tratabilidade
    const conditionsWithTreatment = conditions.filter(condition => 
      nutraceuticals.some(n => 
        n.nutraceutical_health_conditions?.some(hc => 
          hc.condition?.id === condition.id
        )
      )
    ).length;
    const treatabilityIndex = totalConditions > 0 ? (conditionsWithTreatment / totalConditions) * 100 : 0;

    // Calcular índice de sustentabilidade
    const sustainabilityScores = nutraceuticals.flatMap(n => 
      n.nutraceutical_scientific_metadata?.map(m => m.sustainability_score) || []
    ).filter(Boolean);
    const sustainabilityIndex = sustainabilityScores.length > 0 
      ? sustainabilityScores.reduce((a, b) => a + b, 0) / sustainabilityScores.length 
      : 0;

    // Calcular cobertura de prescrição
    const prescriptionCoverage = totalNutraceuticals > 0 ? 
      (nutraceuticals.filter(n => n.nutraceutical_health_conditions?.length > 0).length / totalNutraceuticals) * 100 : 0;

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
    if (!nutraceuticals.length || !conditions.length) return [];

    return conditions.map(condition => {
      const relations = nutraceuticals.flatMap(n => 
        n.nutraceutical_health_conditions?.filter(hc => hc.condition?.id === condition.id) || []
      );

      const prevention = relations.filter(r => r.relationship_type === 'prevention').length;
      const treatment = relations.filter(r => r.relationship_type === 'treatment').length;
      const support = relations.filter(r => r.relationship_type === 'support').length;
      const total = prevention + treatment + support;
      const coverage = total > 0 ? (total / nutraceuticals.length) * 100 : 0;

      return {
        condition: condition.name,
        prevention,
        treatment,
        support,
        coverage
      };
    }).sort((a, b) => b.coverage - a.coverage);
  }, [nutraceuticals, conditions]);

  const prescriptionIntelligence = useMemo((): PrescriptionIntelligence[] => {
    if (!nutraceuticals.length) return [];

    return nutraceuticals.map(nutraceutical => {
      const efficacy = nutraceutical.nutraceutical_scientific_metadata?.[0]?.efficacy_score || 0;
      const sustainability = nutraceutical.nutraceutical_scientific_metadata?.[0]?.sustainability_score || 0;
      const conditionsCount = nutraceutical.nutraceutical_health_conditions?.length || 0;
      const studiesCount = nutraceutical.nutraceutical_studies?.length || 0;

      return {
        nutraceutical: nutraceutical.name,
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