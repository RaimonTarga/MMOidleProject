import { NIGHT4_SURVEY } from './night4Spec';
import { confirmedJungleStance } from './durability11Spec';
import { assertDurability19Definitions, installDurability19Treatment } from './durability19Spec';
export { assertDurability19Definitions as assertDurability20Definitions };
export const DURABILITY20_SEEDS=[20011,22003,24001] as const;
export const DURABILITY20_CELLS=NIGHT4_SURVEY.map(c=>({...c,
 id:c.id.replace('night4-survey','dur20')+'-selected',treatment:'selected' as const,
 technique:'sweep' as const,stance:confirmedJungleStance(c),
 targetTypes:c.tier===2&&c.role==='forest'?['ancient-wolf','ironwood-golem']:
 c.tier===3&&c.role==='volcanic'?['magma-brute','ash-slinger']:[]}));
export type Durability20Cell=typeof DURABILITY20_CELLS[number];
export function installDurability20Treatment(cell:Durability20Cell){
 assertDurability19Definitions();
 if(cell.targetTypes.length) return installDurability19Treatment({...cell,treatment:'candidate'});
 return {changes:[] as {type:string;before:number;after:number;beforeAttack:number;afterAttack:number}[],restore(){}};
}
