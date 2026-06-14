import type { World } from '../../../../world/World';
import type { PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import {
  DEFAULT_RELOAD_TIME_MULT,
  DEFAULT_MOMENTUM_RELOAD_REDUCTION,
  MOMENTUM_RELOAD_REDUCTION_FLOOR,
} from './t3/core/constants';

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
    const factor = Math.max(MOMENTUM_RELOAD_REDUCTION_FLOOR, 1 - stacks * perStack);
    ms = Math.max(100, Math.round(ms * factor));
  }

  return ms;
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
  _reloadStartEmitted.delete(player);
  markSliceDirty(world, player, 'usesReload');
}

/** Fire registered onStart hooks once per reload window. */
export function emitReloadStart(world: World, player: PlayerEntity): void {
  if (!player.usesReload) return;
  if (player.usesReload.reloadingMs <= 0) return;
  if (_reloadStartEmitted.has(player)) return;
  _reloadStartEmitted.add(player);
  for (const hook of _hooks) {
    hook.onStart?.(world, player);
  }
}

export function completeReload(world: World, player: PlayerEntity): void {
  if (!player.usesReload) return;
  const reload = player.usesReload;
  reload.ammo = reload.ammoMax;
  reload.reloadingMs = 0;
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
