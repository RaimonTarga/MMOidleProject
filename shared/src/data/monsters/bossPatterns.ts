/**
 * BOSS PATTERNS — ordered, authored encounter sequences.
 *
 * The gap this fills: `bossScript` phases and repeating actions are INDEPENDENT
 * beats. They fire on their own timers and stack on top of whatever else the boss
 * is doing, which is exactly how a lineage accumulates five unrelated mechanics
 * and stops having a readable identity. A pattern is the opposite — one ordered
 * sequence the boss commits to, from tell to payoff to recovery, that owns its
 * movement and suppresses ordinary attacks while it runs.
 *
 * Deliberately NOT a scripting language (executive decision #2). The step union
 * below is small, concrete, and closed: each member is a beat the encounter design
 * actually asked for. Adding a step is a design decision made here, in the open,
 * rather than an emergent combination of primitives nobody reviewed.
 *
 * Ordering rules the runtime enforces:
 *   - Exactly one pattern owns a boss at a time. It holds movement and blocks
 *     ordinary attacks for its whole run, so nothing can land "underneath" it.
 *   - A pattern captures its target and geometry ONCE, at the step that commits.
 *     Later steps read the capture, never the target's live position.
 *   - Death, leash/reset, node teardown and target loss all tear the pattern down
 *     through one path, releasing zones, barriers and movement locks together.
 */

import type { Vec2 } from '../../systems/spatial';

/** Where a pattern's committed geometry is measured from. */
export type PatternAnchor =
  /** The point captured when the pattern committed (a charge endpoint). */
  | 'captured-endpoint'
  /** Wherever the boss is standing at this step. */
  | 'self';

export type BossPatternStep =
  /**
   * A visible wind-up. Publishes the cast bar and, for a charge, paints the lane
   * that the following `charge` step will travel.
   */
  | {
      kind: 'cast';
      name: string;
      castMs: number;
      /**
       * Paint a committed lane during this cast. The lane tracks the target for
       * the first `lockAtCastPct` of the wind-up and then commits; the `charge`
       * step that follows travels the locked segment.
       */
      lane?: { length: number; halfWidth: number; lockAtCastPct?: number };
      /**
       * Hard control (stun/freeze) during this cast aborts the pattern. Defaults
       * to true — a wind-up you cannot interrupt has to say so out loud.
       */
      interruptible?: boolean;
      /**
       * Whether `Enemy Charging` and Guard should react. Defaults to true for a
       * cast that leads to damage; set false for a utility beat (a barrier going
       * up, a posture change) so Guard is not spent answering nothing.
       */
      guardable?: boolean;
      fx?: string;
    }
  /**
   * COMMITTED TRAVEL. The boss runs its locked lane at `speedMult` of its base
   * speed, damaging each eligible target AT MOST ONCE as it passes. It does not
   * track, cannot be re-aimed, and is not stopped by losing its target — the lane
   * was painted on the ground and the boss is now on rails.
   */
  | {
      kind: 'charge';
      /**
       * Travel speed in px/s, ABSOLUTE rather than a multiple of the boss's base
       * speed. Base speeds fall across the tiers (22 at T1 down to 16 at T4), so a
       * shared multiplier would make each successive Mountain boss charge SLOWER
       * than the last — the opposite of the lineage's arc. Authoring the real
       * number also means the dodge window can be read straight off the data:
       * `length / speed` is how long the player has.
       */
      speed: number;
      /** Stacks on the pattern's damage multiplier for bodies caught in the lane. */
      damageMult?: number;
      /** Safety deadline; the travel ends here even if the boss is obstructed. */
      maxTravelMs: number;
    }
  /** A circle resolved at the anchor point, telegraphed for `telegraphMs`. */
  | {
      kind: 'impact';
      name: string;
      anchor: PatternAnchor;
      radius: number;
      damageMult: number;
      telegraphMs: number;
      stunMs?: number;
      fx?: string;
    }
  /** Delayed radial cracks from the anchor — the finite payoff, not terrain. */
  | {
      kind: 'fault-lines';
      anchor: PatternAnchor;
      delayMs: number;
      rayCount: number;
      length: number;
      lineRadius: number;
      innerRadius?: number;
      damageMult: number;
    }
  /**
   * Raise a source-owned absorb barrier. Breaking it during the pattern is a real
   * answer: it staggers the boss and cancels the rest of the sequence.
   */
  | {
      kind: 'barrier';
      sourceId: string;
      /** Fraction of the boss's max HP the barrier absorbs. */
      shieldPct: number;
      /** Recovery the boss is staggered into when the barrier is broken. */
      onBreak?: { staggerMs: number; label: string };
    }
  /** Drop a barrier this pattern raised, whether or not it was broken. */
  | { kind: 'drop-barrier'; sourceId: string }
  /**
   * A cast whose payload is a STATUS on the captured target rather than damage.
   *
   * The setup half of a setup/payoff pair: Desert's Death Sting paints the mark,
   * Tundra's Deep Freeze converts accumulated Chill into Frozen. It is visible and
   * named, because a setup the player cannot see is a payoff they cannot answer.
   */
  | {
      kind: 'apply-status';
      name: string;
      castMs: number;
      effectId: string;
      stacks: number;
      durationMs: number;
      /**
       * Extra numeric payload merged into the status effect's `data`. Used for the
       * shapes the status system already understands generically (`speedMult` for a
       * slow/root, `damageTakenPct` for a vulnerability, and so on).
       */
      data?: Record<string, number>;
      /**
       * Gate the cast on the target already carrying at least this many stacks of
       * `requiresEffectId`. Tundra's freeze only lands on a target the ROOM has
       * already chilled — the environment and the boss are one mechanic, not two.
       * When the gate is closed the step is skipped, not retried forever.
       */
      requires?: { effectId: string; minStacks: number };
      /** Hard control during the cast aborts the pattern. Defaults to true. */
      interruptible?: boolean;
      /** Defaults to true; set false for a beat the player reads rather than guards. */
      guardable?: boolean;
      fx?: string;
    }
  /**
   * CONDITIONAL PAYOFF (§4.7). A hit whose damage is AMPLIFIED when the target is
   * carrying `consumes.effectId`, and which strips that effect when it lands.
   *
   * The design rule this encodes: Cleanse removes the AMPLIFICATION, not the
   * payoff. Desert's Execution still happens to a cleansed target and still has to
   * be answered — it just lands at its unmarked value. That keeps the telegraphed
   * sequence intact while genuinely rewarding the cleanse, instead of the two
   * common failure shapes: a cleanse that cancels the attack outright (so the
   * sequence never resolves) or one that does nothing (so cleansing is pointless).
   */
  | {
      kind: 'payoff';
      name: string;
      castMs: number;
      /** Base damage multiplier, applied whether or not the mark is present. */
      damageMult: number;
      /**
       * Extra multiplier applied ONLY when `consumes` is present AND the target is
       * carrying it. Omit both to author a plain telegraphed hit — a payoff with no
       * setup is still a payoff, and giving it a dummy status to consume would be a
       * lie in the data.
       */
      amplifiedMult?: number;
      consumes?: { effectId: string };
      /** Radius for an area payoff; omit for a single-target hit on the capture. */
      radius?: number;
      /**
       * DEVOUR — the boss restores this fraction of its own max HP when the payoff
       * LANDS. Never on a dodge, an evade, or an interrupted cast: denying the heal
       * is what makes the long tell worth reading. Single-target payoffs only.
       */
      healsSelfPct?: number;
      interruptible?: boolean;
      guardable?: boolean;
      fx?: string;
    }
  /**
   * CONCEAL — burrow under, or slip into cover.
   *
   * The boss becomes untargetable and unhittable, and a ground marker is left where
   * it went. That marker is the point: concealment must never be an ABSENCE of
   * information, or the player is simply waiting with nothing to read.
   *
   * `relocate` picks where it comes back up. `near-target` reserves a valid point a
   * short way from the captured target — the burrow-and-erupt shape. `leash-edge`
   * sends it to the farthest reachable point of its leash away from the target —
   * the Jungle retreat. Both clamp to standable ground before committing, so a
   * boss can never emerge inside terrain.
   */
  | {
      kind: 'conceal';
      name: string;
      marker: 'burrow' | 'stealth';
      durationMs: number;
      relocate: 'near-target' | 'leash-edge' | 'none';
      /** Distance from the target for `near-target`. Ignored otherwise. */
      emergeGap?: number;
      fx?: string;
    }
  /**
   * ESCAPE GUARD — a barrier the boss retreats behind, which the player answers by
   * BREAKING it rather than by catching the boss.
   *
   * Breaking it fails the retreat: the boss stumbles into a stagger and gains one
   * capped stack of Escape Instinct, making its NEXT attempt quicker. Letting it
   * finish means it escapes, resets Instinct, and comes back with an ambush.
   *
   * Damage — not physical contact — is the test, which is what keeps ranged builds
   * valid answers to a boss whose whole idea is running away from you.
   */
  | {
      kind: 'escape-guard';
      name: string;
      castMs: number;
      sourceId: string;
      shieldPct: number;
      /** Stagger applied when the player breaks the guard in time. */
      onBreak: { staggerMs: number; label: string };
      /**
       * Instinct lives on the monster's combat state, NOT on the pattern cursor:
       * the cursor is detached every time a pattern ends, and the whole point of
       * Instinct is that it survives from one failed attempt to the next.
       *
       * Stacks are CAPPED, and a successful escape resets them to zero.
       * Each stack shortens the next retreat wind-up by `instinctCastReductionPct`,
       * so repeated failures speed the boss up to a ceiling and no further — the
       * plan's "speed increases only to cap".
       */
      maxInstinctStacks: number;
      instinctCastReductionPct: number;
      fx?: string;
    }
  /**
   * UNDERTOW — drag the captured target toward the boss.
   *
   * A displacement, never a speed change and never a teleport: a boss that
   * permanently outruns you deletes ranged builds, and one that blinks to you cannot
   * be read at all. Resisted by the same forced-movement stat as knockback, because
   * being shoved and being dragged are one concept to the player.
   */
  | {
      kind: 'pull';
      name: string;
      castMs: number;
      /** Pixels dragged, before resistance. */
      distance: number;
      interruptible?: boolean;
      guardable?: boolean;
      fx?: string;
    }
  /** Dead time inside the sequence, with no cast bar. */
  | { kind: 'wait'; durationMs: number }
  /**
   * AUTHORED RECOVERY. The boss is visibly out of it: rooted, not attacking, and
   * flagged so the client can show it. This is the punish window the whole
   * sequence pays out, which is why it is a step rather than cooldown residue.
   */
  | { kind: 'recovery'; label: string; durationMs: number };

export interface BossPattern {
  id: string;
  /** Player-facing name for the sequence as a whole. */
  name: string;
  /** Ordered steps. The runtime walks them once, then releases the boss. */
  steps: BossPatternStep[];
  /** Base damage multiplier every damaging step scales from. */
  damageMultiplier: number;
  cooldownMs: number;
  /** Cooldown for the first run of a combat session. Defaults to `cooldownMs`. */
  initialCooldownMs?: number;
  /**
   * Health band the pattern may arm in, as fractions of max HP. Outside it the
   * sequence simply does not start, and the boss falls back to ordinary behaviour.
   *
   * This is how a lineage STOPS doing something at low health rather than doing a
   * new thing: Jungle's wounded frenzy is "it has given up on running", expressed as
   * `armAboveHpPct: 0.5` on the escape pattern plus the existing 50% frenzy phase.
   * Encoding it as a gate rather than a fourth mechanic is the whole point.
   */
  armAboveHpPct?: number;
  armBelowHpPct?: number;
  /**
   * Run at most ONCE per monster life. For a catastrophe the encounter builds toward
   * — the Volcano capstone's Cataclysm — repeating it would turn a single decisive
   * race into a metronome, and surviving it once would mean nothing.
   *
   * Per LIFE rather than per combat session: re-pulling the boss must not hand the
   * player a fresh copy of a beat they already answered.
   */
  oncePerLife?: boolean;
}

/** Runtime cursor for the pattern a boss is currently committed to. */
export interface RunsBossPattern {
  patternId: string;
  /** Index into `BossPattern.steps`. */
  stepIndex: number;
  /** Wall-clock ms the current step completes at. */
  stepEndsAtMs: number;
  /** Set when the current step has already done its one-time work. */
  stepStarted: boolean;
  /** Player captured when the pattern began; the sequence is aimed at them. */
  targetId?: string;
  /** Geometry captured at the committing step; later steps read this. */
  capturedEndpoint?: Vec2;
  /** Zone id of the lane this pattern owns, if any. */
  laneZoneId?: string;
  /** Barrier sources this pattern raised, cleared on teardown. */
  barrierSourceIds: string[];
  /** Bodies already damaged by the current committed travel. */
  chargeHitIds: string[];
  /**
   * Set when a gated step found its condition unmet and was skipped. Purely for
   * telemetry and tests — a skipped gate is a legitimate outcome, not a failure,
   * and distinguishing it from "never reached" is what makes the Tundra Chill gate
   * measurable rather than a mystery.
   */
  skippedStepIndexes: number[];
  /** Set true when a barrier break staggered the pattern. */
  staggered: boolean;
  /**
   * Whether THIS pattern is the thing holding the root / attack lock.
   *
   * Mirrors the ownership flags `beginScriptedCast` already keeps, and for the same
   * reason: a boss can be rooted by a scripted cast, a Cave lockdown, or a player
   * control effect at the same time as a pattern runs. Releasing unconditionally on
   * teardown would hand the boss back its movement in the middle of someone else's
   * root — so a pattern releases only what it took.
   */
  ownsRoot: boolean;
  ownsCannotAttack: boolean;
}

/**
 * Server-only authored recovery. Presence roots the boss and blocks its attacks;
 * the label is mirrored onto `hasStatus.bossEffects` so the client shows WHY it is
 * standing there. A recovery is the payout for reading the sequence, so it has to
 * be visible — an invisible cooldown teaches nothing.
 */
export interface RecoversFromPattern {
  label: string;
  endsAtMs: number;
  totalMs: number;
  /** Set when this recovery came from a barrier break rather than a completed run. */
  fromStagger: boolean;
  /** As on `RunsBossPattern`: release only the locks this window actually took. */
  ownsRoot: boolean;
  ownsCannotAttack: boolean;
}

/** Client-facing boss-effect key for an authored recovery window. */
export const BOSS_RECOVERY_EFFECT = 'pattern-recovery';

export function initRunsBossPattern(
  patternId: string,
  now: number,
  targetId: string | undefined,
  ownsRoot: boolean,
  ownsCannotAttack: boolean,
): RunsBossPattern {
  return {
    patternId,
    stepIndex: 0,
    stepEndsAtMs: now,
    stepStarted: false,
    targetId,
    barrierSourceIds: [],
    chargeHitIds: [],
    skippedStepIndexes: [],
    staggered: false,
    ownsRoot,
    ownsCannotAttack,
  };
}
