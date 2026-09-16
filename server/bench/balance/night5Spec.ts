import { NODE_BIOMES } from '@mmo-idle/shared';
import { DURABILITY20_CELLS, installDurability20Treatment } from './durability20Spec';
import { SURVEY_CLASSES, type SurveyCell } from './ttkSurveySpec';
export const NIGHT5_SEEDS = [26003,28001,30011] as const;
export type Night5Cell = SurveyCell & { treatment:string; targetTypes:string[] };
const copy=(c:Night5Cell,id:string):Night5Cell=>({...c,id,build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}});
const mountain=DURABILITY20_CELLS.filter(c=>c.role==='mountain').flatMap(c=>{
 const melee=SURVEY_CLASSES.find(x=>x.name===c.className)!.melee;
 return (melee?[false]:[true,false]).flatMap(orbit=>['mountain','cave'].map(boots=>{
  const treatment=`${orbit?'orbit':'no-orbit'}-${boots}`;
  const n=copy(c,`night5-mountain-t${c.tier}-${c.className}-${c.nodeId.slice(-2)}-${treatment}`);
  n.treatment=treatment;n.orbit=orbit;n.build.gearItemIds.mobility=`${boots}-boots-t${c.tier}`;return n;
 }));
});
const weapons=DURABILITY20_CELLS.filter(c=>['cave','desert',c.tier===2?'plains':'volcanic'].includes(c.role)).flatMap(c=>{
 const alternative=c.className==='squire'?(c.tier===2?'ruinous-axe':'cave-cataclysm-axe'):
 c.className==='striker'?(c.tier===2?'quake-hammer':'mountain-avalanche-maul'):
 c.className==='slinger'?(c.tier===2?'swamp-mirebrand':'swamp-blightbrand'):
 (c.tier===2?'jungle-stinger-rapier':'jungle-venomthorn-rapier');
 return ['baseline','alternate'].map(treatment=>{
  const n=copy(c,`night5-weapons-t${c.tier}-${c.role}-${c.className}-${c.nodeId.slice(-2)}-${treatment}`);
  n.treatment=treatment;if(treatment==='alternate') n.build.gearItemIds.weapon=alternative;return n;
 });
});
const t4Weapons:Record<string,string>={striker:'volcanic-eruption-lash',squire:'mountain-warmaul',apprentice:'graveyard-plague-axe',slinger:'jungle-deathfang-rapier',conduit:'jungle-deathfang-rapier',spirit:'volcanic-eruption-lash'};
const t4=(branch:string):Night5Cell[]=>Object.keys(NODE_BIOMES).filter(id=>/^node-t4-.+-(03|05)$/.test(id)).sort().flatMap(nodeId=>SURVEY_CLASSES.map(c=>{
 const role=NODE_BIOMES[nodeId].biomeGroup,id=`night5-t4${branch}-${role}-${nodeId.slice(-2)}-${c.name}-baseline`;
 return {id,nodeId,tier:4,className:c.name,role,alternate:false,treatment:'baseline',targetTypes:[],technique:'sweep',
 build:{id,classRoot:`${c.prefix}-root`,contentTier:4,playerTier:4,gearTier:4,
 skillPath:[`${c.prefix}-root`,`${c.prefix}-balanced`,`${c.prefix}-range-${c.melee?'close':'mid'}`,`${c.prefix}-balanced-t3-${branch}`],
 gearItemIds:{weapon:t4Weapons[c.name],armor:`${role}-vest-t4`,recovery:`${role}-charm-t4`,mobility:'mountain-boots-t4',core:'core-tempered',relic:'relic-colossus-heart'}}};
}));
const sustain=DURABILITY20_CELLS.filter(c=>(c.tier===2&&['forest','swamp'].includes(c.role))||(c.tier===3&&['volcanic','tundra'].includes(c.role))).map(c=>copy(c,c.id.replace('dur20','night5-sustain')));
export const NIGHT5_BLOCKS:Record<string,{cells:Night5Cell[];durationMs:number;pilotIds:string[]}>=Object.fromEntries([
 ['mountain',mountain,900000],['t4a',t4('a'),900000],['weapons',weapons,900000],['t4b',t4('b'),900000],['sustain',sustain,1800000],['t4c',t4('c'),900000],
].map(([name,raw,duration])=>{const cells=raw as Night5Cell[];return [name,{cells,durationMs:duration as number,pilotIds:cells.filter((c,i)=>name==='mountain'?c.className==='apprentice'&&c.tier===2&&c.nodeId.endsWith('03'):name==='weapons'?c.nodeId.endsWith('03')&&c.role==='cave':name==='sustain'?c.className==='striker'&&c.nodeId.endsWith('03'):c.nodeId.endsWith('03')).map(c=>c.id)}];}));
export function installNight5Treatment(cell:Night5Cell){return installDurability20Treatment({...cell,treatment:'selected',technique:'sweep',stance:cell.stance??'offensive-stance'});}
