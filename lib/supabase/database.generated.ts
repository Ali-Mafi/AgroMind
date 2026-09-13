// Generated from the hosted Supabase schema; regenerate after applying migrations.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string;
          farm_count: number;
          id: string;
          kind: string;
          owner_user_id: string;
        };
        Insert: {
          created_at?: string;
          farm_count?: number;
          id?: string;
          kind?: string;
          owner_user_id: string;
        };
        Update: {
          created_at?: string;
          farm_count?: number;
          id?: string;
          kind?: string;
          owner_user_id?: string;
        };
        Relationships: [];
      };
      farms: {
        Row: {
          account_id: string;
          created_at: string;
          data: Json;
          id: string;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          created_at?: string;
          data: Json;
          id: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          data?: Json;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "farms_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      irrigation_schedules: {
        Row: {
          account_id: string;
          created_at: string;
          data: Json;
          farm_id: string;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          created_at?: string;
          data: Json;
          farm_id: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          data?: Json;
          farm_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "irrigation_schedules_account_id_farm_id_fkey";
            columns: ["account_id", "farm_id"];
            isOneToOne: true;
            referencedRelation: "farms";
            referencedColumns: ["account_id", "id"];
          },
        ];
      };
      legacy_imports: {
        Row: {
          account_id: string;
          created_at: string;
          fingerprint: string;
          imported_farms: number;
          imported_schedules: number;
          selected_ids: Json;
          snapshot: Json;
        };
        Insert: {
          account_id: string;
          created_at?: string;
          fingerprint: string;
          imported_farms: number;
          imported_schedules: number;
          selected_ids: Json;
          snapshot: Json;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          fingerprint?: string;
          imported_farms?: number;
          imported_schedules?: number;
          selected_ids?: Json;
          snapshot?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "legacy_imports_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: true;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_entitlements: {
        Row: {
          key: string;
          plan_id: string;
          value: Json;
        };
        Insert: {
          key: string;
          plan_id: string;
          value: Json;
        };
        Update: {
          key?: string;
          plan_id?: string;
          value?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "plan_entitlements_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          is_active: boolean;
          is_default: boolean;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          country_code: string | null;
          created_at: string;
          full_name: string;
          id: string;
          language: string;
          onboarding_completed: boolean;
          onboarding_step: number;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          country_code?: string | null;
          created_at?: string;
          full_name?: string;
          id: string;
          language?: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          country_code?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          language?: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          account_id: string;
          created_at: string;
          ends_at: string | null;
          id: string;
          plan_id: string;
          source: string;
          starts_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          plan_id: string;
          source?: string;
          starts_at?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          plan_id?: string;
          source?: string;
          starts_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: true;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_onboarding: { Args: never; Returns: undefined };
      create_farm: { Args: { p_data: Json }; Returns: undefined };
      get_entitlements: { Args: never; Returns: Json };
      import_legacy_data: {
        Args: { p_selected_ids: Json; p_snapshot: Json };
        Returns: Json;
      };
      save_irrigation_schedule: {
        Args: { p_data: Json; p_farm_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
