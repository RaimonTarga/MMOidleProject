import type { World } from '../../../../world/World';
import type { PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import {
  DEFAULT_RELOAD_TIME_MULT,
  DEFAULT_MOMENTUM_RELOAD_REDUCTION,
  MOMENTUM_RELOAD_REDUCTION_FLOOR,
} from './t3/core/constants';
import {
  relicRatingsFromPassives,
  resolveReloadRelicProfile,
  type CombatControlResult,
} from '@mmo-idle/shared';

const RELOAD_TIME_MS = 1600;

export interface ReloadLifecycleHook {
  onStart?(world: World, player: PlayerEntity): void;
  onComplete?(world: World, player: PlayerEntity): void;
}

const _hooks: ReloadLifecycleHook[] = [];
const _reloadStartEmitted = new WeakSet<PlayerEntity>();

export function registerReloadLifecycleHook(hook: ReloadLifecycleHook): void {
  _hooks.push(hook);
}

export function resolveReloadTimeMs(player: PlayerEntity): number {
  const base = Math.round(
    player.usesSkills.passives['reload.reload-time-ms'] ?? RELOAD_TIME_MS,
  );
  const mult =
    player.usesSkills.passives['reload.reload-time-mult'] ??
    DEFAULT_RELOAD_TIME_MULT;
  let ms = Math.max(100, Math.round(base * mult));

  // Desperado: each Momentum stack also speeds up the reload itself (the
  // continuous-fighting payoff), floored so it never trivializes. Uses the stack
  // count at reload start, so reload time ramps down as the streak builds.
  if ((player.usesSkills.passives['reload.momentum'] ?? 0) > 0) {
    const stacks = player.usesReload?.momentumStacks ?? 0;
    const perStack =
      player.usesSkills.passives['reload.momentum-reload-reduction'] ??
      DEFAULT_MOMENTUM_RELOAD_REDUCTION;
    const floor = player.usesSkills.passives['reload.momentum-reload-reduction-floor'] ?? MOMENTUM_RELOAD_REDUCTION_FLOOR;
    const factor = Math.max(floor, 1 - stacks * perStack);
    ms = Math.max(100, Math.round(ms * factor));
  }

  return resolveReloadRelicProfile(
    ms,
    Math.max(1, Math.round(player.usesSkills.passives['reload.max-ammo'] ?? 10)),
    relicRatingsFromPassives(player.usesSkills.passives),
  ).reloadMs.after;
}

/** Start reload timer only — no lifecycle hooks. */
export function startReloadTimer(
  world: World,
  player: PlayerEntity,
  reloadMs: number,
): void {
  if (!player.usesReload) return;
  const reload = player.usesReload;
  reload.ammo = 0;
  reload.reloadingMs = reloadMs;
  reload.reloadDurationMs = reloadMs;
  _reloadStartEmitted.delete(player);
  markSliceDirty(world, player, 'usesReload');
}

/** Fire registered onStart hooks once per reload window. */
export function emitReloadStart(world: World, player: PlayerEntity): void {
  if (!player.usesReload) return;
  if (player.usesReload.reloadingMs <= 0) return;
  if (_reloadStartEmitted.has(player)) return;
  _reloadStartEmitted.add(player);
  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'player-reload-start',
    playerId: player.isPlayer.id,
    reloadMs: player.usesReload.reloadDurationMs,
  });
  for (const hook of _hooks) {
    hook.onStart?.(world, player);
  }
}

/**
 * Slinger-only manual reload. The request deliberately enters the same timer
 * and lifecycle hooks as an empty clip, so every clip/reload passive keeps one
 * authoritative execution path.
 */
export function requestManualReload(
  world: World,
  player: PlayerEntity,
): CombatControlResult {
  if (player.usesSkills.combatArchetype !== 'reload' || !player.usesReload) {
    return {
      success: false,
      state: 'rejected',
      reason: 'Manual reload is only available to Slingers.',
    };
  }

  const reload = player.usesReload;
  // The Laser path replaces magazines with heat. A full magazine or an active
  // reload likewise has nothing for another manual request to change.
  if (
    (player.usesSkills.passives['reload.laser'] ?? 0) > 0
    || reload.reloadingMs > 0
    || reload.ammo >= reload.ammoMax
  ) {
    return { success: true };
  }

  startReloadTimer(world, player, resolveReloadTimeMs(player));
  emitReloadStart(world, player);
  return { success: true, state: 'activated' };
}

export function completeReload(world: World, player: PlayerEntity): void {
  if (!player.usesReload) return;
  const reload = player.usesReload;
  reload.ammo = reload.ammoMax;
  reload.reloadingMs = 0;
  reload.reloadDurationMs = 0;
  _reloadStartEmitted.delete(player);
  markSliceDirty(world, player, 'usesReload');
  for (const hook of _hooks) {
    hook.onComplete?.(world, player);
  }
}

/** afterHit listener: deferred reload-start hooks for in-combat empty-clip reloads. */
export function registerReloadAfterHitListener(): void {
  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['pendingReloadStart']) return;
    ctx.metadata['pendingReloadStart'] = false;
    emitReloadStart(world, ctx.attacker);
  });
}
