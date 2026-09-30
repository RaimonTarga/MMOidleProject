import type { LineageDefinition } from '@mmo-idle/shared';

/**
 * A lineage has no authored display name (design §2: "the slot holds the
 * lineage, not an item" — its name, art and base stats all come from whatever
 * form it currently wears). The id itself IS the lineage's name for every
 * lineage authored so far (`rapier` -> "Rapier", `broadsword` -> "Broadsword"),
 * so this derives the display string from the id rather than hand-authoring a
 * name table that would just repeat it.
 */
export function lineageDisplayName(lineage: Pick<LineageDefinition, 'id'>): string {
  return lineage.id
    .split('-')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}
