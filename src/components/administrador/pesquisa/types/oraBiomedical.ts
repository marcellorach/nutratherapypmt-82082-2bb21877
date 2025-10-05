export interface Publication {
  journal: string;
  journal_pt?: string;
  journal_en?: string;
  status: 'não submetido' | 'submetido' | 'em revisão' | 'aceito' | 'publicado' | 'negado';
  submissionDate?: string;
  publicationDate?: string;
  title: string;
  title_pt?: string;
  title_en?: string;
  doi?: string;
  impactFactor?: number;
  authors: string;
  journalType?: 'internacional' | 'nacional';
  journalCategory?: 'veterinária' | 'biomédica' | 'geral';
}

export interface Study {
  id: string;
  title: string;
  title_pt?: string;
  title_en?: string;
  description: string;
  description_pt?: string;
  description_en?: string;
  startDate: string;
  endDate?: string;
  progress: number;
  compounds: number;
  positiveResults?: number;
  status: 'ongoing' | 'completed' | 'planned';
  primaryInvestigator: string;
  priority: 'high' | 'medium' | 'low';
  alerts?: number;
  category?: 'geroproptetor' | 'antiinflamatório' | 'neuroprotetor' | 'metabólico';
  targetSpecies?: string[];
  objective?: string;
  objective_pt?: string;
  objective_en?: string;
  interventionData?: {
    earlyIntervention: CElegansData;
    midLifeIntervention: CElegansData;
  };
  publications?: Publication[];
  studyPopulation?: number;
  duration?: string;
  duration_pt?: string;
  duration_en?: string;
  quantitativeResults?: {
    lifeExtension?: string;
    lifeExtension_pt?: string;
    lifeExtension_en?: string;
    pValue?: string;
    statisticalPower?: string;
    effect?: string;
    effect_pt?: string;
    effect_en?: string;
  };
}

export interface DataPoint {
  age: number;
  control: number;
  lowIntervention: number;
  highIntervention: number;
}

export interface CElegansData {
  survivalRate: DataPoint[];
  healthyRate: DataPoint[];
  stressResponseRate: DataPoint[];
  stressHealthyRate: DataPoint[];
}
