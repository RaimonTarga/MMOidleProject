/**
 * The Response rules editor's view model (class-first build plan CQ.5): every owned response
 * with what it answers, its rule and cost, the slam as the trophy, and edits that come back as
 * configs the shared validator checks. Structure only.
 */
import { classConfigContextFromState, defaultClassConfig } from './config';
import { composeResponsesView, withGroundTelegraphs, withHoldSlam, withRule } from './responsesView';
import type { ClassScreenInput } from './view';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const input: ClassScreenInput = {
  combatArchetype: 'cooldown',
  biomeLevel: { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 },
  bossesCleared: ['mountain:1'],
  disciplineId: null,
  classConfig: null,
  playerTier: 1,
};
const config = defaultClassConfig(classConfigContextFromState(input)!);
const view = composeResponsesView({ ...input, classConfig: config })!;

assert(composeResponsesView({ ...input, combatArchetype: 'cadence' }) === null, 'only a Squire has Response rules');
assert(view.rules.length === 5, `a T1 Squire carries five responses (${view.rules.length})`);
assert(view.rules.every((r) => r.answers.length > 0 && r.enabled), 'each answers a moment, on by default');
assert(view.rules.every((r) => r.refund > r.cost), 'a landed answer refunds more than it cost');
assert(view.problems.length === 0, `the default rules are valid (${view.problems.join('; ')})`);
assert(view.slam.trophyId === 'squire-relic-mountain' && view.slam.kind === 'slam', 'the slam is the Mountain trophy');

const off = withRule(config, 'squire-shove', { enabled: false });
assert(off.mode === 'custom', 'an edit makes the rules custom');
assert(!composeResponsesView({ ...input, classConfig: off })!.rules.find((r) => r.pieceId === 'squire-shove')!.enabled, 'Shove is off');

const bossOnly = withRule(config, 'squire-guard', { conditions: [{ id: 'target-elite' }] });
assert(composeResponsesView({ ...input, classConfig: bossOnly })!.rules.find((r) => r.pieceId === 'squire-guard')!.conditions[0].includes('elite'),
  'a condition reads in words');

const held = withHoldSlam(withGroundTelegraphs(config, 'hold'), [{ id: 'target-low', param: 0.2 }]);
const heldView = composeResponsesView({ ...input, classConfig: held })!;
assert(heldView.groundTelegraphs === 'hold' && heldView.holdSlam.length === 1, 'hold telegraphs, hold the slam on a low target');

console.log('responsesView.test.ts: ok');
