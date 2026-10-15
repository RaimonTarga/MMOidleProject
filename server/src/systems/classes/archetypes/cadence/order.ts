/**
 * The Striker's Order at runtime (class-first build plan CS.1–CS.2; bible §12.2–§12.4).
 *
 * The cadence counter is the beat counter: `usesCadence.count` is the index of the next
 * beat, the combo is the Order's beats plus the finisher, and the finisher is cadence's
 * empowered hit. This module decides what each beat does:
 *
 *  - a plain beat swings;
 *  - a technique beat swings for less (the price, unless mastered) and runs its technique;
 *  - a cast beat (the opener, the wind-up) doesn't swing: it winds up on the player cast
 *    machine, and the beat counts when the cast resolves (a stun breaks it, nothing counts);
 *  - the finisher is the relic's trophy: a weight trophy acts on it, a spark trophy arms the
 *    next combo; with no trophy it is the plain finisher.
 *
 * Every number lives in the kit's `params` (placeholders for the designer). The T1 ones are
 * shares of the beat's own swing, so they already grow with the character; `pieceTierScale`
 * applies when a piece gains a flat number.
 */
import {
  ABILITY_SLOW_EFFECT_ID,
  DAMAGE_TAKEN_PCT_KEY,
  applyStatusEffect,
  getStatusEffect,
  pieceParamsAt,
  removeStatusEffect,
  STRIKER_KIT,
  STRIKER_TECHNIQUE_SWING,
  strikerMasteredBeats,
  strikerSlots,
  trophyParamsAt,
  type ClassConfigContext,
  type OrderConfig,
  type StrikerPiece,
  type StrikerTrophy,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { attachMarker } from '../../../../ecs/markerHelpers';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import type { World } from '../../../../world/World';
import { applyPlayerAoe, applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { CADENCE_BLEED_ID, STRIKER_ROT_ID } from '../../../combat/damage/bleedIds';
import { attackNow, registerCombatListener, type CombatContext } from '../../../combat/engine/combatPipeline';
import { HOLD_EMPOWERED_ATTACK, isEmpoweredAttack, setEmpoweredAttack } from '../../../combat/engine/empoweredAttacks';
import { runPlayerAttack } from '../../../combat/engine/combat';
import { conditionsHold } from '../../../combat/moments/moments';
import { applyMonsterRoot, applyMonsterSlow, monsterIsHeld } from '../../../combat/status/monsterControl';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { applyStun } from '../../../combat/status/stun';
import { isHardControlled } from '../../../combat/status/playerHardControl';
import { isConcealedEntity } from '../../../combat/invulnerability';
import { repositionPlayer } from '../../../combat/damage/knockback';
import { fightSnapshotFor } from '../../../combat/moments/fightSnapshot';
import { gapToTarget } from '../../../player/abilities/abilityTargeting';
import { applySharedDebuffMaxWins } from '../../../combat/status/sharedDebuffRecord';
import { classConfigContextOf } from '../../../player/progression/classConfig';
import { beginClassCast, registerClassCast } from '../../../player/abilities/abilityCasting';
import { applyPlayerDebuff } from '../../shared/applyPlayerDebuff';
import { ATTACK_HASTE_PCT_KEY } from '../../../combat/engine/attackCadence';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { runStrikerWeaponStrikes, strikerWeaponDamageMult } from './strikerGear';
import {
  buildWaitingMomentum,
  disciplineBeatMult,
  disciplineFinisherMult,
  isSetupFamily,
  landStrikerBeat,
  spendStrikerFinisher,
  strikerAmbushGuard,
  strikerT2,
} from './strikerT2';
import {
  AFTERIMAGE,
  AFTERIMAGE_HOLD_PCT,
  FRENZY,
  FRENZY_AFTER_FINISHERS,
  FRENZY_SECOND_PCT,
  SUBJUGATOR,
  SUBJUGATOR_FINISHER_PCT,
  THOUSAND_CUTS,
  isShelledTarget,
  strikerGearBeatMult,
  strikerSpecOf,
} from './strikerT3';
import { defineBuff } from '../../../combat/buffs/descriptor';

/** Focus's combo haste on the player (self only; one copy). */
export const STRIKER_FOCUS_EFFECT_ID = 'striker-focus';
/** Overheat's haste and extra damage taken on the player (self only; one copy, its own tile). */
export const STRIKER_OVERHEAT_EFFECT_ID = 'striker-overheated';

/** `ctx.metadata`: this swing is a cast's resolution (Skyfall's blow), not a new beat to cast. */
const CAST_RESOLVED = 'strikerCastResolved';
/** `ctx.metadata`: how far (px) a Pounce leap or Charge dash carried the Striker to this swing. */
const LEAP_DISTANCE = 'strikerLeapPx';
/** Techniques whose beat deals no damage (Feint). */
const NO_SWING = new Set(['striker-feint']);

const PIECES = new Map<string, StrikerPiece>(STRIKER_KIT.pieces.map((p) => [p.id, p]));
const TROPHIES = new Map<string, StrikerTrophy>(STRIKER_KIT.trophies.map((t) => [t.id, t]));

// ── The player's Order ───────────────────────────────────────────────────────

interface Order {
  order: OrderConfig;
  /** What the character owns (piece and trophy ranks, the budget). */
  ctx: ClassConfigContext;
  /** The equipped finisher trophy, if any. */
  trophy: StrikerTrophy | undefined;
}

const orders = new WeakMap<PlayerEntity, { tick: number; order: Order | null }>();

/** The player's Order and class context, read once per tick. */
export function strikerOrderOf(world: World, player: PlayerEntity): Order | null {
  const cached = orders.get(player);
  if (cached && cached.tick === world.tickCounter) return cached.order;
  const config = player.configuresClass?.config;
  const ctx = config?.system.kind === 'order' && player.usesCadence ? classConfigContextOf(player) : null;
  const order = config && ctx && config.system.kind === 'order'
    ? { order: config.system, ctx, trophy: config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined }
    : null;
  orders.set(player, { tick: world.tickCounter, order });
  return order;
}

/** Count one beat; the beat before the finisher arms it (`usesCadence.threshold` is the combo). */
export function advanceStrikerBeat(world: World, player: PlayerEntity): void {
  const cadence = player.usesCadence;
  if (!cadence) return;
  cadence.count++;
  if (cadence.count >= cadence.threshold - 1) {
    setEmpoweredAttack(world, player);
    cadence.count = 0;
  }
}

function pieceParams(o: Order, piece: StrikerPiece): Record<string, number> {
  return pieceParamsAt(piece, o.ctx.pieceRanks.get(piece.id) ?? 1);
}

function trophyParams(o: Order, trophy: StrikerTrophy): Record<string, number> {
  return trophyParamsAt(trophy, o.ctx.trophyRanks.get(trophy.id) ?? 1);
}

// ── Technique beats (CS.2: T1) ───────────────────────────────────────────────

type BeatHandler = (
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  params: Record<string, number>,
  /** The beat's full swing, before the price. */
  swing: number,
  /** The hit this beat rides (its damage is the priced swing). */
  ctx: CombatContext,
) => void;

/** Multiply the on-hit damage this hit pays (Thousand Cuts, Triple Cut: "sets off its hit effects again"). */
function multiplyOnHit(ctx: CombatContext, times: number): void {
  ctx.metadata['onHitDamageMult'] = Number(ctx.metadata['onHitDamageMult'] ?? 1) * times;
}

/**
 * A player bleed record on the target, through the bleed driver (`updateHemorrhages`):
 * `ticks` ticks of `damagePerTick`, one stack per remaining tick. The stronger of the old
 * and the new record stays (two Strikers' bleeds don't stack, bible §12.12).
 */
function applyBleed(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  id: string,
  damagePerTick: number,
  ticks: number,
  tickMs: number,
): void {
  const perTick = Math.max(1, Math.round(damagePerTick));
  const count = Math.max(1, Math.round(ticks));
  const prior = getStatusEffect(target.tracksCombat, id);
  if (prior && prior.stacks * (prior.data['damagePerTick'] ?? 0) > perTick * count) return;
  removeStatusEffect(target.tracksCombat, id);
  const bleed = applyPlayerDebuff(player, target.tracksCombat, {
    id,
    instanced: false,
    remainingMs: -1,
    sourceId: player.isPlayer.id,
    data: { damagePerTick: perTick, nextTickIn: tickMs, tickIntervalMs: tickMs },
  }, { origin: 'mechanic' });
  bleed.stacks = count; // one stack per remaining tick
  attachMarker(world, target, 'hasHemorrhage');
}

/** Bastard Sword: a setup lasts this much shorter. */
function setupDuration(player: PlayerEntity, ms: number): number {
  const cut = player.usesSkills.passives['striker.setup-duration-cut-pct'] ?? 0;
  return ms * Math.max(0.1, 1 - cut);
}

/**
 * Crack a share of the target's plating for a while, as the shared `plating-shred` record
 * (everyone's hits read it). The stronger of the old and the new crack stays.
 */
function crackPlating(player: PlayerEntity, target: MonsterEntity, crackPct: number, durationMs: number): void {
  const reduction = target.mitigatesDamage.plating * crackPct;
  if (reduction <= 0 || durationMs <= 0) return;
  const prior = getStatusEffect(target.tracksCombat, 'plating-shred');
  if (prior && prior.remainingMs !== 0 && prior.stacks * (prior.data['platingReduction'] ?? 0) >= reduction) return;
  removeStatusEffect(target.tracksCombat, 'plating-shred');
  applyPlayerDebuff(player, target.tracksCombat, {
    id: 'plating-shred',
    maxStacks: 1,
    remainingMs: durationMs,
    refreshable: true,
    sourceId: player.isPlayer.id,
    data: { platingReduction: reduction, totalMs: durationMs },
  }, { origin: 'mechanic' });
}

const BEATS: Readonly<Record<string, BeatHandler>> = {
  // Every other enemy around you takes a share of the swing.
  'striker-sweep': (world, player, target, p, swing) => {
    applyPlayerAoe(world, player, player.hasPosition.current, p.radius, swing * p.splashPct,
      target.isMonster.id, 'player', {}, { feedsWeaponReservoir: true });
  },
  // The target moves and attacks slower for a moment (the strongest slow wins). A setup:
  // Bastard Sword makes it wear off sooner.
  'striker-hamstring': (world, player, target, p) => {
    const cut = player.usesSkills.passives['striker.setup-duration-cut-pct'] ?? 0;
    applyMonsterSlow(world, target, p.moveSlowPct, p.durationMs * Math.max(0.1, 1 - cut), player.isPlayer.id);
    const slow = getStatusEffect(target.tracksCombat, ABILITY_SLOW_EFFECT_ID);
    if (slow) slow.data['attackSlowPct'] = Math.max(slow.data['attackSlowPct'] ?? 0, p.attackSlowPct);
  },
  // A bleed, a share of the swing per tick (Hooked Sickle: more ticks).
  'striker-rend': (world, player, target, p, swing) => {
    applyBleed(world, player, target, CADENCE_BLEED_ID, swing * p.tickPct, p.ticks * dotDurationMult(player), p.tickMs);
  },
  // ── Tier 2 (§12.16) ──
  // Sweep three times over: each spin hits every other enemy around you.
  'striker-whirlwind': (world, player, target, p, swing) => {
    for (let spin = 0; spin < Math.max(1, Math.round(p.spins)); spin++) {
      applyPlayerAoe(world, player, player.hasPosition.current, p.radius, swing * p.hitPct,
        target.isMonster.id, 'player', {}, { feedsWeaponReservoir: true });
    }
  },
  // No damage: the next beat is a critical hit (`runStrikerBeat` reads and spends the arming).
  'striker-feint': (_world, player, _target, p) => {
    strikerT2(player).critMult = p.critMult;
  },
  // The target's plating cracks for a few seconds.
  'striker-armor-break': (_world, player, target, p) => {
    crackPlating(player, target, p.crackPct, setupDuration(player, p.durationMs));
  },
  // A brief stun (control-immune bosses refuse it).
  'striker-concuss': (_world, player, target, p) => {
    if (target.hasHealth.hp <= 0 || monsterIgnoresControl(target)) return;
    applyStun(target.tracksCombat, setupDuration(player, p.stunMs), player.isPlayer.id);
  },
  // A root: the target can't kite away.
  'striker-pin': (world, player, target, p) => {
    if (target.hasHealth.hp <= 0) return;
    applyMonsterRoot(world, target, setupDuration(player, p.rootMs), player.isPlayer.id);
  },
  // The opener's strike: the dash happened on the cast; the beat pays the price like any technique.
  'striker-charge': () => {},
  // ── Tier 3 (§12.16) ──
  // The ground erupts: the target and every enemy touching it are knocked down (a short stun;
  // control-immune bosses refuse it).
  'striker-upheaval': (world, player, target, p, _swing, ctx) => {
    if (evadeBlocksDebuffs(ctx) || target.hasHealth.hp <= 0) return;
    const ms = setupDuration(player, p.knockdownMs);
    const touching = playerAoeTargets(world, player, target.hasPosition.current, p.radius, target.isMonster.id);
    for (const monster of [target, ...touching]) {
      if (monster.hasHealth.hp > 0 && !monsterIgnoresControl(monster)) applyStun(monster.tracksCombat, ms, player.isPlayer.id);
    }
  },
  // A deep bleed that outlasts Rend (same record: the stronger of the two stays).
  'striker-hemorrhage': (world, player, target, p, swing, ctx) => {
    if (evadeBlocksDebuffs(ctx)) return;
    applyBleed(world, player, target, CADENCE_BLEED_ID, swing * p.tickPct, p.ticks * dotDurationMult(player), p.tickMs);
  },
  // Three cuts: the beat is the first, the rest follow at a share of the swing, and the beat
  // pays its on-hit damage three times.
  'striker-triple-cut': (world, player, target, p, swing, ctx) => {
    for (let cut = 1; cut < Math.max(1, Math.round(p.cuts)); cut++) {
      if (!world.hasMonster(target.isMonster.id) || target.hasHealth.hp <= 0) break;
      applyPlayerAoeTo(world, player, [target], swing * p.cutPct, 'player', {}, { feedsWeaponReservoir: true });
    }
    multiplyOnHit(ctx, Math.max(1, Math.round(p.cuts)));
  },
  // Much harder against a shield or shell (no freeze is consumed: shatter stays the Apprentice's).
  'striker-icebreaker': (_world, _player, target, p, _swing, ctx) => {
    if (isShelledTarget(target, attackNow(ctx))) ctx.damage = Math.max(1, Math.round(ctx.damage * (1 + p.shellBonusPct)));
  },
};

/** The casts, resolved on the player cast machine; each counts its beat when it lands. */
const CASTS: Readonly<Record<string, (world: World, player: PlayerEntity, o: Order, params: Record<string, number>) => void>> = {
  // The opener: every beat after it swings faster, until the finisher.
  'striker-focus': (_world, player, _o, p) => {
    applyStatusEffect(player.tracksCombat, {
      id: STRIKER_FOCUS_EFFECT_ID,
      maxStacks: 1,
      remainingMs: p.maxMs,
      refreshable: true,
      sourceId: player.isPlayer.id,
      data: { [ATTACK_HASTE_PCT_KEY]: p.attackSpeedPct, totalMs: p.maxMs },
    });
  },
  // The opener that dashes: nothing to apply on the cast itself; `chargeAndStrike` does the rest.
  'striker-charge': () => {},
  // The wind-up: the finisher hits much harder.
  'striker-coil': (world, player) => {
    if (!player.usesCadence) return;
    player.usesCadence.coiled = true;
    markSliceDirty(world, player, 'usesCadence');
  },
  // ── Tier 3 (§12.16) ──
  // The wind-up that slams down a line of enemies through the target.
  'striker-earthsplitter': (world, player, o, p) => slamLine(world, player, o, p),
  // The opener that steps behind the target: the next beat is a sure critical hit.
  'striker-shadowstep': (world, player, _o, p) => {
    const target = currentTarget(world, player);
    if (target) {
      const gap = gapToTarget(player, target);
      const from = { ...player.hasPosition.current };
      if (repositionPlayer(world, player, target.hasPosition.current, gap + p.behindPx, true) !== null) {
        world.pushEvent(player.hasPosition.nodeId, {
          kind: 'player-reposition',
          playerId: player.isPlayer.id,
          ability: 'striker-shadowstep',
          from,
          to: { ...player.hasPosition.current },
        });
      }
    }
    strikerT2(player).critMult = p.critMult;
  },
  // The opener that overheats: every beat swings much faster, and you take more damage, until
  // the finisher. Its own status (one opener per combo), carrying the damage taken.
  'striker-overheat': (_world, player, _o, p) => {
    applyStatusEffect(player.tracksCombat, {
      id: STRIKER_OVERHEAT_EFFECT_ID,
      maxStacks: 1,
      remainingMs: p.maxMs,
      refreshable: true,
      sourceId: player.isPlayer.id,
      data: { [ATTACK_HASTE_PCT_KEY]: p.attackSpeedPct, [DAMAGE_TAKEN_PCT_KEY]: p.damageTakenPct, totalMs: p.maxMs },
    });
  },
};

/** Who the player is fighting right now, if it still lives. */
function currentTarget(world: World, player: PlayerEntity): MonsterEntity | undefined {
  const targetId = player.hasAttackTarget?.targetId;
  const target = targetId ? world.getMonsterEntity(targetId) : undefined;
  return target && target.hasHealth.hp > 0 ? target : undefined;
}

/**
 * Earthsplitter's slam: everything within `widthPx` of a line `lengthPx` long from you through
 * the target takes `slamMult` times the beat's full swing. A cast beat does not swing, so the
 * damage is built here from the attack stat with the beat's own layers (the discipline, the
 * weapon, the technique's price).
 */
function slamLine(world: World, player: PlayerEntity, o: Order, p: Record<string, number>): void {
  const cadence = player.usesCadence;
  const target = currentTarget(world, player);
  if (!cadence || !target) return;
  const index = cadence.count;
  const from = player.hasPosition.current;
  const to = target.hasPosition.current;
  const reach = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
  const ux = (to.x - from.x) / reach;
  const uy = (to.y - from.y) / reach;
  const victims = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)].filter((m) => {
    if (m.hasHealth.hp <= 0) return false;
    const dx = m.hasPosition.current.x - from.x;
    const dy = m.hasPosition.current.y - from.y;
    const along = dx * ux + dy * uy;
    return along >= 0 && along <= p.lengthPx && Math.abs(dx * uy - dy * ux) <= p.widthPx;
  });
  if (!victims.includes(target)) victims.push(target);
  const { mastered } = strikerSlots(o.ctx.budget, o.order.beats.length);
  const price = strikerMasteredBeats(o.order.beats, mastered).has(index) ? 1 : STRIKER_TECHNIQUE_SWING;
  const base = player.dealsDamage.attack * p.slamMult * price
    * disciplineBeatMult(player, o.ctx.disciplineId, true, true)
    * strikerWeaponDamageMult(player, target, { finisher: false, damageTechnique: true })
    * strikerGearBeatMult(player, target);
  applyPlayerAoeTo(world, player, victims, base, 'player', {}, { feedsWeaponReservoir: true });
}

// ── Trophies (CS.2: T1) ──────────────────────────────────────────────────────

/** Weight trophies: what they do to the finisher hit. */
const WEIGHTS: Readonly<Record<string, (world: World, player: PlayerEntity, target: MonsterEntity, ctx: CombatContext, p: Record<string, number>) => void>> = {
  // The finisher's wound rots, dealing a share of its damage again over a few ticks.
  'striker-relic-swamp': (world, player, target, ctx, p) => {
    applyBleed(world, player, target, STRIKER_ROT_ID, (ctx.damage * p.sharePct) / p.ticks, p.ticks * dotDurationMult(player), p.tickMs);
  },
  // The finisher is a cast (see beforeAttack); the blow it resolves into is bigger.
  'striker-relic-mountain': (_world, _player, _target, ctx, p) => {
    if (ctx.metadata[CAST_RESOLVED] === 'skyfall') ctx.damage = Math.round(ctx.damage * p.blowMult);
  },
  // Expose: the target takes more damage from everyone for a few seconds (strongest copy).
  // Rank 2: the exposed target also loses plating for as long.
  'striker-relic-cave': (_world, player, target, _ctx, p) => {
    if (p.platingCrackPct) crackPlating(player, target, p.platingCrackPct, p.durationMs);
    applySharedDebuffMaxWins(player, target.tracksCombat, {
      id: 'vulnerability',
      maxStacks: 1,
      refreshable: true,
      remainingMs: p.durationMs,
      sourceId: player.isPlayer.id,
      data: { totalMs: p.durationMs, damageMultiplier: 1 + p.damageTakenPct },
    }, ['damageMultiplier', 'totalMs']);
  },
  // Pounce: the finisher leapt to its target, and hits harder the farther it leapt.
  // Rank 2: the landing also hits the enemies around the target.
  'striker-relic-jungle': (world, player, target, ctx, p) => {
    const leapt = Number(ctx.metadata[LEAP_DISTANCE] ?? 0);
    if (leapt <= 0) return;
    ctx.damage = Math.round(ctx.damage * (1 + p.bonusPct * Math.min(1, leapt / p.maxLeapPx)));
    if (p.landingPct) {
      applyPlayerAoe(world, player, target.hasPosition.current, p.landingRadius, ctx.damage * p.landingPct,
        target.isMonster.id, 'player', {}, { feedsWeaponReservoir: true });
    }
  },
  // Eruption: the finisher hits the target and everything around it, harder against a shell.
  'striker-relic-volcanic': (world, player, target, ctx, p) => {
    if (isShelledTarget(target, attackNow(ctx))) ctx.damage = Math.round(ctx.damage * (1 + p.shellBonusPct));
    applyPlayerAoe(world, player, target.hasPosition.current, p.radius, ctx.damage * p.splashPct,
      target.isMonster.id, 'player', {}, { feedsWeaponReservoir: true });
  },
  // Verdict: the finisher kills a target at or below the threshold outright.
  'striker-relic-desert': (_world, _player, target, ctx, p) => {
    const { hp, maxHp } = target.hasHealth;
    if (hp > 0 && hp / Math.max(1, maxHp) <= p.thresholdPct) ctx.damage = Math.max(ctx.damage, hp);
  },
};

/** Spark trophies: what they add to every beat of the combo they ride. */
const SPARKS: Readonly<Record<string, (world: World, player: PlayerEntity, target: MonsterEntity, ctx: CombatContext, p: Record<string, number>) => void>> = {
  // Each beat also strikes the enemies nearest the target.
  'striker-relic-plains': (world, player, target, ctx, p) => {
    const at = target.hasPosition.current;
    const beside = playerAoeTargets(world, player, at, p.radius, target.isMonster.id)
      .sort((a, b) => dist2(a, at) - dist2(b, at))
      .slice(0, Math.max(0, Math.round(p.extraTargets)));
    if (beside.length > 0) applyPlayerAoeTo(world, player, beside, ctx.damage * p.damagePct, 'player', {}, { feedsWeaponReservoir: true });
  },
  // Hoarfrost: each beat slows the target a little more (bosses that accept no control ignore it).
  'striker-relic-tundra': (world, player, target, ctx, p) => {
    if (evadeBlocksDebuffs(ctx) || target.hasHealth.hp <= 0 || monsterIgnoresControl(target)) return;
    const prior = getStatusEffect(target.tracksCombat, ABILITY_SLOW_EFFECT_ID)?.data['moveSlowPct'] ?? 0;
    applyMonsterSlow(world, target, Math.min(p.maxPct, prior + p.stepPct), p.durationMs, player.isPlayer.id);
  },
  // Each beat strikes twice, each strike a bit over half.
  'striker-relic-forest': (world, player, target, ctx, p) => {
    const strike = ctx.damage * p.strikePct;
    ctx.damage = Math.max(1, Math.round(strike));
    applyPlayerAoeTo(world, player, [target], strike, 'player', {}, { feedsWeaponReservoir: true });
  },
};

/** Hooked Sickle: your bleeds and rot last longer. */
function dotDurationMult(player: PlayerEntity): number {
  return 1 + (player.usesSkills.passives['striker.dot-duration-pct'] ?? 0);
}

/** A cast's wind-up after Maul's faster wind-ups (the opener isn't a wind-up). */
function castMsFor(player: PlayerEntity, authoredMs: number, windup: boolean): number {
  const cut = windup ? player.usesSkills.passives['striker.windup-speed-pct'] ?? 0 : 0;
  return authoredMs * Math.max(0.1, 1 - cut);
}

/** Braced Cast: nothing interrupts your casts. */
function castUnbreakable(player: PlayerEntity): boolean {
  // Watchful: an ambush landing now can't interrupt a cast either.
  return (player.usesSkills.passives['striker.cast-unbreakable'] ?? 0) > 0 || strikerAmbushGuard(player);
}

function dist2(m: MonsterEntity, at: { x: number; y: number }): number {
  const dx = m.hasPosition.current.x - at.x;
  const dy = m.hasPosition.current.y - at.y;
  return dx * dx + dy * dy;
}

const CHARGE_ID = 'striker-charge';

/** Dash toward the target, up to `maxPx`, stopping short of contact. Returns the distance covered. */
function leapToward(world: World, player: PlayerEntity, target: MonsterEntity, maxPx: number): number {
  const travel = Math.min(maxPx, Math.max(0, gapToTarget(player, target) - player.performsAttack.attackRange * 0.7));
  if (travel <= 0) return 0;
  const from = { ...player.hasPosition.current };
  if (repositionPlayer(world, player, target.hasPosition.current, travel, true) === null) return 0;
  const to = { ...player.hasPosition.current };
  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'player-reposition',
    playerId: player.isPlayer.id,
    ability: 'striker-leap',
    from,
    to,
  });
  return Math.hypot(to.x - from.x, to.y - from.y);
}

/** Who the player is fighting or about to: the current target, else the nearest in leap range. */
function leapTarget(world: World, player: PlayerEntity, reach: number): MonsterEntity | null {
  const currentId = player.hasAttackTarget?.targetId;
  const current = currentId ? world.getMonsterEntity(currentId) : undefined;
  if (current && current.hasHealth.hp > 0) return current;
  const travelling = player.hasAutoTraversePath !== undefined && player.hasAutoTraversePath.targetNodeId !== player.hasPosition.nodeId;
  if (travelling) return null;
  const candidates = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)]
    .filter((m) => m.hasHealth.hp > 0 && !isConcealedEntity(m));
  return world.collision.bestTargetInReach(player, candidates, reach);
}

/** Charge resolves: dash to the target (even one that ran) and strike; the strike is the opener beat. */
function chargeAndStrike(world: World, player: PlayerEntity, o: Order, piece: StrikerPiece, now: number): void {
  const cadence = player.usesCadence;
  const p = pieceParams(o, piece);
  const target = leapTarget(world, player, player.performsAttack.attackRange + p.maxRangePx);
  if (!cadence || !target) return;
  syncComboLength(o, cadence);
  const moved = leapToward(world, player, target, p.maxRangePx);
  if (!world.collision.canReach(player, target, player.performsAttack.attackRange)) return;
  player.performsAttack.lastAttackAt = now;
  runPlayerAttack(world, player, target, now, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
    metadata: { [CAST_RESOLVED]: 'charge', [LEAP_DISTANCE]: moved },
  });
}

/**
 * The leaps (Charge, Pounce) reach a target the ordinary swing can't: a player whose target
 * ran or keeps its distance is out of the swing loop's reach, so these run from the tick. An
 * opener Charge starts its cast; an armed Pounce finisher leaps and lands.
 */
export function updateStrikerLeaps(world: World, now: number): void {
  for (const player of world.livePlayers) {
    const cadence = player.usesCadence;
    if (!cadence || player.isCastingAbility || player.isChargingAbility || isHardControlled(player.tracksCombat)) continue;
    const o = strikerOrderOf(world, player);
    if (!o) continue;
    const armed = isEmpoweredAttack(player);
    const pounce = armed && o.trophy?.id === 'striker-relic-jungle' ? o.trophy : undefined;
    const charge = !armed && cadence.count === 0 && o.order.beats[0] === CHARGE_ID ? PIECES.get(CHARGE_ID) : undefined;
    if (!pounce && !charge) continue;
    if (now - player.performsAttack.lastAttackAt < player.performsAttack.attackCooldown) continue;
    const attackRange = player.performsAttack.attackRange;
    const p = pounce ? trophyParams(o, pounce) : pieceParams(o, charge!);
    const maxPx = pounce ? p.maxLeapPx : p.maxRangePx;
    const target = leapTarget(world, player, attackRange + maxPx);
    // In reach: the ordinary swing does it. Out of the dash's range: nothing to catch.
    if (!target || world.collision.canReach(player, target, attackRange) || gapToTarget(player, target) > maxPx) continue;
    if (fightSnapshotFor(world, player, now).traveling) continue;
    if (pounce) {
      if (o.order.holdFinisher.length > 0 && conditionsHold(world, player, o.order.holdFinisher, now)) continue;
      const moved = leapToward(world, player, target, maxPx);
      if (!world.collision.canReach(player, target, attackRange)) continue;
      player.performsAttack.lastAttackAt = now;
      runPlayerAttack(world, player, target, now, {
        attackOrigin: player.hasPosition.current,
        aggroSource: { id: player.isPlayer.id, kind: 'player' },
        metadata: { [LEAP_DISTANCE]: moved },
      });
    } else if (charge) {
      beginClassCast(world, player, CHARGE_ID, castMsFor(player, p.castMs, false), now);
    }
  }
}

/** Focus on the buff bar: the combo's haste, until the finisher. */
export const STRIKER_ORDER_BUFFS = [
  defineBuff(
    STRIKER_FOCUS_EFFECT_ID,
    ({ player }) => {
      const effect = getStatusEffect(player.tracksCombat, STRIKER_FOCUS_EFFECT_ID);
      if (!effect || effect.remainingMs === 0) return null;
      const pct = Math.round((effect.data[ATTACK_HASTE_PCT_KEY] ?? 0) * 100);
      return {
        id: STRIKER_FOCUS_EFFECT_ID,
        label: 'Focus',
        stacks: 1,
        // It lasts until the finisher, not a clock.
        durationPct: -1,
        remainingMs: effect.remainingMs,
        color: '#9fd8ff',
        logSourceName: 'Focus',
        logDetail: `+${pct}% attack speed`,
        values: [{ label: 'Attack speed', value: `+${pct}%`, good: true }],
      };
    },
    { label: 'Focus', color: '#9fd8ff', category: 'cadence', shape: 'circle' },
  ),
  // Overheat: the same haste, and the damage it costs, until the finisher.
  defineBuff(
    STRIKER_OVERHEAT_EFFECT_ID,
    ({ player }) => {
      const effect = getStatusEffect(player.tracksCombat, STRIKER_OVERHEAT_EFFECT_ID);
      if (!effect || effect.remainingMs === 0) return null;
      const pct = Math.round((effect.data[ATTACK_HASTE_PCT_KEY] ?? 0) * 100);
      const takenPct = Math.round((effect.data[DAMAGE_TAKEN_PCT_KEY] ?? 0) * 100);
      return {
        id: STRIKER_OVERHEAT_EFFECT_ID,
        label: 'Overheat',
        stacks: 1,
        durationPct: -1,
        remainingMs: effect.remainingMs,
        color: '#ff8a4a',
        logSourceName: 'Overheat',
        logDetail: `+${pct}% attack speed, +${takenPct}% damage taken`,
        values: [
          { label: 'Attack speed', value: `+${pct}%`, good: true },
          { label: 'Damage taken', value: `+${takenPct}%`, good: false },
        ],
      };
    },
    { label: 'Overheat', color: '#ff8a4a', category: 'cadence', shape: 'circle' },
  ),
];

// ── The pipeline ─────────────────────────────────────────────────────────────

/** The combo is the Order's beats plus the finisher. */
function syncComboLength(o: Order, cadence: NonNullable<PlayerEntity['usesCadence']>): void {
  const threshold = o.order.beats.length + 1;
  if (cadence.threshold !== threshold) cadence.threshold = threshold;
}

/** The Skyfall finisher resolves: swing the blow at the current target. */
function resolveSkyfall(world: World, player: PlayerEntity, now: number): void {
  const targetId = player.hasAttackTarget?.targetId;
  const target = targetId ? world.getMonsterEntity(targetId) : undefined;
  // No target in reach: the finisher stays armed, and the next swing winds it up again.
  if (!target || target.hasHealth.hp <= 0) return;
  if (!world.collision.canReach(player, target, player.performsAttack.attackRange)) return;
  runPlayerAttack(world, player, target, now, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
    metadata: { [CAST_RESOLVED]: 'skyfall' },
  });
}

/**
 * Before a Striker's swing: hold the finisher when its rule says so, wind up a cast beat or
 * a cast finisher instead of swinging, and keep the combo length the Order's.
 */
function beforeStrikerSwing(ctx: CombatContext, world: World): void {
  if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
  const player = ctx.attacker;
  const cadence = player.usesCadence;
  if (!cadence) return;
  const o = strikerOrderOf(world, player);
  if (!o) return;
  // The swing a cast resolves into: Skyfall II's blow pays less plating; Charge's strike just swings.
  if (ctx.metadata[CAST_RESOLVED]) {
    if (ctx.metadata[CAST_RESOLVED] === 'skyfall' && o.trophy?.id === 'striker-relic-mountain') {
      const ignore = trophyParams(o, o.trophy).platingIgnorePct ?? 0;
      if (ignore > 0) ctx.platingMult *= Math.max(0, 1 - ignore);
    }
    return;
  }
  syncComboLength(o, cadence);
  const now = attackNow(ctx);

  if (isEmpoweredAttack(player)) {
    // Heavy's rule (and any rule): don't spend the finisher while these hold.
    if (o.order.holdFinisher.length > 0 && conditionsHold(world, player, o.order.holdFinisher, now)) {
      ctx.metadata[HOLD_EMPOWERED_ATTACK] = true;
      // Crescendo: a swing spent waiting for the release builds Momentum.
      buildWaitingMomentum(player);
      return;
    }
    // Skyfall: the finisher becomes a cast.
    if (o.trophy?.id === 'striker-relic-mountain') {
      const p = trophyParams(o, o.trophy);
      if (beginClassCast(world, player, o.trophy.id, castMsFor(player, p.castMs, true), now)) ctx.cancelled = true;
    }
    return;
  }

  const piece = PIECES.get(o.order.beats[cadence.count] ?? '');
  if (piece?.cast && CASTS[piece.id]) {
    const castMs = castMsFor(player, pieceParams(o, piece).castMs, piece.cast === 'windup');
    if (beginClassCast(world, player, piece.id, castMs, now)) ctx.cancelled = true;
  }
}

/**
 * A beat that isn't the finisher landed (called by the cadence counter before it counts):
 * pay the price and run the beat's technique, then the combo's spark.
 */
export function runStrikerBeat(world: World, ctx: CombatContext): void {
  if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
  const player = ctx.attacker;
  const cadence = player.usesCadence;
  const o = cadence ? strikerOrderOf(world, player) : null;
  if (!cadence || !o) return;
  const index = cadence.count;
  const piece = PIECES.get(o.order.beats[index] ?? '');
  const handler = piece ? BEATS[piece.id] : undefined;
  const discipline = o.ctx.disciplineId;
  const t2 = strikerT2(player);

  // What rides the swing before the technique reads it: Feint's critical hit, Hunter's Blade's
  // first strike on a new target, and the discipline (the shine, the edge).
  const castTechnique = piece?.cast !== undefined;
  const spec = strikerSpecOf(player);
  let mult = disciplineBeatMult(player, discipline, piece?.family === 'damage', castTechnique);
  if (t2.critMult > 0) { mult *= t2.critMult; t2.critMult = 0; }
  const firstStrike = player.usesSkills.passives['striker.first-strike-pct'] ?? 0;
  if (firstStrike > 0 && t2.lastTargetId !== ctx.defender.isMonster.id) mult *= 1 + firstStrike;
  t2.lastTargetId = ctx.defender.isMonster.id;
  // Rimeblade and Bloodfire Axe: every beat reads the target's cold and your missing HP.
  mult *= strikerGearBeatMult(player, ctx.defender);
  if (mult !== 1) ctx.damage = Math.max(1, Math.round(ctx.damage * mult));
  // Thousand Cuts: a lit beat sets off its hit effects twice.
  if (spec === THOUSAND_CUTS && t2.lit) multiplyOnHit(ctx, 2);

  if (piece && handler) {
    // Bastard Sword: damage techniques hit harder, their swing and their effect.
    const swing = ctx.damage * strikerWeaponDamageMult(player, ctx.defender, { finisher: false, damageTechnique: piece.family === 'damage' });
    ctx.damage = Math.max(1, Math.round(swing));
    const { mastered } = strikerSlots(o.ctx.budget, o.order.beats.length);
    if (!strikerMasteredBeats(o.order.beats, mastered).has(index)) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * STRIKER_TECHNIQUE_SWING));
    }
    handler(world, player, ctx.defender, pieceParams(o, piece), swing, ctx);
  }
  // A feint deals no damage, rides no strikes and sparks nothing: it only sets up the next beat.
  if (piece && NO_SWING.has(piece.id)) {
    ctx.damage = 0;
    landStrikerBeat(player, discipline, true);
    return;
  }
  // Afterimage: the beat holds back part of its damage; the finisher replays it.
  if (spec === AFTERIMAGE && ctx.damage > 1) {
    const held = Math.floor(ctx.damage * AFTERIMAGE_HOLD_PCT);
    if (held > 0) {
      t2.held.push(held);
      ctx.damage = Math.max(1, ctx.damage - held);
    }
  }
  runStrikerWeaponStrikes(world, player, ctx);
  runSpark(world, player, ctx, o);
  landStrikerBeat(player, discipline, piece ? isSetupFamily(piece.family) : false, {
    damageTechnique: piece?.family === 'damage',
    cast: castTechnique,
    control: piece?.control === true,
  });
}

function runSpark(world: World, player: PlayerEntity, ctx: CombatContext, o: Order): void {
  const sparkId = player.usesCadence?.sparkTrophyId;
  const trophy = sparkId ? TROPHIES.get(sparkId) : undefined;
  if (!trophy || ctx.defenderType !== 'monster') return;
  SPARKS[trophy.id]?.(world, player, ctx.defender, ctx, trophyParams(o, trophy));
}

/** The finisher landed: Coil, the weight trophy, the spark it rode, then arm the next combo. */
function onStrikerFinisher(ctx: CombatContext, world: World): void {
  if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
  if (!ctx.metadata['empoweredAttack']) return;
  const player = ctx.attacker;
  const cadence = player.usesCadence;
  const o = cadence ? strikerOrderOf(world, player) : null;
  if (!cadence || !o) return;
  if (cadence.coiled) {
    const coil = PIECES.get('striker-coil')!;
    ctx.damage = Math.round(ctx.damage * (1 + (pieceParams(o, coil).finisherBonusPct ?? 0)));
  }
  // The discipline (the edge, Momentum), and a Feint left on the beat before.
  const t2 = strikerT2(player);
  ctx.damage = Math.round(ctx.damage * disciplineFinisherMult(player, o.ctx.disciplineId));
  if (t2.critMult > 0) { ctx.damage = Math.round(ctx.damage * t2.critMult); t2.critMult = 0; }
  // Maul, Bastard Sword and Hooked Sickle on the finisher; Rimeblade and Bloodfire Axe on every blow.
  ctx.damage = Math.round(ctx.damage * strikerWeaponDamageMult(player, ctx.defender, { finisher: true, damageTechnique: false }));
  ctx.damage = Math.round(ctx.damage * strikerGearBeatMult(player, ctx.defender));
  const spec = strikerSpecOf(player);
  const target = ctx.defender;
  // Subjugator: the finisher hits a controlled enemy much harder.
  if (spec === SUBJUGATOR && monsterIsHeld(target)) ctx.damage = Math.round(ctx.damage * (1 + SUBJUGATOR_FINISHER_PCT));
  // Frenzy: the second finisher of the combo is the lighter one.
  const second = t2.secondFinisher;
  if (second) ctx.damage = Math.max(1, Math.round(ctx.damage * FRENZY_SECOND_PCT));
  // Afterimage: the finisher arrives as a multi-cut, replaying every held slash with its share.
  // The replays set off no hit effects (no on-hit damage, no weapon reservoir), then the twist lands.
  for (const slash of t2.held.splice(0)) {
    if (!world.hasMonster(target.isMonster.id) || target.hasHealth.hp <= 0) break;
    applyPlayerAoeTo(world, player, [target], slash, 'player', {}, {});
  }
  if (world.hasMonster(target.isMonster.id)) {
    if (o.trophy && o.trophy.kind === 'weight') {
      WEIGHTS[o.trophy.id]?.(world, player, target, ctx, trophyParams(o, o.trophy));
    }
    runStrikerWeaponStrikes(world, player, ctx);
    runSpark(world, player, ctx, o);
  }
  // The combo ends: the next one rides this trophy's spark, and starts unfocused, uncoiled.
  cadence.sparkTrophyId = o.trophy?.kind === 'spark' ? o.trophy.id : null;
  cadence.coiled = false;
  t2.lastTargetId = target.isMonster.id;
  if (second) {
    t2.secondFinisher = false;
  } else {
    spendStrikerFinisher(player, o.ctx.disciplineId);
    // Frenzy: as the fight goes on, a second, lighter finisher follows this one at once.
    if (spec === FRENZY && t2.fightFinishers >= FRENZY_AFTER_FINISHERS) {
      t2.secondFinisher = true;
      setEmpoweredAttack(world, player);
    }
  }
  removeStatusEffect(player.tracksCombat, STRIKER_FOCUS_EFFECT_ID);
  removeStatusEffect(player.tracksCombat, STRIKER_OVERHEAT_EFFECT_ID);
  markSliceDirty(world, player, 'usesCadence');
}

/**
 * Register the Order: the casts on the cast machine, the swing gate, the finisher. The
 * beats themselves run from the cadence counter (`runStrikerBeat`), so a beat is priced and
 * resolved on the same hit it is counted.
 */
export function initStrikerOrder(): void {
  for (const [id, apply] of Object.entries(CASTS)) {
    registerClassCast(id, {
      unbreakable: castUnbreakable,
      resolve(world, player, now) {
        const o = strikerOrderOf(world, player);
        const piece = PIECES.get(id);
        if (!o || !piece) return;
        apply(world, player, o, pieceParams(o, piece));
        // Charge: the cast was the wind-up; the dash and its strike are the beat, and count
        // through the ordinary hit.
        if (id === CHARGE_ID) {
          chargeAndStrike(world, player, o, piece, now);
          return;
        }
        landStrikerBeat(player, o.ctx.disciplineId, isSetupFamily(piece.family), {
          damageTechnique: piece.family === 'damage',
          cast: true,
          control: piece.control === true,
        });
        advanceStrikerBeat(world, player);
        markSliceDirty(world, player, 'usesCadence');
      },
    });
  }
  registerClassCast('striker-relic-mountain', { resolve: resolveSkyfall, unbreakable: castUnbreakable });
  registerCombatListener('beforeAttack', beforeStrikerSwing);
  registerCombatListener('onHit', onStrikerFinisher);
}
