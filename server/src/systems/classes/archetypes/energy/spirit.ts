/**
 * The Spirit at runtime (class-first build plan CS-like Spirit track; bible §11.2–§11.5): the
 * storm is one bar that is both damage and shield. It fills from a constant flow (never from
 * your hits), hits and damage over time drain it before your HP, and the Thresholds' bands and
 * floor decide when a spend fires. The relic's twist, the weapon's shape and the gear lines bend
 * it; at T2 the discipline reshapes the storm itself (Overflow's brim, Tide's ebb and surge,
 * Reservoir's deep bank). Wiring only: every number is a kit `params` placeholder or a constant below.
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
  pieceTierScale,
  removeStatusEffect,
  setResource,
  setString,
  type SpiritPiece,
  type SpiritTrophy,
  type ThresholdsConfig,
} from '@mmo-idle/shared';
import { mutateSlice } from '../../../../ecs/dirtyHelpers';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { isPlayerInCombat } from '../../../combat/ai/engagement';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { registerCombatListener, attackNow } from '../../../combat/engine/combatPipeline';
import { conditionsHold, momentActive } from '../../../combat/moments/moments';
import { cleansePlayerAfflictions } from '../../../combat/status/cleanse';
import { applyStun } from '../../../combat/status/stun';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import { classConfigContextOf } from '../../../player/progression/classConfig';
import {
  MELEE_REACH, fireDustDevil, fireFlare, fireGale, fireUpdraft, sandRing, slowAttacks, spill, startHail, startOrb, surgeWave, tickLingering,
} from './spiritT2';

/** One pip of the storm at T1, in HP-like units. PLACEHOLDER. */
const STORM_PIP = 12;
/** The flow: this share of the bottle per second (full in ten seconds). PLACEHOLDER. */
const FLOW_PCT_PER_SEC = 0.1;
/** Out of combat the storm gathers this many times as fast, before Still Air. PLACEHOLDER. */
const OOC_FLOW_X = 2;
/** The gap between two spends (ms). PLACEHOLDER. */
const SPEND_GAP_MS = 700;
/** Plain zaps are about a quarter of the damage (bible §11.2). PLACEHOLDER. */
const ZAP_SHARE = 0.25;
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
  pips: number;
}

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

function tierScale(player: PlayerEntity): number {
  return pieceTierScale(player.tracksProgression.playerTier);
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
  const floorAbs = (t.config.floorPct / 100) * energy.energyMax;
  const eye = t.owned.has('spirit-eye-of-the-storm') && energy.energy <= floorAbs
    ? (PIECES.get('spirit-eye-of-the-storm')!.params['costMult'] ?? 0.5) : 1;
  const sealed = kind === 'dot' ? (passives['spirit.sealed-vessel'] ?? 0) || 1 : 1;
  // Sandshroud: ranged hits drain the storm at a share of cost.
  const ranged = !!source && (source.performsAttack?.attackRange ?? 0) > MELEE_REACH;
  const sandshroud = ranged ? (passives['spirit.ranged-cost'] ?? 0) || 1 : 1;
  const cost = eye * sealed * sandshroud;
  // Stormsense: an ambush cannot drain the storm below your floor.
  const stormsense = (passives['spirit.stormsense'] ?? 0) > 0 && momentActive(world, player, 'ambush', undefined, 0);
  const spendable = stormsense ? Math.max(0, energy.energy - floorAbs) : energy.energy;
  const absorbed = Math.min(damage, spendable / cost);
  const before = energy.energy;
  energy.energy = Math.max(0, energy.energy - absorbed * cost);
  // Static Skin: an enemy that strikes the storm is charged; the next spend on it hits harder.
  if (source && absorbed > 0 && (passives['spirit.static-skin'] ?? 0) > 0) setResource(source.tracksCombat, CHARGED, 1);
  // Marsh Fire: when hits empty the storm, it bursts around you.
  if (before > 0 && energy.energy <= 0 && t.trophy?.id === 'spirit-relic-swamp') {
    const p = t.trophy.params;
    const around = aliveNear(world, player, p['radius'] ?? 140);
    if (around.length > 0) applyPlayerAoeTo(world, player, around, player.dealsDamage.attack * (p['mult'] ?? 3), 'player', {}, {});
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
  || piece.id === 'spirit-hailstorm' || piece.id === 'spirit-ball-lightning';

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

function strikeDamage(player: PlayerEntity, t: Thresholds, piece: SpiritPiece, target: MonsterEntity, now: number, multOverride?: number): number {
  const passives = player.usesSkills.passives;
  const energy = player.usesEnergy!;
  let damage = player.dealsDamage.attack * (multOverride ?? piece.params['mult'] ?? 1) * (passives['spirit.damage-mult'] ?? 1);
  damage *= 1 + (isArea(piece) ? (passives['spirit.area-pct'] ?? 0) : (passives['spirit.single-pct'] ?? 0));
  // Thunderhead: a full storm makes the next spend twice as big.
  if (thunderheadFull(t, energy)) damage *= t.trophy!.params['mult'] ?? 2;
  // Running Storm: a spend whose target ran lands harder the farther it ran past your reach.
  if (t.trophy?.id === 'spirit-relic-jungle') {
    const d = Math.hypot(target.hasPosition.current.x - player.hasPosition.current.x, target.hasPosition.current.y - player.hasPosition.current.y);
    damage *= 1 + (t.trophy.params['perHundredPx'] ?? 0.15) * (Math.max(0, d - reachOf(player, t)) / 100);
  }
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
  // Thunderhead IV (T4): that spend also staggers. Not wired at T2.
}

function fire(world: World, player: PlayerEntity, t: Thresholds, piece: SpiritPiece, now: number, spent: number): boolean {
  const target = targetOf(world, player, t);
  const passives = player.usesSkills.passives;
  const rank = t.ranks.get(piece.id) ?? 1;
  switch (piece.id) {
    case 'spirit-thunderclap': {
      const around = aliveNear(world, player, piece.params['radius'] ?? 120);
      if (around.length === 0) return false;
      for (const monster of around) {
        applyStun(monster.tracksCombat, piece.params['staggerMs'] ?? 700, player.isPlayer.id);
        // Thunderclap II: what the clap staggers also attacks slower for a few seconds.
        if (rank >= 2) slowAttacks(world, player, monster, piece.params);
      }
      return true;
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
    case 'spirit-cloudburst': {
      if (!target) return false;
      const boosted = thunderheadFull(t, player.usesEnergy!);
      // Cloudburst: everything above the floor in one bolt, sized by what is spent.
      const perPip = piece.id === 'spirit-cloudburst' ? (piece.params['multPerPip'] ?? 2.25) * (spent / (STORM_PIP * tierScale(player))) : undefined;
      const damage = strikeDamage(player, t, piece, target, now, perPip);
      strikeOne(world, player, t, target, damage, boosted);
      if (piece.id === 'spirit-thunderbolt' && target.hasHealth.hp > 0) applyStun(target.tracksCombat, piece.params['staggerMs'] ?? 900, player.isPlayer.id);
      const at = target.hasPosition.current;
      const nearest = (count: number, pct: number): void => {
        const others = playerAoeTargets(world, player, at, piece.params['radius'] ?? 200, target.isMonster.id)
          .sort((a, b) => Math.hypot(a.hasPosition.current.x - at.x, a.hasPosition.current.y - at.y) - Math.hypot(b.hasPosition.current.x - at.x, b.hasPosition.current.y - at.y))
          .slice(0, count);
        if (others.length > 0) applyPlayerAoeTo(world, player, others, damage * pct, 'player', {}, {});
      };
      if (piece.id === 'spirit-chain-lightning') nearest((piece.params['leaps'] ?? 3) + (passives['spirit.area-extra'] ?? 0), piece.params['leapPct'] ?? 0.6);
      // Crosswind: every spend also strikes the enemies nearest its target, weaker (rank II: one more).
      if (t.trophy?.id === 'spirit-relic-plains') nearest((t.trophy.params['extra'] ?? 2) + (t.trophyRank >= 2 ? (t.trophy.params['rank2Extra'] ?? 1) : 0), t.trophy.params['pct'] ?? 0.4);
      // Static Web: enemies a spend hits stay charged; plain zaps hit them harder (rank II: longer).
      if (t.trophy?.id === 'spirit-relic-cave') setResource(target.tracksCombat, WEB_UNTIL, now + (t.trophy.params['durationMs'] ?? 4000) * (t.trophyRank >= 2 ? (t.trophy.params['rank2DurationX'] ?? 1.5) : 1));
      return true;
    }
    case 'spirit-hailstorm': {
      if (!target) return false;
      startHail(player, target.hasPosition.current, strikeDamage(player, t, piece, target, now), piece.params, now);
      return true;
    }
    case 'spirit-ball-lightning': {
      if (!target) return false;
      startOrb(player, target.hasPosition.current, strikeDamage(player, t, piece, target, now), piece.params, now);
      return true;
    }
    case 'spirit-gale': return fireGale(world, player, piece.params);
    case 'spirit-flare': return fireFlare(world, player, piece.params);
    case 'spirit-dust-devil': return fireDustDevil(world, player, piece.params, rank, now);
    case 'spirit-updraft': return fireUpdraft(world, player, piece.params, rank, now);
    default:
      return false;
  }
}

/** Whether a Reservoir release is "enough": the whole bank would finish the target. A rough estimate (plating ignored). */
function bankKills(player: PlayerEntity, target: MonsterEntity, spent: number): boolean {
  const piece = PIECES.get('spirit-cloudburst')!;
  const pips = spent / (STORM_PIP * tierScale(player));
  const estimate = player.dealsDamage.attack * (piece.params['multPerPip'] ?? 2.25) * pips * (player.usesSkills.passives['spirit.damage-mult'] ?? 1);
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
  const cap = overflow ? max * OVERFLOW_ROOM : max;
  if (energy.energyMax !== max) energy.energyMax = max;
  energy.energy = Math.min(energy.energy, cap);
  const floorAbs = (t.config.floorPct / 100) * max;

  // Things already in flight (Hailstorm's hail, Ball Lightning's orb) and the Sandstorm ring.
  tickLingering(world, player, dt, now);
  if (t.trophy?.id === 'spirit-relic-desert' && energy.energy > floorAbs && now >= getResource(cs, SAND_RING_AT)) {
    setResource(cs, SAND_RING_AT, now + SAND_RING_EVERY_MS);
    const p = t.trophy.params;
    sandRing(world, player, (p['radius'] ?? 180) * (t.trophyRank >= 2 ? (p['rank2RadiusX'] ?? 1.4) : 1), p['slowPct'] ?? 0.3);
  }

  // The flow is constant: taking damage never pauses it. Out of combat it gathers faster (Still Air).
  const inCombat = isPlayerInCombat(player, now);
  let flow = max * FLOW_PCT_PER_SEC * (dt / 1_000);
  if (!inCombat) flow *= OOC_FLOW_X * (1 + (passives['spirit.ooc-flow-pct'] ?? 0));
  if ((passives['spirit.clear-sky-pct'] ?? 0) > 0 && !conditionsHold(world, player, [{ id: 'touched' }], now)) flow *= 1 + (passives['spirit.clear-sky-pct'] ?? 0);
  if (getResource(cs, AFTERSTORM_UNTIL) > now) flow *= passives['spirit.afterstorm-x'] ?? 1;
  if (getResource(cs, MONSOON_UNTIL) > now) flow *= passives['spirit.monsoon-x'] ?? 1;
  // Oasis: while you are marked or slowed, the storm gathers faster.
  if ((passives['spirit.oasis-pct'] ?? 0) > 0 && (hasStatusEffect(cs, 'slow') || hasStatusEffect(cs, SUN_MARK_EFFECT_ID))) flow *= 1 + (passives['spirit.oasis-pct'] ?? 0);
  // Tide: the flow runs fast in the ebb and stops in the surge (you cannot gather while you break).
  let surging = tide && getResource(cs, TIDE_SURGE) > 0;
  if (tide) flow = surging ? 0 : flow * TIDE_EBB_FLOW_X;
  publishTide(world, player, tide, surging);
  const room = cap - energy.energy;
  energy.energy += Math.min(flow, room);
  // At full the flow is wasted; Capacitor turns it into healing (Overflow wastes nothing until its room is full).
  const wasted = flow - room;
  if (wasted > 0 && (passives['spirit.capacitor'] ?? 0) > 0) applyHealToPlayer(player, cs, wasted * (passives['spirit.capacitor'] ?? 0), world);

  // Overflow: what is held past the brim arcs off into the nearest enemies, faster the more you hold.
  if (overflow && energy.energy > max) {
    const excess = energy.energy - max;
    const lost = Math.min(excess, excess * SPILL_RATE_PER_SEC * (dt / 1_000));
    energy.energy -= lost;
    const damage = player.dealsDamage.attack * (lost / (STORM_PIP * tierScale(player))) * SPILL_DAMAGE_PER_PIP * (passives['spirit.damage-mult'] ?? 1);
    if (damage >= 1) spill(world, player, Math.round(damage), SPILL_RADIUS, SPILL_TARGETS);
  }

  // Tide: ebb to full, then surge down to the floor.
  if (tide) {
    if (!surging && energy.energy >= max * 0.98) {
      surging = true;
      setResource(cs, TIDE_SURGE, 1);
      // Storm Surge: the surge opens with a wave through the enemies in front of you.
      const wave = PIECES.get('spirit-storm-surge');
      if (wave && t.owned.has(wave.id)) {
        surgeWave(world, player, Math.round(player.dealsDamage.attack * (wave.params['mult'] ?? 1.2) * (passives['spirit.damage-mult'] ?? 1)), wave.params);
      }
    } else if (surging && (energy.energy <= floorAbs + 1 || !targetOf(world, player, t))) {
      surging = false;
      setResource(cs, TIDE_SURGE, 0);
    }
    publishTide(world, player, tide, surging);
    // In the ebb you cannot spend.
    if (!surging) return;
  }

  // Spends, in band order, top first.
  if (now < getResource(cs, NEXT_SPEND_AT)) return;

  // Reservoir: the whole bank goes the moment it is enough to finish the target (release timing, no overkill).
  if (t.discipline === 'spirit-reservoir' && t.owned.has('spirit-cloudburst')) {
    const target = targetOf(world, player, t);
    const spent = energy.energy - floorAbs;
    if (target && bankKills(player, target, spent) && commit(world, player, t, PIECES.get('spirit-cloudburst')!, now, spent, spent, false)) return;
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
    const spentAll = energy.energy - floorAbs;
    const minSpend = (piece.params['minPips'] ?? 1) * STORM_PIP * tierScale(player);
    if (variable ? spentAll < minSpend : (piece.params['costPips'] ?? 0) <= 0) continue;
    const cost = variable ? spentAll : (firstFree ? 0 : costOf(player, t, piece, now));
    if (energy.energy - cost < floorAbs) continue;
    affordable = true;
    if (energy.energy < (band.atLeastPct / 100) * max) continue;
    if (piece.waitsFor && !conditionsHold(world, player, [{ id: piece.waitsFor }], now)) continue;
    if (!commit(world, player, t, piece, now, cost, variable ? spentAll : 0, firstFree)) continue;
    return;
  }
  // Gather: the break ends once nothing more can be spent above the floor.
  if (!tide && t.config.phase === 'gather' && !affordable) setResource(cs, BURSTING, 0);
  // Tide: the surge ends once nothing more can be spent above the floor.
  if (tide && !affordable) setResource(cs, TIDE_SURGE, 0);
}

/** Fire a piece; when it lands, pay for it and start the gap. */
function commit(world: World, player: PlayerEntity, t: Thresholds, piece: SpiritPiece, now: number, cost: number, spent: number, firstFree: boolean): boolean {
  const cs = player.tracksCombat;
  if (!fire(world, player, t, piece, now, spent)) return false;
  player.usesEnergy!.energy -= cost;
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
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender as PlayerEntity;
    const passives = player.usesSkills.passives;
    if ((passives['spirit.afterstorm-x'] ?? 0) > 1 && ctx.damage >= player.hasHealth.maxHp * BIG_HIT_SHARE) {
      setResource(player.tracksCombat, AFTERSTORM_UNTIL, attackNow(ctx) + AFTERSTORM_MS);
    }
    if ((passives['spirit.monsoon-x'] ?? 0) > 1 && momentActive(world, player, 'ambush', undefined, 0)) {
      setResource(player.tracksCombat, MONSOON_UNTIL, attackNow(ctx) + MONSOON_MS);
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
