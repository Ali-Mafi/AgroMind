// RFC 6238/HOTP demonstration. Local test identities only; no real MFA credentials.
import { createHmac, timingSafeEqual } from 'node:crypto';

const STEP_MS = 30_000;

export function totpAt(secret, nowMs) {
  if (!Buffer.isBuffer(secret) || secret.length < 20 || !Number.isFinite(nowMs))
    throw new Error('invalid synthetic TOTP input');
  const counter = Math.floor(nowMs / STEP_MS);
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', secret).update(bytes).digest();
  const offset = digest[digest.length - 1] & 15;
  const number = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(number).padStart(6, '0');
}

export function verifiedCounter(secret, input, nowMs, lastAcceptedCounter = -1) {
  if (typeof input !== 'string' || !/^\d{6}$/.test(input)) return null;
  const current = Math.floor(nowMs / STEP_MS);
  // Permit the previous step for clock skew, but never reuse an accepted counter.
  for (const c of [current, current - 1]) {
    if (c < 0 || c <= lastAcceptedCounter) continue;
    const expected = totpAt(secret, c * STEP_MS);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(input))) return c;
  }
  return null;
}
