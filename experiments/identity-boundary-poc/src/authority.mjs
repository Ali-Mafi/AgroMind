/**
 * OFFLINE SECURITY EXPERIMENT, not an OIDC identity provider or production auth.
 * Synthetic fixtures; in-memory single-process state; no Supabase connections.
 */
import {
  createHash, createHmac, generateKeyPairSync, randomBytes, randomUUID,
  sign, verify,
} from 'node:crypto';
import { verifiedCounter } from './totp.mjs';

const MAX_PROOF_AGE_MS = 120_000;
const GRANT_AGE_MS = 60_000;
const RECOVERY_AGE_MS = 600_000;

export class BoundaryError extends Error {
  constructor(code, status = 403) { super(code); this.code = code; this.status = status; }
}

const deny = (code = 'DENIED', status = 403) => { throw new BoundaryError(code, status); };
const hash = (value) => createHash('sha256').update(value).digest('hex');
const opaque = () => randomBytes(32).toString('base64url');
const enc = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

function normalizeAction(operation, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) deny('INVALID_ACTION', 400);
  if (operation === 'password_change') {
    if (typeof payload.password !== 'string' || payload.password.length < 12 || payload.password.length > 256)
      deny('INVALID_ACTION', 400);
    if (Object.keys(payload).length !== 1) deny('INVALID_ACTION', 400);
    return { password: payload.password };
  }
  if (operation === 'email_change') {
    if (typeof payload.email !== 'string' || payload.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))
      deny('INVALID_ACTION', 400);
    if (Object.keys(payload).length !== 1) deny('INVALID_ACTION', 400);
    return { email: payload.email.toLowerCase() };
  }
  if (operation === 'remote_logout') {
    if (!['others', 'global'].includes(payload.scope) || Object.keys(payload).length !== 1)
      deny('INVALID_ACTION', 400);
    return { scope: payload.scope };
  }
  deny('UNSUPPORTED_OPERATION', 404);
}

export class IdentityBoundaryPoC {
  #users = new Map();
  #sessions = new Map();
  #challenges = new Map();
  #grants = new Map();
  #recovery = new Map();
  #audit = [];
  #pepper = randomBytes(32);
  #signing;
  #kid = randomUUID();
  #clock;
  #issuer;

  constructor({ clock = () => Date.now(), issuer = 'http://127.0.0.1/NO-HOSTED-ISSUER' } = {}) {
    this.#clock = clock;
    this.#issuer = issuer;
    this.#signing = generateKeyPairSync('rsa', { modulusLength: 2048 });
  }

  // TEST-ONLY fixture provisioning. These are NEVER mapped to an HTTP route.
  seedIdentityForTest({ id = randomUUID(), email, factorSecret, password = null }) {
    if (this.#users.has(id) || !Buffer.isBuffer(factorSecret) || factorSecret.length < 20 || !email)
      deny('INVALID_TEST_FIXTURE', 400);
    this.#users.set(id, {
      id, email, factorSecret: Buffer.from(factorSecret),
      passwordTag: password === null ? null : hash(password), lastCounter: -1,
    });
    return id;
  }

  newSessionForTest(userId) {
    if (!this.#users.has(userId)) deny('UNKNOWN_TEST_USER', 404);
    const bearer = opaque();
    const id = randomUUID();
    this.#sessions.set(hash(bearer), { id, userId, revoked: false });
    return { bearer, sessionId: id };
  }

  #session(bearer) {
    if (typeof bearer !== 'string' || bearer.length < 32) deny('UNAUTHENTICATED', 401);
    const session = this.#sessions.get(hash(bearer));
    if (!session || session.revoked) deny('UNAUTHENTICATED', 401);
    return session;
  }

  #digest(operation, payload) {
    return createHmac('sha256', this.#pepper)
      .update(JSON.stringify([operation, normalizeAction(operation, payload)]))
      .digest('hex');
  }

  challenge({ bearer, operation, payload }) {
    const session = this.#session(bearer);
    const digest = this.#digest(operation, payload);
    const id = opaque();
    const expiresAt = this.#clock() + MAX_PROOF_AGE_MS;
    this.#challenges.set(hash(id), {
      userId: session.userId, sessionId: session.id,
      operation, digest, expiresAt, used: false, failures: 0,
    });
    return { challengeId: id, expiresAt };
  }

  verifyFreshTotp({ bearer, challengeId, code }) {
    const session = this.#session(bearer);
    if (typeof challengeId !== 'string') deny();
    const challenge = this.#challenges.get(hash(challengeId));
    if (!challenge || challenge.used || challenge.expiresAt <= this.#clock() ||
        challenge.userId !== session.userId || challenge.sessionId !== session.id) deny('INVALID_CHALLENGE');
    if (++challenge.failures > 3) { challenge.used = true; deny('LOCKED_CHALLENGE', 429); }
    const user = this.#users.get(session.userId);
    const counter = verifiedCounter(user.factorSecret, code, this.#clock(), user.lastCounter);
    if (counter === null) deny('INVALID_TOTP');
    user.lastCounter = counter;
    challenge.used = true;
    const grantId = opaque();
    this.#grants.set(hash(grantId), {
      userId: session.userId, sessionId: session.id, operation: challenge.operation,
      digest: challenge.digest, expiresAt: Math.min(challenge.expiresAt, this.#clock() + GRANT_AGE_MS),
      used: false,
    });
    return { grantId };
  }

  execute({ bearer, grantId, operation, payload }) {
    const session = this.#session(bearer);
    const digest = this.#digest(operation, payload);
    const grant = typeof grantId === 'string' ? this.#grants.get(hash(grantId)) : null;
    if (!grant || grant.used || grant.expiresAt <= this.#clock() ||
        grant.userId !== session.userId || grant.sessionId !== session.id ||
        grant.operation !== operation || grant.digest !== digest) deny('INVALID_GRANT');
    // Synchronous single-process consume-before-mutate demonstration.
    // NOT distributed/transactional across production providers!
    grant.used = true;
    const user = this.#users.get(session.userId);
    const clean = normalizeAction(operation, payload);
    if (operation === 'password_change') {
      // Synthetic marker only. No credential provider integration.
      user.passwordTag = hash(clean.password);
      this.#audit.push({ userId: user.id, event: 'password_changed', sessionId: session.id });
      return { status: 'changed' };
    }
    if (operation === 'email_change') {
      user.email = clean.email;
      this.#audit.push({ userId: user.id, event: 'email_changed', sessionId: session.id });
      return { status: 'changed' };
    }
    if (operation === 'remote_logout') {
      let count = 0;
      for (const s of this.#sessions.values()) {
        if (s.userId === session.userId &&
            (clean.scope === 'global' || s.id !== session.id) && !s.revoked) {
          s.revoked = true;
          count++;
        }
      }
      this.#audit.push({ userId: user.id, event: 'remote_logout', scope: clean.scope, count });
      return { status: 'revoked', count };
    }
    deny();
  }

  // Trusted recovery *fixture*: in production only an independently verified,
  // auditable out-of-band recovery authority could mint this kind of ticket.
  issueVerifiedRecoveryTicketForTest(userId) {
    if (!this.#users.has(userId)) deny('UNKNOWN_TEST_USER');
    const ticket = opaque();
    this.#recovery.set(hash(ticket), { userId, expiresAt: this.#clock() + RECOVERY_AGE_MS, used: false });
    return ticket;
  }

  recoverWithTrustedTicket({ ticket, newPassword }) {
    // NO authenticated-session-only recovery. The proof is a separate opaque ticket.
    normalizeAction('password_change', { password: newPassword });
    const r = typeof ticket === 'string' ? this.#recovery.get(hash(ticket)) : null;
    if (!r || r.used || r.expiresAt <= this.#clock()) deny('INVALID_RECOVERY');
    r.used = true;
    const user = this.#users.get(r.userId);
    user.passwordTag = hash(newPassword);
    for (const s of this.#sessions.values()) if (s.userId === r.userId) s.revoked = true;
    this.#audit.push({ userId: r.userId, event: 'verified_recovery', revokedSessions: true });
    // TOTP factor is intentionally retained, never reset by password recovery.
    return { status: 'recovered' };
  }

  accessJwtForTest(bearer) {
    const session = this.#session(bearer);
    const iat = Math.floor(this.#clock() / 1000);
    const header = enc({ typ: 'JWT', alg: 'RS256', kid: this.#kid });
    const claims = enc({ iss: this.#issuer, aud: 'authenticated',
      sub: session.userId, role: 'authenticated', session_id: session.id,
      aal: 'aal1', iat, nbf: iat, exp: iat + 300, jti: randomUUID() });
    const data = `${header}.${claims}`;
    const signature = sign('RSA-SHA256', Buffer.from(data), this.#signing.privateKey).toString('base64url');
    return `${data}.${signature}`;
  }

  jwksForTest() {
    const publicJwk = this.#signing.publicKey.export({ format: 'jwk' });
    return { keys: [{ ...publicJwk, kid: this.#kid, alg: 'RS256', use: 'sig' }] };
  }

  // Diagnostics deliberately limited to synthetic unit tests; never an HTTP endpoint.
  testState(userId) {
    const u = this.#users.get(userId);
    if (!u) return null;
    return { email: u.email, passwordTag: u.passwordTag,
      liveSessions: [...this.#sessions.values()].filter(s => s.userId === userId && !s.revoked).length,
      acceptedTotpCounter: u.lastCounter,
      audit: this.#audit.filter(e => e.userId === userId).map(e => ({ ...e })),
    };
  }
}

export function verifySyntheticJwt(jwt, jwk, { issuer, nowMs = Date.now() }) {
  const parts = typeof jwt === 'string' ? jwt.split('.') : [];
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (header.alg !== 'RS256' || header.kid !== jwk.kid ||
        payload.iss !== issuer || payload.aud !== 'authenticated' ||
        payload.role !== 'authenticated' || payload.exp <= Math.floor(nowMs / 1000) ||
        payload.nbf > Math.floor(nowMs / 1000)) return false;
    return verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`),
      { key: jwk, format: 'jwk' }, Buffer.from(parts[2], 'base64url'));
  } catch { return false; }
}
