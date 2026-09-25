import test from "node:test";
import assert from "node:assert/strict";
import { loadTs, localRequire } from "../../weather/tests/helpers/load-ts.mjs";

const { NextRequest } = localRequire("next/server");
const { GET } = loadTs("app/api/location/route.ts");
const url = "https://agromind.test/api/location?latitude=36.271234&longitude=50.019876";

for (const scenario of ["primary", "fallback", "unavailable"]) {
  test(`location ${scenario}: preserves the response without logging coordinates or places`, async (t) => {
    const logs = [];
    for (const method of ["log", "warn", "error"])
      t.mock.method(console, method, (...args) => logs.push(args.map(arg => `${String(arg)} ${JSON.stringify(arg)}`).join(" ")));
    let calls = 0;
    t.mock.method(globalThis, "fetch", async () => {
      calls++;
      if (scenario === "primary") return Response.json({ countryCode: "ir", countryName: "Private Country", city: "Private City", locality: "Private Place" });
      if (calls === 1 || scenario === "unavailable") throw new Error(`Request failed: ${url} Private Place`);
      return Response.json({ address: { country_code: "ir", country: "Private Country", town: "Private City", suburb: "Private Place" } });
    });
    const response = await GET(new NextRequest(url));
    assert.equal(response.status, scenario === "unavailable" ? 502 : 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await response.json(), scenario === "unavailable"
      ? { error: "location_unavailable" }
      : { countryCode: "IR", countryName: "Private Country", city: "Private City", locality: "Private Place" });
    assert.equal(calls, scenario === "primary" ? 1 : 2);
    assert.doesNotMatch(logs.join("\n"), /36\.271234|50\.019876|Private|latitude|longitude|https:/);
  });
}

test("invalid or blank coordinates are rejected before contacting a provider", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => assert.fail("provider called"));
  for (const query of ["", "latitude=%20&longitude=0", "latitude=0&longitude=%20", "latitude=91&longitude=0", "latitude=0&longitude=181", "latitude=NaN&longitude=0"]) {
    const response = await GET(new NextRequest(`https://agromind.test/api/location?${query}`));
    assert.equal(response.status, 400);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  assert.equal(fetch.mock.callCount(), 0);
});
