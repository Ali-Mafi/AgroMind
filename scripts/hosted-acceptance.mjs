// Explicit disposable target. Secrets stay in a private local file, never evidence.
import fs from 'node:fs';
import {randomBytes,sign,createPrivateKey,createHmac} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const root='/workspace/scratch/c5453627dc88/acceptance-private';
let lock;
try { lock=fs.openSync(root+'/controller.lock','wx',0o600); }
catch { console.log(JSON.stringify({fatal:'CONTROLLER_BUSY'}));process.exit(1); }
process.on('exit',()=>{fs.closeSync(lock);fs.unlinkSync(root+'/controller.lock');});
const url='https://lpkxwwdzuligovfgpfey.supabase.co';
const key=fs.readFileSync(root+'/anon','utf8').trim();
const signer=createPrivateKey(fs.readFileSync(root+'/controller.pem'));
const statePath=root+'/state.json';
let state=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{run:randomBytes(4).toString('hex'),users:[],results:[]};
const save=()=>fs.writeFileSync(statePath,JSON.stringify(state),{mode:0o600});
const result=(id,passed,detail)=>{state.results.push({id,status:passed?'PASS':'FAIL',detail,at:new Date().toISOString()});save();console.log(JSON.stringify(state.results.at(-1)));};
async function control(input){
 const body=JSON.stringify(input),time=String(Date.now());
 const r=await fetch(url+'/functions/v1/pr67-acceptance',{method:'POST',headers:{'content-type':'application/json','x-acceptance-time':time,'x-acceptance-signature':sign("sha256",Buffer.from(time+'\n'+body),{key:signer,dsaEncoding:"ieee-p1363"}).toString('base64')},body,signal:AbortSignal.timeout(25000)});
 const d=await r.json();return {status:r.status,...d};
}
function client(user){return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:user?.session?{Authorization:'Bearer '+user.session.access_token}:{}}});}
async function signedClient(user){const c=client();const s=await c.auth.setSession(user.session);if(s.error)throw new Error('SESSION_REJECTED');return c;}
function totp(seed){
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of seed.replace(/=+$/,''))bits+=alphabet.indexOf(c.toUpperCase()).toString(2).padStart(5,'0');
 const bytes=Buffer.from((bits.match(/.{8}/g)??[]).map(x=>parseInt(x,2)));
 const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
 const h=createHmac('sha1',bytes).update(counter).digest();const n=h.readUInt32BE(h[19]&15)&0x7fffffff;return String(n%1000000).padStart(6,'0');
}
function code(error){return error?.code??null;}
const mode=process.argv[2];
try {
 if(mode==='seed'){
  const health=await control({op:'health'});result('runner.signed',health.status===200&&health.ref==='lpkxwwdzuligovfgpfey','Signed controller; exact project guard; native staging server credential present');
  if(health.status!==200)throw new Error('RUNNER_UNAVAILABLE');
  for(const alias of ['a','b','c']){
   let u=state.users.find(u=>u.alias===alias);
   if(!u){u={alias,email:'pr67_'+state.run+'_'+alias+'@example.invalid',password:randomBytes(24).toString('hex')};state.users.push(u);save();}
   if(!u.id){const r=await control({op:'create',email:u.email,password:u.password});if(r.status!==200)throw new Error('ADMIN_CREATE_'+r.code);u.id=r.id;save();}
   const c=client();const login=await c.auth.signInWithPassword({email:u.email,password:u.password});
   if(login.error)throw new Error('LOGIN_'+code(login.error));u.session=login.data.session;save();
   const claims=await c.auth.getClaims();result('native.jwt.'+alias,!claims.error&&claims.data.claims.sub===u.id&&typeof claims.data.claims.session_id==='string','Actual provider token verified by SDK getClaims; expected synthetic subject and session ID');
   const factor=await c.auth.mfa.enroll({factorType:'totp',friendlyName:'qa67_'+state.run+'_'+alias});
   if(factor.error)throw new Error('ENROLL_'+code(factor.error));u.factor=factor.data.id;u.seed=factor.data.totp.secret;save();
   const verify=await c.auth.mfa.challengeAndVerify({factorId:u.factor,code:totp(u.seed)});
   if(verify.error)throw new Error('MFA_'+code(verify.error));u.session=(await c.auth.getSession()).data.session;save();
   const upgraded=await c.auth.getClaims();result('native.mfa.'+alias,!upgraded.error&&upgraded.data.claims.aal==='aal2','Native provider factor enrollment/challenge/verify; signed AAL2 token');
  }
  result('native.admin_seed',true,'Three synthetic .invalid users confirmed by administrator API; genuine signup/email confirmation NOT TESTED; no email sent');
  const a=await signedClient(state.users[0]);const other=await a.from('profiles').select('id').eq('id',state.users[1].id);
  result('baseline.cross_user_read',!other.error&&other.data.length===0,'Real signed-user PostgREST RLS excludes another synthetic profile');
  const old=await a.rpc('change_username',{p_username:'qa67_'+state.run+'_baseline'});
  result('baseline.legacy_username',!old.error,'Actual baseline legacy RPC accepts owned native AAL2 before retirement');
  const farm=await a.rpc('create_farm',{p_data:{id:'qa67_'+state.run,name:'Synthetic QA Farm',location:'Synthetic only',area:1,type:'farm'}});
  result('baseline.farm_seed',!farm.error,'Created synthetic app row via actual signed-user PostgREST RPC');
 }
 if(mode==='username'){
  const [a,b]=state.users;const ca=await signedClient(a);const cb=await signedClient(b);const anon=client();
  const legacy=await ca.rpc('change_username',{p_username:'qa67_'+state.run+'_legacy'});result('66-01.legacy',Boolean(legacy.error),{provider_code:code(legacy.error)});
  const dml=await ca.from('profiles').update({username:'qa67_'+state.run+'_dml'}).eq('id',a.id);result('66-01.dml',Boolean(dml.error),{provider_code:code(dml.error)});
  for(const [label,c] of [['anon',anon],['authenticated',ca]])for(const name of ['username_reserve_grant','username_verify_grant']){
   const args=name==='username_reserve_grant'?{p_user:a.id,p_session:(await ca.auth.getClaims()).data.claims.session_id,p_factor:a.factor,p_username:'qa67_'+state.run+'_acl'}:{p_id:crypto.randomUUID(),p_user:a.id,p_session:(await ca.auth.getClaims()).data.claims.session_id,p_factor:a.factor,p_proof_hash:'a'.repeat(64)};
   const r=await c.rpc(name,args);result('66-02.'+label+'.'+name,Boolean(r.error),{provider_code:code(r.error)});
  }
  const noGrant=await ca.rpc('change_username_authorized',{p_grant:crypto.randomUUID(),p_username:'qa67_'+state.run+'_none'});
  result('66-04.no_fresh_grant',Boolean(noGrant.error),{provider_code:code(noGrant.error)});
  const target='qa67_'+state.run+'_changed';
  // Wait for a new native TOTP time-step: enrollment already consumed a code.
  const usedCode=totp(a.seed);
  const fresh=await control({op:'authorize',userId:a.id,username:target,session:a.session,factorId:a.factor,code:usedCode});
  result('66-05.audited_adapter',fresh.status===200&&Boolean(fresh.grant),{status:fresh.status,code:fresh.code??null,method:'Exact candidate authorizeUsername bundle; actual native getClaims/getUser/session/MFA and service PostgREST grant attestation'});
  if(fresh.status!==200)throw new Error('AUTHORIZE_'+fresh.code);
  a.session=fresh.session;a.grant=fresh.grant;a.target=target;save();
  const upgraded=await signedClient(a);
  const wrong=await cb.rpc('change_username_authorized',{p_grant:a.grant,p_username:target});result('66-06.foreign_user',Boolean(wrong.error),{provider_code:code(wrong.error)});
  const mismatch=await upgraded.rpc('change_username_authorized',{p_grant:a.grant,p_username:target+'_x'});result('66-06.target_mismatch',Boolean(mismatch.error),{provider_code:code(mismatch.error)});
  const race=await Promise.all([1,2].map(()=>upgraded.rpc('change_username_authorized',{p_grant:a.grant,p_username:target})));
  result('66-08.concurrent',race.filter(r=>!r.error).length===1&&race.filter(r=>r.error).length===1,{success_count:race.filter(r=>!r.error).length,rejection_count:race.filter(r=>r.error).length});
  const replay=await upgraded.rpc('change_username_authorized',{p_grant:a.grant,p_username:target});result('66-07.consumed',Boolean(replay.error),{provider_code:code(replay.error)});
  const available=await anon.rpc('username_available',{p_username:target.toUpperCase()});result('66-09.case_availability',!available.error&&available.data===false,'Actual public availability sees normalized consumed username');
  const again=await control({op:'authorize',userId:a.id,username:target+'_y',session:a.session,factorId:a.factor,code:usedCode});result('66-07.exact_code_replay',again.status!==200,{status:again.status,code:again.code??null});
  const foreign=await control({op:'authorize',userId:a.id,username:target+'_z',session:a.session,factorId:b.factor,code:totp(b.seed)});result('66-06.foreign_factor',foreign.status!==200,{status:foreign.status,code:foreign.code??null});
 }
 if(mode==='negative-native'){
  const a=state.users[0];const c=await signedClient(a);
  const bad=await c.auth.mfa.challengeAndVerify({factorId:a.factor,code:'000000'});result('65-03.wrong_totp',Boolean(bad.error),{provider_code:code(bad.error)});
  const actual=await c.auth.getClaims();result('66-03.identity',!actual.error&&actual.data.claims.sub===a.id,'Actual signed token validates expected synthetic identity');
  const pieces=a.session.access_token.split('.');let payload=JSON.parse(Buffer.from(pieces[1],'base64url'));payload.sub=state.users[1].id;pieces[1]=Buffer.from(JSON.stringify(payload)).toString('base64url');
  const forged=await fetch(url+'/rest/v1/profiles?select=id',{headers:{apikey:key,Authorization:'Bearer '+pieces.join('.')}});result('66-03.forged_jwt',forged.status===401,{http_status:forged.status});
 }
 if(mode==='prepare-advanced'){
  const [a,b,c]=state.users;
  b.pendingTarget='qa67_'+state.run+'_expires';const used=totp(b.seed);
  const first=await control({op:'authorize',userId:b.id,username:b.pendingTarget,session:b.session,factorId:b.factor,code:used});
  if(first.status!==200)throw new Error('ADVANCED_AUTHORIZE_'+first.code);
  b.pending=first.grant;b.pendingAt=Date.now();b.session=first.session;save();
  const replay=await control({op:'authorize',userId:b.id,username:b.pendingTarget+'_r',session:b.session,factorId:b.factor,code:used});
  result('66-07.exact_code_replay',replay.status!==200,{status:replay.status,code:replay.code??null,method:'Reused the exact prior proof string; earlier moving-time-step probe was invalid and is superseded'});
  const cb=await signedClient(b);const mismatch=await cb.rpc('change_username_authorized',{p_grant:b.pending,p_username:b.pendingTarget+'_x'});
  result('66-06.target_live_grant',Boolean(mismatch.error),{provider_code:code(mismatch.error)});
  const second=client();const login=await second.auth.signInWithPassword({email:b.email,password:b.password});if(login.error)throw new Error('SECOND_SESSION_REJECTED');
  const aal1=await second.rpc('change_username_authorized',{p_grant:b.pending,p_username:b.pendingTarget});result('66-04.aal1',Boolean(aal1.error),{provider_code:code(aal1.error)});
  const upgrade=await second.auth.mfa.challengeAndVerify({factorId:b.factor,code:totp(b.seed)});if(upgrade.error)throw new Error('SECOND_SESSION_MFA_REJECTED');
  const foreignSession=await second.rpc('change_username_authorized',{p_grant:b.pending,p_username:b.pendingTarget});result('66-06.other_session',Boolean(foreignSession.error),{provider_code:code(foreignSession.error)});
  const ca=await signedClient(a);const claims=await ca.auth.getClaims();
  const reserve=await control({op:'rpc',name:'username_reserve_grant',args:{p_user:a.id,p_session:claims.data.claims.session_id,p_factor:a.factor,p_username:'qa67_'+state.run+'_unverified'}});
  if(reserve.error||typeof reserve.data!=='string')throw new Error('UNVERIFIED_RESERVE_REJECTED');
  const unverified=await ca.rpc('change_username_authorized',{p_grant:reserve.data,p_username:'qa67_'+state.run+'_unverified'});result('66-07.unverified',Boolean(unverified.error),{provider_code:code(unverified.error)});
  c.rollbackTarget='qa67_'+state.run+'_rollback';
  const rollback=await control({op:'authorize',userId:c.id,username:c.rollbackTarget,session:c.session,factorId:c.factor,code:totp(c.seed)});
  if(rollback.status!==200)throw new Error('ROLLBACK_AUTHORIZE_'+rollback.code);
  c.rollbackGrant=rollback.grant;c.session=rollback.session;save();result('66-10.prepared',true,'Actual native-MFA attested unconsumed grant prepared for audit-failure injection');
 }
 if(mode==='renew-rollback'){
  const c=state.users[2];const r=await control({op:'authorize',userId:c.id,username:c.rollbackTarget,session:c.session,factorId:c.factor,code:totp(c.seed)});
  if(r.status!==200)throw new Error('ROLLBACK_RENEW_'+r.code);c.rollbackGrant=r.grant;c.session=r.session;save();result('66-10.renewed',true,'Fresh native-MFA grant; original expired preparation retained as historical fixture');
 }
 if(mode==='rollback-fail'||mode==='rollback-retry'){
  const c=state.users[2];const cc=await signedClient(c);const r=await cc.rpc('change_username_authorized',{p_grant:c.rollbackGrant,p_username:c.rollbackTarget});
  result(mode==='rollback-fail'?'66-10.audit_rejection':'66-10.same_grant_retry',mode==='rollback-fail'?r.error?.message==='QA67_FORCED_AUDIT_FAILURE':!r.error,{provider_code:code(r.error),forced_audit_failure:r.error?.message==='QA67_FORCED_AUDIT_FAILURE'});
 }
 if(mode==='expire-and-revoke'){
  const [a,b,c]=state.users;const cb=await signedClient(b);
  if(Date.now()-b.pendingAt<125000)throw new Error('WAIT_FOR_REAL_GRANT_EXPIRY');
  const expired=await cb.rpc('change_username_authorized',{p_grant:b.pending,p_username:b.pendingTarget});result('66-07.expired',Boolean(expired.error),{provider_code:code(expired.error),elapsed_seconds:Math.floor((Date.now()-b.pendingAt)/1000)});
  const taken=await control({op:'authorize',userId:b.id,username:a.target,session:b.session,factorId:b.factor,code:totp(b.seed)});
  if(taken.status!==200)throw new Error('COLLISION_AUTHORIZE_'+taken.code);b.session=taken.session;save();
  const b2=await signedClient(b);const collision=await b2.rpc('change_username_authorized',{p_grant:taken.grant,p_username:a.target.toUpperCase()});result('66-09.unique_collision',collision.error?.code==='23505',{provider_code:code(collision.error)});
  const revokeTarget='qa67_'+state.run+'_revoked';const revoke=await control({op:'authorize',userId:c.id,username:revokeTarget,session:c.session,factorId:c.factor,code:totp(c.seed)});
  if(revoke.status!==200)throw new Error('REVOKE_AUTHORIZE_'+revoke.code);c.session=revoke.session;save();
  const cc=await signedClient(c);const removed=await cc.auth.mfa.unenroll({factorId:c.factor});if(removed.error)throw new Error('UNENROLL_REJECTED');
  const rejected=await cc.rpc('change_username_authorized',{p_grant:revoke.grant,p_username:revokeTarget});result('66-12.factor_revoked',Boolean(rejected.error),{provider_code:code(rejected.error)});
 }
 if(mode==='password'){
  let d=state.users.find(u=>u.alias==='d');
  if(!d){d={alias:'d',email:'pr67_'+state.run+'_d@example.invalid',password:randomBytes(24).toString('hex')};state.users.push(d);save();const made=await control({op:'create',email:d.email,password:d.password});if(made.status!==200)throw new Error('PASSWORD_SEED_REJECTED');d.id=made.id;save();}
  const cd=client();const login=await cd.auth.signInWithPassword({email:d.email,password:d.password});if(login.error)throw new Error('PASSWORD_LOGIN_REJECTED');d.session=login.data.session;save();
  const proposed='QA67!aA1'+randomBytes(20).toString('hex');
  const wrong=await control({op:'password',userId:d.id,session:d.session,password:proposed,currentPassword:'wrong_password_value'});result('65-01.wrong_current',wrong.status!==200,{status:wrong.status,code:wrong.code??null});
  const ordinary=await control({op:'password',userId:d.id,session:d.session,password:proposed,currentPassword:d.password});
  result('65-01.authorized_change',ordinary.status===200&&ordinary.authorized&&ordinary.expectedUser&&!ordinary.error,{status:ordinary.status,code:ordinary.code??ordinary.error?.code??null});
  if(ordinary.status!==200||ordinary.error)throw new Error('PASSWORD_UPDATE_REJECTED');
  const old=await client().auth.signInWithPassword({email:d.email,password:d.password});const fresh=await client().auth.signInWithPassword({email:d.email,password:proposed});
  result('65-01.fresh_login',Boolean(old.error)&&!fresh.error&&fresh.data.user?.id===d.id,{old_rejected:Boolean(old.error),new_expected_user:!fresh.error&&fresh.data.user?.id===d.id});d.password=proposed;d.session=fresh.data.session;save();
  const a=state.users[0];const next='QA67!aA1'+randomBytes(20).toString('hex');
  for(const [label,proof] of [['missing',{}],['wrong',{factorId:a.factor,code:'000000'}],['backup_disabled',{backup:true,code:'12345678'}]]){
   const r=await control({op:'password',userId:a.id,session:a.session,password:next,...proof});result('65-03.'+label,r.status!==200,{status:r.status,code:r.code??null});
  }
  const mfa=await control({op:'password',userId:a.id,session:a.session,password:next,factorId:a.factor,code:totp(a.seed)});result('65-02.authorized_change',mfa.status===200&&mfa.authorized&&mfa.expectedUser&&!mfa.error,{status:mfa.status,code:mfa.code??mfa.error?.code??null});
  if(mfa.status!==200||mfa.error)throw new Error('MFA_PASSWORD_UPDATE_REJECTED');
  const oldA=await client().auth.signInWithPassword({email:a.email,password:a.password});const freshA=await client().auth.signInWithPassword({email:a.email,password:next});
  result('65-02.fresh_login',Boolean(oldA.error)&&!freshA.error&&freshA.data.user?.id===a.id,{old_rejected:Boolean(oldA.error),new_expected_user:!freshA.error&&freshA.data.user?.id===a.id});a.password=next;a.session=mfa.session;save();
 }
 if(mode==='final-native'){
  const a=state.users[0],b=state.users[1];
  const acl=await control({op:'service_acl'});result('66-02.service',acl.status===200&&acl.legacyCode==='42501'&&acl.consumeCode==='42501',{legacy_code:acl.legacyCode,consume_code:acl.consumeCode});
  const username=await fetch(url+'/functions/v1/username-login',{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:JSON.stringify({username:a.target,password:a.password})});
  const body=await username.json();const cc=client();let valid=false;
  if(username.ok&&body.access_token&&body.refresh_token){const login=await cc.auth.setSession(body);const claims=await cc.auth.getClaims();valid=!login.error&&!claims.error&&claims.data.claims.sub===a.id;}
  result('66-11.username_login',valid,{http_status:username.status,expected_identity:valid,method:'Unmodified candidate username-login Edge Function; native provider signed token; no email confirmation test'});
  const t='qa67_'+state.run+'_sessiongone';const fresh=await control({op:'authorize',userId:b.id,username:t,session:b.session,factorId:b.factor,code:totp(b.seed)});
  if(fresh.status!==200)throw new Error('REVOKED_SESSION_AUTHORIZE_'+fresh.code);b.session=fresh.session;save();
  const cb=await signedClient(b);const signedOut=await cb.auth.signOut({scope:'global'});if(signedOut.error)throw new Error('NATIVE_LOGOUT_REJECTED');
  const bearer=client(b);const consume=await bearer.rpc('change_username_authorized',{p_grant:fresh.grant,p_username:t});result('66-12.session_revoked',Boolean(consume.error),{provider_code:code(consume.error)});
  for(const [id,time,sig] of [['unsigned',String(Date.now()),''],['wrong_signature',String(Date.now()),Buffer.alloc(64).toString('base64')],['expired',String(Date.now()-120000),'']]){
   const body=JSON.stringify({op:'health'});const s=sig||(id==='expired'?sign('sha256',Buffer.from(time+'\n'+body),{key:signer,dsaEncoding:'ieee-p1363'}).toString('base64'):'');
   const probe=await fetch(url+'/functions/v1/pr67-acceptance',{method:'POST',headers:{'content-type':'application/json','x-acceptance-time':time,'x-acceptance-signature':s},body});
   result('runner.'+id,probe.status===401,{http_status:probe.status});
  }
 }
 if(mode==='provider-rejections'){
  const d=state.users.find(u=>u.alias==='d');const c=client();const login=await c.auth.signInWithPassword({email:d.email,password:d.password});if(login.error)throw new Error('PROVIDER_REJECTION_LOGIN_FAILED');
  const weak=await c.auth.updateUser({password:'x'});result('65-14.provider_weak',Boolean(weak.error),{provider_code:code(weak.error)});
  const same=await c.auth.updateUser({password:d.password});result('65-14.provider_same',Boolean(same.error),{provider_code:code(same.error)});
  const check=await client().auth.signInWithPassword({email:d.email,password:d.password});result('65-14.credential_unchanged',!check.error&&check.data.user?.id===d.id,'Independent native login confirms unchanged credential after explicit provider rejections');
 }
 if(mode==='export')console.log(JSON.stringify({run:state.run,results:state.results,synthetic_users:state.users.map(u=>({alias:u.alias,id:u.id})),candidate:'9e371da2f883405daab3d0aa4a665f68c4fa6860'}));
}catch(e){console.log(JSON.stringify({fatal:/^[A-Z_0-9]+$/.test(e.message)?e.message:'CONTROLLER_ERROR'}));process.exitCode=1;}
