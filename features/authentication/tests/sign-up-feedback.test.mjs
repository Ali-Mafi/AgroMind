import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
import { interactionHooks, elements } from "../../settings/tests/helpers/interactions.mjs";

const { signUpFeedback } = loadTs("features/authentication/lib/sign-up-feedback.ts");
const { signUpSchema, validationState } = loadTs("features/authentication/lib/validation.ts");
const valid = {
  username: "test_farmer",
  email: "farmer@example.test",
  password: "AgroMind#1384",
  confirmPassword: "AgroMind#1384",
};
const errors = (values) => validationState(signUpSchema.safeParse(values).error);

for (const [field, invalid] of [
  ["username", "ab"],
  ["email", "wrong"],
  ["password", "short"],
  ["confirmPassword", "different"],
]) {
  test(`signup ${field} feedback clears immediately when corrected without hiding other errors`, () => {
    const submitted = { ...valid, [field]: invalid };
    const state = errors(submitted);
    assert.ok(signUpFeedback(state, submitted, submitted).fields[field]);
    assert.deepEqual(signUpFeedback(state, valid, submitted).fields, {});
    assert.equal(signUpFeedback(state, valid, submitted).error, undefined);
    const stillInvalid = { ...submitted, email: "also-wrong" };
    assert.ok(signUpFeedback(state, stillInvalid, submitted).fields[field]);
    assert.equal(JSON.stringify(signUpFeedback(state, valid, submitted)).includes(valid.password), false);
  });
}

test("invalid edits retain feedback and fixing one field preserves the other errors", () => {
  const submitted = { ...valid, email: "wrong", username: "a" };
  const state = errors(submitted);
  assert.ok(signUpFeedback(state, { ...submitted, email: "still-wrong" }, submitted).fields.email);
  const next = signUpFeedback(state, { ...submitted, email: valid.email }, submitted);
  assert.equal(next.fields.email, undefined);
  assert.ok(next.fields.username);
  assert.ok(next.error);
});

test("confirmation feedback follows changes to either password field", () => {
  const submitted = { ...valid, confirmPassword: "Another#Pass1384" };
  const state = errors(submitted);
  const corrected = { ...submitted, password: submitted.confirmPassword };
  assert.equal(signUpFeedback(state, corrected, submitted).error, undefined);
  assert.equal(signUpFeedback(state, corrected, submitted).fields.confirmPassword, undefined);
  const changedAgain = { ...corrected, password: "Different#Pass1384" };
  assert.match(signUpFeedback(state, changedAgain, submitted).fields.confirmPassword, /do not match/);
});

test("server identity errors clear only after that identity changes, not unrelated edits or normalization", () => {
  for (const field of ["username", "email"]) {
    const state = { fields: { [field]: "Identity already exists" } };
    const unrelated = { ...valid, password: "Another#Pass1384" };
    assert.equal(signUpFeedback(state, unrelated, valid).fields[field], state.fields[field]);
    assert.equal(signUpFeedback(state, { ...valid, [field]: ` ${valid[field].toUpperCase()} ` }, valid).fields[field], state.fields[field]);
    const changed = { ...valid, [field]: field === "email" ? "another@example.test" : "another_farmer" };
    assert.equal(signUpFeedback(state, changed, valid).fields[field], undefined);
    assert.equal(signUpFeedback(state, changed, valid).error, undefined);
  }
});

test("feedback is not shown before a result and stale general messages disappear after editing", () => {
  assert.deepEqual(signUpFeedback({}, valid, null), {});
  const error = { error: "Account services are temporarily unavailable. Please try again." };
  const edited = { ...valid, username: "another_farmer" };
  assert.equal(signUpFeedback(error, valid, valid).error, error.error);
  assert.equal(signUpFeedback(error, edited, valid).error, undefined);
  assert.equal(signUpFeedback({ success: "Sent" }, edited, valid).success, undefined);
});

function formHarness(mode = "sign-up") {
  const hooks = interactionHooks();
  let result = {};
  let pending = false;
  const { AuthForm } = loadTs("features/authentication/components/auth-form.tsx", {
    react: { ...hooks.react, useActionState: () => [result, () => {}, pending] },
    "@/features/settings/hooks/use-translation": { useTranslation: () => (value) => value },
    "@/features/settings/context/settings-context": { useSettings: () => ({ language: "en" }) },
    "../services/actions": {},
  });
  const render = () => hooks.render(AuthForm, { mode });
  return {
    render,
    result: (next) => { result = next; },
    pending: (next) => { pending = next; },
    input: (name) => elements(render()).find((node) => node.type === "input" && node.props.name === name).props,
  };
}

test("real signup handlers retain every controlled value after a server error and clear corrected feedback", () => {
  const h = formHarness();
  const entered = { ...valid, email: "invalid" };
  for (const [name, value] of Object.entries(entered)) h.input(name).onChange({ target: { value } });
  let prevented = false;
  h.render().props.onSubmit({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, false);
  h.result(errors(entered));
  for (const [name, value] of Object.entries(entered)) assert.equal(h.input(name).value, value);
  assert.equal(h.input("email")["aria-invalid"], true);
  h.input("email").onChange({ target: { value: valid.email } });
  assert.equal(h.input("email")["aria-invalid"], false);
  assert.equal(h.input("email")["aria-describedby"], undefined);
  assert.equal(elements(h.render()).some((node) => node.props.role === "alert"), false);
  assert.equal(h.input("password").value, entered.password);
});

test("signup retains duplicate-submit protection, disables pending fields and keeps retry values", () => {
  const h = formHarness();
  for (const [name, value] of Object.entries(valid)) h.input(name).onChange({ target: { value } });
  let blocked = 0;
  const event = { preventDefault: () => { blocked++; } };
  h.render().props.onSubmit(event);
  h.render().props.onSubmit(event);
  assert.equal(blocked, 1);
  h.pending(true);
  assert.equal(elements(h.render()).find((node) => node.type === "fieldset").props.disabled, true);
  h.pending(false);
  h.result({ fields: { username: "Username is already taken." } });
  h.render().props.onSubmit(event);
  assert.equal(blocked, 1);
  for (const [name, value] of Object.entries(valid)) assert.equal(h.input(name).value, value);
});

test("signin never renders a verification CTA even for an unconfirmed-account error", () => {
  const h = formHarness("sign-in");
  h.result({ error: "Check the verification email from sign up.", verificationRequired: true });
  assert.equal(elements(h.render()).some((node) => node.props.href?.startsWith("/verify-email")), false);
  assert.equal(elements(h.render()).some((node) => node.props.role === "alert"), true);
});



test("password checklist appears on focus and tracks all five requirements", () => {
  const h = formHarness();
  h.input("password").onFocus();
  let rows = elements(h.render()).filter(
    (node) => node.type === "li" && typeof node.props.className === "string",
  );
  assert.equal(rows.length >= 5, true);

  h.input("password").onChange({ target: { value: "AgroMind#1384" } });
  h.input("confirmPassword").onChange({ target: { value: "AgroMind#1384" } });
  rows = elements(h.render()).filter(
    (node) => node.type === "li" && typeof node.props.className === "string",
  );
  assert.equal(rows.slice(-5).every((node) => node.props.className.includes("text-primary")), true);
});
