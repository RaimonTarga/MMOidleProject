import type { AcceptedSfxId } from './acceptedCatalog';

// Authored identity overrides: legacy IDs do not reliably describe current bodies
// (ironwood-golem is a badger; dust-djinn is a scarab; forest-slime is a rat).
const families: readonly [AcceptedSfxId, readonly string[]][] = [
  ['death-magic', ['tiny-slime']],
  ['death-humanoid', ['cave-brute', 'cave-troll', 'cavern-troll', 'bog-witch', 'mire-hex-spitter',
    'rime-caster', 'hoarfrost-yeti', 'ridge-archer', 'peak-archer']],
  ['death-stone', ['cave-gargoyle', 'crystal-gargoyle', 'granite-titan', 'mountain-colossus', 'crag-mortar']],
  ['death-undead', ['bone-crawler', 'plague-hound', 'carrion-vulture', 'charnel-brute', 'gravewright', 'plague-rat']],
  ['death-aquatic', ['abyssal-serpent', 'hadal-stalker', 'elder-leviathan', 'bog-slime']],
];
const overrides = new Map(families.flatMap(([cue, ids]) => ids.map(id => [id, cue] as const)));

/** Select from captured monster identity; never infer death from disappearance. */
export function monsterDeathCue(monsterTypeId?: string, isBoss = false): AcceptedSfxId {
  if (isBoss) return 'boss-death';
  if (!monsterTypeId) return 'death-humanoid';
  // Ordinary fauna include insects, reptiles and armored animals; magical attacks
  // alone do not turn their physical bodies into the magic family.
  return overrides.get(monsterTypeId) ?? 'death-animal';
}
