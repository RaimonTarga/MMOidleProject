#!/usr/bin/env tsx
import {
  ESSENCE_TYPES,
  PACE_FAMILIES,
  SKILL_TREE,
  ITEM_DATABASE,
  getMaxUpgrade,
} from '@mmo-idle/shared';
import {
  BALANCE_JSONL_SCHEMA_VERSION,
  type BalanceCliArgs,
  type BalanceGearInfo,
  type BalanceJsonlFarm,
  type BalanceJsonlMatch,
  type BalanceJsonlMeta,
  type BalanceOutputFormat,
  type BalancePerkInfo,
  type BalanceRunResult,
  type BuildSpec,
  type FarmRunResult,
  type GearSlot,
} from './balance/types';
import {
  countBalanceMatrix,
  iterateBalanceMatrix,
  type MatrixEntry,
} from './balance/runMatrix';
import {
  countFarmMatrix,
  enumerateFarmPairs,
  iterateFarmMatrix,
  type FarmMatrixEntry,
} from './balance/farmMatrix';
import {
  enumerateBuildsForContentTier,
  enumerateOverlordTargets,
} from './balance/progression';
import { runOverlordMatch } from './balance/runMatch';
import { runFarm } from './balance/runFarm';
import { computeBalanceScore } from './balance/scoring';
import type { BenchMode } from './balance/types';
import { ensureBenchHitboxCache } from './harness';

const DEFAULT_TIERS = [0, 1, 2, 3, 4];
const MAX_TIME_SCALE = 10;
/** Overlords are ~20-min fights; default the solo-boss cap up when in that mode. */
const OVERLORD_DEFAULT_MAX_SECONDS = 1500;
/** Farm runs measure a RATE, so they want a long wall: one simulated hour. */
const FARM_DEFAULT_MAX_SECONDS = 3600;
/**
 * Fidelity ceiling for farm income, MEASURED (2026-08-02) with `--scale-sweep`
 * over 1 simulated hour, on plains T1 and cave T3. Drift vs scale 1:
 *
 *   scale 2 → −1%    scale 3 → −6%    scale 5 → −5..18%    scale 10 → −29..32%
 *
 * `dt = 100ms × timeScale`, so a coarse tick quantizes attack cadence downward:
 * a 700ms swing resolves once per 1000ms tick instead of ~1.4 times. Throughput
 * — and therefore every income rate — decays monotonically with the scale. Run
 * to run noise at 1 sim hour is ~1-2%, so scale 2 is inside the noise and
 * everything above 2 is a real, one-directional understatement.
 */
const FARM_MAX_TRUSTED_TIME_SCALE = 2;

function parseMode(raw: string): BenchMode {
  if (raw === 'boss' || raw === 'overlord' || raw === 'farm') return raw;
  throw new Error('Invalid --mode (use boss, overlord or farm)');
}

function printUsage(): void {
  console.error(`Usage: tsx bench/balanceRun.ts [options]

Options:
  --mode <boss|overlord|farm>
                         boss = solo dungeon-boss matrix; overlord = 4-bot party;
                         farm = open-world income rates (default: boss)
  --tier <n>[,<n>...]   Content tiers (default: 0,1,2,3,4)
  --biome <group>        Filter biome group (e.g. forest, clearing)
  --class <root-id>      Filter class root (e.g. cadence-root)
  --build <build-id>     Exact build id (skill path joined with +)
  --format <csv|jsonl>   Output format (default: csv)
  --dry-run              Print run_meta (with expectedMatches) as JSON, then exit
  --all-paths            Enumerate every perk combination (full T3 depth, all tiers)
  --log                  Capture fight log (use with --build for single match)
  --time-scale <n>       Sim acceleration multiplier (default: 5, max: 10;
                         farm mode defaults to 2 — its measured fidelity ceiling)
  --max-seconds <n>      Sim-time timeout per match (default: 600)
  --single               Run one build × one target then exit
  --sample <n>           Overlord only: cap to n randomly-sampled party scenarios
                         (stratified across classes, optimized builds first; 0 = all)
  --party <id,id,...>    Overlord only: reconstruct this exact party and run a single
                         logged match (use with --biome/--tier/--log). Skips the matrix.
  --shard-count <n>      Total shards for parallel runs (default: 1)
  --shard-index <n>      This shard's index, 0-based (default: 0). Each shard
                         simulates entries where globalIndex %% shardCount == n

Farm-mode options (--mode farm):
  --node <node-id>       Farm this exact open-world node instead of the per-biome
                         representatives (e.g. node-t1-plains-03)
  --hours <n>            Simulated hours per run (default: 1). Alias for
                         --max-seconds n*3600
  --all-builds           Run every enumerated build instead of one per class root
  --scale-sweep <n,...>  Re-run the FIRST (build x node) pair at each time scale
                         and report how far the rates drift. This is the
                         trust-check for fast runs; slowest scale is the baseline
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
    allBuilds: false,
  };
  let maxSecondsProvided = false;
  let timeScaleProvided = false;

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
      timeScaleProvided = true;
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
    } else if (arg === '--node' && argv[i + 1]) {
      args.farmNodeId = argv[++i];
    } else if (arg === '--hours' && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid --hours');
      args.maxSimSeconds = n * 3600;
      maxSecondsProvided = true;
    } else if (arg === '--all-builds') {
      args.allBuilds = true;
    } else if (arg === '--scale-sweep' && argv[i + 1]) {
      const scales = argv[++i]
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= MAX_TIME_SCALE);
      if (scales.length < 2) {
        throw new Error(
          `Invalid --scale-sweep (need >= 2 scales in 1..${MAX_TIME_SCALE})`,
        );
      }
      args.scaleSweep = [...new Set(scales)].sort((a, b) => a - b);
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
  if (args.mode === 'farm') {
    if (!maxSecondsProvided) args.maxSimSeconds = FARM_DEFAULT_MAX_SECONDS;
    // Income rates decay with the time scale (see FARM_MAX_TRUSTED_TIME_SCALE),
    // so farm mode defaults to the measured ceiling rather than the fight
    // bench's 5. A sweep is exempt: probing the unusable scales is its job.
    if (!timeScaleProvided) {
      args.timeScale = FARM_MAX_TRUSTED_TIME_SCALE;
    } else if (args.timeScale > FARM_MAX_TRUSTED_TIME_SCALE && !args.scaleSweep) {
      console.error(
        `WARNING: --time-scale ${args.timeScale} understates farm income ` +
          `(measured: ~6% low at 3, ~30% low at 10). Rates above ` +
          `${FARM_MAX_TRUSTED_TIME_SCALE} are not trustworthy — re-check with ` +
          `--scale-sweep before authoring anything against these numbers.`,
      );
    }
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

const FARM_CSV_HEADER = [
  'build_id',
  'class_root',
  'biome_group',
  'content_tier',
  'node_id',
  'pace',
  'density',
  'mob_density',
  'sim_seconds',
  'time_scale',
  'kills',
  'kills_per_hr',
  'essence_per_hr',
  ...ESSENCE_TYPES.map((t) => `ess_${t}_per_hr`),
  'catalysts_per_hr',
  ...PACE_FAMILIES.map((f) => `cat_${f}_per_hr`),
  'biome_xp_per_hr',
  'biome_level_end',
  'biome_level_cap',
  'hours_to_biome_cap',
  'recipes_unlocked',
  'deaths',
  'deaths_per_hr',
  // Tells apart "the mobs were tanky" from "the bot never engaged" — the two
  // look identical in a low kills/hr on its own.
  'damage_dealt',
  'damage_taken',
].join(',');

/** Rates are read by eye; 2dp is plenty and keeps the CSV narrow. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function printFarmCsvRow(result: FarmRunResult): void {
  console.log(
    [
      result.buildId,
      result.classRoot,
      result.biomeGroup,
      result.contentTier,
      result.nodeId,
      result.pace ?? '',
      result.density ?? '',
      result.mobDensity,
      round2(result.simDurationMs / 1000),
      result.timeScale,
      result.kills,
      round2(result.killsPerHour),
      round2(result.essenceSumPerHour),
      ...ESSENCE_TYPES.map((t) => round2(result.essencePerHour[t] ?? 0)),
      round2(result.catalystSumPerHour),
      ...PACE_FAMILIES.map((f) => round2(result.catalystPerHour[f] ?? 0)),
      round2(result.biomeXpPerHour),
      result.biomeLevelEnd,
      result.biomeLevelCap,
      result.hoursToBiomeCap === null ? '' : round2(result.hoursToBiomeCap),
      result.recipesUnlocked,
      result.deaths,
      round2(result.deathsPerHour),
      result.damageDealt,
      result.damageTaken,
    ].join(','),
  );
}

function toJsonlFarm(entry: FarmMatrixEntry): BalanceJsonlFarm {
  return {
    ...entry.result,
    schemaVersion: BALANCE_JSONL_SCHEMA_VERSION,
    kind: 'farm',
    skillPath: entry.build.skillPath,
    perks: resolvePerks(entry.build.skillPath),
    gearItemIds: entry.build.gearItemIds,
    gear: resolveGear(entry.build.gearItemIds),
  };
}

function printFarmEntry(entry: FarmMatrixEntry, format: BalanceOutputFormat): void {
  if (format === 'jsonl') console.log(JSON.stringify(toJsonlFarm(entry)));
  else printFarmCsvRow(entry.result);
}

/**
 * The trust-check for fast runs. `dt = 100ms x timeScale`, so at scale 10 a
 * single tick is a whole second and attack timers, DoT ticks, movement, aggro
 * and the repopulation check all resolve in one lump. Re-run one fixed pair at
 * several scales: if the income rates hold, long fast sims can be believed; if
 * they move with the scale, they cannot.
 *
 * The SLOWEST scale is the baseline — it is the highest-fidelity run available,
 * closest to the live server's 100ms logic tick.
 */
function runScaleSweep(args: BalanceCliArgs): void {
  const [pair] = enumerateFarmPairs(args);
  if (!pair) {
    console.error('No farm pair to sweep for the given filters.');
    process.exit(1);
  }

  const results: FarmRunResult[] = [];
  if (args.format === 'csv') console.log(FARM_CSV_HEADER);
  for (const timeScale of args.scaleSweep!) {
    const result = runFarm(pair.build, pair.target, {
      maxSimSeconds: args.maxSimSeconds,
      timeScale,
    });
    results.push(result);
    printFarmEntry({ ...pair, result }, args.format);
  }

  const baseline = results[0];
  const drift = (pick: (r: FarmRunResult) => number): string => {
    const base = pick(baseline);
    if (base === 0) return pick(results[results.length - 1]) === 0 ? '0.0%' : 'n/a (baseline 0)';
    let worst = 0;
    for (const r of results) {
      worst = Math.max(worst, Math.abs(pick(r) - base) / base);
    }
    return `${(worst * 100).toFixed(1)}%`;
  };

  // stderr so the sweep summary never pollutes the CSV/JSONL on stdout.
  console.error(
    `\nscale sweep: ${pair.build.id} @ ${pair.target.nodeId} ` +
      `(${args.maxSimSeconds / 3600}h per run, baseline scale ${baseline.timeScale})\n` +
      `  kills/hr     max drift ${drift((r) => r.killsPerHour)}\n` +
      `  essence/hr   max drift ${drift((r) => r.essenceSumPerHour)}\n` +
      `  catalysts/hr max drift ${drift((r) => r.catalystSumPerHour)}\n` +
      `  biomeXP/hr   max drift ${drift((r) => r.biomeXpPerHour)}`,
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

  if (args.mode === 'farm') {
    const expectedFarm = args.scaleSweep
      ? args.scaleSweep.length
      : countFarmMatrix(args);

    if (args.dryRun) {
      printJsonlMeta(args, expectedFarm);
      return;
    }
    if (expectedFarm === 0) {
      console.error('No farm runs to perform for the given filters.');
      process.exit(1);
    }

    if (args.scaleSweep) {
      if (args.format === 'jsonl') printJsonlMeta(args, expectedFarm);
      runScaleSweep(args);
      return;
    }

    if (args.format === 'jsonl') printJsonlMeta(args, expectedFarm);
    else console.log(FARM_CSV_HEADER);
    for (const entry of iterateFarmMatrix(args)) {
      printFarmEntry(entry, args.format);
    }
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
