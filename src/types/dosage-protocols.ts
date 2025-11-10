/**
 * Tipos para protocolos de dosagem estratificados
 * Suporta análise individualizada por IA baseada em características do paciente
 */

export interface DosageProtocol {
  id: string;
  nutraceutical_id: string;
  condition_id: string;
  
  // Estratificação
  weight_min_kg?: number;
  weight_max_kg?: number;
  breed_specific?: string[];
  age_min_years?: number;
  age_max_years?: number;
  
  // Informações de dosagem
  dosage_amount: number;
  dosage_unit: string; // 'mg', 'ml', 'g', 'mcg', etc.
  frequency_per_day: number;
  administration_route?: string; // 'oral', 'topical', 'injection', etc.
  duration_days?: number;
  
  // Modificadores clínicos
  severity_modifier?: 'mild' | 'moderate' | 'severe';
  titration_protocol?: string;
  
  // Base científica
  based_on_study_ids?: string[];
  confidence_level: 'low' | 'medium' | 'high';
  
  // Metadata
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_reviewed_at?: string;
  reviewed_by?: string;
  is_active: boolean;
}

export interface DosageProtocolFormData {
  nutraceutical_id: string;
  condition_id: string;
  weight_min_kg?: number;
  weight_max_kg?: number;
  breed_specific?: string[];
  age_min_years?: number;
  age_max_years?: number;
  dosage_amount: number;
  dosage_unit: string;
  frequency_per_day: number;
  administration_route?: string;
  duration_days?: number;
  severity_modifier?: 'mild' | 'moderate' | 'severe';
  titration_protocol?: string;
  based_on_study_ids?: string[];
  confidence_level: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface DosageCalculationInput {
  nutraceutical_id: string;
  condition_id: string;
  patient_weight_kg: number;
  patient_age_years: number;
  patient_breed?: string;
  condition_severity?: 'mild' | 'moderate' | 'severe';
}

export interface DosageCalculationResult {
  protocol: DosageProtocol;
  recommended_dosage: number;
  dosage_unit: string;
  frequency_per_day: number;
  administration_route?: string;
  duration_days?: number;
  confidence_level: 'low' | 'medium' | 'high';
  warnings?: string[];
  supporting_studies?: string[];
}

export interface DosageProtocolFilters {
  nutraceutical_id?: string;
  condition_id?: string;
  is_active?: boolean;
  confidence_level?: 'low' | 'medium' | 'high';
  min_weight?: number;
  max_weight?: number;
}
