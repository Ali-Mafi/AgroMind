export type MfaActionState = {
  error?: string;
  success?: string;
};

export type MfaSecurityState = {
  enabled: boolean;
  factors: Array<{
    id: string;
    friendlyName: string;
  }>;
  currentLevel: string | null;
  nextLevel: string | null;
};
