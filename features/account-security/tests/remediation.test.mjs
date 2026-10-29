import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { loadTs } from '../../weather/tests/helpers/load-ts.mjs';
const form = values => {const f=new FormData();for(const [k,v] of Object.entries(values))f.set(k,v);return f;};
process.env.SUPABASE_SERVICE_ROLE_KEY='isolated-test-key-not-a-credential';
const validPassword={password:'Synthetic#Password9',confirmPassword:'Synthetic#Password9',expected_user_id:'user-a'};
function credentialHarness(options={}) {
 const calls=[],store=new Map();let grant=null, frozen=null;
 const user={id:'user-a',email:'user@example.test',email_confirmed_at:'now',app_metadata:{provider:options.oauth?'google':'email'}};
 const factors=options.noMfa?[]:[{id:'factor-a',factor_type:'totp',status:'verified'}];
 const worker={rpc:async(name,args)=>{
  calls.push([name,args]);
  if(name==='security_begin_action') {
   if(options.rate) return {error:{}};
   grant={id:'grant',...args,state:'verifying'};return {data:'grant'};
  }
  if(name==='security_authorize_action'){grant.state=args.p_verified?'verified':'failed';return {};}
  if(name==='security_prepare_password_change'){
   if(options.expired || options.prepareError || grant.state!=='verified')return {error:{}};
   grant.state='consumed';
   if(options.prepareLost)throw Error('response lost after committed preparation');
   return {data:true};
  }
  if(name==='security_password_changed' && options.recordError)return {error:{}};
  if(name==='security_reserve_reauthentication')return options.reauthLimited?{error:{}}:{data:true};
  if(name==='security_finish_revocation')return {data:!options.pending};
  if(name==='security_has_recovery')return {data:options.recovery===true};
  if(name==='security_issue_recovery'){frozen=args;return {};}
  return {};
 }};
 const client={auth:{
  getUser:async()=>({data:{user}}),
  getClaims:async()=>({data:{claims:{sub:options.claimUser??'user-a',session_id:options.claimSession??'session-a',amr:options.amr??[]}}}),
  updateUser:async(args)=>{calls.push(['updateUser',args]);return {error:options.updateError?{}:null};},
  verifyOtp:async()=>{calls.push(['verifyOtp']);return options.badLink?{error:{code:'otp_expired'}}:{data:{user,session:{access_token:'synthetic'}}};},
  signOut:async(args)=>{calls.push(['signOut',args]);return {error:options.pending?{}:null};},
  mfa:{
   listFactors:async()=>({data:{all:factors,totp:factors}}),
   challenge:async(args)=>{calls.push(['challenge',args]);return options.challengeError?{error:{}}:{data:{id:'new-native-challenge'}};},
   verify:async(args)=>{calls.push(['verify',args]);return options.badCode?{error:{}}:{data:{}};},
   recoveryCodes:{verify:async()=>{calls.push(['backup']);return {data:{}};}},
  },
 },rpc:async(name,args)=>{calls.push([name,args]);return {data:{id:'session-a'}};}};
 let contextReads=0;
 const server={securityWorker:()=>worker,securityContext:async()=>{
  if(options.denied)throw Error('SECURITY_DENIED');
  return {userId:'user-a',sessionId:options.switched&&++contextReads>1?'session-b':'session-a'};
 },recordSecurityEvent:async()=>{}};
 const mocks={
  '@/lib/supabase/server':{createClient:async()=>client},
  '@/lib/supabase/config':{supabaseConfig:()=>({url:'https://example.test',key:'public-test'}),sessionCookieOptions:{httpOnly:true,secure:true,sameSite:'lax',path:'/'}},
  '@/features/account-security/services/server':server,'./server':server,
  '@/features/account-security/services/login':{observeLogin:async()=>{}},
  'next/headers':{headers:async()=>new Headers({host:'agromind.ir',...(options.noOrigin?{}:{origin:options.origin??'https://agromind.ir'})}),cookies:async()=>({get:k=>store.get(k),set:(k,v,o)=>store.set(k,{value:v,...o}),delete:k=>store.delete(k)})},
  'next/navigation':{redirect:path=>{throw Error('REDIRECT:'+path);}},'next/cache':{revalidatePath:()=>{}},
  '@supabase/supabase-js':{createClient:()=>({auth:{signInWithPassword:async()=>{calls.push(['passwordProof']);return options.oauth||options.badPassword?{error:{}}:{data:{user}};},mfa:{listFactors:async()=>({data:{all:options.enrolledDuringPassword?[{status:'verified'}]:[]}})},signOut:async()=>{calls.push(['cleanupPasswordProof']);return {};}}})},
 };
 if(options.recovery)store.set('agromind_password_recovery',{value:'r'.repeat(43)});
 const actions=loadTs('features/authentication/services/actions.ts',mocks);
 const proof=loadTs('features/account-security/services/action-proof.ts',mocks);
 const recovery=loadTs('features/authentication/services/recovery-authorization.ts',mocks);
 return {calls,client,user,store,actions,proof,recovery,getGrant:()=>grant,getTicket:()=>frozen};
}
test('F01 original old-AAL2 request cannot change a password or globally sign out',async()=>{
 const h=credentialHarness();const result=await h.actions.resetPasswordAction({},form(validPassword));
 assert.match(result.error,/fresh code/);assert.ok(!h.calls.some(c=>c[0]==='updateUser'||c[0]==='signOut'));
});
test('F01 a newly verified TOTP is reserved and consumed before native password mutation',async()=>{
 const h=credentialHarness();await assert.rejects(h.actions.resetPasswordAction({},form({...validPassword,proof_factor_id:'factor-a',fresh_code:'123456'})),/REDIRECT:\/sign-in\?status=password-updated$/);
 const order=h.calls.map(c=>c[0]);
 for(const [a,b] of [['security_begin_action','challenge'],['challenge','verify'],['verify','security_authorize_action'],['security_prepare_password_change','updateUser'],['updateUser','security_password_changed'],['security_password_changed','signOut']])assert.ok(order.indexOf(a)<order.indexOf(b));
 assert.equal(h.getGrant().p_operation,'password_change');assert.equal(h.getGrant().p_session,'session-a');assert.equal(h.getGrant().state,'consumed');
 assert.equal(h.calls.find(c=>c[0]==='verify')[1].challengeId,'new-native-challenge');
 assert.ok(!JSON.stringify(h.getGrant()).includes('Synthetic#Password9'));
});
test('credential action rejects wrong factor, recovery fallback, CSRF, quotas, bad OTP, expiry and session switching',async()=>{
 for(const [options,extra] of [[{}, {proof_factor_id:'foreign'}],[{}, {proof_method:'recovery'}],[{noOrigin:true},{}],[{origin:'https://evil.test'},{}],[{rate:true},{}],[{badCode:true},{}],[{challengeError:true},{}],[{expired:true},{}],[{switched:true},{}],[{denied:true},{}]]) {
  const h=credentialHarness(options);const result=await h.actions.resetPasswordAction({},form({...validPassword,proof_factor_id:'factor-a',fresh_code:'123456',...extra}));
  assert.ok(result.error);assert.ok(!h.calls.some(c=>c[0]==='updateUser'||c[0]==='signOut'));
 }
});
test('no-MFA password change requires current password and cleans the isolated verification session',async()=>{
 const h=credentialHarness({noMfa:true});await assert.rejects(h.actions.resetPasswordAction({},form({...validPassword,current_password:'test-only-password'})),/REDIRECT/);
 assert.ok(h.calls.some(c=>c[0]==='passwordProof'));assert.ok(h.calls.some(c=>c[0]==='cleanupPasswordProof'));assert.equal(h.getGrant().p_kind,'password');
 for(const options of [{badPassword:true},{oauth:true},{enrolledDuringPassword:true}]){
  const x=credentialHarness({noMfa:true,...options});const r=await x.actions.resetPasswordAction({},form({...validPassword,current_password:'test-only-password'}));assert.ok(r.error);assert.ok(!x.calls.some(c=>c[0]==='updateUser'));
 }
});
test('genuine recovery is separate, requires the ticket and still requires fresh MFA when enrolled',async()=>{
 const missing=credentialHarness();assert.match((await missing.actions.resetPasswordAction({},form({...validPassword,password_context:'recovery',fresh_code:'123456',proof_factor_id:'factor-a'}))).error,/expired/);
 const mfa=credentialHarness({recovery:true});assert.ok((await mfa.actions.resetPasswordAction({},form({...validPassword,password_context:'recovery'}))).error);
 const valid=credentialHarness({recovery:true});await assert.rejects(valid.actions.resetPasswordAction({},form({...validPassword,password_context:'recovery',fresh_code:'123456',proof_factor_id:'factor-a'})),/REDIRECT/);
 assert.equal(valid.getGrant().p_operation,'password_recovery');assert.equal(valid.store.has('agromind_password_recovery'),false);
 const oauth=credentialHarness({noMfa:true,oauth:true,recovery:true});await assert.rejects(oauth.actions.resetPasswordAction({},form({...validPassword,password_context:'recovery'})),/REDIRECT/);
 assert.equal(oauth.getGrant().p_kind,'recovery_link');assert.ok(!oauth.calls.some(c=>c[0]==='passwordProof'));
});
test('genuine recovery can use the existing provider backup-code flow only when explicitly enabled',async()=>{
 const prior=process.env.SUPABASE_RECOVERY_CODES_ENABLED;
 try {
  process.env.SUPABASE_RECOVERY_CODES_ENABLED='true';
  const h=credentialHarness({recovery:true});await assert.rejects(h.actions.resetPasswordAction({},form({...validPassword,password_context:'recovery',proof_method:'recovery',fresh_recovery_code:'test-backup-code'})),/REDIRECT/);
  assert.ok(h.calls.some(c=>c[0]==='backup'));assert.equal(h.getGrant().p_kind,'recovery_code');
  process.env.SUPABASE_RECOVERY_CODES_ENABLED='false';
  const blocked=credentialHarness({recovery:true});assert.ok((await blocked.actions.resetPasswordAction({},form({...validPassword,password_context:'recovery',proof_method:'recovery',fresh_recovery_code:'test-backup-code'}))).error);
  assert.ok(!blocked.calls.some(c=>c[0]==='updateUser'));
 }finally{if(prior===undefined)delete process.env.SUPABASE_RECOVERY_CODES_ENABLED;else process.env.SUPABASE_RECOVERY_CODES_ENABLED=prior;}
});
test('recovery token exchange issues HttpOnly ticket only after successful provider verification',async()=>{
 const h=credentialHarness();await assert.rejects(h.actions.verifyEmailAction({},form({type:'recovery',token_hash:'a'.repeat(64)})),/REDIRECT:\/reset-password/);
 assert.ok(h.getTicket());assert.equal(h.store.get('agromind_password_recovery').httpOnly,true);assert.equal(h.store.get('agromind_password_recovery').sameSite,'strict');assert.equal(h.store.get('agromind_password_recovery').maxAge,600);
 const bad=credentialHarness({badLink:true});assert.match((await bad.actions.verifyEmailAction({},form({type:'recovery',token_hash:'a'.repeat(64)}))).error,/expired/);assert.equal(bad.getTicket(),null);
});
test('PKCE recovery rejects OAuth/password/old or mismatched claims and accepts fresh signed recovery AMR',async()=>{
 const now=Math.floor(Date.now()/1000);
 for(const options of [{amr:[]},{amr:[{method:'oauth',timestamp:now}]},{amr:[{method:'password',timestamp:now}]},{amr:[{method:'recovery',timestamp:now-300}]},{amr:[{method:'recovery',timestamp:now}],claimUser:'foreign'},{amr:[{method:'recovery',timestamp:now}],claimSession:'foreign'}]){
  const h=credentialHarness(options);await assert.rejects(h.recovery.issuePkceRecoveryAuthorization(h.client),/RECOVERY_REQUIRED/);assert.equal(h.getTicket(),null);
 }
 const h=credentialHarness({amr:[{method:'recovery',timestamp:now}]});await h.recovery.issuePkceRecoveryAuthorization(h.client);assert.ok(h.getTicket());
});
test('uncertain password/logout outcomes never return confirmed logout or restore consumed authorization',async()=>{
 const h=credentialHarness({pending:true});await assert.rejects(h.actions.resetPasswordAction({},form({...validPassword,proof_factor_id:'factor-a',fresh_code:'123456'})),/REDIRECT:\/sign-in\?status=password-updated-pending/);
 assert.equal(h.getGrant().state,'consumed');
 const failed=credentialHarness({updateError:true});
 await assert.rejects(failed.actions.resetPasswordAction({},form({...validPassword,proof_factor_id:'factor-a',fresh_code:'123456'})),/REDIRECT:\/sign-in\?status=password-update-unknown/);
 assert.equal(failed.getGrant().state,'consumed');
 assert.ok(failed.calls.some(c=>c[0]==='signOut'));
});
test('F06 failed or uncertain preparation never calls native password mutation',async()=>{
 for(const options of [{prepareError:true},{prepareLost:true}]){
  const h=credentialHarness(options);
  const result=await h.actions.resetPasswordAction({},form({...validPassword,proof_factor_id:'factor-a',fresh_code:'123456'}));
  assert.match(result.error,/Password change was not attempted/);
  assert.ok(!h.calls.some(c=>c[0]==='updateUser'));
 }
});
test('F06 audit failure plus failed native logout never claims confirmed completion',async()=>{
 const h=credentialHarness({recordError:true,pending:true});
 await assert.rejects(h.actions.resetPasswordAction({},form({...validPassword,proof_factor_id:'factor-a',fresh_code:'123456'})),/REDIRECT:\/sign-in\?status=password-updated-pending/);
 const names=h.calls.map(c=>c[0]);
 assert.ok(names.indexOf('security_prepare_password_change')<names.indexOf('updateUser'));
 assert.ok(names.indexOf('updateUser')<names.indexOf('security_password_changed'));
 assert.ok(names.indexOf('security_password_changed')<names.indexOf('signOut'));
 assert.equal(h.getGrant().state,'consumed');
});
test('F08 provider nonce and optional current password accompany fresh MFA only on change',async()=>{
 const change=credentialHarness();
 await assert.rejects(change.actions.resetPasswordAction({},form({...validPassword,proof_factor_id:'factor-a',fresh_code:'123456',reauthentication_nonce:'123456',current_password:'current-test-password'})),/REDIRECT/);
 const update=change.calls.find(c=>c[0]==='updateUser')[1];
 assert.equal(update.nonce,'123456');assert.equal(update.current_password,'current-test-password');
 const invalid=credentialHarness();
 assert.ok((await invalid.actions.resetPasswordAction({},form({...validPassword,proof_factor_id:'factor-a',fresh_code:'123456',reauthentication_nonce:'abc'}))).error);
 assert.ok(!invalid.calls.some(c=>c[0]==='security_prepare_password_change'));
 const recovery=credentialHarness({recovery:true});
 await assert.rejects(recovery.actions.resetPasswordAction({},form({...validPassword,password_context:'recovery',proof_factor_id:'factor-a',fresh_code:'123456',reauthentication_nonce:'123456',current_password:'unused'})),/REDIRECT/);
 const native=recovery.calls.find(c=>c[0]==='updateUser')[1];
 assert.equal(native.nonce,undefined);assert.equal(native.current_password,undefined);
});
test('F08 reauthentication uses the server-side quota and provider API',async()=>{
 const h=credentialHarness();
 assert.match((await h.actions.requestPasswordReauthenticationAction()).success,/Verification code sent/);
 assert.ok(h.calls.some(c=>c[0]==='security_reserve_reauthentication'));
 assert.ok(h.calls.some(c=>c[0]==='reauthenticate'));
 const limited=credentialHarness({reauthLimited:true});
 assert.match((await limited.actions.requestPasswordReauthenticationAction()).error,/wait/);
 assert.ok(!limited.calls.some(c=>c[0]==='reauthenticate'));
});
test('proof digest preserves pre-upgrade revocation reservations across deployment',()=>{
 const h=credentialHarness();const oldHash=createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY).update(JSON.stringify(['session-revocation','u','f','123456'])).digest('hex');
 assert.equal(h.proof.securityProofHash('u','f','123456'),oldHash);
});
test('F04 actual worker reuses frozen payload over year/template/locale changes and provider failure',async()=>{
 const before={...process.env};Object.assign(process.env,{SECURITY_EMAIL_ENABLED:'true',NEXT_PUBLIC_SUPABASE_URL:'https://example.test',RESEND_API_KEY:'test'});
 let frozen=null,year='2026',version='old',renders=0,fail=true;const sent=[],acks=[],order=[];
 const {drainSupportEmails}=loadTs('features/support/services/notifications.ts',{
  '@supabase/supabase-js':{createClient:()=>({rpc:async(name,args)=>{
   order.push(name);
   if(name==='transactional_email_jobs_v2')return {data:[{id:'job',lease:'lease',audience:'security',to:'first@example.test',language:version==='old'?'fa':'en',deliveryPayload:frozen}]};
   if(name==='security_freeze_email'){frozen??=args.p_payload;return {data:frozen};}
   if(name==='support_email_ack')acks.push(args);
   return {data:{}};
  }})},
  '@/features/account-security/lib/email':{loginSecurityEmail:()=>{renders++;return {subject:version,html:`<p>${year}</p>`,text:year};}},
  '@/features/authentication/services/resend-auth':{sendAuthEmail:async payload=>{order.push('providerSend');sent.push(payload);if(fail)throw Error('provider timeout');}},
 });
 try {
  await drainSupportEmails();year='2027';version='deployed-template';fail=false;await drainSupportEmails();
  assert.equal(renders,1);assert.deepEqual(sent[0],sent[1]);assert.equal(sent[0].idempotencyKey,'support/job');assert.equal(acks[0].p_sent,false);assert.equal(acks[1].p_sent,true);assert.ok(order.indexOf('security_freeze_email')<order.indexOf('providerSend'));
 }finally{for(const key of Object.keys(process.env))if(!(key in before))delete process.env[key];Object.assign(process.env,before);}
});
test('F04 lost freeze response never sends an unpersisted or speculative payload',async()=>{
 const prior={...process.env};Object.assign(process.env,{SECURITY_EMAIL_ENABLED:'true',NEXT_PUBLIC_SUPABASE_URL:'https://example.test',RESEND_API_KEY:'test'});let sends=0;
 const {drainSupportEmails}=loadTs('features/support/services/notifications.ts',{
  '@supabase/supabase-js':{createClient:()=>({rpc:async(name)=>name==='transactional_email_jobs_v2'?{data:[{id:'job',lease:'lease',audience:'security',to:'test@example.test',language:'fa'}]}:name==='security_freeze_email'?{error:{}}:{data:{}}})},
  '@/features/authentication/services/resend-auth':{sendAuthEmail:async()=>{sends++;}},
 });
 try {await drainSupportEmails();assert.equal(sends,0);}finally{for(const key of Object.keys(process.env))if(!(key in prior))delete process.env[key];Object.assign(process.env,prior);}
});
