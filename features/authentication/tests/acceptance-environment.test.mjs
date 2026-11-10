import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from '../../weather/tests/helpers/load-ts.mjs';

const names=['AGROMIND_ACCEPTANCE_MODE','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SITE_URL','AGROMIND_ACCEPTANCE_EMAIL_APPROVED','AGROMIND_ACCEPTANCE_SENDER','AGROMIND_ACCEPTANCE_RECIPIENTS'];
function isolated(run) {
 const before=Object.fromEntries(names.map(k=>[k,process.env[k]]));
 try {for(const k of names)delete process.env[k]; return run();}
 finally {for(const [k,v] of Object.entries(before))if(v===undefined)delete process.env[k];else process.env[k]=v;}
}
const stage=()=>Object.assign(process.env,{AGROMIND_ACCEPTANCE_MODE:'true',NEXT_PUBLIC_SUPABASE_URL:'https://lpkxwwdzuligovfgpfey.supabase.co',NEXT_PUBLIC_SITE_URL:'https://acceptance.example.test'});
test('production defaults are unchanged',()=>isolated(()=>{
 const e=loadTs('lib/acceptance/environment.ts');
 assert.equal(e.emailOrigin(),'https://agromind.ir');
 assert.deepEqual(e.acceptanceMail('customer@example.test','Subject'),{from:'AgroMind <accounts@agromind.ir>',subject:'Subject'});
}));
test('staging project cannot silently use production defaults',()=>isolated(()=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://lpkxwwdzuligovfgpfey.supabase.co';
 assert.throws(()=>loadTs('lib/acceptance/environment.ts').emailOrigin(),/ACCEPTANCE_MODE_REQUIRED/);
}));
test('staging rejects wrong project, production origin, and insecure origin',()=>isolated(()=>{
 stage();const e=loadTs('lib/acceptance/environment.ts');
 for(const origin of ['https://agromind.ir','https://www.agromind.ir','http://acceptance.example.test','https://acceptance.example.test/path','https://user:pass@acceptance.example.test']){
  process.env.NEXT_PUBLIC_SITE_URL=origin;assert.throws(()=>e.emailOrigin());
 }
 stage();process.env.NEXT_PUBLIC_SUPABASE_URL='https://gedwexwxaojpqyeiebwm.supabase.co';assert.throws(()=>e.emailOrigin(),/ACCEPTANCE_TARGET_REQUIRED/);
}));
test('mail requires approval and exact recipient allowlist',()=>isolated(()=>{
 stage();const e=loadTs('lib/acceptance/environment.ts');
 assert.throws(()=>e.acceptanceMail('qa@example.test','S'),/NOT_APPROVED/);
 Object.assign(process.env,{AGROMIND_ACCEPTANCE_EMAIL_APPROVED:'true',AGROMIND_ACCEPTANCE_SENDER:'onboarding@resend.dev',AGROMIND_ACCEPTANCE_RECIPIENTS:'qa@example.test'});
 assert.equal(e.acceptanceMail('qa@example.test','S').subject,'[STAGING] S');
 assert.throws(()=>e.acceptanceMail('customer@example.test','S'),/NOT_APPROVED/);
}));
test('actual auth and support renderers use staging assets and action origins',()=>isolated(()=>{
 stage();const {renderAuthEmail}=loadTs('features/authentication/emails/templates.ts');
 const email=renderAuthEmail('recovery','a'.repeat(64),'en');
 assert.match(email.text,/https:\/\/acceptance.example.test\/auth\/callback/);
 assert.doesNotMatch(email.html,/https:\/\/agromind\.ir/);
 const {supportEmail}=loadTs('features/support/lib/email.ts');
 assert.match(supportEmail('AM-QA','reply','en','https://agromind.ir/account/help/tickets/42').html,/href="https:\/\/acceptance.example.test\/account\/help"/);
}));
