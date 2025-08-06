
export interface Publication {
  journal: string;
  status: 'não submetido' | 'submetido' | 'em revisão' | 'aceito' | 'publicado' | 'negado';
  submissionDate?: string;
  publicationDate?: string;
  title: string;
  doi?: string;
  impactFactor?: number;
}

export interface Study {
  id: string;
  title: string;
  description: string;
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
  interventionData?: {
    earlyIntervention: CElegansData;
    midLifeIntervention: CElegansData;
  };
  publications?: Publication[];
  studyPopulation?: number;
  duration?: string;
  quantitativeResults?: {
    lifeExtension?: string;
    pValue?: string;
    statisticalPower?: string;
    effect?: string;
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
