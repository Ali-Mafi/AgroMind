import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { loadTs, localRequire, root } from '../features/weather/tests/helpers/load-ts.mjs';
import { serverAction } from '../features/authentication/tests/helpers/hydrated-auth-form.mjs';

// Exercise the actual SSR/hydrated form, UI primitives, translations and hooks.
// Only provider actions and context values are synthetic; no hosted Auth calls.
const React = localRequire('react');
const { renderToString } = localRequire('react-dom/server');
const { translator } = loadTs('features/settings/lib/translation.ts');
const actions = `
window.__calls=[];window.__release={};
function action(id, bound=[]) {
  const fn=async(...args)=>{
    const data=[...bound,...args].at(-1);
    window.__calls.push({kind:id,data:Object.fromEntries(data)});
    const result=window.__results[id].shift();
    if(result==='pending')return new Promise(resolve=>window.__release[id]=resolve);
    return result || (id==='nonce'
      ? {success:'Verification code sent. Check your email and enter the code below.'}
      : {error:'Password change was rejected. Verify your current password or email code, then confirm your identity again.'});
  };
  fn.$$FORM_ACTION=()=>({name:'$ACTION_ID_'+id,method:'POST',encType:'multipart/form-data',data:new FormData()});
  fn.bind=(_self,...args)=>action(id,[...bound,...args]);
  return fn;
}
export const requestPasswordReauthenticationAction=action('nonce');
export const resetPasswordAction=action('reset');
export const requestPasswordResetAction=resetPasswordAction,resendVerificationAction=resetPasswordAction,
signInAction=resetPasswordAction,signUpAction=resetPasswordAction,verifyEmailAction=resetPasswordAction;
`;
const virtual = {
  '../services/actions': actions,
  '@/features/settings/hooks/use-translation': `import {translator} from ${JSON.stringify(root+'/features/settings/lib/translation.ts')};export const useTranslation=()=>translator(window.__props.language);`,
  '@/features/settings/context/settings-context': 'export const useSettings=()=>({language:window.__props.language});',
  '@/features/legal/components/signup-consent': 'export const useSignupConsent=()=>null;',
};
const bundle = await build({
  stdin: { contents: `import React from 'react';import {hydrateRoot} from 'react-dom/client';import {AuthForm} from './features/authentication/components/auth-form.tsx';hydrateRoot(document.getElementById('root'),React.createElement(AuthForm,window.__props));window.__hydrated=true;`, resolveDir: root, loader: 'jsx' },
  bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' },
  plugins: [{ name: 'synthetic-provider-actions', setup(api) {
    api.onResolve({ filter: /.*/ }, args => Object.hasOwn(virtual,args.path) ? {path:args.path,namespace:'fixture'} : undefined);
    api.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'js',resolveDir:root}));
  }}],
});
const server = createServer((request, response) => {
  if (request.url === '/client.js') { response.setHeader('Content-Type','text/javascript');response.end(bundle.outputFiles[0].text);return; }
  const params = new URL(request.url,'http://localhost').searchParams;
  const language = params.get('language') || 'en', enabled = params.get('mfa') === 'true';
  const props = {language,mode:'reset',passwordContext:params.get('context') || 'change',expectedUserId:'synthetic-user',securityState:{enabled,factors:enabled?[{id:'owned-factor',friendlyName:'Authenticator'}]:[],recoveryCodes:{enabled:false,available:false}}};
  const { AuthForm } = loadTs('features/authentication/components/auth-form.tsx',{
    '../services/actions': {requestPasswordReauthenticationAction:serverAction('nonce',()=>({})),resetPasswordAction:serverAction('reset',()=>({}))},
    '@/features/settings/hooks/use-translation':{useTranslation:()=>translator(language)},
    '@/features/settings/context/settings-context':{useSettings:()=>({language})},
    '@/features/legal/components/signup-consent':{useSignupConsent:()=>null},
  });
  response.setHeader('Content-Type','text/html; charset=utf-8');
  response.end(`<!doctype html><html lang="${language}" dir="${language==='fa'?'rtl':'ltr'}"><body><div id="root">${renderToString(React.createElement(AuthForm,props))}</div><script>window.__props=${JSON.stringify(props)};window.__results={nonce:[],reset:[]};</script><script src="/client.js"></script></body></html>`);
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const url = `http://127.0.0.1:${server.address().port}`;
let browser, passed = 0;
try {
  const executablePath=process.env.AGROMIND_CHROMIUM_EXECUTABLE;
  browser=await chromium.launch({executablePath,headless:true,args:executablePath?['--no-sandbox','--single-process','--no-zygote','--disable-dev-shm-usage','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  console.log('Chromium',await browser.version());
  const context=await browser.newContext({hasTouch:true});
  const page=await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
  const count=kind=>page.evaluate(kind=>window.__calls.filter(c=>c.kind===kind).length,kind);
  const expectCalls=async(reset,nonce)=>{
    await page.waitForFunction(([r,n])=>window.__calls.filter(c=>c.kind==='reset').length===r&&window.__calls.filter(c=>c.kind==='nonce').length===n,[reset,nonce]);
    assert.equal(await count('reset'),reset);assert.equal(await count('nonce'),nonce);
  };
  const values={password:'NewPassword!123',confirmPassword:'NewPassword!123',current_password:'OldPassword!123',fresh_code:'123456',reauthentication_nonce:'12345678'};
  const fill=async()=>{for(const [name,value] of Object.entries(values))if(await page.locator(`[name="${name}"]`).count())await page.locator(`[name="${name}"]`).fill(value);};
  const expectPreserved=async()=>{for(const [name,value] of Object.entries(values))if(await page.locator(`[name="${name}"]`).count())assert.equal(await page.locator(`[name="${name}"]`).inputValue(),value,name);};
  const report=label=>{passed++;console.log('PASS',label);};
  for(const language of ['en','fa'])for(const mfa of [false,true]) {
    const t=translator(language);
    const nonce=page.getByRole('button',{name:t('Send verification code'),exact:true});
    const primary=page.getByRole('button',{name:t('Update password'),exact:true});
    const open=async(context='change')=>{await page.goto(`${url}/?language=${language}&mfa=${mfa}&context=${context}`);await page.waitForFunction(()=>window.__hydrated);await fill();};
    if(process.argv.includes('--reproduce-a65-04')) {
      await open();await page.locator('[name="confirmPassword"]').press('Enter');
      await expectCalls(0,1);await page.getByRole('status').waitFor();
      assert.equal(await page.locator('[name="current_password"]').inputValue(),'');
      report(`original ${language} MFA=${mfa}: confirm Enter -> nonce=1 reset=0; proof cleared`);
      continue;
    }
    for(const context of ['change','recovery']) {
      const fields=['password','confirmPassword',...(mfa?['fresh_code']:[]),...(context==='change'?['current_password','reauthentication_nonce']:[])];
      for(const name of fields) {
        await open(context);
        if(context==='recovery')assert.equal(await nonce.count(),0);
        await page.locator(`[name="${name}"]`).press('Enter');
        await expectCalls(1,0);await page.getByRole('alert').waitFor();
        const payload=await page.evaluate(()=>window.__calls[0].data);
        assert.equal(payload.password_context,context);assert.equal(payload.language,language);
        for(const field of fields)assert.equal(payload[field],values[field]);
        report(`${language} MFA=${mfa} ${context}: Enter from ${name} -> reset only`);
      }
    }
    for(const activation of ['click','tap','Enter','Space']) {
      await open();
      const activate=async(button)=>{if(activation==='click'||activation==='tap')await button[activation]();else {await button.focus();await page.keyboard.press(activation);}};
      await activate(nonce);await expectCalls(0,1);await page.getByRole('status').waitFor();
      await expectPreserved();
      await activate(primary);await expectCalls(1,1);await page.getByRole('alert').waitFor();
      report(`${language} MFA=${mfa}: ${activation} nonce/primary route independently; nonce preserves proof`);
    }
    await open();
    await page.evaluate(()=>window.__results.nonce.push({error:'Service temporarily unavailable. Please try again.'}));
    await nonce.click();await expectCalls(0,1);await page.getByRole('alert').waitFor();await expectPreserved();
    await nonce.click();await expectCalls(0,2);await page.getByRole('status').waitFor();await expectPreserved();
    await nonce.click();await expectCalls(0,3);await expectPreserved();
    await page.locator('[name="confirmPassword"]').press('Enter');await expectCalls(1,3);
    report(`${language} MFA=${mfa}: failed nonce, retry/repetition, implicit primary`);

    await open();
    await page.evaluate(()=>window.__results.nonce.push('pending'));
    await nonce.click();await expectCalls(0,1);await fill();await expectPreserved();
    await page.evaluate(()=>window.__release.nonce({error:'Service temporarily unavailable. Please try again.'}));
    await page.getByRole('alert').waitFor();await expectPreserved();
    await page.locator('[name="password"]').press('Enter');await expectCalls(1,1);
    report(`${language} MFA=${mfa}: edit proof while nonce pending; failed completion preserves it`);

    await open();await page.locator('[name="reauthentication_nonce"]').focus();
    await page.keyboard.press('Tab');assert.equal(await nonce.evaluate(b=>b===document.activeElement),true);
    await page.keyboard.press('Enter');await expectCalls(0,1);await page.getByRole('status').waitFor();await expectPreserved();
    await page.keyboard.press('Tab');assert.equal(await primary.evaluate(b=>b===document.activeElement),true);
    await page.keyboard.press('Space');await expectCalls(1,1);
    report(`${language} MFA=${mfa}: native Tab navigation nonce -> primary`);

    for(const order of ['nonce-first','primary-first']) {
      await open();
      await page.evaluate(()=>{window.__results.nonce.push('pending');window.__results.reset.push('pending');});
      await nonce.click();await expectCalls(0,1);
      assert.equal(await nonce.isDisabled(),true);assert.equal(await primary.isEnabled(),true);
      await expectPreserved();
      await page.locator('[name="confirmPassword"]').press('Enter');await expectCalls(1,1);
      await page.locator('fieldset[disabled]').waitFor();
      await page.evaluate(()=>{const f=document.querySelector('[name="password"]').form;const b=[...f.elements].find(e=>e.type==='submit'&&e.form===f);f.requestSubmit(b);});
      assert.equal(await count('reset'),1);
      const nonceDone=()=>page.evaluate(()=>window.__release.nonce({error:'Service temporarily unavailable. Please try again.'}));
      const primaryDone=()=>page.evaluate(()=>window.__release.reset({error:'Password change was rejected. Verify your current password or email code, then confirm your identity again.'}));
      // React may entangle concurrent transitions; pending can last until both
      // settle. Require unlock after both completion orders, not an early commit.
      if(order==='nonce-first'){await nonceDone();await primaryDone();}
      else {await primaryDone();await nonceDone();}
      await page.locator('fieldset:not([disabled])').waitFor();await fill();
      await expectPreserved();
      await page.locator('[name="confirmPassword"]').press('Enter');await expectCalls(2,1);
      report(`${language} MFA=${mfa}: overlap ${order}, duplicate prevention, proof preservation and retry`);
    }
    await open();
    await page.evaluate(()=>window.__results.reset.push('pending'));
    await page.evaluate(()=>{const f=document.querySelector('[name="password"]').form;const b=[...f.elements].find(e=>e.type==='submit'&&e.form===f);f.requestSubmit(b);f.requestSubmit(b);});
    await expectCalls(1,0);await page.locator('fieldset[disabled]').waitFor();
    await page.evaluate(()=>window.__release.reset({success:'Password updated. Sign in with your new password. Sign-out of other sessions could not be confirmed.'}));
    await page.getByRole('status').waitFor();
    assert.equal(await count('reset'),1);assert.equal(await count('nonce'),0);
    report(`${language} MFA=${mfa}: same-turn duplicate primary -> one reset, no nonce`);
  }
  assert.deepEqual(errors,[],'no hydration/runtime errors');
  console.log(`PASS ${passed} Chromium scenarios; zero hydration/runtime errors`);
} finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
