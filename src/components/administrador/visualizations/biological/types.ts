export interface BiologicalNode {
  id: string;
  label: string;
  type: 'nutraceutical' | 'mechanism' | 'effect' | 'outcome' | 'side_effect';
  layer: number; // 0=nutraceutical, 1=mechanism, 2=effect, 3=outcome
  value?: number;
  confidence?: number;
  title?: string;
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
  extractedNutraceuticals?: Array<{ name: string; confidence: number }>;
  extractedConditions?: Array<{ name: string; confidence: number }>;
  extractedInteractions?: Array<{ 
    nutraceutical: string; 
    interaction: string; 
    confidence: number 
  }>;
  extractedSideEffects?: Array<{ 
    name: string; 
    description: string;
    severity: string;
    confidence: number 
  }>;
}
