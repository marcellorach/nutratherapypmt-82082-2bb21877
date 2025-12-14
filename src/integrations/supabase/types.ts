export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_configurations: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          api_provider: string
          cost_usd: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          model: string
          operation: string
          tokens_input: number | null
          tokens_output: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_provider: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model: string
          operation: string
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_provider?: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model?: string
          operation?: string
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          report_data: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          report_data: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          report_data?: Json
        }
        Relationships: []
      }
      auto_discoveries: {
        Row: {
          approval_chain: Json | null
          discovered_at: string | null
          discovery_score: number | null
          evidence_multiplier: number | null
          head_entity_id: string | null
          head_entity_name: string
          head_entity_type: string
          id: string
          novelty_factor: number | null
          predicted_relation: string
          status: string | null
          supporting_paths: Json | null
          tail_entity_id: string | null
          tail_entity_name: string
          tail_entity_type: string
          transe_score: number | null
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          approval_chain?: Json | null
          discovered_at?: string | null
          discovery_score?: number | null
          evidence_multiplier?: number | null
          head_entity_id?: string | null
          head_entity_name: string
          head_entity_type: string
          id?: string
          novelty_factor?: number | null
          predicted_relation: string
          status?: string | null
          supporting_paths?: Json | null
          tail_entity_id?: string | null
          tail_entity_name: string
          tail_entity_type: string
          transe_score?: number | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          approval_chain?: Json | null
          discovered_at?: string | null
          discovery_score?: number | null
          evidence_multiplier?: number | null
          head_entity_id?: string | null
          head_entity_name?: string
          head_entity_type?: string
          id?: string
          novelty_factor?: number | null
          predicted_relation?: string
          status?: string | null
          supporting_paths?: Json | null
          tail_entity_id?: string | null
          tail_entity_name?: string
          tail_entity_type?: string
          transe_score?: number | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: []
      }
      biological_effect_nodes: {
        Row: {
          created_at: string | null
          description: string | null
          description_en: string | null
          duration: string | null
          effect_category: string | null
          effect_type: string | null
          frequency_if_adverse: number | null
          id: string
          name: string
          name_en: string | null
          onset_time: string | null
          severity_if_adverse: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          duration?: string | null
          effect_category?: string | null
          effect_type?: string | null
          frequency_if_adverse?: number | null
          id?: string
          name: string
          name_en?: string | null
          onset_time?: string | null
          severity_if_adverse?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          duration?: string | null
          effect_category?: string | null
          effect_type?: string | null
          frequency_if_adverse?: number | null
          id?: string
          name?: string
          name_en?: string | null
          onset_time?: string | null
          severity_if_adverse?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      breed_groups: {
        Row: {
          created_at: string | null
          description: string | null
          description_en: string | null
          id: string
          name: string
          name_en: string
          species_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          name: string
          name_en: string
          species_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          name?: string
          name_en?: string
          species_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "breed_groups_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      breed_predispositions: {
        Row: {
          breed_id: string
          condition_id: string
          created_at: string | null
          evidence_grade: string
          id: string
          notes: string | null
          risk_factor: number
          supporting_study_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          breed_id: string
          condition_id: string
          created_at?: string | null
          evidence_grade: string
          id?: string
          notes?: string | null
          risk_factor: number
          supporting_study_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          breed_id?: string
          condition_id?: string
          created_at?: string | null
          evidence_grade?: string
          id?: string
          notes?: string | null
          risk_factor?: number
          supporting_study_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "breed_predispositions_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breed_predispositions_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "health_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      breeds: {
        Row: {
          average_lifespan_years: number | null
          average_weight_kg: number | null
          breed_group_id: string
          created_at: string | null
          description: string | null
          description_en: string | null
          id: string
          name: string
          name_en: string
          size_category: string | null
          updated_at: string | null
        }
        Insert: {
          average_lifespan_years?: number | null
          average_weight_kg?: number | null
          breed_group_id: string
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          name: string
          name_en: string
          size_category?: string | null
          updated_at?: string | null
        }
        Update: {
          average_lifespan_years?: number | null
          average_weight_kg?: number | null
          breed_group_id?: string
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          name?: string
          name_en?: string
          size_category?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "breeds_breed_group_id_fkey"
            columns: ["breed_group_id"]
            isOneToOne: false
            referencedRelation: "breed_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      data_management_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      health_conditions: {
        Row: {
          category: string | null
          category_en: string | null
          created_at: string | null
          description: string | null
          description_en: string | null
          id: string
          name: string
          name_en: string | null
          severity_level: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          category_en?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          name: string
          name_en?: string | null
          severity_level?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          category_en?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          name?: string
          name_en?: string | null
          severity_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      health_conditions_backup_20251111: {
        Row: {
          category: string | null
          category_en: string | null
          created_at: string | null
          description: string | null
          description_en: string | null
          id: string | null
          name: string | null
          name_en: string | null
          severity_level: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          category_en?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string | null
          name?: string | null
          name_en?: string | null
          severity_level?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          category_en?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string | null
          name?: string | null
          name_en?: string | null
          severity_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hierarchical_edges: {
        Row: {
          confidence: number | null
          created_at: string | null
          curated: boolean | null
          curated_at: string | null
          curated_by: string | null
          dose_range: Json | null
          ec50: string | null
          evidence_count: number | null
          evidence_level: string | null
          ic50: string | null
          id: string
          intensity: number | null
          ki: string | null
          relationship: string
          source_id: string
          source_layer: string
          source_type: string
          species_validated: string[] | null
          study_ids: string[] | null
          target_id: string
          target_layer: string
          target_type: string
          triplet_id: string | null
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          curated?: boolean | null
          curated_at?: string | null
          curated_by?: string | null
          dose_range?: Json | null
          ec50?: string | null
          evidence_count?: number | null
          evidence_level?: string | null
          ic50?: string | null
          id?: string
          intensity?: number | null
          ki?: string | null
          relationship: string
          source_id: string
          source_layer: string
          source_type: string
          species_validated?: string[] | null
          study_ids?: string[] | null
          target_id: string
          target_layer: string
          target_type: string
          triplet_id?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          curated?: boolean | null
          curated_at?: string | null
          curated_by?: string | null
          dose_range?: Json | null
          ec50?: string | null
          evidence_count?: number | null
          evidence_level?: string | null
          ic50?: string | null
          id?: string
          intensity?: number | null
          ki?: string | null
          relationship?: string
          source_id?: string
          source_layer?: string
          source_type?: string
          species_validated?: string[] | null
          study_ids?: string[] | null
          target_id?: string
          target_layer?: string
          target_type?: string
          triplet_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hierarchical_edges_triplet_id_fkey"
            columns: ["triplet_id"]
            isOneToOne: false
            referencedRelation: "triplet_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanism_nodes: {
        Row: {
          action_type: string | null
          created_at: string | null
          description: string | null
          description_en: string | null
          id: string
          mechanism_type: string | null
          molecular_target: string | null
          name: string
          name_en: string | null
          reversibility: string | null
          target_pathway_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_type?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          mechanism_type?: string | null
          molecular_target?: string | null
          name: string
          name_en?: string | null
          reversibility?: string | null
          target_pathway_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          mechanism_type?: string | null
          molecular_target?: string | null
          name?: string
          name_en?: string | null
          reversibility?: string | null
          target_pathway_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanism_nodes_target_pathway_id_fkey"
            columns: ["target_pathway_id"]
            isOneToOne: false
            referencedRelation: "pathway_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_knowledge_edges: {
        Row: {
          created_at: string | null
          evidence_count: number | null
          id: string
          metadata: Json | null
          relationship_strength: number | null
          relationship_type: string
          source_entity_id: string
          supporting_study_ids: string[] | null
          target_entity_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evidence_count?: number | null
          id?: string
          metadata?: Json | null
          relationship_strength?: number | null
          relationship_type: string
          source_entity_id: string
          supporting_study_ids?: string[] | null
          target_entity_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evidence_count?: number | null
          id?: string
          metadata?: Json | null
          relationship_strength?: number | null
          relationship_type?: string
          source_entity_id?: string
          supporting_study_ids?: string[] | null
          target_entity_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_knowledge_edges_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "medical_knowledge_graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_knowledge_edges_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "medical_knowledge_graph"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_knowledge_graph: {
        Row: {
          created_at: string | null
          entity_metadata: Json | null
          entity_name: string
          entity_type: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_metadata?: Json | null
          entity_name: string
          entity_type: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_metadata?: Json | null
          entity_name?: string
          entity_type?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nutraceutical_benefits: {
        Row: {
          benefit: string
          benefit_en: string | null
          created_at: string | null
          id: string
          nutraceutical_id: string
        }
        Insert: {
          benefit: string
          benefit_en?: string | null
          created_at?: string | null
          id?: string
          nutraceutical_id: string
        }
        Update: {
          benefit?: string
          benefit_en?: string | null
          created_at?: string | null
          id?: string
          nutraceutical_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutraceutical_benefits_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: false
            referencedRelation: "clean_seed_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutraceutical_benefits_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: false
            referencedRelation: "nutraceuticals"
            referencedColumns: ["id"]
          },
        ]
      }
      nutraceutical_categories: {
        Row: {
          created_at: string | null
          description: string | null
          description_en: string | null
          id: string
          name: string
          name_en: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          name: string
          name_en?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          name?: string
          name_en?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nutraceutical_conditions: {
        Row: {
          condition_id: string
          created_at: string | null
          efficacy_score: number | null
          id: string
          notes: string | null
          nutraceutical_id: string
          relationship_type: string | null
          updated_at: string | null
        }
        Insert: {
          condition_id: string
          created_at?: string | null
          efficacy_score?: number | null
          id?: string
          notes?: string | null
          nutraceutical_id: string
          relationship_type?: string | null
          updated_at?: string | null
        }
        Update: {
          condition_id?: string
          created_at?: string | null
          efficacy_score?: number | null
          id?: string
          notes?: string | null
          nutraceutical_id?: string
          relationship_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutraceutical_conditions_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "health_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutraceutical_conditions_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: false
            referencedRelation: "clean_seed_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutraceutical_conditions_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: false
            referencedRelation: "nutraceuticals"
            referencedColumns: ["id"]
          },
        ]
      }
      nutraceutical_contraindications: {
        Row: {
          contraindication: string
          created_at: string | null
          id: string
          notes: string | null
          nutraceutical_id: string
          severity_level: string | null
          updated_at: string | null
        }
        Insert: {
          contraindication: string
          created_at?: string | null
          id?: string
          notes?: string | null
          nutraceutical_id: string
          severity_level?: string | null
          updated_at?: string | null
        }
        Update: {
          contraindication?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          nutraceutical_id?: string
          severity_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutraceutical_contraindications_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: false
            referencedRelation: "clean_seed_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutraceutical_contraindications_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: false
            referencedRelation: "nutraceuticals"
            referencedColumns: ["id"]
          },
        ]
      }
      nutraceutical_imports: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          import_status: string | null
          imported_by: string | null
          name: string
          source_data: Json | null
          source_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          import_status?: string | null
          imported_by?: string | null
          name: string
          source_data?: Json | null
          source_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          import_status?: string | null
          imported_by?: string | null
          name?: string
          source_data?: Json | null
          source_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nutraceutical_outcomes: {
        Row: {
          created_at: string | null
          description: string | null
          efficacy_score: number | null
          evidence_quality: string | null
          id: string
          name: string
          nutraceutical_id: string
          outcome_family_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          efficacy_score?: number | null
          evidence_quality?: string | null
          id?: string
          name: string
          nutraceutical_id: string
          outcome_family_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          efficacy_score?: number | null
          evidence_quality?: string | null
          id?: string
          name?: string
          nutraceutical_id?: string
          outcome_family_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutraceutical_outcomes_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: false
            referencedRelation: "clean_seed_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutraceutical_outcomes_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: false
            referencedRelation: "nutraceuticals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutraceutical_outcomes_outcome_family_id_fkey"
            columns: ["outcome_family_id"]
            isOneToOne: false
            referencedRelation: "outcome_families"
            referencedColumns: ["id"]
          },
        ]
      }
      nutraceutical_scientific_metadata: {
        Row: {
          created_at: string | null
          efficacy_score: number | null
          evidence_quality: string | null
          id: string
          nutraceutical_id: string
          safety_rating: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          efficacy_score?: number | null
          evidence_quality?: string | null
          id?: string
          nutraceutical_id: string
          safety_rating?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          efficacy_score?: number | null
          evidence_quality?: string | null
          id?: string
          nutraceutical_id?: string
          safety_rating?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutraceutical_scientific_metadata_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: true
            referencedRelation: "clean_seed_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutraceutical_scientific_metadata_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: true
            referencedRelation: "nutraceuticals"
            referencedColumns: ["id"]
          },
        ]
      }
      nutraceutical_studies: {
        Row: {
          created_at: string | null
          id: string
          nutraceutical_id: string
          relevance_score: number | null
          study_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nutraceutical_id: string
          relevance_score?: number | null
          study_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nutraceutical_id?: string
          relevance_score?: number | null
          study_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutraceutical_studies_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: false
            referencedRelation: "clean_seed_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutraceutical_studies_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: false
            referencedRelation: "nutraceuticals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutraceutical_studies_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "scientific_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      nutraceuticals: {
        Row: {
          chemical_compound: string | null
          created_at: string | null
          description: string | null
          description_en: string | null
          dosage: string | null
          dosage_en: string | null
          id: string
          name: string
          name_en: string | null
          outcome_id: string | null
          source: string | null
          source_en: string | null
          updated_at: string | null
        }
        Insert: {
          chemical_compound?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          dosage?: string | null
          dosage_en?: string | null
          id?: string
          name: string
          name_en?: string | null
          outcome_id?: string | null
          source?: string | null
          source_en?: string | null
          updated_at?: string | null
        }
        Update: {
          chemical_compound?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          dosage?: string | null
          dosage_en?: string | null
          id?: string
          name?: string
          name_en?: string | null
          outcome_id?: string | null
          source?: string | null
          source_en?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      outcome_families: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          description_en: string | null
          icon: string | null
          id: string
          name: string
          name_en: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          name: string
          name_en?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_en?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pathway_nodes: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          description_en: string | null
          go_term: string | null
          id: string
          kegg_id: string | null
          name: string
          name_en: string | null
          pathway_type: string | null
          reactome_id: string | null
          species_relevance: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          go_term?: string | null
          id?: string
          kegg_id?: string | null
          name: string
          name_en?: string | null
          pathway_type?: string | null
          reactome_id?: string | null
          species_relevance?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          go_term?: string | null
          id?: string
          kegg_id?: string | null
          name?: string
          name_en?: string | null
          pathway_type?: string | null
          reactome_id?: string | null
          species_relevance?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      processed_studies: {
        Row: {
          analysis_data: Json | null
          authors: string[] | null
          created_at: string | null
          description: string | null
          error_message: string | null
          full_text_content: string | null
          full_text_metadata: Json | null
          id: string
          import_type: string
          journal: string | null
          kanban_status: string | null
          original_filename: string
          processed_by: string | null
          source_import_id: string | null
          storage_path: string
          study_id: string
          title: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          analysis_data?: Json | null
          authors?: string[] | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          full_text_content?: string | null
          full_text_metadata?: Json | null
          id?: string
          import_type?: string
          journal?: string | null
          kanban_status?: string | null
          original_filename: string
          processed_by?: string | null
          source_import_id?: string | null
          storage_path: string
          study_id: string
          title?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          analysis_data?: Json | null
          authors?: string[] | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          full_text_content?: string | null
          full_text_metadata?: Json | null
          id?: string
          import_type?: string
          journal?: string | null
          kanban_status?: string | null
          original_filename?: string
          processed_by?: string | null
          source_import_id?: string | null
          storage_path?: string
          study_id?: string
          title?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "processed_studies_source_import_id_fkey"
            columns: ["source_import_id"]
            isOneToOne: false
            referencedRelation: "scispace_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scientific_studies: {
        Row: {
          abstract: string | null
          abstract_en: string | null
          authors: string[] | null
          created_at: string | null
          doi: string | null
          external_id: string | null
          id: string
          is_simulated: boolean | null
          journal: string | null
          journal_en: string | null
          link: string | null
          openalex_id: string | null
          pdf_filename: string | null
          pdf_storage_path: string | null
          pdf_uploaded_at: string | null
          pmid: string | null
          source_api: string | null
          title: string
          title_en: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          abstract?: string | null
          abstract_en?: string | null
          authors?: string[] | null
          created_at?: string | null
          doi?: string | null
          external_id?: string | null
          id?: string
          is_simulated?: boolean | null
          journal?: string | null
          journal_en?: string | null
          link?: string | null
          openalex_id?: string | null
          pdf_filename?: string | null
          pdf_storage_path?: string | null
          pdf_uploaded_at?: string | null
          pmid?: string | null
          source_api?: string | null
          title: string
          title_en?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          abstract?: string | null
          abstract_en?: string | null
          authors?: string[] | null
          created_at?: string | null
          doi?: string | null
          external_id?: string | null
          id?: string
          is_simulated?: boolean | null
          journal?: string | null
          journal_en?: string | null
          link?: string | null
          openalex_id?: string | null
          pdf_filename?: string | null
          pdf_storage_path?: string | null
          pdf_uploaded_at?: string | null
          pmid?: string | null
          source_api?: string | null
          title?: string
          title_en?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      scispace_imports: {
        Row: {
          base_studies_filename: string | null
          base_studies_storage_path: string | null
          consenso_comments: string | null
          consenso_name: string | null
          created_at: string | null
          id: string
          import_type: string
          imported_at: string | null
          imported_by: string | null
          is_deleted: boolean | null
          meta_summary_filename: string | null
          meta_summary_storage_path: string | null
          scispace_status: string | null
          updated_at: string | null
        }
        Insert: {
          base_studies_filename?: string | null
          base_studies_storage_path?: string | null
          consenso_comments?: string | null
          consenso_name?: string | null
          created_at?: string | null
          id?: string
          import_type?: string
          imported_at?: string | null
          imported_by?: string | null
          is_deleted?: boolean | null
          meta_summary_filename?: string | null
          meta_summary_storage_path?: string | null
          scispace_status?: string | null
          updated_at?: string | null
        }
        Update: {
          base_studies_filename?: string | null
          base_studies_storage_path?: string | null
          consenso_comments?: string | null
          consenso_name?: string | null
          created_at?: string | null
          id?: string
          import_type?: string
          imported_at?: string | null
          imported_by?: string | null
          is_deleted?: boolean | null
          meta_summary_filename?: string | null
          meta_summary_storage_path?: string | null
          scispace_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      species: {
        Row: {
          created_at: string | null
          description: string | null
          description_en: string | null
          id: string
          name: string
          name_en: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          name: string
          name_en: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          name?: string
          name_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      study_chat_history: {
        Row: {
          answer: string
          context_used: Json | null
          created_at: string | null
          id: string
          question: string
          study_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          answer: string
          context_used?: Json | null
          created_at?: string | null
          id?: string
          question: string
          study_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          answer?: string
          context_used?: Json | null
          created_at?: string | null
          id?: string
          question?: string
          study_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_chat_history_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "processed_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      study_embeddings: {
        Row: {
          chunk_index: number
          chunk_metadata: Json | null
          chunk_text: string
          created_at: string | null
          embedding: string | null
          id: string
          study_id: string
          updated_at: string | null
        }
        Insert: {
          chunk_index: number
          chunk_metadata?: Json | null
          chunk_text: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          study_id: string
          updated_at?: string | null
        }
        Update: {
          chunk_index?: number
          chunk_metadata?: Json | null
          chunk_text?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          study_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_embeddings_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "processed_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      study_extractions: {
        Row: {
          created_at: string | null
          extracted_data: Json
          extraction_quality_score: number | null
          extraction_status: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          study_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          extracted_data: Json
          extraction_quality_score?: number | null
          extraction_status?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          study_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          extracted_data?: Json
          extraction_quality_score?: number | null
          extraction_status?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          study_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_extractions_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: true
            referencedRelation: "processed_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          created_at: string | null
          id: string
          key: string
          locale: string
          updated_at: string | null
          value: string
          version: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          locale: string
          updated_at?: string | null
          value: string
          version?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          locale?: string
          updated_at?: string | null
          value?: string
          version?: number
        }
        Relationships: []
      }
      triplet_extractions: {
        Row: {
          approval_chain: Json | null
          auto_approved: boolean | null
          created_at: string | null
          curation_status: string | null
          direction: string | null
          dose_dependent: boolean | null
          dose_range: Json | null
          evidence_level: string | null
          extraction_confidence: number | null
          hallucination_flag: boolean | null
          id: string
          intensity: number | null
          kg_match_score: number | null
          llm_confidence: number | null
          mechanism_path: Json | null
          object_id: string | null
          object_layer: string | null
          object_name: string
          object_type: string
          predicate: string
          relationship_category: string | null
          review_date: string | null
          review_notes: string | null
          reviewed_by: string | null
          species_context: string[] | null
          study_id: string | null
          subject_id: string | null
          subject_layer: string | null
          subject_name: string
          subject_type: string
          synced_at: string | null
          synced_to_neo4j: boolean | null
          synergy_data: Json | null
          updated_at: string | null
        }
        Insert: {
          approval_chain?: Json | null
          auto_approved?: boolean | null
          created_at?: string | null
          curation_status?: string | null
          direction?: string | null
          dose_dependent?: boolean | null
          dose_range?: Json | null
          evidence_level?: string | null
          extraction_confidence?: number | null
          hallucination_flag?: boolean | null
          id?: string
          intensity?: number | null
          kg_match_score?: number | null
          llm_confidence?: number | null
          mechanism_path?: Json | null
          object_id?: string | null
          object_layer?: string | null
          object_name: string
          object_type: string
          predicate: string
          relationship_category?: string | null
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          species_context?: string[] | null
          study_id?: string | null
          subject_id?: string | null
          subject_layer?: string | null
          subject_name: string
          subject_type: string
          synced_at?: string | null
          synced_to_neo4j?: boolean | null
          synergy_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          approval_chain?: Json | null
          auto_approved?: boolean | null
          created_at?: string | null
          curation_status?: string | null
          direction?: string | null
          dose_dependent?: boolean | null
          dose_range?: Json | null
          evidence_level?: string | null
          extraction_confidence?: number | null
          hallucination_flag?: boolean | null
          id?: string
          intensity?: number | null
          kg_match_score?: number | null
          llm_confidence?: number | null
          mechanism_path?: Json | null
          object_id?: string | null
          object_layer?: string | null
          object_name?: string
          object_type?: string
          predicate?: string
          relationship_category?: string | null
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          species_context?: string[] | null
          study_id?: string | null
          subject_id?: string | null
          subject_layer?: string | null
          subject_name?: string
          subject_type?: string
          synced_at?: string | null
          synced_to_neo4j?: boolean | null
          synergy_data?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "triplet_extractions_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "processed_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      clean_seed_data: {
        Row: {
          chemical_compound: string | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          dosage: string | null
          id: string | null
          name: string | null
          source: string | null
          studies: Json | null
          updated_at: string | null
        }
        Insert: {
          chemical_compound?: string | null
          conditions?: never
          created_at?: string | null
          description?: string | null
          dosage?: string | null
          id?: string | null
          name?: string | null
          source?: string | null
          studies?: never
          updated_at?: string | null
        }
        Update: {
          chemical_compound?: string | null
          conditions?: never
          created_at?: string | null
          description?: string | null
          dosage?: string | null
          id?: string | null
          name?: string | null
          source?: string | null
          studies?: never
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_conditions_with_treatability: {
        Args: never
        Returns: {
          avg_efficacy: number
          category: string
          category_en: string
          created_at: string
          description: string
          description_en: string
          id: string
          name: string
          name_en: string
          nutraceutical_count: number
          prevention_count: number
          severity_level: string
          support_count: number
          treatment_count: number
          updated_at: string
        }[]
      }
      increment_translation_version: { Args: never; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      search_study_chunks: {
        Args: {
          match_count?: number
          match_study_id?: string
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_id: string
          chunk_index: number
          chunk_metadata: Json
          chunk_text: string
          similarity: number
          study_id: string
        }[]
      }
    }
    Enums: {
      entity_layer:
        | "layer_0_compound"
        | "layer_1_target"
        | "layer_2_mechanism"
        | "layer_3_effect"
        | "layer_4_outcome"
      entity_type_expanded:
        | "nutraceutical"
        | "drug"
        | "chemical_compound"
        | "pathway"
        | "receptor"
        | "enzyme"
        | "gene_protein"
        | "mechanism"
        | "signaling_cascade"
        | "biological_effect"
        | "side_effect"
        | "clinical_outcome"
        | "condition"
        | "disease"
        | "breed"
        | "species"
        | "age_group"
        | "study"
      relationship_type_expanded:
        | "INHIBITS"
        | "ACTIVATES"
        | "MODULATES"
        | "BINDS_TO"
        | "BLOCKS"
        | "UPREGULATES"
        | "DOWNREGULATES"
        | "TRIGGERS"
        | "PARTICIPATES_IN"
        | "REGULATES"
        | "PRODUCES"
        | "LEADS_TO"
        | "CAUSES"
        | "TREATS"
        | "PREVENTS"
        | "SUPPORTS"
        | "AMELIORATES"
        | "MANAGES"
        | "WORSENS"
        | "CONTRAINDICATED_FOR"
        | "CAUSES_SIDE_EFFECT"
        | "AGGRAVATES"
        | "SYNERGIZES_WITH"
        | "ANTAGONIZES"
        | "ENHANCES_BIOAVAILABILITY"
        | "REDUCES_BIOAVAILABILITY"
        | "REQUIRES"
        | "POTENTIATES"
        | "PREDISPOSED_IN"
        | "COMMON_IN"
        | "CITED_IN"
        | "STUDIED_IN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      entity_layer: [
        "layer_0_compound",
        "layer_1_target",
        "layer_2_mechanism",
        "layer_3_effect",
        "layer_4_outcome",
      ],
      entity_type_expanded: [
        "nutraceutical",
        "drug",
        "chemical_compound",
        "pathway",
        "receptor",
        "enzyme",
        "gene_protein",
        "mechanism",
        "signaling_cascade",
        "biological_effect",
        "side_effect",
        "clinical_outcome",
        "condition",
        "disease",
        "breed",
        "species",
        "age_group",
        "study",
      ],
      relationship_type_expanded: [
        "INHIBITS",
        "ACTIVATES",
        "MODULATES",
        "BINDS_TO",
        "BLOCKS",
        "UPREGULATES",
        "DOWNREGULATES",
        "TRIGGERS",
        "PARTICIPATES_IN",
        "REGULATES",
        "PRODUCES",
        "LEADS_TO",
        "CAUSES",
        "TREATS",
        "PREVENTS",
        "SUPPORTS",
        "AMELIORATES",
        "MANAGES",
        "WORSENS",
        "CONTRAINDICATED_FOR",
        "CAUSES_SIDE_EFFECT",
        "AGGRAVATES",
        "SYNERGIZES_WITH",
        "ANTAGONIZES",
        "ENHANCES_BIOAVAILABILITY",
        "REDUCES_BIOAVAILABILITY",
        "REQUIRES",
        "POTENTIATES",
        "PREDISPOSED_IN",
        "COMMON_IN",
        "CITED_IN",
        "STUDIED_IN",
      ],
    },
  },
} as const
