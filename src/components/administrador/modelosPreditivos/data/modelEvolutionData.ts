import { ModelEvolution, ModelStatus } from '../types/evolutionTypes';

// Helper para gerar snapshots mensais
const generateMonthlySnapshots = (
  startDate: Date,
  months: number,
  initialAccuracy: number,
  finalAccuracy: number,
  initialSamples: number,
  finalSamples: number
) => {
  const snapshots = [];
  const accuracyIncrement = (finalAccuracy - initialAccuracy) / months;
  const samplesIncrement = (finalSamples - initialSamples) / months;

  for (let i = 0; i <= months; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    
    // Curva não-linear para accuracy (retornos decrescentes)
    const progress = i / months;
    const curvedProgress = 1 - Math.pow(1 - progress, 1.5);
    const accuracy = initialAccuracy + (finalAccuracy - initialAccuracy) * curvedProgress;
    
    const dataPoints = Math.floor(initialSamples + samplesIncrement * i);
    const treatmentSamples = Math.floor(dataPoints * 0.6);
    const controlSamples = dataPoints - treatmentSamples;

    snapshots.push({
      date: date.toISOString(),
      accuracy: Math.round(accuracy * 100) / 100,
      dataPoints,
      treatmentSamples,
      controlSamples,
      conditions: [] // Simplificado - pode expandir depois
    });
  }

  return snapshots;
};

export const modelEvolutionData: ModelEvolution[] = [
  {
    modelId: 'model-longevity-1',
    modelName: 'Longevidade Canina - Raças Grandes',
    status: 'state-of-art' as ModelStatus,
    currentAccuracy: 91.3,
    totalSamples: 34500,
    treatmentSamples: 20700,
    controlSamples: 13800,
    monthlyGrowthRate: 8.5,
    snapshots: generateMonthlySnapshots(
      new Date('2023-04-01'),
      18,
      65.2,
      91.3,
      2000,
      34500
    ),
    insights: [
      {
        id: 'insight-1',
        discoveredAt: '2024-02-15',
        title_pt: 'Sinergia Omega-3 + Curcumina em Raças Braquicefálicas',
        title_en: 'Omega-3 + Curcumin Synergy in Brachycephalic Breeds',
        description_pt: 'Raças braquicefálicas (Bulldog, Pug) apresentam 34% mais resposta positiva a Omega-3 quando administrado em conjunto com Curcumina, comparado a Omega-3 isolado. Padrão não observado em raças dolicocefálicas.',
        description_en: 'Brachycephalic breeds (Bulldog, Pug) show 34% better response to Omega-3 when administered with Curcumin, compared to Omega-3 alone. Pattern not observed in dolichocephalic breeds.',
        significance: 'high',
        relatedConditions: ['Inflamação Crônica', 'Osteoartrite'],
        relatedBreeds: ['Bulldog', 'Pug', 'Boston Terrier'],
        dataRequirement: 15000,
        evidence: {
          accuracy: 89.5,
          sampleSize: 847,
          pValue: 0.003,
          effectSize: 0.68
        }
      },
      {
        id: 'insight-2',
        discoveredAt: '2024-05-22',
        title_pt: 'Janela Temporal Crítica: NMN em Cães Seniores',
        title_en: 'Critical Time Window: NMN in Senior Dogs',
        description_pt: 'Suplementação com NMN mostra eficácia 47% maior quando iniciada entre 7-9 anos (raças grandes) comparado a início após 10 anos. Sugere janela preventiva antes de declínio celular avançado.',
        description_en: 'NMN supplementation shows 47% higher efficacy when started between 7-9 years (large breeds) compared to starting after 10 years. Suggests preventive window before advanced cellular decline.',
        significance: 'high',
        relatedConditions: ['Declínio Cognitivo', 'Sarcopenia'],
        relatedBreeds: ['Labrador', 'Golden Retriever', 'Pastor Alemão'],
        dataRequirement: 18500,
        evidence: {
          accuracy: 92.1,
          sampleSize: 1243,
          pValue: 0.001,
          effectSize: 0.82
        }
      },
      {
        id: 'insight-3',
        discoveredAt: '2024-08-10',
        title_pt: 'Perfil Genético e Resposta a Resveratrol',
        title_en: 'Genetic Profile and Resveratrol Response',
        description_pt: 'Cães com histórico familiar de cardiopatias apresentam resposta 3x superior ao Resveratrol em marcadores cardiovasculares, mesmo sem sintomas clínicos presentes.',
        description_en: 'Dogs with family history of heart disease show 3x better response to Resveratrol in cardiovascular markers, even without clinical symptoms.',
        significance: 'medium',
        relatedConditions: ['Cardiopatias', 'Insuficiência Cardíaca'],
        relatedBreeds: ['Dobermann', 'Boxer', 'Great Dane'],
        dataRequirement: 22000,
        evidence: {
          accuracy: 87.3,
          sampleSize: 592,
          pValue: 0.008,
          effectSize: 0.54
        }
      }
    ],
    timeline: [
      {
        id: 'event-1',
        date: '2023-04-01',
        type: 'dataset',
        title_pt: 'Integração Dataset Inicial',
        title_en: 'Initial Dataset Integration',
        description_pt: 'Integração de dados históricos de 2.000 pets com acompanhamento longitudinal.',
        description_en: 'Integration of historical data from 2,000 pets with longitudinal follow-up.',
        accuracy: 65.2,
        dataPoints: 2000
      },
      {
        id: 'event-2',
        date: '2023-08-15',
        type: 'milestone',
        title_pt: 'Marco: 5.000 Amostras',
        title_en: 'Milestone: 5,000 Samples',
        description_pt: 'Atingido primeiro marco significativo de volume de dados.',
        description_en: 'First significant data volume milestone reached.',
        accuracy: 74.8,
        dataPoints: 5000
      },
      {
        id: 'event-3',
        date: '2023-11-20',
        type: 'study',
        title_pt: 'Incorporação: Estudo Omega-3 Longitudinal',
        title_en: 'Incorporation: Omega-3 Longitudinal Study',
        description_pt: 'Dados do estudo longitudinal de Omega-3 integrados ao modelo.',
        description_en: 'Omega-3 longitudinal study data integrated into model.',
        accuracy: 79.5,
        dataPoints: 8200
      },
      {
        id: 'event-4',
        date: '2024-02-15',
        type: 'insight',
        title_pt: 'Descoberta: Sinergia Omega-3 + Curcumina',
        title_en: 'Discovery: Omega-3 + Curcumin Synergy',
        description_pt: 'Primeiro insight proprietário de alta significância descoberto.',
        description_en: 'First high-significance proprietary insight discovered.',
        accuracy: 83.7,
        dataPoints: 15200
      },
      {
        id: 'event-5',
        date: '2024-05-10',
        type: 'performance',
        title_pt: 'Salto de Performance: +6.5%',
        title_en: 'Performance Jump: +6.5%',
        description_pt: 'Melhoria significativa após refinamento de algoritmo e novos dados.',
        description_en: 'Significant improvement after algorithm refinement and new data.',
        accuracy: 90.2,
        dataPoints: 28000
      },
      {
        id: 'event-6',
        date: '2024-09-01',
        type: 'milestone',
        title_pt: 'Marco: 30.000 Amostras - Estado da Arte',
        title_en: 'Milestone: 30,000 Samples - State of the Art',
        description_pt: 'Modelo atinge status de estado da arte com confiança robusta.',
        description_en: 'Model reaches state-of-the-art status with robust confidence.',
        accuracy: 91.3,
        dataPoints: 34500
      }
    ],
    nextMilestone: {
      target: 50000,
      current: 34500,
      description_pt: 'Próximo marco: 50.000 amostras para análises de subgrupos ainda mais refinadas',
      description_en: 'Next milestone: 50,000 samples for even more refined subgroup analyses'
    }
  },
  {
    modelId: 'model-cognitive-2',
    modelName: 'Declínio Cognitivo Canino',
    status: 'mature' as ModelStatus,
    currentAccuracy: 87.8,
    totalSamples: 18200,
    treatmentSamples: 10920,
    controlSamples: 7280,
    monthlyGrowthRate: 6.2,
    snapshots: generateMonthlySnapshots(
      new Date('2023-06-01'),
      16,
      68.5,
      87.8,
      1500,
      18200
    ),
    insights: [
      {
        id: 'insight-cog-1',
        discoveredAt: '2024-03-12',
        title_pt: 'Combinação Tripla: Fosfatidilserina + Ômega-3 + Vitamina E',
        title_en: 'Triple Combination: Phosphatidylserine + Omega-3 + Vitamin E',
        description_pt: 'Combinação tripla mostra sinergia não-aditiva, com melhoria 58% superior à soma dos efeitos individuais em testes cognitivos.',
        description_en: 'Triple combination shows non-additive synergy, with 58% better improvement than sum of individual effects in cognitive tests.',
        significance: 'high',
        relatedConditions: ['Declínio Cognitivo', 'Demência Senil'],
        relatedBreeds: ['Poodle', 'Cocker Spaniel', 'Beagle'],
        dataRequirement: 12000,
        evidence: {
          accuracy: 88.9,
          sampleSize: 634,
          pValue: 0.002,
          effectSize: 0.73
        }
      },
      {
        id: 'insight-cog-2',
        discoveredAt: '2024-07-05',
        title_pt: 'Microbioma Intestinal e Cognição',
        title_en: 'Gut Microbiome and Cognition',
        description_pt: 'Cães com maior diversidade de microbioma intestinal respondem 41% melhor a suplementação cognitiva. Sugere abordagem combinada com probióticos.',
        description_en: 'Dogs with higher gut microbiome diversity respond 41% better to cognitive supplementation. Suggests combined approach with probiotics.',
        significance: 'medium',
        relatedConditions: ['Declínio Cognitivo', 'Saúde Intestinal'],
        relatedBreeds: ['Todas as raças'],
        dataRequirement: 15000,
        evidence: {
          accuracy: 85.4,
          sampleSize: 412,
          pValue: 0.012,
          effectSize: 0.61
        }
      }
    ],
    timeline: [
      {
        id: 'event-cog-1',
        date: '2023-06-01',
        type: 'dataset',
        title_pt: 'Dataset Inicial - Estudos Cognitivos',
        title_en: 'Initial Dataset - Cognitive Studies',
        description_pt: 'Base inicial com 1.500 cães em estudos de cognição.',
        description_en: 'Initial base with 1,500 dogs in cognition studies.',
        accuracy: 68.5,
        dataPoints: 1500
      },
      {
        id: 'event-cog-2',
        date: '2024-01-20',
        type: 'milestone',
        title_pt: 'Marco: 10.000 Amostras',
        title_en: 'Milestone: 10,000 Samples',
        description_pt: 'Modelo alcança maturidade estatística.',
        description_en: 'Model reaches statistical maturity.',
        accuracy: 82.3,
        dataPoints: 10000
      },
      {
        id: 'event-cog-3',
        date: '2024-03-12',
        type: 'insight',
        title_pt: 'Descoberta: Sinergia Tripla Cognitiva',
        title_en: 'Discovery: Cognitive Triple Synergy',
        description_pt: 'Identificação de combinação sinérgica não-aditiva.',
        description_en: 'Identification of non-additive synergistic combination.',
        accuracy: 85.1,
        dataPoints: 12500
      }
    ],
    nextMilestone: {
      target: 25000,
      current: 18200,
      description_pt: 'Meta: 25.000 amostras para análises de raças pequenas',
      description_en: 'Goal: 25,000 samples for small breed analyses'
    }
  },
  {
    modelId: 'model-joint-3',
    modelName: 'Saúde Articular - Osteoartrite',
    status: 'growing' as ModelStatus,
    currentAccuracy: 81.5,
    totalSamples: 12400,
    treatmentSamples: 7440,
    controlSamples: 4960,
    monthlyGrowthRate: 9.8,
    snapshots: generateMonthlySnapshots(
      new Date('2023-09-01'),
      13,
      70.2,
      81.5,
      1200,
      12400
    ),
    insights: [
      {
        id: 'insight-joint-1',
        discoveredAt: '2024-04-18',
        title_pt: 'Peso Corporal e Resposta a Glucosamina',
        title_en: 'Body Weight and Glucosamine Response',
        description_pt: 'Cães com sobrepeso (>15% acima do ideal) requerem 28% mais tempo para responder a Glucosamina, mas eventualmente atingem mesma melhoria.',
        description_en: 'Overweight dogs (>15% above ideal) require 28% more time to respond to Glucosamine, but eventually reach same improvement.',
        significance: 'medium',
        relatedConditions: ['Osteoartrite', 'Obesidade'],
        relatedBreeds: ['Labrador', 'Beagle', 'Basset Hound'],
        dataRequirement: 8000,
        evidence: {
          accuracy: 79.8,
          sampleSize: 378,
          pValue: 0.015,
          effectSize: 0.48
        }
      }
    ],
    timeline: [
      {
        id: 'event-joint-1',
        date: '2023-09-01',
        type: 'dataset',
        title_pt: 'Início do Modelo Articular',
        title_en: 'Joint Model Initiation',
        description_pt: 'Modelo mais recente focado em saúde articular.',
        description_en: 'Newest model focused on joint health.',
        accuracy: 70.2,
        dataPoints: 1200
      },
      {
        id: 'event-joint-2',
        date: '2024-03-10',
        type: 'milestone',
        title_pt: 'Marco: 5.000 Amostras',
        title_en: 'Milestone: 5,000 Samples',
        description_pt: 'Crescimento acelerado em fase inicial.',
        description_en: 'Accelerated growth in initial phase.',
        accuracy: 76.5,
        dataPoints: 5000
      }
    ],
    nextMilestone: {
      target: 15000,
      current: 12400,
      description_pt: 'Próximo: 15.000 amostras para status maduro',
      description_en: 'Next: 15,000 samples for mature status'
    }
  },
  {
    modelId: 'model-cardio-4',
    modelName: 'Prevenção Cardiovascular',
    status: 'initial' as ModelStatus,
    currentAccuracy: 74.2,
    totalSamples: 4800,
    treatmentSamples: 2880,
    controlSamples: 1920,
    monthlyGrowthRate: 12.5,
    snapshots: generateMonthlySnapshots(
      new Date('2024-01-01'),
      9,
      66.8,
      74.2,
      800,
      4800
    ),
    insights: [],
    timeline: [
      {
        id: 'event-cardio-1',
        date: '2024-01-01',
        type: 'dataset',
        title_pt: 'Lançamento Modelo Cardiovascular',
        title_en: 'Cardiovascular Model Launch',
        description_pt: 'Modelo mais novo em fase inicial de coleta.',
        description_en: 'Newest model in initial collection phase.',
        accuracy: 66.8,
        dataPoints: 800
      },
      {
        id: 'event-cardio-2',
        date: '2024-06-15',
        type: 'performance',
        title_pt: 'Melhoria Rápida: +5.2%',
        title_en: 'Fast Improvement: +5.2%',
        description_pt: 'Crescimento acelerado com dados de alta qualidade.',
        description_en: 'Accelerated growth with high-quality data.',
        accuracy: 72.0,
        dataPoints: 3500
      }
    ],
    nextMilestone: {
      target: 5000,
      current: 4800,
      description_pt: 'Muito próximo: 5.000 amostras - primeiro marco!',
      description_en: 'Very close: 5,000 samples - first milestone!'
    }
  }
];

// Dados de performance por condição (exemplo para o primeiro modelo)
export const conditionPerformanceData = [
  {
    conditionId: 'cond-1',
    conditionName_pt: 'Osteoartrite',
    conditionName_en: 'Osteoarthritis',
    accuracy: 93.2,
    confidence: 'high' as const,
    sampleSize: 5847,
    treatmentEffectiveness: 78.5,
    trend: 'improving' as const,
    system: 'Articular'
  },
  {
    conditionId: 'cond-2',
    conditionName_pt: 'Declínio Cognitivo',
    conditionName_en: 'Cognitive Decline',
    accuracy: 91.8,
    confidence: 'high' as const,
    sampleSize: 4235,
    treatmentEffectiveness: 82.1,
    trend: 'stable' as const,
    system: 'Neurológico'
  },
  {
    conditionId: 'cond-3',
    conditionName_pt: 'Insuficiência Cardíaca',
    conditionName_en: 'Heart Failure',
    accuracy: 89.4,
    confidence: 'high' as const,
    sampleSize: 3124,
    treatmentEffectiveness: 71.3,
    trend: 'improving' as const,
    system: 'Cardiovascular'
  },
  {
    conditionId: 'cond-4',
    conditionName_pt: 'Doença Renal Crônica',
    conditionName_en: 'Chronic Kidney Disease',
    accuracy: 87.6,
    confidence: 'high' as const,
    sampleSize: 2891,
    treatmentEffectiveness: 68.9,
    trend: 'stable' as const,
    system: 'Renal'
  },
  {
    conditionId: 'cond-5',
    conditionName_pt: 'Inflamação Crônica',
    conditionName_en: 'Chronic Inflammation',
    accuracy: 85.3,
    confidence: 'medium' as const,
    sampleSize: 2456,
    treatmentEffectiveness: 75.2,
    trend: 'improving' as const,
    system: 'Imunológico'
  },
  {
    conditionId: 'cond-6',
    conditionName_pt: 'Sarcopenia',
    conditionName_en: 'Sarcopenia',
    accuracy: 82.1,
    confidence: 'medium' as const,
    sampleSize: 1847,
    treatmentEffectiveness: 69.4,
    trend: 'stable' as const,
    system: 'Muscular'
  },
  {
    conditionId: 'cond-7',
    conditionName_pt: 'Distúrbios Metabólicos',
    conditionName_en: 'Metabolic Disorders',
    accuracy: 78.9,
    confidence: 'medium' as const,
    sampleSize: 1534,
    treatmentEffectiveness: 64.7,
    trend: 'improving' as const,
    system: 'Metabólico'
  },
  {
    conditionId: 'cond-8',
    conditionName_pt: 'Alergias Dermatológicas',
    conditionName_en: 'Dermatological Allergies',
    accuracy: 76.2,
    confidence: 'low' as const,
    sampleSize: 982,
    treatmentEffectiveness: 61.3,
    trend: 'stable' as const,
    system: 'Dermatológico'
  },
  {
    conditionId: 'cond-9',
    conditionName_pt: 'Ansiedade e Stress',
    conditionName_en: 'Anxiety and Stress',
    accuracy: 73.5,
    confidence: 'low' as const,
    sampleSize: 847,
    treatmentEffectiveness: 58.9,
    trend: 'improving' as const,
    system: 'Comportamental'
  },
  {
    conditionId: 'cond-10',
    conditionName_pt: 'Disfunção Hepática',
    conditionName_en: 'Hepatic Dysfunction',
    accuracy: 71.8,
    confidence: 'low' as const,
    sampleSize: 623,
    treatmentEffectiveness: 55.2,
    trend: 'stable' as const,
    system: 'Hepático'
  }
];
