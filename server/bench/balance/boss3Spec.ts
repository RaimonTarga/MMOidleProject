import assert from 'node:assert/strict';
import {
  DUNGEON_DEFS, MONSTER_DATABASE, NODE_BIOMES,
  ABILITY_DATABASE, abilityRankAt, isCleanseable, isHarmfulPlayerStatusEffect,
  resolveMonsterDotDebuff, PLATING_SHRED_EFFECT_ID,
  runicPointLoadoutCost,
  referenceAbilityRule, withReferenceAbilityWiring,
} from '@mmo-idle/shared';
import { REFERENCE_GUARDS, referencePackageCells } from './boss1Spec';
import type { Night5Cell } from './night5Spec';

/**
 * Boss3 -- ONE defensive substitution, against the two T2 bosses that beat every
 * portable reference.
 *
 * Boss2 produced the first full T2 coverage map and found exactly two total wipes:
 * `mire-gorged-behemoth` (0/6) and `chitinous-dreadbore` (0/6). Both were fought on
 * a package carrying NO status-removal tool -- a property of the reference, stated
 * in Boss2's own packet, never a boss-design defect. Boss3 asks the one bounded
 * question that follows from it.
 *
 * THE QUESTION. At unchanged T2 boss values and otherwise unchanged Boss2
 * references, does replacing Brace with Cleanse produce a useful tradeoff against
 * Swamp and Cave?
 *
 * That is a COMPLETE-BUILD SUBSTITUTION EFFECT: status removal INSTEAD OF burst
 * mitigation. It is deliberately not:
 *
 *   - a causal estimate of any particular debuff's contribution to damage;
 *   - an optimised Cleanse-timing study (the reference `When Debuffed` wiring is used, and
 *     no ability-specific Rune rule is added);
 *   - evidence that Cleanse should be universal, or that Brace should not be;
 *   - a search over builds. There are exactly two arms and nothing is retried.
 *
 * A failed substitution does NOT show that no other build could work, and does not
 * justify an ability buff. A successful one does not make Cleanse a general answer.
 *
 * WHY THESE TWO BOSSES FAIL DIFFERENTLY, measured from the Boss2 recordings rather
 * than inferred from their stat lines -- this is what makes one substitution legible
 * on both at once:
 *
 *   Behemoth is ~87-91% DoT. Across its six fights the player took 281-419 damage
 *   from `monster-dot:mire-gorged-venom` against 26-46 from direct hits, and every
 *   one of the six deaths is recorded with a DoT cause at 4 venom stacks. Its
 *   Corrosive Pool is real pressure, but the bot escaped hazards (four
 *   `hazard-escape` events per fight) and the pool contributed no separately
 *   measurable player-damage channel. Venom is the lethal channel and it is the ONLY
 *   cleanseable effect present.
 *
 *   Dreadbore is 100% direct. No DoT channel appears in any of its six recordings;
 *   the lethal blows are 92-149 point melee/Eruption hits against 231-300 max HP,
 *   and its cleanseable effect (`plating-shred`, ramping to 5 stacks at 2 plating
 *   each) is a MITIGATION lever rather than a damage channel. Four of its six deaths
 *   occurred before 50% HP, so `empower-shred` had not fired in them.
 *
 * So the two blocks are not the same experiment twice. Swamp tests Cleanse against
 * the thing that is killing the player; Cave tests whether restoring plating is
 * worth more than a 40% burst-mitigation window against hits that large. The honest
 * prior is that Swamp is the plausible one and Cave is the one that may get worse.
 */

export const BOSS3_CAP_MS = 300000;
export const BOSS3_TIER = 2;

/**
 * The two arms. `portable-reference` is the EXACT Boss2 package -- it is produced by
 * the same `referencePackageCells` construction, with the guard list omitted so it
 * cannot drift from the baseline it is supposed to reproduce.
 *
 * ORDER, not membership. `cleanse` replaces `brace` at INDEX 1, leaving Second Wind
 * at index 0. That matters mechanically and not only cosmetically: guards are walked
 * top-to-bottom and the first eligible one claims a one-activation-per-window gate
 * (`GUARD_WINDOW_KEY`, 100 ms), so a package whose guards are the same set in a
 * different order is a different package.
 */
export const BOSS3_ARMS = [
  { name: 'portable-reference', guards: undefined, treatment: 'reference-portable' },
  { name: 'cleanse-substitution', guards: ['second-wind', 'cleanse'], treatment: 'cleanse-substitution' },
] as const satisfies readonly {
  name: string; guards: readonly string[] | undefined; treatment: string;
}[];

/** The substituted-out and substituted-in Guards, named once. */
export const BOSS3_GUARD_OUT = 'brace';
export const BOSS3_GUARD_IN = 'cleanse';
/** Index 1 of the ordered Guard list. Asserted, never assumed. */
export const BOSS3_GUARD_SLOT = 1;

export interface Boss3Block {
  name: string;
  bossId: string;
  nodeId: string;
  role: string;
  /**
   * The ORIGINAL Boss2 seed for this boss, read from its frozen block manifest
   * (`.../ttk-survey/boss2/<block>/manifest.json`), not re-chosen here.
   *
   * Reusing it is deliberate: the baseline arm then revisits the exact known failure
   * rather than sampling a fresh one, which makes it a reproducibility CONTROL. It
   * is emphatically NOT a new independent replicate of Boss2 and must never be
   * counted as one.
   */
  seed: number;
  bossStats: { hp: number; attack: number; plating: number; damageReduction: number };
  /**
   * The harmful player status effect ids this boss ACTUALLY generates, as runtime
   * ids -- `monster-dot:` prefixed for a DoT, the bare id otherwise.
   *
   * These are hypotheses about the treatment's target and are re-derived from the
   * live monster definition by `assertBoss3Definitions`, so a renamed effect or a
   * removed rider fails qualification instead of producing a screen that contrasts
   * nothing. Cleanse's own removal semantics are checked separately, by fixture.
   */
  cleanseTargets: readonly string[];
  /**
   * Which of `cleanseTargets` Cleanse is EXPECTED to select, given its authored
   * priority (deepest stack first, ties broken by ascending id) and `debuffs: 1` at
   * rank II. Recorded as a prediction to be checked against the receipts, never
   * enforced on the run.
   */
  expectedPrimaryTarget: string;
  summonsNothing: boolean;
  patternId: string | null;
}

export const BOSS3_BLOCKS_DEF: Boss3Block[] = [
  {
    name: 'swamp-response',
    bossId: 'mire-gorged-behemoth', nodeId: 'node-t2-swamp-dungeon', role: 'swamp',
    seed: 98011,
    bossStats: { hp: 3375, attack: 38, plating: 6, damageReduction: 0.08 },
    // One cleanseable effect only. The Corrosive Pool's slow and 1500 ms
    // vulnerability are hazard-local and did not appear as a standing player status
    // in any of the six Boss2 recordings, so they are NOT declared as targets --
    // Cleanse does not remove the pool from the floor and this must not imply it does.
    cleanseTargets: ['monster-dot:mire-gorged-venom'],
    expectedPrimaryTarget: 'monster-dot:mire-gorged-venom',
    summonsNothing: true, patternId: null,
  },
  {
    name: 'cave-response',
    bossId: 'chitinous-dreadbore', nodeId: 'node-t2-cave-dungeon', role: 'cave',
    seed: 98011,
    bossStats: { hp: 4375, attack: 139, plating: 12, damageReduction: 0.12 },
    // TWO cleanseable effects, which makes priority load-bearing here and not on
    // Swamp. `plating-shred` ramps and persists; the burrow's `contactSlow` is a
    // single-stack 2000 ms rider that expires on its own. Cleanse takes the deepest
    // stack first and breaks a tie by ascending id, so 'plating-shred' wins both the
    // ramped case and the 1-vs-1 tie ('p' < 's').
    cleanseTargets: [PLATING_SHRED_EFFECT_ID, 'slow'],
    expectedPrimaryTarget: PLATING_SHRED_EFFECT_ID,
    summonsNothing: true, patternId: 'dreadbore-emergence',
  },
];

/**
 * 2 blocks x 6 roots x 2 arms x 1 seed = 24 fights. Both arms of a block live in the
 * SAME block so they run back to back on one revision and one seed, and a local
 * problem on one boss never consumes the other's allocation.
 */
export const BOSS3_BLOCKS: Record<string, { cells: Night5Cell[]; durationMs: number; pilotIds: string[] }> =
  Object.fromEntries(BOSS3_BLOCKS_DEF.map((b) => [b.name, {
    cells: BOSS3_ARMS.flatMap((arm) => referencePackageCells({
      nodeId: b.nodeId, role: b.role, bossId: b.bossId,
      idPrefix: `boss3-${b.name}-${arm.name}`,
      treatmentFor: () => arm.treatment,
      guards: arm.guards,
    })),
    durationMs: BOSS3_CAP_MS,
    // No pilot, and no fight is spent on preparation. The encounter setup is the one
    // Boss2 exercised on this runner against these two bosses; qualification proves
    // the packages, and a functional FIXTURE proves the Cleanse semantics. A pilot
    // here would be an undeclared 25th observation.
    pilotIds: [],
  }]));

/** Boss3 installs nothing: both bosses are fought at authored source values. */
export function installBoss3Treatment(): null {
  return null;
}

/** The 12 cells of a block, split by arm. Order within an arm is root order. */
export function boss3ArmCells(blockName: string, armName: string): Night5Cell[] {
  const block = BOSS3_BLOCKS[blockName];
  assert(block, `unknown Boss3 block ${blockName}`);
  const arm = BOSS3_ARMS.find((a) => a.name === armName);
  assert(arm, `unknown Boss3 arm ${armName}`);
  return block.cells.filter((c) => c.treatment === arm.treatment);
}

/**
 * Everything about a cell EXCEPT the guard list, as a comparable string.
 *
 * Arm equality is the whole validity of this screen: if anything other than the
 * substituted Guard differs, the contrast measures two things at once. Comparing a
 * normalised projection rather than eyeballing two literals is what makes that
 * checkable -- and the guard list is blanked rather than omitted, so a cell that
 * dropped its guards entirely cannot pass as equal.
 */
export function boss3CellFingerprint(cell: Night5Cell): string {
  return JSON.stringify({
    nodeId: cell.nodeId, tier: cell.tier, role: cell.role, className: cell.className,
    alternate: cell.alternate, isDungeon: cell.isDungeon, targetTypes: cell.targetTypes,
    stance: cell.stance, upgradeLevel: cell.upgradeLevel,
    runeRules: cell.runeRules, techniques: cell.abilities?.techniques,
    guards: '<substituted>',
    build: { ...cell.build, id: '<per-arm>' },
  });
}

/**
 * Fail loudly at load time if the bosses, the arms, the effects or the Cleanse
 * definition have drifted.
 *
 * This is the qualification the packet requires BEFORE freezing: the treatment is
 * only meaningful if the effects it targets exist, are harmful, and are cleanseable
 * at this source. A drifted effect id must stop the screen here, not be discovered
 * as a null result after 24 fights.
 */
export function assertBoss3Definitions(): void {
  assert.equal(BOSS3_BLOCKS_DEF.length, 2, 'Boss3 screens the two Boss2 total-wipe bosses');
  assert.equal(BOSS3_ARMS.length, 2, 'exactly two arms; no third arm and no variants grid');

  // ── The substitution itself, against the live ability database.
  const out = ABILITY_DATABASE.get(BOSS3_GUARD_OUT);
  const inn = ABILITY_DATABASE.get(BOSS3_GUARD_IN);
  assert(out && inn, 'both the substituted-out and substituted-in Guards must exist');
  assert.equal(out.slot, 'guard', `${BOSS3_GUARD_OUT} must be a Guard`);
  assert.equal(inn.slot, 'guard', `${BOSS3_GUARD_IN} must be a Guard`);
  // Legality, not a budget increase: the substitution may only ever free RP.
  assert(inn.attunementCost <= out.attunementCost,
    `${BOSS3_GUARD_IN} (${inn.attunementCost} RP) must not cost more than ${BOSS3_GUARD_OUT} (${out.attunementCost} RP) — this screen never enlarges the budget`);
  const rank = abilityRankAt(inn, BOSS3_TIER);
  assert.equal(rank.effect.kind, 'cleanse', `${BOSS3_GUARD_IN} at tier ${BOSS3_TIER} must resolve a cleanse effect`);
  assert.equal(referenceAbilityRule(inn.id)?.conditionId, 'has-debuff',
    `${BOSS3_GUARD_IN} must use its reference wiring; this screen adds no other ability-specific Rune rule`);
  // The reference baseline must still BE the baseline.
  assert.deepEqual([...REFERENCE_GUARDS], ['second-wind', BOSS3_GUARD_OUT],
    'the reference Guard list has moved; the baseline arm no longer reproduces Boss2');
  assert.equal(REFERENCE_GUARDS[BOSS3_GUARD_SLOT], BOSS3_GUARD_OUT,
    `the substituted Guard is not at index ${BOSS3_GUARD_SLOT} of the reference list`);

  const t2 = [...DUNGEON_DEFS.values()].filter((d) => d.biomeTier === BOSS3_TIER);
  for (const b of BOSS3_BLOCKS_DEF) {
    const def = t2.find((d) => d.nodeId === b.nodeId);
    assert(def, `no T2 dungeon def for ${b.nodeId}`);
    assert.equal(def.boss.bossId, b.bossId, `${b.name}: dungeon boss drift`);
    assert.equal(NODE_BIOMES[b.nodeId]?.isDungeon, true, `${b.name}: node is not a dungeon`);
    assert.equal(NODE_BIOMES[b.nodeId]?.biomeTier, BOSS3_TIER, `${b.name}: node tier drift`);
    assert.equal(NODE_BIOMES[b.nodeId]?.biomeGroup, b.role, `${b.name}: biome group drift`);

    const m = MONSTER_DATABASE.get(b.bossId);
    assert(m?.isBoss, `${b.bossId} missing or is not a boss`);
    // Boss VALUES are unchanged by this screen and pinned so a silent edit invalidates it.
    assert.equal(m.stats.hp, b.bossStats.hp, `${b.name}: boss hp drift`);
    assert.equal(m.stats.attack, b.bossStats.attack, `${b.name}: boss attack drift`);
    assert.equal(m.stats.plating, b.bossStats.plating, `${b.name}: boss plating drift`);
    assert.equal(m.stats.damageReduction, b.bossStats.damageReduction, `${b.name}: boss dr drift`);
    const pattern = (m as { bossPattern?: { id: string } }).bossPattern;
    assert.equal(pattern?.id ?? null, b.patternId, `${b.name}: boss pattern drift`);

    // ── The declared targets must be exactly what this boss's RIDERS generate,
    //    re-derived from the definition rather than trusted as a string list.
    const derived = new Set<string>();
    if (m.dotEffect) derived.add(resolveMonsterDotDebuff({ monster: m }).statusEffectId);
    if ((m as { appliesPlatingShred?: unknown }).appliesPlatingShred) derived.add(PLATING_SHRED_EFFECT_ID);
    const slows = JSON.stringify((m as { bossPattern?: unknown }).bossPattern ?? null).includes('contactSlow');
    if (slows) derived.add('slow');
    assert.deepEqual([...derived].sort(), [...b.cleanseTargets].sort(),
      `${b.name}: declared cleanse targets must be exactly what the boss's riders generate, got ${[...derived].sort().join(',')}`);

    // A block with nothing cleanseable would contrast nothing, which the packet says
    // to report as a contradiction and OMIT rather than run.
    assert(b.cleanseTargets.length > 0, `${b.name}: no cleanseable effect — this block contrasts nothing and must be omitted, not run`);
    for (const id of b.cleanseTargets) {
      // `data` is empty here on purpose: these ids must qualify on identity alone.
      // An effect whose eligibility depended on runtime `data` would be checked by
      // the fixture, not asserted structurally.
      assert(isHarmfulPlayerStatusEffect(id, {}), `${b.name}: ${id} is not a harmful player status effect`);
      assert(isCleanseable(id, {}), `${b.name}: ${id} is immune to Cleanse — the treatment cannot touch it`);
    }
    assert(b.cleanseTargets.includes(b.expectedPrimaryTarget),
      `${b.name}: the expected primary target is not among the declared targets`);

    // ── Arm construction: 12 cells, six distinct roots per arm, and every cell
    //    identical across arms EXCEPT the guard list.
    const block = BOSS3_BLOCKS[b.name]!;
    assert.equal(block.cells.length, 12, `${b.name}: 6 roots x 2 arms = 12 cells`);
    assert.equal(block.durationMs, BOSS3_CAP_MS, `${b.name}: cap drift`);
    assert.equal(block.pilotIds.length, 0, `${b.name}: no pilot is authorized`);
    assert.equal(new Set(block.cells.map((c) => c.id)).size, 12, `${b.name}: cell ids must be distinct`);

    const ref = boss3ArmCells(b.name, 'portable-reference');
    const sub = boss3ArmCells(b.name, 'cleanse-substitution');
    assert.equal(ref.length, 6, `${b.name}: six baseline cells`);
    assert.equal(sub.length, 6, `${b.name}: six substitution cells`);
    for (let i = 0; i < 6; i++) {
      const a = ref[i]!, c = sub[i]!;
      assert.equal(a.className, c.className, `${b.name}: arms must pair root-for-root at index ${i}`);
      assert.equal(boss3CellFingerprint(a), boss3CellFingerprint(c),
        `${b.name}/${a.className}: the arms differ in something other than the substituted Guard`);
      assert.deepEqual(a.abilities?.guards, [...REFERENCE_GUARDS],
        `${b.name}/${a.className}: the baseline arm is not the Boss2 reference Guard list`);
      assert.deepEqual(c.abilities?.guards, ['second-wind', BOSS3_GUARD_IN],
        `${b.name}/${c.className}: the substitution arm's Guard list is wrong`);
      // The substituted slot, and ONLY it.
      const before = a.abilities!.guards, after = c.abilities!.guards;
      assert.equal(before.length, after.length, `${b.name}/${a.className}: the guard list changed length`);
      for (let g = 0; g < before.length; g++) {
        if (g === BOSS3_GUARD_SLOT) continue;
        assert.equal(before[g], after[g], `${b.name}/${a.className}: guard slot ${g} moved as well as slot ${BOSS3_GUARD_SLOT}`);
      }
      // RP is computed mechanically per root; the substitution must never enlarge it.
      const rp = (cell: Night5Cell) => runicPointLoadoutCost({
        rules: withReferenceAbilityWiring(cell.runeRules as never, cell.abilities!),
        abilities: cell.abilities!,
        stances: cell.stance ? [cell.stance] : [],
        rites: [],
      });
      assert(rp(c) <= rp(a),
        `${b.name}/${a.className}: the substitution costs ${rp(c)} RP against the baseline's ${rp(a)} — it may only free RP`);
    }
  }

  const total = BOSS3_BLOCKS_DEF.reduce((n, b) => n + BOSS3_BLOCKS[b.name]!.cells.length, 0);
  assert.equal(total, 24, `Boss3 is 24 fights, got ${total}`);
}
