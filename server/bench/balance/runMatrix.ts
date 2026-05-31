import type {
  BalanceCliArgs,
  BalanceRunResult,
  BuildSpec,
  ContentTarget,
  MatrixFilter,
} from './types';
import {
  countDistinctClassParties,
  enumerateBuildsForContentTier,
  enumerateContentTargets,
  enumerateDistinctClassParties,
  enumerateOverlordTargets,
  sampleDistinctClassParties,
} from './progression';
import { runBalanceMatch, runOverlordMatch } from './runMatch';

/** One simulated match: a solo build (boss) or a party (overlord). */
export interface MatrixEntry {
  /** Representative build (solo build, or party leader for overlord runs). */
  build: BuildSpec;
  /** Full roster for overlord runs; undefined for solo boss runs. */
  party?: BuildSpec[];
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

function countOverlordMatrix(args: BalanceCliArgs): number {
  const filter = matrixFilter(args);
  let total = 0;
  for (const target of enumerateOverlordTargets(filter)) {
    // Parties span every class (no class filter on the pool); the selected class
    // is a lock — at least one party slot must be that class.
    const builds = enumerateBuildsForContentTier(
      target.contentTier,
      target.biomeGroup,
      undefined,
      args.allPaths,
    );
    const full = countDistinctClassParties(builds, args.classRoot);
    const comps = args.sampleSize > 0 ? Math.min(args.sampleSize, full) : full;
    if (args.single) return comps > 0 ? 1 : 0;
    total += comps;
  }
  return total;
}

export function countBalanceMatrix(args: BalanceCliArgs): number {
  if (args.mode === 'overlord') return countOverlordMatrix(args);
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

  if (args.mode === 'overlord') {
    const filter = matrixFilter(args);
    for (const target of enumerateOverlordTargets(filter)) {
      // Pool spans every class; `filter.classRoot` locks one slot rather than
      // narrowing the pool, and parties never repeat a class.
      const builds = enumerateBuildsForContentTier(
        target.contentTier,
        target.biomeGroup,
        undefined,
        args.allPaths,
      );
      const parties =
        args.sampleSize > 0
          ? sampleDistinctClassParties(builds, filter.classRoot, args.sampleSize)
          : enumerateDistinctClassParties(builds, filter.classRoot);
      for (const party of parties) {
        if (!inShard()) continue;
        yield {
          build: party[0],
          party,
          result: runOverlordMatch(party, target, matchOpts),
        };
        if (args.single) return;
      }
    }
    return;
  }

  for (const { build, target } of enumerateMatrixPairs(args)) {
    if (!inShard()) continue;
    yield { build, result: runBalanceMatch(build, target, matchOpts) };
  }
}

export function runBalanceMatrix(args: BalanceCliArgs): BalanceRunResult[] {
  return [...iterateBalanceMatrix(args)].map(({ result }) => result);
}
