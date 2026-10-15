/**
 * The Loadout editor's view model (class-first build plan CL.5): the rack, every owned clip,
 * the rules in words, and edits that come back as configs the shared validator checks.
 */
import { classConfigContextFromState, defaultClassConfig } from './config';
import { composeLoadoutView, withClipRule, withFreeRules, withRack, withoutClipRule } from './loadoutView';
import type { ClassScreenInput } from './view';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const input: ClassScreenInput = {
  combatArchetype: 'reload',
  biomeLevel: { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 },
  bossesCleared: ['plains:1'],
  disciplineId: null,
  classConfig: null,
  playerTier: 1,
};
const config = defaultClassConfig(classConfigContextFromState(input)!);
const view = composeLoadoutView({ ...input, classConfig: config })!;

assert(composeLoadoutView({ ...input, combatArchetype: 'cadence' }) === null, 'only a Slinger has a Loadout');
assert(view.rack.slots === 3 && view.rack.used === 3, `a Mastery-30 T1 Slinger racks three clips (${view.rack.used}/${view.rack.slots})`);
assert(view.available.length === 5 && view.available.every((clip) => !clip.plain), 'five clip types, never the plain one');
assert(view.racked.every((clip) => clip.color.startsWith('#')), 'each clip has its ring colour');
assert(view.rules.some((rule) => rule.clip.pieceId === 'slinger-scatter' && rule.conditions[0].includes('enemies')), 'Scatter\'s rule reads in words');
assert(view.lastRound.trophyId === 'slinger-relic-plains', 'the first boss gave Stampede Round');
assert(view.problems.length === 0, `the default Loadout is valid (${view.problems.join('; ')})`);

const fewer = withRack(config, ['slinger-scatter']);
assert(fewer.mode === 'custom', 'an edit makes the Loadout custom');
const fewerView = composeLoadoutView({ ...input, classConfig: fewer })!;
assert(fewerView.rack.used === 1 && fewerView.rules.every((rule) => rule.clip.pieceId === 'slinger-scatter'), 'rules for a clip that left the rack go with it');

const tooMany = withRack(config, ['slinger-scatter', 'slinger-snare', 'slinger-venom', 'slinger-stopping']);
assert(composeLoadoutView({ ...input, classConfig: tooMany })!.problems.some((p) => p.includes('rack holds')), 'a rack past its slots is refused, with the reason');

const switched = withClipRule(config, 'slinger-venom', { conditions: [{ id: 'target-elite' }], switchEarly: true });
assert(composeLoadoutView({ ...input, classConfig: switched })!.rules.find((rule) => rule.clip.pieceId === 'slinger-venom')!.switchEarly, 'a switch reload reads back');
assert(composeLoadoutView({ ...input, classConfig: withoutClipRule(config, 'slinger-venom') })!.rules.every((rule) => rule.clip.pieceId !== 'slinger-venom'), 'a rule can be removed');

const free = withFreeRules(config, { reloadEarlyWhenSafe: false });
assert(!composeLoadoutView({ ...input, classConfig: free })!.freeRules.reloadEarlyWhenSafe, 'the free rules read back');

console.log('loadoutView.test.ts: ok');
