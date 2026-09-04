import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { T1CharacterSnapshot } from "@mmo-idle/shared";
import { readT1CharacterSnapshot } from "../telemetry/t1Snapshots";

/**
 * Resolve a REAL Tier-1 handoff snapshot per class, from a directory of runs.
 *
 * ── Why a directory and not a path ─────────────────────────────────────────
 *
 * `--tierEntrySnapshot=<file>` names one snapshot, but a snapshot is
 * class-specific: it carries a class root, a frame, that class's gear and that
 * class's wallet. A six-class batch therefore cannot share one. This is the same
 * problem `--entryEconomy` solved for synthetic templates, and it gets the same
 * shape of answer — name the SOURCE, resolve the per-route artifact from it.
 *
 * ── Which snapshot, when a class has several ───────────────────────────────
 *
 * The MEDIAN by total essence carried. The wallet is the high-variance field by
 * construction: a Tier-1-completing character has nothing left to buy (every T1
 * item is at +5 and every T2 recipe gates above the T1 cap), so it accumulates
 * freely through the boss gauntlet and arrives with whatever that gauntlet's
 * length happened to bank. Taking the median rather than the first keeps one
 * unusually long or short T1 run from setting the entry state for the whole
 * Tier-2 cohort.
 *
 * Everything else in the snapshot — gear, upgrade levels, abilities, runes,
 * biome levels — should be near-identical across replicates of one route. When
 * it is not, that is a finding about Tier-1 route determinism, and
 * `describeSpread` surfaces it rather than letting it pass silently.
 */

export interface ResolvedSnapshot {
  classRoot: string;
  file: string;
  snapshot: T1CharacterSnapshot;
  /** Total essence carried, the statistic the median is taken over. */
  walletTotal: number;
}

export interface SnapshotDirIndex {
  /** Median-wallet snapshot per class root. */
  byClassRoot: Map<string, ResolvedSnapshot>;
  /** Every usable snapshot found, grouped, for reporting the spread. */
  allByClassRoot: Map<string, ResolvedSnapshot[]>;
  /** Files that looked like snapshots but could not be used, and why. */
  rejected: Array<{ file: string; reason: string }>;
}

function walk(dir: string, out: string[], depth = 0): void {
  if (depth > 8) return;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) walk(full, out, depth + 1);
    else if (entry === "snapshot-b.json") out.push(full);
  }
}

/**
 * Accept a repo-root-relative path even though `pnpm --filter` runs this from
 * `bot/`.
 *
 * The path a human has in hand is `bot/runs/<cohort>`, but the process cwd is
 * `bot/`, so that resolves to `bot/bot/runs/<cohort>` and finds nothing. Left
 * unhandled this fails SILENTLY -- `walk` simply returns no files, every class
 * reports "no usable handoff", and the whole cohort quietly falls back to
 * synthetic templates while looking like it ran correctly. That is exactly what
 * the first smoke run did. `t2Report.ts` already does this dance; so does this.
 */
function resolveSnapshotDir(dir: string): string {
  if (existsSync(dir)) return dir;
  const up = join("..", dir);
  return existsSync(up) ? up : dir;
}

function walletTotalOf(snapshot: T1CharacterSnapshot): number {
  return Object.values(snapshot.state.essences ?? {}).reduce(
    (sum, amount) => sum + (Number.isFinite(amount) ? amount : 0),
    0,
  );
}

/**
 * Index every `snapshot-b.json` under `dir`.
 *
 * A file that fails the converter's preconditions is RECORDED AND SKIPPED, never
 * thrown on: a batch must not die because one Tier-1 run in the source cohort
 * ended in a state the Tier-2 entry API cannot reproduce. The rejects are
 * reported so "no snapshot for this class" and "snapshots existed but none were
 * usable" stay distinguishable — they call for different responses.
 */
export function indexSnapshotDir(dir: string): SnapshotDirIndex {
  const files: string[] = [];
  walk(resolveSnapshotDir(dir), files);

  const allByClassRoot = new Map<string, ResolvedSnapshot[]>();
  const rejected: Array<{ file: string; reason: string }> = [];

  for (const file of files) {
    let snapshot: T1CharacterSnapshot;
    try {
      snapshot = readT1CharacterSnapshot(file);
    } catch (error) {
      rejected.push({ file, reason: error instanceof Error ? error.message : String(error) });
      continue;
    }
    if (snapshot.snapshotKind !== "tier2-handoff") {
      rejected.push({ file, reason: `snapshotKind is ${snapshot.snapshotKind}, not tier2-handoff` });
      continue;
    }
    const classRoot = snapshot.state.classRoot ?? snapshot.classRoot;
    if (!classRoot) {
      rejected.push({ file, reason: "snapshot has no class root" });
      continue;
    }
    const list = allByClassRoot.get(classRoot) ?? [];
    list.push({ classRoot, file, snapshot, walletTotal: walletTotalOf(snapshot) });
    allByClassRoot.set(classRoot, list);
  }

  const byClassRoot = new Map<string, ResolvedSnapshot>();
  for (const [classRoot, list] of allByClassRoot) {
    // Lower-middle on an even count, so the choice is deterministic and
    // reproducible from the same directory rather than order-dependent.
    const sorted = [...list].sort(
      (a, b) => a.walletTotal - b.walletTotal || a.file.localeCompare(b.file),
    );
    byClassRoot.set(classRoot, sorted[Math.floor((sorted.length - 1) / 2)]);
  }

  return { byClassRoot, allByClassRoot, rejected };
}

/**
 * Human-readable account of what the directory yielded, for the batch log.
 *
 * Prints the per-class spread because a wide one is itself evidence: identical
 * routes that finish Tier 1 with very different wallets mean the tier's pacing
 * is schedule-dependent, and every downstream Tier-2 economy reading inherits
 * that variance.
 */
export function describeSpread(index: SnapshotDirIndex): string {
  const lines: string[] = [];
  for (const [classRoot, list] of [...index.allByClassRoot].sort()) {
    const chosen = index.byClassRoot.get(classRoot);
    const totals = list.map((entry) => entry.walletTotal).sort((a, b) => a - b);
    lines.push(
      `  ${classRoot}: ${list.length} snapshot(s), essence totals [${totals.join(", ")}], ` +
        `median ${chosen?.walletTotal ?? "n/a"}`,
    );
  }
  for (const reject of index.rejected) {
    lines.push(`  REJECTED ${reject.file}: ${reject.reason}`);
  }
  return lines.length > 0 ? lines.join("\n") : "  (no usable snapshots found)";
}
