/**
 * Boss3 structural qualification — the 24-fight two-arm shape, and the claim that
 * the arms differ in exactly ONE component.
 *
 * `boss3Cleanse.test.ts` is the functional half (does the substituted Guard act on
 * the effects these two bosses generate). This is the structural half: that the
 * screen is the size it declares, that its baseline arm reproduces Boss2 byte for
 * byte, and that the treatment arm departs from it only at the declared Guard slot.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss3Matrix.test.ts
 */
import {
  ITEM_DATABASE, NODE_BIOMES, RECIPE_DATABASE,
  runeBudgetForGlobalMastery, runicPointLoadoutCost,
} from '@mmo-idle/shared';
import {
  BOSS3_ARMS, BOSS3_BLOCKS, BOSS3_BLOCKS_DEF, BOSS3_CAP_MS,
  BOSS3_GUARD_IN, BOSS3_GUARD_OUT, BOSS3_GUARD_SLOT, BOSS3_TIER,
  assertBoss3Definitions, boss3ArmCells, installBoss3Treatment,
} from '../bench/balance/boss3Spec';
import { BOSS2_BLOCKS, BOSS2_BOSSES, BOSS2_SEED } from '../bench/balance/boss2Spec';
import { resolveSurveyPackage } from '../bench/balance/ttkSurveySpec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Fails loudly if the bosses, their riders, the Cleanse definition, the arms or the
// RP arithmetic have moved. This is the same function the preflight and the run call.
assertBoss3Definitions();

// ── Shape: two blocks, six roots, two arms, one seed = 24 planned observations. ────
{
  assert(BOSS3_BLOCKS_DEF.length === 2, `expected 2 blocks, got ${BOSS3_BLOCKS_DEF.length}`);
  assert(BOSS3_ARMS.length === 2, `expected 2 arms, got ${BOSS3_ARMS.length}`);
  let total = 0;
  for (const b of BOSS3_BLOCKS_DEF) {
    const block = BOSS3_BLOCKS[b.name]!;
    assert(block.cells.length === 12, `${b.name}: expected 12 cells, got ${block.cells.length}`);
    assert(block.durationMs === BOSS3_CAP_MS, `${b.name}: cap drift`);
    assert(block.pilotIds.length === 0, `${b.name}: Boss3 declares no pilot`);
    for (const arm of BOSS3_ARMS) {
      const cells = boss3ArmCells(b.name, arm.name);
      assert(cells.length === 6, `${b.name}/${arm.name}: expected 6 roots, got ${cells.length}`);
      assert(new Set(cells.map((c) => c.className)).size === 6,
        `${b.name}/${arm.name}: roots must be distinct`);
    }
    total += block.cells.length;
  }
  assert(total === 24, `the screen plans 24 observations, got ${total}`);
  // This is a bounded screen, not a cohort. Growing it silently is exactly how "one
  // counterplay test" turns into an unreviewed build search, so the size is asserted.
  assert(total <= 24, 'a bounded screen must stay at its declared size');
}

// ── The baseline arm IS the Boss2 reference, per boss and per root. ────────────────
//
// THE load-bearing claim. If the baseline arm differs from the Boss2 package in
// anything, the "repeated baseline" is not a reproducibility control and the paired
// comparison is measuring two changes at once.
{
  for (const b of BOSS3_BLOCKS_DEF) {
    const boss2Block = BOSS2_BOSSES.find((x) => x.bossId === b.bossId);
    assert(!!boss2Block, `${b.name}: ${b.bossId} was not screened by Boss2 — there is no baseline to reproduce`);
    const origin = BOSS2_BLOCKS[boss2Block.name]!.cells;
    for (const cell of boss3ArmCells(b.name, 'portable-reference')) {
      const src = origin.find((c) => c.className === cell.className);
      assert(!!src, `${cell.id}: no Boss2 origin for root ${cell.className}`);
      const mine = resolveSurveyPackage(cell), theirs = resolveSurveyPackage(src);
      assert(mine.stance === theirs.stance, `${cell.id}: stance drift from its Boss2 origin`);
      assert(JSON.stringify(mine.abilities) === JSON.stringify(theirs.abilities),
        `${cell.id}: ability drift from its Boss2 origin (order included)`);
      assert(JSON.stringify(mine.runeRules) === JSON.stringify(theirs.runeRules),
        `${cell.id}: rune-rule drift (order included) from its Boss2 origin`);
      assert(mine.upgradeLevel === theirs.upgradeLevel, `${cell.id}: upgrade-level drift`);
      assert(JSON.stringify(cell.build.gearItemIds) === JSON.stringify(src.build.gearItemIds),
        `${cell.id}: kit drift from its Boss2 origin`);
      assert(JSON.stringify(cell.build.skillPath) === JSON.stringify(src.build.skillPath),
        `${cell.id}: skill-path drift from its Boss2 origin`);
      assert(cell.nodeId === src.nodeId, `${cell.id}: node drift from its Boss2 origin`);
      assert(JSON.stringify(cell.targetTypes) === JSON.stringify(src.targetTypes),
        `${cell.id}: target drift from its Boss2 origin`);
    }
  }
  // And the seed is the ORIGINAL Boss2 seed, reused so the baseline revisits the known
  // failure rather than sampling a fresh one.
  for (const b of BOSS3_BLOCKS_DEF) {
    assert(b.seed === BOSS2_SEED,
      `${b.name}: seed ${b.seed} is not the Boss2 seed ${BOSS2_SEED} — the baseline is not a replay`);
  }
}

// ── The treatment arm departs at the declared Guard slot and NOWHERE else. ────────
{
  for (const b of BOSS3_BLOCKS_DEF) {
    const ref = boss3ArmCells(b.name, 'portable-reference');
    const sub = boss3ArmCells(b.name, 'cleanse-substitution');
    for (let i = 0; i < ref.length; i++) {
      const a = resolveSurveyPackage(ref[i]!), c = resolveSurveyPackage(sub[i]!);
      assert(ref[i]!.className === sub[i]!.className, `${b.name}: arms must pair root-for-root at index ${i}`);
      // Everything the package resolves EXCEPT the guard list.
      assert(a.stance === c.stance, `${b.name}/${ref[i]!.className}: stance differs between arms`);
      assert(a.upgradeLevel === c.upgradeLevel, `${b.name}/${ref[i]!.className}: upgrade level differs between arms`);
      assert(JSON.stringify(a.runeRules) === JSON.stringify(c.runeRules),
        `${b.name}/${ref[i]!.className}: rune rules differ between arms — no ability-specific rule may be added`);
      assert(JSON.stringify(a.abilities.techniques) === JSON.stringify(c.abilities.techniques),
        `${b.name}/${ref[i]!.className}: techniques differ between arms`);
      assert(JSON.stringify(ref[i]!.build.gearItemIds) === JSON.stringify(sub[i]!.build.gearItemIds),
        `${b.name}/${ref[i]!.className}: kit differs between arms`);
      assert(JSON.stringify(ref[i]!.build.skillPath) === JSON.stringify(sub[i]!.build.skillPath),
        `${b.name}/${ref[i]!.className}: skill path differs between arms`);
      // The guard list: same length, same members except the substituted slot, and the
      // ORDER preserved. Order is not cosmetic — guards are walked top-to-bottom and
      // the first eligible one claims the one-activation-per-window gate.
      const g0 = a.abilities.guards, g1 = c.abilities.guards;
      assert(g0.length === g1.length, `${b.name}/${ref[i]!.className}: the guard list changed length`);
      assert(g0[BOSS3_GUARD_SLOT] === BOSS3_GUARD_OUT,
        `${b.name}/${ref[i]!.className}: the baseline's slot ${BOSS3_GUARD_SLOT} is not ${BOSS3_GUARD_OUT}`);
      assert(g1[BOSS3_GUARD_SLOT] === BOSS3_GUARD_IN,
        `${b.name}/${ref[i]!.className}: the treatment's slot ${BOSS3_GUARD_SLOT} is not ${BOSS3_GUARD_IN}`);
      for (let g = 0; g < g0.length; g++) {
        if (g === BOSS3_GUARD_SLOT) continue;
        assert(g0[g] === g1[g], `${b.name}/${ref[i]!.className}: guard slot ${g} moved as well`);
      }
      assert(!g1.includes(BOSS3_GUARD_OUT), `${b.name}/${ref[i]!.className}: the treatment still carries ${BOSS3_GUARD_OUT}`);
      assert(!g0.includes(BOSS3_GUARD_IN), `${b.name}/${ref[i]!.className}: the baseline already carries ${BOSS3_GUARD_IN} — the contrast would be empty`);
    }
  }
}

// ── Treatments, targeting, tier legality, and the RP budget. ──────────────────────
{
  const budget = runeBudgetForGlobalMastery(72);
  for (const b of BOSS3_BLOCKS_DEF) {
    for (const cell of BOSS3_BLOCKS[b.name]!.cells) {
      assert(cell.nodeId === b.nodeId, `${cell.id}: node drift`);
      assert(cell.isDungeon === true, `${cell.id}: must target the dungeon encounter`);
      assert(JSON.stringify(cell.targetTypes) === JSON.stringify([b.bossId]), `${cell.id}: must target ${b.bossId}`);
      assert(cell.tier === BOSS3_TIER && cell.build.playerTier === BOSS3_TIER && cell.build.gearTier === BOSS3_TIER,
        `${cell.id}: tier drift`);
      assert(NODE_BIOMES[cell.nodeId]?.biomeTier === BOSS3_TIER, `${cell.id}: only T2 nodes belong in this screen`);
      // Neither arm may claim historical corroboration: Spirit's only historical clear
      // is against Apex Timberclaw, and a substituted package has no history at all.
      const treatments = BOSS3_ARMS.map((a) => a.treatment);
      assert(treatments.includes(cell.treatment!), `${cell.id}: unknown treatment ${cell.treatment}`);
      assert(!/corroborated/.test(cell.treatment!), `${cell.id}: no Boss3 row is a historical result`);
      for (const id of Object.values(cell.build.gearItemIds)) {
        const recipe = RECIPE_DATABASE.get(id!);
        assert(!!recipe && ITEM_DATABASE.has(id!), `${cell.id}: missing recipe/item ${id}`);
        assert(recipe.tier <= BOSS3_TIER, `${cell.id}: ${id} exceeds tier ${BOSS3_TIER}`);
      }
      const r = resolveSurveyPackage(cell);
      const cost = runicPointLoadoutCost({
        rules: r.runeRules as never, abilities: r.abilities,
        stances: r.stance ? [r.stance] : [], rites: [],
      });
      assert(cost <= budget, `${cell.id}: package costs ${cost} RP against a ${budget} budget`);
    }
  }
}

// ── The substitution FREES RP and never spends it, per root. ──────────────────────
//
// Freed RP is deliberately left UNSPENT. Spending it would add a second change to a
// one-change experiment, which is the difference between a substitution effect and an
// unreviewed build search.
{
  for (const b of BOSS3_BLOCKS_DEF) {
    const ref = boss3ArmCells(b.name, 'portable-reference');
    const sub = boss3ArmCells(b.name, 'cleanse-substitution');
    const cost = (cell: (typeof ref)[number]) => {
      const r = resolveSurveyPackage(cell);
      return runicPointLoadoutCost({
        rules: r.runeRules as never, abilities: r.abilities,
        stances: r.stance ? [r.stance] : [], rites: [],
      });
    };
    for (let i = 0; i < ref.length; i++) {
      const before = cost(ref[i]!), after = cost(sub[i]!);
      assert(after <= before,
        `${b.name}/${ref[i]!.className}: the substitution costs ${after} RP against ${before} — it may only free RP`);
      assert(before - after === 2,
        `${b.name}/${ref[i]!.className}: expected the substitution to free exactly 2 RP (${BOSS3_GUARD_OUT} 5 -> ${BOSS3_GUARD_IN} 3), got ${before - after}`);
    }
  }
}

// ── Scope fences the packet declares. ─────────────────────────────────────────────
{
  assert(installBoss3Treatment() === null, 'Boss3 installs nothing and changes no balance value');
  // Only the two Boss2 total-wipe bosses. A third boss here would make this a new
  // coverage screen rather than the bounded counterplay test it is authorized as.
  const ids = BOSS3_BLOCKS_DEF.map((b) => b.bossId).sort();
  assert(JSON.stringify(ids) === JSON.stringify(['chitinous-dreadbore', 'mire-gorged-behemoth']),
    `Boss3 screens exactly the two Boss2 total-wipe bosses; got ${JSON.stringify(ids)}`);
  // One seed per block; no stochastic replication grid.
  for (const b of BOSS3_BLOCKS_DEF) {
    assert(Number.isInteger(b.seed), `${b.name}: seed must be a declared integer`);
  }
  // Every block must have something for the treatment to remove, or it contrasts
  // nothing and must be omitted BEFORE freezing rather than run to a null result.
  for (const b of BOSS3_BLOCKS_DEF) {
    assert(b.cleanseTargets.length > 0, `${b.name}: no cleanseable effect — omit the block, do not run it`);
    assert(b.cleanseTargets.includes(b.expectedPrimaryTarget), `${b.name}: primary target not among the declared targets`);
  }
}

console.log('boss3Matrix: ok');
