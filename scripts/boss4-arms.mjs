import assert from 'node:assert/strict';

/**
 * The Boss4 arms, blocks and candidates, declared ONCE for both the preflight and
 * the run.
 *
 * These values mirror `server/bench/balance/boss4Spec.ts`. The mirror is checked at
 * runtime by both scripts (each reads the manifest and the receipts the TypeScript
 * spec produced and asserts against these), so it cannot drift silently — a preflight
 * that qualified one candidate while the run installed another is exactly the class
 * of defect the declared-versus-applied checker exists to catch, one level up.
 *
 * WHAT MOVES, AND WHAT DOES NOT. Boss3 varied the PLAYER package against a fixed
 * boss. Boss4 inverts that: the player package is frozen and identical in both arms
 * of a block, and the only difference is one authored boss field. So the arm
 * comparison here includes the guard list rather than excusing it.
 */

/** The Boss2 seed, carried through Boss3 and reused so a control arm replays. */
export const BOSS4_SEED=98011;
export const BOSS4_CAP_MS=300000;

/**
 * The two blocks, each with a control arm and exactly one candidate arm.
 *
 * `guards` is the ordered Guard list BOTH arms of that block carry, carried from the
 * named Boss3 arm. `candidate` is the one authored field the treated arm installs,
 * with the before/after the receipts must read back.
 *
 * `bossRuntimeField` names which readback in `ready.bossRuntime` carries the proof
 * that the candidate reached the runtime: the spawned body's `attack` for Cave, and
 * `effectiveMonsterDot`'s live `dotDamagePerStack` for Swamp.
 */
export const BOSS4_BLOCKS=[
 {name:'swamp-pressure',bossId:'mire-gorged-behemoth',hp:3375,attack:38,bossMaxHp:3375,
  seed:BOSS4_SEED,summonsNothing:true,cells:12,limitMs:40*60000,
  originArm:'cleanse-substitution',guards:['second-wind','cleanse'],
  candidate:{kind:'dot-damage-per-stack',field:"MONSTER_DATABASE['mire-gorged-behemoth'].dotEffect.damagePerStack",before:9,after:6},
  bossRuntimeField:'dotDamagePerStack',
  arms:[{name:'current',treatment:'swamp-current',treated:false},
        {name:'reduced-venom',treatment:'swamp-reduced-venom',treated:true}]},
 {name:'cave-pressure',bossId:'chitinous-dreadbore',hp:4375,attack:139,bossMaxHp:4375,
  seed:BOSS4_SEED,summonsNothing:true,cells:12,limitMs:40*60000,
  originArm:'portable-reference',guards:['second-wind','brace'],
  candidate:{kind:'attack',field:"MONSTER_DATABASE['chitinous-dreadbore'].stats.attack",before:139,after:104},
  bossRuntimeField:'attack',
  arms:[{name:'current',treatment:'cave-current',treated:false},
        {name:'reduced-attack',treatment:'cave-reduced-attack',treated:true}]},
];

/**
 * Everything about a qualified cell EXCEPT the boss, the cell id and the arm label.
 *
 * This is the PLAYER side, in full. Boss4's arms must be the same package twice, so
 * the guard list, techniques, rune rules, equipment, upgrades, stance, effective
 * stats, resources and encounter setup are all compared. What is deliberately NOT
 * here is anything describing the boss — `bossRuntime`, `bossAuthored` and
 * `initialRosterHash` all legitimately differ on a treated arm, and are checked
 * separately and explicitly by `assertBossDelta` below.
 *
 * Enumerated rather than delete-based: a field ADDED to the receipt later would
 * silently escape a delete-based comparison, whereas this one simply does not
 * consider it until someone adds it here on purpose.
 */
export function armNeutralFingerprint(ready){
 const ap=ready.appliedPackage, dp=ready.declaredPackage;
 return JSON.stringify({
  applied:{
   selectedSubVariant:ap.selectedSubVariant, selectedRange:ap.selectedRange,
   activeStance:ap.activeStance, attunedStances:ap.attunedStances,
   abilities:ap.attunedAbilities,
   runesEquipped:ap.runesEquipped, equipment:ap.equipment,
   itemUpgrades:ap.itemUpgrades, globalMastery:ap.globalMastery, biomeLevel:ap.biomeLevel,
  },
  declared:{
   classRoot:dp.classRoot, skillPath:dp.skillPath, gearItemIds:dp.gearItemIds,
   upgradeLevel:dp.upgradeLevel, stance:dp.stance,
   abilities:dp.abilities, runeRules:dp.runeRules, sources:dp.sources,
  },
  // The candidate is a BOSS field. It must not move a single player stat or
  // resource, and including these here is what turns that from an assumption into a
  // check.
  effectiveStats:ready.effectiveStats,
  resources:ready.resources,
  runicPoints:ready.runicPoints,
  // The encounter itself: same node, same cap, same seed, same empty arena.
  encounterSetup:ready.encounterSetup,
 });
}

/**
 * The boss side, with the treated field MASKED.
 *
 * Everything about the boss that is not the candidate must be identical across arms —
 * HP, plating, DR, and the rest of the starting roster. Masking exactly one field and
 * comparing the rest is stronger than skipping the boss altogether, which is what a
 * player-only fingerprint would amount to.
 */
export function bossNeutralProjection(ready,BLOCK){
 const mask=v=>({...v,[BLOCK.bossRuntimeField]:'<candidate>'});
 return JSON.stringify({
  bossId:ready.bossId,
  runtime:mask(ready.bossRuntime),
  // `bossAuthored` is read while the treatment is standing, so the treated field is
  // masked here too; its actual value is asserted explicitly below.
  authored:{...ready.bossAuthored,attack:'<candidate-or-authored>'},
  roster:ready.initialRoster.map(m=>({...m,attack:'<candidate-or-authored>'})),
 });
}

/**
 * Assert one receipt carries exactly the arm it claims: the declared treatment, the
 * damage-treatment record, the live definitions identity, and the runtime readback.
 *
 * THE LOAD-BEARING ONE. A treated arm whose `damageTreatment` were empty, or whose
 * live definitions hash still equalled the base, would be a fight that reported a
 * candidate it never installed.
 */
export function assertTreatmentReceipt(ready,BLOCK,arm){
 const c=BLOCK.candidate;
 assert.deepEqual(ready.hpTreatment??[],[],`${ready.cell}: Boss4 installs no HP overlay`);
 assert.deepEqual(ready.escortsDeclared??{},{},`${ready.cell}: neither Boss4 boss summons`);
 const changes=ready.damageTreatment??[];
 const runtime=ready.bossRuntime?.[BLOCK.bossRuntimeField];
 const identity=ready.definitionsIdentity??{};
 if(arm.treated){
  assert.equal(changes.length,1,`${ready.cell}: a treated arm must record exactly ONE damage change, got ${JSON.stringify(changes)}`);
  const ch=changes[0];
  assert.equal(ch.bossId,BLOCK.bossId,`${ready.cell}: the change names ${ch.bossId}, not ${BLOCK.bossId}`);
  assert.equal(ch.kind,c.kind,`${ready.cell}: change kind drift`);
  assert.equal(ch.field,c.field,`${ready.cell}: change field drift`);
  assert.equal(ch.before,c.before,`${ready.cell}: change before drift`);
  assert.equal(ch.after,c.after,`${ready.cell}: change after drift`);
  assert.equal(runtime,c.after,
   `${ready.cell}: the RUNTIME ${BLOCK.bossRuntimeField} reads ${runtime}, not the installed ${c.after} — the candidate changed a definition the fight never read`);
  assert.equal(identity.treated,true,`${ready.cell}: the receipt does not declare itself treated`);
  assert.notEqual(identity.live,identity.base,
   `${ready.cell}: the live definitions hash still equals the base — nothing was installed into the simulated payload`);
 }else{
  assert.deepEqual(changes,[],`${ready.cell}: a control arm installs nothing, got ${JSON.stringify(changes)}`);
  assert.equal(runtime,c.before,
   `${ready.cell}: the RUNTIME ${BLOCK.bossRuntimeField} reads ${runtime}, not the authored ${c.before} — a previous observation did not restore`);
  assert.equal(identity.treated,false,`${ready.cell}: a control must not declare itself treated`);
  assert.equal(identity.live,identity.base,
   `${ready.cell}: a control's live definitions hash differs from the base — the source moved under the run`);
 }
 // Fields the candidate promises to leave alone, on both arms.
 assert.equal(ready.bossRuntime.maxHp,BLOCK.bossMaxHp,`${ready.cell}: boss HP moved`);
 assert.equal(ready.bossAuthored.hp,BLOCK.hp,`${ready.cell}: authored boss HP moved`);
 if(BLOCK.candidate.kind!=='attack')
  assert.equal(ready.bossAuthored.attack,BLOCK.attack,`${ready.cell}: authored boss attack moved`);
}

/** The root a cell id names. Cell ids end in the root name. */
export function rootOf(cellId){
 return cellId.split('-').pop();
}

/** Fail loudly if the mirrored declaration has drifted out of shape. */
export function assertBoss4Arms(){
 assert.equal(BOSS4_BLOCKS.length,2,'exactly two blocks');
 assert.equal(new Set(BOSS4_BLOCKS.map(b=>b.bossId)).size,2,'the two blocks must fight different bosses');
 const total=BOSS4_BLOCKS.reduce((n,b)=>n+b.cells,0);
 assert.equal(total,24,`Boss4 is 24 fights, got ${total}`);
 for(const b of BOSS4_BLOCKS){
  assert.equal(b.arms.length,2,`${b.name}: exactly two arms; no third arm and no scalar grid`);
  assert.equal(b.arms.filter(a=>a.treated).length,1,`${b.name}: exactly ONE arm installs the candidate`);
  assert.equal(new Set(b.arms.map(a=>a.treatment)).size,2,`${b.name}: arm treatments must be distinct`);
  assert.equal(b.cells,b.arms.length*6,`${b.name}: 2 arms x 6 roots = 12 cells`);
  assert.equal(b.seed,BOSS4_SEED,`${b.name}: seed drift`);
  assert.equal(b.summonsNothing,true,`${b.name}: neither Boss4 boss summons`);
  assert.equal(b.guards.length,2,`${b.name}: the carried Guard list is two Guards`);
  assert.equal(b.guards[0],'second-wind',`${b.name}: the carried Guard list must open with Second Wind`);
  assert(b.candidate.after<b.candidate.before,
   `${b.name}: the candidate must REDUCE pressure, got ${b.candidate.before} -> ${b.candidate.after}`);
  assert(b.candidate.after>=1,`${b.name}: the candidate must leave a live mechanic, not delete it`);
  assert(['dot-damage-per-stack','attack'].includes(b.candidate.kind),`${b.name}: unknown candidate kind`);
  assert.equal(b.bossRuntimeField,b.candidate.kind==='attack'?'attack':'dotDamagePerStack',
   `${b.name}: the runtime readback does not match the candidate's field`);
 }
 // The two blocks carry DIFFERENT Boss3 arms, deliberately: Swamp's substitution
 // responded and Cave's did not, so each block replays the reference that is actually
 // sensible for its matchup.
 assert.deepEqual(BOSS4_BLOCKS.map(b=>b.originArm),['cleanse-substitution','portable-reference'],
  'each block must carry the Boss3 arm that is the sensible reference for its matchup');
 assert.equal(BOSS4_BLOCKS[1].candidate.after,Math.round(BOSS4_BLOCKS[1].candidate.before*0.75),
  'cave: the candidate is round(attack x 0.75); the packet states that arithmetic');
}
