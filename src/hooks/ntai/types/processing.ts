
export interface AvailableStudy {
  id: string;
  title: string;
  description?: string;
  journal?: string;
  kanban_status: string;
  import_type: string;
  created_at: string;
}

export interface ProcessingItem {
  id: string;
  title: string;
  stage: 'idle' | 'extracting' | 'analyzing' | 'standardizing' | 'complete' | 'error';
  progress: number;
  sourceFile: string;
  originalFormat: string;
  error?: string;
}
