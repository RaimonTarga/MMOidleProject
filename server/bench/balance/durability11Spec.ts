import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { NIGHT4_SURVEY } from './night4Spec';
import { SURVEY_CELLS, type SurveyCell } from './ttkSurveySpec';

// Fresh confirmation seeds; do not simply replay the deterministic selection runs.
export const DURABILITY11_SEEDS = [3911,6151,8089] as const;
export function confirmedJungleStance(c: SurveyCell) {
  return c.role==='jungle'&&((c.tier===2&&c.className==='squire')||(c.tier===3&&c.className==='conduit'))
    ? 'defensive-stance' : 'offensive-stance';
}
export const DURABILITY11_CELLS = NIGHT4_SURVEY
  .filter(c=>(c.tier===3&&['tundra','swamp','jungle'].includes(c.role))||(c.tier===2&&c.role==='jungle'&&c.className==='squire'))
  .flatMap(c=>[c,...(c.role==='tundra'?SURVEY_CELLS.filter(a=>a.tier===3&&a.role==='solo'&&a.alternate&&a.className===c.className)
    .map(a=>({...c,id:c.id+'-weapon-alt',alternate:true,build:{...c.build,id:c.build.id+'-weapon-alt',
      gearItemIds:{...c.build.gearItemIds,weapon:a.build.gearItemIds.weapon}}})):[])])
  .map(c=>({...c,id:c.id.replace('night4-survey','dur11'),stance:confirmedJungleStance(c),
    targetTypes:[c.role==='tundra'?'glacier-bear':c.role==='swamp'?'plague-hydra':c.tier===2?'jungle-ape':'silverback']}));

export function assertDurability11Definitions() {
  const bear=MONSTER_DATABASE.get('glacier-bear')!;
  assert.equal(bear.stats.hp,3750);assert.equal(bear.stats.attack,148);assert.equal(bear.enemyShield!.shieldPct,0.08);
  assert.equal(MONSTER_DATABASE.get('plague-hydra')!.stats.hp,2320);
  assert.equal(MONSTER_DATABASE.get('silverback')!.stats.hp,2090);
  assert.equal(MONSTER_DATABASE.get('silverback')!.rampOnCombat!.maxPct,0.45);
}
