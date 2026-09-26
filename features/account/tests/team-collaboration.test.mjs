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
