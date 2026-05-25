import type { With } from 'miniplex';
import type { PlayerSnapshot } from '@mmo-idle/shared';
import type { UsesCadence } from './snapshotSlices';
import type { ServerEntity } from '../entity';

/**
 * Per-player runtime state for the cadence archetype.
 *
 * Source of truth for everything cadence-related at runtime. The matching
 * fields on `UsesCadence` (`cadenceCount`, `cadenceThreshold`,
 * `cadenceEmpoweredArmed`, `cadenceSpeedStacks`) are wire-only mirrors.
 *
 * `seqDmg`, `charge`, `echo` used to live on `CombatState` resource/counter
 * keys; they now live here so all cadence state is in one typed bag.
 */
export interface CadenceComponent {
  /** Hits accumulated toward the next finisher (0 … threshold-1). */
  count: number;
  /** Cycle length N. (N-1) normal hits, then 1 finisher. */
  threshold: number;
  /** True when the next attack will fire the empowered finisher. */
  empoweredArmed: boolean;
  /** Accelerando: stacks accumulated from finishers. */
  speedStacks: number;
  /** Delayed Verdict: damage accumulated from pre-finisher hits. */
  seqDmg: number;
  /** Iron Patience: damage banked for the finisher. */
  charge: number;
  /** Rising Tide: echo hits remaining after a finisher. */
  echo: number;
}

export type CadencePlayerEntity = With<
  ServerEntity,
  'combatState' | 'combatAt' | 'cadence'
>;

/** Build a fresh component from a snapshot's current fields. */
export function makeCadenceComponent(snapshot: PlayerSnapshot): CadenceComponent {
  return {
    count:          snapshot.cadenceCount,
    threshold:      snapshot.cadenceThreshold,
    empoweredArmed: snapshot.cadenceEmpoweredArmed,
    speedStacks:    snapshot.cadenceSpeedStacks,
    seqDmg:         0,
    charge:         0,
    echo:           0,
  };
}

/**
 * Refresh a component to mirror a snapshot — used after `recalculatePlayerStats`
 * resets the snapshot's cadence fields. Runtime-only fields (seqDmg/charge/echo)
 * also clear because a stat recalc invalidates them.
 */
export function refreshCadenceFromSnapshot(c: CadenceComponent, snapshot: PlayerSnapshot): void {
  c.count          = snapshot.cadenceCount;
  c.threshold      = snapshot.cadenceThreshold;
  c.empoweredArmed = snapshot.cadenceEmpoweredArmed;
  c.speedStacks    = snapshot.cadenceSpeedStacks;
  c.seqDmg         = 0;
  c.charge         = 0;
  c.echo           = 0;
}

/** Copy runtime fields onto the typed wire-mirror slice. */
export function projectCadenceToSlice(
  c: CadenceComponent,
  entity: { usesCadence: UsesCadence },
): void {
  entity.usesCadence.cadenceCount          = c.count;
  entity.usesCadence.cadenceThreshold      = c.threshold;
  entity.usesCadence.cadenceEmpoweredArmed = c.empoweredArmed;
  entity.usesCadence.cadenceSpeedStacks    = c.speedStacks;
}
