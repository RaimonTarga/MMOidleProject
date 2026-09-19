import { ITEM_DATABASE, NODE_BIOMES, RECIPE_DATABASE, runeBudgetForGlobalMastery, runicPointLoadoutCost } from '@mmo-idle/shared';
import {
  BOSS2_BLOCKS, BOSS2_BOSSES, BOSS2_CAP_MS, BOSS2_SEED,
  assertBoss2Definitions, installBoss2Treatment,
} from '../bench/balance/boss2Spec';
import { BOSS1_BLOCKS, BOSS1_TIMBERCLAW_BOSS_ID } from '../bench/balance/boss1Spec';
import { resolveSurveyPackage } from '../bench/balance/ttkSurveySpec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Fails loudly if the live T2 roster, the bosses, their escorts or the packages moved.
assertBoss2Definitions();

// -- Shape: six bosses, six roots, one seed = 36 planned observations.
{
  assert(BOSS2_BOSSES.length === 6, `expected 6 bosses, got ${BOSS2_BOSSES.length}`);
  let total = 0;
  for (const b of BOSS2_BOSSES) {
    const block = BOSS2_BLOCKS[b.name]!;
    assert(block.cells.length === 6, `${b.name}: expected 6 roots, got ${block.cells.length}`);
    assert(new Set(block.cells.map((c) => c.className)).size === 6, `${b.name}: roots must be distinct`);
    assert(block.durationMs === BOSS2_CAP_MS, `${b.name}: cap drift`);
    assert(block.pilotIds.length === 0, `${b.name}: Boss2 declares no pilot`);
    total += block.cells.length;
  }
  assert(total === 36, `the screen plans 36 observations, got ${total}`);
  // This is a SCREEN. Growing it silently is how a coverage map becomes an
  // unreviewed cohort, so the size is asserted rather than merely documented.
  assert(total <= 36, 'a screen must stay at its declared size');
}

// -- The packages are Boss1's Timberclaw references, unchanged.
//
// THE load-bearing claim of this screen. If a package differs, a Boss2 row is not
// comparable to its Timberclaw row and the carried-forward Boss1 observations are
// not the same-build comparison they are presented as.
{
  const tc = BOSS1_BLOCKS['timberclaw']!.cells;
  for (const b of BOSS2_BOSSES) {
    for (const cell of BOSS2_BLOCKS[b.name]!.cells) {
      const origin = tc.find((c) => c.className === cell.className)!;
      assert(!!origin, `${cell.id}: no Boss1 origin for root ${cell.className}`);
      const mine = resolveSurveyPackage(cell), theirs = resolveSurveyPackage(origin);
      assert(mine.stance === theirs.stance, `${cell.id}: stance drift from its Boss1 origin`);
      assert(JSON.stringify(mine.abilities) === JSON.stringify(theirs.abilities),
        `${cell.id}: ability drift from its Boss1 origin`);
      assert(JSON.stringify(mine.runeRules) === JSON.stringify(theirs.runeRules),
        `${cell.id}: rune-rule drift (order included) from its Boss1 origin`);
      assert(mine.upgradeLevel === theirs.upgradeLevel, `${cell.id}: upgrade-level drift`);
      assert(JSON.stringify(cell.build.gearItemIds) === JSON.stringify(origin.build.gearItemIds),
        `${cell.id}: kit drift from its Boss1 origin`);
      assert(JSON.stringify(cell.build.skillPath) === JSON.stringify(origin.build.skillPath),
        `${cell.id}: skill-path drift from its Boss1 origin`);
    }
  }
}

// -- No Boss2 row may claim historical corroboration.
//
// Spirit's package is the only one with a historical clear, and that clear is
// against Apex Timberclaw. It corroborates nothing on a different boss.
{
  for (const b of BOSS2_BOSSES) {
    for (const cell of BOSS2_BLOCKS[b.name]!.cells) {
      assert(cell.treatment === 'reference-portable',
        `${cell.id}: every Boss2 cell is a portable reference, got ${cell.treatment}`);
    }
  }
}

// -- Targeting, tier legality and RP budget.
{
  for (const b of BOSS2_BOSSES) {
    for (const cell of BOSS2_BLOCKS[b.name]!.cells) {
      assert(cell.nodeId === b.nodeId, `${cell.id}: node drift`);
      assert(cell.isDungeon === true, `${cell.id}: must target the dungeon encounter`);
      assert(JSON.stringify(cell.targetTypes) === JSON.stringify([b.bossId]),
        `${cell.id}: must target ${b.bossId}`);
      assert(cell.tier === 2 && cell.build.playerTier === 2 && cell.build.gearTier === 2,
        `${cell.id}: tier drift`);
      for (const id of Object.values(cell.build.gearItemIds)) {
        const recipe = RECIPE_DATABASE.get(id!);
        assert(!!recipe && ITEM_DATABASE.has(id!), `${cell.id}: missing recipe/item ${id}`);
        assert(recipe.tier <= 2, `${cell.id}: ${id} exceeds tier 2`);
      }
      const r = resolveSurveyPackage(cell);
      const cost = runicPointLoadoutCost({
        rules: r.runeRules as never, abilities: r.abilities,
        stances: r.stance ? [r.stance] : [], rites: [],
      });
      assert(cost <= runeBudgetForGlobalMastery(72),
        `${cell.id}: package costs ${cost} RP against a 30 budget`);
    }
  }
}

// -- Scope fences the packet declares.
{
  // No T3 content and no Jungle T3 node may enter the screen. The Jungle exception
  // stays separate and is not reopened here; the T2 jungle DUNGEON is in scope and
  // the T3 node is not, so this asserts the tier, not the biome.
  for (const b of BOSS2_BOSSES) {
    for (const cell of BOSS2_BLOCKS[b.name]!.cells) {
      assert(NODE_BIOMES[cell.nodeId]?.biomeTier === 2, `${cell.id}: only T2 nodes belong in this screen`);
    }
  }
  // Timberclaw is NOT re-run: its rows are carried forward from Boss1.
  const ids = BOSS2_BOSSES.map((b) => b.bossId);
  assert(!ids.includes(BOSS1_TIMBERCLAW_BOSS_ID), 'Apex Timberclaw is carried forward, never re-run');
  assert(installBoss2Treatment() === null, 'Boss2 installs nothing');
  assert(BOSS2_SEED === 98011, 'the declared seed is frozen');
}

// -- Per-boss add accounting. Getting this wrong fails a summoning boss or disarms
//    the guard that caught replacement guardians leaking into the add count.
{
  const summoners = BOSS2_BOSSES.filter((b) => !b.summonsNothing).map((b) => b.bossId);
  assert(JSON.stringify(summoners) === JSON.stringify(['gorging-razortusk']),
    `exactly one T2 boss summons; got ${JSON.stringify(summoners)}`);
  const razortusk = BOSS2_BOSSES.find((b) => b.bossId === 'gorging-razortusk')!;
  assert(Object.keys(razortusk.escorts).sort().join(',') === 'boar,plains-slime',
    'the Razortusk declares both spawned species, including the ones nested inside its cast');
  for (const b of BOSS2_BOSSES) {
    if (b.summonsNothing) assert(Object.keys(b.escorts).length === 0, `${b.name}: a non-summoner declares no escorts`);
  }
}

console.log('boss2Matrix: ok');
