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
 * 1. NODES ARE GROUPED BY THEIR RESOLVED BLEND, NOT THEIR AUTHORED ONE. Every T1
 *    node fields only `monsterPoolByTier[1]`, which is two mobs per biome, and
 *    every biome's third family debuts at biome tier 2. `resolveNodeBlend`
 *    therefore drops the unfieldable family and rescales, so the twenty-seven
 *    authored T1 nodes collapse to far fewer distinct encounters — and all six
 *    Swamp nodes collapse to ONE, because both of its T1 mobs are Mire. The
 *    matrix reports the resolved composition beside the authored one and names
 *    the nodes that share each row.
 *
 * 2. THE LANE IS THE DIFFERENCE FROM THE CONTROL, NOT THE ABSOLUTE NUMBER. Each
 *    lineage runs a lane-less control on the same class, frame, weapon and gear.
 *    Absolute throughput of `rapier/tempo` is mostly Striker-with-a-rapier; only
 *    the uplift over the control is the lane. Both readings are reported, and the
 *    spread among the five controls says how much of §9-as-written is class noise.
 *
 * 3. ENGAGEMENT'S SHARDS ARE GRANTED, NOT EARNED. No T1 family drops them (its
 *    only family, Plains Sky, is unfieldable at T1), so the harness credits the
 *    wallet and says so per row. Every other cost is paid through the real
 *    economy handler, so a card that the mastery gate refuses is reported as
 *    refused rather than silently faked.
 *
 * Usage, from `server/`:
 *
 *   node --conditions=development --import tsx bench/lineageLaneMatrix.ts [out-dir]
 *
 *   LANE_CAP_MS=90000        sim time per cell per seed
 *   LANE_SEEDS=101009,101033 two seeds by default
 *   LANE_FILTER=rapier       substring filter on the cell id
 *   LANE_NODES=plains,forest limit to these biomes
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
  LINEAGE_LANE_PROFILES,
  LINEAGE_LANE_REFERENCES,
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

const T1_BIOMES = ['plains', 'forest', 'mountain', 'cave', 'swamp'] as const;

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
  /** Every authored node that resolves to the same spawn cycle. */
  aliases: string[];
  authored: string;
  resolved: string;
  /** Monster ids in the repeating cycle, with how many of the ten slots each takes. */
  mobs: Array<{ monsterTypeId: string; family: FamilyId; slots: number }>;
  dominant: FamilyId;
  dropsLane: PacketId;
  punishesLane: PacketId;
  unavailable: FamilyId[];
}

function laneNodes(): LaneNode[] {
  const byKey = new Map<string, LaneNode>();
  for (const node of WORLD_NODE_LIST) {
    if (node.biomeTier !== 1 || NODE_BIOMES[node.id]?.kind !== 'normal') continue;
    if (!T1_BIOMES.includes(node.biomeGroup as (typeof T1_BIOMES)[number])) continue;
    const blend = node.blend;
    const resolved = nodeSpawnBlend(node.id);
    if (!blend || !resolved) continue;

    // Two nodes are the same ENCOUNTER when their resolved spawn cycles agree
    // slot for slot, which is what the spawner actually walks.
    const cycleKey = `${node.biomeGroup}|${resolved.cycle.join(',')}`;
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
    const dominant = blendEntries(resolved.shares)[0].family;
    const family = FAMILY_DATABASE.get(dominant)!;
    byKey.set(cycleKey, {
      nodeId: node.id,
      biome: node.biomeGroup,
      aliases: [node.id],
      authored: blendEntries(blend).map((e) => `${short(e.family)} ${pct(e.share)}`).join(' / '),
      resolved: blendEntries(resolved.shares).map((e) => `${short(e.family)} ${pct(e.share)}`).join(' / '),
      mobs: [...slots.values()].sort((a, b) => b.slots - a.slots),
      dominant,
      dropsLane: family.drops,
      punishesLane: family.punishes,
      unavailable: [...resolved.unavailable],
    });
  }
  return [...byKey.values()];
}

const short = (family: FamilyId): string => FAMILY_DATABASE.get(family)?.name ?? family;
const pct = (share: number): string => `${Math.round(share * 100)}%`;

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
  reference: LineageLaneReference,
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
  const lane = reference.lane;
  const grantedShards = reference.shardsUnobtainableAtT1;
  if (lane) p.shards[lane] = BENCH_SHARDS;
  const refusals: string[] = [];
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
  const tree = view.lineages[reference.lineageId];
  assert(tree, `${profile.id}: the worn base form opened no tree`);
  assert(tree.wornForm === reference.baseForm, `${profile.id}: worn form is the base form`);
  return { bot, refusals, grantedShards };
}

// ── One measurement ──────────────────────────────────────────────────────────

interface Row {
  cellId: string;
  profileId: string;
  lineageId: string;
  lane: PacketId | null;
  classRoot: string;
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
  reference: LineageLaneReference,
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
      nodeId: node.nodeId, biomeGroup: node.biome, contentTier: 1, isDungeon: false,
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
      lineageId: reference.lineageId,
      lane: reference.lane,
      classRoot: reference.classRoot,
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
  lineageId: string;
  lane: PacketId | null;
  classRoot: string;
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

function aggregate(rows: Row[]): Map<string, Cell> {
  const byCell = new Map<string, Row[]>();
  for (const row of rows) {
    const list = byCell.get(row.cellId) ?? [];
    list.push(row);
    byCell.set(row.cellId, list);
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

  const nodes = laneNodes()
    .filter((n) => !biomeFilter || biomeFilter.includes(n.biome))
    .filter((n) => !nodeFilter || nodeFilter.includes(n.nodeId));
  const references = LINEAGE_LANE_REFERENCES.filter((r) => !filter || r.profileId.includes(filter));
  assert(nodes.length > 0 && references.length > 0, 'nothing selected');

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
  for (const reference of replay ? [] : references) {
    const profile = LINEAGE_LANE_PROFILES.get(reference.profileId)!;
    for (const node of nodes) {
      for (const seed of seeds) {
        rows.push(measure(profile, reference, node, seed, capMs));
      }
      const cell = rows.slice(-seeds.length);
      const kills = cell.reduce((a, r) => a + r.kills, 0);
      const engaged = cell.reduce((a, r) => a + r.engagedMs, 0);
      console.log(
        `${reference.profileId.padEnd(30)} ${node.nodeId.padEnd(20)} kills=${String(kills).padStart(3)}` +
        ` ttk=${kills ? Math.round(engaged / kills) : '—'}ms deaths=${cell.reduce((a, r) => a + r.deaths, 0)}` +
        ` fx=${cell.reduce((a, r) => a + Object.values(r.fx).reduce((x, y) => x + y, 0), 0)}` +
        (cell[0].refusals.length ? ` REFUSED ${cell[0].refusals.join('; ')}` : ''),
      );
    }
  }
  const elapsedMs = replay ? 0 : Date.now() - startedAt;

  const cells = aggregate(rows);
  const cellFor = (profileId: string, nodeId: string): Cell | undefined =>
    cells.get(`${profileId}@${nodeId}`);
  const baselineId = (lineageId: string): string => `lineage-${lineageId}-baseline`;

  /** Uplift of a lane cell over its own lineage's control on the same node. */
  const uplift = (cell: Cell): number | null => {
    if (!cell.lane) return null;
    const control = cellFor(baselineId(cell.lineageId), cell.nodeId);
    if (!control || control.killsPerMin <= 0) return null;
    return cell.killsPerMin / control.killsPerMin - 1;
  };

  // ── The matrix ─────────────────────────────────────────────────────────────
  const laneRefs = references.filter((r) => r.lane);
  const matrix: string[] = [
    '| node | biome | authored blend | resolved blend | shares this row | mobs (of 10 slots) |',
    '|---|---|---|---|---|---|',
    ...nodes.map((n) => `| \`${n.nodeId}\` | ${n.biome} | ${n.authored} | ${n.resolved} | ${n.aliases.length} node(s): ${n.aliases.map((a) => a.replace('node-t1-', '')).join(', ')} | ${n.mobs.map((m) => `${m.monsterTypeId} x${m.slots}`).join(', ')} |`),
  ];

  // ── TTK per lane per node, in one table (the brief's own ask) ─────────────
  const pivotHeader = `| profile | lane | class | ${nodes.map((n) => n.nodeId.replace('node-t1-', '')).join(' | ')} |`;
  const pivot: string[] = [
    pivotHeader,
    `|---|---|---|${nodes.map(() => '---:').join('|')}|`,
    ...references.map((reference) => {
      const cellsForRef = nodes.map((n) => cellFor(reference.profileId, n.nodeId));
      return `| \`${reference.profileId}\` | ${reference.lane ?? '_control_'} | ${reference.classRoot.replace('-root', '')} | ${cellsForRef.map((c) => (c?.ttkMs == null ? '—' : String(c.ttkMs))).join(' | ')} |`;
    }),
  ];
  const upliftPivot: string[] = [
    pivotHeader,
    `|---|---|---|${nodes.map(() => '---:').join('|')}|`,
    ...laneRefs.map((reference) => {
      const cellsForRef = nodes.map((n) => cellFor(reference.profileId, n.nodeId));
      return `| \`${reference.profileId}\` | ${reference.lane} | ${reference.classRoot.replace('-root', '')} | ${cellsForRef.map((c) => (c ? signedPct(uplift(c)) : '—')).join(' | ')} |`;
    }),
  ];

  const perNode: string[] = [];
  for (const node of nodes) {
    perNode.push('', `### \`${node.nodeId}\` — ${node.resolved} (${node.biome}; shared by ${node.aliases.length} authored node${node.aliases.length === 1 ? '' : 's'})`, '');
    perNode.push(`Dominant family **${short(node.dominant)}** drops \`${node.dropsLane}\`, punishes \`${node.punishesLane}\`. Authored ${node.authored}; unfieldable at T1: ${node.unavailable.map(short).join(', ') || 'none'}.`, '');
    perNode.push('| profile | lane | class | kills | TTK (ms engaged/kill) | kills/min | uplift vs control | deaths | card-fx fired |', '|---|---|---|---:|---:|---:|---:|---:|---|');
    for (const reference of references) {
      const cell = cellFor(reference.profileId, node.nodeId);
      if (!cell) continue;
      perNode.push(
        `| \`${reference.profileId}\` | ${reference.lane ?? '_control_'} | ${reference.classRoot.replace('-root', '')} | ${cell.kills} | ${fmt(cell.ttkMs, 0)} | ${fmt(cell.killsPerMin)} | ${reference.lane ? signedPct(uplift(cell)) : '—'} | ${cell.deaths} | ${Object.entries(cell.fx).map(([k, v]) => `${k} x${v}`).join(', ') || '—'} |` +
        (cell.refusals.length ? ` <!-- ${cell.refusals.join('; ')} -->` : ''),
      );
    }
  }

  // ── §9 lane budget, on the lane's favoured node ────────────────────────────
  //
  // "Favoured" is read off `FamilyDefinition.drops`, because the shipped family
  // table has no `favours` field — design §9 asks for one and §12's table does
  // not carry it. Recorded as a divergence, not papered over.
  const favouredNodeFor = (lane: PacketId): LaneNode | undefined => {
    const candidates = nodes.filter((n) => n.dropsLane === lane);
    if (candidates.length === 0) return undefined;
    // The node this family dominates hardest, so the contrast is as strong as T1 allows.
    return candidates.sort((a, b) => {
      const sa = blendEntries(nodeSpawnBlend(a.nodeId)!.shares)[0].share;
      const sb = blendEntries(nodeSpawnBlend(b.nodeId)!.shares)[0].share;
      return sb - sa;
    })[0];
  };

  interface BudgetRow {
    reference: LineageLaneReference;
    node: LaneNode | null;
    absolute: number | null;
    upliftValue: number | null;
  }
  const budgetRows: BudgetRow[] = laneRefs.map((reference) => {
    const node = favouredNodeFor(reference.lane!) ?? null;
    const cell = node ? cellFor(reference.profileId, node.nodeId) : undefined;
    return {
      reference,
      node,
      absolute: cell ? cell.killsPerMin : null,
      upliftValue: cell ? uplift(cell) : null,
    };
  });
  const absMedian = median(budgetRows.flatMap((r) => (r.absolute === null ? [] : [r.absolute])));
  const upMedian = median(budgetRows.flatMap((r) => (r.upliftValue === null ? [] : [r.upliftValue])));

  const budget: string[] = [
    `Median absolute throughput on the favoured node: **${fmt(absMedian)} kills/min**.` +
    ` Median lane uplift over the matching control: **${signedPct(upMedian)}**.`,
    '',
    '| lane | profile | favoured node | kills/min | vs abs median | uplift | uplift − median | in ±10% (abs) | shards |',
    '|---|---|---|---:|---:|---:|---:|:--:|---|',
    ...budgetRows.map((r) => {
      const deviation = r.absolute === null || absMedian === 0 ? null : r.absolute / absMedian - 1;
      const inBand = deviation !== null && Math.abs(deviation) <= 0.10;
      return `| ${r.reference.lane} | \`${r.reference.profileId}\` | ${r.node ? `\`${r.node.nodeId}\`` : '**no T1 node favours this lane**'} | ${fmt(r.absolute)} | ${signedPct(deviation)} | ${signedPct(r.upliftValue)} | ${r.upliftValue === null ? '—' : signedPct(r.upliftValue - upMedian)} | ${r.node ? (inBand ? 'yes' : 'NO') : 'n/a'} | ${r.reference.shardsUnobtainableAtT1 ? 'granted (no T1 source)' : 'earned'} |`;
    }),
  ];

  // ── §9 lane budget at the PACKET level ────────────────────────────────────
  //
  // §9's unit is the lane (the packet), not the (lineage, lane) pair: three
  // lineages carry Tempo and they must not each be judged alone. So a packet's
  // reading is the mean of its references' mean uplift over every node, and the
  // band is ±10% of the median PACKET. This is the table the designer tunes
  // `PACKET_BUDGET` from.
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
    `Median packet uplift: **${signedPct(packetMedian)}**. The ±10% band is` +
    ` ${signedPct(packetMedian * 0.9)} to ${signedPct(packetMedian * 1.1)}.`,
    '',
    '| packet | lineages carrying it | mean uplift | x median | in ±10% | payoff fx fired | has a favouring T1 node |',
    '|---|---:|---:|---:|:--:|---:|---|',
    ...packetRows.map((r) => {
      const ratio = r.mean === null || packetMedian === 0 ? null : r.mean / packetMedian;
      return `| ${r.lane} | ${r.lineages} | ${signedPct(r.mean)} | ${ratio === null ? '—' : `${ratio.toFixed(2)}x`} | ${ratio !== null && Math.abs(ratio - 1) <= 0.10 ? 'yes' : 'NO'} | ${r.fxTotal} | ${r.favoured ? `\`${r.favoured.nodeId}\`` : '**none**'} |`;
    }),
  ];

  // ── §9 encounter check, per fieldable family ──────────────────────────────
  //
  // Two readings per side, because §9-as-written is not class-free:
  //   ABSOLUTE   the lane's median throughput against the node's median lane
  //              throughput. This is literally what §9 says, and it is
  //              contaminated by which class each lineage's reference wears.
  //   UPLIFT     the lane's median control-relative uplift against the node's
  //              median lane uplift. Class and weapon cancel; only the card is
  //              left. When the two disagree, the uplift column is the lane.
  //
  // "Still clears" is design §9's own floor: off-lane on an unfavourable variant
  // may fall to ~70%. Deaths are reported but do not decide it — the harness
  // revives in place and a revived bot keeps farming, exactly as auto-combat does.
  const encounter: string[] = [
    '| family | node | favoured | punished | fav abs Δ | fav uplift Δ | pun abs Δ | pun uplift Δ | pun ≥70% | pun deaths | verdict (abs) |',
    '|---|---|---|---|---:|---:|---:|---:|:--:|---:|---|',
  ];
  for (const node of nodes) {
    const nodeCells = laneRefs
      .map((r) => cellFor(r.profileId, node.nodeId))
      .filter((c): c is Cell => !!c);
    if (nodeCells.length === 0) continue;
    const nodeAbsMedian = median(nodeCells.map((c) => c.killsPerMin));
    const nodeUpMedian = median(nodeCells.flatMap((c) => {
      const u = uplift(c);
      return u === null ? [] : [u];
    }));
    const forLane = (lane: PacketId) => {
      const group = nodeCells.filter((c) => c.lane === lane);
      if (group.length === 0) return null;
      return {
        count: group.length,
        abs: median(group.map((c) => c.killsPerMin)),
        up: median(group.flatMap((c) => {
          const u = uplift(c);
          return u === null ? [] : [u];
        })),
        kills: group.reduce((a, c) => a + c.kills, 0),
        deaths: group.reduce((a, c) => a + c.deaths, 0),
      };
    };
    const favoured = forLane(node.dropsLane);
    const punished = forLane(node.punishesLane);
    const absDelta = (side: ReturnType<typeof forLane>): number | null =>
      side && nodeAbsMedian > 0 ? side.abs / nodeAbsMedian - 1 : null;
    const upDelta = (side: ReturnType<typeof forLane>): number | null =>
      side ? side.up - nodeUpMedian : null;
    const favAbs = absDelta(favoured);
    const punAbs = absDelta(punished);
    const clears = punished
      ? punished.kills > 0 && nodeAbsMedian > 0 && punished.abs / nodeAbsMedian >= 0.70
      : null;
    const verdict = favoured === null
      ? 'UNMEASURABLE — no lane reference carries the favoured lane'
      : favAbs !== null && favAbs >= 0.25
        ? 'favoured lane wins'
        : 'favoured lane does NOT win by ~30%';
    encounter.push(
      `| ${short(node.dominant)} | \`${node.nodeId}\` | ${node.dropsLane}${favoured ? ` (n=${favoured.count})` : ' (none)'} | ${node.punishesLane}${punished ? ` (n=${punished.count})` : ' (none)'} | ${signedPct(favAbs)} | ${signedPct(upDelta(favoured))} | ${signedPct(punAbs)} | ${signedPct(upDelta(punished))} | ${clears === null ? 'n/a' : clears ? 'yes' : 'NO'} | ${punished?.deaths ?? 0} | ${verdict} |`,
    );
  }

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
    const favNode = favouredNodeFor(reference.lane!);
    const favCell = favNode ? cellFor(reference.profileId, favNode.nodeId) : undefined;
    laneSummary.push(
      `| ${reference.lane} | \`${reference.profileId}\` | ${signedPct(mean)} | ${favCell ? signedPct(uplift(favCell)) : '—'} | ${sorted[0].nodeId.replace('node-t1-', '')} ${signedPct(sorted[0].u)} | ${sorted.at(-1)!.nodeId.replace('node-t1-', '')} ${signedPct(sorted.at(-1)!.u)} | ${nodes.reduce((total, n) => total + Object.values(cellFor(reference.profileId, n.nodeId)?.fx ?? {}).reduce((a, b) => a + b, 0), 0)} |`,
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

  const refusalList = [...cells.values()].filter((c) => c.refusals.length > 0);

  const md = [
    '# Lineage lane matrix — Tier 1',
    '',
    `Generated ${new Date().toISOString()} from \`${execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}\`.`,
    `${references.length} reference profiles x ${nodes.length} distinct T1 node blends x ${seeds.length} seeds (${seeds.join(', ')}), ${capMs / 1000} s of sim per cell per seed; wall clock ${(elapsedMs / 60_000).toFixed(1)} min.`,
    '',
    'Throughput is kills per minute of SIM time with repopulation on; TTK is engaged',
    'milliseconds per kill, which divides out the walk between mobs. Uplift is the',
    'cell against the SAME lineage’s lane-less control on the SAME node — the only',
    'reading in which the lane, and not the class or the weapon, is the variable.',
    '',
    '## What the Tier-1 map actually offers',
    '',
    'Every T1 node fields only `monsterPoolByTier[1]`, and every biome’s third family',
    'debuts at biome tier 2, so `resolveNodeBlend` drops the unfieldable family and',
    'rescales. The authored blends are the design target; the resolved ones are the',
    'encounters that exist today.',
    '',
    ...matrix,
    '',
    '## TTK per lane per node',
    '',
    'Milliseconds of ENGAGED time per kill, pooled over both seeds. Lower is faster.',
    'Columns are the eighteen distinct blends in the table above.',
    '',
    ...pivot,
    '',
    '### The same table as uplift over each lineage’s own control',
    '',
    ...upliftPivot,
    '',
    '## Lane budget (design §9)',
    '',
    '“At full rows for a tier, each lane’s measured throughput lands within ±10% of the',
    'tier median on that lane’s intended variant.”',
    '',
    ...budget,
    '',
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
    ...(survival.length > 2
      ? ['## Survival — what the non-damage lanes buy instead', '',
         'Control’s slow and Engagement’s opening DR buy time, not throughput, so the',
         'TTK matrix above reads them as worth nothing. This is the same runs read as',
         'survival: mean HP fraction while engaged and damage taken per engaged second,',
         'each against the same lineage’s lane-less control.',
         '', ...survival, '']
      : []),
    '## Encounter check (design §9)',
    '',
    '“Does the intended lane win by ~30%? Does the punished lane still clear?” The',
    'favoured lane is read off `FamilyDefinition.drops`; the shipped family table has',
    'no `favours` field.',
    '',
    ...encounter,
    '',
    ...(refusalList.length
      ? ['## Refused purchases', '',
         ...refusalList.map((c) => `- \`${c.profileId}\` @ \`${c.nodeId}\`: ${c.refusals.join('; ')}`), '']
      : ['## Refused purchases', '', 'None — every lane bought its whole band.', '']),
    '## Per-node detail',
    ...perNode,
    '',
  ].join('\n');

  writeFileSync(resolve(out, 'lane-matrix.md'), `${md}\n`);
  writeFileSync(resolve(out, 'lane-matrix.json'), `${JSON.stringify({
    schema: 1,
    capMs, seeds,
    nodes: nodes.map((n) => ({ ...n })),
    rows,
    cells: [...cells.values()],
    budget: { absoluteMedian: absMedian, upliftMedian: upMedian, rows: budgetRows.map((r) => ({ lane: r.reference.lane, profileId: r.reference.profileId, nodeId: r.node?.nodeId ?? null, absolute: r.absolute, uplift: r.upliftValue })) },
  }, null, 2)}\n`);
  console.log(`\nwrote ${resolve(out, 'lane-matrix.md')}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
