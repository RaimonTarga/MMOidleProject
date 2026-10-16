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
 *
 * Tier 3 (T3-SQUIRE, §8.6, §8.16): Anchor, Chain Hook, Frostward and Backdraft; Guard II's
 * second catch; the nine specializations (read from `usesSkills.specializationId`); Deep
 * Winter and Kindling; and the Tundra and Volcanic gear jobs. The three T3 moments the
 * registry has the real `chill-threshold` and `fire-attack`; two reads stay local, in
 * `LOCAL_MOMENTS`: `drag-or-push` (the registry's event fires as the push happens, too late to
 * plant, so Anchor looks ahead at the wind-up) and ordinary kiters for `target-flees`.
 *
 * Tier 4 (T4-SQUIRE, §8.7, §8.16): Disarm, Lay to Rest and Lie in Wait; Guard III's stagger;
 * Faultline's aftershocks, Charnel Ring and Undertow; the nine leaves (read from
 * `usesSkills.unlockedSkills`), which answer "what happens when you can't answer?" through the
 * wasted-answer ledger (an answer raised against a blow that never comes loses its cost, and the
 * leaves act on that); and the Wasteland and Trench gear jobs. `risen` is another moment the
 * registry does not record, so it is read here too.
 */
import {
  ABILITY_UNYIELDING_EFFECT_ID,
  DAMAGE_TAKEN_PCT_KEY,
  getCounter,
  getString,
  getStatusEffect,
  isHarmfulPlayerStatusEffect,
  isMonsterDotStatusEffectId,
  MONSTER_DATABASE,
  monsterKites,
  navigationBodyHalfExtents,
  pieceParamsAt,
  PLATING_SHRED_EFFECT_ID,
  removeStatusEffect,
  applyStatusEffect,
  setCounter,
  setString,
  SQUIRE_KIT,
  SQUIRE_RESOLVE,
  statusDamageAmplifierPct,
  trophyParamsAt,
  TUNDRA_CHILL_EFFECT_ID,
  VOLCANIC_HEAT_EFFECT_ID,
  type ClassConfigContext,
  type MomentId,
  type ConditionRef,
  type ResponsesConfig,
  type SquireFamily,
  type SquirePiece,
  type SquireTrophy,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { attachMarker, detachComponent } from '../../../../ecs/markerHelpers';
import type { World } from '../../../../world/World';
import { applyPlayerAoe, applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { applyKnockback, repositionPlayer } from '../../../combat/damage/knockback';
import { bossPatternEscaping, runningBossPatternDef, staggerBoss } from '../../../combat/ai/bossPatterns';
import { guardableThreatsFor } from '../../../combat/ai/guardableThreats';
import { setAggroTarget } from '../../../combat/ai/targeting';
import { telegraphsContainingPlayer } from '../../../combat/ai/telegraphEvasion';
import { attackNow, registerCombatListener, type CombatContext } from '../../../combat/engine/combatPipeline';
import { abortMonsterCast, runPlayerAttack } from '../../../combat/engine/combat';
import { HOLD_EMPOWERED_ATTACK, isEmpoweredAttack, setEmpoweredAttack } from '../../../combat/engine/empoweredAttacks';
import { ATTACK_HASTE_PCT_KEY } from '../../../combat/engine/attackCadence';
import { activeMonsterAbilityId, isChargeAoePlanted } from '../../../combat/engine/monsterMechanics';
import { isConcealedEntity } from '../../../combat/invulnerability';
import { conditionsHold, momentActive, momentTick, momentValue } from '../../../combat/moments/moments';
import { applyMonsterRoot, applyMonsterSlow } from '../../../combat/status/monsterControl';
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
import { flushSquireTelemetry, squireCount } from './squireTelemetry';

/** The brace a Guard puts up, until the blow it was raised for lands. */
export const SQUIRE_GUARD_EFFECT_ID = 'squire-guard';
/** The brace a Parry puts up: the blow is negated and countered (Avenger, §8.5). */
export const SQUIRE_PARRY_EFFECT_ID = 'squire-parry';
/** Frostward's hold on the Chill (T3): the Chill can't climb past it, and Hearth heals while it stands. */
export const SQUIRE_FROSTWARD_EFFECT_ID = 'squire-frostward';
/** Rampage (T3 Juggernaut): the burst of faster swings a slam starts. */
export const SQUIRE_RAMPAGE_EFFECT_ID = 'squire-rampage';

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
const FREE_UNTIL = 'squire.secondNature.until';   // Second Nature: answers cost nothing until this time
const BACKDRAFT_AT = 'squire.backdraft.at';
const FIGHT_START = 'squire.fightStartTick';      // stored one up; 0 = no fight
const CHILL_LAST = 'squire.chill.lastStacks';
/** A planted brace that has caught its blow stays up this long, so the push that goes with the blow is resisted. PLACEHOLDER. */
const PLANT_LINGER_MS = 400;
/** Glacier Mace's frozen ground re-slows whatever stands on it for this long each tick. */
const FROST_SLOW_REFRESH_MS = 600;
/** Consecrate keeps the feet planted in pieces this long, renewed each tick. */
const CONSECRATE_PLANT_MS = 500;
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
const DISARM_UNTIL = 'squire.disarm.until.';   // on the disarmed monster, per Squire (world tick)
const DISARM_CUT = 'squire.disarm.cut.';
const LIE_TARGET = 'squire.lieInWait.target';
const LIE_UNTIL = 'squire.lieInWait.until';
const READ_AGAIN_PREFIX = 'squire.readAgain.';   // per family: the next answer of it costs less
const BANKED_SLAM = 'squire.bankedSlamPct';      // No Wasted Effort: the next slam is this much bigger
const LAST_WORD_AT = 'squire.lastWord.at';       // Last Word / Last Rampart: their free answers share a clock each
const LAST_RAMPART_AT = 'squire.lastRampart.at';
const SECOND_LINE_AT = 'squire.secondLine.at';
const GOAD_AT = 'squire.goad.at';
const BRINE_STACKS = 'squire.brine.stacks';
const BRINE_UNTIL = 'squire.brine.until';
/** Brine Will stacks at most this many times. PLACEHOLDER. */
const BRINE_MAX_STACKS = 5;
/** Per-enemy records (who last attacked the Squire, who has risen) are kept this long. */
const RISEN_SEEN_PRUNE_MS = 60_000;

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

const SPECIALIZATIONS = new Map(SQUIRE_KIT.specializations.map((entry) => [entry.id, entry.params]));

/** A specialization's numbers (§8.6) while the player has it picked, else undefined. */
function specParams(player: PlayerEntity, id: string): Readonly<Record<string, number>> | undefined {
  return player.usesSkills.specializationId === id ? SPECIALIZATIONS.get(id) : undefined;
}

/** A landed answer's fill: the Avenger's answers fill much more (§8.5). */
function answerFill(world: World, player: PlayerEntity, r: Rules, pips: number): void {
  const fill = pips * (disciplineOf(r)?.p['answerFillMult'] ?? 1);
  squireCount(player, 'fill.answer', fill);
  addResolve(world, player, fill);
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

/**
 * A counter's blow (Riposte, Parry, Backdraft, the Avenger's follow-up): `swings` times a plain
 * swing. Measure for Measure adds a capped share of the blow its answer `prevented`; Sunderer
 * ignores the target's plating and doubles against a raised barrier. A landed counter starts
 * Second Nature's free window.
 */
function counterStrike(world: World, player: PlayerEntity, target: MonsterEntity, swings: number, now: number, prevented = 0): void {
  const attack = player.dealsDamage.attack;
  const bonus = 1 + (player.usesSkills.passives['squire.counter-damage-pct'] ?? 0);
  let damage = attack * swings * bonus;
  const measure = specParams(player, 'squire-measure-for-measure');
  if (measure && prevented > 0) damage += Math.min(prevented * measure.sharePct, attack * measure.capAttackMult);
  const sunder = specParams(player, 'squire-sunderer');
  if (sunder && (target.hasStatus.enemyBarrier?.amount ?? 0) > 0) damage *= sunder.barrierMult;
  const plating = target.mitigatesDamage.plating;
  if (sunder) target.mitigatesDamage.plating = 0;
  try {
    applyPlayerAoeTo(world, player, [target], damage, 'player', {}, { feedsWeaponReservoir: true });
  } finally {
    if (sunder) target.mitigatesDamage.plating = plating;
  }
  const secondNature = specParams(player, 'squire-second-nature');
  if (secondNature) setCounter(player.tracksCombat, FREE_UNTIL, now + secondNature.freeMs);
}

/** Second Nature: answers cost nothing for a few seconds after a counter lands. */
function answersFree(player: PlayerEntity, now: number): boolean {
  return !!specParams(player, 'squire-second-nature') && now < getCounter(player.tracksCombat, FREE_UNTIL);
}

/**
 * The Avenger's counter after a landed answer: a quick strike at the target, paid from Resolve
 * (§8.5). `prevented` is the blow the answer stopped, for Measure for Measure.
 */
function avengerCounter(world: World, player: PlayerEntity, r: Rules, now: number, prevented = 0): void {
  const discipline = disciplineOf(r);
  if (discipline?.id !== 'squire-avenger') return;
  const cost = answersFree(player, now) ? 0 : discipline.p['counterCost'] ?? 0;
  const target = attackTargetOf(world, player) ?? engagedWith(world, player)[0];
  if (!target || (player.usesCooldown?.resolve ?? 0) < cost) return;
  counterStrike(world, player, target, discipline.p['counterPct'] ?? 0, now, prevented);
  addResolve(world, player, -cost);
}

// ── Tier 4: the leaves, and the ledger of answers that hit nothing ───────────

const LEAVES = new Map<string, Readonly<Record<string, number>>>(SQUIRE_KIT.leaves.map((leaf) => [leaf.id, leaf.params]));

/** A leaf's numbers (§8.7) while the player has it unlocked, else undefined. */
function leafParams(player: PlayerEntity, id: string): Readonly<Record<string, number>> | undefined {
  return player.usesSkills.unlockedSkills.includes(id) ? LEAVES.get(id) : undefined;
}

/** How many different harmful statuses are on the player (the fight snapshot's count). */
function harmfulCount(player: PlayerEntity): number {
  const ids = new Set<string>();
  for (const effect of player.tracksCombat.statusEffects) {
    if (effect.stacks > 0 && isHarmfulPlayerStatusEffect(effect.id, effect.data)) ids.add(effect.id);
  }
  return ids.size;
}

/**
 * What an answer costs now: nothing in Second Nature's window, nothing for a guard while
 * Abyssal Plate's debuffs stand, and less for the family a wasted answer just taught (Read Again).
 */
function answerCost(player: PlayerEntity, piece: SquirePiece, base: number, now: number): number {
  if (answersFree(player, now)) return 0;
  if (piece.family === 'guard') {
    const needed = player.usesSkills.passives['squire.guards-free-debuffs'] ?? 0;
    if (needed > 0 && harmfulCount(player) >= needed) return 0;
  }
  const again = leafParams(player, 'squire-read-again');
  const discount = again && getCounter(player.tracksCombat, READ_AGAIN_PREFIX + piece.family) > 0 ? again.nextCostCut : 0;
  return base * (1 - discount);
}

interface PendingAnswer { family: SquireFamily; cost: number; expiresAt: number }
/** Braces the Squire paid for that have not caught their blow yet, by piece. Runtime only. */
const pendingAnswers = new WeakMap<PlayerEntity, Map<string, PendingAnswer>>();

function expectLanding(player: PlayerEntity, piece: SquirePiece, cost: number, expiresAt: number): void {
  let map = pendingAnswers.get(player);
  if (!map) pendingAnswers.set(player, (map = new Map()));
  map.set(piece.id, { family: piece.family, cost, expiresAt });
}

/** The brace caught its blow: the answer was not wasted. */
function settleAnswer(player: PlayerEntity, ...pieceIds: string[]): void {
  const map = pendingAnswers.get(player);
  if (map) for (const id of pieceIds) map.delete(id);
}

/** An answer that hit nothing: its cost is lost (already paid) and the Resolve leaves act on it. */
function answerWasted(world: World, player: PlayerEntity, family: SquireFamily, cost: number): void {
  if (cost <= 0) return;
  squireCount(player, 'wasted.' + family);
  const cs = player.tracksCombat;
  // Read Again: half the cost comes back, and the next answer of this family costs less.
  const again = leafParams(player, 'squire-read-again');
  if (again) {
    addResolve(world, player, cost * again.refundShare);
    setCounter(cs, READ_AGAIN_PREFIX + family, 1);
  }
  // No Wasted Effort: the lost Resolve goes into the next slam.
  const banked = leafParams(player, 'squire-no-wasted-effort');
  if (banked) setCounter(cs, BANKED_SLAM, getCounter(cs, BANKED_SLAM) + cost * banked.slamPctPerPip);
}

/** Braces that ran out without catching anything are wasted answers. */
function expireAnswers(world: World, player: PlayerEntity, now: number): void {
  const map = pendingAnswers.get(player);
  if (!map || map.size === 0) return;
  for (const [id, pending] of map) {
    if (now < pending.expiresAt) continue;
    map.delete(id);
    answerWasted(world, player, pending.family, pending.cost);
  }
}

/** When the brace a `braced` outcome raised runs out. */
function braceExpiry(player: PlayerEntity, piece: SquirePiece, p: Record<string, number>, now: number): number {
  const cs = player.tracksCombat;
  switch (piece.id) {
    case 'squire-parry': return now + Math.max(0, getStatusEffect(cs, SQUIRE_PARRY_EFFECT_ID)?.remainingMs ?? 0) + 100;
    case 'squire-disarm': return now + p.maxWindowMs + 100;
    case 'squire-lie-in-wait': return now + p.holdMs + 100;
    default: return now + Math.max(0, getStatusEffect(cs, SQUIRE_GUARD_EFFECT_ID)?.remainingMs ?? 0) + 100;
  }
}

/** Last time anything attacked the Squire, and each enemy's last attack on it (Siege Engine, Seize, Goad). */
interface Quiet { last: number; by: Map<string, number> }
const quiet = new WeakMap<PlayerEntity, Quiet>();

function noteAttacked(player: PlayerEntity, monsterId: string, now: number): void {
  let q = quiet.get(player);
  if (!q) quiet.set(player, (q = { last: 0, by: new Map() }));
  q.last = now;
  q.by.set(monsterId, now);
  if (q.by.size > 64) for (const [id, at] of q.by) if (now - at > RISEN_SEEN_PRUNE_MS) q.by.delete(id);
}

/** Mark an enemy's opening spent, without counting it as an attack on the Squire. */
function noteQuietOnly(player: PlayerEntity, monsterId: string, now: number): void {
  let q = quiet.get(player);
  if (!q) quiet.set(player, (q = { last: 0, by: new Map() }));
  q.by.set(monsterId, now);
}

/** How long nothing has attacked the Squire (one that never was has been quiet forever). */
function quietFor(player: PlayerEntity, now: number): number {
  return now - (quiet.get(player)?.last ?? 0);
}

/** How long this enemy has not attacked the Squire. */
function enemyQuietFor(player: PlayerEntity, monsterId: string, now: number): number {
  return now - (quiet.get(player)?.by.get(monsterId) ?? 0);
}

/** Brine Will: each debuff you shake off adds a stack of Recovery for a few seconds. */
function shakenOff(player: PlayerEntity, count: number, now: number): void {
  const passives = player.usesSkills.passives;
  if (count <= 0 || (passives['squire.brine-recovery-x'] ?? 0) <= 0) return;
  const cs = player.tracksCombat;
  const live = now < getCounter(cs, BRINE_UNTIL) ? getCounter(cs, BRINE_STACKS) : 0;
  setCounter(cs, BRINE_STACKS, Math.min(BRINE_MAX_STACKS, live + count));
  setCounter(cs, BRINE_UNTIL, now + (passives['squire.brine-recovery-ms'] ?? 0));
}

function updateBrine(player: PlayerEntity, now: number): void {
  const cs = player.tracksCombat;
  const x = player.usesSkills.passives['squire.brine-recovery-x'] ?? 0;
  if (x <= 0 || now >= getCounter(cs, BRINE_UNTIL)) return;
  activateRecoveryBoost(cs, 1 + getCounter(cs, BRINE_STACKS) * x, 600);
}

// ── Resolve ──────────────────────────────────────────────────────────────────

/** Fill (or, negative, spend) Resolve, capped at the bar; mirrors the HUD dial. */
export function addResolve(world: World, player: PlayerEntity, pips: number): void {
  const cd = player.usesCooldown;
  if (!cd || pips === 0) return;
  if (pips > 0) pips *= kindlingMult(world, player);
  cd.resolve = Math.max(0, Math.min(cd.resolveMax, cd.resolve + pips));
  cd.executionCooldownPct = cd.resolveMax > 0 ? Math.round((cd.resolve / cd.resolveMax) * 100) : 0;
  markSliceDirty(world, player, 'usesCooldown');
}

/** Kindling (Volcanic trophy): every gain fills more for each `stepMs` the fight has lasted. */
function kindlingMult(world: World, player: PlayerEntity): number {
  const r = squireRulesOf(world, player);
  if (r?.trophy?.id !== 'squire-relic-volcanic') return 1;
  const start = getCounter(player.tracksCombat, FIGHT_START);
  if (start === 0) return 1;
  const tp = trophyParams(r, r.trophy);
  const elapsedMs = (world.tickCounter + 1 - start) * (1000 / TICKS_PER_SEC);
  return 1 + tp.perStep * Math.min(tp.maxSteps, Math.floor(elapsedMs / tp.stepMs));
}

/** The bar's cap: the budget, widened by Deep Winter (the Tundra trophy) and Bastion (T3). */
function resolveCap(world: World, player: PlayerEntity, r: Rules): number {
  const budget = r.ctx.budget;
  let cap = budget;
  if (r.trophy?.id === 'squire-relic-tundra') cap = budget * trophyParams(r, r.trophy).capMult;
  const bastion = specParams(player, 'squire-bastion');
  if (bastion) {
    // Each enemy on you is a pip, a boss as several, up to `maxMult` times the bar.
    let enemies = 0;
    for (const monster of engagedWith(world, player)) enemies += monster.isMonster.isBoss ? SQUIRE_RESOLVE.bossCountsAs : 1;
    cap += Math.min(budget * (bastion.maxMult - 1), enemies);
  }
  return cap;
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
  if (enemies > 0) {
    const fill = enemies * SQUIRE_RESOLVE.trickleEnemyPipsPerSec * mult * (dt / 1000);
    squireCount(player, 'fill.trickle', fill);
    addResolve(world, player, fill);
  }
}

/** Juggernaut: a steady fill from your armor and max HP, hit or not (§8.5). */
function steadyFill(world: World, player: PlayerEntity, r: Rules, dt: number, now: number): void {
  const discipline = disciplineOf(r);
  if (discipline?.id !== 'squire-juggernaut') return;
  const { steadyBasePips = 0, steadyPerPlating = 0, steadyPerMaxHp = 0 } = discipline.p;
  let perSec = steadyBasePips + player.mitigatesDamage.plating * steadyPerPlating + player.hasHealth.maxHp * steadyPerMaxHp;
  // Inexorable: the bulk keeps filling between fights and while you walk.
  const inexorable = specParams(player, 'squire-inexorable');
  if (inexorable && (momentActive(world, player, 'out-of-combat', undefined, now) || momentActive(world, player, 'moving', undefined, now))) {
    perSec *= inexorable.fillMult;
  }
  squireCount(player, 'fill.steady', perSec * (dt / 1000));
  addResolve(world, player, perSec * (dt / 1000));
}

// ── Responses ────────────────────────────────────────────────────────────────

type Outcome = 'landed' | 'wasted' | 'braced' | 'none';

type ResponseHandler = (world: World, player: PlayerEntity, p: Record<string, number>, now: number, rank: number) => Outcome;

/** Extra moments a response also answers at a rank (Steel Will II: corrosion and slows land as debuffs). */
const EXTRA_TRIGGERS: Readonly<Record<string, (rank: number) => readonly MomentId[]>> = {
  'squire-steel-will': (rank) => (rank >= 2 ? ['debuff-landed'] : []),
};

/** The leaf that lets an answer fire free on an empty bar, and the clock it keeps. */
function emptyBarLeaf(pieceId: string): { leaf: string; clock: string } | undefined {
  if (pieceId === 'squire-parry') return { leaf: 'squire-last-word', clock: LAST_WORD_AT };
  if (pieceId === 'squire-unbowed') return { leaf: 'squire-last-rampart', clock: LAST_RAMPART_AT };
  return undefined;
}

/** Rules that go first when they share a moment: Parry is the stronger form of Guard. PLACEHOLDER. */
const RESPONSE_PRIORITY: Readonly<Record<string, number>> = { 'squire-parry': -1 };

const RESPONSES: Readonly<Record<string, ResponseHandler>> = {
  // Three or more enemies on you: shove them all back a step. Lands if it moves enough.
  'squire-shove': (world, player, p) => {
    const at = player.hasPosition.current;
    const passives = player.usesSkills.passives;
    const weaken = passives['squire.shove-weaken-pct'] ?? 0;
    const weakenTicks = ((passives['squire.shove-weaken-ms'] ?? 0) / 1000) * TICKS_PER_SEC;
    // A boss or a rooted enemy can't be moved, so it doesn't count toward the three: with
    // fewer movable enemies on you the shove isn't thrown (OV-SQUIRE fix: a boss and two adds
    // used to fire it every lockout and waste its cost).
    const unmovable = (m: MonsterEntity): boolean => !!m.isRooted || m.isMonster.isBoss;
    if (engagedWith(world, player).filter((m) => !unmovable(m)).length < p.minMoved) return 'none';
    let moved = 0;
    for (const monster of playerAoeTargets(world, player, at, p.radius)) {
      if (unmovable(monster)) continue;
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
  'squire-riposte': (world, player, p, now) => {
    const cs = player.tracksCombat;
    const attacker = world.getMonsterEntity(getString(cs, REPEAT_BY_KEY) ?? '');
    setCounter(cs, REPEAT_COUNT_KEY, 0);
    if (!attacker || attacker.hasHealth.hp <= 0) return 'none';
    // Counterbalance: after a Riposte, Recovery is multiplied for a few seconds.
    activateRecoveryBoost(cs, player.usesSkills.passives['squire.recovery-riposte-x'] ?? 0);
    counterStrike(world, player, attacker, p.damagePct, now);
    return 'landed';
  },
  // A poison or bleed landed: shake it off (the one with the most time left).
  'squire-steel-will': (world, player, _p, now, rank) => {
    const cs = player.tracksCombat;
    let longest: (typeof cs.statusEffects)[number] | undefined;
    for (const effect of cs.statusEffects) {
      if (!isMonsterDotStatusEffectId(effect.id) || effect.remainingMs <= 0) continue;
      if (!longest || effect.remainingMs > longest.remainingMs) longest = effect;
    }
    // Steel Will II: corrosion and slows are shaken off as well.
    let shaken = 0;
    if (rank >= 2) {
      for (const id of [PLATING_SHRED_EFFECT_ID, 'slow']) {
        if (getStatusEffect(cs, id)) { removeStatusEffect(cs, id); shaken++; }
      }
    }
    if (!longest) {
      shakenOff(player, shaken, now);
      return shaken > 0 ? 'landed' : 'wasted';
    }
    // Purifying Breath: heal part of the damage it still had to deal.
    const healPct = player.usesSkills.passives['squire.cleanse-heal-pct'] ?? 0;
    if (healPct > 0) {
      const ticksLeft = Math.ceil(longest.remainingMs / Math.max(1, longest.data['tickIntervalMs'] ?? 1000));
      const owed = (longest.data['damagePerStack'] ?? 0) * Math.max(1, longest.stacks) * ticksLeft;
      if (owed > 0) applyHealToPlayer(player, cs, owed * healPct, world);
    }
    removeStatusEffect(cs, longest.id);
    shakenOff(player, shaken + 1, now);
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
    // Planted: while braced, knockback and stuns don't move you. An Anchor already holding
    // you in place keeps doing so under the new brace.
    const steadfast = (player.usesSkills.passives['squire.guard-steadfast'] ?? 0) > 0;
    const live = getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
    const planted = steadfast || (live && live.remainingMs !== 0 && (live.data['knockbackResistPct'] ?? 0) >= 1);
    // A fresh brace, not a refresh: re-applying keeps the old data (a spent or held one).
    removeStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
    applyStatusEffect(player.tracksCombat, {
      id: SQUIRE_GUARD_EFFECT_ID,
      maxStacks: 1,
      remainingMs: windowMs,
      refreshable: true,
      sourceId: player.isPlayer.id,
      // Guard II: after a catch the brace stays up for a second telegraphed blow (`secondCatchMs`).
      data: { cut: p.cut, refund: p.refund, totalMs: windowMs, knockbackResistPct: planted ? 1 : 0, secondCatchMs: p.secondCatchMs ?? 0, staggerMs: p.staggerMs ?? 0 },
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
  'squire-unshaken': (world, player, _p, now) => {
    const cs = player.tracksCombat;
    const held = [...PLAYER_HARD_CONTROL_EFFECTS, ...PLAYER_ROOT_EFFECTS].filter((id) => (getStatusEffect(cs, id)?.remainingMs ?? 0) !== 0);
    if (held.length === 0) return 'wasted';
    for (const id of held) removeStatusEffect(cs, id);
    // The stun owns the root and the attack lock; re-sync so you are free this tick.
    syncPlayerControlLockout(world, player);
    shakenOff(player, held.length, now);
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
    removeStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
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

  // ── Tier 3 (§8.16) ──
  // A push or drag is coming: plant your feet. The brace is a Guard that cuts nothing, and
  // while it stands forced movement can't move you (the Planted rule); catching the blow fills Resolve.
  'squire-anchor': (world, player, p, now) => {
    const endsAt = pushOrPullEndsAt(world, player, now);
    if (endsAt === undefined) return 'none';
    const windowMs = Math.min(p.maxWindowMs, Math.max(0, endsAt - now) + 500);
    const live = getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
    if (live && live.remainingMs !== 0 && !live.data['hold']) {
      // A Guard is already up for this blow: it keeps its cut and refund and gains the plant.
      live.data['knockbackResistPct'] = 1;
      live.remainingMs = Math.max(live.remainingMs, windowMs);
    } else {
      plantFeet(player, windowMs, { refund: p.refund });
    }
    return 'braced';
  },
  // The target flees or kites: hook it and drag it back.
  'squire-chain-hook': (world, player, p) => {
    const target = attackTargetOf(world, player);
    if (!target || !fleesOrKites(target)) return 'none';
    const from = player.hasPosition.current;
    const to = target.hasPosition.current;
    if (isConcealedEntity(target) || Math.hypot(to.x - from.x, to.y - from.y) > p.range) return 'wasted';
    return pullToPlayer(world, target, player) ? 'landed' : 'wasted';
  },
  // The Chill on you is at its threshold: hold it there, so Deep Freeze never opens (`updateFrostward` keeps it).
  'squire-frostward': (_world, player, p) => {
    const cs = player.tracksCombat;
    const chill = getStatusEffect(cs, TUNDRA_CHILL_EFFECT_ID);
    if (!chill || chill.stacks < p.thresholdStacks) return 'none';
    chill.stacks = Math.min(chill.stacks, p.holdStacks);
    applyStatusEffect(cs, {
      id: SQUIRE_FROSTWARD_EFFECT_ID,
      maxStacks: 1,
      remainingMs: p.holdMs,
      refreshable: true,
      sourceId: player.isPlayer.id,
      data: { totalMs: p.holdMs, holdStacks: p.holdStacks },
    });
    return 'landed';
  },

  // ── Tier 4 (§8.16) ──
  // The enemy you fight starts a big attack: mark it, and the blow lands at half (Disarm's listener).
  // Not a stun, so it works on a boss pattern's step and on bosses that accept no control.
  'squire-disarm': (world, player, p, now) => {
    let marked = 0;
    for (const monster of engagedWith(world, player)) {
      let endsAt: number | undefined;
      for (const threat of guardableThreatsFor(world, monster, now)) {
        if (threat.targetId !== undefined && threat.targetId !== player.isPlayer.id) continue;
        endsAt = Math.max(endsAt ?? 0, threat.completesAtMs);
      }
      if (endsAt === undefined) continue;
      const windowMs = Math.min(p.maxWindowMs, Math.max(0, endsAt - now) + 500);
      setCounter(monster.tracksCombat, DISARM_UNTIL + player.isPlayer.id, world.tickCounter + Math.ceil((windowMs / 1000) * TICKS_PER_SEC));
      setCounter(monster.tracksCombat, DISARM_CUT + player.isPlayer.id, p.cut);
      marked++;
    }
    return marked > 0 ? 'braced' : 'none';
  },
  // A fallen enemy rose near you: strike it down before it stands. It lands if one was fresh.
  'squire-lay-to-rest': (world, player, p, now) => {
    const struck = freshRisen(world, player, p.radius, p.freshMs, now);
    if (struck.length === 0) return 'none';
    for (const monster of struck) {
      markRisenStruck(player, monster.isMonster.id);
      counterStrike(world, player, monster, p.damagePct, now);
      if (monster.hasHealth.hp > 0 && p.staggerMs > 0) applyStun(monster.tracksCombat, p.staggerMs, player.isPlayer.id);
    }
    // Rest Eternal: each Lay to Rest that lands heals a little.
    const heal = player.hasHealth.maxHp * (player.usesSkills.passives['squire.lay-to-rest-heal-pct'] ?? 0);
    if (heal > 0) applyHealToPlayer(player, player.tracksCombat, heal, world);
    return 'landed';
  },
  // Your target dived out of reach: hold the armed slam; it lands double when that target comes back.
  'squire-lie-in-wait': (world, player, p, now) => {
    const target = attackTargetOf(world, player);
    if (!target || !isEmpoweredAttack(player)) return 'none';
    setString(player.tracksCombat, LIE_TARGET, target.isMonster.id);
    setCounter(player.tracksCombat, LIE_UNTIL, now + p.holdMs);
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
    const p = pieceParams(r, piece);
    const moments = [piece.answers, ...(EXTRA_TRIGGERS[piece.id]?.(rank) ?? [])]
      .filter((moment) => momentActive(world, player, moment, undefined, now) || LOCAL_MOMENTS[moment]?.(world, player, now, p) === true);
    if (moments.length === 0) continue;
    // An event is answered once; a state waits out its lockout.
    const ticks = moments.map((moment) => momentTick(player, moment)).filter((tick): tick is number => tick !== undefined);
    const eventTick = ticks.length > 0 ? Math.max(...ticks) : undefined;
    if (p.lockoutMs !== undefined) {
      if (now < getCounter(cs, LOCKOUT_PREFIX + piece.id)) continue;
    } else if (eventTick !== undefined && getCounter(cs, HANDLED_PREFIX + piece.id) === eventTick + 1) {
      continue;
    }
    if (!conditionsHold(world, player, rule.conditions, now, classState(player))) continue;
    let cost = answerCost(player, piece, costOf(player, piece, p), now);
    // Last Word and Last Rampart: with the bar below the answer's cost, Parry (Unbowed) still fires, free, every so often.
    const freeLeaf = emptyBarLeaf(piece.id);
    const emptyFree = freeLeaf !== undefined && cost > 0 && (player.usesCooldown?.resolve ?? 0) < cost
      && !!leafParams(player, freeLeaf.leaf) && now >= getCounter(cs, freeLeaf.clock);
    if (emptyFree) cost = 0;
    if ((player.usesCooldown?.resolve ?? 0) < cost) continue;
    const outcome = handler(world, player, p, now, rank);
    if (eventTick !== undefined) setCounter(cs, HANDLED_PREFIX + piece.id, eventTick + 1);
    if (outcome === 'none') continue;
    squireCount(player, `resp.${piece.id.replace('squire-', '')}.${outcome}`);
    if (emptyFree && freeLeaf) setCounter(cs, freeLeaf.clock, now + (leafParams(player, freeLeaf.leaf)?.everyMs ?? 0));
    if (p.lockoutMs !== undefined) setCounter(cs, LOCKOUT_PREFIX + piece.id, now + p.lockoutMs);
    addResolve(world, player, -cost);
    if (cost > 0) setCounter(cs, READ_AGAIN_PREFIX + piece.family, 0);
    if (outcome === 'wasted') answerWasted(world, player, piece.family, cost);
    // A brace is wasted if its blow never comes.
    if (outcome === 'braced' && piece.family !== 'emergency') expectLanding(player, piece, cost, braceExpiry(player, piece, p, now));
    if (outcome === 'landed') {
      answerFill(world, player, r, p.refund);
      avengerCounter(world, player, r, now);
      // Second Nature: any counter that lands (Shield Bash and Splitting Blow too) opens the free window.
      const secondNature = specParams(player, 'squire-second-nature');
      if (secondNature && piece.family === 'counter') setCounter(cs, FREE_UNTIL, now + secondNature.freeMs);
    }
  }
}

// ── The T3 moments the registry does not record yet ──────────────────────────

/** Whether a monster flees or kites: a boss getting away, or a kiter backing off (as the Apprentice reads it). */
function fleesOrKites(monster: MonsterEntity): boolean {
  if (monster.hasHealth.hp <= 0) return false;
  if (bossPatternEscaping(monster)) return true;
  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  const kites = monster.scriptsBoss?.kiteOverride ?? (def ? monsterKites(def) : false);
  return kites && monster.hasAggroTarget !== undefined && monster.isMoving !== undefined;
}

/**
 * When the next push or drag aimed at this player completes, if one is coming: a charged attack
 * or ability hit that carries knockback, or a boss pattern's `pull` step (Mire Lash, Magma
 * Shove, Undertow). STAND-IN for the `drag-or-push` moment, read before the move happens.
 */
function pushOrPullEndsAt(world: World, player: PlayerEntity, now: number): number | undefined {
  let endsAt: number | undefined;
  for (const monster of engagedWith(world, player)) {
    const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
    for (const threat of guardableThreatsFor(world, monster, now)) {
      if (threat.targetId !== player.isPlayer.id) continue;
      let pushes = false;
      if (threat.source === 'charged-attack') pushes = !!def?.chargedAttack?.knockback;
      else if (threat.source === 'monster-ability') {
        const ability = def?.monsterAbilities?.find((candidate) => candidate.id === activeMonsterAbilityId(monster));
        pushes = !!ability?.actions.some((action) => 'knockback' in action && !!action.knockback);
      }
      if (pushes) endsAt = Math.max(endsAt ?? 0, threat.completesAtMs);
    }
    const pattern = monster.runsBossPattern;
    const step = pattern ? runningBossPatternDef(monster)?.steps[pattern.stepIndex] : undefined;
    if (pattern && step?.kind === 'pull' && pattern.stepStarted && pattern.stepEndsAtMs > now && pattern.targetId === player.isPlayer.id) {
      endsAt = Math.max(endsAt ?? 0, pattern.stepEndsAtMs);
    }
  }
  return endsAt;
}

/**
 * Moments a Squire piece answers that `moments/` does not implement yet (reported to the
 * conductor). They read false in the registry, so they are checked beside it. `p` is the
 * piece's numbers.
 */
const LOCAL_MOMENTS: Partial<Record<MomentId, (world: World, player: PlayerEntity, now: number, p: Record<string, number>) => boolean>> = {
  'drag-or-push': (world, player, now) => pushOrPullEndsAt(world, player, now) !== undefined,
  // The registry does not record `risen` (T4); a fresh risen enemy near you, not yet struck, is it.
  'risen': (world, player, now, p) => freshRisen(world, player, p.radius ?? RISEN_DEFAULT_RADIUS, p.freshMs ?? RISEN_DEFAULT_FRESH_MS, now).length > 0,
  // The registry's `target-flees` only knows a boss getting away.
  'target-flees': (world, player) => {
    const target = attackTargetOf(world, player);
    return !!target && fleesOrKites(target);
  },
};

// ── Tier 4: risen enemies, read locally (the registry has no `risen` yet) ──

const RISEN_DEFAULT_RADIUS = 500;
const RISEN_DEFAULT_FRESH_MS = 2000;
interface RisenWatch { seen: Map<string, number>; struck: Set<string> }
const risenWatch = new WeakMap<PlayerEntity, RisenWatch>();

/** Note every raised enemy in the node the first time it is seen, and forget the long gone. */
function updateRisenWatch(world: World, player: PlayerEntity, now: number): void {
  let watch = risenWatch.get(player);
  if (!watch) risenWatch.set(player, (watch = { seen: new Map(), struck: new Set() }));
  const live = new Set<string>();
  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (!monster.isRaised || monster.hasHealth.hp <= 0) continue;
    live.add(monster.isMonster.id);
    if (!watch.seen.has(monster.isMonster.id)) watch.seen.set(monster.isMonster.id, now);
  }
  for (const id of watch.seen.keys()) {
    if (!live.has(id)) { watch.seen.delete(id); watch.struck.delete(id); }
  }
}

/** Risen enemies near the Squire that stood up within `freshMs` and have not been struck down. */
function freshRisen(world: World, player: PlayerEntity, radius: number, freshMs: number, now: number): MonsterEntity[] {
  const watch = risenWatch.get(player);
  if (!watch) return [];
  const at = player.hasPosition.current;
  const out: MonsterEntity[] = [];
  for (const [id, seenAt] of watch.seen) {
    if (now - seenAt > freshMs || watch.struck.has(id)) continue;
    const monster = world.getMonsterEntity(id);
    if (!monster || monster.hasHealth.hp <= 0) continue;
    if (Math.hypot(monster.hasPosition.current.x - at.x, monster.hasPosition.current.y - at.y) > radius) continue;
    out.push(monster);
  }
  return out;
}

function markRisenStruck(player: PlayerEntity, monsterId: string): void {
  risenWatch.get(player)?.struck.add(monsterId);
}

/**
 * Plant the Squire's feet: a Guard that cuts nothing and holds against forced movement (the
 * Planted rule reads this id). `hold` keeps it up until it runs out instead of spending it on
 * the first telegraphed blow (Consecrate).
 */
function plantFeet(player: PlayerEntity, durationMs: number, opts: { refund?: number; hold?: boolean }): void {
  removeStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
  applyStatusEffect(player.tracksCombat, {
    id: SQUIRE_GUARD_EFFECT_ID,
    maxStacks: 1,
    remainingMs: durationMs,
    refreshable: true,
    sourceId: player.isPlayer.id,
    data: { cut: 0, refund: opts.refund ?? 0, totalMs: durationMs, knockbackResistPct: 1, hold: opts.hold ? 1 : 0, secondCatchMs: 0 },
  });
}

// ── The slam ─────────────────────────────────────────────────────────────────

/** The Resolve a slam fires at: a full bar of the budget (a bar widened by Deep Winter or Bastion doesn't delay it). */
function slamThreshold(r: Rules): number {
  return r.trophy?.id === 'squire-relic-forest' ? r.ctx.budget * trophyParams(r, r.trophy).barShare : r.ctx.budget;
}

/** Arm the slam once the bar is full, unless the slam rule holds it. */
function armSlam(world: World, player: PlayerEntity, r: Rules, now: number): void {
  const cd = player.usesCooldown!;
  if (isEmpoweredAttack(player) || cd.resolveMax <= 0) return;
  if (cd.resolve + 1e-9 < slamThreshold(r) && !executionerReady(world, player, r)) return;
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
  // Deep Winter: the bar was filled past full, and an overfull slam hits that much harder.
  if (r.trophy?.id === 'squire-relic-tundra') {
    const fill = (player.usesCooldown?.resolve ?? 0) / Math.max(1e-9, r.ctx.budget);
    mult *= Math.max(1, Math.min(trophyParams(r, r.trophy).capMult, fill));
  }
  // Forge Hammer: each stack of the fight's Heat on you makes the slam bigger.
  const heatPct = passives['squire.slam-heat-pct'] ?? 0;
  if (heatPct > 0) mult *= 1 + heatPct * (getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID)?.stacks ?? 0);
  setCounter(cs, LAST_SLAM_AT, now);

  // Everything around you takes the same blow (Faultline: a line through the target instead).
  let radius = sp.radius * (1 + (passives['squire.slam-radius-pct'] ?? 0));
  // Bulwark: the circle grows with the enemies on you.
  if (discipline?.id === 'squire-bulwark') {
    radius *= 1 + Math.min(discipline.p['slamRadiusMax'] ?? 0, (discipline.p['slamRadiusPerEnemy'] ?? 0) * engagedWith(world, player).length);
  }
  // Charnel Ring (Wasteland trophy): the circle widens with every enemy in the fight.
  if (r.trophy?.id === 'squire-relic-graveyard') {
    const tp = trophyParams(r, r.trophy);
    radius *= 1 + Math.min(tp.maxExtra, tp.radiusPerEnemy * engagedWith(world, player).length);
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
  // Bone Maul: the slam is bigger for every enemy in its circle (once the ring and the hook have pulled them in).
  const circlePct = passives['squire.slam-circle-pct'] ?? 0;
  if (circlePct > 0) {
    mult *= 1 + circlePct * (1 + playerAoeTargets(world, player, player.hasPosition.current, radius, ctx.defender.isMonster.id).length);
  }
  // Pressure Hammer: bigger for each different debuff on you.
  const debuffPct = passives['squire.slam-debuff-pct'] ?? 0;
  if (debuffPct > 0) mult *= 1 + debuffPct * harmfulCount(player);
  // No Wasted Effort: the Resolve a wasted answer lost rides in the next slam.
  const banked = getCounter(cs, BANKED_SLAM);
  if (banked > 0) {
    mult *= 1 + banked;
    setCounter(cs, BANKED_SLAM, 0);
  }
  // Lie in Wait: the slam held while the target was out of reach lands on it again.
  let lieRefund = 0;
  const lie = PIECES.get('squire-lie-in-wait')!;
  if (r.ctx.pieceRanks.has(lie.id) && getString(cs, LIE_TARGET) === ctx.defender.isMonster.id) {
    const lp = pieceParams(r, lie);
    if (now < getCounter(cs, LIE_UNTIL)) {
      mult *= lp.slamMult;
      lieRefund = lp.refund;
      settleAnswer(player, lie.id);
    }
    setString(cs, LIE_TARGET, '');
  }
  ctx.damage = Math.max(1, Math.round(ctx.damage * mult));
  squireCount(player, 'slam');
  squireCount(player, 'slam.damage', ctx.damage);

  let struck: MonsterEntity[];
  if (r.trophy?.id === 'squire-relic-mountain') {
    const faultline = trophyParams(r, r.trophy);
    struck = lineTargets(world, player, ctx.defender, faultline);
    applyPlayerAoeTo(world, player, struck, ctx.damage, 'player', {}, { feedsWeaponReservoir: true });
    // Faultline IV: aftershocks follow along the line, one after another.
    if ((faultline.aftershocks ?? 0) > 0) {
      const from = player.hasPosition.current;
      const to = ctx.defender.hasPosition.current;
      const len = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
      const shocks = aftershocks.get(player) ?? [];
      for (let i = 1; i <= faultline.aftershocks; i++) {
        const along = (faultline.length * i) / faultline.aftershocks;
        shocks.push({
          nodeId: player.hasPosition.nodeId,
          at: { x: from.x + ((to.x - from.x) / len) * along, y: from.y + ((to.y - from.y) / len) * along },
          radius: faultline.aftershockRadius,
          damage: ctx.damage * faultline.aftershockPct,
          dueAt: now + i * faultline.aftershockStepMs,
        });
      }
      aftershocks.set(player, shocks);
    }
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

  // Glacier Mace: the slam leaves frozen ground that slows enemies standing on it.
  const frostPx = passives['squire.slam-frost-px'] ?? 0;
  if (frostPx > 0) {
    const zones = frostZones.get(player) ?? [];
    zones.push({ nodeId: player.hasPosition.nodeId, at: { ...player.hasPosition.current }, radius: frostPx, endsAt: now + (passives['squire.slam-frost-ms'] ?? 0), slowPct: passives['squire.slam-frost-slow-pct'] ?? 0 });
    frostZones.set(player, zones);
  }

  // Reverb (Bulwark): the slam rings out again, at a share of its strength, a few seconds later.
  const reverb = specParams(player, 'squire-reverb');
  if (reverb) {
    const echoes = reverbs.get(player) ?? [];
    echoes.push({ nodeId: player.hasPosition.nodeId, at: { ...player.hasPosition.current }, radius, damage: ctx.damage * reverb.pct, dueAt: now + reverb.delayMs });
    reverbs.set(player, echoes);
  }
  // Consecrate (Bulwark): the slam goes on as a channel; the circle is struck again and again.
  const consecrate = specParams(player, 'squire-consecrate');
  if (consecrate) {
    channels.set(player, { endsAt: now + consecrate.channelMs, nextPulseAt: now + consecrate.pulseMs, radius, damage: ctx.damage * consecrate.pulsePct });
  }
  // Rampage (Juggernaut): each slam starts a burst of faster swings.
  const rampage = specParams(player, 'squire-rampage');
  if (rampage) {
    applyStatusEffect(cs, {
      id: SQUIRE_RAMPAGE_EFFECT_ID,
      maxStacks: 1,
      remainingMs: rampage.burstMs,
      refreshable: true,
      sourceId: player.isPlayer.id,
      data: { [ATTACK_HASTE_PCT_KEY]: rampage.hastePct, totalMs: rampage.burstMs },
    });
  }

  // The slam spends the bar: Relentless the third it fired at, a widened bar (Bastion) the bar's
  // worth, anything else all of it.
  const cd = player.usesCooldown!;
  const spent = r.trophy?.id === 'squire-relic-forest' ? slamThreshold(r)
    : specParams(player, 'squire-bastion') && r.trophy?.id !== 'squire-relic-tundra' ? Math.min(cd.resolve, r.ctx.budget)
    : cd.resolve;
  addResolve(world, player, -spent);
  // Lie in Wait landed: its answer refunds, and as a counter it opens Second Nature's window.
  if (lieRefund > 0) {
    answerFill(world, player, r, lieRefund);
    const secondNature = specParams(player, 'squire-second-nature');
    if (secondNature) setCounter(cs, FREE_UNTIL, now + secondNature.freeMs);
  }
  // Focused Weight: a slam that hit only one enemy gives a share of the bar back.
  const focused = leafParams(player, 'squire-focused-weight');
  if (focused && new Set([ctx.defender, ...struck]).size === 1) addResolve(world, player, r.ctx.budget * focused.refundShare);
  // Undertow (Trench trophy): the target is held where it stands, and can't dive, burrow or flee.
  if (r.trophy?.id === 'squire-relic-trench') {
    const tp = trophyParams(r, r.trophy);
    const held = undertows.get(player) ?? new Map<string, Undertow>();
    held.set(ctx.defender.isMonster.id, { until: now + tp.holdMs, staggerMs: tp.staggerMs });
    undertows.set(player, held);
    applyMonsterRoot(world, ctx.defender, tp.holdMs, player.isPlayer.id);
  }
}

// ── Specialization state (T3): runtime only, never persisted ─────────────────

interface FrostZone { nodeId: string; at: { x: number; y: number }; radius: number; endsAt: number; slowPct: number }
interface Echo { nodeId: string; at: { x: number; y: number }; radius: number; damage: number; dueAt: number }
interface Channel { endsAt: number; nextPulseAt: number; radius: number; damage: number }

interface Undertow { until: number; staggerMs: number }

const frostZones = new WeakMap<PlayerEntity, FrostZone[]>();
const reverbs = new WeakMap<PlayerEntity, Echo[]>();
const aftershocks = new WeakMap<PlayerEntity, Echo[]>();
const undertows = new WeakMap<PlayerEntity, Map<string, Undertow>>();
const channels = new WeakMap<PlayerEntity, Channel>();

/** Glacier Mace: enemies standing on the frozen ground are slowed while it lasts. */
function updateFrostZones(world: World, player: PlayerEntity, now: number): void {
  const zones = frostZones.get(player);
  if (!zones) return;
  const live = zones.filter((zone) => now < zone.endsAt && zone.nodeId === player.hasPosition.nodeId);
  frostZones.set(player, live);
  for (const zone of live) {
    for (const monster of playerAoeTargets(world, player, zone.at, zone.radius)) {
      applyMonsterSlow(world, monster, zone.slowPct, FROST_SLOW_REFRESH_MS, player.isPlayer.id);
    }
  }
}

/** Reverb's echoes and Faultline's aftershocks: the ones that have come due strike their circle again. */
function updateReverb(world: World, player: PlayerEntity, now: number): void {
  strikeDueEchoes(world, player, now, reverbs);
  strikeDueEchoes(world, player, now, aftershocks);
}

function strikeDueEchoes(world: World, player: PlayerEntity, now: number, store: WeakMap<PlayerEntity, Echo[]>): void {
  const echoes = store.get(player);
  if (!echoes || echoes.length === 0) return;
  const due = echoes.filter((echo) => now >= echo.dueAt);
  if (due.length === 0) return;
  store.set(player, echoes.filter((echo) => now < echo.dueAt));
  for (const echo of due) {
    if (echo.nodeId !== player.hasPosition.nodeId) continue;
    applyPlayerAoe(world, player, echo.at, echo.radius, echo.damage, undefined, 'player', {}, { feedsWeaponReservoir: true });
  }
}

/** Undertow: a held target that dives, burrows or flees has it cut short. */
function updateUndertow(world: World, player: PlayerEntity, now: number): void {
  const held = undertows.get(player);
  if (!held || held.size === 0) return;
  for (const [id, hold] of held) {
    const monster = world.getMonsterEntity(id);
    if (!monster || monster.hasHealth.hp <= 0 || now >= hold.until) {
      held.delete(id);
      continue;
    }
    if (monster.isConcealed === undefined && !bossPatternEscaping(monster)) continue;
    // A boss pattern's dive or flight ends in a stagger; anything else just comes back up.
    if (monster.runsBossPattern) staggerBoss(world, monster, 'Undertow', hold.staggerMs, now);
    else detachComponent(world, monster, 'isConcealed');
  }
}

/** Second Line: on an empty bar, a pip per enemy on you comes back, every so often. */
function updateSecondLine(world: World, player: PlayerEntity, now: number): void {
  const leaf = leafParams(player, 'squire-second-line');
  const cd = player.usesCooldown;
  if (!leaf || !cd || cd.resolve >= 0.05 || now < getCounter(player.tracksCombat, SECOND_LINE_AT)) return;
  const enemies = engagedWith(world, player).length;
  if (enemies === 0) return;
  setCounter(player.tracksCombat, SECOND_LINE_AT, now + leaf.everyMs);
  addResolve(world, player, enemies);
}

/** Goad: after a quiet spell, a free Challenge pulls the nearest enemies onto you. */
function updateGoad(world: World, player: PlayerEntity, r: Rules, now: number): void {
  const leaf = leafParams(player, 'squire-goad');
  const challenge = PIECES.get('squire-challenge')!;
  if (!leaf || !r.ctx.pieceRanks.has(challenge.id) || quietFor(player, now) < leaf.quietMs) return;
  if (now < getCounter(player.tracksCombat, GOAD_AT) || !attackTargetOf(world, player)) return;
  const p = pieceParams(r, challenge);
  const at = player.hasPosition.current;
  const near = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)]
    .filter((monster) => monster.hasHealth.hp > 0 && !isConcealedEntity(monster) && Math.hypot(monster.hasPosition.current.x - at.x, monster.hasPosition.current.y - at.y) <= p.range)
    .sort((a, b) => Math.hypot(a.hasPosition.current.x - at.x, a.hasPosition.current.y - at.y)
      - Math.hypot(b.hasPosition.current.x - at.x, b.hasPosition.current.y - at.y))
    .slice(0, p.maxPulled);
  if (near.length === 0) return;
  setCounter(player.tracksCombat, GOAD_AT, now + leaf.everyMs);
  for (const monster of near) {
    setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, now);
    pullToPlayer(world, monster, player);
    if (p.rootMs > 0) applyMonsterRoot(world, monster, p.rootMs, player.isPlayer.id);
  }
}

/** Consecrate: while the channel lasts the circle is struck every pulse and nothing can move you. */
function updateConsecrate(world: World, player: PlayerEntity, now: number): void {
  const channel = channels.get(player);
  if (!channel) return;
  if (now >= channel.endsAt) {
    channels.delete(player);
    return;
  }
  const live = getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
  if (!live || live.remainingMs === 0 || live.data['hold']) plantFeet(player, CONSECRATE_PLANT_MS, { hold: true });
  const p = specParams(player, 'squire-consecrate');
  while (p && now >= channel.nextPulseAt && channel.nextPulseAt < channel.endsAt) {
    channel.nextPulseAt += p.pulseMs;
    applyPlayerAoe(world, player, player.hasPosition.current, channel.radius, channel.damage, undefined, 'player', {}, { feedsWeaponReservoir: true });
  }
}

/** Destroyer (Juggernaut): with the slam armed, you crash into a target that is out of reach. */
function updateDestroyer(world: World, player: PlayerEntity): void {
  const destroyer = specParams(player, 'squire-destroyer');
  if (!destroyer || !isEmpoweredAttack(player)) return;
  const target = attackTargetOf(world, player);
  if (!target || isConcealedEntity(target) || target.hasPosition.nodeId !== player.hasPosition.nodeId) return;
  const reach = player.performsAttack.attackRange;
  if (world.collision.canReach(player, target, reach)) return;
  const from = player.hasPosition.current;
  const to = target.hasPosition.current;
  const gap = Math.hypot(to.x - from.x, to.y - from.y);
  if (gap > destroyer.chargeRangePx) return;
  // Land just inside reach, so the armed slam is the next blow.
  repositionPlayer(world, player, to, Math.max(0, gap - reach * 0.5), true);
}

/** Frostward: the Chill can't climb past the hold while it stands; Hearth heals each second. */
function updateFrostward(world: World, player: PlayerEntity, dt: number): void {
  const hold = getStatusEffect(player.tracksCombat, SQUIRE_FROSTWARD_EFFECT_ID);
  if (!hold || hold.remainingMs === 0) return;
  const chill = getStatusEffect(player.tracksCombat, TUNDRA_CHILL_EFFECT_ID);
  if (chill) chill.stacks = Math.min(chill.stacks, hold.data['holdStacks'] ?? chill.stacks);
  const heal = player.hasHealth.maxHp * (player.usesSkills.passives['squire.frostward-heal-pct'] ?? 0) * (dt / 1000);
  if (heal > 0) applyHealToPlayer(player, player.tracksCombat, heal, world);
}

/** Frozen Resolve: each stack of Chill gained fills Resolve. */
function updateChillFill(world: World, player: PlayerEntity): void {
  const fill = player.usesSkills.passives['squire.chill-fill-pips'] ?? 0;
  const cs = player.tracksCombat;
  const stacks = getStatusEffect(cs, TUNDRA_CHILL_EFFECT_ID)?.stacks ?? 0;
  if (fill > 0 && stacks > getCounter(cs, CHILL_LAST)) addResolve(world, player, (stacks - getCounter(cs, CHILL_LAST)) * fill);
  setCounter(cs, CHILL_LAST, stacks);
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
  // Whatever attacks the Squire breaks the quiet (Siege Engine, Seize the Opening, Goad). Splash
  // hits come through here; a full dodge is noted by the fill listener below.
  registerCombatListener('onDamageTaken', (ctx) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || !ctx.defender.usesCooldown) return;
    noteAttacked(ctx.defender, ctx.attacker.isMonster.id, attackNow(ctx));
  });

  // A landed hit fills Resolve by its raw size (a full dodge doesn't).
  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    const r = player.usesCooldown ? squireRulesOf(world, player) : null;
    if (!r) return;
    noteAttacked(player, ctx.attacker.isMonster.id, attackNow(ctx));
    const by = typeof ctx.metadata['abilityName'] === 'string' ? ctx.metadata['abilityName']
      : ctx.metadata['empoweredAttack'] === true ? 'charged' : ctx.attacker.isMonster.isBoss ? 'boss-swing' : 'add-swing';
    squireCount(player, `taken.${by}`, ctx.damage);
    // A full dodge fills nothing, unless Turn Aside says it fills as if it had landed.
    if (ctx.metadata['evadeFull'] === true && !((player.usesSkills.passives['squire.dodge-fills'] ?? 0) > 0)) return;
    const raw = Number(ctx.metadata['incomingGross'] ?? ctx.damage);
    if (raw <= 0) return;
    // The T2 pick tilts plain hits (Avenger less, Bulwark more, Juggernaut much less), and
    // Arrow Catcher fills extra from shooters.
    let pips = rawHitPips(player, raw) * (disciplineOf(r)?.p['hitFillMult'] ?? 1);
    if ((ctx.attacker.performsAttack?.attackRange ?? 0) > MELEE_MAX_REACH) pips *= player.usesSkills.passives['squire.ranged-fill-x'] || 1;
    // Grave Plate: a risen enemy's hits fill more.
    if (ctx.attacker.isRaised) pips *= player.usesSkills.passives['squire.risen-fill-x'] || 1;
    // Stoked: the Heat's extra damage on this hit fills extra Resolve.
    const stoked = player.usesSkills.passives['squire.heat-fill-x'] ?? 0;
    const heat = stoked > 0 ? getStatusEffect(player.tracksCombat, VOLCANIC_HEAT_EFFECT_ID) : undefined;
    if (heat) {
      const extra = statusDamageAmplifierPct(heat, DAMAGE_TAKEN_PCT_KEY);
      pips *= 1 + (extra / (1 + extra)) * stoked;
    }
    squireCount(player, 'fill.hit', pips);
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
    squireCount(player, 'catch.watchful');
    // Watchman's Ease: the hit it stopped heals you.
    const heal = (before - ctx.damage) * (player.usesSkills.passives['squire.watchful-heal-pct'] ?? 0);
    if (heal > 0) applyHealToPlayer(player, cs, heal, world);
    if (p.staggerMs > 0) applyStun(ctx.attacker.tracksCombat, p.staggerMs, player.isPlayer.id);
    answerFill(world, player, r, p.refund);
    avengerCounter(world, player, r, now, before - ctx.damage);
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
    settleAnswer(player, 'squire-parry');
    squireCount(player, 'catch.parry');
    const before = ctx.damage;
    ctx.damage = Math.round(ctx.damage * (1 - (parry.data['cut'] ?? 1)));
    ctx.metadata['squireGuarded'] = true;
    counterStrike(world, player, ctx.attacker, parry.data['counterPct'] ?? 1, attackNow(ctx), before - ctx.damage);
    answerFill(world, player, r, parry.data['refund'] ?? 0);
  });

  // Guard: a braced Squire catches the telegraphed blow: it deals much less, and refunds.
  // Registered with the class mechanics, so it lands before the damage cap and shields.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    const brace = getStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
    // A held brace (Consecrate) and one already spent (lingering to hold the feet) catch nothing.
    if (!brace || brace.remainingMs === 0 || ctx.metadata['squireGuarded'] || brace.data['hold'] || brace.data['spent']) return;
    // Guards catch telegraphs and big hits only; chip damage always lands (§8.3, rule 3).
    const telegraphed = ctx.metadata['empoweredAttack'] === true || typeof ctx.metadata['abilityName'] === 'string';
    if (!telegraphed) return;
    const before = ctx.damage;
    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - (brace.data['cut'] ?? 0))));
    ctx.metadata['squireGuarded'] = true;
    settleAnswer(player, 'squire-guard', 'squire-anchor', 'squire-intercept');
    squireCount(player, 'catch.guard');
    squireCount(player, 'catch.guard-prevented', before - ctx.damage);
    // Guard III: a caught blow staggers its attacker.
    const staggerMs = brace.data['staggerMs'] ?? 0;
    if (staggerMs > 0) applyStun(ctx.attacker.tracksCombat, staggerMs, player.isPlayer.id);
    const planted = (brace.data['knockbackResistPct'] ?? 0) >= 1;
    const secondCatchMs = brace.data['secondCatchMs'] ?? 0;
    if (secondCatchMs > 0) {
      // Guard II: the same brace stays up for a second telegraphed blow.
      brace.remainingMs = secondCatchMs;
      brace.data['totalMs'] = secondCatchMs;
      brace.data['secondCatchMs'] = 0;
    } else if (planted) {
      // The push that goes with this blow comes after it: stay planted a moment, spent.
      brace.data['spent'] = 1;
      brace.remainingMs = Math.min(brace.remainingMs, PLANT_LINGER_MS);
    } else {
      removeStatusEffect(player.tracksCombat, SQUIRE_GUARD_EFFECT_ID);
    }
    if ((brace.data['knockbackResistPct'] ?? 0) > 0) removeStatusEffect(player.tracksCombat, ABILITY_UNYIELDING_EFFECT_ID);
    setCounter(player.tracksCombat, LAST_CAUGHT_TICK, world.tickCounter + 1);
    // Stone Patience: after a caught telegraph, Recovery is multiplied for a few seconds.
    activateRecoveryBoost(player.tracksCombat, player.usesSkills.passives['squire.recovery-caught-x'] ?? 0);
    const r = squireRulesOf(world, player);
    if (r) {
      answerFill(world, player, r, brace.data['refund'] ?? 0);
      avengerCounter(world, player, r, attackNow(ctx), before - ctx.damage);
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
    const now = attackNow(ctx);
    let cost = answerCost(player, piece, p.cost, now);
    // Last Rampart: with the bar below Unbowed's cost, it still fires free, every so often.
    const rampart = leafParams(player, 'squire-last-rampart');
    const emptyFree = !!rampart && cost > 0 && (player.usesCooldown?.resolve ?? 0) < cost && now >= getCounter(player.tracksCombat, LAST_RAMPART_AT);
    if (emptyFree) cost = 0;
    if (!ruleActive(world, player, r, piece.id, now) || (player.usesCooldown?.resolve ?? 0) < cost) return;
    if (emptyFree && rampart) setCounter(player.tracksCombat, LAST_RAMPART_AT, now + rampart.everyMs);
    addResolve(world, player, -cost);
    if (cost > 0) setCounter(player.tracksCombat, READ_AGAIN_PREFIX + piece.family, 0);
    const before = ctx.damage;
    ctx.damage = Math.max(1, Math.round(ctx.damage - player.mitigatesDamage.plating * (p.platingMult - 1)));
    ctx.metadata['squireGuarded'] = true;
    squireCount(player, 'catch.unbowed');
    answerFill(world, player, r, p.refund);
    avengerCounter(world, player, r, now, before - ctx.damage);
  });

  // Backdraft (T3, a counter): a fire attack or burning shot is thrown back at its source.
  // Answers the `fire-attack` moment, thrown back at the attacker whose style is fire.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.metadata['evadeFull'] === true) return;
    const player = ctx.defender;
    const r = player.usesCooldown ? squireRulesOf(world, player) : null;
    if (!r || !MONSTER_DATABASE.get(ctx.attacker.isMonster.monsterTypeId)?.attackStyle.includes('fire')) return;
    const piece = PIECES.get('squire-backdraft')!;
    const now = attackNow(ctx);
    if (!momentActive(world, player, 'fire-attack', undefined, now)) return;
    const cs = player.tracksCombat;
    const p = pieceParams(r, piece);
    const cost = answerCost(player, piece, p.cost, now);
    if (!ruleActive(world, player, r, piece.id, now) || (player.usesCooldown?.resolve ?? 0) < cost) return;
    if (now < getCounter(cs, BACKDRAFT_AT)) return;
    setCounter(cs, BACKDRAFT_AT, now + p.cooldownMs);
    addResolve(world, player, -cost);
    if (cost > 0) setCounter(cs, READ_AGAIN_PREFIX + piece.family, 0);
    counterStrike(world, player, ctx.attacker, p.damagePct, now);
    squireCount(player, 'resp.backdraft.landed');
    // Cooling Breath: each Backdraft that lands heals a little.
    const heal = player.hasHealth.maxHp * (player.usesSkills.passives['squire.backdraft-heal-pct'] ?? 0);
    if (heal > 0) applyHealToPlayer(player, cs, heal, world);
    answerFill(world, player, r, p.refund);
    avengerCounter(world, player, r, now);
  });

  // Disarm (T4, a counter): the blow of an enemy it was raised against lands at half. Registered
  // after the Guard, so a blow the Guard caught is not cut twice.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.metadata['squireGuarded']) return;
    const player = ctx.defender;
    const id = player.isPlayer.id;
    const monsterCs = ctx.attacker.tracksCombat;
    const until = getCounter(monsterCs, DISARM_UNTIL + id);
    if (until <= 0) return;
    const now = attackNow(ctx);
    if (world.tickCounter > until) {
      setCounter(monsterCs, DISARM_UNTIL + id, 0);
      return;
    }
    const telegraphed = ctx.metadata['empoweredAttack'] === true || typeof ctx.metadata['abilityName'] === 'string';
    if (!telegraphed) return;
    const r = player.usesCooldown ? squireRulesOf(world, player) : null;
    if (!r) return;
    const before = ctx.damage;
    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - getCounter(monsterCs, DISARM_CUT + id))));
    ctx.metadata['squireGuarded'] = true;
    setCounter(monsterCs, DISARM_UNTIL + id, 0);
    settleAnswer(player, 'squire-disarm');
    squireCount(player, 'catch.disarm');
    const piece = PIECES.get('squire-disarm')!;
    answerFill(world, player, r, pieceParams(r, piece).refund);
    avengerCounter(world, player, r, now, before - ctx.damage);
    const secondNature = specParams(player, 'squire-second-nature');
    if (secondNature) setCounter(player.tracksCombat, FREE_UNTIL, now + secondNature.freeMs);
  });

  // Siege Engine (Juggernaut leaf): swings hit harder while nothing has hit you for a while. Seize
  // the Opening (Avenger leaf): an enemy that has not attacked you for a while is open, and your
  // next swing on it is followed by a counter. Neither fires for the slam or the Squire's own blows.
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster' || ctx.metadata['empoweredAttack']) return;
    const player = ctx.attacker;
    if (!player.usesCooldown || !squireRulesOf(world, player)) return;
    const now = attackNow(ctx);
    const siege = leafParams(player, 'squire-siege-engine');
    if (siege && quietFor(player, now) >= siege.quietMs) ctx.damage = Math.max(1, Math.round(ctx.damage * (1 + siege.swingPct)));
    const seize = leafParams(player, 'squire-seize-the-opening');
    const targetId = ctx.defender.isMonster.id;
    if (seize && enemyQuietFor(player, targetId, now) >= seize.quietMs) {
      // The opening is spent: the enemy counts as freshly quiet again.
      noteQuietOnly(player, targetId, now);
      counterStrike(world, player, ctx.defender, seize.counterPct, now);
    }
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
    // The bar's size: the budget, wider with Deep Winter or Bastion.
    const cap = resolveCap(world, player, r);
    if (cd.resolveBudget !== r.ctx.budget) {
      cd.resolveBudget = r.ctx.budget;
      markSliceDirty(world, player, 'usesCooldown');
    }
    if (cd.resolveMax !== cap) {
      cd.resolveMax = cap;
      addResolve(world, player, 0);
      cd.resolve = Math.min(cd.resolve, cd.resolveMax);
      cd.executionCooldownPct = cd.resolveMax > 0 ? Math.round((cd.resolve / cd.resolveMax) * 100) : 0;
      markSliceDirty(world, player, 'usesCooldown');
    }
    // Kindling counts the fight from the first enemy on you to the last.
    if (r.trophy?.id === 'squire-relic-volcanic') {
      const engaged = engagedWith(world, player).length > 0;
      const started = getCounter(player.tracksCombat, FIGHT_START);
      if (engaged && started === 0) setCounter(player.tracksCombat, FIGHT_START, world.tickCounter + 1);
      else if (!engaged && started !== 0) setCounter(player.tracksCombat, FIGHT_START, 0);
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
        const fill = tp.fillPerEnemy * joiners * (joiners >= tp.waveMin ? tp.waveMult : 1);
        squireCount(player, 'fill.muster', fill);
        addResolve(world, player, fill);
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
    steadyFill(world, player, r, dt, now);
    throwShield(world, player, now);
    reforged(world, player, dt);
    updateChillFill(world, player);
    updateFrostward(world, player, dt);
    updateFrostZones(world, player, now);
    updateReverb(world, player, now);
    updateConsecrate(world, player, now);
    updateRisenWatch(world, player, now);
    updateUndertow(world, player, now);
    updateSecondLine(world, player, now);
    updateGoad(world, player, r, now);
    updateBrine(player, now);
    expireAnswers(world, player, now);
    runResponses(world, player, r, now);
    armSlam(world, player, r, now);
    updateDestroyer(world, player);
    flushSquireTelemetry(world, player);
  }
  return any;
}
