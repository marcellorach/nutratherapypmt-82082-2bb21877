
export type InsightType = 'longitudinal-discovery' | 'new-study' | 'efficacy-analysis';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface InsightOverview {
  summary: string;
  basedOn: string[];
  methodology?: string;
  markers?: string[];
}

export interface InsightEvidence {
  dataSource: string;
  sampleSize: number;
  timeframe: string;
  statisticalSignificance?: string;
  findings: string[];
}

export interface StudyPopulation {
  totalDogs: number;
  ageRange: string;
  duration: string;
  groups: {
    placebo: number;
    treatment: number;
  };
}

export interface BreedInfo {
  name: string;
  condition: string;
  volunteers: number;
}

export interface InsightResources {
  studyPopulation: StudyPopulation;
  sizeDistribution: {
    small: number;
    medium: number;
    large: number;
  };
  breeds: BreedInfo[];
}

export interface ApprovalStage {
  stage: string;
  status: ApprovalStatus;
  date?: string;
}

export interface InsightRecommendation {
  action: string;
  priority: Priority;
  impact: string;
}

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  confidence: number;
  discoveredAt: string;
  overview: InsightOverview;
  evidence: InsightEvidence;
  resources?: InsightResources;
  approvalChain?: ApprovalStage[];
  recommendation: InsightRecommendation;
}
