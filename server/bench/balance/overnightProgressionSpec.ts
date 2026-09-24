import assert from 'node:assert/strict';
import { DUNGEON_DEFS, NODE_BIOMES, runicPointLoadoutCost } from '@mmo-idle/shared';
import { SURVEY_CLASSES } from './ttkSurveySpec';
import type { BreadthCell } from './playerBreadthSpec';
import { PROGRESSION_SNAPSHOTS } from './progressionSnapshot';
export const PROGRESSION_ID='overnight-t1-t3-progression-01';
export const PROGRESSION_ENDPOINTS=[300000,600000,1200000];
export interface ProgressionCell extends BreadthCell {seed:number;block:string;arm:string;comparisonId:string;boss?:string; snapshotId:string}
const frames=['light','balanced','heavy'] as const;
function make(root:typeof SURVEY_CLASSES[number],frame:typeof frames[number],group:string,snapshotId:string,seed:number,block:string,boss=false):ProgressionCell {
 const s=PROGRESSION_SNAPSHOTS[snapshotId],t=s.tier,melee=root.melee;
 const dungeon=boss?[...DUNGEON_DEFS.values()].find(d=>d.biomeTier===t && NODE_BIOMES[d.nodeId].biomeGroup===group):undefined;
 assert(!boss||dungeon,`Missing boss ${t}/${group}`);
 const nodeId=dungeon?.nodeId??`node-t${t}-${group}-${['jungle','desert','volcanic','tundra'].includes(group)?'01':group==='cave'?'02':group==='mountain'?'04':'03'}`;
 assert(NODE_BIOMES[nodeId]?.biomeTier===t && !(!boss&&NODE_BIOMES[nodeId].isDungeon));
 const identityId=`t${t}-${root.name}${t>1?'-'+frame:''}`;
 const id=`op-${identityId}-${group}-${boss?'boss':snapshotId}-s${seed}`;
 const desertMelee=group==='desert'&&melee;
 let weapon=t===1?(root.name==='squire'?'heavy-hammer':'chaotic-axe'):root.name==='squire'?(t===2?'quake-hammer':'mountain-avalanche-maul'):(t===2?'ruinous-axe':'cave-cataclysm-axe');
 if(t>1&&!desertMelee&&root.name!=='squire') {
   if(frame==='heavy'&&['apprentice','conduit','spirit'].includes(root.name)) weapon=t===2?'quake-hammer':'mountain-avalanche-maul';
   if((s.mastery.jungle??0)>=4 && ['slinger','striker'].includes(root.name))weapon=t===2?'jungle-stinger-rapier':'jungle-venomthorn-rapier';
   if((s.mastery.jungle??0)>=4 && frame==='light'&&['conduit','spirit'].includes(root.name))weapon=t===2?'jungle-stinger-rapier':'jungle-venomthorn-rapier';
 }
 let armor=['swamp','jungle'].includes(group)?'swamp':['mountain','cave','desert','tundra','volcanic'].includes(group)?'mountain':'plains';
 const charm=root.name==='spirit'?'mountain':boss&&group==='plains'?'plains':'swamp';
 const boots=melee?'mountain':group==='cave'||group==='mountain'?'cave':(s.mastery.desert??0)>=4?'desert':'swamp';
 const tierFor=(g:string)=>t===3&&['plains','forest'].includes(g)?2:t;
 const stance=t===1?null:(desertMelee||group==='tundra'||(boss&&t===3))?'defensive-stance':'offensive-stance';
 const aoe=group==='plains'||group==='forest'||group==='jungle'||group==='volcanic';
 const abilities={techniques:[aoe?(t>1&&(root.name==='squire'||root.name==='apprentice'&&frame==='heavy')?'slam':'sweep'):'power-strike'],
   guards:['second-wind',...(['swamp','jungle','desert'].includes(group)?['cleanse']:[]),...(['mountain','cave','desert','tundra','volcanic'].includes(group)?['brace']:[])]};
 const rules:any[]=[{conditionId:'always',actionId:'auto-path-enemy'},
   {conditionId:'inside-telegraph',actionId:'step-back'},
   ...(!melee?[{conditionId:'in-combat',actionId:'orbit'}]:[]),
   ...(['swamp','jungle','volcanic'].includes(group)?[{conditionId:'always',actionId:'avoid-hazards'}]:[]),
   {conditionId:'always',actionId:'wait-for-regen'}];
 if(desertMelee&&(s.mastery.desert??0)>=4)rules.unshift({conditionId:'in-combat',actionId:'focus-lowest-hp'});
 if(boss&&t>1&&abilities.guards.includes('brace'))rules.push({conditionId:'target-casting',actionId:'use-ability',targetAbilityId:'brace'});
 if(t===3&&group==='tundra')abilities.techniques=['power-strike','hamstring'];
 // Volcano boss: fixed persistent mitigation plus native low-HP Endure;
 // target-casting Brace stays the separately timed native reaction, no overlap claim.
 if(boss&&group==='volcanic')abilities.guards.push('endure');
 const c:ProgressionCell={id,identityId,className:root.name,frame,pathName:t===1?'root':frame,range:t<3?null:melee?'close':'mid',
   tier:t,role:boss?'boss':'farm',nodeId,isDungeon:boss,alternate:false,targetTypes:dungeon?[dungeon.boss.bossId]:[],
   treatment:'control',playerTreatment:'untreated',controlCaseId:null,preparationNotes:['Fixed synthetic route snapshot; prior costs declared; native triggers unless an explicit rule overrides.', 'Omitted guards/movement remain explicit in the package, no outcome-driven rescue.'],
   seed,block,arm:'primary',comparisonId:id,snapshotId,progressionSnapshot:s,upgradeLevel:s.plus,stance,abilities,runeRules:rules,
   ...(dungeon?{boss:dungeon.boss.bossId}:{}),
   build:{id,classRoot:`${root.prefix}-root`,contentTier:t,playerTier:t,gearTier:t,
     skillPath:[`${root.prefix}-root`,...(t>1?[`${root.prefix}-${frame}`]:[]),...(t>2?[`${root.prefix}-range-${melee?'close':'mid'}`]:[])],
     gearItemIds:{weapon,armor:`${armor}-vest-t${tierFor(armor)}`,recovery:`${charm}-charm-t${tierFor(charm)}`,mobility:`${boots}-boots-t${tierFor(boots)}`,
       ...(t>1?{core:root.name==='conduit'&&(s.mastery.jungle??0)>=6?'core-survivalist':'core-tempered'}:{})}}};
 // The 20-RP T1 budget prioritises the encounter answer over optional offense.
 if(t===1 && runicPointLoadoutCost({rules,abilities,stances:[],rites:[]})>s.rp)abilities.techniques=[];
 assert(runicPointLoadoutCost({rules,abilities,stances:stance?[stance]:[],rites:[]})<=s.rp,`${id}: RP conflict`);
 return c;
}
const groups:ProgressionCell[][]=[];
function add(c:ProgressionCell){const pair=[c];
 if(c.block==='A'&&c.snapshotId==='t1-developed'&&['striker','slinger','spirit'].includes(c.className)&&['plains','mountain'].includes(NODE_BIOMES[c.nodeId].biomeGroup)) {
  const alt=structuredClone(c);alt.id+='-flash';alt.build.id=alt.id;alt.block='A-W';alt.arm='flash-rapier';alt.build.gearItemIds.weapon='flash-rapier';pair.push(alt);
 }
 if(c.block==='B'&&c.snapshotId.includes('desert')&&['striker','squire'].includes(c.className)) {
  const alt=structuredClone(c);alt.id+='-cave';alt.build.id=alt.id;alt.block='B-C';alt.arm='cave-charm';alt.build.gearItemIds.recovery='cave-charm-t2';pair.push(alt);
 }
 if(c.seed===101033)pair.reverse();groups.push(pair);
}
for(const seed of [101009,101033]) {
 for(const root of SURVEY_CLASSES)add(make(root,'balanced','plains','t1-developed',seed,'A'));
 for(const root of SURVEY_CLASSES)for(const frame of frames)for(const g of ['jungle','desert'])add(make(root,frame,g,`t2-${g}-arrival`,seed,'B'));
 const queues:ProgressionCell[][]=[[],[],[],[],[],[]];
 for(const root of SURVEY_CLASSES)for(const snap of ['t1-developed','t1-complete'])for(const g of ['plains','forest','swamp','mountain','cave'])if(!(snap==='t1-developed'&&g==='plains'))queues[0].push(make(root,'balanced',g,snap,seed,'A'));
 for(const root of SURVEY_CLASSES)for(const frame of frames)for(const g of ['jungle','desert'])queues[1].push(make(root,frame,g,`t2-${g}-established`,seed,'B'));
 for(const root of SURVEY_CLASSES)for(const frame of frames)for(const g of ['swamp','mountain','cave','jungle','desert','volcanic','tundra'])queues[2].push(make(root,frame,g,g==='tundra'?'t3-tundra-arrival':'t3-developed',seed,'C'));
 for(const root of SURVEY_CLASSES)for(const g of ['plains','mountain'])queues[3].push(make(root,'balanced',g,'t1-developed',seed,'D1',true));
 for(const root of SURVEY_CLASSES)for(const frame of frames)for(const g of ['plains','swamp'])queues[4].push(make(root,frame,g,'t2-desert-established',seed,'D2',true));
 for(const root of SURVEY_CLASSES)for(const frame of frames)for(const g of ['mountain','volcanic'])queues[5].push(make(root,frame,g,'t3-tundra-arrival',seed,'D3',true));
 while(queues.some(q=>q.length))for(const q of queues){const c=q.shift();if(c)add(c);}
}
export const PROGRESSION_CELLS=groups.flat();
export const PROGRESSION_BLOCKS=Object.fromEntries(PROGRESSION_CELLS.map(c=>[c.id,{cells:[c],durationMs:c.role==='farm'?1200000:300000,pilotIds:[] as string[]} ]));
export function assertProgressionDefinitions(){assert.equal(PROGRESSION_CELLS.length,720);assert.equal(new Set(PROGRESSION_CELLS.map(c=>c.id)).size,720);
 assert.deepEqual(Object.fromEntries(['A','A-W','B','B-C','C','D1','D2','D3'].map(b=>[b,PROGRESSION_CELLS.filter(c=>c.block===b).length])),{A:120,'A-W':12,B:144,'B-C':24,C:252,D1:24,D2:72,D3:72});}
assertProgressionDefinitions();

for(const seed of [101009,101033])for(const role of ['farm','boss']){
 const cells=PROGRESSION_CELLS.filter(c=>c.seed===seed&&c.role===role);
 const bosses=role==='farm'?['farm']:[...new Set(cells.map(c=>c.boss!))];
 for(const boss of bosses){const selected=cells.filter(c=>role==='farm'||c.boss===boss);PROGRESSION_BLOCKS[`qualification-${seed}-${boss}`]={cells:selected,durationMs:role==='farm'?1200000:300000,pilotIds:[]};}
}
