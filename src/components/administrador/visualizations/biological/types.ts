export interface BiologicalNode {
  id: string;
  label: string;
  type: 'nutraceutical' | 'mechanism' | 'effect' | 'outcome' | 'side_effect';
  layer: number; // 0=nutraceutical, 1=mechanism, 2=effect, 3=outcome
  value?: number;
  confidence?: number;
  title?: string;
  metadata?: {
    mechanismType?: 'pathway' | 'enzyme' | 'receptor' | 'mediator' | 'gene' | 'protein';
    effectType?: 'intermediate' | 'direct';
    action?: string;
  };
}

export interface BiologicalLink {
  id?: string;
  from: string;
  to: string;
  type: 'inhibition' | 'stimulation' | 'modulation';
  confidence?: number;
  label?: string;
  title?: string;
}

export interface BiologicalNetworkData {
  nodes: BiologicalNode[];
  links: BiologicalLink[];
}

export interface ExtractedData {
  extractedNutraceuticals?: Array<{ 
    name: string; 
    confidence?: number;
    dosage?: string;
    form?: string;
  }>;
  extractedMechanisms?: Array<{ 
    name: string; 
    type?: 'pathway' | 'enzyme' | 'receptor' | 'mediator' | 'gene' | 'protein'; 
    confidence?: number;
  }>;
  extractedEffects?: Array<{ 
    name: string; 
    type?: 'intermediate' | 'direct'; 
    confidence?: number;
  }>;
  extractedConditions?: Array<{ 
    name: string; 
    confidence?: number;
  }>;
  extractedInteractions?: Array<{ 
    from?: string;
    to?: string;
    nutraceutical?: string; // formato antigo
    interaction?: string; // formato antigo
    type?: 'inhibition' | 'stimulation' | 'modulation';
    confidence?: number;
    description?: string;
  }>;
  extractedSideEffects?: Array<{ 
    name: string; 
    description?: string;
    severity?: string;
    confidence?: number;
  }>;
  // Stage 2 fields
  molecularMechanisms?: Array<{
    name: string;
    type?: string;
    action?: string;
    target?: string;
    downstream_effects?: string[];
    category?: string;
    confidence?: number;
  }>;
  synergies?: Array<{
    compound1?: string;
    compound2?: string;
    compound?: string;
    name?: string;
    synergy_type?: string;
    effect?: string;
    magnitude?: number;
    confidence?: number;
  }>;
  hierarchicalRelations?: Array<{
    from: string;
    from_type?: string;
    to: string;
    to_type?: string;
    relation_type?: string;
    confidence?: number;
  }>;
  // Stage 3 fields
  dosages?: Array<{
    compound?: string;
    amount?: number;
    unit?: string;
    frequency?: string;
    duration?: string;
    species?: string;
    condition?: string;
    route?: string;
  }>;
  detailedSideEffects?: Array<{
    name: string;
    description?: string;
    severity?: string;
    frequency?: string;
    dose_dependent?: boolean;
    reversibility?: string;
    confidence?: number;
  }>;
  contraindications?: Array<{
    name?: string;
    contraindication?: string;
    severity?: string;
  }>;
  clinicalOutcomes?: Array<{
    outcome?: string;
    outcome_type?: string;
    p_value?: string;
    effect_size?: string;
    significance?: string;
  }>;
}
