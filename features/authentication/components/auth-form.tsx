"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { useSettings } from "@/features/settings/context/settings-context";
import {
  requestPasswordResetAction,
  resendVerificationAction,
  resetPasswordAction,
  signInAction,
  signUpAction,
  verifyEmailAction,
} from "../services/actions";
import {
  PASSWORD_MIN_LENGTH,
  passwordRequirementStatus,
  type AuthFormState,
} from "../lib/validation";
import { signUpFeedback, type SignUpValues } from "../lib/sign-up-feedback";
import { LoginCaptcha } from "./login-captcha";

export const accountInputClass =
  "min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 aria-invalid:border-destructive";

type Mode =
  | "sign-in"
  | "sign-up"
  | "forgot"
  | "reset"
  | "verify"
  | "recovery"
  | "resend";

const EMPTY_VALUES = {
  username: "",
  email: "",
  identifier: "",
  password: "",
  confirmPassword: "",
};

const ACTIONS = {
  "sign-in": signInAction,
  "sign-up": signUpAction,
  forgot: requestPasswordResetAction,
  resend: resendVerificationAction,
  reset: resetPasswordAction,
  verify: verifyEmailAction,
  recovery: verifyEmailAction,
};

const LABELS = {
  "sign-in": "Sign In",
  "sign-up": "Create your account",
  forgot: "Send reset email",
  resend: "Resend verification email",
  reset: "Update password",
  verify: "Verify email",
  recovery: "Continue to reset password",
};

export function AuthForm({
  mode,
  tokenHash,
  next,
  expectedUserId,
}: {
  mode: Mode;
  tokenHash?: string;
  next?: string;
  expectedUserId?: string;
}) {
  const t = useTranslation();
  const { language } = useSettings();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    ACTIONS[mode],
    {},
  );
  const [values, setValues] = useState(EMPTY_VALUES);
  const [submittedValues, setSubmittedValues] = useState<SignUpValues | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    if (!pending) submitting.current = false;
  }, [pending, state]);

  const withPassword = ["sign-in", "sign-up", "reset"].includes(mode);
  const passwordStatus = passwordRequirementStatus(
    values.password,
    values.confirmPassword,
  );
  const passwordRequirements = [
    {
      key: "length",
      label: "At least 8 characters",
      met: passwordStatus.length,
    },
    {
      key: "symbol",
      label: "At least one symbol (for example: ! @ # $ %)",
      met: passwordStatus.symbol,
    },
    {
      key: "englishLetter",
      label: "At least one English letter",
      met: passwordStatus.englishLetter,
    },
    {
      key: "number",
      label: "At least one number",
      met: passwordStatus.number,
    },
    {
      key: "match",
      label: "Passwords match",
      met: passwordStatus.match,
    },
  ] as const;
  const feedback = pending
    ? {}
    : mode === "sign-up"
      ? signUpFeedback(state, values, submittedValues)
      : state;
  const field = (
    name: keyof typeof EMPTY_VALUES,
    label: string,
    type: string,
    autoComplete: string,
    minLength?: number,
  ) => {
    const maxLength =
      name === "email" || name === "identifier"
        ? 254
        : name === "username"
          ? 30
          : 128;
    return (
      <div className="space-y-2">
        <label
          htmlFor={`${mode}-${name}`}
          className="block text-sm font-semibold"
        >
          {t(label)}
        </label>
        <input
          id={`${mode}-${name}`}
          name={name}
          type={type}
          value={values[name]}
          onChange={(event) => {
            const value = event.target.value;
            setValues((current) => ({ ...current, [name]: value }));
            if (
              mode !== "sign-in" &&
              (name === "password" || name === "confirmPassword")
            ) {
              setShowPasswordRequirements(true);
            }
          }}
          onFocus={() => {
            if (
              mode !== "sign-in" &&
              (name === "password" || name === "confirmPassword")
            ) {
              setShowPasswordRequirements(true);
            }
          }}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          dir="ltr"
          spellCheck={false}
          autoCapitalize={
            name === "username" || name === "identifier" ? "none" : undefined
          }
          aria-invalid={Boolean(feedback.fields?.[name])}
          aria-describedby={
            feedback.fields?.[name] ? `${mode}-${name}-error` : undefined
          }
          className={accountInputClass}
        />
        {feedback.fields?.[name] && (
          <p id={`${mode}-${name}-error`} className="text-xs text-destructive">
            {t(feedback.fields[name])}
          </p>
        )}
      </div>
    );
  };

  return (
    <form
      action={action}
      noValidate
      onSubmit={(event) => {
        if (submitting.current || pending) event.preventDefault();
        else {
          submitting.current = true;
          setSubmittedValues(values);
        }
      }}
      className="space-y-5"
    >
      <input
        type="hidden"
        name="expected_user_id"
        value={expectedUserId ?? ""}
      />
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <input
        type="hidden"
        name="language"
        value={language === "fa" ? "fa" : "en"}
      />
      {tokenHash && <input type="hidden" name="token_hash" value={tokenHash} />}
      <input
        type="hidden"
        name="type"
        value={mode === "recovery" ? "recovery" : "signup"}
      />
      <div hidden aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset disabled={pending} className="space-y-5 disabled:opacity-65">
        {mode === "sign-up" && (
          <>
            {field("username", "Username", "text", "username", 6)}
            <p className="text-xs text-muted-foreground">
              {t(
                "Use 6–30 lowercase English letters, numbers, or underscores.",
              )}
            </p>
          </>
        )}
        {mode === "sign-in" &&
          field("identifier", "Username or email", "text", "username")}
        {["sign-up", "forgot", "resend"].includes(mode) &&
          field("email", "Email", "email", "email")}

        {withPassword && (
          <>
            {field(
              "password",
              mode === "reset" ? "New password" : "Password",
              visible ? "text" : "password",
              mode === "sign-in" ? "current-password" : "new-password",
              mode === "sign-in" ? 1 : PASSWORD_MIN_LENGTH,
            )}
            {mode !== "sign-in" && (
              <>
                {(showPasswordRequirements ||
                  Boolean(
                    feedback.fields?.password ||
                      feedback.fields?.confirmPassword,
                  )) && (
                  <div
                    id={`${mode}-password-requirements`}
                    className="rounded-2xl border bg-muted/25 p-4"
                    aria-live="polite"
                  >
                    <ul className="space-y-2">
                      {passwordRequirements.map((requirement) => (
                        <li
                          key={requirement.key}
                          className={`flex items-center gap-2 text-xs font-medium ${
                            requirement.met
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {requirement.met ? (
                            <CheckCircle2
                              className="size-4 shrink-0"
                              aria-hidden="true"
                            />
                          ) : (
                            <X
                              className="size-4 shrink-0 text-destructive"
                              aria-hidden="true"
                            />
                          )}
                          <span>{t(requirement.label)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {field(
                  "confirmPassword",
                  "Confirm password",
                  visible ? "text" : "password",
                  "new-password",
                  PASSWORD_MIN_LENGTH,
                )}
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 gap-2 text-sm"
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff /> : <Eye />}
              {t(visible ? "Hide password" : "Show password")}
            </Button>
          </>
        )}

        {mode === "sign-in" && !values.identifier.includes("@") && (
          <LoginCaptcha attempt={state} />
        )}
        {feedback.error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm leading-6 text-destructive"
          >
            {t(feedback.error)}
          </p>
        )}
        {feedback.success && (
          <p
            role="status"
            className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6"
          >
            {t(feedback.success)}
          </p>
        )}
        {mode !== "sign-in" && feedback.verificationRequired && (
          <Link
            href="/verify-email?status=resend"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
          >
            {t("Resend verification email")}
          </Link>
        )}
        <Button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full gap-2 rounded-xl"
        >
          {pending && (
            <LoaderCircle className="animate-spin motion-reduce:animate-none" />
          )}
          {t(pending ? "Please wait…" : LABELS[mode])}
        </Button>
      </fieldset>
    </form>
  );
}
