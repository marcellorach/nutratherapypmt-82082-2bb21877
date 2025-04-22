
import { NutraceuticalCondition } from './index';

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

export interface NtaiProcessingLog {
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  stage?: ProcessingStage;
}

export interface NtaiAnalysisResult {
  studyId: string;
  extractedNutraceuticals: NtaiNutraceuticalTag[];
  extractedConditions: NtaiConditionTag[];
  extractedInteractions: NtaiInteractionTag[];
  extractedSideEffects: NtaiSideEffectTag[];
  qualityScore: number;
  relevanceScore: number;
  // Novos campos
  summary: string;
  studyPopulation: StudyPopulation;
  studyDuration: string;
  studyResults: string;
  citationScore: number;
  isSimulated?: boolean; // Indica se os dados são simulados
}

export interface StudyPopulation {
  type: 'human' | 'canine' | 'feline' | 'rodent' | 'other';
  count: number;
  description: string;
}

export interface NtaiNutraceuticalTag {
  name: string;
  confidence: number; // 0-1 representing confidence in extraction
  isSimulated?: boolean;
}

export interface NtaiConditionTag {
  name: string;
  efficacyScore: number; // 0-5
  confidence: number; // 0-1 representing confidence in extraction
  isSimulated?: boolean;
}

export interface NtaiInteractionTag {
  name: string;
  score: number; // 0-5
  type: 'positive' | 'negative';
  confidence: number; // 0-1 representing confidence in extraction
  isSimulated?: boolean;
}

export interface NtaiSideEffectTag {
  name: string;
  intensityScore: number; // 0-5
  frequency: string; // e.g., "rare", "common", "very common"
  confidence: number; // 0-1 representing confidence in extraction
  isSimulated?: boolean;
}

export interface NtaiAnalysisStage {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  progress: number; // 0-100
  startTime?: Date;
  endTime?: Date;
}

export interface ProcessedStudy {
  id: string;
  study_id: string;
  analysis_data: NtaiAnalysisResult;
  created_at: string;
  kanban_status: string;
  processed_by: string;
}

export interface NtaiPromptConfig {
  id: string;
  name: string;
  description: string;
  prompt: string;
  systemPrompt?: string;
  stage: 'summary' | 'nutraceuticals' | 'conditions' | 'interactions' | 'additional';
  active: boolean;
}
