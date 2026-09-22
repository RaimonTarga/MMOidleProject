import assert from 'node:assert/strict';
import { NODE_BIOMES, RECIPE_DATABASE, type EquippedRule } from '@mmo-idle/shared';
import { BREADTH_CELLS, type BreadthCell } from './playerBreadthSpec';

export const T2_MULTI_ID = 't2-multi-biome-class-01';
export const T2_MULTI_SEEDS = [101009, 101021] as const;
export const T2_MULTI_ENDPOINTS = [300000, 600000];
export const T2_MULTI_BIOMES = ['plains', 'forest', 'swamp', 'mountain', 'cave', 'jungle', 'desert'] as const;
const roots = ['striker', 'squire', 'apprentice', 'slinger', 'conduit', 'spirit'] as const;
const frames = ['light', 'balanced', 'heavy'] as const;
type Root = typeof roots[number];
type Frame = typeof frames[number];
type Biome = typeof T2_MULTI_BIOMES[number];
export const T2_LOW_HP_RULE: EquippedRule = { conditionId: 'in-combat', actionId: 'focus-lowest-hp' };
export interface T2MultiCell extends BreadthCell {
  seed: number;
  block: 'A' | 'B' | 'D';
  arm: string;
  comparisonId: string;
  referenceCaseId: string;
  sourceObservationId: null;
  biome: Biome;
  policy: 'static';
  delayedFocus: boolean;
}
function weapon(root: Root, frame: Frame) {
  if (root === 'striker') return frame === 'heavy' ? 'knight-steelsword' : 'gale-needle';
  if (root === 'squire') return 'quake-hammer';
  if (root === 'slinger') return 'jungle-stinger-rapier';
  if (frame === 'heavy') return 'quake-hammer';
  if ((root === 'conduit' || root === 'spirit') && frame === 'light') return 'jungle-stinger-rapier';
  return 'ruinous-axe';
}
function primary(root: Root, frame: Frame, biome: Biome, seed: number): T2MultiCell {
  const original = BREADTH_CELLS.find(c => c.identityId === `breadth-t2-${root}-${frame}` && c.role === 'farm' && !c.controlCaseId)!;
  assert(original);
  const c = structuredClone(original) as T2MultiCell;
  const melee = root === 'striker' || root === 'squire';
  const swarm = ['plains', 'forest', 'swamp', 'jungle'].includes(biome);
  const comparisonId = `t2mb-${root}-${frame}-${biome}-s${seed}`;
  Object.assign(c, { id: `${comparisonId}-primary`, seed, block: biome === 'desert' ? 'D' : 'A', arm: 'primary',
    comparisonId, referenceCaseId: original.id, sourceObservationId: null, biome, policy: 'static',
    nodeId: `node-t2-${biome}-03`, delayedFocus: biome === 'desert' && melee,
    stance: root === 'squire' || root === 'conduit' || frame === 'heavy' ? 'defensive-stance' : 'offensive-stance' });
  c.build.id = c.id;
  const armor = biome === 'swamp' ? 'swamp' : biome === 'cave' ? 'cave' :
    ['mountain', 'desert'].includes(biome) || root === 'spirit' ? 'mountain' : root === 'slinger' ? 'jungle' : 'plains';
  const charm = biome === 'mountain' || (root === 'spirit' && biome !== 'swamp' && biome !== 'jungle') ? 'mountain' : 'swamp';
  c.build.gearItemIds = { weapon: weapon(root, frame), armor: `${armor}-vest-t2`, recovery: `${charm}-charm-t2`,
    mobility: `${['mountain', 'cave'].includes(biome) ? 'cave' : melee ? 'mountain' : 'desert'}-boots-t2`,
    core: root === 'conduit' ? 'core-survivalist' : 'core-tempered' };
  const heavy = RECIPE_DATABASE.get(c.build.gearItemIds.weapon!)!.attacksPerSecond! < 0.8;
  c.abilities = { techniques: [swarm ? (heavy ? 'slam' : 'sweep') : 'power-strike'],
    guards: ['second-wind', 'brace', 'cleanse'] };
  c.runeRules = [
    { conditionId: 'always', actionId: 'auto-path-enemy' },
    { conditionId: 'inside-telegraph', actionId: 'step-back' },
    ...(!melee ? [{ conditionId: 'in-combat', actionId: 'orbit' } as EquippedRule] : []),
    { conditionId: 'always', actionId: 'avoid-hazards' },
    { conditionId: 'always', actionId: 'wait-for-regen' },
  ];
  c.preparationNotes = [original.preparationNotes[0],
    'Mature synthetic T2, reachable mastery caps, ordinary +5 clamped to item maximum; no acquisition claim, no future range nodes or rites.',
    `${swarm ? 'AoE' : 'Single-target'} Technique; Second Wind, Brace and Cleanse retained for every primary and paired weapon alternative.`,
    `${armor} armor / ${charm} charm; biome and class rationale and tradeoffs are in PACKAGES.md.`,
    'Break Free is T3 and unavailable; Cleanse retains current semantics, not a substitute grant of hard-control removal.',
    c.delayedFocus ? 'At 300000 ms if alive: one normal craft at Desert >=4 for 90 yellow, then validated 3-RP In Combat -> Focus Lowest HP. Initial wallet reserves 90 yellow; no midpoint grant, healing, reset or retry.' :
      melee ? 'Native melee nearest-target approach; no lowest-HP rune outside Desert.' : 'Native pre-T3 ranged behavior with Keep Distance; no private dealer selection.',
    'No Wait It Out, Flee, Endure, stance switching or combat treatment. Spare RP remains visible.'];
  return c;
}
const alternatives = [
  { root: 'apprentice', frame: 'balanced', arm: 'W1', weapon: 'quake-hammer' },
  { root: 'slinger', frame: 'balanced', arm: 'W2', weapon: 'swamp-mirebrand' },
  { root: 'striker', frame: 'light', arm: 'W3', weapon: 'knight-steelsword' },
];
// Rotate biome by root so a partial queue covers all roots and encounter families.
// A matched weapon pair remains adjacent, with order reversed in the second seed.
export const T2_MULTI_CELLS: T2MultiCell[] = T2_MULTI_SEEDS.flatMap(seed => frames.flatMap(frame =>
  T2_MULTI_BIOMES.flatMap((_, offset) => roots.flatMap((root, rootIndex) => {
    const biome = T2_MULTI_BIOMES[(offset + rootIndex) % T2_MULTI_BIOMES.length];
    const base = primary(root, frame, biome, seed);
    const spec = ['swamp', 'cave'].includes(biome) && alternatives.find(a => a.root === root && a.frame === frame);
    if (!spec) return [base];
    const alt = structuredClone(base);
    Object.assign(alt, { id: `${base.comparisonId}-${spec.arm.toLowerCase()}`, block: 'B', arm: spec.arm, alternate: true });
    alt.build.id = alt.id; alt.build.gearItemIds.weapon = spec.weapon;
    alt.preparationNotes.push(`Whole weapon comparison: ${base.build.gearItemIds.weapon} -> ${spec.weapon}; every support choice stays fixed.`);
    return seed === T2_MULTI_SEEDS[0] ? [base, alt] : [alt, base];
  }))));
assert.equal(T2_MULTI_CELLS.length, 264);
assert.equal(new Set(T2_MULTI_CELLS.map(c => c.id)).size, 264);
for (const c of T2_MULTI_CELLS) {
  const node = NODE_BIOMES[c.nodeId];
  assert(node && node.biomeTier === 2 && !node.isDungeon && node.kind === 'normal');
}
export const T2_MULTI_BLOCKS = Object.fromEntries([
  ...T2_MULTI_CELLS.map(c => [c.id, { cells: [c], durationMs: 600000, pilotIds: [] }]),
  ['qualification', { cells: T2_MULTI_CELLS, durationMs: 600000, pilotIds: [] }],
]);
