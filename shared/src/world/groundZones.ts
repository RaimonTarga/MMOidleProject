/**
 * GROUND ZONES — node-scoped runtime circles, the shared primitive behind
 * telegraphed slams (Cave) and lingering death pools (Wasteland).
 *
 * Deliberately NOT a node feature: `NodeFeatureSpec` is static authored terrain
 * that lives for the life of the node. Ground zones are spawned by combat, live
 * for seconds, and are never persisted — they die with the node on freeze.
 *
 * Modes:
 *   'slam-telegraph' — cosmetic while it fills; the SERVER resolves the damage
 *                      when the owning cast completes. The zone deals nothing.
 *
 *   'toxic-pool' — expiry-lived server hazard; ticks damage and slow inside.
 */

import type { GroundZoneGeometry } from './groundZoneGeometry';

/** Linked-circle fault lines share the countdown contract but resolve as one hit. */
export type GroundZoneKind =
  | 'slam-telegraph'
  | 'toxic-pool'
  | 'fault-line-telegraph'
  /**
   * Committed-charge lane. Same countdown contract as a slam telegraph, but its
   * geometry is a corridor: the boss locks a direction at wind-up and everything
   * standing on the segment is hit. Moving PERPENDICULAR is the answer, which is
   * the whole reason a circle could not express it.
   */
  | 'charge-corridor';

/**
 * What a persistent hazard IS, semantically — not what it looks like.
 *
 * The client picks a texture from this, and avoidance keys off the zone's
 * `movementResponse` rather than off this tag, so a new hazard flavour can never
 * accidentally change whether the game walks players out of it.
 */
export type HazardFlavor =
  /** Swamp rot and the Plague Hound's death pool: stand in it and you rot. */
  | 'toxic'
  /**
   * A magma vent. Deliberately NOT auto-avoided: staying is a real choice that
   * trades damage taken for damage dealt, and a rune that dragged the player out
   * would be answering a question the encounter meant them to answer themselves.
   */
  | 'magma-vent';

/**
 * Client-facing view of one zone. Mirrors the shape of the gauntlet's
 * `temporaryHazards` entries so the two renderers stay recognisably related.
 *
 * `remainingMs` is recomputed per broadcast rather than sent as an absolute
 * deadline: node deltas go out at 5 Hz and clients have no synchronised clock,
 * so a duration + remainder lets the renderer tween the fill locally between
 * packets (the same trick the cast bars use).
 */
export interface GroundZoneView {
  id: string;
  kind: GroundZoneKind;
  /**
   * The authoritative shape, identical to the one the server resolves damage
   * against. Render from THIS; `x`/`y`/`radius` below are the circle-equivalent
   * legacy fields kept so an un-migrated reader degrades to a sane bounding
   * circle rather than drawing nothing.
   */
  geometry: GroundZoneGeometry;
  x: number;
  y: number;
  radius: number;
  /** Full wind-up or hazard lifetime. */
  durationMs: number;
  /** Time left before the zone resolves/expires. */
  remainingMs: number;
  /** Optional ability cue used to tint otherwise identical telegraphs. */
  fx?: string;
  /**
   * `toxic-pool` only: the hazard's flavour, which selects its texture. Semantics
   * (damage, slow, whether to avoid it) never come from here.
   */
  flavor?: HazardFlavor;
  /**
   * `charge-corridor` only: time left before the lane stops tracking and commits
   * to its direction. Zero means already locked. The client paints the two states
   * differently so "it is still aiming at me" never looks like "it is committed".
   */
  lockedInMs?: number;
}
