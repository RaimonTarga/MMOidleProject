import { MONSTER_DATABASE, NODE_BIOMES } from '@mmo-idle/shared';
import {
  DURABILITY35_ADOPTED_FROM,
  DURABILITY35_ATTACK,
  DURABILITY35_BLOCKS,
  DURABILITY35_NODES,
  DURABILITY35_SEEDS,
  assertDurability35Definitions,
  installDurability35Treatment,
} from '../bench/balance/durability35Spec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assertDurability35Definitions();

// ── Shape: one block, 72 planned observations, two contexts, balanced arms.
{
  const block = DURABILITY35_BLOCKS['mountain-pressure'];
  assert(!!block, 'missing block');
  assert(block.cells.length === 24, `expected 24 cells, got ${block.cells.length}`);
  assert(block.cells.length * DURABILITY35_SEEDS.length === 72, 'planned observation count drifted');
  assert(block.durationMs === 300_000, 'window drift');
  assert(new Set(block.cells.map((c) => c.id)).size === block.cells.length, 'duplicate cell id');
  assert(new Set(DURABILITY35_SEEDS).size === 3, 'three declared seeds');

  // Every cell must DECLARE its arm: the audits read arms from the manifest, and
  // an undeclared arm is what pooled two treatments in Durability34.
  for (const c of block.cells) assert(!!c.treatment, `${c.id} declares no treatment`);
  const control = block.cells.filter((c) => c.treatment === 'control');
  const candidate = block.cells.filter((c) => c.treatment === 'candidate');
  assert(control.length === 12 && candidate.length === 12, 'arms must be balanced');

  const nodes = [...new Set(block.cells.map((c) => c.nodeId))].sort();
  assert(nodes.join(',') === DURABILITY35_NODES.slice().sort().join(','), `node drift: ${nodes.join(',')}`);
  // Two genuinely different contexts, not one node run twice.
  const modifiers = DURABILITY35_NODES.map((n) => (NODE_BIOMES[n] as { modifier?: string }).modifier);
  assert(new Set(modifiers).size === 2, `the two contexts must differ: ${modifiers.join(',')}`);

  // Matched pairs: only the arm label may differ.
  for (const c of control) {
    const pair = candidate.find((x) => x.className === c.className && x.nodeId === c.nodeId);
    assert(!!pair, `${c.className}@${c.nodeId} has no candidate pair`);
    assert(pair.upgradeLevel === c.upgradeLevel, 'pairs share upgrades');
    assert(JSON.stringify(pair.build.gearItemIds) === JSON.stringify(c.build.gearItemIds), 'pairs share gear');
    assert(JSON.stringify(pair.build.skillPath) === JSON.stringify(c.build.skillPath), 'pairs share the skill path');
    assert(JSON.stringify(pair.guards) === JSON.stringify(c.guards), 'pairs share guards');
  }
  for (const cell of block.cells) {
    assert(cell.tier === 1 && cell.build.playerTier === 1, 'T1 character');
    assert(NODE_BIOMES[cell.nodeId]?.biomeGroup === 'mountain', 'Mountain');
    assert(cell.targetTypes.includes('ridge-archer') && cell.targetTypes.includes('cliff-hopper'),
      'both species of the package must be required exposure');
    // Second Wind is the reference guard: Durability34 rejected the Brace
    // substitution as a general solution, so it is not carried into this grid.
    assert(JSON.stringify(cell.guards) === JSON.stringify(['second-wind']), 'guard must stay Second Wind in both arms');
    assert(!cell.build.gearItemIds.core, 'a T1 character has no core');
  }
}

// ── The package: attack only, both species, nothing else moved.
{
  const snapshot = () => JSON.stringify([...MONSTER_DATABASE.entries()]
    .map(([k, v]) => [k, v.stats.hp, v.stats.attack, v.stats.attackCooldown, v.chargedAttack?.multiplier]));
  const baseline = snapshot();
  const block = DURABILITY35_BLOCKS['mountain-pressure'];

  const control = installDurability35Treatment(block.cells.find((c) => c.treatment === 'control')!);
  assert(control.changes.length === 0, 'the control arm overlays nothing');
  control.restore();
  assert(snapshot() === baseline, 'control restore');

  const candidate = installDurability35Treatment(block.cells.find((c) => c.treatment === 'candidate')!);
  assert(candidate.changes.length === 2, 'exactly the two species move');
  // RETIRED: the package is adopted, so the overlay is a no-op on current source
  // and the cut can never be applied twice.
  for (const [type, [before, after]] of Object.entries(DURABILITY35_ATTACK)) {
    const d = MONSTER_DATABASE.get(type)!;
    assert(before === after, `${type}: a retired treatment must be a no-op`);
    assert(d.stats.attack === after, `${type}: attack must stay ${after}`);
    assert(after === Math.round(DURABILITY35_ADOPTED_FROM[type] * 0.8),
      `${type}: the adopted value is the 20% cut of the historical baseline`);
  }
  // Attack-only: HP, cadence and the charged multipliers must not move. The
  // charged attacks change because their damage DERIVES from attack, which is
  // the intended package effect and is verified end to end in the preflight.
  assert(MONSTER_DATABASE.get('ridge-archer')!.stats.hp === 240, 'archer HP fixed');
  assert(MONSTER_DATABASE.get('cliff-hopper')!.stats.hp === 190, 'hopper HP fixed');
  assert(MONSTER_DATABASE.get('ridge-archer')!.chargedAttack!.multiplier === 2.2, 'Power Shot stays 2.2 in both arms');
  assert(MONSTER_DATABASE.get('cliff-hopper')!.chargedAttack!.multiplier === 1.9, 'Strong Kick multiplier fixed');
  assert(candidate.changes.every((c) => c.before === c.after), 'HP columns stay equal: this package is attack-only');
  assert(candidate.changes.every((c) => c.afterAttack === c.beforeAttack), 'retired: the attack columns no longer move');
  candidate.restore();
  assert(snapshot() === baseline, 'candidate restore');

  const thrown = installDurability35Treatment(block.cells.find((c) => c.treatment === 'candidate')!);
  try { throw new Error('simulated failure'); } catch { thrown.restore(); }
  assert(snapshot() === baseline, 'restore must survive a failed observation');

  // No other T1 or T2-T4 species may be touched by this package.
  for (const id of ['granite-titan', 'stone-eagle', 'peak-archer', 'apex-silverback', 'emerald-constrictor']) {
    const d = MONSTER_DATABASE.get(id);
    if (d) assert(!Object.keys(DURABILITY35_ATTACK).includes(id), `${id} must be outside this package`);
  }
}

console.log('durability35Matrix: ok');
