import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { IdentityBoundaryPoC } from '../src/authority.mjs';
import { createLocalPoCServer } from '../src/http.mjs';
import { totpAt } from '../src/totp.mjs';

async function runFixture(fn) {
  const now=1_800_000_000_000,secret=randomBytes(20);
  const authority=new IdentityBoundaryPoC({clock:()=>now});
  const id=authority.seedIdentityForTest({email:'a@example.test',factorSecret:secret,password:'old-synthetic-password'});
  const a=authority.newSessionForTest(id),b=authority.newSessionForTest(id);
  const server=createLocalPoCServer(authority);
  await new Promise(res=>server.listen(0,'127.0.0.1',res));
  const url=`http://127.0.0.1:${server.address().port}`;
  const post=async(path,body,bearer=a.bearer)=>{const r=await fetch(url+path,{
    method:'POST',headers:{authorization:`Bearer ${bearer}`,'content-type':'application/json'},
    body:JSON.stringify(body),redirect:'manual'});
    return {status:r.status,body:await r.json()};};
  try {await fn({authority,a,b,secret,url,post,now});}finally{await new Promise((res,rej)=>server.close(err=>err?rej(err):res()));}
}

test('HTTP direct native routes are absent in isolated gateway (not proof of upstream isolation)',()=>runFixture(async({url,post})=>{
  for(const path of ['/auth/v1/logout?scope=global','/auth/v1/user']) {
    const r=await post(path,{password:'guessed-password'});assert.equal(r.status,404);
  }
  const r=await fetch(url+'/poc/recovery/request',{method:'POST'});assert.equal(r.status,404);
}));

test('HTTP no grant → denied; valid fresh TOTP → operation succeeds',()=>runFixture(async({post,secret,now})=>{
  const p={password:'new-synthetic-password'};
  assert.equal((await post('/poc/credentials/password',{payload:p})).status,403);
  const begin=await post('/poc/step-up/challenge',{operation:'password_change',payload:p});
  assert.equal(begin.status,200);
  const wrong=await post('/poc/step-up/verify',{challengeId:begin.body.challengeId,code:'xxxxxx'});
  assert.equal(wrong.status,403);
  const verified=await post('/poc/step-up/verify',{challengeId:begin.body.challengeId,code:totpAt(secret,now)});
  assert.equal(verified.status,200);
  const result=await post('/poc/credentials/password',{payload:p,grantId:verified.body.grantId});
  assert.equal(result.status,200);
  assert.equal((await post('/poc/credentials/password',{payload:p,grantId:verified.body.grantId})).status,403);
}));

test('HTTP remote logout requires step-up, preserves foreign and current on others',()=>runFixture(async({post,secret,now,a,b})=>{
  const p={scope:'others'};
  assert.equal((await post('/poc/sessions/remote-logout',{payload:p})).status,403);
  const c=await post('/poc/step-up/challenge',{operation:'remote_logout',payload:p});
  const g=await post('/poc/step-up/verify',{challengeId:c.body.challengeId,code:totpAt(secret,now)});
  const done=await post('/poc/sessions/remote-logout',{payload:p,grantId:g.body.grantId});
  assert.equal(done.status,200); assert.equal(done.body.count,1);
  assert.equal((await post('/poc/step-up/challenge',{operation:'email_change',payload:{email:'x@example.test'}},b.bearer)).status,401);
  assert.equal((await post('/poc/step-up/challenge',{operation:'email_change',payload:{email:'x@example.test'}},a.bearer)).status,200);
}));

test('HTTP rejects absent bearer, unexpected methods, invalid payload and oversized JSON',()=>runFixture(async({url,post})=>{
  const noBearer=await fetch(url+'/poc/step-up/challenge',{method:'POST',body:'{}'});
  assert.equal(noBearer.status,401);
  assert.equal((await fetch(url+'/poc/credentials/password')).status,404);
  assert.equal((await post('/poc/step-up/challenge',{operation:'remote_logout',payload:{scope:'local'}})).status,400);
  const oversized=await fetch(url+'/poc/step-up/challenge',{method:'POST',headers:{'authorization':'Bearer abcdefghijklmnopqrstuvwxyz0123456789'},body:JSON.stringify({x:'z'.repeat(9000)})});
  assert.equal(oversized.status,413);
}));
