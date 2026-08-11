import { assetIcon, atlasIcon, type AtlasIconSource, type IconSource } from './GameIcon';

export type CraftingSectionIcon = 'biome' | 'forge' | 'upgrade';
export type MasterySectionIcon = 'summary' | 'items' | 'runes' | 'biomes';
export type RuneFragmentIcon = 'condition' | 'action';

const CRAFTING_SECTION_ICONS: Record<CraftingSectionIcon, AtlasIconSource> = {
  biome: atlasIcon('UI_icons/map-icon.png'),
  forge: atlasIcon('UI_icons/forge-icon.png'),
  upgrade: atlasIcon('UI_icons/craft-upgrade-icon.png'),
};

const MASTERY_SECTION_ICONS: Record<MasterySectionIcon, AtlasIconSource> = {
  summary: atlasIcon('UI_icons/progress-icon.png'),
  items: CRAFTING_SECTION_ICONS.upgrade,
  runes: atlasIcon('UI_icons/runes-icon.png'),
  biomes: CRAFTING_SECTION_ICONS.biome,
};

const RUNE_FRAGMENT_ICONS: Record<RuneFragmentIcon, AtlasIconSource> = {
  condition: atlasIcon('UI_icons/runes/situation.png'),
  action: atlasIcon('UI_icons/runes/response.png'),
};

export function craftingSectionIconSource(section: CraftingSectionIcon): AtlasIconSource {
  return CRAFTING_SECTION_ICONS[section];
}

export function masterySectionIconSource(section: MasterySectionIcon): AtlasIconSource {
  return MASTERY_SECTION_ICONS[section];
}

export function runeFragmentIconSource(fragment: RuneFragmentIcon): AtlasIconSource {
  return RUNE_FRAGMENT_ICONS[fragment];
}

/**
 * One glyph per craftable kind, for the Make browser.
 *
 * Stances, rites and runes read as absent from Crafting: the list groups by kind
 * and the non-gear kinds sit under the whole gear block, behind a wall of
 * text-only filter chips. A glyph on the chip and on each row is what makes a
 * group findable without scrolling to it.
 *
 * Deliberately reuses shipped art rather than commissioning a slot set. The stat
 * glyphs already carry the right meaning for gear (attack/plating/regen/speed),
 * and `conceptIcons.ts` already precedents standing one family member in for its
 * whole family — eight stances share three icons there. Swap any of these the
 * moment a real per-slot set exists.
 */
const MAKE_KIND_ICONS: Record<string, IconSource> = {
  weapon: atlasIcon('UI_icons/stats/attack.png'),
  armor: atlasIcon('UI_icons/stats/plating.png'),
  recovery: atlasIcon('UI_icons/stats/regen.png'),
  mobility: atlasIcon('UI_icons/stats/speed.png'),
  core: atlasIcon('UI_icons/stats/empowered.png'),
  relic: atlasIcon('UI_icons/passives-icon.png'),
  technique: atlasIcon('UI_icons/abilities/sweep.png'),
  stance: assetIcon('/assets/concept-icons/stances/offensive-stance.png'),
  rite: assetIcon('/assets/concept-icons/rites/cleansing-breath.png'),
  rune: atlasIcon('UI_icons/runes-icon.png'),
};

/** Glyph for a craftable kind, or null when the kind has no art yet. */
export function makeKindIconSource(kind: string): IconSource | null {
  return MAKE_KIND_ICONS[kind] ?? null;
}
