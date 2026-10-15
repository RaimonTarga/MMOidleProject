/**
 * The Squire at runtime (class-first build plan CQ.1–CQ.2; bible §8.2–§8.4): Resolve, the
 * slam, and the Response rules.
 *
 * **Resolve** is a bar of pips (the class budget). It fills from how hard you are hit (a
 * landed hit's raw size, before armor), a pressure trickle from every enemy engaged with you
 * (a boss counts as several), and the refunds of answers that land. Damage over time doesn't
 * fill it unless Rot-Eater says so. It never absorbs damage itself.
 *
 * **The slam** arms at a full bar (Relentless: at a third), unless the slam rule holds it; it
 * is the empowered swing, and everything around you takes the same blow. It spends the bar.
 *
 * **Responses** each answer one enemy action (a moment): Shove, Riposte, Steel Will, Guard,
 * Shield Bash at T1. Each costs Resolve and refunds more when it lands; a wasted one loses
 * its cost. Every number is in the kit's `params` or `SQUIRE_RESOLVE` (placeholders).
 */
import {
  ABILITY_UNYIELDING_EFFECT_ID,
  getCounter,
  getString,
  getStatusEffect,
  isMonsterDotStatusEffectId,
  pieceParamsAt,
  removeStatusEffect,
  applyStatusEffect,
  setCounter,
  SQUIRE_KIT,
  SQUIRE_RESOLVE,
  trophyParamsAt,
  type ClassConfigContext,
  type ConditionRef,
  type ResponsesConfig,
  type SquirePiece,
  type SquireTrophy,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { attachMarker } from '../../../../ecs/markerHelpers';
import type { World } from '../../../../world/World';
import { applyPlayerAoe, applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { applyKnockback } from '../../../combat/damage/knockback';
import { guardableThreatsFor } from '../../../combat/ai/guardableThreats';
import { attackNow, registerCombatListener, type CombatContext } from '../../../combat/engine/combatPipeline';
import { abortMonsterCast } from '../../../combat/engine/combat';
import { isEmpoweredAttack, setEmpoweredAttack } from '../../../combat/engine/empoweredAttacks';
import { conditionsHold, momentActive, momentTick, momentValue } from '../../../combat/moments/moments';
import { applyStun } from '../../../combat/status/stun';
import { classConfigContextOf } from '../../../player/progression/classConfig';
import { applyPlayerDebuff } from '../../shared/applyPlayerDebuff';
import { CADENCE_BLEED_ID } from '../../../combat/damage/bleedIds';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import { activateRecoveryBoost } from '../../../defense/regen/recovery';
import { EXECUTION_MULTIPLIER } from './cooldownPrototype';

/** The brace a Guard puts up, until the blow it was raised for lands. */
export const SQUIRE_GUARD_EFFECT_ID = 'squire-guard';

const PIECES = new Map<string, SquirePiece>(SQUIRE_KIT.pieces.map((p) => [p.id, p]));
const TROPHIES = new Map<string, SquireTrophy>(SQUIRE_KIT.trophies.map((t) => [t.id, t]));

const HANDLED_PREFIX = 'squire.handled.';   // the moment tick a response last answered
const LOCKOUT_PREFIX = 'squire.lockout.';   // a state response's next allowed time
const LAST_SLAM_AT = 'squire.lastSlamAt';
const SLAM_CHAIN = 'squire.slamChain';
const REPEAT_COUNT_KEY = 'moment.repeat-hits.count';
const REPEAT_BY_KEY = 'moment.repeat-hits.by';
const RAMPART_UNTIL = 'squire.rampart.untilTick.';  // on the shoved monster, per Squire
const RAMPART_PCT = 'squire.rampart.pct.';
const LAST_CAUGHT_TICK = 'squire.lastCaughtTick';
const SHRED_LAST = 'squire.shred.lastStacks';
const SHRED_REGROW = 'squire.shred.regrowMs';
/** World ticks per second (the logic rate), for windows kept in ticks. */
const TICKS_PER_SEC = 10;

// ── The player's rules ───────────────────────────────────────────────────────

interface Rules {
  config: ResponsesConfig;
  ctx: ClassConfigContext;
  trophy: SquireTrophy | undefined;
}

const rulesCache = new WeakMap<PlayerEntity, { tick: number; rules: Rules | null }>();

export function squireRulesOf(world: World, player: PlayerEntity): Rules | null {
  const cached = rulesCache.get(player);
  if (cached && cached.tick === world.tickCounter) return cached.rules;
  const config = player.configuresClass?.config;
  const ctx = config?.system.kind === 'responses' && player.usesCooldown ? classConfigContextOf(player) : null;
  const rules = config && ctx && config.system.kind === 'responses'
    ? { config: config.system, ctx, trophy: config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined }
    : null;
  rulesCache.set(player, { tick: world.tickCounter, rules });
  return rules;
}

function pieceParams(r: Rules, piece: SquirePiece): Record<string, number> {
  return pieceParamsAt(piece, r.ctx.pieceRanks.get(piece.id) ?? 1);
}

function trophyParams(r: Rules, trophy: SquireTrophy): Record<string, number> {
  return trophyParamsAt(trophy, r.ctx.trophyRanks.get(trophy.id) ?? 1);
}

// ── Resolve ──────────────────────────────────────────────────────────────────

/** Fill (or, negative, spend) Resolve, capped at the bar; mirrors the HUD dial. */
export function addResolve(world: World, player: PlayerEntity, pips: number): void {
  const cd = player.usesCooldown;
  if (!cd || pips === 0) return;
  cd.resolve = Math.max(0, Math.min(cd.resolveMax, cd.resolve + pips));
  cd.executionCooldownPct = cd.resolveMax > 0 ? Math.round((cd.resolve / cd.resolveMax) * 100) : 0;
  markSliceDirty(world, player, 'usesCooldown');
}

/** The raw size of a hit (before armor) as pips. */
function rawHitPips(player: PlayerEntity, raw: number): number {
  return (raw / Math.max(1, player.hasHealth.maxHp)) * SQUIRE_RESOLVE.rawHitPipsPerMaxHp;
}

/** Rot-Eater: a DoT tick on a Squire fills Resolve as if it were a hit. */
export function squireDotTickFill(world: World, player: PlayerEntity, hpDamage: number): void {
  const r = player.usesCooldown ? squireRulesOf(world, player) : null;
  if (!r || r.trophy?.id !== 'squire-relic-swamp' || hpDamage <= 0) return;
  addResolve(world, player, rawHitPips(player, hpDamage) * trophyParams(r, r.trophy).dotFillMult);
}

/** The pressure trickle: every enemy engaged with you, hit or not; a boss counts as several. */
function trickle(world: World, player: PlayerEntity, dt: number): void {
  let enemies = 0;
  for (const monster of world.aggroedMonsters) {
    if (monster.hasAggroTarget.targetKind !== 'player' || monster.hasAggroTarget.targetId !== player.isPlayer.id) continue;
    enemies += monster.isMonster.isBoss ? SQUIRE_RESOLVE.bossCountsAs : 1;
  }
  if (enemies > 0) addResolve(world, player, enemies * SQUIRE_RESOLVE.trickleEnemyPipsPerSec * (dt / 1000));
}

// ── Responses ────────────────────────────────────────────────────────────────

type Outcome = 'landed' | 'wasted' | 'braced' | 'none';

type ResponseHandler = (world: World, player: PlayerEntity, p: Record<string, number>, now: number) => Outcome;

const RESPONSES: Readonly<Record<string, ResponseHandler>> = {
  // Three or more enemies on you: shove them all back a step. Lands if it moves enough.
  'squire-shove': (world, player, p) => {
    const at = player.hasPosition.current;
    const passives = player.usesSkills.passives;
    const weaken = passives['squire.shove-weaken-pct'] ?? 0;
    const weakenTicks = ((passives['squire.shove-weaken-ms'] ?? 0) / 1000) * TICKS_PER_SEC;
    let moved = 0;
    for (const monster of playerAoeTargets(world, player, at, p.radius)) {
      if (monster.isRooted || monster.isMonster.isBoss) continue;
      applyKnockback(world, monster.isMonster.id, at, p.distance);
      // Rampart: the shoved enemy deals this Squire less damage for a few seconds.
      if (weaken > 0) {
        setCounter(monster.tracksCombat, RAMPART_UNTIL + player.isPlayer.id, world.tickCounter + weakenTicks);
        setCounter(monster.tracksCombat, RAMPART_PCT + player.isPlayer.id, weaken);
      }
      moved++;
    }
    if (moved < p.minMoved) return 'wasted';
    // Breather: a landed Shove heals a little per enemy shoved.
    const heal = player.hasHealth.maxHp * (passives['squire.shove-heal-pct'] ?? 0) * moved;
    if (heal > 0) applyHealToPlayer(player, player.tracksCombat, heal, world);
    return 'landed';
  },
  // The third hit in a row from one enemy: strike it back at once (a full swing).
  'squire-riposte': (world, player, p) => {
    const cs = player.tracksCombat;
    const attacker = world.getMonsterEntity(getString(cs, REPEAT_BY_KEY) ?? '');
    setCounter(cs, REPEAT_COUNT_KEY, 0);
    if (!attacker || attacker.hasHealth.hp <= 0) return 'none';
    // Counterbalance: after a Riposte, Recovery is multiplied for a few seconds.
    activateRecoveryBoost(cs, player.usesSkills.passives['squire.recovery-riposte-x'] ?? 0);
    const counter = 1 + (player.usesSkills.passives['squire.counter-damage-pct'] ?? 0);
    applyPlayerAoeTo(world, player, [attacker], player.dealsDamage.attack * p.damagePct * counter, 'player', {}, { feedsWeaponReservoir: true });
    return 'landed';
  },
  // A poison or bleed landed: shake it off (the one with the most time left).
  'squire-steel-will': (world, player) => {
    const cs = player.tracksCombat;
    let longest: (typeof cs.statusEffects)[number] | undefined;
    for (const effect of cs.statusEffects) {
      if (!isMonsterDotStatusEffectId(effect.id) || effect.remainingMs <= 0) continue;
      if (!longest || effect.remainingMs > longest.remainingMs) longest = effect;
    }
    if (!longest) return 'wasted';
    // Purifying Breath: heal part of the damage it still had to deal.
    const healPct = player.usesSkills.passives['squire.cleanse-heal-pct'] ?? 0;
    if (healPct > 0) {
      const ticksLeft = Math.ceil(longest.remainingMs / Math.max(1, longest.data['tickIntervalMs'] ?? 1000));
      const owed = (longest.data['damagePerStack'] ?? 0) * Math.max(1, longest.stacks) * ticksLeft;
      if (owed > 0) applyHealToPlayer(player, cs, owed * healPct, world);
    }
    removeStatusEffect(cs, longest.id);
    return 'landed';
  },
  // A telegraphed blow aimed at you: brace until it lands. The catch refunds (onDamageTaken).
  'squire-guard': (world, player, p, now) => {
    let endsAt = now;
    for (const monster of world.aggroedMonsters) {
      if (monster.hasAggroTarget.targetKind !== 'player' || monster.hasAggroTarget.targetId !== player.isPlayer.id) continue;
      for (const threat of guardableThreatsFor(world, monster, now)) {
        if (threat.targetId === player.isPlayer.id) endsAt = Math.max(endsAt, threat.completesAtMs);
      }
    }
    const windowMs = Math.min(p.maxWindowMs, Math.max(0, endsAt - now) + 500);
    // Planted: while braced, knockback and stuns don't move you.
    const steadfast = (player.usesSkills.passives['squire.guard-steadfast'] ?? 0) > 0;
    applyStatusEffect(player.tracksCombat, {
      id: SQUIRE_GUARD_EFFECT_ID,
      maxStacks: 1,
      remainingMs: windowMs,
      refreshable: true,
      sourceId: player.isPlayer.id,
      data: { cut: p.cut, refund: p.refund, totalMs: windowMs, knockbackResistPct: steadfast ? 1 : 0 },
    });
    if (steadfast) {
      applyStatusEffect(player.tracksCombat, {
        id: ABILITY_UNYIELDING_EFFECT_ID,
        maxStacks: 1,
        remainingMs: windowMs,
        refreshable: true,
        sourceId: player.isPlayer.id,
        data: { totalMs: windowMs },
      });
    }
    return 'braced';
  },
  // The enemy you fight winds up: bash it; the stun interrupts the cast. A boss pattern's
  // step can't be interrupted, and the bash is wasted on it.
  'squire-shield-bash': (world, player, p, now) => {
    for (const monster of world.aggroedMonsters) {
      if (monster.hasAggroTarget.targetKind !== 'player' || monster.hasAggroTarget.targetId !== player.isPlayer.id) continue;
      const threats = guardableThreatsFor(world, monster, now);
      if (threats.length === 0) continue;
      if (threats.some((t) => t.source === 'boss-pattern')) return 'wasted';
      const stunMs = p.stunMs * (1 + (player.usesSkills.passives['squire.bash-stun-pct'] ?? 0));
      if (!applyStun(monster.tracksCombat, stunMs, player.isPlayer.id)) return 'wasted';
      abortMonsterCast(world, monster);
      return 'landed';
    }
    return 'none';
  },
};

/** What a response costs this player (Iron Gut, Tower Shield cut some). */
function costOf(player: PlayerEntity, piece: SquirePiece, p: Record<string, number>): number {
  const passives = player.usesSkills.passives;
  const cut = piece.id === 'squire-steel-will' ? passives['squire.steel-will-cost-cut-pct'] ?? 0
    : piece.id === 'squire-shield-bash' ? passives['squire.bash-cost-cut-pct'] ?? 0
    : 0;
  return p.cost * Math.max(0, 1 - cut);
}

function classState(player: PlayerEntity) {
  return (condition: ConditionRef): boolean =>
    condition.id === 'resolve-at-least' && (player.usesCooldown?.resolve ?? 0) >= (condition.param ?? 0);
}

/** Answer every moment a rule is waiting for, in the rules' order. */
function runResponses(world: World, player: PlayerEntity, r: Rules, now: number): void {
  const cs = player.tracksCombat;
  for (const rule of r.config.rules) {
    if (!rule.enabled) continue;
    const piece = PIECES.get(rule.pieceId);
    const handler = piece ? RESPONSES[piece.id] : undefined;
    if (!piece?.answers || !handler) continue;
    if (!momentActive(world, player, piece.answers, undefined, now)) continue;
    // An event is answered once; a state waits out its lockout.
    const eventTick = momentTick(player, piece.answers);
    const p = pieceParams(r, piece);
    if (p.lockoutMs !== undefined) {
      if (now < getCounter(cs, LOCKOUT_PREFIX + piece.id)) continue;
    } else if (eventTick !== undefined && getCounter(cs, HANDLED_PREFIX + piece.id) === eventTick + 1) {
      continue;
    }
    if (!conditionsHold(world, player, rule.conditions, now, classState(player))) continue;
    const cost = costOf(player, piece, p);
    if ((player.usesCooldown?.resolve ?? 0) < cost) continue;
    const outcome = handler(world, player, p, now);
    if (eventTick !== undefined) setCounter(cs, HANDLED_PREFIX + piece.id, eventTick + 1);
    if (outcome === 'none') continue;
    if (p.lockoutMs !== undefined) setCounter(cs, LOCKOUT_PREFIX + piece.id, now + p.lockoutMs);
    addResolve(world, player, -cost);
    if (outcome === 'landed') addResolve(world, player, p.refund);
  }
}

// ── The slam ─────────────────────────────────────────────────────────────────

function slamThreshold(r: Rules, max: number): number {
  return r.trophy?.id === 'squire-relic-forest' ? max * trophyParams(r, r.trophy).barShare : max;
}

/** Arm the slam once the bar is full, unless the slam rule holds it. */
function armSlam(world: World, player: PlayerEntity, r: Rules, now: number): void {
  const cd = player.usesCooldown!;
  if (isEmpoweredAttack(player) || cd.resolveMax <= 0) return;
  if (cd.resolve + 1e-9 < slamThreshold(r, cd.resolveMax)) return;
  if (r.config.holdSlam.length > 0 && conditionsHold(world, player, r.config.holdSlam, now, classState(player))) return;
  setEmpoweredAttack(world, player);
}

/** The slam landed: size it, splash it, apply the trophy, spend the bar. */
function onSquireSlam(ctx: CombatContext, world: World): void {
  if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
  if (!ctx.metadata['empoweredAttack']) return;
  const player = ctx.attacker;
  const r = player.usesCooldown ? squireRulesOf(world, player) : null;
  if (!r) return;
  const cs = player.tracksCombat;
  const now = attackNow(ctx);
  const slam = PIECES.get('squire-slam')!;
  const sp = pieceParams(r, slam);
  const passives = player.usesSkills.passives;
  // The empowered multiplier already sized it at EXECUTION_MULTIPLIER; the kit's number rules.
  let mult = (sp.mult / EXECUTION_MULTIPLIER) * (1 + (passives['squire.slam-damage-pct'] ?? 0));
  if (r.trophy?.id === 'squire-relic-forest') {
    // Relentless: a third the size, each slam soon after the last a bit bigger.
    const tp = trophyParams(r, r.trophy);
    const chain = now - getCounter(cs, LAST_SLAM_AT) <= tp.chainMs
      ? Math.min(tp.chainMax / Math.max(1e-9, tp.chainPct), getCounter(cs, SLAM_CHAIN) + 1)
      : 0;
    setCounter(cs, SLAM_CHAIN, chain);
    mult *= tp.sizePct * (1 + tp.chainPct * chain);
  }
  // Warhammer: a slam soon after a caught telegraph hits much harder.
  const caughtWindow = ((passives['squire.slam-after-guard-ms'] ?? 0) / 1000) * TICKS_PER_SEC;
  const caughtAt = getCounter(cs, LAST_CAUGHT_TICK);
  if (caughtAt > 0 && world.tickCounter + 1 - caughtAt <= caughtWindow) {
    mult *= 1 + (passives['squire.slam-after-guard-pct'] ?? 0);
  }
  ctx.damage = Math.max(1, Math.round(ctx.damage * mult));
  setCounter(cs, LAST_SLAM_AT, now);

  // Everything around you takes the same blow (Faultline: a line through the target instead).
  const radius = sp.radius * (1 + (passives['squire.slam-radius-pct'] ?? 0));
  let struck: MonsterEntity[];
  if (r.trophy?.id === 'squire-relic-mountain') {
    struck = lineTargets(world, player, ctx.defender, trophyParams(r, r.trophy));
    applyPlayerAoeTo(world, player, struck, ctx.damage, 'player', {}, { feedsWeaponReservoir: true });
  } else {
    struck = applyPlayerAoe(world, player, player.hasPosition.current, radius, ctx.damage,
      ctx.defender.isMonster.id, 'player', {}, { feedsWeaponReservoir: true });
  }

  // Spiked Flail: the slam leaves a bleed on everything it hits.
  const bleedPct = passives['squire.slam-bleed-pct'] ?? 0;
  if (bleedPct > 0) {
    for (const monster of [ctx.defender, ...struck]) {
      const bleed = applyPlayerDebuff(player, monster.tracksCombat, {
        id: CADENCE_BLEED_ID,
        instanced: false,
        remainingMs: -1,
        sourceId: player.isPlayer.id,
        data: { damagePerTick: Math.max(1, Math.round((ctx.damage * bleedPct) / 4)), nextTickIn: 1000, tickIntervalMs: 1000 },
      }, { origin: 'mechanic' });
      bleed.stacks = 4; // one stack per remaining tick
      attachMarker(world, monster, 'hasHemorrhage');
    }
  }

  // Corrode: every slam strips more plating from everything it hits.
  if (r.trophy?.id === 'squire-relic-cave') {
    const tp = trophyParams(r, r.trophy);
    for (const monster of [ctx.defender, ...struck]) {
      applyPlayerDebuff(player, monster.tracksCombat, {
        id: 'plating-shred',
        maxStacks: tp.maxStacks,
        remainingMs: tp.durationMs,
        refreshable: true,
        sourceId: player.isPlayer.id,
        data: { platingReduction: tp.platingPerSlam, totalMs: tp.durationMs },
      }, { origin: 'mechanic' });
    }
  }

  // The slam spends the bar (Relentless spends the third it fired at).
  const cd = player.usesCooldown!;
  addResolve(world, player, -(r.trophy?.id === 'squire-relic-forest' ? slamThreshold(r, cd.resolveMax) : cd.resolve));
}

/** Faultline's line: from you through the target, everything within `width` of it. */
function lineTargets(world: World, player: PlayerEntity, target: MonsterEntity, p: Record<string, number>): MonsterEntity[] {
  const from = player.hasPosition.current;
  const to = target.hasPosition.current;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / len;
  const uy = dy / len;
  return playerAoeTargets(world, player, from, p.length, target.isMonster.id).filter((m) => {
    const rx = m.hasPosition.current.x - from.x;
    const ry = m.hasPosition.current.y - from.y;
    const along = rx * ux + ry * uy;
    const across = Math.abs(rx * uy - ry * ux);
    return along >= 0 && along <= p.length && across <= p.width;
  });
}

// ── The pipeline and the tick ────────────────────────────────────────────────

/** Register the Squire's listeners: Resolve from hits, the Guard's catch, the slam. */
export function initSquire(): void {
  // A landed hit fills Resolve by its raw size (a full dodge doesn't).
  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    if (!player.usesCooldown || !squireRulesOf(world, player)) return;
    // A full dodge fills nothing, unless Turn Aside says it fills as if it had landed.
    if (ctx.metadata['evadeFull'] === true && !((player.usesSkills.passives['squire.dodge-fills'] ?? 0) > 0)) return;
    const raw = Number(ctx.metadata['incomingGross'] ?? ctx.damage);
    if (raw > 0) addResolve(world, player, rawHitPips(player, raw));
  });

  // Guard: a braced Squire catches the telegraphed blow: it deals much less, and refunds.
  // Registered with the class mechanics, so it lands before the damage cap and shields.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    const brace = getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
    if (!brace || brace.remainingMs === 0) return;
    // Guards catch telegraphs and big hits only; chip damage always lands (§8.3, rule 3).
    const telegraphed = ctx.metadata['empoweredAttack'] === true || typeof ctx.metadata['abilityName'] === 'string';
    if (!telegraphed) return;
    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - (brace.data['cut'] ?? 0))));
    ctx.metadata['squireGuarded'] = true;
    removeStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
    if ((brace.data['knockbackResistPct'] ?? 0) > 0) removeStatusEffect(player.tracksCombat, ABILITY_UNYIELDING_EFFECT_ID);
    setCounter(player.tracksCombat, LAST_CAUGHT_TICK, world.tickCounter + 1);
    // Stone Patience: after a caught telegraph, Recovery is multiplied for a few seconds.
    activateRecoveryBoost(player.tracksCombat, player.usesSkills.passives['squire.recovery-caught-x'] ?? 0);
    addResolve(world, player, brace.data['refund'] ?? 0);
  });

  // Rampart: an enemy you shoved deals you less damage for a few seconds.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const id = ctx.defender.isPlayer.id;
    const monsterCs = ctx.attacker.tracksCombat;
    if (world.tickCounter >= getCounter(monsterCs, RAMPART_UNTIL + id)) return;
    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - getCounter(monsterCs, RAMPART_PCT + id))));
  });

  registerCombatListener('onHit', onSquireSlam);
}

/** Reforged: corrosion stripped from you fills Resolve, and comes back off over time. */
function reforged(world: World, player: PlayerEntity, dt: number): void {
  const passives = player.usesSkills.passives;
  const regrowMs = passives['squire.shred-regrow-ms'] ?? 0;
  const fill = passives['squire.shred-fill-pips'] ?? 0;
  if (regrowMs <= 0 && fill <= 0) return;
  const cs = player.tracksCombat;
  const shred = getStatusEffect(cs, 'plating-shred');
  const stacks = shred?.stacks ?? 0;
  const last = getCounter(cs, SHRED_LAST);
  if (stacks > last && fill > 0) addResolve(world, player, (stacks - last) * fill);
  if (shred && regrowMs > 0) {
    const elapsed = getCounter(cs, SHRED_REGROW) + dt;
    if (elapsed >= regrowMs) {
      setCounter(cs, SHRED_REGROW, elapsed - regrowMs);
      shred.stacks -= 1;
      if (shred.stacks <= 0) removeStatusEffect(cs, 'plating-shred');
    } else {
      setCounter(cs, SHRED_REGROW, elapsed);
    }
  }
  setCounter(cs, SHRED_LAST, getStatusEffect(cs, 'plating-shred')?.stacks ?? 0);
}

/** Each tick: the bar's size, Muster, the trickle, the responses, then the slam. */
export function updateSquire(world: World, dt: number, now: number): boolean {
  let any = false;
  for (const player of world.cooldownPlayers) {
    const r = squireRulesOf(world, player);
    if (!r) continue;
    any = true;
    const cd = player.usesCooldown;
    if (cd.resolveMax !== r.ctx.budget) {
      cd.resolveMax = r.ctx.budget;
      addResolve(world, player, 0);
      cd.resolve = Math.min(cd.resolve, cd.resolveMax);
      markSliceDirty(world, player, 'usesCooldown');
    }
    // Muster: every enemy joining the fight fills a chunk.
    if (r.trophy?.id === 'squire-relic-plains') {
      const joined = momentTick(player, 'enemy-joins');
      const key = HANDLED_PREFIX + 'muster';
      if (joined !== undefined && getCounter(player.tracksCombat, key) !== joined + 1 && joined >= world.tickCounter - 1) {
        setCounter(player.tracksCombat, key, joined + 1);
        addResolve(world, player, trophyParams(r, r.trophy).fillPerEnemy * Math.max(1, momentValue(player, 'enemy-joins')));
      }
    }
    trickle(world, player, dt);
    reforged(world, player, dt);
    runResponses(world, player, r, now);
    armSlam(world, player, r, now);
  }
  return any;
}
