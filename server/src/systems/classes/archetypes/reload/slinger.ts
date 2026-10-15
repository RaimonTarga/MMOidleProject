/**
 * The Slinger at runtime (class-first build plan CL.1–CL.2, T2-SLINGER; bible §10.2–§10.5,
 * §10.16): the clip it loads at each reload (picked by the Loadout's rules), the effect every
 * round of that clip carries, the trophy round that closes every clip, the stationary reload,
 * the three disciplines (twin guns, the shell, the called shot) and the gun and gear lines that
 * bend them. Wiring only: every number is a placeholder (kit `params`, `slinger/tuning.ts`, the
 * constants below, the gear keys).
 *
 * The old frame, range, and T3 paths are gone (CL7). This file is the Loadout runtime.
 */
import {
  pieceParamsAt,
  SLINGER_KIT,
  getResource,
  getStatusEffect,
  getString,
  setResource,
  setString,
  trophyParamsAt,
  type ClassConfigContext,
  type LoadoutConfig,
  type SlingerPiece,
  type SlingerTrophy,
} from '@mmo-idle/shared';
import { mutateSlice } from '../../../../ecs/dirtyHelpers';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { isPlayerInCombat } from '../../../combat/ai/engagement';
import { setAttackTarget } from '../../../combat/ai/targeting';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { SLINGER_ROT_ID, SLINGER_VENOM_ID } from '../../../combat/damage/bleedIds';
import { applyKnockback } from '../../../combat/damage/knockback';
import { attackNow, registerCombatListener } from '../../../combat/engine/combatPipeline';
import { conditionsHold } from '../../../combat/moments/moments';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { applyMonsterSlow } from '../../../combat/status/monsterControl';
import { applyStun } from '../../../combat/status/stun';
import { stopEntity } from '../../../world/movement';
import { classConfigContextOf } from '../../../player/progression/classConfig';
import { applyFramePlatingShred } from '../../shared/frameLoop';
import { applyTickDot } from '../../shared/tickDot';
import { pickCalledTarget } from '../../slinger/calledShot';
import { bankShell, fireShell, markShellPending, shellBank, shellPending } from '../../slinger/shell';
import { lookoutAmbusher, revealTraced, shadeTick, traceTarget } from '../../slinger/tracer';
import {
  CALLED_SHOT_MULT,
  FAR_FULL_PX,
  GUNSLINGER,
  SIEGE,
  SIEGE_ROUND_PCT,
  TRICKSHOT,
} from '../../slinger/tuning';
import { emitReloadStart, registerReloadLifecycleHook, startReloadTimer, resolveReloadTimeMs } from './reloadLifecycle';

const PLAIN = 'slinger-plain-clip';
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
 * Gunslinger's second gun (bible §10.5): its own clip type from the rack. The next rule that
 * holds and differs from the first gun's clip; failing that, the first racked clip of another
 * family (a damage clip and a control clip is the bot default, §10.13); failing that, any other
 * racked clip; else the plain clip. PLACEHOLDER reading: the config has no field for the second
 * gun's clip yet.
 */
export function chooseTwinClip(world: World, player: PlayerEntity, loadout: Loadout, first: string, now: number): string {
  const racked = new Set(loadout.config.rack);
  for (const rule of loadout.config.clipRules) {
    if (rule.clip === first || (rule.clip !== PLAIN && !racked.has(rule.clip))) continue;
    if (conditionsHold(world, player, rule.conditions, now)) return rule.clip;
  }
  const family = CLIPS.get(first)?.family;
  const others = loadout.config.rack.filter((id) => id !== first);
  return others.find((id) => CLIPS.get(id)?.family !== family) ?? others[0] ?? PLAIN;
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

/** Regroup's speed layer: > 1 while the window after a big hit is open. */
export function regroupSpeedMult(player: PlayerEntity, now: number): number {
  const pct = player.usesSkills.passives['slinger.regroup-speed-pct'] ?? 0;
  return pct > 0 && getResource(player.tracksCombat, REGROUP_UNTIL) > now ? 1 + pct : 1;
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
  if (idle) {
    const switchTo = loadout.config.clipRules.find((rule) =>
      rule.switchEarly && rule.clip !== reload.clipId && (rule.clip === PLAIN || loadout.config.rack.includes(rule.clip))
      && conditionsHold(world, player, rule.conditions, now));
    if (switchTo) {
      startReloadTimer(world, player, resolveReloadTimeMs(player));
      emitReloadStart(world, player);
    }
  }
  // Reload early when nothing threatens you (a free rule, on by default).
  if (idle && loadout.config.reloadEarlyWhenSafe && !inCombat && reload.ammo < reload.ammoMax) {
    startReloadTimer(world, player, resolveReloadTimeMs(player));
    emitReloadStart(world, player);
  }

  // Siege: a reload that started without a round of ours (early, switch) fires the shell here.
  if (shellPending(player)) fireShell(world, player);
  if (discipline === TRICKSHOT) updateCalledShot(world, player, loadout, now);

  // Tracer: a traced target that went to ground stays a legal target.
  revealTraced(world, player, now);
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
  if (getResource(cs, SLINGER_RECOVERY_X) !== factor) setResource(cs, SLINGER_RECOVERY_X, factor);

  syncDisciplineHud(world, player, discipline);
}

/**
 * The two discipline facts the HUD cannot derive: Gunslinger's second gun and Siege's shell bank.
 * Present on the networked slice only for that discipline, written only when they change.
 */
function syncDisciplineHud(world: World, player: PlayerEntity, discipline: string | null): void {
  const reload = player.usesReload!;
  const twin = discipline === GUNSLINGER ? getString(player.tracksCombat, TWIN_CLIP) || reload.clipId : undefined;
  const shell = discipline === SIEGE ? Math.round(shellBank(player)) : undefined;
  if (reload.twinClipId === twin && reload.shellBank === shell) return;
  mutateSlice(world, player, 'usesReload', (slice) => {
    if (twin === undefined) delete slice.twinClipId; else slice.twinClipId = twin;
    if (shell === undefined) delete slice.shellBank; else slice.shellBank = shell;
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

/** Buckshot's pellets stop a charging enemy in its tracks. */
function stopCharge(world: World, monster: MonsterEntity): void {
  if ((monster.controlsMonster.chargeRemainingMs ?? 0) <= 0) return;
  monster.controlsMonster.chargeRemainingMs = 0;
  stopEntity(world, monster);
}

/** A live barrier or shield on the target (the mirror the client reads is refreshed every tick). */
function hasBarrier(target: MonsterEntity): boolean {
  return (target.hasStatus.enemyBarrier?.amount ?? 0) > 0;
}

const hpShare = (monster: MonsterEntity): number => monster.hasHealth.hp / Math.max(1, monster.hasHealth.maxHp);

export function registerSlinger(): void {
  registerReloadLifecycleHook({
    onStart(_world, player) {
      // Siege: the shell fires with the reload (once the round that started it has banked).
      if (loadoutOf(player) && disciplineOf(player) === SIEGE) markShellPending(player);
    },
    onComplete(world, player) {
      const loadout = loadoutOf(player);
      if (!loadout) return;
      const now = Date.now();
      player.usesReload!.clipId = chooseClip(world, player, loadout, now);
      if (disciplineOf(player) === GUNSLINGER) setString(player.tracksCombat, TWIN_CLIP, chooseTwinClip(world, player, loadout, player.usesReload!.clipId, now));
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
      if (disciplineOf(player) === TRICKSHOT) ctx.metadata['slingerCalled'] = true;
      // Hunter's Round follows its target and can't miss: the monster's dodge clock skips it
      // (the same exemption a completed cast's hit gets). PLACEHOLDER: any target, not only a fleeing one.
      if (loadout.trophy?.id === 'slinger-relic-jungle') ctx.metadata['castDelivered'] = true;
    }
  });

  // Damage: typed rounds trade raw damage for their effect; the gun's lines and the last round shape it.
  registerCombatListener('onHit', (ctx) => {
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
    const from = player.hasPosition.current;
    const at = target.hasPosition.current;
    const dist = Math.hypot(at.x - from.x, at.y - from.y);
    let mult = clip === PLAIN ? 1 : (p['damagePct'] ?? 1);
    if (round <= 2) mult *= 1 + (passives['slinger.opener-pct'] ?? 0); // Carbine: the first rounds
    mult *= 1 + (passives['slinger.ramp-pct'] ?? 0) * (round - 1); // Drum Gun: each round more
    mult *= 1 + (passives['slinger.far-pct'] ?? 0) * Math.min(1, dist / FAR_FULL_PX); // Hunting Rifle: the farther the harder
    mult *= 1 + (passives['slinger.damage-pct'] ?? 0); // Glass Duster
    if (clip === 'slinger-buckshot') mult *= 1 + (p['closeBonus'] ?? 0) * (1 - Math.min(1, dist / (p['closePx'] ?? 160))); // harder up close
    if (clip === 'slinger-hollow-point' && hpShare(target) < (p['belowHp'] ?? 0.5)) mult *= 1 + (p['bonusPct'] ?? 0.5);
    if (clip === 'slinger-shellbreaker' && hasBarrier(target)) mult *= p['barrierMult'] ?? 2;
    if (disciplineOf(player) === SIEGE) mult *= SIEGE_ROUND_PCT; // the other half of the damage is the shell
    if (last) {
      mult *= 1 + (passives['slinger.last-round-pct'] ?? 0); // Hand Cannon
      if (getStatusEffect(target.tracksCombat, SLINGER_VENOM_ID)) mult *= 1 + (passives['slinger.last-vs-poisoned-pct'] ?? 0); // Snakebite
      if (ctx.metadata['slingerCalled'] === true) mult *= CALLED_SHOT_MULT; // Trickshot
      if (loadout.trophy?.id === 'slinger-relic-jungle') mult *= 1 + (trophyParams(loadout)['farPctPer100px'] ?? 0) * (dist / 100); // Hunter's Round
    }
    if (mult !== 1) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * mult));
      if (mult > 1 && ctx.metadata['empoweredMultiplier'] === undefined) ctx.metadata['empoweredMultiplier'] = mult;
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
    const passives = player.usesSkills.passives;
    const clip = ctx.metadata['slingerClip'] as string;
    const p = clipParams(loadout, clip);
    const hitDamage = ctx.damage;
    const at = target.hasPosition.current;
    const now = attackNow(ctx);
    const last = ctx.metadata['slingerLastRound'] === true;

    // Siege: every round charges the shell.
    if (disciplineOf(player) === SIEGE && hitDamage > 0) bankShell(player, target, clip, hitDamage);

    if (target.hasHealth.hp > 0 && hitDamage > 0) {
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
      } else if (clip === 'slinger-tracer') {
        // It designates; it never stores damage (§10.16).
        traceTarget(player, target, now + (p['tracedMs'] ?? 8000));
      }

      const trophy = last ? loadout.trophy : undefined;
      if (trophy) {
        const t = trophyParams(loadout);
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
          // Quake Round II: the wider blast also cracks plating.
          if ((t['crackFraction'] ?? 0) > 0) for (const monster of [target, ...around]) applyFramePlatingShred(player, monster, t['crackFraction']!, t['crackMs'] ?? 6000);
          if (around.length > 0) applyPlayerAoeTo(world, player, around, hitDamage * (t['blastPct'] ?? 0.8), 'player', {}, {});
        } else if (trophy.id === 'slinger-relic-cave') {
          const others = playerAoeTargets(world, player, at, t['radius'] ?? 220, target.isMonster.id)
            .sort((a, b) => Math.hypot(a.hasPosition.current.x - at.x, a.hasPosition.current.y - at.y) - Math.hypot(b.hasPosition.current.x - at.x, b.hasPosition.current.y - at.y))
            .slice(0, t['splinters'] ?? 3);
          if (others.length > 0) applyPlayerAoeTo(world, player, others, hitDamage * (t['splinterPct'] ?? 0.5), 'player', {}, {});
        }
        // Hunter's Round and Bounty Round act on the hit itself (onHit above).
      }
    }

    // Siege: the round that emptied the clip has banked; the reload's shell fires now.
    if (shellPending(player)) fireShell(world, player);
  });

  // The defensive lines: Dig In and Hunker while you reload, Regroup after a big hit.
  registerCombatListener('onDamageTaken', (ctx) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender as PlayerEntity;
    const reload = player.usesReload;
    if (!reload || reload.reloadingMs <= 0) return;
    const passives = player.usesSkills.passives;
    const hunker = passives['slinger.hunker'] ?? 0;
    if (hunker > 1) {
      const extra = player.mitigatesDamage.plating * (hunker - 1) * (1 - player.mitigatesDamage.damageReduction);
      ctx.damage = Math.max(1, Math.round(ctx.damage - extra));
    }
    const dig = passives['slinger.dig-in'] ?? 0;
    if (dig > 0) ctx.damage = Math.min(ctx.damage, Math.max(1, Math.round(player.hasHealth.maxHp * dig)));
  });
  registerCombatListener('afterHit', (ctx) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender as PlayerEntity;
    if ((player.usesSkills.passives['slinger.regroup-speed-pct'] ?? 0) <= 0) return;
    if (ctx.damage >= player.hasHealth.maxHp * BIG_HIT_SHARE) setResource(player.tracksCombat, REGROUP_UNTIL, attackNow(ctx) + REGROUP_MS);
  });
}
