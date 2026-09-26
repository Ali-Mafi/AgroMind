import { z } from "zod";

export const teamRoleSchema = z.enum(["manager", "worker", "viewer"]);

export const invitationEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254);

export const inviteTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/);

export const inviteMemberSchema = z.object({
  farmId: z.string().min(1).max(120),
  email: invitationEmailSchema,
  role: teamRoleSchema,
});

export const changeRoleSchema = z.object({
  farmId: z.string().min(1).max(120),
  userId: z.string().uuid(),
  role: teamRoleSchema,
});

export const removeMemberSchema = z.object({
  farmId: z.string().min(1).max(120),
  userId: z.string().uuid(),
});

export const revokeInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});

export const teamOverviewSchema = z.object({
  activeSeats: z.number().int().nonnegative(),
  pendingSeats: z.number().int().nonnegative(),
  members: z.array(
    z.object({
      user_id: z.string().uuid(),
      email: z.string().email(),
      display_name: z.string().min(1),
      farm_id: z.string().min(1),
      farm_name: z.string().min(1),
      role: teamRoleSchema,
      created_at: z.string(),
    }),
  ),
  invitations: z.array(
    z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      farm_id: z.string().min(1),
      farm_name: z.string().min(1),
      role: teamRoleSchema,
      expires_at: z.string(),
      created_at: z.string(),
    }),
  ),
});

export const acceptedInvitationSchema = z.object({
  farm_id: z.string().min(1),
  farm_name: z.string().min(1),
  role: teamRoleSchema,
});
