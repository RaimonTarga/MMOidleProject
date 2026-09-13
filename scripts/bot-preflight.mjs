import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tests = [
  ["server", "test/botBuildPreflight.test.ts"],
  ["server", "test/tierEntryBootstrap.test.ts"],
  ["server", "test/humanPlaytestRecorder.test.ts"],
  ["server", "../shared/src/attunement.test.ts"],
  ["bot", "src/harness.test.ts"],
  ["bot", "src/loadout/loadout.test.ts"],
  ["bot", "src/policy/choices.test.ts"],
  ["bot", "src/telemetry/experience.test.ts"],
  ["bot", "src/tierEntry/profiles.test.ts"],
  ["bot", "src/tierEntry/validate.test.ts"],
  ["bot", "src/routes/t1Routes.semantic.test.ts"],
  ["bot", "src/routes/t2Routes.semantic.test.ts"],
  ["bot", "src/routes/campaignReadiness.test.ts"],
  ["bot", "src/routes/campaignBehavior.test.ts"],
  ["bot", "src/routes/campaignBoss.test.ts"],
  ["bot", "src/routes/campaignT2Boss.test.ts"],
  ["bot", "src/telemetry/t1Snapshots.test.ts"],
];
console.log("Bot preflight: NONCANONICAL infrastructure validation, no balance evidence.");
for (const pkg of ["bot", "server"]) {
  const result = spawnSync("pnpm", ["--filter", `@mmo-idle/${pkg}`, "exec", "tsc", "--noEmit"],
    { cwd: root, stdio: "inherit", shell: process.platform === "win32", timeout: 90_000 });
  if (result.status !== 0) { console.error(result.error ?? `Typecheck failed: ${pkg}`); process.exit(1); }
}
for (const [pkg, test] of tests) {
  console.log(`Preflight: ${pkg}/${test}`);
  const result = spawnSync("pnpm", ["--filter", `@mmo-idle/${pkg}`, "exec", "tsx", "--conditions=development", test],
    { cwd: root, stdio: "inherit", shell: process.platform === "win32", timeout: 90_000 });
  if (result.status !== 0) { console.error(result.error ?? `Failed: ${test}`); process.exit(1); }
}
const experiments = spawnSync(process.execPath, ["scripts/experiment/experiment.test.mjs"], { cwd: root, stdio: "inherit", timeout: 90_000 });
if (experiments.status !== 0) process.exit(1);
const experience = spawnSync(process.execPath, ["scripts/experiment/experience.test.mjs"], { cwd: root, stdio: "inherit", timeout: 90_000 });
if (experience.status !== 0) process.exit(1);
console.log("Bot preflight: PASS. Validate the desired route/build at its actual progression gates before a long batch.");
