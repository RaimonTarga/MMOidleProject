/**
 * One lane-bench MEASUREMENT, shared by every bench that runs a reference bot on a
 * real farm node: the lane matrix (`lineageLaneMatrix.ts`) and the lean × verb
 * composition matrix (`compositionLanes.ts`).
 *
 * Extracted from `lineageLaneMatrix.ts` (course-correction W3-A) for the same
 * reason `laneBot.ts` was: if two benches measured a cell even slightly
 * differently, their rows could not be laid side by side. The node set (one row
 * per DISTINCT resolved blend) and `measure` moved here verbatim; the only
 * addition is `fxByCard`, the `card-fx` events keyed by the card that fired them,
 * which is how the composition matrix counts a verb's moment firings.
 */
import {
  FAMILY_DATABASE,
  NODE_BIOMES,
  WORLD_NODE_LIST,
  blendEntries,
  nodeSpawnBlend,
  nodeShard,
  type FamilyId,
  type PacketId,
  type TierEntryProfile,
} from '@mmo-idle/shared';
import type {
  BandTier,
  LineageFrameReference,
  LineageLaneReference,
} from '../../../bot/src/tierEntry/profiles';
import { setupArena, teardownArena } from '../balance/arena';
import { reviveInFarmNode } from '../balance/runFarm';
import { createFarmWorld } from '../balance/worldFactory';
import { prepareLaneBot } from './laneBot';
import { shardKillCounter } from './shardAccounting';
import { isPlayerActivelyInCombat } from '../../src/systems/combat/ai/engagement';
import {
  registerCombatListener,
  unregisterCombatListener,
  type CombatEventHandler,
} from '../../src/systems/combat/engine/combatPipeline';

/**
 * Every biome with authored family blends, in map order: the five T1 biomes and
 * the two the T2 region adds. A biome absent from this list has no families yet,
 * so a node of it would resolve to an empty blend.
 */
export const BENCH_BIOMES = [
  'plains', 'forest', 'mountain', 'cave', 'swamp', 'jungle', 'desert',
] as const;
export const BENCH_TIERS = [1, 2] as const;

// ── Node set: one row per DISTINCT resolved blend ─────────────────────────────


export interface LaneNode {
  /** Representative node id — the first authored node with this composition. */
  nodeId: string;
  biome: string;
  /** The node's own biome tier, which decides which monster pool it fields. */
  tier: number;
  /** Every authored node that resolves to the same spawn cycle. */
  aliases: string[];
  authored: string;
  resolved: string;
  /** Monster ids in the repeating cycle, with how many of the ten slots each takes. */
  mobs: Array<{ monsterTypeId: string; family: FamilyId; slots: number }>;
  dominant: FamilyId;
  /** The dominant family's resolved share — what "its own node" means. */
  dominantShare: number;
  dropsLane: PacketId;
  punishesLane: PacketId;
  unavailable: FamilyId[];
}

export function laneNodes(): LaneNode[] {
  const byKey = new Map<string, LaneNode>();
  for (const node of WORLD_NODE_LIST) {
    if (!BENCH_TIERS.includes(node.biomeTier as (typeof BENCH_TIERS)[number])) continue;
    if (NODE_BIOMES[node.id]?.kind !== 'normal') continue;
    if (!BENCH_BIOMES.includes(node.biomeGroup as (typeof BENCH_BIOMES)[number])) continue;
    const blend = node.blend;
    const resolved = nodeSpawnBlend(node.id);
    if (!blend || !resolved) continue;

    // Two nodes are the same ENCOUNTER when their resolved spawn cycles agree
    // slot for slot, which is what the spawner actually walks. Keyed by tier as
    // well: the same biome's T1 and T2 nodes can share a cycle shape while
    // fielding entirely different mobs.
    const cycleKey = `${node.biomeGroup}|${node.biomeTier}|${resolved.cycle.join(',')}|${nodeShard(node.id)}`;
    const existing = byKey.get(cycleKey);
    if (existing) {
      existing.aliases.push(node.id);
      continue;
    }

    const slots = new Map<string, { monsterTypeId: string; family: FamilyId; slots: number }>();
    for (let cursor = 0; cursor < resolved.cycle.length; cursor += 1) {
      const family = resolved.cycle[cursor];
      const pool = resolved.poolByFamily.get(family) ?? [];
      // Mirror `blendSpawnPick`: the family's own occurrence walks its mob list.
      const occurrence = resolved.cycle.slice(0, cursor).filter((f) => f === family).length;
      const monsterTypeId = pool[occurrence % Math.max(1, pool.length)];
      const key = `${family}|${monsterTypeId}`;
      const row = slots.get(key) ?? { monsterTypeId, family, slots: 0 };
      row.slots += 1;
      slots.set(key, row);
    }
    const dominantEntry = blendEntries(resolved.shares)[0];
    const dominant = dominantEntry.family;
    const family = FAMILY_DATABASE.get(dominant)!;
    byKey.set(cycleKey, {
      nodeId: node.id,
      biome: node.biomeGroup,
      tier: node.biomeTier,
      aliases: [node.id],
      authored: blendEntries(blend).map((e) => `${short(e.family)} ${pct(e.share)}`).join(' / '),
      resolved: blendEntries(resolved.shares).map((e) => `${short(e.family)} ${pct(e.share)}`).join(' / '),
      mobs: [...slots.values()].sort((a, b) => b.slots - a.slots),
      dominant,
      dominantShare: dominantEntry.share,
      dropsLane: nodeShard(node.id)!,
      punishesLane: family.punishes,
      unavailable: [...resolved.unavailable],
    });
  }
  return [...byKey.values()];
}

/**
 * The resolved share at which a node counts as a family's OWN: the 70/20/10 and 70/30
 * shapes, never a 45/45/10 or a 34/33/33 where two families share the encounter.
 * Module scope because `LANE_OWN_NODES` filters on it before the node set is built.
 */
export const OWN_NODE_SHARE = 0.6;

export const short = (family: FamilyId): string => FAMILY_DATABASE.get(family)?.name ?? family;
export const pct = (share: number): string => `${Math.round(share * 100)}%`;
/** `node-t2-jungle-03` as `t2-jungle-03`: short enough for a column heading. */
export const shortNode = (nodeId: string): string => nodeId.replace('node-', '');

// ── One measurement ──────────────────────────────────────────────────────────

export interface Row {
  cellId: string;
  profileId: string;
  /** Null on a frame reference, which belongs to a root rather than a lineage. */
  lineageId: string | null;
  lane: PacketId | null;
  classRoot: string;
  /** Which tier's band and gear the row was measured with (run 4). */
  bandTier: BandTier;
  /** Set on a frame reference only: the frame under test and its shape. */
  frameId?: string;
  frameShape?: string;
  nodeId: string;
  biome: string;
  seed: number;
  kills: number;
  /** Optional only for replaying older measurement rows. */
  killsByShard?: Partial<Record<PacketId, number>>;
  deaths: number;
  engagedMs: number;
  capMs: number;
  damageDealt: number;
  refusals: string[];
  grantedShards: boolean;
  mobCount: number;
  /**
   * `card-fx` events pushed during the run, keyed by fx. This is the proof that
   * the LANE fired: without it a +5% uplift is indistinguishable from the stat
   * row alone with a payoff card that never triggered.
   */
  fx: Record<string, number>;
  /**
   * The same `card-fx` events keyed by the CARD that fired them (`cardId`; a
   * composed verb pushes its payload's fx under its own card id). One event per
   * landed application, so for a verb this is its moment's landed firings.
   * Optional so a replay of an older run still renders.
   */
  fxByCard?: Record<string, number>;
  /**
   * Survival, for the lanes whose T1 payoff is not damage. Control's slow and
   * Engagement's opening DR buy time, not throughput, so a TTK-only matrix reads
   * them as worth nothing — which is an instrument limit, not a finding.
   * Optional so `LANE_REPLAY` of a run made before these existed still renders.
   */
  damageTaken?: number;
  /** Sum of the player's HP fraction over engaged ticks, and the tick count. */
  hpFractionSum?: number;
  hpSamples?: number;
}

export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function measure(
  profile: TierEntryProfile,
  reference: LineageLaneReference | null,
  frame: LineageFrameReference | null,
  node: LaneNode,
  seed: number,
  capMs: number,
): Row {
  const originalRandom = Math.random;
  const originalNow = Date.now;
  Math.random = seededRandom(seed);
  let now = 0;
  Date.now = () => now;

  const world = createFarmWorld();
  let kills = 0;
  let deaths = 0;
  let engagedMs = 0;
  let damageDealt = 0;
  const fx: Record<string, number> = {};
  const fxByCard: Record<string, number> = {};
  const killsByShard: Partial<Record<PacketId, number>> = {};
  const countShardKill = shardKillCounter(killsByShard);
  const onKill: CombatEventHandler = (ctx) => {
    countShardKill(ctx);
    if (ctx.defenderType === 'monster') kills += 1;
  };
  let damageTaken = 0;
  let hpFractionSum = 0;
  let hpSamples = 0;
  const onDealt: CombatEventHandler = (ctx) => {
    if (ctx.defenderType === 'monster' && ctx.damage > 0) damageDealt += ctx.damage;
    if (ctx.defenderType === 'player' && ctx.damage > 0) damageTaken += ctx.damage;
  };
  registerCombatListener('onKill', onKill);
  registerCombatListener('onDamageTaken', onDealt);
  try {
    const mobCount = setupArena(world, {
      nodeId: node.nodeId, biomeGroup: node.biome, contentTier: node.tier, isDungeon: false,
    });
    const { bot, refusals, grantedShards } = prepareLaneBot(world, profile, reference, node.nodeId, frame);
    for (; now < capMs;) {
      world.tick(100, now);
      now += 100;
      world.pendingDeaths = [];
      for (const event of world.takeNodeEvents(node.nodeId)) {
        if (event.kind !== 'card-fx') continue;
        fx[event.fx] = (fx[event.fx] ?? 0) + 1;
        if (event.cardId !== undefined) fxByCard[event.cardId] = (fxByCard[event.cardId] ?? 0) + 1;
      }
      world.clearNodeEvents(node.nodeId);
      const dead = bot.isDead !== undefined || bot.hasHealth.hp <= 0;
      if (!dead && isPlayerActivelyInCombat(world, bot)) {
        engagedMs += 100;
        hpFractionSum += bot.hasHealth.hp / Math.max(1, bot.hasHealth.maxHp);
        hpSamples += 1;
      }
      if (dead) {
        deaths += 1;
        reviveInFarmNode(world, bot, node.nodeId);
      }
    }
    return {
      cellId: `${profile.id}@${node.nodeId}`,
      profileId: profile.id,
      lineageId: reference?.lineageId ?? null,
      lane: reference?.lane ?? null,
      classRoot: (reference ?? frame!).classRoot,
      bandTier: (reference ?? frame!).bandTier,
      ...(frame ? { frameId: frame.frameId, frameShape: frame.frameShape } : {}),
      nodeId: node.nodeId,
      biome: node.biome,
      seed, kills, killsByShard, deaths, engagedMs, capMs, damageDealt, refusals, grantedShards, mobCount, fx, fxByCard,
      damageTaken, hpFractionSum, hpSamples,
    };
  } finally {
    unregisterCombatListener('onKill', onKill);
    unregisterCombatListener('onDamageTaken', onDealt);
    teardownArena(world);
    Math.random = originalRandom;
    Date.now = originalNow;
  }
}
