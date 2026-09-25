"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { signInWithGoogleAction } from "../services/actions";

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.04H12v3.86h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.89-1.74 2.99-4.31 2.99-7.35Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.61-2.42l-3.22-2.51c-.89.6-2.03.95-3.39.95-2.61 0-4.82-1.76-5.61-4.13H3.06v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.89A6.03 6.03 0 0 1 6.08 12c0-.66.11-1.3.31-1.89V7.52H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.48l3.33-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.99 14.7 2 12 2a10 10 0 0 0-8.94 5.52l3.33 2.59C7.18 7.74 9.39 5.98 12 5.98Z"
      />
    </svg>
  );
}

function GoogleSubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslation();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="min-h-12 w-full gap-3 rounded-xl bg-card font-semibold"
    >
      {pending ? (
        <LoaderCircle className="animate-spin motion-reduce:animate-none" />
      ) : (
        <GoogleMark />
      )}
      {t(pending ? "Signing in with Google…" : "Continue with Google")}
    </Button>
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
      <form action={signInWithGoogleAction}>
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <input type="hidden" name="source" value={source} />
        <GoogleSubmitButton />
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span>{t("or continue with email")}</span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
    </div>
  );
}
