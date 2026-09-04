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

/** Linked-circle fault lines share the countdown contract but resolve as one hit. */
export type GroundZoneKind =
  | 'slam-telegraph'
  | 'toxic-pool'
  | 'fault-line-telegraph';

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
  x: number;
  y: number;
  radius: number;
  /** Full wind-up or hazard lifetime. */
  durationMs: number;
  /** Time left before the zone resolves/expires. */
  remainingMs: number;
  /** Optional ability cue used to tint otherwise identical telegraphs. */
  fx?: string;
}
