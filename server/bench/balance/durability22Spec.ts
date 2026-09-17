import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {NIGHT5_BLOCKS,type Night5Cell} from './night5Spec';
export const DURABILITY22_SEEDS=[38011,40009,42013] as const;
// Experimental HP-led package. Preserve absolute ward/shell/self-shatter budgets.
export const DURABILITY22_HP:Record<string,[number,number]>={
 'elder-leviathan':[5880,17640],'abyssal-serpent':[4200,16800],'hadal-stalker':[2800,16800],
 'granite-mammoth':[1150,6900],'cragback-rhino':[1100,6600],
 'avalanche-tyrant':[800,1600],'cliffside-roc':[850,1700],
 'permafrost-behemoth':[1914,7656],'glacial-direbear':[1221,4884],
 'rime-tusk-mastodon':[1100,3300],'hoarfrost-yeti':[900,1800],
 'sand-viper':[1343,4029],'dune-basilisk':[1501,4503],'dune-tyrant':[1738,6952],
};
export const DURABILITY22_BLOCKS=Object.fromEntries(['trench','mountain','tundra','desert'].map(role=>{
 const cells=NIGHT5_BLOCKS.t4a.cells.filter(c=>c.role===role).flatMap(c=>['control','candidate'].map(treatment=>{
  const id=c.id.replace('night5-t4a','dur22').replace(/baseline$/,treatment);
  return {...c,id,treatment,build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}};
 }));
 return [role,{cells,durationMs:role==='trench'?600000:300000,pilotIds:cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id)}];
}));
export function installDurability22Treatment(cell:Night5Cell){
 const saved=Object.entries(DURABILITY22_HP).map(([type,[before,after]])=>{
  const d=MONSTER_DATABASE.get(type)!;assert.equal(d.stats.hp,before,type+' baseline drift');
  return {type,before,after,attack:d.stats.attack,abilities:structuredClone(d.monsterAbilities),ward:d.lowHealthWard?.wardPct,shield:d.enemyShield?.shieldPct,shatter:d.enemyShield?.shatter?.selfDamagePct};
 });
 if(cell.treatment==='candidate')for(const s of saved){
  const d=MONSTER_DATABASE.get(s.type)!;d.stats.hp=s.after;
  for(const ability of d.monsterAbilities??[])for(const action of ability.actions)if(action.type==='shield')action.shieldPct*=s.before/s.after;
  if(d.lowHealthWard&&s.ward!==undefined)d.lowHealthWard.wardPct=s.ward*s.before/s.after;
  if(d.enemyShield&&s.shield!==undefined)d.enemyShield.shieldPct=s.shield*s.before/s.after;
  if(d.enemyShield?.shatter&&s.shatter!==undefined)d.enemyShield.shatter.selfDamagePct=s.shatter*s.before/s.after;
 }
 return {changes:cell.treatment==='candidate'?saved.map(s=>({type:s.type,before:s.before,after:s.after,beforeAttack:s.attack,afterAttack:s.attack})):[],restore(){for(const s of saved){
  const d=MONSTER_DATABASE.get(s.type)!;d.stats.hp=s.before;if(s.abilities)d.monsterAbilities=structuredClone(s.abilities);
  if(d.lowHealthWard&&s.ward!==undefined)d.lowHealthWard.wardPct=s.ward;
  if(d.enemyShield&&s.shield!==undefined)d.enemyShield.shieldPct=s.shield;
  if(d.enemyShield?.shatter&&s.shatter!==undefined)d.enemyShield.shatter.selfDamagePct=s.shatter;
 }}};
}
