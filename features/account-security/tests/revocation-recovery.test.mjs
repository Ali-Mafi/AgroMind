import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";

process.env.SUPABASE_SERVICE_ROLE_KEY = "isolated-revocation-recovery-test-key";
const form = (scope) => {
  const data = new FormData();
  data.set("scope", scope);
  data.set("proof_factor_id", "factor-a");
  data.set("fresh_code", "123456");
  return data;
};
function harness({scope="global",consumed=true,available=true}={}) {
  const calls = [];
  const worker = {rpc:async(name,args)=>{
    calls.push([name,args]);
    if (name==="security_begin_revocation") return {data:"operation-a"};
    if (name==="security_consume_revocation") throw new Error("response unavailable");
    if (name==="security_finish_revocation") return {data:false};
    if (name==="security_revocation_status") {
      if(!available) return {error:{}};
      return {data:{state:consumed?"pending":"failed",consumed,scope}};
    }
    return {data:false};
  }};
  const client = {auth:{
    mfa:{
      listFactors:async()=>({data:{totp:[{id:"factor-a",status:"verified"}]}}),
      challenge:async()=>({data:{id:"challenge-a"}}),
      verify:async()=>({data:{}}),
    },
    signOut:async()=>{calls.push(["unexpectedSignOut"]);return {};},
  }};
  const {revokeRemoteSessions}=loadTs("features/account-security/services/revoke.ts",{
    "next/headers":{headers:async()=>new Headers({host:"agromind.ir",origin:"https://agromind.ir"})},
    "@/lib/supabase/server":{createClient:async()=>client},
    "./server":{securityWorker:()=>worker,securityContext:async()=>({userId:"user-a",sessionId:"session-a"})},
  });
  return {calls,run:()=>revokeRemoteSessions(form(scope))};
}
test("F07: a lost response after committed proof returns the authentic pending state",async()=>{
  for(const scope of ["global","others"]){
    const {calls,run}=harness({scope});
    const result=await run();
    assert.equal(result.pending,true);
    assert.equal(result.global,scope==="global");
    assert.ok(!calls.some(x=>x[0]==="unexpectedSignOut"));
    assert.equal(calls.filter(x=>x[0]==="security_consume_revocation").length,1);
    assert.ok(calls.some(x=>x[0]==="security_revocation_status"));
  }
});
test("F07: rejected or unavailable proof state never claims confirmed denial",async()=>{
  for(const config of [{consumed:false},{available:false}]){
    const {run}=harness(config);
    const result=await run();
    assert.ok(result.error);
    assert.equal(result.pending,undefined);
  }
});
