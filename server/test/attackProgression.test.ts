import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ABILITY_DATABASE, SKILL_TREE } from '@mmo-idle/shared';
import { attackFlairOf, flairCount } from '../../client/src/fx/attackFlair';

// PLAYER ATTACK PROGRESSION (client fx/attackFlair.ts + fx/pathSignatures.ts):
// the stage ladder follows class advancement, ascension scales intensity, and
// every tier-3 specialization is visibly its own thing.

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const base = { selectedSubVariant: null, selectedRange: null, unlockedSkills: [] as string[], playerTier: 0 };

// ── The ladder ────────────────────────────────────────────────────────────────
{
  const root = attackFlairOf({ ...base, unlockedSkills: ['cadence-root'] });
  const frame = attackFlairOf({ ...base, selectedSubVariant: 'heavy', unlockedSkills: ['cadence-root', 'cadence-heavy'] });
  const range = attackFlairOf({ ...base, selectedSubVariant: 'heavy', selectedRange: 'cadence-range-mid', unlockedSkills: ['cadence-root', 'cadence-heavy', 'cadence-range-mid'] });
  const spec = attackFlairOf({
    ...base, selectedSubVariant: 'heavy', selectedRange: 'cadence-range-mid',
    unlockedSkills: ['cadence-root', 'cadence-heavy', 'cadence-range-mid', 'cadence-heavy-t3-a'],
  });
  assert(root.stage === 0 && !root.glow, 'a class root alone is the vanilla stage, without glow');
  assert(frame.stage === 1 && frame.glow, 'the frame pick is stage 1 and brings the glow');
  assert(range.stage === 2, 'the range pick is stage 2');
  assert(spec.stage === 3 && spec.specId === 'cadence-heavy-t3-a', 'a specialization is stage 3 and names its path');
  assert(root.sparks < frame.sparks && frame.sparks < range.sparks && range.sparks < spec.sparks,
    'each stage should throw more particles than the last');
  assert(flairCount(16, root) < 16 && flairCount(16, root) >= 1, 'stage 0 thins particles but never to zero');

  const ascended = attackFlairOf({ ...base, selectedSubVariant: 'heavy', selectedRange: 'cadence-range-mid',
    unlockedSkills: ['cadence-heavy-t3-a'], playerTier: 4 });
  assert(ascended.sparks > spec.sparks && ascended.scale > spec.scale, 'ascension should scale intensity up');
  assert(attackFlairOf({ ...base, playerTier: 99 }).ascension === 4, 'ascension clamps to T4');
}

// ── Every specialization is its own thing ─────────────────────────────────────
// Paths that REPLACE their basic attack wholesale in combatFx (and so never reach
// the signature layer). Keep this list short and named: anything else needs a row.
const REPLACES_ATTACK = new Set([
  'cadence-light-t3-c', // Swiftblade: dual diagonal slash
  'energy-balanced-t3-a', // Equinox: charge / discharge arc
  'energy-light-t3-a', // Stormdancer: lightning dagger
  'reload-heavy-t3-a', // Melter: laser
  'reload-light-t3-c', // Sniper: heavy shell
  'reload-balanced-t3-b', // Blunderbuss: pellet volley
]);
const sigSource = readFileSync(join(__dirname, '../../client/src/fx/pathSignatures.ts'), 'utf8');
const table = sigSource.split('const SIGNATURES')[1] ?? '';
const rows = new Set([...table.matchAll(/^\s+'([a-z]+-[a-z]+-t3-[abc])':/gm)].map((m) => m[1]));
const missing: string[] = [];
for (const node of (SKILL_TREE as Map<string, { id: string; tier: number; name: string }>).values()) {
  if (node.tier !== 3 || node.id.startsWith('summoner-')) continue;
  if (!/-t3-[abc]$/.test(node.id)) continue;
  if (!rows.has(node.id) && !REPLACES_ATTACK.has(node.id)) missing.push(`${node.name} (${node.id})`);
  assert(!(rows.has(node.id) && REPLACES_ATTACK.has(node.id)), `${node.id} is both replaced and signed`);
}
assert(missing.length === 0, `specializations with no signature and no bespoke attack: ${missing.join(', ')}`);
assert(rows.size + REPLACES_ATTACK.size === 45, `expected 45 combat specializations, got ${rows.size + REPLACES_ATTACK.size}`);

const combatFx = readFileSync(join(__dirname, '../../client/src/render/combatFx.ts'), 'utf8');
assert(combatFx.includes('playPathSignature(scene, flair, from, to, ev.empowered)'),
  'the ordinary attack branch should play the path signature');

// ── Abilities progress by rank (client fx/abilityRank.ts) ────────────────────
// Every Guard and Technique needs a rank colour, or its II-IV layers fall back to
// a generic one that says nothing about the ability.
const rankSource = readFileSync(join(__dirname, '../../client/src/fx/abilityRank.ts'), 'utf8');
const colorTable = rankSource.split('const ABILITY_COLOR')[1]?.split('\n};')[0] ?? '';
const colored = new Set([...colorTable.matchAll(/^\s+'?([a-z-]+)'?:\s*0x/gm)].map((m) => m[1]));
const uncolored = [...(ABILITY_DATABASE as Map<string, { id: string }>).keys()].filter((id) => !colored.has(id));
assert(uncolored.length === 0, `abilities with no rank colour: ${uncolored.join(', ')}`);
for (const hook of [
  'playAbilityRank(scene, ev.playerId, ev.ability, { x: sprite.x, y: sprite.y })',
  'if (impact) playAbilityRank(scene, ev.playerId, ev.ability, impact)',
  'playAbilityRank(scene, ev.playerId, consumed,',
]) {
  assert(combatFx.includes(hook), `combatFx should play the ability rank layer: ${hook}`);
}

console.log('attackProgression: ok');
