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

// T2: the pick shows its school and shifts the cap; the T2 payoffs sit on the moments they answer.
const t2: ClassScreenInput = {
  ...input,
  biomeLevel: { ...input.biomeLevel, plains: 8, mountain: 8, jungle: 2 },
  disciplineId: 'apprentice-poison',
  playerTier: 2,
};
const t2Config = defaultClassConfig(classConfigContextFromState(t2)!);
const t2View = composePayoffsView({ ...t2, classConfig: withPlacement(withPlacement(t2Config, 'charging-at-me', 'apprentice-blast-back'), 'target-flees', 'apprentice-snag') })!;
assert(t2View.discipline?.school === 'poison' && t2View.discipline.pieceName === 'Wither', 'the pick names its school and piece');
assert(t2View.sigils.cap === view.sigils.cap + 2, `Poison holds two more sigils (${t2View.sigils.cap})`);
assert(t2View.available.some((p) => p.pieceId === 'apprentice-wither' && p.moment === 'target-full'), 'the discipline piece is on the full moment');
assert(t2View.available.find((p) => p.pieceId === 'apprentice-sear')?.moment === 'target-shielded', 'Sear answers the shield');
assert(t2View.moments.some((m) => m.moment === 'target-shielded'), 'a T2 lesson you own puts its moment on the card');
assert(composePayoffsView({ ...input, classConfig: config })!.discipline === null, 'no pick, no discipline');

// T3: the specialization shows its rule; the T3 lessons sit on their moments.
const t3: ClassScreenInput = {
  ...t2,
  biomeLevel: { ...t2.biomeLevel, tundra: 6, volcanic: 6 },
  specializationId: 'apprentice-carrier',
  playerTier: 3,
};
const t3View = composePayoffsView({ ...t3, classConfig: defaultClassConfig(classConfigContextFromState(t3)!) })!;
assert(t3View.specialization?.id === 'apprentice-carrier' && t3View.specialization.text.length > 0, 'the pick shows its rule');
assert(composePayoffsView({ ...t3, specializationId: 'apprentice-afterburn', classConfig: defaultClassConfig(classConfigContextFromState(t3)!) })!.specialization === null, 'a specialization of another school is not shown');
assert(t2View.specialization === null, 'no pick, no specialization');

// T4: the leaf shows under the school it belongs to; a leaf of another school is not shown.
const t4: ClassScreenInput = { ...t3, playerTier: 4, leafId: 'apprentice-thick-air' };
const t4Config = defaultClassConfig(classConfigContextFromState(t4)!);
const t4View = composePayoffsView({ ...t4, classConfig: t4Config })!;
assert(t4View.leaf?.id === 'apprentice-thick-air' && t4View.leaf.column === 'charger' && t4View.leaf.text.length > 0, 'the leaf shows its rule');
assert(composePayoffsView({ ...t4, leafId: 'apprentice-tinderbox', classConfig: t4Config })!.leaf === null, 'a leaf of another school is not shown');
assert(t3View.leaf === null, 'no pick, no leaf');

console.log('payoffsView.test.ts: ok');
