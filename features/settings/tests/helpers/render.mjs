import { loadTs, localRequire } from "../../../weather/tests/helpers/load-ts.mjs";

export function localizedRenderer(overrides = {}) {
  const cache = new Map();
  const load = (path, mocks = {}) => loadTs(path, mocks, cache);
  const React = localRequire("react");
  const server = localRequire("react-dom/server");
  const { SettingsProvider } = load("features/settings/context/settings-context.tsx");
  const { DEFAULT_PREFERENCES } = load("features/settings/lib/preferences.ts");
  const initialPreferences = { ...DEFAULT_PREFERENCES, country: "IR", language: "en", calendar: "gregory", numbering: "latn", regionConfirmed: true, ...overrides };
  return { load, renderToStaticMarkup: (element) => server.renderToStaticMarkup(React.createElement(SettingsProvider, { initialPreferences }, element)) };
}
