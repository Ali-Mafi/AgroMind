import assert from 'node:assert/strict';
import { createHmac, createPublicKey, randomBytes, verify } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Genuine vendor HTTP test on a disposable container, NOT a production Auth provider.
// Every fixture credential is generated during the one-time GitHub Actions job.
const realm = 'agromind-idp-lab';
const base = 'http://127.0.0.1:18080';
const root = join(process.env.RUNNER_TEMP || tmpdir(), 'agromind-keycloak-lab');
const privatePath = join(root, 'private-test-state.json');
const randomText = () => randomBytes(28).toString('base64url');
const b32 = (buffer) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let n = 0, bits = 0, output = '';
  for (const byte of buffer) {
    n = (n << 8) | byte;
    bits += 8;
    while (bits >= 5) output += chars[(n >>> (bits -= 5)) & 31];
  }
  if (bits > 0) output += chars[(n << (5 - bits)) & 31];
  return output;
};
const fromB32 = (value) => {
  const bytes = []; let n = 0, bits = 0;
  for (const c of value) {
    n = (n << 5) | 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c);
    bits += 5;
    if (bits >= 8) bytes.push((n >>> (bits -= 8)) & 255);
  }
  return Buffer.from(bytes);
};
const otp = (secret, time = Date.now()) => {
  const tick = Math.floor(time / 30000);
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(tick));
  const hash = createHmac('sha1', fromB32(secret)).update(counter).digest();
  const pos = hash[hash.length - 1] & 15;
  return ((hash.readUInt32BE(pos) & 0x7fffffff) % 1e6).toString().padStart(6, '0');
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function http(path, init = {}) {
  const response = await fetch(base + path, {
    ...init, signal: AbortSignal.timeout(12000),
    headers: { accept: 'application/json', ...(init.headers || {}) },
  });
  const raw = await response.text();
  let data = null;
  if (raw) { try { data = JSON.parse(raw); } catch { /* possibly non-JSON */ } }
  return { status: response.status, data };
}
function prepare() {
  mkdirSync(join(root, 'import'), { recursive: true, mode: 0o700 });
  const passwordA = randomText(), passwordB = randomText();
  const seed = b32(randomBytes(20));
  const user = (username, email, password, totp = false) => ({
    username, email, firstName: 'Synthetic', lastName: 'Tester',
    requiredActions: [], enabled: true, emailVerified: true,
    clientRoles: { account: ['manage-account', 'view-profile'] },
    totp,
    credentials: [
      { type: 'password', value: password, temporary: false },
      ...(totp ? [{
        type: 'otp', userLabel: 'Lab authenticator',
        secretData: JSON.stringify({ value: seed }),
        credentialData: JSON.stringify({
          digits: 6, counter: 0, period: 30, algorithm: 'HmacSHA1', subType: 'totp',
        }),
      }] : []),
    ],
  });
  const data = {
    realm, enabled: true, sslRequired: 'none', registrationAllowed: false,
    otpPolicyType: 'totp', otpPolicyAlgorithm: 'HmacSHA1',
    otpPolicyDigits: 6, otpPolicyPeriod: 30,
    clients: [{
      clientId: 'agromind-poc-cli', enabled: true, protocol: 'openid-connect',
      publicClient: true, directAccessGrantsEnabled: true, standardFlowEnabled: false,
      protocolMappers: [{
        name: 'supabase-role', protocol: 'openid-connect',
        protocolMapper: 'oidc-hardcoded-claim-mapper',
        config: {
          'claim.name': 'role', 'claim.value': 'authenticated',
          'jsonType.label': 'String', 'access.token.claim': 'true',
          'id.token.claim': 'false', 'userinfo.token.claim': 'false',
        },
      }],
    }],
    users: [
      user('synthetic-alice', 'alice@example.test', passwordA, true),
      user('synthetic-bob', 'bob@example.test', passwordB),
    ],
  };
  writeFileSync(join(root, 'import', realm + '-realm.json'), JSON.stringify(data), { mode: 0o600 });
  writeFileSync(privatePath, JSON.stringify({ passwordA, passwordB, otpSecret: seed }), { mode: 0o600 });
  if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, 'IDP_POC_DIR=' + root + '\n');
  console.log('Disposable Keycloak realm prepared; fixture credentials not logged.');
}
async function exchange(form) {
  return http('/realms/' + realm + '/protocol/openid-connect/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: 'agromind-poc-cli', ...form }),
  });
}
async function testProvider() {
  const state = JSON.parse(readFileSync(privatePath, 'utf8'));
  const discovery = await http('/realms/' + realm + '/.well-known/openid-configuration');
  assert.equal(discovery.status, 200, 'real OIDC discovery unavailable');
  assert.equal(discovery.data.issuer, base + '/realms/' + realm);
  const jwks = await fetch(discovery.data.jwks_uri).then((x) => x.json());
  assert.ok(Array.isArray(jwks.keys) && jwks.keys.length > 0);
  function verifyJwt(value) {
    const parts = value.split('.'); assert.equal(parts.length, 3);
    const hdr = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const jwk = jwks.keys.find((x) => x.kid === hdr.kid);
    assert.ok(jwk, 'Key ID absent from real provider JWKS');
    assert.equal(verify(
      'RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]),
      createPublicKey({ key: jwk, format: 'jwk' }),
      Buffer.from(parts[2], 'base64url'),
    ), true, 'JWT signature invalid');
    assert.equal(payload.iss, discovery.data.issuer);
    assert.ok(payload.exp > Math.floor(Date.now() / 1000));
    assert.equal(payload.role, 'authenticated', 'Supabase role claim absent');
    assert.match(payload.sub, /^[0-9a-f-]{36}$/i);
    return payload;
  }
  const bobPreflight = await exchange({
    grant_type: 'password', username: 'synthetic-bob', password: state.passwordB,
  });
  assert.equal(bobPreflight.status, 200, 'password-only foreign control login failed HTTP ' + bobPreflight.status +
    ' / ' + String(bobPreflight.data?.error_description || 'unspecified'));
  const withoutTotp = await exchange({
    grant_type: 'password', username: 'synthetic-alice', password: state.passwordA,
  });
  assert.notEqual(withoutTotp.status, 200, 'TOTP enrollment did not protect login');
  async function loginAlice() {
    return exchange({
      grant_type: 'password', username: 'synthetic-alice',
      password: state.passwordA, totp: otp(state.otpSecret),
    });
  }
  const a1 = await loginAlice();
  assert.equal(a1.status, 200,
    'first MFA login failed HTTP ' + a1.status + ' / ' + String(a1.data?.error || 'unknown') + ': ' + String(a1.data?.error_description || 'unspecified'));
  await delay(30000 - (Date.now() % 30000) + 1200);
  const a2 = await loginAlice();
  assert.equal(a2.status, 200,
    'second MFA login failed HTTP ' + a2.status + ' / ' + String(a2.data?.error || 'unknown') + ': ' + String(a2.data?.error_description || 'unspecified'));
  const b1 = bobPreflight;
  assert.equal(b1.status, 200, 'foreign user login failed HTTP ' + b1.status);
  const a = verifyJwt(a1.data.access_token);
  const aOther = verifyJwt(a2.data.access_token);
  const b = verifyJwt(b1.data.access_token);
  assert.equal(a.sub, aOther.sub); assert.notEqual(a.sub, b.sub);
  const route = '/realms/' + realm + '/account/sessions';
  const bearer = (token) => ({ authorization: 'Bearer ' + token });
  const anonymous = await http(route);
  assert.ok([401, 403].includes(anonymous.status), 'anonymous session listing succeeded');
  const before = await http(route, { headers: bearer(a1.data.access_token) });
  assert.equal(before.status, 200, 'account session API inaccessible HTTP ' + before.status);
  assert.ok(Array.isArray(before.data) && before.data.length >= 2, 'two native sessions not present');
  // Crucial F02 check: direct vendor endpoint receives an already elevated bearer,
  // and NO new TOTP code, action-bound challenge, or operation grant.
  const native = await http(route + '?current=false', {
    method: 'DELETE', headers: bearer(a1.data.access_token),
  });
  assert.equal(native.status, 204, 'native remote logout not demonstrated HTTP ' + native.status);
  const after = await http(route, { headers: bearer(a1.data.access_token) });
  assert.equal(after.status, 200);
  assert.equal(after.data.length, 1, 'native other session remained');
  const dead = await exchange({ grant_type: 'refresh_token', refresh_token: a2.data.refresh_token });
  assert.notEqual(dead.status, 200, 'revoked session still refreshed');
  const own = await exchange({ grant_type: 'refresh_token', refresh_token: a1.data.refresh_token });
  assert.equal(own.status, 200, 'current session was revoked');
  const foreign = await exchange({ grant_type: 'refresh_token', refresh_token: b1.data.refresh_token });
  assert.equal(foreign.status, 200, 'foreign user session was revoked');
  verifyJwt(a2.data.access_token); // signed JWT can remain cryptographically valid.
  let factor = 'NOT_VERIFIED';
  const credRoute = '/realms/' + realm + '/account/credentials';
  const creds = await http(credRoute, { headers: bearer(own.data.access_token) });
  if (creds.status === 200 && Array.isArray(creds.data)) {
    const otpCredential = creds.data.find((x) => x.type === 'otp');
    if (otpCredential?.id) {
      const result = await http(credRoute + '/' + encodeURIComponent(otpCredential.id), {
        method: 'DELETE', headers: bearer(own.data.access_token),
      });
      const remaining = await http(credRoute, { headers: bearer(own.data.access_token) });
      factor = [200, 204].includes(result.status) && remaining.status === 200 &&
        Array.isArray(remaining.data) && !remaining.data.some((x) => x.id === otpCredential.id)
        ? 'REPRODUCED_WITHOUT_FRESH_TOTP'
        : 'NOT_DEMONSTRATED_HTTP_' + result.status;
    } else factor = 'FACTOR_NOT_LISTED';
  } else factor = 'CREDENTIAL_API_HTTP_' + creds.status;
  console.log(JSON.stringify({
    provider: 'Keycloak', version: '26.8.1', environment: 'ephemeral GitHub-hosted Docker/H2',
    authenticOIDCDiscovery: 'PASS', realJWKSAndSignature: 'PASS', supabaseRoleClaim: 'PASS',
    TOTPRequiredAtLogin: 'PASS', accountSessions: 'TWO_SEPARATE_REAL_SESSIONS',
    unauthenticatedAccountAPI: 'DENIED', directOtherSessionsLogoutWithoutNewTOTP: 'REPRODUCED',
    revokedRefresh: 'DENIED', currentRefresh: 'ALLOWED', foreignRefresh: 'ALLOWED',
    revokedJWTStillSignatureValid: true, directFactorMutationWithoutNewTOTP: factor,
    realSupabaseIssuerIntegration: 'NOT_TESTED',
    realRecoveryAndOAuth: 'NOT_TESTED', disposition: 'F01_F02_NO_GO',
  }, null, 2));
}
try {
  if (process.argv[2] === '--prepare') prepare();
  else if (process.argv[2] === '--test') await testProvider();
  else throw new Error('usage: node lab.mjs --prepare|--test');
} catch (error) {
  console.error('ISOLATED_IDP_LAB_FAILED:', error.message);
  process.exitCode = 1;
}
