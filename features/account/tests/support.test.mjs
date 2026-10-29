import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
const { commandSchema, readSchema } = loadTs("features/support/lib/schema.ts");
const { supportEmail } = loadTs("features/support/lib/email.ts");
const payload = {
  action: "create",
  requestId: randomUUID(),
  subject: "Ticket subject",
  category: "Other",
  body: "A description with enough details.",
};
test("support validation rejects spoofed ownership, roles, malformed fields and excessive pages", () => {
  assert.ok(commandSchema.safeParse(payload).success);
  assert.ok(commandSchema.safeParse({ ...payload, language: "en" }).success);
  assert.ok(commandSchema.safeParse({ ...payload, language: "fa" }).success);
  assert.ok(commandSchema.safeParse({ ...payload }).success); // Pre-upgrade clients remain supported.
  for (const extra of [
    { userId: randomUUID() },
    { role: "admin" },
    { priority: "high" },
    { subject: "x" },
    { body: "x".repeat(4001) },
    { category: "invented" },
    { language: "de" },
    { language: null },
  ])
    assert.equal(
      commandSchema.safeParse({ ...payload, ...extra }).success,
      false,
    );
  assert.equal(readSchema.safeParse({ page: -1 }).success, false);
  assert.equal(readSchema.safeParse({ page: 10001 }).success, false);
});
test("support email contains safe links and localized copy without message bodies", () => {
  for (const lang of ["fa", "en"]) {
    const rendered = supportEmail(
      "AM-00000001",
      "reply",
      lang,
      "https://agromind.ir/account/help/tickets/test",
    );
    assert.match(rendered.html, new RegExp(`lang="${lang}"`));
    assert.match(rendered.text, /AM-00000001/);
  }
  const newTicket = supportEmail("AM-00000002", "created", "fa", "https://agromind.ir/admin/support?ticket=123", "staff");
  assert.match(newTicket.subject, /درخواست پشتیبانی جدید/);
  assert.match(newTicket.text, /درخواست پشتیبانی جدید ثبت شده است/);
  assert.match(newTicket.html, /admin\/support/);
  assert.doesNotMatch(newTicket.text, /A description with enough details/);
  assert.doesNotMatch(
    supportEmail("<script>", "reply", "en", 'https://agromind.ir/?x="').html,
    /<script>|href="[^"]*""/,
  );
});
test("branded support emails are responsive, accessible and safe in both locales", () => {
  for (const language of ["fa", "en"]) {
    for (const event of ["created", "reply", "status"]) {
      const customer = supportEmail("AM-00000001", event, language, "https://agromind.ir/account/help/tickets/42", "user");
      assert.match(customer.html, /<!doctype html>/i);
      assert.match(customer.html, /role="presentation"/);
      assert.match(customer.html, /width="100%"/);
      assert.match(customer.html, /max-width:600px/);
      assert.match(customer.html, /background-color:#102c20/);
      assert.match(customer.html, /background-color:#efede6/);
      assert.match(customer.html, /data-email-cta="primary"/);
      assert.match(customer.html, new RegExp('lang="' + language + '"'));
      assert.match(customer.html, new RegExp('dir="' + (language === "fa" ? "rtl" : "ltr") + '"'));
      assert.match(customer.html, /href="https:\/\/agromind\.ir\/account\/help\/tickets\/42"/);
      assert.match(customer.text, /AM-00000001/);
      assert.doesNotMatch(customer.html, /<script|@import|font-face/i);
      assert.doesNotMatch(customer.text, /password|verification code/i);
    }
    const staff = supportEmail("AM-00000001", "created", language, "https://agromind.ir/admin/support?ticket=42", "staff");
    assert.match(staff.html, /admin\/support/);
    assert.match(staff.subject, language === "fa" ? /درخواست پشتیبانی جدید/ : /New support ticket/);
  }
  const injection = supportEmail("<img src=x onerror=alert(1)>", "reply", "en", "javascript:alert(1)");
  assert.doesNotMatch(injection.html, /<img src=x|href="javascript:|<script/i);
  assert.match(injection.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(injection.html, /href="https:\/\/agromind\.ir\/account\/help"/);
});

test("support tickets stay within mobile widths and staff controls reflow", () => {
  const ui = readFileSync("features/support/components/workspace.tsx", "utf8");
  assert.match(ui, /grid min-w-0 grid-cols-1 gap-3/);
  assert.match(ui, /group block w-full min-w-0 max-w-full/);
  assert.match(ui, /\[overflow-wrap:anywhere\]/);
  assert.match(ui, /border-t border-border\/60 pt-2\.5/);
  assert.match(ui, /flex min-w-0 flex-col gap-2 sm:col-span-2 sm:flex-row/);
  assert.match(ui, /grid min-w-0 grid-cols-1 gap-3 md:grid-cols-/);
  assert.match(ui, /w-full sm:w-auto/);
  assert.match(ui, /<StaffSupportPage ticketId=\{ticketId\} \/>/);
  assert.match(ui, /<Clock3 className="mt-1 size-3.5 shrink-0"/);
  assert.match(ui, /<time dateTime=\{item.updated_at\} className="min-w-0 break-words/);
});

test("admin support shares the standard protected workspace layout and typography", () => {
  const page = readFileSync("app/admin/support/page.tsx", "utf8");
  const ui = readFileSync("features/support/components/workspace.tsx", "utf8");
  const shell = readFileSync("components/layout/app-shell.tsx", "utf8");
  const styles = readFileSync("components/layout/app-shell.css", "utf8");
  const verify = readFileSync("app/admin/support/verify/page.tsx", "utf8");
  const nav = readFileSync("features/navigation/components/bottom-navigation.tsx", "utf8");

  assert.match(page, /await requireSupportStaff\(\)/);
  assert.match(page, /<ProtectedLayout>/);
  assert.match(page, /<AppShell>/);
  assert.ok(page.indexOf("<ProtectedLayout>") < page.indexOf("<AppShell>"));
  assert.match(shell, /className="agromind-app agromind-workspace"/);
  assert.match(shell, /className="app-content outline-none"/);
  assert.match(styles, /\.app-page \{/);
  assert.match(styles, /\.app-card \{/);
  assert.match(ui, /import \{ AccountShell, accountCardClass \}/);
  assert.match(ui, /staff \? accountCardClass/);
  assert.match(ui, /<PageHeader/);
  assert.match(ui, /Ticket inbox/);
  assert.match(nav, /pathname\.startsWith\("\/admin\/support"\)/);

  // The MFA challenge is a distinct auth route, not nested under an app shell.
  assert.match(verify, /await requireSupportStaff\(\)/);
  assert.match(verify, /<AuthShell/);
  assert.doesNotMatch(verify, /<AppShell/);
});

test("notification failures acknowledge retry without throwing or losing a ticket", async () => {
  const names = [
    "SUPPORT_EMAIL_ENABLED",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "RESEND_API_KEY",
    "SUPPORT_NOTIFICATION_EMAIL",
  ];
  const before = Object.fromEntries(names.map((n) => [n, process.env[n]]));
  Object.assign(process.env, {
    SUPPORT_EMAIL_ENABLED: "true",
    SUPABASE_SERVICE_ROLE_KEY: "test",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.test",
    RESEND_API_KEY: "test",
    SUPPORT_NOTIFICATION_EMAIL: "support@example.test",
  });
  const calls = [];
  const { drainSupportEmails } = loadTs(
    "features/support/services/notifications.ts",
    {
      "@supabase/supabase-js": {
        createClient: () => ({
          rpc: async (name, args) => {
            calls.push({ name, args });
            return {
              data:
                name === "transactional_email_jobs_v2"
                  ? [
                      {
                        id: "job",
                        lease: "lease",
                        ticketId: "ticket",
                        number: "AM-1",
                        audience: "staff",
                        event: "reply",
                        language: "en",
                      },
                    ]
                  : name === "security_freeze_email" ? args.p_payload : null,
              error: null,
            };
          },
        }),
      },
      "@/features/authentication/services/resend-auth": {
        sendAuthEmail: async () => {
          throw new Error("provider failed");
        },
      },
    },
  );
  try {
    await drainSupportEmails();
    assert.equal(calls.find(c => c.name === "support_email_ack").args.p_sent, false);
    assert.equal(calls.find(c => c.name === "support_email_ack").args.p_id, "job");
  } finally {
    for (const n of names) {
      if (before[n] === undefined) delete process.env[n];
      else process.env[n] = before[n];
    }
  }
});
test("ticket creation submits the customer's current display language", () => {
  const form = readFileSync("features/account/components/support-ticket-form.tsx", "utf8");
  assert.match(form, /useSettings\(\)/);
  assert.match(form, /language: language === "fa" \? "fa" : "en"/);
});

test("support UI uses accessible responsive controls and text-only rendering", () => {
  const ui = readFileSync("features/support/components/workspace.tsx", "utf8");
  assert.match(ui, /sm:grid-cols-2/);
  assert.match(ui, /min-h-11/);
  assert.match(ui, /role="alert"/);
  assert.match(ui, /role="status"/);
  assert.match(ui, /whitespace-pre-wrap break-words/);
  assert.match(ui, /border-s-primary/);
  // Unread tickets have an emphasized start border, but read tickets retain
  // a complete neutral four-sided border in both RTL and LTR layouts.
  assert.match(ui, /border-s-\[3px\] border-s-primary/);
  assert.match(ui, /: "border-border bg-card"/);
  assert.doesNotMatch(ui, /border-s-transparent/);
  // Staff content uses the same shared card class as the Account pages.
  assert.match(ui, /staff \? accountCardClass : "app-card space-y-5 p-3\.5 sm:p-6 lg:p-7"/);
  assert.match(ui, /Unread on this page/);
  const help = readFileSync("features/account/components/help-center.tsx", "utf8");
  assert.ok(help.indexOf("<SupportTicketForm />") < help.indexOf("<SupportWorkspace />"));
  assert.match(help, /Frequently asked questions/);
  assert.doesNotMatch(ui, /dangerouslySetInnerHTML/);
  const { translator } = loadTs("features/settings/lib/translation.ts");
  for (const key of [
    "Support workspace",
    "My support tickets",
    "Waiting for support",
    "Internal note",
    "Reopen ticket",
  ])
    assert.notEqual(translator("fa")(key), key);
  const { isPrivatePath } = loadTs("features/authentication/lib/redirects.ts");
  assert.ok(isPrivatePath("/admin/support"));
});
