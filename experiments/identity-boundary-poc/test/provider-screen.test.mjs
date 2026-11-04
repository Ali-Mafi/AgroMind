import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { screenAll, screenCandidate } from '../src/provider-screen.mjs';

const candidates = JSON.parse(readFileSync(new URL('../provider-screen.json', import.meta.url), 'utf8')).candidates;
const baseline = Object.fromEntries([
  'credential_stepup', 'remote_logout_stepup', 'native_origin_isolation', 'recovery_safety',
  'trusted_oidc', 'legacy_auth_cutover', 'rls_session_proof', 'hosted_negative_tests',
].map(x => [x, 'PASS']));
const fake = () => ({ id: 'synthetic-all-pass', gates: { ...baseline }, public_sensitive_routes: [], production_mfa_paid: false,
  evidence: { hosted_negative_tests: 'SIGNED_HTTP_WITH_ISOLATED_ACCOUNTS', rls_session_proof: 'ISOLATED_DATABASE_HTTP_TESTED', independent_security_review: 'COMPLETE' } });

test('official source-screened Kratos public remote-session API fails universal F02', () => {
  const result = screenCandidate(candidates[0]);
  assert.equal(result.disposition, 'REJECT_AS_IS');
  assert.ok(result.reasons.includes('DIRECT_BYPASS:REMOTE_LOGOUT'));
  assert.equal(result.productionApproved, false);
});

test('SuperTokens private Core is research only: MFA licensing, IdP, RLS, and hosted proof absent', () => {
  const result = screenCandidate(candidates[1]);
  assert.equal(result.disposition, 'BLOCKED_RESEARCH_ONLY');
  assert.ok(result.reasons.includes('NO_PAID_MFA_AUTHORIZATION'));
  assert.ok(result.reasons.includes('UNKNOWN:trusted_oidc'));
});

test('granting hypothetical budget does not certify missing provider enforcement', () => {
  assert.equal(screenCandidate(candidates[1], { ownerSpendingApproved: true }).disposition, 'BLOCKED_RESEARCH_ONLY');
});

test('all manifest candidates fail to obtain production approval', () => {
  assert.equal(screenAll({ candidates }).length, 2);
  assert.ok(screenAll({ candidates }).every(x => x.productionApproved === false));
});

for (const [field, value] of [
  ['credential_stepup', 'UNKNOWN'], ['remote_logout_stepup', 'FAIL'],
  ['native_origin_isolation', 'UNKNOWN'], ['recovery_safety', 'UNKNOWN'],
  ['trusted_oidc', 'UNKNOWN'], ['legacy_auth_cutover', 'UNKNOWN'],
  ['rls_session_proof', 'UNKNOWN'], ['hosted_negative_tests', 'UNKNOWN'],
]) {
  test(`fail-closed whenever ${field} is ${value}`, () => {
    const x = fake(); x.gates[field] = value;
    assert.notEqual(screenCandidate(x).disposition, 'READY_FOR_OWNER_SECURITY_DECISION');
  });
}

test('missing native-route inventory cannot be accepted', () => {
  const x = fake(); delete x.public_sensitive_routes;
  assert.ok(screenCandidate(x).reasons.includes('MISSING_ROUTE_INVENTORY'));
});

test('unknown alternate sensitive route blocks acceptance', () => {
  const x = fake(); x.public_sensitive_routes.push({ operation: 'CREDENTIAL_MUTATION', enforcement: 'UNKNOWN' });
  assert.ok(screenCandidate(x).reasons.includes('UNVERIFIED_ROUTE:CREDENTIAL_MUTATION'));
});

test('provider docs or SDK mocks cannot substitute signed hosted negative tests', () => {
  const x = fake(); x.evidence.hosted_negative_tests = 'SDK_MOCK';
  assert.equal(screenCandidate(x).disposition, 'BLOCKED_RESEARCH_ONLY');
});

test('RLS migration must be tested over isolated database HTTP, not just local SQL', () => {
  const x = fake(); x.evidence.rls_session_proof = 'SQL_FIXTURE';
  assert.ok(screenCandidate(x).reasons.includes('NO_ISOLATED_RLS_PROOF'));
});

test('final decision requires independent audit and does not auto-authorize production', () => {
  const x = fake();
  assert.equal(screenCandidate(x).disposition, 'READY_FOR_OWNER_SECURITY_DECISION');
  assert.equal(screenCandidate(x).productionApproved, false);
  x.evidence.independent_security_review = 'NOT_RUN';
  assert.equal(screenCandidate(x).disposition, 'BLOCKED_RESEARCH_ONLY');
});

test('invalid enum and malformed route fail closed', () => {
  const x = fake(); x.gates.credential_stepup = 'TRUE'; x.public_sensitive_routes = [null];
  const res = screenCandidate(x);
  assert.ok(res.reasons.includes('INVALID_OR_MISSING:credential_stepup'));
  assert.ok(res.reasons.includes('INVALID_PUBLIC_ROUTE'));
});
