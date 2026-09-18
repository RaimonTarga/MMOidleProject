import { ITEM_DATABASE, MONSTER_DATABASE, RECIPE_DATABASE, runeBudgetForGlobalMastery } from '@mmo-idle/shared';
import {
  BOSSREF_A_ABILITIES, BOSSREF_A_GEAR, BOSSREF_A_RULES, BOSSREF_A_STANCE,
  BOSSREF_B_GEAR, BOSSREF_B_RULES, BOSSREF_B_STANCE,
  BOSSREF_BLOCKS, BOSSREF_BOSS_ID, BOSSREF_BOSS_STATS, BOSSREF_CAP_MS,
  BOSSREF_CELLS, BOSSREF_NODE_ID, BOSSREF_SEEDS, BOSSREF_SKILL_PATH, BOSSREF_TIER,
  assertBossReferenceDefinitions, bossReferenceRpCost, installBossReferenceTreatment,
} from '../bench/balance/bossReferenceSpec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Fails loudly if the boss, dungeon, skill path, or either source package drifted.
assertBossReferenceDefinitions();

// ── Shape: exactly two cases, one seed, one boss. This is not a screen that grows.
{
  const b = BOSSREF_BLOCKS['reference']!;
  assert(b.cells.length === 2, `expected 2 cases, got ${b.cells.length}`);
  assert(BOSSREF_SEEDS.length === 1, `expected 1 declared seed, got ${BOSSREF_SEEDS.length}`);
  assert(b.cells.length * BOSSREF_SEEDS.length === 2, 'the check plans exactly 2 fights');
  assert(b.durationMs === BOSSREF_CAP_MS && BOSSREF_CAP_MS === 300000, 'cap must be 300 s');
  assert(new Set(b.cells.map((c) => c.id)).size === 2, 'duplicate cell id');
  // Qualification must verify setup WITHOUT fighting: no pilot cells at all.
  assert(b.pilotIds.length === 0, 'a pilot fight here would be an undeclared observation');
  assert(installBossReferenceTreatment() === null, 'the check installs nothing');
}

// ── Both cases are identical in everything except the package.
//
// Same boss, same node, same encounter initialization, same seed, same cap, same
// skill path, same upgrade level. If any of these diverge, the two cases stop being
// a controlled comparison and the result means nothing.
{
  const [a, b] = BOSSREF_CELLS as [typeof BOSSREF_CELLS[number], typeof BOSSREF_CELLS[number]];
  for (const c of [a, b]) {
    assert(c.nodeId === BOSSREF_NODE_ID, `${c.id}: node drift`);
    assert(c.isDungeon === true, `${c.id}: must target the dungeon encounter`);
    assert(c.tier === BOSSREF_TIER, `${c.id}: tier drift`);
    assert(c.targetTypes.includes(BOSSREF_BOSS_ID), `${c.id}: must name the boss`);
    assert(c.upgradeLevel === 5, `${c.id}: upgrade level must be equal across cases`);
    assert(JSON.stringify(c.build.skillPath) === JSON.stringify([...BOSSREF_SKILL_PATH]),
      `${c.id}: both cases must run the recovered V1i skill path`);
    assert(c.build.classRoot === 'energy-root', `${c.id}: class root drift`);
  }
  assert(a.treatment !== b.treatment, 'the two cases must declare distinct arms');
  assert(a.treatment === 'historical-success' && b.treatment === 'legacy-benchmark',
    'arm labels drifted');
}

// ── Case A is the complete historical package, not a partial one.
{
  const a = BOSSREF_CELLS[0]!;
  assert(JSON.stringify(a.build.gearItemIds) === JSON.stringify({ ...BOSSREF_A_GEAR }),
    'Case A gear drift');
  assert(a.stance === BOSSREF_A_STANCE && a.stance === 'defensive-stance', 'Case A stance drift');
  assert(JSON.stringify(a.abilities) === JSON.stringify(BOSSREF_A_ABILITIES), 'Case A ability drift');
  assert(a.abilities!.techniques.includes('expose-weakness'), 'Case A must carry Expose Weakness');
  assert(a.abilities!.guards.includes('second-wind') && a.abilities!.guards.includes('brace'),
    'Case A must carry Second Wind and Brace');
  assert(a.runeRules!.length === 5, `Case A must carry 5 rune rules, got ${a.runeRules!.length}`);
  // Step Back must precede the orbit rule: movement-channel arbitration is
  // top-to-bottom, so a lower Step Back never fires.
  const stepBack = a.runeRules!.findIndex((r) => r.actionId === 'step-back');
  const orbit = a.runeRules!.findIndex((r) => r.actionId === 'orbit');
  assert(stepBack >= 0 && orbit > stepBack, 'Step Back must be ordered before orbit');
  assert(JSON.stringify(a.runeRules) === JSON.stringify(BOSSREF_A_RULES), 'Case A rule drift');
}

// ── Case B is the complete legacy package, including its absence of rules.
{
  const b = BOSSREF_CELLS[1]!;
  assert(JSON.stringify(b.build.gearItemIds) === JSON.stringify({ ...BOSSREF_B_GEAR }),
    'Case B gear drift');
  assert(b.build.gearItemIds.weapon === 'gale-needle',
    'Case B must carry the weapon the legacy scorer actually picks');
  assert(b.stance === BOSSREF_B_STANCE && b.stance === 'offensive-stance', 'Case B stance drift');
  assert(Array.isArray(b.runeRules) && b.runeRules.length === 0,
    'Case B must equip NO rune rules — that is the legacy package, not an omission');
  assert(JSON.stringify(BOSSREF_B_RULES) === '[]', 'the legacy rule set must stay empty');
  assert(b.abilities!.techniques.length + b.abilities!.guards.length === 6,
    'Case B must carry the full canonical round-robin ability set');
  assert(!b.abilities!.guards.includes('second-wind') && !b.abilities!.guards.includes('brace'),
    'Case B is expected to carry neither Second Wind nor Brace');
}

// ── RP: both packages must be legal on the same budget, and never hybridised.
//
// This is the guard the work order asked for. Rules, abilities and the stance all
// draw on one budget. Lifting a component out of one package and into the other
// produces an over-budget loadout, and the fix must never be to change some other
// input until it fits.
{
  const budget = runeBudgetForGlobalMastery(72);
  const [a, b] = BOSSREF_CELLS as [typeof BOSSREF_CELLS[number], typeof BOSSREF_CELLS[number]];
  const aCost = bossReferenceRpCost(a), bCost = bossReferenceRpCost(b);
  assert(aCost <= budget, `Case A costs ${aCost} RP against ${budget}`);
  assert(bCost <= budget, `Case B costs ${bCost} RP against ${budget}`);
  assert(bCost === budget, `Case B is expected to spend the whole budget, got ${bCost}/${budget}`);

  // The hybrid the work order explicitly warned about: Case B's abilities and
  // stance with Case A's rules on top. It must NOT fit.
  const hybrid = bossReferenceRpCost({
    ...b, runeRules: [...BOSSREF_A_RULES],
  } as typeof b);
  assert(hybrid > budget,
    `the ability-swap hybrid must be illegal, but costs ${hybrid} against ${budget}`);
}

// ── The boss itself, pinned. It summons nothing, so there is no escort question.
{
  const boss = MONSTER_DATABASE.get(BOSSREF_BOSS_ID)!;
  assert(boss.isBoss === true, 'target must be a boss');
  assert(boss.stats.hp === BOSSREF_BOSS_STATS.hp, 'boss hp drift');
  assert(boss.stats.attack === BOSSREF_BOSS_STATS.attack, 'boss attack drift');
}

// ── No future gear in either case.
{
  for (const c of BOSSREF_CELLS) {
    for (const itemId of Object.values(c.build.gearItemIds)) {
      if (!itemId) continue;
      const recipe = RECIPE_DATABASE.get(itemId);
      assert(!!recipe && ITEM_DATABASE.has(itemId), `${c.id}: missing recipe/item ${itemId}`);
      assert(recipe.tier <= BOSSREF_TIER, `${c.id}: future item ${itemId} (tier ${recipe.tier})`);
    }
  }
}

console.log('bossReferenceMatrix: ok');
