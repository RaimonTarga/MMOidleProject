#!/usr/bin/env tsx
import { SKILL_TREE, ITEM_DATABASE, getMaxUpgrade } from '@mmo-idle/shared';
import {
  BALANCE_JSONL_SCHEMA_VERSION,
  type BalanceCliArgs,
  type BalanceGearInfo,
  type BalanceJsonlMatch,
  type BalanceJsonlMeta,
  type BalanceOutputFormat,
  type BalancePerkInfo,
  type BalanceRunResult,
  type BuildSpec,
  type GearSlot,
} from './balance/types';
import {
  countBalanceMatrix,
  iterateBalanceMatrix,
  type MatrixEntry,
} from './balance/runMatrix';
import {
  enumerateBuildsForContentTier,
  enumerateOverlordTargets,
} from './balance/progression';
import { runOverlordMatch } from './balance/runMatch';
import { computeBalanceScore } from './balance/scoring';
import type { BenchMode } from './balance/types';
import { ensureBenchHitboxCache } from './harness';

const DEFAULT_TIERS = [0, 1, 2, 3, 4];
const MAX_TIME_SCALE = 10;
/** Overlords are ~20-min fights; default the solo-boss cap up when in that mode. */
const OVERLORD_DEFAULT_MAX_SECONDS = 1500;

function parseMode(raw: string): BenchMode {
  if (raw === 'boss' || raw === 'overlord') return raw;
  throw new Error('Invalid --mode (use boss or overlord)');
}

function printUsage(): void {
  console.error(`Usage: tsx bench/balanceRun.ts [options]

Options:
  --mode <boss|overlord> boss = solo dungeon-boss matrix; overlord = 4-bot party (default: boss)
  --tier <n>[,<n>...]   Content tiers (default: 0,1,2,3,4)
  --biome <group>        Filter biome group (e.g. forest, clearing)
  --class <root-id>      Filter class root (e.g. cadence-root)
  --build <build-id>     Exact build id (skill path joined with +)
  --format <csv|jsonl>   Output format (default: csv)
  --dry-run              Print run_meta (with expectedMatches) as JSON, then exit
  --all-paths            Enumerate every perk combination (full T3 depth, all tiers)
  --log                  Capture fight log (use with --build for single match)
  --time-scale <n>       Sim acceleration multiplier (default: 5, max: 10)
  --max-seconds <n>      Sim-time timeout per match (default: 600)
  --single               Run one build × one target then exit
  --sample <n>           Overlord only: cap to n randomly-sampled party scenarios
                         (stratified across classes, optimized builds first; 0 = all)
  --party <id,id,...>    Overlord only: reconstruct this exact party and run a single
                         logged match (use with --biome/--tier/--log). Skips the matrix.
  --shard-count <n>      Total shards for parallel runs (default: 1)
  --shard-index <n>      This shard's index, 0-based (default: 0). Each shard
                         simulates entries where globalIndex %% shardCount == n
`);
}

function parseTiers(raw: string): number[] {
  const tiers = raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 4);
  if (tiers.length === 0) throw new Error('Invalid --tier value');
  return tiers;
}

function parseFormat(raw: string): BalanceOutputFormat {
  if (raw === 'csv' || raw === 'jsonl') return raw;
  throw new Error('Invalid --format (use csv or jsonl)');
}

function parseArgs(argv: string[]): BalanceCliArgs {
  const args: BalanceCliArgs = {
    mode: 'boss',
    tiers: DEFAULT_TIERS,
    timeScale: 5,
    maxSimSeconds: 600,
    single: false,
    format: 'csv',
    captureLog: false,
    dryRun: false,
    allPaths: false,
    shardIndex: 0,
    shardCount: 1,
    sampleSize: 0,
  };
  let maxSecondsProvided = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--mode' && argv[i + 1]) {
      args.mode = parseMode(argv[++i]);
    } else if (arg === '--tier' && argv[i + 1]) {
      args.tiers = parseTiers(argv[++i]);
    } else if (arg === '--biome' && argv[i + 1]) {
      args.biome = argv[++i];
    } else if (arg === '--class' && argv[i + 1]) {
      args.classRoot = argv[++i];
    } else if (arg === '--build' && argv[i + 1]) {
      args.buildId = argv[++i];
    } else if (arg === '--format' && argv[i + 1]) {
      args.format = parseFormat(argv[++i]);
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--all-paths') {
      args.allPaths = true;
    } else if (arg === '--log') {
      args.captureLog = true;
    } else if (arg === '--time-scale' && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n < 1) throw new Error('Invalid --time-scale');
      args.timeScale = Math.min(n, MAX_TIME_SCALE);
    } else if (arg === '--max-seconds' && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n < 1) throw new Error('Invalid --max-seconds');
      args.maxSimSeconds = n;
      maxSecondsProvided = true;
    } else if (arg === '--single') {
      args.single = true;
    } else if (arg === '--sample' && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 0) throw new Error('Invalid --sample');
      args.sampleSize = n;
    } else if (arg === '--shard-count' && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 1) throw new Error('Invalid --shard-count');
      args.shardCount = n;
    } else if (arg === '--shard-index' && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 0) throw new Error('Invalid --shard-index');
      args.shardIndex = n;
    } else if (arg === '--party' && argv[i + 1]) {
      // Build ids join skill nodes with `+`, never a comma — safe to split.
      args.partyIds = argv[++i]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (args.shardIndex >= args.shardCount) {
    throw new Error('--shard-index must be < --shard-count');
  }

  // Overlords are long fights — default the sim cap higher unless explicitly set.
  if (args.mode === 'overlord' && !maxSecondsProvided) {
    args.maxSimSeconds = OVERLORD_DEFAULT_MAX_SECONDS;
  }

  return args;
}

const CSV_HEADER = [
  'build_id',
  'biome_group',
  'content_tier',
  'node_id',
  'is_dungeon',
  'outcome',
  'sim_duration_ms',
  'ticks',
  'time_scale',
  'initial_mob_count',
  'damage_dealt',
  'damage_taken',
  'bot_hp_end',
  'max_hp',
].join(',');

function printCsvRow(result: BalanceRunResult): void {
  console.log(
    [
      result.buildId,
      result.biomeGroup,
      result.contentTier,
      result.nodeId,
      result.isDungeon ? 1 : 0,
      result.outcome,
      result.simDurationMs,
      result.ticks,
      result.timeScale,
      result.initialMobCount,
      result.damageDealt,
      result.damageTaken,
      result.botHpEnd,
      result.maxHp,
    ].join(','),
  );
}

function resolvePerks(skillPath: string[]): BalancePerkInfo[] {
  return skillPath.map((id) => {
    const node = SKILL_TREE.get(id);
    return {
      id,
      name: node?.name ?? id,
      tier: node?.tier ?? 0,
      description: node?.description ?? '',
    };
  });
}

function resolveGear(
  gearItemIds: Partial<Record<GearSlot, string>>,
): BalanceGearInfo[] {
  const gear: BalanceGearInfo[] = [];
  for (const slot of Object.keys(gearItemIds) as GearSlot[]) {
    const itemId = gearItemIds[slot];
    if (!itemId) continue;
    const def = ITEM_DATABASE.get(itemId);
    gear.push({
      slot,
      itemId,
      name: def?.name ?? itemId,
      tier: def?.tier ?? 0,
      upgradeLevel: def ? getMaxUpgrade(def) : 0,
      stats: def?.statModifiers ?? {},
      mechanicEffects: def?.mechanicEffects,
      upgrades: (def?.upgrades ?? []).map((step, idx) => ({
        level: idx + 1,
        stats: step.stats as Record<string, number> | undefined,
        mechanicEffects: step.mechanicEffects,
        cost: step.cost,
        requiredBiomeLevel: step.requiredBiomeLevel,
      })),
    });
  }
  return gear;
}

function toJsonlMatch(entry: MatrixEntry): BalanceJsonlMatch {
  const { build, result, party } = entry;
  const seconds = result.simDurationMs / 1000;
  const maxHp = result.maxHp;
  const base = {
    ...result,
    schemaVersion: BALANCE_JSONL_SCHEMA_VERSION,
    kind: 'match' as const,
    gearItemIds: build.gearItemIds,
    // All party members run the same tier loadout, so gear is shared.
    gear: resolveGear(build.gearItemIds),
    balance: computeBalanceScore(result),
    dps: seconds > 0 ? result.damageDealt / seconds : 0,
    incomingDps: seconds > 0 ? result.damageTaken / seconds : 0,
    hpFraction: maxHp > 0 ? result.botHpEnd / maxHp : 0,
  };

  if (party) {
    return {
      ...base,
      classRoot: 'party',
      skillPath: [],
      perks: [],
      party: party.map((m) => ({
        buildId: m.id,
        classRoot: m.classRoot,
        skillPath: m.skillPath,
        perks: resolvePerks(m.skillPath),
      })),
    };
  }

  return {
    ...base,
    classRoot: build.classRoot,
    skillPath: build.skillPath,
    perks: resolvePerks(build.skillPath),
  };
}

function printJsonlMeta(args: BalanceCliArgs, expectedMatches: number): void {
  const meta: BalanceJsonlMeta = {
    schemaVersion: BALANCE_JSONL_SCHEMA_VERSION,
    kind: 'run_meta',
    mode: args.mode,
    expectedMatches,
    tiers: args.tiers,
    biome: args.biome,
    classRoot: args.classRoot,
    timeScale: args.timeScale,
    maxSimSeconds: args.maxSimSeconds,
  };
  console.log(JSON.stringify(meta));
}

function printJsonlMatch(entry: MatrixEntry): void {
  console.log(JSON.stringify(toJsonlMatch(entry)));
}

/**
 * On-demand re-run of one exact overlord party (by member build ids) with the
 * fight log captured. Used by the TUI detail screen — the matrix path can't
 * re-run a party via `--build/--class`, so we rebuild it from the pool here.
 */
function runPartyLog(args: BalanceCliArgs): void {
  const ids = args.partyIds ?? [];
  const candidates = enumerateOverlordTargets({ biome: args.biome });
  const target =
    candidates.find((t) => t.contentTier === args.tiers[0]) ?? candidates[0];
  if (!target) {
    console.error('No overlord target for the given --biome/--tier.');
    process.exit(1);
  }

  // At overlord (T4) content the realistic skill cap equals full depth, so this
  // pool matches whatever the original run produced regardless of --all-paths.
  const pool = enumerateBuildsForContentTier(
    target.contentTier,
    target.biomeGroup,
    undefined,
    args.allPaths,
  );
  const byId = new Map<string, BuildSpec>(pool.map((b) => [b.id, b]));
  const party: BuildSpec[] = [];
  for (const id of ids) {
    const build = byId.get(id);
    if (!build) {
      console.error(`Party build id not found in ${target.biomeGroup} pool: ${id}`);
      process.exit(1);
    }
    party.push(build);
  }
  const [leader] = party;
  if (!leader) {
    console.error('No --party build ids supplied.');
    process.exit(1);
  }

  const result = runOverlordMatch(party, target, {
    maxSimSeconds: args.maxSimSeconds,
    timeScale: args.timeScale,
    captureLog: true,
  });

  printJsonlMeta(args, 1);
  printJsonlMatch({ build: leader, party, result });
}

async function main(): Promise<void> {
  process.env.BALANCE_BENCH = '1';
  let args: BalanceCliArgs;
  try {
    const argv = process.argv.slice(2).filter((a) => a !== '--');
    args = parseArgs(argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    printUsage();
    process.exit(1);
  }

  // Bake/load sprite hitboxes before simulating so combat reach matches the live
  // server (see `ensureBenchHitboxCache`). Skipped for --dry-run (no simulation).
  if (!args.dryRun) {
    await ensureBenchHitboxCache();
  }

  // On-demand single-party re-run (TUI fight log): skip the matrix entirely.
  if (args.mode === 'overlord' && args.partyIds && args.partyIds.length > 0) {
    runPartyLog(args);
    return;
  }

  const expected = countBalanceMatrix(args);

  if (args.dryRun) {
    printJsonlMeta(args, expected);
    return;
  }

  if (expected === 0) {
    console.error('No matches to run for the given filters.');
    process.exit(1);
  }

  if (args.format === 'jsonl') {
    printJsonlMeta(args, expected);
    for (const entry of iterateBalanceMatrix(args)) {
      printJsonlMatch(entry);
    }
    return;
  }

  console.log(CSV_HEADER);
  for (const { result } of iterateBalanceMatrix(args)) {
    printCsvRow(result);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
