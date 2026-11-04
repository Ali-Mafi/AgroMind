/**
 * OFFLINE provider-readiness decision gate, NOT a provider API test or release certification.
 * Source documents and candidate metadata are untrusted research inputs.
 */
const REQUIRED = Object.freeze([
  'credential_stepup', 'remote_logout_stepup', 'native_origin_isolation',
  'recovery_safety', 'trusted_oidc', 'legacy_auth_cutover',
  'rls_session_proof', 'hosted_negative_tests',
]);
const POSSIBLE = new Set(['PASS', 'FAIL', 'UNKNOWN']);

export function screenCandidate(candidate, { ownerSpendingApproved = false } = {}) {
  if (!candidate || typeof candidate !== 'object') throw new TypeError('candidate required');
  const reasons = [];
  const gates = candidate.gates ?? {};
  for (const gate of REQUIRED) {
    if (!POSSIBLE.has(gates[gate])) reasons.push(`INVALID_OR_MISSING:${gate}`);
    else if (gates[gate] !== 'PASS') reasons.push(`${gates[gate]}:${gate}`);
  }
  // A public remote-session API that requires only bearer cannot enforce universal fresh TOTP.
  for (const route of candidate.public_sensitive_routes ?? []) {
    if (!route || !['CREDENTIAL_MUTATION', 'REMOTE_LOGOUT'].includes(route.operation)) {
      reasons.push('INVALID_PUBLIC_ROUTE');
      continue;
    }
    if (route.enforcement === 'BEARER_ONLY') {
      reasons.push(`DIRECT_BYPASS:${route.operation}`);
    } else if (route.enforcement !== 'FRESH_OPERATION_BOUND_TOTP_VERIFIED') {
      reasons.push(`UNVERIFIED_ROUTE:${route.operation}`);
    }
  }
  if (!Array.isArray(candidate.public_sensitive_routes)) reasons.push('MISSING_ROUTE_INVENTORY');
  if (candidate.production_mfa_paid && !ownerSpendingApproved) reasons.push('NO_PAID_MFA_AUTHORIZATION');
  if (!candidate.evidence || candidate.evidence.hosted_negative_tests !== 'SIGNED_HTTP_WITH_ISOLATED_ACCOUNTS')
    reasons.push('NO_HOSTED_PROVIDER_PROOF');
  if (!candidate.evidence || candidate.evidence.rls_session_proof !== 'ISOLATED_DATABASE_HTTP_TESTED')
    reasons.push('NO_ISOLATED_RLS_PROOF');
  if (!candidate.evidence || candidate.evidence.independent_security_review !== 'COMPLETE')
    reasons.push('NO_INDEPENDENT_AUDIT');
  const hardFailure = reasons.some(x => x.startsWith('FAIL:') || x.startsWith('DIRECT_BYPASS:'));
  return {
    candidate: candidate.id ?? null,
    disposition: hardFailure ? 'REJECT_AS_IS' : reasons.length ? 'BLOCKED_RESEARCH_ONLY' : 'READY_FOR_OWNER_SECURITY_DECISION',
    reasons: [...new Set(reasons)],
    // Never returns GO or implies the candidate protects current production.
    productionApproved: false,
  };
}

export function screenAll(manifest, options = {}) {
  if (!manifest || !Array.isArray(manifest.candidates)) throw new TypeError('candidates required');
  return manifest.candidates.map(candidate => screenCandidate(candidate, options));
}
