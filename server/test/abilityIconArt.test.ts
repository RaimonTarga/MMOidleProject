/**
 * The ability icon's art (client `ui/abilityIconModel.ts`): every one of the
 * abilities, Sidestep and Cull included, has a base glyph that EXISTS on disk —
 * no new PNGs, no packed atlas edited.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ABILITY_DATABASE } from '@mmo-idle/shared';
import { conceptAbilityIconSource } from '../../client/src/ui/conceptIcons';
import { BORROWED_BASE_GLYPHS, conceptArtPath } from '../../client/src/ui/abilityIconModel';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const PUBLIC = join(__dirname, '../../client/public');
const onDisk = (publicPath: string): boolean => existsSync(join(PUBLIC, publicPath.split('?')[0]));

// Every ability has a base glyph that exists: its own concept icon, or a borrowed tile.
for (const ability of ABILITY_DATABASE.values()) {
  const icon = ability.icon?.trim() || ability.id;
  const concept = conceptAbilityIconSource(icon);
  const path = concept?.src ?? (BORROWED_BASE_GLYPHS[icon] ? conceptArtPath(BORROWED_BASE_GLYPHS[icon]) : undefined);
  assert(path, `${ability.id} has no base glyph (a placeholder tile)`);
  assert(onDisk(path), `${ability.id}'s base glyph ${path} is not on disk`);
}
for (const [id, path] of Object.entries(BORROWED_BASE_GLYPHS)) {
  assert(!conceptAbilityIconSource(id), `${id} has art of its own now; drop its borrowed glyph`);
  assert(onDisk(conceptArtPath(path)), `${id}'s borrowed glyph is not on disk`);
}

console.log('abilityIconArt: ok');
