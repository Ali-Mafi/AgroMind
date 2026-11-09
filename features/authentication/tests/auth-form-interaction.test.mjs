import test from 'node:test';
import assert from 'node:assert/strict';
import { act, deferred, hydratedAuthForm } from './helpers/hydrated-auth-form.mjs';

async function fillPassword(ui, mfa = false) {
  await ui.fill('password', 'NewPassword!123');
  await ui.fill('confirmPassword', 'NewPassword!123');
  if (ui.input('current_password')) await ui.fill('current_password', 'OldPassword!123');
  if (ui.input('reauthentication_nonce')) await ui.fill('reauthentication_nonce', '12345678');
  if (mfa) await ui.fill('fresh_code', '123456');
}

for (const language of ['en', 'fa']) for (const mfa of [false, true]) {
  test(`hydrated ${language}, MFA=${mfa}: nonce action then exactly one password action`, async t => {
    const ui = await hydratedAuthForm({ language, mfa });
    t.after(() => ui.close());
    const primaryForm = ui.input('password').form;
    assert.notEqual(ui.button('Send verification code').form, primaryForm);
    assert.equal(ui.button('Update password').form, primaryForm);
    assert.equal(primaryForm.querySelector('form'), null, 'forms must not nest');
    assert.equal(new FormData(ui.button('Send verification code').form).has('password'), false);
    await fillPassword(ui, mfa);
    await ui.click('Send verification code');
    assert.equal(ui.count('nonce'), 1);
    assert.equal(ui.count('reset'), 0);
    assert.ok(ui.container.querySelector('[role="status"]'));
    assert.equal(ui.input('current_password').value, 'OldPassword!123');
    assert.equal(ui.input('reauthentication_nonce').value, '12345678');
    if (mfa) assert.equal(ui.input('fresh_code').value, '123456');
    await ui.click('Update password');
    assert.equal(ui.count('reset'), 1);
    assert.equal(ui.count('nonce'), 1);
    const payload = ui.calls.find(c => c.kind === 'reset').data;
    assert.equal(payload.password, 'NewPassword!123');
    assert.equal(payload.reauthentication_nonce, '12345678');
    assert.equal(payload.expected_user_id, 'synthetic-user');
    assert.equal(payload.password_context, 'change');
    assert.equal(payload.language, language);
    assert.equal(Boolean(payload.fresh_code), mfa);
    for (const name of ['password', 'confirmPassword', 'current_password', 'reauthentication_nonce', ...(mfa ? ['fresh_code'] : [])]) {
      assert.ok(ui.input(name).labels.length, `${name} has an accessible label`);
    }
    if (language === 'fa') {
      assert.match(ui.button('Send verification code').textContent, /[\u0600-\u06ff]/);
      assert.match(ui.button('Update password').textContent, /[\u0600-\u06ff]/);
    }
  });
}

test('nonce provider error, retry and repeated success never lock the password action', async t => {
  const ui = await hydratedAuthForm({ nonceResults: [{ error: 'Service temporarily unavailable. Please try again.' }] });
  t.after(() => ui.close());
  await fillPassword(ui);
  await ui.click('Send verification code');
  assert.match(ui.container.querySelector('[role="alert"]').textContent, /unavailable/);
  for (let attempt = 0; attempt < 2; attempt++) await ui.click('Send verification code');
  assert.equal(ui.count('nonce'), 3);
  assert.equal(ui.count('reset'), 0);
  assert.equal(ui.container.querySelector('[role="alert"]'), null);
  assert.equal(ui.input('current_password').value, 'OldPassword!123');
  assert.equal(ui.input('reauthentication_nonce').value, '12345678');
  await fillPassword(ui);
  await ui.click('Update password');
  assert.equal(ui.count('reset'), 1);
});

test('nonce failure alone leaves password update available without a successful nonce retry', async t => {
  const ui = await hydratedAuthForm({ nonceResults: [{ error: 'Service temporarily unavailable. Please try again.' }] });
  t.after(() => ui.close());
  await ui.click('Send verification code');
  await fillPassword(ui);
  await ui.click('Update password');
  assert.equal(ui.count('reset'), 1);
  assert.equal(ui.count('nonce'), 1);
});

test('independent nonce pending state disables its button and cannot acquire the password lock', async t => {
  const nonce = deferred();
  const ui = await hydratedAuthForm({ nonceResults: [nonce.promise] });
  t.after(() => ui.close());
  await ui.click('Send verification code');
  assert.equal(ui.button('Send verification code').disabled, true);
  assert.equal(ui.button('Update password').disabled, false);
  await fillPassword(ui);
  await ui.click('Update password');
  assert.equal(ui.count('reset'), 1);
  await act(async () => nonce.resolve({ error: 'Service temporarily unavailable. Please try again.' }));
  assert.equal(ui.button('Send verification code').disabled, false);
  await ui.click('Send verification code');
  assert.equal(ui.count('nonce'), 2);
});

test('synchronous duplicate-submit guard, loading state and password rejection retry are preserved', async t => {
  const update = deferred();
  const ui = await hydratedAuthForm({ resetResults: [update.promise] });
  t.after(() => ui.close());
  await ui.click('Send verification code');
  await fillPassword(ui);
  const primary = ui.button('Update password');
  const form = ui.container.querySelector('form');
  await act(async () => {
    form.requestSubmit(primary);
    form.requestSubmit(primary);
  });
  assert.equal(ui.count('reset'), 1);
  assert.equal(ui.count('nonce'), 1);
  assert.equal(primary.disabled, true);
  assert.equal(ui.container.querySelector('fieldset').disabled, true);
  assert.equal(primary.textContent, ui.t('Please wait…'));
  await act(async () => update.resolve({ error: 'Password change was rejected. Verify your current password or email code, then confirm your identity again.' }));
  assert.ok(ui.container.querySelector('[role="alert"]'));
  await fillPassword(ui);
  await ui.click('Update password');
  assert.equal(ui.count('reset'), 2);
  await ui.click('Send verification code');
  assert.equal(ui.count('nonce'), 2);
});

for (const mfa of [false, true]) test(`recovery MFA=${mfa} keeps its proof fields and primary action`, async t => {
  const ui = await hydratedAuthForm({ passwordContext: 'recovery', mfa });
  t.after(() => ui.close());
  assert.equal(ui.button('Send verification code'), undefined);
  assert.equal(ui.input('current_password'), null);
  assert.equal(Boolean(ui.input('fresh_code')), mfa);
  await fillPassword(ui, mfa);
  // Native submission without a submitter must still use the form's action.
  await act(async () => ui.container.querySelector('form').requestSubmit());
  assert.equal(ui.count('reset'), 1);
  assert.equal(ui.count('nonce'), 0);
  assert.equal(ui.calls[0].data.password_context, 'recovery');
});
