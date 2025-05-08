
export interface OngoingStudy {
  id: string;
  title: string;
  description: string;
  objective: string;
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
  interventionType?: string;
  notes?: string;
  metrics?: {
    title: string;
    description?: string;
    data: Array<{
      label: string;
      control: number;
      treatment: number;
    }>;
    yAxisLabel?: string;
    chartType?: 'line' | 'bar';
    formatter?: string; // 'percent', 'number', etc.
  }[];
  phases?: { name: string; day: number }[];
}
