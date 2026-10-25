import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
import { localizedRenderer } from "../../settings/tests/helpers/render.mjs";
import { createRequire } from "node:module";
const React = createRequire(import.meta.url)("react");
const { LEGAL_DOCUMENTS, LEGAL_NAV } = loadTs("features/legal/content.ts");
test("legal pages in both languages cover provider, storage and support notices", () => {
 assert.deepEqual(LEGAL_NAV.map(x => x[1]), ["/privacy", "/cookies", "/terms"]);
 for (const kind of ["privacy", "cookies", "terms"]) {
  for (const lang of ["en", "fa"]) {
   const d = LEGAL_DOCUMENTS[kind][lang];
   assert.ok(d.heading.length > 5 && d.sections.length >= 5);
   assert.ok(d.sections.flatMap(x => x[1]).join(" ").includes("support@agromind.ir"));
  }
  assert.match(readFileSync(`app/${kind}/page.tsx`, "utf8"), /<LegalPage kind=/);
 }
 const notice = LEGAL_DOCUMENTS.cookies.en.sections.flatMap(x => x[1]).join(" ");
 assert.match(notice, /agromind_display_v1/);
 assert.match(notice, /agromind_pending_email/);
 assert.match(notice, /consent/);
});
for (const lang of ["en", "fa"]) test(`${lang} footer links legal policies`, () => {
 const { load, renderToStaticMarkup } = localizedRenderer({ language:lang });
 const { Footer } = load("features/landing/components/footer.tsx");
 const html = renderToStaticMarkup(React.createElement(Footer));
 for(const u of ["/privacy","/cookies","/terms"])assert.ok(html.includes(`href="${u}"`));
});
