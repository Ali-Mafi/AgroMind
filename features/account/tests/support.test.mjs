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
  for (const extra of [
    { userId: randomUUID() },
    { role: "admin" },
    { priority: "high" },
    { subject: "x" },
    { body: "x".repeat(4001) },
    { category: "invented" },
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
                name === "support_email_jobs"
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
                  : null,
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
    assert.equal(calls[1].args.p_sent, false);
    assert.equal(calls[1].args.p_id, "job");
  } finally {
    for (const n of names) {
      if (before[n] === undefined) delete process.env[n];
      else process.env[n] = before[n];
    }
  }
});
test("support UI uses accessible responsive controls and text-only rendering", () => {
  const ui = readFileSync("features/support/components/workspace.tsx", "utf8");
  assert.match(ui, /sm:grid-cols-2/);
  assert.match(ui, /min-h-11/);
  assert.match(ui, /role="alert"/);
  assert.match(ui, /role="status"/);
  assert.match(ui, /whitespace-pre-wrap break-words/);
  assert.match(ui, /border-s-primary/);
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
