import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { NIGHT4_SURVEY } from './night4Spec';
import type { SurveyCell } from './ttkSurveySpec';

export interface Durability10Cell extends SurveyCell {
  treatment: 'control'|'hp1.5'|'hp2'|'defensive'|'ramp25'; targetTypes: string[];
}
export const DURABILITY10_SWAMP: Durability10Cell[] = NIGHT4_SURVEY
  .filter(c=>c.tier===3&&c.role==='swamp')
  .flatMap(c=>(['control','hp1.5','hp2'] as const).map(treatment=>({ ...c,
    id:c.id.replace('night4-survey','dur10')+'-'+treatment,treatment,targetTypes:['plague-hydra'] })));
export const DURABILITY10_JUNGLE: Durability10Cell[] = NIGHT4_SURVEY
  .filter(c=>c.role==='jungle'&&(c.tier===3||c.className==='squire'))
  .flatMap(c=>(c.tier===3 ? ['control','defensive','ramp25'] as const : ['control','defensive'] as const)
    .map(treatment=>({ ...c,id:c.id.replace('night4-survey','dur10')+'-'+treatment,treatment,
      stance: treatment==='defensive' ? 'defensive-stance' : 'offensive-stance',
      targetTypes:[c.tier===3?'silverback':'jungle-ape'] })));

export function installDurability10Treatment(cell: Durability10Cell) {
  const type=cell.targetTypes[0],def=MONSTER_DATABASE.get(type)!;
  const stats={...def.stats},ramp=def.rampOnCombat?.maxPct;
  if(cell.treatment==='hp1.5')def.stats.hp=1740;
  if(cell.treatment==='hp2')def.stats.hp=2320;
  if(cell.treatment==='ramp25')def.rampOnCombat!.maxPct=0.25;
  return { changes:[{type,before:stats.hp,after:def.stats.hp,beforeAttack:stats.attack,afterAttack:def.stats.attack,
    beforeRampMax:ramp,afterRampMax:def.rampOnCombat?.maxPct}],restore(){
      Object.assign(def.stats,stats);if(def.rampOnCombat&&ramp!==undefined)def.rampOnCombat.maxPct=ramp;
    } };
}
