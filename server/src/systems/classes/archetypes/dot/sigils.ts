/**
 * The Apprentice at runtime (bible §9.2–§9.4): the hits lay **sigils** on the enemy, which tick as
 * damage over time under the usual rules; **payoffs** spend them at moments the Payoff rules
 * name. A sigil is one stack of the existing class DoT status (`DOT_EFFECT_ID`) flagged
 * `data.sigil = 1`, so the ticker, the target frame and the moments' "full bar" read it as they
 * always did, but its ticks are linear and its damage comes from the weapon, never from the hit.
 * Wiring only: every number is a kit `params` placeholder or a constant below.
 *
 * The old DoT machinery (conversion, the stack curve, the frame loop, the T3 paths) is inert for a
 * character with Payoff rules; it goes in the Apprentice's cleanup task.
 */
import {
  APPRENTICE_KIT,
  getResource,
  getStatusEffect,
  pieceTierScale,
  removeStatusEffect,
  setResource,
  applyStatusEffect,
  type ApprenticePiece,
  type ApprenticeTrophy,
  type PayoffsConfig,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { attachMarker } from '../../../../ecs/markerHelpers';
import type { World } from '../../../../world/World';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { abortMonsterCast } from '../../../combat/engine/combat';
import { attackNow, registerCombatListener } from '../../../combat/engine/combatPipeline';
import { conditionsHold, momentActive } from '../../../combat/moments/moments';
import { applyMonsterSlow } from '../../../combat/status/monsterControl';
import { applyStun } from '../../../combat/status/stun';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import { activateRecoveryBoost } from '../../../defense/regen/recovery';
import { classConfigContextOf } from '../../../player/progression/classConfig';
import { DOT_EFFECT_ID } from './t3/core/constants';

/** A sigil's tick damage, as a share of the weapon's attack (potency), per tick. PLACEHOLDER. */
const SIGIL_TICK_PCT = 0.12;
/** The base tick and lifetime of a sigil (ms). PLACEHOLDERS. */
const SIGIL_TICK_MS = 1_000;
const SIGIL_LIFE_MS = 6_000;
/** Seize also holds with this extra cap on how long (ms), so a big bar never locks a boss for long. */
const HOLD_MAX_MS = 2_500;

/** The Recovery-share factor the lines write each tick; `recovery.ts` reads it. */
export const APPRENTICE_RECOVERY_X = 'apprentice.recoveryX';
/** Give Ground's move factor, written each tick; `movement.ts` reads it. */
export const APPRENTICE_MOVE_X = 'apprentice.moveX';
const SPREAD_AT = 'apprentice.spreadAt';
const BROOD_AT = 'apprentice.broodAt';
const NUMBED_UNTIL = 'apprentice.numbedUntil';
const SEIZED_UNTIL = 'apprentice.seizedUntil';
const cdKey = (id: string): string => `apprentice.cd.${id}`;

const PIECES = new Map<string, ApprenticePiece>(APPRENTICE_KIT.pieces.map((piece) => [piece.id, piece]));
const TROPHIES = new Map<string, ApprenticeTrophy>(APPRENTICE_KIT.trophies.map((trophy) => [trophy.id, trophy]));

interface Payoffs {
  config: PayoffsConfig;
  owned: ReadonlySet<string>;
  trophy: ApprenticeTrophy | undefined;
  cap: number;
}

const cache = new WeakMap<PlayerEntity, { tick: number; value: Payoffs | null }>();

/** The Apprentice's Payoff rules, or null for a character without them (the old DoT path then applies). */
export function payoffsOf(world: World, player: PlayerEntity): Payoffs | null {
  const hit = cache.get(player);
  if (hit && hit.tick === world.tickCounter) return hit.value;
  const config = player.configuresClass?.config;
  let value: Payoffs | null = null;
  if (player.appliesDots && config?.system.kind === 'payoffs') {
    const ctx = classConfigContextOf(player);
    if (ctx) {
      value = {
        config: config.system,
        owned: new Set(ctx.pieceRanks.keys()),
        trophy: config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined,
        cap: ctx.budget + Math.round(player.usesSkills.passives['apprentice.cap-extra'] ?? 0),
      };
    }
  }
  cache.set(player, { tick: world.tickCounter, value });
  return value;
}

export function hasPayoffs(player: PlayerEntity): boolean {
  return !!player.appliesDots && player.configuresClass?.config.system.kind === 'payoffs';
}

// ── Sigils ───────────────────────────────────────────────────────────────────

/** Damage one sigil deals per tick: the weapon's potency and the tier, never the hit. */
function sigilDamage(player: PlayerEntity): number {
  const mult = player.usesSkills.passives['apprentice.tick-mult'] ?? 1;
  return Math.max(1, Math.round(player.dealsDamage.attack * SIGIL_TICK_PCT * mult * pieceTierScale(1)));
}

/** Lay `count` sigils on `target` (at most the cap, unless `past`). */
export function laySigils(world: World, player: PlayerEntity, target: MonsterEntity, count: number, cap: number, past = false): void {
  if (count <= 0 || target.hasHealth.hp <= 0) return;
  const passives = player.usesSkills.passives;
  const speed = Math.max(0.1, passives['apprentice.tick-speed'] ?? 1);
  const tickMs = Math.round(SIGIL_TICK_MS / speed);
  const lifeMs = Math.round((SIGIL_LIFE_MS * (passives['apprentice.linger'] ?? 1)) / speed);
  const effect = applyStatusEffect(target.tracksCombat, {
    id: DOT_EFFECT_ID,
    maxStacks: Math.max(cap, past ? 99 : cap),
    instanced: false,
    sourceId: player.isPlayer.id,
    remainingMs: lifeMs,
    refreshable: true,
    data: { damagePerStack: sigilDamage(player), nextTickIn: tickMs, tickIntervalMs: tickMs, tickOnExpire: 1, sigil: 1 },
  });
  // Re-applying adds one stack at a time; add the rest, honouring the cap.
  for (let i = 1; i < count; i++) {
    if (!past && effect.stacks >= cap) break;
    effect.stacks += 1;
  }
  if (!past && effect.stacks > cap) effect.stacks = cap;
  effect.data['damagePerStack'] = sigilDamage(player);
  effect.data['tickIntervalMs'] = tickMs;
  effect.remainingMs = lifeMs;
  effect.data['sigil'] = 1;
  attachMarker(world, target, 'hasDot');
}

function sigilsOn(player: PlayerEntity, monster: MonsterEntity): number {
  const effect = getStatusEffect(monster.tracksCombat, DOT_EFFECT_ID);
  return effect && effect.sourceId === player.isPlayer.id && effect.data['sigil'] === 1 ? effect.stacks : 0;
}

function spend(monster: MonsterEntity): number {
  const effect = getStatusEffect(monster.tracksCombat, DOT_EFFECT_ID);
  if (!effect) return 0;
  const stacks = effect.stacks;
  removeStatusEffect(monster.tracksCombat, DOT_EFFECT_ID);
  return stacks;
}

const nearestTo = (monsters: MonsterEntity[], at: { x: number; y: number }): MonsterEntity[] =>
  [...monsters].sort((a, b) => Math.hypot(a.hasPosition.current.x - at.x, a.hasPosition.current.y - at.y) - Math.hypot(b.hasPosition.current.x - at.x, b.hasPosition.current.y - at.y));

// ── Payoffs ──────────────────────────────────────────────────────────────────

function payoffMult(player: PlayerEntity): number {
  return 1 + (player.usesSkills.passives['apprentice.payoff-pct'] ?? 0);
}

/** Fire one payoff on `target`; false when it had nothing to do (no cooldown is spent). */
function firePayoff(world: World, player: PlayerEntity, p: Payoffs, piece: ApprenticePiece, target: MonsterEntity, now: number): boolean {
  const params = piece.params;
  const sigils = sigilsOn(player, target);
  const passives = player.usesSkills.passives;
  const cs = player.tracksCombat;
  switch (piece.id) {
    case 'apprentice-detonate': {
      if (sigils <= 0) return false;
      const effect = getStatusEffect(target.tracksCombat, DOT_EFFECT_ID)!;
      const ticksLeft = Math.max(1, Math.ceil(effect.remainingMs / Math.max(1, effect.data['tickIntervalMs'] ?? SIGIL_TICK_MS)));
      const damage = effect.stacks * effect.data['damagePerStack']! * ticksLeft * (params['payoffPct'] ?? 0.8) * payoffMult(player);
      spend(target);
      applyPlayerAoeTo(world, player, [target], Math.max(1, damage), 'player', {}, {});
      return true;
    }
    case 'apprentice-spread':
      return false; // continuous: handled in `updateApprentice`
    case 'apprentice-numb': {
      const n = spend(target);
      if (n <= 0) return false;
      const slow = Math.min(0.8, (params['slowBase'] ?? 0.2) + n * (params['slowPerSigil'] ?? 0.05));
      const ms = (params['msBase'] ?? 2000) + n * (params['msPerSigil'] ?? 400);
      applyMonsterSlow(world, target, slow, ms, player.isPlayer.id);
      setResource(target.tracksCombat, NUMBED_UNTIL, now + ms);
      return true;
    }
    case 'apprentice-siphon': {
      const n = spend(target);
      if (n <= 0) return false;
      const heal = (n * (params['healPerSigil'] ?? 0.02) * player.hasHealth.maxHp) * (1 + (passives['apprentice.siphon-pct'] ?? 0)) * payoffMult(player);
      applyHealToPlayer(player, cs, heal, world);
      // Glut: the Siphon also drains every enemy near the target.
      if (p.trophy?.id === 'apprentice-relic-swamp') {
        for (const other of playerAoeTargets(world, player, target.hasPosition.current, p.trophy.params['radius'] ?? 160, target.isMonster.id)) {
          const m = spend(other);
          if (m > 0) applyHealToPlayer(player, cs, m * (params['healPerSigil'] ?? 0.02) * player.hasHealth.maxHp * (1 + (passives['apprentice.siphon-pct'] ?? 0)), world);
        }
      }
      return true;
    }
    case 'apprentice-seize': {
      const n = spend(target);
      if (n <= 0) return false;
      let hold = Math.min(HOLD_MAX_MS, (params['holdBase'] ?? 500) + n * (params['holdPerSigil'] ?? 150));
      // Petrify: the Seize holds longer, and the held enemy takes more damage.
      if (p.trophy?.id === 'apprentice-relic-mountain') hold *= p.trophy.params['holdMult'] ?? 1.6;
      applyStun(target.tracksCombat, Math.round(hold), player.isPlayer.id);
      const wasCasting = momentActive(world, player, 'enemy-winds-up', undefined, now);
      abortMonsterCast(world, target);
      setResource(target.tracksCombat, SEIZED_UNTIL, now + hold);
      // Still Mind: after a Seize breaks a wind-up, Recovery triples for a few seconds.
      if (wasCasting) activateRecoveryBoost(cs, passives['apprentice.still-mind'] ?? 0);
      return true;
    }
    case 'apprentice-converge': {
      const around = playerAoeTargets(world, player, target.hasPosition.current, params['radius'] ?? 180, target.isMonster.id);
      let pulled = 0;
      for (const other of around) pulled += spend(other);
      if (pulled <= 0) return false;
      laySigils(world, player, target, pulled, p.cap, true);
      return true;
    }
    default:
      return false;
  }
}

function targetOf(world: World, player: PlayerEntity): MonsterEntity | undefined {
  const id = player.hasAttackTarget?.targetId;
  const monster = id ? world.getMonsterEntity(id) : undefined;
  return monster && monster.hasHealth.hp > 0 ? monster : undefined;
}

/** Per-tick Apprentice: the payoff rules, Spread, Brood Sigils and the lines' factors. */
export function updateApprentice(world: World, player: PlayerEntity, dt: number, now: number): void {
  const p = payoffsOf(world, player);
  if (!p) return;
  const cs = player.tracksCombat;
  const passives = player.usesSkills.passives;
  const target = targetOf(world, player);

  // Payoff rules: at a moment, the first placement whose conditions hold fires.
  if (target) {
    const done = new Set<string>();
    for (const placement of p.config.placements) {
      if (done.has(placement.moment) || !p.owned.has(placement.pieceId)) continue;
      const piece = PIECES.get(placement.pieceId);
      if (!piece) continue;
      if (now < getResource(cs, cdKey(piece.id))) continue;
      if (!momentActive(world, player, placement.moment, undefined, now)) continue;
      if (!conditionsHold(world, player, placement.conditions, now)) continue;
      // Spread acts continuously (below), but while its rule holds it is the one that answers the moment.
      if (piece.id === 'apprentice-spread') { done.add(placement.moment); continue; }
      if (!firePayoff(world, player, p, piece, target, now)) continue;
      done.add(placement.moment);
      let cd = piece.params['cooldownMs'] ?? 0;
      if (piece.id === 'apprentice-siphon') cd *= 1 - (passives['apprentice.siphon-cd-pct'] ?? 0);
      setResource(cs, cdKey(piece.id), now + cd);
    }
  }

  // Spread: a full target keeps passing a sigil to its nearest neighbour (Outbreak: two).
  const spread = p.config.placements.find((placement) => placement.pieceId === 'apprentice-spread');
  if (target && spread && p.owned.has('apprentice-spread') && now >= getResource(cs, SPREAD_AT)
    && momentActive(world, player, spread.moment, undefined, now) && conditionsHold(world, player, spread.conditions, now)) {
    const neighbours = p.trophy?.id === 'apprentice-relic-plains' ? p.trophy.params['neighbours'] ?? 2 : PIECES.get('apprentice-spread')!.params['neighbours'] ?? 1;
    const others = nearestTo(playerAoeTargets(world, player, target.hasPosition.current, 200, target.isMonster.id), target.hasPosition.current)
      .filter((monster) => sigilsOn(player, monster) < p.cap)
      .slice(0, neighbours);
    if (others.length > 0) {
      for (const other of others) laySigils(world, player, other, 1, p.cap);
      setResource(cs, SPREAD_AT, now + (PIECES.get('apprentice-spread')!.params['everyMs'] ?? 1000));
    }
  }

  // Brood Sigils: an enemy carrying three or more grows another every few seconds.
  if (p.trophy?.id === 'apprentice-relic-cave' && now >= getResource(cs, BROOD_AT)) {
    setResource(cs, BROOD_AT, now + (p.trophy.params['everyMs'] ?? 2000));
    for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
      if (monster.hasHealth.hp > 0 && sigilsOn(player, monster) >= (p.trophy.params['minSigils'] ?? 3)) laySigils(world, player, monster, 1, p.cap);
    }
  }

  // The lines' factors: Feeding Swarm, Numbing Calm, Long Draw (Recovery), Give Ground (speed).
  let recovery = 1;
  let carrying = 0;
  let numbed = 0;
  let fullElite = false;
  let touching = false;
  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (monster.hasHealth.hp <= 0) continue;
    const n = sigilsOn(player, monster);
    const near = Math.hypot(monster.hasPosition.current.x - player.hasPosition.current.x, monster.hasPosition.current.y - player.hasPosition.current.y) <= 260;
    if (n > 0 && near) carrying++;
    if (n > 0 && Math.hypot(monster.hasPosition.current.x - player.hasPosition.current.x, monster.hasPosition.current.y - player.hasPosition.current.y) <= 70) touching = true;
    if (near && getResource(monster.tracksCombat, NUMBED_UNTIL) > now) numbed++;
    if (n >= p.cap && (monster.isMonster.isBoss === true)) fullElite = true;
  }
  const feeding = passives['apprentice.feeding'] ?? 0;
  if (feeding > 0) recovery *= 1 + Math.min(carrying, 5) * feeding;
  if ((passives['apprentice.numbing-calm'] ?? 0) > 1 && numbed >= 2) recovery *= passives['apprentice.numbing-calm']!;
  if ((passives['apprentice.long-draw'] ?? 0) > 1 && fullElite) recovery *= passives['apprentice.long-draw']!;
  if (getResource(cs, APPRENTICE_RECOVERY_X) !== recovery) setResource(cs, APPRENTICE_RECOVERY_X, recovery);
  const move = touching && (passives['apprentice.give-ground'] ?? 0) > 0 ? 1 + passives['apprentice.give-ground']! : 1;
  if (getResource(cs, APPRENTICE_MOVE_X) !== move) setResource(cs, APPRENTICE_MOVE_X, move);
  void dt;
}

// ── Listeners ────────────────────────────────────────────────────────────────

export function registerApprentice(): void {
  // Hits lay sigils; the hit itself keeps its full damage (no conversion).
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster' || ctx.formation) return;
    const player = ctx.attacker as PlayerEntity;
    const p = payoffsOf(world, player);
    if (!p || ctx.metadata['evaded'] === true) return;
    if (ctx.metadata['evadeFull'] === true) return;
    const target = ctx.defender as MonsterEntity;
    const passives = player.usesSkills.passives;
    let count = Math.max(1, Math.round(passives['apprentice.sigils-per-hit'] ?? 1));
    // Firstbrand: the first hit on an enemy carrying none of your sigils lays three at once.
    if (p.trophy?.id === 'apprentice-relic-forest' && sigilsOn(player, target) === 0) count = Math.max(count, p.trophy.params['sigils'] ?? 3);
    laySigils(world, player, target, count, p.cap);
    // Branching Wand: each hit also lays a sigil on the nearest other enemy.
    if ((passives['apprentice.branching'] ?? 0) > 0) {
      const other = nearestTo(playerAoeTargets(world, player, target.hasPosition.current, 220, target.isMonster.id), target.hasPosition.current)[0];
      if (other) laySigils(world, player, other, 1, p.cap);
    }
  });

  // Warding Sigils and Sigil Weight: the enemies carrying your sigils hurt you less.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender as PlayerEntity;
    if (!hasPayoffs(player)) return;
    const passives = player.usesSkills.passives;
    const warding = passives['apprentice.warding'] ?? 0;
    if (warding > 0) {
      let carrying = 0;
      for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) if (monster.hasHealth.hp > 0 && sigilsOn(player, monster) > 0) carrying++;
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - Math.min(0.3, carrying * warding))));
    }
    const weight = passives['apprentice.sigil-weight'] ?? 0;
    if (weight > 0 && (ctx.metadata['empoweredAttack'] === true || typeof ctx.metadata['abilityName'] === 'string')) {
      const n = sigilsOn(player, ctx.attacker as MonsterEntity);
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - Math.min(1 / 3, n * weight))));
    }
  });
  void attackNow;
}
