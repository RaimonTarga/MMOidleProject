import assert from 'node:assert/strict';
import {
  DUNGEON_DEFS, MONSTER_DATABASE, NODE_BIOMES, RECIPE_DATABASE, ITEM_DATABASE,
  runicPointLoadoutCost, runeBudgetForGlobalMastery, withReferenceAbilityWiring,
} from '@mmo-idle/shared';
import { SURVEY_CLASSES, resolveSurveyPackage } from './ttkSurveySpec';
import { REFERENCE_GUARDS, referencePackageCells } from './boss1Spec';
import type { Night5Cell } from './night5Spec';

/**
 * Boss5 -- ROSTER BREADTH, plus one bounded Cave refinement.
 *
 * Boss1-Boss4 spent 108 observations on T2 and produced a complete T2 coverage map, a
 * defensive-substitution result, and one adopted boss-side value. What they did NOT
 * produce is any current evidence at T1, T3 or most of T4. Boss5's primary experiment
 * is therefore breadth, not depth:
 *
 *   Block group B -- every in-scope active solo boss with no usable current evidence,
 *   six tier-legal reference packages each, one predeclared seed.
 *
 *   Block C -- ONE further coarse Cave comparison, 104 versus 85, on the exact Boss4
 *   Brace references. Independent of every B block.
 *
 * WHAT THIS IS NOT. It is not a build search, a win-rate estimate, a scalar grid, or
 * a class-parity exercise. Block B installs NOTHING at all. Block C installs exactly
 * one field, from a two-value declared list, and restores it.
 *
 * THE ROSTER IS RESOLVED FROM SOURCE, NOT ASSUMED. `BOSS5_ROSTER` is derived from
 * `DUNGEON_DEFS` at load, minus an explicitly enumerated covered set with named
 * provenance. A dungeon added to the game later therefore appears as UNCOVERED and
 * fails qualification, instead of silently shrinking the screen -- which is the
 * failure mode "assume N" would have.
 */

/** Fresh, predeclared. Block B asks a new question, so nothing is carried into it. */
export const BOSS5_SEED = 99011;
/** Block C carries the Boss2 seed, through Boss3 and Boss4, so its rows stay readable. */
export const BOSS5_CAVE_SEED = 98011;

/**
 * Per-fight caps, derived from each tier's own encounter rather than inherited.
 *
 * Boss1 resolved 600,000 ms for the T4 Sovereign by requiring its full cycle (half of
 * a 19,499 HP pool, plus engage adds and an 8 s raise cadence) to fit with very large
 * margin, against measured kills of 36-104 s. These follow the same reasoning against
 * the pools actually authored at each tier, and every one leaves a timeout meaning
 * "could not finish" rather than "was cut off mid-phase":
 *
 *   T1  1,700-2,100 HP    300,000 ms -- the T2 cap, against pools a third of T2's
 *   T3 11,462-12,895 HP   600,000 ms
 *   T4 17,893-22,940 HP   900,000 ms -- ~9x the slowest T4 clear Boss1 measured
 *
 * A cap is NOT a time-to-kill and no capped observation is extrapolated into one.
 */
export const BOSS5_CAPS: Record<number, number> = { 1: 300000, 3: 600000, 4: 900000 };

/** Block C reuses Boss4's Cave cap unchanged, so its rows compare to Boss4's directly. */
export const BOSS5_CAVE_CAP_MS = 300000;

/**
 * Bosses that already have usable current or demonstrably source-compatible evidence,
 * with the provenance that makes each one reusable. Everything else in `DUNGEON_DEFS`
 * is in scope for Block B.
 *
 * SOURCE COMPATIBILITY IS A CLAIM ABOUT THE CHANGE, NOT ABOUT THE HASH. The venom
 * adoption of 2026-09-19 moved the base definitions hash, so none of these is
 * byte-identical-source evidence any more. What makes them reusable is narrower and
 * checkable: the only authored field that moved belongs to `mire-gorged-behemoth`,
 * which is not present in any of these encounters. That is asserted below against the
 * live database rather than asserted in prose.
 */
export const BOSS5_COVERED: Record<string, string> = {
  'apex-timberclaw': 'Boss1 timberclaw block, 6 reference packages, 1/6',
  'stoneplate-juggernaut': 'Boss2, 6 reference packages, 5/6',
  'jungle-dread-gorger': 'Boss2, 6 reference packages, 5/6',
  'dune-stalker-emperor': 'Boss2, 6 reference packages, 4/6',
  'gorging-razortusk': 'Boss2, 6 reference packages, 2/6',
  'mire-gorged-behemoth': 'Boss2 0/6, Boss3 2/6, Boss4 4/6 at the now-adopted venom value',
  'chitinous-dreadbore': 'Boss2 0/6, Boss3 0/6, Boss4 1/6 at attack 104; Block C continues it',
  'charnel-crown-sovereign':
    'Boss1 sovereign block, 6 tier-legal T4 packages x 2 seeds, retrospectively reviewed '
    + 'and confirmed; its original failed artifact-verification status is NOT relabelled '
    + 'and it is NOT re-run merely to change that label',
};

/**
 * The one boss deliberately excluded from scope, and why.
 *
 * The Void Overlord is not a dungeon boss at all -- it does not appear in
 * `DUNGEON_DEFS` -- so it falls out of the roster structurally rather than by being
 * filtered here. This entry exists so that a future change which DID put it in a
 * dungeon would be a visible contradiction rather than a silent addition.
 */
export const BOSS5_OUT_OF_SCOPE = ['void-overlord'] as const;

export interface Boss5Boss {
  bossId: string;
  nodeId: string;
  tier: number;
  role: string;
  /** Pinned authored values, so a silent stat edit invalidates the screen. */
  stats: { hp: number; attack: number; plating: number; damageReduction: number };
  /** Named for the report; `null` is a real statement, not a gap. */
  patternId: string | null;
  /**
   * The species this boss's script spawns, resolved from `bossScript`.
   *
   * It is the ONLY documented consumer of run-to-run randomness in these encounters,
   * so it is also what decides whether the declared seed can move anything at all.
   */
  addSpecies: string[];
  /**
   * Whether a second seed could produce a different observation.
   *
   * Boss1 established the property and its trap: `apex-timberclaw` has no adds, a
   * fixed spawn and deterministic evasion, so two seeds against it produced
   * byte-identical outcomes. Declaring seeds for such a boss manufactures coverage
   * that does not exist. Every Block B boss is checked rather than assumed.
   */
  seedCanMove: boolean;
}

/** Every active dungeon boss, resolved from source. */
function activeRoster(): Boss5Boss[] {
  return [...DUNGEON_DEFS.values()]
    .map((d) => {
      const m = MONSTER_DATABASE.get(d.boss.bossId);
      assert(m?.isBoss, `Boss5: ${d.boss.bossId} is missing from MONSTER_DATABASE or is not a boss`);
      const node = NODE_BIOMES[d.nodeId];
      assert(node?.isDungeon, `Boss5: ${d.nodeId} is not a dungeon node`);
      const adds = new Set<string>();
      for (const phase of m.bossScript?.phases ?? []) {
        for (const action of phase.actions ?? []) {
          const a = action as { type: string; monsterTypeId?: string };
          if (a.type === 'spawn-adds' && a.monsterTypeId) adds.add(a.monsterTypeId);
        }
      }
      const raises = !!(m as { raisesDead?: unknown }).raisesDead;
      return {
        bossId: d.boss.bossId,
        nodeId: d.nodeId,
        tier: d.biomeTier,
        role: node.biomeGroup,
        stats: {
          hp: m.stats.hp, attack: m.stats.attack,
          plating: m.stats.plating, damageReduction: m.stats.damageReduction,
        },
        patternId: (m as { bossPattern?: { id: string } }).bossPattern?.id ?? null,
        addSpecies: [...adds].sort(),
        seedCanMove: adds.size > 0 || raises,
      };
    })
    .sort((a, b) => a.tier - b.tier || a.nodeId.localeCompare(b.nodeId));
}

/** The active roster, in full. Kept so qualification can state what it filtered. */
export const BOSS5_ACTIVE_ROSTER: Boss5Boss[] = activeRoster();

/**
 * Block group B's roster: every active dungeon boss NOT in `BOSS5_COVERED`.
 *
 * N is whatever this resolves to. The packet states the resulting count and the
 * screen's size follows from it; no observation total is written down by hand.
 */
export const BOSS5_ROSTER: Boss5Boss[] = BOSS5_ACTIVE_ROSTER
  .filter((b) => !(b.bossId in BOSS5_COVERED));

/**
 * The tier-legal reference package, per tier.
 *
 * Boss1-Boss4 all ran ONE shape: defensive stance, `expose-weakness`, the ordered
 * Guard pair `['second-wind','brace']`, five ordered behaviour rules, +5 items. That
 * shape is T2's. Carrying it to another tier unchecked is exactly the assumption the
 * work order forbids -- and at T1 it is not merely doubtful, it is ILLEGAL:
 * `setAbilityLoadout` refuses `second-wind + brace + any technique` on all six roots
 * at a 22 RP budget. That was measured during preparation, not reasoned about.
 *
 * So the shape is carried where the tier admits it and DEPARTS where it cannot, with
 * the departure declared here rather than discovered in a report:
 *
 *   T1  NO stance (the tier admits none), the SAME ordered Guard pair, and NO
 *       technique -- the guard pair is what makes a T1 row readable against the T2
 *       campaign, and it is the half that survives the budget. 18-20 of 22 RP.
 *   T3  the T2 shape entire, on T3 weapons, kit, core and the range node. 26-28/38.
 *   T4  the T2 shape entire, on the T4 ladder's weapons, kit, core and relic, plus
 *       the `-balanced-t3-a` suffix the qualified T4 builds carry. 26-28/47.
 *
 * `techniques: []` at T1 is an EXPLICIT statement that the package runs none, not an
 * omission -- `resolveSurveyPackage` honours an explicit empty list and would
 * otherwise substitute the tier default.
 */
export interface Boss5TierReference {
  tier: number;
  stance: string | null;
  techniques: string[];
  guards: readonly string[];
  /**
   * The kit, FIXED across every boss at this tier.
   *
   * This is the half that makes a breadth block a portable REFERENCE rather than six
   * unrelated builds. Boss1 and Boss2 carried one deliberately mixed-biome kit across
   * every T2 boss for exactly this reason: "the same build on a different boss" is
   * the only claim that makes two blocks readable against one another at all.
   *
   * Keying the kit to each dungeon's own biome instead -- the obvious construction,
   * and the one the mob surveys use -- silently breaks that. It was tried during
   * preparation and the preflight caught it: the T1 Forest package resolved to 0.22
   * dodge / 0.02 DR against T1 Cave's 0 dodge / 0.13 DR, so a Forest row and a Cave
   * row would have been two different players, and any cross-boss reading of them
   * would have been comparing kits.
   *
   * MOUNTAIN is the family used, because it is the only one authored at every tier:
   * `plains-boots` stops at T2 and `cave-vest` stops at T3, so no analogue of the T2
   * carried kit can even be spelled at T4. That makes this a DIFFERENT kit from the
   * one Boss1-Boss4 carried, and the report must not present these rows as a
   * continuation of those.
   */
  kit: Record<string, string>;
  /** Why this tier departs from the T2 shape, or that it does not. */
  note: string;
}

export const BOSS5_TIER_REFERENCE: Record<number, Boss5TierReference> = {
  1: {
    tier: 1, stance: null, techniques: [], guards: REFERENCE_GUARDS,
    kit: { armor: 'mountain-vest-t1', recovery: 'mountain-charm-t1', mobility: 'mountain-boots-t1' },
    note:
      'Tier 1 admits no stance at all, and the T2 shape is illegal here: measured during '
      + 'preparation, second-wind + brace + ANY technique is refused by setAbilityLoadout '
      + 'on all six roots against the 22 RP budget. The ordered Guard pair is kept (it is '
      + 'what the Boss1-Boss4 rows are built on) and the technique is dropped.',
  },
  3: {
    tier: 3, stance: 'defensive-stance', techniques: ['expose-weakness'], guards: REFERENCE_GUARDS,
    kit: {
      armor: 'mountain-vest-t3', recovery: 'mountain-charm-t3',
      mobility: 'mountain-boots-t3', core: 'core-tempered',
    },
    note: 'The T2 reference shape entire, on T3 weapons, the fixed kit, the core and the range node.',
  },
  4: {
    tier: 4, stance: 'defensive-stance', techniques: ['expose-weakness'], guards: REFERENCE_GUARDS,
    kit: {
      armor: 'mountain-vest-t4', recovery: 'mountain-charm-t4',
      mobility: 'mountain-boots-t4', core: 'core-tempered', relic: 'relic-colossus-heart',
    },
    note:
      'The T2 reference shape entire, on the qualified T4 ladder (weapons, the fixed kit, '
      + 'the core, the relic and the -balanced-t3-a suffix the T4 builds carry).',
  },
};

/** Weapons per tier, from the survey ladder and the qualified T4 set. */
const TIER_WEAPONS: Record<number, Record<string, string>> = {
  1: Object.fromEntries(SURVEY_CLASSES.map((c) => [c.name, c.weapons[0]!])),
  3: Object.fromEntries(SURVEY_CLASSES.map((c) => [c.name, c.weapons[2]!])),
  4: {
    striker: 'volcanic-eruption-lash', squire: 'mountain-warmaul',
    apprentice: 'graveyard-plague-axe', slinger: 'jungle-deathfang-rapier',
    conduit: 'jungle-deathfang-rapier', spirit: 'volcanic-eruption-lash',
  },
};

/** Melee roots chase; ranged roots orbit. Step Back precedes either, as in the route. */
const MELEE = new Set<string>(SURVEY_CLASSES.filter((c) => c.melee).map((c) => c.name));

/**
 * Six tier-legal reference cells against one boss.
 *
 * Built once, from the tier declaration above, so a per-tier package cannot drift
 * between the qualification, the preflight and the run. Only the node, the boss, the
 * cell id and the treatment label vary between bosses.
 */
export function boss5ReferenceCells(opts: {
  nodeId: string; role: string; bossId: string; tier: number; idPrefix: string;
}): Night5Cell[] {
  const ref = BOSS5_TIER_REFERENCE[opts.tier];
  assert(ref, `Boss5: no tier reference declared for tier ${opts.tier}`);
  const t = opts.tier;
  return SURVEY_CLASSES.map((c) => {
    const id = `${opts.idPrefix}-${c.name}`;
    return {
      id,
      nodeId: opts.nodeId,
      tier: t,
      role: opts.role,
      className: c.name,
      alternate: false,
      isDungeon: true,
      treatment: `reference-t${t}`,
      targetTypes: [opts.bossId],
      // An explicit `null` states a neutral package; only an OMITTED field inherits.
      stance: ref.stance,
      abilities: { techniques: [...ref.techniques], guards: [...ref.guards] },
      runeRules: [
        { conditionId: 'always', actionId: 'auto-path-enemy' },
        { conditionId: 'inside-telegraph', actionId: 'step-back' },
        { conditionId: 'in-combat', actionId: MELEE.has(c.name) ? 'chase-enemy' : 'orbit' },
        { conditionId: 'always', actionId: 'avoid-hazards' },
        { conditionId: 'always', actionId: 'wait-for-regen' },
      ],
      upgradeLevel: 5,
      build: {
        id, classRoot: `${c.prefix}-root`, contentTier: t, playerTier: t, gearTier: t,
        skillPath: [
          `${c.prefix}-root`,
          ...(t >= 2 ? [`${c.prefix}-balanced`] : []),
          ...(t >= 3 ? [`${c.prefix}-range-${c.melee ? 'close' : 'mid'}`] : []),
          ...(t >= 4 ? [`${c.prefix}-balanced-t3-a`] : []),
        ],
        // The kit is the TIER's, not the dungeon's biome. See `Boss5TierReference.kit`.
        gearItemIds: { weapon: TIER_WEAPONS[t]![c.name]!, ...ref.kit },
      },
    };
  });
}

// ── Block C: the one bounded Cave refinement ─────────────────────────────────────

/**
 * 104 versus 85 on `chitinous-dreadbore`, on the exact Boss4 Brace references.
 *
 * BOTH ARMS ARE TREATED. 104 is the Boss4 candidate and the supported fallback; it is
 * NOT the authored value, which is still 139. So this block installs an absolute
 * value on each arm and restores 139 afterwards, rather than running one arm bare --
 * a "control" that ran at 139 would re-measure the Boss4 baseline instead of asking
 * this block's question, and the packet is explicit that 139 is not repeated.
 *
 * 85 IS NOT A FITTED OPTIMUM. It is one deliberate further step of about 18.3% below
 * 104 (about 38.8% below the original 139), chosen before the run and never re-picked.
 * It is not a projected win probability and it is not a claim about landed damage:
 * plating subtracts before the scaling, so the measured fall is larger and different
 * per root (`boss5Pressure.test.ts` measures it rather than asserting it).
 */
export const BOSS5_CAVE_BOSS_ID = 'chitinous-dreadbore';
export const BOSS5_CAVE_NODE_ID = 'node-t2-cave-dungeon';
export const BOSS5_CAVE_TIER = 2;
/** The authored value, which neither arm runs and which both arms restore to. */
export const BOSS5_CAVE_AUTHORED_ATTACK = 139;

export interface Boss5CaveArm {
  name: string;
  treatment: string;
  /** The ABSOLUTE attack this arm installs. Never a multiplier applied to a live read. */
  attack: number;
}

export const BOSS5_CAVE_ARMS: readonly Boss5CaveArm[] = [
  { name: 'attack-104', treatment: 'cave-104', attack: 104 },
  { name: 'attack-85', treatment: 'cave-85', attack: 85 },
];

/** Authored Dreadbore fields Block C must NOT move. */
export const BOSS5_CAVE_FIXED = {
  hp: 4375, plating: 12, damageReduction: 0.12, attackCooldown: 3600,
  patternId: 'dreadbore-emergence', patternMultiplier: 1.6, patternCooldownMs: 9000,
  shredPerStack: 2, shredMaxStacks: 6, burrowMs: 3000, burrowTravelSpeed: 380,
  contactSlowMult: 0.5, contactSlowMs: 2000, eruptionRadius: 165, eruptionTelegraphMs: 750,
  recoveryMs: 2200,
} as const;

// ── Blocks ───────────────────────────────────────────────────────────────────────

export interface Boss5Block {
  name: string;
  kind: 'breadth' | 'cave-refinement';
  bossId: string;
  nodeId: string;
  tier: number;
  role: string;
  seed: number;
  capMs: number;
  cells: Night5Cell[];
}

/** One block PER BOSS, so one troublesome encounter cannot consume another's budget. */
const breadthBlocks: Boss5Block[] = BOSS5_ROSTER.map((b) => ({
  name: `t${b.tier}-${b.role}`,
  kind: 'breadth' as const,
  bossId: b.bossId,
  nodeId: b.nodeId,
  tier: b.tier,
  role: b.role,
  seed: BOSS5_SEED,
  capMs: BOSS5_CAPS[b.tier]!,
  cells: boss5ReferenceCells({
    nodeId: b.nodeId, role: b.role, bossId: b.bossId, tier: b.tier,
    idPrefix: `boss5-t${b.tier}-${b.role}`,
  }),
}));

const caveRole = NODE_BIOMES[BOSS5_CAVE_NODE_ID]!.biomeGroup;
const caveBlock: Boss5Block = {
  name: 'cave-refinement',
  kind: 'cave-refinement',
  bossId: BOSS5_CAVE_BOSS_ID,
  nodeId: BOSS5_CAVE_NODE_ID,
  tier: BOSS5_CAVE_TIER,
  role: caveRole,
  seed: BOSS5_CAVE_SEED,
  capMs: BOSS5_CAVE_CAP_MS,
  // The Boss4 Brace reference, built through the Boss1/Boss2/Boss3/Boss4 construction
  // rather than re-spelled. Its `guards` argument is OMITTED, which yields
  // REFERENCE_GUARDS by construction -- re-spelling the list here is exactly the
  // second literal that function exists to prevent, and it is what keeps these rows
  // readable against Boss4's.
  cells: BOSS5_CAVE_ARMS.flatMap((arm) => referencePackageCells({
    nodeId: BOSS5_CAVE_NODE_ID, role: caveRole, bossId: BOSS5_CAVE_BOSS_ID,
    idPrefix: `boss5-cave-${arm.name}`,
    treatmentFor: () => arm.treatment,
  })),
};

export const BOSS5_BLOCKS_DEF: Boss5Block[] = [...breadthBlocks, caveBlock];

export const BOSS5_BLOCKS: Record<string, { cells: Night5Cell[]; durationMs: number; pilotIds: string[] }> =
  Object.fromEntries(BOSS5_BLOCKS_DEF.map((b) => [b.name, {
    cells: b.cells,
    durationMs: b.capMs,
    // NO PILOT, anywhere. A pilot is an undeclared extra observation of the same
    // encounter, and the packet forbids exploratory win-seeking runs. Every encounter
    // here is proven to RUN by the zero-fight preflight instead.
    pilotIds: [],
  }]));

/** The cells of Block C's one arm, named by arm rather than by index. */
export function boss5CaveArmCells(armName: string): Night5Cell[] {
  const arm = BOSS5_CAVE_ARMS.find((a) => a.name === armName);
  assert(arm, `unknown Boss5 cave arm ${armName}`);
  return caveBlock.cells.filter((c) => c.treatment === arm.treatment);
}

export interface Boss5Change {
  bossId: string;
  kind: 'attack';
  field: string;
  before: number;
  after: number;
}

/**
 * Install this cell's arm, process-locally, and hand back its inverse.
 *
 * BLOCK B INSTALLS NOTHING and says so explicitly rather than returning early with an
 * ambiguous null: every breadth observation fights authored source, and its receipt
 * must carry an empty change list that means "nothing was installed", not "nobody
 * looked".
 *
 * BLOCK C INSTALLS AN ABSOLUTE VALUE ON BOTH ARMS. The live authored value is re-read
 * and must equal 139 before either arm writes -- so an arm that ran after a missed
 * restore, or against an edited source, fails loudly instead of being recorded as a
 * clean observation. `restore()` writes 139 back, and the caller must run it in a
 * `finally`, including on exception.
 */
export function installBoss5Treatment(cell: Night5Cell): { changes: Boss5Change[]; restore: () => void } {
  const arm = BOSS5_CAVE_ARMS.find((a) => a.treatment === cell.treatment);
  if (!arm) {
    assert(/^reference-t[134]$/.test(cell.treatment ?? ''),
      `Boss5: cell ${cell.id} carries unknown treatment ${cell.treatment}`);
    return { changes: [], restore() { /* a breadth observation installs nothing */ } };
  }

  const def = MONSTER_DATABASE.get(BOSS5_CAVE_BOSS_ID);
  assert(def, `Boss5: ${BOSS5_CAVE_BOSS_ID} is missing from MONSTER_DATABASE`);
  const live = def.stats.attack;
  assert.equal(live, BOSS5_CAVE_AUTHORED_ATTACK,
    `Boss5/cave-refinement: stats.attack reads ${live} but the packet froze the authored `
    + `${BOSS5_CAVE_AUTHORED_ATTACK} — either the source moved or a previous observation did `
    + 'not restore; this run is not what the packet describes');

  def.stats.attack = arm.attack;
  return {
    changes: [{
      bossId: BOSS5_CAVE_BOSS_ID, kind: 'attack',
      field: `MONSTER_DATABASE['${BOSS5_CAVE_BOSS_ID}'].stats.attack`,
      before: BOSS5_CAVE_AUTHORED_ATTACK, after: arm.attack,
    }],
    restore() { def.stats.attack = BOSS5_CAVE_AUTHORED_ATTACK; },
  };
}

/** Everything about a cell EXCEPT its id and treatment label, as a comparable string. */
export function boss5CellFingerprint(cell: Night5Cell): string {
  return JSON.stringify({
    nodeId: cell.nodeId, tier: cell.tier, role: cell.role, className: cell.className,
    alternate: cell.alternate, isDungeon: cell.isDungeon, targetTypes: cell.targetTypes,
    stance: cell.stance, upgradeLevel: cell.upgradeLevel,
    runeRules: cell.runeRules, abilities: cell.abilities,
    build: { ...cell.build, id: '<per-arm>' },
  });
}

/**
 * The global mastery a prepared bot reaches at each tier, measured during preparation
 * and pinned here so the RP ceiling below is the real one rather than a constant
 * borrowed from T2. A tier whose ladder later grants a different mastery fails the
 * preflight's own budget readback rather than silently loosening this ceiling.
 */
const TIER_MASTERY: Record<number, number> = { 1: 30, 2: 72, 3: 114, 4: 156 };

/**
 * Fail loudly at load time if anything this screen depends on has drifted.
 *
 * Three jobs in one place: the roster really is the active source roster minus a
 * named covered set; every package really is tier-legal and affordable; and Block C's
 * held-fixed Dreadbore fields really are still where the packet says.
 */
export function assertBoss5Definitions(): void {
  // ── The roster, and the covered set it was filtered by. ───────────────────────
  assert(BOSS5_ACTIVE_ROSTER.length > 0, 'Boss5: the active dungeon roster resolved empty');
  for (const id of Object.keys(BOSS5_COVERED)) {
    assert(BOSS5_ACTIVE_ROSTER.some((b) => b.bossId === id),
      `Boss5: ${id} is declared covered but is not an active dungeon boss`);
  }
  for (const id of BOSS5_OUT_OF_SCOPE) {
    assert(!BOSS5_ACTIVE_ROSTER.some((b) => b.bossId === id),
      `Boss5: ${id} is declared out of scope but now appears in DUNGEON_DEFS; the exclusion `
      + 'must be re-decided rather than silently applied');
    assert(MONSTER_DATABASE.has(id), `Boss5: ${id} no longer exists; the exclusion names nothing`);
  }
  assert.equal(BOSS5_ROSTER.length, BOSS5_ACTIVE_ROSTER.length - Object.keys(BOSS5_COVERED).length,
    'Boss5: the breadth roster is not the active roster minus exactly the covered set');
  assert(BOSS5_ROSTER.every((b) => [1, 3, 4].includes(b.tier)),
    'Boss5: the breadth roster reaches a tier with no declared reference or cap');

  // SOURCE COMPATIBILITY of the reused evidence, checked rather than claimed: the one
  // field the 2026-09-19 adoption moved belongs to a boss that appears in no other
  // encounter, so no reused result could have been affected by it.
  for (const b of BOSS5_ACTIVE_ROSTER) {
    if (b.bossId === 'mire-gorged-behemoth') continue;
    const m = MONSTER_DATABASE.get(b.bossId)!;
    assert(m.dotEffect?.debuffId !== 'mire-gorged-venom',
      `Boss5: ${b.bossId} shares the adopted venom effect; the reused evidence is not source-compatible`);
  }

  // ── Blocks: one per boss, six cells, no pilot, a declared cap. ────────────────
  const breadth = BOSS5_BLOCKS_DEF.filter((b) => b.kind === 'breadth');
  assert.equal(breadth.length, BOSS5_ROSTER.length, 'Boss5: one breadth block per missing boss');
  assert.equal(new Set(BOSS5_BLOCKS_DEF.map((b) => b.name)).size, BOSS5_BLOCKS_DEF.length,
    'Boss5: block names must be distinct');

  const budget = (gm: number) => runeBudgetForGlobalMastery(gm);
  for (const block of BOSS5_BLOCKS_DEF) {
    const spec = BOSS5_BLOCKS[block.name]!;
    assert.equal(spec.pilotIds.length, 0, `${block.name}: no pilot is authorized`);
    assert.equal(spec.durationMs, block.capMs, `${block.name}: cap drift`);
    assert.equal(new Set(spec.cells.map((c) => c.id)).size, spec.cells.length,
      `${block.name}: cell ids must be distinct`);

    const def = [...DUNGEON_DEFS.values()].find((d) => d.nodeId === block.nodeId);
    assert(def, `${block.name}: no dungeon def for ${block.nodeId}`);
    assert.equal(def.boss.bossId, block.bossId, `${block.name}: dungeon boss drift`);
    assert.equal(def.biomeTier, block.tier, `${block.name}: dungeon tier drift`);
    assert.equal(NODE_BIOMES[block.nodeId]?.isDungeon, true, `${block.name}: node is not a dungeon`);
    assert.equal(NODE_BIOMES[block.nodeId]?.biomeGroup, block.role, `${block.name}: biome group drift`);

    for (const cell of spec.cells) {
      assert.equal(cell.nodeId, block.nodeId, `${cell.id}: node drift`);
      assert.equal(cell.isDungeon, true, `${cell.id}: must target the dungeon encounter`);
      assert.deepEqual(cell.targetTypes, [block.bossId], `${cell.id}: must target ${block.bossId}`);
      assert.equal(cell.tier, block.tier, `${cell.id}: tier drift`);
      assert.equal(cell.build.playerTier, block.tier, `${cell.id}: player tier drift`);
      assert.equal(cell.build.gearTier, block.tier, `${cell.id}: gear tier drift`);
      // NO FUTURE-TIER GRANTS. Every item must exist and be authored at or below tier.
      for (const id of Object.values(cell.build.gearItemIds)) {
        const recipe = RECIPE_DATABASE.get(id!);
        assert(recipe && ITEM_DATABASE.has(id!), `${cell.id}: missing recipe/item ${id}`);
        assert(recipe.tier <= block.tier, `${cell.id}: ${id} is tier ${recipe.tier}, above ${block.tier}`);
      }
      // The RESOLVED package -- what preparation will actually apply -- is what is
      // checked, not the cell's raw optional fields. Boss1's Sovereign block failed
      // its declared-versus-applied check for exactly that distinction.
      const r = resolveSurveyPackage(cell);
      // WHICH reference a cell must match depends on the block. A breadth block
      // carries its TIER's declared reference; Block C carries the T2 Boss4 Brace
      // reference, which is checked against its own origin further down rather than
      // squeezed into the per-tier table. Reading a tier-2 entry out of that table
      // would be inventing a declaration the screen never made.
      const guards = block.kind === 'breadth'
        ? [...BOSS5_TIER_REFERENCE[block.tier]!.guards]
        : [...REFERENCE_GUARDS];
      if (block.kind === 'breadth') {
        const ref = BOSS5_TIER_REFERENCE[block.tier]!;
        assert.equal(r.stance, ref.stance, `${cell.id}: stance is not the tier reference`);
        assert.deepEqual(r.abilities.guards, [...ref.guards],
          `${cell.id}: the Guard list is not the tier reference — ORDER included`);
        assert.deepEqual(r.abilities.techniques, [...ref.techniques],
          `${cell.id}: the technique list is not the tier reference`);
      }
      assert.equal(r.runeRules.length, 5, `${cell.id}: the reference carries five behaviour rules`);
      assert.equal(r.upgradeLevel, 5, `${cell.id}: upgrade level drift`);
      // A rule that names a Guard would make the carried package something other than
      // the default-trigger reference every earlier boss screen ran.
      assert.equal(r.runeRules.filter((x) => guards.includes(x.actionId)).length, 0,
        `${cell.id}: a Rune rule names a Guard`);
      // RP: the budget stance, abilities and rules all draw on. The global mastery a
      // prepared bot actually reaches is tier-dependent, so the affordable ceiling is
      // asserted at the LOWEST mastery the tier ladder grants rather than a constant.
      const cost = runicPointLoadoutCost({
        rules: withReferenceAbilityWiring(r.runeRules as never, r.abilities), abilities: r.abilities,
        stances: r.stance ? [r.stance] : [], rites: [],
      });
      assert(cost <= budget(TIER_MASTERY[block.tier]!),
        `${cell.id}: the package costs ${cost} RP against the tier's ${budget(TIER_MASTERY[block.tier]!)} budget`);
    }
  }

  // ── THE KIT IS FIXED WITHIN A TIER, which is what makes a block a portable
  //    REFERENCE rather than six unrelated builds.
  //
  //    Asserted rather than trusted to the constructor, because the biome-keyed
  //    alternative is the natural thing to write and it silently produces a different
  //    player per dungeon. Preparation hit exactly that, and the preflight is where it
  //    surfaced; this is the cheaper place to catch it next time.
  for (const tier of [1, 3, 4]) {
    const ref = BOSS5_TIER_REFERENCE[tier]!;
    const atTier = breadth.filter((b) => b.tier === tier);
    if (atTier.length === 0) continue;
    for (const block of atTier) {
      for (const cell of block.cells) {
        const { weapon, ...kit } = cell.build.gearItemIds as Record<string, string>;
        assert(weapon.length > 0, `${cell.id}: no weapon`);
        assert.deepEqual(kit, ref.kit,
          `${cell.id}: the kit is not tier ${tier}'s fixed reference kit — a per-biome kit makes `
          + 'every block a different player and no cross-boss reading of these rows would be valid');
      }
    }
    // The six roots differ ONLY in the weapon, which is the root's own.
    const weapons = new Set(atTier.flatMap((b) => b.cells.map((c) => c.build.gearItemIds.weapon)));
    assert(weapons.size <= 6, `tier ${tier}: more than six distinct weapons across the tier's blocks`);
  }

  // ── Block B specifics. ────────────────────────────────────────────────────────
  for (const block of breadth) {
    const boss = BOSS5_ROSTER.find((b) => b.bossId === block.bossId)!;
    const m = MONSTER_DATABASE.get(block.bossId)!;
    assert.equal(m.stats.hp, boss.stats.hp, `${block.name}: boss hp drift`);
    assert.equal(m.stats.attack, boss.stats.attack, `${block.name}: boss attack drift`);
    assert.equal(m.stats.plating, boss.stats.plating, `${block.name}: boss plating drift`);
    assert.equal(m.stats.damageReduction, boss.stats.damageReduction, `${block.name}: boss dr drift`);
    assert.equal(block.seed, BOSS5_SEED, `${block.name}: breadth blocks carry the one declared seed`);
    assert.equal(block.cells.length, 6, `${block.name}: six tier-legal reference packages`);
    assert.equal(new Set(block.cells.map((c) => c.className)).size, 6,
      `${block.name}: the six roots must be distinct`);
    // Every breadth cell installs NOTHING, checked through the real seam.
    for (const cell of block.cells) {
      assert.deepEqual(installBoss5Treatment(cell).changes, [],
        `${cell.id}: a breadth observation must install nothing`);
    }
  }

  // ── Block C specifics. ────────────────────────────────────────────────────────
  assert.equal(caveBlock.cells.length, 12, 'cave-refinement: 6 roots x 2 arms = 12 cells');
  assert.equal(caveBlock.seed, BOSS5_CAVE_SEED, 'cave-refinement: the carried seed must not drift');
  assert.equal(caveBlock.capMs, BOSS5_CAVE_CAP_MS, 'cave-refinement: Boss4\'s cap is carried unchanged');
  assert.equal(BOSS5_CAVE_ARMS.length, 2, 'cave-refinement: exactly two arms; no scalar grid');
  assert.equal(new Set(BOSS5_CAVE_ARMS.map((a) => a.attack)).size, 2, 'cave-refinement: the arms must differ');
  const [hi, lo] = BOSS5_CAVE_ARMS;
  assert.equal(hi!.attack, 104, 'cave-refinement: the upper arm is the Boss4 candidate, 104');
  assert.equal(lo!.attack, 85, 'cave-refinement: the lower arm is the declared 85');
  assert(lo!.attack < hi!.attack, 'cave-refinement: the lower arm must reduce pressure');
  assert(hi!.attack < BOSS5_CAVE_AUTHORED_ATTACK,
    'cave-refinement: NEITHER arm may be the authored 139; the packet does not repeat that baseline');
  assert(lo!.attack >= 1, 'cave-refinement: the arm must leave a live mechanic, not delete it');

  const dread = MONSTER_DATABASE.get(BOSS5_CAVE_BOSS_ID)!;
  assert.equal(dread.stats.attack, BOSS5_CAVE_AUTHORED_ATTACK,
    `cave-refinement: the authored attack is ${dread.stats.attack}, not the frozen ${BOSS5_CAVE_AUTHORED_ATTACK}`);
  assert.equal(dread.stats.hp, BOSS5_CAVE_FIXED.hp, 'cave-refinement: boss HP must not move');
  assert.equal(dread.stats.plating, BOSS5_CAVE_FIXED.plating, 'cave-refinement: boss plating must not move');
  assert.equal(dread.stats.damageReduction, BOSS5_CAVE_FIXED.damageReduction, 'cave-refinement: boss DR must not move');
  assert.equal(dread.stats.attackCooldown, BOSS5_CAVE_FIXED.attackCooldown, 'cave-refinement: attack cadence must not move');
  assert.equal(dread.appliesPlatingShred?.platingPerStack, BOSS5_CAVE_FIXED.shredPerStack, 'cave-refinement: shred must not move');
  assert.equal(dread.appliesPlatingShred?.maxStacks, BOSS5_CAVE_FIXED.shredMaxStacks, 'cave-refinement: shred cap must not move');
  assert.equal(dread.dotEffect, undefined, 'cave-refinement: the Dreadbore authors no DoT; the arms assumed none');
  const bp = dread.bossPattern!;
  assert.equal(bp.id, BOSS5_CAVE_FIXED.patternId, 'cave-refinement: pattern identity drift');
  assert.equal(bp.damageMultiplier, BOSS5_CAVE_FIXED.patternMultiplier,
    'cave-refinement: the pattern multiplier must not move — only attack does');
  assert.equal(bp.cooldownMs, BOSS5_CAVE_FIXED.patternCooldownMs, 'cave-refinement: pattern cadence must not move');
  const conceal = bp.steps.find((s): s is Extract<typeof s, { kind: 'conceal' }> => s.kind === 'conceal')!;
  assert.equal(conceal.durationMs, BOSS5_CAVE_FIXED.burrowMs, 'cave-refinement: burrow ceiling must not move');
  assert.equal(conceal.travelSpeed, BOSS5_CAVE_FIXED.burrowTravelSpeed, 'cave-refinement: burrow speed must not move');
  assert.equal(conceal.contactSlow?.speedMult, BOSS5_CAVE_FIXED.contactSlowMult, 'cave-refinement: contact slow must not move');
  assert.equal(conceal.contactSlow?.durationMs, BOSS5_CAVE_FIXED.contactSlowMs, 'cave-refinement: contact slow window must not move');
  const impact = bp.steps.find((s): s is Extract<typeof s, { kind: 'impact' }> => s.kind === 'impact')!;
  assert.equal(impact.damageMult, 1.0, 'cave-refinement: the Eruption step multiplier must not move');
  assert.equal(impact.radius, BOSS5_CAVE_FIXED.eruptionRadius, 'cave-refinement: Eruption radius must not move');
  assert.equal(impact.telegraphMs, BOSS5_CAVE_FIXED.eruptionTelegraphMs, 'cave-refinement: Eruption tell must not move');
  assert.equal(impact.rawDamage, undefined,
    'cave-refinement: Eruption gained a rawDamage override, which would bypass the treated attack entirely');
  const recovery = bp.steps.find((s): s is Extract<typeof s, { kind: 'recovery' }> => s.kind === 'recovery')!;
  assert.equal(recovery.durationMs, BOSS5_CAVE_FIXED.recoveryMs, 'cave-refinement: recovery window must not move');

  // The attack field must reach the fight ONLY through the spawn-time stat. A second
  // path would multiply a number the arm has already installed.
  assert.equal((dread as { engageSequence?: unknown }).engageSequence, undefined,
    'cave-refinement: an engageSequence would give attack a second, unmeasured path');
  assert.equal((dread as { scalesWithAmbientRamp?: unknown }).scalesWithAmbientRamp, undefined,
    'cave-refinement: an ambient ramp would scale the treated attack by node state');
  assert(!JSON.stringify(dread.bossScript).includes('enrage'),
    'cave-refinement: an enrage action would multiply the treated attack mid-fight');

  // The arms must be the SAME player package twice; the treatment is on the boss.
  const [armA, armB] = BOSS5_CAVE_ARMS;
  const ca = boss5CaveArmCells(armA!.name), cb = boss5CaveArmCells(armB!.name);
  assert.equal(ca.length, 6, 'cave-refinement: six cells on the 104 arm');
  assert.equal(cb.length, 6, 'cave-refinement: six cells on the 85 arm');
  for (let i = 0; i < 6; i++) {
    const a = ca[i]!, b = cb[i]!;
    assert.equal(a.className, b.className, `cave-refinement: arms must pair root-for-root at index ${i}`);
    assert.equal(boss5CellFingerprint(a), boss5CellFingerprint(b),
      `cave-refinement/${a.className}: the arms differ in the PLAYER package`);
    assert.deepEqual(a.abilities?.guards, [...REFERENCE_GUARDS],
      `cave-refinement/${a.className}: the carried Guard list is not the Boss4 Brace reference`);
  }
}

/** The screen's size, derived rather than written down. */
export function boss5ObservationCount(): { breadth: number; cave: number; total: number } {
  const breadth = BOSS5_BLOCKS_DEF
    .filter((b) => b.kind === 'breadth')
    .reduce((n, b) => n + b.cells.length, 0);
  const cave = caveBlock.cells.length;
  return { breadth, cave, total: breadth + cave };
}
