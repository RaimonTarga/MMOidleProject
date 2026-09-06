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
   * COMMITTED TRAVEL. The boss runs its locked lane, damaging each eligible target
   * AT MOST ONCE as it passes. It does not track, cannot be re-aimed, and is not
   * stopped by losing its target — the lane was painted on the ground and the boss
   * is now on rails.
   *
   * It DOES stop when it runs into a player (see `stopsOnContact`), which is what
   * makes it read as a tackle rather than as a body that walks through you.
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
      /**
       * Stop the travel dead on the first PLAYER it runs into. Defaults to true.
       *
       * A charge that ploughs on through the body it just hit reads as the boss
       * failing to notice, and it leaves the sequence's payoff anchored at a lane
       * tip the fight never reached. Stopping also makes `capturedEndpoint` mean
       * "where the charge actually finished", which is what the follow-up steps
       * anchor on. Minions do not stop it — they are in the way, not the target.
       */
      stopsOnContact?: boolean;
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
      /**
       * Only resolve when this pattern's charge actually connected with a player.
       *
       * A circle that erupts wherever a MISSED charge happened to stop is pure
       * noise: it lands on empty ground, teaches nothing, and occasionally clips a
       * player who dodged correctly. Gating it turns the sequence into one honest
       * decision — read the lane and get off it, or eat the whole sentence.
       */
      requiresChargeHit?: boolean;
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
      /** As `impact.requiresChargeHit`: no connection, no cracks. */
      requiresChargeHit?: boolean;
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
      /**
       * UNDERGROUND TRAVEL, in px/s. Set it and the boss WALKS to its emergence
       * point while concealed instead of being teleported there.
       *
       * A teleport is the wrong shape twice over. Visually the body jumps across
       * the arena in one frame, which reads as the game glitching rather than as
       * something burrowing. Mechanically it decides the whole encounter at the
       * moment the boss goes under, so the telegraph that follows is decoration —
       * the player has already had seconds to walk out of a circle whose position
       * was fixed before they saw it.
       *
       * Travelling instead makes the marker a TELL the player tracks, and lets the
       * destination keep updating until `commitAtPct`, so the sequence commits late
       * and close. Speed is absolute px/s for the same reason `charge` is: a
       * multiplier of a walking speed that falls across the tiers would make each
       * successive burrower slower than the last.
       *
       * The destination TRACKS the target for the whole burrow — there is no
       * partway lock, and an earlier draft's `commitAtPct` was removed once it was
       * measured to change nothing. The dodge window is the telegraph that FOLLOWS
       * the burrow, not the burrow itself, so freezing the emergence point early
       * buys the player no reading time; it only lets a running character drift
       * out of a circle aimed where they used to be, which is precisely how the
       * sequence ended up unable to reach a kiting build at all.
       */
      travelSpeed?: number;
      /**
       * FEINT. Spend the first `untilPct` of the burrow travelling AWAY from the
       * target — roughly `awayPx` further out than wherever it went under — before
       * turning and coming for them.
       *
       * A concealed body that beelines at you from the moment it disappears reads
       * as a homing missile: there is one thing it can be doing and nowhere it can
       * be but between its start and you. Backing off first makes the marker
       * genuinely worth tracking, because for the first stretch it is going the
       * wrong way and you do not yet know from which side it will come back.
       *
       * Costs closing power: the feint distance is paid twice, out and back. Size
       * the burrow's travel budget accordingly (`durationMs * travelSpeed`).
       *
       * `arcDeg` bends the detour around the target instead of retracing one line:
       * the boss takes a couple of WAYPOINTS spaced across that bearing sweep before
       * it turns and comes in, so it returns from a side you did not watch it leave
       * on. The sweep direction is fixed, not random — "where does it come back up"
       * has to stay answerable.
       *
       * WAYPOINTS, NOT A CURVE, and deliberately so. A true spiral was tried first
       * (2026-09-06) and moved badly: its target point slides continuously and
       * faster than the body chasing it, so the steering re-pathed every single tick
       * and the boss visibly stuttered — and every time the curve clipped terrain it
       * fell back to a completely different point and lurched. Two fixed points and
       * a tracking final approach give three straight legs, each with a stable
       * destination the navigation can actually commit to. The path reads as a
       * triangle rather than an arc, which at this speed looks the same and moves
       * far better.
       *
       * ⚠ The detour is paid out of the same travel budget as the approach, and its
       * length grows with the radius it is swept at.
       */
      feint?: { awayPx: number; untilPct: number; arcDeg?: number };
      /**
       * Hard control (stun/freeze) breaks the concealment, defaulting to true like
       * every other wind-up in this file. A boss that is stunned but still
       * untargetable, still travelling, and still going to resolve its payoff the
       * moment the stun lapses hands the player nothing at all for landing the
       * control — not even something to hit. Set false only for a vanish the
       * encounter genuinely means to be committed.
       */
      interruptible?: boolean;
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
      /**
       * BOLT FOR COVER. While the guard is up the boss RUNS for the far edge of its
       * leash at `speed` px/s instead of standing behind its plate.
       *
       * The escape has to be a thing the player WATCHES happen, or the barrier is
       * just a shield with a story attached: without it the boss stood still for the
       * whole cast and then relocated instantly the moment it succeeded, which read
       * as a teleport and gave the pursuit no visible middle. Fleeing is also what
       * makes the distance the sequence later has to close REAL — and it inherits
       * Escape Instinct for free, because a rushed cast covers less ground.
       *
       * Travel goes through the movement system (like `charge`), so it paths, it
       * clamps to the leash, and it stops the moment the guard resolves either way.
       */
      flee?: { speed: number };
      /**
       * Hard control (stun/freeze) cancels the escape outright, defaulting to true.
       * Breaking the plate is the answer that BANKS Instinct; stunning the boss is
       * a plainer one that simply stops it — it does not stumble and it learns
       * nothing, but it does not get away either.
       */
      interruptible?: boolean;
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
  /**
   * Lane half-width, captured when the charge commits.
   *
   * The travel reads its geometry from HERE rather than from the published zone.
   * The zone is a rendering object with its own lifetime — it is swept once its
   * countdown elapses — and a charge that silently ends because its telegraph was
   * garbage-collected mid-run is exactly the bug this captures away.
   */
  chargeHalfWidth?: number;
  /** Barrier sources this pattern raised, cleared on teardown. */
  barrierSourceIds: string[];
  /**
   * A raised barrier whose BREAK the pattern is watching for, across whatever steps
   * follow. Concurrent by necessity: the barrier goes up and the sequence CONTINUES
   * behind it, and breaking it is meant to interrupt whatever the boss is doing at
   * the time — so the watch cannot live inside the step that raised it.
   */
  watchedBarrier?: { sourceId: string; staggerMs: number; label: string };
  /** Bodies already damaged by the current committed travel. */
  chargeHitIds: string[];
  /**
   * Set when a gated step found its condition unmet and was skipped. Purely for
   * telemetry and tests — a skipped gate is a legitimate outcome, not a failure,
   * and distinguishing it from "never reached" is what makes the Tundra Chill gate
   * measurable rather than a mystery.
   */
  skippedStepIndexes: number[];
  /** Set once this pattern's charge has run into a player. */
  chargeConnected?: boolean;
  /**
   * Detour waypoints for a feinting burrow, computed ONCE when it goes under and
   * consumed in order. Fixed points are the whole reason the movement is smooth:
   * a destination that stops moving is one the navigation can commit to.
   */
  feintWaypoints?: Vec2[];
  /** Wall-clock the current detour leg gives up at, so a blocked waypoint cannot stall the burrow. */
  feintLegEndsAtMs?: number;
  /** Set true when a barrier break staggered the pattern. */
  staggered: boolean;
  /**
   * The monster's authored movement speed, saved while a committed charge raises it.
   *
   * The charge writes position directly at its own px/s, but `hasPosition.speed` is
   * ALSO what the client interpolates toward the broadcast target with. Leaving it at
   * the boss's walking speed makes the client crawl after a body the server has
   * already moved 600px — which reads in play as the charge stopping halfway.
   */
  savedSpeed?: number;
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

/**
 * Client-facing boss-effect key for an authored recovery window.
 *
 * Named `boss-stunned` rather than `stunned`: the player-side stun uses that id, and
 * a shared key would collide in the status help and icon maps, giving a stunned boss
 * the player's tooltip. Same word to the player, distinct id in the data.
 */
export const BOSS_RECOVERY_EFFECT = 'boss-stunned';

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
