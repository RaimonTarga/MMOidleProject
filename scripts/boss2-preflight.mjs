import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {night5ChildArgs} from './night5-child-args.mjs';
import {assertDeclarationsApplied} from './boss-verify.mjs';
const source=resolve(fileURLToPath(new URL('..',import.meta.url)));
const [root,hitboxes]=process.argv.slice(2);
assert(root&&hitboxes&&!existsSync(root),'NEW preflight root and hitbox artifact required');
mkdirSync(root,{recursive:true});

// Boss2 qualifies ALL SIX blocks and spends ZERO fights.
//
// There is no pilot, deliberately. Boss1 already proved this runner reaches a real
// boss on this encounter setup, and a pilot here would be an undeclared 37th
// observation of a screen whose whole value is that its size is fixed.
//
// What qualification must prove instead is the thing Boss1 learned the hard way:
// that every cell's DECLARED package is the package preparation actually applies.
// Boss1 ran that check on its earlier slot only, so the later slot's declaration gap
// surfaced after twelve fights had already been spent. Here it runs on all 36 cells
// before any combat.
const BLOCKS=[
 {name:'razortusk',bossId:'gorging-razortusk',hp:4000,attack:96,
  escorts:{'plains-slime':{hp:50,attack:12},'boar':{hp:100,attack:18}}},
 {name:'juggernaut',bossId:'stoneplate-juggernaut',hp:5000,attack:128,escorts:{}},
 {name:'behemoth',bossId:'mire-gorged-behemoth',hp:3375,attack:38,escorts:{}},
 {name:'dreadbore',bossId:'chitinous-dreadbore',hp:4375,attack:139,escorts:{}},
 {name:'emperor',bossId:'dune-stalker-emperor',hp:3750,attack:85,escorts:{}},
 {name:'gorger',bossId:'jungle-dread-gorger',hp:3625,attack:85,escorts:{}},
];
const SEED=98011, CELLS=6, CAP_MS=300000;

/**
 * The reference packages are PORTABLE: one fixed package per root, carried onto
 * every boss. That claim is checkable rather than asserted -- if the packages are
 * the same, each root's effective stats must be IDENTICAL on all six bosses, since
 * nothing about the player depends on which boss is standing there. A divergence
 * means a cell was quietly re-equipped and the screen is no longer comparable.
 */
const perRootStats={};

for(const BLOCK of BLOCKS){
 const out=join(root,BLOCK.name);
 const result=spawnSync(process.execPath,night5ChildArgs(source,'server/scripts/bossScreen.ts',['--trial=boss2',`--block=${BLOCK.name}`,'--mode=qualify',`--out=${out}`,`--hitboxes=${hitboxes}`]),{cwd:source,encoding:'utf8',timeout:1800000,windowsHide:true});
 writeFileSync(join(root,`${BLOCK.name}-qualify.log`),result.stdout+'\n'+result.stderr);
 assert.equal(result.status,0,result.stderr);
 const read=n=>JSON.parse(readFileSync(join(out,n),'utf8'));
 const manifest=read('manifest.json'),index=read('index.json');

 assert.equal(manifest.trial,'boss2');
 assert.equal(manifest.block,BLOCK.name);
 assert.equal(manifest.bossId,BLOCK.bossId,`${BLOCK.name}: boss identity drift`);
 assert.equal(manifest.synthetic,true);
 assert.equal(manifest.economyEligible,false);
 assert.equal(manifest.dtMs,100);
 assert.equal(manifest.durationMs,CAP_MS,`${BLOCK.name}: cap drift`);
 assert.deepEqual(manifest.seeds,[SEED],`${BLOCK.name}: seed drift`);
 // Guardian access stays a SEPARATE question: the guard is stripped by design and
 // the manifest must say so rather than let a reader pool access into a boss figure.
 assert.equal(manifest.guardianAccess,'not-measured-guard-stripped');
 assert.equal(manifest.cells.length,CELLS,`${BLOCK.name}: six roots must qualify`);
 assert.equal(new Set(manifest.cells.map(c=>c.className)).size,CELLS,'roots must be distinct');
 const arms=[...new Set(manifest.cells.map(c=>c.treatment))];
 assert.deepEqual(arms,['reference-portable'],
  `${BLOCK.name}: every cell is a portable reference, got ${JSON.stringify(arms)}`);
 assert.equal(index.length,CELLS,'one ready receipt per root');

 for(const ready of index){
  assert.deepEqual(ready.hpTreatment,[],`${ready.cell}: Boss2 installs nothing`);
  assert.equal(ready.synthetic,true);
  assert.equal(ready.bossId,BLOCK.bossId);
  // The boss must have WOKEN and be standing at its authored budget. `--mode boss`
  // spent its entire history measuring dungeon GUARDS, so "the boss is here" is the
  // one thing a boss preflight must prove rather than assume.
  assert.equal(ready.bossAuthored.hp,BLOCK.hp,`${ready.cell}: boss hp drift`);
  assert.equal(ready.bossAuthored.attack,BLOCK.attack,`${ready.cell}: boss attack drift`);
  assert(ready.bossRuntime.maxHp>0,`${ready.cell}: boss never woke`);
  assert(ready.initialRoster.some(m=>m.type===BLOCK.bossId),`${ready.cell}: boss absent from the roster`);
  assert(!ready.initialRoster.some(m=>m.type!==BLOCK.bossId),`${ready.cell}: a non-boss body is standing at the bell`);
  // The reference SHAPE. Applied-versus-declared is the shared checker below.
  const d=ready.declaredPackage;
  assert.equal(d.stance,'defensive-stance',`${ready.cell}: reference stance drift`);
  assert.equal(d.sources.stance,'explicit',`${ready.cell}: the reference states its stance`);
  assert.equal(d.runeRules.length,5,`${ready.cell}: reference carries five ordered rules`);
  assert.equal(d.runeRules[1].actionId,'step-back',`${ready.cell}: Step Back precedes the movement rule`);
  assert.deepEqual(d.abilities.techniques,['expose-weakness'],`${ready.cell}: technique drift`);
  assert.deepEqual(d.abilities.guards,['second-wind','brace'],`${ready.cell}: guard drift`);
  // The escort receipt rule, per boss. Only the Razortusk summons, so only its
  // receipt has teeth; the other five must declare none rather than inherit a list.
  assert.deepEqual(ready.escortsDeclared,BLOCK.escorts,`${ready.cell}: escort declaration drift`);
  for(const [id,want] of Object.entries(BLOCK.escorts)){
   assert.equal(ready.escortsAuthored[id].hp,want.hp,`${ready.cell}: ${id} hp is not the authored value`);
   assert.equal(ready.escortsAuthored[id].attack,want.attack,`${ready.cell}: ${id} attack drift`);
  }
  const root_=ready.cell.split('-').pop();
  const seen=JSON.stringify(ready.effectiveStats);
  if(perRootStats[root_]===undefined) perRootStats[root_]={first:BLOCK.name,stats:seen};
  else assert.equal(seen,perRootStats[root_].stats,
   `${ready.cell}: this root's package differs from the one qualified on ${perRootStats[root_].first} — the references are not portable`);
 }
 // THE check. Same function the formal run uses, at zero fights spent.
 assertDeclarationsApplied(index);
 console.log(`${BLOCK.name} qualify ok — 6 portable references, boss awake, declarations applied`);
}

assert.equal(Object.keys(perRootStats).length,6,'six distinct roots must have qualified');
writeFileSync(join(root,'qualification.json'),JSON.stringify({
 trial:'boss2',blocks:BLOCKS.map(b=>b.name),bosses:BLOCKS.map(b=>b.bossId),
 seed:SEED,capMs:CAP_MS,cells:CELLS,plannedObservations:BLOCKS.length*CELLS,
 fightsSpent:0,perRootStats,
},null,2));
console.log(`boss2 preflight: ok — ${BLOCKS.length} blocks, ${BLOCKS.length*CELLS} planned observations, ZERO fights spent`);
