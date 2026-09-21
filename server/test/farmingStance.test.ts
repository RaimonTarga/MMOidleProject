import assert from 'node:assert/strict';
import { runicPointBreakdown, stanceDef } from '@mmo-idle/shared';
import { FARMING_STANCE_CELLS } from '../bench/balance/farmingStanceSpec';
import { BREADTH_CELLS } from '../bench/balance/playerBreadthSpec';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { fastPassReadback } from '../bench/balance/playerFastPassSpec';
import { teardownArena } from '../bench/balance/arena';

assert.equal(FARMING_STANCE_CELLS.length,24);
assert.equal(new Set(FARMING_STANCE_CELLS.map(c=>c.id)).size,24);
for(const cell of FARMING_STANCE_CELLS) {
  const original=BREADTH_CELLS.find(c=>c.id===cell.originalCaseId)!;
  const strip=(c:typeof cell|typeof original)=>({build:{...c.build,id:''},abilities:c.abilities,rules:c.runeRules,
    tier:c.tier,frame:c.frame,range:c.range,path:c.pathName,upgrades:c.upgradeLevel,treatment:c.playerTreatment});
  assert.deepEqual(strip(cell),strip(original),'Only stance and node change the declared package');
  if(cell.identityId==='breadth-t3-conduit-balanced') assert(!cell.runeRules!.some(r=>r.actionId==='orbit'));
  assert(!cell.runeRules!.some(r=>r.targetStanceId),'No stance switching');
  const world=createBalanceWorld();
  try {
    const {bot,view}=prepareSurveyBot(world,cell,{x:2400,y:2400});
    const receipt=fastPassReadback(cell,bot,view.globalMastery), p=bot.tracksProgression;
    assert.deepEqual(p.attunedStances,[cell.stance]);assert.equal(p.activeStance,cell.stance);
    const costs=runicPointBreakdown({abilities:p.attunedAbilities,rules:p.runesEquipped,stances:p.attunedStances!,rites:p.equippedRites});
    assert.equal(costs.stances,stanceDef(cell.stance!)!.runeCost);
    assert.equal(costs.total,receipt.runicPoints.cost);
    assert(costs.total<=receipt.runicPoints.budget);
  } finally {teardownArena(world);}
}
console.log('farmingStance: 24 legal unchanged packages, zero combat ticks');
