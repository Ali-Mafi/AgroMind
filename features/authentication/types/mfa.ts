export type MfaActionState = {
  error?: string;
  success?: string;
};

export type RecoveryCodeState = {
  available: boolean;
  enabled: boolean;
  total: number;
  remaining: number;
};

export type RecoveryCodesResult =
  | { error: string }
  | { codes: string[]; total: number };

export type MfaSecurityState = {
  enabled: boolean;
  factors: Array<{
    id: string;
    friendlyName: string;
  }>;
  currentLevel: string | null;
  nextLevel: string | null;
  recoveryCodes: RecoveryCodeState;
};
