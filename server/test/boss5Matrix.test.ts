/**
 * Boss5 structural qualification — the roster, the tier-legal packages, and the size.
 *
 * `boss5Pressure.test.ts` is the functional half (does Block C's installed attack
 * actually change the damage the fight resolves, and is it restored). This is the
 * structural half: that the screen covers the roster it CLAIMS to cover, that every
 * package is legal at its own tier rather than at T2's, and that the declared
 * observation count is derived from the blocks instead of written down.
 *
 * THE CLAIM THIS FILE EXISTS FOR. Boss5's primary experiment is breadth, so its
 * load-bearing risk is not a mis-installed number — Block B installs nothing — it is
 * a roster that quietly omits a boss, or a package that is not legal at its tier and
 * therefore measures a player nobody could actually field. Both are checked here.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss5Matrix.test.ts
 */
import {
  DUNGEON_DEFS, ITEM_DATABASE, MONSTER_DATABASE, NODE_BIOMES, RECIPE_DATABASE,
  runicPointLoadoutCost, runeBudgetForGlobalMastery,
} from '@mmo-idle/shared';
import {
  BOSS5_ACTIVE_ROSTER, BOSS5_BLOCKS, BOSS5_BLOCKS_DEF, BOSS5_CAPS, BOSS5_CAVE_ARMS,
  BOSS5_CAVE_AUTHORED_ATTACK, BOSS5_CAVE_SEED, BOSS5_COVERED, BOSS5_OUT_OF_SCOPE,
  BOSS5_ROSTER, BOSS5_SEED, BOSS5_TIER_REFERENCE, assertBoss5Definitions,
  boss5CaveArmCells, boss5CellFingerprint, boss5ObservationCount, installBoss5Treatment,
} from '../bench/balance/boss5Spec';
import { BOSS2_SEED } from '../bench/balance/boss2Spec';
import { REFERENCE_GUARDS } from '../bench/balance/boss1Spec';
import { resolveSurveyPackage } from '../bench/balance/ttkSurveySpec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Fails loudly if the roster, any package, or any of the fields this screen promises
// to hold fixed has moved. The same function the preflight and the run call.
assertBoss5Definitions();

// ── The roster IS the source roster, minus a named covered set. ───────────────────
//
// Re-derived here from `DUNGEON_DEFS` independently of the spec's own derivation, so
// a bug in that derivation is caught rather than reproduced. A dungeon added to the
// game must appear in exactly one of the two lists.
{
  const source = [...DUNGEON_DEFS.values()].map((d) => d.boss.bossId).sort();
  const accounted = [...BOSS5_ROSTER.map((b) => b.bossId), ...Object.keys(BOSS5_COVERED)].sort();
  assert(JSON.stringify(source) === JSON.stringify(accounted),
    'every active dungeon boss must be either in the breadth roster or explicitly covered; '
    + `source has ${source.length}, accounted ${accounted.length}`);
  assert(new Set(accounted).size === accounted.length,
    'a boss appears both in the breadth roster and in the covered set');
  assert(BOSS5_ACTIVE_ROSTER.length === source.length, 'the active roster is not the source roster');

  // Out-of-scope content is excluded STRUCTURALLY (it is not a dungeon boss), never
  // by a filter that could silently start matching something else.
  for (const id of BOSS5_OUT_OF_SCOPE) {
    assert(MONSTER_DATABASE.has(id), `${id} is declared out of scope but no longer exists`);
    assert(!source.includes(id), `${id} is now a dungeon boss; its exclusion must be re-decided`);
  }

  // Every covered entry carries provenance rather than a bare flag.
  for (const [id, provenance] of Object.entries(BOSS5_COVERED)) {
    assert(provenance.trim().length > 20, `${id}: the covered entry states no usable provenance`);
  }
}

// ── Shape: one block per missing boss, six roots each, plus the one Cave block. ────
{
  const breadth = BOSS5_BLOCKS_DEF.filter((b) => b.kind === 'breadth');
  const cave = BOSS5_BLOCKS_DEF.filter((b) => b.kind === 'cave-refinement');
  assert(breadth.length === BOSS5_ROSTER.length,
    `expected one breadth block per missing boss (${BOSS5_ROSTER.length}), got ${breadth.length}`);
  assert(cave.length === 1, `expected exactly one Cave refinement block, got ${cave.length}`);
  assert(new Set(breadth.map((b) => b.bossId)).size === breadth.length,
    'two breadth blocks fight the same boss');

  const counts = boss5ObservationCount();
  assert(counts.breadth === BOSS5_ROSTER.length * 6,
    `breadth is 6 x N; N=${BOSS5_ROSTER.length} gives ${BOSS5_ROSTER.length * 6}, got ${counts.breadth}`);
  assert(counts.cave === 12, `the Cave block is 6 roots x 2 arms = 12, got ${counts.cave}`);
  assert(counts.total === counts.breadth + counts.cave, 'the total is not its two parts');
  // A bounded screen, not a cohort that can grow silently.
  assert(counts.total === BOSS5_ROSTER.length * 6 + 12,
    `the screen plans 6 x N + 12 observations, got ${counts.total}`);

  for (const b of BOSS5_BLOCKS_DEF) {
    const spec = BOSS5_BLOCKS[b.name]!;
    assert(spec.cells.length === (b.kind === 'breadth' ? 6 : 12),
      `${b.name}: cell count drift (${spec.cells.length})`);
    assert(spec.pilotIds.length === 0, `${b.name}: Boss5 declares no pilot anywhere`);
    assert(spec.durationMs === b.capMs, `${b.name}: cap drift`);
  }
}

// ── Caps and seeds: declared per tier, and honest about what a seed can do. ───────
{
  for (const b of BOSS5_BLOCKS_DEF.filter((x) => x.kind === 'breadth')) {
    assert(b.capMs === BOSS5_CAPS[b.tier], `${b.name}: cap is not the declared tier cap`);
    assert(b.seed === BOSS5_SEED, `${b.name}: breadth blocks carry the one predeclared seed`);
    assert(b.capMs > 0 && Number.isFinite(b.capMs), `${b.name}: the cap must be finite`);
  }
  // The Cave block carries Boss2's seed, through Boss3 and Boss4, so its rows extend
  // that sequence rather than sampling a fresh one.
  const cave = BOSS5_BLOCKS_DEF.find((b) => b.kind === 'cave-refinement')!;
  assert(cave.seed === BOSS5_CAVE_SEED && cave.seed === BOSS2_SEED,
    `cave-refinement: seed ${cave.seed} is not the carried ${BOSS2_SEED}`);
  assert(BOSS5_SEED !== BOSS5_CAVE_SEED,
    'the breadth seed and the carried Cave seed must be distinguishable in the artifacts');

  // WHAT A SEED CAN MOVE. Boss1 established that a boss with no adds, a fixed spawn
  // and deterministic evasion produces byte-identical outcomes across seeds. That is
  // a limitation to STATE, not to paper over with a second seed, so it is derived
  // here rather than asserted either way: the report must carry whatever this says.
  const stochastic = BOSS5_ROSTER.filter((b) => b.seedCanMove);
  for (const b of BOSS5_ROSTER) {
    assert(b.seedCanMove === (b.addSpecies.length > 0 || b.seedCanMove),
      `${b.bossId}: seedCanMove disagrees with the resolved add species`);
  }
  console.log(`  seeds: ${stochastic.length} of ${BOSS5_ROSTER.length} breadth bosses can move with the seed`
    + `${stochastic.length ? ` (${stochastic.map((b) => b.bossId).join(', ')})` : ''}`);
}

// ── Tier legality: every package is legal AT ITS OWN TIER. ────────────────────────
//
// The T2 reference shape is NOT assumed to port. It does not: measured during
// preparation, `second-wind + brace + any technique` is refused at T1 on all six
// roots. The declared per-tier reference is what is checked, and the departure is
// required to be declared rather than merely tolerated.
{
  for (const tier of [1, 3, 4]) {
    const ref = BOSS5_TIER_REFERENCE[tier];
    assert(!!ref, `tier ${tier} declares no reference`);
    assert(ref.tier === tier, `tier ${tier}: the reference mislabels its own tier`);
    assert(JSON.stringify(ref.guards) === JSON.stringify([...REFERENCE_GUARDS]),
      `tier ${tier}: the ordered Guard pair is what makes these rows readable against Boss1-Boss4`);
    assert(ref.note.trim().length > 20, `tier ${tier}: the reference states no rationale`);
    // Tier 1 admits no stance at all; the others carry the reference's defensive one.
    assert(ref.stance === (tier === 1 ? null : 'defensive-stance'),
      `tier ${tier}: stance declaration is not the tier's`);
  }
  // The T1 DEPARTURE is explicit, not incidental: it runs no technique, and that is
  // the only way the ordered Guard pair fits its budget.
  assert(BOSS5_TIER_REFERENCE[1]!.techniques.length === 0,
    'the T1 reference must declare an EXPLICIT empty technique list, not inherit one');
  assert(BOSS5_TIER_REFERENCE[3]!.techniques.length > 0 && BOSS5_TIER_REFERENCE[4]!.techniques.length > 0,
    'T3 and T4 carry the T2 shape entire, technique included');
}

{
  for (const block of BOSS5_BLOCKS_DEF) {
    for (const cell of BOSS5_BLOCKS[block.name]!.cells) {
      assert(cell.nodeId === block.nodeId, `${cell.id}: node drift`);
      assert(cell.isDungeon === true, `${cell.id}: must target the dungeon encounter`);
      assert(JSON.stringify(cell.targetTypes) === JSON.stringify([block.bossId]),
        `${cell.id}: must target ${block.bossId}`);
      assert(cell.tier === block.tier && cell.build.playerTier === block.tier
        && cell.build.gearTier === block.tier && cell.build.contentTier === block.tier,
        `${cell.id}: tier drift`);
      assert(NODE_BIOMES[cell.nodeId]?.biomeTier === block.tier,
        `${cell.id}: the node's tier is not the block's`);
      // NO FUTURE-TIER GRANTS.
      for (const id of Object.values(cell.build.gearItemIds)) {
        const recipe = RECIPE_DATABASE.get(id!);
        assert(!!recipe && ITEM_DATABASE.has(id!), `${cell.id}: missing recipe/item ${id}`);
        assert(recipe.tier <= block.tier, `${cell.id}: ${id} is tier ${recipe.tier}, above ${block.tier}`);
      }
      // The RESOLVED package, at the tier's own RP budget. A T2 budget would pass
      // packages T1 cannot field, which is the whole trap.
      const r = resolveSurveyPackage(cell);
      const mastery = { 1: 30, 2: 72, 3: 114, 4: 156 }[block.tier]!;
      const cost = runicPointLoadoutCost({
        rules: r.runeRules as never, abilities: r.abilities,
        stances: r.stance ? [r.stance] : [], rites: [],
      });
      assert(cost <= runeBudgetForGlobalMastery(mastery),
        `${cell.id}: costs ${cost} RP against tier ${block.tier}'s ${runeBudgetForGlobalMastery(mastery)}`);
      assert(r.runeRules.length === 5, `${cell.id}: the reference carries five ordered behaviour rules`);
      // Nothing here is a historical result: every Boss5 row is a first observation.
      assert(!/corroborated/.test(cell.treatment!), `${cell.id}: no Boss5 row is a historical result`);
    }
  }
}

// ── Block C: two treated arms, one player package, no repeated baseline. ──────────
{
  const [hi, lo] = BOSS5_CAVE_ARMS;
  assert(BOSS5_CAVE_ARMS.length === 2, 'exactly two arms; no scalar grid');
  assert(hi!.attack === 104 && lo!.attack === 85, 'the declared arms are 104 and 85');
  assert(lo!.attack < hi!.attack, 'the lower arm must reduce pressure');
  assert(hi!.attack < BOSS5_CAVE_AUTHORED_ATTACK && lo!.attack < BOSS5_CAVE_AUTHORED_ATTACK,
    `neither arm may be the authored ${BOSS5_CAVE_AUTHORED_ATTACK}; this block repeats no baseline`);
  assert(MONSTER_DATABASE.get('chitinous-dreadbore')!.stats.attack === BOSS5_CAVE_AUTHORED_ATTACK,
    'the Dreadbore\'s authored attack has moved; the arms are stated against the wrong base');

  const a = boss5CaveArmCells(hi!.name), b = boss5CaveArmCells(lo!.name);
  assert(a.length === 6 && b.length === 6, 'six roots per arm');
  for (let i = 0; i < 6; i++) {
    assert(a[i]!.className === b[i]!.className, `arms must pair root-for-root at index ${i}`);
    assert(boss5CellFingerprint(a[i]!) === boss5CellFingerprint(b[i]!),
      `cave-refinement/${a[i]!.className}: the arms differ in the PLAYER package`);
    // Resolved as well as declared: a default that resolved differently between the
    // arms would pass a raw-field comparison and still be two packages.
    assert(JSON.stringify(resolveSurveyPackage(a[i]!)) === JSON.stringify(resolveSurveyPackage(b[i]!)),
      `cave-refinement/${a[i]!.className}: the arms RESOLVE to different packages`);
    assert(a[i]!.id !== b[i]!.id && a[i]!.treatment !== b[i]!.treatment,
      `cave-refinement/${a[i]!.className}: the arms must carry distinct ids and labels`);
    assert(JSON.stringify(a[i]!.abilities?.guards) === JSON.stringify([...REFERENCE_GUARDS]),
      `cave-refinement/${a[i]!.className}: the carried Guard list is not the Boss4 Brace reference`);
  }
}

// ── The install seam, at the spec level. ─────────────────────────────────────────
//
// The functional proof lives in `boss5Pressure.test.ts`; what is checked here is the
// contract every caller depends on: a breadth cell records NOTHING, each Cave arm
// records exactly one named change to the ABSOLUTE value it declares, and both leave
// the authored value standing afterwards.
{
  const live = () => MONSTER_DATABASE.get('chitinous-dreadbore')!.stats.attack;
  for (const arm of BOSS5_CAVE_ARMS) {
    const installed = installBoss5Treatment(boss5CaveArmCells(arm.name)[0]!);
    try {
      assert(live() === arm.attack, `${arm.name}: the live attack is ${live()} with this arm installed`);
      assert(installed.changes.length === 1,
        `${arm.name}: an arm records exactly one change, got ${installed.changes.length}`);
      const ch = installed.changes[0]!;
      assert(ch.bossId === 'chitinous-dreadbore' && ch.kind === 'attack'
        && ch.before === BOSS5_CAVE_AUTHORED_ATTACK && ch.after === arm.attack,
        `${arm.name}: the change record does not match the declared arm`);
    } finally {
      installed.restore();
    }
    assert(live() === BOSS5_CAVE_AUTHORED_ATTACK,
      `${arm.name}: restore left ${live()} standing instead of the authored ${BOSS5_CAVE_AUTHORED_ATTACK}`);
  }
  // An unknown treatment label must be REFUSED rather than silently treated as a
  // breadth no-op, which would let a mislabelled cell run untreated and be reported
  // as though it had been treated.
  {
    const rogue = { ...boss5CaveArmCells(BOSS5_CAVE_ARMS[0]!.name)[0]!, treatment: 'not-a-real-arm' };
    let refused = false;
    try {
      installBoss5Treatment(rogue);
    } catch {
      refused = true;
    }
    assert(refused, 'the install seam accepted an unknown treatment label');
  }
  // Everything is back where it started, checked by the same assertion set that runs
  // at load. A test that left an arm standing would poison every file after it.
  assertBoss5Definitions();
}

console.log(`boss5Matrix: ok (N=${BOSS5_ROSTER.length} missing bosses, `
  + `${boss5ObservationCount().total} planned observations)`);
