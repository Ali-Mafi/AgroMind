import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from '../../weather/tests/helpers/load-ts.mjs';
process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-worker-key-not-real';process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.invalid';
const user={id:'user-a',email_confirmed_at:'2026-01-01'};
const form=(fields={})=>{const f=new FormData();for(const[k,v]of Object.entries({username:'  TARGET_Name  ',...fields}))f.set(k,v);return f;};
function harness({proofError=null,proofData={user,access_token:"synthetic-token"},attestError=null,session='session-a',after='session-a',claimsUser=user.id,mutation={data:'target_name',error:null},active=true}={}){
 const calls=[];let reads=0;
 const worker={rpc:async(n,a)=>{calls.push([n,a]);return n==='username_reserve_grant'?{data:'grant-a',error:null}:{data:true,error:attestError};}};
 const client={auth:{getUser:async()=>({data:{user},error:null}),getClaims:async()=>({data:{claims:{sub:claimsUser,session_id:++reads>1?after:session,aal:'aal2'}},error:null}),mfa:{listFactors:async()=>({data:{totp:[{id:'owned-factor',status:'verified'}]},error:null}),challengeAndVerify:async args=>{calls.push(['challenge',args]);return{data:proofData,error:proofError};}}},
  from:()=>({select:()=>({eq:()=>({single:async()=>({data:{username:'old_name'},error:null})})})}),
  rpc:async(n,a)=>{calls.push([n,a]);if(n==='get_current_session')return{data:active?{created_at:'2026-01-01'}:null,error:null};if(n==='username_available')return{data:true,error:null};if(n==='change_username_authorized')return mutation;return{data:null,error:null};}};
 const mocks={'@/lib/supabase/server':{createClient:async()=>client},'@supabase/supabase-js':{createClient:()=>worker},'@/features/authentication/services/session':{currentUser:async()=>user},'next/cache':{revalidatePath:()=>{}}};
 const authorization=loadTs('features/account/services/username-authorization.ts',mocks);
 const action=loadTs('features/account/services/username-actions.ts',{...mocks,'./username-authorization':authorization});
 return{action,authorization,calls,client};
}
const valid={fresh_code:'123456',proof_factor_id:'owned-factor'};
test('username: stale AAL2, missing/wrong code, foreign factor and backup-code substitution cannot mutate',async()=>{
 for(const extra of [{},{...valid,fresh_code:'00000'},{...valid,proof_factor_id:'foreign'},{...valid,proof_method:'recovery'}]){
  const h=harness();assert.ok((await h.action.updateUsernameAction({},form(extra))).error);assert.equal(h.calls.some(c=>c[0]==='change_username_authorized'),false);
 }
 const h=harness({proofError:{code:'invalid'}});assert.ok((await h.action.updateUsernameAction({},form(valid))).error);assert.equal(h.calls.some(c=>c[0]==='username_verify_grant'),false);
});
test('username: reserve -> fresh challenge -> attestation -> authenticated bound mutation; no legacy RPC',async()=>{
 const h=harness();const result=await h.action.updateUsernameAction({},form(valid));assert.equal(result.success,'Username changed.');
 const stages=h.calls.filter(c=>['username_reserve_grant','challenge','username_verify_grant','change_username_authorized'].includes(c[0]));assert.deepEqual(stages.map(c=>c[0]),['username_reserve_grant','challenge','username_verify_grant','change_username_authorized']);
 assert.equal(stages[0][1].p_username,'target_name');assert.equal(stages[0][1].p_user,user.id);assert.equal(stages[0][1].p_session,'session-a');assert.equal(stages[0][1].p_factor,'owned-factor');
 assert.deepEqual(stages[3][1],{p_grant:'grant-a',p_username:'target_name'});assert.doesNotMatch(JSON.stringify(stages.filter(c=>c[0]!=='challenge')),/123456/);
});
test('username: switched session/user, missing session and replayed attestation fail closed',async()=>{
 for(const opts of [{after:'foreign-session'},{claimsUser:'other-user'},{active:false},{attestError:{message:'PROOF_REPLAY'}}]){
  const h=harness(opts);assert.ok((await h.action.updateUsernameAction({},form(valid))).error);assert.equal(h.calls.some(c=>c[0]==='change_username_authorized'),false);
 }
});
test('username: unique conflict preserves expected field error; uncertain/mismatched response is never success',async()=>{
 const duplicate=harness({mutation:{data:null,error:{code:'23505',message:'USERNAME_TAKEN'}}});assert.equal((await duplicate.action.updateUsernameAction({},form(valid))).fields.username,'This username is already taken.');
 for(const mutation of [{data:null,error:null},{data:'foreign_name',error:null},{data:null,error:{message:'timeout'}}]){const h=harness({mutation});const result=await h.action.updateUsernameAction({},form(valid));assert.ok(result.error);assert.equal(result.success,undefined);}
});

test('username: malformed or foreign provider verification response cannot attest a grant',async()=>{
 for(const proofData of [{},{user:{id:'other'},access_token:'synthetic'},{user}]){const h=harness({proofData});assert.ok((await h.action.updateUsernameAction({},form(valid))).error);assert.equal(h.calls.some(c=>c[0]==='username_verify_grant'),false);}
});

test('username: EN/FA UI keeps owned authenticator inputs and requires enrollment without offering backup substitution',async()=>{
 const {localizedRenderer}=await import('../../settings/tests/helpers/render.mjs');const {localRequire}=await import('../../weather/tests/helpers/load-ts.mjs');const React=localRequire('react');
 for(const language of ['en','fa'])for(const enabled of [true,false]){
  const ui=localizedRenderer({language});const {UsernameForm}=ui.load('features/account/components/username-form.tsx',{'@/features/farms/context/farm-context':{useFarm:()=>({reload:async()=>{}})}});
  const state={enabled,factors:enabled?[{id:'owned-factor',friendlyName:'Primary'}]:[],currentLevel:'aal2',nextLevel:'aal2',recoveryCodes:{available:true,enabled:true,total:5,remaining:5}};
  const html=ui.renderToStaticMarkup(React.createElement(UsernameForm,{currentUsername:'old_name',securityState:state}));
  assert.equal(html.includes('name="fresh_code"'),enabled);assert.equal(html.includes('name="proof_factor_id"'),enabled);assert.doesNotMatch(html,/name="fresh_recovery_code"/);
 }
});
