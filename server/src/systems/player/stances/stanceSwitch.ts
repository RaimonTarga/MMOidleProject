/**
 * Stance auto-switch (system rework Step 10).
 *
 * Per-tick reconciler for the active combat posture. The player equips a `default`
 * stance (always active baseline) and an optional `reactive` stance; a `switch-stance`
 * rune rule makes the reactive stance active while its situation holds, reverting to
 * the default otherwise.
 *
 * `activeStance` on `TracksProgression` is the posture currently folded into stats.
 * When the desired posture differs from the active one and the anti-thrash cooldown
 * has elapsed, this swaps `activeStance` and triggers a full stat recalc (the active
 * stance's deltas live in `recalculatePlayerStats`). The cooldown both prevents
 * per-tick flapping at a threshold boundary (e.g. HP hovering at 25%) and bounds how
 * often the recalc fires.
 *
 * Runs in `World.tick` AFTER `updateRuneDerivedConfig` stamps the rune flag, so the
 * switch decision reads a fresh `RUNE_SWITCH_STANCE_FLAG`.
 */
import { getCooldown, getFlag, setCooldown } from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import { recalculatePlayerEntityStats } from "../../../ecs/playerEntityFormulas";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { RUNE_SWITCH_STANCE_FLAG } from "../../combat/ai/runeConfig";

const STANCE_SWITCH_CD_KEY = "stance.switch.cd";
/** Min ms between posture swaps. PLACEHOLDER — user balance pass. */
export const STANCE_SWITCH_COOLDOWN_MS = 1500;

export function updateStanceSwitch(world: World): void {
  for (const player of world.livePlayers) {
    const prog = player.tracksProgression;
    const equipped = prog.equippedStances;
    if (!equipped) continue;

    // Desired posture: reactive while a switch-stance rule is active and a reactive
    // stance is equipped; otherwise the default. (Default may be null = no posture.)
    const wantReactive =
      equipped.reactive !== null && getFlag(player.tracksCombat, RUNE_SWITCH_STANCE_FLAG);
    const desired = wantReactive ? equipped.reactive : equipped.default;

    if (desired === prog.activeStance) continue;
    if (getCooldown(player.tracksCombat, STANCE_SWITCH_CD_KEY) > 0) continue;

    prog.activeStance = desired;
    setCooldown(player.tracksCombat, STANCE_SWITCH_CD_KEY, STANCE_SWITCH_COOLDOWN_MS);
    recalculatePlayerEntityStats(world, player);
    markSliceDirty(world, player, "tracksProgression");
  }
}
