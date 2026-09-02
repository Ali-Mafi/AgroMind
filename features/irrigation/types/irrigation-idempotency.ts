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

    export interface IrrigationDueClaimCompleteRequest {
  claimId: string;
  idempotencyKey: string;
  workerId: string;
  completedAt: string;
}

export type IrrigationClaimFailureDisposition =
  | "retry-after-lease"
  | "manual-review"
  | "do-not-retry";

export interface IrrigationDueClaimFailRequest {
  claimId: string;
  idempotencyKey: string;
  workerId: string;
  failedAt: string;
  reason: string;
  disposition: IrrigationClaimFailureDisposition;
}

export type IrrigationDueClaimResolutionResult =
  | {
      status: "completed";
      completedAt: string;
    }
  | {
      status: "failed";
      failedAt: string;
      disposition: IrrigationClaimFailureDisposition;
    }
  | {
      status: "lease-lost";
    }
  | {
      status: "claim-not-owned";
    };