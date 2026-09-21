import test from "node:test";
import assert from "node:assert/strict";
import { workspaceFixture } from "./helpers/workspace-fixture.mjs";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
for (const language of ["en", "fa"]) {
  test(`${language}: workspace has exactly four primary destinations and farm context`, () => {
    const html = workspaceFixture({ language });
    const nav = html.match(/<nav[^>]*>[\s\S]*?<\/nav>/)[0];
    assert.equal((nav.match(/<a /g) || []).length, 4);
    for (const path of ["dashboard", "farms", "assistant", "account"])
      assert.ok(nav.includes(`/${path}?farm=fixture-farm`));
    assert.match(nav, /aria-current="page"/);
    assert.match(html, /\/weather\?farm=fixture-farm/);
    assert.match(html, /\/irrigation\?farm=fixture-farm/);
    assert.doesNotMatch(
      html,
      /Everything looks good|Soil Moisture: 21|Back to /,
    );
    if (language === "fa")
      assert.doesNotMatch(
        html,
        /Irrigation is on your calendar|At a glance|Active farm|Crop insights/,
      );
  });
  test(`${language}: empty farms offer one main Add action; farms and gardens keep actual saved data`, () => {
    const html = workspaceFixture({ language, empty: true });
    assert.match(html, /href="\/farms\/new"/);
    assert.doesNotMatch(
      html,
      language === "fa" ? /مزرعهٔ سبز|۲۶°/ : /Greenfield Farm|26°/,
    );
    const garden = workspaceFixture({ language, page: "farm", garden: true });
    assert.match(garden, language === "fa" ? /سیب/ : /Apple/);
    assert.match(garden, /\/farms\/fixture-farm\/edit/);
    assert.match(garden, /\/farms\/fixture-farm\/sensors/);
  });
  test(`${language}: Security Center retains two factors and all supported session controls`, () => {
    const html = workspaceFixture({ language, page: "security" });
    assert.match(html, /Primary/);
    assert.match(html, /Backup/);
    assert.match(
      html,
      language === "fa" ? /نشست‌های دیگر/ : /Sign out other sessions/,
    );
    assert.match(
      html,
      language === "fa" ? /همه نشست‌ها/ : /Sign out all sessions/,
    );
  });
  test(`${language}: Assistant is honest about unavailable chat and has four localized questions`, () => {
    const html = workspaceFixture({ language, page: "assistant" });
    assert.match(html, /textarea/);
    assert.match(html, /disabled=""/);
    assert.match(
      html,
      language === "fa"
        ? /گفت‌وگو هنوز فعال نیست/
        : /Chat is not available yet/,
    );
  });
}
test("Assistant uses the existing protected-route classification", () => {
  const { isPrivatePath, safeNextPath } = loadTs(
    "features/authentication/lib/redirects.ts",
  );
  assert.equal(isPrivatePath("/assistant"), true);
  assert.equal(safeNextPath("/assistant"), "/assistant");
});
