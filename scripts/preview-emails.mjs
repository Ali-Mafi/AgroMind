// Offline fixtures only. Never calls a delivery service or uses live credentials.
import { mkdirSync, writeFileSync, readdirSync, copyFileSync } from "node:fs";
import path from "node:path";
import { loadTs } from "../features/weather/tests/helpers/load-ts.mjs";
const destination = path.resolve(process.argv[2] ?? "/tmp/agromind-email-previews");
mkdirSync(destination, {recursive:true});
const {renderAuthEmail}=loadTs("features/authentication/emails/templates.ts");
const {renderFarmInvitationEmail}=loadTs("features/collaboration/emails/templates.ts");
const {loginSecurityEmail}=loadTs("features/account-security/lib/email.ts");
const {supportEmail}=loadTs("features/support/lib/email.ts");
const assetDestination=path.join(destination,"assets");
mkdirSync(assetDestination,{recursive:true});
for(const version of ["signature-v1", "signature-v2"]) {
  mkdirSync(path.join(assetDestination,version),{recursive:true});
  for(const file of readdirSync(`public/email/${version}`)) if(/\.(png|jpg)$/.test(file)) copyFileSync(path.join("public/email",version,file),path.join(assetDestination,version,file));
}
const cases=[];
for(const language of ["fa","en"]) {
  cases.push({name:`security-login-${language}`,language,...loginSecurityEmail({metadata:{device:"Mobile",os:"iOS",browser:"Safari",ip:"203.0.113.42",city:"Example City",country:"IR"},provider:"google",loginAt:"2026-10-28T12:00:00Z"},language)});
  for(const kind of ["signup","recovery"]) cases.push({name:`${kind}-${language}`,language,...renderAuthEmail(kind,"b".repeat(64),language)});
  cases.push({name:`invitation-${language}`,language,...renderFarmInvitationEmail({href:"https://agromind.ir/invite/preview-disabled",farmName:language==="fa"?"مزرعه نمونه":"Example Farm",role:"manager",language})});
  for(const audience of ["user","staff"]) for(const event of ["created","reply","status"]) cases.push({name:`support-${audience}-${event}-${language}`,language,...supportEmail("AM-00000042",event,language,`https://agromind.ir/${audience==="staff"?"admin/support":"account/help"}`,audience)});
}
for(const item of cases) {
  // Remove even synthetic hashes and invitation tokens from exported artifacts.
  const scrub=(value)=>value.replace(/https:\/\/agromind\.ir\/(?:auth\/callback|invite\/)[^\s"<>]*/g,"https://agromind.ir");
  writeFileSync(path.join(destination,`${item.name}.html`),scrub(item.html).replaceAll('https://agromind.ir/email/', 'assets/'));
  writeFileSync(path.join(destination,`${item.name}.txt`),scrub(item.text));
}
writeFileSync(path.join(destination,"manifest.json"),JSON.stringify(cases.map(({name,language,subject})=>({name,language,subject})),null,2));
writeFileSync(path.join(destination,"index.html"),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AgroMind Signature Premium email previews</title><style>body{margin:24px;background:#f2eedf;color:#194936;font:15px Arial;text-align:center}a{color:#194936}main{max-width:1200px;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}section{min-width:0}iframe{width:100%;height:850px;border:1px solid #d0c6a2;border-radius:12px;background:#fffaf0}h1{font-size:25px}p{line-height:1.8}</style><h1>AgroMind · Signature Premium</h1><p>Offline fixtures · action links disabled · no live recipients or tokens<br>Open each email for a full-size view. Preview images are bundled locally; production emails use AgroMind's public domain.</p><main>${cases.map(({name,subject})=>`<section><p><a href="${name}.html">${subject} · ${name}</a> · <a href="${name}.txt">Text</a></p><iframe title="${name}" src="${name}.html" loading="lazy"></iframe></section>`).join("")}</main></html>`);
console.log(`Rendered ${cases.length} safe HTML/text preview pairs in ${destination}`);
