/**
 * The Slinger at runtime (class-first build plan CL.1–CL.2; bible §10.2–§10.4): the clip it
 * loads at each reload (picked by the Loadout's rules), the effect every round of that clip
 * carries, the trophy round that closes every clip, the stationary reload, and the gun and
 * gear lines that bend them. Wiring only: every number is a placeholder (kit `params`, the
 * constants below, the gear keys).
 *
 * The old reload machinery (frame loop, T3 paths, laser, snipe) is untouched here and inert for
 * a character with a Loadout; it goes in the Slinger's cleanup task.
 */
import {
  SLINGER_KIT,
  getResource,
  getStatusEffect,
  setResource,
  type LoadoutConfig,
  type SlingerPiece,
  type SlingerTrophy,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { isPlayerInCombat } from '../../../combat/ai/engagement';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { SLINGER_ROT_ID, SLINGER_VENOM_ID } from '../../../combat/damage/bleedIds';
import { applyKnockback } from '../../../combat/damage/knockback';
import { attackNow, registerCombatListener } from '../../../combat/engine/combatPipeline';
import { conditionsHold } from '../../../combat/moments/moments';
import { applyMonsterSlow } from '../../../combat/status/monsterControl';
import { applyTickDot } from '../../shared/tickDot';
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

interface Loadout {
  config: LoadoutConfig;
  trophy: SlingerTrophy | undefined;
}

/** The Slinger's Loadout, or null for a character without one (the old reload path then applies). */
export function loadoutOf(player: PlayerEntity): Loadout | null {
  const config = player.configuresClass?.config;
  if (!player.usesReload || config?.system.kind !== 'loadout') return null;
  return { config: config.system, trophy: config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined };
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

/** Per-tick Loadout: the next clip, early and switch reloads, Elbow Room, and the Recovery lines' factor. */
export function updateSlinger(world: World, player: PlayerEntity, dt: number, now: number): void {
  const loadout = loadoutOf(player);
  if (!loadout) return;
  const reload = player.usesReload!;
  const cs = player.tracksCombat;
  const passives = player.usesSkills.passives;

  reload.nextClipId = chooseClip(world, player, loadout, now);
  // A full, unfired clip follows the rules (swapping it costs nothing); a started one keeps its rounds.
  if (reload.reloadingMs <= 0 && reload.ammo === reload.ammoMax) reload.clipId = reload.nextClipId;

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

  const { count, nearest } = nearEnemies(world, player, NEAR_PX);

  // Elbow Room: with a crowd around you, the reload runs faster.
  const elbow = passives['slinger.elbow-room'] ?? 0;
  if (elbow > 0 && reload.reloadingMs > 0 && count >= CROWD) reload.reloadingMs = Math.max(0, reload.reloadingMs - dt * elbow);

  // The Recovery lines (Breathing Room, Fleet, Snake Oil), as one factor on the always-on share.
  let factor = 1;
  if ((passives['slinger.breathing-room'] ?? 0) > 0 && Number.isFinite(nearest)) factor *= 1 + Math.min(1, nearest / BREATHING_FULL_PX);
  if ((passives['slinger.fleet'] ?? 0) > 0 && player.isMoving) factor *= passives['slinger.fleet']!;
  const snake = passives['slinger.snake-oil'] ?? 0;
  if (snake > 0 && count === 0 && cs.statusEffects.some((e) => (e.data['isDot'] ?? 0) === 1 || e.id.includes('poison') || e.id.includes('hemorrhage'))) factor *= snake;
  if (getResource(cs, SLINGER_RECOVERY_X) !== factor) setResource(cs, SLINGER_RECOVERY_X, factor);
}

// ── Rounds ───────────────────────────────────────────────────────────────────

function isSlingerShot(ctx: { attackerType: string; defenderType: string; formation?: unknown; metadata: Record<string, unknown> }): boolean {
  return ctx.attackerType === 'player' && ctx.defenderType === 'monster' && !ctx.formation && typeof ctx.metadata['slingerClip'] === 'string';
}

function paramsOf(piece: { params: Record<string, number> } | undefined): Record<string, number> {
  return piece?.params ?? {};
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

export function registerSlinger(): void {
  registerReloadLifecycleHook({
    onComplete(world, player) {
      const loadout = loadoutOf(player);
      if (loadout) player.usesReload!.clipId = chooseClip(world, player, loadout, Date.now());
    },
  });

  // Tag each shot with its clip and place in the clip. Registered after the reload gate and ammo
  // bookkeeping, so `ammo` is already this shot's remainder (0 = the last round).
  registerCombatListener('beforeAttack', (ctx) => {
    if (ctx.attackerType !== 'player' || ctx.cancelled || ctx.metadata['blunderbussPellet']) return;
    const player = ctx.attacker as PlayerEntity;
    const loadout = loadoutOf(player);
    if (!loadout || ctx.metadata['reloadClipShot'] !== true) return;
    const reload = player.usesReload!;
    const index = Number(ctx.metadata['reloadClipIndex'] ?? 1);
    ctx.metadata['slingerClip'] = reload.clipId;
    ctx.metadata['slingerRound'] = index;
    ctx.metadata['slingerLastRound'] = ctx.metadata['pendingReloadStart'] === true;
    // Breaching: the half-plating price moved here, and goes further (bible §10.4).
    if (reload.clipId === 'slinger-breaching') ctx.platingMult = paramsOf(CLIPS.get(reload.clipId))['platingMult'] ?? 0.25;
  });

  // Damage: typed rounds trade raw damage for their effect; the gun's lines and the last round shape it.
  registerCombatListener('onHit', (ctx) => {
    if (!isSlingerShot(ctx)) return;
    const player = ctx.attacker as PlayerEntity;
    const passives = player.usesSkills.passives;
    const clip = ctx.metadata['slingerClip'] as string;
    const round = Number(ctx.metadata['slingerRound'] ?? 1);
    const last = ctx.metadata['slingerLastRound'] === true;
    let mult = clip === PLAIN ? 1 : (paramsOf(CLIPS.get(clip))['damagePct'] ?? 1);
    if (round <= 2) mult *= 1 + (passives['slinger.opener-pct'] ?? 0); // Carbine: the first rounds
    mult *= 1 + (passives['slinger.ramp-pct'] ?? 0) * (round - 1); // Drum Gun: each round more
    if (last) {
      mult *= 1 + (passives['slinger.last-round-pct'] ?? 0); // Hand Cannon
      const target = ctx.defender as MonsterEntity;
      if (getStatusEffect(target.tracksCombat, SLINGER_VENOM_ID)) mult *= 1 + (passives['slinger.last-vs-poisoned-pct'] ?? 0); // Snakebite
    }
    if (mult === 1) return;
    ctx.damage = Math.max(1, Math.round(ctx.damage * mult));
    if (mult > 1 && ctx.metadata['empoweredMultiplier'] === undefined) ctx.metadata['empoweredMultiplier'] = mult;
  });

  // The round's effect, then the trophy on the last round.
  registerCombatListener('afterHit', (ctx, world) => {
    if (!isSlingerShot(ctx)) return;
    const player = ctx.attacker as PlayerEntity;
    const target = ctx.defender as MonsterEntity;
    const passives = player.usesSkills.passives;
    const clip = ctx.metadata['slingerClip'] as string;
    const p = paramsOf(CLIPS.get(clip));
    const hitDamage = ctx.damage;
    const at = target.hasPosition.current;
    const now = attackNow(ctx);
    if (target.hasHealth.hp <= 0 || hitDamage <= 0) return;

    if (clip === 'slinger-scatter') {
      const nicks = (p['nicks'] ?? 2) + (passives['slinger.scatter-extra'] ?? 0);
      const beside = playerAoeTargets(world, player, at, 110, target.isMonster.id)
        .sort((a, b) => Math.hypot(a.hasPosition.current.x - at.x, a.hasPosition.current.y - at.y) - Math.hypot(b.hasPosition.current.x - at.x, b.hasPosition.current.y - at.y))
        .slice(0, nicks);
      if (beside.length > 0) applyPlayerAoeTo(world, player, beside, hitDamage * (p['nickPct'] ?? 0.4), 'player', {}, {});
    } else if (clip === 'slinger-snare') {
      const prior = getStatusEffect(target.tracksCombat, 'ability-slowed')?.data['moveSlowPct'] ?? 0;
      applyMonsterSlow(world, target, Math.min(p['slowCap'] ?? 0.4, prior + (p['slowPerRound'] ?? 0.08)), p['durationMs'] ?? 3000, player.isPlayer.id);
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
    }

    if (ctx.metadata['slingerLastRound'] !== true) return;
    const trophy = loadoutOf(player)?.trophy;
    if (!trophy) return;
    const t = paramsOf(trophy);
    if (trophy.id === 'slinger-relic-plains') {
      shove(world, player.hasPosition.current, target, t['shovePx'] ?? 90);
      for (const behind of lineTargets(world, player, target, t['lineLength'] ?? 240, t['lineWidth'] ?? 44)) shove(world, player.hasPosition.current, behind, t['shovePx'] ?? 90);
    } else if (trophy.id === 'slinger-relic-forest') {
      applyPlayerAoeTo(world, player, [target], hitDamage * (t['secondShotPct'] ?? 0.6), 'player', {}, {});
    } else if (trophy.id === 'slinger-relic-swamp') {
      const ticks = t['ticks'] ?? 4;
      applyTickDot(world, player, target, SLINGER_ROT_ID, (hitDamage * (t['sharePct'] ?? 0.5)) / ticks, ticks, ticks, t['tickMs'] ?? 1000);
    } else if (trophy.id === 'slinger-relic-mountain') {
      const around = playerAoeTargets(world, player, at, t['radius'] ?? 110, target.isMonster.id);
      if (around.length > 0) applyPlayerAoeTo(world, player, around, hitDamage * (t['blastPct'] ?? 0.8), 'player', {}, {});
    } else if (trophy.id === 'slinger-relic-cave') {
      const others = playerAoeTargets(world, player, at, t['radius'] ?? 220, target.isMonster.id)
        .sort((a, b) => Math.hypot(a.hasPosition.current.x - at.x, a.hasPosition.current.y - at.y) - Math.hypot(b.hasPosition.current.x - at.x, b.hasPosition.current.y - at.y))
        .slice(0, t['splinters'] ?? 3);
      if (others.length > 0) applyPlayerAoeTo(world, player, others, hitDamage * (t['splinterPct'] ?? 0.5), 'player', {}, {});
    }
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
