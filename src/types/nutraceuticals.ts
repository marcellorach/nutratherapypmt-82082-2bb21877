
/**
 * Tipos consolidados para nutracêuticos
 * Centraliza todas as interfaces relacionadas a nutracêuticos
 */

export interface NutraceuticalBase {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  data_type?: 'production' | 'seed' | 'mock' | 'import';
  batch_id?: string;
}

export interface NutraceuticalCore extends NutraceuticalBase {
  source?: string;
  dosage?: string;
  chemical_compound?: string;
  contraindications?: string[];
  import_id?: string;
  import_batch?: string;
}

export interface NutraceuticalCondition {
  id: string;
  relationship_type: 'prevention' | 'treatment' | 'support';
  efficacy_score: number;
  notes?: string;
  condition: HealthCondition;
  
  // Enhanced scientific metadata
  study_convergence_score?: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  sample_size_total?: number;
  species_distribution?: Record<string, number>;
  contraindications_conditions?: string[];
  interaction_warnings?: string[];
  adverse_events_reported?: string[];
  last_reviewed_at?: string;
  reviewed_by?: string;
  curation_status?: 'draft' | 'reviewed' | 'verified' | 'published' | 'archived';
  evidence_quality?: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
}

export interface NutraceuticalBenefit {
  id: string;
  benefit: string;
}

export interface NutraceuticalStudy {
  id: string;
  relevance_score: number;
  study: ScientificStudy;
}

export interface NutraceuticalMetadata {
  id: string;
  efficacy_score: number;
  sustainability_score: number;
  notes?: string;
}

export interface NutraceuticalOutcome {
  id: string;
  name: string;
  description?: string;
}

export interface HealthCondition {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  data_type?: 'production' | 'seed' | 'mock' | 'import';
  batch_id?: string;
}

export interface ScientificStudy {
  id: string;
  title: string;
  link: string;
  journal?: string;
  year: number;
  authors?: string[];
  abstract?: string;
  created_at: string;
  updated_at: string;
  data_type?: 'production' | 'seed' | 'mock' | 'import';
  batch_id?: string;
}

export interface NutraceuticalWithRelations extends NutraceuticalCore {
  outcome?: NutraceuticalOutcome | null;
  nutraceutical_benefits: NutraceuticalBenefit[];
  nutraceutical_scientific_metadata: NutraceuticalMetadata[];
  nutraceutical_health_conditions: NutraceuticalCondition[];
  nutraceutical_studies: NutraceuticalStudy[];
}

// Tipos para componentes e estados
export interface NutraceuticalTableData {
  nutraceuticals: NutraceuticalWithRelations[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  filteredCount: number;
}

export interface NutraceuticalFormData {
  name: string;
  description?: string;
  source?: string;
  dosage?: string;
  chemical_compound?: string;
  contraindications?: string[];
}

export interface NutraceuticalFilters {
  searchTerm: string;
  dataType?: 'production' | 'seed' | 'mock' | 'import';
  hasConditions?: boolean;
  hasStudies?: boolean;
  efficacyRange?: [number, number];
}

// Tipos para operações de dados
export interface NutraceuticalQueryOptions {
  includeRelations?: boolean;
  dataTypes?: string[];
  limit?: number;
  offset?: number;
  filters?: NutraceuticalFilters;
}

export interface NutraceuticalMutationResult {
  success: boolean;
  data?: NutraceuticalWithRelations;
  error?: string;
}

// Tipos para relacionamentos
export interface RelationshipCreateData {
  nutraceutical_id: string;
  condition_id?: string;
  study_id?: string;
  outcome_id?: string;
  relationship_type?: 'prevention' | 'treatment' | 'support';
  efficacy_score?: number;
  relevance_score?: number;
  notes?: string;
}

// Tipos para migração e dados mock
export interface DataMigrationOptions {
  includeRelations: boolean;
  dataType: 'seed' | 'mock';
  batchId?: string;
  count?: number;
}

export interface MockDataGenerationOptions {
  count: number;
  includeRelations: boolean;
  dataType: 'seed' | 'mock';
  batchId?: string;
}
