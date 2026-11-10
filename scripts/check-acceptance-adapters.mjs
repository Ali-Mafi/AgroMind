import {build} from 'esbuild';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const digest=x=>createHash('sha256').update(x).digest('hex');
const base='supabase/functions/pr67-acceptance/';
const records=[];
for(const name of ['username','password']){
 const source=name==='username'?'features/account/services/username-authorization.ts':'features/authentication/services/password-authorization.ts';
 const plugins=name==='password'?[{name:'explicitly-unsupported-cookie-boundary',setup(b){
  b.onResolve({filter:/^next\/headers$/},()=>({path:'cookie',namespace:'acceptance'}));
  b.onLoad({filter:/.*/,namespace:'acceptance'},()=>({contents:'export function cookies(){throw new Error("RECOVERY_NOT_SUPPORTED_BY_HARNESS")}'}));
 }}]:[];
 const built=await build({entryPoints:[source],bundle:true,write:false,platform:'node',format:'esm',external:['server-only','@supabase/supabase-js'],plugins});
 const env=name==='username'
  ? 'const process = { env: { NEXT_PUBLIC_SUPABASE_URL: Deno.env.get("SUPABASE_URL"), SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") } };\n'
  : 'const process = { env: { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: Deno.env.get("SUPABASE_URL"), NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Deno.env.get("SUPABASE_ANON_KEY"), SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), SUPABASE_RECOVERY_CODES_ENABLED: "false" } };\n';
 const expected=env+built.outputFiles[0].text.replaceAll('import "server-only";','');
 const deployedSource=fs.readFileSync(base+name+'-authorization.js','utf8');
 assert.equal(digest(expected),digest(deployedSource),'Unexpected '+name+' adapter delta');
 records.push({source,source_sha256:digest(fs.readFileSync(source)),bundle:base+name+'-authorization.js',bundle_sha256:digest(deployedSource),reproduced_exactly:true});
}
fs.writeFileSync('docs/acceptance/adapter-provenance.json',JSON.stringify({candidate:'9e371da2f883405daab3d0aa4a665f68c4fa6860',records,substitutions:['Build-only server marker omitted in Deno','Explicit read-only Deno environment bridge','Cookie-dependent recovery explicitly unavailable in harness']},null,2)+'\n');
console.log('Both hosted helper bundles reproduced exactly from candidate source.');
