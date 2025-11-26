/**
 * Enhanced NTAI Types - Schema expandido com 12 dimensões
 * Suporta extração científica completa com scoring e validação
 */

// ==================== METADADOS DO ESTUDO ====================

export interface StudyMetadata {
  title: string;
  title_en?: string;
  authors: string[];
  year?: number;
  journal?: string;
  doi?: string;
  abstract?: string;
  abstract_en?: string;
  keywords?: string[];
  study_type: StudyType;
  language: string;
}

export type StudyType = 
  | 'randomized_controlled_trial'
  | 'meta_analysis'
  | 'systematic_review'
  | 'observational_study'
  | 'case_control'
  | 'cohort_study'
  | 'case_report'
  | 'in_vitro'
  | 'in_vivo'
  | 'review';

// ==================== NUTRACÊUTICOS EXPANDIDOS ====================

export interface EnhancedNutraceutical {
  name: string;
  name_en: string;
  synonyms: string[]; // Ex: ["Curcumina", "Curcumin", "E100", "Diferuloilmetano"]
  chemical_compounds?: string[]; // Compostos químicos específicos
  form: NutraceuticalForm;
  source?: string; // Fonte natural (ex: "Curcuma longa root")
  source_en?: string;
  
  // Dosagem com contexto
  dosage_range?: string; // Ex: "500-2000mg"
  dosage_unit?: string; // Ex: "mg/day"
  dosage_context?: string; // Ex: "divided in 2 doses with meals"
  
  // Biodisponibilidade
  bioavailability_notes?: string;
  bioavailability_score?: number; // 1-5
  
  // Scoring
  efficacy_score?: number; // 1-5
  safety_score?: number; // 1-5
  evidence_quality?: EvidenceQuality;
  
  // Confiança da extração
  extraction_confidence: ConfidenceScore;
}

export type NutraceuticalForm = 
  | 'pure_extract'
  | 'standardized_extract'
  | 'whole_plant'
  | 'isolated_compound'
  | 'synthetic'
  | 'combination'
  | 'nano_formulation'
  | 'liposomal'
  | 'other';

// ==================== SINERGIAS E INTERAÇÕES ====================

export interface NutraceuticalSynergy {
  compound1: string; // Nome do nutracêutico 1
  compound2: string; // Nome do nutracêutico 2
  synergy_type: SynergyType;
  effect: string; // Descrição do efeito sinérgico
  effect_en: string;
  mechanism?: string; // Mecanismo da sinergia
  magnitude?: number; // Magnitude do efeito (ex: 3x aumento)
  confidence: ConfidenceScore;
  citations?: string[]; // Referências no documento
}

export type SynergyType = 
  | 'bioavailability_enhancement' // Ex: piperina aumenta absorção de curcumina
  | 'efficacy_enhancement' // Efeitos combinados
  | 'antagonism' // Efeitos opostos
  | 'potentiation' // Um potencializa o outro
  | 'additive' // Efeitos somados
  | 'protective'; // Um protege contra efeitos do outro

export interface NutraceuticalInteraction {
  nutraceutical: string;
  interacts_with: string; // Outro nutracêutico, droga ou alimento
  interaction_type: 'positive' | 'negative' | 'neutral';
  description: string;
  description_en: string;
  clinical_significance?: 'high' | 'medium' | 'low';
  recommendation?: string;
  confidence: ConfidenceScore;
}

// ==================== MECANISMOS MOLECULARES EXPANDIDOS ====================

export interface MolecularMechanism {
  name: string; // Ex: "NF-κB pathway inhibition"
  name_en: string;
  type: MechanismType;
  category: MechanismCategory;
  
  // Ação molecular
  action: MolecularAction; // inhibition, activation, modulation
  target: string; // Alvo molecular específico
  
  // Cascata downstream
  downstream_effects?: string[];
  upstream_regulators?: string[];
  
  // Localização
  cellular_location?: string; // Ex: "cytoplasm", "nucleus", "membrane"
  tissue_specificity?: string[];
  
  // Descrição e contexto
  description: string;
  description_en: string;
  
  // Evidência
  evidence_type?: string[]; // Ex: ["in_vitro", "in_vivo", "clinical"]
  confidence: ConfidenceScore;
  
  // Citações
  mentions_count?: number; // Quantas vezes mencionado no documento
  citations?: string[]; // Partes do texto que mencionam
}

export type MechanismType = 
  | 'pathway'
  | 'enzyme'
  | 'receptor'
  | 'gene'
  | 'protein'
  | 'mediator'
  | 'signaling_molecule'
  | 'transcription_factor';

export type MechanismCategory =
  | 'inflammatory'
  | 'oxidative_stress'
  | 'metabolic'
  | 'apoptotic'
  | 'proliferative'
  | 'immunomodulatory'
  | 'neuroprotective'
  | 'cardioprotective'
  | 'other';

export type MolecularAction = 'inhibition' | 'activation' | 'modulation' | 'regulation';

// ==================== EFEITOS BIOLÓGICOS ====================

export interface BiologicalEffect {
  name: string;
  name_en: string;
  type: BiologicalEffectType;
  category: string; // Ex: "inflammatory_marker", "oxidative_marker"
  
  // Descrição
  description: string;
  description_en: string;
  
  // Medição
  measurement_type?: string; // Ex: "serum_level", "tissue_expression"
  measurement_unit?: string; // Ex: "pg/mL", "fold_change"
  baseline_value?: string;
  post_intervention_value?: string;
  change_percentage?: number;
  
  // Significância
  statistical_significance?: boolean;
  p_value?: string;
  
  // Confiança
  confidence: ConfidenceScore;
}

export type BiologicalEffectType = 
  | 'biomarker' // Marcador mensurável
  | 'cytokine' // Citocinas
  | 'enzyme_activity' // Atividade enzimática
  | 'gene_expression' // Expressão gênica
  | 'tissue_change' // Mudança tecidual
  | 'cellular_response' // Resposta celular
  | 'physiological'; // Mudança fisiológica

// ==================== CONDIÇÕES DE SAÚDE EXPANDIDAS ====================

export interface HealthCondition {
  name: string;
  name_en: string;
  synonyms?: string[];
  icd10_code?: string;
  
  // Classificação
  category: string;
  category_en: string;
  severity: ConditionSeverity;
  
  // Espécie
  species: Species[];
  breed_specific?: string[]; // Raças específicas mencionadas
  
  // Relação com nutracêutico
  relationship_type: RelationshipType;
  
  // Eficácia
  efficacy_description?: string;
  efficacy_description_en?: string;
  treatability_score?: number; // 1-5
  
  // Evidência
  evidence_level: EvidenceLevel;
  study_design?: StudyType;
  sample_size?: number;
  duration?: string; // Duração do estudo
  
  // Outcomes clínicos
  primary_outcome?: string;
  secondary_outcomes?: string[];
  adverse_events?: string[];
  
  // Estatísticas
  p_value?: string;
  effect_size?: string;
  confidence_interval?: string;
  
  // Confiança
  confidence: ConfidenceScore;
}

export type Species = 'human' | 'canine' | 'feline' | 'equine' | 'other';

export type ConditionSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export type RelationshipType = 'treatment' | 'prevention' | 'support' | 'contraindication';

export type EvidenceLevel = 
  | 'level_1a' // Meta-análise de RCTs
  | 'level_1b' // RCT individual
  | 'level_2a' // Estudo de coorte
  | 'level_2b' // Estudo caso-controle
  | 'level_3' // Série de casos
  | 'level_4' // Opinião de especialista
  | 'level_5'; // In vitro / In vivo

export type EvidenceQuality = 'high' | 'moderate' | 'low' | 'very_low';

// ==================== EFEITOS COLATERAIS DETALHADOS ====================

export interface SideEffect {
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  
  // Gravidade
  severity: SideEffectSeverity;
  frequency: SideEffectFrequency;
  
  // Dependência de dose
  dose_dependent: boolean;
  threshold_dose?: string;
  
  // Contexto
  risk_factors?: string[]; // Fatores que aumentam o risco
  reversibility: 'reversible' | 'irreversible' | 'unknown';
  time_to_onset?: string;
  duration?: string;
  
  // Manejo
  management_strategy?: string;
  contraindications?: string[];
  
  // Confiança
  confidence: ConfidenceScore;
}

export type SideEffectSeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';

export type SideEffectFrequency = 
  | 'very_common' // >10%
  | 'common' // 1-10%
  | 'uncommon' // 0.1-1%
  | 'rare' // 0.01-0.1%
  | 'very_rare' // <0.01%
  | 'unknown';

// ==================== DOSAGENS COM CONTEXTO ====================

export interface ContextualDosage {
  compound: string;
  amount: number;
  unit: string;
  frequency: string; // Ex: "twice daily", "once daily"
  duration?: string; // Ex: "12 weeks", "6 months"
  
  // Contexto
  species: Species;
  condition: string;
  study_arm?: string; // Ex: "treatment_group", "high_dose_group"
  
  // Administração
  route: AdministrationRoute;
  timing?: string; // Ex: "with meals", "on empty stomach"
  formulation?: string;
  
  // Outcomes
  outcomes?: string[];
  adverse_events?: string[];
  
  // Referência
  source_reference?: string; // Localização no documento
  confidence: ConfidenceScore;
}

export type AdministrationRoute = 
  | 'oral'
  | 'topical'
  | 'intravenous'
  | 'subcutaneous'
  | 'intramuscular'
  | 'inhalation'
  | 'other';

// ==================== AVALIAÇÃO DE EVIDÊNCIA DO ESTUDO ====================

export interface StudyEvidenceAssessment {
  study_type: StudyType;
  evidence_level: EvidenceLevel;
  
  // Metodologia
  sample_size?: number;
  study_duration?: string;
  randomization: boolean;
  blinding?: 'single' | 'double' | 'triple' | 'none';
  placebo_controlled: boolean;
  
  // Estatística
  statistical_significance: boolean;
  primary_p_value?: string;
  confidence_intervals?: string[];
  effect_sizes?: string[];
  
  // Qualidade
  quality_score: number; // 1-5
  risk_of_bias?: 'low' | 'moderate' | 'high' | 'unclear';
  
  // Limitações
  limitations: string[];
  limitations_en: string[];
  
  // Conflitos de interesse
  funding_source?: string;
  conflicts_declared: boolean;
  
  // Relevância clínica
  clinical_relevance: 'high' | 'moderate' | 'low';
  applicability_score: number; // 1-5
}

// ==================== CONFIDENCE SCORING ====================

export interface ConfidenceScore {
  overall: number; // 0-1
  llm_confidence: number; // 0-1 (confiança do modelo)
  kg_match_score?: number; // 0-1 (match com knowledge graph existente)
  mention_frequency?: number; // Quantas vezes mencionado
  citation_count?: number; // Quantas citações no documento
  cross_validation?: boolean; // Validado por múltiplas fontes no doc
}

// ==================== EXTRAÇÃO COMPLETA ENHANCED ====================

export interface EnhancedExtractionResult {
  // Metadados
  metadata: StudyMetadata;
  
  // Texto completo para RAG
  full_text: string;
  
  // Nutracêuticos expandidos
  nutraceuticals: EnhancedNutraceutical[];
  
  // Sinergias e interações
  synergies: NutraceuticalSynergy[];
  interactions: NutraceuticalInteraction[];
  
  // Mecanismos moleculares
  molecular_mechanisms: MolecularMechanism[];
  
  // Efeitos biológicos
  biological_effects: BiologicalEffect[];
  
  // Condições de saúde
  health_conditions: HealthCondition[];
  
  // Efeitos colaterais
  side_effects: SideEffect[];
  
  // Dosagens com contexto
  dosages: ContextualDosage[];
  
  // Relações hierárquicas (para Neo4j)
  hierarchical_relations: HierarchicalRelation[];
  
  // Avaliação do estudo
  study_assessment: StudyEvidenceAssessment;
  
  // Scores gerais
  overall_quality_score: number; // 1-5
  overall_relevance_score: number; // 1-5
  
  // Metadados da extração
  extraction_metadata: {
    model_used: string;
    extraction_date: string;
    extraction_stages_completed: string[];
    processing_time_ms?: number;
  };
}

export interface HierarchicalRelation {
  from: string;
  from_type: 'nutraceutical' | 'mechanism' | 'effect' | 'condition';
  to: string;
  to_type: 'nutraceutical' | 'mechanism' | 'effect' | 'condition';
  relation_type: string;
  direction: 'forward' | 'backward' | 'bidirectional';
  confidence: ConfidenceScore;
  evidence_text?: string; // Texto do documento que suporta a relação
}

// ==================== COMPATIBILIDADE COM TIPOS ANTIGOS ====================

// Manter compatibilidade com NtaiAnalysisResult existente
export interface LegacyNtaiAnalysisResult {
  studyId: string;
  qualityScore: number;
  relevanceScore: number;
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
}

// Função helper para converter enhanced → legacy
export function convertToLegacyFormat(
  enhanced: EnhancedExtractionResult,
  studyId: string
): LegacyNtaiAnalysisResult {
  return {
    studyId,
    qualityScore: enhanced.overall_quality_score,
    relevanceScore: enhanced.overall_relevance_score,
    extractedNutraceuticals: enhanced.nutraceuticals.map(n => ({
      name: n.name_en,
      confidence: n.extraction_confidence.overall
    })),
    extractedConditions: enhanced.health_conditions.map(c => ({
      name: c.name_en,
      confidence: c.confidence.overall
    })),
    extractedInteractions: enhanced.interactions.map(i => ({
      nutraceutical: i.nutraceutical,
      interaction: i.interacts_with,
      confidence: i.confidence.overall
    })),
    extractedSideEffects: enhanced.side_effects.map(s => ({
      name: s.name_en,
      description: s.description_en,
      severity: s.severity,
      confidence: s.confidence.overall
    }))
  };
}
