import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {night5ChildArgs} from './night5-child-args.mjs';
import {assertDeclarationsApplied} from './boss-verify.mjs';
import {BOSS3_ARM_ORDER,BOSS3_BLOCKS,armNeutralFingerprint,assertBoss3Arms,rootOf} from './boss3-arms.mjs';
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
const [root,hitboxes]=process.argv.slice(2);
assert(root&&hitboxes&&!existsSync(root),'NEW preflight root and hitbox artifact required');
mkdirSync(root,{recursive:true});

// Boss3 qualifies BOTH blocks and spends ZERO fights.
//
// There is no pilot and no exploratory fight, deliberately. Boss2 already proved this
// runner reaches both of these bosses on this encounter setup, at this revision, on
// these packages -- it fought each of them six times. What qualification must prove
// here is narrower and different:
//
//   1. the two arms are the same package except the substituted Guard, checked on the
//      RECEIPTS rather than on the spec that generated them;
//   2. the substituted Guard is applied in the declared ORDER. The shared
//      declared-vs-applied checker compares ability SETS (it sorts), which is correct
//      for a screen that never varies order and insufficient for one that does: guards
//      are walked top-to-bottom and the first eligible one claims a
//      one-activation-per-window gate, so the same two guards in the other order are a
//      different package;
//   3. the substitution FREED RP and did not spend it;
//   4. the baseline arm still reproduces Boss2 exactly.
//
// Whether the substituted Guard can actually remove what these bosses apply is the
// other half of qualification and is proven by fixture, in
// `server/test/boss3Cleanse.test.ts`, not by spending a fight here.
const SEED=98011, CELLS=12, CAP_MS=300000;
assertBoss3Arms();

/**
 * Per-root effective stats, collected across BOTH arms and BOTH blocks.
 *
 * Two independent claims ride on this:
 *
 *   PORTABILITY (Boss2's claim, re-checked): a root's stats cannot depend on which
 *   boss is standing there.
 *
 *   ARM NEUTRALITY (Boss3's own): Brace and Cleanse are both instant Guards with no
 *   passive rider, so substituting one for the other must not move a single starting
 *   stat. If it did, the contrast would be confounded by a stat change and this screen
 *   could not attribute anything to the substitution. That is asserted here rather
 *   than assumed, because it is cheap to check and fatal to get wrong.
 */
const perRootStats={};

for(const BLOCK of BOSS3_BLOCKS){
 const out=join(root,BLOCK.name);
 const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/bossScreen.ts',['--trial=boss3',`--block=${BLOCK.name}`,'--mode=qualify',`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:1800000,windowsHide:true});
 writeFileSync(join(root,`${BLOCK.name}-qualify.log`),result.stdout+'\n'+result.stderr);
 assert.equal(result.status,0,result.stderr);
 const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
 const manifest=read('manifest.json'),index=read('index.json');

 assert.equal(manifest.trial,'boss3');
 assert.equal(manifest.block,BLOCK.name);
 assert.equal(manifest.bossId,BLOCK.bossId,`${BLOCK.name}: boss identity drift`);
 assert.equal(manifest.synthetic,true);
 assert.equal(manifest.economyEligible,false);
 assert.equal(manifest.dtMs,100);
 assert.equal(manifest.durationMs,CAP_MS,`${BLOCK.name}: cap drift`);
 // The ORIGINAL Boss2 seed, reused so the baseline arm replays the known failure.
 assert.deepEqual(manifest.seeds,[SEED],`${BLOCK.name}: seed drift — the baseline must replay Boss2's seed`);
 assert.equal(manifest.guardianAccess,'not-measured-guard-stripped');
 assert.equal(manifest.cells.length,CELLS,`${BLOCK.name}: twelve cells must qualify`);
 // Two arms, six distinct roots each -- and the arm labels must be exactly the two
 // declared ones, so a stray third treatment cannot ride along unnoticed.
 const arms=[...new Set(manifest.cells.map(c=>c.treatment))].sort();
 assert.deepEqual(arms,[...BOSS3_ARM_ORDER.map(a=>a.treatment)].sort(),
  `${BLOCK.name}: expected exactly the two declared arms, got ${JSON.stringify(arms)}`);
 for(const arm of BOSS3_ARM_ORDER){
  const cells=manifest.cells.filter(c=>c.treatment===arm.treatment);
  assert.equal(cells.length,6,`${BLOCK.name}/${arm.name}: six roots per arm`);
  assert.equal(new Set(cells.map(c=>c.className)).size,6,`${BLOCK.name}/${arm.name}: roots must be distinct`);
 }
 assert.equal(index.length,CELLS,'one ready receipt per cell');

 /** root -> arm -> receipt, so the pair can be compared field by field below. */
 const byRootArm={};
 for(const ready of index){
  assert.deepEqual(ready.hpTreatment,[],`${ready.cell}: Boss3 installs nothing`);
  assert.equal(ready.synthetic,true);
  assert.equal(ready.bossId,BLOCK.bossId);
  // Boss VALUES are untouched by this screen; a drift here means something else moved.
  assert.equal(ready.bossAuthored.hp,BLOCK.hp,`${ready.cell}: boss hp drift`);
  assert.equal(ready.bossAuthored.attack,BLOCK.attack,`${ready.cell}: boss attack drift`);
  assert(ready.bossRuntime.maxHp>0,`${ready.cell}: boss never woke`);
  assert(ready.initialRoster.some(m=>m.type===BLOCK.bossId),`${ready.cell}: boss absent from the roster`);
  assert(!ready.initialRoster.some(m=>m.type!==BLOCK.bossId),`${ready.cell}: a non-boss body is standing at the bell`);
  // Neither of these bosses summons, so an add at the bell is a leaked body.
  assert.deepEqual(ready.escortsDeclared,{},`${ready.cell}: neither Boss3 boss summons`);

  const d=ready.declaredPackage;
  const arm=BOSS3_ARM_ORDER.find(a=>a.treatment===d.treatment);
  assert(arm,`${ready.cell}: unknown treatment ${d.treatment}`);
  // The reference SHAPE, unchanged in both arms.
  assert.equal(d.stance,'defensive-stance',`${ready.cell}: reference stance drift`);
  assert.equal(d.sources.stance,'explicit',`${ready.cell}: the reference states its stance`);
  assert.equal(d.sources.abilities,'explicit',`${ready.cell}: the arm must state its abilities, never inherit a default`);
  assert.equal(d.runeRules.length,5,`${ready.cell}: reference carries five ordered rules`);
  assert.equal(d.runeRules[1].actionId,'step-back',`${ready.cell}: Step Back precedes the movement rule`);
  assert.deepEqual(d.abilities.techniques,['expose-weakness'],`${ready.cell}: technique drift`);

  // ── THE ARM. Declared and applied, in ORDER, on both sides.
  assert.deepEqual(d.abilities.guards,arm.guards,
   `${ready.cell}: declared guards ${JSON.stringify(d.abilities.guards)} != ${arm.name} ${JSON.stringify(arm.guards)}`);
  assert.deepEqual(ready.appliedPackage.attunedAbilities.guards,arm.guards,
   `${ready.cell}: APPLIED guards ${JSON.stringify(ready.appliedPackage.attunedAbilities.guards)} != declared ${JSON.stringify(arm.guards)} — order included`);
  // No ability-specific Rune rule is added in either arm: the substituted Guard runs
  // on its authored default trigger, and a rule naming an ability would both reorder
  // the guard walk and change what is being measured.
  const named=d.runeRules.filter(r=>arm.guards.includes(r.actionId)||r.actionId==='cleanse'||r.actionId==='brace');
  assert.equal(named.length,0,`${ready.cell}: a Rune rule names a Guard (${JSON.stringify(named)}) — the default trigger must be used`);

  // RP: within budget, and recorded so the freed points can be shown unspent.
  assert(ready.runicPoints.cost<=ready.runicPoints.budget,
   `${ready.cell}: package costs ${ready.runicPoints.cost} RP against a budget of ${ready.runicPoints.budget}`);

  const root_=rootOf(ready.cell);
  (byRootArm[root_] ??= {})[arm.name]={ready,cost:ready.runicPoints.cost};

  const seen=JSON.stringify(ready.effectiveStats);
  if(perRootStats[root_]===undefined) perRootStats[root_]={first:`${BLOCK.name}/${arm.name}`,stats:seen};
  else assert.equal(seen,perRootStats[root_].stats,
   `${ready.cell}: this root's effective stats differ from the ones qualified on ${perRootStats[root_].first} — either the references are not portable, or the substituted Guard moved a starting stat and the contrast is confounded`);
 }

 // ── Pairwise arm equality, on the RECEIPTS rather than on the spec.
 //
 // The spec-level check lives in `boss3Matrix.test.ts`. This one is stronger in the
 // way that matters: it compares what actually materialised on twelve bots.
 assert.equal(Object.keys(byRootArm).length,6,`${BLOCK.name}: six distinct roots must have qualified`);
 const [BASE,SUB]=BOSS3_ARM_ORDER;
 for(const [root_,arms_] of Object.entries(byRootArm)){
  const a=arms_[BASE.name],c=arms_[SUB.name];
  assert(a&&c,`${BLOCK.name}/${root_}: both arms must have qualified`);
  assert.equal(armNeutralFingerprint(a.ready),armNeutralFingerprint(c.ready),
   `${BLOCK.name}/${root_}: the arms differ in something other than the substituted Guard`);
  // The substitution must FREE RP, and the freed points stay unspent: same rules, same
  // technique, same stance, one cheaper Guard.
  assert(c.cost<a.cost,
   `${BLOCK.name}/${root_}: the substitution costs ${c.cost} RP against the baseline's ${a.cost} — it may only free RP`);
  console.log(`  ${BLOCK.name}/${root_} — arms paired; RP ${a.cost} -> ${c.cost} (${a.cost-c.cost} freed, unspent)`);
 }

 // THE shared check, at zero fights spent. Same function the formal run uses.
 assertDeclarationsApplied(index);
 console.log(`${BLOCK.name} qualify ok — 2 arms x 6 roots, boss awake, declarations applied in order`);
}

assert.equal(Object.keys(perRootStats).length,6,'six distinct roots must have qualified');
writeFileSync(join(root,'qualification.json'),JSON.stringify({
 trial:'boss3',blocks:BOSS3_BLOCKS.map(b=>b.name),bosses:BOSS3_BLOCKS.map(b=>b.bossId),
 arms:BOSS3_ARM_ORDER.map(a=>({name:a.name,treatment:a.treatment,guards:a.guards})),
 seed:SEED,capMs:CAP_MS,cells:CELLS,
 plannedObservations:BOSS3_BLOCKS.length*CELLS,
 fightsSpent:0,perRootStats,
},null,2));
console.log(`boss3 preflight: ok — ${BOSS3_BLOCKS.length} blocks, ${BOSS3_BLOCKS.length*CELLS} planned observations, ZERO fights spent`);
