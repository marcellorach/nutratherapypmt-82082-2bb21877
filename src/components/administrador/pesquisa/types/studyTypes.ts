export interface OngoingStudy {
  id: string;
  title?: string;
  title_pt?: string;
  title_en?: string;
  description?: string;
  description_pt?: string;
  description_en?: string;
  objective?: string;
  objective_pt?: string;
  objective_en?: string;
  startDate: string;
  currentDay: number;
  totalDays: number;
  treatmentCount: number;
  controlCount: number;
  phase: 'recruitment' | 'baseline' | 'intervention' | 'evaluation' | 'analysis';
  status: 'ongoing' | 'completed' | 'planned';
  progress: number;
  primaryInvestigator: string;
  breeds?: string[];
  ageRange?: string;
  ageRange_pt?: string;
  ageRange_en?: string;
  interventionType?: string;
  interventionType_pt?: string;
  interventionType_en?: string;
  notes?: string;
  notes_pt?: string;
  notes_en?: string;
  metrics?: {
    title?: string;
    title_pt?: string;
    title_en?: string;
    description?: string;
    description_pt?: string;
    description_en?: string;
    data: Array<{
      label: string;
      label_pt?: string;
      label_en?: string;
      control: number;
      treatment?: number;
      dapagliflozin?: number;
      empagliflozin?: number;
    }>;
    yAxisLabel?: string;
    yAxisLabel_pt?: string;
    yAxisLabel_en?: string;
    chartType?: 'line' | 'bar';
    formatter?: string;
  }[];
  phases?: { 
    name?: string;
    name_pt?: string;
    name_en?: string;
    day: number;
  }[];
}
