import assert from 'node:assert/strict';
import { tickCooldowns } from '@mmo-idle/shared';
import { createFarmWorld } from '../bench/balance/worldFactory';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { GUARD_COVERAGE_CELLS } from '../bench/balance/guardCoverageSpec';
import { GuardCoverageRecorder } from '../bench/balance/guardCoverageRecorder';
import { fireWithReferenceWiring } from './fixtures/abilityWiring';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';

const world = createFarmWorld();
const cell = GUARD_COVERAGE_CELLS.find(c => c.arm === 'inferno-endure')!;
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
