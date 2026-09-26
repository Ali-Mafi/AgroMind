import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/authentication/services/session";
import { teamOverviewSchema } from "../lib/validation";
import type { TeamOverview } from "../types";
import type { Json } from "@/lib/supabase/database.types";

type TeamRpcClient = {
  rpc: (name: "get_team_overview") => Promise<{
    data: Json | null;
    error: { message: string } | null;
  }>;
};

export async function readTeamOverview(): Promise<TeamOverview> {
  await requireUser();
  const supabase = await createClient();
  const result = await (supabase as unknown as TeamRpcClient).rpc(
    "get_team_overview",
  );

  if (result.error || !result.data)
    throw new Error("Team access could not be loaded. Please try again.");

  const parsed = teamOverviewSchema.parse(result.data);
  return {
    activeSeats: parsed.activeSeats,
    pendingSeats: parsed.pendingSeats,
    members: parsed.members.map((member) => ({
      userId: member.user_id,
      email: member.email,
      displayName: member.display_name,
      farmId: member.farm_id,
      farmName: member.farm_name,
      role: member.role,
      createdAt: member.created_at,
    })),
    invitations: parsed.invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      farmId: invitation.farm_id,
      farmName: invitation.farm_name,
      role: invitation.role,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
    })),
  };
}
