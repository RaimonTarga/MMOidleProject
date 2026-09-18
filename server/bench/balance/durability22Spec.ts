import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {NIGHT5_BLOCKS,type Night5Cell} from './night5Spec';
export const DURABILITY22_SEEDS=[38011,40009,42013] as const;
// Experimental HP-led package. Preserve absolute ward/shell/self-shatter budgets.
//
// RETIRED 2026-09-18: this package is authored source now, so the table is rebased
// to [adopted, adopted]. before/after is then 1 and every ward/shell/self-shatter
// rescale below becomes the identity, which is what makes the overlay inert
// instead of re-dividing the already-coupled percentages. The historical
// experiment stays reproducible at its own frozen revision.
//
// Two rows carry the LATER Durability26 doubling rather than D22's own value:
// granite-mammoth 6900 -> 13800 and dune-basilisk 4503 -> 9006. The 9006 is the
// retained Desert decision; a last-writer-wins pass would wrongly leave 4503.
// hadal-stalker stays 16800 -- the 21000 candidate was REJECTED.
export const DURABILITY22_HP:Record<string,[number,number]>={
 'elder-leviathan':[17640,17640],'abyssal-serpent':[16800,16800],'hadal-stalker':[16800,16800],
 'granite-mammoth':[13800,13800],'cragback-rhino':[6600,6600],
 'avalanche-tyrant':[1600,1600],'cliffside-roc':[1700,1700],
 'permafrost-behemoth':[7656,7656],'glacial-direbear':[4884,4884],
 'rime-tusk-mastodon':[3300,3300],'hoarfrost-yeti':[1800,1800],
 'sand-viper':[4029,4029],'dune-basilisk':[9006,9006],'dune-tyrant':[6952,6952],
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
