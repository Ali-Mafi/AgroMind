// Explicit disposable target. Secrets stay in a private local file, never evidence.
import fs from 'node:fs';
import {randomBytes,sign,createPrivateKey,createHmac} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const root='/workspace/scratch/c5453627dc88/acceptance-private';
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
  const fresh=await control({op:'authorize',userId:a.id,username:target,session:a.session,factorId:a.factor,code:totp(a.seed)});
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
  const again=await control({op:'authorize',userId:a.id,username:target+'_y',session:a.session,factorId:a.factor,code:totp(a.seed)});result('66-07.proof_replay',again.status!==200,{status:again.status,code:again.code??null});
  const foreign=await control({op:'authorize',userId:a.id,username:target+'_z',session:a.session,factorId:b.factor,code:totp(b.seed)});result('66-06.foreign_factor',foreign.status!==200,{status:foreign.status,code:foreign.code??null});
 }
 if(mode==='negative-native'){
  const a=state.users[0];const c=await signedClient(a);
  const bad=await c.auth.mfa.challengeAndVerify({factorId:a.factor,code:'000000'});result('65-03.wrong_totp',Boolean(bad.error),{provider_code:code(bad.error)});
  const actual=await c.auth.getClaims();result('66-03.identity',!actual.error&&actual.data.claims.sub===a.id,'Actual signed token validates expected synthetic identity');
  const pieces=a.session.access_token.split('.');let payload=JSON.parse(Buffer.from(pieces[1],'base64url'));payload.sub=state.users[1].id;pieces[1]=Buffer.from(JSON.stringify(payload)).toString('base64url');
  const forged=await fetch(url+'/rest/v1/profiles?select=id',{headers:{apikey:key,Authorization:'Bearer '+pieces.join('.')}});result('66-03.forged_jwt',forged.status===401,{http_status:forged.status});
 }
 if(mode==='export')console.log(JSON.stringify({run:state.run,results:state.results,synthetic_users:state.users.map(u=>({alias:u.alias,id:u.id})),candidate:'9e371da2f883405daab3d0aa4a665f68c4fa6860'}));
}catch(e){console.log(JSON.stringify({fatal:/^[A-Z_0-9]+$/.test(e.message)?e.message:'CONTROLLER_ERROR'}));process.exitCode=1;}
