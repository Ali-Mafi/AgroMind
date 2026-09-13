// Mirrors supabase/migrations. JSON documents are validated at every boundary.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  country_code: string | null;
  language: string;
  timezone: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
};
export type Account = {
  id: string;
  owner_user_id: string;
  kind: string;
  farm_count: number;
  created_at: string;
};
export type Plan = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
};
export type Subscription = {
  id: string;
  account_id: string;
  plan_id: string;
  status: string;
  source: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};
type Table<Row, Insert = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      accounts: Table<Account>;
      plans: Table<Plan>;
      plan_entitlements: Table<{ plan_id: string; key: string; value: Json }>;
      subscriptions: Table<Subscription>;
      farms: Table<
        {
          account_id: string;
          id: string;
          data: Json;
          created_at: string;
          updated_at: string;
        },
        { account_id: string; id: string; data: Json }
      >;
      irrigation_schedules: Table<
        {
          account_id: string;
          farm_id: string;
          data: Json;
          created_at: string;
          updated_at: string;
        },
        { account_id: string; farm_id: string; data: Json }
      >;
      legacy_imports: Table<{
        account_id: string;
        fingerprint: string;
        snapshot: Json;
        selected_ids: Json;
        imported_farms: number;
        imported_schedules: number;
        created_at: string;
      }>;
    };
    Views: Record<never, never>;
    Functions: {
      create_farm: { Args: { p_data: Json }; Returns: undefined };
      save_irrigation_schedule: {
        Args: { p_farm_id: string; p_data: Json };
        Returns: undefined;
      };
      get_entitlements: { Args: Record<string, never>; Returns: Json };
      complete_onboarding: { Args: Record<string, never>; Returns: undefined };
      import_legacy_data: {
        Args: { p_snapshot: Json; p_selected_ids: Json };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
