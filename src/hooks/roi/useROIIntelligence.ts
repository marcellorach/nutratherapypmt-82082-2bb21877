import { useMemo } from 'react';

// Mock data para quando o contexto não estiver disponível
const mockNutraceuticals = [
  { id: '1', name: 'Glucosamina', nutraceutical_scientific_metadata: [{ efficacy_score: 4.2 }], nutraceutical_health_conditions: [{ relationship_type: 'prevention', efficacy_score: 4.0, condition: { id: '1', name: 'Osteoartrite' } }] },
  { id: '2', name: 'Condroitina', nutraceutical_scientific_metadata: [{ efficacy_score: 3.8 }], nutraceutical_health_conditions: [{ relationship_type: 'treatment', efficacy_score: 3.5, condition: { id: '2', name: 'Artrite' } }] }
];

const mockConditions = [
  { id: '1', name: 'Osteoartrite Canina' },
  { id: '2', name: 'Dermatite Atópica' },
  { id: '3', name: 'Cardiomiopatia' }
];

export interface ROIMetrics {
  totalROI: number;
  averageROI: number;
  preventiveROI: number;
  treatmentROI: number;
  sustainabilityIndex: number;
  marketPenetration: number;
}

export interface MarketOpportunity {
  conditionId: string;
  conditionName: string;
  marketGap: number;
  potentialROI: number;
  recommendedNutraceuticals: string[];
  confidenceScore: number;
  treatmentCost: number;
  preventionCost: number;
  riskReduction: number;
}

export interface ClientProfile {
  id: string;
  name: string;
  description: string;
  petVolume: number;
  avgCaseValue: number;
  preventiveFocus: number;
  treatmentFocus: number;
}

export interface ROIScenario {
  id: string;
  name: string;
  description: string;
  timeHorizon: number;
  investmentRequired: number;
  projectedRevenue: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

export const useROIIntelligence = () => {
  // Usar dados mock para evitar dependência do contexto
  const nutraceuticals = mockNutraceuticals;
  const conditions = mockConditions;
  const studies: any[] = [];
  const isLoading = false;

  const roiMetrics = useMemo((): ROIMetrics => {
    if (!nutraceuticals.length || !conditions.length) {
      return {
        totalROI: 312,
        averageROI: 287,
        preventiveROI: 425,
        treatmentROI: 198,
        sustainabilityIndex: 76,
        marketPenetration: 34
      };
    }

    // Calcular métricas baseadas nos dados reais
    const efficacyScores = nutraceuticals.flatMap(n => 
      n.nutraceutical_scientific_metadata?.map(m => m.efficacy_score) || []
    );
    
    const avgEfficacy = efficacyScores.length > 0 
      ? efficacyScores.reduce((sum, score) => sum + (score || 0), 0) / efficacyScores.length
      : 0;

    const preventiveConditions = nutraceuticals.flatMap(n =>
      n.nutraceutical_health_conditions?.filter(c => c.relationship_type === 'prevention') || []
    );

    const treatmentConditions = nutraceuticals.flatMap(n =>
      n.nutraceutical_health_conditions?.filter(c => c.relationship_type === 'treatment') || []
    );

    return {
      totalROI: Math.round(avgEfficacy * 50 + 150),
      averageROI: Math.round(avgEfficacy * 45 + 120),
      preventiveROI: Math.round(avgEfficacy * 65 + 200),
      treatmentROI: Math.round(avgEfficacy * 35 + 80),
      sustainabilityIndex: Math.round(avgEfficacy * 12 + 40),
      marketPenetration: Math.round((preventiveConditions.length + treatmentConditions.length) * 3)
    };
  }, [nutraceuticals, conditions]);

  const marketOpportunities = useMemo((): MarketOpportunity[] => {
    if (!conditions.length || !nutraceuticals.length) {
      return [
        {
          conditionId: '1',
          conditionName: 'Osteoartrite Canina',
          marketGap: 78,
          potentialROI: 445,
          recommendedNutraceuticals: ['Glucosamina', 'Condroitina', 'MSM'],
          confidenceScore: 92,
          treatmentCost: 3840,
          preventionCost: 1260,
          riskReduction: 76
        },
        {
          conditionId: '2',
          conditionName: 'Dermatite Atópica',
          marketGap: 65,
          potentialROI: 380,
          recommendedNutraceuticals: ['Ômega-3', 'Quercetina', 'Probióticos'],
          confidenceScore: 87,
          treatmentCost: 2950,
          preventionCost: 890,
          riskReduction: 68
        },
        {
          conditionId: '3',
          conditionName: 'Cardiomiopatia',
          marketGap: 82,
          potentialROI: 520,
          recommendedNutraceuticals: ['Coenzima Q10', 'Taurina', 'L-Carnitina'],
          confidenceScore: 84,
          treatmentCost: 5200,
          preventionCost: 1650,
          riskReduction: 71
        }
      ];
    }

    return conditions.slice(0, 6).map((condition, index) => {
      const relatedNutraceuticals = nutraceuticals.filter(n =>
        n.nutraceutical_health_conditions?.some(c => c.condition?.id === condition.id)
      );

      const avgEfficacy = relatedNutraceuticals.length > 0
        ? relatedNutraceuticals.reduce((sum, n) => {
            const conditionRelation = n.nutraceutical_health_conditions?.find(c => c.condition?.id === condition.id);
            return sum + (conditionRelation?.efficacy_score || 0);
          }, 0) / relatedNutraceuticals.length
        : 3;

      return {
        conditionId: condition.id,
        conditionName: condition.name,
        marketGap: Math.round(60 + Math.random() * 30),
        potentialROI: Math.round(avgEfficacy * 80 + 150 + Math.random() * 100),
        recommendedNutraceuticals: relatedNutraceuticals.slice(0, 3).map(n => n.name),
        confidenceScore: Math.round(75 + Math.random() * 20),
        treatmentCost: Math.round(2500 + Math.random() * 3000),
        preventionCost: Math.round(800 + Math.random() * 1000),
        riskReduction: Math.round(55 + Math.random() * 25)
      };
    });
  }, [conditions, nutraceuticals]);

  const clientProfiles = useMemo((): ClientProfile[] => [
    {
      id: 'small',
      name: 'Clínica Pequena',
      description: 'Até 500 atendimentos/mês',
      petVolume: 350,
      avgCaseValue: 185,
      preventiveFocus: 40,
      treatmentFocus: 60
    },
    {
      id: 'medium',
      name: 'Clínica Média',
      description: '500-1500 atendimentos/mês',
      petVolume: 950,
      avgCaseValue: 225,
      preventiveFocus: 55,
      treatmentFocus: 45
    },
    {
      id: 'large',
      name: 'Hospital Veterinário',
      description: '1500+ atendimentos/mês',
      petVolume: 2300,
      avgCaseValue: 320,
      preventiveFocus: 70,
      treatmentFocus: 30
    }
  ], []);

  const roiScenarios = useMemo((): ROIScenario[] => [
    {
      id: 'conservative',
      name: 'Cenário Conservador',
      description: 'Implementação gradual com foco em casos comprovados',
      timeHorizon: 12,
      investmentRequired: 25000,
      projectedRevenue: 95000,
      riskLevel: 'low',
      confidence: 92
    },
    {
      id: 'balanced',
      name: 'Cenário Equilibrado',
      description: 'Abordagem balanceada entre prevenção e tratamento',
      timeHorizon: 18,
      investmentRequired: 45000,
      projectedRevenue: 185000,
      riskLevel: 'medium',
      confidence: 84
    },
    {
      id: 'aggressive',
      name: 'Cenário Agressivo',
      description: 'Implementação ampla com foco em prevenção',
      timeHorizon: 24,
      investmentRequired: 75000,
      projectedRevenue: 340000,
      riskLevel: 'high',
      confidence: 76
    }
  ], []);

  return {
    roiMetrics,
    marketOpportunities,
    clientProfiles,
    roiScenarios,
    isLoading
  };
};