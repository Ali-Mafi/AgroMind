import { spawnSync, execFileSync } from "node:child_process";
if (process.argv.includes("--native"))
  process.env.AGROMIND_TEST_DATABASE_ENGINE = "native";
// Use an existing unprivileged container account. Never create a system user.
const credentials =
  process.env.AGROMIND_TEST_DATABASE_ENGINE === "native" &&
  process.getuid?.() === 0
    ? {
        uid: Number(
          execFileSync("id", ["-u", "nobody"], { encoding: "utf8" }).trim(),
        ),
        gid: Number(
          execFileSync("id", ["-g", "nobody"], { encoding: "utf8" }).trim(),
        ),
      }
    : {};
const result = spawnSync(
  process.execPath,
  ["--test", "supabase/tests/foundation.test.mjs"],
  { stdio: "inherit", env: process.env, ...credentials },
);
if (result.error) {
  console.error(
    "The isolated database test process could not start:",
    result.error.code,
  );
  process.exitCode = 1;
} else process.exitCode = result.status ?? 1;
