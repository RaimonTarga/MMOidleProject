import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY17_CELLS, assertDurability17Definitions, installDurability17Treatment } from './durability17Spec';
export { assertDurability17Definitions as assertDurability18Definitions };
export const DURABILITY18_SEEDS=[9029,10427,12007] as const;
export const DURABILITY18_CELLS=DURABILITY17_CELLS
  .filter(c=>c.nodeId.endsWith('03')&&['striker','apprentice'].includes(c.className)&&c.treatment==='adults3-pressure80')
  .flatMap(c=>(['reference','wolf22','defensive','wolf22-defensive'] as const).map(treatment=>({...c,
    id:c.id.replace('dur17','dur18').replace('adults3-pressure80',treatment),treatment,
    stance:treatment.endsWith('defensive')?'defensive-stance':'offensive-stance'})));
export type Durability18Cell=typeof DURABILITY18_CELLS[number];
export function installDurability18Treatment(cell:Durability18Cell) {
  assertDurability17Definitions();
  const overlay=installDurability17Treatment({...cell,treatment:'adults3-pressure80'});
  if(cell.treatment.startsWith('wolf22')) MONSTER_DATABASE.get('ancient-wolf')!.stats.attack=22;
  for(const change of overlay.changes) change.afterAttack=MONSTER_DATABASE.get(change.type)!.stats.attack;
  return overlay;
}
