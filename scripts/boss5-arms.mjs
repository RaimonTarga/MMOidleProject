import assert from 'node:assert/strict';

/**
 * The Boss5 blocks and Cave arms, declared ONCE for both the preflight and the run.
 *
 * These values mirror `server/bench/balance/boss5Spec.ts`. The mirror is checked at
 * runtime by both scripts (each reads the manifest and the receipts the TypeScript
 * spec produced and asserts against these), so it cannot drift silently -- a
 * preflight that qualified one roster while the run drove another is exactly the
 * class of defect the declared-versus-applied checker exists to catch, one level up.
 *
 * WHY A HAND LIST OF NINETEEN BLOCKS. The TypeScript side DERIVES its roster from
 * `DUNGEON_DEFS` minus a named covered set, and `boss5Matrix.test.ts` re-derives it a
 * second, independent way. This is the third statement, and it is the only one a
 * reviewer can read without running anything: if a boss silently leaves the roster,
 * these three disagree and the run refuses to start.
 *
 * TWO KINDS OF BLOCK, and the difference is load-bearing:
 *
 *   `breadth`         installs NOTHING. Six tier-legal reference packages against a
 *                     boss with no current evidence, at authored source.
 *   `cave-refinement` installs an ABSOLUTE attack on BOTH arms. 104 is the Boss4
 *                     candidate, not authored source (which is 139), so there is no
 *                     untreated arm here and every receipt must carry a treatment.
 */

/** Block B's predeclared seed. Fresh: it asks a new question. */
export const BOSS5_SEED = 99011;
/** Block C's carried seed: Boss2's, through Boss3 and Boss4. */
export const BOSS5_CAVE_SEED = 98011;
/** The Dreadbore's AUTHORED attack, which neither Cave arm runs and both restore to. */
export const BOSS5_CAVE_AUTHORED_ATTACK = 139;

/**
 * Per-fight caps by tier, derived from each tier's own pools rather than inherited.
 * `limitMs` on a block is the wall-clock watchdog, not a simulated cap.
 */
export const BOSS5_CAPS = { 1: 300000, 3: 600000, 4: 900000 };

export const BOSS5_BLOCKS = [
 {name:'t1-cave',kind:'breadth',bossId:'obsidian-broodmother',nodeId:'node-t1-cave-dungeon',tier:1,role:'cave',seed:99011,capMs:300000,cells:6,bossAttack:40,bossHp:1750,limitMs:40*60000},
 {name:'t1-forest',kind:'breadth',bossId:'gnarled-greatbear',nodeId:'node-t1-forest-dungeon',tier:1,role:'forest',seed:99011,capMs:300000,cells:6,bossAttack:24,bossHp:1800,limitMs:40*60000},
 {name:'t1-mountain',kind:'breadth',bossId:'crag-behemoth',nodeId:'node-t1-mountain-dungeon',tier:1,role:'mountain',seed:99011,capMs:300000,cells:6,bossAttack:56,bossHp:2100,limitMs:40*60000},
 {name:'t1-plains',kind:'breadth',bossId:'tusked-razorback',nodeId:'node-t1-plains-dungeon',tier:1,role:'plains',seed:99011,capMs:300000,cells:6,bossAttack:34,bossHp:1700,limitMs:40*60000},
 {name:'t1-swamp',kind:'breadth',bossId:'grave-toadeater',nodeId:'node-t1-swamp-dungeon',tier:1,role:'swamp',seed:99011,capMs:300000,cells:6,bossAttack:13,bossHp:2100,limitMs:40*60000},
 {name:'t3-cave',kind:'breadth',bossId:'deep-core-burrow-gorger',nodeId:'node-t3-cave-dungeon',tier:3,role:'cave',seed:99011,capMs:600000,cells:6,bossAttack:196,bossHp:12895,limitMs:60*60000},
 {name:'t3-desert',kind:'breadth',bossId:'dune-carapace-monarch',nodeId:'node-t3-desert-dungeon',tier:3,role:'desert',seed:99011,capMs:600000,cells:6,bossAttack:196,bossHp:11940,limitMs:60*60000},
 {name:'t3-jungle',kind:'breadth',bossId:'apex-bramble-slasher',nodeId:'node-t3-jungle-dungeon',tier:3,role:'jungle',seed:99011,capMs:600000,cells:6,bossAttack:104,bossHp:11701,limitMs:60*60000},
 {name:'t3-mountain',kind:'breadth',bossId:'crag-gorged-horn-behemoth',nodeId:'node-t3-mountain-dungeon',tier:3,role:'mountain',seed:99011,capMs:600000,cells:6,bossAttack:204,bossHp:12418,limitMs:60*60000},
 {name:'t3-swamp',kind:'breadth',bossId:'rot-spore-croc-behemoth',nodeId:'node-t3-swamp-dungeon',tier:3,role:'swamp',seed:99011,capMs:600000,cells:6,bossAttack:52,bossHp:11940,limitMs:60*60000},
 {name:'t3-tundra',kind:'breadth',bossId:'frost-plated-rime-mammoth',nodeId:'node-t3-tundra-dungeon',tier:3,role:'tundra',seed:99011,capMs:600000,cells:6,bossAttack:204,bossHp:12895,limitMs:60*60000},
 {name:'t3-volcanic',kind:'breadth',bossId:'cinder-shell-magma-salamander',nodeId:'node-t3-volcanic-dungeon',tier:3,role:'volcanic',seed:99011,capMs:600000,cells:6,bossAttack:179,bossHp:11462,limitMs:60*60000},
 {name:'t4-desert',kind:'breadth',bossId:'dune-throne-sovereign',nodeId:'node-t4-desert-dungeon',tier:4,role:'desert',seed:99011,capMs:900000,cells:6,bossAttack:185,bossHp:17893,limitMs:90*60000},
 {name:'t4-jungle',kind:'breadth',bossId:'verdant-crown-predator',nodeId:'node-t4-jungle-dungeon',tier:4,role:'jungle',seed:99011,capMs:900000,cells:6,bossAttack:117,bossHp:18352,limitMs:90*60000},
 {name:'t4-mountain',kind:'breadth',bossId:'iron-crest-titan',nodeId:'node-t4-mountain-dungeon',tier:4,role:'mountain',seed:99011,capMs:900000,cells:6,bossAttack:228,bossHp:19499,limitMs:90*60000},
 {name:'t4-trench',kind:'breadth',bossId:'elder-trench-serpent',nodeId:'node-t4-trench-dungeon',tier:4,role:'trench',seed:99011,capMs:900000,cells:6,bossAttack:143,bossHp:21793,limitMs:90*60000},
 {name:'t4-tundra',kind:'breadth',bossId:'glacial-patriarch',nodeId:'node-t4-tundra-dungeon',tier:4,role:'tundra',seed:99011,capMs:900000,cells:6,bossAttack:189,bossHp:22940,limitMs:90*60000},
 {name:'t4-volcanic',kind:'breadth',bossId:'caldera-sovereign',nodeId:'node-t4-volcanic-dungeon',tier:4,role:'volcanic',seed:99011,capMs:900000,cells:6,bossAttack:130,bossHp:20646,limitMs:90*60000},
 {name:'cave-refinement',kind:'cave-refinement',bossId:'chitinous-dreadbore',nodeId:'node-t2-cave-dungeon',tier:2,role:'cave',seed:98011,capMs:300000,cells:12,bossAttack:139,bossHp:4375,limitMs:40*60000},
];

/**
 * Block C's two arms. BOTH are treated; `attack` is the ABSOLUTE value installed,
 * never a multiplier applied to whatever happens to be live.
 */
export const BOSS5_CAVE_ARMS = [
 {name:'attack-104',treatment:'cave-104',attack:104},
 {name:'attack-85',treatment:'cave-85',attack:85},
];

/** The ordered Guard list every Boss5 block carries, at every tier. */
export const BOSS5_GUARDS = ['second-wind', 'brace'];

/**
 * The tier-legal reference shape, per tier.
 *
 * T1 DEPARTS from the Boss1-Boss4 shape and the departure is declared here rather
 * than discovered in a report: tier 1 admits no stance at all, and `second-wind +
 * brace + ANY technique` is refused by `setAbilityLoadout` on all six roots against
 * the 22 RP budget. The ordered Guard pair is kept and the technique is dropped.
 */
export const BOSS5_TIER_REFERENCE = {
 1: {stance: null, techniques: []},
 3: {stance: 'defensive-stance', techniques: ['expose-weakness']},
 4: {stance: 'defensive-stance', techniques: ['expose-weakness']},
};

/** The root a cell id names. Cell ids end in the root name. */
export function rootOf(cellId) {
 return cellId.split('-').pop();
}

/**
 * Everything about a qualified cell EXCEPT the boss, the cell id and the arm label.
 *
 * Used by Block C, whose two arms must be the same package twice. What is
 * deliberately NOT here is anything describing the boss -- `bossRuntime`,
 * `bossAuthored` and `initialRoster` all legitimately differ between two treated
 * arms, and are checked separately.
 *
 * Enumerated rather than delete-based: a field ADDED to the receipt later would
 * silently escape a delete-based comparison.
 */
export function armNeutralFingerprint(ready) {
 const ap = ready.appliedPackage, dp = ready.declaredPackage;
 return JSON.stringify({
  applied: {
   selectedSubVariant: ap.selectedSubVariant, selectedRange: ap.selectedRange,
   activeStance: ap.activeStance, attunedStances: ap.attunedStances,
   abilities: ap.attunedAbilities,
   runesEquipped: ap.runesEquipped, equipment: ap.equipment,
   itemUpgrades: ap.itemUpgrades, globalMastery: ap.globalMastery, biomeLevel: ap.biomeLevel,
  },
  declared: {
   classRoot: dp.classRoot, skillPath: dp.skillPath, gearItemIds: dp.gearItemIds,
   upgradeLevel: dp.upgradeLevel, stance: dp.stance,
   abilities: dp.abilities, runeRules: dp.runeRules, sources: dp.sources,
  },
  // The arms differ in a BOSS field. They must not move a single player stat or
  // resource, and including these is what turns that from an assumption into a check.
  effectiveStats: ready.effectiveStats,
  resources: ready.resources,
  runicPoints: ready.runicPoints,
  encounterSetup: ready.encounterSetup,
 });
}

/**
 * The boss side of a Cave receipt, with the treated field MASKED.
 *
 * Everything about the boss that is not the installed attack must be identical across
 * arms -- HP, plating, DR, and the rest of the starting roster.
 */
export function bossNeutralProjection(ready) {
 return JSON.stringify({
  bossId: ready.bossId,
  runtime: {...ready.bossRuntime, attack: '<arm>'},
  authored: {...ready.bossAuthored, attack: '<arm>'},
  roster: ready.initialRoster.map(m => ({...m, attack: '<arm>'})),
 });
}

/**
 * Assert one receipt carries exactly the block and arm it claims.
 *
 * THE LOAD-BEARING ONE, and it differs by block kind:
 *
 *   A BREADTH receipt must record NO treatment and a live definitions hash EQUAL to
 *   the base. A breadth observation that silently carried a treatment would be a
 *   boss-side number nobody declared.
 *
 *   A CAVE receipt must record exactly ONE change, to the absolute value its arm
 *   declares, with a runtime readback that matches and a live hash that DIFFERS from
 *   the base. There is no untreated Cave arm: 104 is a candidate, not source. A Cave
 *   receipt whose runtime read 139 would be the Boss4 baseline wearing this block's
 *   label.
 */
export function assertBoss5Receipt(ready, BLOCK, arm) {
 assert.deepEqual(ready.hpTreatment ?? [], [], `${ready.cell}: Boss5 installs no HP overlay`);
 assert.deepEqual(ready.escortsDeclared ?? {}, {}, `${ready.cell}: no Boss5 boss summons`);
 const changes = ready.damageTreatment ?? [];
 const identity = ready.definitionsIdentity ?? {};
 const runtimeAttack = ready.bossRuntime?.attack;

 if (BLOCK.kind === 'breadth') {
  assert.deepEqual(changes, [], `${ready.cell}: a breadth observation installs nothing, got ${JSON.stringify(changes)}`);
  assert.equal(identity.treated, false, `${ready.cell}: a breadth receipt must not declare itself treated`);
  assert.equal(identity.live, identity.base,
   `${ready.cell}: a breadth receipt's live definitions hash differs from the base — the source moved under the run`);
  assert.equal(runtimeAttack, BLOCK.bossAttack,
   `${ready.cell}: the RUNTIME attack reads ${runtimeAttack}, not the authored ${BLOCK.bossAttack}`);
  assert.equal(ready.bossRuntime?.maxHp, BLOCK.bossHp,
   `${ready.cell}: the RUNTIME boss HP reads ${ready.bossRuntime?.maxHp}, not the authored ${BLOCK.bossHp}`);
  return;
 }

 assert.equal(changes.length, 1, `${ready.cell}: a Cave arm must record exactly ONE change, got ${JSON.stringify(changes)}`);
 const ch = changes[0];
 assert.equal(ch.bossId, BLOCK.bossId, `${ready.cell}: the change names ${ch.bossId}, not ${BLOCK.bossId}`);
 assert.equal(ch.kind, 'attack', `${ready.cell}: change kind drift`);
 assert.equal(ch.before, BOSS5_CAVE_AUTHORED_ATTACK,
  `${ready.cell}: the change is not stated against the authored ${BOSS5_CAVE_AUTHORED_ATTACK}`);
 assert.equal(ch.after, arm.attack, `${ready.cell}: change after drift`);
 assert.equal(runtimeAttack, arm.attack,
  `${ready.cell}: the RUNTIME attack reads ${runtimeAttack}, not the installed ${arm.attack} — the arm changed a definition the fight never read`);
 assert.notEqual(runtimeAttack, BOSS5_CAVE_AUTHORED_ATTACK,
  `${ready.cell}: this arm ran at the AUTHORED ${BOSS5_CAVE_AUTHORED_ATTACK} — that is the Boss4 baseline, not this block's question`);
 assert.equal(identity.treated, true, `${ready.cell}: the receipt does not declare itself treated`);
 assert.notEqual(identity.live, identity.base,
  `${ready.cell}: the live definitions hash still equals the base — nothing was installed into the simulated payload`);
 assert.equal(ready.bossRuntime?.maxHp, BLOCK.bossHp, `${ready.cell}: boss HP moved`);
}

/** Fail loudly if the mirrored declaration has drifted out of shape. */
export function assertBoss5Arms() {
 const breadth = BOSS5_BLOCKS.filter(b => b.kind === 'breadth');
 const cave = BOSS5_BLOCKS.filter(b => b.kind === 'cave-refinement');
 assert.equal(cave.length, 1, 'exactly one Cave refinement block');
 assert.equal(new Set(BOSS5_BLOCKS.map(b => b.name)).size, BOSS5_BLOCKS.length, 'block names must be distinct');
 assert.equal(new Set(BOSS5_BLOCKS.map(b => b.bossId)).size, BOSS5_BLOCKS.length, 'each block fights a different boss');
 const total = BOSS5_BLOCKS.reduce((n, b) => n + b.cells, 0);
 assert.equal(total, breadth.length * 6 + 12, `Boss5 is 6 x N + 12 fights, got ${total}`);
 for (const b of breadth) {
  assert.equal(b.cells, 6, `${b.name}: six tier-legal reference packages`);
  assert.equal(b.seed, BOSS5_SEED, `${b.name}: breadth blocks carry the one predeclared seed`);
  assert.equal(b.capMs, BOSS5_CAPS[b.tier], `${b.name}: cap is not the declared tier cap`);
  assert(b.tier === 1 || b.tier === 3 || b.tier === 4, `${b.name}: breadth reaches a tier with no declared reference`);
  assert(BOSS5_TIER_REFERENCE[b.tier], `${b.name}: no tier reference declared`);
  assert(b.limitMs >= b.capMs, `${b.name}: the watchdog is shorter than the simulated cap`);
 }
 const c = cave[0];
 assert.equal(c.cells, 12, 'cave-refinement: 6 roots x 2 arms = 12 cells');
 assert.equal(c.seed, BOSS5_CAVE_SEED, 'cave-refinement: the carried seed must not drift');
 assert.equal(BOSS5_CAVE_ARMS.length, 2, 'cave-refinement: exactly two arms; no scalar grid');
 assert.equal(new Set(BOSS5_CAVE_ARMS.map(a => a.attack)).size, 2, 'cave-refinement: the arms must differ');
 assert.equal(new Set(BOSS5_CAVE_ARMS.map(a => a.treatment)).size, 2, 'cave-refinement: arm treatments must be distinct');
 for (const arm of BOSS5_CAVE_ARMS) {
  assert(arm.attack < BOSS5_CAVE_AUTHORED_ATTACK,
   `cave-refinement/${arm.name}: NEITHER arm may be the authored ${BOSS5_CAVE_AUTHORED_ATTACK}; this block repeats no baseline`);
  assert(arm.attack >= 1, `cave-refinement/${arm.name}: the arm must leave a live mechanic, not delete it`);
 }
 assert(BOSS5_CAVE_ARMS[1].attack < BOSS5_CAVE_ARMS[0].attack, 'cave-refinement: the second arm must reduce pressure');
}
