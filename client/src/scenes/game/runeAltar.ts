import {
  pointInNodeFeatureShape,
  RESOLVED_NODE_FEATURES,
  RUNE_ALTAR_FEATURE_ID,
} from "@mmo-idle/shared";
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
