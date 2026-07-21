import type { AbilityDef } from "@mmo-idle/shared";

/** Resolve shared ability metadata to its packed UI-atlas frame. */
export function abilityIconFrame(
  ability: Pick<AbilityDef, "id" | "icon">,
): string {
  const icon = ability.icon?.trim() || ability.id;
  return `UI_icons/abilities/${icon}.png`;
}
