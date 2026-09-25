import { localizedRenderer } from "../../../settings/tests/helpers/render.mjs";
import { localRequire } from "../../../weather/tests/helpers/load-ts.mjs";
const React = localRequire("react");
export function workspaceFixture({
  language = "en",
  page = "dashboard",
  empty = false,
  garden = false,
  canCreateFarm = true,
  coordinates = true,
  scheduled = true,
} = {}) {
  const ui = localizedRenderer({ language });
  const farms = empty
    ? []
    : [
        {
          id: "fixture-farm",
          name: language === "fa" ? "مزرعهٔ سبز" : "Greenfield Farm",
          location: language === "fa" ? "قزوین، ایران" : "Qazvin, Iran",
          area: 40000,
          type: garden ? "garden" : "farm",
          crop: { id: "corn", name: language === "fa" ? "ذرت" : "Corn" },
          coordinates: coordinates ? { latitude: 36.27, longitude: 50 } : undefined,
          irrigationType: "flood",
          plants: [
            {
              id: "p1",
              name: language === "fa" ? "سیب" : "Apple",
              quantity: 24,
              spacing: 4,
              age: 3,
            },
          ],
          access: {
            accountId: "00000000-0000-4000-8000-000000000001",
            farmId: "fixture-farm",
            workspaceKey:
              "00000000-0000-4000-8000-000000000001:fixture-farm",
            role: "owner",
            owned: true,
            canEditFarm: true,
            canDeleteFarm: true,
            canManageIrrigation: true,
          },
        },
      ];
  const cloud = {
    user: {
      id: "fixture-user",
      email: "farmer@example.test",
      verified: true,
      createdAt: "2026-09-01T12:00:00Z",
    },
    profile: {
      full_name: language === "fa" ? "کشاورز نمونه" : "Alex Farmer",
      onboarding_completed: true,
      country_code: "IR",
      language,
      timezone: "Asia/Tehran",
    },
    account: {
      id: "00000000-0000-4000-8000-000000000001",
      farm_count: farms.length,
    },
    plan: { name: "Free" },
    subscription: {
      status: "active",
      starts_at: "2026-09-01T12:00:00Z",
      ends_at: null,
    },
    entitlements: { max_farms: 3, max_sensors: 5, ai_requests_per_month: 50 },
    farms,
  };
  const state = {
    farms,
    selectedFarmId: farms[0]?.id,
    irrigationSchedules: scheduled ? {
      "fixture-farm": { date: "2026-09-23", time: "06:30", duration: 45 },
    } : {},
    cloud,
    farmLimit: 3,
    canCreateFarm,
    busy: false,
    farmRole: (id) => farms.find((farm) => farm.id === id)?.access?.role,
    canEditFarm: (id) =>
      farms.find((farm) => farm.id === id)?.access?.canEditFarm ?? false,
    canDeleteFarm: (id) =>
      farms.find((farm) => farm.id === id)?.access?.canDeleteFarm ?? false,
    canManageIrrigation: (id) =>
      farms.find((farm) => farm.id === id)?.access?.canManageIrrigation ??
      false,
    setSelectedFarmId() {},
    run: async () => true,
    updateFarm: async () => true,
    deleteFarm: async () => true,
    setIrrigationSchedule: async () => true,
    deleteIrrigationSchedule: async () => true,
  };
  const weather = {
    timezone: "Asia/Tehran",
    currentStatus: "primary",
    current: {
      time: "2026-09-21T12:00:00Z",
      source: "weatherapi",
      temperature: 26,
      windSpeed: 12,
      condition: { condition: "clear", label: "Clear sky" },
      isDay: true,
    },
    daily: [{ date: "2026-09-21", precipitationSum: 0 }],
  };
  const route =
    page === "farm"
      ? "/farms/fixture-farm"
      : page === "security"
        ? "/account/security"
        : page === "new"
          ? "/farms/new"
          : page === "edit"
            ? "/farms/fixture-farm/edit"
            : "/" + page;
  const mocks = {
    "next/navigation": {
      usePathname: () => route,
      useParams: () => ({ id: "fixture-farm" }),
      useSearchParams: () => new URLSearchParams("farm=fixture-farm"),
      useRouter: () => ({ back() {}, replace() {}, push() {}, refresh() {} }),
    },
    "@/features/farms/context/farm-context": { useFarm: () => state },
    "../context/farm-context": { useFarm: () => state },
    "@/features/weather/components/hooks/use-weather": {
      useWeather: () => ({
        weather,
        checkedAt: Date.parse("2026-09-21T12:00:00Z"),
        isLoading: false,
        isRefreshing: false,
        error: null,
        refreshError: null,
        refresh() {},
      }),
    },
  };
  const routes = {
    help: ["features/account/components/account-information.tsx", "AccountInformation"],
    about: ["features/account/components/account-information.tsx", "AccountInformation"],
    dashboard: [
      "features/dashboard/components/dashboard-overview/index.tsx",
      "DashboardOverview",
    ],
    farms: ["app/farms/page.tsx", "default"],
    farm: ["features/farms/components/farm-detail.tsx", "FarmDetail"],
    assistant: [
      "features/assistant/components/assistant-workspace.tsx",
      "AssistantWorkspace",
    ],
    account: [
      "features/account/components/account-overview.tsx",
      "AccountOverview",
    ],
    security: [
      "features/account/components/security-center.tsx",
      "SecurityCenter",
    ],
    settings: [
      "features/settings/components/settings-panel.tsx",
      "SettingsPanel",
    ],
    new: ["app/farms/new/page.tsx", "default"],
    edit: ["app/farms/[id]/edit/page.tsx", "default"],
  };
  const [path, name] = routes[page];
  const Component = ui.load(path, mocks)[name];
  const { AppShell } = ui.load("components/layout/app-shell.tsx", mocks);
  const props =
    page === "help" || page === "about" ? { kind: page } :
    page === "farm"
      ? { id: "fixture-farm" }
      : page === "security"
        ? {
            initialState: {
              enabled: true,
              currentLevel: "aal2",
              nextLevel: "aal2",
              currentSession: { createdAt: "2026-09-21T12:00:00Z" },
              factors: [
                { id: "fixture-a", friendlyName: "Primary" },
                { id: "fixture-b", friendlyName: "Backup" },
              ],
              recoveryCodes: {
                available: false,
                enabled: false,
                total: 0,
                remaining: 0,
              },
            },
          }
        : {};
  return ui.renderToStaticMarkup(
    React.createElement(AppShell, null, React.createElement(Component, props)),
  );
}
