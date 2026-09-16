import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY17_CELLS, assertDurability17Definitions, installDurability17Treatment } from './durability17Spec';
import { DURABILITY15_CELLS, assertDurability15Definitions, installDurability15Treatment } from './durability15Spec';
export const DURABILITY19_SEEDS=[14009,16001,18013] as const;
export const DURABILITY19_CELLS=[
 ...DURABILITY17_CELLS.filter(c=>c.treatment==='control'),
 ...DURABILITY15_CELLS.filter(c=>c.treatment==='control'),
].flatMap(c=>(['control','candidate'] as const).map(treatment=>({...c,technique:'sweep' as const,
 id:c.id.replace(/^dur(15|17)/,'dur19').replace(/-control$/,'-'+treatment),treatment})));
export type Durability19Cell=typeof DURABILITY19_CELLS[number];
export function assertDurability19Definitions(){assertDurability17Definitions();assertDurability15Definitions();}
export function installDurability19Treatment(cell:Durability19Cell){
 assertDurability19Definitions();
 const forest=cell.tier===2;
 const overlay=forest?installDurability17Treatment({...cell,treatment:cell.treatment==='control'?'control':'adults3-pressure80'}):
 installDurability15Treatment({...cell,treatment:cell.treatment==='control'?'control':'anchor150-pressure80'});
 if(forest&&cell.treatment==='candidate') MONSTER_DATABASE.get('ancient-wolf')!.stats.attack=22;
 for(const change of overlay.changes) change.afterAttack=MONSTER_DATABASE.get(change.type)!.stats.attack;
 return overlay;
}
