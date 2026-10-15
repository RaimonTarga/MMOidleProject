/**
 * The Payoff rules editor's view model: the enemy card's moments, the payoffs placed on them, every
 * payoff you know, and edits that come back as configs the shared validator checks.
 */
import { classConfigContextFromState, defaultClassConfig } from './config';
import { composePayoffsView, withPlacement, withPlacementConditions, withoutPlacement } from './payoffsView';
import type { ClassScreenInput } from './view';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const input: ClassScreenInput = {
  combatArchetype: 'dot',
  biomeLevel: { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 },
  bossesCleared: ['plains:1'],
  disciplineId: null,
  classConfig: null,
  playerTier: 1,
};
const config = defaultClassConfig(classConfigContextFromState(input)!);
const view = composePayoffsView({ ...input, classConfig: config })!;

assert(composePayoffsView({ ...input, combatArchetype: 'cadence' }) === null, 'only an Apprentice has Payoff rules');
assert(view.sigils.cap === 6, `Sigils 6 at Mastery 30 (${view.sigils.cap})`);
assert(view.available.length === 6, `the six T1 payoffs (${view.available.length})`);
const full = view.moments.find((m) => m.moment === 'target-full')!;
assert(full.placements[0].payoff.pieceId === 'apprentice-spread' && full.placements[1].payoff.pieceId === 'apprentice-detonate', 'full: Spread with company, else Detonate');
assert(full.placements[0].conditions[0].includes('enemies'), 'a condition reads in words');
assert(view.moments.some((m) => m.moment === 'enemy-winds-up') && view.moments.some((m) => m.moment === 'hp-low'), 'the moments you own lessons for are on the card');
assert(view.relic.trophyId === 'apprentice-relic-plains' && view.relic.kind === 'payoff', 'the first boss gave Outbreak, a payoff relic');
assert(view.problems.length === 0, `the default rules are valid (${view.problems.join('; ')})`);

const added = withPlacement(config, 'target-low', 'apprentice-converge');
assert(added.mode === 'custom', 'an edit makes the rules custom');
assert(composePayoffsView({ ...input, classConfig: added })!.moments.find((m) => m.moment === 'target-low')!.placements.length === 1, 'a placement lands on its moment');
const removed = withoutPlacement(config, 0);
assert(composePayoffsView({ ...input, classConfig: removed })!.moments.find((m) => m.moment === 'target-full')!.placements.length === 1, 'a placement comes off');
const cond = withPlacementConditions(config, 1, [{ id: 'target-elite' }]);
assert(composePayoffsView({ ...input, classConfig: cond })!.moments.find((m) => m.moment === 'target-full')!.placements[1].conditions[0].includes('elite'), 'conditions can change');
assert(composePayoffsView({ ...input, classConfig: withPlacement(config, 'target-full', 'apprentice-nope') })!.problems.length > 0, 'an unknown payoff is refused, with the reason');

console.log('payoffsView.test.ts: ok');
