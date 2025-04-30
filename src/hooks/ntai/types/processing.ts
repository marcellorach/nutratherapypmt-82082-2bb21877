
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

export interface ProcessedNutraceutical {
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
}
