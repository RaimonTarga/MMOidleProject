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
import { applyMonsterSlow } from '../../../combat/status/monsterControl';
import { applySharedDebuffMaxWins } from '../../../combat/status/sharedDebuffRecord';
import { classConfigContextOf } from '../../../player/progression/classConfig';
import { beginClassCast, registerClassCast } from '../../../player/abilities/abilityCasting';
import { applyPlayerDebuff } from '../../shared/applyPlayerDebuff';
import { ATTACK_HASTE_PCT_KEY } from '../../../combat/engine/attackCadence';
import { runStrikerWeaponStrikes, strikerWeaponDamageMult } from './strikerGear';
import { defineBuff } from '../../../combat/buffs/descriptor';

/** Focus's combo haste on the player (self only; one copy). */
export const STRIKER_FOCUS_EFFECT_ID = 'striker-focus';

/** `ctx.metadata`: this swing is a cast's resolution (Skyfall's blow), not a new beat to cast. */
const CAST_RESOLVED = 'strikerCastResolved';

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
) => void;

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
  // The wind-up: the finisher hits much harder.
  'striker-coil': (world, player) => {
    if (!player.usesCadence) return;
    player.usesCadence.coiled = true;
    markSliceDirty(world, player, 'usesCadence');
  },
};

// ── Trophies (CS.2: T1) ──────────────────────────────────────────────────────

/** Weight trophies: what they do to the finisher hit. */
const WEIGHTS: Readonly<Record<string, (world: World, player: PlayerEntity, target: MonsterEntity, ctx: CombatContext, p: Record<string, number>) => void>> = {
  // The finisher's wound rots, dealing a share of its damage again over a few ticks.
  'striker-relic-swamp': (world, player, target, ctx, p) => {
    applyBleed(world, player, target, STRIKER_ROT_ID, (ctx.damage * p.sharePct) / p.ticks, p.ticks * dotDurationMult(player), p.tickMs);
  },
  // The finisher is a cast (see beforeAttack); the blow it resolves into is bigger.
  'striker-relic-mountain': (_world, _player, _target, ctx, p) => {
    if (ctx.metadata[CAST_RESOLVED]) ctx.damage = Math.round(ctx.damage * p.blowMult);
  },
  // Expose: the target takes more damage from everyone for a few seconds (strongest copy).
  'striker-relic-cave': (_world, player, target, _ctx, p) => {
    applySharedDebuffMaxWins(player, target.tracksCombat, {
      id: 'vulnerability',
      maxStacks: 1,
      refreshable: true,
      remainingMs: p.durationMs,
      sourceId: player.isPlayer.id,
      data: { totalMs: p.durationMs, damageMultiplier: 1 + p.damageTakenPct },
    }, ['damageMultiplier', 'totalMs']);
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
  return (player.usesSkills.passives['striker.cast-unbreakable'] ?? 0) > 0;
}

function dist2(m: MonsterEntity, at: { x: number; y: number }): number {
  const dx = m.hasPosition.current.x - at.x;
  const dy = m.hasPosition.current.y - at.y;
  return dx * dx + dy * dy;
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
];

// ── The pipeline ─────────────────────────────────────────────────────────────

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
    metadata: { [CAST_RESOLVED]: true },
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
  if (!cadence || ctx.metadata[CAST_RESOLVED]) return;
  const o = strikerOrderOf(world, player);
  if (!o) return;
  const threshold = o.order.beats.length + 1;
  if (cadence.threshold !== threshold) cadence.threshold = threshold;
  const now = attackNow(ctx);

  if (isEmpoweredAttack(player)) {
    // Heavy's rule (and any rule): don't spend the finisher while these hold.
    if (o.order.holdFinisher.length > 0 && conditionsHold(world, player, o.order.holdFinisher, now)) {
      ctx.metadata[HOLD_EMPOWERED_ATTACK] = true;
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
  if (piece && handler) {
    // Bastard Sword: damage techniques hit harder, their swing and their effect.
    const swing = ctx.damage * strikerWeaponDamageMult(player, ctx.defender, { finisher: false, damageTechnique: piece.family === 'damage' });
    ctx.damage = Math.max(1, Math.round(swing));
    const { mastered } = strikerSlots(o.ctx.budget, o.order.beats.length);
    if (!strikerMasteredBeats(o.order.beats, mastered).has(index)) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * STRIKER_TECHNIQUE_SWING));
    }
    handler(world, player, ctx.defender, pieceParams(o, piece), swing);
  }
  runStrikerWeaponStrikes(world, player, ctx);
  runSpark(world, player, ctx, o);
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
  // Maul, Bastard Sword and Hooked Sickle on the finisher.
  ctx.damage = Math.round(ctx.damage * strikerWeaponDamageMult(player, ctx.defender, { finisher: true, damageTechnique: false }));
  if (o.trophy && o.trophy.kind === 'weight') {
    WEIGHTS[o.trophy.id]?.(world, player, ctx.defender, ctx, trophyParams(o, o.trophy));
  }
  runStrikerWeaponStrikes(world, player, ctx);
  runSpark(world, player, ctx, o);
  // The combo ends: the next one rides this trophy's spark, and starts unfocused, uncoiled.
  cadence.sparkTrophyId = o.trophy?.kind === 'spark' ? o.trophy.id : null;
  cadence.coiled = false;
  removeStatusEffect(player.tracksCombat, STRIKER_FOCUS_EFFECT_ID);
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
      resolve(world, player) {
        const o = strikerOrderOf(world, player);
        const piece = PIECES.get(id);
        if (!o || !piece) return;
        apply(world, player, o, pieceParams(o, piece));
        advanceStrikerBeat(world, player);
        markSliceDirty(world, player, 'usesCadence');
      },
    });
  }
  registerClassCast('striker-relic-mountain', { resolve: resolveSkyfall, unbreakable: castUnbreakable });
  registerCombatListener('beforeAttack', beforeStrikerSwing);
  registerCombatListener('onHit', onStrikerFinisher);
}
