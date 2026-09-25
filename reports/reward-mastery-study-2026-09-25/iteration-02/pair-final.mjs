import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const load=p=>JSON.parse(readFileSync(resolve(here,p)));
const candidates=new Map();
for(const batch of ['screen','confirmation'])for(const row of load(batch+'/summary.json'))if(row.arm==='candidate')candidates.set(row.id,row);
const controls=load('frozen-controls-final/summary.json');
const pairs=[];
for(const b of controls){const c=candidates.get(b.id.replace('baseline-','candidate-'));if(!c)throw Error('No candidate for '+b.id);pairs.push({baseline:b,candidate:c});}
writeFileSync(resolve(here,'paired-final.json'),JSON.stringify(pairs,null,2));
const fmt=x=>x==null?'not observed':x.toFixed(2);
const lines=['# Final pairs: isolated candidate and frozen controls','','Primary comparison only. Earlier mutable-main controls are superseded. Timings are simulated minutes; mature supported equipment is retained. Candidate funding benchmarks are native sets, not the equipped mixed-biome set. Four-minute external / three-minute soft runtime ceilings are operational censoring, not death.','','| Setup / node | Seed | Baseline mastery | Candidate budget | Candidate mastery | Candidate +3 funding | Candidate +5 funding | Baseline / candidate window |','|---|---:|---:|---:|---:|---:|---:|---|'];
for(const {baseline:b,candidate:c} of pairs)lines.push(`| ${c.setup} / ${c.node} | ${c.seed} | ${fmt(b.mastery)} | ${c.budget} | ${fmt(c.mastery)} | ${fmt(c.fund3)} | ${fmt(c.fund5)} | ${fmt(b.duration)}${b.runtimeCensored?' (runtime cap)':''} / ${fmt(c.duration)}${c.runtimeCensored?' (runtime cap)':''} |`);
writeFileSync(resolve(here,'PAIRS.md'),lines.join('\n')+'\n');
console.log(JSON.stringify({pairs:pairs.length,deaths:pairs.filter(p=>p.baseline.death!==null||p.candidate.death!==null).length,groups:[...new Set(pairs.map(p=>p.candidate.node))].map(node=>({node,baseline:pairs.filter(p=>p.candidate.node===node).map(p=>p.baseline.mastery),candidate:pairs.filter(p=>p.candidate.node===node).map(p=>p.candidate.mastery)}))},null,2));
