import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The Tier-2 RESPONSE MAP: per-biome x per-class, from a bossless cohort.
 *
 * `pnpm bot:t2-response-map <batchDir> [<batchDir> ...]`
 *
 * This is the artifact the bossless campaign is actually read from. The smoke
 * matrix in `bot:t2-report` answers "how far did each build get"; this answers
 * "what did each biome DO to each build on the way", which is the question
 * about zone tuning.
 *
 * ── Why it reads events.jsonl, not summary.json ────────────────────────────
 *
 * Same reason as `bot:t2-report`: the runs this campaign cares most about are
 * the ones that got walled, and a walled run often has no summary at all. It
 * also lets a leg be attributed to its biome from the route's own
 * `<group>-t2-entered` / `<group>-t2-leg-complete` milestone brackets rather
 * than from node occupancy, so travel between biomes is charged to the leg that
 * caused it.
 *
 * ── What it deliberately does NOT report ───────────────────────────────────
 *
 * Boss anything. A bossless route emits no `attemptBoss`, so if a boss statistic
 * appears here at all the cohort is not what it claims to be -- which is why the
 * header asserts on it loudly rather than printing a zero.
 */

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (args.length === 0) {
  console.error("usage: pnpm bot:t2-response-map <batchDir> [<batchDir> ...]");
  process.exit(1);
}

function resolveDir(arg: string): string {
  return existsSync(arg) ? arg : existsSync(join("..", arg)) ? join("..", arg) : arg;
}

interface Ev {
  kind: string;
  atMs: number;
  [k: string]: unknown;
}

interface LegStats {
  biomeGroup: string;
  enteredAtMs: number | null;
  completedAtMs: number | null;
  kills: number;
  deaths: number;
  downtimeMs: number;
  damageTaken: number;
  blockedMs: number;
  crafts: number;
  upgrades: number;
  equips: string[];
  stepBackActivations: number;
  nodeModifiers: Set<string>;
  reachedEnd: boolean;
}

interface RunResponse {
  runId: string;
  routeId: string;
  classSlug: string;
  entryKind: "snapshot" | "template" | "unknown";
  entryProfileId: string;
  rewardMultiplier: number;
  taints: string[];
  legs: Map<string, LegStats>;
  bossEventsSeen: number;
  finalGlobalMastery: number | null;
  durationMs: number;
  completion: string;
}

function emptyLeg(biomeGroup: string): LegStats {
  return {
    biomeGroup,
    enteredAtMs: null,
    completedAtMs: null,
    kills: 0,
    deaths: 0,
    downtimeMs: 0,
    damageTaken: 0,
    blockedMs: 0,
    crafts: 0,
    upgrades: 0,
    equips: [],
    stepBackActivations: 0,
    nodeModifiers: new Set<string>(),
    reachedEnd: false,
  };
}

function readEvents(runDir: string): Ev[] {
  const file = join(runDir, "events.jsonl");
  if (!existsSync(file)) return [];
  const out: Ev[] = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as Ev);
    } catch {
      // A killed run can leave a half-written final line. Everything before it
      // is still valid evidence, so stop at the tear rather than discarding it.
      break;
    }
  }
  return out;
}

function readRun(runDir: string): RunResponse | null {
  const events = readEvents(runDir);
  if (events.length === 0) return null;

  const header = (events.find((e) => e.kind === "run-start")?.header ?? {}) as Record<string, unknown>;
  const tierEntry = (header.tierEntry ?? {}) as Record<string, unknown>;
  const profileId = String(tierEntry.profileId ?? "");
  const routeId = String(header.routeId ?? "unknown");

  const run: RunResponse = {
    runId: String(header.runId ?? runDir),
    routeId,
    classSlug: routeId.replace(/-t2-progression$/, ""),
    // A `snapshot-*` profile id is a REAL Tier-1 handoff; anything else is a
    // synthetic template. These must never be pooled in one row, so the
    // distinction is carried all the way into the printed table.
    entryKind: profileId.startsWith("snapshot-")
      ? "snapshot"
      : profileId
        ? "template"
        : "unknown",
    entryProfileId: profileId || "(none)",
    rewardMultiplier: Number(header.rewardMultiplier ?? 1),
    taints: (header.taints as string[] | undefined) ?? [],
    legs: new Map<string, LegStats>(),
    bossEventsSeen: 0,
    finalGlobalMastery: null,
    durationMs: 0,
    completion: "unknown",
  };

  let current: LegStats | null = null;
  let currentModifier: string | null = null;

  for (const e of events) {
    run.durationMs = Math.max(run.durationMs, Number(e.atMs) || 0);

    if (e.kind === "milestone") {
      const id = String(e.id ?? "");
      const entered = /^(.+)-t2-entered$/.exec(id);
      if (entered) {
        current = run.legs.get(entered[1]) ?? emptyLeg(entered[1]);
        current.enteredAtMs = Number(e.atMs);
        if (currentModifier) current.nodeModifiers.add(currentModifier);
        run.legs.set(entered[1], current);
        continue;
      }
      const done = /^(.+)-t2-leg-complete$/.exec(id);
      if (done && current && current.biomeGroup === done[1]) {
        current.completedAtMs = Number(e.atMs);
        current.reachedEnd = true;
        continue;
      }
      continue;
    }

    if (e.kind === "node-enter") {
      currentModifier = (e.nodeModifier as string | null) ?? null;
      if (current && currentModifier) current.nodeModifiers.add(currentModifier);
      continue;
    }

    // Boss activity must not exist in this cohort. Counted, not silently
    // ignored, so a mis-built route is caught rather than averaged in.
    if (e.kind === "dungeon-guard" || e.kind === "boss-attempt") {
      run.bossEventsSeen += 1;
      continue;
    }

    if (!current) continue;

    switch (e.kind) {
      case "kill":
        current.kills += 1;
        break;
      case "death":
        current.deaths += 1;
        break;
      case "respawn":
        current.downtimeMs += Number(e.downtimeMs) || 0;
        break;
      case "craft":
      case "evolution":
        current.crafts += 1;
        break;
      case "upgrade":
        current.upgrades += 1;
        break;
      case "equip":
        if (e.definitionId) current.equips.push(String(e.definitionId));
        break;
      case "blocked-on-resource":
        current.blockedMs += Number(e.blockedMs ?? e.durationMs) || 0;
        break;
      case "step-back":
        current.stepBackActivations += 1;
        break;
      default:
        break;
    }
  }

  const end = events.find((e) => e.kind === "run-end");
  if (end) run.completion = String(end.completion ?? "unknown");

  return run;
}

// ── Collect ────────────────────────────────────────────────────────────────

const runs: RunResponse[] = [];
for (const arg of args) {
  const dir = resolveDir(arg);
  if (!existsSync(dir)) {
    console.error(`skipping missing directory: ${arg}`);
    continue;
  }
  const stack = [dir];
  while (stack.length > 0) {
    const here = stack.pop()!;
    if (existsSync(join(here, "events.jsonl"))) {
      const run = readRun(here);
      if (run) runs.push(run);
      continue;
    }
    for (const entry of readdirSync(here, { withFileTypes: true })) {
      if (entry.isDirectory()) stack.push(join(here, entry.name));
    }
  }
}

if (runs.length === 0) {
  console.error("no runs with events.jsonl found");
  process.exit(1);
}

const BIOME_ORDER = [
  "plains",
  "forest",
  "swamp",
  "mountain",
  "cave",
  "jungle",
  "desert",
];

const mins = (ms: number): string => (ms > 0 ? `${(ms / 60_000).toFixed(1)}m` : "-");
const legMs = (leg: LegStats): number =>
  leg.enteredAtMs === null ? 0 : (leg.completedAtMs ?? leg.enteredAtMs) - leg.enteredAtMs;

// ── Header and evidence class ──────────────────────────────────────────────

console.log("# Tier-2 response map\n");
console.log(`Runs: **${runs.length}** across ${args.length} batch director${args.length === 1 ? "y" : "ies"}.\n`);

const bossy = runs.filter((r) => r.bossEventsSeen > 0);
if (bossy.length > 0) {
  console.log(
    `> **COHORT INVALID FOR THIS CAMPAIGN.** ${bossy.length} run(s) recorded boss activity, ` +
      "but a bossless progression cohort must record none. These runs are not " +
      "evidence about biome tuning:\n>\n" +
      bossy.map((r) => `> - ${r.runId} (${r.bossEventsSeen} boss events)`).join("\n") +
      "\n",
  );
} else {
  console.log("Boss activity recorded: **none**, as required for this cohort.\n");
}

const multipliers = [...new Set(runs.map((r) => r.rewardMultiplier))];
console.log(
  `Reward multiplier: ${multipliers.join(", ")}. ` +
    (multipliers.some((m) => m !== 1)
      ? "**Accelerated — progression integrity, combat sanity and RELATIVE biome " +
        "difficulty only. Not absolute economy pacing.**\n"
      : "Canonical 1x.\n"),
);

const templateEntries = runs.filter((r) => r.entryKind !== "snapshot");
if (templateEntries.length > 0) {
  console.log(
    "**Entry-state warning.** These runs started from a SYNTHETIC template, not a real " +
      "Tier-1 handoff, and must not be pooled in a row with snapshot-entry runs:\n",
  );
  for (const r of templateEntries) {
    console.log(`- \`${r.classSlug}\` — ${r.entryProfileId}`);
  }
  console.log("");
}

// ── The map ────────────────────────────────────────────────────────────────

const classes = [...new Set(runs.map((r) => r.classSlug))].sort();

console.log("## Time per biome\n");
console.log(`| class | entry | ${BIOME_ORDER.join(" | ")} | reached |`);
console.log(`|---|---|${BIOME_ORDER.map(() => "---:").join("|")}|---|`);
for (const cls of classes) {
  for (const r of runs.filter((x) => x.classSlug === cls)) {
    const cells = BIOME_ORDER.map((b) => {
      const leg = r.legs.get(b);
      if (!leg || leg.enteredAtMs === null) return "-";
      return `${mins(legMs(leg))}${leg.reachedEnd ? "" : "*"}`;
    });
    const reached = BIOME_ORDER.filter((b) => r.legs.get(b)?.reachedEnd).length;
    console.log(
      `| ${cls} | ${r.entryKind === "snapshot" ? "real" : "template"} | ${cells.join(" | ")} | ${reached}/7 |`,
    );
  }
}
console.log("\n`*` = entered but never completed the leg (this is where the run was walled).\n");

console.log("## Kills/min and TTK proxy\n");
console.log("TTK proxy is leg time / kills — it includes travel and downtime, so read it as a");
console.log("relative comparison across classes in the SAME biome, never as an absolute.\n");
console.log(`| class | ${BIOME_ORDER.join(" | ")} |`);
console.log(`|---|${BIOME_ORDER.map(() => "---:").join("|")}|`);
for (const cls of classes) {
  const cells = BIOME_ORDER.map((b) => {
    const legs = runs.filter((r) => r.classSlug === cls).map((r) => r.legs.get(b)).filter(Boolean) as LegStats[];
    const ms = legs.reduce((s, l) => s + legMs(l), 0);
    const kills = legs.reduce((s, l) => s + l.kills, 0);
    if (ms === 0 || kills === 0) return "-";
    return `${((kills / ms) * 60_000).toFixed(1)}/m`;
  });
  console.log(`| ${cls} | ${cells.join(" | ")} |`);
}

console.log("\n## Deaths per biome\n");
console.log(`| class | ${BIOME_ORDER.join(" | ")} | total |`);
console.log(`|---|${BIOME_ORDER.map(() => "---:").join("|")}|---:|`);
for (const cls of classes) {
  let total = 0;
  const cells = BIOME_ORDER.map((b) => {
    const n = runs
      .filter((r) => r.classSlug === cls)
      .reduce((s, r) => s + (r.legs.get(b)?.deaths ?? 0), 0);
    total += n;
    return n === 0 ? "-" : String(n);
  });
  console.log(`| ${cls} | ${cells.join(" | ")} | ${total} |`);
}

console.log("\n## Resource-blocked time per biome\n");
console.log("High blocked time with combat otherwise healthy is an ECONOMY finding, not a");
console.log("difficulty one — check the node modifier mix before touching a monster.\n");
console.log(`| class | ${BIOME_ORDER.join(" | ")} |`);
console.log(`|---|${BIOME_ORDER.map(() => "---:").join("|")}|`);
for (const cls of classes) {
  const cells = BIOME_ORDER.map((b) => {
    const ms = runs
      .filter((r) => r.classSlug === cls)
      .reduce((s, r) => s + (r.legs.get(b)?.blockedMs ?? 0), 0);
    return mins(ms);
  });
  console.log(`| ${cls} | ${cells.join(" | ")} |`);
}

// ── Cross-class rollup, with the evidence bar spelled out ──────────────────

console.log("\n## Cross-class rollup\n");
console.log("| biome | classes entered | classes completed | deaths | median leg time |");
console.log("|---|---:|---:|---:|---:|");
for (const b of BIOME_ORDER) {
  const legs = runs.map((r) => r.legs.get(b)).filter((l): l is LegStats => !!l && l.enteredAtMs !== null);
  const entered = new Set(runs.filter((r) => r.legs.get(b)?.enteredAtMs != null).map((r) => r.classSlug)).size;
  const completed = new Set(runs.filter((r) => r.legs.get(b)?.reachedEnd).map((r) => r.classSlug)).size;
  const deaths = legs.reduce((s, l) => s + l.deaths, 0);
  const times = legs.map(legMs).sort((a, b2) => a - b2);
  const median = times.length > 0 ? times[Math.floor((times.length - 1) / 2)] : 0;
  console.log(`| ${b} | ${entered} | ${completed} | ${deaths} | ${mins(median)} |`);
}

console.log("\n### Interpretation reminders\n");
console.log("- A biome degraded for **4+ of 6 classes** is a tuning candidate; 2-3 is a matchup.");
console.log("- One class degraded across **4+ biomes** is a class/build/route problem, not monsters.");
console.log("- **Check weapon-arrival leg first.** Striker and Conduit carry a Tier-1 weapon");
console.log("  through leg 4, so their early-biome numbers are confounded by route shape.");
console.log("- **Jungle and Desert cap at level 6, not 12** — their legs are not directly");
console.log("  comparable to the five carryover biomes.");
console.log("- An isolated extreme replicate is investigated, never tuned on.");
