import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {night5ChildArgs} from './night5-child-args.mjs';
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
const [root,hitboxes]=process.argv.slice(2);
assert(root&&hitboxes&&!existsSync(root),'NEW preflight root and hitbox artifact required');
mkdirSync(root,{recursive:true});

// QUALIFY ONLY. There is deliberately no pilot leg: this check declares exactly two
// fights, and a pilot would be a third, undeclared observation of the same boss. The
// qualify pass still proves the encounter initializes -- the runner ticks once and
// asserts the boss actually woke -- and records every starting package, so setup is
// verified without spending a fight on it.
const BLOCK='reference';
const BOSS_ID='apex-timberclaw';
const BOSS={hp:3750,attack:44,plating:0,damageReduction:0};
const SEED=96011;
const SKILL_PATH=['energy-root','energy-heavy'];
const RP_BUDGET=30;
const CASES={
 'bossref-timberclaw-a-historical':{
  treatment:'historical-success', stance:'defensive-stance', rules:5, rp:28,
  weapon:'ruinous-axe', armor:'cave-vest-t2', recovery:'mountain-charm-t2', mobility:'plains-boots-t2',
  techniques:['expose-weakness'], guards:['second-wind','brace'],
 },
 'bossref-timberclaw-b-legacy':{
  treatment:'legacy-benchmark', stance:'offensive-stance', rules:0, rp:30,
  weapon:'gale-needle', armor:'forest-vest-t2', recovery:'forest-charm-t2', mobility:'forest-boots-t2',
  techniques:['charge','contagion','hamstring'], guards:['bramble-guard','endure','cleanse'],
 },
};

const out=join(root,`${BLOCK}-qualify`);
const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/bossScreen.ts',['--trial=bossref',`--block=${BLOCK}`,'--mode=qualify',`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:1800000,windowsHide:true});
writeFileSync(join(root,`${BLOCK}-qualify.log`),result.stdout+'\n'+result.stderr);
assert.equal(result.status,0,result.stderr);

const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
const manifest=read('manifest.json'), index=read('index.json');

assert.equal(manifest.trial,'bossref');
assert.equal(manifest.block,BLOCK);
assert.equal(manifest.bossId,BOSS_ID,'boss identity drift');
assert.equal(manifest.synthetic,true);
assert.equal(manifest.economyEligible,false);
assert.equal(manifest.dtMs,100);
assert.equal(manifest.guardianAccess,'not-measured-guard-stripped');
assert.deepEqual(manifest.seeds,[SEED],'seed drift');
assert.equal(manifest.cells.length,2,'exactly two cases');
assert.equal(index.length,2,'one ready receipt per case');
const arms=[...new Set(manifest.cells.map(c=>c.treatment))].sort();
assert.deepEqual(arms,['historical-success','legacy-benchmark'],`arm drift: ${JSON.stringify(arms)}`);

for(const ready of index){
 const want=CASES[ready.cell];
 assert(want,`unexpected case ${ready.cell}`);
 const d=ready.declaredPackage, a=ready.appliedPackage;

 // The check installs nothing.
 assert.deepEqual(ready.hpTreatment,[],`${ready.cell}: installs nothing`);
 assert.equal(ready.synthetic,true);

 // Boss identity and that it actually WOKE.
 assert.equal(ready.bossId,BOSS_ID);
 assert.equal(ready.bossAuthored.hp,BOSS.hp,`${ready.cell}: boss hp drift`);
 assert.equal(ready.bossAuthored.attack,BOSS.attack,`${ready.cell}: boss attack drift`);
 assert(ready.bossRuntime.maxHp>0,`${ready.cell}: boss never woke`);
 assert(ready.initialRoster.some(m=>m.type===BOSS_ID),`${ready.cell}: boss absent from roster`);
 // Apex Timberclaw summons nothing, so there is no escort receipt to satisfy.
 assert.deepEqual(ready.escortsDeclared,{},`${ready.cell}: this boss has no escorts`);

 // Encounter setup, identical across the two cases.
 assert.equal(ready.encounterSetup.nodeId,'node-t2-forest-dungeon');
 assert.equal(ready.encounterSetup.isDungeon,true);
 assert.equal(ready.encounterSetup.guardHandling,'stripped-before-spawn');
 assert.equal(ready.encounterSetup.bossWake,'forced-immediate');
 assert.equal(ready.encounterSetup.capMs,300000,`${ready.cell}: cap must be 300 s`);
 assert.equal(ready.encounterSetup.seed,SEED);

 // The DECLARED package.
 assert.equal(d.treatment,want.treatment,`${ready.cell}: arm drift`);
 assert.deepEqual(d.skillPath,SKILL_PATH,`${ready.cell}: both cases run the V1i skill path`);
 assert.equal(d.upgradeLevel,5,`${ready.cell}: upgrade level must match across cases`);
 assert.equal(d.stance,want.stance,`${ready.cell}: stance drift`);
 assert.equal(d.gearItemIds.weapon,want.weapon,`${ready.cell}: weapon drift`);
 assert.equal(d.gearItemIds.armor,want.armor,`${ready.cell}: armor drift`);
 assert.equal(d.gearItemIds.recovery,want.recovery,`${ready.cell}: recovery drift`);
 assert.equal(d.gearItemIds.mobility,want.mobility,`${ready.cell}: mobility drift`);
 assert.deepEqual(d.abilities.techniques,want.techniques,`${ready.cell}: technique drift`);
 assert.deepEqual(d.abilities.guards,want.guards,`${ready.cell}: guard drift`);
 assert.equal(d.runeRules.length,want.rules,`${ready.cell}: rule count drift`);

 // The APPLIED package must match what was declared. This is the check that the
 // fight is the package the packet names, not something the factory substituted.
 assert.equal(a.activeStance,want.stance,`${ready.cell}: applied stance != declared`);
 assert.equal(a.runesEquipped.length,want.rules,`${ready.cell}: applied rules != declared`);
 assert.deepEqual(a.attunedAbilities.techniques,want.techniques,`${ready.cell}: applied techniques != declared`);
 assert.deepEqual(a.attunedAbilities.guards,want.guards,`${ready.cell}: applied guards != declared`);
 assert.equal(a.equipment.weapon,want.weapon,`${ready.cell}: applied weapon != declared`);
 assert.equal(a.selectedSubVariant,'heavy',`${ready.cell}: must materialise the energy-heavy frame`);
 for(const [slot,id] of Object.entries(d.gearItemIds)){
  if(slot==='core') continue;
  assert.equal(a.itemUpgrades[id],5,`${ready.cell}: ${id} must be at +5`);
 }

 // RP: legal, and spent the way the package says.
 assert.equal(ready.runicPoints.budget,RP_BUDGET,`${ready.cell}: RP budget drift`);
 assert.equal(ready.runicPoints.cost,want.rp,`${ready.cell}: RP cost drift`);
 assert(ready.runicPoints.cost<=ready.runicPoints.budget,`${ready.cell}: over budget`);

 // Effective stats and resources must be present and sane.
 assert(ready.effectiveStats.maxHp>0&&ready.effectiveStats.attack>0,`${ready.cell}: no effective stats`);
 assert(typeof ready.resources.energyMax==='number',`${ready.cell}: no resource record`);
}

// Both cases must meet the SAME boss at the SAME runtime budget, or this is not a
// controlled comparison of packages.
const [r1,r2]=index;
assert.equal(r1.bossRuntime.maxHp,r2.bossRuntime.maxHp,'the two cases met different boss HP');
assert.equal(r1.bossRuntime.attack,r2.bossRuntime.attack,'the two cases met different boss attack');
assert.equal(r1.encounterSetup.nonBossBodiesAtStart,r2.encounterSetup.nonBossBodiesAtStart,
 'the two cases started against different node populations');

writeFileSync(join(root,'setup-evidence.json'),JSON.stringify(index.map(r=>({
 cell:r.cell, treatment:r.declaredPackage.treatment,
 skillPath:r.declaredPackage.skillPath,
 gear:r.declaredPackage.gearItemIds, upgradeLevel:r.declaredPackage.upgradeLevel,
 stance:r.appliedPackage.activeStance,
 abilities:r.appliedPackage.attunedAbilities,
 ruleCount:r.appliedPackage.runesEquipped.length,
 runicPoints:r.runicPoints,
 effectiveStats:r.effectiveStats,
 resources:r.resources,
 bossRuntime:r.bossRuntime,
 encounterSetup:r.encounterSetup,
})),null,2));

console.log('boss-reference preflight: ok — setup evidence at',join(root,'setup-evidence.json'));
console.log('  two cases qualified, zero fights spent.');
