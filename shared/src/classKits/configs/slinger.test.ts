/**
 * The Slinger's auto Loadout (OV2): every clip type has a natural rule, the default racks the
 * newest lessons around the crowd, control and boss clips, and each discipline's twist holds
 * (Siege racks no control clip and reads plating before the boss clip; Trickshot carries its
 * called-shot pick order). Checked through the spec's own `defaults` and `validate`.
 */
import type { ClassConfigContext, LoadoutConfig } from '../configTypes';
import { SLINGER_KIT } from '../slinger/kit';
import { SLINGER_SYSTEM } from './slinger';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/** A context owning the clips the given lessons taught (in kit lesson order), with this budget. */
function ctxAfter(lessonCount: number, budget: number, disciplineId: string | null = null): ClassConfigContext {
  const pieceRanks = new Map<string, number>();
  for (const lesson of SLINGER_KIT.lessons.slice(0, lessonCount)) {
    pieceRanks.set(lesson.pieceId, Math.max(pieceRanks.get(lesson.pieceId) ?? 0, lesson.rank));
  }
  return {
    archetype: 'reload', pieceRanks, trophyRanks: new Map(), trophiesNewestFirst: [], budget,
    disciplineId, specializationId: null, relicSlots: 1,
  };
}

const lessonsTo = (pieceId: string, rank = 1) =>
  SLINGER_KIT.lessons.findIndex((lesson) => lesson.pieceId === pieceId && lesson.rank === rank) + 1;

const family = (id: string) => SLINGER_KIT.pieces.find((piece) => piece.id === id)?.family;

// Every clip type has a natural rule: with the whole kit owned and a rack per clip, each one gets a rule.
{
  const all = ctxAfter(SLINGER_KIT.lessons.length, 99);
  const config = SLINGER_SYSTEM.defaults(all);
  assert(config.rack.length === 4, 'the rack is full');
  assert(SLINGER_SYSTEM.validate(config, all).length === 0, `the default is valid: ${SLINGER_SYSTEM.validate(config, all).join('; ')}`);
  for (const id of config.rack) assert(config.clipRules.some((rule) => rule.clip === id), `${id} has a natural rule`);
  for (const piece of SLINGER_KIT.pieces.filter((entry) => !entry.plain)) {
    const custom: LoadoutConfig = { ...config, rack: [piece.id] };
    const rules = SLINGER_SYSTEM.defaults({ ...all, pieceRanks: new Map([[piece.id, 1]]) }).clipRules;
    assert(rules.length === 1 && rules[0].clip === piece.id, `${piece.id}: a natural rule`);
    assert(SLINGER_SYSTEM.validate({ ...custom, clipRules: rules }, all).length === 0, `${piece.id}: its rule is valid`);
  }
}

// T1 with three slots: Scatter (crowd), the newest control clip and Venom (boss).
{
  const t1 = SLINGER_SYSTEM.defaults(ctxAfter(lessonsTo('slinger-breaching'), 3));
  assert(t1.rack.length === 3, 'three slots');
  assert(t1.rack.includes('slinger-scatter'), 'the crowd clip');
  assert(t1.rack.includes('slinger-venom'), 'the boss clip');
  assert(t1.rack.some((id) => family(id) === 'control'), 'a control clip');
}

// A T2-T4 clip learned last is racked as soon as a fourth slot is free (the zone's answer at its boss).
for (const id of ['slinger-shellbreaker', 'slinger-tracer', 'slinger-hollow-point', 'slinger-seeker', 'slinger-tether', 'slinger-hallowed']) {
  const config = SLINGER_SYSTEM.defaults(ctxAfter(lessonsTo(id), 4));
  assert(config.rack.includes(id), `${id} is racked when it is the newest lesson`);
  assert(config.clipRules.some((rule) => rule.clip === id), `${id} is loaded by its rule`);
}

// Rule order: the narrow situations first, the boss clip after a low target, plating last (Siege: plating before the boss clip).
{
  const owned = ctxAfter(lessonsTo('slinger-hollow-point'), 99);
  const order = (config: LoadoutConfig) => config.clipRules.map((rule) => rule.conditions[0].id);
  const plain = order(SLINGER_SYSTEM.defaults(owned));
  assert(plain.indexOf('target-elite') < plain.indexOf('target-plated') || !plain.includes('target-plated'), 'the boss clip before plating');
  const siegeCtx = { ...owned, disciplineId: 'slinger-siege' };
  const siege = SLINGER_SYSTEM.defaults(siegeCtx);
  assert(siege.rack.every((id) => family(id) !== 'control'), 'Siege racks no control clip');
  const siegeOrder = order(siege);
  assert(!siegeOrder.includes('target-plated') || siegeOrder.indexOf('target-plated') < siegeOrder.indexOf('target-elite'), 'Siege reads plating first');
  assert(SLINGER_SYSTEM.validate(siege, siegeCtx).length === 0, 'the Siege default is valid');
}

// Trickshot carries the called-shot pick order (§10.13); the others leave it to the runtime.
{
  const ctx = ctxAfter(lessonsTo('slinger-breaching'), 3, 'slinger-trickshot');
  const trick = SLINGER_SYSTEM.defaults(ctx);
  assert(trick.calledShot?.map((ref) => ref.id).join(',') === 'enemy-winds-up,target-elite,target-low', 'the called shot: winding up, elite, lowest HP');
  assert(SLINGER_SYSTEM.validate(trick, ctx).length === 0, 'the Trickshot default is valid');
  assert(SLINGER_SYSTEM.defaults(ctxAfter(lessonsTo('slinger-breaching'), 3, 'slinger-gunslinger')).calledShot === undefined, 'no called shot outside Trickshot');
}

console.log('slinger.test.ts: ok');
