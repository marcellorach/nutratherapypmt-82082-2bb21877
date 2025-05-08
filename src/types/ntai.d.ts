
export type ProcessingStage = 'idle' | 'extracting' | 'analyzing' | 'standardizing' | 'complete' | 'error';

export interface ProcessingItem {
  id: string;
  title: string;
  stage: ProcessingStage;
  progress: number;
  sourceFile?: string;
  originalFormat?: string;
  error?: string;
  importedAt?: string; // Propriedade adicionada para exibir a data de importação
}

export interface ExtractedNutraceutical {
  name: string;
  dosage?: string;
  target?: string;
  effects?: string[];
  interactions?: string[];
  confidence?: number;
}

export interface ExtractedCondition {
  name: string;
  description?: string;
  interventions?: string[];
  relevance?: number;
  confidence?: number;
}

export interface ExtractedInteraction {
  nutraceutical: string;
  otherSubstance: string;
  effect: string;
  severity: 'low' | 'medium' | 'high';
  recommendation?: string;
}

export interface ExtractedSideEffect {
  effect: string;
  severity: 'low' | 'medium' | 'high';
  frequency?: string;
  relatedNutraceuticals?: string[];
}

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
    name: string;
    description: string;
    severity: string;
    confidence: number;
  }>;
  nutraceuticals?: Array<{
    name: string;
    description?: string;
    chemical_compound?: string;
    source?: string;
    dosage?: string;
    category?: string;
    conditions?: Array<{
      name: string;
      description?: string;
      relationship_type?: string;
      efficacy_score?: number;
    }>;
    relevance?: number;
  }>;
}
