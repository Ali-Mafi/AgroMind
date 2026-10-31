// Real component HTML + production CSS. Offline fixtures; no credentials or provider calls.
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { localizedRenderer } from '../features/settings/tests/helpers/render.mjs';
import { localRequire } from '../features/weather/tests/helpers/load-ts.mjs';
const {chromium}=localRequire(process.env.PLAYWRIGHT_MODULE_PATH ?? `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/playwright`);
const React=localRequire('react');
const destination=path.resolve(process.argv[2] ?? '/tmp/agromind-security-qa');mkdirSync(destination,{recursive:true});
const css=readdirSync('.next/static/chunks').filter(f=>f.endsWith('.css')).map(f=>readFileSync(path.join('.next/static/chunks',f),'utf8')).join('\n');
const browser=await chromium.launch({headless:true,...(process.env.EMAIL_QA_CHROMIUM_PATH?{executablePath:process.env.EMAIL_QA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']}:{})});
const results=[];
try {
 for(const language of ['fa','en']) for(const width of [320,375,430,768,1280]) for(const theme of ['light','dark']) {
  const ui=localizedRenderer({language,calendar:language==='fa'?'persian':'gregory'});
  const {SessionPanel}=ui.load('features/account-security/components/session-panel.tsx');
  const {SecurityActionDialog}=ui.load('features/account/components/security-action-dialog.tsx');
  const {FreshIdentityFields}=ui.load('features/authentication/components/fresh-identity-fields.tsx');
  const state={enabled:true,factors:[{id:'fixture-factor',friendlyName:'AgroMind Authenticator'}],recoveryCodes:{available:false,enabled:false}};
  const sessions=['Mobile','Computer','Tablet'].map((device,i)=>({id:`fixture-${i}`,current:i===0,createdAt:'2026-10-28T12:00:00Z',lastRefreshAt:null,state:i===2?'blocked':'active',metadata:{device,os:i===0?'iOS':'Windows',browser:i===0?'Safari':'Chrome',ip:'2001:db8:85a3:8d3:1319:8a2e:370:7348',city:'Example city with a long name',region:'Region',country:'IR'},provider:i===0?'google':'password'}));
  const element=React.createElement(React.Fragment,null,
   React.createElement(SessionPanel,{snapshot:{sessions,events:[{id:'event',kind:'login',created_at:'2026-10-28T12:00:00Z',details:{}}]},mfaEnabled:true,onRevoke(){},onEnroll(){}}),
   React.createElement(SecurityActionDialog,{open:false,title:'Sign out other sessions',description:'All other sessions will lose access. This device stays signed in. A fresh authenticator code is required.',variant:'compact',onClose(){}},React.createElement(FreshIdentityFields,{state,totpOnly:true})));
  const markup=ui.renderToStaticMarkup(element);
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500,colorScheme:theme});
  await page.route('**/*',route=>route.abort());
  await page.setContent(`<!doctype html><html lang="${language}" dir="${language==='fa'?'rtl':'ltr'}" class="${theme}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><main class="mx-auto max-w-5xl space-y-5 p-4">${markup}</main></body></html>`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${language}/${width}/${theme}: page overflow`);
  await page.evaluate(()=>document.querySelector('dialog').showModal());
  const code=page.locator('input[name=fresh_code]');await code.focus();await code.fill('123456');
  assert.equal(await code.evaluate(e=>e.validity.valid),true);
  const geometry=await page.locator('dialog').evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,width:r.width};});
  assert.ok(geometry.left>=0&&geometry.right<=width+1,`${language}/${width}/${theme}: dialog overflow`);
  assert.equal(await page.locator('input[name=current_password]').count(),0);
  assert.equal(await page.locator('input[name=fresh_recovery_code]').count(),0);
  if(width===375||width===1280) await page.screenshot({path:path.join(destination,`${language}-${width}-${theme}.png`),fullPage:true});
  results.push({language,width,theme,dialog:geometry});await page.close();
 }
 writeFileSync(path.join(destination,'results.json'),JSON.stringify(results,null,2));
 console.log(`${results.length} security layout/TOTP fixture checks passed. Chromium touch viewports; physical iOS/WebKit and live Auth are separate release gates.`);
} finally {await browser.close();}
