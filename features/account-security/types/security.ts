export type SessionMetadata = {
  device?: string;
  os?: string;
  browser?: string;
  ip?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};
export type SecuritySession = {
  id: string;
  current: boolean;
  createdAt: string;
  lastRefreshAt: string | null;
  state: "active" | "expired" | "blocked";
  metadata: SessionMetadata;
  provider: string | null;
};
export type SecurityEvent = {
  id: string;
  kind: string;
  created_at: string;
  details: { scope?: string; count?: number };
};
export type SecuritySnapshot = { sessions: SecuritySession[]; events: SecurityEvent[] };
