import { WORLD_NODE_LIST } from './map/registry';
import {
  DENSITY_MODIFIERS_ENABLED,
  type NodeModifierInfo,
} from './nodeModifierTypes';

/**
 * Compatibility projection for Stage A combat/catalyst systems.
 * Canonical pace and density authoring now lives on each world node record.
 */
export const NODE_MODIFIERS: Record<string, NodeModifierInfo> =
  Object.fromEntries(
    WORLD_NODE_LIST
      .filter((node) => node.kind === 'normal' && node.pace)
      .map((node) => [
        node.id,
        {
          pace: node.pace!,
          ...(DENSITY_MODIFIERS_ENABLED && node.density
            ? { density: node.density }
            : {}),
        },
      ]),
  );
