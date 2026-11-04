import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { IdentityBoundaryPoC, BoundaryError, verifySyntheticJwt } from '../src/authority.mjs';
import { totpAt } from '../src/totp.mjs';

function setup({ oauthOnly = false } = {}) {
  let now = 1_800_000_000_000;
  const authority = new IdentityBoundaryPoC({ clock: () => now, issuer: 'http://127.0.0.1/test-only' });
  const secret = randomBytes(20), outsiderSecret = randomBytes(20);
  const userId = authority.seedIdentityForTest({ id: randomUUID(), email: 'one@example.test', factorSecret: secret,
    password: oauthOnly ? null : 'old-test-only-password' });
  const otherId = authority.seedIdentityForTest({ id: randomUUID(), email: 'other@example.test', factorSecret: outsiderSecret });
  const a = authority.newSessionForTest(userId), b = authority.newSessionForTest(userId);
  const foreign = authority.newSessionForTest(otherId);
  return { authority, a, b, foreign, userId, otherId, secret,
    time: () => now, tick: ms => { now += ms; },
    proof: (token, operation, payload) => {
      const { challengeId } = authority.challenge({ bearer: token, operation, payload });
      const { grantId } = authority.verifyFreshTotp({ bearer: token, challengeId, code: totpAt(secret, now) });
      return grantId;
    },
  };
}
function denied(fn, code) { assert.throws(fn, e => e instanceof BoundaryError && (!code || e.code === code)); }

test('F01: stolen old bearer cannot mutate password, including OAuth first-password path', () => {
  for (const oauthOnly of [false,true]) {
    const x = setup({ oauthOnly });
    denied(() => x.authority.execute({ bearer: x.a.bearer, operation:'password_change', payload:{password:'very-new-test-password'} }), 'INVALID_GRANT');
    assert.equal(x.authority.testState(x.userId).passwordTag, oauthOnly ? null : createHash('sha256').update('old-test-only-password').digest('hex'));
  }
});

test('F01: fresh TOTP permits exactly one matching credential mutation', () => {
  const x = setup(); const payload = {password:'a-long-test-password'};
  const grantId = x.proof(x.a.bearer,'password_change',payload);
  assert.deepEqual(x.authority.execute({bearer:x.a.bearer,operation:'password_change',payload,grantId}),{status:'changed'});
  denied(() => x.authority.execute({bearer:x.a.bearer,operation:'password_change',payload,grantId}),'INVALID_GRANT');
  assert.equal(x.authority.testState(x.userId).audit.length,1);
});

test('F01: wrong payload, other operation, other session and other user reject proof', () => {
  const x = setup();const payload={password:'a-long-test-password'};
  const grantId=x.proof(x.a.bearer,'password_change',payload);
  denied(() => x.authority.execute({bearer:x.a.bearer,operation:'password_change',payload:{password:'another-long-password'},grantId}));
  denied(() => x.authority.execute({bearer:x.a.bearer,operation:'email_change',payload:{email:'changed@example.test'},grantId}));
  denied(() => x.authority.execute({bearer:x.b.bearer,operation:'password_change',payload,grantId}));
  denied(() => x.authority.execute({bearer:x.foreign.bearer,operation:'password_change',payload,grantId}));
  assert.equal(x.authority.testState(x.userId).audit.length,0);
  assert.equal(x.authority.execute({bearer:x.a.bearer,operation:'password_change',payload,grantId}).status,'changed');
});

test('F01: no stale TOTP reuse even with a different challenge', () => {
  const x=setup(), payload={email:'ok@example.test'};
  x.proof(x.a.bearer,'email_change',payload);
  const next=x.authority.challenge({bearer:x.a.bearer,operation:'email_change',payload});
  denied(()=>x.authority.verifyFreshTotp({bearer:x.a.bearer,challengeId:next.challengeId,code:totpAt(x.secret,x.time())}),'INVALID_TOTP');
  x.tick(30_000);
  assert.ok(x.authority.verifyFreshTotp({bearer:x.a.bearer,challengeId:next.challengeId,code:totpAt(x.secret,x.time())}).grantId);
});

test('F01: wrong TOTP denied and 3 failed verifications lock challenge', () => {
  const x=setup(), c=x.authority.challenge({bearer:x.a.bearer,operation:'email_change',payload:{email:'new@example.test'}});
  const incorrect = totpAt(x.secret,x.time()) === '000000' ? '000001' : '000000';
  for (let i=0;i<3;i++) denied(()=>x.authority.verifyFreshTotp({bearer:x.a.bearer,challengeId:c.challengeId,code:incorrect}),'INVALID_TOTP');
  denied(()=>x.authority.verifyFreshTotp({bearer:x.a.bearer,challengeId:c.challengeId,code:incorrect}),'LOCKED_CHALLENGE');
});

test('F01: expired challenge and grant fail closed',()=>{
  const x=setup(),p={email:'new@example.test'};
  const c=x.authority.challenge({bearer:x.a.bearer,operation:'email_change',payload:p});
  x.tick(120_001);
  denied(()=>x.authority.verifyFreshTotp({bearer:x.a.bearer,challengeId:c.challengeId,code:totpAt(x.secret,x.time())}),'INVALID_CHALLENGE');
  const g=x.proof(x.a.bearer,'email_change',p);
  x.tick(60_001);
  denied(()=>x.authority.execute({bearer:x.a.bearer,operation:'email_change',payload:p,grantId:g}),'INVALID_GRANT');
});

test('F01: email mutation cannot bypass operation-specific proof',()=>{
  const x=setup();denied(()=>x.authority.execute({bearer:x.a.bearer,operation:'email_change',payload:{email:'new@example.test'}}));
  const p={email:'NEW@example.test'},g=x.proof(x.a.bearer,'email_change',p);
  assert.equal(x.authority.execute({bearer:x.a.bearer,grantId:g,operation:'email_change',payload:p}).status,'changed');
  assert.equal(x.authority.testState(x.userId).email,'new@example.test');
});

test('F02: direct others/global remote signout without proof denied',()=>{
  const x=setup();for(const scope of ['others','global'])denied(()=>x.authority.execute({bearer:x.a.bearer,operation:'remote_logout',payload:{scope}}));
  assert.equal(x.authority.testState(x.userId).liveSessions,2);
});

test('F02: fresh code required even when caller has bearer already',()=>{
  const x=setup(),p={scope:'others'};
  const c=x.authority.challenge({bearer:x.a.bearer,operation:'remote_logout',payload:p});
  denied(()=>x.authority.verifyFreshTotp({bearer:x.a.bearer,challengeId:c.challengeId,code:'123abc'}),'INVALID_TOTP');
});

test('F02: others revokes only same-user other sessions, preserves current/foreign',()=>{
  const x=setup(),p={scope:'others'},g=x.proof(x.a.bearer,'remote_logout',p);
  assert.equal(x.authority.execute({bearer:x.a.bearer,grantId:g,operation:'remote_logout',payload:p}).count,1);
  assert.equal(x.authority.testState(x.userId).liveSessions,1);
  assert.equal(x.authority.testState(x.otherId).liveSessions,1);
  denied(()=>x.authority.challenge({bearer:x.b.bearer,operation:'remote_logout',payload:p}),'UNAUTHENTICATED');
  assert.ok(x.authority.challenge({bearer:x.a.bearer,operation:'remote_logout',payload:p}).challengeId);
  assert.ok(x.authority.challenge({bearer:x.foreign.bearer,operation:'remote_logout',payload:p}).challengeId);
});

test('F02: global revokes own current and others, never foreign user',()=>{
  const x=setup(),p={scope:'global'},g=x.proof(x.a.bearer,'remote_logout',p);
  assert.equal(x.authority.execute({bearer:x.a.bearer,grantId:g,operation:'remote_logout',payload:p}).count,2);
  assert.equal(x.authority.testState(x.userId).liveSessions,0);
  assert.equal(x.authority.testState(x.otherId).liveSessions,1);
  denied(()=>x.authority.challenge({bearer:x.a.bearer,operation:'remote_logout',payload:p}),'UNAUTHENTICATED');
});

test('F02: proof bound to logout scope and rejects local scope',()=>{
  const x=setup();const p={scope:'others'},g=x.proof(x.a.bearer,'remote_logout',p);
  denied(()=>x.authority.execute({bearer:x.a.bearer,grantId:g,operation:'remote_logout',payload:{scope:'global'}}),'INVALID_GRANT');
  denied(()=>x.authority.execute({bearer:x.a.bearer,grantId:g,operation:'remote_logout',payload:{scope:'local'}}),'INVALID_ACTION');
  assert.equal(x.authority.testState(x.userId).liveSessions,2);
});

test('simultaneous replay in one process grants a single mutation',async()=>{
  const x=setup(),p={email:'race@example.test'},g=x.proof(x.a.bearer,'email_change',p);
  const result=await Promise.allSettled([1,2].map(()=>Promise.resolve().then(()=>x.authority.execute({bearer:x.a.bearer,grantId:g,operation:'email_change',payload:p}))));
  assert.equal(result.filter(v=>v.status==='fulfilled').length,1);
  assert.equal(x.authority.testState(x.userId).audit.length,1);
});

test('independent verified recovery ticket permits recovery once without removing factor',()=>{
  const x=setup(),ticket=x.authority.issueVerifiedRecoveryTicketForTest(x.userId);
  denied(()=>x.authority.recoverWithTrustedTicket({ticket:'made-up-recovery',newPassword:'recovered-test-password'}),'INVALID_RECOVERY');
  x.authority.recoverWithTrustedTicket({ticket,newPassword:'recovered-test-password'});
  denied(()=>x.authority.recoverWithTrustedTicket({ticket,newPassword:'different-test-password'}),'INVALID_RECOVERY');
  assert.equal(x.authority.testState(x.userId).liveSessions,0);
  const newSession=x.authority.newSessionForTest(x.userId);
  const c=x.authority.challenge({bearer:newSession.bearer,operation:'email_change',payload:{email:'verified@example.test'}});
  assert.ok(x.authority.verifyFreshTotp({bearer:newSession.bearer,challengeId:c.challengeId,code:totpAt(x.secret,x.time())}).grantId);
});

test('signed RS256 synthetic JWT includes role/sub and rejects tampering',()=>{
  const x=setup(),jwt=x.authority.accessJwtForTest(x.a.bearer),jwks=x.authority.jwksForTest();
  assert.equal(jwks.keys.length,1);
  assert.equal(verifySyntheticJwt(jwt,jwks.keys[0],{issuer:'http://127.0.0.1/test-only',nowMs:x.time()}),true);
  assert.equal(verifySyntheticJwt(jwt,jwks.keys[0],{issuer:'https://different.invalid',nowMs:x.time()}),false);
  const parts=jwt.split('.'); const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString());
  assert.equal(payload.sub,x.userId); assert.equal(payload.role,'authenticated');
  assert.equal(payload.aal,'aal1');
  payload.sub=x.otherId;
  const forged=[parts[0],Buffer.from(JSON.stringify(payload)).toString('base64url'),parts[2]].join('.');
  assert.equal(verifySyntheticJwt(forged,jwks.keys[0],{issuer:'http://127.0.0.1/test-only',nowMs:x.time()}),false);
  x.tick(301_000);
  assert.equal(verifySyntheticJwt(jwt,jwks.keys[0],{issuer:'http://127.0.0.1/test-only',nowMs:x.time()}),false);
});

test('JWT signature can remain valid after session is revoked: RLS must check session state',()=>{
  const x=setup();
  const jwt=x.authority.accessJwtForTest(x.b.bearer);
  const jwk=x.authority.jwksForTest().keys[0];
  const p={scope:'others'},g=x.proof(x.a.bearer,'remote_logout',p);
  x.authority.execute({bearer:x.a.bearer,grantId:g,operation:'remote_logout',payload:p});
  // Cryptographic verification alone is not session revocation.
  assert.equal(verifySyntheticJwt(jwt,jwk,{issuer:'http://127.0.0.1/test-only',nowMs:x.time()}),true);
  denied(()=>x.authority.accessJwtForTest(x.b.bearer),'UNAUTHENTICATED');
});

test('recovery token expires, and raw bearer never creates a recovery grant',()=>{
  const x=setup(), ticket=x.authority.issueVerifiedRecoveryTicketForTest(x.userId);
  denied(()=>x.authority.recoverWithTrustedTicket({ticket:x.a.bearer,newPassword:'replacement-password'}),'INVALID_RECOVERY');
  x.tick(600_001);
  denied(()=>x.authority.recoverWithTrustedTicket({ticket,newPassword:'replacement-password'}),'INVALID_RECOVERY');
});
