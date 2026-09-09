import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTs, localRequire } from "./helpers/load-ts.mjs";

const coordinates = { latitude: 36.27, longitude: 50.01 };
const reportEpoch = Date.parse("2026-09-07T07:15:00Z") / 1000;
function payload() {
  return {
    location: { tz_id: "Asia/Tehran" },
    current: {
      last_updated_epoch: reportEpoch, temp_c: 22, feelslike_c: 24,
      humidity: 97, precip_mm: 0.9, condition: { code: 1276, text: "Moderate or heavy rain with thunder" },
      is_day: 1, cloud: 95, pressure_mb: 1014, vis_km: 5,
      wind_kph: 16, wind_degree: 202, gust_kph: 19,
    },
  };
}
const { parseWeatherApiCurrent, parseWeatherApiForecast } = loadTs("features/weather/services/weatherapi-service.ts");
function forecastPayload() {
  const data = payload();
  return {
    ...data,
    forecast: { forecastday: ["2026-09-07", "2026-09-08", "2026-09-09"].map((date) => ({
      date,
      day: { maxtemp_c: 29, mintemp_c: 20, maxwind_kph: 25, totalprecip_mm: 21, totalsnow_cm: 0,
        daily_chance_of_rain: "80", daily_chance_of_snow: "0", uv: 5,
        condition: { code: 1189, text: "Moderate rain" } },
      astro: { sunrise: "06:15 AM", sunset: "07:20 PM" },
      hour: Array.from({ length: 24 }, (_, hour) => {
        const time = `${date} ${String(hour).padStart(2, "0")}:00`;
        return { ...data.current, time, time_epoch: Date.parse(time.replace(" ", "T") + ":00+03:30") / 1000,
          temp_c: hour === 10 ? 28 : 25, feelslike_c: 29, wind_kph: 19, is_day: hour >= 6 && hour < 20 ? 1 : 0,
          chance_of_rain: "65", chance_of_snow: "0", snow_cm: 0,
          condition: { code: 1003, text: "Partly cloudy" } };
      }),
    })) },
  };
}
function modelWeather() {
  return {
    coordinates, timezone: "Asia/Tehran", timezoneAbbreviation: "GMT+3:30", utcOffsetSeconds: 12600, elevation: 1200,
    currentStatus: "model-only", forecastSource: "open-meteo", forecastStatus: "available",
    current: { ...parseWeatherApiCurrent(payload()).current, source: "open-meteo", intervalSeconds: 900 },
    hourly: [],
    daily: [{ date: "2026-09-07", condition: { code: 95, condition: "thunderstorm", label: "Thunderstorm" }, temperatureMax: 27, temperatureMin: 20,
      precipitationSum: 21, precipitationProbability: 80, precipitationProbabilityKind: "precipitation" }],
  };
}
function setKey(t, key) {
  const previous = process.env.WEATHERAPI_API_KEY;
  if (key === undefined) delete process.env.WEATHERAPI_API_KEY;
  else process.env.WEATHERAPI_API_KEY = key;
  t.after(() => {
    if (previous === undefined) delete process.env.WEATHERAPI_API_KEY;
    else process.env.WEATHERAPI_API_KEY = previous;
  });
}
function aggregator(model, report) {
  return loadTs("features/weather/services/weather-server-service.ts", {
    "./open-meteo-service": { getOpenMeteoWeather: model },
    "./weatherapi-service": { getWeatherApiWeather: report },
  }).getFarmWeather;
}

function tenDayModel() {
  const sample = parseWeatherApiForecast(forecastPayload(), coordinates);
  const dates = Array.from({ length: 10 }, (_, index) => `2026-09-${String(7 + index).padStart(2, "0")}`);
  return {
    ...modelWeather(),
    daily: dates.map((date) => ({ ...sample.daily[0], date, source: "open-meteo", precipitationSum: 0.4,
      sunrise: `${date}T06:00`, sunset: `${date}T19:00`, temperatureMin: 12, temperatureMax: 23 })),
    hourly: dates.flatMap((date) => sample.hourly.slice(0, 24).map((hour) => ({ ...hour,
      time: `${date}${hour.time.slice(10)}`, source: "open-meteo", temperature: 17, precipitation: 0.2,
      timeEpoch: Date.parse(`${date}${hour.time.slice(10)}:00+03:30`) / 1000 }))),
  };
}

test("ten-day forecast keeps the first three WeatherAPI days and extends seven complete Open-Meteo days", async (t) => {
  setKey(t, "test-key-only");
  t.mock.method(Date, "now", () => reportEpoch * 1000);
  const primary = parseWeatherApiForecast(forecastPayload(), coordinates);
  const model = tenDayModel();
  const original = structuredClone(primary);
  let calls = 0;
  const weather = await aggregator(async (coords, options) => {
    calls++; assert.deepEqual(coords, coordinates);
    assert.equal(options.timezone, "Asia/Tehran");
    assert.equal(options.forecastExtension, true);
    return model;
  }, async () => primary)(coordinates);
  assert.equal(calls, 1);
  assert.deepEqual(primary, original);
  assert.equal(weather.current, primary.current);
  assert.equal(weather.forecastExtensionStatus, "available");
  assert.equal(weather.daily.length, 10);
  assert.equal(weather.hourly.length, 240);
  assert.equal(new Set(weather.daily.map((day) => day.date)).size, 10);
  assert.deepEqual(weather.daily.slice(0, 3), primary.daily);
  assert.deepEqual(weather.daily.slice(3), model.daily.slice(3));
  assert.deepEqual(weather.hourly.slice(0, 72), primary.hourly);
  assert.deepEqual(weather.hourly.slice(72), model.hourly.slice(72));
  for (const day of weather.daily) {
    const hours = weather.hourly.filter((hour) => hour.time.startsWith(day.date));
    assert.equal(hours.length, 24);
    assert.ok(hours.every((hour) => hour.source === day.source));
  }
  const { buildWeatherTimeline } = loadTs("features/weather/lib/build-weather-timeline.ts");
  assert.equal(buildWeatherTimeline(weather, reportEpoch * 1000)[0].temperature, primary.current.temperature);
});

test("extension failure retains a usable primary report; a paid ten-day response needs no second provider", async (t) => {
  setKey(t, "test-key-only");
  t.mock.method(Date, "now", () => reportEpoch * 1000);
  const primary = parseWeatherApiForecast(forecastPayload(), coordinates);
  const partial = await aggregator(async () => { throw new Error("private upstream failure"); }, async () => primary)(coordinates);
  assert.equal(partial.current, primary.current);
  assert.equal(partial.currentStatus, "primary");
  assert.deepEqual(partial.daily, primary.daily);
  assert.equal(partial.forecastExtensionStatus, "unavailable");
  assert.ok(!JSON.stringify(partial).includes("private upstream"));
  const paid = { ...primary, daily: tenDayModel().daily.map((day) => ({ ...day, source: "weatherapi" })) };
  let calls = 0;
  const complete = await aggregator(async () => { calls++; }, async () => paid)(coordinates);
  assert.equal(calls, 0); assert.equal(complete.daily.length, 10);
  assert.equal(complete.forecastExtensionStatus, undefined);
});

test("hybrid dates use the farm calendar at midnight, reject a different timezone and never pad gaps", () => {
  const { extendWeatherForecast, forecastDateWindow } = loadTs("features/weather/lib/extend-weather-forecast.ts");
  const primary = parseWeatherApiForecast(forecastPayload(), coordinates);
  const model = tenDayModel();
  const midnight = Date.parse("2026-09-07T20:30:00Z"); // September 8 in Qazvin.
  const dates = forecastDateWindow(primary.timezone, midnight);
  assert.equal(dates[0], "2026-09-08"); assert.equal(dates[9], "2026-09-17");
  const afterMidnight = extendWeatherForecast(primary, model, midnight);
  assert.equal(afterMidnight.daily[0].date, "2026-09-08");
  assert.equal(afterMidnight.daily.length, 9); // September 17 is not in this fixture.
  assert.equal(afterMidnight.forecastExtensionStatus, "unavailable");
  assert.ok(afterMidnight.hourly.every((hour) => hour.time >= "2026-09-08"));
  const wrongZone = extendWeatherForecast(primary, { ...model, timezone: "UTC" }, reportEpoch * 1000);
  assert.deepEqual(wrongZone.daily, primary.daily);
  const withGap = { ...model, daily: model.daily.filter((day) => day.date !== "2026-09-12") };
  const gap = extendWeatherForecast(primary, withGap, reportEpoch * 1000);
  assert.equal(gap.daily.length, 9);
  assert.ok(!gap.hourly.some((hour) => hour.time.startsWith("2026-09-12")));
});

test("an overnight provider boundary retains absolute hourly spacing and a visible break in the chart", () => {
  const { extendWeatherForecast } = loadTs("features/weather/lib/extend-weather-forecast.ts");
  const { nightForecast, weatherChartPoints } = loadTs("features/weather/lib/weather-presentation.ts");
  const { linePath } = loadTs("features/weather/lib/weather-chart.ts");
  const weather = extendWeatherForecast(parseWeatherApiForecast(forecastPayload(), coordinates), tenDayModel(), reportEpoch * 1000);
  const hours = nightForecast(weather, reportEpoch * 1000, "2026-09-09");
  assert.equal(hours[0].time, "2026-09-09T20:00");
  assert.equal(hours.at(-1).time, "2026-09-10T05:00");
  const points = weatherChartPoints(hours, "overnight");
  points.slice(1).forEach((point, index) => assert.equal(point.position - points[index].position, 3600));
  assert.equal(points[3].source, "weatherapi"); assert.equal(points[4].source, "open-meteo");
  assert.equal(linePath(points, "value", (index) => index, (value) => value).match(/M/g).length, 2);
});

test("extended daily rows and detail charts identify the actual provider and rainfall period", () => {
  const React = localRequire("react");
  const { renderToStaticMarkup } = localRequire("react-dom/server");
  const { extendWeatherForecast } = loadTs("features/weather/lib/extend-weather-forecast.ts");
  const { WeatherForecastOverview } = loadTs("features/weather/components/weather-forecast-overview/index.tsx");
  const { WeatherDetail } = loadTs("features/weather/components/weather-detail/index.tsx");
  const weather = extendWeatherForecast(parseWeatherApiForecast(forecastPayload(), coordinates), tenDayModel(), reportEpoch * 1000);
  const render = (component, props) => renderToStaticMarkup(React.createElement(component, props)).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  const overview = render(WeatherForecastOverview, { weather, asOf: reportEpoch * 1000, onOpen() {} });
  assert.match(overview, /10-day forecast/); assert.match(overview, /WeatherAPI \+ Open-Meteo/);
  const detail = (date, metric = "precipitation") => render(WeatherDetail, {
    weather, asOf: reportEpoch * 1000, selection: { date, metric }, onSelection() {},
  });
  assert.match(detail("2026-09-07"), /Full-day forecast · 2026-09-07.*21\.0 mm/);
  assert.doesNotMatch(detail("2026-09-07"), /preceding hour/);
  assert.match(detail("2026-09-10"), /Full-day forecast · 2026-09-10.*0\.4 mm/);
  assert.match(detail("2026-09-10"), /Hourly forecast · Open-Meteo/);
  assert.match(detail("2026-09-10"), /preceding hour/);
  assert.match(detail("2026-09-09", "overnight"), /night spans two forecast providers/);
});

test("Open-Meteo Unix hours retain DST instants and extension caching changes at local midnight", async (t) => {
  const time = [Date.parse("2026-11-01T05:00Z") / 1000, Date.parse("2026-11-01T06:00Z") / 1000];
  const hourFields = ["temperature_2m", "apparent_temperature", "relative_humidity_2m", "dew_point_2m", "precipitation_probability", "precipitation", "rain", "showers", "snowfall", "weather_code", "is_day", "cloud_cover", "visibility", "pressure_msl", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"];
  const dayFields = ["temperature_2m_max", "temperature_2m_min", "apparent_temperature_max", "apparent_temperature_min", "precipitation_probability_max", "precipitation_sum", "rain_sum", "showers_sum", "snowfall_sum", "weather_code", "wind_speed_10m_max", "wind_gusts_10m_max", "wind_direction_10m_dominant", "uv_index_max"];
  const raw = {
    timezone: "America/New_York", timezone_abbreviation: "EDT", utc_offset_seconds: -14400, elevation: 10,
    current: { time: time[0], interval: 900, temperature_2m: 22, apparent_temperature: 24, relative_humidity_2m: 80,
      weather_code: 61, pressure_msl: 1014, wind_speed_10m: 10, wind_direction_10m: 180, wind_gusts_10m: 20 },
    hourly: { ...Object.fromEntries(hourFields.map((field) => [field, [1, 2]])), time },
    daily: { ...Object.fromEntries(dayFields.map((field) => [field, [1]])), time: [Date.parse("2026-11-01T04:00Z") / 1000],
      sunrise: [Date.parse("2026-11-01T11:30Z") / 1000], sunset: [Date.parse("2026-11-01T22:00Z") / 1000] },
  };
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => { requests.push({ url: new URL(url), options }); return Response.json(raw); });
  const { getOpenMeteoWeather } = loadTs("features/weather/services/open-meteo-service.ts");
  const weather = await getOpenMeteoWeather(coordinates, { forecastExtension: true, timezone: raw.timezone, asOf: time[0] * 1000 });
  assert.equal(weather.current.time, "2026-11-01T05:00:00.000Z");
  assert.deepEqual(weather.hourly.map((hour) => hour.time), ["2026-11-01T01:00", "2026-11-01T01:00"]);
  assert.deepEqual(weather.hourly.map((hour) => hour.timeEpoch), time);
  assert.equal(weather.daily[0].date, "2026-11-01");
  assert.equal(weather.daily[0].sunrise, "2026-11-01T06:30");
  assert.ok(weather.hourly.every((hour) => hour.source === "open-meteo"));
  assert.equal(requests[0].url.searchParams.get("timeformat"), "unixtime");
  assert.equal(requests[0].url.searchParams.get("timezone"), raw.timezone);
  assert.equal(requests[0].url.searchParams.get("start_date"), "2026-11-01");
  assert.equal(requests[0].url.searchParams.get("end_date"), "2026-11-10");
  assert.equal(requests[0].options.cache, "force-cache");
  assert.equal(requests[0].options.next.revalidate, 1800);
  await getOpenMeteoWeather(coordinates, { forecastExtension: true, timezone: raw.timezone, asOf: Date.parse("2026-11-02T05:00Z") });
  assert.equal(requests[1].url.searchParams.get("start_date"), "2026-11-02");
  await getOpenMeteoWeather(coordinates);
  assert.equal(requests[2].options.cache, "no-store");
  assert.equal(requests[2].options.next, undefined);
});

test("WeatherAPI preserves thunder, native label, report time, units and missing fields", () => {
  const { current } = parseWeatherApiCurrent(payload());
  assert.equal(current.condition.condition, "thunderstorm");
  assert.equal(current.condition.code, 1276);
  assert.equal(current.condition.label, payload().current.condition.text);
  assert.equal(current.condition.intensity, undefined);
  assert.equal(current.time, "2026-09-07T07:15:00.000Z");
  assert.equal(current.visibility, 5000);
  assert.equal(current.pressure, 1014);
  assert.equal(current.precipitation, 0.9);
  for (const key of ["intervalSeconds", "rain", "showers", "snowfall", "dewPoint", "surfacePressure", "precipitationProbability"]) {
    assert.equal(current[key], null, key);
  }
});

test("separate code systems preserve storm, heavy rain, dust and unknown conditions", () => {
  const { normalizeWeatherApiCondition: normalize } = loadTs("features/weather/lib/normalize-weatherapi.ts");
  for (const code of [1087, 1273, 1276, 1279, 1282]) assert.equal(normalize(code, "Provider label").condition, "thunderstorm");
  assert.equal(normalize(1087, "Thunder possible").isPrecipitation, false);
  assert.equal(normalize(1195, "Heavy rain").intensity, "heavy");
  assert.equal(normalize(1048, "Dust").condition, "dust");
  assert.equal(normalize(9999, "New condition").condition, "unknown");
  assert.equal(normalize(9999, "New condition").label, "New condition");
});

test("invalid and incomplete provider reports cannot turn missing measurements into zero", () => {
  for (const input of [null, {}, { error: {} }]) assert.throws(() => parseWeatherApiCurrent(input));
  for (const field of ["temp_c", "last_updated_epoch", "pressure_mb"]) {
    const data = payload(); data.current[field] = null;
    assert.throws(() => parseWeatherApiCurrent(data));
  }
  const data = payload(); data.location.tz_id = "invalid/timezone";
  assert.throws(() => parseWeatherApiCurrent(data));
});

test("WeatherAPI request uses exact coordinates on the server without cache", async (t) => {
  let request;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    request = { url: new URL(url), options };
    return Response.json(forecastPayload());
  });
  const { getWeatherApiWeather } = loadTs("features/weather/services/weatherapi-service.ts");
  const data = await getWeatherApiWeather(coordinates, "test-key-only");
  assert.equal(request.url.searchParams.get("q"), "36.27,50.01");
  assert.equal(request.url.pathname, "/v1/forecast.json");
  assert.equal(request.url.searchParams.get("days"), "3");
  assert.equal(request.options.cache, "no-store");
  assert.ok(request.options.signal instanceof AbortSignal);
  assert.ok(!JSON.stringify(data).includes("test-key-only"));
});

test("an incomplete extension keeps WeatherAPI current, hourly and daily readings intact", async (t) => {
  setKey(t, "test-key-only");
  t.mock.method(Date, "now", () => reportEpoch * 1000);
  const report = parseWeatherApiForecast(forecastPayload(), coordinates);
  let modelCalls = 0;
  const data = await aggregator(async () => { modelCalls++; return modelWeather(); }, async () => report)(coordinates);
  assert.equal(modelCalls, 1);
  assert.equal(data.current, report.current);
  assert.equal(data.forecastExtensionStatus, "unavailable");
  assert.equal(data.currentStatus, "primary");
  assert.equal(data.current.source, "weatherapi");
  assert.equal(data.forecastSource, "weatherapi");
  assert.equal(data.hourly.length, 72);
  assert.equal(data.daily.length, 3);
  assert.equal(data.daily[0].precipitationSum, 21);
  assert.equal(data.current.precipitation, 0.9);
  assert.equal(data.current.rain, null);
  assert.equal(data.hourly[0].condition.condition, "partly-cloudy");
  assert.equal(data.daily[0].condition.condition, "rain");
  assert.equal(data.daily[0].sunset, "2026-09-07T19:20");
});

test("absent API key uses an explicitly identified model without calling WeatherAPI", async (t) => {
  setKey(t, undefined);
  let called = false;
  const data = await aggregator(async () => modelWeather(), async () => { called = true; })(coordinates);
  assert.equal(called, false);
  assert.equal(data.currentStatus, "model-only");
  assert.equal(data.current.source, "open-meteo");
});

test("failed WeatherAPI request produces an explicit fallback without leaking errors", async (t) => {
  setKey(t, "test-key-only");
  const data = await aggregator(async () => modelWeather(), async () => { throw new Error("private upstream URL"); })(coordinates);
  assert.equal(data.currentStatus, "fallback");
  assert.ok(!JSON.stringify(data).includes("private upstream"));
});

test("incomplete WeatherAPI forecast switches the entire dataset to the fallback", async (t) => {
  setKey(t, "test-key-only");
  const data = await aggregator(async () => modelWeather(), async () => parseWeatherApiForecast(payload(), coordinates))(coordinates);
  assert.equal(data.current.source, "open-meteo");
  assert.equal(data.forecastSource, "open-meteo");
  assert.equal(data.currentStatus, "fallback");
  assert.equal(data.daily[0].condition.code, 95);
});

test("complete outage is an error instead of fabricated current weather", async (t) => {
  setKey(t, "test-key-only");
  const fail = async () => { throw new Error("private details"); };
  await assert.rejects(aggregator(fail, fail)(coordinates), { message: "Weather is unavailable." });
});

test("Open-Meteo wall-clock time uses the farm UTC offset and precipitation keeps its period", async (t) => {
  const raw = {
    timezone: "Asia/Tehran", timezone_abbreviation: "GMT+3:30", utc_offset_seconds: 12600, elevation: 1200,
    current: { time: "2026-09-07T10:45", interval: 900, temperature_2m: 22, apparent_temperature: 24,
      relative_humidity_2m: 97, precipitation: 0.9, weather_code: 95, is_day: 1,
      pressure_msl: 1014, wind_speed_10m: 16, wind_direction_10m: 202, wind_gusts_10m: 19 },
    hourly: { time: [] }, daily: { time: [] },
  };
  t.mock.method(globalThis, "fetch", async () => Response.json(raw));
  const data = await loadTs("features/weather/services/open-meteo-service.ts").getOpenMeteoWeather(coordinates);
  assert.equal(data.current.time, "2026-09-07T07:15:00.000Z");
  assert.equal(data.current.intervalSeconds, 900);
  assert.equal(data.current.condition.condition, "thunderstorm");
});

test("route rejects invalid coordinates, accepts zero and never returns raw upstream errors", async () => {
  let calls = 0;
  const { GET } = loadTs("app/api/weather/route.ts", {
    "@/features/weather/services/weather-server-service": { getFarmWeather: async (coords) => { calls++; return { coordinates: coords }; } },
  });
  const request = (query) => ({ nextUrl: new URL(`https://example.test/api/weather?${query}`) });
  for (const query of ["", "latitude=&longitude=2", "latitude=NaN&longitude=2", "latitude=91&longitude=0", "latitude=1&longitude=181"]) {
    assert.equal((await GET(request(query))).status, 400);
  }
  assert.equal(calls, 0);
  const response = await GET(request("latitude=0&longitude=0"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const failure = loadTs("app/api/weather/route.ts", {
    "@/features/weather/services/weather-server-service": { getFarmWeather: async () => { throw new Error("secret-key"); } },
  });
  const failed = await failure.GET(request("latitude=0&longitude=0"));
  assert.equal(failed.status, 502);
  assert.ok(!(await failed.text()).includes("secret-key"));
});

const flush = () => new Promise((resolve) => setImmediate(resolve));
function browser(t) {
  const cleanup = [];
  t.after(() => cleanup.forEach((dispose) => dispose()));
  const window = new EventTarget();
  const document = new EventTarget(); document.visibilityState = "visible";
  const navigator = { onLine: true };
  for (const [name, value] of Object.entries({ window, document, navigator })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => previous ? Object.defineProperty(globalThis, name, previous) : delete globalThis[name]);
  }
  t.mock.timers.enable({ apis: ["Date", "setTimeout", "setInterval"], now: reportEpoch * 1000 });
  return { window, document, navigator, addCleanup: (dispose) => cleanup.push(dispose) };
}
function subscription(getWeather, onChange) {
  const { subscribeToWeather } = loadTs("features/weather/lib/weather-refresh.ts", {
    "@/features/weather/services/weather-service": { getWeather },
  });
  return subscribeToWeather(coordinates, onChange);
}

test("polls at five minutes, skips hidden tabs and refreshes on return without focus bursts", async (t) => {
  const env = browser(t); let calls = 0;
  const sub = subscription(async () => { calls++; return modelWeather(); }, () => {});
  env.addCleanup(sub.dispose); await flush();
  env.window.dispatchEvent(new Event("focus")); await flush(); assert.equal(calls, 1);
  t.mock.timers.tick(300000); await flush(); assert.equal(calls, 2);
  env.document.visibilityState = "hidden";
  t.mock.timers.tick(600000); await flush(); assert.equal(calls, 2);
  env.document.visibilityState = "visible";
  env.document.dispatchEvent(new Event("visibilitychange")); await flush(); assert.equal(calls, 3);
});

test("background failure retains the last report and reconnect recovers it", async (t) => {
  const env = browser(t); let fail = false; let last;
  const data = modelWeather();
  const sub = subscription(async () => { if (fail) throw new Error(); return data; }, (s) => { last = s; });
  env.addCleanup(sub.dispose); await flush(); fail = true;
  t.mock.timers.tick(300000); await flush();
  assert.equal(last.weather, data); assert.equal(last.error, null); assert.ok(last.refreshError);
  assert.equal(last.isLoading, false);
  fail = false; env.window.dispatchEvent(new Event("online")); await flush();
  assert.equal(last.refreshError, null);
  assert.equal(last.weather.current.time, data.current.time);
});

test("requests do not overlap and disposal aborts a previous farm's request and removes listeners", async (t) => {
  const env = browser(t); let calls = 0; let signal; let resolve; const changes = [];
  const sub = subscription((_coords, s) => {
    calls++; signal = s; return new Promise((done) => { resolve = done; });
  }, (s) => changes.push(s));
  sub.refresh(); env.window.dispatchEvent(new Event("online")); assert.equal(calls, 1);
  sub.dispose(); assert.equal(signal.aborted, true);
  const count = changes.length;
  resolve(modelWeather()); await flush();
  env.window.dispatchEvent(new Event("online")); t.mock.timers.tick(600000); await flush();
  assert.equal(calls, 1); assert.equal(changes.length, count);
});

test("offline initial state and timed-out requests are recoverable", async (t) => {
  const env = browser(t); env.navigator.onLine = false;
  let last; let calls = 0;
  const sub = subscription((_coords, signal) => {
    calls++;
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("timeout"))));
  }, (s) => { last = s; });
  env.addCleanup(sub.dispose);
  assert.equal(calls, 0); assert.equal(last.isLoading, false); assert.match(last.error, /offline/);
  env.navigator.onLine = true; env.window.dispatchEvent(new Event("online"));
  t.mock.timers.tick(25000); await flush();
  assert.equal(last.isLoading, false); assert.match(last.error, /Unable/);
  sub.refresh(); assert.equal(calls, 2);
});

test("UI separates daily forecast from reported rain and shows report age and source", () => {
  const React = localRequire("react");
  const { renderToStaticMarkup } = localRequire("react-dom/server");
  const { CurrentWeatherHero } = loadTs("features/weather/components/current-weather-hero/index.tsx", {
    "@/features/weather/components/weather-background": { WeatherBackground: () => null },
    "@/features/weather/components/hourly-forecast": { HourlyForecast: () => null },
    "@/features/weather/components/weather-source-status": loadTs("features/weather/components/weather-source-status/index.tsx"),
  });
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  const props = {
    data: { weather, current: { condition: weather.current.condition, wind: { cardinal: "SSW" }, visualState: "storm-day" } },
    farmName: "Test farm", checkedAt: reportEpoch * 1000 + 3600000,
    isRefreshing: false, refreshError: null, onRefresh: () => {},
  };
  const html = renderToStaticMarkup(React.createElement(CurrentWeatherHero, props));
  assert.match(html, /21\.0 mm/);
  assert.match(html, /Today&#x27;s total forecast/);
  assert.match(html, /WeatherAPI/); assert.ok(!html.includes("Open-Meteo"));
  assert.match(html, /80% rain chance/);
  assert.match(html, /over 30 minutes old/);
  const visibleText = html.replace(/<[^>]*>/g, "");
  assert.ok(!visibleText.includes("0.9")); assert.ok(!visibleText.includes("previous 15"));
  props.checkedAt += 3 * 24 * 3600000;
  const tomorrow = renderToStaticMarkup(React.createElement(CurrentWeatherHero, props));
  assert.ok(!tomorrow.includes("21.0 mm")); assert.match(tomorrow, /Daily forecast unavailable/);
});


test("Now reuses every displayed current measurement and leaves forecast values unchanged", () => {
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  const before = structuredClone(weather);
  const { buildWeatherTimeline } = loadTs("features/weather/lib/build-weather-timeline.ts");
  const cards = buildWeatherTimeline(weather, reportEpoch * 1000);
  assert.equal(cards.length, 25);
  assert.equal(cards[0].kind, "current");
  for (const key of ["temperature", "feelsLike", "condition", "isDay", "windSpeed", "windDirection", "precipitationProbability", "time"]) {
    assert.deepEqual(cards[0][key], weather.current[key], key);
  }
  assert.equal(cards[0].temperature, 22);
  assert.equal(cards[1].temperature, 25);
  assert.equal(cards[1].time, "2026-09-07T11:00");
  assert.ok(!cards.slice(1).some((c) => c.time === "2026-09-07T10:00"));
  assert.deepEqual(weather, before);
});

test("forecast selection crosses local midnight and respects epoch timestamps in a different timezone", () => {
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  const { buildWeatherTimeline } = loadTs("features/weather/lib/build-weather-timeline.ts");
  const lateNight = Date.parse("2026-09-07T23:45:00+03:30");
  const cards = buildWeatherTimeline(weather, lateNight);
  assert.equal(cards.length, 25);
  assert.equal(cards[1].time, "2026-09-08T00:00");
  const firstHour = weather.hourly[0];
  weather.timezone = "America/Chicago";
  weather.hourly = [
    { ...firstHour, time: "2026-09-06T23:00", timeEpoch: Date.parse("2026-09-07T04:00:00Z") / 1000 },
    { ...firstHour, time: "2026-09-07T00:00", timeEpoch: Date.parse("2026-09-07T05:00:00Z") / 1000 },
  ];
  const west = buildWeatherTimeline(weather, Date.parse("2026-09-07T04:45:00Z"));
  assert.equal(west.length, 2);
  assert.equal(west[1].time, "2026-09-07T00:00");
});

test("model fallback also uses the shared current report and only future local hours", () => {
  const weather = modelWeather();
  const { buildWeatherTimeline } = loadTs("features/weather/lib/build-weather-timeline.ts");
  weather.hourly = [
    { ...weather.current, time: "2026-09-07T10:00", temperature: 28 },
    { ...weather.current, time: "2026-09-07T11:00", temperature: 25 },
  ];
  const cards = buildWeatherTimeline(weather, reportEpoch * 1000);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].temperature, 22);
  assert.equal(cards[1].temperature, 25);
});

test("rain and snow probabilities remain explicitly labelled and absent values stay unknown", () => {
  const input = forecastPayload();
  input.forecast.forecastday[0].hour[0].chance_of_snow = "85";
  delete input.forecast.forecastday[0].hour[1].chance_of_rain;
  delete input.forecast.forecastday[0].hour[1].chance_of_snow;
  const weather = parseWeatherApiForecast(input, coordinates);
  assert.equal(weather.hourly[0].precipitationProbability, 85);
  assert.equal(weather.hourly[0].precipitationProbabilityKind, "snow");
  assert.equal(weather.hourly[1].precipitationProbability, null);
  assert.equal(weather.daily[0].precipitationProbabilityKind, "rain");
  assert.equal(weather.daily[0].rainSum, null);
});

test("the rendered Now card matches the main temperature while future cards keep their forecasts", () => {
  const React = localRequire("react");
  const { renderToStaticMarkup } = localRequire("react-dom/server");
  const { HourlyForecast } = loadTs("features/weather/components/hourly-forecast/index.tsx");
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  const html = renderToStaticMarkup(React.createElement(HourlyForecast, { weather, checkedAt: reportEpoch * 1000 }));
  const currentCard = html.match(/<article[^>]*data-weather-kind="current"[\s\S]*?<\/article>/)[0];
  assert.match(currentCard, />Now</);
  assert.match(currentCard, />22°</);
  assert.match(currentCard, /Feels 24°/);
  assert.match(currentCard, /Chance —/);
  assert.ok(!currentCard.includes("28°"));
  const nextCard = html.match(/<article[^>]*data-weather-kind="forecast"[\s\S]*?<\/article>/)[0];
  assert.match(nextCard, />25°</);
  assert.match(nextCard, /Rain 65%/);
  const old = renderToStaticMarkup(React.createElement(HourlyForecast, { weather, checkedAt: reportEpoch * 1000 + 3600000 }));
  assert.match(old, />Last report</);
});

test("display horizon uses available local dates and never invents ten forecast days", () => {
  const { forecastDays, localWeatherTime } = loadTs("features/weather/lib/weather-presentation.ts");
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  assert.equal(forecastDays(weather, reportEpoch * 1000).length, 3);
  const midnight = Date.parse("2026-09-07T21:00:00Z");
  assert.equal(localWeatherTime("Asia/Tehran", midnight), "2026-09-08T00:30");
  assert.deepEqual(forecastDays(weather, midnight).map((day) => day.date), ["2026-09-08", "2026-09-09"]);
  assert.deepEqual(forecastDays(weather, Date.parse("2026-09-11T00:00Z")), []);
});

test("sparse hourly data does not extend the next-day outlook and repeated local hours keep their epoch", () => {
  const { upcomingHours } = loadTs("features/weather/lib/weather-presentation.ts");
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  const base = weather.hourly[0];
  weather.hourly = [
    { ...base, timeEpoch: undefined, time: "2026-09-07T11:00" },
    { ...base, timeEpoch: undefined, time: "2026-09-09T11:00" },
  ];
  assert.equal(upcomingHours(weather, reportEpoch * 1000).length, 1);
  weather.timezone = "America/New_York";
  weather.hourly = [
    { ...base, time: "2026-11-01T01:00", timeEpoch: Date.parse("2026-11-01T05:00Z") / 1000 },
    { ...base, time: "2026-11-01T01:00", timeEpoch: Date.parse("2026-11-01T06:00Z") / 1000 },
  ];
  const remaining = upcomingHours(weather, Date.parse("2026-11-01T05:30Z"));
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].timeEpoch, Date.parse("2026-11-01T06:00Z") / 1000);
});

test("night outlook stops at the following day and missing daylight stays unavailable", () => {
  const { nextNight, daylightMinutes, durationLabel } = loadTs("features/weather/lib/weather-presentation.ts");
  const sample = (isDay, temperature) => ({ isDay, temperature });
  const sequence = [sample(true, 25), sample(false, 4), sample(false, -1), sample(true, 12), sample(false, -10)];
  assert.deepEqual(nextNight(sequence).map((hour) => hour.temperature), [4, -1]);
  assert.deepEqual(nextNight([sample(true, 25)]), []);
  assert.equal(daylightMinutes({ sunrise: null, sunset: null }), null);
  assert.equal(durationLabel(null), "—");
  assert.equal(daylightMinutes({ sunrise: "2026-09-07T06:15", sunset: "2026-09-07T19:20" }), 785);
  assert.equal(durationLabel(785), "13h 5m");
});

test("night detail includes the next morning's minimum and agrees with the card", () => {
  const { nightForecast, nextNight, upcomingHours } = loadTs("features/weather/lib/weather-presentation.ts");
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  weather.hourly.find((hour) => hour.time === "2026-09-08T04:00").temperature = -2;
  const card = nextNight(upcomingHours(weather, reportEpoch * 1000));
  const chart = nightForecast(weather, reportEpoch * 1000, "2026-09-07");
  assert.deepEqual(chart, card);
  assert.equal(Math.min(...chart.map((hour) => hour.temperature)), -2);
  assert.ok(chart.some((hour) => hour.time === "2026-09-08T04:00"));
  assert.ok(chart.every((hour) => !hour.isDay));
});

test("charts retain missing samples and forecast values instead of substituting current readings", () => {
  const { weatherChartPoints, rainAmount, fieldOutlook } = loadTs("features/weather/lib/weather-presentation.ts");
  const { linePath } = loadTs("features/weather/lib/weather-chart.ts");
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  weather.hourly[1].precipitation = null;
  const before = structuredClone(weather);
  const temperaturePoints = weatherChartPoints(weather.hourly, "temperature");
  assert.equal(temperaturePoints[10].value, 28);
  assert.equal(weather.current.temperature, 22);
  const rain = weatherChartPoints(weather.hourly.slice(0, 3), "precipitation");
  assert.equal(rain[1].value, null);
  assert.equal((linePath(rain, "value", (index) => index, (value) => value).match(/M/g) ?? []).length, 2);
  assert.equal(rainAmount(null), "—"); assert.equal(rainAmount(0), "0.0"); assert.equal(rainAmount(0.04), "<0.1");
  const missing = weather.hourly.slice(0, 2).map((hour) => ({ ...hour, precipitation: null }));
  assert.match(fieldOutlook(missing), /unavailable/);
  assert.doesNotMatch(fieldOutlook(missing), /No measurable/);
  assert.deepEqual(weather, before);
});

test("storm backgrounds try rainy and cloudy assets without a clear-sky fallback", () => {
  const { weatherBackgroundCandidates: candidates } = loadTs("features/weather/lib/weather-background-assets.ts", {
    "./resolve-weather-background": { resolveWeatherBackground: () => "/weather/backgrounds/clear-day.png" },
  });
  assert.ok(candidates("storm-day").includes("/weather/backgrounds/cloudy-day.webp"));
  assert.ok(candidates("heavy-rain-night").includes("/weather/backgrounds/rain-night.webp"));
  assert.ok(!candidates("storm-day").some((url) => url.includes("clear-day")));
  assert.deepEqual(candidates("unknown-day"), []);
  const custom = loadTs("features/weather/lib/weather-background-assets.ts", {
    "./resolve-weather-background": { resolveWeatherBackground: () => "/weather/backgrounds/my-clouds.png" },
  }).weatherBackgroundCandidates;
  assert.equal(custom("cloudy-day")[0], "/weather/backgrounds/my-clouds.webp");
});

test("redesigned forecast keeps Now consistent and labels only the available days", () => {
  const React = localRequire("react");
  const { renderToStaticMarkup } = localRequire("react-dom/server");
  const { WeatherForecastOverview } = loadTs("features/weather/components/weather-forecast-overview/index.tsx");
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  const html = renderToStaticMarkup(React.createElement(WeatherForecastOverview, { weather, asOf: reportEpoch * 1000, onOpen: () => {} }));
  const now = html.match(/<button[^>]*data-weather-kind="current"[\s\S]*?<\/button>/)[0];
  assert.match(now, />Now</); assert.match(now, />22°</); assert.doesNotMatch(now, /28°/);
  assert.match(html, /3-day forecast/); assert.doesNotMatch(html, /10-day/);
});

test("rain card and detail distinguish a four-millimetre daily forecast from a 0.4 report", () => {
  const React = localRequire("react");
  const { renderToStaticMarkup } = localRequire("react-dom/server");
  const { WeatherMetricGrid } = loadTs("features/weather/components/weather-metric-grid/index.tsx");
  const { WeatherDetail } = loadTs("features/weather/components/weather-detail/index.tsx");
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  weather.daily[0].precipitationSum = 4;
  weather.current.precipitation = 0.4;
  const grid = renderToStaticMarkup(React.createElement(WeatherMetricGrid, { weather, asOf: reportEpoch * 1000, onOpen: () => {} }));
  assert.match(grid, /Precipitation: 4\.0 mm\. Today&#x27;s total forecast/);
  assert.doesNotMatch(grid, /Precipitation: 0\.4/);
  assert.doesNotMatch(grid, /UV index|Visibility/);
  const detail = renderToStaticMarkup(React.createElement(WeatherDetail, {
    weather, asOf: reportEpoch * 1000, selection: { metric: "precipitation", date: "2026-09-07" }, onSelection: () => {},
  }));
  const text = detail.replace(/<[^>]*>/g, "");
  assert.match(text, /Full-day forecast.*4\.0 mm/);
  assert.match(text, /Measured daily totalUnavailable/);
  assert.match(text, /Latest provider report: 0\.4 mm/);
  assert.match(text, /does not specify this reading&#x27;s accumulation period/);
  assert.doesNotMatch(text, /previous 15 minutes/);
});

test("detail charts and accessible tables render for every supported measurement", () => {
  const React = localRequire("react");
  const { renderToStaticMarkup } = localRequire("react-dom/server");
  const { WeatherDetail } = loadTs("features/weather/components/weather-detail/index.tsx");
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  for (const metric of ["temperature", "wind", "humidity", "dewPoint", "overnight", "pressure", "cloudCover", "daylight"]) {
    const html = renderToStaticMarkup(React.createElement(WeatherDetail, {
      weather, asOf: reportEpoch * 1000, selection: { metric, date: "2026-09-07" }, onSelection: () => {},
    }));
    assert.match(html, /<table/, metric);
    assert.doesNotMatch(html, /NaN|Infinity/, metric);
    if (metric === "dewPoint") assert.match(html, /No dew point forecast is available/);
    else if (metric !== "daylight") assert.match(html, /type="range"/);
    else { assert.match(html, /06:15/); assert.match(html, /19:20/); }
  }
});

test("forecast day configuration is bounded and provider output is not padded", async (t) => {
  const previous = process.env.WEATHERAPI_FORECAST_DAYS;
  t.after(() => { if (previous === undefined) delete process.env.WEATHERAPI_FORECAST_DAYS; else process.env.WEATHERAPI_FORECAST_DAYS = previous; });
  let requested;
  t.mock.method(globalThis, "fetch", async (url) => { requested = new URL(url).searchParams.get("days"); return Response.json(forecastPayload()); });
  const { getWeatherApiWeather } = loadTs("features/weather/services/weatherapi-service.ts");
  process.env.WEATHERAPI_FORECAST_DAYS = "10";
  const data = await getWeatherApiWeather(coordinates, "test-key-only");
  assert.equal(requested, "10"); assert.equal(data.daily.length, 3);
  process.env.WEATHERAPI_FORECAST_DAYS = "9999";
  await getWeatherApiWeather(coordinates, "test-key-only");
  assert.equal(requested, "3");
});

test("offline checks advance report age without rewriting the report timestamp", async (t) => {
  const env = browser(t); let last;
  const data = modelWeather();
  const sub = subscription(async () => data, (state) => { last = state; });
  env.addCleanup(sub.dispose); await flush();
  env.navigator.onLine = false;
  t.mock.timers.tick(35 * 60 * 1000); await flush();
  assert.match(last.refreshError, /Offline/);
  assert.ok(last.checkedAt - Date.parse(last.weather.current.time) >= 30 * 60 * 1000);
  assert.equal(last.weather.current.time, data.current.time);
});

test("reconnect during a pending request retries immediately and ignores the aborted result", async (t) => {
  const env = browser(t); let calls = 0; let finish; let signal; let last;
  const sub = subscription((_coords, currentSignal) => {
    calls++; signal = currentSignal;
    return new Promise((resolve) => { finish = resolve; });
  }, (state) => { last = state; });
  env.addCleanup(sub.dispose);
  env.navigator.onLine = false; env.window.dispatchEvent(new Event("offline"));
  assert.equal(signal.aborted, true); assert.match(last.error, /offline/);
  env.navigator.onLine = true; env.window.dispatchEvent(new Event("online"));
  assert.equal(calls, 1);
  finish(modelWeather()); await flush();
  assert.equal(calls, 2); assert.equal(last.weather, null);
  assert.equal(last.isLoading, true);
  finish(modelWeather()); await flush();
  assert.equal(last.error, null); assert.equal(last.isLoading, false);
});

test("reconnecting in a hidden tab refreshes on return even before the polling interval", async (t) => {
  const env = browser(t); let calls = 0;
  const sub = subscription(async () => { calls++; return modelWeather(); }, () => {});
  env.addCleanup(sub.dispose); await flush();
  env.document.visibilityState = "hidden";
  env.navigator.onLine = false; env.window.dispatchEvent(new Event("offline"));
  env.navigator.onLine = true; env.window.dispatchEvent(new Event("online"));
  assert.equal(calls, 1);
  env.document.visibilityState = "visible";
  env.document.dispatchEvent(new Event("visibilitychange")); await flush();
  assert.equal(calls, 2);
});

test("farm dashboard uses the same local daily rainfall total as the full weather page", () => {
  const React = localRequire("react");
  const { renderToStaticMarkup } = localRequire("react-dom/server");
  const weather = parseWeatherApiForecast(forecastPayload(), coordinates);
  weather.current.precipitation = 0.4;
  weather.daily[0].precipitationSum = 4;
  const state = { weather, checkedAt: reportEpoch * 1000, isLoading: false, isRefreshing: false, refresh: () => {} };
  const Dashboard = loadTs("features/weather/components/weather-dashboard/index.tsx", {
    "@/features/weather/components/hooks/use-weather": { useWeather: () => state },
  }).default;
  const render = () => renderToStaticMarkup(React.createElement(Dashboard, { coordinates }));
  assert.match(render(), /4\.0 mm/); assert.match(render(), /Today&#x27;s total forecast/);
  assert.ok(!render().includes("0.4 mm"));
  state.checkedAt += 3 * 86400000;
  assert.match(render(), /Daily forecast unavailable/); assert.ok(!render().includes("4.0 mm"));
});
