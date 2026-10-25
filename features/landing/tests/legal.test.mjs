import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
const { NOTICES, LINKS, LEGAL_UI } = loadTs("features/legal/content.ts");

test("every policy is available in Persian and English", () => {
  assert.deepEqual(LINKS.map(entry => entry[1]), ["/privacy", "/cookies", "/terms"]);
  for(const lang of ["en","fa"]) assert.ok(LEGAL_UI[lang].back.length && LEGAL_UI[lang].signupStart.length);
  for(const kind of ["privacy","cookies","terms"]) {
    assert.match(readFileSync(`app/${kind}/page.tsx`,"utf8"), /<LegalPage kind=/);
    for(const lang of ["en","fa"]) {
      const doc=NOTICES[kind][lang];
      assert.ok(doc.title.length>5 && doc.items.length>=4);
      assert.ok(doc.items.every(([title,body])=>title.length>3 && body.length>45));
    }
  }
});

test("cookie and privacy disclosures describe existing technical behavior", () => {
  const cookie=NOTICES.cookies.en.items.map(item=>item[1]).join(" ");
  const privacy=NOTICES.privacy.en.items.map(item=>item[1]).join(" ");
  for(const name of ["agromind_display_v1","agromind_pending_email","Supabase"]) assert.ok(cookie.includes(name));
  for(const service of ["Vercel","Resend","WeatherAPI","Open-Meteo","Turnstile","Nominatim"]) assert.ok(privacy.includes(service));
  assert.match(cookie, /non-essential trackers|nonessential trackers|nonessential tracking/i);
});

test("public and account entrypoints point to legal notices", () => {
  assert.match(readFileSync("features/landing/components/footer.tsx","utf8"), /<LegalLinks/);
  assert.match(readFileSync("features/authentication/components/auth-entry.tsx","utf8"), /<LegalSignupNotice/);
  assert.match(readFileSync("features/account/components/about-product.tsx","utf8"), /<LegalLinks/);
});

test("legal notices open in a global native modal without changing routes", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  const provider = readFileSync("features/legal/components/legal-modal-provider.tsx", "utf8");
  const link = readFileSync("features/legal/components/legal-link.tsx", "utf8");
  const dialog = readFileSync("features/legal/components/legal-modal-dialog.tsx", "utf8");
  const links = readFileSync("features/legal/components/legal-links.tsx", "utf8");
  const signup = readFileSync("features/legal/components/legal-signup-notice.tsx", "utf8");
  assert.match(layout, /<LegalModalProvider>/);
  assert.match(provider, /lazy\(\(\)\s*=>/);
  assert.match(provider, /openLegal/);
  assert.match(link, /event\.preventDefault\(\)/);
  assert.match(link, /isUnmodifiedLegalClick/);
  assert.match(dialog, /dialog\.showModal\(\)/);
  assert.match(dialog, /onCancel=/);
  assert.match(dialog, /aria-label=\{ui\.close\}/);
  assert.match(dialog, /onSelect\(id\)/);
  assert.match(links, /<LegalLink/);
  assert.match(signup, /<LegalLink/);
});
