import {
  pointInNodeFeatureShape,
  RESOLVED_NODE_FEATURES,
  RUNE_ALTAR_FEATURE_ID,
} from "@mmo-idle/shared";
import { getDefaultStore } from "jotai";
import { unlockedSkillsAtom } from "../../hud/atoms";
import { getOwnBase } from "../../render/interpolation";
import type { GameScene } from "./GameScene";

/** The altar has one purpose in the Clearing and every regional sanctuary. */
export const ALTAR_LABEL = "Reset Passives";
export const ALTAR_GLOW_RGB: [number, number, number] = [0x78, 0xe6, 0xa0];

/** Whether the local player is standing anywhere inside a rune altar feature. */
export function isAtRuneAltar(scene: GameScene): boolean {
  const features = RESOLVED_NODE_FEATURES[scene.state.ownNodeId];
  const altar = features?.find((f) => f.id === RUNE_ALTAR_FEATURE_ID);
  if (!altar) return false;
  const base = getOwnBase(scene.state);
  return !!base && pointInNodeFeatureShape(base, altar.shape);
}

/**
 * Whether the altar's one action applies here: the player stands on it AND has
 * a passive to reset. A new character spawns on the Clearing altar, and a "Reset
 * Passives" bubble over someone with nothing unlocked was the first thing
 * playtest 3 (2026-10-12) saw.
 */
export function canResetPassivesHere(scene: GameScene): boolean {
  return isAtRuneAltar(scene) && getDefaultStore().get(unlockedSkillsAtom).length > 0;
}
