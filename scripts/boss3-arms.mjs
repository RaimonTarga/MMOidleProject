import assert from 'node:assert/strict';

/**
 * The Boss3 arms and blocks, declared ONCE for both the preflight and the run.
 *
 * Boss1 and Boss2 each re-spelled their block table in both scripts. That was
 * tolerable while a block was a boss and a seed; it is not tolerable here, where the
 * two scripts must agree on which guard list belongs to which arm. A divergence
 * between them would be a preflight that qualifies one package and a run that fights
 * another -- the exact class of defect the declared-versus-applied checker exists to
 * catch, reintroduced one level up.
 *
 * These values mirror `server/bench/balance/boss3Spec.ts`. The mirror is checked at
 * runtime by the preflight and the run (both read the manifest the TypeScript spec
 * produced and assert against these), so it cannot drift silently.
 */

/** The substituted-out and substituted-in Guards, and the slot they occupy. */
export const BOSS3_GUARD_OUT='brace';
export const BOSS3_GUARD_IN='cleanse';
export const BOSS3_GUARD_SLOT=1;

/**
 * ORDER MATTERS, and the order here is the order on the bot.
 *
 * Guards are walked top-to-bottom and the first eligible one claims a
 * one-activation-per-window gate, so `['second-wind','cleanse']` and
 * `['cleanse','second-wind']` are different packages carrying the same two abilities.
 * The shared declared-versus-applied checker compares ability SETS (it sorts before
 * comparing), which is correct for every earlier screen and insufficient for this one
 * -- so both Boss3 scripts assert the ordered list explicitly.
 *
 * The BASELINE arm is listed first because it is the control: the run drives arms in
 * this order so the baseline is on record before the treatment is.
 */
export const BOSS3_ARM_ORDER=[
 {name:'portable-reference',treatment:'reference-portable',guards:['second-wind',BOSS3_GUARD_OUT]},
 {name:'cleanse-substitution',treatment:'cleanse-substitution',guards:['second-wind',BOSS3_GUARD_IN]},
];

/**
 * The two blocks: the two T2 bosses that beat every portable reference in Boss2.
 *
 * `seed` is the ORIGINAL Boss2 seed for each, read from its frozen block manifest
 * rather than re-chosen. Both arms run on it, which makes the baseline a
 * reproducibility CONTROL and never a new independent replicate of Boss2.
 *
 * Neither boss summons, so `summonsNothing` is true on both and any add at all is a
 * leaked replacement guardian rather than legitimate pressure.
 */
export const BOSS3_BLOCKS=[
 {name:'swamp-response',bossId:'mire-gorged-behemoth',hp:3375,attack:38,bossMaxHp:3375,
  seed:98011,summonsNothing:true,cells:12,limitMs:40*60000},
 {name:'cave-response',bossId:'chitinous-dreadbore',hp:4375,attack:139,bossMaxHp:4375,
  seed:98011,summonsNothing:true,cells:12,limitMs:40*60000},
];

/**
 * Everything about a qualified cell EXCEPT the guard list, the cell id and the arm
 * label, as a comparable string.
 *
 * Arm equality is the validity of the whole screen: if anything else differs, the
 * contrast measures two changes at once. Comparing an explicitly enumerated projection
 * rather than deleting keys from the receipt is deliberate -- a field ADDED to the
 * receipt later would silently escape a delete-based comparison, whereas this one
 * simply does not consider it until someone adds it here on purpose.
 */
export function armNeutralFingerprint(ready){
 const ap=ready.appliedPackage, dp=ready.declaredPackage;
 return JSON.stringify({
  applied:{
   selectedSubVariant:ap.selectedSubVariant, selectedRange:ap.selectedRange,
   activeStance:ap.activeStance, attunedStances:ap.attunedStances,
   techniques:ap.attunedAbilities.techniques,
   runesEquipped:ap.runesEquipped, equipment:ap.equipment,
   itemUpgrades:ap.itemUpgrades, globalMastery:ap.globalMastery, biomeLevel:ap.biomeLevel,
  },
  declared:{
   classRoot:dp.classRoot, skillPath:dp.skillPath, gearItemIds:dp.gearItemIds,
   upgradeLevel:dp.upgradeLevel, stance:dp.stance,
   techniques:dp.abilities.techniques, runeRules:dp.runeRules, sources:dp.sources,
  },
  // Brace and Cleanse are both instant Guards with no passive rider, so a substitution
  // must not move a single starting stat or resource. Including these here is what
  // turns that from an assumption into a check.
  effectiveStats:ready.effectiveStats,
  resources:ready.resources,
  // The encounter both arms face, and the boss as it actually stands at wake-up.
  encounterSetup:ready.encounterSetup,
  bossRuntime:ready.bossRuntime,
  initialRosterHash:ready.initialRosterHash,
 });
}

/** The root a cell id names. Cell ids end in the root name. */
export function rootOf(cellId){
 return cellId.split('-').pop();
}

/** Fail loudly if the mirrored arm declaration has drifted out of shape. */
export function assertBoss3Arms(){
 assert.equal(BOSS3_ARM_ORDER.length,2,'exactly two arms; no third arm and no variants grid');
 assert.equal(BOSS3_BLOCKS.length,2,'exactly two blocks');
 assert.equal(new Set(BOSS3_ARM_ORDER.map(a=>a.treatment)).size,2,'arm treatments must be distinct');
 const [base,sub]=BOSS3_ARM_ORDER;
 assert.equal(base.guards.length,sub.guards.length,'the arms must carry the same number of Guards');
 assert.equal(base.guards[BOSS3_GUARD_SLOT],BOSS3_GUARD_OUT,`the baseline's slot ${BOSS3_GUARD_SLOT} must be ${BOSS3_GUARD_OUT}`);
 assert.equal(sub.guards[BOSS3_GUARD_SLOT],BOSS3_GUARD_IN,`the treatment's slot ${BOSS3_GUARD_SLOT} must be ${BOSS3_GUARD_IN}`);
 for(let i=0;i<base.guards.length;i++){
  if(i===BOSS3_GUARD_SLOT) continue;
  assert.equal(base.guards[i],sub.guards[i],`guard slot ${i} moved as well as slot ${BOSS3_GUARD_SLOT}`);
 }
 assert(!sub.guards.includes(BOSS3_GUARD_OUT),`the treatment still carries ${BOSS3_GUARD_OUT}`);
 assert(!base.guards.includes(BOSS3_GUARD_IN),`the baseline already carries ${BOSS3_GUARD_IN} — the contrast would be empty`);
 const total=BOSS3_BLOCKS.reduce((n,b)=>n+b.cells,0);
 assert.equal(total,24,`Boss3 is 24 fights, got ${total}`);
 for(const b of BOSS3_BLOCKS){
  assert.equal(b.cells,BOSS3_ARM_ORDER.length*6,`${b.name}: 2 arms x 6 roots = 12 cells`);
  assert.equal(b.summonsNothing,true,`${b.name}: neither Boss3 boss summons`);
 }
}
