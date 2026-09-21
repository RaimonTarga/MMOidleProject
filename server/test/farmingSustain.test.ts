import { updateRuneDerivedConfig } from '../src/systems/combat/ai/runeConfig';
import { updateStanceSwitch } from '../src/systems/player/stances/stanceSwitch';
import { activeRecoveryFraction } from '../src/systems/defense/regen/recovery';
import assert from 'node:assert/strict';
import { runicPointBreakdown, stanceDef, setCooldown } from '@mmo-idle/shared';
import { FARMING_SUSTAIN_CELLS, sustainGates } from '../bench/balance/farmingSustainSpec';
import { BREADTH_CELLS } from '../bench/balance/playerBreadthSpec';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { fastPassReadback } from '../bench/balance/playerFastPassSpec';
import { teardownArena } from '../bench/balance/arena';

assert.equal(FARMING_SUSTAIN_CELLS.length,20);
assert.equal(new Set(FARMING_SUSTAIN_CELLS.map(c=>c.id)).size,20);
for(const cell of FARMING_SUSTAIN_CELLS) {
  const original=BREADTH_CELLS.find(c=>c.id===cell.originalCaseId)!;
  assert.equal(cell.stance, 'offensive-stance');
  assert.deepEqual(cell.abilities!.guards,original.abilities!.guards);
  assert(cell.runeRules!.some(r=>r.actionId==='wait-for-regen' && r.conditionId==='always'));
  const world=createBalanceWorld();
  try {
    const {bot,view}=prepareSurveyBot(world,cell,{x:2000,y:2000});
    const receipt=fastPassReadback(cell,bot,view.globalMastery), p=bot.tracksProgression;
    assert.deepEqual(p.attunedStances,[cell.stance,...(cell.additionalStances??[])]);assert.equal(p.activeStance,cell.stance);
    const costs=runicPointBreakdown({abilities:p.attunedAbilities,rules:p.runesEquipped,stances:p.attunedStances!,rites:p.equippedRites});
    assert.equal(costs.stances,stanceDef(cell.stance!)!.runeCost+(cell.policy==='recuperating'?4:0));
    assert.equal(costs.total,receipt.runicPoints.cost);
    assert(costs.total<=receipt.runicPoints.budget);
    sustainGates(cell,bot);
    if (cell.policy === 'recuperating') {
      const now = 1800000000000;
      updateRuneDerivedConfig(world, now); updateStanceSwitch(world,100,now);
      bot.hasHealth.hp = bot.hasHealth.maxHp * 0.25;
      setCooldown(bot.tracksCombat,'stance.switch.cd',0);
      updateRuneDerivedConfig(world,now+2000); updateStanceSwitch(world,100,now+2000);
      assert.equal(p.activeStance,'recuperating-stance');
      assert(activeRecoveryFraction(bot,true)>=0.8);
      bot.hasHealth.hp = bot.hasHealth.maxHp * 0.3;
      updateRuneDerivedConfig(world,now+2100); updateStanceSwitch(world,100,now+2100);
      assert.equal(p.activeStance,'recuperating-stance','Native cooldown holds posture briefly');
      setCooldown(bot.tracksCombat,'stance.switch.cd',0);
      updateRuneDerivedConfig(world,now+4000); updateStanceSwitch(world,100,now+4000);
      assert.equal(p.activeStance,'offensive-stance','Condition clears into native default');
    }
  } finally {teardownArena(world);}
}
console.log('farmingSustain: 20 legal packages, native trigger/cooldown/default checks; zero combat World ticks');
