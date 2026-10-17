/**
 * The Slinger at runtime (class-first build plan CL.1–CL.2, T2-SLINGER; bible §10.2–§10.5,
 * §10.16): the clip it loads at each reload (picked by the Loadout's rules), the effect every
 * round of that clip carries, the trophy round that closes every clip, the stationary reload,
 * the three disciplines (twin guns, the shell, the called shot) and the gun and gear lines that
 * bend them. Wiring only: every number is a placeholder (kit `params`, `slinger/tuning.ts`, the
 * constants below, the gear keys).
 *
 * Tier 3 (T3-SLINGER; §10.6, §10.16): the nine specializations, the T3 clips (Seeker, Acid, Tether, Frost,
 * Incendiary), the T3 trophy ranks and rounds (Rime, Cinder) and the Tundra and Volcanic gear.
 *
 * Tier 4 (T4-SLINGER; §10.7, §10.16): the nine leaves, the T4 clip ranks and clips (Shellbreaker II, Frost II,
 * Tracer III, Hollow-point II, Thermite, Hallowed, Exploit), the T4 trophy ranks and rounds (Quake IV, Rime II,
 * Hunter's III, Bounty III, Cinder II, Toll, Harpoon) and the Wasteland and Trench gear.
 *
 * The old frame, range, and T3 paths are gone (CL7). This file is the Loadout runtime.
 */
import {
  applyStatusEffect,
  CHILL_STATUS_ID,
  DAMAGE_TAKEN_PCT_KEY,
  FROZEN_STATUS_ID,
  holdKindOfStatusId,
  MONSTER_ROOT_STATUS_IDS,
  MONSTER_SLOW_STATUS_IDS,
  pieceParamsAt,
  playerIncomingDamageMult,
  SLINGER_KIT,
  getResource,
  getStatusEffect,
  getString,
  setResource,
  setString,
  statusDamageAmplifierPct,
  trophyParamsAt,
  TUNDRA_CHILL_EFFECT_ID,
  VOLCANIC_HEAT_EFFECT_ID,
  type ClassConfigContext,
  type LoadoutConfig,
  type SlingerPiece,
  type SlingerTrophy,
} from '@mmo-idle/shared';
import { mutateSlice } from '../../../../ecs/dirtyHelpers';
import { attachMarker, detachMarker } from '../../../../ecs/markerHelpers';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { isPlayerInCombat } from '../../../combat/ai/engagement';
import { setAttackTarget } from '../../../combat/ai/targeting';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { SLINGER_ROT_ID, SLINGER_VENOM_ID } from '../../../combat/damage/bleedIds';
import { applyKnockback } from '../../../combat/damage/knockback';
import { attackNow, registerCombatListener } from '../../../combat/engine/combatPipeline';
import { conditionsHold, momentActive } from '../../../combat/moments/moments';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { applyMonsterSlow } from '../../../combat/status/monsterControl';
import { applyStun } from '../../../combat/status/stun';
import { classConfigContextOf } from '../../../player/progression/classConfig';
import { applyFramePlatingShred } from '../../shared/frameLoop';
import { applyTickDot } from '../../shared/tickDot';
import { applyBurn, tickBurns } from '../../slinger/burn';
import { calledMomentHolds, pickCalledTarget } from '../../slinger/calledShot';
import { bankShell, fireShell, markDeathmark, markShellPending, shellBank, shellPending } from '../../slinger/shell';
import {
  clearEntrench,
  deadeyeHolds,
  endFan,
  entrenchTick,
  fleeSlowTick,
  layRime,
  resetDeadeye,
  isGettingAway,
  revealSeekable,
  rimeGround,
  rimeTick,
  startFan,
  takeDeadeyeHeld,
  tetherFor,
  tetherHit,
  tetherTick,
} from '../../slinger/t3';
import {
  aftershockTick,
  clipDoesNothing,
  distinctMonsterDebuffs,
  distinctPlayerDebuffs,
  fightSize,
  hasIceArmor,
  leafPicked,
  lightHandsHit,
  pressureSuitTick,
  queueAftershocks,
  SLIP_AWAY_X,
  stakesTick,
  steadyNerveTick,
  stopCharge,
  SWAP_CARRY,
  weakenRisen,
} from '../../slinger/t4';
import { countRound, flushSlingerTally, slingerTally } from '../../slinger/telemetry';
import { isTracedBy, lookoutAmbusher, revealTraced, shadeTick, traceTarget } from '../../slinger/tracer';
import {
  BUNKER,
  BUNKER_MULT,
  CALLED_SHOT_MULT,
  COOL_RELOAD,
  COOL_RELOAD_MULT,
  CROSSFIRE,
  CROSSFIRE_EFFECT_MULT,
  CROSSFIRE_KEYS,
  CROSSFIRE_WINDOW_MS,
  DEADEYE,
  DEADEYE_HELD_MULT,
  DEADEYE_HOLD_MS,
  DEADEYE_LOW_HP,
  DEATHMARK,
  ENTRENCHED,
  FAN_ROUNDS,
  FAN_THE_HAMMER,
  FAR_FULL_PX,
  FRESH_POWDER,
  GUN_KATA,
  GUNSLINGER,
  HEAT_STACKS_MAX,
  IMPROVISE,
  IMPROVISE_MULT,
  KATA_CLOSE_MULT,
  KATA_CLOSE_PX,
  KATA_MELEE_PX,
  LIGHT_HANDS,
  LIGHT_HANDS_EVERY_MS,
  LIGHT_HANDS_MULT,
  PIERCE,
  PIERCE_WIDTH_PX,
  RICOCHET,
  RICOCHET_BOUNCES,
  QUICK_SWAP,
  RICOCHET_SHARE,
  ROLLING_EVERY_ROUNDS,
  ROLLING_FIRE,
  SIEGE,
  SIEGE_ROUND_PCT,
  SLIP_AWAY,
  SLIP_AWAY_MULT,
  STAKES,
  STEADY_NERVE,
  TRICKSHOT,
} from '../../slinger/tuning';
import { emitReloadStart, registerReloadLifecycleHook, RELOAD_HELD_AT, startReloadTimer, resolveReloadTimeMs } from './reloadLifecycle';

const PLAIN = 'slinger-plain-clip';
/** Reaper's Repeater: the splash reaches enemies this close to the target (px). PLACEHOLDER. */
const SPLASH_PX = 110;
const CLIPS = new Map<string, SlingerPiece>(SLINGER_KIT.pieces.map((piece) => [piece.id, piece]));
const TROPHIES = new Map<string, SlingerTrophy>(SLINGER_KIT.trophies.map((trophy) => [trophy.id, trophy]));

/** Elbow Room's crowd: this many enemies near you. PLACEHOLDER. */
const CROWD = 3;
/** "Near": the radius the crowd and Snake Oil's quiet are judged in (px). PLACEHOLDER. */
const NEAR_PX = 250;
/** Breathing Room: the distance at which Recovery has doubled (px). PLACEHOLDER. */
const BREATHING_FULL_PX = 300;
/** Regroup's window after a big hit (ms), and what counts as big. PLACEHOLDER. */
const REGROUP_MS = 4_000;
const BIG_HIT_SHARE = 0.25;
/** The Recovery-share factor the lines above write each tick; `recovery.ts` reads it. */
export const SLINGER_RECOVERY_X = 'slinger.recoveryX';
const REGROUP_UNTIL = 'slinger.regroupUntil';
const SHOVES = 'slinger.shoves';
const SHOVE_AT = 'slinger.shoveAt';
/** Gunslinger's second gun: the clip it loaded (the first gun's is `clipId`). */
const TWIN_CLIP = 'slinger.twinClip';
/** Trickshot: the target the player held before the called shot retargeted (empty: none). */
const CALLED_FROM = 'slinger.calledFrom';
/** Acid: rounds in a row on this target, and when the last landed (the plating it has eaten so far). */
const ACID_STACKS = 'slinger.acid.stacks';
const ACID_AT = 'slinger.acid.at';
/** Crossfire: the last round's gun, target and time. */
const CROSS_CLIP = 'slinger.cross.clip';
const CROSS_TARGET = 'slinger.cross.target';
const CROSS_AT = 'slinger.cross.at';
/** Warm Hands: the Chill the player had before the reload held it. */
const CHILL_HELD = 'slinger.chill.held';

interface Loadout {
  config: LoadoutConfig;
  trophy: SlingerTrophy | undefined;
  /** What the character owns: piece and trophy ranks, the discipline. Null when not resolvable. */
  ctx: ClassConfigContext | null;
}

// The context is rebuilt from biome levels, boss clears and the discipline; cache it until one changes.
const ctxCache = new WeakMap<PlayerEntity, { key: string; ctx: ClassConfigContext | null }>();

function contextOf(player: PlayerEntity): ClassConfigContext | null {
  const progress = player.tracksProgression;
  const key = `${JSON.stringify(progress.biomeLevel)}|${progress.bossesCleared?.length ?? 0}|${player.usesSkills.disciplineId ?? ''}`;
  const hit = ctxCache.get(player);
  if (hit && hit.key === key) return hit.ctx;
  const ctx = classConfigContextOf(player);
  ctxCache.set(player, { key, ctx });
  return ctx;
}

/** The Slinger's Loadout, or null for a character without one (the old reload path then applies). */
export function loadoutOf(player: PlayerEntity): Loadout | null {
  const config = player.configuresClass?.config;
  if (!player.usesReload || config?.system.kind !== 'loadout') return null;
  return { config: config.system, trophy: config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined, ctx: contextOf(player) };
}

/** A clip's numbers at the rank the character owns it. */
function clipParams(loadout: Loadout, clipId: string): Record<string, number> {
  const piece = CLIPS.get(clipId);
  return piece ? pieceParamsAt(piece, loadout.ctx?.pieceRanks.get(clipId) ?? 1) : {};
}

/** The equipped trophy's numbers at the rank the character holds it. */
function trophyParams(loadout: Loadout): Record<string, number> {
  const trophy = loadout.trophy;
  return trophy ? trophyParamsAt(trophy, loadout.ctx?.trophyRanks.get(trophy.id) ?? 1) : {};
}

/** The discipline the Slinger picked, if it is one of the Slinger's. */
function disciplineOf(player: PlayerEntity): string | null {
  const id = player.usesSkills.disciplineId ?? null;
  return id === GUNSLINGER || id === SIEGE || id === TRICKSHOT ? id : null;
}

/** The specialization the Slinger picked (T3), if it is one of the Slinger's. */
function specializationOf(player: PlayerEntity): string | null {
  const id = player.usesSkills.specializationId ?? null;
  switch (id) {
    case FAN_THE_HAMMER: case CROSSFIRE: case GUN_KATA: case DEATHMARK: case ENTRENCHED:
    case ROLLING_FIRE: case RICOCHET: case PIERCE: case DEADEYE:
      return id;
    default:
      return null;
  }
}

/** Frostlock Rifle's "cold": chilled, slowed or rooted (or frozen). */
function isColdTarget(target: MonsterEntity): boolean {
  return target.tracksCombat.statusEffects.some((effect) =>
    effect.remainingMs !== 0 && effect.id !== 'stunned' && holdKindOfStatusId(effect.id) !== undefined);
}

/** The Heat stacks on the player (Firebrand Pistol, Heatsink). */
function heatStacks(player: PlayerEntity): number {
  return Math.min(HEAT_STACKS_MAX, getStatusEffect(player.tracksCombat, VOLCANIC_HEAT_EFFECT_ID)?.stacks ?? 0);
}

/**
 * Deadeye (bible §10.6): should the last round wait? True while the clip holds it for the rule's moment
 * (an enemy winds up, an elite is in reach, the target is below a third) or a few seconds. Asked by the
 * reload gate on the attack that would fire the last round, with that attack's target.
 */
export function deadeyeWaits(world: World, player: PlayerEntity, now: number, target?: MonsterEntity): boolean {
  const loadout = loadoutOf(player);
  const reload = player.usesReload;
  if (!loadout || !reload || disciplineOf(player) !== TRICKSHOT || specializationOf(player) !== DEADEYE) return false;
  if (reload.reloadingMs > 0 || reload.ammo !== 1) return false;
  // Only a boss is worth the wait. PLACEHOLDER (2026-10-17): held against guards (plain or elite), the
  // cancelled attack left the auto AI idle between kills (the T4 Mountain's rooted Stone Wardens: one kill in
  // 15 minutes live, 56% of samples "no worthy target nearby"; 3 kills in 300 s in the sim against 8 for Ricochet),
  // and with plain guards excluded it still stalled at the T4 Trench's two Abyssal Guardians (six 15-minute attempts).
  if (!target?.isMonster.isBoss) return false;
  // The held round's own rule (`deadeyeHold`) when set, else the called shot's.
  const rule = loadout.config.deadeyeHold && loadout.config.deadeyeHold.length > 0 ? loadout.config.deadeyeHold : loadout.config.calledShot;
  return deadeyeHolds(player, calledMomentHolds(world, player, rule, DEADEYE_LOW_HP, now), DEADEYE_HOLD_MS, now);
}

/** How long an empty clip may wait on a telegraph before it reloads anyway (ms). PLACEHOLDER. */
const TELEGRAPH_HOLD_MAX_MS = 3_000;

/**
 * The free rule "never start a reload inside a telegraph" (bible §10.3, on by default): while the
 * Slinger stands in a ground telegraph, an empty clip waits instead of starting the stationary
 * reload, so the Slinger can walk out first. It waits at most a few seconds.
 */
export function reloadWaitsOnTelegraph(world: World, player: PlayerEntity, now: number): boolean {
  const loadout = loadoutOf(player);
  if (!loadout?.config.neverReloadInTelegraph) return false;
  const heldAt = getResource(player.tracksCombat, RELOAD_HELD_AT);
  if (heldAt > 0 && now - heldAt >= TELEGRAPH_HOLD_MAX_MS) return false;
  return momentActive(world, player, 'inside-telegraph', undefined, now);
}

/** The empty clip starts waiting on the telegraph (the reload gate, on the round that emptied it). */
export function holdReload(player: PlayerEntity, now: number): void {
  if (getResource(player.tracksCombat, RELOAD_HELD_AT) <= 0) setResource(player.tracksCombat, RELOAD_HELD_AT, now);
  const tally = slingerTally(player, now);
  if (tally) tally.deferredReloads += 1;
}

/** Whether an empty clip is waiting on a telegraph; `release` ends the wait. */
export function reloadHeld(player: PlayerEntity): boolean {
  return getResource(player.tracksCombat, RELOAD_HELD_AT) > 0;
}

export function releaseReload(player: PlayerEntity): void {
  setResource(player.tracksCombat, RELOAD_HELD_AT, 0);
}

/** The clip the Loadout's rules load now: the first rule that holds, else the plain clip. */
export function chooseClip(world: World, player: PlayerEntity, loadout: Loadout, now: number): string {
  const racked = new Set(loadout.config.rack);
  for (const rule of loadout.config.clipRules) {
    if (rule.clip !== PLAIN && !racked.has(rule.clip)) continue;
    if (conditionsHold(world, player, rule.conditions, now)) return rule.clip;
  }
  return PLAIN;
}

/**
 * Gunslinger's second gun (bible §10.5): its own clip type from the rack. A damage clip and a
 * control clip is the default (§10.13), so another family comes first: the next rule of another
 * family that holds; failing that, the first racked clip of another family; failing that, the next
 * rule that holds and differs from the first gun's clip; else any other racked clip, else the plain
 * clip. PLACEHOLDER reading: the config has no field for the second gun's clip yet.
 */
export function chooseTwinClip(world: World, player: PlayerEntity, loadout: Loadout, first: string, now: number): string {
  const racked = new Set(loadout.config.rack);
  const family = CLIPS.get(first)?.family;
  const holding = loadout.config.clipRules.filter((rule) =>
    rule.clip !== first && (rule.clip === PLAIN || racked.has(rule.clip)) && conditionsHold(world, player, rule.conditions, now));
  const others = loadout.config.rack.filter((id) => id !== first);
  return holding.find((rule) => CLIPS.get(rule.clip)?.family !== family)?.clip
    ?? others.find((id) => CLIPS.get(id)?.family !== family)
    ?? holding[0]?.clip
    ?? others[0]
    ?? PLAIN;
}

/** The clip that fires round `index` (1-based) of the clip: with twin guns the even rounds are the second gun's. */
function clipForRound(player: PlayerEntity, index: number): string {
  const reload = player.usesReload!;
  if (disciplineOf(player) === GUNSLINGER && index % 2 === 0) return getString(player.tracksCombat, TWIN_CLIP) || reload.clipId;
  return reload.clipId;
}

/** Walking while reloading: 0 by default (stationary, §10.2); Quickdraw lets you walk. Null when not reloading. */
export function reloadMoveMult(player: PlayerEntity): number | null {
  if (!loadoutOf(player) || player.usesReload!.reloadingMs <= 0) return null;
  return player.usesSkills.passives['slinger.reload-walk-pct'] ?? 0;
}

/** Regroup's speed layer: > 1 while the window after a big hit is open (and Slip Away's, while it holds). */
export function regroupSpeedMult(player: PlayerEntity, now: number): number {
  const pct = player.usesSkills.passives['slinger.regroup-speed-pct'] ?? 0;
  const regroup = pct > 0 && getResource(player.tracksCombat, REGROUP_UNTIL) > now ? 1 + pct : 1;
  // Slip Away (T4 leaf) rides the same layer: written by the Slinger's tick while an enemy is in melee with you.
  const slip = getResource(player.tracksCombat, SLIP_AWAY_X);
  return slip > 1 ? regroup * slip : regroup;
}

function nearEnemies(world: World, player: PlayerEntity, radius: number): { count: number; nearest: number } {
  let count = 0;
  let nearest = Infinity;
  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (monster.hasHealth.hp <= 0) continue;
    const d = Math.hypot(monster.hasPosition.current.x - player.hasPosition.current.x, monster.hasPosition.current.y - player.hasPosition.current.y);
    nearest = Math.min(nearest, d);
    if (d <= radius) count++;
  }
  return { count, nearest };
}

/** Whether any enemy has its aggro on this player (Undergrowth's quiet). */
function isTargeted(world: World, player: PlayerEntity): boolean {
  for (const monster of world.aggroedMonsters) {
    if (monster.hasAggroTarget.targetKind === 'player' && monster.hasAggroTarget.targetId === player.isPlayer.id) return true;
  }
  return false;
}

/**
 * Trickshot's called shot: when the last round is next, the attack target becomes the one the
 * rule picks (anywhere in reach), so the round flies there through the ordinary pipeline and
 * carries the trophy's twist with it. The previous target comes back once the round is fired.
 */
function updateCalledShot(world: World, player: PlayerEntity, loadout: Loadout, now: number): void {
  const reload = player.usesReload!;
  const cs = player.tracksCombat;
  const from = getString(cs, CALLED_FROM);
  if (reload.reloadingMs <= 0 && reload.ammo === 1) {
    const picked = pickCalledTarget(world, player, loadout.config.calledShot, now);
    const current = player.hasAttackTarget?.targetId ?? '';
    if (picked && picked.isMonster.id !== current) {
      if (!from) setString(cs, CALLED_FROM, current);
      setAttackTarget(world, player, picked.isMonster.id);
    }
  } else if (from) {
    setString(cs, CALLED_FROM, '');
    const back = world.getMonsterEntity(from);
    if (back && back.hasHealth.hp > 0) setAttackTarget(world, player, from);
  }
}

/** Per-tick Loadout: the next clip, early and switch reloads, the disciplines, and the gear lines' factors. */
export function updateSlinger(world: World, player: PlayerEntity, dt: number, now: number): void {
  const loadout = loadoutOf(player);
  if (!loadout) return;
  const reload = player.usesReload!;
  const cs = player.tracksCombat;
  const passives = player.usesSkills.passives;
  const discipline = disciplineOf(player);

  reload.nextClipId = chooseClip(world, player, loadout, now);
  // A full, unfired clip follows the rules (swapping it costs nothing); a started one keeps its rounds.
  if (reload.reloadingMs <= 0 && reload.ammo === reload.ammoMax) {
    reload.clipId = reload.nextClipId;
    if (discipline === GUNSLINGER) setString(cs, TWIN_CLIP, chooseTwinClip(world, player, loadout, reload.clipId, now));
  }

  const inCombat = isPlayerInCombat(player, now);
  const idle = reload.reloadingMs <= 0 && reload.ammo > 0;

  // A switch reload: a rule that wants another clip dumps this one (rounds lost, a stationary reload).
  // Never one that would start inside a telegraph.
  if (idle && !reloadWaitsOnTelegraph(world, player, now)) {
    const switchTo = loadout.config.clipRules.find((rule) =>
      rule.switchEarly && rule.clip !== reload.clipId && (rule.clip === PLAIN || loadout.config.rack.includes(rule.clip))
      && conditionsHold(world, player, rule.conditions, now));
    if (switchTo) {
      // Quick Swap: the rounds you had left come back in the next clip.
      if (leafPicked(player, QUICK_SWAP)) setResource(cs, SWAP_CARRY, reload.ammo);
      startReloadTimer(world, player, resolveReloadTimeMs(player));
      emitReloadStart(world, player);
      const tally = slingerTally(player, now);
      if (tally) tally.switchReloads += 1;
    }
  }
  // Reload early when nothing threatens you (a free rule, on by default).
  if (idle && reload.reloadingMs <= 0 && loadout.config.reloadEarlyWhenSafe && !inCombat && reload.ammo < reload.ammoMax) {
    startReloadTimer(world, player, resolveReloadTimeMs(player));
    emitReloadStart(world, player);
    const tally = slingerTally(player, now);
    if (tally) tally.earlyReloads += 1;
  }
  // Telemetry (dev only): time reloading against time firing in a fight.
  const tally = slingerTally(player, now);
  if (tally) {
    if (reload.reloadingMs > 0 && inCombat) tally.reloadMs += dt;
    else if (inCombat) tally.firingMs += dt;
    flushSlingerTally(player, now);
  }

  // Siege: a reload that started without a round of ours (early, switch) fires the shell here.
  if (shellPending(player)) fireShell(world, player, freshClip(player));
  if (discipline === TRICKSHOT) updateCalledShot(world, player, loadout, now);

  // Tracer: a traced target that went to ground stays a legal target.
  revealTraced(world, player, now);
  // Seeker: with it loaded (either gun), a target that burrowed, dived or hid inside reach is found.
  if (reload.clipId === 'slinger-seeker' || (discipline === GUNSLINGER && getString(cs, TWIN_CLIP) === 'slinger-seeker')) revealSeekable(world, player);
  // Tracer II: a traced target that flees moves slower. Tether: a held target cannot get away. Rime: frozen ground. Burns tick.
  const fleeSlow = clipParams(loadout, 'slinger-tracer')['fleeSlowPct'] ?? 0;
  if (fleeSlow > 0) fleeSlowTick(world, player, fleeSlow, now);
  tetherTick(world, player, now);
  rimeTick(world, player, now);
  tickBurns(world, player, dt);
  aftershockTick(world, player, now);
  sweepChillMarkers(world);
  // The T4 leaves that stand on the fight: Stakes, Slip Away, Steady Nerve.
  if (leafPicked(player, STAKES)) stakesTick(world, player, now);
  const touched = (leafPicked(player, SLIP_AWAY) || leafPicked(player, STEADY_NERVE)) && momentActive(world, player, 'touched', undefined, now);
  const slip = leafPicked(player, SLIP_AWAY) && touched ? SLIP_AWAY_MULT : 0;
  if (getResource(cs, SLIP_AWAY_X) !== slip) setResource(cs, SLIP_AWAY_X, slip);
  if (touched && leafPicked(player, STEADY_NERVE)) steadyNerveTick(player);
  // Pressure Suit: no debuff lands while you reload.
  if ((passives['slinger.pressure-suit'] ?? 0) > 0 && reload.reloadingMs > 0) pressureSuitTick(player);
  // Entrenched: standing still ramps fire rate and the shell.
  if (discipline === SIEGE && specializationOf(player) === ENTRENCHED) entrenchTick(player, now);
  else if (getResource(cs, 'slinger.entrench') > 0) clearEntrench(player);
  // Deadeye: the last round is no longer waiting once it is not the next one.
  if (!(reload.reloadingMs <= 0 && reload.ammo === 1)) resetDeadeye(player);
  // Lookout: the ambusher that sprang on you while you reload.
  const lookout = passives['slinger.lookout'] ?? 0;
  if (lookout > 0 && reload.reloadingMs > 0) lookoutAmbusher(world, player, lookout, now);
  // Shade: a mark or slow on you ends every so often.
  const shade = passives['slinger.shade'] ?? 0;
  if (shade > 0) shadeTick(player, shade, now);

  const { count, nearest } = nearEnemies(world, player, NEAR_PX);

  // Elbow Room: with a crowd around you, the reload runs faster.
  const elbow = passives['slinger.elbow-room'] ?? 0;
  if (elbow > 0 && reload.reloadingMs > 0 && count >= CROWD) reload.reloadingMs = Math.max(0, reload.reloadingMs - dt * elbow);

  // The Recovery lines (Breathing Room, Fleet, Snake Oil, Undergrowth), as one factor on the always-on share.
  let factor = 1;
  if ((passives['slinger.breathing-room'] ?? 0) > 0 && Number.isFinite(nearest)) factor *= 1 + Math.min(1, nearest / BREATHING_FULL_PX);
  if ((passives['slinger.fleet'] ?? 0) > 0 && player.isMoving) factor *= passives['slinger.fleet']!;
  const snake = passives['slinger.snake-oil'] ?? 0;
  if (snake > 0 && count === 0 && cs.statusEffects.some((e) => (e.data['isDot'] ?? 0) === 1 || e.id.includes('poison') || e.id.includes('hemorrhage'))) factor *= snake;
  const undergrowth = passives['slinger.undergrowth'] ?? 0;
  if (undergrowth > 0 && !isTargeted(world, player)) factor *= undergrowth;
  // Thaw: Recovery is multiplied while you are chilled or slowed.
  const thaw = passives['slinger.thaw'] ?? 0;
  if (thaw > 0 && isChilledOrSlowed(player)) factor *= thaw;
  // Heatsink: Recovery rises with the Heat while no enemy is near you.
  const heatsink = passives['slinger.heatsink'] ?? 0;
  if (heatsink > 0 && count === 0) factor *= 1 + heatsink * heatStacks(player);
  // Vigil: Recovery rises with the number of enemies in the fight while none is near you.
  const vigil = passives['slinger.vigil'] ?? 0;
  if (vigil > 0 && count === 0) factor *= 1 + vigil * fightSize(world, player);
  // Ballast: Recovery rises for each different debuff on you.
  const ballast = passives['slinger.ballast'] ?? 0;
  if (ballast > 0) factor *= 1 + ballast * distinctPlayerDebuffs(player);
  // Warm Hands: the Chill on you does not build while you reload.
  if ((passives['slinger.warm-hands'] ?? 0) > 0) holdChill(player, reload.reloadingMs > 0);
  if (getResource(cs, SLINGER_RECOVERY_X) !== factor) setResource(cs, SLINGER_RECOVERY_X, factor);

  syncDisciplineHud(world, player, discipline, now);
}

/** Fresh Powder: the shell takes the clip being loaded, not the one fired. */
function freshClip(player: PlayerEntity): string | undefined {
  return leafPicked(player, FRESH_POWDER) ? player.usesReload!.nextClipId : undefined;
}

/** The Chill on the player, or any slow (Thaw). */
function isChilledOrSlowed(player: PlayerEntity): boolean {
  return player.tracksCombat.statusEffects.some((effect) =>
    effect.remainingMs !== 0 && effect.stacks > 0
    && (effect.id === TUNDRA_CHILL_EFFECT_ID || effect.id === 'slow' || (effect.data['moveSlowPct'] ?? 0) > 0));
}

/** Warm Hands: while reloading the Chill may fall but not rise above what it was when the reload began. */
function holdChill(player: PlayerEntity, reloading: boolean): void {
  const cs = player.tracksCombat;
  const chill = getStatusEffect(cs, TUNDRA_CHILL_EFFECT_ID);
  const stacks = chill?.stacks ?? 0;
  const held = getResource(cs, CHILL_HELD);
  if (reloading && chill && stacks > held) chill.stacks = held > 0 ? held : stacks;
  else if (getResource(cs, CHILL_HELD) !== stacks) setResource(cs, CHILL_HELD, stacks);
}

/** A chill marker whose status ran out comes off. */
function sweepChillMarkers(world: World): void {
  for (const monster of [...world.chilledMonsters]) {
    if (!getStatusEffect(monster.tracksCombat, CHILL_STATUS_ID)) detachMarker(world, monster, 'hasChill');
  }
}

/**
 * The discipline facts the HUD cannot derive: Gunslinger's second gun, Siege's shell bank and Rime
 * Round's frozen ground. Present on the networked slice only while they apply, written only when they change.
 */
function syncDisciplineHud(world: World, player: PlayerEntity, discipline: string | null, now: number): void {
  const reload = player.usesReload!;
  const twin = discipline === GUNSLINGER ? getString(player.tracksCombat, TWIN_CLIP) || reload.clipId : undefined;
  const shell = discipline === SIEGE ? Math.round(shellBank(player)) : undefined;
  const rime = rimeGround(player, now);
  if (reload.twinClipId === twin && reload.shellBank === shell
    && reload.rimeX === rime?.x && reload.rimeY === rime?.y && reload.rimeRadius === rime?.radius) return;
  mutateSlice(world, player, 'usesReload', (slice) => {
    if (twin === undefined) delete slice.twinClipId; else slice.twinClipId = twin;
    if (shell === undefined) delete slice.shellBank; else slice.shellBank = shell;
    if (rime) { slice.rimeX = rime.x; slice.rimeY = rime.y; slice.rimeRadius = rime.radius; }
    else { delete slice.rimeX; delete slice.rimeY; delete slice.rimeRadius; }
  });
}

// ── Rounds ───────────────────────────────────────────────────────────────────

function isSlingerShot(ctx: { attackerType: string; defenderType: string; formation?: unknown; metadata: Record<string, unknown> }): boolean {
  return ctx.attackerType === 'player' && ctx.defenderType === 'monster' && !ctx.formation && typeof ctx.metadata['slingerClip'] === 'string';
}

/** The line from the player through the target: monsters within `width` of it, up to `length` past the player. */
function lineTargets(world: World, player: PlayerEntity, target: MonsterEntity, length: number, width: number): MonsterEntity[] {
  const from = player.hasPosition.current;
  const to = target.hasPosition.current;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / len;
  const uy = dy / len;
  return playerAoeTargets(world, player, from, length, target.isMonster.id).filter((monster) => {
    const rx = monster.hasPosition.current.x - from.x;
    const ry = monster.hasPosition.current.y - from.y;
    const along = rx * ux + ry * uy;
    const across = Math.abs(rx * uy - ry * ux);
    return along >= len && across <= width;
  });
}

function shove(world: World, from: { x: number; y: number }, monster: MonsterEntity, distance: number): void {
  applyKnockback(world, monster.isMonster.id, from, distance);
}

/** A live barrier or shield on the target (the mirror the client reads is refreshed every tick). */
function hasBarrier(target: MonsterEntity): boolean {
  return (target.hasStatus.enemyBarrier?.amount ?? 0) > 0;
}

const hpShare = (monster: MonsterEntity): number => monster.hasHealth.hp / Math.max(1, monster.hasHealth.maxHp);

/** Clip params, Crossfire-scaled (each number that makes the clip's effect bigger). */
function boostedParams(loadout: Loadout, clip: string, boost: number): Record<string, number> {
  const p = clipParams(loadout, clip);
  if (boost === 1) return p;
  const out = { ...p };
  for (const key of CROSSFIRE_KEYS) if (out[key] !== undefined) out[key] = out[key]! * boost;
  return out;
}

/**
 * Crossfire (bible §10.6): the previous round came from the other gun on this target a moment ago, so
 * both clips' effects land at +50%. Returns the factor and remembers this round.
 */
function crossfireBoost(player: PlayerEntity, target: MonsterEntity, clip: string, now: number, spec: string | null): number {
  const cs = player.tracksCombat;
  const prior = { clip: getString(cs, CROSS_CLIP), target: getString(cs, CROSS_TARGET), at: getResource(cs, CROSS_AT) };
  setString(cs, CROSS_CLIP, clip);
  setString(cs, CROSS_TARGET, target.isMonster.id);
  setResource(cs, CROSS_AT, now);
  if (spec !== CROSSFIRE) return 1;
  return prior.clip !== '' && prior.clip !== clip && prior.target === target.isMonster.id && now - prior.at <= CROSSFIRE_WINDOW_MS ? CROSSFIRE_EFFECT_MULT : 1;
}

/** One round's clip effect on the target it hit (the damage is already done). */
function applyClipEffect(
  world: World,
  player: PlayerEntity,
  loadout: Loadout,
  target: MonsterEntity,
  clip: string,
  hitDamage: number,
  now: number,
  boost: number,
  iceArmor = false,
): void {
  const passives = player.usesSkills.passives;
  const p = boostedParams(loadout, clip, boost);
  const at = target.hasPosition.current;
  if (clip === 'slinger-scatter') {
    const nicks = (p['nicks'] ?? 2) + (passives['slinger.scatter-extra'] ?? 0);
    const beside = playerAoeTargets(world, player, at, 110, target.isMonster.id)
      .sort((a, b) => Math.hypot(a.hasPosition.current.x - at.x, a.hasPosition.current.y - at.y) - Math.hypot(b.hasPosition.current.x - at.x, b.hasPosition.current.y - at.y))
      .slice(0, nicks);
    if (beside.length > 0) applyPlayerAoeTo(world, player, beside, hitDamage * (p['nickPct'] ?? 0.4), 'player', {}, {});
  } else if (clip === 'slinger-buckshot') {
    // A cone of pellets: the others in front of the muzzle take a share, and a charger is stopped.
    const from = player.hasPosition.current;
    const aim = Math.atan2(at.y - from.y, at.x - from.x);
    const half = ((p['coneDeg'] ?? 35) * Math.PI) / 180;
    const cone = playerAoeTargets(world, player, from, p['coneRangePx'] ?? 220, target.isMonster.id)
      .filter((monster) => {
        const off = Math.atan2(monster.hasPosition.current.y - from.y, monster.hasPosition.current.x - from.x) - aim;
        return Math.abs(Math.atan2(Math.sin(off), Math.cos(off))) <= half;
      })
      .slice(0, p['maxPellets'] ?? 3);
    if (cone.length > 0) applyPlayerAoeTo(world, player, cone, hitDamage * (p['pelletPct'] ?? 0.25), 'player', {}, {});
    for (const monster of [target, ...cone]) stopCharge(world, monster);
  } else if (clip === 'slinger-snare') {
    const cap = p['slowCap'] ?? 0.4;
    const prior = getStatusEffect(target.tracksCombat, 'ability-slowed')?.data['moveSlowPct'] ?? 0;
    const next = Math.min(cap, prior + (p['slowPerRound'] ?? 0.08));
    applyMonsterSlow(world, target, next, p['durationMs'] ?? 3000, player.isPlayer.id);
    // Snare II: at the cap the target's wind-ups take longer too (its attack cadence stretches).
    const attackSlow = p['capAttackSlow'] ?? 0;
    if (attackSlow > 0 && next >= cap - 1e-9) {
      const slowed = getStatusEffect(target.tracksCombat, 'ability-slowed');
      if (slowed) slowed.data['attackSlowPct'] = attackSlow;
    }
  } else if (clip === 'slinger-venom') {
    const long = 1 + (passives['slinger.poison-long-pct'] ?? 0);
    applyTickDot(world, player, target, SLINGER_VENOM_ID, hitDamage * (p['tickShare'] ?? 0.2), (p['ticksPerRound'] ?? 2) * long, (p['maxTicks'] ?? 12) * long, p['tickMs'] ?? 1000);
  } else if (clip === 'slinger-stopping') {
    const cs = target.tracksCombat;
    if (now - getResource(cs, SHOVE_AT) > (p['windowMs'] ?? 3000)) setResource(cs, SHOVES, 0);
    if (getResource(cs, SHOVES) < (p['maxShoves'] ?? 4)) {
      setResource(cs, SHOVES, getResource(cs, SHOVES) + 1);
      setResource(cs, SHOVE_AT, now);
      shove(world, player.hasPosition.current, target, p['shovePx'] ?? 22);
    }
    // Stopping II: a charger that is stopped is also staggered.
    if ((p['staggerMs'] ?? 0) > 0 && (target.controlsMonster.chargeRemainingMs ?? 0) > 0) {
      stopCharge(world, target);
      if (!monsterIgnoresControl(target)) applyStun(target.tracksCombat, p['staggerMs']!, player.isPlayer.id);
    }
  } else if (clip === 'slinger-tracer') {
    // It designates; it never stores damage (§10.16).
    traceTarget(player, target, now + (p['tracedMs'] ?? 8000));
  } else if (clip === 'slinger-acid') {
    // Instead of poison, each round eats a little plating, up to a cap.
    const cs = target.tracksCombat;
    const rounds = now - getResource(cs, ACID_AT) > (p['shredMs'] ?? 4000) ? 1 : getResource(cs, ACID_STACKS) + 1;
    setResource(cs, ACID_STACKS, rounds);
    setResource(cs, ACID_AT, now);
    applyFramePlatingShred(player, target, Math.min(p['shredCap'] ?? 0.6, rounds * (p['shredPerRound'] ?? 0.08)), p['shredMs'] ?? 4000);
  } else if (clip === 'slinger-tether') {
    tetherHit(player, target, p['rounds'] ?? 3, p['windowMs'] ?? 2500, p['tetherMs'] ?? 2000, now);
  } else if (clip === 'slinger-frost') {
    // Each round chills (slower attacks and movement) up to a cap; never freezes.
    // Frost II: it builds faster, and Ice Armor takes more of it.
    const builds = Math.max(1, Math.round((p['chillPerRound'] ?? 1) * (iceArmor || hasIceArmor(target) ? p['iceArmorMult'] ?? 1 : 1)));
    let chill = getStatusEffect(target.tracksCombat, CHILL_STATUS_ID);
    for (let i = 0; i < builds; i++) {
      chill = applyStatusEffect(target.tracksCombat, {
        id: CHILL_STATUS_ID, maxStacks: p['maxChill'] ?? 5, remainingMs: p['chillMs'] ?? 4000, refreshable: true, sourceId: player.isPlayer.id,
        data: { totalMs: p['chillMs'] ?? 4000, moveSlowPerStack: p['movePerChill'] ?? 0.06, attackSlowPerStack: p['attackPerChill'] ?? 0.05 },
      });
    }
    if (!chill) return;
    chill.data['moveSlowPerStack'] = Math.max(chill.data['moveSlowPerStack'] ?? 0, p['movePerChill'] ?? 0.06);
    chill.data['attackSlowPerStack'] = Math.max(chill.data['attackSlowPerStack'] ?? 0, p['attackPerChill'] ?? 0.05);
    attachMarker(world, target, 'hasChill');
  } else if (clip === 'slinger-incendiary') {
    // Each round sets the target burning up to a cap; it never detonates.
    applyBurn(player, target, hitDamage * (p['burnShare'] ?? 0.15), 1, p['maxBurn'] ?? 5, p['burnMs'] ?? 4000, p['tickMs'] ?? 1000);
  } else if (clip === 'slinger-thermite') {
    // The same burn, and it eats shells: obsidian and ice take it double.
    applyBurn(player, target, hitDamage * (p['burnShare'] ?? 0.15), 1, p['maxBurn'] ?? 5, p['burnMs'] ?? 4000, p['tickMs'] ?? 1000, { drain: p['shellDrain'] ?? 2, mult: p['shellMult'] ?? 2 });
  } else if (clip === 'slinger-hallowed') {
    // Risen enemies rise weaker. STAND-IN: one struck by these rounds is weakened (the corpse has no weakness field).
    if (target.isRaised) weakenRisen(world, target, p['weakenPct'] ?? 0.3);
  }
}

/** The equipped trophy round's twist on a target it struck (the damage is already done). */
function applyTrophy(world: World, player: PlayerEntity, loadout: Loadout, target: MonsterEntity, hitDamage: number, now: number): void {
  const trophy = loadout.trophy;
  if (!trophy) return;
  const t = trophyParams(loadout);
  const at = target.hasPosition.current;
  if (trophy.id === 'slinger-relic-plains') {
    const behind = lineTargets(world, player, target, t['lineLength'] ?? 240, t['lineWidth'] ?? 44);
    for (const monster of [target, ...behind]) {
      shove(world, player.hasPosition.current, monster, t['shovePx'] ?? 90);
      // Stampede Round II: the shove also knocks them down.
      if ((t['knockdownMs'] ?? 0) > 0 && !monsterIgnoresControl(monster)) applyStun(monster.tracksCombat, t['knockdownMs']!, player.isPlayer.id);
    }
  } else if (trophy.id === 'slinger-relic-forest') {
    applyPlayerAoeTo(world, player, [target], hitDamage * (t['secondShotPct'] ?? 0.6), 'player', {}, {});
  } else if (trophy.id === 'slinger-relic-swamp') {
    const ticks = t['ticks'] ?? 4;
    applyTickDot(world, player, target, SLINGER_ROT_ID, (hitDamage * (t['sharePct'] ?? 0.5)) / ticks, ticks, ticks, t['tickMs'] ?? 1000);
  } else if (trophy.id === 'slinger-relic-mountain') {
    const around = playerAoeTargets(world, player, at, t['radius'] ?? 110, target.isMonster.id);
    // Quake Round II: the wider blast also cracks plating. III: it knocks down.
    if ((t['crackFraction'] ?? 0) > 0) for (const monster of [target, ...around]) applyFramePlatingShred(player, monster, t['crackFraction']!, t['crackMs'] ?? 6000);
    if ((t['knockdownMs'] ?? 0) > 0) for (const monster of [target, ...around]) if (!monsterIgnoresControl(monster)) applyStun(monster.tracksCombat, t['knockdownMs']!, player.isPlayer.id);
    if (around.length > 0) applyPlayerAoeTo(world, player, around, hitDamage * (t['blastPct'] ?? 0.8), 'player', {}, {});
    // Quake Round IV: the blast leaves aftershocks.
    if ((t['aftershocks'] ?? 0) > 0) queueAftershocks(player, at, t['radius'] ?? 110, t['aftershocks']!, hitDamage * (t['aftershockPct'] ?? 0.35), t['aftershockMs'] ?? 700, now);
  } else if (trophy.id === 'slinger-relic-cave') {
    const nearestTo = (from: { x: number; y: number }) => (a: MonsterEntity, b: MonsterEntity) =>
      Math.hypot(a.hasPosition.current.x - from.x, a.hasPosition.current.y - from.y) - Math.hypot(b.hasPosition.current.x - from.x, b.hasPosition.current.y - from.y);
    const radius = t['radius'] ?? 220;
    const share = t['splinterPct'] ?? 0.5;
    const others = playerAoeTargets(world, player, at, radius, target.isMonster.id).sort(nearestTo(at)).slice(0, t['splinters'] ?? 3);
    if (others.length > 0) applyPlayerAoeTo(world, player, others, hitDamage * share, 'player', {}, {});
    // Splinter Round III: each splinter splits once more, on to the nearest enemy not yet struck.
    if ((t['splitAgain'] ?? 0) > 0) {
      const struck = new Set([target.isMonster.id, ...others.map((monster) => monster.isMonster.id)]);
      for (const splinter of others) {
        const from = splinter.hasPosition.current;
        const next = playerAoeTargets(world, player, from, radius, splinter.isMonster.id).filter((monster) => !struck.has(monster.isMonster.id)).sort(nearestTo(from)).slice(0, t['splitAgain']);
        if (next.length === 0) continue;
        for (const monster of next) struck.add(monster.isMonster.id);
        applyPlayerAoeTo(world, player, next, hitDamage * share * share, 'player', {}, {});
      }
    }
  } else if (trophy.id === 'slinger-relic-tundra') {
    // Rime Round: the ground at the target freezes and slows whatever stands on it.
    layRime(player, at, t['radius'] ?? 120, t['slowPct'] ?? 0.4, t['groundMs'] ?? 6000, now);
  } else if (trophy.id === 'slinger-relic-volcanic') {
    // Cinder Round: everything around the target is set burning.
    for (const monster of [target, ...playerAoeTargets(world, player, at, t['radius'] ?? 140, target.isMonster.id)]) {
      if (monster.hasHealth.hp > 0) applyBurn(player, monster, hitDamage * (t['burnShare'] ?? 0.2), t['stacks'] ?? 2, 5, 4000, 1000);
    }
  } else if (trophy.id === 'slinger-relic-trench') {
    // Harpoon Round: for a few seconds it can't get away. STAND-IN: held as Tether holds (a root when it tries to flee, dive or burrow) and traced, so it cannot hide.
    tetherFor(player, target, t['harpoonMs'] ?? 4000, now);
    traceTarget(player, target, now + (t['harpoonMs'] ?? 4000));
  }
}

/** Ricochet and Pierce: what the called shot does beyond its target. */
function calledShotExtras(world: World, player: PlayerEntity, loadout: Loadout, target: MonsterEntity, hitDamage: number, now: number, spec: string | null): void {
  if (spec === RICOCHET) {
    // The shot bounces on to more enemies the rule picks, each taking a share and the trophy's twist.
    const struck = new Set([target.isMonster.id]);
    for (let i = 0; i < RICOCHET_BOUNCES; i++) {
      const next = pickCalledTarget(world, player, loadout.config.calledShot, now, struck);
      if (!next) break;
      struck.add(next.isMonster.id);
      const damage = hitDamage * RICOCHET_SHARE;
      applyPlayerAoeTo(world, player, [next], damage, 'player', {}, {});
      if (next.hasHealth.hp > 0) applyTrophy(world, player, loadout, next, damage, now);
    }
  } else if (spec === PIERCE) {
    // Everything between you and the target takes the shot in full.
    const from = player.hasPosition.current;
    const to = target.hasPosition.current;
    const len = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
    const ux = (to.x - from.x) / len;
    const uy = (to.y - from.y) / len;
    const between = playerAoeTargets(world, player, from, len, target.isMonster.id).filter((monster) => {
      const rx = monster.hasPosition.current.x - from.x;
      const ry = monster.hasPosition.current.y - from.y;
      return rx * ux + ry * uy > 0 && Math.abs(rx * uy - ry * ux) <= PIERCE_WIDTH_PX;
    });
    for (const monster of between) {
      applyPlayerAoeTo(world, player, [monster], hitDamage, 'player', {}, {});
      if (monster.hasHealth.hp > 0) applyTrophy(world, player, loadout, monster, hitDamage, now);
    }
  }
}

export function registerSlinger(): void {
  registerReloadLifecycleHook({
    onStart(world, player) {
      if (!loadoutOf(player)) return;
      const tally = slingerTally(player);
      if (tally) {
        tally.reloads += 1;
        if (momentActive(world, player, 'inside-telegraph', undefined, Date.now())) tally.reloadsInTelegraph += 1;
      }
      // Siege: the shell fires with the reload (once the round that started it has banked). Rolling Fire carries none.
      if (disciplineOf(player) === SIEGE && specializationOf(player) !== ROLLING_FIRE) markShellPending(player);
      endFan(player);
    },
    onComplete(world, player) {
      const loadout = loadoutOf(player);
      if (!loadout) return;
      const now = Date.now();
      player.usesReload!.clipId = chooseClip(world, player, loadout, now);
      if (disciplineOf(player) === GUNSLINGER) setString(player.tracksCombat, TWIN_CLIP, chooseTwinClip(world, player, loadout, player.usesReload!.clipId, now));
      // Quick Swap: the rounds a switch reload threw away come back with this clip.
      const carry = getResource(player.tracksCombat, SWAP_CARRY);
      if (carry > 0) {
        setResource(player.tracksCombat, SWAP_CARRY, 0);
        if (leafPicked(player, QUICK_SWAP)) player.usesReload!.ammo += carry;
      }
      // Fan the Hammer: after every reload spin the first rounds fire at triple rate.
      if (disciplineOf(player) === GUNSLINGER && specializationOf(player) === FAN_THE_HAMMER) startFan(player);
    },
  });

  // Tag each shot with its clip and place in the clip. Registered after the reload gate and ammo
  // bookkeeping, so `ammo` is already this shot's remainder (0 = the last round).
  registerCombatListener('beforeAttack', (ctx) => {
    if (ctx.attackerType !== 'player' || ctx.cancelled) return;
    const player = ctx.attacker as PlayerEntity;
    const loadout = loadoutOf(player);
    if (!loadout || ctx.metadata['reloadClipShot'] !== true) return;
    const index = Number(ctx.metadata['reloadClipIndex'] ?? 1);
    const clip = clipForRound(player, index);
    const last = ctx.metadata['pendingReloadStart'] === true;
    ctx.metadata['slingerClip'] = clip;
    ctx.metadata['slingerRound'] = index;
    ctx.metadata['slingerLastRound'] = last;
    // Breaching: the half-plating price moved here, and goes further (bible §10.4).
    if (clip === 'slinger-breaching') ctx.platingMult = clipParams(loadout, clip)['platingMult'] ?? 0.25;
    if (last) {
      // Trickshot: the last round is the called shot.
      if (disciplineOf(player) === TRICKSHOT) {
        ctx.metadata['slingerCalled'] = true;
        // Deadeye: a round that was held hits much harder.
        if (specializationOf(player) === DEADEYE && takeDeadeyeHeld(player)) ctx.metadata['slingerHeld'] = true;
      }
      // Hunter's Round follows its target and can't miss: the monster's dodge clock skips it
      // (the same exemption a completed cast's hit gets). PLACEHOLDER: any target, not only a fleeing one.
      if (loadout.trophy?.id === 'slinger-relic-jungle') ctx.metadata['castDelivered'] = true;
    }
    countRound(player, clip, last, loadout.trophy?.id, ctx.metadata['slingerCalled'] === true);
  });

  // Damage: typed rounds trade raw damage for their effect; the gun's lines and the last round shape it.
  registerCombatListener('onHit', (ctx, world) => {
    if (!isSlingerShot(ctx)) return;
    const player = ctx.attacker as PlayerEntity;
    const target = ctx.defender as MonsterEntity;
    const loadout = loadoutOf(player);
    if (!loadout) return;
    const passives = player.usesSkills.passives;
    const clip = ctx.metadata['slingerClip'] as string;
    const round = Number(ctx.metadata['slingerRound'] ?? 1);
    const last = ctx.metadata['slingerLastRound'] === true;
    const p = clipParams(loadout, clip);
    const spec = specializationOf(player);
    const from = player.hasPosition.current;
    const at = target.hasPosition.current;
    const dist = Math.hypot(at.x - from.x, at.y - from.y);
    let mult = clip === PLAIN ? 1 : (p['damagePct'] ?? 1);
    if (round <= 2) mult *= 1 + (passives['slinger.opener-pct'] ?? 0); // Carbine: the first rounds
    mult *= 1 + (passives['slinger.ramp-pct'] ?? 0) * (round - 1); // Drum Gun: each round more
    mult *= 1 + (passives['slinger.far-pct'] ?? 0) * Math.min(1, dist / FAR_FULL_PX); // Hunting Rifle: the farther the harder
    mult *= 1 + (passives['slinger.damage-pct'] ?? 0); // Glass Duster
    if (clip === 'slinger-buckshot') mult *= 1 + (p['closeBonus'] ?? 0) * (1 - Math.min(1, dist / (p['closePx'] ?? 160))); // harder up close
    if (clip === 'slinger-hollow-point' && hpShare(target) < (p['belowHp'] ?? 0.5)) {
      // Hollow-point II: the bonus doubles below a third.
      const low = (p['lowHp'] ?? 0) > 0 && hpShare(target) < p['lowHp']!;
      mult *= 1 + (p['bonusPct'] ?? 0.5) * (low ? p['lowMult'] ?? 1 : 1);
    }
    if (clip === 'slinger-shellbreaker' && hasBarrier(target)) mult *= p['barrierMult'] ?? 2;
    if (clip === 'slinger-frost') ctx.metadata['slingerIceArmor'] = hasIceArmor(target); // before the barrier soaks the round
    if (clip === 'slinger-exploit') mult *= 1 + (p['perDebuff'] ?? 0.15) * Math.min(p['maxDebuffs'] ?? 6, distinctMonsterDebuffs(target)); // each different debuff
    if (clip === 'slinger-hallowed' && target.isRaised) mult *= p['risenMult'] ?? 2; // risen enemies take double
    // Tracer III: rounds on a traced target hit harder while it flees or hides.
    const fleeHit = clipParams(loadout, 'slinger-tracer')['fleeHitPct'] ?? 0;
    if (fleeHit > 0 && isTracedBy(target, player.isPlayer.id, attackNow(ctx)) && (target.isConcealed || isGettingAway(player, target))) mult *= 1 + fleeHit;
    const pressure = passives['slinger.pressure-pct'] ?? 0; // Pressure Rifle: the more HP the target has left
    if (pressure > 0) mult *= 1 + pressure * hpShare(target);
    if (clip === 'slinger-seeker' && target.isConcealed) mult *= p['hiddenPct'] ?? 0.7; // a target found in cover: lighter
    const cold = passives['slinger.cold-pct'] ?? 0; // Frostlock Rifle: chilled, slowed or rooted enemies
    if (cold > 0 && isColdTarget(target)) mult *= 1 + cold;
    const heatPct = passives['slinger.heat-pct'] ?? 0; // Firebrand Pistol: each step of the Heat
    if (heatPct > 0) mult *= 1 + heatPct * heatStacks(player);
    if (spec === GUN_KATA && dist <= KATA_CLOSE_PX) mult *= KATA_CLOSE_MULT; // Gun Kata: up close
    if (disciplineOf(player) === SIEGE) mult *= SIEGE_ROUND_PCT; // the other half of the damage is the shell
    if (last) {
      mult *= 1 + (passives['slinger.last-round-pct'] ?? 0); // Hand Cannon
      if (getStatusEffect(target.tracksCombat, SLINGER_VENOM_ID)) mult *= 1 + (passives['slinger.last-vs-poisoned-pct'] ?? 0); // Snakebite
      if (ctx.metadata['slingerCalled'] === true) mult *= CALLED_SHOT_MULT; // Trickshot
      if (ctx.metadata['slingerHeld'] === true) mult *= DEADEYE_HELD_MULT; // Deadeye: the held round
      // Improvise: the loaded clip does nothing to the called shot's target, so the shot makes up for it.
      if (ctx.metadata['slingerCalled'] === true && leafPicked(player, IMPROVISE) && clipDoesNothing(target, clip)) mult *= IMPROVISE_MULT;
      // Toll Round: harder for every enemy in the fight.
      if (loadout.trophy?.id === 'slinger-relic-graveyard') {
        const toll = trophyParams(loadout);
        mult *= 1 + (toll['perEnemy'] ?? 0.1) * Math.min(toll['maxEnemies'] ?? 10, fightSize(world, player));
      }
      if (loadout.trophy?.id === 'slinger-relic-jungle') mult *= 1 + (trophyParams(loadout)['farPctPer100px'] ?? 0) * (dist / 100); // Hunter's Round
    }
    if (mult !== 1) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * mult));
      if (mult > 1 && ctx.metadata['empoweredMultiplier'] === undefined) ctx.metadata['empoweredMultiplier'] = mult;
    }
    // Shellbreaker II: a barrier breaks in a few rounds (enough damage to take it down in one blow, so Ice Armor shatters).
    const breakAfter = clip === 'slinger-shellbreaker' ? p['breakAfterRounds'] ?? 0 : 0;
    if (breakAfter > 0) {
      const key = 'slinger.sb.rounds.' + player.isPlayer.id;
      const barrier = target.hasStatus.enemyBarrier?.amount ?? 0;
      const rounds = barrier > 0 ? getResource(target.tracksCombat, key) + 1 : 0;
      setResource(target.tracksCombat, key, rounds >= breakAfter ? 0 : rounds);
      if (barrier > 0 && rounds >= breakAfter) ctx.damage = Math.max(ctx.damage, Math.ceil(barrier + target.mitigatesDamage.plating) + 1);
    }
    // Bounty Round: the last round finishes a target below a threshold (a threshold, not an on-kill).
    if (last && loadout.trophy?.id === 'slinger-relic-desert' && hpShare(target) < (trophyParams(loadout)['threshold'] ?? 0.15)) {
      ctx.damage = Math.max(ctx.damage, target.hasHealth.hp);
    }
  });

  // The round's effect, then the trophy on the last round.
  registerCombatListener('afterHit', (ctx, world) => {
    if (!isSlingerShot(ctx)) return;
    const player = ctx.attacker as PlayerEntity;
    const target = ctx.defender as MonsterEntity;
    const loadout = loadoutOf(player);
    if (!loadout) return;
    const clip = ctx.metadata['slingerClip'] as string;
    const round = Number(ctx.metadata['slingerRound'] ?? 1);
    const hitDamage = ctx.damage;
    const now = attackNow(ctx);
    const last = ctx.metadata['slingerLastRound'] === true;
    const spec = specializationOf(player);
    const discipline = disciplineOf(player);

    // Fan the Hammer: the burst covers the first rounds only.
    if (spec === FAN_THE_HAMMER && (round >= FAN_ROUNDS || last)) endFan(player);

    // Siege: every round charges the shell. Deathmark: the enemy it hit is marked.
    if (discipline === SIEGE && hitDamage > 0) {
      bankShell(player, target, clip, hitDamage);
      if (spec === DEATHMARK && target.hasHealth.hp > 0) markDeathmark(player, target);
    }

    // Reaper's Repeater: each round splashes a share of its damage to the enemies around the target.
    const splash = player.usesSkills.passives['slinger.splash-pct'] ?? 0;
    if (splash > 0 && hitDamage > 0) {
      const around = playerAoeTargets(world, player, target.hasPosition.current, SPLASH_PX, target.isMonster.id);
      if (around.length > 0) applyPlayerAoeTo(world, player, around, hitDamage * splash, 'player', {}, {});
    }

    if (target.hasHealth.hp > 0 && hitDamage > 0) {
      const boost = crossfireBoost(player, target, clip, now, spec);
      applyClipEffect(world, player, loadout, target, clip, hitDamage, now, boost, ctx.metadata['slingerIceArmor'] === true);

      // Gun Kata: an enemy in melee with you takes both guns at once.
      if (spec === GUN_KATA && target.hasHealth.hp > 0) {
        const from = player.hasPosition.current;
        const at = target.hasPosition.current;
        if (Math.hypot(at.x - from.x, at.y - from.y) <= KATA_MELEE_PX) {
          const other = clip === player.usesReload!.clipId ? getString(player.tracksCombat, TWIN_CLIP) || clip : player.usesReload!.clipId;
          const share = (other === PLAIN ? 1 : clipParams(loadout, other)['damagePct'] ?? 1) / (clip === PLAIN ? 1 : clipParams(loadout, clip)['damagePct'] ?? 1);
          applyPlayerAoeTo(world, player, [target], hitDamage * share, 'player', {}, {});
          if (target.hasHealth.hp > 0) applyClipEffect(world, player, loadout, target, other, hitDamage * share, now, 1);
        }
      }

      if (last) {
        applyTrophy(world, player, loadout, target, hitDamage, now);
        if (ctx.metadata['slingerCalled'] === true) calledShotExtras(world, player, loadout, target, hitDamage, now, spec);
        // Hunter's Round and Bounty Round act on the hit itself (onHit above).
      }
    }

    // Siege: the round that emptied the clip has banked; the reload's shell fires now. Rolling Fire fires a small one every few rounds.
    if (discipline === SIEGE) {
      if (spec === ROLLING_FIRE) {
        if (round % ROLLING_EVERY_ROUNDS === 0 || last) fireShell(world, player, freshClip(player));
      } else if (shellPending(player)) {
        fireShell(world, player, freshClip(player));
      }
    }
  });

  // The defensive lines: Dig In and Hunker while you reload, Regroup after a big hit.
  registerCombatListener('onDamageTaken', (ctx) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender as PlayerEntity;
    const reload = player.usesReload;
    if (!reload || reload.reloadingMs <= 0) return;
    const passives = player.usesSkills.passives;
    // The T4 leaves for the caught-reloading window: Light Hands, Bunker, Cool Reload; and Hallowed Ground.
    if (leafPicked(player, LIGHT_HANDS) && lightHandsHit(player, LIGHT_HANDS_EVERY_MS, attackNow(ctx))) ctx.damage = Math.max(1, Math.round(ctx.damage * LIGHT_HANDS_MULT));
    if (leafPicked(player, BUNKER)) ctx.damage = Math.max(1, Math.round(ctx.damage * BUNKER_MULT));
    if (leafPicked(player, COOL_RELOAD) && (ctx.metadata['empoweredAttack'] === true || typeof ctx.metadata['abilityName'] === 'string')) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * COOL_RELOAD_MULT));
    }
    const hallowedGround = passives['slinger.hallowed-ground'] ?? 0;
    if (hallowedGround > 0 && (ctx.attacker as MonsterEntity).isRaised) ctx.damage = Math.max(1, Math.round(ctx.damage * hallowedGround));
    const hunker = passives['slinger.hunker'] ?? 0;
    if (hunker > 1) {
      const extra = player.mitigatesDamage.plating * (hunker - 1) * (1 - player.mitigatesDamage.damageReduction);
      ctx.damage = Math.max(1, Math.round(ctx.damage - extra));
    }
    const dig = passives['slinger.dig-in'] ?? 0;
    if (dig > 0) ctx.damage = Math.min(ctx.damage, Math.max(1, Math.round(player.hasHealth.maxHp * dig)));
    // Asbestos Coat: the Heat's extra damage does not apply while you reload. The amplifier runs after this
    // listener and multiplies by 1 + (all amplifiers), so pre-shrink the hit by the Heat's share of that.
    if ((passives['slinger.asbestos'] ?? 0) > 0) {
      const heat = getStatusEffect(player.tracksCombat, VOLCANIC_HEAT_EFFECT_ID);
      if (heat) {
        const heatPct = statusDamageAmplifierPct(heat, DAMAGE_TAKEN_PCT_KEY);
        const all = playerIncomingDamageMult(player.tracksCombat);
        if (heatPct > 0 && all > 1) ctx.damage = Math.max(1, Math.round((ctx.damage * (all - heatPct)) / all));
      }
    }
  });
  registerCombatListener('afterHit', (ctx) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender as PlayerEntity;
    const tally = player.usesReload ? slingerTally(player) : null;
    if (tally) {
      if (player.usesReload!.reloadingMs > 0) tally.takenReloading += ctx.damage;
      else tally.takenFiring += ctx.damage;
    }
    if ((player.usesSkills.passives['slinger.regroup-speed-pct'] ?? 0) <= 0) return;
    if (ctx.damage >= player.hasHealth.maxHp * BIG_HIT_SHARE) setResource(player.tracksCombat, REGROUP_UNTIL, attackNow(ctx) + REGROUP_MS);
  });
}
