import test from "node:test";
import assert from "node:assert/strict";
import { localizedRenderer } from "../../settings/tests/helpers/render.mjs";
import { loadTs, localRequire } from "../../weather/tests/helpers/load-ts.mjs";

const React = localRequire("react");

const farm = {
  id: "farm-a",
  name: "North Farm",
  location: "Qazvin",
  area: 10,
  type: "farm",
  access: {
    accountId: "00000000-0000-4000-8000-000000000001",
    farmId: "farm-a",
    workspaceKey: "00000000-0000-4000-8000-000000000001:farm-a",
    role: "owner",
    owned: true,
    canEditFarm: true,
    canDeleteFarm: true,
    canManageIrrigation: true,
  },
};

function cloud(language, limit = 3) {
  return {
    user: {
      id: "user-a",
      email: "owner@example.test",
      verified: true,
      createdAt: "2026-09-26T00:00:00Z",
    },
    profile: {
      first_name: "Owner",
      last_name: "Farmer",
      full_name: "Owner Farmer",
      country_code: "IR",
      language,
      timezone: "Asia/Tehran",
      onboarding_completed: true,
      onboarding_step: 5,
    },
    account: {
      id: "00000000-0000-4000-8000-000000000001",
      farm_count: 1,
    },
    plan: { name: "Team" },
    subscription: {
      status: "active",
      starts_at: "2026-09-26T00:00:00Z",
      ends_at: null,
    },
    entitlements: {
      max_farms: 3,
      max_team_members: limit,
    },
    farms: [farm],
    irrigationSchedules: {},
    migration: null,
  };
}

const overview = {
  activeSeats: 1,
  pendingSeats: 1,
  members: [
    {
      userId: "00000000-0000-4000-8000-000000000002",
      email: "worker@example.test",
      displayName: "Field Worker",
      farmId: "farm-a",
      farmName: "North Farm",
      role: "worker",
      createdAt: "2026-09-26T00:00:00Z",
    },
  ],
  invitations: [
    {
      id: "00000000-0000-4000-8000-000000000003",
      email: "viewer@example.test",
      farmId: "farm-a",
      farmName: "North Farm",
      role: "viewer",
      expiresAt: "2026-10-03T00:00:00Z",
      createdAt: "2026-09-26T00:00:00Z",
    },
  ],
};

for (const language of ["en", "fa"]) {
  test(`${language}: team management shows seat usage, active access and pending invitations`, () => {
    const ui = localizedRenderer({ language });
    const actions = {
      inviteFarmMemberAction: async () => ({ ok: true, data: overview }),
      changeFarmMemberRoleAction: async () => ({ ok: true, data: overview }),
      removeFarmMemberAction: async () => ({ ok: true, data: overview }),
      resendFarmInvitationAction: async () => ({ ok: true, data: overview }),
      revokeFarmInvitationAction: async () => ({ ok: true, data: overview }),
    };
    const { TeamManagement } = ui.load(
      "features/collaboration/components/team-management.tsx",
      {
        "@/features/farms/context/farm-context": {
          useFarm: () => ({ cloud: cloud(language) }),
        },
        "../services/actions": actions,
      },
    );
    const html = ui.renderToStaticMarkup(
      React.createElement(TeamManagement, { initialOverview: overview }),
    );

    assert.match(html, /owner@example\.test|Field Worker/);
    assert.match(html, /worker@example\.test/);
    assert.match(html, /viewer@example\.test/);
    assert.match(html, /North Farm/);
    assert.match(html, /2 \/ 3|۲ \/ ۳/);
    assert.match(html, /type="email"/);
    assert.match(html, /value="worker"/);
    assert.match(html, /value="viewer"/);
    assert.match(
      html,
      language === "fa" ? /دعوت‌نامه‌های در انتظار/ : /Pending invitations/,
    );
    assert.match(
      html,
      language === "fa" ? /ارسال دوباره دعوت‌نامه/ : /Resend invitation/,
    );
  });

  test(`${language}: zero team seats replaces the invite form with subscription guidance`, () => {
    const ui = localizedRenderer({ language });
    const { TeamManagement } = ui.load(
      "features/collaboration/components/team-management.tsx",
      {
        "@/features/farms/context/farm-context": {
          useFarm: () => ({ cloud: cloud(language, 0) }),
        },
        "../services/actions": {
          inviteFarmMemberAction: async () => ({ ok: true, data: overview }),
          changeFarmMemberRoleAction: async () => ({ ok: true, data: overview }),
          removeFarmMemberAction: async () => ({ ok: true, data: overview }),
          resendFarmInvitationAction: async () => ({ ok: true, data: overview }),
          revokeFarmInvitationAction: async () => ({ ok: true, data: overview }),
        },
      },
    );
    const html = ui.renderToStaticMarkup(
      React.createElement(TeamManagement, {
        initialOverview: {
          activeSeats: 0,
          pendingSeats: 0,
          members: [],
          invitations: [],
        },
      }),
    );
    assert.match(html, /href="\/account\/subscription"/);
    assert.doesNotMatch(html, /type="email"/);
  });
}

test("farm invitation email escapes farm names and never embeds raw HTML", () => {
  const { renderFarmInvitationEmail } = loadTs(
    "features/collaboration/emails/templates.ts",
  );
  const rendered = renderFarmInvitationEmail({
    href: "https://agromind.ir/invite/AbCd_123-xyz",
    farmName: '<script>alert("x")</script>',
    role: "viewer",
    language: "en",
  });

  assert.doesNotMatch(rendered.html, /<script>/);
  assert.match(rendered.html, /&lt;script&gt;/);
  assert.match(rendered.html, /https:\/\/agromind\.ir\/invite\/AbCd_123-xyz/);
  assert.match(rendered.text, /<script>alert\("x"\)<\/script>/);
});


function collaborationActionHarness({ emailFails = false } = {}) {
  const calls = [];
  const invitationId = "00000000-0000-4000-8000-000000000003";
  const client = {
    rpc: async (name, args) => {
      calls.push({ name: "rpc", rpc: name, args });
      if (name === "resend_farm_invitation") {
        return {
          data: {
            id: invitationId,
            email: "viewer@example.test",
            farm_name: "North Farm",
            role: "viewer",
            expires_at: "2026-10-03T00:00:00Z",
          },
          error: null,
        };
      }
      if (name === "revoke_farm_invitation")
        return { data: null, error: null };
      return { data: null, error: null };
    },
    from: (table) => {
      assert.equal(table, "profiles");
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { language: "en" },
              error: null,
            }),
          }),
        }),
      };
    },
  };

  const actions = loadTs(
    "features/collaboration/services/actions.ts",
    {
      "next/cache": {
        revalidatePath: (...args) =>
          calls.push({ name: "revalidatePath", args }),
      },
      "@/lib/supabase/server": {
        createClient: async () => client,
      },
      "@/features/authentication/services/session": {
        requireUser: async () => ({
          id: "user-a",
          email: "owner@example.test",
        }),
        authenticatedDestination: async () => "/dashboard",
      },
      "@/features/authentication/services/resend-auth": {
        sendAuthEmail: async (message) => {
          calls.push({ name: "email", message });
          if (emailFails) throw new Error("provider failed");
        },
      },
      "@/features/cloud/services/data": {
        mutationContext: async () => {
          throw new Error("unused");
        },
      },
      "../emails/templates": {
        renderFarmInvitationEmail: ({ href, farmName, role }) => ({
          subject: "Farm invitation",
          html: `<a href="${href}">${farmName}:${role}</a>`,
          text: `${farmName}:${role}:${href}`,
        }),
      },
      "./data": {
        readTeamOverview: async () => overview,
      },
      "./origin": {
        collaborationRequestOrigin: async () => "https://agromind.ir",
      },
    },
  );

  return { actions, calls, invitationId };
}

test("resend action rotates the pending invite and delivers a fresh Resend email", async () => {
  const h = collaborationActionHarness();
  const result = await h.actions.resendFarmInvitationAction(
    { invitationId: h.invitationId },
    "user-a",
  );

  assert.equal(result.ok, true);
  const resend = h.calls.find(
    (call) => call.name === "rpc" && call.rpc === "resend_farm_invitation",
  );
  assert.equal(resend.args.p_invitation_id, h.invitationId);
  assert.match(resend.args.p_token_hash, /^[0-9a-f]{64}$/);

  const email = h.calls.find((call) => call.name === "email").message;
  assert.equal(email.to, "viewer@example.test");
  assert.match(email.text, /North Farm:viewer:https:\/\/agromind\.ir\/invite\//);
  assert.match(
    email.idempotencyKey,
    new RegExp(`^agromind-team-resend/${h.invitationId}/[0-9a-f]{20}$`),
  );
  assert.equal(
    h.calls.some(
      (call) => call.name === "rpc" && call.rpc === "revoke_farm_invitation",
    ),
    false,
  );
});

test("resend delivery failure revokes the rotated invite instead of leaving a dead link", async () => {
  const h = collaborationActionHarness({ emailFails: true });
  const result = await h.actions.resendFarmInvitationAction(
    { invitationId: h.invitationId },
    "user-a",
  );

  assert.equal(result.ok, false);
  assert.match(result.error, /could not be sent/i);
  assert.equal(
    h.calls.some(
      (call) =>
        call.name === "rpc" &&
        call.rpc === "revoke_farm_invitation" &&
        call.args.p_invitation_id === h.invitationId,
    ),
    true,
  );
});
