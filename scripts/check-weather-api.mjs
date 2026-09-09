import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { loadTs, root } from "../features/weather/tests/helpers/load-ts.mjs";

// Run explicitly; normal unit tests never consume provider quota.
nextEnv.loadEnvConfig(root);
const options = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")));
const coordinates = { latitude: Number(options.latitude ?? 36.27), longitude: Number(options.longitude ?? 50.01) };
assert.ok(Number.isFinite(coordinates.latitude) && Math.abs(coordinates.latitude) <= 90);
assert.ok(Number.isFinite(coordinates.longitude) && Math.abs(coordinates.longitude) <= 180);
const provider = options.provider ?? "auto";
assert.ok(["auto", "open-meteo", "weatherapi"].includes(provider), "Unknown provider");

try {
  let weather;
  if (provider === "weatherapi") {
    assert.ok(process.env.WEATHERAPI_API_KEY?.trim(), "Set WEATHERAPI_API_KEY in .env.local before checking WeatherAPI.");
    weather = await loadTs("features/weather/services/weatherapi-service.ts")
      .getWeatherApiWeather(coordinates, process.env.WEATHERAPI_API_KEY.trim());
  } else if (provider === "open-meteo") {
    weather = await loadTs("features/weather/services/open-meteo-service.ts").getOpenMeteoWeather(coordinates);
  } else {
    weather = await loadTs("features/weather/services/weather-server-service.ts").getFarmWeather(coordinates);
  }
  const { localWeatherTime, forecastDays } = loadTs("features/weather/lib/weather-presentation.ts");
  const { buildWeatherTimeline } = loadTs("features/weather/lib/build-weather-timeline.ts");
  const now = Date.now();
  const reportAgeMinutes = (now - Date.parse(weather.current.time)) / 60000;
  assert.ok(Number.isFinite(reportAgeMinutes) && reportAgeMinutes >= -15, "Invalid or future report timestamp");
  assert.equal(weather.current.source, weather.forecastSource, "Current and primary forecast providers differ");
  assert.ok(weather.hourly.length > 0 && forecastDays(weather, now).length > 0, "Forecast is empty or expired");
  for (const hour of weather.hourly) {
    assert.ok(Number.isFinite(hour.temperature), "Invalid hourly temperature");
    assert.ok(hour.precipitation === null || (Number.isFinite(hour.precipitation) && hour.precipitation >= 0), "Invalid hourly rain");
    const day = weather.daily.find((entry) => entry.date === hour.time.slice(0, 10));
    assert.ok(day, "Hourly sample has no matching forecast day");
    assert.equal(hour.source ?? weather.forecastSource, day.source ?? weather.forecastSource, "Daily and hourly providers differ");
    assert.ok(Number.isFinite(hour.timeEpoch), "Hourly absolute time is missing");
  }
  assert.equal(buildWeatherTimeline(weather, now)[0].temperature, weather.current.temperature);
  const today = weather.daily.find((day) => day.date === localWeatherTime(weather.timezone, now).slice(0, 10));
  assert.ok(today && Number.isFinite(today.precipitationSum) && today.precipitationSum >= 0, "Invalid daily rain total");
  console.log(JSON.stringify({
    result: "passed", provider: weather.forecastSource, status: weather.currentStatus, timezone: weather.timezone,
    reportedAt: weather.current.time, reportAgeMinutes: Math.round(reportAgeMinutes),
    stale: reportAgeMinutes > 30, forecastDays: forecastDays(weather, now).length, hourlySamples: weather.hourly.length,
    daysBySource: forecastDays(weather, now).map((day) => ({ date: day.date, source: day.source ?? weather.forecastSource })),
    extensionStatus: weather.forecastExtensionStatus ?? "not-needed",
    currentTemperatureC: weather.current.temperature, todayForecastMm: today.precipitationSum,
    currentReportedMm: weather.current.precipitation, currentIntervalSeconds: weather.current.intervalSeconds,
    note: "Validates the live provider contract, not accuracy against a rain gauge. Daily forecast and current accumulation are distinct.",
  }, null, 2));
} catch (error) {
  // Never print upstream URLs, response bodies or credentials.
  console.error(provider === "weatherapi" && !process.env.WEATHERAPI_API_KEY?.trim()
    ? "WeatherAPI check blocked: WEATHERAPI_API_KEY is not configured."
    : `Live ${provider} check failed (${error instanceof assert.AssertionError ? "contract mismatch" : "provider/network unavailable"}).`);
  process.exitCode = 1;
}
