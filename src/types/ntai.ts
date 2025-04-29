
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
