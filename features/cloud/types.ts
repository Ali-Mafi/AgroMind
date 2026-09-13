import type { Farm } from "@/features/farms/types/farms";
import type { IrrigationSchedule } from "@/features/irrigation/types/irrigation";
import type {
  Account,
  Plan,
  Profile,
  Subscription,
} from "@/lib/supabase/database.types";
import type { Entitlements } from "@/features/entitlements/lib/entitlements";
export type CloudSnapshot = {
  user: { id: string; email: string; verified: boolean; createdAt: string };
  profile: Profile;
  account: Account;
  plan: Plan;
  subscription: Subscription;
  entitlements: Entitlements;
  farms: Farm[];
  irrigationSchedules: Record<string, IrrigationSchedule>;
  migration: {
    fingerprint: string;
    imported_farms: number;
    imported_schedules: number;
    created_at: string;
  } | null;
};
export type CloudResult<T> =
  { ok: true; data: T } | { ok: false; error: string };
export type LegacySnapshot = {
  farms: Farm[];
  schedules: Record<string, IrrigationSchedule>;
};
