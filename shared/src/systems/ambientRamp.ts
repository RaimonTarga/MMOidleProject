import type { StatusEffect } from '../components/combat/effects';
import type { TracksCombat } from '../components/combat/tracksCombat';
import { DAMAGE_DEALT_PCT_KEY, DAMAGE_TAKEN_PCT_KEY } from './playerAmplifiers';

/**
 * P4 — the ambient node ramp (Biome Ecology Pass 2).
 *
 * A node-wide, in-combat-gated stack counter: the longer you fight in the node,
 * the more the ROOM presses on you. It is the generalization of the old volcanic
 * `ambientHeat` (which only knew how to burn) — one stacking status per player,
 * ramping one stack per `rampMs` up to `maxStacks` and shedding one per `rampMs`
 * once you disengage or leave, with a data-authored payload saying what a stack
 * actually does.
 *
 * The payload deliberately reuses primitives that already exist rather than
 * inventing per-biome mechanics:
 *   - `incomingDamagePct` / `outgoingDamagePct` are read by P3's
 *     `playerIncomingDamageMult` / `playerOutgoingDamageMult`, which key off status
 *     `data`, not status ids. ONE ramp status can therefore carry both dimensions,
 *     exactly as `frost-ramp` carries move-slow and attack-slow together.
 *   - `moveSlowPct` is folded into `playerMoveSpeedMult` beside every other slow.
 *
 * Consumers: Volcano heat (`{ outgoing, incoming }` — the greed ramp) and Tundra chill
 * (`{ moveSlowPct }` — all cost, no upside).
 */
export interface AmbientRampPayload {
  /** Per stack: added fraction of damage the player TAKES (P3 incoming amplifier). */
  incomingDamagePct?: number;
  /** Per stack: added fraction of damage the player DEALS (P3 outgoing amplifier). */
  outgoingDamagePct?: number;
  /** Per stack: fraction of move speed removed (folded into the clamped slow product). */
  moveSlowPct?: number;
  /**
   * Per stack: fraction added to the player's ATTACK COOLDOWN — combat tempo
   * suppression, the Tundra half of the ramp contract. Read at the player attack
   * gate exactly like the (now-retired) `frost-ramp` attack slow, so it never
   * mutates the recalc-owned `attackCooldown` stat.
   *
   * ⚠ The `maxStacks` cap is LOAD-BEARING. An uncapped attack-speed debuff death-
   * spirals: slower attacks -> slower kill -> more stacks. It is also deliberately
   * NOT allowed to become a stun — max Chill must still leave you fighting.
   */
  attackSlowPct?: number;
}

/**
 * Status `data` marker: this effect is the node's ambient ramp. Present so the ramp
 * pass can find (and decay) a player's ramp after they have LEFT the node that
 * authored it, without hard-coding every biome's effect id — the same generic-marker
 * trick `isDot` / `isNodeFeature` already use.
 */
export const AMBIENT_RAMP_KEY = 'isAmbientRamp';

/** Status `data` key: move-slow fraction PER STACK. */
export const MOVE_SLOW_PCT_KEY = 'moveSlowPct';

/** Status `data` key: attack-cooldown penalty fraction PER STACK. */
export const ATTACK_SLOW_PCT_KEY = 'rampAttackSlowPct';

/** The player's active ambient ramp, whatever biome authored it. */
export function ambientRampStatus(cs: TracksCombat): StatusEffect | undefined {
  return cs.statusEffects.find(
    (effect) => (effect.data[AMBIENT_RAMP_KEY] ?? 0) !== 0,
  );
}

/** Status `data` for a ramp, built from its authored payload. */
export function ambientRampData(
  payload: AmbientRampPayload,
  ramp: { maxStacks: number; rampMs: number },
): Record<string, number> {
  const data: Record<string, number> = {
    [AMBIENT_RAMP_KEY]: 1,
    maxStacks: ramp.maxStacks,
    rampMs: ramp.rampMs,
    rampAccum: 0,
    // Buff-UI clocks read totalMs; a ramp fills rather than expires, so the
    // "duration" it reports is the time to reach full stacks.
    totalMs: ramp.rampMs * ramp.maxStacks,
  };
  if (payload.incomingDamagePct) {
    data[DAMAGE_TAKEN_PCT_KEY] = payload.incomingDamagePct;
  }
  if (payload.outgoingDamagePct) {
    data[DAMAGE_DEALT_PCT_KEY] = payload.outgoingDamagePct;
  }
  if (payload.moveSlowPct) data[MOVE_SLOW_PCT_KEY] = payload.moveSlowPct;
  if (payload.attackSlowPct) data[ATTACK_SLOW_PCT_KEY] = payload.attackSlowPct;
  return data;
}

/**
 * Move-speed multiplier (0..1) contributed by a ramp's current stacks. 1 when the
 * ramp carries no `moveSlowPct` — the common case, since Volcano's payload is
 * damage-only. Never returns 0: an ambient ramp is pressure, not a root, so it is
 * floored just above a full stop and then meets the global slow clamp in
 * `playerMoveSpeedMult`.
 */
export function ambientRampMoveMult(effect: StatusEffect): number {
  const perStack = effect.data[MOVE_SLOW_PCT_KEY] ?? 0;
  if (perStack <= 0) return 1;
  const maxStacks = effect.data['maxStacks'] ?? effect.stacks;
  const stacks = Math.min(effect.stacks, maxStacks);
  return Math.max(0.05, 1 - perStack * stacks);
}

/**
 * Outgoing-damage multiplier for a monster that FEEDS on the node ramp
 * (`MonsterDefinition.scalesWithAmbientRamp`): `perStackPct` per stack the target is
 * carrying, capped at `maxPct`. 1 when the monster has no such scaling or the target
 * carries no ramp.
 *
 * Deliberately keyed off the generic ramp marker rather than one biome's effect id:
 * the mechanic is "this thing grows on whatever the room is doing to you", and the
 * ramp a player carries in a node is by construction that node's own (one per node,
 * shed on leaving). Locked decision 5 keeps the CONSUMER rare — one T4 elite — so
 * this stays a capstone tell rather than a roster-wide damage ramp.
 */
export function ambientRampScalingMult(
  scaling: { perStackPct: number; maxPct: number } | undefined,
  cs: TracksCombat,
): number {
  if (!scaling) return 1;
  const effect = ambientRampStatus(cs);
  if (!effect) return 1;
  const maxStacks = effect.data['maxStacks'] ?? effect.stacks;
  const stacks = Math.min(effect.stacks, maxStacks);
  if (stacks <= 0) return 1;
  return 1 + Math.min(scaling.maxPct, stacks * scaling.perStackPct);
}

/**
 * Added attack-cooldown fraction from a ramp's current stacks (0 when the payload
 * carries none — Volcano's heat is damage-only). Multiplied into the player's
 * attack-cooldown gate as `1 + pct`, never written back into the stat.
 *
 * Capped by the ramp's own `maxStacks`, and then hard-clamped here: even a
 * mis-authored payload cannot push the player past a doubled cooldown, because
 * Tundra's locked design says max Chill is suppression, never a stun.
 */
export function ambientRampAttackSlowPct(effect: StatusEffect): number {
  const perStack = effect.data[ATTACK_SLOW_PCT_KEY] ?? 0;
  if (perStack <= 0) return 0;
  const maxStacks = effect.data['maxStacks'] ?? effect.stacks;
  const stacks = Math.min(effect.stacks, maxStacks);
  return Math.min(1, perStack * stacks);
}

/** Fill fraction (0..1) toward full stacks — the soft-timer read for the buff tile. */
export function ambientRampFillPct(effect: StatusEffect): number {
  const maxStacks = effect.data['maxStacks'] ?? 0;
  if (maxStacks <= 0) return 0;
  return Math.min(1, effect.stacks / maxStacks);
}
