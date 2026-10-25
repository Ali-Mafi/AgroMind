import Link from "next/link";
import { cookies } from "next/headers";
import { DEFAULT_PREFERENCES, resolvePreferences } from "@/features/settings/lib/preferences";
import { PREFERENCES_COOKIE, preferencesFromCookie } from "@/features/settings/lib/preferences-cookie";
import { LEGAL_DOCUMENTS, LEGAL_NAV, LEGAL_UI, LEGAL_UPDATED, type LegalKind } from "../content";
export async function LegalPage({ kind }: { kind: LegalKind }) {
 const preferences = preferencesFromCookie((await cookies()).get(PREFERENCES_COOKIE)?.value);
 const lang = resolvePreferences(preferences ?? DEFAULT_PREFERENCES).language === "fa" ? "fa" : "en";
 const content = LEGAL_DOCUMENTS[kind][lang], ui = LEGAL_UI[lang];
 return <main lang={lang} dir={lang === "fa" ? "rtl" : "ltr"} className="min-h-svh bg-background px-5 py-9 text-foreground sm:px-8 sm:py-14">
  <div className="mx-auto max-w-3xl">
   <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">{ui.home}</Link>
   <header className="mt-7 border-b border-border/60 pb-8">
    <span className="text-sm font-semibold text-primary">AgroMind</span>
    <h1 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl">{content.heading}</h1>
    <p className="mt-4 text-base leading-8 text-muted-foreground">{content.intro}</p>
    <p className="mt-3 text-xs text-muted-foreground">{ui.updated}: <bdi>{LEGAL_UPDATED}</bdi></p>
   </header>
   <div className="space-y-9 py-9">{content.sections.map(([heading, paragraphs]) =>
    <section key={heading} className="space-y-3">
     <h2 className="text-xl font-semibold leading-8">{heading}</h2>
     {paragraphs.map(text => <p key={text} className="text-sm leading-8 text-muted-foreground sm:text-base">{text}</p>)}
    </section>)}
   </div>
   <aside className="rounded-2xl border bg-muted/30 p-5 text-sm leading-7 text-muted-foreground">{ui.note}</aside>
   <footer className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-6">
    <nav aria-label={ui.nav} className="flex flex-wrap gap-x-5 gap-y-3">{LEGAL_NAV.map(([id,href,en,fa]) =>
     <Link key={id} href={href} aria-current={kind === id ? "page" : undefined} className="text-sm font-medium text-primary hover:underline">{lang === "fa" ? fa : en}</Link>)}</nav>
    <a href="mailto:support@agromind.ir" className="text-xs text-primary hover:underline">support@agromind.ir</a>
   </footer>
  </div>
 </main>;
}
