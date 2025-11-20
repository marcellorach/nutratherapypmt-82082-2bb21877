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
      processed_studies: {
        Row: {
          analysis_data: Json | null
          authors: string[] | null
          created_at: string | null
          description: string | null
          error_message: string | null
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
          id: string
          journal: string | null
          journal_en: string | null
          link: string | null
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
          id?: string
          journal?: string | null
          journal_en?: string | null
          link?: string | null
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
          id?: string
          journal?: string | null
          journal_en?: string | null
          link?: string | null
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
            referencedColumns: ["study_id"]
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
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
