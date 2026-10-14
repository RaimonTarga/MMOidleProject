import type { AbilityDef } from "@mmo-idle/shared";
import { assetIcon, atlasIcon, type IconSource } from "./iconSource";
import { conceptAbilityIconSource } from "./conceptIcons";
import { BORROWED_BASE_GLYPHS, conceptArtPath } from "./abilityIconModel";

/**
 * Art is intentionally allowlisted after gallery approval. A generated file
 * can remain in art/src while a replacement is pending, so file existence is
 * not sufficient evidence that the frame is approved for presentation.
 */
const APPROVED_ABILITY_ICON_FRAMES = new Map<string, string>([
  ["sweep", "UI_icons/abilities/sweep.png"],
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

/**
 * The ability's one hand-made glyph: its concept icon, else an approved atlas
 * frame, else the existing tile it borrows (Sidestep and Cull have no art of their
 * own, design §22.8; no new PNGs).
 */
export function abilityBaseIconSource(
  ability: Pick<AbilityDef, "id" | "icon">,
): IconSource | null {
  const icon = ability.icon?.trim() || ability.id;
  const concept = conceptAbilityIconSource(icon);
  if (concept) return concept;
  const frameName = abilityIconFrame(ability);
  if (frameName) return atlasIcon(frameName);
  const borrowed = BORROWED_BASE_GLYPHS[icon];
  return borrowed ? assetIcon(conceptArtPath(borrowed)) : null;
}

/** Resolve ability metadata to the shared icon-source contract: its base glyph. */
export function abilityIconSource(
  ability: Pick<AbilityDef, "id" | "icon">,
): IconSource | null {
  return abilityBaseIconSource(ability);
}
