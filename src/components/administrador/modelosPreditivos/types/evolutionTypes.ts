export type ModelStatus = 'initial' | 'growing' | 'mature' | 'state-of-art';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type InsightSignificance = 'high' | 'medium' | 'low';
export type EventType = 'dataset' | 'milestone' | 'insight' | 'performance' | 'study';

export interface ConditionPerformance {
  conditionId: string;
  conditionName_pt: string;
  conditionName_en: string;
  accuracy: number;
  confidence: ConfidenceLevel;
  sampleSize: number;
  treatmentEffectiveness: number;
  trend: 'improving' | 'stable' | 'declining';
  system: string; // cardiovascular, cognitivo, articular, etc
}

export interface ModelEvolutionSnapshot {
  date: string; // ISO date
  accuracy: number;
  dataPoints: number;
  treatmentSamples: number;
  controlSamples: number;
  conditions: ConditionPerformance[];
}

export interface ProprietaryInsight {
  id: string;
  discoveredAt: string; // ISO date
  title_pt: string;
  title_en: string;
  description_pt: string;
  description_en: string;
  significance: InsightSignificance;
  relatedConditions: string[];
  relatedBreeds: string[];
  dataRequirement: number;
  evidence: {
    accuracy: number;
    sampleSize: number;
    pValue: number;
    effectSize: number;
  };
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: EventType;
  title_pt: string;
  title_en: string;
  description_pt: string;
  description_en: string;
  accuracy: number;
  dataPoints: number;
}

export interface ModelEvolution {
  modelId: string;
  modelName: string;
  status: ModelStatus;
  currentAccuracy: number;
  totalSamples: number;
  treatmentSamples: number;
  controlSamples: number;
  monthlyGrowthRate: number;
  snapshots: ModelEvolutionSnapshot[];
  insights: ProprietaryInsight[];
  timeline: TimelineEvent[];
  nextMilestone: {
    target: number;
    current: number;
    description_pt: string;
    description_en: string;
  };
}

export interface DataImpactMetrics {
  sampleSize: number;
  accuracy: number;
  marginalImprovement: number; // improvement per 1000 samples
  confidenceInterval: [number, number];
}

export interface TreatmentControlData {
  condition: string;
  treatmentOutcome: number;
  controlOutcome: number;
  pValue: number;
  effectSize: number;
  confidenceInterval: [number, number];
}
