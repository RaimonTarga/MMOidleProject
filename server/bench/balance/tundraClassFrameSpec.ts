import assert from 'node:assert/strict';
import { NODE_BIOMES } from '@mmo-idle/shared';
import { BREADTH_CELLS, type BreadthCell } from './playerBreadthSpec';

export const TUNDRA_CLASS_FRAME_EXPERIMENT_ID = 't3-tundra-class-frame-01';
export const TUNDRA_CLASS_FRAME_SEEDS = [101009, 101021] as const;
export const TUNDRA_CLASS_FRAME_ENDPOINTS = [300000, 600000];
export const TUNDRA_CLASS_FRAME_CAP_MS = 600000;

const ROOTS = ['striker', 'squire', 'apprentice', 'slinger', 'conduit', 'spirit'] as const;
const FRAMES = ['light', 'balanced', 'heavy'] as const;
type Root = typeof ROOTS[number];
type Frame = typeof FRAMES[number];

export interface TundraClassFrameCell extends BreadthCell {
  seed: number;
  arm: 'primary' | string;
  block: 'primary' | 'alternative';
  comparisonId: string;
  alternativeId: string | null;
  referenceCaseId: string;
  sourceObservationId: null;
  charm: 'swamp' | 'jungle' | 'mountain';
  policy: 'static';
}

const gearByRoot: Record<Root, Pick<TundraClassFrameCell['build']['gearItemIds'], 'armor' | 'recovery' | 'mobility'>> = {
  striker: { armor: 'volcanic-vest-t3', recovery: 'swamp-charm-t3', mobility: 'mountain-boots-t3' },
  squire: { armor: 'mountain-vest-t3', recovery: 'swamp-charm-t3', mobility: 'mountain-boots-t3' },
  apprentice: { armor: 'cave-vest-t3', recovery: 'swamp-charm-t3', mobility: 'desert-boots-t3' },
  slinger: { armor: 'jungle-vest-t3', recovery: 'jungle-charm-t3', mobility: 'desert-boots-t3' },
  conduit: { armor: 'mountain-vest-t3', recovery: 'jungle-charm-t3', mobility: 'desert-boots-t3' },
  spirit: { armor: 'mountain-vest-t3', recovery: 'mountain-charm-t3', mobility: 'desert-boots-t3' },
};
const charmByRoot: Record<Root, TundraClassFrameCell['charm']> = {
  striker: 'swamp', squire: 'swamp', apprentice: 'swamp', slinger: 'jungle', conduit: 'jungle', spirit: 'mountain',
};
const weaponFor = (root: Root, frame: Frame): string => {
  if (root === 'striker') return 'volcanic-cinderlash';
  if (root === 'squire') return 'mountain-avalanche-maul';
  if (root === 'apprentice') return frame === 'heavy' ? 'tundra-permafrost-maul' : 'cave-cataclysm-axe';
  if (root === 'slinger') return 'jungle-venomthorn-rapier';
  if (root === 'conduit') return frame === 'light' ? 'jungle-venomthorn-rapier' : frame === 'balanced' ? 'cave-cataclysm-axe' : 'tundra-permafrost-maul';
  return frame === 'light' ? 'volcanic-cinderlash' : 'cave-cataclysm-axe';
};
const coreFor = (root: Root, frame: Frame): string => {
  if (root === 'striker') return 'core-accelerant';
  if (root === 'squire') return 'core-arcanist';
  if (root === 'apprentice') return frame === 'light' ? 'core-accelerant' : 'core-tempered';
  if (root === 'conduit') return 'core-survivalist';
  if (root === 'spirit') return frame === 'heavy' ? 'core-tempered' : 'core-accelerant';
  return 'core-tempered';
};
const techniquesFor = (root: Root): string[] => {
  if (root === 'striker') return ['frenzy', 'power-strike'];
  if (root === 'squire') return ['power-strike', 'frenzy'];
  if (root === 'slinger' || root === 'conduit') return ['quick-strike', 'hamstring'];
  return ['frenzy', 'hamstring'];
};
const stanceFor = (root: Root, frame: Frame) =>
  root === 'squire' || root === 'conduit' || frame === 'heavy' ? 'defensive-stance' : 'offensive-stance';

function primary(root: Root, frame: Frame, seed: number): TundraClassFrameCell {
  const identityId = `breadth-t3-${root}-${frame}`;
  const original = BREADTH_CELLS.find(c => c.identityId === identityId && c.role === 'farm' && !c.controlCaseId);
  assert(original, identityId);
  const cell = structuredClone(original) as TundraClassFrameCell;
  const comparisonId = `${TUNDRA_CLASS_FRAME_EXPERIMENT_ID}-${root}-${frame}-s${seed}`;
  Object.assign(cell, {
    id: `${comparisonId}-primary`, seed, arm: 'primary', block: 'primary', comparisonId,
    alternativeId: null, referenceCaseId: original.id, sourceObservationId: null,
    nodeId: 'node-t3-tundra-03', stance: stanceFor(root, frame), charm: charmByRoot[root], policy: 'static',
  });
  cell.build.id = cell.id;
  cell.build.gearItemIds = {
    weapon: weaponFor(root, frame), ...gearByRoot[root], core: coreFor(root, frame),
  };
  cell.abilities = {
    techniques: techniquesFor(root),
    guards: [
      'second-wind', root === 'squire' && frame === 'heavy' ? 'endure' : 'brace', 'cleanse',
      ...(root === 'apprentice' && frame === 'balanced' ? [] : ['break-free']),
    ],
  };
  cell.runeRules = [
    { conditionId: 'always', actionId: 'auto-path-enemy' },
    { conditionId: 'inside-telegraph', actionId: 'step-back' },
    ...(cell.range === 'mid' ? [{ conditionId: 'in-combat', actionId: 'orbit' } as const] : []),
    { conditionId: 'always', actionId: 'avoid-hazards' },
    { conditionId: 'always', actionId: 'wait-for-regen' },
  ];
  cell.preparationNotes = [
    original.preparationNotes[0],
    'New complete T3 Tundra package; historical generic farming results are contextual, not controls.',
    'Mature synthetic T3 ownership, legal +5 ordinary equipment, full HP/barrier, production Conduit R2 and native owner targeting.',
    `${cell.stance} remains fixed; no switching or generic Flee rule.`,
    cell.range === 'mid' ? 'Mid-range Keep Distance, telegraph stepping, hazard avoidance and Recover First are fixed.' : 'Close range, telegraph stepping, hazard avoidance and Recover First are fixed.',
    root === 'squire' && frame === 'heavy' ? 'Endure is the explicitly declared sustained-tanking Guard for Heavy Squire; every other row starts from Brace.' : 'Brace is the declared burst Guard.',
    root === 'apprentice' && frame === 'balanced' ? 'Break Free is omitted from both Balanced Apprentice arms so Fully Afflicted -> Detonate fits 38 RP; Cleanse, Hamstring and movement counterplay remain.' : 'Break Free is retained for Tundra hard-control pressure.',
    'Glacial Bulwark is excluded. Unused RP is deliberate headroom, not an optimization claim.',
  ];
  return cell;
}

type Alternative = { id: string; root: Root; frame: Frame; apply: (cell: TundraClassFrameCell) => void; note: string };
const ALTERNATIVES: Alternative[] = [
  ...(['light', 'balanced', 'heavy'] as const).map((frame, index) => ({
    id: `W${index + 1}`, root: 'striker' as const, frame,
    apply: (c: TundraClassFrameCell) => { c.build.gearItemIds.weapon = 'cave-cataclysm-axe'; },
    note: 'Cinderlash -> Cataclysm Axe; Frenzy, Power Strike, core, stance and defense remain fixed.',
  })),
  { id: 'W4', root: 'squire', frame: 'heavy', apply: c => { c.build.gearItemIds.weapon = 'tundra-permafrost-maul'; }, note: 'Avalanche Maul -> Permafrost Maul; Power Strike, core, policy and Endure remain fixed.' },
  { id: 'W5', root: 'slinger', frame: 'balanced', apply: c => { c.build.gearItemIds.weapon = 'swamp-blightbrand'; }, note: 'Venomthorn Rapier -> Plague Fang; Quick Strike, Hamstring, core and policy remain fixed.' },
  { id: 'A2', root: 'apprentice', frame: 'balanced', apply: c => {
    c.abilities!.techniques = ['detonate', 'hamstring'];
    c.runeRules!.unshift({ conditionId: 'target-max-stacks', actionId: 'use-ability', targetAbilityId: 'detonate' });
  }, note: 'Frenzy -> Detonate with the existing Fully Afflicted timing rule; weapon, control, core, stance and defense remain fixed.' },
  { id: 'W6', root: 'conduit', frame: 'balanced', apply: c => { c.build.gearItemIds.weapon = 'tundra-permafrost-maul'; }, note: 'Cataclysm Axe -> Permafrost Maul; Quick Strike, Hamstring, formation, core and policy remain fixed.' },
  { id: 'A3', root: 'spirit', frame: 'balanced', apply: c => { c.abilities!.techniques = ['frenzy', 'binding-strike']; }, note: 'Hamstring -> Binding Strike; equipment, Frenzy, core, stance and policy remain fixed.' },
];

function alternative(base: TundraClassFrameCell, spec: Alternative): TundraClassFrameCell {
  const cell = structuredClone(base);
  cell.arm = spec.id;
  cell.block = 'alternative';
  cell.alternativeId = spec.id;
  cell.id = `${cell.comparisonId}-${spec.id.toLowerCase()}`;
  cell.build.id = cell.id;
  spec.apply(cell);
  cell.preparationNotes.push(spec.note);
  return cell;
}

export const TUNDRA_CLASS_FRAME_BASES = ROOTS.flatMap(root => FRAMES.map(frame => primary(root, frame, 101009)));
export const TUNDRA_CLASS_FRAME_CELLS: TundraClassFrameCell[] = TUNDRA_CLASS_FRAME_SEEDS.flatMap(seed =>
  FRAMES.flatMap(frame => ROOTS.flatMap(root => {
    const base = primary(root, frame, seed);
    const alt = ALTERNATIVES.find(x => x.root === root && x.frame === frame);
    if (!alt) return [base];
    const pair = [base, alternative(base, alt)];
    return seed === 101009 ? pair : pair.reverse();
  })),
);

assert(NODE_BIOMES['node-t3-tundra-03'] && !NODE_BIOMES['node-t3-tundra-03'].isDungeon);
assert.equal(TUNDRA_CLASS_FRAME_BASES.length, 18);
assert.equal(ALTERNATIVES.length, 8);
assert.equal(TUNDRA_CLASS_FRAME_CELLS.length, 52);
assert(!TUNDRA_CLASS_FRAME_CELLS.some(c => c.abilities?.techniques.includes('slam')));

export const TUNDRA_CLASS_FRAME_BLOCKS = Object.fromEntries([
  ...TUNDRA_CLASS_FRAME_CELLS.map(c => [c.id, { cells: [c], durationMs: TUNDRA_CLASS_FRAME_CAP_MS, pilotIds: [] }]),
  ['qualification', { cells: TUNDRA_CLASS_FRAME_CELLS, durationMs: TUNDRA_CLASS_FRAME_CAP_MS, pilotIds: [] }],
]);
