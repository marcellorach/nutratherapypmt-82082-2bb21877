
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
  studyTitle?: string;
  studyAuthors?: string[];
  studyYear?: number;
  studyJournal?: string;
  extractedNutraceuticals?: ExtractedNutraceutical[];
  extractedConditions?: ExtractedCondition[];
  extractedInteractions?: ExtractedInteraction[];
  extractedSideEffects?: ExtractedSideEffect[];
  studyQuality?: number;
  studyRelevance?: number;
  processingTime?: number;
  processingStatus?: string;
  summary?: string;
  warnings?: string[];
}
