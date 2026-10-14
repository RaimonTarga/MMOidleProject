import assert from 'node:assert/strict';
import { tickCooldowns } from '@mmo-idle/shared';
import { createFarmWorld } from '../bench/balance/worldFactory';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { PACKAGE_FIT_CELLS } from '../bench/balance/playerPackageFitSpec';
import { GuardCoverageRecorder } from '../bench/balance/guardCoverageRecorder';
import { fireWithReferenceWiring } from './fixtures/abilityWiring';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';

const world = createFarmWorld();
// A T4 Striker package holding only its class root (the class-first tree has no frames; the
// Guard coverage packet's Heavy-frame Striker went with it), on the packet's inferno arm: the
// volcanic charm, and Endure added to its Guards.
const cell = structuredClone(PACKAGE_FIT_CELLS.find(c => c.tier === 4 && c.className === 'striker' && c.role === 'farm')!);
cell.build.skillPath = [cell.build.classRoot];
cell.build.gearItemIds.recovery = 'volcanic-charm-t4';
cell.abilities!.guards.push('endure');
const { bot } = prepareSurveyBot(world, cell, { x: 2400, y: 2400 });
bot.hasHealth.hp = bot.hasHealth.maxHp * 0.2;
// No arena fight: fire the Guards on Always instead of their In Combat default.
bot.tracksProgression.runesEquipped = [
  ...bot.tracksProgression.runesEquipped.filter(rule => rule.actionId !== 'use-ability'),
  ...bot.tracksProgression.attunedAbilities.guards.map(targetAbilityId => ({ conditionId: 'always', actionId: 'use-ability', targetAbilityId })),
];
const recorder = new GuardCoverageRecorder(world, bot);
// Direct ability decisions only: no arena, damage application, or balance observation.
for (let tick = 0; tick < 4; tick++) {
  world.worldLogJournal = [];
  tickCooldowns(bot.tracksCombat, 100);
  recorder.beforeTick();
  fireWithReferenceWiring(world, 1800000000000 + tick * 100);
  recorder.afterTick(tick * 100);
}
const observed = recorder.state();
assert(observed.guards.endure.remainingMs > 0);
const context = makeCombatContext(bot, 'player', bot, 'player');
// A second emission with the observer removed should produce identical damage.
context.damage = 100;
emitCombatEvent('onDamageTaken', context, world);
const withObserver = context.damage;
const result = recorder.finish();
assert.equal(result.casts.endure, 1);
assert(result.lastIncomingPipeline);
context.damage = 100;
emitCombatEvent('onDamageTaken', context, world);
assert.equal(context.damage, withObserver);
assert.deepEqual(recorder.state(), observed);
console.log('guardCoverageRecorder: native delayed Guard activation and read-only pipeline capture; no arena combat');
