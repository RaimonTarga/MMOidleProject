import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {night5ChildArgs} from './night5-child-args.mjs';
import {assertDeclarationsApplied} from './boss-verify.mjs';
import {BOSS4_BLOCKS,BOSS4_CAP_MS,BOSS4_SEED,armNeutralFingerprint,assertBoss4Arms,
 assertTreatmentReceipt,bossNeutralProjection,rootOf} from './boss4-arms.mjs';
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
const [root,hitboxes]=process.argv.slice(2);
assert(root&&hitboxes&&!existsSync(root),'NEW preflight root and hitbox artifact required');
mkdirSync(root,{recursive:true});

// Boss4 qualifies BOTH blocks and spends ZERO fights.
//
// No pilot and no exploratory fight, deliberately. Boss2 and Boss3 have each fought
// both of these bosses on this runner, at this encounter setup, on these exact
// packages — sixteen times between them. What qualification must prove here is
// narrower and different:
//
//   1. the two arms of a block are the SAME player package, checked on the RECEIPTS
//      rather than on the spec that generated them. Boss3 varied the package and
//      excused the guard list; Boss4 varies the BOSS, so nothing about the player is
//      excused;
//   2. the candidate actually reached the RUNTIME — the spawned body's attack for
//      Cave, `effectiveMonsterDot`'s live payload for Swamp — and not merely a
//      definition the fight would never read;
//   3. the control arm is untreated, and its live definitions hash still equals the
//      base. That is what proves restoration between observations, which no
//      frozen-hash check can establish on its own;
//   4. every other authored boss field is where the packet says it is.
//
// Whether the treated damage actually falls, and by how much, is the other half of
// qualification and is proven by fixture in `server/test/boss4Pressure.test.ts` —
// never by spending a fight here.
const CELLS=12;
assertBoss4Arms();

/**
 * Per-root effective stats, collected across BOTH arms and BOTH blocks.
 *
 * PORTABILITY (Boss2's claim, re-checked) and ARM NEUTRALITY (Boss4's own) ride on
 * this together: a root's starting stats cannot depend on which boss is standing
 * there, and a boss-side candidate must not move a single player stat. If it did, the
 * contrast would be confounded and nothing could be attributed to the candidate.
 */
const perRootStats={};
/** Every treatment receipt, written out so the frozen packet can quote them. */
const receipts=[];

for(const BLOCK of BOSS4_BLOCKS){
 const out=join(root,BLOCK.name);
 const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/bossScreen.ts',['--trial=boss4',`--block=${BLOCK.name}`,'--mode=qualify',`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:1800000,windowsHide:true});
 writeFileSync(join(root,`${BLOCK.name}-qualify.log`),result.stdout+'\n'+result.stderr);
 assert.equal(result.status,0,result.stderr);
 const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
 const manifest=read('manifest.json'),index=read('index.json');

 assert.equal(manifest.trial,'boss4');
 assert.equal(manifest.block,BLOCK.name);
 assert.equal(manifest.bossId,BLOCK.bossId,`${BLOCK.name}: boss identity drift`);
 assert.equal(manifest.synthetic,true);
 assert.equal(manifest.economyEligible,false);
 assert.equal(manifest.dtMs,100);
 assert.equal(manifest.durationMs,BOSS4_CAP_MS,`${BLOCK.name}: cap drift`);
 assert.deepEqual(manifest.seeds,[BOSS4_SEED],`${BLOCK.name}: seed drift — the control must replay its Boss3 arm`);
 assert.equal(manifest.guardianAccess,'not-measured-guard-stripped');
 assert.equal(manifest.cells.length,CELLS,`${BLOCK.name}: twelve cells must qualify`);
 const arms=[...new Set(manifest.cells.map(c=>c.treatment))].sort();
 assert.deepEqual(arms,[...BLOCK.arms.map(a=>a.treatment)].sort(),
  `${BLOCK.name}: expected exactly the two declared arms, got ${JSON.stringify(arms)}`);
 for(const arm of BLOCK.arms){
  const cells=manifest.cells.filter(c=>c.treatment===arm.treatment);
  assert.equal(cells.length,6,`${BLOCK.name}/${arm.name}: six roots per arm`);
  assert.equal(new Set(cells.map(c=>c.className)).size,6,`${BLOCK.name}/${arm.name}: roots must be distinct`);
 }
 assert.equal(index.length,CELLS,'one ready receipt per cell');

 /** root -> arm -> receipt, so the pair can be compared field by field below. */
 const byRootArm={};
 for(const ready of index){
  assert.equal(ready.synthetic,true);
  assert.equal(ready.bossId,BLOCK.bossId);
  assert(ready.bossRuntime.maxHp>0,`${ready.cell}: boss never woke`);
  assert(ready.initialRoster.some(m=>m.type===BLOCK.bossId),`${ready.cell}: boss absent from the roster`);
  assert(!ready.initialRoster.some(m=>m.type!==BLOCK.bossId),`${ready.cell}: a non-boss body is standing at the bell`);

  const d=ready.declaredPackage;
  const arm=BLOCK.arms.find(a=>a.treatment===d.treatment);
  assert(arm,`${ready.cell}: unknown treatment ${d.treatment}`);

  // ── THE TREATMENT. Declared, installed, reached the runtime, and restored.
  assertTreatmentReceipt(ready,BLOCK,arm);

  // ── The carried reference SHAPE, unchanged in both arms.
  assert.equal(d.stance,'defensive-stance',`${ready.cell}: reference stance drift`);
  assert.equal(d.sources.stance,'explicit',`${ready.cell}: the reference states its stance`);
  assert.equal(d.sources.abilities,'explicit',`${ready.cell}: the arm must state its abilities, never inherit a default`);
  assert.equal(d.runeRules.length,5,`${ready.cell}: reference carries five ordered rules`);
  assert.equal(d.runeRules[1].actionId,'step-back',`${ready.cell}: Step Back precedes the movement rule`);
  assert.deepEqual(d.abilities.techniques,['expose-weakness'],`${ready.cell}: technique drift`);
  // The ORDERED Guard list carried from this block's Boss3 origin arm, declared and
  // applied. The shared declared-vs-applied checker compares ability SETS (it sorts),
  // which cannot see a swapped guard order — so both Boss4 scripts assert it directly.
  assert.deepEqual(d.abilities.guards,BLOCK.guards,
   `${ready.cell}: declared guards ${JSON.stringify(d.abilities.guards)} != the Boss3 ${BLOCK.originArm} list ${JSON.stringify(BLOCK.guards)}`);
  assert.deepEqual(ready.appliedPackage.attunedAbilities.guards,BLOCK.guards,
   `${ready.cell}: APPLIED guards ${JSON.stringify(ready.appliedPackage.attunedAbilities.guards)} != declared — order included`);
  // No Rune rule names a Guard in either arm: the carried package runs on its authored
  // default triggers, exactly as Boss3 ran it.
  const named=d.runeRules.filter(r=>BLOCK.guards.includes(r.actionId)||r.actionId==='cleanse'||r.actionId==='brace');
  assert.equal(named.length,0,`${ready.cell}: a Rune rule names a Guard (${JSON.stringify(named)}) — the carried package uses default triggers`);

  assert(ready.runicPoints.cost<=ready.runicPoints.budget,
   `${ready.cell}: package costs ${ready.runicPoints.cost} RP against a budget of ${ready.runicPoints.budget}`);

  const root_=rootOf(ready.cell);
  (byRootArm[root_] ??= {})[arm.name]={ready,cost:ready.runicPoints.cost};
  receipts.push({block:BLOCK.name,cell:ready.cell,arm:arm.name,treated:arm.treated,
   damageTreatment:ready.damageTreatment,bossRuntime:ready.bossRuntime,
   definitionsIdentity:ready.definitionsIdentity,rp:ready.runicPoints.cost});

  const seen=JSON.stringify(ready.effectiveStats);
  if(perRootStats[root_]===undefined) perRootStats[root_]={first:`${BLOCK.name}/${arm.name}`,stats:seen};
  else assert.equal(seen,perRootStats[root_].stats,
   `${ready.cell}: this root's effective stats differ from the ones qualified on ${perRootStats[root_].first} — either the references are not portable, or a boss-side candidate moved a player stat and the contrast is confounded`);
 }

 // ── Pairwise arm equality, on the RECEIPTS rather than on the spec.
 //
 // Two claims, checked separately because they are different claims: the PLAYER side
 // must be byte-identical, and the BOSS side must be identical everywhere except the
 // one masked candidate field — whose actual values are then asserted outright.
 assert.equal(Object.keys(byRootArm).length,6,`${BLOCK.name}: six distinct roots must have qualified`);
 const [CONTROL,TREATED]=BLOCK.arms;
 for(const [root_,arms_] of Object.entries(byRootArm)){
  const a=arms_[CONTROL.name],c=arms_[TREATED.name];
  assert(a&&c,`${BLOCK.name}/${root_}: both arms must have qualified`);
  assert.equal(armNeutralFingerprint(a.ready),armNeutralFingerprint(c.ready),
   `${BLOCK.name}/${root_}: the arms differ in the PLAYER package — Boss4 treats the boss, not the build`);
  assert.equal(bossNeutralProjection(a.ready,BLOCK),bossNeutralProjection(c.ready,BLOCK),
   `${BLOCK.name}/${root_}: the arms differ in a boss field other than the candidate`);
  assert.equal(a.cost,c.cost,`${BLOCK.name}/${root_}: the arms cost different RP`);
  const f=BLOCK.bossRuntimeField;
  console.log(`  ${BLOCK.name}/${root_} — package identical, RP ${a.cost}; boss ${f} ${a.ready.bossRuntime[f]} -> ${c.ready.bossRuntime[f]} (candidate ${BLOCK.candidate.before} -> ${BLOCK.candidate.after})`);
 }

 // THE shared check, at zero fights spent. Same function the formal run uses.
 assertDeclarationsApplied(index);
 console.log(`${BLOCK.name} qualify ok — 2 arms x 6 roots, boss awake, one field treated, control restored`);
}

assert.equal(Object.keys(perRootStats).length,6,'six distinct roots must have qualified');
writeFileSync(join(root,'qualification.json'),JSON.stringify({
 trial:'boss4',blocks:BOSS4_BLOCKS.map(b=>b.name),bosses:BOSS4_BLOCKS.map(b=>b.bossId),
 arms:BOSS4_BLOCKS.map(b=>({block:b.name,originArm:b.originArm,guards:b.guards,
  candidate:b.candidate,arms:b.arms})),
 seed:BOSS4_SEED,capMs:BOSS4_CAP_MS,cells:CELLS,
 plannedObservations:BOSS4_BLOCKS.length*CELLS,
 fightsSpent:0,perRootStats,receipts,
},null,2));
console.log(`boss4 preflight: ok — ${BOSS4_BLOCKS.length} blocks, ${BOSS4_BLOCKS.length*CELLS} planned observations, ZERO fights spent`);
