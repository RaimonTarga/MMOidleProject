import type { With } from 'miniplex';
import type { PlayerSnapshot } from '@mmo-idle/shared';
import type { AppliesDots, ChillsTarget } from './snapshotSlices';
import type { ServerEntity } from '../entity';

/**
 * Per-player runtime state for the DoT archetype.
 *
 * Source of truth for cross-tick book-keeping that used to live on
 * `CombatState` flags/resources or on `PlayerSnapshot` directly. Status
 * effects themselves (DOT_EFFECT_ID stacks on monsters, CHILL/FROZEN, etc.)
 * stay on the monster's `CombatState` per the migration plan — they are
 * already a flexible bag and don't benefit from a typed component.
 *
 * The matching fields on `AppliesDots` and `ChillsTarget` are wire-only
 * mirrors.
 *
 * `itInitialized` / `itBaseCd` migrate the `it-initialized` flag and
 * `it-base-cd` resource off `CombatState`. The base attack-cooldown snapshot
 * is captured the first time the player has Invigorating Toxins unlocked and
 * is used to restore speed when target stacks fall to zero.
 */
export interface DotComponent {
  /** DoT stacks on the player's current target — mirrored to PlayerSnapshot. */
  targetDotStacks: number;
  /** Chill stacks on the player's current target — mirrored to PlayerSnapshot. */
  targetChillStacks: number;
  /** Invigorating Toxins: true once `itBaseCd` has been captured. */
  itInitialized: boolean;
  /** Invigorating Toxins: original attackCooldown captured the first tick. */
  itBaseCd: number;
}

export type DotPlayerEntity = With<
  ServerEntity,
  'combatState' | 'combatAt' | 'dot'
>;

/** Build a fresh component from a snapshot's current fields. */
export function makeDotComponent(snapshot: PlayerSnapshot): DotComponent {
  return {
    targetDotStacks:   snapshot.targetDotStacks,
    targetChillStacks: snapshot.targetChillStacks,
    itInitialized:     false,
    itBaseCd:          0,
  };
}

/**
 * Refresh component fields after `recalculatePlayerStats` resets the snapshot.
 * The IT base-cd capture also resets — the next tick will recapture from the
 * fresh post-recalc attackCooldown so the speed modifier applies to current
 * stats (post-equip change / post-skill unlock).
 */
export function refreshDotFromSnapshot(c: DotComponent, snapshot: PlayerSnapshot): void {
  c.targetDotStacks   = snapshot.targetDotStacks;
  c.targetChillStacks = snapshot.targetChillStacks;
  c.itInitialized     = false;
  c.itBaseCd          = 0;
}

/** Copy runtime fields onto typed wire-mirror slices. */
export function projectDotToSlice(
  c: DotComponent,
  entity: { appliesDots: AppliesDots; chillsTarget: ChillsTarget },
): void {
  entity.appliesDots.targetDotStacks      = c.targetDotStacks;
  entity.chillsTarget.targetChillStacks   = c.targetChillStacks;
}
