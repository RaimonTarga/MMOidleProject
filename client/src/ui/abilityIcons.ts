import type { AbilityDef } from "@mmo-idle/shared";
import { atlasIcon, type AtlasIconSource } from "./GameIcon";

/**
 * Art is intentionally allowlisted after gallery approval. A generated file
 * can remain in art/src while a replacement is pending, so file existence is
 * not sufficient evidence that the frame is approved for presentation.
 */
const APPROVED_ABILITY_ICON_FRAMES = new Map<string, string>([
  ["sweep", "UI_icons/abilities/sweep.png"],
  ["expose-weakness", "UI_icons/abilities/expose-weakness.png"],
  ["cleanse", "UI_icons/abilities/cleanse.png"],
  ["brace", "UI_icons/abilities/brace.png"],
]);

/** Resolve shared ability metadata to an approved packed UI-atlas frame. */
export function abilityIconFrame(
  ability: Pick<AbilityDef, "id" | "icon">,
): string | null {
  const icon = ability.icon?.trim() || ability.id;
  return APPROVED_ABILITY_ICON_FRAMES.get(icon) ?? null;
}

/** Resolve ability metadata directly to the shared icon-source contract. */
export function abilityIconSource(
  ability: Pick<AbilityDef, "id" | "icon">,
): AtlasIconSource | null {
  const frameName = abilityIconFrame(ability);
  return frameName ? atlasIcon(frameName) : null;
}
