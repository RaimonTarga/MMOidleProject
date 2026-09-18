import { MONSTER_DATABASE, NODE_BIOMES } from '@mmo-idle/shared';
import {
  DURABILITY32_BLOCKS,
  DURABILITY32_SEEDS,
  DURABILITY32_REPAIR_SEEDS,
  RIDGE_ARCHER_POWER_SHOT_CANDIDATE,
  RIDGE_ARCHER_POWER_SHOT_CONTROL,
  assertDurability32Definitions,
  installDurability32Treatment,
} from '../bench/balance/durability32Spec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// The frozen starting point. Fails loudly if the authored species moved.
assertDurability32Definitions();

// ── Matrix shape: three separately reported blocks, 120 planned observations.
{
  const expected = [
    ['jungle-repair', 4, 120_000],
    ['mountain-powershot', 24, 300_000],
    ['jungle-breadth', 12, 300_000],
  ] as const;
  assert(
    Object.keys(DURABILITY32_BLOCKS).length === expected.length,
    `expected ${expected.length} blocks, got ${Object.keys(DURABILITY32_BLOCKS).join(',')}`,
  );
  let observations = 0;
  for (const [name, cells, durationMs] of expected) {
    const block = DURABILITY32_BLOCKS[name];
    assert(!!block, `missing block ${name}`);
    assert(block.cells.length === cells, `${name}: expected ${cells} cells, got ${block.cells.length}`);
    assert(block.durationMs === durationMs, `${name}: expected ${durationMs}ms window`);
    assert(block.pilotIds.length > 0, `${name}: needs at least one pilot`);
    assert(
      block.pilotIds.every((id) => block.cells.some((c) => c.id === id)),
      `${name}: pilot ids must name real cells`,
    );
    assert(
      new Set(block.cells.map((c) => c.id)).size === block.cells.length,
      `${name}: duplicate cell id`,
    );
    observations += block.cells.length * 3;
  }
  assert(observations === 120, `planned observation count drifted: ${observations}`);
}

// ── Block A keeps the diagnosed reproductions' identity: same four setups, same seeds.
{
  const block = DURABILITY32_BLOCKS['jungle-repair'];
  assert(DURABILITY32_REPAIR_SEEDS.join(',') === '44017,46021,48017', 'Block A must reuse the Durability30/31 seeds');
  const nodes = [...new Set(block.cells.map((c) => c.nodeId))].sort();
  assert(nodes.join(',') === 'node-t4-jungle-03,node-t4-jungle-05', `Block A nodes drifted: ${nodes.join(',')}`);
  const classes = block.cells.map((c) => `${c.nodeId.slice(-2)}-${c.className}`).sort();
  assert(
    classes.join(',') === '03-apprentice,03-slinger,05-apprentice,05-spirit',
    `Block A cells drifted: ${classes.join(',')}`,
  );
  assert(block.cells.every((c) => c.tier === 4), 'Block A stays T4');
}

// ── Block B: one causal treatment, two preparation contexts, six roots.
{
  const block = DURABILITY32_BLOCKS['mountain-powershot'];
  assert(DURABILITY32_SEEDS.every((s) => !DURABILITY32_REPAIR_SEEDS.includes(s as never)), 'Blocks B/C need fresh seeds');
  const contexts = [...new Set(block.cells.map((c) => c.id.split('-').slice(4, -1).join('-')))].sort();
  assert(contexts.join(',') === 'first-arrival,prepared-farming', `contexts drifted: ${contexts.join(',')}`);

  for (const context of ['first-arrival', 'prepared-farming']) {
    const arms = block.cells.filter((c) => c.id.includes(context));
    assert(arms.length === 12, `${context}: expected 12 cells (6 roots x 2 arms), got ${arms.length}`);
    const control = arms.filter((c) => c.treatment === 'control');
    const candidate = arms.filter((c) => c.treatment === 'candidate');
    assert(control.length === 6 && candidate.length === 6, `${context}: arms must be balanced`);
    // Matched pairs: within a context, only the treatment label may differ.
    for (const c of control) {
      const pair = candidate.find((x) => x.className === c.className);
      assert(!!pair, `${context}: ${c.className} has no candidate pair`);
      assert(pair.nodeId === c.nodeId, `${context}/${c.className}: paired arms must share a node`);
      assert(pair.upgradeLevel === c.upgradeLevel, `${context}/${c.className}: paired arms must share upgrades`);
      assert(
        JSON.stringify(pair.build.gearItemIds) === JSON.stringify(c.build.gearItemIds),
        `${context}/${c.className}: paired arms must share gear`,
      );
      assert(
        JSON.stringify(pair.build.skillPath) === JSON.stringify(c.build.skillPath),
        `${context}/${c.className}: paired arms must share the skill path`,
      );
    }
  }

  // The contexts differ on purpose, and in more than one input.
  const first = block.cells.find((c) => c.id.includes('first-arrival'))!;
  const prepared = block.cells.find((c) => c.id.includes('prepared-farming'))!;
  assert(first.upgradeLevel === 0, 'first arrival carries unupgraded gear');
  assert(prepared.upgradeLevel === 5, 'prepared farming carries the bench +5 kit');
  assert(first.nodeId !== prepared.nodeId, 'the two contexts use different natural Mountain nodes');
  for (const cell of block.cells) {
    assert(cell.tier === 1 && cell.build.playerTier === 1, 'Block B stays a T1 character');
    assert(NODE_BIOMES[cell.nodeId]?.biomeTier === 1, `${cell.nodeId} must be a T1 node`);
    assert(NODE_BIOMES[cell.nodeId]?.biomeGroup === 'mountain', `${cell.nodeId} must be Mountain`);
    assert(cell.targetTypes.includes('ridge-archer'), 'Block B must require archer exposure');
    assert(!cell.build.gearItemIds.core, 'a T1 character has no core');
    assert(cell.build.skillPath.length === 1, 'a T1 character has only its root');
  }
}

// ── Block C: six roots across both Jungle nodes, current stats, no overlay.
{
  const block = DURABILITY32_BLOCKS['jungle-breadth'];
  const nodes = [...new Set(block.cells.map((c) => c.nodeId))].sort();
  assert(nodes.join(',') === 'node-t4-jungle-03,node-t4-jungle-05', `Block C nodes drifted: ${nodes.join(',')}`);
  for (const node of nodes) {
    const roots = block.cells.filter((c) => c.nodeId === node).map((c) => c.className).sort();
    assert(roots.length === 6, `${node}: expected six roots, got ${roots.length}`);
    assert(new Set(roots).size === 6, `${node}: roots must be distinct`);
  }
}

// ── The overlay changes exactly one number, and restores on every path.
{
  const archer = MONSTER_DATABASE.get('ridge-archer')!;
  const baseline = JSON.stringify(archer);

  for (const treatment of ['control', 'candidate'] as const) {
    const cell = DURABILITY32_BLOCKS['mountain-powershot'].cells.find((c) => c.treatment === treatment)!;
    const overlay = installDurability32Treatment(cell);
    const expected = treatment === 'candidate'
      ? RIDGE_ARCHER_POWER_SHOT_CANDIDATE
      : RIDGE_ARCHER_POWER_SHOT_CONTROL;
    assert(
      archer.chargedAttack!.multiplier === expected,
      `${treatment}: expected multiplier ${expected}, got ${archer.chargedAttack!.multiplier}`,
    );
    assert(archer.stats.hp === 240 && archer.stats.attack === 50, `${treatment}: only the multiplier may move`);
    assert(
      overlay.changes.length === 1 && overlay.changes[0].afterAttack === expected,
      `${treatment}: the change record must carry the multiplier`,
    );
    overlay.restore();
    assert(JSON.stringify(archer) === baseline, `${treatment}: restore must return the authored species`);
  }

  // A thrown observation still restores, because the runner calls restore in a finally.
  const cell = DURABILITY32_BLOCKS['mountain-powershot'].cells.find((c) => c.treatment === 'candidate')!;
  const overlay = installDurability32Treatment(cell);
  try {
    throw new Error('simulated observation failure');
  } catch {
    overlay.restore();
  }
  assert(JSON.stringify(archer) === baseline, 'restore must survive a failed observation');

  // Jungle blocks apply no overlay at all.
  for (const name of ['jungle-repair', 'jungle-breadth'] as const) {
    const jungle = installDurability32Treatment(DURABILITY32_BLOCKS[name].cells[0]);
    assert(jungle.changes.length === 0, `${name}: must not overlay any monster stat`);
    jungle.restore();
    assert(JSON.stringify(archer) === baseline, `${name}: must leave the archer untouched`);
  }
}

console.log('durability32Matrix: ok');
