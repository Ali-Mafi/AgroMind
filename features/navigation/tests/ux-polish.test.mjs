import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { workspaceFixture } from "./helpers/workspace-fixture.mjs";
import { localizedRenderer } from "../../settings/tests/helpers/render.mjs";
import {
  interactionHooks,
  elements,
} from "../../settings/tests/helpers/interactions.mjs";
import {
  loadTs,
  localRequire,
  root,
} from "../../weather/tests/helpers/load-ts.mjs";
const React = localRequire("react");

for (const language of ["en", "fa"]) {
  test(`${language}: plan limit replaces the entire wizard; allowed farms keep creation`, () => {
    const html = workspaceFixture({
      language,
      page: "new",
      canCreateFarm: false,
    });
    assert.match(html, /href="\/account\/subscription"/);
    assert.match(html, /lucide-sprout/);
    assert.match(html, language === "fa" ? /ظرفیت.*۳/ : /up to 3 farms/);
    assert.doesNotMatch(html, /<input|<textarea|<form|<select|aria-haspopup/);
    assert.doesNotMatch(
      html,
      /What do you want to manage|چه نوع زمینی|Create Farm/,
    );
    const allowed = workspaceFixture({ language, page: "new" });
    assert.match(
      allowed,
      language === "fa" ? /چه نوع زمینی/ : /What do you want to manage/,
    );
    assert.doesNotMatch(allowed, /Current plan: up to|ظرفیت طرح فعلی/);
  });
  test(`${language}: wizard arrows follow reading order and preserve label order`, () => {
    const html = workspaceFixture({ language, page: "new" });
    const buttons = [
      ...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g),
    ].map((match) => match[0]);
    const previous = buttons.find((button) =>
      button.includes(language === "fa" ? "قبلی" : "Previous"),
    );
    const next = buttons.find((button) =>
      button.includes(language === "fa" ? "بعدی" : "Next"),
    );
    assert.match(
      previous,
      language === "fa" ? /lucide-arrow-right/ : /lucide-arrow-left/,
    );
    assert.match(
      next,
      language === "fa" ? /lucide-arrow-left/ : /lucide-arrow-right/,
    );
    assert.ok(
      previous.indexOf("<svg") <
        previous.indexOf(language === "fa" ? "قبلی" : "Previous"),
    );
    assert.ok(
      next.indexOf(language === "fa" ? "بعدی" : "Next") < next.indexOf("<svg"),
    );
  });
  test(`${language}: overview is status-first and retains every existing farm route`, () => {
    const html = workspaceFixture({ language, page: "farm" });
    for (const destination of [
      "/weather?farm=fixture-farm",
      "/irrigation?farm=fixture-farm",
      "/farms/fixture-farm/insights",
      "/farms/fixture-farm/sensors",
      "/farms/fixture-farm/edit",
    ])
      assert.ok(html.includes(destination));
    assert.match(html, language === "fa" ? /مشاهده پیش‌بینی/ : /View forecast/);
    assert.match(
      html,
      language === "fa" ? /نوبت بعدی آبیاری/ : /Next irrigation/,
    );
    assert.match(html, language === "fa" ? /ذرت/ : /Corn/);
    assert.doesNotMatch(html, /<details|<summary/);
  });
  test(`${language}: help and about use real routes and disclose unavailable support`, () => {
    const help = workspaceFixture({ language, page: "help" });
    assert.match(help, /id="ticket-subject"/);
    assert.match(help, /id="ticket-description"/);
    assert.match(help, /type="submit"[^>]*disabled/);
    assert.match(
      help,
      language === "fa"
        ? /ارسال درخواست هنوز فعال نیست/
        : /Ticket submission is not available yet/,
    );
    assert.doesNotMatch(help, /mailto:|ticket.*success|<summary|<details/);
    const about = workspaceFixture({ language, page: "about" });
    assert.match(about, /href="\/account\/help"/);
    assert.doesNotMatch(about, /href="\/(privacy|terms)/);
    assert.match(about, language === "fa" ? /نسخه برنامه/ : /App version/);
    for (const match of about.matchAll(/href="(\/[^"?#]*)"/g)) {
      assert.ok(
        existsSync(path.join(root, "app", match[1], "page.tsx")),
        match[1],
      );
    }
  });
  test(`${language}: disclosure uses an accessible button/region and supports initial open state`, () => {
    const ui = localizedRenderer({ language });
    const { Disclosure } = ui.load("components/ui/disclosure.tsx");
    for (const defaultOpen of [false, true]) {
      const html = ui.renderToStaticMarkup(
        React.createElement(
          Disclosure,
          { title: "Test", defaultOpen },
          "Details",
        ),
      );
      assert.match(html, new RegExp(`aria-expanded="${defaultOpen}"`));
      assert.match(html, /role="region"/);
      if (defaultOpen) assert.match(html, /aria-controls="[^"]+"/);
      assert.match(html, /lucide-chevron-down/);
      assert.match(
        html,
        new RegExp(`dir="${language === "fa" ? "rtl" : "ltr"}"`),
      );
      assert.doesNotMatch(html, /<summary|<details/);
    }
  });
}

test("mobile composer follows the visual viewport, ignores pinch zoom, and resets after blur", () => {
  const { composerKeyboardInset } = loadTs(
    "features/assistant/lib/composer-layout.ts",
  );
  assert.equal(
    composerKeyboardInset(844, { height: 500, offsetTop: 40, scale: 1 }, true),
    304,
  );
  assert.equal(
    composerKeyboardInset(844, { height: 500, offsetTop: 0, scale: 2 }, true),
    0,
  );
  assert.equal(
    composerKeyboardInset(844, { height: 500, offsetTop: 0, scale: 1 }, false),
    0,
  );
  assert.equal(
    composerKeyboardInset(844, { height: 900, offsetTop: 0, scale: 1 }, true),
    0,
  );
  assert.equal(composerKeyboardInset(844, null, true), 0);
  const css = readFileSync(
    path.join(root, "components/layout/app-shell.css"),
    "utf8",
  );
  assert.match(
    css,
    /bottom: max\(var\(--app-bottom-navigation-height\), var\(--composer-keyboard-inset/,
  );
  assert.match(css, /padding-bottom: calc\(var\(--composer-height/);
  assert.match(css, /safe-area-inset-bottom/);
});

test("a starter fills the real assistant draft and edit clears its selected feedback; send stays disabled", () => {
  const hooks = interactionHooks();
  const { AssistantWorkspace } = loadTs(
    "features/assistant/components/assistant-workspace.tsx",
    {
      react: hooks.react,
      "@/features/settings/hooks/use-translation": {
        useTranslation: () => (text) => text,
      },
      "../hooks/use-composer-layout": { useComposerLayout() {} },
    },
  );
  let tree = hooks.render(AssistantWorkspace);
  const starter = elements(tree).find(
    (element) => element.props["aria-pressed"] === false,
  );
  starter.props.onClick();
  tree = hooks.render(AssistantWorkspace);
  let textarea = elements(tree).find((element) => element.type === "textarea");
  assert.equal(textarea.props.value, "How can I plan irrigation for my farm?");
  assert.equal(
    elements(tree).filter((element) => element.props["aria-pressed"] === true)
      .length,
    1,
  );
  textarea.props.onChange({ target: { value: "A different question" } });
  tree = hooks.render(AssistantWorkspace);
  textarea = elements(tree).find((element) => element.type === "textarea");
  assert.equal(textarea.props.value, "A different question");
  assert.equal(
    elements(tree).filter((element) => element.props["aria-pressed"] === true)
      .length,
    0,
  );
  assert.equal(
    elements(tree).find(
      (element) => element.props["aria-label"] === "Send message",
    ).props.disabled,
    true,
  );
  const html = workspaceFixture({ language: "fa", page: "assistant" });
  assert.doesNotMatch(html, /rtl:rotate-180/);
});

test("support drafts validate required fields, category membership and length without claiming submission", () => {
  const { validateSupportDraft } = loadTs(
    "features/account/lib/support-draft.ts",
  );
  assert.equal(
    Object.keys(
      validateSupportDraft({ subject: " ", category: "", description: " " }),
    ).length,
    3,
  );
  assert.equal(
    Object.keys(
      validateSupportDraft({
        subject: "Weather issue",
        category: "Weather",
        description: "The forecast would not load for my farm.",
      }),
    ).length,
    0,
  );
  assert.ok(
    validateSupportDraft({
      subject: "Valid subject",
      category: "injected",
      description: "A valid description for a real question",
    }).category,
  );
  assert.equal(
    Object.keys(
      validateSupportDraft({
        subject: "x".repeat(121),
        category: "Weather",
        description: "x".repeat(4001),
      }),
    ).length,
    2,
  );
});

test("every help topic/question/action and support category has native Persian copy", () => {
  const { HELP_TOPICS, SUPPORT_CATEGORIES } = loadTs(
    "features/account/constants/help.ts",
  );
  const { PERSIAN_CATALOG } = loadTs("features/settings/constants/catalogs.ts");
  for (const key of [
    ...SUPPORT_CATEGORIES,
    ...HELP_TOPICS.flatMap((topic) => [
      topic.name,
      ...topic.questions.flatMap(([question, answer, , label]) => [
        question,
        answer,
        label,
      ]),
    ]),
  ]) {
    assert.ok(PERSIAN_CATALOG[key], key);
    assert.notEqual(PERSIAN_CATALOG[key], key);
  }
  assert.equal(PERSIAN_CATALOG.Preferences, "تنظیمات");
  for (const [key, translation] of Object.entries(PERSIAN_CATALOG)) {
    assert.deepEqual(
      [...translation.matchAll(/\{\w+\}/g)].map((x) => x[0]).sort(),
      [...key.matchAll(/\{\w+\}/g)].map((x) => x[0]).sort(),
      key,
    );
  }
});
