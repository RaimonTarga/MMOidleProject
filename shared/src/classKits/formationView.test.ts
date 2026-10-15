/**
 * The Formation editor's view model (class-first build plan CD.6): the roster with its Command,
 * every bound summon, the orders as choices, and edits that come back as configs the shared
 * validator checks. Structure only.
 */
import { classConfigContextFromState, defaultClassConfig } from './config';
import { composeFormationView, withOrders, withRoster } from './formationView';
import type { ClassScreenInput } from './view';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const input: ClassScreenInput = {
  combatArchetype: 'summoner',
  biomeLevel: { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 },
  bossesCleared: ['plains:1'],
  disciplineId: null,
  classConfig: null,
  playerTier: 1,
};
const config = defaultClassConfig(classConfigContextFromState(input)!);
const view = composeFormationView({ ...input, classConfig: config })!;

assert(composeFormationView({ ...input, combatArchetype: 'cadence' }) === null, 'only a Conduit has a Formation');
assert(view.command.total === 6, `a Mastery-30 T1 Conduit has Command 6 (${view.command.total})`);
assert(view.command.used <= view.command.total && view.roster.length > 0, 'the default roster fits');
assert(view.available.some((p) => p.pieceId === 'conduit-thrall') && view.available.length === 6, 'the Thrall and the five specialists are bound');
assert(view.soul.trophyId === 'conduit-relic-plains', 'the first boss gave the Plains Soul');
assert(view.orders.attackFirst.options.length === 4 && view.orders.rebuildFirst.options.length === 4, 'the orders are choices');
assert(view.problems.length === 0, `the default formation is valid (${view.problems.join('; ')})`);

const roster = withRoster(config, ['conduit-cave-heavy', 'conduit-cave-heavy', 'conduit-cave-heavy', 'conduit-cave-heavy']);
assert(roster.mode === 'custom', 'an edit makes the formation custom');
assert(composeFormationView({ ...input, classConfig: roster })!.problems.some((p) => p.includes('Command')), 'too much Command is refused, with the reason');

const orders = withOrders(config, { attackFirst: 'weakest', recallWhen: [] });
const edited = composeFormationView({ ...input, classConfig: orders })!;
assert(edited.orders.attackFirst.value === 'weakest' && edited.orders.recallWhen.length === 0, 'orders read back');

const swarm = composeFormationView({ ...input, classConfig: config, budgetBonus: 2 })!;
assert(swarm.command.total === 8, `a Swarm Staff adds its Command to the total (${swarm.command.total})`);

console.log('formationView.test.ts: ok');
