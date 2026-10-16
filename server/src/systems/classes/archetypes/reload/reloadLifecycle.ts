import type { World } from '../../../../world/World';
import type { PlayerEntity } from '../../../../ecs/entity';
import { reloadShiftMsFor } from '../../slinger/tuning';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { emitMechanicFired } from '../../../combat/engine/mechanicFired';
import { setResource, type CombatControlResult } from '@mmo-idle/shared';

const RELOAD_TIME_MS = 1600;
/** When an empty clip began waiting on a telegraph (0: it is not waiting). Any reload start ends the wait. */
export const RELOAD_HELD_AT = 'slinger.reloadHeldAt';

/** What an `onComplete` hook learns about the reload that just completed. */
export interface ReloadCompletion {
  /**
   * The `onStart` hooks already ran for this reload. False when the clip came back
   * without a reload ever starting, so a hook that does its work at the start does
   * it here instead, and exactly once.
   */
  startHooksRan: boolean;
}

export interface ReloadLifecycleHook {
  onStart?(world: World, player: PlayerEntity): void;
  onComplete?(world: World, player: PlayerEntity, completion: ReloadCompletion): void;
}

const _hooks: ReloadLifecycleHook[] = [];
const _reloadStartEmitted = new WeakSet<PlayerEntity>();

export function registerReloadLifecycleHook(hook: ReloadLifecycleHook): void {
  _hooks.push(hook);
}

/** Authored reload time. Guns write `reload.reload-time-ms`; the floor is 100ms. */
export function resolveReloadTimeMs(player: PlayerEntity): number {
  const passives = player.usesSkills.passives;
  // The discipline shifts the gun's reload by a flat amount; Glass Duster shortens the whole.
  const base = Math.round(passives['reload.reload-time-ms'] ?? RELOAD_TIME_MS) + reloadShiftMsFor(player.usesSkills.disciplineId);
  return Math.max(100, Math.round(base * (1 - Math.min(0.9, passives['slinger.reload-faster-pct'] ?? 0))));
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
  setResource(player.tracksCombat, RELOAD_HELD_AT, 0);
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
 * Slinger-only manual reload. The request enters the same timer and lifecycle
 * hooks as an empty clip, so every clip/reload passive keeps one path.
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
  if (reload.reloadingMs > 0 || reload.ammo >= reload.ammoMax) {
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
  const completion: ReloadCompletion = { startHooksRan: _reloadStartEmitted.has(player) };
  _reloadStartEmitted.delete(player);
  markSliceDirty(world, player, 'usesReload');
  for (const hook of _hooks) {
    hook.onComplete?.(world, player, completion);
  }
  // The clip coming back is reload's moment. No `ctx` — a reload completes on a
  // timer, not on an attack.
  emitMechanicFired(world, player);
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
