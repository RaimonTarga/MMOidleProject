import type {
  BalanceCliArgs,
  BalanceRunResult,
  BuildSpec,
  ContentTarget,
  MatrixFilter,
} from './types';
import {
  enumerateBuildsForContentTier,
  enumerateContentTargets,
} from './progression';
import { runBalanceMatch } from './runMatch';

/** One simulated match: a solo build against a boss. */
export interface MatrixEntry {
  /** The build that ran. */
  build: BuildSpec;
  result: BalanceRunResult;
}

function matrixFilter(args: BalanceCliArgs): MatrixFilter {
  return {
    classRoot: args.classRoot,
    biome: args.biome,
    build: args.buildId,
  };
}

function enumerateMatrixPairs(
  args: BalanceCliArgs,
): { build: BuildSpec; target: ContentTarget }[] {
  const filter = matrixFilter(args);
  const pairs: { build: BuildSpec; target: ContentTarget }[] = [];

  for (const target of enumerateContentTargets(args.tiers, filter)) {
    const builds = enumerateBuildsForContentTier(
      target.contentTier,
      target.biomeGroup,
      filter,
      args.allPaths,
    );
    for (const build of builds) {
      pairs.push({ build, target });
      if (args.single) return pairs;
    }
  }

  return pairs;
}

export function countBalanceMatrix(args: BalanceCliArgs): number {
  return enumerateMatrixPairs(args).length;
}

export function* iterateBalanceMatrix(
  args: BalanceCliArgs,
): Generator<MatrixEntry> {
  const matchOpts = {
    maxSimSeconds: args.maxSimSeconds,
    timeScale: args.timeScale,
    captureLog: args.captureLog,
  };

  // Parallel runs are split into shards: each shard process simulates only the
  // entries whose global index lands in its slice. Every shard still enumerates
  // the full (cheap) matrix so the partition is deterministic; only the matching
  // 1/N entries are actually simulated. Sharding is skipped for --single.
  const shardCount = Math.max(1, args.shardCount);
  const sharded = shardCount > 1 && !args.single;
  let globalIndex = 0;
  const inShard = (): boolean => {
    const take = !sharded || globalIndex % shardCount === args.shardIndex;
    globalIndex++;
    return take;
  };

  for (const { build, target } of enumerateMatrixPairs(args)) {
    if (!inShard()) continue;
    yield { build, result: runBalanceMatch(build, target, matchOpts) };
  }
}

export function runBalanceMatrix(args: BalanceCliArgs): BalanceRunResult[] {
  return [...iterateBalanceMatrix(args)].map(({ result }) => result);
}
