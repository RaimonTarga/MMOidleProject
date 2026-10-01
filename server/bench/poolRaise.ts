/**
 * Progression rework Phase 0 call four — the player pool raise, benched.
 *
 * The question, from design bible §20: at what per-tier value of
 * `GAME_CONFIG.PLAYER_POOL_FACTOR_BY_TIER` does a boss become an ATTRITION
 * fight the reference build can finish, without the same pool turning an
 * ordinary node into a walkover?
 *
 * Two arenas per cell, both in-process, no Postgres and no Redis:
 *
 *   BOSS    the lineage's own dungeon at the tier, guard stripped and the boss
 *           woken immediately (the `bossExam` setup — a dungeon node standing
 *           idle holds only its GUARD, and fighting that is how `--mode boss`
 *           spent months measuring guards). One fight to the cap. It yields the
 *           pair the criterion compares:
 *
 *             KILL TIME            seconds to remove the boss's whole HP bar.
 *                                  Measured when the boss dies, extrapolated
 *                                  from the fraction removed otherwise.
 *             TIME TO DEATH        seconds for the boss to remove the player's
 *                                  whole pool. Measured when the player dies,
 *                                  extrapolated from the NET drain (damage
 *                                  taken minus healing) otherwise, which is
 *                                  infinite for a build the boss cannot
 *                                  out-pace. Reported as `>cap`.
 *
 *           TTD > kill time is the lane winning the fight with the pool it has.
 *           Both are extrapolated from the SAME fight, so a factor that makes
 *           the fight longer moves TTD and leaves kill time alone — which is
 *           exactly the lever the raise is supposed to be.
 *
 *   NORMAL  an open node of the same biome at the same tier, repopulating,
 *           feeding the `FightHpTracker` the bot recorder and the Phase 0
 *           recovery bench already use. Its median fight-end HP is the sanity
 *           column: above 0.8 the pool has stopped being a budget.
 *
 * The rows are the fifteen PURE WEAPON LANES (five lineages x three lanes,
 * design §9's reference builds), built per tier: the lineage's own form of that
 * tier, its biome's armour and charm at +3, and every card on the lane for
 * tiers 1..N bought and activated THROUGH THE REAL ECONOMY HANDLER, so a
 * refusal is a reported finding and not a silent miss.
 *
 * Two harness grants, both deliberate and both printed in the manifest:
 *
 *   - the wallet is credited before the band is bought and zeroed after. The
 *     bench measures COMBAT; a lane that could not afford its own cards would
 *     be measuring the economy.
 *   - the lineage's home biome is raised to the tier's gate level. Plains and
 *     Forest stop at biome level 12, so the Broadsword's and the Rapier's T3
 *     and T4 cards are otherwise unbuyable in their home biome at any wallet.
 *     That is a live §12 re-homing question, not something this bench decides.
 *
 * Fidelity caveat, inherited: this is the bench bot with reference ability
 * wiring, capped mastery and no travel, not the route bot. Treat every number
 * as provisional — the phase gate is a human playtest.
 *
 *   cd server
 *   node --conditions=development --import tsx bench/poolRaise.ts <out-dir>
 *
 *   PR_TIERS=1,2,3,4          tiers to measure
 *   PR_FACTORS=1,seed,1.5     pool factors per tier ("seed" = the §20 seed)
 *   PR_SEEDS=101009           RNG seeds per cell
 *   PR_BOSS_CAP_MS=240000     boss fight cap
 *   PR_NODE_CAP_MS=120000     normal-node cap
 *   PR_NODE_LANES=1           how many lanes per lineage carry the normal-node
 *                             column (1 = the lineage's first lane only)
 *   PR_FILTER=rapier          substring filter on the cell id
 *   PR_PLUS=3                 item upgrade level
 */
import assert from 'node:assert/strict';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  DUNGEON_DEFS,
  ESSENCE_TYPES,
  GAME_CONFIG,
  ITEM_DATABASE,
  LINEAGE_DATABASE,
  MONSTER_DATABASE,
  NODE_BIOMES,
  RUNE_RECIPE_DATABASE,
  composePlayerView,
  gateBiomeLevel,
  isRuneRecipeUnlocked,
  statRowIsCollapsed,
  withReferenceAbilityWiring,
  type AttunedAbilities,
  type EquippedRule,
  type PacketId,
} from '@mmo-idle/shared';
import { LINEAGE_REFERENCE_CLASS } from '../../bot/src/tierEntry/profiles';
import { validateBuild } from '../../bot/src/loadout/loadout';
import { BOT_SPAWN, setupArena, teardownArena } from './balance/arena';
import { BENCH_BOT_ID, materializeBot } from './balance/botFactory';
import { createBalanceWorld, createFarmWorld } from './balance/worldFactory';
import { reviveInFarmNode } from './balance/runFarm';
import type { BuildSpec, ContentTarget, GearSlot } from './balance/types';
import { hydrateHitboxCacheFromArtifact, writeHitboxArtifact } from '../src/hitbox/cache';
import { ensureDungeon } from '../src/systems/world/dungeons/dungeon';
import { isPlayerActivelyInCombat } from '../src/systems/combat/ai/engagement';
import { setLineageActive, unlockLineageCard } from '../src/systems/player/economy/lineages';
import { setAbilityLoadout } from '../src/systems/player/economy/abilityCrafting';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { refillBarrier } from '../src/systems/defense/barrier/barrier';
import { FightHpTracker, summarizeFights } from '../../bot/src/telemetry/fightHp';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import type { World } from '../src/world/World';

/** The §20 seed, written down here so the bench stays reproducible after the pick lands. */
const SEED_FACTOR_BY_TIER = [1, 1.25, 1.3, 1.35, 1.4] as const;

const BENCH_ESSENCE = 50_000;
const BENCH_SHARDS = 500;

// ── Cells ────────────────────────────────────────────────────────────────────

interface LaneCell {
  id: string;
  lineageId: string;
  lane: PacketId;
  tier: number;
  classRoot: string;
  skillPath: string[];
  /** The lineage's own form of this tier, and the biome it belongs to. */
  form: string;
  formBiome: string;
  homeBiome: string;
  gear: Partial<Record<GearSlot, string>>;
  /** Cards on the lane for tiers 1..N, in tier then row order. */
  cardIds: string[];
  bossNode: { nodeId: string; biomeGroup: string; bossId: string };
  normalNode: string | null;
}

/**
 * The lineage's form for a tier: the highest-tier form at or below it, with its
 * own home biome preferred when a tier authors more than one (the Hammer's T3 is
 * both `mountain-avalanche-maul` and `tundra-permafrost-maul`; Mountain is the
 * lineage's own).
 */
function formForTier(lineageId: string, tier: number): { recipeId: string; biome: string; tier: number } {
  const lineage = LINEAGE_DATABASE.get(lineageId)!;
  const eligible = lineage.forms.filter((f) => f.tier <= tier);
  assert(eligible.length > 0, `${lineageId}: no form at or below T${tier}`);
  const best = Math.max(...eligible.map((f) => f.tier));
  const atBest = eligible.filter((f) => f.tier === best);
  const pick = atBest.find((f) => f.biome === lineage.homeBiome) ?? atBest[0];
  return { recipeId: pick.recipeId, biome: pick.biome, tier: pick.tier };
}

/** First existing item id among the candidates, or undefined. */
function firstItem(...ids: (string | undefined)[]): string | undefined {
  for (const id of ids) if (id && ITEM_DATABASE.has(id)) return id;
  return undefined;
}

/**
 * Any item of `slot` authored at `tier`, as a last resort when neither the
 * form's biome nor the lineage's home biome sells one (Plains has no T3 vest).
 */
function anyItemForSlot(slot: string, tier: number): string | undefined {
  for (const def of ITEM_DATABASE.values()) {
    if (def.slot === slot && def.tier === tier) return def.id;
  }
  return undefined;
}

function gearFor(formBiome: string, homeBiome: string, tier: number): Partial<Record<GearSlot, string>> {
  const pick = (suffix: string, slot: string): string | undefined =>
    firstItem(`${formBiome}-${suffix}-t${tier}`, `${homeBiome}-${suffix}-t${tier}`, anyItemForSlot(slot, tier));
  const gear: Partial<Record<GearSlot, string>> = {};
  const armor = pick('vest', 'armor');
  if (armor) gear.armor = armor;
  // The reference arm carries its tier's charm: the Phase 0b charm sweep derived
  // those values against exactly this build, so dropping it would measure the
  // uncharmed arm the sweep already recorded as deliberately weaker.
  const charm = pick('charm', 'recovery');
  if (charm) gear.recovery = charm;
  const boots = firstItem(`mountain-boots-t${tier}`, `${homeBiome}-boots-t${tier}`, anyItemForSlot('mobility', tier));
  if (boots) gear.mobility = boots;
  if (tier >= 2) gear.core = 'core-tempered';
  return gear;
}

/** The dungeon node whose boss this lane fights: its form's biome, else its home biome, else any at the tier. */
function bossNodeFor(formBiome: string, homeBiome: string, tier: number): LaneCell['bossNode'] {
  const candidates: LaneCell['bossNode'][] = [];
  for (const def of DUNGEON_DEFS.values()) {
    if (def.biomeTier !== tier) continue;
    const bossId = def.boss.bossId;
    if (!MONSTER_DATABASE.get(bossId)?.isBoss) continue;
    candidates.push({ nodeId: def.nodeId, biomeGroup: def.biomeGroup, bossId });
  }
  assert(candidates.length > 0, `no T${tier} dungeon boss`);
  return candidates.find((c) => c.biomeGroup === formBiome)
    ?? candidates.find((c) => c.biomeGroup === homeBiome)
    ?? candidates[0];
}

/** An open node of `biome` at `tier`, for the fight-end HP column. */
function normalNodeFor(biome: string, tier: number): string | null {
  const ids = Object.entries(NODE_BIOMES)
    .filter(([id, n]) => n.biomeTier === tier && n.biomeGroup === biome && n.kind === 'normal' && !id.includes('dungeon'))
    .map(([id]) => id);
  return ids.find((id) => id.endsWith('-03')) ?? ids[0] ?? null;
}

function laneCells(tiers: number[], nodeLanes: number): LaneCell[] {
  const out: LaneCell[] = [];
  for (const lineage of LINEAGE_DATABASE.values()) {
    if (lineage.slot !== 'weapon') continue;
    const ref = LINEAGE_REFERENCE_CLASS[lineage.id];
    assert(ref, `no reference class for weapon lineage ${lineage.id}`);
    const prefix = ref.classRoot.replace('-root', '');
    const melee = ref.classRoot === 'cadence-root' || ref.classRoot === 'cooldown-root';
    for (const tier of tiers) {
      const form = formForTier(lineage.id, tier);
      // The frame is the reference pairing's; the range leaf opens at T3, as the
      // survey builds have it.
      const skillPath = [
        ref.classRoot,
        ...(tier >= 2 ? [ref.frameId] : []),
        ...(tier >= 3 ? [`${prefix}-range-${melee ? 'close' : 'mid'}`] : []),
      ];
      const gear = { ...gearFor(form.biome, lineage.homeBiome, tier), weapon: form.recipeId };
      const bossNode = bossNodeFor(form.biome, lineage.homeBiome, tier);
      lineage.lanes.forEach((lane, laneIndex) => {
        const cards = lineage.cards
          .filter((c) => c.lane === lane && c.tier <= tier)
          .sort((a, b) => a.tier - b.tier)
          .map((c) => c.id);
        out.push({
          id: `t${tier}-${lineage.id}-${lane}`,
          lineageId: lineage.id,
          lane,
          tier,
          classRoot: ref.classRoot,
          skillPath,
          form: form.recipeId,
          formBiome: form.biome,
          homeBiome: lineage.homeBiome,
          gear,
          cardIds: cards,
          bossNode,
          normalNode: laneIndex < nodeLanes ? normalNodeFor(form.biome, tier) : null,
        });
      });
    }
  }
  return out;
}

// ── Bot preparation ──────────────────────────────────────────────────────────

interface Prepared { bot: PlayerEntity; refusals: string[]; activeCards: number; grantedBiomeLevel: number | null }

/**
 * The reference PACKAGE — abilities, stance and behaviour rules — exactly as
 * `resolveSurveyPackage` resolves it for a tier.
 *
 * Restated here rather than inherited from `materializeBot`, because the factory
 * deliberately equips NO behaviour rules: which rules a bot runs is a design
 * statement, so it leaves them out and every bench that measures survival puts
 * them back. On a survival metric the difference is not cosmetic — without
 * `step-back` the bot stands in telegraphs, without `avoid-hazards` it stands in
 * pools, and a ranged root never orbits. Every Phase 0 recovery and TTD number
 * was taken with this package; a pool reading taken without it would not be
 * comparable to any of them.
 */
function referencePackage(tier: number, melee: boolean): { abilities: AttunedAbilities; stance: string | null; rules: EquippedRule[] } {
  const abilities: AttunedAbilities = {
    techniques: [...(tier >= 3 ? ['frenzy'] : []), 'sweep'],
    guards: tier === 1 ? ['second-wind'] : ['second-wind', 'cleanse'],
  };
  const rules = withReferenceAbilityWiring([
    { conditionId: 'always', actionId: 'auto-path-enemy' },
    { conditionId: 'inside-telegraph', actionId: 'step-back' },
    ...(melee ? [] : [{ conditionId: 'in-combat', actionId: 'orbit' }]),
    { conditionId: 'always', actionId: 'avoid-hazards' },
    { conditionId: 'always', actionId: 'wait-for-regen' },
  ], abilities);
  return { abilities, stance: tier >= 2 ? 'offensive-stance' : null, rules };
}

function prepareLaneBot(world: World, cell: LaneCell, target: ContentTarget, plus: number): Prepared {
  const build: BuildSpec = {
    id: cell.id,
    classRoot: cell.classRoot,
    skillPath: cell.skillPath,
    contentTier: cell.tier,
    playerTier: cell.tier,
    gearTier: cell.tier,
    gearItemIds: cell.gear,
  };
  const bot = materializeBot(world, build, target, BOT_SPAWN, BENCH_BOT_ID, plus);
  const p = bot.tracksProgression;

  // The reference package, before the band is bought: card magnitudes are read
  // off the finished stat line, so the loadout has to be settled first.
  const melee = cell.classRoot === 'cadence-root' || cell.classRoot === 'cooldown-root';
  const pkg = referencePackage(cell.tier, melee);
  p.skillPoints = 0;
  p.equippedRites = [];
  p.attunedAbilities = { techniques: [], guards: [] };
  p.attunedStances = pkg.stance ? [pkg.stance] : [];
  for (const id of p.attunedStances) assert(p.knownStances.includes(id), `${cell.id}: unlearned stance ${id}`);
  p.equippedStances = { default: pkg.stance };
  p.activeStance = pkg.stance;
  for (const recipe of RUNE_RECIPE_DATABASE.values()) {
    if (recipe.deprecated || !recipe.runeId) continue;
    if (p.runesOwned.includes(recipe.runeId)) continue;
    if (!pkg.rules.some((rule) => rule.actionId === recipe.runeId)) continue;
    assert(isRuneRecipeUnlocked(recipe, p), `${cell.id}: unreachable rune ${recipe.id}`);
    p.runesOwned.push(recipe.runeId);
  }
  p.runesEquipped = pkg.rules;
  assert(setAbilityLoadout(world, bot, pkg.abilities).success, `${cell.id}: illegal ability budget`);

  // Harness grant 1: the home biome's gate level. A lineage whose home biome
  // ends at T2 (Plains, Forest) cannot reach its own T3/T4 rows there at any
  // wallet; that is design §12's re-homing question, not this bench's.
  let grantedBiomeLevel: number | null = null;
  const needed = gateBiomeLevel(cell.tier);
  if ((p.biomeLevel[cell.homeBiome] ?? 0) < needed) {
    p.biomeLevel[cell.homeBiome] = needed;
    grantedBiomeLevel = needed;
  }

  // Harness grant 2: the wallet, credited for the purchases and zeroed after.
  for (const type of ESSENCE_TYPES) p.essences[type] = BENCH_ESSENCE;
  p.shards[cell.lane] = BENCH_SHARDS;

  const refusals: string[] = [];
  const lineage = LINEAGE_DATABASE.get(cell.lineageId)!;
  for (const cardId of cell.cardIds) {
    const card = lineage.cards.find((c) => c.id === cardId)!;
    const bought = unlockLineageCard(world, bot, cell.lineageId, cardId);
    if (!bought.success) {
      refusals.push(`unlockCard ${cardId}: ${bought.reason}`);
      continue;
    }
    const progressNow = bot.holdsInventory.lineages![cell.lineageId]!;
    // A stat row of an earlier band is ABSORBED into the worn form (design §4),
    // so activating it is refused by design and the card is still in play as the
    // form's base stats. That is not a finding; buy it and move on.
    if (statRowIsCollapsed(lineage, progressNow, card)) continue;
    const activated = setLineageActive(world, bot, cell.lineageId, card.row, cardId);
    // The purchase already fills an empty row, so a refusal only matters when the
    // card ends up in NO row.
    if (!activated.success && bot.holdsInventory.lineages?.[cell.lineageId]?.active[card.row] !== cardId) {
      refusals.push(`setActive ${cardId}: ${activated.reason}`);
    }
  }
  for (const type of ESSENCE_TYPES) p.essences[type] = 0;
  p.shards[cell.lane] = 0;

  recalculatePlayerEntityStats(world, bot);
  syncArchetypeSlices(world, bot);
  bot.hasHealth.hp = bot.hasHealth.maxHp;
  refillBarrier(world, bot);

  const view = composePlayerView(bot)!;
  assert.deepEqual(
    validateBuild(
      { abilities: pkg.abilities, runeRules: pkg.rules, stances: { attuned: p.attunedStances, default: pkg.stance }, rites: [] },
      view,
    ),
    [],
    cell.id,
  );

  const progress = bot.holdsInventory.lineages?.[cell.lineageId];
  assert(progress, `${cell.id}: the worn form opened no tree`);
  assert(progress!.wornForm === cell.form, `${cell.id}: worn form is ${progress!.wornForm}, not ${cell.form}`);
  const activeCards = Object.values(progress!.active).filter((id) => id).length;
  return { bot, refusals, activeCards, grantedBiomeLevel };
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

/** Strip the guard and wake the boss now (the `bossExam` setup). */
function forceBossPhase(world: World, nodeId: string): void {
  ensureDungeon(world, nodeId);
  const state = world.dungeons.get(nodeId);
  assert(state, `no dungeon state for ${nodeId}`);
  for (const id of state!.guardianIds) world.removeMonsterEntity(id);
  state!.guardianIds = [];
  state!.guardiansEngaged = true;
  state!.status = 'bossAwakening';
  state!.bossAwakensAtMs = -1;
}

function findBoss(world: World, nodeId: string, bossId: string): MonsterEntity | null {
  for (const m of world.monsterEntitiesInNode(nodeId)) {
    if (m.isMonster.monsterTypeId === bossId) return m;
  }
  return null;
}

// ── Boss measurement ─────────────────────────────────────────────────────────

interface BossRow {
  cell: string; tier: number; lineageId: string; lane: PacketId; factor: number; seed: number;
  bossId: string; bossNode: string; maxHp: number; recovery: number; activeCards: number;
  outcome: 'boss_killed' | 'player_died' | 'timeout';
  elapsedS: number; bossHpFrac: number;
  /** Seconds to remove the boss's whole bar; extrapolated when it survived. */
  killS: number;
  /**
   * Seconds for the boss to remove the player's whole pool; Infinity when it
   * cannot, which `JSON.stringify` writes as `null` and the replay path reads
   * back as the clamp.
   */
  ttdS: number | null;
  killMeasured: boolean; ttdMeasured: boolean;
  grossLost: number; healed: number;
  refusals: string[]; grantedBiomeLevel: number | null;
}

function runBossFight(cell: LaneCell, factor: number, seed: number, capMs: number, plus: number): BossRow {
  const originalRandom = Math.random, originalNow = Date.now;
  Math.random = seededRandom(seed);
  let now = 0;
  Date.now = () => now;
  const cfg = GAME_CONFIG as unknown as Record<string, unknown>;
  const originalFactors = GAME_CONFIG.PLAYER_POOL_FACTOR_BY_TIER;
  const table = [...originalFactors] as number[];
  table[cell.tier] = factor;
  cfg.PLAYER_POOL_FACTOR_BY_TIER = table;

  const world = createBalanceWorld();
  const target: ContentTarget = {
    nodeId: cell.bossNode.nodeId, biomeGroup: cell.bossNode.biomeGroup, contentTier: cell.tier, isDungeon: true,
  };
  try {
    setupArena(world, target);
    forceBossPhase(world, cell.bossNode.nodeId);
    const { bot, refusals, activeCards, grantedBiomeLevel } = prepareLaneBot(world, cell, target, plus);
    const maxHp = bot.hasHealth.maxHp;
    const recovery = bot.hasHealth.recovery ?? 0;

    let lastHp = bot.hasHealth.hp, grossLost = 0, healed = 0;
    let boss: MonsterEntity | null = null;
    let bossMaxHp = MONSTER_DATABASE.get(cell.bossNode.bossId)?.stats.hp ?? 1;
    let bossHp = bossMaxHp, bossSeen = false;
    let outcome: BossRow['outcome'] = 'timeout';
    for (; now < capMs;) {
      world.tick(100, now);
      now += 100;
      world.pendingDeaths = [];
      world.clearNodeEvents(cell.bossNode.nodeId);
      const hp = bot.hasHealth.hp;
      if (hp < lastHp) grossLost += lastHp - hp; else healed += hp - lastHp;
      lastHp = hp;
      boss = findBoss(world, cell.bossNode.nodeId, cell.bossNode.bossId);
      if (boss) { bossSeen = true; bossMaxHp = boss.hasHealth.maxHp; bossHp = boss.hasHealth.hp; }
      if (bot.isDead !== undefined || hp <= 0) { outcome = 'player_died'; break; }
      if (bossSeen && !boss) { bossHp = 0; outcome = 'boss_killed'; break; }
    }
    const elapsedS = now / 1000;
    const bossHpFrac = Math.max(0.001, 1 - bossHp / bossMaxHp);
    // Kill time: measured on a kill, otherwise the bar removed so far at the
    // same rate. Optimistic for a boss that gets harder late, as bossExam says.
    const killS = outcome === 'boss_killed' ? elapsedS : elapsedS / bossHpFrac;
    // Time to death: measured on a death, otherwise the pool divided by the NET
    // drain. A build the boss cannot out-pace has no finite TTD, which is the
    // honest answer and the one the criterion wants.
    const netLost = grossLost - healed;
    const ttdS = outcome === 'player_died'
      ? elapsedS
      : netLost > 0 ? (maxHp / (netLost / elapsedS)) : Infinity;
    return {
      cell: cell.id, tier: cell.tier, lineageId: cell.lineageId, lane: cell.lane, factor, seed,
      bossId: cell.bossNode.bossId, bossNode: cell.bossNode.nodeId, maxHp, recovery, activeCards,
      outcome, elapsedS, bossHpFrac, killS, ttdS,
      killMeasured: outcome === 'boss_killed', ttdMeasured: outcome === 'player_died',
      grossLost: Math.round(grossLost), healed: Math.round(healed), refusals, grantedBiomeLevel,
    };
  } finally {
    teardownArena(world);
    cfg.PLAYER_POOL_FACTOR_BY_TIER = originalFactors;
    Math.random = originalRandom;
    Date.now = originalNow;
  }
}

// ── Normal-node measurement ──────────────────────────────────────────────────

interface NodeRow {
  cell: string; tier: number; lineageId: string; lane: PacketId; factor: number; seed: number;
  nodeId: string; maxHp: number; fights: number; medianEndHp: number | null; timeInBand: number | null;
  deaths: number; kills: number;
}

function runNormalNode(cell: LaneCell, factor: number, seed: number, capMs: number, plus: number): NodeRow {
  const nodeId = cell.normalNode!;
  const originalRandom = Math.random, originalNow = Date.now;
  Math.random = seededRandom(seed);
  let now = 0;
  Date.now = () => now;
  const cfg = GAME_CONFIG as unknown as Record<string, unknown>;
  const originalFactors = GAME_CONFIG.PLAYER_POOL_FACTOR_BY_TIER;
  const table = [...originalFactors] as number[];
  table[cell.tier] = factor;
  cfg.PLAYER_POOL_FACTOR_BY_TIER = table;

  const world = createFarmWorld();
  const biome = NODE_BIOMES[nodeId].biomeGroup;
  const target: ContentTarget = { nodeId, biomeGroup: biome, contentTier: cell.tier, isDungeon: false };
  const tracker = new FightHpTracker();
  try {
    setupArena(world, target);
    const { bot } = prepareLaneBot(world, cell, target, plus);
    let deaths = 0, kills = 0;
    let live = new Set([...world.monsterEntitiesInNode(nodeId)].map((m) => m.isMonster.id));
    for (; now < capMs;) {
      world.tick(100, now);
      now += 100;
      world.pendingDeaths = [];
      world.clearNodeEvents(nodeId);
      const next = new Set<string>();
      for (const m of world.monsterEntitiesInNode(nodeId)) next.add(m.isMonster.id);
      for (const id of live) if (!next.has(id)) kills++;
      live = next;
      const dead = bot.isDead !== undefined || bot.hasHealth.hp <= 0;
      tracker.sample(now, 100, {
        engaged: !dead && isPlayerActivelyInCombat(world, bot),
        dead,
        hpFraction: bot.hasHealth.hp / Math.max(1, bot.hasHealth.maxHp),
        biomeGroup: biome,
        nodeId,
      });
      if (dead) { deaths++; reviveInFarmNode(world, bot, nodeId); }
    }
    tracker.finish(now);
    const s = summarizeFights(tracker.fights);
    return {
      cell: cell.id, tier: cell.tier, lineageId: cell.lineageId, lane: cell.lane, factor, seed,
      nodeId, maxHp: bot.hasHealth.maxHp, fights: s.fights,
      medianEndHp: s.medianEndHpFraction, timeInBand: s.timeInBandShare, deaths, kills,
    };
  } finally {
    teardownArena(world);
    cfg.PLAYER_POOL_FACTOR_BY_TIER = originalFactors;
    Math.random = originalRandom;
    Date.now = originalNow;
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

const med = (xs: number[]): number => {
  const finite = [...xs].sort((a, b) => a - b);
  if (finite.length === 0) return NaN;
  return finite.length % 2 ? finite[(finite.length - 1) / 2] : (finite[finite.length / 2 - 1] + finite[finite.length / 2]) / 2;
};
/**
 * Time-to-death is CLAMPED at four times the fight cap before it is medianed or
 * ratioed.
 *
 * Past that it is not a measurement. A build the boss grazes for a net fraction
 * of an HP over a five-minute fight extrapolates to a pool lasting centuries,
 * and one such lane drags the median into scientific notation while saying
 * nothing the clamp does not already say: the boss cannot kill this build. The
 * raw value stays in `boss.jsonl` for anyone who wants it.
 */
const ttdCapS = (capS: number): number => capS * 4;
/** Clamped TTD for the medians. `null` is how JSON wrote an Infinity. */
const ttdOf = (ttdS: number | null, capS: number): number =>
  ttdS === null || !isFinite(ttdS) ? ttdCapS(capS) : Math.min(ttdS, ttdCapS(capS));
const fmtS = (x: number, capS: number): string =>
  !isFinite(x) || x >= ttdCapS(capS) ? `>=${ttdCapS(capS)}` : x.toFixed(1);
const fmt2 = (x: number | null): string => (x === null || isNaN(x) ? '—' : x.toFixed(2));

async function main() {
  const out = resolve(process.argv[2] ?? `../reports/progression-phase0/pool-raise-${new Date().toISOString().slice(0, 10)}`);
  const tiers = (process.env.PR_TIERS ?? '1,2,3,4').split(',').map(Number);
  const seeds = (process.env.PR_SEEDS ?? '101009').split(',').map(Number);
  const bossCapMs = Number(process.env.PR_BOSS_CAP_MS ?? 240_000);
  const nodeCapMs = Number(process.env.PR_NODE_CAP_MS ?? 120_000);
  const nodeLanes = Number(process.env.PR_NODE_LANES ?? 1);
  const plus = Number(process.env.PR_PLUS ?? 3);
  const filter = process.env.PR_FILTER;
  const factorSpec = (process.env.PR_FACTORS ?? '1,seed,1.5').split(',');
  const factorsFor = (tier: number): number[] => [
    ...new Set(factorSpec.map((f) => (f === 'seed' ? SEED_FACTOR_BY_TIER[tier] ?? 1 : Number(f)))),
  ];

  // Re-render an existing run's report from its rows, without measuring again.
  // The gate table's reading rules changed once mid-run (the time-to-death clamp),
  // and re-deriving the table from the rows is how a reading rule gets corrected
  // without spending another hour of simulation or, worse, hand-editing a table.
  if (process.env.PR_REPLAY) {
    const dir = resolve(process.env.PR_REPLAY);
    const read = <T>(name: string): T[] => {
      const file = resolve(dir, name);
      if (!existsSync(file)) return [];
      return readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l) as T);
    };
    const man = JSON.parse(readFileSync(resolve(dir, 'manifest.json'), 'utf8')) as Record<string, number | number[] | string[]>;
    writeReport(dir, read<BossRow>('boss.jsonl'), read<NodeRow>('node.jsonl'), {
      tiers: (man.tiers as number[]) ?? tiers,
      bossCapMs: (man.bossCapMs as number) ?? bossCapMs,
      nodeCapMs: (man.nodeCapMs as number) ?? nodeCapMs,
      seeds: (man.seeds as number[]) ?? seeds,
      plus: (man.plus as number) ?? plus,
      factorSpec: (man.factorSpec as string[]) ?? factorSpec,
      nodeLanes: (man.nodeLanes as number) ?? nodeLanes,
    });
    console.log(`re-rendered ${dir}`);
    return;
  }

  mkdirSync(out, { recursive: true });
  const artifact = resolve('../reports/progression-phase0/hitboxes.json');
  if (!existsSync(artifact)) await writeHitboxArtifact(artifact);
  assert(hydrateHitboxCacheFromArtifact(artifact) > 0, 'no hitboxes');

  const cells = laneCells(tiers, nodeLanes).filter((c) => !filter || c.id.includes(filter));
  assert(cells.length > 0, 'no cells selected');
  writeFileSync(resolve(out, 'manifest.json'), JSON.stringify({
    schema: 1, source: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    tiers, seeds, bossCapMs, nodeCapMs, nodeLanes, plus, factorSpec,
    seedFactorByTier: SEED_FACTOR_BY_TIER,
    committedFactorByTier: GAME_CONFIG.PLAYER_POOL_FACTOR_BY_TIER,
    grants: [
      'wallet credited for the lineage band and zeroed afterwards',
      "lineage home biome raised to the tier's gate level where the biome's own cap is lower",
    ],
    scope: 'Pure weapon lanes (5 lineages x 3 lanes) per tier. BOSS: the lineage biome\'s dungeon, guard stripped, boss woken; kill time and time-to-death from the same fight, extrapolated when not measured. NORMAL: an open node of the same biome, FightHpTracker median fight-end HP. Bench bot, +N gear, capped mastery, reference ability wiring, no travel.',
    cells: cells.map((c) => ({ id: c.id, form: c.form, gear: c.gear, boss: c.bossNode.bossId, bossNode: c.bossNode.nodeId, normalNode: c.normalNode, cards: c.cardIds })),
  }, null, 2));

  const bossRows: BossRow[] = [];
  const nodeRows: NodeRow[] = [];
  const bossPath = resolve(out, 'boss.jsonl');
  const nodePath = resolve(out, 'node.jsonl');
  const started = Date.now();
  let done = 0;
  const totalBoss = cells.reduce((a, c) => a + factorsFor(c.tier).length * seeds.length, 0);

  for (const cell of cells) for (const factor of factorsFor(cell.tier)) for (const seed of seeds) {
    const row = runBossFight(cell, factor, seed, bossCapMs, plus);
    bossRows.push(row);
    appendFileSync(bossPath, JSON.stringify(row) + '\n');
    done++;
    console.log(
      `${row.cell.padEnd(26)} x${factor.toFixed(2)} boss=${row.bossId.padEnd(22)} hp=${String(row.maxHp).padStart(5)} ` +
      `${row.outcome.padEnd(12)} kill=${fmtS(row.killS, bossCapMs / 1000).padStart(7)}s ttd=${fmtS(ttdOf(row.ttdS, bossCapMs / 1000), bossCapMs / 1000).padStart(8)}s ` +
      `[${done}/${totalBoss} ${((Date.now() - started) / 1000).toFixed(0)}s]${row.refusals.length ? ` REFUSED:${row.refusals.length}` : ''}`,
    );
    if (cell.normalNode) {
      const nrow = runNormalNode(cell, factor, seed, nodeCapMs, plus);
      nodeRows.push(nrow);
      appendFileSync(nodePath, JSON.stringify(nrow) + '\n');
      console.log(
        `${' '.repeat(26)} x${factor.toFixed(2)} node=${nrow.nodeId.padEnd(22)} fights=${String(nrow.fights).padStart(3)} ` +
        `medEnd=${fmt2(nrow.medianEndHp)} inBand=${fmt2(nrow.timeInBand)} deaths=${nrow.deaths} kills=${nrow.kills}`,
      );
    }
    writeReport(out, bossRows, nodeRows, { tiers, bossCapMs, nodeCapMs, seeds, plus, factorSpec, nodeLanes });
  }

  console.log(`\nwrote ${out}`);
}

interface ReportOpts {
  tiers: number[]; bossCapMs: number; nodeCapMs: number; seeds: number[]; plus: number;
  factorSpec: string[]; nodeLanes: number;
}

/**
 * The gate table: per tier per factor, the MEDIAN over lanes of boss
 * time-to-death and of kill time, plus the normal-node median fight-end HP.
 *
 * The criterion (Phase 0 call four) is read off this table: the picked factor is
 * the lowest at which median TTD exceeds median kill time without pushing
 * normal-node fight-end HP above 0.80.
 */
function writeReport(out: string, boss: BossRow[], node: NodeRow[], o: ReportOpts): void {
  const capS = o.bossCapMs / 1000;
  const lines = [
    '| tier | factor | lanes | median TTD (s) | median kill (s) | TTD/kill | lanes TTD>kill | median end HP | deaths | measured TTD | measured kill |',
    '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ];
  const summary: Record<string, unknown>[] = [];
  const key = (r: { tier: number; factor: number }) => `${r.tier}|${r.factor}`;
  const groups = new Map<string, BossRow[]>();
  for (const r of boss) (groups.get(key(r)) ?? groups.set(key(r), []).get(key(r))!).push(r);
  for (const [k, rows] of [...groups.entries()].sort()) {
    const [tier, factor] = k.split('|').map(Number);
    // The medians are over the LANES: one reading per lane, itself the median
    // over seeds, so a lane with more seeds does not weigh more.
    const byLane = new Map<string, BossRow[]>();
    for (const r of rows) (byLane.get(r.cell) ?? byLane.set(r.cell, []).get(r.cell)!).push(r);
    const laneTtd: number[] = [], laneKill: number[] = [];
    let won = 0;
    for (const laneRows of byLane.values()) {
      const t = med(laneRows.map((r) => ttdOf(r.ttdS, capS)));
      const kk = med(laneRows.map((r) => r.killS));
      laneTtd.push(t); laneKill.push(kk);
      if (t > kk) won++;
    }
    const mTtd = med(laneTtd), mKill = med(laneKill);
    const nodeRows = node.filter((r) => r.tier === tier && r.factor === factor);
    const mEnd = nodeRows.length ? med(nodeRows.map((r) => r.medianEndHp ?? NaN).filter((x) => !isNaN(x))) : NaN;
    const rec = {
      tier, factor, lanes: byLane.size, medianTtdS: mTtd, medianKillS: mKill,
      ratio: mKill > 0 ? mTtd / mKill : null,
      lanesTtdOverKill: won, medianNodeEndHp: isNaN(mEnd) ? null : mEnd,
      nodeDeaths: nodeRows.reduce((a, r) => a + r.deaths, 0),
      measuredTtd: rows.filter((r) => r.ttdMeasured).length,
      measuredKill: rows.filter((r) => r.killMeasured).length,
      fights: rows.length,
    };
    summary.push(rec);
    lines.push(
      `| T${tier} | ${factor.toFixed(2)} | ${rec.lanes} | ${fmtS(mTtd, capS)} | ${fmtS(mKill, capS)} | ` +
      `${rec.ratio === null ? 'inf' : rec.ratio.toFixed(2)} | ${won}/${rec.lanes} | ${fmt2(rec.medianNodeEndHp)} | ` +
      `${rec.nodeDeaths} | ${rec.measuredTtd}/${rec.fights} | ${rec.measuredKill}/${rec.fights} |`,
    );
  }

  const perLane = [
    '| cell | factor | boss | maxHp | outcome | kill (s) | TTD (s) | TTD/kill | cards | refusals |',
    '|---|---:|---|---:|---|---:|---:|---:|---:|---|',
    ...boss.map((r) => `| ${r.cell} | ${r.factor.toFixed(2)} | ${r.bossId} | ${r.maxHp} | ${r.outcome} | ` +
      `${fmtS(r.killS, capS)} | ${fmtS(ttdOf(r.ttdS, capS), capS)} | ${(ttdOf(r.ttdS, capS) / r.killS).toFixed(2)} | ` +
      `${r.activeCards} | ${r.refusals.join('; ') || ''} |`),
  ];
  const perNode = [
    '| cell | factor | node | maxHp | fights | median end HP | time in band | deaths | kills |',
    '|---|---:|---|---:|---:|---:|---:|---:|---:|',
    ...node.map((r) => `| ${r.cell} | ${r.factor.toFixed(2)} | ${r.nodeId} | ${r.maxHp} | ${r.fights} | ` +
      `${fmt2(r.medianEndHp)} | ${fmt2(r.timeInBand)} | ${r.deaths} | ${r.kills} |`),
  ];
  const refused = boss.filter((r) => r.refusals.length > 0);
  const md = [
    `# Pool raise bench — ${new Date().toISOString()}`, '',
    `tiers ${o.tiers.join('/')}; factors ${o.factorSpec.join(', ')} (seed = ${SEED_FACTOR_BY_TIER.join('/')});`,
    `boss cap ${capS} s; normal-node cap ${o.nodeCapMs / 1000} s on ${o.nodeLanes} lane(s) per lineage; gear +${o.plus}; seeds ${o.seeds.join(', ')}.`, '',
    'Criterion (Phase 0 call four): the lowest factor whose median boss time-to-death',
    'exceeds median kill time for the pure lanes, without median normal-node fight-end',
    `HP above 0.80. Time-to-death is clamped at ${ttdCapS(capS)} s, which reads as "the boss`,
    'cannot kill this build"; kill time is extrapolated from the share of the bar removed',
    'whenever the boss survived, which is optimistic for a boss that gets harder late.', '',
    '## Gate table', '', ...lines, '',
    '## Per lane, boss', '', ...perLane, '',
    '## Per lane, normal node', '', ...perNode, '',
    '## Refusals', '',
    refused.length === 0
      ? 'None: every lane bought and activated its whole band.'
      : refused.map((r) => `- \`${r.cell}\` x${r.factor}: ${r.refusals.join('; ')}`).join('\n'),
    '',
  ].join('\n');
  writeFileSync(resolve(out, 'report.md'), md);
  writeFileSync(resolve(out, 'summary.json'), JSON.stringify({ gate: summary, boss, node }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
