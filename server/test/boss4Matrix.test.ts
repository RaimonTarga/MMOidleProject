/**
 * Boss4 structural qualification — the 24-fight two-arm shape, and the claim that
 * the arms of a block differ in exactly ONE authored boss field and nothing else.
 *
 * `boss4Pressure.test.ts` is the functional half (does the treated field actually
 * change the damage the fight resolves, and is it restored afterwards). This is the
 * structural half: that the screen is the size it declares, that each block's player
 * package is byte-for-byte the Boss3 arm it carries, and that the two arms of a block
 * are the same package twice.
 *
 * WHY THAT INVERSION MATTERS. Boss3 varied the package against a fixed boss, so its
 * matrix test excused the guard list from the arm comparison. Boss4 varies the boss,
 * so nothing about the player is excused here — including the guard list.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss4Matrix.test.ts
 */
import {
  ITEM_DATABASE, MONSTER_DATABASE, NODE_BIOMES, RECIPE_DATABASE,
  runeBudgetForGlobalMastery, runicPointLoadoutCost,
} from '@mmo-idle/shared';
import {
  BOSS4_BLOCKS, BOSS4_BLOCKS_DEF, BOSS4_CAP_MS, BOSS4_SEED, BOSS4_TIER,
  assertBoss4Definitions, boss4ArmCells, boss4CellFingerprint, installBoss4Treatment,
} from '../bench/balance/boss4Spec';
import { BOSS3_BLOCKS_DEF, boss3ArmCells } from '../bench/balance/boss3Spec';
import { BOSS2_SEED } from '../bench/balance/boss2Spec';
import { resolveSurveyPackage } from '../bench/balance/ttkSurveySpec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Fails loudly if either boss, either candidate field, or any of the fields this
// screen promises to hold fixed has moved. The same function the preflight and the
// run call.
assertBoss4Definitions();

// ── Shape: two blocks, six roots, two arms, one seed = 24 planned observations. ────
{
  assert(BOSS4_BLOCKS_DEF.length === 2, `expected 2 blocks, got ${BOSS4_BLOCKS_DEF.length}`);
  let total = 0;
  for (const b of BOSS4_BLOCKS_DEF) {
    const block = BOSS4_BLOCKS[b.name]!;
    assert(b.arms.length === 2, `${b.name}: expected 2 arms, got ${b.arms.length}`);
    assert(block.cells.length === 12, `${b.name}: expected 12 cells, got ${block.cells.length}`);
    assert(block.durationMs === BOSS4_CAP_MS, `${b.name}: cap drift`);
    assert(block.pilotIds.length === 0, `${b.name}: Boss4 declares no pilot`);
    for (const arm of b.arms) {
      const cells = boss4ArmCells(b.name, arm.name);
      assert(cells.length === 6, `${b.name}/${arm.name}: expected 6 roots, got ${cells.length}`);
      assert(new Set(cells.map((c) => c.className)).size === 6,
        `${b.name}/${arm.name}: roots must be distinct`);
    }
    total += block.cells.length;
  }
  assert(total === 24, `the screen plans 24 observations, got ${total}`);
  // A bounded checkpoint, not a cohort. Growing it silently is how "one pressure
  // candidate" turns into an unreviewed scalar search, so the size is asserted.
  assert(total <= 24, 'a bounded screen must stay at its declared size');
}

// ── Each block's player package IS the Boss3 arm it carries, per root. ────────────
//
// THE load-bearing claim. If a block's package differs from its Boss3 origin in
// anything, the control arm is not a replay and the "current ↔ Boss3" comparison the
// packet requires cannot be made. Swamp carries `cleanse-substitution`; Cave carries
// `portable-reference`. Crossing those would silently fold Boss3's guard substitution
// into what is supposed to be an isolated boss-stat effect.
{
  const origins: Record<string, string> = {
    'swamp-pressure': 'swamp-response',
    'cave-pressure': 'cave-response',
  };
  for (const b of BOSS4_BLOCKS_DEF) {
    const originBlock = origins[b.name]!;
    const boss3 = BOSS3_BLOCKS_DEF.find((x) => x.name === originBlock);
    assert(!!boss3, `${b.name}: no Boss3 block named ${originBlock}`);
    assert(boss3.bossId === b.bossId, `${b.name}: the origin block fights a different boss`);
    const origin = boss3ArmCells(originBlock, b.originArm);
    for (const arm of b.arms) {
      for (const cell of boss4ArmCells(b.name, arm.name)) {
        const src = origin.find((c) => c.className === cell.className);
        assert(!!src, `${cell.id}: no Boss3 ${b.originArm} origin for root ${cell.className}`);
        const mine = resolveSurveyPackage(cell), theirs = resolveSurveyPackage(src);
        assert(mine.stance === theirs.stance, `${cell.id}: stance drift from its Boss3 origin`);
        assert(JSON.stringify(mine.abilities) === JSON.stringify(theirs.abilities),
          `${cell.id}: ability drift from its Boss3 origin (guard ORDER included)`);
        assert(JSON.stringify(mine.runeRules) === JSON.stringify(theirs.runeRules),
          `${cell.id}: rune-rule drift (order included) from its Boss3 origin`);
        assert(mine.upgradeLevel === theirs.upgradeLevel, `${cell.id}: upgrade-level drift`);
        assert(JSON.stringify(cell.build.gearItemIds) === JSON.stringify(src.build.gearItemIds),
          `${cell.id}: kit drift from its Boss3 origin`);
        assert(JSON.stringify(cell.build.skillPath) === JSON.stringify(src.build.skillPath),
          `${cell.id}: skill-path drift from its Boss3 origin`);
        assert(cell.nodeId === src.nodeId, `${cell.id}: node drift from its Boss3 origin`);
        assert(JSON.stringify(cell.targetTypes) === JSON.stringify(src.targetTypes),
          `${cell.id}: target drift from its Boss3 origin`);
      }
    }
    // And the seed is the ORIGINAL Boss2 seed, carried through Boss3, so the control
    // revisits the known case rather than sampling a fresh one.
    assert(b.seed === BOSS4_SEED && b.seed === BOSS2_SEED,
      `${b.name}: seed ${b.seed} is not the carried seed ${BOSS2_SEED} — the control is not a replay`);
  }
  // The two blocks must carry DIFFERENT Boss3 arms. Swamp's substitution responded
  // and Cave's did not, so each block replays the reference that is sensible for its
  // own matchup — and a copy-paste that gave both the same arm would be wrong.
  assert(JSON.stringify(BOSS4_BLOCKS_DEF.map((b) => b.originArm))
    === JSON.stringify(['cleanse-substitution', 'portable-reference']),
    'each block must carry the Boss3 arm that is the sensible reference for its matchup');
}

// ── The two arms of a block are the SAME player package. ──────────────────────────
{
  for (const b of BOSS4_BLOCKS_DEF) {
    const [control, treated] = b.arms;
    const ctl = boss4ArmCells(b.name, control!.name);
    const trt = boss4ArmCells(b.name, treated!.name);
    for (let i = 0; i < ctl.length; i++) {
      const a = ctl[i]!, c = trt[i]!;
      assert(a.className === c.className, `${b.name}: arms must pair root-for-root at index ${i}`);
      assert(boss4CellFingerprint(a) === boss4CellFingerprint(c),
        `${b.name}/${a.className}: the arms differ in the player package — Boss4 treats the boss, not the build`);
      // Resolved as well as declared: a default that resolved differently between the
      // two arms would pass a raw-field comparison and still be two packages.
      const ra = resolveSurveyPackage(a), rc = resolveSurveyPackage(c);
      assert(JSON.stringify(ra) === JSON.stringify(rc),
        `${b.name}/${a.className}: the arms RESOLVE to different packages`);
      assert(a.treatment !== c.treatment, `${b.name}/${a.className}: the arms must carry distinct labels`);
      assert(a.id !== c.id, `${b.name}/${a.className}: the arms must carry distinct cell ids`);
    }
  }
}

// ── The candidate: one field, declared arithmetic, and a live mechanic left behind. ─
{
  for (const b of BOSS4_BLOCKS_DEF) {
    const m = MONSTER_DATABASE.get(b.bossId)!;
    const c = b.candidate;
    assert(c.after < c.before, `${b.name}: the candidate must reduce pressure`);
    assert(c.after >= 1, `${b.name}: the candidate must not delete the mechanic`);
    assert(c.field.includes(b.bossId), `${b.name}: the declared field does not name this boss`);
    if (c.kind === 'attack') {
      assert(m.stats.attack === c.before, `${b.name}: authored attack is not the frozen ${c.before}`);
      assert(c.after === Math.round(c.before * 0.75),
        `${b.name}: the candidate is round(attack x 0.75), got ${c.after}`);
    } else {
      assert(m.dotEffect?.damagePerStack === c.before,
        `${b.name}: authored damagePerStack is not the frozen ${c.before}`);
      // Stated as the packet states it: the RAW four-stack coefficient, before any
      // defense or multiplier. Never as measured HP damage.
      assert(c.before * m.dotEffect!.maxStacks === 36 && c.after * m.dotEffect!.maxStacks === 24,
        `${b.name}: the packet's raw four-stack coefficients (36 -> 24) no longer follow from the authored shape`);
    }
  }
}

// ── Targeting, tier legality, and the RP budget. ──────────────────────────────────
{
  const budget = runeBudgetForGlobalMastery(72);
  for (const b of BOSS4_BLOCKS_DEF) {
    for (const cell of BOSS4_BLOCKS[b.name]!.cells) {
      assert(cell.nodeId === b.nodeId, `${cell.id}: node drift`);
      assert(cell.isDungeon === true, `${cell.id}: must target the dungeon encounter`);
      assert(JSON.stringify(cell.targetTypes) === JSON.stringify([b.bossId]), `${cell.id}: must target ${b.bossId}`);
      assert(cell.tier === BOSS4_TIER && cell.build.playerTier === BOSS4_TIER && cell.build.gearTier === BOSS4_TIER,
        `${cell.id}: tier drift`);
      assert(NODE_BIOMES[cell.nodeId]?.biomeTier === BOSS4_TIER, `${cell.id}: only T2 nodes belong in this screen`);
      const treatments = b.arms.map((a) => a.treatment);
      assert(treatments.includes(cell.treatment!), `${cell.id}: unknown treatment ${cell.treatment}`);
      // No Boss4 row is a historical result: a fight against a treated boss has no
      // history at all, and a control is a replay rather than a corroboration.
      assert(!/corroborated/.test(cell.treatment!), `${cell.id}: no Boss4 row is a historical result`);
      for (const id of Object.values(cell.build.gearItemIds)) {
        const recipe = RECIPE_DATABASE.get(id!);
        assert(!!recipe && ITEM_DATABASE.has(id!), `${cell.id}: missing recipe/item ${id}`);
        assert(recipe.tier <= BOSS4_TIER, `${cell.id}: ${id} exceeds tier ${BOSS4_TIER}`);
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

// ── The install seam, at the spec level. ──────────────────────────────────────────
//
// The functional proof lives in `boss4Pressure.test.ts`; what is checked here is the
// contract every caller depends on: a control records NOTHING, a candidate records
// exactly one named change, and both leave the authored value standing afterwards.
{
  for (const b of BOSS4_BLOCKS_DEF) {
    for (const arm of b.arms) {
      const cell = boss4ArmCells(b.name, arm.name)[0]!;
      const installed = installBoss4Treatment(cell);
      const live = () => (b.candidate.kind === 'attack'
        ? MONSTER_DATABASE.get(b.bossId)!.stats.attack
        : MONSTER_DATABASE.get(b.bossId)!.dotEffect!.damagePerStack);
      try {
        // The live value while installed. `boss4Pressure.test.ts` proves it reaches
        // the fight; this is the cheaper claim that it was written at all, so a
        // record-only install cannot pass the structural half either.
        assert(live() === (arm.treated ? b.candidate.after : b.candidate.before),
          `${b.name}/${arm.name}: the live value is ${live()} with this arm installed`);
        if (arm.treated) {
          assert(installed.changes.length === 1,
            `${b.name}/${arm.name}: a candidate arm records exactly one change, got ${installed.changes.length}`);
          const ch = installed.changes[0]!;
          assert(ch.bossId === b.bossId && ch.field === b.candidate.field
            && ch.before === b.candidate.before && ch.after === b.candidate.after,
            `${b.name}/${arm.name}: the change record does not match the declared candidate`);
        } else {
          assert(installed.changes.length === 0,
            `${b.name}/${arm.name}: a control arm installs nothing, got ${JSON.stringify(installed.changes)}`);
        }
      } finally {
        installed.restore();
      }
      assert(live() === b.candidate.before,
        `${b.name}/${arm.name}: restore left ${live()} standing instead of the authored ${b.candidate.before}`);
    }
  }
  // Everything is back where it started, checked by the same assertion set that runs
  // at load. A test that left a candidate standing would poison every file after it.
  assertBoss4Definitions();
}

console.log('boss4Matrix: ok');
