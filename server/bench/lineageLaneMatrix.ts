/**
 * Progression rework Phase 1 §1.5 — the lane matrix.
 *
 * Runs every weapon-lineage lane reference profile (`bot/src/tierEntry/profiles.ts`)
 * against every DISTINCT Tier-1 node blend and reports throughput per lane per
 * node, plus the two checks design §9 asks for:
 *
 *   LANE BUDGET     at full rows, each lane lands within ±10% of the tier median
 *                   on its favoured family's node.
 *   ENCOUNTER       on each family's own node, does the favoured lane win by
 *                   ~30%, and does the punished lane still clear?
 *
 * Three things about this instrument the reader has to know before trusting a row.
 *
 * 1. NODES ARE GROUPED BY THEIR RESOLVED BLEND, NOT THEIR AUTHORED ONE. A T1 node
 *    fields only `monsterPoolByTier[1]`, so a family with no T1 member is dropped
 *    by `resolveNodeBlend` and its share rescaled onto the rest, which used to
 *    collapse the twenty-seven authored nodes into far fewer distinct encounters —
 *    all six Swamp nodes into ONE, because both of its T1 mobs were Mire.
 *
 *    AS OF 2026-10-01 THAT GAP IS CLOSED: design §18.8's third T1 mob per biome
 *    landed (grass-kite, bramble-pod, rockback-ram, brood-spiderling, fen-hexer,
 *    plus Mud Toad re-familied to Stalker), so every biome fields all three of its
 *    families and all 27 authored blends now resolve exactly as authored, one
 *    distinct encounter each. The grouping stays, because it is what makes a future
 *    unfieldable family visible instead of silent.
 *
 * 2. THE LANE IS THE DIFFERENCE FROM THE CONTROL, NOT THE ABSOLUTE NUMBER. Each
 *    lineage runs a lane-less control on the same class, frame, weapon and gear.
 *    Absolute throughput of `rapier/tempo` is mostly Striker-with-a-rapier; only
 *    the uplift over the control is the lane. Both readings are reported, and the
 *    spread among the five controls says how much of §9-as-written is class noise.
 *
 * 3. EVERY COST IS NOW PAID THROUGH THE REAL ECONOMY HANDLER. Engagement's shards
 *    used to be credited to the wallet, because its only family (Plains Sky) could
 *    not be fielded at T1 and no other family dropped them; the harness labelled
 *    every affected row. With `grass-kite` making Plains Sky fieldable that credit
 *    is gone and no row carries the label. The mechanism stays for the next packet
 *    that has no source: a card the mastery gate or the wallet refuses is reported
 *    as refused rather than silently faked.
 *
 * 4. RUN 3 (2026-10-01) ADDS TWO READINGS AND RETIRES ONE CRITERION.
 *
 *    TIER 2. The node set is every blended normal node of biome tier 1 AND 2, so
 *    Jungle's and Desert's families are measured rather than assumed. The
 *    references are unchanged — a T1 band on a T2 encounter is the character who
 *    has just walked into Tier 2, which is the build the gate hands over — so the
 *    T2 rows read as "what does a T1 lane still buy you here", and their death
 *    counts are part of the answer.
 *
 *    THE FRAMES COLUMN (design §18.10). Eighteen lane-less frame references,
 *    three per class root, measured on one node per biome. `LINEAGE_LANE_REFERENCES`
 *    does not vary frame, so this is a separate reference set rather than a column
 *    the lane matrix could grow, and it is deliberately a NARROWER node set: the
 *    question is what Light/Balanced/Heavy is worth per root, not how each frame
 *    reads on all 62 blends, and the full cross would have trebled the run.
 *
 *    THE CRITERION IS §18.9, NOT §9. The lane budget band is the median uplift
 *    ±3 PERCENTAGE POINTS, absolute — §9's "±10% of the tier median" is a
 *    proportion of a number that is itself small, so the band narrows as lanes
 *    weaken and no lane could sit inside it by construction. The encounter check
 *    drops "~30%" for a RANKING: does the favoured lane out-uplift the punished
 *    lane on that family's own node, and by what margin? The margin is reported,
 *    never thresholded, and the per-seed ranks are reported with it, because a
 *    remap (§18 3b) is only taken when both seeds agree.
 *
 * Usage, from `server/`:
 *
 *   node --conditions=development --import tsx bench/lineageLaneMatrix.ts [out-dir]
 *
 *   LANE_CAP_MS=90000        sim time per cell per seed
 *   LANE_SEEDS=101009,101033 two seeds by default
 *   LANE_FILTER=rapier       substring filter on the cell id (lane AND frame rows)
 *   LANE_NODES=plains,forest limit to these biomes
 *   LANE_TIERS=1,2           limit to these biome tiers
 *   LANE_ONLY=node-a,node-b  limit to these node ids
 *   LANE_FRAMES=0            skip the frames column
 *   LANE_FRAME_NODES=a,b     the frames column's node set (default: one per biome)
 *   LANE_REPORT=lane-matrix  output basename (`.md` and `.json`)
 *   LANE_REPLAY=path.json    rebuild the report from a previous run's rows
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  ESSENCE_TYPES,
  FAMILY_DATABASE,
  LINEAGE_DATABASE,
  NODE_BIOMES,
  RUNE_RECIPE_DATABASE,
  WORLD_NODE_LIST,
  blendEntries,
  composePlayerView,
  isRuneRecipeUnlocked,
  nodeSpawnBlend,
  withReferenceAbilityWiring,
  type AttunedAbilities,
  type EquippedRule,
  type FamilyId,
  type PacketId,
  type TierEntryProfile,
} from '@mmo-idle/shared';
import {
  FRAME_SHAPES,
  LINEAGE_FRAME_PROFILES,
  LINEAGE_FRAME_REFERENCES,
  LINEAGE_LANE_PROFILES,
  LINEAGE_LANE_REFERENCES,
  type LineageFrameReference,
  type LineageLaneReference,
} from '../../bot/src/tierEntry/profiles';
import { validateBuild } from '../../bot/src/loadout/loadout';
import { BOT_SPAWN, setupArena, teardownArena } from './balance/arena';
import { BENCH_BOT_ID, materializeBot } from './balance/botFactory';
import { reviveInFarmNode } from './balance/runFarm';
import { createFarmWorld } from './balance/worldFactory';
import type { BuildSpec, GearSlot } from './balance/types';
import { hydrateHitboxCacheFromArtifact, writeHitboxArtifact } from '../src/hitbox/cache';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { refillBarrier } from '../src/systems/defense/barrier/barrier';
import { isPlayerActivelyInCombat } from '../src/systems/combat/ai/engagement';
import {
  registerCombatListener,
  unregisterCombatListener,
  type CombatEventHandler,
} from '../src/systems/combat/engine/combatPipeline';
import { setAbilityLoadout } from '../src/systems/player/economy/abilityCrafting';
import { setLineageActive, unlockLineageCard } from '../src/systems/player/economy/lineages';
import type { PlayerEntity } from '../src/ecs/entity';
import type { World } from '../src/world/World';

/**
 * Every biome with authored family blends, in map order: the five T1 biomes and
 * the two the T2 region adds. A biome absent from this list has no families yet,
 * so a node of it would resolve to an empty blend.
 */
const BENCH_BIOMES = [
  'plains', 'forest', 'mountain', 'cave', 'swamp', 'jungle', 'desert',
] as const;
const BENCH_TIERS = [1, 2] as const;

/**
 * Wallet credited before the cards are bought. Generous on purpose: the matrix
 * measures COMBAT, and a lane that could not afford its own band would be
 * measuring the economy instead. Every purchase still goes through the real
 * handler, so a mastery or prerequisite refusal is still a refusal.
 */
const BENCH_ESSENCE = 5_000;
const BENCH_SHARDS = 200;

// ── Node set: one row per DISTINCT resolved blend ─────────────────────────────

interface LaneNode {
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

function laneNodes(): LaneNode[] {
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
    const cycleKey = `${node.biomeGroup}|${node.biomeTier}|${resolved.cycle.join(',')}`;
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
      dropsLane: family.drops,
      punishesLane: family.punishes,
      unavailable: [...resolved.unavailable],
    });
  }
  return [...byKey.values()];
}

const short = (family: FamilyId): string => FAMILY_DATABASE.get(family)?.name ?? family;
const pct = (share: number): string => `${Math.round(share * 100)}%`;
/** `node-t2-jungle-03` as `t2-jungle-03`: short enough for a column heading. */
const shortNode = (nodeId: string): string => nodeId.replace('node-', '');

// ── Bot preparation ──────────────────────────────────────────────────────────

/**
 * A Tier-1 character with a Tier-1 frame: the state a lane reference profile
 * describes (`playerTier` 2 — a frame costs the point the second tier mints —
 * with Tier-1 gear, Tier-1 mastery and the Tier-1 lineage band).
 *
 * Deliberately NOT `prepareSurveyBot`: that helper asserts a tier-1 cell has no
 * frame, which is exactly the build §1.5 asks for, so reusing it would mean
 * loosening an assertion that is right for every other bench.
 */
function prepareLaneBot(
  world: World,
  profile: TierEntryProfile,
  /** Null for a frame reference: same preparation, no lineage band to buy. */
  reference: LineageLaneReference | null,
  nodeId: string,
): { bot: PlayerEntity; refusals: string[]; grantedShards: boolean } {
  const biome = NODE_BIOMES[nodeId].biomeGroup;
  const gearItemIds: Partial<Record<GearSlot, string>> = {};
  for (const [slot, itemId] of Object.entries(profile.equipment)) {
    if (itemId) gearItemIds[slot as GearSlot] = itemId;
  }
  const build: BuildSpec = {
    id: profile.id,
    classRoot: profile.classRoot,
    skillPath: [profile.classRoot, profile.frameId!],
    contentTier: 1,
    playerTier: 2,
    gearTier: 1,
    gearItemIds,
  };
  const bot = materializeBot(
    world,
    build,
    { nodeId, biomeGroup: biome, contentTier: 1, isDungeon: false },
    BOT_SPAWN,
    BENCH_BOT_ID,
  );

  // The profile's own +N per item, not one bench-wide level: the reference
  // carries its base form at +0 so a lane's card is never competing with an
  // upgrade ladder Phase 2 deletes for weapons anyway.
  for (const itemId of Object.keys(bot.holdsInventory.itemUpgrades)) {
    bot.holdsInventory.itemUpgrades[itemId] = profile.itemUpgrades[itemId] ?? 0;
  }

  const p = bot.tracksProgression;
  p.skillPoints = 0;
  p.equippedRites = [];
  p.attunedStances = [];
  p.equippedStances = { default: null };
  p.activeStance = null;
  p.attunedAbilities = { techniques: [], guards: [] };

  // The Tier-1 survey package: one technique, Second Wind, and the five-rule
  // behaviour policy with reference ability wiring. Ranged roots orbit.
  const melee = profile.classRoot === 'cadence-root' || profile.classRoot === 'cooldown-root';
  const abilities: AttunedAbilities = { techniques: ['sweep'], guards: ['second-wind'] };
  const rules: EquippedRule[] = withReferenceAbilityWiring([
    { conditionId: 'always', actionId: 'auto-path-enemy' },
    { conditionId: 'inside-telegraph', actionId: 'step-back' },
    ...(melee ? [] : [{ conditionId: 'in-combat', actionId: 'orbit' }]),
    { conditionId: 'always', actionId: 'avoid-hazards' },
    { conditionId: 'always', actionId: 'wait-for-regen' },
  ], abilities);
  for (const recipe of RUNE_RECIPE_DATABASE.values()) {
    if (recipe.deprecated || !recipe.runeId) continue;
    if (p.runesOwned.includes(recipe.runeId)) continue;
    if (!rules.some((rule) => rule.actionId === recipe.runeId)) continue;
    assert(isRuneRecipeUnlocked(recipe, p), `${profile.id}: unreachable rune ${recipe.id}`);
    p.runesOwned.push(recipe.runeId);
  }
  p.runesEquipped = rules;
  assert(setAbilityLoadout(world, bot, abilities).success, `${profile.id}: illegal ability budget`);

  // Buy the band through the real economy handler, so a refusal is a finding.
  for (const type of ESSENCE_TYPES) p.essences[type] = BENCH_ESSENCE;
  const lane = reference?.lane ?? null;
  const grantedShards = reference?.shardsUnobtainableAtT1 ?? false;
  if (lane) p.shards[lane] = BENCH_SHARDS;
  const refusals: string[] = [];
  if (reference) {
    const lineage = LINEAGE_DATABASE.get(reference.lineageId)!;
    for (const cardId of reference.cardIds) {
      const card = lineage.cards.find((c) => c.id === cardId)!;
      const bought = unlockLineageCard(world, bot, reference.lineageId, cardId);
      if (!bought.success) {
        refusals.push(`unlockCard ${cardId}: ${bought.reason}`);
        continue;
      }
      const activated = setLineageActive(world, bot, reference.lineageId, card.row, cardId);
      if (!activated.success) refusals.push(`setActive ${cardId}: ${activated.reason}`);
    }
  }
  // Zero the credited wallet again: a reference build does not walk into a node
  // holding five thousand of every essence, and nothing in combat reads it.
  for (const type of ESSENCE_TYPES) p.essences[type] = 0;

  recalculatePlayerEntityStats(world, bot);
  syncArchetypeSlices(world, bot);
  bot.hasHealth.hp = bot.hasHealth.maxHp;
  refillBarrier(world, bot);

  const view = composePlayerView(bot)!;
  assert.deepEqual(
    validateBuild({ abilities, runeRules: rules, stances: { attuned: [], default: null }, rites: [] }, view),
    [],
    profile.id,
  );
  if (reference) {
    const tree = view.lineages[reference.lineageId];
    assert(tree, `${profile.id}: the worn base form opened no tree`);
    assert(tree.wornForm === reference.baseForm, `${profile.id}: worn form is the base form`);
  } else {
    // A frame reference buys nothing, so the only claim to check is that it is
    // still carrying the weapon the whole root shares.
    assert(bot.holdsInventory.equipment.weapon === profile.equipment.weapon,
      `${profile.id}: wears the root's reference weapon`);
  }
  return { bot, refusals, grantedShards };
}

// ── One measurement ──────────────────────────────────────────────────────────

interface Row {
  cellId: string;
  profileId: string;
  /** Null on a frame reference, which belongs to a root rather than a lineage. */
  lineageId: string | null;
  lane: PacketId | null;
  classRoot: string;
  /** Set on a frame reference only: the frame under test and its shape. */
  frameId?: string;
  frameShape?: string;
  nodeId: string;
  biome: string;
  seed: number;
  kills: number;
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

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function measure(
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
  const onKill: CombatEventHandler = (ctx) => {
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
    const { bot, refusals, grantedShards } = prepareLaneBot(world, profile, reference, node.nodeId);
    for (; now < capMs;) {
      world.tick(100, now);
      now += 100;
      world.pendingDeaths = [];
      for (const event of world.takeNodeEvents(node.nodeId)) {
        if (event.kind === 'card-fx') fx[event.fx] = (fx[event.fx] ?? 0) + 1;
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
      ...(frame ? { frameId: frame.frameId, frameShape: frame.frameShape } : {}),
      nodeId: node.nodeId,
      biome: node.biome,
      seed, kills, deaths, engagedMs, capMs, damageDealt, refusals, grantedShards, mobCount, fx,
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

// ── Aggregation and the two §9 checks ────────────────────────────────────────

interface Cell {
  profileId: string;
  lineageId: string | null;
  lane: PacketId | null;
  classRoot: string;
  frameId?: string;
  frameShape?: string;
  nodeId: string;
  kills: number;
  deaths: number;
  engagedMs: number;
  capMs: number;
  refusals: string[];
  grantedShards: boolean;
  /** Kills per minute of SIM time — the throughput the checks compare. */
  killsPerMin: number;
  /** Mean engaged ms per kill — the TTK the brief asks for. */
  ttkMs: number | null;
  /** `card-fx` events pushed, keyed by fx — proof the lane's payoff fired. */
  fx: Record<string, number>;
  /** Damage taken per engaged second, or null when the run did not record it. */
  damageTakenPerSec: number | null;
  /** Mean HP fraction while engaged, or null when the run did not record it. */
  meanHpFraction: number | null;
}

/**
 * Pool rows into cells. `bySeed` groups by (cell, seed) instead of pooling the
 * seeds, which is what design §18.9's remap rule needs: a `drops` move is taken
 * only when BOTH seeds rank the lanes the same way, and a pooled cell cannot say
 * whether they did.
 */
function aggregate(rows: Row[], bySeed = false): Map<string, Cell> {
  const byCell = new Map<string, Row[]>();
  for (const row of rows) {
    const key = bySeed ? `${row.cellId}#${row.seed}` : row.cellId;
    const list = byCell.get(key) ?? [];
    list.push(row);
    byCell.set(key, list);
  }
  const out = new Map<string, Cell>();
  for (const [cellId, group] of byCell) {
    const kills = group.reduce((a, r) => a + r.kills, 0);
    const engagedMs = group.reduce((a, r) => a + r.engagedMs, 0);
    const capMs = group.reduce((a, r) => a + r.capMs, 0);
    out.set(cellId, {
      profileId: group[0].profileId,
      lineageId: group[0].lineageId,
      lane: group[0].lane,
      classRoot: group[0].classRoot,
      frameId: group[0].frameId,
      frameShape: group[0].frameShape,
      nodeId: group[0].nodeId,
      kills,
      deaths: group.reduce((a, r) => a + r.deaths, 0),
      engagedMs,
      capMs,
      refusals: [...new Set(group.flatMap((r) => r.refusals))],
      grantedShards: group[0].grantedShards,
      killsPerMin: kills / (capMs / 60_000),
      ttkMs: kills > 0 ? Math.round(engagedMs / kills) : null,
      fx: group.reduce<Record<string, number>>((acc, r) => {
        for (const [key, count] of Object.entries(r.fx)) acc[key] = (acc[key] ?? 0) + count;
        return acc;
      }, {}),
      damageTakenPerSec: group.every((r) => r.damageTaken === undefined) || engagedMs === 0
        ? null
        : group.reduce((a, r) => a + (r.damageTaken ?? 0), 0) / (engagedMs / 1000),
      meanHpFraction: (() => {
        const samples = group.reduce((a, r) => a + (r.hpSamples ?? 0), 0);
        if (samples === 0) return null;
        return group.reduce((a, r) => a + (r.hpFractionSum ?? 0), 0) / samples;
      })(),
    });
  }
  return out;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const fmt = (x: number | null, digits = 2): string => (x === null ? '—' : x.toFixed(digits));
const signedPct = (x: number | null): string =>
  x === null ? '—' : `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;

async function main(): Promise<void> {
  const out = resolve(process.argv[2] ?? '../reports/progression-phase1');
  const capMs = Number(process.env.LANE_CAP_MS ?? 90_000);
  const seeds = (process.env.LANE_SEEDS ?? '101009,101033').split(',').map(Number);
  const filter = process.env.LANE_FILTER;
  const biomeFilter = process.env.LANE_NODES?.split(',');
  // Node-level filter, for the narrower survival pass: the TTK matrix wants every
  // blend, the survival pass only needs one node per biome.
  const nodeFilter = process.env.LANE_ONLY?.split(',');
  mkdirSync(out, { recursive: true });

  if (!process.env.LANE_REPLAY) {
    const artifact = process.env.LANE_HITBOX ?? join(tmpdir(), 'mmo-lane-matrix-hitboxes.json');
    if (!existsSync(artifact)) await writeHitboxArtifact(artifact);
    assert(hydrateHitboxCacheFromArtifact(artifact) > 0, 'hitbox cache is empty');
  }

  const tierFilter = process.env.LANE_TIERS?.split(',').map(Number);
  const nodes = laneNodes()
    .filter((n) => !biomeFilter || biomeFilter.includes(n.biome))
    .filter((n) => !tierFilter || tierFilter.includes(n.tier))
    .filter((n) => !nodeFilter || nodeFilter.includes(n.nodeId));
  const references = LINEAGE_LANE_REFERENCES.filter((r) => !filter || r.profileId.includes(filter));
  assert(nodes.length > 0 && references.length > 0, 'nothing selected');

  // ── The frames column's node set (design §18.10) ──────────────────────────
  //
  // Deliberately narrower than the lane matrix's. The column answers what
  // Light/Balanced/Heavy is worth PER ROOT, which one encounter per biome
  // already says; running eighteen more profiles over all 62 blends would have
  // trebled the run for a reading nobody asked for. One node per (biome, tier):
  // the biome's first blend, which is its first family's own 70% node.
  const frameNodeIds = process.env.LANE_FRAME_NODES?.split(',');
  const frameNodes = frameNodeIds
    ? nodes.filter((n) => frameNodeIds.includes(n.nodeId))
    : (() => {
      // FIRST per (biome, tier), not last: that is the biome's leading family's
      // own 70/20/10 node, a real encounter rather than the 34/33/33 blur the
      // list ends on.
      const byBiome = new Map<string, LaneNode>();
      for (const node of nodes) {
        const key = `${node.biome}|${node.tier}`;
        if (!byBiome.has(key)) byBiome.set(key, node);
      }
      return [...byBiome.values()];
    })();
  const frameReferences = process.env.LANE_FRAMES === '0'
    ? []
    : LINEAGE_FRAME_REFERENCES.filter((r) => !filter || r.profileId.includes(filter));

  // Regenerating the report is a report change, not a measurement, so it must not
  // cost another three quarters of an hour: `LANE_REPLAY` reads a previous run's
  // `lane-matrix.json` and rebuilds every table from its stored rows.
  const replay = process.env.LANE_REPLAY;
  const rows: Row[] = [];
  const startedAt = Date.now();
  if (replay) {
    const stored = JSON.parse(readFileSync(resolve(replay), 'utf8')) as { rows: Row[] };
    assert(Array.isArray(stored.rows) && stored.rows.length > 0, `${replay} holds no rows`);
    rows.push(...stored.rows);
    console.log(`replaying ${rows.length} measured rows from ${replay}`);
  }
  const sweep = (
    jobs: Array<{ profileId: string; profile: TierEntryProfile; lane: LineageLaneReference | null; frame: LineageFrameReference | null; nodes: LaneNode[] }>,
  ): void => {
    for (const job of jobs) {
      for (const node of job.nodes) {
        for (const seed of seeds) {
          rows.push(measure(job.profile, job.lane, job.frame, node, seed, capMs));
        }
        const cell = rows.slice(-seeds.length);
        const kills = cell.reduce((a, r) => a + r.kills, 0);
        const engaged = cell.reduce((a, r) => a + r.engagedMs, 0);
        console.log(
          `${job.profileId.padEnd(30)} ${node.nodeId.padEnd(22)} kills=${String(kills).padStart(3)}` +
          ` ttk=${kills ? Math.round(engaged / kills) : '—'}ms deaths=${cell.reduce((a, r) => a + r.deaths, 0)}` +
          ` fx=${cell.reduce((a, r) => a + Object.values(r.fx).reduce((x, y) => x + y, 0), 0)}` +
          (cell[0].refusals.length ? ` REFUSED ${cell[0].refusals.join('; ')}` : ''),
        );
      }
    }
  };
  if (!replay) {
    sweep(references.map((reference) => ({
      profileId: reference.profileId,
      profile: LINEAGE_LANE_PROFILES.get(reference.profileId)!,
      lane: reference,
      frame: null,
      nodes,
    })));
    sweep(frameReferences.map((reference) => ({
      profileId: reference.profileId,
      profile: LINEAGE_FRAME_PROFILES.get(reference.profileId)!,
      lane: null,
      frame: reference,
      nodes: frameNodes,
    })));
  }
  const elapsedMs = replay ? 0 : Date.now() - startedAt;

  const cells = aggregate(rows);
  const seedCells = aggregate(rows, true);
  const cellFor = (profileId: string, nodeId: string): Cell | undefined =>
    cells.get(`${profileId}@${nodeId}`);
  const seedCellFor = (profileId: string, nodeId: string, seed: number): Cell | undefined =>
    seedCells.get(`${profileId}@${nodeId}#${seed}`);
  const baselineId = (lineageId: string): string => `lineage-${lineageId}-baseline`;

  /** Uplift of a lane cell over its own lineage's control on the same node. */
  const uplift = (cell: Cell): number | null => {
    if (!cell.lane || !cell.lineageId) return null;
    const control = cellFor(baselineId(cell.lineageId), cell.nodeId);
    if (!control || control.killsPerMin <= 0) return null;
    return cell.killsPerMin / control.killsPerMin - 1;
  };
  /** The same uplift inside ONE seed — the reading the remap rule needs. */
  const seedUplift = (reference: LineageLaneReference, nodeId: string, seed: number): number | null => {
    if (!reference.lane) return null;
    const cell = seedCellFor(reference.profileId, nodeId, seed);
    const control = seedCellFor(baselineId(reference.lineageId), nodeId, seed);
    if (!cell || !control || control.killsPerMin <= 0) return null;
    return cell.killsPerMin / control.killsPerMin - 1;
  };

  /**
   * Kills a cell AND its control each need before their ratio may be RANKED.
   *
   * A ratio of small counts is not a measurement: a control that killed one mob
   * and a lane that killed two read as +100% uplift, and on the Tier-2 nodes a
   * Tier-1 band routinely kills nought to three in ninety seconds while dying
   * eight times. Those cells are a real finding about Tier-2 entry — they are
   * reported in full in the per-node tables — but they must not be allowed to
   * decide a ranking, least of all a `drops` remap. Eight per seed is well below
   * every Tier-1 cell (15 to 30) and well above every Desert one (0).
   */
  const MIN_KILLS_PER_SEED_FOR_RANK = 8;
  const rankable = (profileId: string, lineageId: string, nodeId: string, seed?: number): boolean => {
    const min = MIN_KILLS_PER_SEED_FOR_RANK * (seed === undefined ? seeds.length : 1);
    const cell = seed === undefined ? cellFor(profileId, nodeId) : seedCellFor(profileId, nodeId, seed);
    const control = seed === undefined
      ? cellFor(baselineId(lineageId), nodeId)
      : seedCellFor(baselineId(lineageId), nodeId, seed);
    return !!cell && !!control && cell.kills >= min && control.kills >= min;
  };

  // ── The matrix ─────────────────────────────────────────────────────────────
  const laneRefs = references.filter((r) => r.lane);
  const matrix: string[] = [
    '| node | tier | biome | authored blend | resolved blend | shares this row | mobs (of 10 slots) |',
    '|---|---:|---|---|---|---|---|',
    ...nodes.map((n) => `| \`${n.nodeId}\` | ${n.tier} | ${n.biome} | ${n.authored} | ${n.resolved} | ${n.aliases.length} node(s): ${n.aliases.map(shortNode).join(', ')} | ${n.mobs.map((m) => `${m.monsterTypeId} x${m.slots}`).join(', ')} |`),
  ];

  // ── TTK per lane per node ────────────────────────────────────────────────
  //
  // One table per TIER. Sixty-two columns in a single table is not a table
  // anyone can read, and the T1 and T2 rows are different questions anyway.
  const pivotFor = (
    tier: number,
    refs: readonly LineageLaneReference[],
    render: (cell: Cell | undefined) => string,
  ): string[] => {
    const tierNodes = nodes.filter((n) => n.tier === tier);
    if (tierNodes.length === 0) return [];
    return [
      `| profile | lane | class | ${tierNodes.map((n) => shortNode(n.nodeId)).join(' | ')} |`,
      `|---|---|---|${tierNodes.map(() => '---:').join('|')}|`,
      ...refs.map((reference) => `| \`${reference.profileId}\` | ${reference.lane ?? '_control_'} | ${reference.classRoot.replace('-root', '')} | ${tierNodes.map((n) => render(cellFor(reference.profileId, n.nodeId))).join(' | ')} |`),
    ];
  };
  const ttkCell = (cell: Cell | undefined): string => (cell?.ttkMs == null ? '—' : String(cell.ttkMs));
  const upliftCell = (cell: Cell | undefined): string => (cell ? signedPct(uplift(cell)) : '—');
  const pivot = BENCH_TIERS.flatMap((tier) => {
    const table = pivotFor(tier, references, ttkCell);
    return table.length ? [`**Tier ${tier}**`, '', ...table, ''] : [];
  });
  const upliftPivot = BENCH_TIERS.flatMap((tier) => {
    const table = pivotFor(tier, laneRefs, upliftCell);
    return table.length ? [`**Tier ${tier}**`, '', ...table, ''] : [];
  });

  const perNode: string[] = [];
  for (const node of nodes) {
    perNode.push('', `### \`${node.nodeId}\` — ${node.resolved} (${node.biome} T${node.tier}; shared by ${node.aliases.length} authored node${node.aliases.length === 1 ? '' : 's'})`, '');
    perNode.push(`Dominant family **${short(node.dominant)}** drops \`${node.dropsLane}\`, punishes \`${node.punishesLane}\`. Authored ${node.authored}; unfieldable at T${node.tier}: ${node.unavailable.map(short).join(', ') || 'none'}.`, '');
    perNode.push('| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |', '|---|---|---|---:|---:|---:|---:|---:|---|');
    for (const reference of references) {
      const cell = cellFor(reference.profileId, node.nodeId);
      if (!cell) continue;
      perNode.push(
        `| \`${reference.profileId}\` | ${reference.lane ?? '_control_'} | ${reference.classRoot.replace('-root', '')} | ${cell.kills} | ${fmt(cell.ttkMs, 0)} | ${fmt(cell.killsPerMin)} | ${reference.lane ? signedPct(uplift(cell)) : '—'} | ${cell.deaths} | ${Object.entries(cell.fx).map(([k, v]) => `${k} x${v}`).join(', ') || '—'} |` +
        (cell.refusals.length ? ` <!-- ${cell.refusals.join('; ')} -->` : ''),
      );
    }
    for (const reference of frameReferences) {
      const cell = cellFor(reference.profileId, node.nodeId);
      if (!cell) continue;
      perNode.push(
        `| \`${reference.profileId}\` | _frame ${reference.frameShape}_ | ${reference.classRoot.replace('-root', '')} | ${cell.kills} | ${fmt(cell.ttkMs, 0)} | ${fmt(cell.killsPerMin)} | — | ${cell.deaths} | ${Object.entries(cell.fx).map(([k, v]) => `${k} x${v}`).join(', ') || '—'} |`,
      );
    }
  }

  // ── §18.9 lane budget, on the lane's favoured node ────────────────────────
  //
  // "Favoured" is read off `FamilyDefinition.drops`, which design §18.7 confirms
  // IS the definition of favours — the family table carries no second `favours`
  // field and is not getting one.
  //
  // The band is design §18.9's, not §9's: the median uplift ±3 PERCENTAGE
  // POINTS, absolute. §9's "±10% of the tier median" is a proportion of a number
  // that is itself small, so at a +4.3% median it reads +3.9% to +4.7% — tighter
  // than the measurement noise, and unsatisfiable by construction. The absolute
  // ±10% column is kept beside it only to show what the retired criterion said.
  const BAND_PP = 0.03;
  const favouredNodeFor = (lane: PacketId, tier?: number): LaneNode | undefined => {
    const candidates = nodes
      .filter((n) => n.dropsLane === lane)
      .filter((n) => tier === undefined || n.tier === tier);
    if (candidates.length === 0) return undefined;
    // The node this family dominates hardest, so the contrast is as strong as
    // the map allows.
    return candidates.sort((a, b) => b.dominantShare - a.dominantShare)[0];
  };

  interface BudgetRow {
    reference: LineageLaneReference;
    node: LaneNode | null;
    absolute: number | null;
    upliftValue: number | null;
  }
  const budgetTableFor = (tier: number): { rows: BudgetRow[]; upMedian: number; lines: string[] } => {
    const rowsForTier: BudgetRow[] = laneRefs.map((reference) => {
      const node = favouredNodeFor(reference.lane!, tier) ?? null;
      const cell = node ? cellFor(reference.profileId, node.nodeId) : undefined;
      return {
        reference,
        node,
        absolute: cell ? cell.killsPerMin : null,
        upliftValue: cell ? uplift(cell) : null,
      };
    });
    const absMedianTier = median(rowsForTier.flatMap((r) => (r.absolute === null ? [] : [r.absolute])));
    const upMedianTier = median(rowsForTier.flatMap((r) => (r.upliftValue === null ? [] : [r.upliftValue])));
    const lines = [
      `**Tier ${tier}.** Median lane uplift on the favoured node: **${signedPct(upMedianTier)}**.`
      + ` The §18.9 band is ${signedPct(upMedianTier - BAND_PP)} to ${signedPct(upMedianTier + BAND_PP)}`
      + ` (median ±3 pp). Median absolute throughput there: ${fmt(absMedianTier)} kills/min.`,
      '',
      '| lane | profile | favoured node | uplift | uplift − median | in ±3 pp (§18.9) | kills/min | in ±10% abs (§9, retired) | shards |',
      '|---|---|---|---:|---:|:--:|---:|:--:|---|',
      ...rowsForTier.map((r) => {
        const deviation = r.absolute === null || absMedianTier === 0 ? null : r.absolute / absMedianTier - 1;
        const delta = r.upliftValue === null ? null : r.upliftValue - upMedianTier;
        return `| ${r.reference.lane} | \`${r.reference.profileId}\` | ${r.node ? `\`${r.node.nodeId}\`` : `**no T${tier} node favours this lane**`} | ${signedPct(r.upliftValue)} | ${delta === null ? '—' : signedPct(delta)} | ${delta === null ? 'n/a' : (Math.abs(delta) <= BAND_PP ? 'yes' : 'NO')} | ${fmt(r.absolute)} | ${deviation === null ? 'n/a' : (Math.abs(deviation) <= 0.10 ? 'yes' : 'NO')} | ${r.reference.shardsUnobtainableAtT1 ? 'granted (no T1 source)' : 'earned'} |`;
      }),
      '',
    ];
    return { rows: rowsForTier, upMedian: upMedianTier, lines };
  };
  const budgetByTier = BENCH_TIERS
    .filter((tier) => nodes.some((n) => n.tier === tier))
    .map((tier) => ({ tier, ...budgetTableFor(tier) }));
  const budget = budgetByTier.flatMap((b) => b.lines);
  const budgetRows = budgetByTier[0]?.rows ?? [];
  const upMedian = budgetByTier[0]?.upMedian ?? 0;
  const absMedian = median(budgetRows.flatMap((r) => (r.absolute === null ? [] : [r.absolute])));

  // ── §18.9 lane budget at the PACKET level ─────────────────────────────────
  //
  // The budget's unit is the lane (the packet), not the (lineage, lane) pair:
  // three lineages carry Tempo and they must not each be judged alone. So a
  // packet's reading is the mean of its references' mean uplift over every node,
  // and the band is the median PACKET ±3 pp. This is the table the designer
  // tunes `PACKET_BUDGET` from.
  const packetRows = [...new Set(laneRefs.map((r) => r.lane!))].map((lane) => {
    const refs = laneRefs.filter((r) => r.lane === lane);
    const means = refs.flatMap((reference) => {
      const values = nodes.flatMap((n) => {
        const cell = cellFor(reference.profileId, n.nodeId);
        if (!cell) return [];
        const u = uplift(cell);
        return u === null ? [] : [u];
      });
      return values.length === 0 ? [] : [values.reduce((a, b) => a + b, 0) / values.length];
    });
    const fxTotal = refs.reduce((total, reference) => total + nodes.reduce(
      (sub, n) => sub + Object.values(cellFor(reference.profileId, n.nodeId)?.fx ?? {}).reduce((a, b) => a + b, 0),
      0,
    ), 0);
    return {
      lane,
      lineages: refs.length,
      mean: means.length ? means.reduce((a, b) => a + b, 0) / means.length : null,
      fxTotal,
      favoured: favouredNodeFor(lane) ?? null,
    };
  }).sort((a, b) => (b.mean ?? -1) - (a.mean ?? -1));
  const packetMedian = median(packetRows.flatMap((r) => (r.mean === null ? [] : [r.mean])));
  const packetBudget: string[] = [
    `Median packet uplift: **${signedPct(packetMedian)}**. The §18.9 band is` +
    ` ${signedPct(packetMedian - BAND_PP)} to ${signedPct(packetMedian + BAND_PP)} (median ±3 pp).`,
    '',
    '| packet | lineages carrying it | mean uplift | − median | in ±3 pp | payoff fx fired | hardest favouring node |',
    '|---|---:|---:|---:|:--:|---:|---|',
    ...packetRows.map((r) => {
      const delta = r.mean === null ? null : r.mean - packetMedian;
      return `| ${r.lane} | ${r.lineages} | ${signedPct(r.mean)} | ${delta === null ? '—' : signedPct(delta)} | ${delta !== null && Math.abs(delta) <= BAND_PP ? 'yes' : 'NO'} | ${r.fxTotal} | ${r.favoured ? `\`${r.favoured.nodeId}\`` : '**none**'} |`;
    }),
  ];

  // ── §18.9 encounter check: an ORDINAL reading, per fieldable family ───────
  //
  // §18.9 replaces §9's "does the favoured lane win by ~30%?" with a ranking:
  // does the favoured lane out-uplift the punished lane on that family's own
  // node, and by what margin? The margin is REPORTED, never thresholded. A
  // family whose favoured lane ranks below its punished lane is a monster-shape
  // finding for Phase 4 (§18.7: `drops` stays the definition of favours, so the
  // mobs are what must move), not a magnitude to tune.
  //
  // Uplift, not absolute throughput, is the ranked quantity: the absolute column
  // is mostly which class each lineage's reference wears, and the five controls
  // themselves span more than 30%. A lane's reading on a node is the MEDIAN
  // uplift of the references carrying it.
  //
  // The per-seed ranks are reported beside the pooled one, because design
  // §18 3b's remap is only taken when both seeds agree: "favoured ranks last
  // with both seeds, and one other lane ranks first with both seeds".
  interface LaneRank {
    lane: PacketId;
    up: number;
    rank: number;
    refs: number;
  }
  const ranksOn = (nodeId: string, seed?: number): LaneRank[] => {
    const byLane = new Map<PacketId, number[]>();
    for (const reference of laneRefs) {
      if (!rankable(reference.profileId, reference.lineageId, nodeId, seed)) continue;
      const value = seed === undefined
        ? (() => {
          const cell = cellFor(reference.profileId, nodeId);
          return cell ? uplift(cell) : null;
        })()
        : seedUplift(reference, nodeId, seed);
      if (value === null) continue;
      const list = byLane.get(reference.lane!) ?? [];
      list.push(value);
      byLane.set(reference.lane!, list);
    }
    const scored = [...byLane.entries()]
      .map(([lane, values]) => ({ lane, up: median(values), refs: values.length }))
      .sort((a, b) => b.up - a.up);
    return scored.map((entry, index) => ({ ...entry, rank: index + 1 }));
  };
  const rankOf = (list: LaneRank[], lane: PacketId): LaneRank | undefined =>
    list.find((r) => r.lane === lane);

  /**
   * A family's OWN node: the one where it reaches its highest resolved share,
   * and only when that share is a clear majority (the 70/20/10 and 70/30 shapes,
   * never a 45/45/10 or a 34/33/33 where two families share the encounter).
   */
  const OWN_NODE_SHARE = 0.6;
  const ownNodeOf = (family: FamilyId, tier: number): LaneNode | undefined => {
    const candidates = nodes
      .filter((n) => n.dominant === family && n.tier === tier && n.dominantShare >= OWN_NODE_SHARE)
      .sort((a, b) => b.dominantShare - a.dominantShare);
    return candidates[0];
  };

  interface EncounterRow {
    family: FamilyId;
    node: LaneNode;
    favoured: PacketId;
    punished: PacketId;
    favRank: LaneRank | undefined;
    punRank: LaneRank | undefined;
    lanesRanked: number;
    marginPp: number | null;
    perSeed: Array<{ seed: number; favRank: number | null; topLane: PacketId | null; lanes: number }>;
    /** The §18 3b remap test: favoured last and one other lane first, both seeds. */
    clearRemap: { favouredLast: boolean; topLane: PacketId | null };
  }
  const encounterRows: EncounterRow[] = [];
  const encounter: string[] = [
    '| family | own node | tier | favoured | rank | punished | rank | margin (fav − pun) | lanes | per-seed fav rank | per-seed top lane | fav deaths | pun deaths |',
    '|---|---|---:|---|---:|---|---:|---:|---:|---|---|---:|---:|',
  ];
  const familyTiers = [...new Set(nodes.map((n) => `${n.dominant}|${n.tier}`))]
    .map((key) => {
      const [family, tier] = key.split('|');
      return { family: family as FamilyId, tier: Number(tier) };
    })
    .sort((a, b) => (a.family === b.family ? a.tier - b.tier : a.family.localeCompare(b.family)));
  for (const { family, tier } of familyTiers) {
    const node = ownNodeOf(family, tier);
    if (!node) continue;
    const pooled = ranksOn(node.nodeId);
    if (pooled.length === 0) continue;
    const favRank = rankOf(pooled, node.dropsLane);
    const punRank = rankOf(pooled, node.punishesLane);
    const perSeed = seeds.map((seed) => {
      const list = ranksOn(node.nodeId, seed);
      return {
        seed,
        favRank: rankOf(list, node.dropsLane)?.rank ?? null,
        topLane: list[0]?.lane ?? null,
        lanes: list.length,
      };
    });
    // "Last" only means something against a field. Four of the six weapon
    // packets have to be rankable on the node, in every seed, before a last
    // place is evidence of anything.
    const MIN_LANES_FOR_REMAP = 4;
    const wideEnough = pooled.length >= MIN_LANES_FOR_REMAP
      && perSeed.every((s) => s.lanes >= MIN_LANES_FOR_REMAP);
    const favouredLast = wideEnough
      && perSeed.length > 0
      && perSeed.every((s) => s.favRank !== null && s.favRank === s.lanes);
    const topLanes = new Set(perSeed.map((s) => s.topLane));
    const topLane = wideEnough && topLanes.size === 1 && perSeed[0].topLane !== node.dropsLane
      ? perSeed[0].topLane
      : null;
    const deathsFor = (lane: PacketId): number => laneRefs
      .filter((r) => r.lane === lane)
      .reduce((a, r) => a + (cellFor(r.profileId, node.nodeId)?.deaths ?? 0), 0);
    const row: EncounterRow = {
      family,
      node,
      favoured: node.dropsLane,
      punished: node.punishesLane,
      favRank,
      punRank,
      lanesRanked: pooled.length,
      marginPp: favRank && punRank ? favRank.up - punRank.up : null,
      perSeed,
      clearRemap: { favouredLast, topLane },
    };
    encounterRows.push(row);
    encounter.push(
      `| ${short(family)} | \`${node.nodeId}\` | ${node.tier} | ${node.dropsLane}`
      + ` | ${favRank ? `${favRank.rank}/${pooled.length}` : 'no reference'}`
      + ` | ${node.punishesLane} | ${punRank ? `${punRank.rank}/${pooled.length}` : 'no reference'}`
      + ` | ${signedPct(row.marginPp)} | ${pooled.length}`
      + ` | ${perSeed.map((s) => (s.favRank === null ? '—' : `${s.favRank}/${s.lanes}`)).join(' / ')}`
      + ` | ${perSeed.map((s) => s.topLane ?? '—').join(' / ')}`
      + ` | ${deathsFor(node.dropsLane)} | ${deathsFor(node.punishesLane)} |`,
    );
  }

  // The remap shortlist: exactly design §18 3b's test, computed rather than eyeballed.
  //
  // A family's DECIDING node is its own node at the LOWEST tier it has one, because
  // the reference build is a Tier-1 band and Tier 1 is the tier that band is tuned
  // for; a higher tier's own node is reported beside it as corroboration. A
  // T2-only family (Jungle, Desert) has only the T2 reading and is decided on it.
  const decidingRows = [...new Map(encounterRows.map((r) => [r.family, r] as const)).values()];
  const remapCandidates = decidingRows.filter((r) => r.clearRemap.favouredLast && r.clearRemap.topLane);
  const remap: string[] = remapCandidates.length === 0
    ? ['No family meets the test: no `drops` move is CLEAR on this run.']
    : [
      '| family | deciding node | drops today | ranks | the lane that beats it | both seeds agree | higher tier agrees | move to |',
      '|---|---|---|---:|---|:--:|:--:|---|',
      ...remapCandidates.map((r) => {
        const others = encounterRows.filter((o) => o.family === r.family && o !== r);
        const agree = others.length === 0
          ? 'n/a (one tier)'
          : others.every((o) => o.clearRemap.favouredLast) ? 'yes' : 'NO';
        return `| ${short(r.family)} | \`${r.node.nodeId}\` | \`${r.favoured}\` | last of ${r.lanesRanked} | \`${r.clearRemap.topLane}\` | yes | ${agree} | \`${r.clearRemap.topLane}\` |`;
      }),
    ];

  // ── Per-lane summary over ALL nodes: the most robust lane signal ───────────
  const laneSummary: string[] = [
    '| lane | profile | mean uplift over all nodes | uplift on favoured node | worst node | best node | payoff fx fired (all nodes) |',
    '|---|---|---:|---:|---|---|---:|',
  ];
  for (const reference of laneRefs) {
    const perNodeUplift = nodes.flatMap((n) => {
      const cell = cellFor(reference.profileId, n.nodeId);
      if (!cell) return [];
      const u = uplift(cell);
      return u === null ? [] : [{ nodeId: n.nodeId, u }];
    });
    if (perNodeUplift.length === 0) continue;
    const mean = perNodeUplift.reduce((a, b) => a + b.u, 0) / perNodeUplift.length;
    const sorted = [...perNodeUplift].sort((a, b) => a.u - b.u);
    const favNode = favouredNodeFor(reference.lane!, 1) ?? favouredNodeFor(reference.lane!);
    const favCell = favNode ? cellFor(reference.profileId, favNode.nodeId) : undefined;
    laneSummary.push(
      `| ${reference.lane} | \`${reference.profileId}\` | ${signedPct(mean)} | ${favCell ? signedPct(uplift(favCell)) : '—'} | ${shortNode(sorted[0].nodeId)} ${signedPct(sorted[0].u)} | ${shortNode(sorted.at(-1)!.nodeId)} ${signedPct(sorted.at(-1)!.u)} | ${nodes.reduce((total, n) => total + Object.values(cellFor(reference.profileId, n.nodeId)?.fx ?? {}).reduce((a, b) => a + b, 0), 0)} |`,
    );
  }

  // ── Control spread: how much of the absolute reading is class, not lane ───
  const controls = references.filter((r) => !r.lane).map((r) => {
    const perNodeThroughput = nodes.flatMap((n) => {
      const cell = cellFor(r.profileId, n.nodeId);
      return cell ? [cell.killsPerMin] : [];
    });
    return { reference: r, mean: perNodeThroughput.reduce((a, b) => a + b, 0) / Math.max(1, perNodeThroughput.length) };
  });
  const controlMedian = median(controls.map((c) => c.mean));
  const controlSpread: string[] = [
    '| control | class | weapon | mean kills/min over all nodes | vs control median |',
    '|---|---|---|---:|---:|',
    ...controls.map((c) => `| \`${c.reference.profileId}\` | ${c.reference.classRoot.replace('-root', '')} | ${c.reference.baseForm} | ${fmt(c.mean)} | ${signedPct(controlMedian === 0 ? null : c.mean / controlMedian - 1)} |`),
  ];

  // ── Survival, for the lanes whose T1 payoff is not damage ─────────────────
  const survival: string[] = [
    '| profile | lane | class | mean HP while engaged | damage taken / engaged s | deaths | Δ HP vs control | Δ damage taken vs control |',
    '|---|---|---|---:|---:|---:|---:|---:|',
  ];
  for (const reference of references) {
    const cellsForRef = nodes.flatMap((n) => {
      const cell = cellFor(reference.profileId, n.nodeId);
      return cell ? [cell] : [];
    });
    if (cellsForRef.length === 0) continue;
    const withHp = cellsForRef.filter((c) => c.meanHpFraction !== null);
    if (withHp.length === 0) continue;
    const hp = withHp.reduce((a, c) => a + (c.meanHpFraction ?? 0), 0) / withHp.length;
    const withDmg = cellsForRef.filter((c) => c.damageTakenPerSec !== null);
    const dps = withDmg.length === 0
      ? null
      : withDmg.reduce((a, c) => a + (c.damageTakenPerSec ?? 0), 0) / withDmg.length;
    const controls = nodes.flatMap((n) => {
      const cell = cellFor(baselineId(reference.lineageId), n.nodeId);
      return cell && cell.meanHpFraction !== null ? [cell] : [];
    });
    const controlHp = controls.length
      ? controls.reduce((a, c) => a + (c.meanHpFraction ?? 0), 0) / controls.length
      : null;
    const controlDps = controls.length
      ? controls.reduce((a, c) => a + (c.damageTakenPerSec ?? 0), 0) / controls.length
      : null;
    survival.push(
      `| \`${reference.profileId}\` | ${reference.lane ?? '_control_'} | ${reference.classRoot.replace('-root', '')} | ${fmt(hp)} | ${fmt(dps)} | ${cellsForRef.reduce((a, c) => a + c.deaths, 0)} | ${reference.lane && controlHp ? signedPct(hp / controlHp - 1) : '—'} | ${reference.lane && controlDps ? signedPct((dps ?? 0) / controlDps - 1) : '—'} |`,
    );
  }

  // ── The frames column (design §18.10) ─────────────────────────────────────
  //
  // Per root, the three frames' throughput on the frame node set, and each
  // frame's delta against the frame that root's own canonical T1 route wears.
  // That frame is the denominator because it is the build every other bench in
  // the repo measures, and because `LINEAGE_LANE_REFERENCES` uses it too — so a
  // root's canonical frame cell and its lane-matrix control are the same build
  // and the two readings can be read together.
  //
  // There is no control-relative uplift here and there must not be: a frame is
  // not optional. Every T1 character has bought one, so "the same build without
  // a frame" is not a character and a frame has nothing to be an uplift over.
  // The reading is frame-against-frame inside one root.
  const frameRows = frameReferences.map((reference) => {
    const cellsForRef = frameNodes.flatMap((n) => {
      const cell = cellFor(reference.profileId, n.nodeId);
      return cell ? [{ node: n, cell }] : [];
    });
    const throughput = cellsForRef.length
      ? cellsForRef.reduce((a, c) => a + c.cell.killsPerMin, 0) / cellsForRef.length
      : null;
    const ttk = cellsForRef.flatMap((c) => (c.cell.ttkMs === null ? [] : [c.cell.ttkMs]));
    return {
      reference,
      throughput,
      ttk: ttk.length ? median(ttk) : null,
      deaths: cellsForRef.reduce((a, c) => a + c.cell.deaths, 0),
      hp: (() => {
        const withHp = cellsForRef.filter((c) => c.cell.meanHpFraction !== null);
        return withHp.length
          ? withHp.reduce((a, c) => a + (c.cell.meanHpFraction ?? 0), 0) / withHp.length
          : null;
      })(),
      measured: cellsForRef.length,
    };
  });
  const frameDelta = (row: (typeof frameRows)[number]): number | null => {
    const canonical = frameRows.find(
      (r) => r.reference.classRoot === row.reference.classRoot && r.reference.canonical,
    );
    if (!canonical || !canonical.throughput || row.throughput === null) return null;
    return row.throughput / canonical.throughput - 1;
  };
  const frameColumn: string[] = frameRows.length === 0
    ? ['Not measured on this run (`LANE_FRAMES=0`).']
    : [
      `Eighteen lane-less frame references over ${frameNodes.length} node`
      + `${frameNodes.length === 1 ? '' : 's'}`
      + ` (${frameNodes.map((n) => shortNode(n.nodeId)).join(', ')}).`,
      '',
      "| root | frame | shape | weapon | kills/min | vs the root's canonical frame | median TTK (ms) | mean HP engaged | deaths |",
      '|---|---|---|---|---:|---:|---:|---:|---:|',
      ...frameRows.map((row) => `| ${row.reference.classRoot.replace('-root', '')} | \`${row.reference.frameId}\` | ${row.reference.frameShape}${row.reference.canonical ? ' **(canonical)**' : ''} | ${row.reference.baseForm} | ${fmt(row.throughput)} | ${row.reference.canonical ? '_denominator_' : signedPct(frameDelta(row))} | ${fmt(row.ttk, 0)} | ${fmt(row.hp)} | ${row.deaths} |`),
      '',
      '### The same reading per frame SHAPE, across all six roots',
      '',
      '| shape | mean kills/min | mean delta vs each root\'s canonical frame | roots where it is fastest |',
      '|---|---:|---:|---:|',
      ...FRAME_SHAPES.map((shape) => {
        const group = frameRows.filter((r) => r.reference.frameShape === shape);
        const values = group.flatMap((r) => (r.throughput === null ? [] : [r.throughput]));
        const deltas = group.flatMap((r) => {
          const delta = frameDelta(r);
          return delta === null ? [] : [delta];
        });
        const fastest = new Set(frameRows.map((r) => r.reference.classRoot)).size === 0 ? 0
          : [...new Set(frameRows.map((r) => r.reference.classRoot))].filter((root) => {
            const inRoot = frameRows.filter((r) => r.reference.classRoot === root);
            const best = inRoot.reduce((a, b) => ((b.throughput ?? -1) > (a.throughput ?? -1) ? b : a));
            return best.reference.frameShape === shape;
          }).length;
        return `| ${shape} | ${values.length ? fmt(values.reduce((a, b) => a + b, 0) / values.length) : '—'} | ${deltas.length ? signedPct(deltas.reduce((a, b) => a + b, 0) / deltas.length) : '—'} | ${fastest} of 6 |`;
      }),
    ];

  const refusalList = [...cells.values()].filter((c) => c.refusals.length > 0);

  const tiersRun = BENCH_TIERS.filter((tier) => nodes.some((n) => n.tier === tier));
  const md = [
    `# Lineage lane matrix — Tier ${tiersRun.join(' and ')}`,
    '',
    `Generated ${new Date().toISOString()} from \`${execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}\`.`,
    `${references.length} lane reference profiles x ${nodes.length} distinct node blends`
    + `${frameReferences.length ? `, plus ${frameReferences.length} frame references x ${frameNodes.length} nodes` : ''}`
    + `, x ${seeds.length} seeds (${seeds.join(', ')}), ${capMs / 1000} s of sim per cell per seed;`
    + ` ${rows.length} measured runs; wall clock ${(elapsedMs / 60_000).toFixed(1)} min.`,
    '',
    'Throughput is kills per minute of SIM time with repopulation on; TTK is engaged',
    'milliseconds per kill, which divides out the walk between mobs. Uplift is the',
    'cell against the SAME lineage’s lane-less control on the SAME node — the only',
    'reading in which the lane, and not the class or the weapon, is the variable.',
    '',
    'The criteria are design §18.9\'s, which replaced §9\'s: the lane budget band is the',
    'median uplift **±3 percentage points, absolute**, and the encounter check is an',
    '**ordinal** reading — does the favoured lane out-uplift the punished lane on that',
    'family\'s own node, and by what margin? The margin is reported, never thresholded.',
    '',
    'The references are unchanged by the addition of Tier 2: a Tier-1 band on a Tier-2',
    'encounter is the character the gate hands over, so the T2 rows read as "what does',
    'a T1 lane still buy here" and their death counts are part of the answer.',
    '',
    '## What the map actually offers',
    '',
    'A node fields only `monsterPoolByTier[its tier]`, so `resolveNodeBlend` drops any',
    'family with no member in that pool and rescales its share onto the rest. The',
    'authored blends are the design target; the resolved ones are the encounters that',
    'exist today. A row where they differ is a family the map cannot field at that tier.',
    '',
    ...matrix,
    '',
    '## TTK per lane per node',
    '',
    'Milliseconds of ENGAGED time per kill, pooled over both seeds. Lower is faster.',
    '',
    ...pivot,
    '### The same table as uplift over each lineage’s own control',
    '',
    ...upliftPivot,
    '## Lane budget (design §18.9)',
    '',
    '“The band is the median uplift ±3pp, absolute.” Measured on each lane’s favoured',
    'node — the node its own family dominates hardest — per tier.',
    '',
    ...budget,
    '### How much of the absolute column is class, not lane',
    '',
    ...controlSpread,
    '',
    '### Lane budget per PACKET — the table `PACKET_BUDGET` is tuned from',
    '',
    ...packetBudget,
    '',
    '### Lane uplift over every node',
    '',
    'The same uplift as above, averaged over all node blends rather than only the',
    'favoured one — the reading least sensitive to which single encounter a lane',
    'happened to be measured on.',
    '',
    ...laneSummary,
    '',
    '## Frames (design §18.10)',
    '',
    'Light / Balanced / Heavy per class root. Lane-less on purpose: design §10 gives',
    'each frame its own feedback loop, so a card on top would be a second variable.',
    'There is no control-relative uplift here and there must not be — every T1',
    'character has bought a frame, so a frame has nothing to be an uplift OVER. The',
    'reading is frame-against-frame inside one root, against the frame that root’s own',
    'canonical T1 route wears.',
    '',
    ...frameColumn,
    '',
    ...(survival.length > 2
      ? ['## Survival — what the non-damage lanes buy instead', '',
         'Control’s slow and Engagement’s opening DR buy time, not throughput, so the',
         'TTK matrix above reads them as worth nothing. This is the same runs read as',
         'survival: mean HP fraction while engaged and damage taken per engaged second,',
         'each against the same lineage’s lane-less control.',
         '', ...survival, '']
      : []),
    '## Encounter check (design §18.9) — ordinal',
    '',
    'One row per family that has an OWN node: a node where it reaches at least 60% of',
    'the resolved blend, so the encounter really is that family rather than two sharing',
    'it. Lanes are ranked by median uplift; rank 1 is the strongest. The favoured lane',
    'is read off `FamilyDefinition.drops`, which design §18.7 confirms IS the definition',
    'of favours. A family whose favoured lane ranks below its punished lane is a',
    'monster-shape finding for Phase 4, not a magnitude to tune.',
    '',
    ...encounter,
    '',
    '### Clear `drops` remaps (design §18 3b)',
    '',
    'The test, computed rather than eyeballed: the favoured lane ranks LAST on the',
    'family’s own node with BOTH seeds agreeing, and one other lane ranks FIRST with',
    'both seeds. Anything short of that is left alone.',
    '',
    ...remap,
    '',
    ...(refusalList.length
      ? ['## Refused purchases', '',
         ...refusalList.map((c) => `- \`${c.profileId}\` @ \`${c.nodeId}\`: ${c.refusals.join('; ')}`), '']
      : ['## Refused purchases', '', 'None — every lane bought its whole band.', '']),
    '## Per-node detail',
    ...perNode,
    '',
  ].join('\n');

  const base = process.env.LANE_REPORT ?? 'lane-matrix';
  writeFileSync(resolve(out, `${base}.md`), `${md}\n`);
  writeFileSync(resolve(out, `${base}.json`), `${JSON.stringify({
    schema: 2,
    capMs, seeds,
    nodes: nodes.map((n) => ({ ...n })),
    frameNodeIds: frameNodes.map((n) => n.nodeId),
    rows,
    cells: [...cells.values()],
    budget: {
      bandPp: BAND_PP,
      absoluteMedian: absMedian,
      upliftMedian: upMedian,
      byTier: budgetByTier.map((b) => ({
        tier: b.tier,
        upliftMedian: b.upMedian,
        rows: b.rows.map((r) => ({ lane: r.reference.lane, profileId: r.reference.profileId, nodeId: r.node?.nodeId ?? null, absolute: r.absolute, uplift: r.upliftValue })),
      })),
    },
    encounter: encounterRows.map((r) => ({
      family: r.family,
      nodeId: r.node.nodeId,
      tier: r.node.tier,
      dominantShare: r.node.dominantShare,
      favoured: r.favoured,
      punished: r.punished,
      favouredRank: r.favRank?.rank ?? null,
      punishedRank: r.punRank?.rank ?? null,
      lanesRanked: r.lanesRanked,
      marginPp: r.marginPp,
      perSeed: r.perSeed,
      clearRemap: r.clearRemap,
    })),
    frames: frameRows.map((r) => ({
      profileId: r.reference.profileId,
      classRoot: r.reference.classRoot,
      frameId: r.reference.frameId,
      frameShape: r.reference.frameShape,
      canonical: r.reference.canonical,
      baseForm: r.reference.baseForm,
      killsPerMin: r.throughput,
      vsCanonical: frameDelta(r),
      ttkMs: r.ttk,
      meanHpFraction: r.hp,
      deaths: r.deaths,
      nodesMeasured: r.measured,
    })),
  }, null, 2)}\n`);
  console.log(`\nwrote ${resolve(out, `${base}.md`)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
