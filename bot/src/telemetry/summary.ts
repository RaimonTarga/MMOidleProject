import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PlayerView } from "@mmo-idle/shared";
import type { Route } from "../route/types";
import type { CompletionState, RunHeader } from "./events";
import type { Recorder } from "./recorder";

/**
 * The compact machine-readable digest.
 *
 * Sized so another model can reason about a run without reading the raw event
 * stream, while every claim in it is drillable back into `events.jsonl` /
 * `deaths.jsonl`.
 */
export interface RunSummary {
  run: RunHeader & {
    endedAt: number;
    durationMs: number;
    completion: CompletionState;
    stallReason?: string;
    canonical: boolean;
  };
  progression: {
    finalPlayerTier: number;
    finalGlobalMastery: number;
    biomeLevels: Record<string, number>;
    bossesCleared: string[];
    milestonesReached: string[];
    routeStepsCompleted: number;
    routeStepsTotal: number;
  };
  biomes: Array<{
    biomeGroup: string;
    timeMs: number;
    travelMs: number;
    fightMs: number;
    deadMs: number;
    blockedOnResourceMs: number;
    kills: number;
    deaths: number;
    deathsPerHour: number;
    damageTaken: number;
    damageDealt: number;
    masteryGained: number;
    craftsCompleted: number;
    upgradesCompleted: number;
    essenceGained: Record<string, number>;
    catalystsByModifier: Record<string, number>;
    topDamageSources: Array<{ name: string; damage: number }>;
    topKills: Array<{ name: string; kills: number }>;
    averageConcurrency: number;
    maxConcurrency: number;
  }>;
  combat: {
    totalKills: number;
    totalDamageTaken: number;
    totalAbsorbed: number;
    totalHealed: number;
    hpLost: number;
    playerDamageDealt: number;
    summonDamageDealt: number;
    summonDamageShare: number;
    targetSwitches: number;
    topIncomingSources: Array<{ name: string; damage: number }>;
    incomingByDamageType: Record<string, number>;
    damagePerTarget: Array<{ name: string; damage: number }>;
    concurrency: {
      samples: number;
      solo: number;
      two: number;
      threePlus: number;
      unengaged: number;
    };
  };
  deaths: {
    total: number;
    perHour: number;
    byBiome: Record<string, number>;
    byDominantSource: Record<string, number>;
    byRouteStep: Record<string, number>;
  };
  bosses: {
    attempts: number;
    victories: number;
    successRate: number;
  };
  equipment: {
    finalLoadout: Record<string, string | null>;
    finalUpgrades: Record<string, number>;
    runesEquipped: unknown;
    abilitiesEquipped: unknown;
  };
  economy: {
    finalEssences: Record<string, number>;
    finalCatalysts: Record<string, number>;
    essenceGainedByBiome: Record<string, Record<string, number>>;
    totalBlockedOnResourceMs: number;
  };
  catalysts: {
    finalWallet: Record<string, number>;
    gainedByModifier: Record<string, number>;
  };
  world: {
    otherPlayersSeen: number;
    contestedSamples: number;
    contestedFraction: number;
  };
  stalls: Array<{ reason: string; detail?: Record<string, unknown> }>;
}

export function buildSummary(params: {
  header: RunHeader;
  recorder: Recorder;
  route: Route;
  self: PlayerView | null;
  completion: CompletionState;
  stallReason?: string;
  stalls: Array<{ reason: string; detail?: Record<string, unknown> }>;
  milestonesReached: string[];
  routeStepsCompleted: number;
  endedAt: number;
}): RunSummary {
  const { header, recorder, route, self } = params;
  const durationMs = params.endedAt - header.startedAt;
  const hours = durationMs / 3_600_000;

  const deathsByBiome: Record<string, number> = {};
  const deathsBySource: Record<string, number> = {};
  const deathsByStep: Record<string, number> = {};
  for (const death of recorder.allDeaths) {
    const biome = death.biomeGroup ?? "unknown";
    deathsByBiome[biome] = (deathsByBiome[biome] ?? 0) + 1;
    const source = death.dominantSource?.name ?? "unknown";
    deathsBySource[source] = (deathsBySource[source] ?? 0) + 1;
    deathsByStep[death.routeStepLabel] = (deathsByStep[death.routeStepLabel] ?? 0) + 1;
  }

  const essenceGainedByBiome: Record<string, Record<string, number>> = {};
  const catalystsByModifier: Record<string, number> = {};
  let totalKills = 0;
  let blockedTotal = 0;

  const biomes = recorder.biomeStats
    .sort((a, b) => b.timeMs - a.timeMs)
    .map((stats) => {
      totalKills += stats.kills;
      blockedTotal += stats.blockedMs;
      essenceGainedByBiome[stats.biomeGroup] = { ...stats.essenceGained } as Record<string, number>;
      for (const [modifier, amount] of Object.entries(stats.catalystsByModifier)) {
        catalystsByModifier[modifier] = (catalystsByModifier[modifier] ?? 0) + amount;
      }
      return {
        biomeGroup: stats.biomeGroup,
        timeMs: stats.timeMs,
        travelMs: stats.travelMs,
        fightMs: stats.fightMs,
        deadMs: stats.deadMs,
        blockedOnResourceMs: stats.blockedMs,
        kills: stats.kills,
        deaths: stats.deaths,
        deathsPerHour: stats.timeMs > 0 ? stats.deaths / (stats.timeMs / 3_600_000) : 0,
        damageTaken: round(stats.damageTaken),
        damageDealt: round(stats.damageDealt),
        masteryGained: round(stats.masteryGained),
        craftsCompleted: stats.craftsCompleted,
        upgradesCompleted: stats.upgradesCompleted,
        essenceGained: { ...stats.essenceGained } as Record<string, number>,
        catalystsByModifier: { ...stats.catalystsByModifier },
        topDamageSources: topDamage(stats.damageBySource, 5),
        topKills: topKills(stats.killsByMonster, 5),
        averageConcurrency:
          stats.concurrencySamples > 0
            ? round(stats.concurrencyTotal / stats.concurrencySamples)
            : 0,
        maxConcurrency: stats.maxConcurrency,
      };
    });

  const totalOut = recorder.totalDamageDealtByPlayer + recorder.totalDamageDealtBySummons;
  const samples = recorder.totalSamples;

  return {
    run: {
      ...header,
      endedAt: params.endedAt,
      durationMs,
      completion: params.completion,
      stallReason: params.stallReason,
      // The one flag a downstream analysis must respect before mixing this run
      // into balance conclusions.
      canonical: header.taints.length === 0,
    },
    progression: {
      finalPlayerTier: self?.playerTier ?? 0,
      finalGlobalMastery: self?.globalMastery ?? 0,
      biomeLevels: { ...(self?.biomeLevel ?? {}) },
      bossesCleared: [...(self?.bossesCleared ?? [])],
      milestonesReached: params.milestonesReached,
      routeStepsCompleted: params.routeStepsCompleted,
      routeStepsTotal: route.steps.length,
    },
    biomes,
    combat: {
      totalKills,
      totalDamageTaken: round(recorder.totalDamageTaken),
      totalAbsorbed: round(recorder.totalAbsorbed),
      totalHealed: round(recorder.totalHealed),
      hpLost: round(recorder.hpLost),
      playerDamageDealt: round(recorder.totalDamageDealtByPlayer),
      summonDamageDealt: round(recorder.totalDamageDealtBySummons),
      summonDamageShare: totalOut > 0 ? round(recorder.totalDamageDealtBySummons / totalOut) : 0,
      targetSwitches: recorder.targetSwitches,
      topIncomingSources: topDamage(recorder.damageInBySource, 10),
      incomingByDamageType: roundRecord(recorder.damageInByType),
      damagePerTarget: topDamage(recorder.damageOutByTarget, 10),
      concurrency: {
        samples,
        unengaged: recorder.concurrencyBuckets.zero,
        solo: recorder.concurrencyBuckets.one,
        two: recorder.concurrencyBuckets.two,
        threePlus: recorder.concurrencyBuckets.threePlus,
      },
    },
    deaths: {
      total: recorder.deathCount,
      perHour: hours > 0 ? round(recorder.deathCount / hours) : 0,
      byBiome: deathsByBiome,
      byDominantSource: deathsBySource,
      byRouteStep: deathsByStep,
    },
    bosses: {
      attempts: recorder.bossAttempts,
      victories: recorder.bossVictories,
      successRate:
        recorder.bossAttempts > 0 ? round(recorder.bossVictories / recorder.bossAttempts) : 0,
    },
    equipment: {
      finalLoadout: { ...(self?.equipment ?? {}) },
      finalUpgrades: { ...(self?.itemUpgrades ?? {}) },
      runesEquipped: self?.runesEquipped ?? [],
      abilitiesEquipped: self?.equippedAbilities ?? null,
    },
    economy: {
      finalEssences: { ...(self?.essences ?? {}) },
      finalCatalysts: { ...(self?.catalysts ?? {}) },
      essenceGainedByBiome,
      totalBlockedOnResourceMs: blockedTotal,
    },
    catalysts: {
      finalWallet: { ...(self?.catalysts ?? {}) },
      gainedByModifier: catalystsByModifier,
    },
    world: {
      otherPlayersSeen: recorder.otherPlayerSightings.size,
      contestedSamples: recorder.contestedSamples,
      contestedFraction: samples > 0 ? round(recorder.contestedSamples / samples) : 0,
    },
    stalls: params.stalls,
  };
}

export function writeSummary(dir: string, summary: RunSummary): string {
  const path = join(dir, "summary.json");
  writeFileSync(path, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  return path;
}

function rank(record: Record<string, number>, n: number): Array<[string, number]> {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function topDamage(
  record: Record<string, number>,
  n: number,
): Array<{ name: string; damage: number }> {
  return rank(record, n).map(([name, value]) => ({ name, damage: round(value) }));
}

function topKills(
  record: Record<string, number>,
  n: number,
): Array<{ name: string; kills: number }> {
  return rank(record, n).map(([name, value]) => ({ name, kills: value }));
}

function roundRecord(record: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, round(v)]));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
