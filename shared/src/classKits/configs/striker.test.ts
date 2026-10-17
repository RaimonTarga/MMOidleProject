/**
 * The Striker's auto Order and relic by discipline (OV2-STRIKER): Heavy fields no opener and lays
 * its soft beat before its setups, so the finisher spends the Momentum they built; Heavy's relic is
 * a weight trophy (Skyfall first), and Light, Balanced and T1 keep the newest trophy. Checked
 * through the spec's own `defaults` and `validate` and the class default (`defaultClassConfig`).
 */
import { defaultClassConfig } from '../config';
import type { ClassConfigContext } from '../configTypes';
import { STRIKER_KIT } from '../striker/kit';
import { STRIKER_SYSTEM, strikerComboLength } from './striker';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/** A context owning every T1 and T2 lesson, these trophies (newest first) and this budget. */
function ctxT2(disciplineId: string | null, trophiesNewestFirst: string[], budget = 6): ClassConfigContext {
  const pieceRanks = new Map<string, number>();
  for (const lesson of STRIKER_KIT.lessons) {
    if (lesson.source.kind === 'zone' && lesson.source.tier > 2) continue;
    pieceRanks.set(lesson.pieceId, Math.max(pieceRanks.get(lesson.pieceId) ?? 0, lesson.rank));
  }
  return {
    archetype: 'cadence', pieceRanks, trophyRanks: new Map(trophiesNewestFirst.map((id) => [id, 1])), trophiesNewestFirst,
    budget, disciplineId, specializationId: null, relicSlots: 1,
  };
}

const piece = (id: string | null) => STRIKER_KIT.pieces.find((entry) => entry.id === id);

// Heavy: a damage technique first (the soft beat), then a setup, then Coil; no opener.
{
  const ctx = ctxT2('striker-heavy', []);
  const { beats } = STRIKER_SYSTEM.defaults(ctx);
  assert(beats.length === strikerComboLength('striker-heavy') - 1, 'Heavy has three beats before the finisher');
  assert(STRIKER_SYSTEM.validate(STRIKER_SYSTEM.defaults(ctx), ctx).length === 0, 'the Heavy default is valid');
  assert(piece(beats[0])?.family === 'damage' && !piece(beats[0])?.cast, `Heavy opens on a soft damage beat, not ${beats[0]}`);
  assert(piece(beats[1])?.family !== 'damage', `a setup follows the soft beat, not ${beats[1]}`);
  assert(beats[2] === 'striker-coil', 'Coil winds up the finisher');
  assert(!beats.some((id) => piece(id)?.cast === 'opener'), 'Heavy fields no opener');
}
// Heavy with only two beats open: Coil and a setup, the first beat stays a plain (soft) swing.
{
  const { beats } = STRIKER_SYSTEM.defaults(ctxT2('striker-heavy', [], 2));
  assert(beats[0] === null && beats[2] === 'striker-coil' && piece(beats[1])?.family !== 'damage', `two open beats: ${beats.join(', ')}`);
}
// Balanced and Light keep their opener (Focus) on the first beat.
for (const disciplineId of ['striker-balanced', 'striker-light']) {
  const { beats } = STRIKER_SYSTEM.defaults(ctxT2(disciplineId, []));
  assert(beats[0] === 'striker-focus', `${disciplineId} opens with Focus`);
}

// The relic: Heavy takes Skyfall over a newer trophy; the others keep the newest.
{
  const newest = ['striker-relic-jungle', 'striker-relic-forest', 'striker-relic-mountain', 'striker-relic-plains'];
  assert(defaultClassConfig(ctxT2('striker-heavy', newest)).relic[0] === 'striker-relic-mountain', 'Heavy fields Skyfall');
  assert(defaultClassConfig(ctxT2('striker-heavy', ['striker-relic-plains'])).relic[0] === 'striker-relic-plains',
    'without a ranked weight trophy, Heavy keeps the newest');
  for (const disciplineId of ['striker-balanced', 'striker-light', null]) {
    assert(defaultClassConfig(ctxT2(disciplineId, newest)).relic[0] === 'striker-relic-jungle', `${disciplineId ?? 'T1'} keeps the newest trophy`);
  }
  assert(defaultClassConfig(ctxT2('striker-heavy', [])).relic.length === 0, 'no trophy, no relic');
}

console.log('strikerConfig: ok');
