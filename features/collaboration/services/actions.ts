"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/authentication/services/session";
import { sendAuthEmail } from "@/features/authentication/services/resend-auth";
import { mutationContext } from "@/features/cloud/services/data";
import type { Json } from "@/lib/supabase/database.types";
import { renderFarmInvitationEmail } from "../emails/templates";
import { teamError } from "../lib/errors";
import {
  acceptedInvitationSchema,
  changeRoleSchema,
  createdInvitationSchema,
  inviteMemberSchema,
  inviteTokenSchema,
  removeMemberSchema,
  revokeInvitationSchema,
} from "../lib/validation";
import { readTeamOverview } from "./data";
import { collaborationRequestOrigin } from "./origin";
import type {
  AcceptedInvitation,
  TeamActionResult,
  TeamOverview,
} from "../types";

type CollaborationRpcClient = {
  rpc: (
    name:
      | "create_farm_invitation"
      | "revoke_farm_invitation"
      | "accept_farm_invitation"
      | "decline_farm_invitation",
    args: Record<string, unknown>,
  ) => Promise<{
    data: Json | null;
    error: { message: string } | null;
  }>;
};

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function verifiedActor(expectedUserId: string) {
  const user = await requireUser();
  if (user.id !== expectedUserId)
    throw new Error("ACCOUNT_CHANGED");
  return user;
}

async function refreshedTeam(): Promise<TeamOverview> {
  revalidatePath("/account/team");
  return readTeamOverview();
}

export async function inviteFarmMemberAction(
  input: unknown,
  expectedUserId: string,
): Promise<TeamActionResult<TeamOverview>> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Check the email, farm and role." };

  try {
    const user = await verifiedActor(expectedUserId);
    const supabase = await createClient();
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashInviteToken(token);
    const rpc = supabase as unknown as CollaborationRpcClient;
    const createdResult = await rpc.rpc("create_farm_invitation", {
      p_farm_id: parsed.data.farmId,
      p_email: parsed.data.email,
      p_role: parsed.data.role,
      p_token_hash: tokenHash,
    });
    if (createdResult.error || !createdResult.data)
      throw createdResult.error ?? new Error("INVITATION_INVALID");

    const created = createdInvitationSchema.parse(createdResult.data);
    const profile = await supabase
      .from("profiles")
      .select("language")
      .eq("id", user.id)
      .single();
    const language = profile.data?.language === "fa" ? "fa" : "en";
    const origin = await collaborationRequestOrigin();
    const href = new URL(`/invite/${token}`, origin).toString();
    const rendered = renderFarmInvitationEmail({
      href,
      farmName: created.farm_name,
      role: parsed.data.role,
      language,
    });

    try {
      await sendAuthEmail({
        ...rendered,
        to: parsed.data.email,
        idempotencyKey:
          `agromind-team/${created.id}/${tokenHash.slice(0, 20)}`,
      });
    } catch {
      // Do not leave an apparently valid pending invite when delivery failed.
      await rpc.rpc("revoke_farm_invitation", {
        p_invitation_id: created.id,
      });
      throw new Error("EMAIL_UNAVAILABLE");
    }

    return { ok: true, data: await refreshedTeam() };
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "message" in error &&
      error.message === "ACCOUNT_CHANGED"
    )
      return {
        ok: false,
        error: "Your account changed. Reload before saving.",
      };
    return { ok: false, error: teamError(error) };
  }
}

export async function changeFarmMemberRoleAction(
  input: unknown,
  expectedUserId: string,
): Promise<TeamActionResult<TeamOverview>> {
  const parsed = changeRoleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Choose a valid team role." };

  try {
    await verifiedActor(expectedUserId);
    const { supabase, accountId } = await mutationContext();
    const { error } = await supabase.rpc("set_farm_member", {
      p_account_id: accountId,
      p_farm_id: parsed.data.farmId,
      p_user_id: parsed.data.userId,
      p_role: parsed.data.role,
    });
    if (error) throw error;
    return { ok: true, data: await refreshedTeam() };
  } catch (error) {
    return { ok: false, error: teamError(error) };
  }
}

export async function removeFarmMemberAction(
  input: unknown,
  expectedUserId: string,
): Promise<TeamActionResult<TeamOverview>> {
  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "The team member could not be removed." };

  try {
    await verifiedActor(expectedUserId);
    const { supabase, accountId } = await mutationContext();
    const { error } = await supabase.rpc("remove_farm_member", {
      p_account_id: accountId,
      p_farm_id: parsed.data.farmId,
      p_user_id: parsed.data.userId,
    });
    if (error) throw error;
    return { ok: true, data: await refreshedTeam() };
  } catch (error) {
    return { ok: false, error: teamError(error) };
  }
}

export async function revokeFarmInvitationAction(
  input: unknown,
  expectedUserId: string,
): Promise<TeamActionResult<TeamOverview>> {
  const parsed = revokeInvitationSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "This invitation is invalid or no longer available." };

  try {
    await verifiedActor(expectedUserId);
    const supabase = await createClient();
    const rpc = supabase as unknown as CollaborationRpcClient;
    const result = await rpc.rpc("revoke_farm_invitation", {
      p_invitation_id: parsed.data.invitationId,
    });
    if (result.error) throw result.error;
    return { ok: true, data: await refreshedTeam() };
  } catch (error) {
    return { ok: false, error: teamError(error) };
  }
}

export async function acceptFarmInvitationAction(
  token: unknown,
): Promise<TeamActionResult<AcceptedInvitation>> {
  const parsed = inviteTokenSchema.safeParse(token);
  if (!parsed.success)
    return { ok: false, error: "This invitation is invalid or no longer available." };

  try {
    await requireUser();
    const supabase = await createClient();
    const rpc = supabase as unknown as CollaborationRpcClient;
    const result = await rpc.rpc("accept_farm_invitation", {
      p_token_hash: hashInviteToken(parsed.data),
    });
    if (result.error || !result.data)
      throw result.error ?? new Error("INVITATION_INVALID");

    const accepted = acceptedInvitationSchema.parse(result.data);
    revalidatePath("/", "layout");
    return {
      ok: true,
      data: {
        farmId: accepted.farm_id,
        farmName: accepted.farm_name,
        role: accepted.role,
      },
    };
  } catch (error) {
    return { ok: false, error: teamError(error) };
  }
}

export async function declineFarmInvitationAction(
  token: unknown,
): Promise<TeamActionResult<null>> {
  const parsed = inviteTokenSchema.safeParse(token);
  if (!parsed.success)
    return { ok: false, error: "This invitation is invalid or no longer available." };

  try {
    await requireUser();
    const supabase = await createClient();
    const rpc = supabase as unknown as CollaborationRpcClient;
    const result = await rpc.rpc("decline_farm_invitation", {
      p_token_hash: hashInviteToken(parsed.data),
    });
    if (result.error) throw result.error;
    revalidatePath("/", "layout");
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, error: teamError(error) };
  }
}
