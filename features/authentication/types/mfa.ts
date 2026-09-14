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
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
};
