export type TeamRole = "manager" | "worker" | "viewer";

export type TeamMemberAssignment = {
  userId: string;
  email: string;
  displayName: string;
  farmId: string;
  farmName: string;
  role: TeamRole;
  createdAt: string;
};

export type PendingFarmInvitation = {
  id: string;
  email: string;
  farmId: string;
  farmName: string;
  role: TeamRole;
  expiresAt: string;
  createdAt: string;
};

export type TeamOverview = {
  activeSeats: number;
  pendingSeats: number;
  members: TeamMemberAssignment[];
  invitations: PendingFarmInvitation[];
};

export type TeamActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type AcceptedInvitation = {
  farmId: string;
  farmName: string;
  role: TeamRole;
};
