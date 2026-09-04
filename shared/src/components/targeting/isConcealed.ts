/**
 * CONCEALED — the entity is not there to be fought.
 *
 * Deliberately NOT `isInvulnerable`, which means "you can see it and hit it, but the
 * damage does nothing" (dev toggles, dormant bosses). Concealment is a different
 * lesson: the boss has burrowed or slipped into cover, so it cannot be targeted,
 * cannot be hit, and drops out of every target list until it comes back.
 *
 * Reusing invulnerability for this would leave players and the headless bot swinging
 * at an untouchable body they can still select — which reads as the game being
 * broken rather than as "it went underground, watch the marker".
 *
 * PRESENCE-GATED, and the concealing mechanic owns the whole lifetime: every reset,
 * death and teardown path must clear it, or a boss can end a fight permanently
 * unkillable. `marker` names the ground cue the client shows in its place, so the
 * player always has something to read — concealment is never an absence of
 * information.
 */
export interface IsConcealed {
  /** Which mechanic hid it — burrow trail, stealth, and so on. */
  marker: 'burrow' | 'stealth';
  /** Wall-clock ms this concealment is expected to end (telemetry + client cue). */
  endsAtMs: number;
}
