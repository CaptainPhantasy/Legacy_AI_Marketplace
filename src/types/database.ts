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
      app_versions: {
        Row: {
          app_id: string
          config_schema_json: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          manifest_json: Json
          output_schema_json: Json
          release_notes: string | null
          run_template: string
          updated_at: string | null
          version: string
        }
        Insert: {
          app_id: string
          config_schema_json?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          manifest_json: Json
          output_schema_json: Json
          release_notes?: string | null
          run_template: string
          updated_at?: string | null
          version: string
        }
        Update: {
          app_id?: string
          config_schema_json?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          manifest_json?: Json
          output_schema_json?: Json
          release_notes?: string | null
          run_template?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_versions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          published_at: string | null
          published_by: string | null
          slug: string
          status: Database["public"]["Enums"]["app_status"] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          published_at?: string | null
          published_by?: string | null
          slug: string
          status?: Database["public"]["Enums"]["app_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          published_at?: string | null
          published_by?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["app_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apps_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_accounts: {
        Row: {
          access_token_encrypted: string
          connector_type: Database["public"]["Enums"]["connector_type"]
          created_at: string | null
          expires_at: string | null
          external_account_id: string | null
          external_account_name: string | null
          id: string
          refresh_token_encrypted: string | null
          scopes: string[]
          status: Database["public"]["Enums"]["connector_status"] | null
          token_iv: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted: string
          connector_type: Database["public"]["Enums"]["connector_type"]
          created_at?: string | null
          expires_at?: string | null
          external_account_id?: string | null
          external_account_name?: string | null
          id?: string
          refresh_token_encrypted?: string | null
          scopes: string[]
          status?: Database["public"]["Enums"]["connector_status"] | null
          token_iv: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          connector_type?: Database["public"]["Enums"]["connector_type"]
          created_at?: string | null
          expires_at?: string | null
          external_account_id?: string | null
          external_account_name?: string | null
          id?: string
          refresh_token_encrypted?: string | null
          scopes?: string[]
          status?: Database["public"]["Enums"]["connector_status"] | null
          token_iv?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connector_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installed_app_grants: {
        Row: {
          connector_type: Database["public"]["Enums"]["connector_type"]
          created_at: string | null
          grant_json: Json | null
          id: string
          installed_app_id: string
          status: Database["public"]["Enums"]["grant_status"] | null
          updated_at: string | null
        }
        Insert: {
          connector_type: Database["public"]["Enums"]["connector_type"]
          created_at?: string | null
          grant_json?: Json | null
          id?: string
          installed_app_id: string
          status?: Database["public"]["Enums"]["grant_status"] | null
          updated_at?: string | null
        }
        Update: {
          connector_type?: Database["public"]["Enums"]["connector_type"]
          created_at?: string | null
          grant_json?: Json | null
          id?: string
          installed_app_id?: string
          status?: Database["public"]["Enums"]["grant_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installed_app_grants_installed_app_id_fkey"
            columns: ["installed_app_id"]
            isOneToOne: false
            referencedRelation: "installed_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      installed_apps: {
        Row: {
          app_id: string
          config_json: Json | null
          id: string
          installed_at: string | null
          is_enabled: boolean | null
          updated_at: string | null
          user_id: string
          version_id: string
        }
        Insert: {
          app_id: string
          config_json?: Json | null
          id?: string
          installed_at?: string | null
          is_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          version_id: string
        }
        Update: {
          app_id?: string
          config_json?: Json | null
          id?: string
          installed_at?: string | null
          is_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installed_apps_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installed_apps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installed_apps_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "app_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      run_artifacts: {
        Row: {
          created_at: string | null
          id: string
          inputs_summary_json: Json | null
          logs: Json | null
          model_used: string | null
          output_json: Json | null
          raw_response: string | null
          run_id: string
          tokens_input: number | null
          tokens_output: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inputs_summary_json?: Json | null
          logs?: Json | null
          model_used?: string | null
          output_json?: Json | null
          raw_response?: string | null
          run_id: string
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inputs_summary_json?: Json | null
          logs?: Json | null
          model_used?: string | null
          output_json?: Json | null
          raw_response?: string | null
          run_id?: string
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "run_artifacts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          id: string
          installed_app_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["run_status"] | null
          updated_at: string | null
          user_id: string
          version_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          installed_app_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"] | null
          updated_at?: string | null
          user_id: string
          version_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          installed_app_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"] | null
          updated_at?: string | null
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runs_installed_app_id_fkey"
            columns: ["installed_app_id"]
            isOneToOne: false
            referencedRelation: "installed_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "app_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_status: "draft" | "published" | "archived"
      connector_status: "connected" | "expired" | "revoked" | "error"
      connector_type: "google_drive" | "gmail" | "slack" | "notion"
      grant_status: "allowed" | "denied" | "pending"
      run_status:
        | "pending"
        | "fetching"
        | "processing"
        | "validating"
        | "completed"
        | "failed"
        | "error"
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
      app_status: ["draft", "published", "archived"],
      connector_status: ["connected", "expired", "revoked", "error"],
      connector_type: ["google_drive", "gmail", "slack", "notion"],
      grant_status: ["allowed", "denied", "pending"],
      run_status: [
        "pending",
        "fetching",
        "processing",
        "validating",
        "completed",
        "failed",
        "error",
      ],
    },
  },
} as const
