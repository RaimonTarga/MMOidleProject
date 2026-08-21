import {
  enumerateBuildsForContentTier,
  representativeBuildsPerClass,
} from './progression';
import {
  enumerateFarmTargets,
  farmTargetForNode,
  type FarmTarget,
} from './farmTargets';
import { runFarm } from './runFarm';
import type {
  BalanceCliArgs,
  BuildSpec,
  FarmRunResult,
  MatrixFilter,
} from './types';

/** One simulated farm run: a build farming a node for a stretch of sim time. */
export interface FarmMatrixEntry {
  build: BuildSpec;
  target: FarmTarget;
  result: FarmRunResult;
}

function matrixFilter(args: BalanceCliArgs): MatrixFilter {
  return {
    classRoot: args.classRoot,
    biome: args.biome,
    build: args.buildId,
  };
}

function farmTargets(args: BalanceCliArgs): FarmTarget[] {
  if (args.farmNodeId) return [farmTargetForNode(args.farmNodeId)];
  return enumerateFarmTargets(args.tiers, matrixFilter(args));
}

export function enumerateFarmPairs(
  args: BalanceCliArgs,
): { build: BuildSpec; target: FarmTarget }[] {
  const filter = matrixFilter(args);
  const pairs: { build: BuildSpec; target: FarmTarget }[] = [];

  for (const target of farmTargets(args)) {
    const builds = args.allBuilds
      ? enumerateBuildsForContentTier(
          target.contentTier,
          target.biomeGroup,
          filter,
          args.allPaths,
        )
      : representativeBuildsPerClass(
          target.contentTier,
          target.biomeGroup,
          filter,
        );
    for (const build of builds) {
      pairs.push({ build, target });
      if (args.single) return pairs;
    }
  }

  return pairs;
}

export function countFarmMatrix(args: BalanceCliArgs): number {
  // A gear sweep multiplies the run count: every pair runs once per level.
  return enumerateFarmPairs(args).length * Math.max(1, args.gearSweep?.length ?? 1);
}

export function* iterateFarmMatrix(
  args: BalanceCliArgs,
): Generator<FarmMatrixEntry> {
  const shardCount = Math.max(1, args.shardCount);
  const sharded = shardCount > 1 && !args.single;
  let globalIndex = 0;

  // `undefined` = one run at the bench default (fully upgraded gear).
  const gearLevels: (number | undefined)[] = args.gearSweep ?? [undefined];

  for (const { build, target } of enumerateFarmPairs(args)) {
    const take = !sharded || globalIndex % shardCount === args.shardIndex;
    globalIndex++;
    if (!take) continue;
    for (const upgradeLevel of gearLevels) {
      yield {
        build,
        target,
        result: runFarm(build, target, {
          maxSimSeconds: args.maxSimSeconds,
          timeScale: args.timeScale,
          upgradeLevel,
        }),
      };
    }
  }
}
