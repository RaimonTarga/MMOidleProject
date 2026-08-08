/**
 * GROUND ZONES — node-scoped runtime circles, the shared primitive behind
 * telegraphed slams (Cave) and, later, lingering death pools (Wasteland).
 *
 * Deliberately NOT a node feature: `NodeFeatureSpec` is static authored terrain
 * that lives for the life of the node. Ground zones are spawned by combat, live
 * for seconds, and are never persisted — they die with the node on freeze.
 *
 * Modes:
 *   'telegraph' — cosmetic while it fills; the SERVER resolves the damage when
 *                 the owning cast completes. The zone itself deals nothing.
 *
 * (The 'hazard' mode — ticking damage/status while a body is inside — arrives
 * with its first consumer, Wasteland death pools. Adding it here without a
 * caller would ship an untuned damage cadence nothing exercises.)
 */

export type GroundZoneKind = 'slam-telegraph';

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
  /** Full wind-up the fill animates over (the owning cast's `castMs`). */
  durationMs: number;
  /** Time left before the zone resolves; 0 on the resolving tick. */
  remainingMs: number;
}
