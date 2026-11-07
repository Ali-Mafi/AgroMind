import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from '../../weather/tests/helpers/load-ts.mjs';
process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-test-key-not-a-provider-credential';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.invalid';
const user={id:'user-a',email:'test@example.test',email_confirmed_at:'2026-01-01'};
const form=(extra={})=>{const f=new FormData();for(const[k,v]of Object.entries({password:'NewPassword!123',confirmPassword:'NewPassword!123',expected_user_id:user.id,...extra}))f.set(k,v);return f;};
function harness({mfa=true,recovery=false,proofError=null,consumeError=null,update={data:{user},error:null},afterSession='session-a',claimsUser=user.id}={}){
 const calls=[],jar=new Map();let contextReads=0;
 const client={rpc:async()=>({data:{created_at:'2026-01-01'},error:null}),auth:{
  getUser:async()=>({data:{user},error:null}),
  getClaims:async()=>({data:{claims:{sub:claimsUser,session_id:++contextReads>1?afterSession:'session-a',amr:[]}},error:null}),
  updateUser:async(payload)=>{calls.push(['update',payload]);if(update instanceof Error)throw update;return update;},
  signOut:async()=>{calls.push(['logout']);return{error:{status:500}};},
 }};
 const worker={rpc:async(name,args)=>{calls.push([name,args]);
  if(name==='password_reserve')return{data:{id:'grant-a',requires_mfa:mfa},error:null};
  if(name==='password_has_recovery')return{data:recovery,error:null};
  return{data:true,error:name==='password_consume'?consumeError:null};
 }};
 const mocks={
  '@/lib/supabase/server':{createClient:async()=>client},
  '@supabase/supabase-js':{createClient:()=>worker},
  './fresh-auth':{verifyFreshIdentity:async(_c,_u,f)=>{calls.push(['proof']);return proofError||((mfa?f.get('fresh_code')==='123456':f.get('current_password')==='old-password')?null:'DENIED');}},
  'next/headers':{cookies:async()=>({get:k=>jar.has(k)?{value:jar.get(k)}:undefined,set:(k,v)=>jar.set(k,v),delete:k=>jar.delete(k)})},
  'next/cache':{revalidatePath:()=>{}},
 };
 const authorization=loadTs('features/authentication/services/password-authorization.ts',mocks);
 const actions=loadTs('features/authentication/services/actions.ts',{...mocks,'./password-authorization':authorization});
 jar.set('agromind_password_recovery','a'.repeat(43));
 return{calls,authorization,actions,client,jar};
}
test('stale AAL2, missing/incorrect/replayed MFA proof cannot reach provider mutation',async()=>{
 for(const extra of [{},{fresh_code:'000000'},{password_context:'recovery',fresh_code:'123456'}]){
  const h=harness();assert.ok((await h.actions.resetPasswordAction({},form(extra))).error);assert.equal(h.calls.some(c=>c[0]==='update'),false);
 }
 const h=harness({consumeError:{message:'PROOF_REPLAY'}});
 assert.ok((await h.actions.resetPasswordAction({},form({fresh_code:'123456'}))).error);assert.equal(h.calls.some(c=>c[0]==='update'),false);
});
test('fresh MFA consumption precedes password update and preserves provider current-password/nonce fields',async()=>{
 const h=harness();const result=await h.actions.resetPasswordAction({},form({fresh_code:'123456',proof_factor_id:'owned-factor',current_password:'old-password',reauthentication_nonce:'12345678'}));
 assert.match(result.success,/Password updated/);assert.match(result.success,/could not be confirmed/);
 assert.ok(h.calls.findIndex(c=>c[0]==='password_consume')<h.calls.findIndex(c=>c[0]==='update'));
 assert.deepEqual(h.calls.find(c=>c[0]==='update')[1],{password:'NewPassword!123',current_password:'old-password',nonce:'12345678'});
});
test('non-MFA ordinary changes require current-password verification; Google first password uses recovery',async()=>{
 const h=harness({mfa:false});assert.ok((await h.actions.resetPasswordAction({},form())).error);
 assert.match((await h.actions.resetPasswordAction({},form({current_password:'old-password'}))).success,/Password updated/);
 const r=harness({mfa:false,recovery:true});assert.match((await r.actions.resetPasswordAction({},form({password_context:'recovery'}))).success,/Password updated/);
 assert.equal(r.calls.some(c=>c[0]==='proof'),false);
 assert.equal(r.calls.find(c=>c[0]==='password_consume')[1].p_method,'email');
});
test('verified recovery still requires new MFA; expiry, reuse or missing cookie fails closed',async()=>{
 for(const code of ['', '000000']){const h=harness({recovery:true});assert.ok((await h.actions.resetPasswordAction({},form({password_context:'recovery',fresh_code:code}))).error);}
 const h=harness({recovery:true});assert.match((await h.actions.resetPasswordAction({},form({password_context:'recovery',fresh_code:'123456'}))).success,/Password updated/);
 assert.equal(h.jar.has('agromind_password_recovery'),false);
 assert.ok((await h.actions.resetPasswordAction({},form({password_context:'recovery',fresh_code:'123456'}))).error);
});
test('wrong user, switched session and mismatched verified claims deny mutation',async()=>{
 for(const [opts,fields]of [[{}, {expected_user_id:'other'}],[{afterSession:'other-session'}, {fresh_code:'123456'}],[{claimsUser:'other'}, {fresh_code:'123456'}]]){
  const h=harness(opts);assert.ok((await h.actions.resetPasswordAction({},form(fields))).error);assert.equal(h.calls.some(c=>c[0]==='update'),false);
 }
});
test('provider rejection, empty or foreign response, timeout and transport ambiguity never claim password success',async()=>{
 for(const update of [{error:{code:'same_password'},data:{user:null}},{error:{code:'reauthentication_needed'},data:{user:null}},{error:null,data:{}},{error:null,data:{user:{id:'other'}}},new Error('timeout'),{error:{code:'unexpected_failure'},data:{user:null}}]){
  const h=harness({update});const result=await h.actions.resetPasswordAction({},form({fresh_code:'123456'}));assert.ok(result.error);assert.equal(result.success,undefined);
  assert.equal(h.calls.filter(c=>c[0]==='password_consume').length,1);
 }
});
test('PKCE query/local state cannot manufacture recovery; signature-verified fresh recovery AMR is required',async()=>{
 const h=harness();await assert.rejects(h.authorization.issuePkcePasswordRecovery(h.client),/RECOVERY_REQUIRED/);
 h.client.auth.getClaims=async()=>({data:{claims:{sub:user.id,session_id:'session-a',amr:[{method:'recovery',timestamp:Math.floor(Date.now()/1000)}]}},error:null});
 await h.authorization.issuePkcePasswordRecovery(h.client);assert.equal(h.calls.some(c=>c[0]==='password_issue_recovery'),true);
 for(const stamp of [0,Date.now()/1000+100]){h.client.auth.getClaims=async()=>({data:{claims:{sub:user.id,session_id:'session-a',amr:[{method:'recovery',timestamp:stamp}]}},error:null});await assert.rejects(h.authorization.issuePkcePasswordRecovery(h.client),/RECOVERY_REQUIRED/);}
});
test('payload fingerprints are keyed and operation-bound; passwords are never RPC arguments',async()=>{
 const h=harness();await h.actions.resetPasswordAction({},form({fresh_code:'123456'}));
 assert.notEqual(h.authorization.passwordProofHash('password_change','p'),h.authorization.passwordProofHash('password_recovery','p'));
 assert.doesNotMatch(JSON.stringify(h.calls.filter(c=>c[0].startsWith('password_'))),/NewPassword|123456/);
});

test('EN/FA reset UI preserves recovery without current password and renders fresh MFA plus provider policy inputs',async()=>{
 const {localizedRenderer}=await import('../../settings/tests/helpers/render.mjs');
 const {localRequire}=await import('../../weather/tests/helpers/load-ts.mjs');const React=localRequire('react');
 for(const language of ['en','fa'])for(const enabled of [true,false]){
  const ui=localizedRenderer({language});const {AuthForm}=ui.load('features/authentication/components/auth-form.tsx');
  const state={enabled,factors:enabled?[{id:'factor-a',friendlyName:'Backup authenticator'}]:[],currentLevel:enabled?'aal2':'aal1',nextLevel:enabled?'aal2':'aal1',recoveryCodes:{available:false,enabled:false,total:0,remaining:0}};
  const recovery=ui.renderToStaticMarkup(React.createElement(AuthForm,{mode:'reset',passwordContext:'recovery',securityState:state,expectedUserId:user.id}));
  assert.match(recovery,/name="password_context" value="recovery"/);assert.doesNotMatch(recovery,/name="current_password"/);
  assert.equal(recovery.includes('name="fresh_code"'),enabled);
  const ordinary=ui.renderToStaticMarkup(React.createElement(AuthForm,{mode:'reset',passwordContext:'change',securityState:state,expectedUserId:user.id}));
  assert.match(ordinary,/name="current_password"/);assert.match(ordinary,/name="reauthentication_nonce"/);
 }
});
