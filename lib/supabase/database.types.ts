// Stable domain aliases from the generated hosted Supabase schema.
import type { Database } from "./database.generated";
export type { Database, Json } from "./database.generated";
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
