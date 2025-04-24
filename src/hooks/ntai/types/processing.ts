
import { NtaiAnalysisResult } from '@/types/ntai';

export interface AvailableStudy {
  id: string;
  title: string;
  description: string; // Alterado: não mais opcional
  journal: string; // Alterado: não mais opcional
  kanban_status: string;
  import_type: string;
  created_at: string;
  scispace_status?: string;
}

export interface UseNtaiProcessingReturn {
  processQueue: any[];
  selectedItems: string[];
  processingActive: boolean;
  logEntries: string[];
  activeItemIndex: number;
  analysisResult: NtaiAnalysisResult | null;
  aiConfigs: Record<string, string>;
  availableStudies: AvailableStudy[];
  toggleItemSelection: (id: string) => void;
  handleSelectAll: (estudos: any[]) => void;
  addToQueue: (estudos: any[]) => void;
  clearCompleted: () => void;
  retryFailed: () => void;
  startProcessing: () => void;
}
