import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PlayerView } from "@mmo-idle/shared";
import type { Route } from "../route/types";
import type { CompletionState, RunHeader } from "./events";
import type { LeaseSessionEvidence } from "../concurrency/routeLeaseSession";
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
    attemptResults: Array<{
      nodeId: string;
      biomeGroup: string | null;
      attempt: number;
      outcome?: "victory" | "death" | "timeout" | "unreachable";
      bossHpFraction?: number;
      totalAttemptDurationMs?: number;
      bossCombatStartedAtMs?: number;
      bossCombatEndedAtMs?: number;
      bossCombatDurationMs?: number;
    }>;
  };
  mechanics: {
    abilityActivations: Record<string, number>;
    cleanseRemovedByEffect: Record<string, number>;
    persistentHazards: Record<string, {
      contacts: number;
      durationMs: number;
      damageReceived: number;
      harmfulEffects: Record<string, number>;
    }>;
    hazardEscape: {
      attempts: number;
      successes: number;
      failures: number;
      expired: number;
      interrupted: number;
    };
    stepBack: {
      activations: number;
      attempts: number;
      successes: number;
      failures: number;
      discarded: number;
      damageReceived: number;
    };
    /**
     * Part 2 diagnostics: class-specific Technique/Sweep adapter contribution.
     * Counts are authoritative; damage totals are included only where the
     * server attributed them directly at the application site.
     */
    apprenticeSweep: { secondaryTargets: number; stacksApplied: number };
    slingerSweep: {
      clipsCreated: number;
      shotsFired: number;
      splashHits: number;
      splashDamage: number;
    };
    conduitFormation: {
      arms: number;
      meanEligibleSummons: number;
      deliveries: number;
      sharesLost: number;
      secondaryDamage: number;
    };
    /**
     * Read-only boss-fight diagnostics. `range` answers "did Orbit/Chase hold
     * the intended distance"; `barrier`/`summons` stay all-zero for builds that
     * have neither.
     */
    bossDiagnostics: {
      samples: number;
      range: {
        samples: number;
        meanDistance: number;
        maxDistance: number;
        huggingFraction: number;
        inReachFraction: number;
        outOfReachFraction: number;
      };
      adds: { meanOthers: number; maxOthers: number };
      barrier: {
        samples: number;
        meanFraction: number;
        rechargingFraction: number;
        depletedFraction: number;
      };
      summons: { samples: number; meanLiving: number; maxLiving: number; emptyFraction: number };
    };
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
  coordination: {
    executionMode: RunHeader["executionMode"];
    maxConcurrency: number;
    maximumSimultaneouslyProgressing: number;
    leaseAcquisitions: number;
    leaseReleases: number;
    leaseWaitMs: number;
    maximumLeaseWaitMs: number;
    contaminated: boolean;
    controlledOverlaps: LeaseSessionEvidence["overlaps"];
    /**
     * Waits the bot spent still fighting in a node it exclusively owned. Safe
     * for isolation, but it banks essence/XP a solo run would not have yet --
     * check this before comparing a parallel run against a sequential baseline.
     */
    productiveWaits: number;
    productiveWaitMs: number;
    /** Overlaps that actually taint the run (another bot engaged in our node). */
    contaminatingOverlaps: number;
    /** Benign pass-throughs: recorded so the mode stays auditable, not a taint. */
    transitCoPresences: number;
    /**
     * Which nodes this run actually spent its time in, and their modifiers.
     * Node choice inside a biome is schedule-dependent under isolated-parallel,
     * and modifiers change monster stats, so two runs are only comparable when
     * this mix is comparable. Recorded so that stays checkable after the fact.
     */
    nodeMix: Array<{
      nodeId: string;
      biomeGroup: string | null;
      nodeModifier: string | null;
      timeMs: number;
    }>;
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
  leaseEvidence?: LeaseSessionEvidence;
  maximumSimultaneouslyProgressing?: number;
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
      attemptResults: recorder.bossAttemptResults.map((attempt) => ({
        nodeId: attempt.nodeId,
        biomeGroup: attempt.biomeGroup,
        attempt: attempt.attempt,
        outcome: attempt.outcome,
        bossHpFraction: attempt.bossHpFraction,
        totalAttemptDurationMs: attempt.durationMs,
        bossCombatStartedAtMs: attempt.bossCombatStartedAtMs,
        bossCombatEndedAtMs: attempt.bossCombatEndedAtMs,
        bossCombatDurationMs: attempt.bossCombatDurationMs,
      })),
    },
    mechanics: {
      abilityActivations: { ...recorder.abilityActivations },
      cleanseRemovedByEffect: { ...recorder.cleanseRemovedByEffect },
      persistentHazards: Object.fromEntries(
        Object.entries(recorder.persistentHazardStats(durationMs)).map(([key, value]) => [key, {
          ...value,
          durationMs: round(value.durationMs),
          damageReceived: round(value.damageReceived),
          harmfulEffects: { ...value.harmfulEffects },
        }]),
      ),
      hazardEscape: { ...recorder.hazardEscape },
      stepBack: {
        ...recorder.stepBack,
        damageReceived: round(recorder.stepBack.damageReceived),
      },
      apprenticeSweep: { ...recorder.apprenticeSweep },
      slingerSweep: {
        ...recorder.slingerSweep,
        splashDamage: round(recorder.slingerSweep.splashDamage),
      },
      conduitFormation: {
        arms: recorder.conduitFormation.arms,
        meanEligibleSummons: recorder.conduitFormation.arms > 0
          ? round(recorder.conduitFormation.eligibleSummonsSum / recorder.conduitFormation.arms)
          : 0,
        deliveries: recorder.conduitFormation.deliveries,
        sharesLost: recorder.conduitFormation.sharesLost,
        secondaryDamage: round(recorder.conduitFormation.secondaryDamage),
      },
      bossDiagnostics: buildBossDiagnostics(recorder.bossDiagnostics),
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
    coordination: {
      executionMode: header.executionMode,
      maxConcurrency: header.maxConcurrency,
      maximumSimultaneouslyProgressing: params.maximumSimultaneouslyProgressing ?? 1,
      leaseAcquisitions: params.leaseEvidence?.acquisitions ?? 0,
      leaseReleases: params.leaseEvidence?.releases ?? 0,
      leaseWaitMs: params.leaseEvidence?.totalWaitMs ?? recorder.leaseWaitMs,
      maximumLeaseWaitMs: params.leaseEvidence?.maximumWaitMs ?? 0,
      contaminated: params.leaseEvidence?.contaminated ?? false,
      controlledOverlaps: params.leaseEvidence?.overlaps ?? [],
      productiveWaits: params.leaseEvidence?.productiveWaits ?? 0,
      productiveWaitMs: params.leaseEvidence?.productiveWaitMs ?? 0,
      contaminatingOverlaps:
        params.leaseEvidence?.overlaps.filter((entry) => entry.contaminating).length ?? 0,
      transitCoPresences:
        params.leaseEvidence?.overlaps.filter((entry) => !entry.contaminating).length ?? 0,
      nodeMix: Object.entries(recorder.nodeTimeMs)
        .map(([nodeId, entry]) => ({ nodeId, ...entry }))
        .sort((a, b) => b.timeMs - a.timeMs),
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

/** Collapse the recorder's raw boss-fight sample counters into read-only rates. */
function buildBossDiagnostics(
  diag: Recorder["bossDiagnostics"],
): RunSummary["mechanics"]["bossDiagnostics"] {
  const rate = (part: number, whole: number): number => (whole > 0 ? round(part / whole) : 0);
  const mean = (sum: number, whole: number): number => (whole > 0 ? round(sum / whole) : 0);
  return {
    samples: diag.samples,
    range: {
      samples: diag.range.samples,
      meanDistance: mean(diag.range.sumDistance, diag.range.samples),
      maxDistance: round(diag.range.maxDistance),
      huggingFraction: rate(diag.range.hugging, diag.range.samples),
      inReachFraction: rate(diag.range.inReach, diag.range.samples),
      outOfReachFraction: rate(diag.range.outOfReach, diag.range.samples),
    },
    adds: {
      meanOthers: mean(diag.adds.sumOthers, diag.adds.samples),
      maxOthers: diag.adds.maxOthers,
    },
    barrier: {
      samples: diag.barrier.samples,
      meanFraction: mean(diag.barrier.sumFraction, diag.barrier.samples),
      rechargingFraction: rate(diag.barrier.rechargingSamples, diag.barrier.samples),
      depletedFraction: rate(diag.barrier.depletedSamples, diag.barrier.samples),
    },
    summons: {
      samples: diag.summons.samples,
      meanLiving: mean(diag.summons.sumLiving, diag.summons.samples),
      maxLiving: diag.summons.maxLiving,
      emptyFraction: rate(diag.summons.emptySamples, diag.summons.samples),
    },
  };
}

function roundRecord(record: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, round(v)]));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
