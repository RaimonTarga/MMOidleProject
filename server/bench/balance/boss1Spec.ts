import assert from 'node:assert/strict';
import {
  DUNGEON_DEFS, MONSTER_DATABASE, NODE_BIOMES,
  runicPointLoadoutCost, runeBudgetForGlobalMastery,
} from '@mmo-idle/shared';
import { NIGHT5_BLOCKS, type Night5Cell } from './night5Spec';
import { SURVEY_CLASSES } from './ttkSurveySpec';

/**
 * Boss1 — the first boss numerical screen.
 *
 * ONE boss, six tier-legal roots, two declared seeds: 12 attempts. It installs
 * nothing; the boss and its escorts are fought at authored source values.
 *
 * Why only one boss, when the starter packet proposed two:
 *
 *   The proposed earlier-tier slot (`apex-timberclaw`, T2 forest) cannot produce a
 *   pacing number. Measured 2026-09-18 at `bdee5dca`, EVERY T2 boss is 0 wins in
 *   126 attempts, and `apex-timberclaw` is among the cheapest of the seven -- so it
 *   would re-measure the documented early-tier wall, which is exactly the stale-band
 *   error the packet warns against. T1 is already on record at 0/30. That wall is
 *   now its own main workstream; it is NOT this screen's question.
 *
 *   The T4 Sovereign is unaffected: 12/12 wins on qualified tier-legal builds in
 *   preparation. It is also the case the packet exists to test, because it reuses
 *   three ordinary species the mob adoption changed.
 *
 * Seeds are real here. The Sovereign's `raisesDead` corpse selection and its
 * `spawn-adds` offsets consume randomness, and two seeds produced different
 * elapsed times and damage taken in preparation. That is NOT true of every boss:
 * `apex-timberclaw` has no adds, a fixed spawn, and deterministic evasion, so two
 * seeds against it produced byte-identical outcomes. Never declare seeds for a
 * no-add boss without checking that they move anything.
 */

export const BOSS1_BOSS_ID = 'charnel-crown-sovereign';
export const BOSS1_NODE_ID = 'node-t4-graveyard-dungeon';
export const BOSS1_TIER = 4;
export const BOSS1_ROLE = 'graveyard';

/** Fresh predeclared seeds; this is a new question, so nothing is reused. */
export const BOSS1_SEEDS = [94011, 94019] as const;

/**
 * Per-fight cap, resolved from the Sovereign's own mechanic loop rather than
 * inherited from a mob window.
 *
 * Its full cycle needs the 50% phase (Mass Resurrection) to fire, which means
 * removing half of a 19,499 HP pool, on top of the engage-phase adds and the
 * 8 s `raisesDead` cadence. Full kills measured 36-104 s in preparation, so 600 s
 * clears the whole cycle with very large margin and a timeout genuinely means
 * "could not finish", not "was cut off mid-phase".
 */
export const BOSS1_CAP_MS = 600000;

/**
 * The three escorts the adoption changed, at their adopted authored values.
 *
 * This is the receipt question the screen exists to answer: the Sovereign summons
 * ordinary species whose HP moved, so every observation must record what it
 * actually fought. If a runtime escort disagrees with these, the run is INVALID
 * and is not reinterpreted.
 */
export const BOSS1_ESCORTS: Record<string, { hp: number; attack: number }> = {
  'bone-crawler': { hp: 1235, attack: 85 },
  'plague-hound': { hp: 1901, attack: 105 },
  'carrion-vulture': { hp: 1616, attack: 95 },
};

/** The boss's own authored block, pinned so a silent stat edit invalidates the screen. */
export const BOSS1_BOSS_STATS = { hp: 19499, attack: 115, plating: 14, damageReduction: 0.08 };

/**
 * Six roots, from the QUALIFIED T4 graveyard builds Durability37 already uses
 * (`NIGHT5_BLOCKS.t4a`, the `-03` set), re-identified and re-pointed at the
 * dungeon node. Reusing them is the point: the boss is then measured against the
 * same tier-legal preparation as the ordinary Graveyard T4 family in D37 Block I,
 * so the two are readable against one another.
 *
 * Nothing here is over-equipped for the tier: skill-path depth, gear tier, upgrade
 * level and relic are whatever the T4 ladder already qualified.
 */
export const BOSS1_CELLS: Night5Cell[] = (NIGHT5_BLOCKS.t4a!.cells as Night5Cell[])
  .filter((c) => c.role === BOSS1_ROLE && c.nodeId === 'node-t4-graveyard-03')
  .map((c) => {
    const id = `boss1-sovereign-${c.className}`;
    return {
      ...c,
      id,
      nodeId: BOSS1_NODE_ID,
      isDungeon: true,
      treatment: 'boss-baseline',
      targetTypes: [BOSS1_BOSS_ID],
      build: {
        ...c.build,
        id,
        skillPath: [...c.build.skillPath],
        gearItemIds: { ...c.build.gearItemIds },
      },
    };
  });

// ── Earlier-tier slot: Apex Timberclaw, RESTORED on an explicit reference build.
//
// It was withdrawn while its benchmark setup was unexplained. That is now closed:
// the two-case reference check established that the failure belonged to the legacy
// PACKAGE, not the boss. Case A -- the historical V1i Spirit package -- killed it at
// 30,300 ms with authoritative kill evidence and 24.9% HP to spare, while Case B,
// the legacy package on the same skill path, died at 12,900 ms with 32.8% of the
// boss removed.
//
// So this slot uses EXPLICIT legal reference builds rather than the scorer defaults
// that produced Case B. The package SHAPE is the corroborated one: defensive stance,
// Expose Weakness, Second Wind + Brace, and the five ordered behaviour rules, at
// 28 of 30 RP.
//
// ONLY the Spirit cell is historically corroborated. The other five roots are the
// same shape carried onto each root's tier-legal weapon; they are a reference
// CONSTRUCTION, not evidence, and the report must say so.

/** T2 weapons per root, from the survey ladder. Spirit's is the historical axe. */
const TIMBERCLAW_WEAPON: Record<string, string> = {
  striker: 'gale-needle', squire: 'quake-hammer', apprentice: 'ruinous-axe',
  slinger: 'jungle-stinger-rapier', conduit: 'ruinous-axe', spirit: 'ruinous-axe',
};
/** Melee roots chase; ranged roots orbit. Step Back precedes either, as in the route. */
const TIMBERCLAW_MELEE = new Set(['striker', 'squire']);
/** The corroborated kit. Deliberately mixed-biome -- it is what was actually worn. */
export const BOSS1_TIMBERCLAW_KIT = {
  armor: 'cave-vest-t2', recovery: 'mountain-charm-t2',
  mobility: 'plains-boots-t2', core: 'core-tempered',
} as const;
/**
 * The reference shape's ordered Guard list: a Recovery Guard, then a burst-mitigation
 * Guard. Named so a screen that substitutes one of them states what it departed from
 * rather than re-spelling the baseline.
 */
export const REFERENCE_GUARDS = ['second-wind', 'brace'] as const;
export const BOSS1_TIMBERCLAW_BOSS_ID = 'apex-timberclaw';
export const BOSS1_TIMBERCLAW_NODE_ID = 'node-t2-forest-dungeon';
/** Seeds are inert for this boss: no adds, fixed spawn, deterministic evasion. */
export const BOSS1_TIMBERCLAW_SEEDS = [96011] as const;
export const BOSS1_TIMBERCLAW_CAP_MS = 300000;

/**
 * The six explicit reference packages, built once and reusable against any T2 boss.
 *
 * Boss2 carries these exact packages onto the six remaining T2 bosses, so the
 * construction is exported rather than copied: a second literal would let the two
 * screens drift apart silently, and "the same build on a different boss" is the
 * only claim that makes the two readable together at all.
 *
 * Everything that defines the package -- skill path, weapon, kit, upgrade level,
 * stance, abilities and the five ORDERED rules -- comes from here. Only the node,
 * the boss it targets, the cell id and the treatment label vary.
 */
export function referencePackageCells(opts: {
  nodeId: string; role: string; bossId: string; idPrefix: string;
  treatmentFor: (className: string) => string;
  /**
   * The ordered Guard list, for a screen that varies ONE component of this package
   * and nothing else.
   *
   * Omitting it yields the reference shape Boss1 and Boss2 froze, byte for byte --
   * which is the point: Boss3 substitutes `brace` for `cleanse` at index 1 by
   * passing this, and a second literal copy of the whole construction (the thing
   * this function exists to prevent) is never created. ORDER is load-bearing and is
   * preserved as given: guards are walked top-to-bottom and the first eligible one
   * claims the one-activation-per-window gate.
   */
  guards?: readonly string[];
}): Night5Cell[] {
  const guards = opts.guards ?? REFERENCE_GUARDS;
  return SURVEY_CLASSES.map((c) => {
    const id = `${opts.idPrefix}-${c.name}`;
    return {
      id,
      nodeId: opts.nodeId,
      tier: 2,
      role: opts.role,
      className: c.name,
      alternate: false,
      isDungeon: true,
      treatment: opts.treatmentFor(c.name),
      targetTypes: [opts.bossId],
      stance: 'defensive-stance',
      abilities: { techniques: ['expose-weakness'], guards: [...guards] },
      runeRules: [
        { conditionId: 'always', actionId: 'auto-path-enemy' },
        { conditionId: 'inside-telegraph', actionId: 'step-back' },
        { conditionId: 'in-combat', actionId: TIMBERCLAW_MELEE.has(c.name) ? 'chase-enemy' : 'orbit' },
        { conditionId: 'always', actionId: 'avoid-hazards' },
        { conditionId: 'always', actionId: 'wait-for-regen' },
      ],
      upgradeLevel: 5,
      build: {
        id, classRoot: `${c.prefix}-root`, contentTier: 2, playerTier: 2, gearTier: 2,
        skillPath: [`${c.prefix}-root`, `${c.prefix}-heavy`],
        gearItemIds: { weapon: TIMBERCLAW_WEAPON[c.name]!, ...BOSS1_TIMBERCLAW_KIT },
      },
    };
  });
}

const timberclawCells: Night5Cell[] = referencePackageCells({
  nodeId: BOSS1_TIMBERCLAW_NODE_ID, role: 'forest', bossId: BOSS1_TIMBERCLAW_BOSS_ID,
  idPrefix: 'boss1-timberclaw',
  treatmentFor: (name) => (name === 'spirit' ? 'reference-corroborated' : 'reference-constructed'),
});

export const BOSS1_BLOCKS: Record<string, { cells: Night5Cell[]; durationMs: number; pilotIds: string[] }> = {
  timberclaw: {
    cells: timberclawCells,
    durationMs: BOSS1_TIMBERCLAW_CAP_MS,
    // No pilot fight: the reference check already proved this encounter runs, and a
    // pilot would be an undeclared seventh observation of the same boss.
    pilotIds: [],
  },
  sovereign: {
    cells: BOSS1_CELLS,
    durationMs: BOSS1_CAP_MS,
    // Striker is the pilot: it is the fastest clean kill in preparation, so the
    // pilot proves the encounter really runs without spending a long window.
    pilotIds: BOSS1_CELLS.filter((c) => c.className === 'striker').map((c) => c.id),
  },
};

/**
 * Boss1 installs NOTHING. Both the boss and its escorts are authored source, so
 * there is no overlay to restore and every observation's `hpTreatment` must be
 * empty. This exists so a caller expecting the usual overlay contract gets an
 * explicit no-op rather than a silently different one.
 */
export function installBoss1Treatment(): null {
  return null;
}

/** Fail loudly at load time if the screen's frozen identities have drifted. */
export function assertBoss1Definitions(): void {
  const boss = MONSTER_DATABASE.get(BOSS1_BOSS_ID);
  assert(boss?.isBoss, `${BOSS1_BOSS_ID} is missing or is not a boss`);
  assert.equal(boss.stats.hp, BOSS1_BOSS_STATS.hp, 'boss hp drift');
  assert.equal(boss.stats.attack, BOSS1_BOSS_STATS.attack, 'boss attack drift');
  assert.equal(boss.stats.plating, BOSS1_BOSS_STATS.plating, 'boss plating drift');
  assert.equal(boss.stats.damageReduction, BOSS1_BOSS_STATS.damageReduction, 'boss dr drift');

  // The dungeon must actually hold this boss, read from DUNGEON_DEFS rather than
  // the node record: most dungeon nodes leave `bossTypeId` unset and inherit from
  // the biome pool, so the node alone finds nothing.
  const def = [...DUNGEON_DEFS.values()].find((d) => d.nodeId === BOSS1_NODE_ID);
  assert(def, `no dungeon def for ${BOSS1_NODE_ID}`);
  assert.equal(def.boss.bossId, BOSS1_BOSS_ID, 'dungeon boss drift');
  assert.equal(def.biomeTier, BOSS1_TIER, 'dungeon tier drift');
  assert.equal(NODE_BIOMES[BOSS1_NODE_ID]?.biomeTier, BOSS1_TIER, 'node tier drift');
  assert.equal(NODE_BIOMES[BOSS1_NODE_ID]?.isDungeon, true, 'node is not a dungeon');

  for (const [id, expected] of Object.entries(BOSS1_ESCORTS)) {
    const m = MONSTER_DATABASE.get(id);
    assert(m, `escort ${id} missing`);
    assert.equal(m.stats.hp, expected.hp, `${id} hp drift (adoption value)`);
    assert.equal(m.stats.attack, expected.attack, `${id} attack drift`);
  }

  // The escorts named above must be the ones the script actually summons, or the
  // receipt rule is checking species the fight never produces.
  const summoned = new Set<string>();
  for (const phase of (boss as { bossScript?: { phases?: { actions?: { type: string; monsterTypeId?: string }[] }[] } }).bossScript?.phases ?? []) {
    for (const action of phase.actions ?? []) {
      if (action.type === 'spawn-adds' && action.monsterTypeId) summoned.add(action.monsterTypeId);
    }
  }
  assert.deepEqual([...summoned].sort(), Object.keys(BOSS1_ESCORTS).sort(),
    'the script\'s spawn-adds species must be exactly the declared escorts');

  // ── Earlier slot: Apex Timberclaw, on explicit reference builds.
  const tc = MONSTER_DATABASE.get(BOSS1_TIMBERCLAW_BOSS_ID);
  assert(tc?.isBoss, `${BOSS1_TIMBERCLAW_BOSS_ID} missing or not a boss`);
  assert.equal(tc.stats.hp, 3750, 'timberclaw hp drift');
  assert.equal(tc.stats.attack, 44, 'timberclaw attack drift');
  const tcDef = [...DUNGEON_DEFS.values()].find((d) => d.nodeId === BOSS1_TIMBERCLAW_NODE_ID);
  assert(tcDef && tcDef.boss.bossId === BOSS1_TIMBERCLAW_BOSS_ID, 'timberclaw dungeon drift');
  const tcCells = BOSS1_BLOCKS['timberclaw']!.cells;
  assert.equal(tcCells.length, 6, `timberclaw: six roots, got ${tcCells.length}`);
  assert.equal(new Set(tcCells.map((c) => c.className)).size, 6, 'timberclaw roots must be distinct');
  const corroborated = tcCells.filter((c) => c.treatment === 'reference-corroborated');
  assert.equal(corroborated.length, 1, 'exactly one cell is historically corroborated');
  assert.equal(corroborated[0]!.className, 'spirit', 'the corroborated cell is the Spirit reference');
  for (const c of tcCells) {
    assert.equal(c.isDungeon, true, `${c.id}: must target the dungeon encounter`);
    assert.equal(c.stance, 'defensive-stance', `${c.id}: reference shape is the defensive stance`);
    assert.deepEqual(c.abilities, { techniques: ['expose-weakness'], guards: ['second-wind', 'brace'] },
      `${c.id}: reference ability shape drift`);
    assert.equal(c.runeRules?.length, 5, `${c.id}: reference carries five behaviour rules`);
    assert.equal(c.upgradeLevel, 5, `${c.id}: upgrade level drift`);
    const cost = runicPointLoadoutCost({
      rules: (c.runeRules ?? []) as never, abilities: c.abilities!,
      stances: c.stance ? [c.stance] : [], rites: [],
    });
    assert(cost <= runeBudgetForGlobalMastery(72),
      `${c.id}: reference package costs ${cost} RP against a 30 budget`);
  }
  // The Spirit cell must still BE the corroborated historical package.
  const spiritCell = corroborated[0]!;
  assert.equal(spiritCell.build.gearItemIds.weapon, 'ruinous-axe', 'the corroborated weapon is the axe');
  assert.equal(spiritCell.build.gearItemIds.armor, 'cave-vest-t2', 'corroborated kit drift');

  assert.equal(BOSS1_CELLS.length, 6, `expected six roots, got ${BOSS1_CELLS.length}`);
  assert.equal(new Set(BOSS1_CELLS.map((c) => c.className)).size, 6, 'roots must be distinct');
  assert.equal(new Set(BOSS1_SEEDS).size, BOSS1_SEEDS.length, 'seeds must be distinct');
  for (const c of BOSS1_CELLS) {
    assert.equal(c.nodeId, BOSS1_NODE_ID, `${c.id}: node drift`);
    assert.equal(c.tier, BOSS1_TIER, `${c.id}: tier drift`);
    assert.equal(c.isDungeon, true, `${c.id}: must target the dungeon node`);
    assert.equal(c.build.playerTier, BOSS1_TIER, `${c.id}: player tier drift`);
    assert.equal(c.build.gearTier, BOSS1_TIER, `${c.id}: gear tier drift`);
  }
}
