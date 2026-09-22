import assert from 'node:assert/strict';
import { ACTION_DATABASE, RUNE_RECIPE_DATABASE, isRuneRecipeUnlocked, runicPointLoadoutCost } from '@mmo-idle/shared';
import { T2_MULTI_CELLS, T2_LOW_HP_RULE } from '../bench/balance/t2MultiBiomeSpec';
import { prepareT2Ownership, attemptT2Focus, FOCUS_RECIPE } from '../bench/balance/t2MultiBiomePreparation';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { createFarmWorld } from '../bench/balance/worldFactory';
import { teardownArena } from '../bench/balance/arena';
import { craftRuneRecipe } from '../src/systems/player/economy/runeCrafting';

const recipe = RUNE_RECIPE_DATABASE.get(FOCUS_RECIPE)!;
assert.equal(recipe.recipeGroup, 'desert');
assert.equal(recipe.requiredBiomeLevel, 4);
assert.equal(recipe.tier, 2);
assert.equal(ACTION_DATABASE.get('focus-lowest-hp')!.tier, 2);
assert.deepEqual(recipe.cost, { yellow: 90 });
assert(!isRuneRecipeUnlocked(recipe, { biomeLevel: { swamp: 12, desert: 3 }, bossesCleared: [] }));
assert(isRuneRecipeUnlocked(recipe, { biomeLevel: { desert: 4 }, bossesCleared: [] }));
assert.deepEqual(['A','B','D'].map(b=>T2_MULTI_CELLS.filter(c=>c.block===b).length), [216,12,36]);
assert.equal(T2_MULTI_CELLS.filter(c=>c.delayedFocus).length, 12);
for (const c of T2_MULTI_CELLS) {
  assert(c.abilities!.guards.includes('cleanse'));
  assert(!c.abilities!.guards.includes('break-free'));
  assert(!c.runeRules!.some(r=>['flee','wait-it-out','focus-lowest-hp'].includes(r.actionId)));
  assert(!c.build.skillPath.some(s=>s.includes('-t3-')||s.includes('-range-')));
  assert(runicPointLoadoutCost({rules:[...(c.delayedFocus?[T2_LOW_HP_RULE]:[]),...c.runeRules!],
    abilities:c.abilities!,stances:[c.stance!],rites:[]})<=30);
  if(c.block==='B') {
    const pair=T2_MULTI_CELLS.filter(x=>x.comparisonId===c.comparisonId);
    assert.equal(pair.length,2);
    const base=pair.find(x=>x.block==='A')!;
    assert.equal(Math.abs(T2_MULTI_CELLS.indexOf(base)-T2_MULTI_CELLS.indexOf(c)),1);
    assert.equal(pair[0].block,c.seed===101009?'A':'B');
    assert.deepEqual({...c.build.gearItemIds,weapon:''},{...base.build.gearItemIds,weapon:''});
    assert.deepEqual(c.abilities,base.abilities);assert.deepEqual(c.runeRules,base.runeRules);
    assert.deepEqual(c.build.skillPath,base.build.skillPath);assert.equal(c.stance,base.stance);
  }
}
// Zero simulation ticks: production craft gates, payment, ownership and loadout edit.
for (const scenario of ['success','locked','poor','dead'] as const) {
  const w=createFarmWorld();
  try {
    const c=T2_MULTI_CELLS.find(c=>c.delayedFocus)!;
    const {bot}=prepareSurveyBot(w,c,{x:2400,y:2400});
    prepareT2Ownership(c,bot);
    const p=bot.tracksProgression;
    if(scenario==='locked')p.biomeLevel.desert=3;
    if(scenario==='poor')p.essences.yellow=89;
    if(scenario==='dead')bot.hasHealth.hp=0;
    else bot.hasHealth.hp-=10;
    const hp=bot.hasHealth.hp, rules=structuredClone(p.runesEquipped);
    assert.throws(()=>attemptT2Focus(w,bot,299900));
    assert(!p.runesOwned.includes('focus-lowest-hp'));
    const result=attemptT2Focus(w,bot,300000);
    assert.equal(bot.hasHealth.hp,hp);
    if(scenario==='success') {
      assert.equal(result.status,'crafted-and-equipped');
      assert.equal(p.essences.yellow,0);
      assert.deepEqual(p.runesEquipped,[T2_LOW_HP_RULE,...rules]);
      assert(p.runesOwned.includes('avoid-hazards'),'Crafting must preserve purchased support runes');
      assert(!craftRuneRecipe(w,bot,FOCUS_RECIPE).success,'No duplicate craft/payment');
    } else {
      assert.equal(result.status,scenario==='dead'?'not-alive':'craft-unavailable');
      assert(!p.runesOwned.includes('focus-lowest-hp'));
      assert.deepEqual(p.runesEquipped,rules);
      assert.equal(p.essences.yellow,scenario==='poor'?89:90);
    }
  } finally {teardownArena(w);}
}
console.log('t2MultiBiomePacket: 264 fixed cells, legal RP, matched weapons; Desert L4 gate/payment and midpoint edit checked with zero simulation ticks');
