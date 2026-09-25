"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  signInWithAppleAction,
  signInWithGoogleAction,
} from "../services/actions";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.04H12v3.86h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.89-1.74 2.99-4.31 2.99-7.35Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.42l-3.22-2.51c-.89.6-2.03.95-3.39.95-2.61 0-4.82-1.76-5.61-4.13H3.06v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.89A6.03 6.03 0 0 1 6.08 12c0-.66.11-1.3.31-1.89V7.52H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.48l3.33-2.59Z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.99 14.7 2 12 2a10 10 0 0 0-8.94 5.52l3.33 2.59C7.18 7.74 9.39 5.98 12 5.98Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]" fill="currentColor">
      <path d="M19.665 13.682c-.03-3.031 2.475-4.486 2.587-4.554-1.407-2.059-3.6-2.34-4.38-2.37-1.864-.189-3.642 1.099-4.588 1.099-.947 0-2.412-1.071-3.96-1.043-2.038.03-3.918 1.186-4.968 3.014-2.117 3.675-.542 9.115 1.52 12.096 1.009 1.46 2.211 3.096 3.79 3.037 1.52-.06 2.095-.984 3.931-.984 1.837 0 2.354.984 3.96.953 1.635-.03 2.67-1.49 3.67-2.953 1.16-1.694 1.638-3.334 1.666-3.42-.036-.017-3.193-1.225-3.228-4.854ZM16.65 4.792c.838-1.016 1.404-2.428 1.25-3.838-1.209.049-2.673.805-3.54 1.82-.778.901-1.46 2.339-1.278 3.72 1.35.105 2.73-.687 3.568-1.702Z" />
    </svg>
  );
}

function OAuthSubmitButton({
  provider,
}: {
  provider: "google" | "apple";
}) {
  const { pending } = useFormStatus();
  const t = useTranslation();
  const apple = provider === "apple";

  return (
    <Button
      type="submit"
      variant={apple ? "default" : "outline"}
      disabled={pending}
      className={
        apple
          ? "min-h-12 w-full gap-3 rounded-xl bg-foreground font-semibold text-background hover:bg-foreground/90"
          : "min-h-12 w-full gap-3 rounded-xl bg-card font-semibold"
      }
    >
      {pending ? (
        <LoaderCircle className="animate-spin motion-reduce:animate-none" />
      ) : apple ? (
        <AppleMark />
      ) : (
        <GoogleMark />
      )}
      {t(
        pending
          ? apple
            ? "Signing in with Apple…"
            : "Signing in with Google…"
          : apple
            ? "Continue with Apple"
            : "Continue with Google",
      )}
    </Button>
  );
}

function OAuthForm({
  action,
  next,
  source,
  provider,
}: {
  action: (form: FormData) => Promise<void>;
  next?: string;
  source: "login" | "signup";
  provider: "google" | "apple";
}) {
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <input type="hidden" name="source" value={source} />
      <OAuthSubmitButton provider={provider} />
    </form>
  );
}

export function OAuthSignIn({
  next,
  source,
}: {
  next?: string;
  source: "login" | "signup";
}) {
  const t = useTranslation();

  return (
    <div className="mb-5">
      <div className="grid gap-3">
        <OAuthForm
          action={signInWithAppleAction}
          next={next}
          source={source}
          provider="apple"
        />
        <OAuthForm
          action={signInWithGoogleAction}
          next={next}
          source={source}
          provider="google"
        />
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span>{t("or continue with email")}</span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
    </div>
  );
}
