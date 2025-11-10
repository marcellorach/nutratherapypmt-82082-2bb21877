/**
 * Tipos para extração estruturada de dados de estudos científicos
 * Permite curadoria manual rigorosa e análise científica detalhada
 */

export type StudyType = 'RCT' | 'observational' | 'case-control' | 'cohort' | 'case-report' | 'systematic-review' | 'meta-analysis';
export type CurationStatus = 'draft' | 'verified' | 'published' | 'archived';
export type ExtractionConfidence = 'low' | 'medium' | 'high';
export type BlindingType = 'double-blind' | 'single-blind' | 'open-label';

export interface StudyFinding {
  id: string;
  study_id: string;
  nutraceutical_id: string;
  condition_id?: string;
  
  // Detalhes do protocolo do estudo
  dosage_tested: string;
  protocol_duration_days?: number;
  administration_route?: string;
  
  // Características do estudo
  sample_size: number;
  species: string; // 'canine', 'feline', 'equine', etc.
  breed_distribution?: string[];
  age_range_years?: string;
  
  // Resultados medidos
  outcome_measured: string;
  effect_size?: number;
  p_value?: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  
  // Avaliação de qualidade do estudo
  study_type: StudyType;
  study_quality_score?: number; // 0-10
  blinding?: BlindingType;
  placebo_controlled: boolean;
  
  // Dados de segurança
  adverse_events?: string[];
  dropout_rate?: number;
  
  // Principais descobertas
  conclusion: string;
  clinical_relevance?: string;
  limitations?: string;
  
  // Metadata de curadoria
  extracted_by?: string;
  extraction_date: string;
  verified_by?: string;
  verification_date?: string;
  curation_status: CurationStatus;
  extraction_confidence: ExtractionConfidence;
  
  // Metadata padrão
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StudyFindingFormData {
  study_id: string;
  nutraceutical_id: string;
  condition_id?: string;
  dosage_tested: string;
  protocol_duration_days?: number;
  administration_route?: string;
  sample_size: number;
  species: string;
  breed_distribution?: string[];
  age_range_years?: string;
  outcome_measured: string;
  effect_size?: number;
  p_value?: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  study_type: StudyType;
  study_quality_score?: number;
  blinding?: BlindingType;
  placebo_controlled: boolean;
  adverse_events?: string[];
  dropout_rate?: number;
  conclusion: string;
  clinical_relevance?: string;
  limitations?: string;
  extraction_confidence: ExtractionConfidence;
  notes?: string;
}

export interface StudyFindingWithRelations extends StudyFinding {
  study?: {
    id: string;
    title: string;
    journal?: string;
    year: number;
    authors?: string[];
    abstract?: string;
  };
  nutraceutical?: {
    id: string;
    name: string;
  };
  condition?: {
    id: string;
    name: string;
    description: string;
  };
}

export interface StudyFindingFilters {
  study_id?: string;
  nutraceutical_id?: string;
  condition_id?: string;
  species?: string;
  study_type?: StudyType;
  curation_status?: CurationStatus;
  min_quality_score?: number;
  min_sample_size?: number;
}

export interface StudyFindingStats {
  total_findings: number;
  by_status: Record<CurationStatus, number>;
  by_study_type: Record<StudyType, number>;
  by_species: Record<string, number>;
  average_quality_score: number;
  average_sample_size: number;
}
