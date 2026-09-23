import test from "node:test";
import assert from "node:assert/strict";
import { localizedRenderer } from "../../settings/tests/helpers/render.mjs";
import { localRequire } from "../../weather/tests/helpers/load-ts.mjs";
const React = localRequire("react");
for (const language of ["en", "fa"])
  test(
    language +
      ": account and subscription render supplied cloud values; email stays read only",
    () => {
      const { load, renderToStaticMarkup: render } = localizedRenderer({
        language,
      });
      const cloud = {
        user: {
          id: "user-a",
          email: "farmer@example.test",
          verified: true,
          createdAt: "2026-09-13T00:00:00Z",
        },
        profile: {
          first_name: "Cloud",
          last_name: "Farmer",
          full_name: "Cloud Farmer",
          country_code: "IR",
          language,
          timezone: "Asia/Tehran",
          onboarding_completed: false,
          onboarding_step: 5,
        },
        account: { farm_count: 2 },
        plan: { name: "Research access" },
        subscription: {
          status: "active",
          starts_at: "2026-09-13T00:00:00Z",
          ends_at: null,
        },
        entitlements: {
          max_farms: 8,
          max_sensors: 5,
          ai_requests_per_month: 50,
        },
        farms: [],
      };
      const mocks = {
        "@/features/farms/context/farm-context": {
          useFarm: () => ({
            cloud,
            farmLimit: 8,
            run: async () => true,
            busy: false,
          }),
        },
        "next/navigation": {
          usePathname: () => "/account",
          useRouter: () => ({ replace: () => {}, refresh: () => {} }),
        },
      };
      const { AccountOverview } = load(
        "features/account/components/account-overview.tsx",
        mocks,
      );
      const overview = render(React.createElement(AccountOverview));
      assert.match(overview, /Cloud Farmer/);
      assert.match(overview, /Research access/);
      assert.match(overview, language === "fa" ? /۲ \/ ۸/ : /2 \/ 8/);
      assert.match(overview, /href="\/onboarding"/);
      const { SubscriptionOverview } = load(
        "features/account/components/subscription-overview.tsx",
        mocks,
      );
      const subscription = render(React.createElement(SubscriptionOverview));
      assert.match(subscription, /Research access/);
      assert.match(subscription, />50</);
      const { ProfileForm } = load(
        "features/account/components/profile-form.tsx",
        mocks,
      );
      const profile = render(React.createElement(ProfileForm));
      assert.match(profile, /farmer@example.test/);
      assert.doesNotMatch(profile, /type="email"|name="email"/);
      const { Onboarding } = load(
        "features/account/components/onboarding.tsx",
        mocks,
      );
      const onboarding = render(React.createElement(Onboarding));
      assert.match(onboarding, /href="\/farms\/new"/);
      assert.ok(
        onboarding.includes(
          language === "fa" ? "اولین مزرعه" : "Your first farm",
        ),
      );
    },
  );
