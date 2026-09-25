// Run after `npm run build`. Measures build bytes and local HTTP delivery, NOT
// browser paint, device CPU time, or authenticated route navigation latency.
import { readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);

const bytes = (files) => {
  const buffers = [...new Set(files)].map(file => readFileSync(`.next/${file}`));
  return {
    files: buffers.length,
    rawBytes: buffers.reduce((sum, buffer) => sum + buffer.length, 0),
    gzipBytes: buffers.reduce((sum, buffer) => sum + gzipSync(buffer).length, 0),
  };
};
const routeEntries = {};
for (const route of ["dashboard", "farms", "farms/[id]", "assistant", "account", "weather"]) {
  const context = { globalThis: {} };
  vm.runInNewContext(readFileSync(`.next/server/app/${route}/page_client-reference-manifest.js`, "utf8"), context);
  const manifest = Object.values(context.globalThis.__RSC_MANIFEST)[0];
  routeEntries[route] = bytes(manifest.entryJSFiles[`[project]/app/${route}/page`]);
}
function landingReport(html) {
  const files = [...new Set([...html.matchAll(/<script[^>]+src="([^" ]+\.js)"/g)].map(match => match[1].replace("/_next/", "")))];
  const logo = html.match(/<img[^>]+src="(\/logo\/[^" ]+)"/)?.[1];
  return {
    htmlBytes: Buffer.byteLength(html),
    initiallyHiddenReveals: [...html.matchAll(/style="opacity:0;transform:translateY\(16px\)"/g)].length,
    scripts: bytes(files),
    logo: { url: logo, bytes: statSync(`public${logo}`).size },
  };
}
const report = {
  label: process.argv[2] ?? "current",
  landing: null,
  // Entry chunks include shared app dependencies, exclude the common Next/React
  // runtime and optional dynamically loaded panels. Not browser transfer sizes.
  routeEntries,
  localHttp: [],
  browserPaint: "unmeasured",
  authenticatedNavigation: "unmeasured",
};
const port = 3191;
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-http-check-only" },
});
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Local server startup timed out")), 30_000);
    server.stdout.on("data", data => { if (data.toString().includes("Ready")) { clearTimeout(timeout); resolve(); } });
    server.stderr.resume();
    server.once("error", error => { clearTimeout(timeout); reject(error); });
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); });
  });
  for (let run = 0; run < 7; run++) {
    const start = performance.now();
    const response = await fetch(`http://127.0.0.1:${port}`);
    const headersMs = performance.now() - start;
    const html = await response.text();
    report.localHttp.push({ run, status: response.status, headersMs, completeMs: performance.now() - start });
    if (run === 0) report.landing = landingReport(html);
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  server.kill("SIGTERM");
}
