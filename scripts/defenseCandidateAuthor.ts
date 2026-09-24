// Reproducible authoring aid for the isolated defense candidate; not runtime code.
import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {RECIPE_DATABASE} from '../shared/src/recipeDatabase';
import {SKILL_TREE} from '../shared/src/skillTree';
const mode=process.argv[2];
process.chdir(resolve(__dirname,'..'));
const replacements=new Map<string,Record<string,unknown>>();
if(mode==='cores'){
 for(const [id,damage] of [['core-force',.18],['core-scout',.12],['core-sniper',.25]] as const){
  const r=RECIPE_DATABASE.get(id)!;const m={...r.mechanicEffects};m['core.damage-dealt-pct']=damage;delete m['core.maxhp-mult'];delete m['core.plating-mult'];
  replacements.set(id,{mechanicEffects:m,description:id==='core-scout'?'Amplifies movement and mobility abilities, with a modest damage bonus.':id==='core-sniper'?'Amplifies ranged damage without reducing your health.':'A focused damage amplifier; choosing it forgoes another core’s protection.'});
 }
 // Melee durability is intentional role compensation: preserve Bruiser and Duelist.
}else if(mode==='defenses'){
 for(const r of RECIPE_DATABASE.values()){
  if(r.slot!=='armor'||r.tier===0)continue;
  const t=r.tier,b=r.recipeGroup;
  const factor=['mountain','tundra'].includes(b)?1.2:['swamp','graveyard'].includes(b)?1.05:['forest','jungle'].includes(b)?.95:b==='plains'?.9:1;
  const hp=Math.round([0,30,55,100,180][t]*factor);
  const specialist=['plains','volcanic'].includes(b);
  const plate=specialist?[0,2,5,8,12][t]:['mountain','tundra'].includes(b)?Math.round([0,2,5,8,12][t]/4):0;
  const stats:Record<string,number>={maxHp:hp,...(plate?{plating:plate}:{})};
  const m:Record<string,number>={};let desc='';
  if(['forest','jungle'].includes(b)){stats.evasion=b==='forest'?(t===1?.28:.34):[0,0,.28,.32,.36][t];m['defense.evade-mitigation']=b==='forest'?.1:[0,0,.2,.25,.3][t];desc='Evades soften direct hits and prevent eligible on-hit ailments. Jungle weave strengthens each evade.';}
  if(['cave','trench'].includes(b)){stats.damageReduction=[0,.10,.12,.14,.16][t];if(b==='trench'){m['defense.sustained-fight-dr-bonus']=.01;m['defense.sustained-fight-dr-max']=.05;m['defense.sustained-fight-ramptime-ms']=10000;}desc='Dependable protection against direct damage and damage over time.';}
  if(b==='mountain'){m['guard.potency-pct']=[0,.15,.2,.25,.3][t];desc='A sturdy health reserve that strengthens timed Guards.';if(r.id.includes('stormwall')){m['guard.potency-pct']=.2;m['defense.barrier-pct']=.1;m['defense.barrier-break-hp-recovery-pct']=.2;desc='Strengthens timed Guards and grants a small barrier that heals you when broken.';}}
  if(b==='swamp'||b==='graveyard'){m['defense.dot-resistance']=b==='swamp'?[0,.25,.3,.35][t]:r.id.includes('debtward')?.25:.4;if(t>=2)m['defense.hit-to-dot-pct']=b==='swamp'?(t===2?.15:.2):r.id.includes('debtward')?.3:.15;if(t>=3)m['defense.debuff-resistance']=.2;desc='Resists damage over time and spreads part of incoming direct damage into debt.';}
  if(b==='desert'){m['defense.engagement-dr-pct']=[0,0,.30,.35,.40][t];m['defense.engagement-dr-ms']=4000;desc='Gain strong damage reduction for 4 seconds when a hostile engagement begins. Rearms after 6 seconds without engagement or incoming attacks.';}
  if(b==='tundra'){m['defense.stationary-dr-pct']=t===3?.15:.2;m['defense.stationary-dr-ramptime-ms']=3000;desc='Build damage reduction over 3 seconds while holding position in combat. Moving or leaving combat sheds it over 1 second.';}
  if(b==='volcanic'){const max=t===3?4:r.id.includes('lavatempered')?3:6;m['defense.hardening-max']=max;m['defense.hardening-per-sec']=max/6;m['defense.hardening-reset-pct']=.25;if(r.id.includes('lavatempered')){m['defense.overheal-ward-pct']=.5;m['defense.overheal-ward-cap-pct']=.15;}desc='Hardens under incoming attacks. Heavy gross impacts crack half the earned plating, even through shields.';}
  if(b==='plains')desc='Flat plating specializes in frequent small direct hits.';
  const maxPlate=specialist?[0,3,8,12,18][t]:Math.round(plate*1.5);
  const ups=(r.upgrades??[]).map((u,i)=>{const st:Record<string,number>={maxHp:Math.round(hp*.1*(i+1))-Math.round(hp*.1*i)};if(plate)st.plating=Math.round((maxPlate-plate)*(i+1)/5)-Math.round((maxPlate-plate)*i/5);if(stats.evasion)st.evasion=b==='forest'?.016:.016;if(stats.damageReduction)st.damageReduction=.008;const me:Record<string,number>={};if(b==='mountain')me['guard.potency-pct']=.02;if(b==='swamp'||b==='graveyard')me['defense.dot-resistance']=.02;if(b==='desert')me['defense.engagement-dr-pct']=.01;const {stats:old,mechanicEffects:oldMe,...rest}=u;return {...rest,stats:st,...(Object.keys(me).length?{mechanicEffects:me}:{})};});
  replacements.set(r.id,{stats,mechanicEffects:m,upgrades:ups,description:desc});
 }
 for(const n of SKILL_TREE.values()){
  if(n.tier>2)continue;
  const st={...n.statEffects},me={...n.mechanicEffects};
  if(n.tier===0){if(n.id==='cooldown-root'){st.platingPct=.1;st.damageReduction=.06;}if(n.id==='cadence-root'){st.maxHpPct=.25;st.platingPct=.05;st.damageReduction=.04;delete me['defense.max-hit-pct'];delete me['defense.max-hit-mult'];}if(n.id==='dot-root'){delete st.platingPct;me['defense.hit-to-dot-pct']=.15;}if(n.id==='reload-root')me['defense.evade-mitigation']=.1;}
  if(n.tier===1){const heavy=n.id.endsWith('-heavy'),balanced=n.id.endsWith('-balanced');st.platingPct=/^(cooldown|cadence)-/.test(n.id)?heavy?.1:balanced?.05:0:heavy?.05:0;}
  if(n.tier===2){delete st.platingPct;if(n.id==='cooldown-range-close')me['defense.recovery-active-pct']=.1;}
  replacements.set(n.id,{statEffects:st,mechanicEffects:me});
 }
 const jug=RECIPE_DATABASE.get('core-juggernaut')!;
 replacements.set(jug.id,{mechanicEffects:{...jug.mechanicEffects,'core.maxhp-mult':.2,'core.plating-mult':.1,'core.damage-taken-pct':-.1}});
}
else throw Error('Use cores or defenses');
const files=[...readdirSync(resolve('shared/src/data/recipes')).filter(x=>x.endsWith('.recipes.ts')).map(x=>resolve('shared/src/data/recipes',x)),resolve('shared/src/data/skillTree/rootsAndFrames.ts')];
for(const path of files){const source=readFileSync(path,'utf8');const sf=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true);const edits:{start:number,end:number,text:string}[]=[];
 function visit(n:ts.Node){if(ts.isObjectLiteralExpression(n)){const props=n.properties.filter(ts.isPropertyAssignment);const id=props.find(p=>p.name.getText(sf)==='id');if(id&&ts.isStringLiteral(id.initializer)){const values=replacements.get(id.initializer.text);if(values){for(const [key,value]of Object.entries(values)){const p=props.find(p=>p.name.getText(sf)===key);const text=JSON.stringify(value,null,2);if(p)edits.push({start:p.initializer.getStart(sf),end:p.initializer.end,text});else edits.push({start:n.end-1,end:n.end-1,text:`\n${key}: ${text},\n`});}}}}ts.forEachChild(n,visit);}visit(sf);
 let next=source;for(const e of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.text+next.slice(e.end);if(edits.length)writeFileSync(path,next.replace(/\r\n/g,'\n'));
}
console.log(`Authored ${mode}: ${replacements.size} definitions`);
