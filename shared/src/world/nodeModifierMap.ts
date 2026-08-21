import { WORLD_NODE_LIST } from './map/registry';
import type { NodeModifierInfo } from './nodeModifierTypes';

/**
 * Lookup projection for combat/catalyst systems. Canonical modifier authoring lives
 * on each world node record; this is only a nodeId-keyed view of it.
 */
export const NODE_MODIFIERS: Record<string, NodeModifierInfo> =
  Object.fromEntries(
    WORLD_NODE_LIST
      .filter((node) => node.kind === 'normal' && node.modifier)
      .map((node) => [node.id, { modifier: node.modifier! }]),
  );
