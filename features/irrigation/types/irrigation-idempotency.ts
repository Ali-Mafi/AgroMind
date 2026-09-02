export interface IrrigationDueClaimRequest {
  idempotencyKey: string;

  farmId: string;

  scheduleId: string;

  scheduleRevision: number;

  workerId: string;

  requestedAt: string;
}

export type IrrigationDueClaimResult =
  | {
      status: "claimed";

      claimId: string;

      claimedAt: string;

      leaseExpiresAt: string;
    }
  | {
      status: "already-claimed";

      claimedAt: string;

      leaseExpiresAt: string;
    }
  | {
      status: "already-completed";

      completedAt: string;
    };