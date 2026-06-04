import {
  deriveAutoConfigFromRunes,
  GAME_CONFIG,
  setFlag,
  type RuneContext,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";

/** Server-only runtime flags read by the auto-combat systems. */
export const RUNE_FLEE_FLAG = "rune.flee";
export const RUNE_KEEP_DISTANCE_FLAG = "rune.keepDistance";

/**
 * "In combat" for rune evaluation: an active attack target, or recent
 * engagement within the combat-regen grace window. Matches the predicate used
 * by `isReloadPlayerInCombat` in autoTarget.ts so the derivation and the
 * steering both agree on combat state.
 */
function isPlayerInCombat(player: PlayerEntity, now: number): boolean {
  if (player.hasAttackTarget !== undefined) return true;
  const last = player.tracksEngagement;
  return last !== undefined && now - last < GAME_CONFIG.COMBAT_REGEN_DELAY;
}

/**
 * Per-tick rune derivation. Runs at the START of `World.tick`, before the
 * party-follow / auto-traverse / auto-target systems, so they read freshly
 * derived values. Equipped rules are the sole driver of the auto-combat config:
 * the baseline + rune overrides are stamped onto `usesAutocombat` every tick,
 * overwriting any stale settings-tab values, and the flee / keep-distance flags
 * are written to the server-only combat-state bag.
 */
export function updateRuneDerivedConfig(world: World, now: number): void {
  for (const player of world.livePlayers) {
    const ctx: RuneContext = {
      hpPct:
        player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp),
      inCombat: isPlayerInCombat(player, now),
    };

    const d = deriveAutoConfigFromRunes(
      player.tracksProgression.runesEquipped,
      ctx,
    );

    const ac = player.usesAutocombat;
    const changed =
      ac.priorityMode !== d.config.priorityMode ||
      ac.fleeWhenLow !== d.config.fleeWhenLow ||
      ac.fleeHpPct !== d.config.fleeHpPct ||
      ac.acquireRadius !== d.config.acquireRadius ||
      ac.focusLeaderTarget !== d.config.focusLeaderTarget ||
      ac.engageUltimateBosses !== d.config.engageUltimateBosses ||
      ac.autoTraverse !== d.autoTraverse;

    if (changed) {
      ac.priorityMode = d.config.priorityMode;
      ac.fleeWhenLow = d.config.fleeWhenLow;
      ac.fleeHpPct = d.config.fleeHpPct;
      ac.acquireRadius = d.config.acquireRadius;
      ac.focusLeaderTarget = d.config.focusLeaderTarget;
      ac.engageUltimateBosses = d.config.engageUltimateBosses;
      ac.autoTraverse = d.autoTraverse;
      markSliceDirty(world, player, "usesAutocombat");
    }

    setFlag(player.tracksCombat, RUNE_FLEE_FLAG, d.fleeRequested);
    setFlag(player.tracksCombat, RUNE_KEEP_DISTANCE_FLAG, d.keepDistance);
  }
}
