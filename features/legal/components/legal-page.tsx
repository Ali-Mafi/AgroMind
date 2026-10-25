import Link from "next/link";
import { cookies } from "next/headers";
import { DEFAULT_PREFERENCES, resolvePreferences } from "@/features/settings/lib/preferences";
import { PREFERENCES_COOKIE, preferencesFromCookie } from "@/features/settings/lib/preferences-cookie";
import { LINKS, NOTICES, REVIEWED_ON, type LegalKind } from "../content";

export async function LegalPage({ kind }: { kind: LegalKind }) {
  const prefs = preferencesFromCookie((await cookies()).get(PREFERENCES_COOKIE)?.value);
  const lang = resolvePreferences(prefs ?? DEFAULT_PREFERENCES).language === "fa" ? "fa" : "en";
  const copy = NOTICES[kind][lang];
  const fa = lang === "fa";
  return <main lang={lang} dir={fa ? "rtl" : "ltr"} className="min-h-svh bg-background px-5 py-10 text-foreground sm:px-8 sm:py-14">
    <div className="mx-auto max-w-3xl">
      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">{fa ? "بازگشت به AgroMind" : "Back to AgroMind"}</Link>
      <header className="mt-7 border-b pb-8">
        <p className="font-semibold text-primary">AgroMind</p>
        <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 leading-8 text-muted-foreground">{copy.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">{fa ? "تاریخ بازبینی" : "Last reviewed"}: <bdi>{REVIEWED_ON}</bdi></p>
      </header>
      <div className="space-y-9 py-9">
        {copy.items.map(([title, body]) => <section key={title} className="space-y-3">
          <h2 className="text-xl font-semibold leading-8">{title}</h2>
          <p className="text-sm leading-8 text-muted-foreground sm:text-base">{body}</p>
        </section>)}
      </div>
      <footer className="border-t pt-6">
        <nav aria-label={fa ? "اسناد حقوقی" : "Legal documents"} className="flex flex-wrap gap-4 text-sm">
          {LINKS.map(([key,href,en,titleFa]) => <Link key={key} href={href} aria-current={kind === key ? "page" : undefined} className="font-semibold text-primary hover:underline">{fa ? titleFa : en}</Link>)}
        </nav>
        <p className="mt-4 text-sm text-muted-foreground">{fa ? "پشتیبانی" : "Support"}: <a className="text-primary" href="mailto:support@agromind.ir">support@agromind.ir</a></p>
      </footer>
    </div>
  </main>;
}
