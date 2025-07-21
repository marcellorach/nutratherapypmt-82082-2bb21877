export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      active_ingredients: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          chronic_diseases_prompt: string | null
          chronic_diseases_system_prompt: string | null
          continuous_medication_prompt: string | null
          continuous_medication_system_prompt: string | null
          exam_ocr_prompt: string | null
          exam_ocr_system_prompt: string | null
          health_assistant_prompt: string | null
          health_assistant_system_prompt: string | null
          id: string
          last_updated: string | null
          nutraceuticals_prompt: string | null
          nutraceuticals_system_prompt: string | null
          sporadic_medication_prompt: string | null
          sporadic_medication_system_prompt: string | null
        }
        Insert: {
          chronic_diseases_prompt?: string | null
          chronic_diseases_system_prompt?: string | null
          continuous_medication_prompt?: string | null
          continuous_medication_system_prompt?: string | null
          exam_ocr_prompt?: string | null
          exam_ocr_system_prompt?: string | null
          health_assistant_prompt?: string | null
          health_assistant_system_prompt?: string | null
          id: string
          last_updated?: string | null
          nutraceuticals_prompt?: string | null
          nutraceuticals_system_prompt?: string | null
          sporadic_medication_prompt?: string | null
          sporadic_medication_system_prompt?: string | null
        }
        Update: {
          chronic_diseases_prompt?: string | null
          chronic_diseases_system_prompt?: string | null
          continuous_medication_prompt?: string | null
          continuous_medication_system_prompt?: string | null
          exam_ocr_prompt?: string | null
          exam_ocr_system_prompt?: string | null
          health_assistant_prompt?: string | null
          health_assistant_system_prompt?: string | null
          id?: string
          last_updated?: string | null
          nutraceuticals_prompt?: string | null
          nutraceuticals_system_prompt?: string | null
          sporadic_medication_prompt?: string | null
          sporadic_medication_system_prompt?: string | null
        }
        Relationships: []
      }
      ai_configurations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      anamnesis_responses: {
        Row: {
          created_at: string
          extracted_tags: Json | null
          field_name: string
          field_value: string | null
          id: string
          section: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_tags?: Json | null
          field_name: string
          field_value?: string | null
          id?: string
          section: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_tags?: Json | null
          field_name?: string
          field_value?: string | null
          id?: string
          section?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_management_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      design_approvers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      design_conventions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          section: string
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          section: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          section?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      device_data: {
        Row: {
          created_at: string
          data_date: string
          data_type: string
          device_type: string
          id: string
          processed_data: Json | null
          raw_data: Json
          sync_timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_date: string
          data_type: string
          device_type: string
          id?: string
          processed_data?: Json | null
          raw_data?: Json
          sync_timestamp?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_date?: string
          data_type?: string
          device_type?: string
          id?: string
          processed_data?: Json | null
          raw_data?: Json
          sync_timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      device_integrations: {
        Row: {
          access_token: string | null
          created_at: string
          device_info: Json | null
          device_type: string
          id: string
          last_sync: string | null
          refresh_token: string | null
          status: string
          sync_frequency: number | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          device_info?: Json | null
          device_type: string
          id?: string
          last_sync?: string | null
          refresh_token?: string | null
          status?: string
          sync_frequency?: number | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          device_info?: Json | null
          device_type?: string
          id?: string
          last_sync?: string | null
          refresh_token?: string | null
          status?: string
          sync_frequency?: number | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exam_uploads: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          ocr_extracted_data: Json | null
          ocr_processed_at: string | null
          ocr_raw_data: Json | null
          original_filename: string
          updated_at: string
          user_approved: boolean | null
          user_corrections: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          ocr_extracted_data?: Json | null
          ocr_processed_at?: string | null
          ocr_raw_data?: Json | null
          original_filename: string
          updated_at?: string
          user_approved?: boolean | null
          user_corrections?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          ocr_extracted_data?: Json | null
          ocr_processed_at?: string | null
          ocr_raw_data?: Json | null
          original_filename?: string
          updated_at?: string
          user_approved?: boolean | null
          user_corrections?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      global_tags: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      health_conditions: {
        Row: {
          batch_id: string | null
          created_at: string
          data_type: string | null
          description: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          data_type?: string | null
          description: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          data_type?: string | null
          description?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      nutraceutical_benefits: {
        Row: {
          benefit: string
          created_at: string
          id: string
          nutraceutical_id: string | null
        }
        Insert: {
          benefit: string
          created_at?: string
          id?: string
          nutraceutical_id?: string | null
        }
        Update: {
          benefit?: string
          created_at?: string
          id?: string
          nutraceutical_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutraceutical_benefits_nutraceutical_id_fkey"
            columns: ["nutraceutical_id"]
            isOneToOne: false
            referencedRelation: "nutraceuticals"
            referencedColumns: ["id"]
          },
        ]
      }
      nutraceutical_conditions: {
        Row: {
          batch_id: string | null
          condition_id: string | null
          created_at: string
          data_type: string | null
          efficacy_score: number | null
          id: string
          notes: string | null
          nutraceutical_id: string | null
          relationship_type: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          condition_id?: string | null
          created_at?: string
          data_type?: string | null
          efficacy_score?: number | null
          id?: string
          notes?: string | null
          nutraceutical_id?: string | null
          relationship_type?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          condition_id?: string | null
          created_at?: string
          data_type?: string | null
          efficacy_score?: number | null
          id?: string
          notes?: string | null
          nutraceutical_id?: string | null
          relationship_type?: string
          updated_at?: string
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
            referencedRelation: "nutraceuticals"
            referencedColumns: ["id"]
          },
        ]
      }
      nutraceutical_imports: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_processed: boolean | null
          name: string
          nutraceutical_count: number | null
          source_file_name: string | null
          source_file_path: string | null
          source_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_processed?: boolean | null
          name: string
          nutraceutical_count?: number | null
          source_file_name?: string | null
          source_file_path?: string | null
          source_type?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_processed?: boolean | null
          name?: string
          nutraceutical_count?: number | null
          source_file_name?: string | null
          source_file_path?: string | null
          source_type?: string
        }
        Relationships: []
      }
      nutraceutical_outcomes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      nutraceutical_scientific_metadata: {
        Row: {
          batch_id: string | null
          created_at: string
          data_type: string | null
          efficacy_score: number | null
          id: string
          notes: string | null
          nutraceutical_id: string | null
          sustainability_score: number | null
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          data_type?: string | null
          efficacy_score?: number | null
          id?: string
          notes?: string | null
          nutraceutical_id?: string | null
          sustainability_score?: number | null
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          data_type?: string | null
          efficacy_score?: number | null
          id?: string
          notes?: string | null
          nutraceutical_id?: string | null
          sustainability_score?: number | null
          updated_at?: string
        }
        Relationships: [
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
          batch_id: string | null
          created_at: string
          data_type: string | null
          id: string
          nutraceutical_id: string | null
          relevance_score: number | null
          study_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          data_type?: string | null
          id?: string
          nutraceutical_id?: string | null
          relevance_score?: number | null
          study_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          data_type?: string | null
          id?: string
          nutraceutical_id?: string | null
          relevance_score?: number | null
          study_id?: string | null
        }
        Relationships: [
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
          batch_id: string | null
          chemical_compound: string | null
          contraindications: string[] | null
          created_at: string
          data_type: string | null
          description: string | null
          dosage: string | null
          id: string
          import_batch: string | null
          import_id: string | null
          name: string
          source: string | null
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          chemical_compound?: string | null
          contraindications?: string[] | null
          created_at?: string
          data_type?: string | null
          description?: string | null
          dosage?: string | null
          id?: string
          import_batch?: string | null
          import_id?: string | null
          name: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          chemical_compound?: string | null
          contraindications?: string[] | null
          created_at?: string
          data_type?: string | null
          description?: string | null
          dosage?: string | null
          id?: string
          import_batch?: string | null
          import_id?: string | null
          name?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutraceuticals_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "nutraceutical_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_studies: {
        Row: {
          analysis_data: Json | null
          created_at: string | null
          description: string | null
          id: string
          import_type: string | null
          journal: string | null
          kanban_status: string | null
          original_filename: string | null
          processed_by: string | null
          source_import_id: string | null
          storage_path: string | null
          study_id: string
          title: string
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          import_type?: string | null
          journal?: string | null
          kanban_status?: string | null
          original_filename?: string | null
          processed_by?: string | null
          source_import_id?: string | null
          storage_path?: string | null
          study_id: string
          title: string
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          import_type?: string | null
          journal?: string | null
          kanban_status?: string | null
          original_filename?: string | null
          processed_by?: string | null
          source_import_id?: string | null
          storage_path?: string | null
          study_id?: string
          title?: string
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
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          name: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scientific_studies: {
        Row: {
          abstract: string | null
          authors: string[] | null
          batch_id: string | null
          created_at: string
          data_type: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          journal: string | null
          link: string
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          abstract?: string | null
          authors?: string[] | null
          batch_id?: string | null
          created_at?: string
          data_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          journal?: string | null
          link: string
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          abstract?: string | null
          authors?: string[] | null
          batch_id?: string | null
          created_at?: string
          data_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          journal?: string | null
          link?: string
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      scispace_imports: {
        Row: {
          base_studies_filename: string
          base_studies_storage_path: string
          consenso_comments: string | null
          consenso_name: string | null
          deleted_at: string | null
          id: string
          import_type: string | null
          imported_at: string | null
          imported_by: string | null
          is_deleted: boolean | null
          meta_summary_filename: string
          meta_summary_storage_path: string
          notes: string | null
          nutraceutical: string | null
          scispace_status: string | null
        }
        Insert: {
          base_studies_filename: string
          base_studies_storage_path: string
          consenso_comments?: string | null
          consenso_name?: string | null
          deleted_at?: string | null
          id?: string
          import_type?: string | null
          imported_at?: string | null
          imported_by?: string | null
          is_deleted?: boolean | null
          meta_summary_filename: string
          meta_summary_storage_path: string
          notes?: string | null
          nutraceutical?: string | null
          scispace_status?: string | null
        }
        Update: {
          base_studies_filename?: string
          base_studies_storage_path?: string
          consenso_comments?: string | null
          consenso_name?: string | null
          deleted_at?: string | null
          id?: string
          import_type?: string | null
          imported_at?: string | null
          imported_by?: string | null
          is_deleted?: boolean | null
          meta_summary_filename?: string
          meta_summary_storage_path?: string
          notes?: string | null
          nutraceutical?: string | null
          scispace_status?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          device_type: string
          error_message: string | null
          id: string
          records_synced: number | null
          started_at: string
          status: string
          sync_duration_ms: number | null
          sync_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          device_type: string
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string
          status: string
          sync_duration_ms?: number | null
          sync_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          device_type?: string
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_duration_ms?: number | null
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_steps: Json | null
          current_state: Database["public"]["Enums"]["user_state"]
          id: string
          last_updated: string | null
          progress_percentage: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: Json | null
          current_state?: Database["public"]["Enums"]["user_state"]
          id?: string
          last_updated?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: Json | null
          current_state?: Database["public"]["Enums"]["user_state"]
          id?: string
          last_updated?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_seed_data: {
        Args: { batch_id_param?: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "veterinarian" | "tutor"
      user_state:
        | "new"
        | "disclaimer_completed"
        | "education_completed"
        | "exam_upload_completed"
        | "anamnesis_completed"
        | "medical_review_pending"
        | "medical_review_completed"
        | "exams_requested"
        | "exams_uploaded"
        | "results_processed"
        | "active"
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
      user_role: ["admin", "veterinarian", "tutor"],
      user_state: [
        "new",
        "disclaimer_completed",
        "education_completed",
        "exam_upload_completed",
        "anamnesis_completed",
        "medical_review_pending",
        "medical_review_completed",
        "exams_requested",
        "exams_uploaded",
        "results_processed",
        "active",
      ],
    },
  },
} as const
