/**
 * The Spirit at runtime (class-first build plan CS-like Spirit track; bible §11.2–§11.4): the
 * storm is one bar that is both damage and shield. It fills from a constant flow (never from
 * your hits), hits and damage over time drain it before your HP, and the Thresholds' bands and
 * floor decide when a spend fires. The relic's twist, the weapon's shape and the gear lines bend
 * it. Wiring only: every number is a kit `params` placeholder or a constant below.
 *
 * `usesEnergy.energy` is the storm in HP-like units and `energyMax` its size: `pips` (the class
 * budget) times `STORM_PIP` times the tier scale. Gear never grows the pool (bible §11.2).
 */
import {
  SPIRIT_KIT,
  getResource,
  pieceTierScale,
  removeStatusEffect,
  setResource,
  type SpiritPiece,
  type SpiritTrophy,
  type ThresholdsConfig,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { isPlayerInCombat } from '../../../combat/ai/engagement';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { registerCombatListener, attackNow } from '../../../combat/engine/combatPipeline';
import { conditionsHold } from '../../../combat/moments/moments';
import { applyStun } from '../../../combat/status/stun';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import { classConfigContextOf } from '../../../player/progression/classConfig';

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
/** A spend must have a target this close (px). */
const SPEND_REACH = 260;

const NEXT_SPEND_AT = 'spirit.nextSpendAt';
const BURSTING = 'spirit.bursting';
const LAST_SPEND_AT = 'spirit.lastSpendAt';
const AFTERSTORM_UNTIL = 'spirit.afterstormUntil';
const CHARGED = 'spirit.charged';
const WEB_UNTIL = 'spirit.webUntil';
const SOAK_UNTIL = 'spirit.soakUntil';

const PIECES = new Map<string, SpiritPiece>(SPIRIT_KIT.pieces.map((piece) => [piece.id, piece]));
const TROPHIES = new Map<string, SpiritTrophy>(SPIRIT_KIT.trophies.map((trophy) => [trophy.id, trophy]));

interface Thresholds {
  config: ThresholdsConfig;
  owned: ReadonlySet<string>;
  trophy: SpiritTrophy | undefined;
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
    if (ctx) value = { config: config.system, owned: new Set(ctx.pieceRanks.keys()), trophy: config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined, pips: ctx.budget };
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

const aliveNear = (world: World, player: PlayerEntity, radius: number, exclude?: string): MonsterEntity[] =>
  playerAoeTargets(world, player, player.hasPosition.current, radius, exclude);

// ── The storm absorbs ────────────────────────────────────────────────────────

/**
 * Hits and damage over time drain the storm before HP. Eye of the Storm halves the cost while the
 * storm is at or below the floor; Sealed Vessel halves it for damage over time. Returns what is left.
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
  const eye = t.owned.has('spirit-eye-of-the-storm') && energy.energy <= (t.config.floorPct / 100) * energy.energyMax
    ? (PIECES.get('spirit-eye-of-the-storm')!.params['costMult'] ?? 0.5) : 1;
  const sealed = kind === 'dot' ? (player.usesSkills.passives['spirit.sealed-vessel'] ?? 0) || 1 : 1;
  const cost = eye * sealed;
  const absorbed = Math.min(damage, energy.energy / cost);
  const before = energy.energy;
  energy.energy = Math.max(0, energy.energy - absorbed * cost);
  // Static Skin: an enemy that strikes the storm is charged; the next spend on it hits harder.
  if (source && absorbed > 0 && (player.usesSkills.passives['spirit.static-skin'] ?? 0) > 0) setResource(source.tracksCombat, CHARGED, 1);
  // Marsh Fire: when hits empty the storm, it bursts around you.
  if (before > 0 && energy.energy <= 0 && t.trophy?.id === 'spirit-relic-swamp') {
    const p = t.trophy.params;
    const around = aliveNear(world, player, p['radius'] ?? 140);
    if (around.length > 0) applyPlayerAoeTo(world, player, around, player.dealsDamage.attack * (p['mult'] ?? 3), 'player', {}, {});
  }
  return { damage: damage - absorbed, absorbed };
}

// ── Spends ───────────────────────────────────────────────────────────────────

function costOf(player: PlayerEntity, t: Thresholds, piece: SpiritPiece, now: number): number {
  const base = (piece.params['costPips'] ?? 0) * STORM_PIP * tierScale(player);
  let mult = player.usesSkills.passives['spirit.cost-mult'] ?? 1;
  // Squall: a spend soon after the last costs a little less.
  if (t.trophy?.id === 'spirit-relic-forest' && now - getResource(player.tracksCombat, LAST_SPEND_AT) <= (t.trophy.params['windowMs'] ?? 3000)) mult *= 1 - (t.trophy.params['discount'] ?? 0.2);
  return base * mult;
}

const isArea = (piece: SpiritPiece): boolean => piece.id === 'spirit-chain-lightning' || piece.id === 'spirit-thunderclap';

function targetOf(world: World, player: PlayerEntity): MonsterEntity | undefined {
  const id = player.hasAttackTarget?.targetId;
  const monster = id ? world.getMonsterEntity(id) : undefined;
  if (!monster || monster.hasHealth.hp <= 0) return undefined;
  const d = Math.hypot(monster.hasPosition.current.x - player.hasPosition.current.x, monster.hasPosition.current.y - player.hasPosition.current.y);
  return d <= SPEND_REACH ? monster : undefined;
}

function strikeDamage(player: PlayerEntity, t: Thresholds, piece: SpiritPiece, target: MonsterEntity, now: number): number {
  const passives = player.usesSkills.passives;
  const energy = player.usesEnergy!;
  let damage = player.dealsDamage.attack * (piece.params['mult'] ?? 1) * (passives['spirit.damage-mult'] ?? 1);
  damage *= 1 + (isArea(piece) ? (passives['spirit.area-pct'] ?? 0) : (passives['spirit.single-pct'] ?? 0));
  // Thunderhead: a full storm makes the next spend twice as big.
  if (t.trophy?.id === 'spirit-relic-mountain' && energy.energy >= energy.energyMax * 0.98) damage *= t.trophy.params['mult'] ?? 2;
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

function fire(world: World, player: PlayerEntity, t: Thresholds, piece: SpiritPiece, now: number): boolean {
  const target = targetOf(world, player);
  const passives = player.usesSkills.passives;
  switch (piece.id) {
    case 'spirit-thunderclap': {
      const around = aliveNear(world, player, piece.params['radius'] ?? 120);
      if (around.length === 0) return false;
      for (const monster of around) applyStun(monster.tracksCombat, piece.params['staggerMs'] ?? 700, player.isPlayer.id);
      return true;
    }
    case 'spirit-downpour': {
      let washed = 0;
      for (const effect of [...player.tracksCombat.statusEffects]) {
        if ((effect.data['isDot'] ?? 0) !== 1) continue;
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
    case 'spirit-chain-lightning': {
      if (!target) return false;
      const damage = strikeDamage(player, t, piece, target, now);
      applyPlayerAoeTo(world, player, [target], damage, 'player', {}, {});
      if (piece.id === 'spirit-thunderbolt' && target.hasHealth.hp > 0) applyStun(target.tracksCombat, piece.params['staggerMs'] ?? 900, player.isPlayer.id);
      const at = target.hasPosition.current;
      const nearest = (count: number, pct: number): void => {
        const others = playerAoeTargets(world, player, at, piece.params['radius'] ?? 200, target.isMonster.id)
          .sort((a, b) => Math.hypot(a.hasPosition.current.x - at.x, a.hasPosition.current.y - at.y) - Math.hypot(b.hasPosition.current.x - at.x, b.hasPosition.current.y - at.y))
          .slice(0, count);
        if (others.length > 0) applyPlayerAoeTo(world, player, others, damage * pct, 'player', {}, {});
      };
      if (piece.id === 'spirit-chain-lightning') nearest((piece.params['leaps'] ?? 3) + (passives['spirit.area-extra'] ?? 0), piece.params['leapPct'] ?? 0.6);
      // Crosswind: every spend also strikes the enemies nearest its target, weaker.
      if (t.trophy?.id === 'spirit-relic-plains') nearest(t.trophy.params['extra'] ?? 2, t.trophy.params['pct'] ?? 0.4);
      // Static Web: enemies a spend hits stay charged; plain zaps hit them harder.
      if (t.trophy?.id === 'spirit-relic-cave') setResource(target.tracksCombat, WEB_UNTIL, now + (t.trophy.params['durationMs'] ?? 4000));
      return true;
    }
    default:
      return false;
  }
}

/** Per-tick storm: size, flow, and the spends the bands allow. */
export function updateSpirit(world: World, player: PlayerEntity, dt: number, now: number): void {
  const t = thresholdsOf(world, player);
  const energy = player.usesEnergy;
  if (!t || !energy) return;
  const cs = player.tracksCombat;
  const passives = player.usesSkills.passives;
  const max = stormMaxFor(player, t.pips);
  if (energy.energyMax !== max) {
    energy.energyMax = max;
    energy.energy = Math.min(energy.energy, max);
  }

  // The flow is constant: taking damage never pauses it. Out of combat it gathers faster (Still Air).
  const inCombat = isPlayerInCombat(player, now);
  let flow = max * FLOW_PCT_PER_SEC * (dt / 1_000);
  if (!inCombat) flow *= OOC_FLOW_X * (1 + (passives['spirit.ooc-flow-pct'] ?? 0));
  if ((passives['spirit.clear-sky-pct'] ?? 0) > 0 && !conditionsHold(world, player, [{ id: 'touched' }], now)) flow *= 1 + (passives['spirit.clear-sky-pct'] ?? 0);
  if (getResource(cs, AFTERSTORM_UNTIL) > now) flow *= passives['spirit.afterstorm-x'] ?? 1;
  const room = max - energy.energy;
  energy.energy += Math.min(flow, room);
  // At full the flow is wasted; Capacitor turns it into healing.
  const wasted = flow - room;
  if (wasted > 0 && (passives['spirit.capacitor'] ?? 0) > 0) applyHealToPlayer(player, cs, wasted * (passives['spirit.capacitor'] ?? 0), world);

  // Spends, in band order, top first.
  if (now < getResource(cs, NEXT_SPEND_AT)) return;
  const floorAbs = (t.config.floorPct / 100) * max;
  if (t.config.phase === 'gather') {
    if (energy.energy >= max * 0.98) setResource(cs, BURSTING, 1);
    if (getResource(cs, BURSTING) <= 0) return;
  }
  const bands = [...t.config.bands].sort((a, b) => b.atLeastPct - a.atLeastPct);
  let affordable = false;
  for (const band of bands) {
    const piece = PIECES.get(band.pieceId);
    if (!piece || piece.atFloor || !t.owned.has(piece.id) || (piece.params['costPips'] ?? 0) <= 0) continue;
    const cost = costOf(player, t, piece, now);
    if (energy.energy - cost < floorAbs) continue;
    affordable = true;
    if (energy.energy < (band.atLeastPct / 100) * max) continue;
    if (piece.waitsFor && !conditionsHold(world, player, [{ id: piece.waitsFor }], now)) continue;
    if (!fire(world, player, t, piece, now)) continue;
    energy.energy -= cost;
    setResource(cs, NEXT_SPEND_AT, now + SPEND_GAP_MS);
    setResource(cs, LAST_SPEND_AT, now);
    return;
  }
  // Gather: the break ends once nothing more can be spent above the floor.
  if (t.config.phase === 'gather' && !affordable) setResource(cs, BURSTING, 0);
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
  registerCombatListener('afterHit', (ctx) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender as PlayerEntity;
    if ((player.usesSkills.passives['spirit.afterstorm-x'] ?? 0) <= 1) return;
    if (ctx.damage >= player.hasHealth.maxHp * BIG_HIT_SHARE) setResource(player.tracksCombat, AFTERSTORM_UNTIL, attackNow(ctx) + AFTERSTORM_MS);
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
