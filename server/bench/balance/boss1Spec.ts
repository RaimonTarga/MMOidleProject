import assert from 'node:assert/strict';
import { DUNGEON_DEFS, MONSTER_DATABASE, NODE_BIOMES } from '@mmo-idle/shared';
import { NIGHT5_BLOCKS, type Night5Cell } from './night5Spec';

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

export const BOSS1_BLOCKS: Record<string, { cells: Night5Cell[]; durationMs: number; pilotIds: string[] }> = {
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
