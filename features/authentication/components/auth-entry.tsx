import Link from "next/link";
import { ArrowLeft, LockKeyhole, Sprout } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { T } from "@/features/settings/components/translated-text";

// Account services are not configured yet. Never collect credentials or
// fabricate an authenticated session while exposing these entry routes.
export function AuthEntry({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  return (
    <main className="relative isolate flex min-h-svh flex-col bg-linear-to-br from-primary/10 via-background to-accent/8 px-4 py-6 sm:px-8">
      <Link href="/" className={buttonVariants({ variant: "ghost", className: "min-h-11 w-fit gap-2 rounded-xl" })}><ArrowLeft className="rtl:rotate-180" /><T text="Back to home" /></Link>
      <div className="m-auto w-full max-w-md py-10">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-heading text-2xl font-bold text-primary"><Sprout className="size-8" />AgroMind</Link>
        <section className="rounded-[2rem] border border-primary/15 bg-card p-6 shadow-2xl shadow-primary/10 sm:p-9">
          <h1 className="font-heading text-3xl font-bold"><T text={signup ? "Create your account" : "Welcome back"} /></h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground"><T text={signup ? "Your farms and gardens, together in AgroMind." : "Sign in to manage your farms and gardens."} /></p>
          <div className="my-7 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4" role="status">
            <LockKeyhole className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm leading-6"><T text={signup ? "Account registration is not available yet. Please check back soon." : "Account sign-in is not available yet. Please check back soon."} /></p>
          </div>
          <Button disabled className="min-h-12 w-full rounded-xl"><T text={signup ? "Create your account" : "Sign In"} /></Button>
          <p className="mt-6 text-center text-sm text-muted-foreground"><T text={signup ? "Already have an account?" : "New to AgroMind?"} />{" "}<Link href={signup ? "/login" : "/signup"} className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"><T text={signup ? "Sign In" : "Sign up"} /></Link></p>
        </section>
      </div>
    </main>
  );
}
