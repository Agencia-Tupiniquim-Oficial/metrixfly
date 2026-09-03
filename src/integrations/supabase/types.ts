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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      geo_projects: {
        Row: { id: string; owner_id: string; client_id: string | null; name: string; domain: string; country: string; language: string; created_at: string; updated_at: string }
        Insert: { id?: string; owner_id: string; client_id?: string | null; name: string; domain: string; country?: string; language?: string; created_at?: string; updated_at?: string }
        Update: Partial<{ id: string; owner_id: string; client_id: string | null; name: string; domain: string; country: string; language: string; created_at: string; updated_at: string }>
        Relationships: []
      }
      geo_clients: {
        Row: { id: string; agency_owner_id: string; name: string; contact_email: string; company_domain: string | null; created_at: string }
        Insert: { id?: string; agency_owner_id: string; name: string; contact_email: string; company_domain?: string | null; created_at?: string }
        Update: Partial<{ id: string; agency_owner_id: string; name: string; contact_email: string; company_domain: string | null; created_at: string }>
        Relationships: []
      }
      geo_project_members: {
        Row: { project_id: string; user_id: string; role: string; created_at: string }
        Insert: { project_id: string; user_id: string; role?: string; created_at?: string }
        Update: Partial<{ project_id: string; user_id: string; role: string; created_at: string }>
        Relationships: []
      }
      geo_crawl_snapshots: {
        Row: { id: string; project_id: string; scores: Json; stats: Json; technical_details: Json; pages: Json; findings: Json; created_at: string }
        Insert: { id?: string; project_id: string; scores: Json; stats: Json; technical_details?: Json; pages?: Json; findings?: Json; created_at?: string }
        Update: Partial<{ id: string; project_id: string; scores: Json; stats: Json; technical_details: Json; pages: Json; findings: Json; created_at: string }>
        Relationships: []
      }
      geo_prompts: {
        Row: { id: string; project_id: string; prompt: string; intent: string; funnel_stage: string; country: string; language: string; created_at: string }
        Insert: { id?: string; project_id: string; prompt: string; intent?: string; funnel_stage?: string; country?: string; language?: string; created_at?: string }
        Update: Partial<{ id: string; project_id: string; prompt: string; intent: string; funnel_stage: string; country: string; language: string; created_at: string }>
        Relationships: []
      }
      geo_response_evidence: {
        Row: { id: string; project_id: string; platform: string; prompt: string; response: string; mentioned: boolean; citation_url: string | null; created_at: string }
        Insert: { id?: string; project_id: string; platform: string; prompt: string; response: string; mentioned?: boolean; citation_url?: string | null; created_at?: string }
        Update: Partial<{ id: string; project_id: string; platform: string; prompt: string; response: string; mentioned: boolean; citation_url: string | null; created_at: string }>
        Relationships: []
      }
      geo_competitors: {
        Row: { id: string; project_id: string; domain: string; created_at: string }
        Insert: { id?: string; project_id: string; domain: string; created_at?: string }
        Update: Partial<{ id: string; project_id: string; domain: string; created_at: string }>
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
