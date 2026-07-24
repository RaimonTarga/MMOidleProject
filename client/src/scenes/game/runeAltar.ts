import {
  pointInNodeFeatureShape,
  RESOLVED_NODE_FEATURES,
  RUNE_ALTAR_FEATURE_ID,
  type Vec2,
} from "@mmo-idle/shared";
import { getOwnBase } from "../../render/interpolation";
import type { GameScene } from "./GameScene";

/** The clearing node holds the rune altar. */
export const ALTAR_NODE_ID = "node-clearing";

/**
 * The circular altar is split into 4 diagonal wedge arcs, each tied to a pillar
 * in the art. Standing in an arc lights it (glow) and offers its interaction.
 */
export type AltarArc = "up" | "right" | "down" | "left";

/** Interaction fired on Enter while standing in an arc. null = not yet built. */
export type AltarAction = "resetClass" | null;

export interface AltarArcConfig {
  /** Prompt text shown in the thought bubble. */
  label: string;
  /** Glow tint echoing this arc's pillar (0–255 RGB). */
  rgb: [number, number, number];
  action: AltarAction;
}

export const ALTAR_ARC_CONFIG: Record<AltarArc, AltarArcConfig> = {
  // top pillar — blue crystal
  up: { label: "Coming Soon", rgb: [0x4d, 0xb8, 0xff], action: null },
  // right pillar — gold flame
  right: { label: "Coming Soon", rgb: [0xff, 0xc8, 0x3d], action: null },
  // bottom pillar — green eye
  down: { label: "Coming Soon", rgb: [0x5f, 0xd6, 0x6a], action: null },
  // left pillar — orange heart-rune: the perk respec
  left: { label: "Reset Class", rgb: [0xff, 0x70, 0x43], action: "resetClass" },
};

/** Which diagonal wedge a point falls in, relative to the altar center. */
function arcForPoint(point: Vec2, cx: number, cy: number): AltarArc {
  // Screen space: +y is down. Diagonals at ±45° split the circle into the
  // top / right / bottom / left wedges.
  const deg = (Math.atan2(point.y - cy, point.x - cx) * 180) / Math.PI;
  if (deg >= -45 && deg < 45) return "right";
  if (deg >= 45 && deg < 135) return "down";
  if (deg >= -135 && deg < -45) return "up";
  return "left";
}

/**
 * The altar arc the local player is currently standing in, or null when they
 * are not on the altar (different node, off the shape, or no own position yet).
 */
export function getAltarArc(scene: GameScene): AltarArc | null {
  const features = RESOLVED_NODE_FEATURES[scene.state.ownNodeId];
  const altar = features?.find((f) => f.id === RUNE_ALTAR_FEATURE_ID);
  if (!altar) return null;
  const base = getOwnBase(scene.state);
  if (!base || !pointInNodeFeatureShape(base, altar.shape)) return null;
  return arcForPoint(base, altar.shape.x, altar.shape.y);
}
