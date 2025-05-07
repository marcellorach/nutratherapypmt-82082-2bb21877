export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          created_at: string
          description: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
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
          condition_id: string | null
          created_at: string
          efficacy_score: number | null
          id: string
          notes: string | null
          nutraceutical_id: string | null
          relationship_type: string
          updated_at: string
        }
        Insert: {
          condition_id?: string | null
          created_at?: string
          efficacy_score?: number | null
          id?: string
          notes?: string | null
          nutraceutical_id?: string | null
          relationship_type: string
          updated_at?: string
        }
        Update: {
          condition_id?: string | null
          created_at?: string
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
          created_at: string
          efficacy_score: number | null
          id: string
          notes: string | null
          nutraceutical_id: string | null
          sustainability_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          efficacy_score?: number | null
          id?: string
          notes?: string | null
          nutraceutical_id?: string | null
          sustainability_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          id: string
          nutraceutical_id: string | null
          relevance_score: number | null
          study_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nutraceutical_id?: string | null
          relevance_score?: number | null
          study_id?: string | null
        }
        Update: {
          created_at?: string
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
          chemical_compound: string | null
          contraindications: string[] | null
          created_at: string
          description: string | null
          dosage: string | null
          id: string
          import_batch: string | null
          import_id: string | null
          name: string
          outcome_id: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          chemical_compound?: string | null
          contraindications?: string[] | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          id?: string
          import_batch?: string | null
          import_id?: string | null
          name: string
          outcome_id?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          chemical_compound?: string | null
          contraindications?: string[] | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          id?: string
          import_batch?: string | null
          import_id?: string | null
          name?: string
          outcome_id?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutraceuticals_category_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "nutraceutical_outcomes"
            referencedColumns: ["id"]
          },
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
      scientific_studies: {
        Row: {
          abstract: string | null
          authors: string[] | null
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
