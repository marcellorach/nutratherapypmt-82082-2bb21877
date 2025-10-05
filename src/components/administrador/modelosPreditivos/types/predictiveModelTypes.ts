export interface DataSource {
  type: 'clinical_monitoring' | 'nutritherapy_monitoring' | 'control_group' | 'lab_exams' | 'scientific_studies' | 'anamnesis' | 'wearables';
  percentage: number;
  sampleCount: number;
  label: string;
  description: string;
}

export interface DegenerativeInsight {
  id: string;
  discoveredAt: string;
  title: string;
  description: string;
  relatedConditions: string[];
  relatedBreeds: string[];
  ageRange: string;
  significance: 'high' | 'medium' | 'low';
  evidence: {
    sampleSize: number;
    pValue: number;
    effectSize: number;
    confidenceInterval: [number, number];
  };
}

export interface PredictiveModel {
  modelId: string;
  modelName: string;
  algorithm: string;
  algorithmShortName: string;
  status: 'state-of-art' | 'mature' | 'growing' | 'initial';
  currentAccuracy: number;
  trainedAt: string;
  description: string;
  
  // Métricas de volume
  totalPetsMonitored: number;
  treatmentGroup: number;
  controlGroup: number;
  monthlyGrowthRate: number;
  
  // Fontes de dados
  dataSources: DataSource[];
  
  // Evolução temporal
  performanceHistory: {
    date: string;
    accuracy: number;
    petsMonitored: number;
  }[];
  
  // Descobertas sobre doenças degenerativas
  degenerativeInsights: DegenerativeInsight[];
  
  // Próxima meta
  nextMilestone: {
    target: number;
    current: number;
    description: string;
  };
}
