
import { NtaiAnalysisResult } from '@/types/ntai';

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
