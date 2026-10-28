// Stable domain aliases from the generated hosted Supabase schema.
import type { Database as GeneratedDatabase } from "./database.generated";
import type { Json } from "./database.generated";
export type { Json };
type Rpc<Args, Returns> = { Args: Args; Returns: Returns };
export type Database = GeneratedDatabase & { public: { Functions: {
  security_snapshot: Rpc<Record<string, never>, Json>;
  security_observe_session: Rpc<{ p_user: string; p_session: string; p_metadata: Json; p_provider: string | null; p_aal: string | null }, boolean>;
  security_record_event: Rpc<{ p_user: string; p_session: string; p_kind: string; p_key: string }, undefined>;
  security_begin_revocation: Rpc<{ p_user: string; p_session: string; p_factor: string; p_scope: string; p_proof_hash: string }, string>;
  security_consume_revocation: Rpc<{ p_id: string; p_user: string; p_session: string }, Json>;
  security_finish_revocation: Rpc<{ p_id: string; p_user: string; p_success: boolean }, boolean>;
  security_prune: Rpc<Record<string, never>, undefined>;
  transactional_email_jobs: Rpc<{ p_support: boolean; p_security: boolean }, Json>;
} } };
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
