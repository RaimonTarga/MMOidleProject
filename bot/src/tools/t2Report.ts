import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Read a Tier-2 batch directory and print the two artifacts the campaign asks
 * for: the SMOKE-TEST MATRIX (how far each build got and why it stopped) and
 * the GEAR ADOPTION REPORT (what each build crafted, wore, and skipped).
 *
 * `pnpm bot:t2-report <batchDir>`
 *
 * Reads `events.jsonl` directly rather than `summary.json`, so a run that is
 * still going -- or one that was killed mid-flight -- still reports everything
 * it managed to do. That matters: the runs this campaign cares most about are
 * the ones that got walled, and those are exactly the ones with no summary.
 */
const arg = process.argv[2];
if (!arg) {
  console.error("usage: pnpm bot:t2-report <batchDir>");
  process.exit(1);
}
// `pnpm --filter` runs this from `bot/`, but the paths a human has in hand are
// repo-root relative (`bot/runs/...`). Accept either rather than making the
// caller remember which one this script happens to want.
const dir = existsSync(arg) ? arg : existsSync(join("..", arg)) ? join("..", arg) : arg;

interface Ev {
  kind: string;
  atMs: number;
  [k: string]: unknown;
}

interface RunReport {
  runId: string;
  routeId: string;
  classRoot: string;
  templateValidation: string;
  canonical: boolean;
  taints: string[];
  rewardMultiplier: number;
  furthestBiome: string | null;
  biomesMaxed: string[];
  bossesCleared: string[];
  bossesAttempted: string[];
  bossAttempts: number;
  deaths: number;
  kills: number;
  branchTaken: boolean | null;
  lastStep: string;
  lastOutcome: string;
  stalls: string[];
  durationMs: number;
  crafted: Array<{ id: string; path: string }>;
  equipped: string[];
  unequipped: string[];
  skipped: string[];
  unreachable: string[];
  essenceSpent: Record<string, number>;
}

function readRun(runDir: string): RunReport | null {
  const path = join(runDir, "events.jsonl");
  if (!existsSync(path)) return null;
  const events: Ev[] = readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as Ev;
      } catch {
        return null;
      }
    })
    .filter((e): e is Ev => e !== null);
  if (events.length === 0) return null;

  const header = (events.find((e) => e.kind === "run-start")?.header ?? {}) as Record<string, unknown>;
  const validation = header.templateValidation as
    | { profilePass: boolean; spawnPass: boolean; checked: number }
    | undefined;

  const r: RunReport = {
    runId: String(header.runId ?? runDir),
    routeId: String(header.routeId ?? "?"),
    classRoot: String(header.classRoot ?? "?"),
    templateValidation: validation
      ? `${validation.profilePass && validation.spawnPass ? "PASS" : "FAIL"} (${validation.checked} checks)`
      : "absent",
    canonical: (header.taints as string[] | undefined)?.length === 0,
    taints: (header.taints as string[]) ?? [],
    rewardMultiplier: Number(header.rewardMultiplier ?? 1),
    furthestBiome: null,
    biomesMaxed: [],
    bossesCleared: [],
    bossesAttempted: [],
    bossAttempts: 0,
    deaths: 0,
    kills: 0,
    branchTaken: null,
    lastStep: "",
    lastOutcome: "",
    stalls: [],
    durationMs: 0,
    crafted: [],
    equipped: [],
    unequipped: [],
    skipped: [],
    unreachable: [],
    essenceSpent: {},
  };

  for (const e of events) {
    r.durationMs = Math.max(r.durationMs, Number(e.atMs ?? 0));
    switch (e.kind) {
      case "kill": {
        r.kills += 1;
        const biome = (e.context as { biomeGroup?: string } | undefined)?.biomeGroup;
        if (biome) r.furthestBiome = biome;
        break;
      }
      case "death":
        r.deaths += 1;
        break;
      case "milestone": {
        const id = String(e.id ?? "");
        if (id.endsWith("-t2-maxed")) r.biomesMaxed.push(id.replace("-t2-maxed", ""));
        if (id.endsWith("-t2-boss-cleared")) r.bossesCleared.push(id.replace("-t2-boss-cleared", ""));
        if (id.endsWith("-t2-boss-attempted")) r.bossesAttempted.push(id.replace("-t2-boss-attempted", ""));
        if (id.startsWith("skip:")) r.skipped.push(id.slice(5));
        if (id.startsWith("unreachable:")) r.unreachable.push(id.slice(12));
        break;
      }
      case "route-conditional":
        r.branchTaken = Boolean(e.taken);
        break;
      case "craft":
        if (e.success) r.crafted.push({ id: String(e.recipeId), path: "craft" });
        break;
      case "evolution":
        if (e.success) r.crafted.push({ id: String(e.recipeId), path: String(e.mode) });
        break;
      case "equip":
        if (e.definitionId) r.equipped.push(String(e.definitionId));
        break;
      case "unequip":
        r.unequipped.push(String(e.definitionId));
        break;
      case "boss-attempt":
        r.bossAttempts += 1;
        break;
      case "route-step-end":
        r.lastStep = String(e.label ?? "");
        r.lastOutcome = String(e.outcome ?? "");
        if (e.outcome === "stalled") r.stalls.push(`${e.label}: ${e.reason ?? ""}`);
        break;
    }
    const spent = e.essenceSpent as Record<string, number> | undefined;
    if (spent) for (const [k, v] of Object.entries(spent)) r.essenceSpent[k] = (r.essenceSpent[k] ?? 0) + v;
  }
  return r;
}

const runDirs = readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => join(dir, d.name));
const runs = runDirs.map(readRun).filter((r): r is RunReport => r !== null);

if (runs.length === 0) {
  console.error(`no run artifacts under ${dir}`);
  process.exit(1);
}

const mins = (ms: number): string => `${(ms / 60_000).toFixed(0)}m`;

console.log(`# Tier-2 smoke-test matrix\n`);
console.log(`Batch: ${dir}`);
const multipliers = [...new Set(runs.map((r) => r.rewardMultiplier))];
console.log(
  `Evidence class: **${runs.every((r) => r.canonical) ? "CANONICAL" : "NON-CANONICAL"}** ` +
    `(reward multiplier ${multipliers.join("/")}x, ${runs.length} runs). ` +
    `${runs.every((r) => r.canonical) ? "" : "Progression integrity and combat sanity only -- NOT economy pacing."}\n`,
);
console.log(
  "| route | template | furthest | maxed | bosses cleared | attempts | deaths | kills | branch | elapsed | last step |",
);
console.log("|---|---|---|---|---|---:|---:|---:|---|---:|---|");
for (const r of runs.sort((a, b) => a.routeId.localeCompare(b.routeId))) {
  console.log(
    `| ${r.routeId} | ${r.templateValidation} | ${r.furthestBiome ?? "-"} | ${r.biomesMaxed.join(",") || "-"} ` +
      `| ${r.bossesCleared.join(",") || "none"} | ${r.bossAttempts} | ${r.deaths} | ${r.kills} ` +
      `| ${r.branchTaken === null ? "not reached" : r.branchTaken ? "bought" : "skipped"} ` +
      `| ${mins(r.durationMs)} | ${r.lastStep.slice(0, 46)} (${r.lastOutcome}) |`,
  );
}

console.log(`\n## Stalls and blockers\n`);
let anyStall = false;
for (const r of runs) {
  for (const stall of r.stalls) {
    anyStall = true;
    console.log(`- **${r.routeId}** — ${stall}`);
  }
}
if (!anyStall) console.log("_None recorded._");

console.log(`\n# Gear adoption report\n`);
const acquired = new Map<string, { paths: Set<string>; runs: Set<string> }>();
const worn = new Map<string, Set<string>>();
const skipped = new Map<string, Set<string>>();
for (const r of runs) {
  for (const c of r.crafted) {
    const entry = acquired.get(c.id) ?? { paths: new Set<string>(), runs: new Set<string>() };
    entry.paths.add(c.path);
    entry.runs.add(r.routeId);
    acquired.set(c.id, entry);
  }
  for (const id of r.equipped) worn.set(id, (worn.get(id) ?? new Set()).add(r.routeId));
  for (const id of [...r.skipped, ...r.unreachable]) {
    skipped.set(id, (skipped.get(id) ?? new Set()).add(r.routeId));
  }
}
const allItems = [...new Set([...acquired.keys(), ...worn.keys(), ...skipped.keys()])].sort();
console.log("| item | obtained | via | equipped | deliberately skipped |");
console.log("|---|---:|---|---:|---:|");
for (const id of allItems) {
  const got = acquired.get(id);
  console.log(
    `| ${id} | ${got?.runs.size ?? 0}/${runs.length} | ${got ? [...got.paths].join("+") : "-"} ` +
      `| ${worn.get(id)?.size ?? 0}/${runs.length} | ${skipped.get(id)?.size ?? 0}/${runs.length} |`,
  );
}

console.log(`\n## Flagged adoption patterns\n`);
let flagged = false;
for (const id of allItems) {
  const wornCount = worn.get(id)?.size ?? 0;
  const gotCount = acquired.get(id)?.runs.size ?? 0;
  const skipCount = skipped.get(id)?.size ?? 0;
  if (wornCount === runs.length && runs.length > 1) {
    flagged = true;
    console.log(`- **${id}** — worn by every build (${wornCount}/${runs.length}). Universal viability is fine; check it is not universal SUPERIORITY.`);
  }
  if (skipCount === runs.length && runs.length > 1) {
    flagged = true;
    console.log(`- **${id}** — skipped by every build (${skipCount}/${runs.length}). Either the item has no niche or every plan mis-read it.`);
  }
  if (gotCount > 0 && wornCount === 0) {
    flagged = true;
    console.log(`- **${id}** — obtained ${gotCount} time(s) and never worn. Paid for, never used.`);
  }
}
if (!flagged) console.log("_Nothing crossed a flag threshold at this sample size._");

console.log(`\n## Essence spent (all runs)\n`);
const totals: Record<string, number> = {};
for (const r of runs) for (const [k, v] of Object.entries(r.essenceSpent)) totals[k] = (totals[k] ?? 0) + v;
console.log("```\n" + JSON.stringify(totals, null, 1) + "\n```");
if (!runs.every((r) => r.canonical)) {
  console.log(
    "\n> Spend totals above are from reward-multiplied runs and describe what the ROUTE bought, " +
      "not what a player would have to earn. Do not read them as economy pacing.",
  );
}
