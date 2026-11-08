import { JSDOM } from 'jsdom';
import { loadTs, localRequire } from '../../../weather/tests/helpers/load-ts.mjs';

// Install the DOM before loading react-dom so events use its browser runtime.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://form.example.test', pretendToBeVisual: true,
});
for (const name of ['window', 'document', 'Node', 'Element', 'HTMLElement',
  'HTMLInputElement', 'HTMLButtonElement', 'HTMLFormElement', 'Event',
  'MouseEvent', 'SubmitEvent', 'FormData', 'MutationObserver', 'getComputedStyle']) {
  globalThis[name] = dom.window[name];
}
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = localRequire('react');
const { renderToString } = localRequire('react-dom/server');
const { hydrateRoot } = localRequire('react-dom/client');
export const { act } = React;
const { translator } = loadTs('features/settings/lib/translation.ts');

// Model React's serialized server-action metadata, including bind() used by
// useActionState. Plain async functions miss the SSR name rewrite regression.
export function serverAction(id, handler) {
  const fn = async (...args) => handler(...args);
  fn.$$FORM_ACTION = () => ({
    name: '$ACTION_ID_' + id, method: 'POST', encType: 'multipart/form-data', data: new FormData(),
  });
  fn.bind = (_self, ...args) => serverAction(id, (...rest) => handler(...args, ...rest));
  return fn;
}

export function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

export async function hydratedAuthForm({ language = 'en', mfa = false,
  passwordContext = 'change', nonceResults = [], resetResults = [] } = {}) {
  const calls = [];
  const t = translator(language);
  const record = (kind, results) => serverAction(kind, (_state, data) => {
    calls.push({ kind, data: Object.fromEntries(data) });
    return results.shift() ?? (kind === 'nonce'
      ? { success: 'Verification code sent. Check your email and enter the code below.' }
      : { success: 'Password updated. Sign in with your new password. Sign-out of other sessions could not be confirmed.' });
  });
  const reset = record('reset', resetResults);
  const { AuthForm } = loadTs('features/authentication/components/auth-form.tsx', {
    '../services/actions': {
      requestPasswordReauthenticationAction: record('nonce', nonceResults),
      resetPasswordAction: reset,
    },
    '@/features/settings/hooks/use-translation': { useTranslation: () => t },
    '@/features/settings/context/settings-context': { useSettings: () => ({ language }) },
    '@/features/legal/components/signup-consent': { useSignupConsent: () => null },
  });
  const element = React.createElement(AuthForm, {
    mode: 'reset', passwordContext, expectedUserId: 'synthetic-user',
    securityState: {
      enabled: mfa, factors: mfa ? [{ id: 'owned-factor', friendlyName: 'Authenticator' }] : [],
      recoveryCodes: { available: false, enabled: false },
    },
  });
  const container = document.createElement('div');
  container.innerHTML = renderToString(element);
  document.body.append(container);
  let root;
  await act(async () => { root = hydrateRoot(container, element); });
  const button = label => [...container.querySelectorAll('button')].find(b => b.textContent === t(label));
  return {
    container, calls, button, t,
    count: kind => calls.filter(call => call.kind === kind).length,
    input: name => container.querySelector(`[name="${name}"]`),
    async fill(name, value) {
      const input = container.querySelector(`[name="${name}"]`);
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    },
    async click(label) { await act(async () => { button(label).click(); }); },
    async close() { await act(async () => root.unmount()); container.remove(); },
  };
}
