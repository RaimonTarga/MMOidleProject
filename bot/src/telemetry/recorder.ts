import type { EssenceType, WorldLogEvent } from "@mmo-idle/shared";
import { NODE_BIOMES } from "@mmo-idle/shared";
import type { Observation } from "../state/observation";
import type {
  BotEvent,
  DeathRecord,
  DeathTraceFrame,
  EconomyContext,
} from "./events";
import type { TelemetrySink } from "./sink";

/** What the executor is currently doing. Time is attributed to exactly one. */
export type Activity = "travel" | "farm" | "craft" | "boss" | "blocked" | "lease-wait" | "idle";

const DEATH_WINDOW_MS = 15_000;
const CONCURRENCY_SAMPLE_MS = 2_000;

export interface BiomeStats {
  biomeGroup: string;
  timeMs: number;
  travelMs: number;
  fightMs: number;
  deadMs: number;
  blockedMs: number;
  kills: number;
  deaths: number;
  damageTaken: number;
  damageDealt: number;
  masteryGained: number;
  craftsCompleted: number;
  upgradesCompleted: number;
  essenceGained: Partial<Record<EssenceType, number>>;
  catalystsByModifier: Record<string, number>;
  damageBySource: Record<string, number>;
  killsByMonster: Record<string, number>;
  concurrencySamples: number;
  concurrencyTotal: number;
  maxConcurrency: number;
}

/**
 * One-line summary for the dashboard. Returns null for high-volume events that
 * would drown the feed (concurrency samples, contention, raw damage).
 */
function describeEvent(event: BotEvent): string | null {
  switch (event.kind) {
    case "route-step-start":
      return `[${event.index}] ${event.label}`;
    case "route-step-end":
      return event.outcome === "stalled"
        ? `STALLED: ${event.reason ?? event.label}`
        : null;
    case "milestone":
      return `milestone: ${event.id}`;
    case "node-enter":
      return `entered ${event.nodeId}${event.nodeModifier ? ` (${event.nodeModifier})` : ""}`;
    case "craft":
      return `${event.success ? "crafted" : "craft FAILED"} ${event.recipeId}`;
    case "upgrade":
      return `${event.itemId} -> +${event.newLevel}`;
    case "equip":
      return `equipped ${event.definitionId ?? "-"} (${event.slot})`;
    case "build-change":
      return `build: ${event.system}`;
    case "biome-level-up":
      return `${event.biomeGroup} level ${event.newLevel}`;
    case "tier-up":
      return `TIER ${event.newTier}`;
    case "death": {
      const killer =
        "killer" in event.record.cause ? event.record.cause.killer?.monsterName : undefined;
      return `died to ${killer ?? "unknown"} (${event.record.maxConcurrentAttackers} attackers)`;
    }
    case "dungeon-guard":
      return event.phase === "start"
        ? `clearing ${event.biomeGroup} guard (${event.guardianAlive}/${event.guardianTotal})`
        : `guard ${event.outcome} (${event.guardianAlive}/${event.guardianTotal} left)`;
    case "boss-attempt":
      return event.phase === "start"
        ? `boss ${event.biomeGroup} attempt ${event.attempt}`
        : `boss ${event.biomeGroup} attempt ${event.attempt}: ${event.outcome}`;
    case "fast-boss-retry":
      return `${event.taint}: retry ${event.attempt} prepared at ${event.nodeId}`;
    case "area-lease":
      return event.phase === "acquired"
        ? `lease acquired: ${event.areaIds.join(", ")} (${event.waitDurationMs ?? 0}ms)`
        : event.phase === "released"
          ? `lease released: ${event.areaIds.join(", ")}`
          : `waiting for lease: ${event.areaIds.join(", ")}`;
    case "controlled-overlap":
      return event.contaminating
        ? `CONTAMINATED overlap in ${event.areaId}: ${event.ownerIds.join(", ")}`
        : `passed through ${event.areaId} held by ${event.ownerIds.join(", ")}`;
    case "blocked-on-resource":
      return event.phase === "start"
        ? `waiting on resources for ${event.forWhat}`
        : `unblocked ${event.forWhat}`;
    case "catalyst-gain":
      return `+${event.amount} ${event.family} catalyst`;
    case "stall":
      return `STALL: ${event.reason}`;
    case "run-end":
      return `run ended: ${event.completion}`;
    case "ability-activation":
      return `${event.slot}: ${event.abilityId}`;
    case "hazard-contact":
      return event.phase === "enter"
        ? `entered ${event.sourceName}`
        : `left ${event.sourceName} (${event.durationMs ?? 0}ms, ${event.damageReceived ?? 0} damage)`;
    case "hazard-escape":
      return event.phase === "attempt" ? "hazard escape attempt" : `hazard escape ${event.outcome}`;
    case "telegraph-dodge":
      return event.phase === "activation"
        ? "Step Back activated"
        : event.phase === "attempt"
          ? "Step Back attempt"
          : event.phase === "release"
            ? `Step Back released (${event.releaseReason ?? "unknown"})`
            : `Step Back ${event.phase}${event.outcome ? ` ${event.outcome}` : ""}`;
    case "technique-adapter":
      return `${event.adapter}: ${event.event}`;
    default:
      return null;
  }
}

function emptyBiome(biomeGroup: string): BiomeStats {
  return {
    biomeGroup,
    timeMs: 0,
    travelMs: 0,
    fightMs: 0,
    deadMs: 0,
    blockedMs: 0,
    kills: 0,
    deaths: 0,
    damageTaken: 0,
    damageDealt: 0,
    masteryGained: 0,
    craftsCompleted: 0,
    upgradesCompleted: 0,
    essenceGained: {},
    catalystsByModifier: {},
    damageBySource: {},
    killsByMonster: {},
    concurrencySamples: 0,
    concurrencyTotal: 0,
    maxConcurrency: 0,
  };
}

/**
 * Accumulates everything the run summary reports, and owns the rolling
 * pre-death window.
 *
 * Per-hit damage is aggregated rather than streamed by default: a canonical run
 * lasts hours and would otherwise produce a JSONL file no analyst (or model)
 * could open. The raw hits still exist where they matter — inside the death
 * window — and `rawDamage` streams them all when a deep dive needs it.
 */
export class Recorder {
  private readonly biomes = new Map<string, BiomeStats>();
  private readonly deathWindow: DeathTraceFrame[] = [];
  private readonly deaths: DeathRecord[] = [];

  private activity: Activity = "idle";
  private lastTickAt: number;
  private currentNodeId = "";

  // Global counters.
  killsByMonster: Record<string, number> = {};
  damageInBySource: Record<string, number> = {};
  damageInByType: Record<string, number> = {};
  damageOutByTarget: Record<string, number> = {};
  totalDamageDealtByPlayer = 0;
  totalDamageDealtBySummons = 0;
  totalDamageTaken = 0;
  totalAbsorbed = 0;
  totalHealed = 0;
  targetSwitches = 0;
  concurrencyBuckets = { zero: 0, one: 0, two: 0, threePlus: 0 };
  hpLost = 0;
  bossAttempts = 0;
  bossVictories = 0;
  contestedSamples = 0;
  totalSamples = 0;
  otherPlayerSightings = new Set<string>();
  leaseWaitMs = 0;
  /**
   * Combat time per node, tagged with that node's modifier.
   *
   * Node modifiers rescale monster HP/attack/plating at spawn, so nodes inside
   * one biome are NOT equal difficulty. Under isolated-parallel the coordinator
   * may hand a bot a different (still authored) node of the same biome when its
   * preferred one is leased, which makes the mix schedule-dependent. Rolling it
   * up here keeps that visible in the run summary instead of buried in events.
   */
  nodeTimeMs: Record<string, { biomeGroup: string | null; nodeModifier: string | null; timeMs: number }> = {};
  abilityActivations: Record<string, number> = {};
  cleanseRemovedByEffect: Record<string, number> = {};
  hazardStats: Record<string, {
    contacts: number;
    durationMs: number;
    damageReceived: number;
    harmfulEffects: Record<string, number>;
  }> = {};
  hazardEscape = { attempts: 0, successes: 0, failures: 0, expired: 0, interrupted: 0 };
  stepBack = { activations: 0, attempts: 0, successes: 0, failures: 0, discarded: 0, damageReceived: 0 };
  bossAttemptResults: Array<Extract<BotEvent, { kind: "boss-attempt" }>> = [];

  /**
   * Technique/Sweep adapter contribution (Part 2). Counts are authoritative
   * (mirrored 1:1 from server world-log events); damage is included only where
   * the server attributed it directly at the application site.
   */
  apprenticeSweep = { secondaryTargets: 0, stacksApplied: 0 };
  slingerSweep = { clipsCreated: 0, shotsFired: 0, splashHits: 0, splashDamage: 0 };
  conduitFormation = {
    arms: 0,
    eligibleSummonsSum: 0,
    deliveries: 0,
    sharesLost: 0,
    secondaryDamage: 0,
  };

  /**
   * Part 5 diagnostics. Sampled read-only from the same `PlayerView` the real
   * client renders, so none of this can influence gameplay. Everything here is
   * gated on `activity === "boss"` because its only job is to explain a boss
   * attempt: whether the movement rules actually held range, how much add
   * pressure was present, and whether the class-specific survival resource
   * (Spirit barrier / Conduit formation) was standing when the bot died.
   */
  bossDiagnostics = {
    samples: 0,
    /** Distance to the current attack target, bucketed against our own reach. */
    range: {
      samples: 0,
      sumDistance: 0,
      maxDistance: 0,
      /** Inside reach and hugging (<= 50% of reach) — Orbit is not holding. */
      hugging: 0,
      /** Comfortably inside reach. */
      inReach: 0,
      /** Outside reach — walking, not shooting. */
      outOfReach: 0,
    },
    adds: { samples: 0, sumOthers: 0, maxOthers: 0 },
    /** Spirit/barrier builds only; stays all-zero when `barrierMax` is 0. */
    barrier: {
      samples: 0,
      sumFraction: 0,
      rechargingSamples: 0,
      depletedSamples: 0,
    },
    /** Conduit only; stays all-zero when the build has no formation. */
    summons: { samples: 0, sumLiving: 0, maxLiving: 0, emptySamples: 0 },
  };
  private readonly openHazardContacts = new Map<string, { sourceId: string; enteredAtMs: number }>();

  /** Human-readable tail of interesting events, for the live dashboard. */
  private readonly recent: Array<{ atMs: number; kind: string; text: string }> = [];

  private lastTargetId: string | null = null;
  private lastHp = 0;
  private lastConcurrencySampleAt = 0;
  private lastBiomeLevels: Record<string, number> = {};
  private lastCatalysts: Record<string, number> = {};

  constructor(
    private readonly sink: TelemetrySink,
    private readonly startedAt: number,
    private readonly ownIdProvider: () => string,
    private readonly rawDamage: boolean,
  ) {
    this.lastTickAt = startedAt;
  }

  now(): number {
    return Date.now() - this.startedAt;
  }

  emit(event: BotEvent): void {
    this.sink.write(event);
    if (event.kind === "boss-attempt" && event.phase === "end") {
      this.bossAttemptResults.push(event);
    }
    const text = describeEvent(event);
    if (text) {
      this.recent.push({ atMs: event.atMs, kind: event.kind, text });
      if (this.recent.length > 60) this.recent.shift();
    }
  }

  /** Newest last. Read by the dashboard; never used for decisions. */
  recentEvents(): Array<{ atMs: number; kind: string; text: string }> {
    return [...this.recent];
  }

  setActivity(activity: Activity): void {
    this.activity = activity;
  }

  context(nodeId: string): EconomyContext {
    const info = NODE_BIOMES[nodeId];
    return {
      nodeId,
      biomeGroup: info?.biomeGroup ?? null,
      nodeModifier: info?.modifier ?? null,
    };
  }

  biome(biomeGroup: string): BiomeStats {
    let stats = this.biomes.get(biomeGroup);
    if (!stats) {
      stats = emptyBiome(biomeGroup);
      this.biomes.set(biomeGroup, stats);
    }
    return stats;
  }

  private currentBiome(): BiomeStats {
    return this.biome(NODE_BIOMES[this.currentNodeId]?.biomeGroup ?? "unknown");
  }

  // ── Per-tick sampling ───────────────────────────────────────────────────

  /** Called on a fixed cadence from the run loop. Owns all time attribution. */
  tick(obs: Observation): void {
    const now = Date.now();
    const dt = now - this.lastTickAt;
    this.lastTickAt = now;
    if (dt <= 0) return;

    const self = obs.self;
    const nodeId = obs.nodeId || this.currentNodeId;

    if (nodeId && nodeId !== this.currentNodeId) {
      this.currentNodeId = nodeId;
      const ctx = this.context(nodeId);
      this.emit({
        kind: "node-enter",
        atMs: this.now(),
        nodeId,
        biomeGroup: ctx.biomeGroup,
        nodeModifier: ctx.nodeModifier,
      });
    }

    if (nodeId) {
      const ctx = this.context(nodeId);
      const perNode = (this.nodeTimeMs[nodeId] ??= {
        biomeGroup: ctx.biomeGroup,
        nodeModifier: ctx.nodeModifier,
        timeMs: 0,
      });
      perNode.timeMs += dt;
    }

    const stats = this.currentBiome();
    stats.timeMs += dt;

    const attackers = self ? obs.attackersOnSelf().length : 0;
    const dead = self?.isDead ?? false;

    if (dead) stats.deadMs += dt;
    else if (this.activity === "travel") stats.travelMs += dt;
    else if (this.activity === "blocked") stats.blockedMs += dt;
    else if (this.activity === "lease-wait") this.leaseWaitMs += dt;
    if (!dead && (attackers > 0 || (self?.attackTargetId ?? null) !== null)) {
      stats.fightMs += dt;
    }

    if (!self) return;

    // Target switching — the Apprentice question, made directly observable.
    if (self.attackTargetId !== this.lastTargetId) {
      if (self.attackTargetId !== null && this.lastTargetId !== null) {
        this.targetSwitches += 1;
        this.emit({
          kind: "target-switch",
          atMs: this.now(),
          fromId: this.lastTargetId,
          toId: self.attackTargetId,
          nodeId,
        });
      }
      this.lastTargetId = self.attackTargetId;
    }

    if (this.lastHp > 0 && self.hp < this.lastHp) this.hpLost += this.lastHp - self.hp;
    this.lastHp = self.hp;

    // Concurrency histogram — brief §17's 1 / 2 / 3+ split.
    this.totalSamples += 1;
    if (attackers === 0) this.concurrencyBuckets.zero += 1;
    else if (attackers === 1) this.concurrencyBuckets.one += 1;
    else if (attackers === 2) this.concurrencyBuckets.two += 1;
    else this.concurrencyBuckets.threePlus += 1;

    stats.concurrencySamples += 1;
    stats.concurrencyTotal += attackers;
    stats.maxConcurrency = Math.max(stats.maxConcurrency, attackers);

    this.trackProgressionDeltas(obs, nodeId);
    this.trackContention(obs, nodeId);
    this.sampleBossDiagnostics(obs);

    if (Date.now() - this.lastConcurrencySampleAt >= CONCURRENCY_SAMPLE_MS) {
      this.lastConcurrencySampleAt = Date.now();
      this.emit({
        kind: "concurrency-sample",
        atMs: this.now(),
        nodeId,
        attackers,
        monstersInNode: obs.monsters().length,
        otherPlayersInNode: obs.otherPlayers().length,
        hpFraction: self.maxHp > 0 ? self.hp / self.maxHp : 0,
      });
    }
  }

  /**
   * Read-only boss-fight diagnostics (Part 5). Nothing here is emitted per
   * sample: a boss attempt is minutes long at 10 Hz, so these are accumulated
   * and reported once in the summary.
   */
  private sampleBossDiagnostics(obs: Observation): void {
    if (this.activity !== "boss") return;
    const self = obs.self;
    if (!self || self.isDead) return;

    const diag = this.bossDiagnostics;
    diag.samples += 1;

    const monsters = obs.monsters();
    const target = self.attackTargetId
      ? monsters.find((monster) => monster.id === self.attackTargetId)
      : undefined;
    if (target) {
      const distance = Math.hypot(target.pos.x - self.pos.x, target.pos.y - self.pos.y);
      const range = diag.range;
      range.samples += 1;
      range.sumDistance += distance;
      range.maxDistance = Math.max(range.maxDistance, distance);
      const reach = self.attackRange;
      if (distance > reach) range.outOfReach += 1;
      else if (distance <= reach * 0.5) range.hugging += 1;
      else range.inReach += 1;
    }

    // Add pressure: everything alive in the node that is not the boss itself.
    const others = monsters.filter((monster) => !monster.isBoss).length;
    diag.adds.samples += 1;
    diag.adds.sumOthers += others;
    diag.adds.maxOthers = Math.max(diag.adds.maxOthers, others);

    if (self.barrierMax > 0) {
      const barrier = diag.barrier;
      barrier.samples += 1;
      barrier.sumFraction += self.barrier / self.barrierMax;
      if (self.barrierRecharging) barrier.rechargingSamples += 1;
      if (self.barrier <= 0) barrier.depletedSamples += 1;
    }

    const living = obs.minions().filter((minion) => minion.hp > 0).length;
    if (living > 0 || diag.summons.samples > 0) {
      diag.summons.samples += 1;
      diag.summons.sumLiving += living;
      diag.summons.maxLiving = Math.max(diag.summons.maxLiving, living);
      if (living === 0) diag.summons.emptySamples += 1;
    }
  }

  /**
   * Catalysts are minted server-side from kill progress and never announced, so
   * the only honest way to see income is to watch the wallet move.
   */
  private trackProgressionDeltas(obs: Observation, nodeId: string): void {
    const self = obs.self;
    if (!self) return;

    for (const [family, amount] of Object.entries(self.catalysts)) {
      const previous = this.lastCatalysts[family] ?? 0;
      if (amount > previous) {
        const gained = amount - previous;
        const ctx = this.context(nodeId);
        const modifier = ctx.nodeModifier ?? "none";
        const stats = this.currentBiome();
        stats.catalystsByModifier[modifier] =
          (stats.catalystsByModifier[modifier] ?? 0) + gained;
        this.emit({
          kind: "catalyst-gain",
          atMs: this.now(),
          family,
          amount: gained,
          context: ctx,
        });
      }
    }
    this.lastCatalysts = { ...self.catalysts };
    this.lastBiomeLevels = { ...self.biomeLevel };
  }

  private trackContention(obs: Observation, nodeId: string): void {
    const others = obs.otherPlayers();
    if (others.length === 0) return;

    for (const other of others) this.otherPlayerSightings.add(other.id);

    const myTarget = obs.self?.attackTargetId ?? null;
    const shared = myTarget
      ? others.filter((o) => o.attackTargetId === myTarget).map((o) => o.id)
      : [];
    if (shared.length > 0) this.contestedSamples += 1;

    this.emit({
      kind: "contention",
      atMs: this.now(),
      nodeId,
      otherPlayerIds: others.map((o) => o.id),
      sharedTargetIds: shared,
    });
  }

  // ── World log ingestion ─────────────────────────────────────────────────

  ingestWorldEvents(events: WorldLogEvent[], obs: Observation): void {
    const ownId = this.ownIdProvider();
    const self = obs.self;
    const hp = self?.hp ?? 0;

    for (const event of events) {
      switch (event.kind) {
        case "damage": {
          const incoming = event.target.id === ownId;
          const mine =
            event.source.id === ownId ||
            (event.source.actorType === "minion" && event.source.ownerPlayerId === ownId);

          if (incoming) {
            this.totalDamageTaken += event.hpDamage;
            this.totalAbsorbed += event.absorbed;
            this.damageInBySource[event.source.name] =
              (this.damageInBySource[event.source.name] ?? 0) + event.hpDamage;
            this.damageInByType[event.damageType] =
              (this.damageInByType[event.damageType] ?? 0) + event.hpDamage;
            const stats = this.currentBiome();
            stats.damageTaken += event.hpDamage;
            stats.damageBySource[event.source.name] =
              (stats.damageBySource[event.source.name] ?? 0) + event.hpDamage;
            if (event.tags?.[0] === "ground-zone") {
              const sourceId = event.tags[2] ?? event.source.name;
              const hazard = this.hazardStats[sourceId] ?? {
                contacts: 0,
                durationMs: 0,
                damageReceived: 0,
                harmfulEffects: {},
              };
              hazard.damageReceived += event.hpDamage;
              this.hazardStats[sourceId] = hazard;
            }

            this.pushDeathFrame({
              atMs: this.now(),
              serverTime: event.serverTime,
              kind: "damage",
              attacker: event.source.name,
              attackerType: event.source.actorType,
              source: event.tags?.join(",") ?? event.damageType,
              damageType: event.damageType,
              amount: event.hpDamage,
              absorbed: event.absorbed,
              hpBefore: hp + event.hpDamage,
              hpAfter: hp,
              concurrentAttackers: obs.attackersOnSelf().length,
              targetId: event.target.id,
            });
          } else if (mine) {
            if (event.source.actorType === "minion") {
              this.totalDamageDealtBySummons += event.hpDamage;
            } else {
              this.totalDamageDealtByPlayer += event.hpDamage;
            }
            this.damageOutByTarget[event.target.name] =
              (this.damageOutByTarget[event.target.name] ?? 0) + event.hpDamage;
            this.currentBiome().damageDealt += event.hpDamage;
          }

          if (this.rawDamage && (incoming || mine)) {
            this.emit({
              kind: "damage",
              atMs: this.now(),
              direction: incoming ? "in" : "out",
              sourceName: event.source.name,
              sourceType: event.source.actorType,
              targetName: event.target.name,
              damageType: event.damageType,
              hpDamage: event.hpDamage,
              absorbed: event.absorbed,
              nodeId: event.nodeId,
            });
          }
          break;
        }

        case "kill": {
          const mine =
            event.killer.id === ownId ||
            (event.killer.actorType === "minion" && event.killer.ownerPlayerId === ownId);
          if (!mine) break;
          const ctx = this.context(event.nodeId);
          const stats = this.biome(ctx.biomeGroup ?? "unknown");
          stats.kills += 1;
          stats.killsByMonster[event.victim.name] =
            (stats.killsByMonster[event.victim.name] ?? 0) + 1;
          this.killsByMonster[event.victim.name] =
            (this.killsByMonster[event.victim.name] ?? 0) + 1;
          if (event.essenceType && event.essenceGained) {
            stats.essenceGained[event.essenceType] =
              (stats.essenceGained[event.essenceType] ?? 0) + event.essenceGained;
          }
          if (event.biomeXpGained) stats.masteryGained += event.biomeXpGained;

          this.emit({
            kind: "kill",
            atMs: this.now(),
            monsterTypeId: event.victim.id,
            monsterName: event.victim.name,
            isBoss: false,
            essenceGained: event.essenceGained ?? 0,
            essenceType: event.essenceType ?? null,
            biomeXpGained: event.biomeXpGained ?? 0,
            context: ctx,
          });
          break;
        }

        case "heal":
        case "ward-gain":
        case "absorb": {
          if (event.target.id !== ownId) break;
          this.totalHealed += event.amount;
          this.pushDeathFrame({
            atMs: this.now(),
            serverTime: event.serverTime,
            kind: "heal",
            source: event.source?.name,
            amount: event.amount,
            hpBefore: hp,
            hpAfter: hp,
            concurrentAttackers: obs.attackersOnSelf().length,
          });
          break;
        }

        case "biome-level-up": {
          if (event.player.id !== ownId) break;
          this.emit({
            kind: "biome-level-up",
            atMs: this.now(),
            biomeGroup: event.biomeGroup,
            newLevel: event.newLevel,
            unlockedRecipeIds: event.unlockedRecipeIds,
          });
          break;
        }

        case "player-tier-up": {
          if (event.player.id !== ownId) break;
          this.emit({ kind: "tier-up", atMs: this.now(), newTier: event.newTier });
          break;
        }

        case "ability-activation": {
          if (event.player.id !== ownId) break;
          this.abilityActivations[event.abilityId] =
            (this.abilityActivations[event.abilityId] ?? 0) + 1;
          for (const removed of event.removedEffects ?? []) {
            this.cleanseRemovedByEffect[removed.effectId] =
              (this.cleanseRemovedByEffect[removed.effectId] ?? 0) + removed.stacks;
          }
          this.emit({
            kind: "ability-activation",
            atMs: this.now(),
            abilityId: event.abilityId,
            slot: event.slot,
            removedEffects: event.removedEffects,
          });
          break;
        }

        case "hazard-contact": {
          if (event.player.id !== ownId) break;
          const stats = this.hazardStats[event.sourceId] ?? {
            contacts: 0,
            durationMs: 0,
            damageReceived: 0,
            harmfulEffects: {},
          };
          if (event.phase === "enter") {
            stats.contacts += 1;
            for (const effect of event.harmfulEffects ?? []) {
              stats.harmfulEffects[effect] = (stats.harmfulEffects[effect] ?? 0) + 1;
            }
            this.openHazardContacts.set(event.hazardId, {
              sourceId: event.sourceId,
              enteredAtMs: this.now(),
            });
          } else {
            const open = this.openHazardContacts.get(event.hazardId);
            this.openHazardContacts.delete(event.hazardId);
            stats.durationMs += event.durationMs ?? (
              open ? Math.max(0, this.now() - open.enteredAtMs) : 0
            );
          }
          this.hazardStats[event.sourceId] = stats;
          this.emit({
            kind: "hazard-contact",
            atMs: this.now(),
            hazardId: event.hazardId,
            hazardKind: event.hazardKind,
            sourceId: event.sourceId,
            sourceName: event.sourceName,
            phase: event.phase,
            durationMs: event.durationMs,
            damageReceived: event.damageReceived,
            harmfulEffects: event.harmfulEffects,
            endReason: event.endReason,
          });
          break;
        }

        case "hazard-escape": {
          if (event.player.id !== ownId) break;
          if (event.phase === "attempt") this.hazardEscape.attempts += 1;
          else if (event.outcome === "success") this.hazardEscape.successes += 1;
          else if (event.outcome === "expired") this.hazardEscape.expired += 1;
          else if (event.outcome === "interrupted") this.hazardEscape.interrupted += 1;
          else this.hazardEscape.failures += 1;
          this.emit({
            kind: "hazard-escape",
            atMs: this.now(),
            hazardIds: event.hazardIds,
            hazardKinds: event.hazardKinds,
            phase: event.phase,
            outcome: event.outcome,
            reason: event.reason,
          });
          break;
        }

        case "telegraph-dodge": {
          if (event.player.id !== ownId) break;
          if (event.phase === "activation") this.stepBack.activations += 1;
          else if (event.phase === "attempt") this.stepBack.attempts += 1;
          else if (event.outcome === "success") this.stepBack.successes += 1;
          else if (event.outcome === "failure") {
            this.stepBack.failures += 1;
            this.stepBack.damageReceived += event.damageReceived ?? 0;
          } else if (event.outcome === "discarded") this.stepBack.discarded += 1;
          this.emit({
            kind: "telegraph-dodge",
            atMs: this.now(),
            phase: event.phase,
            telegraphId: event.telegraphId,
            telegraphKind: event.telegraphKind,
            ownerId: event.ownerId,
            trackedTelegraphIds: event.trackedTelegraphIds,
            acquiredAtMs: event.acquiredAtMs,
            startingPosition: event.startingPosition,
            telegraphGeometry: event.telegraphGeometry,
            escapePoint: event.escapePoint,
            firstSafeAtMs: event.firstSafeAtMs,
            resolvedAtMs: event.resolvedAtMs,
            releasedAtMs: event.releasedAtMs,
            releaseReason: event.releaseReason,
            reenteredAfterSafe: event.reenteredAfterSafe,
            outcome: event.outcome,
            damageReceived: event.damageReceived,
            reason: event.reason,
          });
          break;
        }

        case "technique-adapter": {
          if (event.player.id !== ownId) break;
          switch (event.event) {
            case "apprentice-secondary-target":
              this.apprenticeSweep.secondaryTargets += 1;
              this.apprenticeSweep.stacksApplied += event.stacksApplied ?? 0;
              break;
            case "slinger-clip-created":
              this.slingerSweep.clipsCreated += 1;
              break;
            case "slinger-clip-shot":
              this.slingerSweep.shotsFired += 1;
              break;
            case "slinger-splash-hit":
              this.slingerSweep.splashHits += 1;
              this.slingerSweep.splashDamage += event.splashDamage ?? 0;
              break;
            case "conduit-arm":
              this.conduitFormation.arms += 1;
              this.conduitFormation.eligibleSummonsSum += event.eligibleSummons ?? 0;
              break;
            case "conduit-delivery":
              this.conduitFormation.deliveries += 1;
              break;
            case "conduit-share-lost":
              this.conduitFormation.sharesLost += 1;
              break;
            case "conduit-secondary-damage":
              this.conduitFormation.secondaryDamage += event.splashDamage ?? 0;
              break;
          }
          this.emit({
            kind: "technique-adapter",
            atMs: this.now(),
            adapter: event.adapter,
            event: event.event,
            targetName: event.target?.name,
            stacksApplied: event.stacksApplied,
            clipSize: event.clipSize,
            splashDamage: event.splashDamage,
            eligibleSummons: event.eligibleSummons,
          });
          break;
        }

        default:
          break;
      }
    }
  }

  private pushDeathFrame(frame: DeathTraceFrame): void {
    this.deathWindow.push(frame);
    const cutoff = frame.atMs - DEATH_WINDOW_MS;
    while (this.deathWindow.length > 0 && this.deathWindow[0].atMs < cutoff) {
      this.deathWindow.shift();
    }
  }

  // ── Deaths ──────────────────────────────────────────────────────────────

  recordDeath(
    record: Omit<
      DeathRecord,
      "window" | "killingBlow" | "largestHit" | "dominantSource" | "maxConcurrentAttackers"
    >,
  ): DeathRecord {
    const window = [...this.deathWindow];
    const hits = window.filter((f) => f.kind === "damage");
    const bySource: Record<string, number> = {};
    let largest: DeathTraceFrame | null = null;
    let maxConcurrent = 0;

    for (const hit of hits) {
      const name = hit.attacker ?? "unknown";
      bySource[name] = (bySource[name] ?? 0) + hit.amount;
      if (!largest || hit.amount > largest.amount) largest = hit;
      maxConcurrent = Math.max(maxConcurrent, hit.concurrentAttackers);
    }

    const dominantEntry = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0];

    const full: DeathRecord = {
      ...record,
      killingBlow: hits.length > 0 ? hits[hits.length - 1] : null,
      largestHit: largest,
      dominantSource: dominantEntry
        ? { name: dominantEntry[0], damage: dominantEntry[1] }
        : null,
      maxConcurrentAttackers: maxConcurrent,
      window,
    };

    this.deaths.push(full);
    this.biome(record.biomeGroup ?? "unknown").deaths += 1;
    this.sink.writeDeath(full);
    this.emit({ kind: "death", atMs: this.now(), record: full });

    // The window described the fight that just ended; carrying it into the next
    // life would attribute the previous death's hits to the next one.
    this.deathWindow.length = 0;
    return full;
  }

  get deathCount(): number {
    return this.deaths.length;
  }

  get allDeaths(): readonly DeathRecord[] {
    return this.deaths;
  }

  get biomeStats(): BiomeStats[] {
    return [...this.biomes.values()];
  }

  /** Snapshot persistent-hazard totals, including contacts still open at run end. */
  persistentHazardStats(atMs: number): typeof this.hazardStats {
    const snapshot = Object.fromEntries(
      Object.entries(this.hazardStats).map(([key, value]) => [key, {
        ...value,
        harmfulEffects: { ...value.harmfulEffects },
      }]),
    );
    for (const open of this.openHazardContacts.values()) {
      const stats = snapshot[open.sourceId];
      if (stats) stats.durationMs += Math.max(0, atMs - open.enteredAtMs);
    }
    return snapshot;
  }
}
