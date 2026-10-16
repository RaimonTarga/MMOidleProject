/**
 * The Spirit at runtime (class-first build plan CS-like Spirit track; bible §11.2–§11.5): the
 * storm is one bar that is both damage and shield. It fills from a constant flow (never from
 * your hits), hits and damage over time drain it before your HP, and the Thresholds' bands and
 * floor decide when a spend fires. The relic's twist, the weapon's shape and the gear lines bend
 * it; at T2 the discipline reshapes the storm itself (Overflow's brim, Tide's ebb and surge,
 * Reservoir's deep bank); at T3 the specialization bends that shape (spiritT3.ts holds what its lessons do in
 * the world); at T4 the leaves turn what empties the storm (spiritT4.ts holds the T4 lessons). Wiring only: every number is a kit `params` placeholder or a constant below.
 *
 * `usesEnergy.energy` is the storm in HP-like units and `energyMax` its size: `pips` (the class
 * budget) times `STORM_PIP` times the tier scale. Gear never grows the pool (bible §11.2).
 */
import {
  PLATING_SHRED_EFFECT_ID,
  SPIRIT_KIT,
  SUN_MARK_EFFECT_ID,
  getResource,
  getString,
  hasStatusEffect,
  removeStatusEffect,
  setResource,
  setString,
  type SpiritPiece,
  type SpiritTrophy,
  type ThresholdsConfig,
} from '@mmo-idle/shared';
import { mutateSlice } from '../../../../ecs/dirtyHelpers';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { IS_DEV } from '../../../../env';
import { log } from '../../../../log';
import type { World } from '../../../../world/World';
import { isPlayerInCombat } from '../../../combat/ai/engagement';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { registerCombatListener, attackNow } from '../../../combat/engine/combatPipeline';
import { conditionsHold, momentActive, momentTick } from '../../../combat/moments/moments';
import { cleansePlayerAfflictions } from '../../../combat/status/cleanse';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { applyStun } from '../../../combat/status/stun';
import { repositionPlayer } from '../../../combat/damage/knockback';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import { classConfigContextOf } from '../../../player/progression/classConfig';
import {
  MELEE_REACH, fireDustDevil, fireFlare, fireGale, fireUpdraft, sandRing, slowAttacks, spill, startHail, startOrb, surgeWave, tickLingering,
} from './spiritT2';
import {
  chillOf, fireDownburst, fireFoehn, fireTailwind, forkTargets, heatOf, isFireHit, isShelledTarget, pyroBurst, slowChillBuild,
  startGlaze, stormdancerBlink, tickGlaze,
} from './spiritT3';
import {
  debuffCountOf, fireGroundCharge, fireMaelstrom, hastenDebuffs, newRisenNear, startThunderstorm, strayTarget, thunderstormCount,
  tickGroundCharge, tickThunderstorm,
} from './spiritT4';

/** One pip of the storm at T1, in HP-like units. PLACEHOLDER. */
const STORM_PIP = 20;
/**
 * The flow: this share of the T1 bottle (FLOW_BASE_PIPS) per second, at the tier's storm scale. Mastery pips
 * deepen the bottle (a bigger shield, bigger bursts) but not the flow: with the flow a share of the whole
 * bottle, Storm 9 at T2 refilled ~80 a second against bosses landing 4-8 (overnight sims). PLACEHOLDER.
 */
const FLOW_PCT_PER_SEC = 0.25;
const FLOW_BASE_PIPS = 4;
/** Out of combat the storm gathers this many times as fast, before Still Air. PLACEHOLDER. */
const OOC_FLOW_X = 2;
/** The gap between two spends (ms). PLACEHOLDER. */
const SPEND_GAP_MS = 700;
/** Plain zaps are about a quarter of the damage (bible §11.2). PLACEHOLDER. */
const ZAP_SHARE = 0.5;
/** Afterstorm's window after a big hit, and what is big. PLACEHOLDER. */
const AFTERSTORM_MS = 4_000;
const BIG_HIT_SHARE = 0.25;
/** A spend must have a target this close (px); each T2 discipline sets where it fights (§11.5). PLACEHOLDER. */
const SPEND_REACH = 260;
const REACH_BY_DISCIPLINE: Readonly<Record<string, number>> = {
  'spirit-overflow': 170, // close: the spill reaches only enemies near you
  'spirit-tide': 260, // moves with the tide (positioning is auto-combat's: see the T2-SPIRIT report)
  'spirit-reservoir': 420, // far: one bolt from afar
};
/** Overflow: how far past the brim the storm can rise (x the bottle), how fast the excess arcs off, and where. PLACEHOLDER. */
const OVERFLOW_ROOM = 1.5;
const SPILL_RATE_PER_SEC = 0.8;
const SPILL_RADIUS = 160;
const SPILL_TARGETS = 2;
const SPILL_DAMAGE_PER_PIP = 1;
/** Reservoir: a much deeper bottle (x the pips). PLACEHOLDER. */
const RESERVOIR_DEPTH_X = 2;
/** Tide: the flow runs this many times as fast in the ebb; spends cost this share in the surge. PLACEHOLDER. */
const TIDE_EBB_FLOW_X = 3;
const TIDE_SURGE_COST_X = 0.7;
/** Monsoon's window after an ambush hit. PLACEHOLDER. */
const MONSOON_MS = 4_000;
const SAND_RING_EVERY_MS = 250;
/** Stormdancer: how often an overflowing Spirit blinks, how far it sees, and the share of the excess each landing lets loose. PLACEHOLDER. */
const BLINK_EVERY_MS = 2_500;
const BLINK_REACH = 420;
const BLINK_BURST_SHARE = 0.3;
const BLINK_BURST_TARGETS = 6;
/** Spillway: the share of the excess a spend carries to its target. PLACEHOLDER. */
const SPILLWAY_SHARE = 0.5;
/** Spring Tide: every this many tides runs twice as high. PLACEHOLDER. */
const SPRING_EVERY = 3;
const SPRING_X = 2;
/** Slack Water: hits drain the storm at this share of cost during the ebb. PLACEHOLDER. */
const SLACK_EBB_COST = 0.5;
/** Breakwater: damage per pip the surge spent, as a multiple of attack. PLACEHOLDER. */
const BREAKWATER_PER_PIP = 1;
const BREAKWATER_RADIUS = 240;
/** Gathering Dark: seconds of a full bank to reach double, and the extra at that point. PLACEHOLDER. */
const DARK_RAMP_MS = 10_000;
/** Overcast: how far from the target a bolt finds more bodies. PLACEHOLDER. */
const OVERCAST_RADIUS = 200;
/** Deep Well: the share of the bank kept back as shield. PLACEHOLDER. */
const DEEP_WELL_KEPT = 1 / 3;

const NEXT_SPEND_AT = 'spirit.nextSpendAt';
const BURSTING = 'spirit.bursting';
const LAST_SPEND_AT = 'spirit.lastSpendAt';
const AFTERSTORM_UNTIL = 'spirit.afterstormUntil';
const CHARGED = 'spirit.charged';
const WEB_UNTIL = 'spirit.webUntil';
const SOAK_UNTIL = 'spirit.soakUntil';
const TIDE_SURGE = 'spirit.tideSurge';
const SQUALL_STREAK = 'spirit.squallStreak';
const MONSOON_UNTIL = 'spirit.monsoonUntil';
const SAND_RING_AT = 'spirit.sandRingAt';
const FIRST_FREE_ON = 'spirit.firstFreeOn';
const BLINK_AT = 'spirit.blinkAt';
const PYRO_AT = 'spirit.pyroAt';
const TIDE_COUNT = 'spirit.tideCount';
const TIDE_HIGH = 'spirit.tideHigh';
const SURGE_SPENT = 'spirit.surgeSpent';
const HELD_SINCE = 'spirit.heldSince';
const SHUNT_AT = 'spirit.shuntAt';
const WADE_AT = 'spirit.wadeAt';
const TURN_UNTIL = 'spirit.turnUntil';
const DEPTH_ARMED = 'spirit.depthArmed';
const DEPTH_TICK = 'spirit.depthTick';

// ── Dev-only telemetry: what the storm did, once a minute per Spirit ─────────

/** The proof that the class system fires in real fights (spends by piece, drains by source, time bare). */
interface StormStats {
  since: number;
  spends: Record<string, number>;
  spent: number;
  absorbed: { hit: number; dot: number };
  zaps: number;
  bareMs: number;
  floorMs: number;
  combatMs: number;
  wasted: number;
  procs: Record<string, number>;
}
/** The window; `SPIRIT_STATS_MS` shortens it for a bench fight. */
const STATS_EVERY_MS = Number(process.env.SPIRIT_STATS_MS ?? 60_000);
const stormStats = new WeakMap<PlayerEntity, StormStats>();

function statsOf(player: PlayerEntity): StormStats | null {
  if (!IS_DEV) return null;
  let stats = stormStats.get(player);
  if (!stats) {
    // `since` is stamped by the storm's own tick (flushStats), the one clock the window reads.
    stats = { since: 0, spends: {}, spent: 0, absorbed: { hit: 0, dot: 0 }, zaps: 0, bareMs: 0, floorMs: 0, combatMs: 0, wasted: 0, procs: {} };
    stormStats.set(player, stats);
  }
  return stats;
}

function countProc(player: PlayerEntity, id: string): void {
  const stats = statsOf(player);
  if (stats) stats.procs[id] = (stats.procs[id] ?? 0) + 1;
}

function flushStats(player: PlayerEntity, t: Thresholds, now: number): void {
  const stats = stormStats.get(player);
  if (!stats) return;
  if (stats.since === 0) stats.since = now;
  if (now - stats.since < STATS_EVERY_MS) return;
  const round = (n: number): number => Math.round(n);
  log.info(`spirit-storm ${JSON.stringify({
    player: player.isPlayer.name, tier: player.tracksProgression.playerTier, discipline: t.discipline, spec: t.spec,
    trophy: t.trophy?.id ?? null, rank: t.trophyRank, pips: t.pips, max: player.usesEnergy?.energyMax,
    attack: player.dealsDamage.attack, cd: player.performsAttack.attackCooldown, range: player.performsAttack.attackRange, hp: Math.round(player.hasHealth.hp), maxHp: player.hasHealth.maxHp,
    floor: t.config.floorPct, phase: t.config.phase, bands: t.config.bands.map((b) => `${b.pieceId.replace('spirit-', '')}@${b.atLeastPct}`),
    spends: stats.spends, spent: round(stats.spent), absorbedHit: round(stats.absorbed.hit), absorbedDot: round(stats.absorbed.dot),
    zaps: stats.zaps, combatS: round(stats.combatMs / 1000), bareS: round(stats.bareMs / 1000), floorS: round(stats.floorMs / 1000),
    wasted: round(stats.wasted), procs: stats.procs,
  })}`);
  stormStats.delete(player);
}

const PIECES = new Map<string, SpiritPiece>(SPIRIT_KIT.pieces.map((piece) => [piece.id, piece]));
const TROPHIES = new Map<string, SpiritTrophy>(SPIRIT_KIT.trophies.map((trophy) => [trophy.id, trophy]));

export interface Thresholds {
  config: ThresholdsConfig;
  owned: ReadonlySet<string>;
  /** Owned pieces and their ranks. */
  ranks: ReadonlyMap<string, number>;
  trophy: SpiritTrophy | undefined;
  /** The trophy's rank (the next tier's boss ranks it up). */
  trophyRank: number;
  /** The T2 discipline (Overflow, Tide, Reservoir), once picked. */
  discipline: string | null;
  /** The T3 specialization, once picked (an unlocked Passive Tree node of the discipline). */
  spec: string | null;
  /** The T4 leaves picked (unlocked Passive Tree nodes of the discipline). */
  leaves: ReadonlySet<string>;
  pips: number;
}

/** The leaves' ids, with the discipline each belongs to. */
const LEAF_DISCIPLINE = new Map<string, string>(SPIRIT_KIT.leaves.map((leaf) => [leaf.id, leaf.disciplineId]));
const LEAF_PARAMS = new Map<string, Readonly<Record<string, number>>>(SPIRIT_KIT.leaves.map((leaf) => [leaf.id, leaf.params]));
/** A leaf's number; the leaf's id and the key are the kit's. */
const leafParam = (leaf: string, key: string, fallback: number): number => LEAF_PARAMS.get(leaf)?.[key] ?? fallback;

const SPEC_DISCIPLINE = new Map<string, string>(SPIRIT_KIT.specializations.map((spec) => [spec.id, spec.disciplineId]));

const cache = new WeakMap<PlayerEntity, { tick: number; value: Thresholds | null }>();

/** The Spirit's Thresholds, or null for a character without them. */
export function thresholdsOf(world: World, player: PlayerEntity): Thresholds | null {
  const hit = cache.get(player);
  if (hit && hit.tick === world.tickCounter) return hit.value;
  const config = player.configuresClass?.config;
  let value: Thresholds | null = null;
  if (player.usesEnergy && config?.system.kind === 'thresholds') {
    const ctx = classConfigContextOf(player);
    if (ctx) {
      const relic = config.relic[0];
      value = {
        config: config.system,
        owned: new Set(ctx.pieceRanks.keys()),
        ranks: ctx.pieceRanks,
        trophy: relic ? TROPHIES.get(relic) : undefined,
        trophyRank: relic ? (ctx.trophyRanks.get(relic) ?? 1) : 0,
        discipline: ctx.disciplineId,
        spec: player.usesSkills.unlockedSkills.find((id) => ctx.disciplineId !== null && SPEC_DISCIPLINE.get(id) === ctx.disciplineId) ?? null,
        leaves: new Set(player.usesSkills.unlockedSkills.filter((id) => ctx.disciplineId !== null && LEAF_DISCIPLINE.get(id) === ctx.disciplineId)),
        pips: ctx.budget,
      };
    }
  }
  cache.set(player, { tick: world.tickCounter, value });
  return value;
}

export function hasThresholds(player: PlayerEntity): boolean {
  return !!player.usesEnergy && player.configuresClass?.config.system.kind === 'thresholds';
}

/**
 * The storm's size by tier (bottle, flow and costs alike), measured against what bosses actually land on
 * the storm (overnight sims, 2026-10-16, with the per-tier monster factor of 9a2671c8): about 11-14 a second
 * at T1, 6-18 at T2, 5-33 at T3, 16-45 at T4. On the piece damage curve (x2.6 / x5 / x10, compounding with
 * the Mastery pips) the flow ran 2.5-5x ahead of that pressure from T2 on and no boss ever reached HP. The
 * flow keeps about T1's lead at every tier. Spends still scale with the tier through attack; costs share
 * this scale, so a band's share of the bottle is the same at every tier. PLACEHOLDER.
 */
const STORM_TIER_SCALE: Readonly<Record<number, number>> = { 1: 1, 2: 1, 3: 1.5, 4: 1.8 };

function tierScale(player: PlayerEntity): number {
  const tier = Math.min(Math.max(Math.floor(player.tracksProgression.playerTier), 1), 4);
  return STORM_TIER_SCALE[tier] ?? 1;
}

/** The bottle's size now: pips x pip x tier. Gear never changes it. */
export function stormMaxFor(player: PlayerEntity, pips: number): number {
  return Math.max(1, Math.round(pips * STORM_PIP * tierScale(player)));
}

/** The bottle with the discipline's depth: Reservoir's is much deeper. */
function bottleOf(player: PlayerEntity, t: Thresholds): number {
  return stormMaxFor(player, t.pips * (t.discipline === 'spirit-reservoir' ? RESERVOIR_DEPTH_X : 1));
}

const aliveNear = (world: World, player: PlayerEntity, radius: number, exclude?: string): MonsterEntity[] =>
  playerAoeTargets(world, player, player.hasPosition.current, radius, exclude);

// ── The storm absorbs ────────────────────────────────────────────────────────

/**
 * Hits and damage over time drain the storm before HP. Eye of the Storm halves the cost while the
 * storm is at or below the floor; Sealed Vessel halves it for damage over time; Sandshroud for ranged
 * hits; Stormsense keeps an ambush from draining below the floor. Returns what is left.
 */
export function drainStorm(
  world: World,
  player: PlayerEntity,
  damage: number,
  kind: 'hit' | 'dot',
  source?: MonsterEntity,
): { damage: number; absorbed: number } {
  const t = thresholdsOf(world, player);
  const energy = player.usesEnergy;
  if (!t || !energy || energy.energy <= 0 || damage <= 0) return { damage, absorbed: 0 };
  const passives = player.usesSkills.passives;
  const cs = player.tracksCombat;
  const floorAbs = (t.config.floorPct / 100) * energy.energyMax;
  // Shunt: once every few seconds, a hit worth over a quarter of your storm goes into the spill instead.
  const shuntAt = world.tickCounter * 100;
  if (kind === 'hit' && t.leaves.has('spirit-shunt') && t.discipline === 'spirit-overflow' && shuntAt >= getResource(cs, SHUNT_AT)
    && damage > energy.energy * leafParam('spirit-shunt', 'share', 0.25)) {
    setResource(cs, SHUNT_AT, shuntAt + leafParam('spirit-shunt', 'everyMs', 5_000));
    const arcs = spillDamage(player, damage);
    if (arcs >= 1) spill(world, player, arcs, SPILL_RADIUS, SPILL_TARGETS);
    return { damage: 0, absorbed: damage };
  }
  // Dam: while the bank is above your floor, no single hit drains more than a quarter of the bottle; the rest is lost.
  if (kind === 'hit' && t.leaves.has('spirit-dam') && t.discipline === 'spirit-reservoir' && energy.energy > floorAbs) {
    damage = Math.min(damage, energy.energyMax * leafParam('spirit-dam', 'share', 0.25));
  }
  const eye = t.owned.has('spirit-eye-of-the-storm') && energy.energy <= floorAbs
    ? (PIECES.get('spirit-eye-of-the-storm')!.params['costMult'] ?? 0.5) : 1;
  const sealed = kind === 'dot' ? (passives['spirit.sealed-vessel'] ?? 0) || 1 : 1;
  // Sandshroud: ranged hits drain the storm at a share of cost.
  const ranged = !!source && (source.performsAttack?.attackRange ?? 0) > MELEE_REACH;
  const sandshroud = ranged ? (passives['spirit.ranged-cost'] ?? 0) || 1 : 1;
  // Flash Steam: fire hits drain the storm at a share of cost.
  const flashSteam = kind === 'hit' && isFireHit(source) ? (passives['spirit.fire-cost'] ?? 0) || 1 : 1;
  // Slack Water: during the ebb, hits drain the storm at half cost.
  const slack = t.spec === 'spirit-slack-water' && getResource(player.tracksCombat, TIDE_SURGE) <= 0 ? SLACK_EBB_COST : 1;
  // Gravecloth: risen enemies' hits drain the storm at a share of cost. Deep Seal: so do all hits while you carry three debuffs.
  const gravecloth = source?.isRaised ? (passives['spirit.risen-cost'] ?? 0) || 1 : 1;
  const deepSeal = (passives['spirit.debuff-cost'] ?? 0) > 0 && debuffCountOf(player) >= 3 ? passives['spirit.debuff-cost']! : 1;
  // Static Field: hits from enemies caught in your spill drain the storm less. Levee: so do hits while three or more enemies are on you.
  const staticField = t.leaves.has('spirit-static-field') && energy.energy > energy.energyMax && !!source
    && Math.hypot(source.hasPosition.current.x - player.hasPosition.current.x, source.hasPosition.current.y - player.hasPosition.current.y) <= SPILL_RADIUS
    ? leafParam('spirit-static-field', 'costMult', 0.667) : 1;
  const levee = t.leaves.has('spirit-levee') && momentActive(world, player, 'enemies-near', leafParam('spirit-levee', 'enemies', 3), 0)
    ? leafParam('spirit-levee', 'costMult', 0.8) : 1;
  const cost = eye * sealed * sandshroud * flashSteam * slack * gravecloth * deepSeal * staticField * levee;
  // Stormsense: an ambush cannot drain the storm below your floor.
  const stormsense = (passives['spirit.stormsense'] ?? 0) > 0 && momentActive(world, player, 'ambush', undefined, 0);
  const spendable = stormsense ? Math.max(0, energy.energy - floorAbs) : energy.energy;
  const absorbed = Math.min(damage, spendable / cost);
  const before = energy.energy;
  energy.energy = Math.max(0, energy.energy - absorbed * cost);
  const stats = statsOf(player);
  if (stats) stats.absorbed[kind] += absorbed;
  // Static Skin: an enemy that strikes the storm is charged; the next spend on it hits harder.
  if (source && absorbed > 0 && (passives['spirit.static-skin'] ?? 0) > 0) setResource(source.tracksCombat, CHARGED, 1);
  // Marsh Fire: when hits empty the storm, it bursts around you.
  if (before > 0 && energy.energy <= 0 && t.trophy?.id === 'spirit-relic-swamp') {
    countProc(player, 'marsh-fire');
    const p = t.trophy.params;
    const around = aliveNear(world, player, p['radius'] ?? 140);
    if (around.length > 0) applyPlayerAoeTo(world, player, around, player.dealsDamage.attack * (p['mult'] ?? 3) * (t.trophyRank >= 3 ? (p['rank3MultX'] ?? 1.5) : 1), 'player', {}, {});
    // Marsh Fire II: the burst also washes a debuff off you.
    if (t.trophyRank >= 2) cleansePlayerAfflictions(player, 1, p['washes'] ?? 1);
  }
  return { damage: damage - absorbed, absorbed };
}

// ── Spends ───────────────────────────────────────────────────────────────────

function costOf(player: PlayerEntity, t: Thresholds, piece: SpiritPiece, now: number): number {
  const cs = player.tracksCombat;
  const base = (piece.params['costPips'] ?? 0) * STORM_PIP * tierScale(player);
  let mult = player.usesSkills.passives['spirit.cost-mult'] ?? 1;
  // Squall: a spend soon after the last costs a little less; rank II builds the discount with each spend in a row.
  if (t.trophy?.id === 'spirit-relic-forest' && now - getResource(cs, LAST_SPEND_AT) <= (t.trophy.params['windowMs'] ?? 3000)) {
    const streak = Math.max(1, getResource(cs, SQUALL_STREAK));
    const built = t.trophyRank >= 2 ? (t.trophy.params['buildStep'] ?? 0.1) * (streak - 1) : 0;
    mult *= 1 - Math.min(t.trophy.params['maxDiscount'] ?? 0.5, (t.trophy.params['discount'] ?? 0.2) + built);
  }
  // Tide: spends cost less in the surge.
  if (t.discipline === 'spirit-tide' && getResource(cs, TIDE_SURGE) > 0) mult *= TIDE_SURGE_COST_X;
  return base * mult;
}

const isArea = (piece: SpiritPiece): boolean =>
  piece.id === 'spirit-chain-lightning' || piece.id === 'spirit-thunderclap'
  || piece.id === 'spirit-hailstorm' || piece.id === 'spirit-ball-lightning' || piece.id === 'spirit-forked-bolt'
  || piece.id === 'spirit-thunderstorm';

/** Where this Spirit fights: its discipline's reach, Sirocco Staff's multiplier on top. */
export function reachOf(player: PlayerEntity, t: Thresholds): number {
  const base = t.discipline ? (REACH_BY_DISCIPLINE[t.discipline] ?? SPEND_REACH) : SPEND_REACH;
  return base * (player.usesSkills.passives['spirit.reach-x'] ?? 1);
}

/** The attack target when it is in reach; Running Storm follows a fleeing target farther out. */
function targetOf(world: World, player: PlayerEntity, t: Thresholds): MonsterEntity | undefined {
  const id = player.hasAttackTarget?.targetId;
  const monster = id ? world.getMonsterEntity(id) : undefined;
  if (!monster || monster.hasHealth.hp <= 0) return undefined;
  const d = Math.hypot(monster.hasPosition.current.x - player.hasPosition.current.x, monster.hasPosition.current.y - player.hasPosition.current.y);
  const follow = t.trophy?.id === 'spirit-relic-jungle' ? (t.trophy.params['followPx'] ?? 300) : 0;
  return d <= reachOf(player, t) + follow ? monster : undefined;
}

const thunderheadFull = (t: Thresholds, energy: { energy: number; energyMax: number }): boolean =>
  t.trophy?.id === 'spirit-relic-mountain' && energy.energy >= energy.energyMax * (t.trophyRank >= 3 ? 0.8 : 0.98);

function strikeDamage(world: World, player: PlayerEntity, t: Thresholds, piece: SpiritPiece, target: MonsterEntity, now: number, multOverride?: number): number {
  const passives = player.usesSkills.passives;
  const energy = player.usesEnergy!;
  let damage = player.dealsDamage.attack * (multOverride ?? piece.params['mult'] ?? 1) * (passives['spirit.damage-mult'] ?? 1);
  damage *= 1 + (isArea(piece) ? (passives['spirit.area-pct'] ?? 0) : (passives['spirit.single-pct'] ?? 0));
  // Tempest Staff: area spends hit harder for each enemy they hit.
  if (isArea(piece) && (passives['spirit.area-count-pct'] ?? 0) > 0) {
    damage *= 1 + (passives['spirit.area-count-pct'] ?? 0) * playerAoeTargets(world, player, target.hasPosition.current, piece.params['radius'] ?? 160).length;
  }
  // Abyssal Lantern: spends hit harder for each different debuff on you.
  if ((passives['spirit.debuff-pct'] ?? 0) > 0) damage *= 1 + (passives['spirit.debuff-pct'] ?? 0) * debuffCountOf(player);
  // Depth Charge: the first spend when the target resurfaces is doubled.
  if (getResource(player.tracksCombat, DEPTH_ARMED) > 0) {
    damage *= t.trophy?.id === 'spirit-relic-trench' ? (t.trophy.params['firstX'] ?? 2) : 1;
    setResource(player.tracksCombat, DEPTH_ARMED, 0);
  }
  // Thunderhead: a full storm makes the next spend twice as big.
  if (thunderheadFull(t, energy)) damage *= t.trophy!.params['mult'] ?? 2;
  // Running Storm: a spend whose target ran lands harder the farther it ran past your reach.
  if (t.trophy?.id === 'spirit-relic-jungle') {
    const d = Math.hypot(target.hasPosition.current.x - player.hasPosition.current.x, target.hasPosition.current.y - player.hasPosition.current.y);
    const grown = t.trophyRank >= 3 ? (t.trophy.params['rank3X'] ?? 2) : t.trophyRank >= 2 ? (t.trophy.params['rank2X'] ?? 1.5) : 1;
    damage *= 1 + (t.trophy.params['perHundredPx'] ?? 0.15) * grown * (Math.max(0, d - reachOf(player, t)) / 100);
  }
  // Ash Lightning: harder for each step of the Heat.
  if (piece.id === 'spirit-ash-lightning') damage *= 1 + (piece.params['heatPct'] ?? 0.08) * heatOf(player);
  // Rime Staff: spends hit shelled targets harder.
  if (isShelledTarget(target, now)) damage *= 1 + (passives['spirit.shell-pct'] ?? 0);
  // Ember Rod: the emptier the storm, the harder the spend.
  if ((passives['spirit.empty-pct'] ?? 0) > 0) damage *= 1 + (passives['spirit.empty-pct'] ?? 0) * (1 - Math.min(1, Math.max(0, energy.energy / Math.max(1, energy.energyMax))));
  // Static Skin: a charged enemy takes the next spend harder.
  if (getResource(target.tracksCombat, CHARGED) > 0) { damage *= 1 + (passives['spirit.static-skin'] ?? 0); setResource(target.tracksCombat, CHARGED, 0); }
  // Drenching Staff: spends soak; spends on a soaked target hit harder.
  const soak = passives['spirit.soak-pct'] ?? 0;
  if (soak > 0) {
    if (getResource(target.tracksCombat, SOAK_UNTIL) > now) damage *= 1 + soak;
    setResource(target.tracksCombat, SOAK_UNTIL, now + 4_000);
  }
  return Math.max(1, Math.round(damage));
}

/** One bolt on one body. Thunderhead II: when it is a full-storm spend, it ignores part of the plating. */
function strikeOne(world: World, player: PlayerEntity, t: Thresholds, target: MonsterEntity, damage: number, boosted: boolean): void {
  const plating = target.mitigatesDamage.plating;
  const ignore = boosted && t.trophyRank >= 2 ? (t.trophy!.params['ignorePlating'] ?? 0.5) : 0;
  if (ignore > 0) target.mitigatesDamage.plating = plating * (1 - ignore);
  applyPlayerAoeTo(world, player, [target], damage, 'player', {}, {});
  if (ignore > 0) target.mitigatesDamage.plating = plating;
  // Thunderhead IV: that spend also staggers.
  if (boosted && t.trophyRank >= 4 && target.hasHealth.hp > 0 && !monsterIgnoresControl(target)) {
    applyStun(target.tracksCombat, t.trophy!.params['staggerMs'] ?? 700, player.isPlayer.id);
  }
}

function fire(world: World, player: PlayerEntity, t: Thresholds, piece: SpiritPiece, now: number, spent: number): boolean {
  const target = targetOf(world, player, t);
  const passives = player.usesSkills.passives;
  const rank = t.ranks.get(piece.id) ?? 1;
  switch (piece.id) {
    case 'spirit-thunderclap': {
      const around = aliveNear(world, player, piece.params['radius'] ?? 120);
      // It waits for a body it can stagger: an enemy still in its post-stun ward is no moment (the clap
      // used to spend on a boss it could not stagger, over and over).
      let staggered = 0;
      for (const monster of around) {
        if (!applyStun(monster.tracksCombat, piece.params['staggerMs'] ?? 700, player.isPlayer.id)) continue;
        staggered++;
        // Thunderclap II: what the clap staggers also attacks slower for a few seconds.
        if (rank >= 2) slowAttacks(world, player, monster, piece.params);
      }
      return staggered > 0;
    }
    case 'spirit-downpour': {
      let washed = 0;
      for (const effect of [...player.tracksCombat.statusEffects]) {
        // Downpour II: it also washes Corrosion and slows off you.
        const extra = rank >= 2 && (effect.id === PLATING_SHRED_EFFECT_ID || effect.id === 'slow');
        if ((effect.data['isDot'] ?? 0) !== 1 && !extra) continue;
        removeStatusEffect(player.tracksCombat, effect.id);
        washed++;
      }
      if (washed === 0) return false;
      const petrichor = passives['spirit.petrichor-pct'] ?? 0;
      if (petrichor > 0) applyHealToPlayer(player, player.tracksCombat, player.hasHealth.maxHp * petrichor, world);
      return true;
    }
    case 'spirit-bolt':
    case 'spirit-thunderbolt':
    case 'spirit-chain-lightning':
    case 'spirit-forked-bolt':
    case 'spirit-ash-lightning':
    case 'spirit-cloudburst': {
      if (!target) return false;
      const boosted = thunderheadFull(t, player.usesEnergy!);
      // Cloudburst: everything above the floor in one bolt, sized by what is spent (Gathering Dark: and by how long it was held).
      const perPip = piece.id === 'spirit-cloudburst' ? cloudburstMult(player, t, piece, spent, now) : undefined;
      const damage = strikeDamage(world, player, t, piece, target, now, perPip);
      if (piece.id === 'spirit-cloudburst' && t.spec === 'spirit-overcast') {
        // Overcast: one bolt per enemy around the target, the bank shared between them.
        const bodies = [target, ...playerAoeTargets(world, player, target.hasPosition.current, OVERCAST_RADIUS, target.isMonster.id)];
        for (const body of bodies) strikeOne(world, player, t, body, Math.max(1, Math.round(damage / bodies.length)), boosted);
      } else {
        strikeOne(world, player, t, target, damage, boosted);
      }
      if (piece.id === 'spirit-thunderbolt' && target.hasHealth.hp > 0) applyStun(target.tracksCombat, piece.params['staggerMs'] ?? 900, player.isPlayer.id);
      const at = target.hasPosition.current;
      const nearest = (count: number, pct: number): void => {
        const others = playerAoeTargets(world, player, at, piece.params['radius'] ?? 200, target.isMonster.id)
          .sort((a, b) => Math.hypot(a.hasPosition.current.x - at.x, a.hasPosition.current.y - at.y) - Math.hypot(b.hasPosition.current.x - at.x, b.hasPosition.current.y - at.y))
          .slice(0, count);
        if (others.length > 0) applyPlayerAoeTo(world, player, others, damage * pct, 'player', {}, {});
      };
      // Forked Bolt: the same damage, split toward the enemies farthest from you.
      if (piece.id === 'spirit-forked-bolt') {
        const forks = forkTargets(world, player, target, piece.params['radius'] ?? 260, (piece.params['forks'] ?? 2) + (passives['spirit.area-extra'] ?? 0));
        if (forks.length > 0) applyPlayerAoeTo(world, player, forks, damage * (piece.params['leapPct'] ?? 0.6), 'player', {}, {});
      }
      // Ash Lightning II: it also strikes the enemies around the target.
      if (piece.id === 'spirit-ash-lightning' && rank >= 2) {
        const around = playerAoeTargets(world, player, at, piece.params['splashRadius'] ?? 160, target.isMonster.id);
        if (around.length > 0) applyPlayerAoeTo(world, player, around, damage * (piece.params['splashPct'] ?? 0.5), 'player', {}, {});
      }
      if (piece.id === 'spirit-chain-lightning') nearest((piece.params['leaps'] ?? 3) + (passives['spirit.area-extra'] ?? 0), piece.params['leapPct'] ?? 0.6);
      // Crosswind: every spend also strikes the enemies nearest its target, weaker (rank II: one more).
      if (t.trophy?.id === 'spirit-relic-plains') nearest((t.trophy.params['extra'] ?? 2) + (t.trophyRank >= 2 ? (t.trophy.params['rank2Extra'] ?? 1) : 0), t.trophy.params['pct'] ?? 0.4);
      // Static Web: enemies a spend hits stay charged; plain zaps hit them harder (rank II: longer).
      if (t.trophy?.id === 'spirit-relic-cave') {
        const until = now + (t.trophy.params['durationMs'] ?? 4000) * (t.trophyRank >= 2 ? (t.trophy.params['rank2DurationX'] ?? 1.5) : 1);
        setResource(target.tracksCombat, WEB_UNTIL, until);
        // Static Web III: a charged enemy passes its charge to one enemy touching it.
        if (t.trophyRank >= 3) {
          const touching = playerAoeTargets(world, player, target.hasPosition.current, t.trophy.params['passRadius'] ?? 90, target.isMonster.id)
            .sort((a, b) => Math.hypot(a.hasPosition.current.x - target.hasPosition.current.x, a.hasPosition.current.y - target.hasPosition.current.y)
              - Math.hypot(b.hasPosition.current.x - target.hasPosition.current.x, b.hasPosition.current.y - target.hasPosition.current.y))[0];
          if (touching) setResource(touching.tracksCombat, WEB_UNTIL, until);
        }
      }
      return true;
    }
    case 'spirit-hailstorm': {
      if (!target) return false;
      startHail(player, target.hasPosition.current, strikeDamage(world, player, t, piece, target, now), piece.params, now);
      return true;
    }
    // Sleet: a narrow sheet on one target that breaks shells three times as fast (a Hailstorm with a thin footprint).
    case 'spirit-sleet': {
      if (!target) return false;
      startHail(player, target.hasPosition.current, strikeDamage(world, player, t, piece, target, now), piece.params, now);
      return true;
    }
    case 'spirit-thunderstorm': {
      if (!target) return false;
      startThunderstorm(player, strikeDamage(world, player, t, piece, target, now), piece.params, now);
      return true;
    }
    case 'spirit-ball-lightning': {
      if (!target) return false;
      startOrb(player, target.hasPosition.current, strikeDamage(world, player, t, piece, target, now), piece.params, now);
      return true;
    }
    case 'spirit-gale':
    case 'spirit-dust-wall': return fireGale(world, player, piece.params);
    case 'spirit-ground-charge': return fireGroundCharge(player, piece.params, now);
    case 'spirit-maelstrom': return fireMaelstrom(world, player, piece.params, now);
    case 'spirit-flare': return fireFlare(world, player, piece.params);
    case 'spirit-dust-devil': return fireDustDevil(world, player, piece.params, rank, now);
    case 'spirit-updraft': return fireUpdraft(world, player, piece.params, rank, now);
    case 'spirit-downburst': return fireDownburst(world, player, piece.params, rank);
    case 'spirit-tailwind': return fireTailwind(world, player, piece.params);
    case 'spirit-foehn': return fireFoehn(player, piece.params);
    default:
      return false;
  }
}

/** Cloudburst's damage multiple for what is spent. Gathering Dark: up to double for a bank held full. */
function cloudburstMult(player: PlayerEntity, t: Thresholds, piece: SpiritPiece, spent: number, now: number): number {
  const since = getResource(player.tracksCombat, HELD_SINCE);
  const dark = t.spec === 'spirit-gathering-dark' && since > 0 ? 1 + Math.min(1, (now - since) / DARK_RAMP_MS) : 1;
  return (piece.params['multPerPip'] ?? 2.25) * (spent / (STORM_PIP * tierScale(player))) * dark;
}

/** What a release spends: everything above the floor, or two thirds of it with Deep Well (a third stays as shield). */
function releaseOf(t: Thresholds, aboveFloor: number): number {
  return t.spec === 'spirit-deep-well' ? aboveFloor * (1 - DEEP_WELL_KEPT) : aboveFloor;
}

/** Whether a Reservoir release is "enough": the whole bank would finish the target. A rough estimate (plating ignored). */
function bankKills(player: PlayerEntity, t: Thresholds, target: MonsterEntity, spent: number, now: number): boolean {
  const piece = PIECES.get('spirit-cloudburst')!;
  const pips = spent / (STORM_PIP * tierScale(player));
  const estimate = player.dealsDamage.attack * cloudburstMult(player, t, piece, spent, now) * (player.usesSkills.passives['spirit.damage-mult'] ?? 1);
  return pips >= (piece.params['minPips'] ?? 1) && estimate >= target.hasHealth.hp;
}

/** Tide's phase for the HUD: networked only for a Tide Spirit (absent for every other discipline). */
function publishTide(world: World, player: PlayerEntity, tide: boolean, surging: boolean): void {
  const want = tide ? (surging ? 'surge' : 'ebb') : undefined;
  if (player.usesEnergy?.tide === want) return;
  mutateSlice(world, player, 'usesEnergy', (slice) => {
    if (want) slice.tide = want;
    else delete slice.tide;
  });
}

/** Per-tick storm: size, flow, and the spends the bands allow. */
export function updateSpirit(world: World, player: PlayerEntity, dt: number, now: number): void {
  const t = thresholdsOf(world, player);
  const energy = player.usesEnergy;
  if (!t || !energy) return;
  const cs = player.tracksCombat;
  const passives = player.usesSkills.passives;
  const max = bottleOf(player, t);
  const overflow = t.discipline === 'spirit-overflow';
  const tide = t.discipline === 'spirit-tide';
  // Overflow's bottle has a brim, not a cap: the storm may rise past `energyMax` and the excess arcs off.
  // Spring Tide: every third tide runs twice as high; its ebb fills the bottle to double.
  const highTide = tide && getResource(cs, TIDE_HIGH) > 0;
  const cap = overflow ? max * OVERFLOW_ROOM : highTide ? max * SPRING_X : max;
  if (energy.energyMax !== max) energy.energyMax = max;
  energy.energy = Math.min(energy.energy, cap);
  const floorAbs = (t.config.floorPct / 100) * max;

  // Things already in flight (Hailstorm's hail, Ball Lightning's orb) and the Sandstorm ring.
  tickLingering(world, player, dt, now);
  tickGlaze(world, player, now);
  tickGroundCharge(world, player, now);
  if (thunderstormCount(player) > 0) tickThunderstorm(world, player, now);
  // Burn Off: while you overflow, poisons and bleeds on you end faster. Calm Depths: while the bank is full, debuffs last half as long.
  if (t.leaves.has('spirit-burn-off') && overflow && energy.energy > max) hastenDebuffs(player, dt, leafParam('spirit-burn-off', 'decayX', 2), true);
  if (t.leaves.has('spirit-calm-depths') && energy.energy >= max * 0.98) hastenDebuffs(player, dt, leafParam('spirit-calm-depths', 'decayX', 2), false);
  // Depth Charge: the first spend after the target resurfaces is doubled (armed once per resurfacing).
  if (t.trophy?.id === 'spirit-relic-trench') {
    const surfaced = momentTick(player, 'target-resurfaces');
    if (surfaced !== undefined && momentActive(world, player, 'target-resurfaces', undefined, now) && surfaced + 1 > getResource(cs, DEPTH_TICK)) {
      setResource(cs, DEPTH_TICK, surfaced + 1);
      setResource(cs, DEPTH_ARMED, 1);
    }
  }
  // Insulated: the Chill builds slower while the storm is above the floor.
  slowChillBuild(player, passives['spirit.chill-build'] ?? 0, energy.energy > floorAbs);
  // Pyrocumulus: a full storm boils over; while you stay full, a burst strikes around you every few seconds.
  if (t.trophy?.id === 'spirit-relic-volcanic' && energy.energy >= max * 0.98 && now >= getResource(cs, PYRO_AT)) {
    const p = t.trophy.params;
    if (pyroBurst(world, player, Math.round(player.dealsDamage.attack * (p['mult'] ?? 1.5) * (t.trophyRank >= 2 ? (p['rank2MultX'] ?? 1.5) : 1) * (passives['spirit.damage-mult'] ?? 1)), p['radius'] ?? 160)) {
      setResource(cs, PYRO_AT, now + (p['everyMs'] ?? 3000));
    }
  }
  if (t.trophy?.id === 'spirit-relic-desert' && energy.energy > floorAbs && now >= getResource(cs, SAND_RING_AT)) {
    setResource(cs, SAND_RING_AT, now + SAND_RING_EVERY_MS);
    const p = t.trophy.params;
    sandRing(world, player, (p['radius'] ?? 180) * (t.trophyRank >= 2 ? (p['rank2RadiusX'] ?? 1.4) : 1), (p['slowPct'] ?? 0.3) * (t.trophyRank >= 3 ? (p['rank3SlowX'] ?? 1.5) : 1));
  }

  // The flow is constant: taking damage never pauses it. Out of combat it gathers faster (Still Air).
  const inCombat = isPlayerInCombat(player, now);
  let flow = stormMaxFor(player, FLOW_BASE_PIPS) * FLOW_PCT_PER_SEC * (dt / 1_000);
  if (!inCombat) flow *= OOC_FLOW_X * (1 + (passives['spirit.ooc-flow-pct'] ?? 0));
  if ((passives['spirit.clear-sky-pct'] ?? 0) > 0 && !conditionsHold(world, player, [{ id: 'touched' }], now)) flow *= 1 + (passives['spirit.clear-sky-pct'] ?? 0);
  if (getResource(cs, AFTERSTORM_UNTIL) > now) flow *= passives['spirit.afterstorm-x'] ?? 1;
  if (getResource(cs, MONSOON_UNTIL) > now) flow *= passives['spirit.monsoon-x'] ?? 1;
  // Oasis: while you are marked or slowed, the storm gathers faster.
  if ((passives['spirit.oasis-pct'] ?? 0) > 0 && (hasStatusEffect(cs, 'slow') || hasStatusEffect(cs, SUN_MARK_EFFECT_ID))) flow *= 1 + (passives['spirit.oasis-pct'] ?? 0);
  // Aurora: while you are chilled, the storm gathers faster. Thermal: each step of the Heat adds a little.
  if ((passives['spirit.chill-flow-pct'] ?? 0) > 0 && chillOf(player) > 0) flow *= 1 + (passives['spirit.chill-flow-pct'] ?? 0);
  if ((passives['spirit.heat-flow-pct'] ?? 0) > 0) flow *= 1 + (passives['spirit.heat-flow-pct'] ?? 0) * heatOf(player);
  // Abyssal Calm: each debuff on you makes the storm gather a little faster.
  if ((passives['spirit.debuff-flow-pct'] ?? 0) > 0) flow *= 1 + (passives['spirit.debuff-flow-pct'] ?? 0) * debuffCountOf(player);
  // Depth Charge: while your target is out of reach, the storm gathers faster.
  if (t.trophy?.id === 'spirit-relic-trench' && momentActive(world, player, 'target-out-of-reach', undefined, now)) flow *= t.trophy.params['gatherX'] ?? 2;
  // Turn of the Tide: after the turn, the storm gathers fast for a while.
  if (getResource(cs, TURN_UNTIL) > now) flow *= leafParam('spirit-turn-of-the-tide', 'flowX', 2);
  // Wake: each enemy that rises near you makes the storm gather a burst.
  const wake = passives['spirit.risen-burst'] ?? 0;
  const risen = wake > 0 ? newRisenNear(world, player, 600) : 0;
  if (risen > 0) energy.energy = Math.min(cap, energy.energy + max * wake * risen);
  // Tide: the flow runs fast in the ebb and stops in the surge (you cannot gather while you break).
  let surging = tide && getResource(cs, TIDE_SURGE) > 0;
  if (tide) flow = surging ? 0 : flow * TIDE_EBB_FLOW_X;
  publishTide(world, player, tide, surging);
  const room = cap - energy.energy;
  energy.energy += Math.min(flow, room);
  // At full the flow is wasted; Capacitor turns it into healing (Overflow wastes nothing until its room is full).
  const wasted = flow - room;
  if (wasted > 0 && (passives['spirit.capacitor'] ?? 0) > 0) applyHealToPlayer(player, cs, wasted * (passives['spirit.capacitor'] ?? 0), world);
  const stats = inCombat ? statsOf(player) : null;
  if (stats) {
    stats.combatMs += dt;
    if (energy.energy <= 0) stats.bareMs += dt;
    if (energy.energy <= floorAbs + 1) stats.floorMs += dt;
    if (wasted > 0) stats.wasted += wasted;
  }
  flushStats(player, t, now);

  // Overflow: what is held past the brim arcs off into the nearest enemies, faster the more you hold.
  if (overflow && energy.energy > max) {
    const excess = energy.energy - max;
    const lost = Math.min(excess, excess * SPILL_RATE_PER_SEC * (dt / 1_000));
    energy.energy -= lost;
    const damage = spillDamage(player, lost);
    if (damage >= 1) {
      if (t.spec === 'spirit-lightning-rod') {
        // Lightning Rod: the spill stops arcing around; all of it strikes your target.
        const target = targetOf(world, player, t);
        if (target) applyPlayerAoeTo(world, player, [target], damage * SPILL_TARGETS, 'player', {}, {});
      } else {
        spill(world, player, damage, SPILL_RADIUS, SPILL_TARGETS);
      }
    }
    // Stormdancer: while you overflow you blink between enemies; each landing lets loose a burst of the spill.
    if (t.spec === 'spirit-stormdancer' && now >= getResource(cs, BLINK_AT) && stormdancerBlink(world, player, BLINK_REACH)) {
      setResource(cs, BLINK_AT, now + BLINK_EVERY_MS);
      const burst = Math.min(energy.energy - max, (energy.energy - max) * BLINK_BURST_SHARE);
      energy.energy -= burst;
      const burstDamage = spillDamage(player, burst);
      if (burstDamage >= 1) spill(world, player, burstDamage, SPILL_RADIUS, BLINK_BURST_TARGETS);
    }
  }

  // Gathering Dark: how long the bank has been full.
  if (t.spec === 'spirit-gathering-dark') {
    if (energy.energy >= max * 0.98) { if (getResource(cs, HELD_SINCE) <= 0) setResource(cs, HELD_SINCE, now); } else setResource(cs, HELD_SINCE, 0);
  }

  // Tide: ebb to full, then surge down to the floor.
  if (tide) {
    if (!surging && energy.energy >= cap * 0.98) {
      surging = true;
      setResource(cs, TIDE_SURGE, 1);
      setResource(cs, SURGE_SPENT, 0);
      // Cleansing Tide: every turn of the tide washes a debuff off you.
      if (t.leaves.has('spirit-cleansing-tide')) cleansePlayerAfflictions(player, 1, leafParam('spirit-cleansing-tide', 'debuffs', 1));
      // Storm Surge: the surge opens with a wave through the enemies in front of you.
      const wave = PIECES.get('spirit-storm-surge');
      if (wave && t.owned.has(wave.id)) {
        surgeWave(world, player, Math.round(player.dealsDamage.attack * (wave.params['mult'] ?? 1.2) * (passives['spirit.damage-mult'] ?? 1)), wave.params);
      }
    } else if (surging && (energy.energy <= floorAbs + 1 || !targetOf(world, player, t))) {
      surging = false;
      endSurge(world, player, t);
    }
    publishTide(world, player, tide, surging);
    // Wading: enemies that follow you through the ebb are slowed.
    if (!surging && t.leaves.has('spirit-wading') && now >= getResource(cs, WADE_AT)) {
      setResource(cs, WADE_AT, now + SAND_RING_EVERY_MS);
      sandRing(world, player, leafParam('spirit-wading', 'radius', 220), leafParam('spirit-wading', 'slowPct', 0.3));
    }
    // In the ebb you cannot spend.
    if (!surging) return;
  }

  // Spends, in band order, top first.
  if (now < getResource(cs, NEXT_SPEND_AT)) return;

  // Reservoir: the whole bank goes the moment it is enough to finish the target (release timing, no overkill).
  if (t.discipline === 'spirit-reservoir' && t.owned.has('spirit-cloudburst')) {
    const target = targetOf(world, player, t);
    const spent = releaseOf(t, energy.energy - floorAbs);
    if (target && bankKills(player, t, target, spent, now) && commit(world, player, t, PIECES.get('spirit-cloudburst')!, now, spent, spent, false)) return;
  }

  if (!tide && t.config.phase === 'gather') {
    if (energy.energy >= max * 0.98) setResource(cs, BURSTING, 1);
    if (getResource(cs, BURSTING) <= 0) return;
  }
  const bands = [...t.config.bands].sort((a, b) => b.atLeastPct - a.atLeastPct);
  const targetId = player.hasAttackTarget?.targetId;
  // Lurker's Rod: the first spend on each new target costs nothing.
  const firstFree = (passives['spirit.first-free'] ?? 0) > 0 && !!targetId && getString(cs, FIRST_FREE_ON) !== targetId;
  let affordable = false;
  for (const band of bands) {
    const piece = PIECES.get(band.pieceId);
    if (!piece || piece.atFloor || !t.owned.has(piece.id)) continue;
    const variable = piece.id === 'spirit-cloudburst';
    // Cloudburst has no fixed cost: it spends everything above the floor, and needs at least its minimum.
    const spentAll = releaseOf(t, energy.energy - floorAbs);
    const minSpend = (piece.params['minPips'] ?? 1) * STORM_PIP * tierScale(player);
    if (variable ? spentAll < minSpend : (piece.params['costPips'] ?? 0) <= 0) continue;
    const cost = variable ? spentAll : (firstFree ? 0 : costOf(player, t, piece, now));
    if (energy.energy - cost < floorAbs) continue;
    if (energy.energy < (band.atLeastPct / 100) * max) continue;
    if (piece.waitsFor && !conditionsHold(world, player, [{ id: piece.waitsFor }], now)) continue;
    // Something can fire now, so the break (or the surge) goes on. Counted only once a piece is in its band:
    // a surge (no flow) that fell between the floor and the lowest band used to wait there forever.
    affordable = true;
    if (!commit(world, player, t, piece, now, cost, variable ? spentAll : 0, firstFree)) continue;
    return;
  }
  // Gather: the break ends once nothing more can be spent above the floor.
  if (!tide && t.config.phase === 'gather' && !affordable) setResource(cs, BURSTING, 0);
  // Tide: the surge ends once nothing more can be spent above the floor.
  if (tide && !affordable) endSurge(world, player, t);
}

/** The damage a share of the storm lets loose when it arcs off (the spill, Stormdancer's landing, Spillway). */
function spillDamage(player: PlayerEntity, energy: number): number {
  return Math.round(player.dealsDamage.attack * (energy / (STORM_PIP * tierScale(player))) * SPILL_DAMAGE_PER_PIP * (player.usesSkills.passives['spirit.damage-mult'] ?? 1));
}

/**
 * The surge is over: back to the ebb. Counts the tide (Spring Tide makes every third ebb run high) and
 * Breakwater crashes a wave over everything in front of you, sized by what the surge spent.
 */
function endSurge(world: World, player: PlayerEntity, t: Thresholds): void {
  const cs = player.tracksCombat;
  countProc(player, 'surge-end');
  setResource(cs, TIDE_SURGE, 0);
  const count = getResource(cs, TIDE_COUNT) + 1;
  setResource(cs, TIDE_COUNT, count);
  if (t.leaves.has('spirit-cleansing-tide')) cleansePlayerAfflictions(player, 1, leafParam('spirit-cleansing-tide', 'debuffs', 1));
  setResource(cs, TIDE_HIGH, t.spec === 'spirit-spring-tide' && (count + 1) % SPRING_EVERY === 0 ? 1 : 0);
  if (t.spec === 'spirit-breakwater') {
    const pips = getResource(cs, SURGE_SPENT) / (STORM_PIP * tierScale(player));
    const damage = Math.round(player.dealsDamage.attack * pips * BREAKWATER_PER_PIP * (player.usesSkills.passives['spirit.damage-mult'] ?? 1));
    if (damage >= 1) surgeWave(world, player, damage, { radius: BREAKWATER_RADIUS });
  }
  setResource(cs, SURGE_SPENT, 0);
}

/** Fire a piece; when it lands, pay for it and start the gap. */
function commit(world: World, player: PlayerEntity, t: Thresholds, piece: SpiritPiece, now: number, cost: number, spent: number, firstFree: boolean): boolean {
  const cs = player.tracksCombat;
  if (!fire(world, player, t, piece, now, spent)) return false;
  const energy = player.usesEnergy!;
  const target = targetOf(world, player, t);
  // Spillway: a spend made while overflowing carries the spill to its target, wherever the bolt lands.
  if (t.spec === 'spirit-spillway' && target && energy.energy > bottleOf(player, t)) {
    const lost = (energy.energy - bottleOf(player, t)) * SPILLWAY_SHARE;
    energy.energy -= lost;
    const damage = spillDamage(player, lost);
    if (damage >= 1) applyPlayerAoeTo(world, player, [target], damage, 'player', {}, {});
  }
  // Ice Storm: every spend glazes the ground under its target.
  // Ice Storm II: the glaze slows harder.
  if (t.trophy?.id === 'spirit-relic-tundra' && target) {
    const p = t.trophy.params;
    startGlaze(player, target.hasPosition.current, t.trophyRank >= 2 ? { ...p, slowPct: (p['slowPct'] ?? 0.3) * (p['rank2SlowX'] ?? 1.5) } : p, now);
  }
  // Stray Bolts: every spend also strikes a random enemy elsewhere in the fight.
  if (t.trophy?.id === 'spirit-relic-graveyard' && piece.family !== 'calm') {
    const stray = strayTarget(world, player, t.trophy.params['reach'] ?? 700, target?.isMonster.id);
    if (stray) applyPlayerAoeTo(world, player, [stray], Math.max(1, Math.round(player.dealsDamage.attack * (t.trophy.params['pct'] ?? 0.5) * (player.usesSkills.passives['spirit.damage-mult'] ?? 1))), 'player', {}, {});
  }
  if (t.discipline === 'spirit-tide' && getResource(cs, TIDE_SURGE) > 0) setResource(cs, SURGE_SPENT, getResource(cs, SURGE_SPENT) + cost);
  const stats = statsOf(player);
  if (stats) {
    const id = piece.id.replace('spirit-', '');
    stats.spends[id] = (stats.spends[id] ?? 0) + 1;
    stats.spent += cost;
    if (thunderheadFull(t, energy)) countProc(player, 'thunderhead');
  }
  energy.energy -= cost;
  // Squall II: count the spends in a row.
  const inRow = now - getResource(cs, LAST_SPEND_AT) <= (t.trophy?.params['windowMs'] ?? 3000);
  setResource(cs, SQUALL_STREAK, inRow ? getResource(cs, SQUALL_STREAK) + 1 : 1);
  setResource(cs, NEXT_SPEND_AT, now + SPEND_GAP_MS);
  setResource(cs, LAST_SPEND_AT, now);
  const targetId = player.hasAttackTarget?.targetId;
  if (firstFree && targetId) setString(cs, FIRST_FREE_ON, targetId);
  return true;
}

/** Grounded: no knockback while the storm is at or above your floor. */
export function groundedResist(world: World, player: PlayerEntity): boolean {
  if ((player.usesSkills.passives['spirit.grounded'] ?? 0) <= 0) return false;
  const t = thresholdsOf(world, player);
  const energy = player.usesEnergy;
  return !!t && !!energy && energy.energy >= (t.config.floorPct / 100) * energy.energyMax;
}

// ── Listeners ────────────────────────────────────────────────────────────────

export function registerSpirit(): void {
  // Plain zaps are about a quarter of the damage; the spends are the rest (bible §11.2).
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster' || ctx.formation) return;
    const player = ctx.attacker as PlayerEntity;
    if (!hasThresholds(player)) return;
    let mult = ZAP_SHARE;
    const target = ctx.defender as MonsterEntity;
    // Static Web: charged enemies take plain zaps twice as hard.
    const t = thresholdsOf(world, player);
    if (t?.trophy?.id === 'spirit-relic-cave' && getResource(target.tracksCombat, WEB_UNTIL) > attackNow(ctx)) mult *= t.trophy.params['zapMult'] ?? 2;
    ctx.damage = Math.max(1, Math.round(ctx.damage * mult));
    const stats = statsOf(player);
    if (stats) stats.zaps += 1;
  });

  // Ironbound: while your storm is empty, your plating doubles.
  registerCombatListener('onDamageTaken', (ctx) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender as PlayerEntity;
    const ironbound = player.usesSkills.passives['spirit.ironbound'] ?? 0;
    if (ironbound <= 1 || !player.usesEnergy || !hasThresholds(player) || player.usesEnergy.energy > 0) return;
    const extra = player.mitigatesDamage.plating * (ironbound - 1) * (1 - player.mitigatesDamage.damageReduction);
    ctx.damage = Math.max(1, Math.round(ctx.damage - extra));
  });

  // Afterstorm: after a hit over a quarter of your HP, the storm gathers faster for a few seconds.
  // Monsoon: the same after an ambush hits you.
  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage + Number(ctx.metadata['absorbed'] ?? 0) <= 0) return;
    const player = ctx.defender as PlayerEntity;
    const passives = player.usesSkills.passives;
    if ((passives['spirit.afterstorm-x'] ?? 0) > 1 && ctx.damage >= player.hasHealth.maxHp * BIG_HIT_SHARE) {
      setResource(player.tracksCombat, AFTERSTORM_UNTIL, attackNow(ctx) + AFTERSTORM_MS);
    }
    if (ctx.damage > 0 && (passives['spirit.monsoon-x'] ?? 0) > 1 && momentActive(world, player, 'ambush', undefined, 0)) {
      setResource(player.tracksCombat, MONSOON_UNTIL, attackNow(ctx) + MONSOON_MS);
    }
    // Turn of the Tide: a hit over a quarter of your health during a surge turns the tide at once: you ebb, pull back and gather fast.
    const t = thresholdsOf(world, player);
    if (t?.leaves.has('spirit-turn-of-the-tide') && t.discipline === 'spirit-tide' && getResource(player.tracksCombat, TIDE_SURGE) > 0
      && ctx.damage + Number(ctx.metadata['absorbed'] ?? 0) >= player.hasHealth.maxHp * leafParam('spirit-turn-of-the-tide', 'hpShare', 0.25)) {
      endSurge(world, player, t);
      setResource(player.tracksCombat, TURN_UNTIL, attackNow(ctx) + leafParam('spirit-turn-of-the-tide', 'flowMs', 4_000));
      const near = aliveNear(world, player, 400).sort((a, b) => Math.hypot(a.hasPosition.current.x - player.hasPosition.current.x, a.hasPosition.current.y - player.hasPosition.current.y)
        - Math.hypot(b.hasPosition.current.x - player.hasPosition.current.x, b.hasPosition.current.y - player.hasPosition.current.y))[0];
      if (near) repositionPlayer(world, player, near.hasPosition.current, leafParam('spirit-turn-of-the-tide', 'distance', 160), false);
    }
  });
}

/**
 * The storm absorbs hits before HP, after dodges, caps and wards have had their say: registered by the
 * defense systems, not with the class mechanics.
 */
export function registerStormAbsorb(): void {
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender as PlayerEntity;
    if (!hasThresholds(player)) return;
    const result = drainStorm(world, player, ctx.damage, 'hit', ctx.attacker as MonsterEntity);
    ctx.damage = result.damage;
    if (result.absorbed > 0) ctx.metadata['absorbed'] = Number(ctx.metadata['absorbed'] ?? 0) + result.absorbed;
  });
}
