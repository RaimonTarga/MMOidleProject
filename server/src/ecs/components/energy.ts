import type { With } from 'miniplex';
import type { PlayerSnapshot } from '@mmo-idle/shared';
import type { UsesEnergy } from './snapshotSlices';
import type { ServerEntity } from '../entity';

/**
 * Per-player runtime state for the energy archetype.
 *
 * Source of truth for everything energy-related at runtime. The matching
 * fields on `UsesEnergy` (`energyCount`, `empoweredReady`) are wire-only
 * mirrors.
 *
 * All AC/CS/SM/SE bookkeeping that used to live on `CombatState`
 * resources/flags now lives here. The shared cross-archetype empowered-attack
 * flag stays on `CombatState` and is exposed on the snapshot via the existing
 * `isEmpoweredAttack(state)` helper — `empoweredReady` mirrors that flag.
 */
export interface EnergyComponent {
  /** Current energy in the active bar. */
  energy: number;
  /** Active-bar capacity (100 default, 200 for Singularity Execute). */
  energyMax: number;

  // ── Alternating Currents (energy-balanced-t3-a) ────────────────────────
  /** True while the player is in the charge phase (gaining energy). */
  acChargePhase: boolean;
  /** ms remaining in the current discharge phase (0 = idle/charge). */
  acDischargeMs: number;
  /** ms until the next discharge damage tick. */
  acTickNext: number;
  /** Original attackCooldown captured at discharge start, restored on end. */
  acSpeedBase: number;
  /** True while the attack-speed boost is applied to the snapshot. */
  acSpeedActive: boolean;

  // ── Capacitor Shunt (energy-balanced-t3-c) ─────────────────────────────
  /** Stored reservoir energy used to amplify the next discharge. */
  csReservoir: number;

  // ── Superconducting Mass (energy-heavy-t3-c) ───────────────────────────
  /** Stored raw attack value accumulated from normal hits. */
  smChargePool: number;

  // ── Singularity Execute (energy-heavy-t3-a) ────────────────────────────
  /** True once SE_ENERGY_MAX has been applied; ensures it only happens once. */
  seInitialized: boolean;
}

export type EnergyPlayerEntity = With<
  ServerEntity,
  'combatState' | 'combatAt' | 'energy'
>;

/** Build a fresh component from a snapshot's current fields. */
export function makeEnergyComponent(snapshot: PlayerSnapshot): EnergyComponent {
  return {
    energy:         snapshot.energyCount,
    energyMax:      100,
    acChargePhase:  false,
    acDischargeMs:  0,
    acTickNext:     0,
    acSpeedBase:    0,
    acSpeedActive:  false,
    csReservoir:    0,
    smChargePool:   0,
    seInitialized:  false,
  };
}

/**
 * Refresh component fields after `recalculatePlayerStats` resets the snapshot.
 * Runtime-only fields (AC/CS/SM/SE bookkeeping) reset alongside, since a stat
 * recalc means we've just changed equipment/skills and any in-flight buff is
 * invalidated.
 */
export function refreshEnergyFromSnapshot(c: EnergyComponent, snapshot: PlayerSnapshot): void {
  c.energy        = snapshot.energyCount;
  c.energyMax     = 100;
  c.acChargePhase = false;
  c.acDischargeMs = 0;
  c.acTickNext    = 0;
  c.acSpeedBase   = 0;
  c.acSpeedActive = false;
  c.csReservoir   = 0;
  c.smChargePool  = 0;
  c.seInitialized = false;
}

/** Copy runtime fields onto the typed wire-mirror slice. */
export function projectEnergyToSlice(
  c: EnergyComponent,
  entity: { usesEnergy: UsesEnergy },
): void {
  entity.usesEnergy.energyCount = c.energy;
}
