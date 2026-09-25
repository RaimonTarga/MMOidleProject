import { MONSTER_DATABASE, NODE_BIOMES, ABILITY_DATABASE, biomeLevelCap, listBiomeGroupsAtTier,
  globalMastery, runeBudgetForGlobalMastery, runicPointBreakdown, referenceAbilityRule } from '@mmo-idle/shared';
import {
  DURABILITY34_BLOCKS,
  DURABILITY34_GUARD_ARMS,
  DURABILITY34_JUNGLE_HP,
  DURABILITY34_JUNGLE_SEEDS,
  DURABILITY34_MOUNTAIN_SEEDS,
  assertDurability34Definitions,
  installDurability34Treatment,
} from '../bench/balance/durability34Spec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assertDurability34Definitions();

// ── Shape: two independent blocks, 108 planned observations.
{
  const expected = [['jungle-durability', 24], ['mountain-guard', 12]] as const;
  let observations = 0;
  for (const [name, cells] of expected) {
    const block = DURABILITY34_BLOCKS[name];
    assert(!!block, `missing block ${name}`);
    assert(block.cells.length === cells, `${name}: expected ${cells} cells, got ${block.cells.length}`);
    assert(block.durationMs === 300_000, `${name}: window drift`);
    assert(new Set(block.cells.map((c) => c.id)).size === block.cells.length, `${name}: duplicate cell id`);
    assert(block.pilotIds.length > 0, `${name}: needs a pilot`);
    observations += block.cells.length * 3;
  }
  assert(observations === 108, `planned observation count drifted: ${observations}`);
  assert(DURABILITY34_JUNGLE_SEEDS.every((s) => !DURABILITY34_MOUNTAIN_SEEDS.includes(s as never)),
    'the two blocks declare distinct seeds');
}

// ── Block J: HP-only, on the durable roles only, matched pairs otherwise.
{
  const block = DURABILITY34_BLOCKS['jungle-durability'];
  const control = block.cells.filter((c) => c.treatment === 'control');
  const candidate = block.cells.filter((c) => c.treatment === 'candidate');
  assert(control.length === 12 && candidate.length === 12, 'six roots x two nodes per arm');
  for (const c of control) {
    const pair = candidate.find((x) => x.className === c.className && x.nodeId === c.nodeId);
    assert(!!pair, `${c.className}@${c.nodeId} has no candidate pair`);
    assert(JSON.stringify(pair.build.gearItemIds) === JSON.stringify(c.build.gearItemIds), 'paired gear must match');
    assert(JSON.stringify(pair.build.skillPath) === JSON.stringify(c.build.skillPath), 'paired skill path must match');
    assert(JSON.stringify(pair.guards ?? null) === JSON.stringify(c.guards ?? null), 'paired guards must match');
  }
  const nodes = [...new Set(block.cells.map((c) => c.nodeId))].sort();
  assert(nodes.join(',') === 'node-t4-jungle-03,node-t4-jungle-05', `node drift: ${nodes.join(',')}`);

  // REBASED 2026-09-18. Durability34's 2900/3400 candidate was SUPERSEDED before it
  // ever reached source: Durability36 Block J measured the primary lineage's
  // duration FALLING across tiers, and the adopted correction is the coarser
  // role-based ladder (silverback 3200, apex-silverback 10000, constrictor 12000).
  // The overlay is retired to [adopted, adopted], so what this block now checks is
  // that it is inert and that the adopted ladder is live.
  assert(MONSTER_DATABASE.get('silverback')!.stats.hp === 3200, 'T3 anchor');
  for (const [type, [before, after]] of Object.entries(DURABILITY34_JUNGLE_HP)) {
    assert(before === after, `${type}: the retired overlay must no longer move anything`);
    assert(MONSTER_DATABASE.get(type)!.stats.hp === after, `${type} live value`);
    assert(after > 3200, `${type}: the durable T4 roles must clear the T3 anchor`);
  }
}

// ── Block M: a SUBSTITUTION, cheaper than the reference, with nothing else moved.
{
  const block = DURABILITY34_BLOCKS['mountain-guard'];
  const reference = block.cells.filter((c) => c.treatment === 'reference');
  const substitution = block.cells.filter((c) => c.treatment === 'substitution');
  assert(reference.length === 6 && substitution.length === 6, 'six roots per arm');
  for (const r of reference) {
    const s = substitution.find((x) => x.className === r.className)!;
    assert(!!s, `${r.className} has no substitution pair`);
    assert(s.nodeId === r.nodeId && s.upgradeLevel === r.upgradeLevel, 'pairs share node and upgrades');
    assert(JSON.stringify(s.build.gearItemIds) === JSON.stringify(r.build.gearItemIds), 'pairs share gear');
    assert(JSON.stringify(r.guards) === JSON.stringify(DURABILITY34_GUARD_ARMS.reference), 'reference guards');
    assert(JSON.stringify(s.guards) === JSON.stringify(DURABILITY34_GUARD_ARMS.substitution), 'substitution guards');
    assert(!s.guards!.includes('second-wind'), 'Brace REPLACES Second Wind, it is not added alongside it');
  }
  // Power Shot is held at 2.2 in both arms: this packet is not another scalar grid.
  assert(MONSTER_DATABASE.get('ridge-archer')!.chargedAttack!.multiplier === 2.2, 'Power Shot stays at 2.2');
  for (const cell of block.cells) {
    assert(cell.tier === 1 && NODE_BIOMES[cell.nodeId]?.biomeGroup === 'mountain', 'T1 Mountain');
    assert(cell.targetTypes.includes('ridge-archer'), 'archer exposure required');
  }

  // The substitution must be legal AND cheaper for every root, melee and ranged.
  const levels: Record<string, number> = {};
  for (const g of listBiomeGroupsAtTier(1)) levels[g] = biomeLevelCap(1, g);
  const budget = runeBudgetForGlobalMastery(globalMastery(levels));
  assert(budget === 22, `T1 budget drift: ${budget}`);
  const melee = [
    { conditionId: 'always', actionId: 'auto-path-enemy' },
    { conditionId: 'inside-telegraph', actionId: 'step-back' },
    { conditionId: 'always', actionId: 'avoid-hazards' },
    { conditionId: 'always', actionId: 'wait-for-regen' },
  ];
  const ranged = [melee[0], melee[1], { conditionId: 'in-combat', actionId: 'orbit' }, melee[2], melee[3]];
  for (const [label, rules] of [['melee', melee], ['ranged', ranged]] as const) {
    const ref = runicPointBreakdown({ rules, abilities: { techniques: ['sweep'], guards: ['second-wind'] }, stances: [], rites: [] });
    const sub = runicPointBreakdown({ rules, abilities: { techniques: ['sweep'], guards: ['brace'] }, stances: [], rites: [] });
    assert(ref.total <= budget, `${label}: the reference arm must be legal (${ref.total})`);
    assert(sub.total <= budget, `${label}: the substitution must be legal (${sub.total})`);
    assert(sub.total < ref.total, `${label}: substituting Brace is cheaper, not an added cost`);
  }
  // Neither guard reacts to a cast by default; both fire in combat off cooldown.
  // The packet's framing depends on that staying true.
  assert(referenceAbilityRule('brace')?.conditionId === 'in-combat', 'Brace is not a cast response by default');
  assert(referenceAbilityRule('second-wind')?.conditionId === 'in-combat', 'Second Wind is not a cast response by default');
}

// ── Overlay: HP only, restored on every path; Block M overlays nothing.
{
  const snapshot = () => JSON.stringify([...MONSTER_DATABASE.entries()].map(([k, v]) => [k, v.stats.hp, v.stats.attack]));
  const baseline = snapshot();
  const block = DURABILITY34_BLOCKS['jungle-durability'];

  const control = installDurability34Treatment(block.cells.find((c) => c.treatment === 'control')!);
  assert(control.changes.length === 0, 'the control arm overlays nothing');
  control.restore();
  assert(snapshot() === baseline, 'control restore');

  const candidate = installDurability34Treatment(block.cells.find((c) => c.treatment === 'candidate')!);
  assert(candidate.changes.length === 2, 'exactly the two durable roles are reported');
  // The adopted ladder, not the superseded candidate.
  assert(MONSTER_DATABASE.get('apex-silverback')!.stats.hp === 10_000, 'apex carries the adopted HP');
  assert(MONSTER_DATABASE.get('emerald-constrictor')!.stats.hp === 12_000, 'constrictor carries the adopted HP');
  // The fast bodies are no longer untouched -- the adopted ladder raises them too,
  // far less than the durable roles, which is the point of a role-based correction.
  assert(MONSTER_DATABASE.get('hunting-panther')!.stats.hp === 2400, 'fast body raised far less');
  assert(MONSTER_DATABASE.get('thornback-lizard')!.stats.hp === 2500, 'fast body raised far less');
  assert(candidate.changes.every((c) => c.beforeAttack === c.afterAttack), 'HP-only: no attack may move');
  candidate.restore();
  assert(snapshot() === baseline, 'candidate restore');

  const thrown = installDurability34Treatment(block.cells.find((c) => c.treatment === 'candidate')!);
  try { throw new Error('simulated failure'); } catch { thrown.restore(); }
  assert(snapshot() === baseline, 'restore must survive a failed observation');

  const mountain = installDurability34Treatment(DURABILITY34_BLOCKS['mountain-guard'].cells[0]);
  assert(mountain.changes.length === 0, 'Block M overlays no monster stat; its treatment is the loadout');
  mountain.restore();
  assert(snapshot() === baseline, 'mountain restore');
}

console.log('durability34Matrix: ok');
