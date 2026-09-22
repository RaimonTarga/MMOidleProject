import assert from 'node:assert/strict';
import {PROGRESSION_CELLS,assertProgressionDefinitions} from '../bench/balance/overnightProgressionSpec';
import {prepareSurveyBot} from '../bench/balance/ttkSurveySpec';
import {createFarmWorld} from '../bench/balance/worldFactory';
import {fastPassReadback} from '../bench/balance/playerFastPassSpec';
assertProgressionDefinitions();
for(const c of PROGRESSION_CELLS){
 const world=createFarmWorld(),{bot,view}=prepareSurveyBot(world,c,{x:2400,y:2400});
 const r=fastPassReadback(c,bot,view.globalMastery);
 assert.deepEqual(r.mastery.biomeLevel,c.progressionSnapshot!.mastery);
 assert(world.fixedBiomeMasteryPlayers.has(bot.isPlayer.id));
 assert(!bot.tracksProgression.runesEquipped.some(r=>r.actionId==='wait-it-out'));
 if(c.snapshotId==='t2-desert-arrival')assert(!bot.tracksProgression.runesOwned.includes('focus-lowest-hp'));
 assert(!bot.tracksProgression.knownAbilities.some(a=>['binding-strike','break-free','time-to-strike','reaper'].includes(a)));
 if(c.arm!=='primary'){
  const primary=PROGRESSION_CELLS.find(p=>p.comparisonId===c.comparisonId&&p.arm==='primary')!;
  assert(primary);assert.deepEqual(c.abilities,primary.abilities);assert.deepEqual(c.runeRules,primary.runeRules);assert.equal(c.stance,primary.stance);
  const slot=c.arm==='flash-rapier'?'weapon':'recovery';
  assert.deepEqual({...c.build.gearItemIds,[slot]:null},{...primary.build.gearItemIds,[slot]:null});
  const a=PROGRESSION_CELLS.indexOf(c),b=PROGRESSION_CELLS.indexOf(primary);
  assert.equal(a-b,c.seed===101009?1:-1);
 }
}
console.log('overnightProgression: 720 zero-tick legal preparations and fixed pairs: ok');
