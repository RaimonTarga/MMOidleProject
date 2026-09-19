import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {night5ChildArgs} from './night5-child-args.mjs';
import {assertDeclarationsApplied} from './boss-verify.mjs';
import {BOSS5_BLOCKS,BOSS5_CAVE_ARMS,BOSS5_CAVE_AUTHORED_ATTACK,BOSS5_GUARDS,
 BOSS5_TIER_REFERENCE,armNeutralFingerprint,assertBoss5Arms,assertBoss5Receipt,
 bossNeutralProjection,rootOf} from './boss5-arms.mjs';
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
const [root,hitboxes]=process.argv.slice(2);
assert(root&&hitboxes&&!existsSync(root),'NEW preflight root and hitbox artifact required');
mkdirSync(root,{recursive:true});

// Boss5 qualifies EVERY block and spends ZERO fights.
//
// No pilot anywhere, deliberately. A pilot is an undeclared extra observation of the
// same encounter, and eighteen of these nineteen blocks are FIRST contact with a boss
// this harness has never fought — which is exactly the situation in which an
// exploratory fight would quietly become the result. What qualification must prove
// here is narrower:
//
//   1. the encounter RUNS: the guard strips, the boss wakes, and the starting roster
//      is the boss alone. A block whose boss never woke would otherwise produce six
//      confident rows about a fight that never happened;
//   2. the package is TIER-LEGAL and is the tier's declared reference — including at
//      T1, where the Boss1-Boss4 shape is genuinely illegal and the screen carries a
//      DECLARED departure rather than a silent one;
//   3. a BREADTH receipt installs nothing and its live definitions hash equals the
//      base; a CAVE receipt installs its absolute arm and its live hash differs.
//      Block C has no untreated arm, so "it looks like the baseline" is a failure
//      rather than a reassurance;
//   4. Block C's two arms are the SAME player package, checked on the RECEIPTS rather
//      than on the spec that generated them.
//
// Whether the treated attack actually lowers landed damage, and by how much, is the
// other half of qualification and is proven by fixture in
// `server/test/boss5Pressure.test.ts` — never by spending a fight here.
assertBoss5Arms();

/**
 * Per-root effective stats, collected across every block AT THE SAME TIER.
 *
 * Boss2's portability claim, re-checked per tier: a root's starting stats cannot
 * depend on which boss is standing there. It is keyed by TIER as well as root,
 * because a T1 and a T4 package are deliberately different players and comparing
 * them would be meaningless.
 */
const perTierRootStats={};
/** Every receipt summary, written out so the frozen packet can quote them. */
const receipts=[];
/** One line per block, for the packet's qualification table. */
const blockSummaries=[];

for(const BLOCK of BOSS5_BLOCKS){
 const out=join(root,BLOCK.name);
 const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/bossScreen.ts',['--trial=boss5',`--block=${BLOCK.name}`,'--mode=qualify',`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:1800000,windowsHide:true});
 writeFileSync(join(root,`${BLOCK.name}-qualify.log`),result.stdout+'\n'+result.stderr);
 assert.equal(result.status,0,`${BLOCK.name}: ${result.stderr}`);
 const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
 const manifest=read('manifest.json'),index=read('index.json');

 assert.equal(manifest.trial,'boss5');
 assert.equal(manifest.block,BLOCK.name);
 assert.equal(manifest.bossId,BLOCK.bossId,`${BLOCK.name}: boss identity drift`);
 assert.equal(manifest.synthetic,true);
 assert.equal(manifest.economyEligible,false);
 assert.equal(manifest.dtMs,100);
 assert.equal(manifest.durationMs,BLOCK.capMs,`${BLOCK.name}: cap drift`);
 assert.deepEqual(manifest.seeds,[BLOCK.seed],`${BLOCK.name}: seed drift`);
 assert.equal(manifest.guardianAccess,'not-measured-guard-stripped');
 assert.equal(manifest.cells.length,BLOCK.cells,`${BLOCK.name}: ${BLOCK.cells} cells must qualify`);
 assert.equal(index.length,BLOCK.cells,'one ready receipt per cell');

 if(BLOCK.kind==='cave-refinement'){
  const arms=[...new Set(manifest.cells.map(c=>c.treatment))].sort();
  assert.deepEqual(arms,[...BOSS5_CAVE_ARMS.map(a=>a.treatment)].sort(),
   `${BLOCK.name}: expected exactly the two declared arms, got ${JSON.stringify(arms)}`);
  for(const arm of BOSS5_CAVE_ARMS){
   const cells=manifest.cells.filter(c=>c.treatment===arm.treatment);
   assert.equal(cells.length,6,`${BLOCK.name}/${arm.name}: six roots per arm`);
   assert.equal(new Set(cells.map(c=>c.className)).size,6,`${BLOCK.name}/${arm.name}: roots must be distinct`);
  }
 }else{
  assert.equal(new Set(manifest.cells.map(c=>c.className)).size,6,`${BLOCK.name}: six distinct roots`);
  const labels=[...new Set(manifest.cells.map(c=>c.treatment))];
  assert.deepEqual(labels,[`reference-t${BLOCK.tier}`],
   `${BLOCK.name}: a breadth block carries exactly its tier's reference label, got ${JSON.stringify(labels)}`);
 }

 /** root -> arm -> receipt, for Block C's pairwise comparison. */
 const byRootArm={};
 for(const ready of index){
  assert.equal(ready.synthetic,true);
  assert.equal(ready.bossId,BLOCK.bossId);
  // THE ENCOUNTER ACTUALLY RAN. The guard is stripped and the boss is awake and
  // alone at the bell — the check that `--mode boss` never had, and the reason
  // every "boss" row that mode printed was a guard row.
  assert(ready.bossRuntime.maxHp>0,`${ready.cell}: boss never woke`);
  assert(ready.initialRoster.some(m=>m.type===BLOCK.bossId),`${ready.cell}: boss absent from the roster`);
  assert(!ready.initialRoster.some(m=>m.type!==BLOCK.bossId),`${ready.cell}: a non-boss body is standing at the bell`);

  const d=ready.declaredPackage;
  const arm=BLOCK.kind==='cave-refinement'
   ? BOSS5_CAVE_ARMS.find(a=>a.treatment===d.treatment)
   : {name:`reference-t${BLOCK.tier}`,treatment:`reference-t${BLOCK.tier}`};
  assert(arm,`${ready.cell}: unknown treatment ${d.treatment}`);

  // ── THE TREATMENT (or its declared absence), per block kind.
  assertBoss5Receipt(ready,BLOCK,arm);

  // ── THE TIER-LEGAL REFERENCE SHAPE, as declared for this tier.
  const ref=BLOCK.kind==='cave-refinement'
   ? {stance:'defensive-stance',techniques:['expose-weakness']}
   : BOSS5_TIER_REFERENCE[BLOCK.tier];
  assert.equal(d.stance,ref.stance,`${ready.cell}: stance is not the tier reference (${ref.stance})`);
  assert.deepEqual(d.abilities.techniques,ref.techniques,
   `${ready.cell}: technique list ${JSON.stringify(d.abilities.techniques)} is not the tier reference ${JSON.stringify(ref.techniques)}`);
  assert.equal(d.sources.abilities,'explicit',`${ready.cell}: the package must STATE its abilities, never inherit a default`);
  assert.equal(d.sources.runeRules,'explicit',`${ready.cell}: the package must state its rules`);
  // Tier 1 admits no stance at all, and that is a different statement from choosing
  // a neutral one. The receipt must say which.
  assert.equal(d.sources.stance,BLOCK.tier===1?'tier-none':'explicit',
   `${ready.cell}: stance source is ${d.sources.stance}; tier ${BLOCK.tier} must report ${BLOCK.tier===1?'tier-none':'explicit'}`);
  assert.equal(d.runeRules.length,5,`${ready.cell}: the reference carries five ordered rules`);
  assert.equal(d.runeRules[1].actionId,'step-back',`${ready.cell}: Step Back precedes the movement rule`);
  // The ORDERED Guard list, declared and applied. The shared declared-vs-applied
  // checker compares ability SETS (it sorts), which cannot see a swapped guard
  // order — so it is asserted directly, at every tier.
  assert.deepEqual(d.abilities.guards,BOSS5_GUARDS,
   `${ready.cell}: declared guards ${JSON.stringify(d.abilities.guards)} != ${JSON.stringify(BOSS5_GUARDS)}`);
  assert.deepEqual(ready.appliedPackage.attunedAbilities.guards,BOSS5_GUARDS,
   `${ready.cell}: APPLIED guards ${JSON.stringify(ready.appliedPackage.attunedAbilities.guards)} != declared — order included`);
  const named=d.runeRules.filter(r=>BOSS5_GUARDS.includes(r.actionId)||r.actionId==='cleanse');
  assert.equal(named.length,0,`${ready.cell}: a Rune rule names a Guard (${JSON.stringify(named)}) — the reference uses default triggers`);

  // NO FUTURE-TIER GRANTS, and the RP budget is the TIER's own.
  assert(ready.runicPoints.cost<=ready.runicPoints.budget,
   `${ready.cell}: package costs ${ready.runicPoints.cost} RP against a budget of ${ready.runicPoints.budget}`);

  const root_=rootOf(ready.cell);
  (byRootArm[root_] ??= {})[arm.name]={ready,cost:ready.runicPoints.cost};
  receipts.push({block:BLOCK.name,kind:BLOCK.kind,tier:BLOCK.tier,cell:ready.cell,
   arm:arm.name,damageTreatment:ready.damageTreatment,bossRuntime:ready.bossRuntime,
   definitionsIdentity:ready.definitionsIdentity,rp:ready.runicPoints.cost,
   rpBudget:ready.runicPoints.budget});

  // Portability WITHIN a tier. Keyed by tier because a T1 and a T4 package are
  // deliberately different players.
  const key=`t${BLOCK.tier}/${root_}`;
  const seen=JSON.stringify(ready.effectiveStats);
  if(perTierRootStats[key]===undefined) perTierRootStats[key]={first:`${BLOCK.name}/${arm.name}`,stats:seen};
  else assert.equal(seen,perTierRootStats[key].stats,
   `${ready.cell}: this root's effective stats differ from the ones qualified on ${perTierRootStats[key].first} at the same tier — either the references are not portable, or something moved a player stat and the contrast is confounded`);
 }

 if(BLOCK.kind==='cave-refinement'){
  // ── Pairwise arm equality, on the RECEIPTS rather than on the spec.
  assert.equal(Object.keys(byRootArm).length,6,`${BLOCK.name}: six distinct roots must have qualified`);
  const [A,B]=BOSS5_CAVE_ARMS;
  for(const [root_,arms_] of Object.entries(byRootArm)){
   const a=arms_[A.name],b=arms_[B.name];
   assert(a&&b,`${BLOCK.name}/${root_}: both arms must have qualified`);
   assert.equal(armNeutralFingerprint(a.ready),armNeutralFingerprint(b.ready),
    `${BLOCK.name}/${root_}: the arms differ in the PLAYER package — this block treats the boss, not the build`);
   assert.equal(bossNeutralProjection(a.ready),bossNeutralProjection(b.ready),
    `${BLOCK.name}/${root_}: the arms differ in a boss field other than the installed attack`);
   assert.equal(a.cost,b.cost,`${BLOCK.name}/${root_}: the arms cost different RP`);
   console.log(`  ${BLOCK.name}/${root_} — package identical, RP ${a.cost}; boss attack ${a.ready.bossRuntime.attack} vs ${b.ready.bossRuntime.attack} (authored ${BOSS5_CAVE_AUTHORED_ATTACK}, neither arm)`);
  }
 }

 // THE shared check, at zero fights spent. Same function the formal run uses.
 assertDeclarationsApplied(index);
 const rp=index.map(r=>r.runicPoints.cost);
 blockSummaries.push({block:BLOCK.name,kind:BLOCK.kind,tier:BLOCK.tier,bossId:BLOCK.bossId,
  cells:BLOCK.cells,capMs:BLOCK.capMs,seed:BLOCK.seed,
  bossMaxHp:index[0].bossRuntime.maxHp,bossAttack:index[0].bossRuntime.attack,
  rpMin:Math.min(...rp),rpMax:Math.max(...rp),rpBudget:index[0].runicPoints.budget});
 console.log(`${BLOCK.name} qualify ok — ${BLOCK.cells} cells, boss awake and alone, tier-${BLOCK.tier} reference legal (RP ${Math.min(...rp)}-${Math.max(...rp)}/${index[0].runicPoints.budget})`);
}

const planned=BOSS5_BLOCKS.reduce((n,b)=>n+b.cells,0);
writeFileSync(join(root,'qualification.json'),JSON.stringify({
 trial:'boss5',
 blocks:BOSS5_BLOCKS.map(b=>b.name),
 bosses:BOSS5_BLOCKS.map(b=>b.bossId),
 breadthBosses:BOSS5_BLOCKS.filter(b=>b.kind==='breadth').length,
 tierReference:BOSS5_TIER_REFERENCE,
 caveArms:BOSS5_CAVE_ARMS,
 caveAuthoredAttack:BOSS5_CAVE_AUTHORED_ATTACK,
 plannedObservations:planned,
 fightsSpent:0,
 blockSummaries,perTierRootStats,receipts,
},null,2));
console.log(`boss5 preflight: ok — ${BOSS5_BLOCKS.length} blocks, ${planned} planned observations, ZERO fights spent`);
