/**
 * Class gear data (class-first build plan §3.6): the invariants every class's gear keeps,
 * whoever enters it. Structure only, never balance: every number is a placeholder.
 */
import { CLASS_NAME_BY_ARCHETYPE, type ClassArchetype } from '../../classKits/types';
import { ITEM_DATABASE } from '../../itemDatabase';
import { RECIPE_DATABASE } from '../recipes';
import { CLASS_GEAR } from './index';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const problems: string[] = [];
const seen = new Set<string>();

for (const [archetype, gear] of Object.entries(CLASS_GEAR) as [ClassArchetype, (typeof CLASS_GEAR)[ClassArchetype]][]) {
  const prefix = `${CLASS_NAME_BY_ARCHETYPE[archetype]}-`;
  for (const weapon of gear.weapons) {
    if (!KEBAB.test(weapon.id) || !weapon.id.startsWith(prefix)) problems.push(`${weapon.id}: ids are "${prefix}<name>", kebab-case`);
    if (seen.has(weapon.id)) problems.push(`${weapon.id}: duplicate`);
    seen.add(weapon.id);
    if (weapon.slot !== 'weapon') problems.push(`${weapon.id}: a class weapon is in the weapon slot`);
    if (!weapon.name.trim() || !weapon.description?.trim()) problems.push(`${weapon.id}: needs a name and a description`);
    const recipe = RECIPE_DATABASE.get(weapon.id);
    if (recipe?.classes?.join() !== archetype) problems.push(`${weapon.id}: registered for ${recipe?.classes?.join() ?? 'nobody'}`);
    if (!ITEM_DATABASE.has(weapon.id)) problems.push(`${weapon.id}: no item`);
  }
  for (const [baseId, line] of Object.entries(gear.lines)) {
    const base = RECIPE_DATABASE.get(baseId);
    if (!base) { problems.push(`${archetype} line on missing base ${baseId}`); continue; }
    if (base.slot !== 'armor' && base.slot !== 'recovery') problems.push(`${archetype} line on ${baseId}: lines go on armor and charm bases`);
    if (base.classes) problems.push(`${archetype} line on ${baseId}: lines go on shared bases, not class gear`);
    if (!line.name.trim() || !line.text.trim()) problems.push(`${archetype} line on ${baseId}: needs a name and a text`);
    if (ITEM_DATABASE.get(baseId)?.classLines?.[archetype]?.name !== line.name) problems.push(`${archetype} line on ${baseId}: not on the item`);
  }
  // Moved lines ride a second base (`<receiving base>-b`), a copy of the receiving base.
  for (const [baseId, line] of Object.entries(gear.movedLines ?? {})) {
    const base = RECIPE_DATABASE.get(baseId);
    const second = RECIPE_DATABASE.get(`${baseId}-b`);
    if (!base || !second) { problems.push(`${archetype} moved line on ${baseId}: no base or no second base`); continue; }
    if (base.slot !== 'armor' && base.slot !== 'recovery') problems.push(`${archetype} moved line on ${baseId}: lines go on armor and charm bases`);
    if (second.slot !== base.slot || second.tier !== base.tier) problems.push(`${baseId}-b: not a copy of its base`);
    if (second.classLines?.[archetype]?.name !== line.name) problems.push(`${archetype} moved line on ${baseId}-b: not on the second base`);
    if (ITEM_DATABASE.get(`${baseId}-b`)?.classLines?.[archetype]?.name !== line.name) problems.push(`${archetype} moved line on ${baseId}-b: not on the item`);
    if (base.classLines?.[archetype]?.name === line.name) problems.push(`${archetype} moved line on ${baseId}: the base already carries it`);
  }
}

assert(problems.length === 0, `class gear problems:\n  ${problems.join('\n  ')}`);
const counts = Object.entries(CLASS_GEAR).map(([a, g]) => `${CLASS_NAME_BY_ARCHETYPE[a as ClassArchetype]} ${g.weapons.length}w/${Object.keys(g.lines).length}l`).join(', ');
console.log(`classGear.test.ts: ok (${counts})`);
