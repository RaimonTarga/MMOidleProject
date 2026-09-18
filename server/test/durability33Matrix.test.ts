import { MONSTER_DATABASE, NODE_BIOMES } from '@mmo-idle/shared';
import {
  DURABILITY33_BLOCKS,
  DURABILITY33_BREADTH_SEEDS,
  DURABILITY33_ENTRY_SEEDS,
  DURABILITY33_REPAIR_SEEDS,
  assertDurability33Definitions,
  installDurability33Treatment,
} from '../bench/balance/durability33Spec';
import { DURABILITY32_BLOCKS, RIDGE_ARCHER_POWER_SHOT_CANDIDATE, RIDGE_ARCHER_POWER_SHOT_CONTROL }
  from '../bench/balance/durability32Spec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assertDurability33Definitions();

// ── Shape: three blocks, 84 planned observations, no pooled dataset.
{
  const expected = [
    ['jungle-repair', 4, 120_000, DURABILITY33_REPAIR_SEEDS],
    ['mountain-entry', 12, 300_000, DURABILITY33_ENTRY_SEEDS],
    ['jungle-breadth', 12, 300_000, DURABILITY33_BREADTH_SEEDS],
  ] as const;
  let observations = 0;
  for (const [name, cells, durationMs] of expected) {
    const block = DURABILITY33_BLOCKS[name];
    assert(!!block, `missing block ${name}`);
    assert(block.cells.length === cells, `${name}: expected ${cells} cells, got ${block.cells.length}`);
    assert(block.durationMs === durationMs, `${name}: window drift`);
    assert(block.pilotIds.length > 0 && block.pilotIds.every((id) => block.cells.some((c) => c.id === id)),
      `${name}: pilots must name real cells`);
    assert(new Set(block.cells.map((c) => c.id)).size === block.cells.length, `${name}: duplicate cell id`);
    observations += block.cells.length * 3;
  }
  assert(observations === 84, `planned observation count drifted: ${observations}`);
  // The historical seeds are reused deliberately to revisit known failures.
  assert(DURABILITY33_REPAIR_SEEDS.join(',') === '44017,46021,48017', 'Block A must revisit the diagnosed seeds');
  assert(DURABILITY33_BREADTH_SEEDS.join(',') === '51001,53017,55009', 'Block C continues D32 breadth coverage');
  assert(DURABILITY33_ENTRY_SEEDS.every((s) => !DURABILITY33_BREADTH_SEEDS.includes(s as never)),
    'the new preparation context draws fresh declared seeds');
}

// ── Blocks A and C are the Durability32 setups, unchanged apart from their ids.
{
  for (const [name, source] of [['jungle-repair', 'jungle-repair'], ['jungle-breadth', 'jungle-breadth']] as const) {
    const now = DURABILITY33_BLOCKS[name].cells;
    const before = DURABILITY32_BLOCKS[source].cells;
    assert(now.length === before.length, `${name}: cell count must match Durability32`);
    for (let i = 0; i < now.length; i++) {
      assert(now[i].nodeId === before[i].nodeId, `${name}: node drift at ${i}`);
      assert(now[i].className === before[i].className, `${name}: root drift at ${i}`);
      assert(JSON.stringify(now[i].build.gearItemIds) === JSON.stringify(before[i].build.gearItemIds),
        `${name}: gear drift at ${i}`);
      assert(now[i].id === before[i].id.replace('dur32', 'dur33'), `${name}: id mapping drift at ${i}`);
    }
  }
}

// ── Block B: one causal treatment, and exactly one documented delta from D32.
{
  const block = DURABILITY33_BLOCKS['mountain-entry'];
  const control = block.cells.filter((c) => c.treatment === 'control');
  const candidate = block.cells.filter((c) => c.treatment === 'candidate');
  assert(control.length === 6 && candidate.length === 6, 'six roots per arm');
  for (const c of control) {
    const pair = candidate.find((x) => x.className === c.className);
    assert(!!pair, `${c.className} has no candidate pair`);
    assert(pair.nodeId === c.nodeId && pair.upgradeLevel === c.upgradeLevel, `${c.className}: pair must share inputs`);
    assert(JSON.stringify(pair.build.gearItemIds) === JSON.stringify(c.build.gearItemIds), `${c.className}: gear must match`);
    assert(JSON.stringify(pair.guards) === JSON.stringify(c.guards), `${c.className}: guards must match`);
  }
  for (const cell of block.cells) {
    assert(cell.tier === 1 && cell.build.playerTier === 1, 'Block B stays a T1 character');
    assert(NODE_BIOMES[cell.nodeId]?.biomeGroup === 'mountain', 'and on Mountain');
    assert(cell.targetTypes.includes('ridge-archer'), 'archer exposure is required');
    assert(cell.upgradeLevel === 3, 'the earned first-arrival kit is +3');
    assert(cell.build.gearItemIds.armor === 'swamp-vest-t1', 'carrying the Swamp vest the route actually holds');
    assert(cell.build.gearItemIds.recovery === 'swamp-charm-t1', 'and the Swamp charm');
    assert(!cell.build.gearItemIds.core, 'a T1 character has no core');
  }
  // The delta vs Durability32's first-arrival must be the KIT and nothing else.
  const old = DURABILITY32_BLOCKS['mountain-powershot'].cells
    .find((c) => c.className === 'striker' && c.id.includes('first-arrival') && c.treatment === 'control')!;
  const now = control.find((c) => c.className === 'striker')!;
  assert(now.nodeId === old.nodeId, 'same Mountain node as the context it corrects');
  assert(now.build.gearItemIds.weapon === old.build.gearItemIds.weapon, 'same class weapon');
  assert(now.upgradeLevel !== old.upgradeLevel, 'the upgrade level is the point of the new context');
  assert(JSON.stringify(now.build.skillPath) === JSON.stringify(old.build.skillPath), 'same skill path');
}

// ── The overlay still changes exactly one number and restores on every path.
{
  const archer = MONSTER_DATABASE.get('ridge-archer')!;
  const baseline = JSON.stringify(archer);
  for (const treatment of ['control', 'candidate'] as const) {
    const cell = DURABILITY33_BLOCKS['mountain-entry'].cells.find((c) => c.treatment === treatment)!;
    const overlay = installDurability33Treatment(cell);
    const expected = treatment === 'candidate' ? RIDGE_ARCHER_POWER_SHOT_CANDIDATE : RIDGE_ARCHER_POWER_SHOT_CONTROL;
    assert(archer.chargedAttack!.multiplier === expected, `${treatment}: multiplier must be ${expected}`);
    // Rebased 2026-09-18: the adopted T1 Mountain package authors attack 40.
    assert(archer.stats.hp === 240 && archer.stats.attack === 40, `${treatment}: only the multiplier may move`);
    overlay.restore();
    assert(JSON.stringify(archer) === baseline, `${treatment}: restore must return the authored species`);
  }
  const overlay = installDurability33Treatment(DURABILITY33_BLOCKS['mountain-entry'].cells[1]);
  try { throw new Error('simulated failure'); } catch { overlay.restore(); }
  assert(JSON.stringify(archer) === baseline, 'restore must survive a failed observation');
  for (const name of ['jungle-repair', 'jungle-breadth'] as const) {
    const jungle = installDurability33Treatment(DURABILITY33_BLOCKS[name].cells[0]);
    assert(jungle.changes.length === 0, `${name}: must not overlay any monster stat`);
    jungle.restore();
    assert(JSON.stringify(archer) === baseline, `${name}: must leave the archer untouched`);
  }
}

console.log('durability33Matrix: ok');
