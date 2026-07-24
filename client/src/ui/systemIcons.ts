import { atlasIcon, type AtlasIconSource } from './GameIcon';

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
