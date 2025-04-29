
export interface NtaiAnalysisResult {
  studyId: string;
  qualityScore: number;
  relevanceScore: number;
  extractedNutraceuticals: Array<{
    name: string;
    confidence: number;
  }>;
  extractedConditions: Array<{
    name: string;
    confidence: number;
  }>;
  extractedInteractions: Array<{
    nutraceutical: string;
    interaction: string;
    confidence: number;
  }>;
  extractedSideEffects: Array<{
    description: string;
    severity: string;
    confidence: number;
  }>;
}

export interface SankeyData {
  nodes: Array<{
    name: string;
    category: string;
    value?: number;
    itemStyle?: {
      color: string;
    };
  }>;
  links: Array<{
    source: number;
    target: number;
    value: number;
    sourceName?: string;
    targetName?: string;
  }>;
}

export interface SankeyNode {
  name: string;
  category: string;
  description?: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  labelText?: string;
  studyCount?: number;
  evidenceLevel?: number;
  description?: string;
}

// Adicionando os tipos que estão faltando
export type ProcessingStage = 'idle' | 'extracting' | 'analyzing' | 'standardizing' | 'complete' | 'error';

export interface ProcessingItem {
  id: string;
  title: string;
  stage: ProcessingStage;
  progress: number;
  error?: string;
  sourceFile?: string;
  originalFormat?: string;
}

export interface NtaiAnalysisStage {
  name: string;
  description: string;
  progress: number;
  completed: boolean;
  startTime?: Date;
  endTime?: Date;
  icon: any;
}

export interface NtaiNutraceuticalTag {
  name: string;
  confidence: number;
}

export interface NtaiConditionTag {
  name: string;
  confidence: number;
  efficacyScore?: number;
}

export interface NtaiInteractionTag {
  nutraceutical: string;
  interaction: string;
  confidence: number;
}

export interface NtaiSideEffectTag {
  name: string;
  description?: string;
  severity: string;
  intensityScore?: number;
  confidence: number;
  frequency?: string;
}
