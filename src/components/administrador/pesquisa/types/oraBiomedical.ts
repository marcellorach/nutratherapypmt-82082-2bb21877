
export interface Study {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  progress: number; // 0-100
  compounds: number;
  positiveResults?: number;
  status: 'ongoing' | 'completed' | 'planned';
  primaryInvestigator: string;
  priority: 'high' | 'medium' | 'low';
  alerts?: number;
  category?: 'geroproptetor' | 'antiinflamatório' | 'neuroprotetor' | 'metabólico';
  targetSpecies?: string[];
  objective?: string; // Adicionando a propriedade objective como opcional
}
