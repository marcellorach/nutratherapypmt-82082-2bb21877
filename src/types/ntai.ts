
// Stage 2 - Molecular Mechanisms
export interface MolecularMechanism {
  name: string;
  type: 'pathway' | 'enzyme' | 'receptor' | 'gene' | 'protein' | 'mediator';
  action: 'inhibition' | 'activation' | 'modulation';
  target?: string;
  downstream_effects?: string[];
  category?: 'inflammatory' | 'oxidative_stress' | 'metabolic' | 'immunomodulatory' | 'neuroprotective' | 'other';
}

export interface Synergy {
  compound1: string;
  compound2: string;
  synergy_type: 'bioavailability_enhancement' | 'efficacy_enhancement' | 'antagonism' | 'potentiation' | 'additive';
  effect: string;
  magnitude?: number;
}

export interface HierarchicalRelation {
  from: string;
  from_type: 'nutraceutical' | 'mechanism' | 'effect' | 'condition';
  to: string;
  to_type: 'nutraceutical' | 'mechanism' | 'effect' | 'condition';
  relation_type: string;
}

// Stage 3 - Clinical Context
export interface ContextualDosage {
  compound: string;
  amount?: number;
  amount_min?: number;
  amount_max?: number;
  amount_text?: string;
  unit: string;
  per_body_weight?: boolean;
  frequency?: string;
  duration?: string;
  species?: 'human' | 'canine' | 'feline' | 'equine' | 'rodent' | 'other';
  condition?: string;
  route?: 'oral' | 'topical' | 'intravenous' | 'subcutaneous' | 'other';
  source?: string;
}

export interface DetailedSideEffect {
  name: string;
  description?: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  frequency?: 'very_common' | 'common' | 'uncommon' | 'rare' | 'very_rare' | 'unknown';
  dose_dependent?: boolean;
  reversibility?: 'reversible' | 'irreversible' | 'unknown';
}

export interface ClinicalOutcome {
  outcome: string;
  outcome_type: 'primary' | 'secondary';
  p_value?: string;
  effect_size?: string;
  significance?: 'significant' | 'not_significant' | 'not_reported';
}

export interface StudyAssessment {
  sample_size?: number;
  study_duration?: string;
  randomization?: boolean;
  blinding?: 'single' | 'double' | 'triple' | 'none';
  placebo_controlled?: boolean;
  quality_score?: number;
  limitations?: string[];
}

export interface NtaiAnalysisResult {
  studyId: string;
  qualityScore: number;
  relevanceScore: number;
  
  // Stage 1 - Basic Entities
  nutraceuticals?: Array<{
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
  }>;
  extractedNutraceuticals: Array<{
    name: string;
    confidence: number;
  }>;
  extractedConditions: Array<{
    name: string;
    confidence: number;
  }>;
  extractedInteractions: Array<{
    nutraceutical: string;
    interaction: string;
    confidence: number;
  }>;
  extractedSideEffects: Array<{
    name: string;
    description: string;
    severity: string;
    confidence: number;
  }>;
  
  // Stage 2 - Molecular Mechanisms & Relations
  molecularMechanisms?: MolecularMechanism[];
  synergies?: Synergy[];
  hierarchicalRelations?: HierarchicalRelation[];
  
  // Stage 3 - Clinical Context
  dosages?: ContextualDosage[];
  detailedSideEffects?: DetailedSideEffect[];
  contraindications?: string[];
  clinicalOutcomes?: ClinicalOutcome[];
  studyAssessment?: StudyAssessment;
  
  // Metadata
  extractionStages?: string[];
}

export interface SankeyData {
  nodes: Array<{
    name: string;
    category: string;
    value?: number;
    itemStyle?: {
      color: string;
    };
  }>;
  links: Array<{
    source: number;
    target: number;
    value: number;
    sourceName?: string;
    targetName?: string;
  }>;
}

export interface SankeyNode {
  name: string;
  category: string;
  description?: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  labelText?: string;
  studyCount?: number;
  evidenceLevel?: number;
  description?: string;
}

// Tipos de processamento
export type ProcessingStage = 'idle' | 'extracting' | 'analyzing' | 'standardizing' | 'complete' | 'error';

export interface ProcessingItem {
  id: string;
  title: string;
  stage: ProcessingStage;
  progress: number;
  error?: string;
  sourceFile?: string;
  originalFormat?: string;
}

export interface NtaiAnalysisStage {
  name: string;
  description: string;
  progress: number;
  completed: boolean;
  startTime?: Date;
  endTime?: Date;
  icon: any;
}

export interface NtaiNutraceuticalTag {
  name: string;
  confidence: number;
}

export interface NtaiConditionTag {
  name: string;
  confidence: number;
  efficacyScore?: number;
}

export interface NtaiInteractionTag {
  nutraceutical: string;
  interaction: string;
  confidence: number;
}

export interface NtaiSideEffectTag {
  name: string;
  description?: string;
  severity: string;
  intensityScore?: number;
  confidence: number;
  frequency?: string;
}
