import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const json=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const m=json('manifest.json'),rows=json('resolved-builds.json');
assert.equal(m.planned,44);assert.equal(m.cases.length,44);assert.equal(rows.length,44);
assert.equal(new Set(m.cases.map(c=>c.id)).size,44);
const identities=json('identity.json');
assert.equal(identities.control.sourceCommit,'0d392fdddaec7ed31876699589f291c8c840a5e5');
assert.deepEqual(identities.control,identities.candidate);
for(const [name,digest] of Object.entries(json('seal.json')))assert.equal(hash(join(root,name)),digest);
for(const kind of ['qualification','receipt-check']){
 const c=json(`${kind}-complete.json`);assert.equal(c.qualified,44);assert.equal(c.failed,0);assert.equal(c.combatObservations,0);
 for(const file of json(`${kind}-raw-inventory.json`)){assert(existsSync(file.path),file.path);assert.equal(hash(file.path),file.sha256,file.path);}
}
assert.equal(json('qualified.json').receiptsSha256,json('receipt-checked.json').receiptsSha256);
assert.equal(hash(join(root,'resolved-builds.json')),json('qualified.json').receiptsSha256);
const groups=new Map();let candidateCount=0;
for(const c of m.cases){
 const r=rows.find(r=>r.observationId===c.id).ready,p=r.packageReadback;
 assert.equal(r.runtime.revision,identities.control.sourceCommit);assert.equal(r.runtime.durationMs,600000);assert.equal(r.runtime.dtMs,100);
 assert.equal(r.seed,c.seed);assert.equal(r.view.hp,r.view.maxHp);assert.equal(r.view.barrier,r.view.barrierMax);
 assert.equal(r.candidate,c.candidate??null);assert.equal(r.definitionsIdentity.treated,!!c.candidate);
 assert(!p.rites.includes('blood-offering'));assert(!p.progression.purchases.some(x=>x.id.includes('blood-offering')));
 assert.deepEqual(p.declared.abilities,c.abilities);assert.deepEqual(p.declared.runeRules,c.runeRules);
 assert(p.runicPoints.cost<=p.runicPoints.budget);assert(!/volcanic|graveyard-dungeon/.test(c.nodeId));
 if(c.candidate){candidateCount++;const key=c.candidate==='D'?'mobility.kite-speed-pct':c.candidate==='S'?'mobility.slow-resistance':'technique.power-pct';
  const expected=c.candidate==='D'?.3:c.candidate==='A'?.3:c.tier===2?.48:.56;
  assert(Math.abs(r.resolvedPassives[key]-expected)<1e-10,`${c.id} ${key}`);
 }
 const partners=groups.get(c.comparisonId)??[];
 for(const partner of partners){assert.equal(partner.initialRosterHash,r.initialRosterHash);assert.deepEqual(partner.packageReadback.mastery,p.mastery);assert.deepEqual(partner.packageReadback.skillPath,p.skillPath);}
 partners.push(r);groups.set(c.comparisonId,partners);
}
assert.equal(candidateCount,12);assert.equal(groups.size,20);
const files={};
function visit(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())visit(p);else if(!['publication-validation.json','publication-receipt.json'].includes(e.name)){if(e.name.endsWith('.json'))JSON.parse(readFileSync(p,'utf8'));files[p.slice(root.length+1).replaceAll('\\','/')]=hash(p);}}}
visit(root);
writeFileSync(join(root,'publication-validation.json'),JSON.stringify({status:'passed',planned:44,qualified:44,receiptReplayed:44,combatObservations:0,candidateCells:12,comparisonGroups:20,sourceCommit:identities.control.sourceCommit,files},null,2)+'\n');
console.log('44 exact packages; seals, paired ecology, candidate passives, RP, external inventories and byte-identical receipt replay verified.');
