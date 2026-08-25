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
export type Activity = "travel" | "farm" | "craft" | "boss" | "blocked" | "idle";

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

    const stats = this.currentBiome();
    stats.timeMs += dt;

    const attackers = self ? obs.attackersOnSelf().length : 0;
    const dead = self?.isDead ?? false;

    if (dead) stats.deadMs += dt;
    else if (this.activity === "travel") stats.travelMs += dt;
    else if (this.activity === "blocked") stats.blockedMs += dt;
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
}
