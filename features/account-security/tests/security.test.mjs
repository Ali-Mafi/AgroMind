import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadTs, localRequire } from "../../weather/tests/helpers/load-ts.mjs";
import { localizedRenderer } from "../../settings/tests/helpers/render.mjs";
const { requestMetadata, describeDevice } = loadTs("features/account-security/lib/metadata.ts");
const { loginSecurityEmail } = loadTs("features/account-security/lib/email.ts");
const form = (values = {}) => { const f = new FormData(); for (const [k,v] of Object.entries(values)) f.set(k,v); return f; };

function revocationHarness(options = {}) {
  const calls = [];
  const client = { auth: { mfa: {
    listFactors: async () => ({ data: { totp: options.noFactor ? [] : [{ id:"factor-a", status:"verified" }] } }),
    challenge: async (args) => { calls.push(["challenge",args]); return { data:{ id:"native-challenge" } }; },
    verify: async (args) => { calls.push(["verify",args]); return options.invalid ? { error:{} } : { data:{} }; },
  }, signOut: async args => { calls.push(["signOut",args]); return options.providerFailure ? { error:{} } : {}; } } };
  const worker = { rpc: async (name,args) => {
    calls.push([name,args]);
    if (name === "security_begin_revocation") return options.limited ? { error:{} } : { data:"operation" };
    if (name === "security_consume_revocation") return options.expired ? { error:{} } : { data:{ scope:args.p_scope ?? options.scope ?? "others", count:2 } };
    return { data: !options.providerFailure };
  } };
  const { revokeRemoteSessions } = loadTs("features/account-security/services/revoke.ts", {
    "next/headers": { headers: async () => new Headers({ host:"agromind.ir", ...(options.noOrigin ? {} : { origin:options.origin ?? "https://agromind.ir" }) }) },
    "@/lib/supabase/server": { createClient: async () => client },
    "./server": { securityWorker: () => worker, securityContext: async () => { if (options.unauthorized) throw Error("denied"); return { userId:"user-a",sessionId:"session-a" }; } },
  });
  return { calls, run: (extra = {}) => revokeRemoteSessions(form({ scope:options.scope ?? "others",proof_factor_id:"factor-a",fresh_code:"123456", ...extra })) };
}
process.env.SUPABASE_SERVICE_ROLE_KEY = "isolated-unit-test-key";
test("remote sign-out always creates and verifies a new native TOTP challenge before one-time consumption", async () => {
  const h = revocationHarness(); assert.ok((await h.run()).success);
  assert.deepEqual(h.calls.map(c=>c[0]), ["security_begin_revocation","challenge","verify","security_consume_revocation","signOut","security_finish_revocation"]);
  const proof = h.calls[0][1]; assert.match(proof.p_proof_hash,/^[a-f0-9]{64}$/); assert.notEqual(proof.p_proof_hash,"123456");
  assert.deepEqual(h.calls[2][1],{factorId:"factor-a",challengeId:"native-challenge",code:"123456"});
});
test("missing/foreign factor, recovery/password proof and AAL2 without a code cannot revoke", async () => {
  for (const extra of [{fresh_code:""},{proof_factor_id:"foreign"},{proof_method:"recovery"},{fresh_code:"",current_password:"password"}]) {
    const h=revocationHarness(); assert.ok((await h.run(extra)).error); assert.equal(h.calls.length,0);
  }
  const h=revocationHarness({noFactor:true}); assert.match((await h.run()).error,/Set up an authenticator/); assert.equal(h.calls.length,0);
});
test("CSRF, unsigned user, client target IDs, invalid OTP, quota and expired proof fail closed", async () => {
  for(const options of [{origin:"https://evil.test"},{noOrigin:true},{unauthorized:true},{invalid:true},{limited:true},{expired:true}]) {
    const h=revocationHarness(options); assert.ok((await h.run()).error); assert.ok(!h.calls.some(c=>c[0]==="signOut"));
  }
  const h=revocationHarness(); assert.ok((await h.run({target_session_id:"foreign"})).error); assert.equal(h.calls.length,0);
});
test("provider failure never reports revoked and global scope is bound to its proof", async () => {
  const failure=revocationHarness({providerFailure:true}); assert.match((await failure.run()).error,/could not be confirmed/);
  const global=revocationHarness({scope:"global"}); assert.equal((await global.run()).global,true);
  assert.equal(global.calls.find(c=>c[0]==="signOut")[1].scope,"global");
});
test("metadata ignores spoofed forwarded values outside Vercel and handles missing/malformed geolocation", () => {
  const headers=new Headers({"x-real-ip":"203.0.113.7","x-vercel-ip-city":"Qazvin","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Version/18.0 Mobile/15 Safari/604.1"});
  const local=requestMetadata(headers,false); assert.equal(local.ip,null);assert.equal(local.city,null); assert.equal(local.device,"Mobile");
  const trusted=requestMetadata(headers,true);assert.equal(trusted.ip,"203.0.113.7");assert.equal(trusted.city,"Qazvin");
  headers.set("x-real-ip","forged, 127.0.0.1");headers.set("x-vercel-ip-city","%not-encoded");
  assert.equal(requestMetadata(headers,true).ip,null);
  assert.equal(requestMetadata(new Headers(),true).country,null);
  assert.deepEqual(describeDevice(null),{device:"Unknown device",os:"Unknown operating system",browser:"Unknown browser"});
  assert.equal(describeDevice("Mozilla/5.0 (Linux; Android 15; Tablet) Chrome/120 Safari/537").device,"Tablet");
});
test("localized login email uses the shared premium shell, safe metadata and only a security CTA", () => {
  for(const lang of ["fa","en"]) {
    const email=loginSecurityEmail({metadata:{device:"Mobile",os:"iOS",browser:"Safari",ip:"203.0.113.7",city:'<script>alert(1)</script>'},provider:"google",loginAt:"2026-10-28T12:00:00Z"},lang);
    assert.match(email.html,new RegExp(`lang="${lang}"`)); assert.match(email.html,new RegExp(`dir="${lang==="fa"?"rtl":"ltr"}"`));
    assert.match(email.html,/https:\/\/agromind.ir\/account\/security/);assert.match(email.html,/max-width:600px/);assert.doesNotMatch(email.html,/<script>/);
    assert.match(email.text,/203.0.113.7/);assert.match(email.text,/Google/);
    assert.doesNotMatch(email.text,/access_token|refresh_token|totp.secret|session_id/);
  }
  assert.match(loginSecurityEmail({},"en").text,/Unknown location|Unavailable/);
});
test("security cards render English/Persian, Jalali timestamps, current state and missing historical details", () => {
  for(const language of ["en","fa"]) {
    const renderer=localizedRenderer({language,calendar:language==="fa"?"persian":"gregory"});
    const {SessionPanel}=renderer.load("features/account-security/components/session-panel.tsx", {"@/features/authentication/services/actions":{logoutAction:async()=>({})}});
    const html=renderer.renderToStaticMarkup(localRequire("react").createElement(SessionPanel,{snapshot:{sessions:[{id:"s",current:true,createdAt:"2026-10-28T12:00:00Z",state:"active",metadata:{},provider:null,lastRefreshAt:null}],events:[]},mfaEnabled:true,onRevoke(){},onEnroll(){}}));
    assert.match(html,language==="fa"?/نشست فعلی/:/Current session/);
    assert.match(html,language==="fa"?/۱۴۰۵/:/2026/);assert.match(html,language==="fa"?/در دسترس نیست/:/Unavailable/);
  }
});
test("authoritative session context refuses missing, foreign or revoked session before reading history", async()=>{
  for(const active of [{data:null},{data:{id:"sid"},error:{} }]) {
    const {securityContext}=loadTs("features/account-security/services/server.ts");
    await assert.rejects(securityContext({auth:{getUser:async()=>({data:{user:{id:"u",email_confirmed_at:"now"}}})},rpc:async()=>active}),/SECURITY_DENIED/);
  }
});
test("all genuine server sign-in paths observe sessions; refresh and browser events do not emit notifications",()=>{
  const text=p=>readFileSync(p,"utf8");
  assert.match(text("features/authentication/services/actions.ts"),/observeLogin\("password"\)/);
  assert.match(text("features/authentication/services/callback.ts"),/observeLogin\("google"\)/);
  assert.ok(text("features/authentication/services/mfa-actions.ts").includes("await observeLogin()"));
  assert.ok(!text("proxy.ts").includes("observeLogin"));
});

test("login observation preserves server method/MFA context, retries by session and never blocks authentication on failure",async()=>{
 let queued=true, failed=false; const calls=[], deliveries=[];
 const {observeLogin}=loadTs('features/account-security/services/login.ts',{
  'next/headers':{headers:async()=>new Headers({'user-agent':'browser','x-real-ip':'203.0.113.4'})},
  'next/server':{after:fn=>deliveries.push(fn)},
  '@/lib/supabase/server':{createClient:async()=>({auth:{mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal1',currentAuthenticationMethods:[{method:'password'}]}})}}})},
  './server':{securityContext:async()=>({userId:'verified-user',sessionId:'real-session'}),securityWorker:()=>({rpc:async(name,args)=>{calls.push([name,args]);if(failed)throw Error('database down');return {data:queued};}})},
  '@/features/support/services/notifications':{drainSupportEmails:async()=>{}},
 });
 await observeLogin('password');assert.equal(calls[0][1].p_provider,'password');assert.equal(calls[0][1].p_aal,'aal1');assert.equal(calls[0][1].p_session,'real-session');
 queued=false;await observeLogin();assert.equal(deliveries.length,1);
 queued=true;await observeLogin('google');assert.equal(calls.at(-1)[1].p_provider,'google');
 failed=true;await assert.doesNotReject(observeLogin('password'));
});
