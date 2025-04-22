
import { NtaiAnalysisResult, ProcessingStage } from '@/types/ntai';

export interface ProcessingItem {
  id: string;
  title: string;
  stage: ProcessingStage;
  progress: number;
  error?: string;
  sourceFile?: string;
  originalFormat?: string;
}

export interface NtaiQueueState {
  processQueue: ProcessingItem[];
  selectedItems: string[];
  processingActive: boolean;
  activeItemIndex: number;
  analysisResult: NtaiAnalysisResult | null;
}

export interface NtaiConfigState {
  aiConfigs: Record<string, string>;
}

export interface NtaiLogState {
  logEntries: string[];
}
