import { readdirSync, readFileSync, writeFileSync, type Dirent } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "../config";

type AnyRecord = Record<string, any>;

const BIOMES = ["plains", "forest", "swamp", "mountain", "cave"] as const;
const ROUTE_CLASS: Record<string, string> = {
  "striker-t1": "Striker",
  "squire-t1": "Squire",
  "apprentice-t1": "Apprentice",
  "conduit-t1": "Conduit",
  "slinger-t1": "Slinger",
  "spirit-t1": "Spirit",
};
const CANONICAL_CLASSES = ["Striker", "Squire", "Apprentice", "Conduit", "Slinger", "Spirit"] as const;

interface BlockBreakdown {
  spans: number;
  totalMs: number;
  essenceOnlyMs: number;
  catalystOnlyMs: number;
  mixedMs: number;
  gateOnlyMs: number;
  otherMs: number;
}

interface RunRow {
  runId: string;
  routeId: string;
  className: string;
  canonical: boolean;
  completion: string;
  durationMs: number;
  mastery: Record<string, number | null>;
  allMasteryMs: number | null;
  blocksBeforeMastery: BlockBreakdown;
  plus5: { count: number; firstMs: number | null; afterMasteryCount: number };
  bosses: { attemptsMs: number; combatMs: number; victories: number };
  deaths: number;
  stallReason?: string;
  essence: {
    gained: Record<string, number>;
    spent: Record<string, number>;
    final: Record<string, number>;
  };
  catalysts: {
    gained: Record<string, number>;
    spent: Record<string, number>;
    final: Record<string, number>;
  };
  snapshots: { a: string | null; b: string | null };
}

function findSummaryFiles(root: string): string[] {
  const found: string[] = [];
  const visit = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && entry.name === "summary.json") found.push(path);
    }
  };
  visit(root);
  return found;
}

function eventsFor(summaryPath: string): AnyRecord[] {
  const path = join(dirname(summaryPath), "events.jsonl");
  try {
    return readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AnyRecord);
  } catch {
    return [];
  }
}

function milestoneAt(summary: AnyRecord, id: string): number | null {
  const event = (summary.economy?.milestones ?? []).find((entry: AnyRecord) => entry.id === id);
  return typeof event?.atMs === "number" ? event.atMs : null;
}

function classifyReasons(reasons: AnyRecord[] | undefined): keyof Omit<BlockBreakdown, "spans" | "totalMs"> {
  const kinds = new Set((reasons ?? []).map((reason) => reason.kind));
  const hasEssence = kinds.has("essence");
  const hasCatalyst = kinds.has("catalyst");
  if (hasEssence && hasCatalyst) return "mixedMs";
  if (hasEssence && kinds.size === 1) return "essenceOnlyMs";
  if (hasCatalyst && kinds.size === 1) return "catalystOnlyMs";
  if (kinds.size > 0 && [...kinds].every((kind) => kind === "globalMastery" || kind === "biomeLevel" || kind === "recipeLocked")) {
    return "gateOnlyMs";
  }
  return "otherMs";
}

function blocksBefore(events: AnyRecord[], boundaryMs: number | null): BlockBreakdown {
  const out: BlockBreakdown = {
    spans: 0,
    totalMs: 0,
    essenceOnlyMs: 0,
    catalystOnlyMs: 0,
    mixedMs: 0,
    gateOnlyMs: 0,
    otherMs: 0,
  };
  const open = new Map<string, AnyRecord>();
  for (const event of events) {
    if (event.kind !== "blocked-on-resource") continue;
    if (event.phase === "start") {
      open.set(event.forWhat, event);
      continue;
    }
    const start = open.get(event.forWhat);
    open.delete(event.forWhat);
    const atMs = Number(event.atMs);
    if (boundaryMs !== null && atMs > boundaryMs) continue;
    const durationMs = Math.max(0, Number(event.durationMs ?? 0));
    const reasons = start?.blockReasons ?? event.blockReasons;
    out.spans += 1;
    out.totalMs += durationMs;
    out[classifyReasons(reasons)] += durationMs;
  }
  for (const start of open.values()) {
    if (boundaryMs !== null && Number(start.atMs) > boundaryMs) continue;
    const durationMs = Math.max(0, (boundaryMs ?? Number(start.atMs)) - Number(start.atMs));
    out.spans += 1;
    out.totalMs += durationMs;
    out[classifyReasons(start.blockReasons)] += durationMs;
  }
  return out;
}

function addRecords(target: Record<string, number>, source: AnyRecord | undefined): void {
  for (const [key, value] of Object.entries(source ?? {})) {
    if (typeof value === "number" && Number.isFinite(value)) target[key] = (target[key] ?? 0) + value;
  }
}

function runRow(summaryPath: string, root: string): RunRow | null {
  let summary: AnyRecord;
  try {
    summary = JSON.parse(readFileSync(summaryPath, "utf8")) as AnyRecord;
  } catch {
    return null;
  }
  if (!summary.run?.runId || !summary.run.routeId) return null;
  const routeId = summary.run.routeId as string;
  const className = ROUTE_CLASS[routeId] ?? routeId;
  const allMasteryMs = milestoneAt(summary, "all-biomes-maxed");
  const events = eventsFor(summaryPath);
  const upgrades = (summary.economy?.gearTimeline?.upgrades ?? []).filter(
    (entry: AnyRecord) => entry.success !== false && entry.newLevel === 5,
  );
  const firstPlus5 = upgrades.length > 0
    ? Math.min(...upgrades.map((entry: AnyRecord) => Number(entry.atMs)))
    : null;
  const attemptResults = summary.bosses?.attemptResults ?? [];
  const gainedEssence: Record<string, number> = {};
  for (const byBiome of Object.values(summary.economy?.essenceGainedByBiome ?? {})) addRecords(gainedEssence, byBiome as AnyRecord);
  const snapshots = summary.snapshots ?? {};
  const runDir = dirname(summaryPath);
  const pathFromRoot = (file: string | undefined): string | null =>
    file ? relative(root, join(runDir, file)) : null;
  const mastery: Record<string, number | null> = {};
  for (const biome of BIOMES) mastery[biome] = milestoneAt(summary, `${biome}-maxed`);
  return {
    runId: summary.run.runId,
    routeId,
    className,
    canonical: summary.run.canonical === true,
    completion: summary.run.completion,
    durationMs: Number(summary.run.durationMs ?? 0),
    mastery,
    allMasteryMs,
    blocksBeforeMastery: blocksBefore(events, allMasteryMs),
    plus5: {
      count: upgrades.length,
      firstMs: firstPlus5,
      afterMasteryCount: upgrades.filter((entry: AnyRecord) => allMasteryMs !== null && Number(entry.atMs) >= allMasteryMs).length,
    },
    bosses: {
      attemptsMs: attemptResults.reduce((sum: number, entry: AnyRecord) => sum + Number(entry.totalAttemptDurationMs ?? 0), 0),
      combatMs: attemptResults.reduce((sum: number, entry: AnyRecord) => sum + Number(entry.bossCombatDurationMs ?? 0), 0),
      victories: Number(summary.bosses?.victories ?? 0),
    },
    deaths: Number(summary.deaths?.total ?? 0),
    stallReason: summary.run.stallReason,
    essence: {
      gained: gainedEssence,
      spent: { ...(summary.economy?.essenceSpentByType ?? {}) },
      final: { ...(summary.economy?.finalEssences ?? {}) },
    },
    catalysts: {
      gained: { ...(summary.economy?.catalystsGainedByFamily ?? {}) },
      spent: { ...(summary.economy?.catalystsSpentByFamily ?? {}) },
      final: { ...(summary.economy?.finalCatalysts ?? {}) },
    },
    snapshots: {
      a: pathFromRoot(snapshots.snapshotA?.file),
      b: pathFromRoot(snapshots.snapshotB?.file),
    },
  };
}

function numbers(values: Array<number | null | undefined>): number[] {
  return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function stats(values: Array<number | null | undefined>): AnyRecord {
  const sorted = numbers(values).sort((a, b) => a - b);
  if (sorted.length === 0) return { n: 0, meanMs: null, medianMs: null, minMs: null, maxMs: null };
  const meanMs = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  const middle = Math.floor(sorted.length / 2);
  const medianMs = sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
  return { n: sorted.length, meanMs, medianMs, minMs: sorted[0], maxMs: sorted[sorted.length - 1] };
}

function formatMs(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const totalSeconds = Math.round(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h${String(minutes).padStart(2, "0")}m${String(seconds).padStart(2, "0")}s`;
}

function formatStat(value: AnyRecord): string {
  return value.n === 0
    ? "—"
    : `${formatMs(value.meanMs)} / ${formatMs(value.medianMs)} / ${formatMs(value.minMs)}–${formatMs(value.maxMs)}`;
}

function sumField(rows: RunRow[], getter: (row: RunRow) => number): number {
  return rows.reduce((sum, row) => sum + getter(row), 0);
}

function mapTotals(rows: RunRow[], getter: (row: RunRow) => Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) addRecords(out, getter(row));
  return out;
}

function mapMarkdown(values: Record<string, number>): string {
  const entries = Object.entries(values).sort(([a], [b]) => a.localeCompare(b));
  return entries.length === 0 ? "—" : entries.map(([key, value]) => `${key} ${value}`).join(", ");
}

function classReport(rows: RunRow[]): AnyRecord {
  const out: AnyRecord = {};
  for (const className of CANONICAL_CLASSES) {
    const classRows = rows.filter((row) => row.className === className);
    out[className] = {
      runCount: classRows.length,
      canonicalCount: classRows.filter((row) => row.canonical).length,
      masterySnapshotACount: classRows.filter((row) => row.snapshots.a !== null).length,
      handoffSnapshotBCount: classRows.filter((row) => row.snapshots.b !== null).length,
      routeCompletionCount: classRows.filter((row) => row.completion === "completed").length,
      timeToAllMastery: stats(classRows.map((row) => row.allMasteryMs)),
      timeToBiomeMastery: Object.fromEntries(BIOMES.map((biome) => [biome, stats(classRows.map((row) => row.mastery[biome]))])),
      resourceBlocksBeforeMasteryMs: {
        total: sumField(classRows, (row) => row.blocksBeforeMastery.totalMs),
        essenceOnly: sumField(classRows, (row) => row.blocksBeforeMastery.essenceOnlyMs),
        catalystOnly: sumField(classRows, (row) => row.blocksBeforeMastery.catalystOnlyMs),
        mixed: sumField(classRows, (row) => row.blocksBeforeMastery.mixedMs),
        gateOnly: sumField(classRows, (row) => row.blocksBeforeMastery.gateOnlyMs),
        other: sumField(classRows, (row) => row.blocksBeforeMastery.otherMs),
      },
      plus5FirstMs: stats(classRows.map((row) => row.plus5.firstMs)),
      plus5Count: sumField(classRows, (row) => row.plus5.count),
      plus5AfterMasteryCount: sumField(classRows, (row) => row.plus5.afterMasteryCount),
      bossAttemptMs: stats(classRows.map((row) => row.bosses.attemptsMs)),
      bossCombatMs: stats(classRows.map((row) => row.bosses.combatMs)),
      deaths: { total: sumField(classRows, (row) => row.deaths), mean: sumField(classRows, (row) => row.deaths) / Math.max(1, classRows.length) },
      essenceGained: mapTotals(classRows, (row) => row.essence.gained),
      essenceSpent: mapTotals(classRows, (row) => row.essence.spent),
      finalEssence: mapTotals(classRows, (row) => row.essence.final),
      catalystsGained: mapTotals(classRows, (row) => row.catalysts.gained),
      catalystsSpent: mapTotals(classRows, (row) => row.catalysts.spent),
      finalCatalysts: mapTotals(classRows, (row) => row.catalysts.final),
    };
  }
  return out;
}

function markdown(report: AnyRecord): string {
  const rows = report.runs as RunRow[];
  const classes = report.byClass as AnyRecord;
  const lines: string[] = [
    `# Final T1 Economy Validation — Candidate F`,
    "",
    `Generated: ${report.generatedAt}`,
    `Raw cohort: \`${report.rawRoot}\``,
    `Runs discovered: **${rows.length} / ${report.expectedRuns} expected**; cohort complete: **${report.cohortComplete ? "yes" : "no"}**; canonical: **${rows.filter((row) => row.canonical).length}**; Snapshot A: **${rows.filter((row) => row.snapshots.a).length}**; Snapshot B: **${rows.filter((row) => row.snapshots.b).length}**.`,
    "",
    "## Live configuration",
    "",
    `Configuration consistent across run headers: **${report.configurationClean ? "yes" : "no"}**. Reward multiplier values: ${report.rewardMultipliers.join(", ") || "none"}.`,
    `Candidate: \`${report.candidate?.id ?? "missing"}\` / \`${report.candidate?.revision ?? "missing"}\`, arm **${report.candidate?.arm ?? "?"}**, T1 XP **${report.candidate?.t1BiomeXpRewardMultiplier ?? "?"}×**, essence **${report.candidate?.t1BiomeEssenceRewardMultiplier ?? "?"}×**, +5 **${report.candidate?.t1Plus5EssenceCostMultiplier ?? "?"}×**, catalyst threshold **${report.candidate?.catalystProgressPerUnitT1 ?? "?"}**, catalyst debug scaling **${report.candidate?.catalystsScaledByRewardMultiplier ? "on" : "off"}**.`,
    "",
    "## Time to all T1 mastery",
    "",
    "Mean / median / min–max are over runs with a recorded `all-biomes-maxed` boundary; boss time is excluded.",
    "",
    "| Class | Runs / A / B / full | Mean / median / min–max |",
    "|---|---:|---:|",
  ];
  for (const [className, value] of Object.entries(classes)) {
    lines.push(`| ${className} | ${value.runCount} / ${value.masterySnapshotACount} / ${value.handoffSnapshotBCount} / ${value.routeCompletionCount} | ${formatStat(value.timeToAllMastery)} |`);
  }
  lines.push(`| **Aggregate** | **${rows.length} / ${rows.filter((row) => row.snapshots.a).length} / ${rows.filter((row) => row.snapshots.b).length} / ${rows.filter((row) => row.completion === "completed").length}** | **${formatStat(report.aggregate.timeToAllMastery)}** |`);
  lines.push("", "### Each biome cap", "", "| Class | Plains | Forest | Swamp | Mountain | Cave |", "|---|---:|---:|---:|---:|---:|");
  for (const [className, value] of Object.entries(classes)) {
    lines.push(`| ${className} | ${formatStat(value.timeToBiomeMastery.plains)} | ${formatStat(value.timeToBiomeMastery.forest)} | ${formatStat(value.timeToBiomeMastery.swamp)} | ${formatStat(value.timeToBiomeMastery.mountain)} | ${formatStat(value.timeToBiomeMastery.cave)} |`);
  }
  lines.push(`| **Aggregate** | ${formatStat(report.aggregate.timeToBiomeMastery.plains)} | ${formatStat(report.aggregate.timeToBiomeMastery.forest)} | ${formatStat(report.aggregate.timeToBiomeMastery.swamp)} | ${formatStat(report.aggregate.timeToBiomeMastery.mountain)} | ${formatStat(report.aggregate.timeToBiomeMastery.cave)} |`);
  lines.push("", "## Economy and boss separation", "", "| Class | Blocks before A: total / essence-only / catalyst-only / mixed | +5 first / count / after A | Boss attempt / combat | Deaths |", "|---|---:|---:|---:|---:|");
  for (const [className, value] of Object.entries(classes)) {
    const b = value.resourceBlocksBeforeMasteryMs;
    lines.push(`| ${className} | ${formatMs(b.total)} / ${formatMs(b.essenceOnly)} / ${formatMs(b.catalystOnly)} / ${formatMs(b.mixed)} | ${formatStat(value.plus5FirstMs)} / ${value.plus5Count} / ${value.plus5AfterMasteryCount} | ${formatStat(value.bossAttemptMs)} / ${formatStat(value.bossCombatMs)} | ${value.deaths.total} (${value.deaths.mean.toFixed(1)}/run) |`);
  }
  const b = report.aggregate.resourceBlocksBeforeMasteryMs;
  lines.push(`| **Aggregate** | **${formatMs(b.total)} / ${formatMs(b.essenceOnly)} / ${formatMs(b.catalystOnly)} / ${formatMs(b.mixed)}** | **${formatStat(report.aggregate.plus5FirstMs)} / ${report.aggregate.plus5Count} / ${report.aggregate.plus5AfterMasteryCount}** | **${formatStat(report.aggregate.bossAttemptMs)} / ${formatStat(report.aggregate.bossCombatMs)}** | **${report.aggregate.deaths.total} (${report.aggregate.deaths.mean.toFixed(1)}/run)** |`);
  lines.push("", "## Wallet distributions", "", "Values below are aggregate sums across runs; per-run raw values remain in `cohort-report.json`.", "", `- Essence gained by colour: ${mapMarkdown(report.aggregate.essenceGained)}`,
    `- Essence spent by colour: ${mapMarkdown(report.aggregate.essenceSpent)}`,
    `- Final essence wallets: ${mapMarkdown(report.aggregate.finalEssence)}`,
    `- Catalysts gained by family: ${mapMarkdown(report.aggregate.catalystsGained)}`,
    `- Catalysts spent by family: ${mapMarkdown(report.aggregate.catalystsSpent)}`,
    `- Final catalyst wallets: ${mapMarkdown(report.aggregate.finalCatalysts)}`,
    "",
    "## Assessment",
    "",
    `The cohort is mechanically clean: ${report.configurationClean ? "all discovered run headers agree with Candidate F and rewardMultiplier=1" : "header/configuration mismatches require exclusion"}. No new balance adjustment is inferred here; use the mastery and block distributions for the freeze decision. Boss/dungeon work is reported separately and is not included in the primary mastery statistic.`,
    "",
    "## Artifacts",
    "",
    `- Raw events/deaths/summaries: \`${report.rawRoot}\``,
    `- Machine-readable report: \`${report.jsonPath}\``,
    "- Snapshot A/B paths are listed per run in the JSON report and each run's `snapshot-index.json`.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

function aggregateReport(rows: RunRow[]): AnyRecord {
  return {
    timeToAllMastery: stats(rows.map((row) => row.allMasteryMs)),
    timeToBiomeMastery: Object.fromEntries(BIOMES.map((biome) => [biome, stats(rows.map((row) => row.mastery[biome]))])),
    resourceBlocksBeforeMasteryMs: {
      total: sumField(rows, (row) => row.blocksBeforeMastery.totalMs),
      essenceOnly: sumField(rows, (row) => row.blocksBeforeMastery.essenceOnlyMs),
      catalystOnly: sumField(rows, (row) => row.blocksBeforeMastery.catalystOnlyMs),
      mixed: sumField(rows, (row) => row.blocksBeforeMastery.mixedMs),
      gateOnly: sumField(rows, (row) => row.blocksBeforeMastery.gateOnlyMs),
      other: sumField(rows, (row) => row.blocksBeforeMastery.otherMs),
    },
    plus5FirstMs: stats(rows.map((row) => row.plus5.firstMs)),
    plus5Count: sumField(rows, (row) => row.plus5.count),
    plus5AfterMasteryCount: sumField(rows, (row) => row.plus5.afterMasteryCount),
    bossAttemptMs: stats(rows.map((row) => row.bosses.attemptsMs)),
    bossCombatMs: stats(rows.map((row) => row.bosses.combatMs)),
    deaths: { total: sumField(rows, (row) => row.deaths), mean: sumField(rows, (row) => row.deaths) / Math.max(1, rows.length) },
    essenceGained: mapTotals(rows, (row) => row.essence.gained),
    essenceSpent: mapTotals(rows, (row) => row.essence.spent),
    finalEssence: mapTotals(rows, (row) => row.essence.final),
    catalystsGained: mapTotals(rows, (row) => row.catalysts.gained),
    catalystsSpent: mapTotals(rows, (row) => row.catalysts.spent),
    finalCatalysts: mapTotals(rows, (row) => row.catalysts.final),
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.root ?? "bot/runs/t1-candidate-f-final-2026-09-03");
  const summaryPaths = findSummaryFiles(root);
  const rows = summaryPaths
    .map((path) => runRow(path, root))
    .filter((row): row is RunRow => row !== null)
    .sort((a, b) => a.routeId.localeCompare(b.routeId) || a.runId.localeCompare(b.runId));
  const candidates = rows.map((row) => {
    const summaryPath = summaryPaths.find((path) => path.endsWith(`${row.runId}\\summary.json`) || path.endsWith(`${row.runId}/summary.json`));
    if (!summaryPath) return null;
    try {
      return JSON.parse(readFileSync(summaryPath, "utf8")).run.economyCandidate;
    } catch {
      return null;
    }
  }).filter(Boolean);
  const candidateJson = candidates[0] ?? null;
  const candidateStable = candidates.every((candidate) => JSON.stringify(candidate) === JSON.stringify(candidateJson));
  const rewardMultipliers = [...new Set(summaryPaths.flatMap((path) => {
    try { return [JSON.parse(readFileSync(path, "utf8")).run.rewardMultiplier]; } catch { return []; }
  }).filter((value) => typeof value === "number"))].sort((a, b) => a - b);
  const configurationClean = candidateStable && rewardMultipliers.length === 1 && rewardMultipliers[0] === 1 && rows.every((row) => row.canonical);
  const expectedRuns = Number(args.expected ?? "30");
  const jsonPath = resolve(args.json ?? join(root, "cohort-report.json"));
  const mdPath = resolve(args.report ?? join(root, "final-t1-economy-report.md"));
  const report: AnyRecord = {
    generatedAt: new Date().toISOString(),
    rawRoot: root,
    jsonPath,
    markdownPath: mdPath,
    candidate: candidateJson,
    rewardMultipliers,
    configurationClean,
    expectedRuns,
    cohortComplete: rows.length === expectedRuns,
    byClass: classReport(rows),
    aggregate: aggregateReport(rows),
    runs: rows,
  };
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(mdPath, markdown(report), "utf8");
  console.log(`[t1-report] ${rows.length} runs -> ${mdPath}`);
}

main();
