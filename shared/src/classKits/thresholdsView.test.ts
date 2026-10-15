/**
 * The Thresholds editor's view model: the gauge's floor and bands, every spend and calm you know,
 * and edits that come back as configs the shared validator checks.
 */
import { classConfigContextFromState, defaultClassConfig } from './config';
import { composeThresholdsView, withBand, withFloor, withPhase } from './thresholdsView';
import type { ClassScreenInput } from './view';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const input: ClassScreenInput = {
  combatArchetype: 'energy',
  biomeLevel: { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 },
  bossesCleared: ['plains:1'],
  disciplineId: null,
  classConfig: null,
  playerTier: 1,
};
const config = defaultClassConfig(classConfigContextFromState(input)!);
const view = composeThresholdsView({ ...input, classConfig: config })!;

assert(composeThresholdsView({ ...input, combatArchetype: 'cadence' }) === null, 'only a Spirit has Thresholds');
assert(view.storm.pips === 6, `Storm 6 at Mastery 30 (${view.storm.pips})`);
assert(view.floorPct === 30 && view.phase === 'gather', 'the default floor is 30% and gathers');
assert(view.pieces.length === 6, `Bolt and the five T1 pieces (${view.pieces.length})`);
assert(view.pieces.find((p) => p.pieceId === 'spirit-eye-of-the-storm')!.atFloor, 'Eye of the Storm sits at the floor');
assert(view.pieces.find((p) => p.pieceId === 'spirit-thunderclap')!.waitsFor.includes('melee'), 'Thunderclap waits for a touch, in words');
assert(view.relic.trophyId === 'spirit-relic-plains' && view.relic.kind === 'spend', 'the first boss gave Crosswind, a spend relic');
assert(view.problems.length === 0, `the default Thresholds are valid (${view.problems.join('; ')})`);

const moved = withBand(withFloor(config, 40), 'spirit-chain-lightning', 90);
const movedView = composeThresholdsView({ ...input, classConfig: moved })!;
assert(moved.mode === 'custom' && movedView.floorPct === 40, 'an edit makes the Thresholds custom');
assert(movedView.pieces.find((p) => p.pieceId === 'spirit-chain-lightning')!.band === 90, 'a band moves');
assert(composeThresholdsView({ ...input, classConfig: withBand(config, 'spirit-chain-lightning', null) })!.pieces.find((p) => p.pieceId === 'spirit-chain-lightning')!.band === null, 'a spend can come off the gauge');
assert(composeThresholdsView({ ...input, classConfig: withPhase(config, 'hover') })!.phase === 'hover', 'the phase reads back');
assert(composeThresholdsView({ ...input, classConfig: withFloor(config, 120) })!.problems.length > 0, 'a floor past its limit is refused, with the reason');

// T2: the discipline reads back, and Storm Surge is automatic (no band).
const tide: ClassScreenInput = { ...input, disciplineId: 'spirit-tide', bossesCleared: ['plains:1', 'plains:2'], playerTier: 2 };
const tideView = composeThresholdsView({ ...tide, classConfig: defaultClassConfig(classConfigContextFromState(tide)!) })!;
assert(view.discipline === null, 'no discipline before T2');
assert(tideView.discipline?.id === 'spirit-tide' && tideView.discipline.name === 'Tide', 'the picked discipline reads back');
assert(tideView.pieces.find((p) => p.pieceId === 'spirit-storm-surge')?.automatic === true, 'Storm Surge is automatic');
assert(view.pieces.every((p) => !p.automatic), 'no T1 piece is automatic');

// T3: the specialization reads back with its rule; before the pick the editor can list the choices.
const t3: ClassScreenInput = { ...tide, specializationId: 'spirit-breakwater', bossesCleared: ['plains:1', 'plains:2', 'mountain:3'], playerTier: 3 };
const t3View = composeThresholdsView({ ...t3, classConfig: defaultClassConfig(classConfigContextFromState(t3)!) })!;
assert(t3View.specialization?.id === 'spirit-breakwater' && t3View.specialization.text.length > 0, 'the picked specialization reads back with its rule');
assert(tideView.specialization === null && tideView.specializationChoices.map((c) => c.id).join() === 'spirit-spring-tide,spirit-slack-water,spirit-breakwater', "a Tide Spirit is offered Tide's three specializations");
assert(view.specializationChoices.length === 0, 'no choices before a discipline');
const wrong: ClassScreenInput = { ...tide, specializationId: 'spirit-stormdancer' };
assert(composeThresholdsView({ ...wrong, classConfig: defaultClassConfig(classConfigContextFromState(wrong)!) })!.specialization === null, "another discipline's specialization is ignored");
const tailwind = t3View.pieces.find((p) => p.pieceId === 'spirit-tailwind');
assert(tailwind === undefined || tailwind.waitsFor.includes('drags'), "Tailwind's moment reads in words");

// T4: the picked leaf reads back with its rule; the rest of the discipline's leaves are the choices.
const t4: ClassScreenInput & { unlockedSkills: string[] } = { ...t3, playerTier: 4, unlockedSkills: ['spirit-wading'] };
const t4View = composeThresholdsView({ ...t4, classConfig: defaultClassConfig(classConfigContextFromState(t4)!) })!;
assert(t4View.leaves.map((l) => l.id).join() === 'spirit-wading' && t4View.leaves[0].text.length > 0, 'the picked leaf reads back with its rule');
assert(t4View.leafChoices.length === 2 && !t4View.leafChoices.some((l) => l.id === 'spirit-dam'), "only the discipline's own other leaves are offered");
assert(t3View.leaves.length === 0 && t3View.leafChoices.length === 3, 'before the pick: no leaf, three choices');

console.log('thresholdsView.test.ts: ok');
