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
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          country: string
          end_date: string
          id: string
          multiplier: number
          name: string
          start_date: string
        }
        Insert: {
          country?: string
          end_date: string
          id?: string
          multiplier?: number
          name: string
          start_date: string
        }
        Update: {
          country?: string
          end_date?: string
          id?: string
          multiplier?: number
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      cctv_audits: {
        Row: {
          assigned_role: Database["public"]["Enums"]["app_role"]
          camera: string
          category: string
          confidence: number
          description: string
          escalation_level: number
          financial_impact: number
          id: string
          location_id: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["audit_severity"]
          status: Database["public"]["Enums"]["audit_status"]
          timestamp: string
          violation_type: string
        }
        Insert: {
          assigned_role?: Database["public"]["Enums"]["app_role"]
          camera?: string
          category?: string
          confidence?: number
          description?: string
          escalation_level?: number
          financial_impact?: number
          id?: string
          location_id: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["audit_severity"]
          status?: Database["public"]["Enums"]["audit_status"]
          timestamp?: string
          violation_type: string
        }
        Update: {
          assigned_role?: Database["public"]["Enums"]["app_role"]
          camera?: string
          category?: string
          confidence?: number
          description?: string
          escalation_level?: number
          financial_impact?: number
          id?: string
          location_id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["audit_severity"]
          status?: Database["public"]["Enums"]["audit_status"]
          timestamp?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cctv_audits_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_disciplinary: {
        Row: {
          audit_id: string | null
          created_at: string
          employee_id: string
          employee_name: string
          id: string
          location_id: string | null
          notes: string
          status: string
          warning_level: string
        }
        Insert: {
          audit_id?: string | null
          created_at?: string
          employee_id: string
          employee_name?: string
          id?: string
          location_id?: string | null
          notes?: string
          status?: string
          warning_level?: string
        }
        Update: {
          audit_id?: string | null
          created_at?: string
          employee_id?: string
          employee_name?: string
          id?: string
          location_id?: string | null
          notes?: string
          status?: string
          warning_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_disciplinary_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "cctv_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_disciplinary_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_ledger: {
        Row: {
          actual_qty: number
          created_at: string
          id: string
          item_name: string
          location_id: string
          period_date: string
          theoretical_qty: number
          unit: string
          unit_cost: number
          variance_alert: boolean
        }
        Insert: {
          actual_qty?: number
          created_at?: string
          id?: string
          item_name: string
          location_id: string
          period_date?: string
          theoretical_qty?: number
          unit?: string
          unit_cost?: number
          variance_alert?: boolean
        }
        Update: {
          actual_qty?: number
          created_at?: string
          id?: string
          item_name?: string
          location_id?: string
          period_date?: string
          theoretical_qty?: number
          unit?: string
          unit_cost?: number
          variance_alert?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "inventory_ledger_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          area: string
          city: string
          code: string
          country: string
          created_at: string
          currency: string
          id: string
          name: string
        }
        Insert: {
          area: string
          city: string
          code: string
          country: string
          created_at?: string
          currency?: string
          id?: string
          name: string
        }
        Update: {
          area?: string
          city?: string
          code?: string
          country?: string
          created_at?: string
          currency?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      pnl_periods: {
        Row: {
          cogs_actual: number
          cogs_budget: number
          cogs_ly: number
          id: string
          labor_actual: number
          labor_budget: number
          labor_ly: number
          location_id: string
          opex_actual: number
          opex_budget: number
          opex_ly: number
          period_start: string
          period_type: string
          revenue_actual: number
          revenue_budget: number
          revenue_ly: number
        }
        Insert: {
          cogs_actual?: number
          cogs_budget?: number
          cogs_ly?: number
          id?: string
          labor_actual?: number
          labor_budget?: number
          labor_ly?: number
          location_id: string
          opex_actual?: number
          opex_budget?: number
          opex_ly?: number
          period_start: string
          period_type?: string
          revenue_actual?: number
          revenue_budget?: number
          revenue_ly?: number
        }
        Update: {
          cogs_actual?: number
          cogs_budget?: number
          cogs_ly?: number
          id?: string
          labor_actual?: number
          labor_budget?: number
          labor_ly?: number
          location_id?: string
          opex_actual?: number
          opex_budget?: number
          opex_ly?: number
          period_start?: string
          period_type?: string
          revenue_actual?: number
          revenue_budget?: number
          revenue_ly?: number
        }
        Relationships: [
          {
            foreignKeyName: "pnl_periods_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          location_id: string | null
          name: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          location_id?: string | null
          name?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          location_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_pos: {
        Row: {
          cashier: string
          discount_amount: number
          id: string
          location_id: string
          ticket_data: Json
          ticket_no: string
          timestamp: string
          total_amount: number
          voided: boolean
        }
        Insert: {
          cashier?: string
          discount_amount?: number
          id?: string
          location_id: string
          ticket_data?: Json
          ticket_no: string
          timestamp?: string
          total_amount?: number
          voided?: boolean
        }
        Update: {
          cashier?: string
          discount_amount?: number
          id?: string
          location_id?: string
          ticket_data?: Json
          ticket_no?: string
          timestamp?: string
          total_amount?: number
          voided?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sales_pos_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "Restaurant Manager"
        | "Area Manager"
        | "Operations Manager"
        | "Country Manager"
        | "HR Officer"
        | "HR Supervisor"
        | "HR Manager"
        | "Head HR"
        | "MD"
        | "COO"
        | "CEO"
        | "System Owner"
      audit_severity: "Minor" | "Critical"
      audit_status:
        | "Open"
        | "Acknowledged"
        | "In Progress"
        | "Resolved"
        | "Closed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "Restaurant Manager",
        "Area Manager",
        "Operations Manager",
        "Country Manager",
        "HR Officer",
        "HR Supervisor",
        "HR Manager",
        "Head HR",
        "MD",
        "COO",
        "CEO",
        "System Owner",
      ],
      audit_severity: ["Minor", "Critical"],
      audit_status: [
        "Open",
        "Acknowledged",
        "In Progress",
        "Resolved",
        "Closed",
      ],
    },
  },
} as const
