import type { With } from 'miniplex';
import type { PlayerSnapshot } from '@mmo-idle/shared';
import type { UsesReload } from './snapshotSlices';
import type { ServerEntity } from '../entity';

/**
 * Per-player runtime state for the reload archetype.
 *
 * Migrates ammo/reload-timer, laser heat/overheat, and snipe cooldown off
 * `CombatState` resources/flags. The `UsesReload` fields (`ammoCount`,
 * `ammoMax`, `heatPct`, `laserOverheated`) are wire-only mirrors.
 *
 * The 0.5× attack / 0.5× attackCooldown final-layer multiplier applied in
 * `recalculatePlayerStats` is unaffected by this migration — it's a stats
 * concern, not runtime state.
 */
export interface ReloadComponent {
  /** Rounds currently in the clip. */
  ammo: number;
  /** Clip capacity (set from `reload.max-ammo` passive). */
  ammoMax: number;
  /** Ms remaining in the active reload (0 = idle / clip ready). */
  reloadingMs: number;

  /** Laser heat 0..100 (Laser T3). */
  laserHeat: number;
  /** True while laser is shut down due to overheat. */
  laserOverheated: boolean;

  /** Ms remaining on the snipe cooldown (Snipe T3). */
  snipeCooldownMs: number;
}

export type ReloadPlayerEntity = With<
  ServerEntity,
  'combatState' | 'combatAt' | 'reload'
>;

/** Build a fresh component from a snapshot's current fields. */
export function makeReloadComponent(snapshot: PlayerSnapshot): ReloadComponent {
  return {
    ammo:            snapshot.ammoCount,
    ammoMax:         snapshot.ammoMax,
    reloadingMs:     0,
    laserHeat:       snapshot.heatPct,
    laserOverheated: snapshot.laserOverheated,
    snipeCooldownMs: 0,
  };
}

/**
 * Refresh after `recalculatePlayerStats` — drops the laser/snipe timers but
 * preserves the snapshot's current ammo since the player may have rounds left
 * in the clip when they unlock a passive. The next tick will reconcile
 * `ammoMax` against the new `reload.max-ammo` passive if it changed.
 */
export function refreshReloadFromSnapshot(c: ReloadComponent, snapshot: PlayerSnapshot): void {
  c.ammo            = snapshot.ammoCount;
  c.ammoMax         = snapshot.ammoMax;
  c.reloadingMs     = 0;
  c.laserHeat       = 0;
  c.laserOverheated = false;
  c.snipeCooldownMs = 0;
}

/** Copy runtime fields onto the typed wire-mirror slice. */
export function projectReloadToSlice(
  c: ReloadComponent,
  entity: { usesReload: UsesReload },
): void {
  entity.usesReload.ammoCount       = c.ammo;
  entity.usesReload.ammoMax         = c.ammoMax;
  entity.usesReload.heatPct         = Math.round(c.laserHeat);
  entity.usesReload.laserOverheated = c.laserOverheated;
}
