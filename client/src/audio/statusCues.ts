import type { PlayerView } from "@mmo-idle/shared";
import { playSfx } from "./audioEngine";

// Edge-detected audio cues for the local player's status, driven off each
// snapshot's own-player view in deltaApplier. We track the previous snapshot's
// state module-side so we only fire on transitions, not every tick.

let prevDotStacks = 0;
const prevDebuffIds = new Set<string>();
let seeded = false;

// Frost debuffs are voiced by the `frozen` cue (freeze overlay / shatter pulse),
// so exclude them here to avoid doubling up with `debuff-receive`.
const FROST_DEBUFF_IDS = new Set<string>(["debuff-frost-ramp"]);

/**
 * Fire one-shot debuff cues for the local player:
 *  - `debuff-apply`   when a fresh DoT first lands on your current target.
 *  - `debuff-receive` when a new (non-frost) debuff lands on you.
 * The first call only seeds the baseline so a mid-fight reconnect doesn't blare.
 */
export function notePlayerStatusCues(own: PlayerView): void {
  const dot = own.targetDotStacks ?? 0;
  const currentDebuffs = new Set<string>();
  let receivedNew = false;
  for (const buff of own.activeBuffs) {
    if (!buff.id.startsWith("debuff-")) continue;
    currentDebuffs.add(buff.id);
    if (
      seeded &&
      !prevDebuffIds.has(buff.id) &&
      !FROST_DEBUFF_IDS.has(buff.id)
    ) {
      receivedNew = true;
    }
  }

  if (seeded) {
    if (dot > 0 && prevDotStacks === 0) playSfx("debuff-apply");
    if (receivedNew) playSfx("debuff-receive");
  }

  prevDotStacks = dot;
  prevDebuffIds.clear();
  for (const id of currentDebuffs) prevDebuffIds.add(id);
  seeded = true;
}

/** Drop the tracked baseline (e.g. on disconnect) so cues re-seed cleanly. */
export function resetPlayerStatusCues(): void {
  prevDotStacks = 0;
  prevDebuffIds.clear();
  seeded = false;
}
