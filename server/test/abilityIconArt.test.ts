/**
 * The composed ability icon's art (design §22.7, client `ui/abilityIconModel.ts`):
 * every layer shared's `abilityIconLayers` can emit resolves to EXISTING art on
 * disk — no new PNGs, no packed atlas edited — and every one of the 19 abilities,
 * Sidestep and Cull included, has a base glyph.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ABILITY_DATABASE,
  ABILITY_KEYSTONE_SILHOUETTES,
  ABILITY_NODE_DATABASE,
  abilityIconLayers,
  abilityNodeOptionsForRow,
  type AbilityNodeProgress,
} from '@mmo-idle/shared';
import { conceptAbilityIconSource } from '../../client/src/ui/conceptIcons';
import {
  AXIS_GLYPHS,
  BORROWED_BASE_GLYPHS,
  KEYSTONE_GLYPHS,
  composedIconArt,
  conceptArtPath,
} from '../../client/src/ui/abilityIconModel';

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

// Every keystone silhouette shared names has a second glyph, and it exists.
for (const keystone of ABILITY_KEYSTONE_SILHOUETTES.keys()) {
  const path = KEYSTONE_GLYPHS[keystone];
  assert(path, `${keystone} has a silhouette but no glyph`);
  assert(onDisk(conceptArtPath(path)), `${keystone}'s glyph ${path} is not on disk`);
}
for (const keystone of Object.keys(KEYSTONE_GLYPHS)) {
  assert(ABILITY_KEYSTONE_SILHOUETTES.has(keystone), `a glyph for ${keystone}, which has no silhouette`);
}

// Every axis an ability amplifier offers has an overlay glyph, and it exists.
for (const tree of ABILITY_NODE_DATABASE.values()) {
  for (const option of abilityNodeOptionsForRow(tree, 'amplifier')) {
    const path = option.amplifies ? AXIS_GLYPHS[option.amplifies] : undefined;
    assert(path, `${option.id}: the ${option.amplifies} axis has no glyph`);
    assert(onDisk(conceptArtPath(path)), `${option.amplifies}'s glyph ${path} is not on disk`);
  }
}

// Every layer of every first-verb build resolves to something drawn.
for (const tree of ABILITY_NODE_DATABASE.values()) {
  const packet = abilityNodeOptionsForRow(tree, 'packet')[0];
  const amplifier = abilityNodeOptionsForRow(tree, 'amplifier').find((o) => o.modifies === packet.id)!;
  const keystone = abilityNodeOptionsForRow(tree, 'keystone')[0];
  const cross = abilityNodeOptionsForRow(tree, 'cross').find((o) => o.lane !== packet.lane)!;
  const ids = [packet.id, amplifier.id, keystone.id, cross.id];
  const progress: AbilityNodeProgress = {
    owned: ids,
    active: { packet: packet.id, amplifier: amplifier.id, keystone: keystone.id, cross: cross.id },
  };
  const layers = abilityIconLayers(tree.abilityId, progress);
  const art = composedIconArt(layers);
  assert(art.frame && art.edge && art.axisGlyph, `${tree.abilityId}: the frame, the edge and the axis glyph draw`);
  // A keystone draws only once its verb is live (W2-A/W2-B flip the rest).
  if (layers.some((l) => l.kind === 'keystone-border')) {
    assert(art.border && art.keystoneGlyph, `${tree.abilityId}: a live verb draws its border and its glyph`);
  }
  for (const path of [art.axisGlyph, art.keystoneGlyph].filter((p): p is string => !!p)) {
    assert(path.startsWith('/assets/concept-icons/'), `${path}: composed art is concept art, never an atlas frame`);
  }
}

console.log('abilityIconArt: ok');
