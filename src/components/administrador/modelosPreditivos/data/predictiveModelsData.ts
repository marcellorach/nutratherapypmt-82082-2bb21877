import { PredictiveModel } from '../types/predictiveModelTypes';

export const predictiveModelsData: PredictiveModel[] = [
  {
    modelId: 'efficacy-prediction',
    modelName: 'Previsão de Eficácia de Nutracêuticos',
    algorithm: 'Gradient Boosting + Neural Networks',
    status: 'state-of-art',
    currentAccuracy: 91.3,
    trainedAt: '2025-09-28',
    description: 'Prevê a eficácia de composições nutracêuticas personalizadas com base em perfil do pet, condição clínica e histórico de tratamentos.',
    totalPetsMonitored: 287500,
    treatmentGroup: 201250,
    controlGroup: 86250,
    monthlyGrowthRate: 8.2,
    dataSources: [
      {
        type: 'clinical_monitoring',
        percentage: 45,
        sampleCount: 129375,
        label: 'Acompanhamento Clínico',
        description: 'Dados longitudinais de evolução clínica reportados por tutores e veterinários'
      },
      {
        type: 'nutritherapy_monitoring',
        percentage: 25,
        sampleCount: 71875,
        label: 'Monitoramento com Nutraterapia',
        description: 'Dados de pets em protocolo ativo de suplementação nutracêutica'
      },
      {
        type: 'control_group',
        percentage: 15,
        sampleCount: 43125,
        label: 'Grupo Controle',
        description: 'Pets com mesmas condições sem intervenção nutracêutica'
      },
      {
        type: 'lab_exams',
        percentage: 8,
        sampleCount: 23000,
        label: 'Exames Laboratoriais',
        description: 'Marcadores bioquímicos e hemogramas processados via OCR e estruturados'
      },
      {
        type: 'scientific_studies',
        percentage: 5,
        sampleCount: 14375,
        label: 'Estudos Científicos',
        description: 'Base de conhecimento de estudos veterinários processados pela NTAI'
      },
      {
        type: 'anamnesis',
        percentage: 2,
        sampleCount: 5750,
        label: 'Anamnese Histórica',
        description: 'Dados históricos de anamnese com extração de tags clínicas'
      }
    ],
    performanceHistory: [
      { date: '2025-04-01', accuracy: 78.2, petsMonitored: 142000 },
      { date: '2025-05-01', accuracy: 81.5, petsMonitored: 168000 },
      { date: '2025-06-01', accuracy: 84.8, petsMonitored: 197000 },
      { date: '2025-07-01', accuracy: 87.1, petsMonitored: 228000 },
      { date: '2025-08-01', accuracy: 89.2, petsMonitored: 256000 },
      { date: '2025-09-01', accuracy: 90.5, petsMonitored: 274000 },
      { date: '2025-10-01', accuracy: 91.3, petsMonitored: 287500 }
    ],
    degenerativeInsights: [
      {
        id: 'ins-001',
        discoveredAt: '2025-09-15',
        title: 'Osteoartrite: Sinergia entre Omega-3 e Glucosamina em Raças Grandes',
        description: 'Cães Golden Retriever e Labrador com idade entre 7-10 anos e osteoartrite grau leve apresentam redução de 42% na progressão da doença quando suplementados com Omega-3 EPA/DHA (>2g/dia) combinado com Glucosamina (1500mg/dia) versus grupo controle.',
        relatedConditions: ['Osteoartrite', 'Displasia Coxofemoral', 'Degeneração Articular'],
        relatedBreeds: ['Golden Retriever', 'Labrador Retriever', 'Pastor Alemão'],
        ageRange: '7-10 anos',
        significance: 'high',
        evidence: {
          sampleSize: 8240,
          pValue: 0.0012,
          effectSize: 0.42,
          confidenceInterval: [0.35, 0.49]
        }
      },
      {
        id: 'ins-002',
        discoveredAt: '2025-09-02',
        title: 'Declínio Cognitivo: Complexo Antioxidante Retarda Progressão em 38%',
        description: 'Suplementação com complexo antioxidante (Vitamina E 400UI + Selênio 50mcg + Resveratrol 20mg) demonstra redução de 38% na velocidade de declínio cognitivo em cães idosos (9+ anos) comparado ao grupo controle, medido por testes comportamentais padronizados.',
        relatedConditions: ['Síndrome de Disfunção Cognitiva', 'Demência Senil', 'Declínio Cognitivo'],
        relatedBreeds: ['Poodle', 'Cocker Spaniel', 'Beagle', 'Terrier'],
        ageRange: '9+ anos',
        significance: 'high',
        evidence: {
          sampleSize: 6820,
          pValue: 0.0008,
          effectSize: 0.38,
          confidenceInterval: [0.31, 0.45]
        }
      },
      {
        id: 'ins-003',
        discoveredAt: '2025-08-18',
        title: 'Sarcopenia: Proteína + HMB Preservam Massa Muscular em Seniores',
        description: 'Combinação de proteína isolada (2g/kg/dia) com HMB (3g/dia) reduz perda de massa muscular em 31% em cães seniores (8+ anos) ao longo de 6 meses, comparado ao controle com dieta padrão.',
        relatedConditions: ['Sarcopenia', 'Perda de Massa Muscular', 'Fraqueza Senil'],
        relatedBreeds: ['Todas as raças', 'Especialmente raças grandes e gigantes'],
        ageRange: '8+ anos',
        significance: 'medium',
        evidence: {
          sampleSize: 4960,
          pValue: 0.0045,
          effectSize: 0.31,
          confidenceInterval: [0.23, 0.39]
        }
      },
      {
        id: 'ins-004',
        discoveredAt: '2025-08-05',
        title: 'Doença Renal Crônica: Omega-3 Retarda Progressão em Estágio 2',
        description: 'Omega-3 em doses terapêuticas (EPA+DHA >3g/dia) retarda progressão de DRC estágio 2 em 28% ao longo de 18 meses, evidenciado por estabilização de creatinina e ureia sérica.',
        relatedConditions: ['Doença Renal Crônica', 'Insuficiência Renal', 'Nefropatia'],
        relatedBreeds: ['Todas as raças', 'Maior prevalência em Cocker, Shih Tzu'],
        ageRange: '7+ anos',
        significance: 'high',
        evidence: {
          sampleSize: 5640,
          pValue: 0.0019,
          effectSize: 0.28,
          confidenceInterval: [0.21, 0.35]
        }
      },
      {
        id: 'ins-005',
        discoveredAt: '2025-07-22',
        title: 'Degeneração Cardíaca: CoQ10 + Taurina Melhoram Função Ventricular',
        description: 'Suplementação com Coenzima Q10 (100mg/dia) + Taurina (500mg/dia) melhora fração de ejeção ventricular em 19% em cães com cardiomiopatia dilatada inicial, reduzindo risco de progressão para insuficiência cardíaca congestiva.',
        relatedConditions: ['Cardiomiopatia Dilatada', 'Insuficiência Cardíaca', 'Degeneração Miocárdica'],
        relatedBreeds: ['Doberman', 'Boxer', 'Cocker Spaniel', 'Schnauzer'],
        ageRange: '6-11 anos',
        significance: 'high',
        evidence: {
          sampleSize: 3840,
          pValue: 0.0028,
          effectSize: 0.19,
          confidenceInterval: [0.13, 0.25]
        }
      }
    ],
    nextMilestone: {
      target: 350000,
      current: 287500,
      description: 'Atingir 350.000 pets monitorados para validação em subpopulações raras'
    }
  },
  {
    modelId: 'cost-benefit-analysis',
    modelName: 'Análise de Custo-Benefício',
    algorithm: 'Random Forest + Economic Models',
    status: 'mature',
    currentAccuracy: 87.5,
    trainedAt: '2025-09-20',
    description: 'Modela o retorno sobre investimento em nutraterapia considerando redução de custos veterinários, qualidade de vida e longevidade.',
    totalPetsMonitored: 198200,
    treatmentGroup: 138740,
    controlGroup: 59460,
    monthlyGrowthRate: 6.8,
    dataSources: [
      {
        type: 'clinical_monitoring',
        percentage: 48,
        sampleCount: 95136,
        label: 'Acompanhamento Clínico',
        description: 'Frequência de consultas e intervenções veterinárias ao longo do tempo'
      },
      {
        type: 'nutritherapy_monitoring',
        percentage: 22,
        sampleCount: 43604,
        label: 'Monitoramento com Nutraterapia',
        description: 'Custos de suplementação e aderência aos protocolos'
      },
      {
        type: 'control_group',
        percentage: 18,
        sampleCount: 35676,
        label: 'Grupo Controle',
        description: 'Comparativo de custos em pets sem nutraterapia'
      },
      {
        type: 'lab_exams',
        percentage: 7,
        sampleCount: 13874,
        label: 'Exames Laboratoriais',
        description: 'Custos e frequência de exames diagnósticos'
      },
      {
        type: 'scientific_studies',
        percentage: 3,
        sampleCount: 5946,
        label: 'Estudos Econômicos',
        description: 'Literatura sobre economia da saúde veterinária'
      },
      {
        type: 'anamnesis',
        percentage: 2,
        sampleCount: 3964,
        label: 'Histórico de Custos',
        description: 'Gastos históricos reportados por tutores'
      }
    ],
    performanceHistory: [
      { date: '2025-04-01', accuracy: 76.8, petsMonitored: 98000 },
      { date: '2025-05-01', accuracy: 79.2, petsMonitored: 118000 },
      { date: '2025-06-01', accuracy: 82.1, petsMonitored: 138000 },
      { date: '2025-07-01', accuracy: 84.3, petsMonitored: 158000 },
      { date: '2025-08-01', accuracy: 85.9, petsMonitored: 176000 },
      { date: '2025-09-01', accuracy: 86.8, petsMonitored: 188000 },
      { date: '2025-10-01', accuracy: 87.5, petsMonitored: 198200 }
    ],
    degenerativeInsights: [
      {
        id: 'ins-cb-001',
        discoveredAt: '2025-09-08',
        title: 'ROI Positivo em 89% dos Casos de Prevenção de Osteoartrite',
        description: 'Investimento em nutraterapia preventiva para osteoartrite em raças predispostas (7+ anos) gera ROI positivo em 89% dos casos ao longo de 3 anos, com economia média de R$4.200 em custos veterinários por pet.',
        relatedConditions: ['Osteoartrite', 'Displasia', 'Degeneração Articular'],
        relatedBreeds: ['Golden Retriever', 'Labrador', 'Pastor Alemão', 'Rottweiler'],
        ageRange: '7-12 anos',
        significance: 'high',
        evidence: {
          sampleSize: 12400,
          pValue: 0.0003,
          effectSize: 4200,
          confidenceInterval: [3800, 4600]
        }
      },
      {
        id: 'ins-cb-002',
        discoveredAt: '2025-08-25',
        title: 'Nutraterapia Cardíaca Reduz Custos de Emergência em 64%',
        description: 'Protocolo preventivo com CoQ10 + Taurina em raças cardiopatas reduz frequência de atendimentos de emergência cardíaca em 64%, gerando economia média de R$6.800 ao longo de 2 anos.',
        relatedConditions: ['Cardiomiopatia', 'Insuficiência Cardíaca', 'Arritmias'],
        relatedBreeds: ['Doberman', 'Boxer', 'Cocker Spaniel'],
        ageRange: '6-10 anos',
        significance: 'high',
        evidence: {
          sampleSize: 4820,
          pValue: 0.0008,
          effectSize: 6800,
          confidenceInterval: [6100, 7500]
        }
      },
      {
        id: 'ins-cb-003',
        discoveredAt: '2025-07-12',
        title: 'Prevenção de Declínio Cognitivo Reduz Custos em 52%',
        description: 'Intervenção nutracêutica precoce (8+ anos) para prevenção de declínio cognitivo reduz custos com manejo comportamental e consultas especializadas em 52%, com payback médio de 14 meses.',
        relatedConditions: ['Disfunção Cognitiva', 'Demência', 'Alterações Comportamentais'],
        relatedBreeds: ['Todas as raças', 'Maior incidência em raças pequenas'],
        ageRange: '8+ anos',
        significance: 'medium',
        evidence: {
          sampleSize: 6940,
          pValue: 0.0021,
          effectSize: 3200,
          confidenceInterval: [2800, 3600]
        }
      }
    ],
    nextMilestone: {
      target: 250000,
      current: 198200,
      description: 'Alcançar 250.000 pets para modelagem por região geográfica e precificação local'
    }
  },
  {
    modelId: 'patient-segmentation',
    modelName: 'Segmentação de Pacientes',
    algorithm: 'K-Means Clustering + Decision Trees',
    status: 'growing',
    currentAccuracy: 81.2,
    trainedAt: '2025-09-12',
    description: 'Identifica clusters de risco e perfis de resposta a tratamentos, permitindo personalização proativa de intervenções.',
    totalPetsMonitored: 142800,
    treatmentGroup: 99960,
    controlGroup: 42840,
    monthlyGrowthRate: 9.5,
    dataSources: [
      {
        type: 'clinical_monitoring',
        percentage: 42,
        sampleCount: 59976,
        label: 'Acompanhamento Clínico',
        description: 'Padrões de evolução clínica por perfil de pet'
      },
      {
        type: 'nutritherapy_monitoring',
        percentage: 26,
        sampleCount: 37128,
        label: 'Resposta à Nutraterapia',
        description: 'Padrões de resposta a diferentes protocolos nutracêuticos'
      },
      {
        type: 'control_group',
        percentage: 12,
        sampleCount: 17136,
        label: 'Grupo Controle',
        description: 'Evolução natural por cluster de risco'
      },
      {
        type: 'lab_exams',
        percentage: 10,
        sampleCount: 14280,
        label: 'Perfil Laboratorial',
        description: 'Marcadores bioquímicos por segmento'
      },
      {
        type: 'anamnesis',
        percentage: 7,
        sampleCount: 9996,
        label: 'Perfil Anamnéstico',
        description: 'Histórico familiar, estilo de vida e ambiente'
      },
      {
        type: 'scientific_studies',
        percentage: 3,
        sampleCount: 4284,
        label: 'Literatura de Segmentação',
        description: 'Estudos sobre fatores de risco e predisposição racial'
      }
    ],
    performanceHistory: [
      { date: '2025-04-01', accuracy: 68.5, petsMonitored: 62000 },
      { date: '2025-05-01', accuracy: 71.8, petsMonitored: 74000 },
      { date: '2025-06-01', accuracy: 74.2, petsMonitored: 87000 },
      { date: '2025-07-01', accuracy: 76.9, petsMonitored: 102000 },
      { date: '2025-08-01', accuracy: 78.5, petsMonitored: 118000 },
      { date: '2025-09-01', accuracy: 79.8, petsMonitored: 132000 },
      { date: '2025-10-01', accuracy: 81.2, petsMonitored: 142800 }
    ],
    degenerativeInsights: [
      {
        id: 'ins-seg-001',
        discoveredAt: '2025-09-05',
        title: 'Cluster de Alto Risco Articular Identificado em Raças Grandes 6+ Anos',
        description: 'Identificação de cluster com 74% de probabilidade de desenvolver osteoartrite até os 9 anos em Golden, Labrador e Pastor Alemão com idade 6-7 anos, peso acima do ideal e histórico familiar positivo.',
        relatedConditions: ['Osteoartrite', 'Displasia', 'Degeneração Articular'],
        relatedBreeds: ['Golden Retriever', 'Labrador', 'Pastor Alemão'],
        ageRange: '6-7 anos',
        significance: 'high',
        evidence: {
          sampleSize: 8640,
          pValue: 0.0006,
          effectSize: 0.74,
          confidenceInterval: [0.68, 0.80]
        }
      },
      {
        id: 'ins-seg-002',
        discoveredAt: '2025-08-20',
        title: 'Perfil de Resposta Superior a Antioxidantes em Raças Pequenas',
        description: 'Cães de raças pequenas (Poodle, Yorkshire, Shih Tzu) com idade 8+ anos demonstram resposta 41% superior a protocolos antioxidantes para preservação cognitiva comparado a raças médias/grandes.',
        relatedConditions: ['Declínio Cognitivo', 'Disfunção Cognitiva', 'Demência'],
        relatedBreeds: ['Poodle', 'Yorkshire', 'Shih Tzu', 'Maltês'],
        ageRange: '8+ anos',
        significance: 'medium',
        evidence: {
          sampleSize: 5280,
          pValue: 0.0018,
          effectSize: 0.41,
          confidenceInterval: [0.34, 0.48]
        }
      },
      {
        id: 'ins-seg-003',
        discoveredAt: '2025-07-28',
        title: 'Cluster Cardiopata: Intervenção Precoce aos 5 Anos Reduz Risco em 56%',
        description: 'Raças predispostas a cardiomiopatia (Doberman, Boxer) apresentam 56% de redução no risco de progressão quando iniciam nutraterapia cardíaca aos 5 anos vs início aos 7+ anos.',
        relatedConditions: ['Cardiomiopatia Dilatada', 'Insuficiência Cardíaca'],
        relatedBreeds: ['Doberman', 'Boxer', 'Cocker Spaniel'],
        ageRange: '5-6 anos',
        significance: 'high',
        evidence: {
          sampleSize: 2840,
          pValue: 0.0012,
          effectSize: 0.56,
          confidenceInterval: [0.48, 0.64]
        }
      }
    ],
    nextMilestone: {
      target: 200000,
      current: 142800,
      description: 'Atingir 200.000 pets para segmentação por combinação de múltiplos fatores de risco'
    }
  },
  {
    modelId: 'disease-progression',
    modelName: 'Previsão de Progressão de Doenças',
    algorithm: 'LSTM Neural Networks + Time Series Analysis',
    status: 'initial',
    currentAccuracy: 74.8,
    trainedAt: '2025-09-05',
    description: 'Prevê trajetória de progressão de doenças degenerativas em diferentes cenários de intervenção, permitindo ajuste proativo de protocolos.',
    totalPetsMonitored: 95600,
    treatmentGroup: 66920,
    controlGroup: 28680,
    monthlyGrowthRate: 12.3,
    dataSources: [
      {
        type: 'clinical_monitoring',
        percentage: 50,
        sampleCount: 47800,
        label: 'Séries Temporais Clínicas',
        description: 'Dados longitudinais de evolução de sintomas e sinais clínicos'
      },
      {
        type: 'nutritherapy_monitoring',
        percentage: 20,
        sampleCount: 19120,
        label: 'Resposta Temporal à Nutraterapia',
        description: 'Curvas de resposta ao longo do tempo com diferentes protocolos'
      },
      {
        type: 'lab_exams',
        percentage: 15,
        sampleCount: 14340,
        label: 'Marcadores Seriados',
        description: 'Evolução temporal de marcadores laboratoriais'
      },
      {
        type: 'control_group',
        percentage: 10,
        sampleCount: 9560,
        label: 'Progressão Natural',
        description: 'Curvas de progressão sem intervenção nutracêutica'
      },
      {
        type: 'scientific_studies',
        percentage: 4,
        sampleCount: 3824,
        label: 'Estudos Longitudinais',
        description: 'Literatura sobre história natural de doenças degenerativas'
      },
      {
        type: 'anamnesis',
        percentage: 1,
        sampleCount: 956,
        label: 'Histórico de Progressão',
        description: 'Relatos retrospectivos de evolução clínica'
      }
    ],
    performanceHistory: [
      { date: '2025-04-01', accuracy: 58.2, petsMonitored: 38000 },
      { date: '2025-05-01', accuracy: 62.4, petsMonitored: 48000 },
      { date: '2025-06-01', accuracy: 65.8, petsMonitored: 58000 },
      { date: '2025-07-01', accuracy: 68.9, petsMonitored: 68000 },
      { date: '2025-08-01', accuracy: 71.2, petsMonitored: 78000 },
      { date: '2025-09-01', accuracy: 73.1, petsMonitored: 87000 },
      { date: '2025-10-01', accuracy: 74.8, petsMonitored: 95600 }
    ],
    degenerativeInsights: [
      {
        id: 'ins-prog-001',
        discoveredAt: '2025-09-01',
        title: 'Progressão de Osteoartrite Acelera 2.3x Após os 9 Anos sem Intervenção',
        description: 'Análise longitudinal demonstra que velocidade de progressão de osteoartrite em raças grandes acelera 2.3x após os 9 anos de idade em pets sem nutraterapia, versus aceleração de apenas 1.2x em pets com protocolo adequado.',
        relatedConditions: ['Osteoartrite', 'Displasia', 'Degeneração Articular'],
        relatedBreeds: ['Golden Retriever', 'Labrador', 'Pastor Alemão', 'Rottweiler'],
        ageRange: '9+ anos',
        significance: 'high',
        evidence: {
          sampleSize: 6420,
          pValue: 0.0004,
          effectSize: 2.3,
          confidenceInterval: [2.0, 2.6]
        }
      },
      {
        id: 'ins-prog-002',
        discoveredAt: '2025-08-15',
        title: 'Janela Crítica: Intervenção nos Primeiros 6 Meses de DRC Melhora Prognóstico em 48%',
        description: 'Pets que iniciam nutraterapia renal nos primeiros 6 meses após diagnóstico de DRC estágio 2 apresentam progressão 48% mais lenta comparado a início tardio (>12 meses), medido por taxa de declínio de TFG.',
        relatedConditions: ['Doença Renal Crônica', 'Insuficiência Renal'],
        relatedBreeds: ['Todas as raças', 'Maior prevalência em Cocker, Shih Tzu'],
        ageRange: '7+ anos',
        significance: 'high',
        evidence: {
          sampleSize: 3860,
          pValue: 0.0009,
          effectSize: 0.48,
          confidenceInterval: [0.41, 0.55]
        }
      },
      {
        id: 'ins-prog-003',
        discoveredAt: '2025-07-30',
        title: 'Declínio Cognitivo: Fase Pré-Clínica Identificável 18 Meses Antes de Sintomas',
        description: 'Modelo consegue identificar sinais precoces de declínio cognitivo até 18 meses antes do aparecimento de sintomas clínicos evidentes, permitindo intervenção preventiva com 76% de acurácia.',
        relatedConditions: ['Síndrome de Disfunção Cognitiva', 'Demência', 'Declínio Cognitivo'],
        relatedBreeds: ['Todas as raças', 'Maior sensibilidade em raças pequenas'],
        ageRange: '8+ anos',
        significance: 'high',
        evidence: {
          sampleSize: 4280,
          pValue: 0.0015,
          effectSize: 0.76,
          confidenceInterval: [0.69, 0.83]
        }
      }
    ],
    nextMilestone: {
      target: 150000,
      current: 95600,
      description: 'Alcançar 150.000 pets com dados longitudinais >12 meses para previsões de longo prazo'
    }
  }
];
