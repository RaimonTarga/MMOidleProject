import type { With } from 'miniplex';
import type { PlayerSnapshot } from '@mmo-idle/shared';
import type { UsesCooldown } from './snapshotSlices';
import type { ServerEntity } from '../entity';

/**
 * Per-player runtime state for the cooldown archetype.
 *
 * Source of truth for the execution timer plus every T3 timer/state that used
 * to live on `CombatState` resources/flags/strings. Status effects whose value
 * is a stacks-count (Eternal Cycle charge, Temporal Extension buff, Battery
 * charge, Entropy Collapse DoT on monsters) stay on `CombatState` because the
 * stack helpers already model the right semantics.
 *
 * The `UsesCooldown` wire fields (`executionReady`, `executionCooldownPct`,
 * `isChanneling`, `channelingPct`) are mirrors.
 */
export interface CooldownComponent {
  /** True once the first execution cycle has been started. */
  initialized: boolean;
  /** Remaining ms until the next execution arms (0 = ready). */
  executionCooldownMs: number;

  // ── Snapshot mirrors ───────────────────────────────────────────────────
  executionReady: boolean;
  executionCooldownPct: number;
  isChanneling: boolean;
  channelingPct: number;

  // ── Overdrive (cooldown-light-t3-a) ────────────────────────────────────
  odActive: boolean;
  odRemainingMs: number;
  /** Saved attackCooldown before the buff applies, restored on expiry. */
  odBaseCd: number;

  // ── Alignment (cooldown-balanced-t3-c) ─────────────────────────────────
  alActive: boolean;
  alRemainingMs: number;
  alBaseCd: number;

  // ── Battery (cooldown-balanced-t3-b) ───────────────────────────────────
  /** Accumulated ms toward the next +1 battery charge stack. */
  batteryTimerAcc: number;

  // ── Singular Extraction (cooldown-heavy-t3-b) ──────────────────────────
  /** Accumulated ms with no attack target (resets the CD when threshold hit). */
  singularNoTargetMs: number;

  // ── Channeled Beam (cooldown-heavy-t3-c) ───────────────────────────────
  beamRemainingMs: number;
  beamNextTickMs:  number;
  beamTargetId:    string;
}

export type CooldownPlayerEntity = With<
  ServerEntity,
  'combatState' | 'combatAt' | 'cooldown'
>;

/** Build a fresh component from a snapshot's current fields. */
export function makeCooldownComponent(snapshot: PlayerSnapshot): CooldownComponent {
  return {
    initialized:          false,
    executionCooldownMs:  0,
    executionReady:       snapshot.executionReady,
    executionCooldownPct: snapshot.executionCooldownPct,
    isChanneling:         snapshot.isChanneling,
    channelingPct:        snapshot.channelingPct,
    odActive:             false,
    odRemainingMs:        0,
    odBaseCd:             0,
    alActive:             false,
    alRemainingMs:        0,
    alBaseCd:             0,
    batteryTimerAcc:      0,
    singularNoTargetMs:   0,
    beamRemainingMs:      0,
    beamNextTickMs:       0,
    beamTargetId:         '',
  };
}

/**
 * Refresh after `recalculatePlayerStats` — drops all in-flight buffs/timers
 * because skill/equipment changes invalidate captured base cooldowns and
 * any active channel.
 */
export function refreshCooldownFromSnapshot(c: CooldownComponent, snapshot: PlayerSnapshot): void {
  c.initialized          = false;
  c.executionCooldownMs  = 0;
  c.executionReady       = snapshot.executionReady;
  c.executionCooldownPct = snapshot.executionCooldownPct;
  c.isChanneling         = snapshot.isChanneling;
  c.channelingPct        = snapshot.channelingPct;
  c.odActive             = false;
  c.odRemainingMs        = 0;
  c.odBaseCd             = 0;
  c.alActive             = false;
  c.alRemainingMs        = 0;
  c.alBaseCd             = 0;
  c.batteryTimerAcc      = 0;
  c.singularNoTargetMs   = 0;
  c.beamRemainingMs      = 0;
  c.beamNextTickMs       = 0;
  c.beamTargetId         = '';
}

/** Copy runtime fields onto the typed wire-mirror slice. */
export function projectCooldownToSlice(
  c: CooldownComponent,
  entity: { usesCooldown: UsesCooldown },
): void {
  entity.usesCooldown.executionReady       = c.executionReady;
  entity.usesCooldown.executionCooldownPct = c.executionCooldownPct;
  entity.usesCooldown.isChanneling         = c.isChanneling;
  entity.usesCooldown.channelingPct        = c.channelingPct;
}
