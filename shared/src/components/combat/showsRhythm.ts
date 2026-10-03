/**
 * ShowsRhythm — the rhythm readout's live moment state (design §24.6; the
 * course-correction run's W2-B).
 *
 * A NETWORKED player slice, present only while the player has at least one
 * TRIGGERED lineage card or worn capstone in play (`rhythmFirings`): component
 * presence is the "this player has a rhythm to show" signal, never a flag.
 *
 * It exposes the counters the card runtime already keeps on `TracksCombat` —
 * the `hit-nth` counters, the rate caps, the first-hit latches, the kill carry —
 * so the client can draw a ring per card without simulating any of them. It is
 * written ON CHANGE only (a hit that moves a counter, a cap that starts, a latch
 * that is spent), never per tick, and it is runtime-only: never persisted, rebuilt
 * at every recalc.
 *
 * Each field is absent in its resting state, so an empty record means "nothing to
 * say" and a missing key reads the same as `{}`:
 */
export interface RhythmMoment {
  /** `hit-nth`: landed hits counted toward the next firing, 0..n−1. Absent = 0. */
  count?: number;
  /**
   * A capped moment (`capMs`, design §24.2 rule 2): the server time (ms, the same
   * clock as a snapshot's `serverTime`) its rate cap clears. Written once, when
   * the cap starts. Absent, or in the past, means the moment can fire again.
   */
  capUntil?: number;
  /** `kill` with `carry`: present while a kill has armed the next landed hit. */
  armed?: true;
  /**
   * `first-hit` latched per BODY (the Engagement moment): the bodies this
   * player's opener is already spent on, most recent last, bounded by
   * {@link RHYTHM_SPENT_ON_MAX}. The latch itself lives on the monster; this is
   * the readout's copy, so a ring can say "spent on THIS target".
   */
  spentOn?: string[];
  /**
   * `first-hit` latched per ENGAGEMENT: while spent, the server time the
   * engagement lapses and the opener re-arms. Every landed hit pushes it back, so
   * it is rewritten per hit while spent. Absent means armed.
   */
  spentUntil?: number;
}

export interface ShowsRhythm {
  /** Keyed by the firing's card or capstone id — the runtime's per-card key. */
  moments: Record<string, RhythmMoment>;
}

/** How many spent bodies the readout remembers per per-body latch. */
export const RHYTHM_SPENT_ON_MAX = 8;
