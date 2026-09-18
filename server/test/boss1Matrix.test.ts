import { MONSTER_DATABASE, NODE_BIOMES, RECIPE_DATABASE, ITEM_DATABASE } from '@mmo-idle/shared';
import {
  BOSS1_BLOCKS,
  BOSS1_BOSS_ID,
  BOSS1_BOSS_STATS,
  BOSS1_CAP_MS,
  BOSS1_CELLS,
  BOSS1_ESCORTS,
  BOSS1_NODE_ID,
  BOSS1_SEEDS,
  BOSS1_TIER,
  assertBoss1Definitions,
  installBoss1Treatment,
} from '../bench/balance/boss1Spec';
import { NIGHT5_BLOCKS } from '../bench/balance/night5Spec';
import { SURVEY_CLASSES } from '../bench/balance/ttkSurveySpec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Fails loudly if the boss, the dungeon, the escorts or the cells have drifted.
assertBoss1Definitions();

// ── Shape: one block, six roots, two seeds = 12 planned observations.
{
  const b = BOSS1_BLOCKS['sovereign']!;
  assert(b.cells.length === 6, `expected 6 cells, got ${b.cells.length}`);
  assert(BOSS1_SEEDS.length === 2, `expected 2 seeds, got ${BOSS1_SEEDS.length}`);
  assert(b.cells.length * BOSS1_SEEDS.length === 12, 'the screen plans 12 observations');
  assert(new Set(b.cells.map((c) => c.id)).size === b.cells.length, 'duplicate cell id');
  assert(b.durationMs === BOSS1_CAP_MS, 'block duration must be the resolved per-boss cap');
  assert(b.pilotIds.length > 0 && b.pilotIds.every((id) => b.cells.some((c) => c.id === id)),
    'pilot ids must name real cells');
  // This is a SCREEN. Growing it silently is how a 12-attempt probe becomes an
  // unreviewed cohort, so the size is asserted rather than merely documented.
  assert(b.cells.length * BOSS1_SEEDS.length <= 24, 'a screen must stay small');
}

// ── The screen installs nothing: the boss and its escorts are authored source.
{
  assert(installBoss1Treatment() === null, 'Boss1 must install no overlay');
  for (const c of BOSS1_CELLS) {
    assert(c.treatment === 'boss-baseline', `${c.id}: every cell must declare its arm`);
  }
}

// ── Every cell targets the real dungeon encounter, not an ordinary node.
//
// This is the load-bearing one. `--mode boss` measured guards for its entire
// history because it fought whatever stood in an idle dungeon node; a cell that
// forgets `isDungeon` would quietly reintroduce exactly that class of error.
{
  for (const c of BOSS1_CELLS) {
    assert(c.nodeId === BOSS1_NODE_ID, `${c.id}: must fight the dungeon node`);
    assert(c.isDungeon === true, `${c.id}: must declare a dungeon target`);
    assert(NODE_BIOMES[c.nodeId]?.isDungeon === true, `${c.id}: node is not a dungeon`);
    assert(c.targetTypes.includes(BOSS1_BOSS_ID), `${c.id}: must name the boss as its target`);
  }
}

// ── Six distinct roots, each at tier-legal preparation.
//
// The builds are reused verbatim from the QUALIFIED Durability37 T4 ladder, so a
// boss row is readable against the ordinary Graveyard T4 family that shares its
// escorts. Anything richer than that ladder would be over-equipping the bot.
{
  const roots = BOSS1_CELLS.map((c) => c.className).sort();
  const expected = SURVEY_CLASSES.map((c) => c.name).sort();
  assert(JSON.stringify(roots) === JSON.stringify(expected),
    `all six roots exactly once, got ${JSON.stringify(roots)}`);

  const source = NIGHT5_BLOCKS.t4a!.cells.filter(
    (c) => c.role === 'graveyard' && c.nodeId === 'node-t4-graveyard-03');
  assert(source.length === 6, `expected 6 qualified source cells, got ${source.length}`);

  for (const cell of BOSS1_CELLS) {
    const origin = source.find((c) => c.className === cell.className);
    assert(!!origin, `${cell.id}: no qualified T4 build to inherit from`);
    assert(JSON.stringify(cell.build.skillPath) === JSON.stringify(origin.build.skillPath),
      `${cell.id}: skill path drifted from the qualified T4 build`);
    assert(JSON.stringify(cell.build.gearItemIds) === JSON.stringify(origin.build.gearItemIds),
      `${cell.id}: gear drifted from the qualified T4 build`);
    assert(cell.build.playerTier === BOSS1_TIER && cell.build.gearTier === BOSS1_TIER
      && cell.build.contentTier === BOSS1_TIER, `${cell.id}: build tier drift`);
    assert(cell.tier === BOSS1_TIER, `${cell.id}: cell tier drift`);
    assert(cell.id !== origin.id && cell.id.startsWith('boss1-'),
      `${cell.id}: the screen needs its own cell identity`);

    // No future gear. The screen reports a boss as access-blocked rather than
    // quietly equipping something the character could not own at this point.
    for (const itemId of Object.values(cell.build.gearItemIds)) {
      if (!itemId) continue;
      const recipe = RECIPE_DATABASE.get(itemId);
      assert(!!recipe && ITEM_DATABASE.has(itemId), `${cell.id}: missing recipe/item ${itemId}`);
      assert(recipe.tier <= BOSS1_TIER, `${cell.id}: future item ${itemId} (tier ${recipe.tier})`);
    }
  }
}

// ── The escort receipt question the screen exists to answer.
//
// The Sovereign summons three ordinary species the mob adoption changed. If these
// drift from the adopted values, a boss row can no longer be read against the
// Durability37 Block I Graveyard family, and the run is invalid rather than
// reinterpreted.
{
  const script = (MONSTER_DATABASE.get(BOSS1_BOSS_ID) as {
    bossScript?: { phases?: { hpPct?: number; actions?: { type: string; monsterTypeId?: string }[] }[] };
  }).bossScript;
  assert(!!script?.phases?.length, 'the boss must still have a script with phases');

  const summoned = new Set<string>();
  for (const phase of script.phases) {
    for (const action of phase.actions ?? []) {
      if (action.type === 'spawn-adds' && action.monsterTypeId) summoned.add(action.monsterTypeId);
    }
  }
  assert(JSON.stringify([...summoned].sort()) === JSON.stringify(Object.keys(BOSS1_ESCORTS).sort()),
    `declared escorts must be exactly what the script spawns, got ${JSON.stringify([...summoned].sort())}`);

  for (const [id, expected] of Object.entries(BOSS1_ESCORTS)) {
    const m = MONSTER_DATABASE.get(id)!;
    assert(m.stats.hp === expected.hp, `${id}: hp ${m.stats.hp} != adopted ${expected.hp}`);
    assert(m.stats.attack === expected.attack, `${id}: attack drift`);
  }

  // The 50% phase is what makes the cap load-bearing: the screen must be able to
  // reach Mass Resurrection, or it measures a truncated fight.
  const halfPhase = script.phases.find((p) => p.hpPct === 0.5);
  assert(!!halfPhase, 'the 50% phase must exist, or the resolved cap is meaningless');
}

// ── The boss's own block, pinned.
{
  const boss = MONSTER_DATABASE.get(BOSS1_BOSS_ID)!;
  assert(boss.isBoss === true, 'target must be a boss');
  assert(boss.stats.hp === BOSS1_BOSS_STATS.hp, 'boss hp drift');
  assert(boss.stats.attack === BOSS1_BOSS_STATS.attack, 'boss attack drift');
  // 600 s against a 19,499 pool that measured 36-104 s full kills in preparation.
  assert(BOSS1_CAP_MS >= 600000, 'the cap must comfortably exceed the full phase cycle');
}

console.log('boss1Matrix: ok');
