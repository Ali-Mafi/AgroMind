import { legacySnapshotSchema } from "./validation";
import type { LegacySnapshot } from "../types";
export const LEGACY_FARMS_KEY = "agromind-farms";
export const LEGACY_SCHEDULES_KEY = "agromind-irrigation-schedules";
export const LEGACY_OWNER_KEY = "agromind-legacy-owner-v1";
type StorageReader = Pick<Storage, "getItem">;
export type LegacyRead = {
  snapshot?: LegacySnapshot;
  raw?: { farms: string | null; schedules: string | null };
  error?: string;
};
export function readLegacyData(
  storage: StorageReader,
  userId: string,
): LegacyRead {
  try {
    const owner = storage.getItem(LEGACY_OWNER_KEY);
    if (owner && owner !== userId) return {};
    const raw = {
      farms: storage.getItem(LEGACY_FARMS_KEY),
      schedules: storage.getItem(LEGACY_SCHEDULES_KEY),
    };
    if (!raw.farms && !raw.schedules) return {};
    try {
      const result = legacySnapshotSchema.safeParse({
        farms: JSON.parse(raw.farms ?? "[]"),
        schedules: JSON.parse(raw.schedules ?? "{}"),
      });
      if (!result.success)
        return {
          raw,
          error:
            "The local backup could not be validated. No data was changed.",
        };
      if (
        !result.data.farms.length &&
        !Object.keys(result.data.schedules).length
      )
        return {};
      return { raw, snapshot: result.data };
    } catch {
      return {
        raw,
        error: "The local backup could not be validated. No data was changed.",
      };
    }
  } catch {
    return {
      error: "Browser storage is unavailable. Your cloud data is safe.",
    };
  }
}
export function markLegacyImported(
  storage: Pick<Storage, "setItem">,
  userId: string,
) {
  // Bookkeeping only; never used to authenticate. Originals are never removed.
  try {
    storage.setItem(LEGACY_OWNER_KEY, userId);
  } catch {
    /* The database receipt remains authoritative. */
  }
}
export function downloadBackup(value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "agromind-backup.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
