import {
  assetIcon,
  atlasIcon,
  type AssetIconSource,
  type AtlasIconSource,
  type IconSource,
} from './iconSource';

export type MenuIcon =
  | 'passive-tree'
  | 'loadout'
  | 'runes'
  | 'rites'
  | 'inventory'
  | 'crafting'
  | 'upgrade'
  | 'map'
  | 'mastery'
  | 'settings';

const MENU_ICONS: Record<MenuIcon, AssetIconSource> = {
  'passive-tree': assetIcon('/assets/concept-icons/menu/passive-tree.png'),
  loadout: assetIcon('/assets/concept-icons/menu/loadout.png'),
  runes: assetIcon('/assets/concept-icons/menu/runes.png'),
  rites: assetIcon('/assets/concept-icons/menu/rites.png'),
  inventory: assetIcon('/assets/concept-icons/menu/inventory.png'),
  crafting: assetIcon('/assets/concept-icons/menu/crafting.png'),
  upgrade: assetIcon('/assets/concept-icons/menu/upgrade.png'),
  map: assetIcon('/assets/concept-icons/menu/map.png'),
  mastery: assetIcon('/assets/concept-icons/menu/mastery.png'),
  settings: assetIcon('/assets/concept-icons/menu/settings.png'),
};

export function menuIconSource(icon: MenuIcon): AssetIconSource {
  return MENU_ICONS[icon];
}

export type StatIcon =
  | 'attack'
  | 'dps'
  | 'empowered'
  | 'evasion'
  | 'plating'
  | 'range'
  | 'reduction'
  | 'regen'
  | 'shield'
  | 'speed';

const STAT_ICONS: Record<StatIcon, AssetIconSource> = {
  attack: assetIcon('/assets/concept-icons/stats/attack.png'),
  dps: assetIcon('/assets/concept-icons/stats/dps.png'),
  empowered: assetIcon('/assets/concept-icons/stats/empowered.png'),
  evasion: assetIcon('/assets/concept-icons/stats/evasion.png'),
  plating: assetIcon('/assets/concept-icons/stats/plating.png'),
  range: assetIcon('/assets/concept-icons/stats/range.png'),
  reduction: assetIcon('/assets/concept-icons/stats/reduction.png'),
  regen: assetIcon('/assets/concept-icons/stats/regen.png'),
  shield: assetIcon('/assets/concept-icons/stats/shield.png'),
  speed: assetIcon('/assets/concept-icons/stats/speed.png'),
};

export function statIconSource(icon: StatIcon): AssetIconSource {
  return STAT_ICONS[icon];
}

export type CraftingSectionIcon = 'biome' | 'forge' | 'upgrade';
export type MasterySectionIcon = 'summary' | 'items' | 'runes' | 'biomes';
export type RuneFragmentIcon = 'condition' | 'action';
export type BuildSectionIcon = 'abilities' | 'stances' | 'rites' | 'runes';

const CRAFTING_SECTION_ICONS: Record<CraftingSectionIcon, IconSource> = {
  biome: menuIconSource('map'),
  forge: menuIconSource('crafting'),
  upgrade: menuIconSource('upgrade'),
};

const MASTERY_SECTION_ICONS: Record<MasterySectionIcon, IconSource> = {
  summary: menuIconSource('mastery'),
  items: CRAFTING_SECTION_ICONS.upgrade,
  runes: menuIconSource('runes'),
  biomes: CRAFTING_SECTION_ICONS.biome,
};

const RUNE_FRAGMENT_ICONS: Record<RuneFragmentIcon, AtlasIconSource> = {
  condition: atlasIcon('UI_icons/runes/situation.png'),
  action: atlasIcon('UI_icons/runes/response.png'),
};

export function craftingSectionIconSource(section: CraftingSectionIcon): IconSource {
  return CRAFTING_SECTION_ICONS[section];
}

export function masterySectionIconSource(section: MasterySectionIcon): IconSource {
  return MASTERY_SECTION_ICONS[section];
}

export function runeFragmentIconSource(fragment: RuneFragmentIcon): AtlasIconSource {
  return RUNE_FRAGMENT_ICONS[fragment];
}

/**
 * One glyph per arrangement surface, shared by the rail entry and the dialog
 * header so a section looks the same wherever it is named. Same standing-in
 * precedent as `MAKE_KIND_ICONS` below: a family member represents its family
 * until a bespoke set exists.
 */
const BUILD_SECTION_ICONS: Record<BuildSectionIcon, IconSource> = {
  abilities: menuIconSource('loadout'),
  stances: assetIcon('/assets/concept-icons/stances/offensive-stance.png?v=specific-v3'),
  rites: menuIconSource('rites'),
  runes: menuIconSource('runes'),
};

export function buildSectionIconSource(section: BuildSectionIcon): IconSource {
  return BUILD_SECTION_ICONS[section];
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
 * glyphs already carry the right meaning for gear (attack/plating/regen/speed).
 * Generic family filters use representative navigation glyphs; individual
 * stance and rune rows resolve their own dedicated concept art.
 */
const MAKE_KIND_ICONS: Record<string, IconSource> = {
  weapon: statIconSource('attack'),
  armor: statIconSource('plating'),
  recovery: statIconSource('regen'),
  mobility: statIconSource('speed'),
  core: statIconSource('empowered'),
  relic: menuIconSource('passive-tree'),
  technique: atlasIcon('UI_icons/abilities/sweep.png'),
  stance: assetIcon('/assets/concept-icons/stances/offensive-stance.png?v=specific-v3'),
  rite: menuIconSource('rites'),
  rune: menuIconSource('runes'),
};

/** Glyph for a craftable kind, or null when the kind has no art yet. */
export function makeKindIconSource(kind: string): IconSource | null {
  return MAKE_KIND_ICONS[kind] ?? null;
}
