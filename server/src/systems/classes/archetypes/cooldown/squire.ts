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
  navigationBodyHalfExtents,
  pieceParamsAt,
  PLATING_SHRED_EFFECT_ID,
  removeStatusEffect,
  applyStatusEffect,
  setCounter,
  setString,
  SQUIRE_KIT,
  SQUIRE_RESOLVE,
  trophyParamsAt,
  type ClassConfigContext,
  type MomentId,
  type ConditionRef,
  type ResponsesConfig,
  type SquirePiece,
  type SquireTrophy,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { attachMarker, detachComponent } from '../../../../ecs/markerHelpers';
import type { World } from '../../../../world/World';
import { applyPlayerAoe, applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { applyKnockback } from '../../../combat/damage/knockback';
import { guardableThreatsFor } from '../../../combat/ai/guardableThreats';
import { setAggroTarget } from '../../../combat/ai/targeting';
import { telegraphsContainingPlayer } from '../../../combat/ai/telegraphEvasion';
import { attackNow, registerCombatListener, type CombatContext } from '../../../combat/engine/combatPipeline';
import { abortMonsterCast, runPlayerAttack } from '../../../combat/engine/combat';
import { HOLD_EMPOWERED_ATTACK, isEmpoweredAttack, setEmpoweredAttack } from '../../../combat/engine/empoweredAttacks';
import { isChargeAoePlanted } from '../../../combat/engine/monsterMechanics';
import { isConcealedEntity } from '../../../combat/invulnerability';
import { conditionsHold, momentActive, momentTick, momentValue } from '../../../combat/moments/moments';
import { applyMonsterRoot } from '../../../combat/status/monsterControl';
import { syncPlayerControlLockout } from '../../../combat/status/playerControlLockout';
import { PLAYER_HARD_CONTROL_EFFECTS, PLAYER_ROOT_EFFECTS } from '../../../combat/status/playerHardControl';
import { applyStun } from '../../../combat/status/stun';
import { resolveObstaclesForNode } from '../../../world/nodeFeatures';
import { stopEntity } from '../../../world/movement';
import { classConfigContextOf } from '../../../player/progression/classConfig';
import { applyPlayerDebuff } from '../../shared/applyPlayerDebuff';
import { CADENCE_BLEED_ID } from '../../../combat/damage/bleedIds';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import { activateRecoveryBoost } from '../../../defense/regen/recovery';
import { EXECUTION_MULTIPLIER } from './cooldownPrototype';

/** The brace a Guard puts up, until the blow it was raised for lands. */
export const SQUIRE_GUARD_EFFECT_ID = 'squire-guard';
/** The brace a Parry puts up: the blow is negated and countered (Avenger, §8.5). */
export const SQUIRE_PARRY_EFFECT_ID = 'squire-parry';

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
const PARRY_BY = 'squire.parry.by';         // the monster a Parry was raised against
const AMBUSH_HANDLED = HANDLED_PREFIX + 'ambush-hit';
const THROW_NEXT_AT = 'squire.throw.nextAt';
/** World ticks per second (the logic rate), for windows kept in ticks. */
const TICKS_PER_SEC = 10;
/** Anything reaching further than this is a shooter, not something in contact (as the fight snapshot). */
const MELEE_MAX_REACH = 100;
/** An ally this low on HP counts as threatened (as the fight snapshot). PLACEHOLDER. */
const ALLY_LOW_HP = 0.3;
/** How close to you a pulled enemy lands, px (Challenge, Earthstamp, Strangler Vine, the Glaive's hook). */
const PULL_GAP_PX = 70;
/** How long Unflinching holds off hard control after an ambush hit. PLACEHOLDER. */
const UNFLINCHING_MS = 1500;

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

/** The T2 pick's numbers (§8.5), once made. */
function disciplineOf(r: Rules): { id: string; p: Readonly<Record<string, number>> } | undefined {
  const discipline = SQUIRE_KIT.disciplines.find((d) => d.id === r.ctx.disciplineId);
  return discipline ? { id: discipline.id, p: discipline.params } : undefined;
}

/** A landed answer's fill: the Avenger's answers fill much more (§8.5). */
function answerFill(world: World, player: PlayerEntity, r: Rules, pips: number): void {
  addResolve(world, player, pips * (disciplineOf(r)?.p['answerFillMult'] ?? 1));
}

/** The enemies fighting this player right now. */
function engagedWith(world: World, player: PlayerEntity): MonsterEntity[] {
  const out: MonsterEntity[] = [];
  for (const monster of world.aggroedMonsters) {
    if (monster.hasAggroTarget.targetKind === 'player' && monster.hasAggroTarget.targetId === player.isPlayer.id) out.push(monster);
  }
  return out;
}

function attackTargetOf(world: World, player: PlayerEntity): MonsterEntity | undefined {
  const id = player.hasAttackTarget?.targetId;
  const monster = id ? world.getMonsterEntity(id) : undefined;
  return monster && monster.hasHealth.hp > 0 ? monster : undefined;
}

/** Whether the player owns the piece and its rule is on with its extra conditions holding. */
function ruleActive(world: World, player: PlayerEntity, r: Rules, pieceId: string, now: number): boolean {
  if (!r.ctx.pieceRanks.has(pieceId)) return false;
  const rule = r.config.rules.find((candidate) => candidate.pieceId === pieceId);
  return !!rule?.enabled && conditionsHold(world, player, rule.conditions, now, classState(player));
}

/**
 * Pull a monster to just in front of the player, through the same obstacle resolution as any
 * forced move. False if it was already that close.
 */
function pullToPlayer(world: World, monster: MonsterEntity, player: PlayerEntity, gap = PULL_GAP_PX): boolean {
  const from = monster.hasPosition.current;
  const to = player.hasPosition.current;
  const dist = Math.hypot(from.x - to.x, from.y - to.y);
  if (dist <= gap) return false;
  const landing = { x: to.x + ((from.x - to.x) / dist) * gap, y: to.y + ((from.y - to.y) / dist) * gap };
  monster.hasPosition.current = resolveObstaclesForNode(
    world, monster.hasPosition.nodeId, from, landing, 'monster', navigationBodyHalfExtents('monster'),
  );
  markSliceDirty(world, monster, 'hasPosition');
  stopEntity(world, monster);
  return true;
}

/** The Avenger's counter after a landed answer: a quick strike at the target, paid from Resolve (§8.5). */
function avengerCounter(world: World, player: PlayerEntity, r: Rules): void {
  const discipline = disciplineOf(r);
  if (discipline?.id !== 'squire-avenger') return;
  const cost = discipline.p['counterCost'] ?? 0;
  const target = attackTargetOf(world, player) ?? engagedWith(world, player)[0];
  if (!target || (player.usesCooldown?.resolve ?? 0) < cost) return;
  const bonus = 1 + (player.usesSkills.passives['squire.counter-damage-pct'] ?? 0);
  applyPlayerAoeTo(world, player, [target], player.dealsDamage.attack * (discipline.p['counterPct'] ?? 0) * bonus, 'player', {}, { feedsWeaponReservoir: true });
  addResolve(world, player, -cost);
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
function trickle(world: World, player: PlayerEntity, r: Rules, dt: number): void {
  let enemies = 0;
  for (const monster of engagedWith(world, player)) {
    enemies += monster.isMonster.isBoss ? SQUIRE_RESOLVE.bossCountsAs : 1;
  }
  // Bulwark: every enemy on you counts more, by its trickle as well as its hits.
  const mult = disciplineOf(r)?.p['trickleMult'] ?? 1;
  if (enemies > 0) addResolve(world, player, enemies * SQUIRE_RESOLVE.trickleEnemyPipsPerSec * mult * (dt / 1000));
}

/** Juggernaut: a steady fill from your armor and max HP, hit or not (§8.5). */
function steadyFill(world: World, player: PlayerEntity, r: Rules, dt: number): void {
  const discipline = disciplineOf(r);
  if (discipline?.id !== 'squire-juggernaut') return;
  const { steadyBasePips = 0, steadyPerPlating = 0, steadyPerMaxHp = 0 } = discipline.p;
  const perSec = steadyBasePips + player.mitigatesDamage.plating * steadyPerPlating + player.hasHealth.maxHp * steadyPerMaxHp;
  addResolve(world, player, perSec * (dt / 1000));
}

// ── Responses ────────────────────────────────────────────────────────────────

type Outcome = 'landed' | 'wasted' | 'braced' | 'none';

type ResponseHandler = (world: World, player: PlayerEntity, p: Record<string, number>, now: number, rank: number) => Outcome;

/** Extra moments a response also answers at a rank (Steel Will II: corrosion and slows land as debuffs). */
const EXTRA_TRIGGERS: Readonly<Record<string, (rank: number) => readonly MomentId[]>> = {
  'squire-steel-will': (rank) => (rank >= 2 ? ['debuff-landed'] : []),
};

/** Rules that go first when they share a moment: Parry is the stronger form of Guard. PLACEHOLDER. */
const RESPONSE_PRIORITY: Readonly<Record<string, number>> = { 'squire-parry': -1 };

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
  'squire-steel-will': (world, player, _p, _now, rank) => {
    const cs = player.tracksCombat;
    let longest: (typeof cs.statusEffects)[number] | undefined;
    for (const effect of cs.statusEffects) {
      if (!isMonsterDotStatusEffectId(effect.id) || effect.remainingMs <= 0) continue;
      if (!longest || effect.remainingMs > longest.remainingMs) longest = effect;
    }
    // Steel Will II: corrosion and slows are shaken off as well.
    let shaken = false;
    if (rank >= 2) {
      for (const id of [PLATING_SHRED_EFFECT_ID, 'slow']) {
        if (getStatusEffect(cs, id)) { removeStatusEffect(cs, id); shaken = true; }
      }
    }
    if (!longest) return shaken ? 'landed' : 'wasted';
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
    // A Parry already answers this blow.
    if ((getStatusEffect(player.tracksCombat, SQUIRE_PARRY_EFFECT_ID)?.remainingMs ?? 0) !== 0) return 'none';
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

  // ── Tier 2 (§8.16) ──
  // A charge at you: it stops dead and the charger staggers.
  'squire-stand-fast': (world, player, p) => {
    let stopped = 0;
    for (const monster of engagedWith(world, player)) {
      if ((monster.controlsMonster.chargeRemainingMs ?? 0) <= 0) continue;
      monster.controlsMonster.chargeRemainingMs = 0;
      stopEntity(world, monster);
      applyStun(monster.tracksCombat, p.staggerMs, player.isPlayer.id);
      stopped++;
    }
    return stopped > 0 ? 'landed' : 'wasted';
  },
  // A stun, root or knockdown on you: break free of it.
  'squire-unshaken': (world, player) => {
    const cs = player.tracksCombat;
    const held = [...PLAYER_HARD_CONTROL_EFFECTS, ...PLAYER_ROOT_EFFECTS].filter((id) => (getStatusEffect(cs, id)?.remainingMs ?? 0) !== 0);
    if (held.length === 0) return 'wasted';
    for (const id of held) removeStatusEffect(cs, id);
    // The stun owns the root and the attack lock; re-sync so you are free this tick.
    syncPlayerControlLockout(world, player);
    return 'landed';
  },
  // The target raised a barrier: a blow that hits barriers double (the onHit listener sizes it).
  'squire-splitting-blow': (world, player, p, now) => {
    const target = attackTargetOf(world, player);
    if (!target || (target.hasStatus.enemyBarrier?.amount ?? 0) <= 0) return 'wasted';
    runPlayerAttack(world, player, target, now, {
      attackOrigin: player.hasPosition.current,
      aggroSource: { id: player.isPlayer.id, kind: 'player' },
      metadata: { [HOLD_EMPOWERED_ATTACK]: true, squireSplitting: p.barrierMult, squireBreakBarrier: p.breakBarrier },
    });
    return 'landed';
  },
  // A burrow or unseen dash at you: it surfaces at your feet, staggered.
  'squire-earthstamp': (world, player, p) => {
    let surfaced = 0;
    for (const monster of engagedWith(world, player)) {
      if (monster.isConcealed === undefined) continue;
      detachComponent(world, monster, 'isConcealed');
      pullToPlayer(world, monster, player);
      applyStun(monster.tracksCombat, p.staggerMs, player.isPlayer.id);
      surfaced++;
    }
    if (surfaced === 0) return 'wasted';
    // II: the stamp knocks down everything around it.
    if (p.knockdownRadius > 0) {
      for (const monster of playerAoeTargets(world, player, player.hasPosition.current, p.knockdownRadius)) {
        applyStun(monster.tracksCombat, p.knockdownMs, player.isPlayer.id);
      }
    }
    return 'landed';
  },
  // A ranged or kiting enemy: pulled onto you (II: it can't move away for a moment).
  'squire-challenge': (world, player, p) => {
    const at = player.hasPosition.current;
    let pulled = 0;
    for (const monster of engagedWith(world, player)) {
      if (pulled >= p.maxPulled) break;
      if ((monster.performsAttack?.attackRange ?? 0) <= MELEE_MAX_REACH) continue;
      if (Math.hypot(monster.hasPosition.current.x - at.x, monster.hasPosition.current.y - at.y) > p.range) continue;
      if (!pullToPlayer(world, monster, player)) continue;
      if (p.rootMs > 0) applyMonsterRoot(world, monster, p.rootMs, player.isPlayer.id);
      pulled++;
    }
    if (pulled === 0) return 'wasted';
    // Called Out: each enemy pulled heals a little.
    const heal = player.hasHealth.maxHp * (player.usesSkills.passives['squire.challenge-heal-pct'] ?? 0) * pulled;
    if (heal > 0) applyHealToPlayer(player, player.tracksCombat, heal, world);
    return 'landed';
  },
  // Avenger: a telegraphed melee blow at you is negated and countered (the onDamageTaken listener).
  // Fails on ground telegraphs and ranged shots, and then leaves the blow to Guard.
  'squire-parry': (world, player, p, now) => {
    const cs = player.tracksCombat;
    let by: MonsterEntity | undefined;
    let endsAt = now;
    for (const monster of engagedWith(world, player)) {
      if ((monster.performsAttack?.attackRange ?? 0) > MELEE_MAX_REACH) continue;
      for (const threat of guardableThreatsFor(world, monster, now)) {
        if (threat.targetId !== player.isPlayer.id || threat.zoneId || isChargeAoePlanted(monster)) continue;
        by = monster;
        endsAt = Math.max(endsAt, threat.completesAtMs);
      }
    }
    if (!by) return 'none';
    const windowMs = Math.min(p.maxWindowMs, Math.max(0, endsAt - now) + 500);
    setString(cs, PARRY_BY, by.isMonster.id);
    applyStatusEffect(cs, {
      id: SQUIRE_PARRY_EFFECT_ID,
      maxStacks: 1,
      remainingMs: windowMs,
      refreshable: true,
      sourceId: player.isPlayer.id,
      data: { cut: p.cut, refund: p.refund, counterPct: p.counterPct, totalMs: windowMs },
    });
    return 'braced';
  },
  // Bulwark: an ally under a telegraph or low on HP. STAND-IN for stepping in front: the enemies
  // on the ally turn on you and you brace for their blow.
  'squire-intercept': (world, player, p, now) => {
    const members = new Set(player.inParty?.members.map((member) => member.id) ?? []);
    const at = player.hasPosition.current;
    let taken = 0;
    for (const ally of world.livePlayers) {
      if (ally === player || !members.has(ally.isPlayer.id) || ally.hasPosition.nodeId !== player.hasPosition.nodeId) continue;
      const threatened = ally.hasHealth.hp / Math.max(1, ally.hasHealth.maxHp) < ALLY_LOW_HP
        || telegraphsContainingPlayer(world, ally, now).length > 0;
      if (!threatened) continue;
      for (const monster of world.aggroedMonsters) {
        if (monster.hasAggroTarget.targetKind !== 'player' || monster.hasAggroTarget.targetId !== ally.isPlayer.id) continue;
        if (Math.hypot(monster.hasPosition.current.x - at.x, monster.hasPosition.current.y - at.y) > p.radius) continue;
        setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, now);
        taken++;
      }
    }
    if (taken === 0) return 'wasted';
    // The brace catches the blow like a Guard and refunds when it does.
    applyStatusEffect(player.tracksCombat, {
      id: SQUIRE_GUARD_EFFECT_ID,
      maxStacks: 1,
      remainingMs: p.windowMs,
      refreshable: true,
      sourceId: player.isPlayer.id,
      data: { cut: p.cut, refund: p.refund, totalMs: p.windowMs, knockbackResistPct: 0 },
    });
    return 'braced';
  },
  // Every Squire, at low HP: the whole bar is spent to heal.
  'squire-last-breath': (world, player, p) => {
    const resolve = player.usesCooldown?.resolve ?? 0;
    if (resolve < p.minPips) return 'none';
    addResolve(world, player, -resolve);
    applyHealToPlayer(player, player.tracksCombat, player.hasHealth.maxHp * p.healPctPerPip * resolve, world);
    return 'braced';
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
  const rules = [...r.config.rules].sort((a, b) => (RESPONSE_PRIORITY[a.pieceId] ?? 0) - (RESPONSE_PRIORITY[b.pieceId] ?? 0));
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const piece = PIECES.get(rule.pieceId);
    const handler = piece ? RESPONSES[piece.id] : undefined;
    if (!piece?.answers || !handler) continue;
    const rank = r.ctx.pieceRanks.get(piece.id) ?? 1;
    const moments = [piece.answers, ...(EXTRA_TRIGGERS[piece.id]?.(rank) ?? [])]
      .filter((moment) => momentActive(world, player, moment, undefined, now));
    if (moments.length === 0) continue;
    // An event is answered once; a state waits out its lockout.
    const ticks = moments.map((moment) => momentTick(player, moment)).filter((tick): tick is number => tick !== undefined);
    const eventTick = ticks.length > 0 ? Math.max(...ticks) : undefined;
    const p = pieceParams(r, piece);
    if (p.lockoutMs !== undefined) {
      if (now < getCounter(cs, LOCKOUT_PREFIX + piece.id)) continue;
    } else if (eventTick !== undefined && getCounter(cs, HANDLED_PREFIX + piece.id) === eventTick + 1) {
      continue;
    }
    if (!conditionsHold(world, player, rule.conditions, now, classState(player))) continue;
    const cost = costOf(player, piece, p);
    if ((player.usesCooldown?.resolve ?? 0) < cost) continue;
    const outcome = handler(world, player, p, now, rank);
    if (eventTick !== undefined) setCounter(cs, HANDLED_PREFIX + piece.id, eventTick + 1);
    if (outcome === 'none') continue;
    if (p.lockoutMs !== undefined) setCounter(cs, LOCKOUT_PREFIX + piece.id, now + p.lockoutMs);
    addResolve(world, player, -cost);
    if (outcome === 'landed') {
      answerFill(world, player, r, p.refund);
      avengerCounter(world, player, r);
    }
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
  if (cd.resolve + 1e-9 < slamThreshold(r, cd.resolveMax) && !executionerReady(world, player, r)) return;
  if (r.config.holdSlam.length > 0 && conditionsHold(world, player, r.config.holdSlam, now, classState(player))) return;
  setEmpoweredAttack(world, player);
}

/** Executioner's Oath: the slam may fire early, with what Resolve you have, on a target low on HP. */
function executionerReady(world: World, player: PlayerEntity, r: Rules): boolean {
  if (r.trophy?.id !== 'squire-relic-desert') return false;
  const tp = trophyParams(r, r.trophy);
  if ((player.usesCooldown?.resolve ?? 0) < tp.minPips) return false;
  const target = attackTargetOf(world, player);
  return !!target && target.hasHealth.hp / Math.max(1, target.hasHealth.maxHp) < tp.hpShare;
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
  const discipline = disciplineOf(r);
  // Juggernaut: one huge slam, the class's biggest hit.
  if (discipline?.id === 'squire-juggernaut') mult *= discipline.p['slamMult'] ?? 1;
  // Faultline II: the shockwave hits a raised barrier twice as hard.
  if (r.trophy?.id === 'squire-relic-mountain' && (ctx.defender.hasStatus.enemyBarrier?.amount ?? 0) > 0) {
    mult *= trophyParams(r, r.trophy).barrierMult;
  }
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
  let radius = sp.radius * (1 + (passives['squire.slam-radius-pct'] ?? 0));
  // Bulwark: the circle grows with the enemies on you.
  if (discipline?.id === 'squire-bulwark') {
    radius *= 1 + Math.min(discipline.p['slamRadiusMax'] ?? 0, (discipline.p['slamRadiusPerEnemy'] ?? 0) * engagedWith(world, player).length);
  }
  // Strangler Vine: every enemy in a wide ring, fleeing ones included, is pulled in before it lands.
  if (r.trophy?.id === 'squire-relic-jungle') {
    const ring = trophyParams(r, r.trophy).ringRadius;
    for (const monster of playerAoeTargets(world, player, player.hasPosition.current, ring)) pullToPlayer(world, monster, player, radius * 0.6);
  }
  // Hooked Glaive: fighting enemies that stand outside the ring (fleeing, kiting) are hooked back into it.
  const hook = passives['squire.slam-hook-px'] ?? 0;
  if (hook > 0) {
    const at = player.hasPosition.current;
    for (const monster of engagedWith(world, player)) {
      const dist = Math.hypot(monster.hasPosition.current.x - at.x, monster.hasPosition.current.y - at.y);
      if (dist > radius && dist <= hook) pullToPlayer(world, monster, player, radius * 0.6);
    }
  }
  let struck: MonsterEntity[];
  if (r.trophy?.id === 'squire-relic-mountain') {
    struck = lineTargets(world, player, ctx.defender, trophyParams(r, r.trophy));
    applyPlayerAoeTo(world, player, struck, ctx.damage, 'player', {}, { feedsWeaponReservoir: true });
  } else {
    struck = applyPlayerAoe(world, player, player.hasPosition.current, radius, ctx.damage,
      ctx.defender.isMonster.id, 'player', {}, { feedsWeaponReservoir: true });
  }

  // Bulwark: a slam that holds, everything it hit turns on you.
  if (discipline?.id === 'squire-bulwark') {
    for (const monster of new Set([ctx.defender, ...struck])) {
      if (monster.hasHealth.hp > 0) setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, now);
    }
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
    const r = player.usesCooldown ? squireRulesOf(world, player) : null;
    if (!r) return;
    // A full dodge fills nothing, unless Turn Aside says it fills as if it had landed.
    if (ctx.metadata['evadeFull'] === true && !((player.usesSkills.passives['squire.dodge-fills'] ?? 0) > 0)) return;
    const raw = Number(ctx.metadata['incomingGross'] ?? ctx.damage);
    if (raw <= 0) return;
    // The T2 pick tilts plain hits (Avenger less, Bulwark more, Juggernaut much less), and
    // Arrow Catcher fills extra from shooters.
    let pips = rawHitPips(player, raw) * (disciplineOf(r)?.p['hitFillMult'] ?? 1);
    if ((ctx.attacker.performsAttack?.attackRange ?? 0) > MELEE_MAX_REACH) pips *= player.usesSkills.passives['squire.ranged-fill-x'] || 1;
    addResolve(world, player, pips);
  });

  // The ambush: Unflinching holds off its stun, and Watchful catches its first hit on the shield.
  // Registered before the Guard so a caught ambush isn't braced for twice.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    const r = player.usesCooldown ? squireRulesOf(world, player) : null;
    if (!r) return;
    const cs = player.tracksCombat;
    const ambushTick = momentTick(player, 'ambush');
    if (ambushTick === undefined || ambushTick < world.tickCounter - 1) return;
    // The first hit after the leap.
    if (getCounter(cs, AMBUSH_HANDLED) === ambushTick + 1) return;
    setCounter(cs, AMBUSH_HANDLED, ambushTick + 1);
    if ((player.usesSkills.passives['squire.ambush-steadfast'] ?? 0) > 0) {
      applyStatusEffect(cs, {
        id: ABILITY_UNYIELDING_EFFECT_ID,
        maxStacks: 1,
        remainingMs: UNFLINCHING_MS,
        refreshable: true,
        sourceId: player.isPlayer.id,
        data: { totalMs: UNFLINCHING_MS },
      });
    }
    const now = attackNow(ctx);
    if (!ruleActive(world, player, r, 'squire-watchful', now)) return;
    const p = pieceParams(r, PIECES.get('squire-watchful')!);
    const before = ctx.damage;
    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - p.cut)));
    ctx.metadata['squireGuarded'] = true;
    // Watchman's Ease: the hit it stopped heals you.
    const heal = (before - ctx.damage) * (player.usesSkills.passives['squire.watchful-heal-pct'] ?? 0);
    if (heal > 0) applyHealToPlayer(player, cs, heal, world);
    if (p.staggerMs > 0) applyStun(ctx.attacker.tracksCombat, p.staggerMs, player.isPlayer.id);
    answerFill(world, player, r, p.refund);
    avengerCounter(world, player, r);
  });

  // Parry: a parried blow is negated and struck back at once (Avenger, §8.5).
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    const cs = player.tracksCombat;
    const parry = getStatusEffect(cs, SQUIRE_PARRY_EFFECT_ID);
    if (!parry || parry.remainingMs === 0 || ctx.metadata['squireGuarded']) return;
    const telegraphed = ctx.metadata['empoweredAttack'] === true || typeof ctx.metadata['abilityName'] === 'string';
    if (!telegraphed || getString(cs, PARRY_BY) !== ctx.attacker.isMonster.id) return;
    const r = squireRulesOf(world, player);
    if (!r) return;
    removeStatusEffect(cs, SQUIRE_PARRY_EFFECT_ID);
    ctx.damage = Math.round(ctx.damage * (1 - (parry.data['cut'] ?? 1)));
    ctx.metadata['squireGuarded'] = true;
    const bonus = 1 + (player.usesSkills.passives['squire.counter-damage-pct'] ?? 0);
    applyPlayerAoeTo(world, player, [ctx.attacker], player.dealsDamage.attack * (parry.data['counterPct'] ?? 1) * bonus, 'player', {}, { feedsWeaponReservoir: true });
    answerFill(world, player, r, parry.data['refund'] ?? 0);
  });

  // Guard: a braced Squire catches the telegraphed blow: it deals much less, and refunds.
  // Registered with the class mechanics, so it lands before the damage cap and shields.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    const brace = getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
    if (!brace || brace.remainingMs === 0 || ctx.metadata['squireGuarded']) return;
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
    const r = squireRulesOf(world, player);
    if (r) {
      answerFill(world, player, r, brace.data['refund'] ?? 0);
      avengerCounter(world, player, r);
    } else {
      addResolve(world, player, brace.data['refund'] ?? 0);
    }
  });

  // Unbowed: an untelegraphed blow over a quarter of your HP is taken on your armor, where your
  // plating counts again (Juggernaut, §8.5).
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.metadata['squireGuarded']) return;
    const player = ctx.defender;
    const r = player.usesCooldown ? squireRulesOf(world, player) : null;
    if (!r || ctx.metadata['empoweredAttack'] === true || typeof ctx.metadata['abilityName'] === 'string') return;
    const piece = PIECES.get('squire-unbowed')!;
    const p = pieceParams(r, piece);
    if (ctx.damage / Math.max(1, player.hasHealth.maxHp) < p.hpShare) return;
    if (!ruleActive(world, player, r, piece.id, attackNow(ctx)) || (player.usesCooldown?.resolve ?? 0) < p.cost) return;
    addResolve(world, player, -p.cost);
    ctx.damage = Math.max(1, Math.round(ctx.damage - player.mitigatesDamage.plating * (p.platingMult - 1)));
    ctx.metadata['squireGuarded'] = true;
    answerFill(world, player, r, p.refund);
    avengerCounter(world, player, r);
  });

  // The Squire's own blows (a thrown shield, Splitting Blow) are sized as they land.
  registerCombatListener('onHit', (ctx) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const light = Number(ctx.metadata['squireBlowMult'] ?? 0);
    if (light > 0) ctx.damage = Math.max(1, Math.round(ctx.damage * light));
    const barrierMult = Number(ctx.metadata['squireSplitting'] ?? 0);
    const barrier = ctx.defender.hasStatus.enemyBarrier?.amount ?? 0;
    if (barrierMult <= 0 || barrier <= 0) return;
    ctx.damage = Math.round(ctx.damage * barrierMult);
    // Splitting Blow II: enough to break the barrier (and so shatter Ice Armor) in one blow.
    if (ctx.metadata['squireBreakBarrier']) {
      ctx.damage = Math.max(ctx.damage, Math.ceil(barrier + ctx.defender.mitigatesDamage.plating) + 1);
    }
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

/**
 * Throwing Shield: with your target out of reach but inside the throw, your swing throws the
 * shield instead, lighter. Runs on the weapon's own swing cadence.
 */
function throwShield(world: World, player: PlayerEntity, now: number): void {
  const passives = player.usesSkills.passives;
  const share = passives['squire.throw-damage-pct'] ?? 0;
  if (share <= 0) return;
  const target = attackTargetOf(world, player);
  if (!target || isConcealedEntity(target) || target.hasPosition.nodeId !== player.hasPosition.nodeId) return;
  const cs = player.tracksCombat;
  if (now < getCounter(cs, THROW_NEXT_AT)) return;
  const from = player.hasPosition.current;
  const to = target.hasPosition.current;
  if (world.collision.canReach(player, target, player.performsAttack.attackRange)) return;
  if (Math.hypot(to.x - from.x, to.y - from.y) > (passives['squire.throw-range-px'] ?? 0)) return;
  setCounter(cs, THROW_NEXT_AT, now + player.performsAttack.attackCooldown);
  runPlayerAttack(world, player, target, now, {
    attackOrigin: from,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
    metadata: { [HOLD_EMPOWERED_ATTACK]: true, squireBlowMult: share },
  });
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
        const tp = trophyParams(r, r.trophy);
        const joiners = Math.max(1, momentValue(player, 'enemy-joins'));
        // Muster II: a whole wave rallying at once fills double.
        addResolve(world, player, tp.fillPerEnemy * joiners * (joiners >= tp.waveMin ? tp.waveMult : 1));
      }
    }
    // Rot-Eater II: every debuff that lands on you also fills, once per landing.
    if (r.trophy?.id === 'squire-relic-swamp' && trophyParams(r, r.trophy).debuffFill > 0) {
      const landed = momentTick(player, 'debuff-landed');
      const key = HANDLED_PREFIX + 'rot-eater-debuff';
      if (landed !== undefined && getCounter(player.tracksCombat, key) !== landed + 1 && landed >= world.tickCounter - 1) {
        setCounter(player.tracksCombat, key, landed + 1);
        addResolve(world, player, trophyParams(r, r.trophy).debuffFill);
      }
    }
    trickle(world, player, r, dt);
    steadyFill(world, player, r, dt);
    throwShield(world, player, now);
    reforged(world, player, dt);
    runResponses(world, player, r, now);
    armSlam(world, player, r, now);
  }
  return any;
}
