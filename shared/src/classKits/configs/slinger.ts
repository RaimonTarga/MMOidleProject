/**
 * The Slinger's Loadout (§10.3): the rack of clip types within the rack slots, the clip rules
 * read at each reload, double loads once the rack is full, and the free reload rules.
 * Defaults from §10.13 (stand-in until the Slinger track, C-slinger.2).
 */
import type { ClassConfigContext, ClipRule, ConditionRef, LoadoutConfig } from '../configTypes';
import { SLINGER_KIT, slingerRack, type SlingerPiece } from '../slinger/kit';
import {
  conditionProblems,
  conditionRefs,
  isRecord,
  ownedPiece,
  ownedPieces,
  stringArray,
  type ClassSystemSpec,
} from './common';

/**
 * Each clip's natural rule (§10.13). The T1 ones are the bible's; the T2-T4 ones read each clip's
 * text and the threat its biome teaches it against (§10.16): PLACEHOLDER (OV2).
 */
const NATURAL_RULES: Readonly<Record<string, ConditionRef[]>> = {
  'slinger-scatter': [{ id: 'enemies-near', param: 3 }],
  'slinger-snare': [{ id: 'target-closing-fast' }],
  'slinger-venom': [{ id: 'target-elite' }],
  'slinger-stopping': [{ id: 'charging-at-me' }],
  'slinger-breaching': [{ id: 'target-plated' }],
  // T2
  'slinger-buckshot': [{ id: 'charging-at-me' }],
  'slinger-shellbreaker': [{ id: 'target-shielded' }],
  'slinger-tracer': [{ id: 'target-flees' }],
  'slinger-hollow-point': [{ id: 'target-low', param: 0.5 }],
  // T3
  'slinger-seeker': [{ id: 'target-out-of-reach' }],
  'slinger-acid': [{ id: 'target-plated' }],
  'slinger-tether': [{ id: 'target-flees' }],
  'slinger-frost': [{ id: 'target-closing-fast' }],
  'slinger-incendiary': [{ id: 'target-elite' }],
  // T4
  'slinger-thermite': [{ id: 'target-shielded' }],
  'slinger-hallowed': [{ id: 'risen' }],
  'slinger-exploit': [{ id: 'target-elite' }],
};

/**
 * The order the default's rules are read in at a reload: the narrow situations first (a shield, a
 * target out of reach or fleeing, a charge), then a low target and a crowd, then "an elite or a
 * boss", with plating last: on a plated boss the poison (which skips plating) beat Breaching in the
 * sim (T2 Plains boss, Trickshot: 83-91 against 69 damage per second). PLACEHOLDER.
 */
const RULE_ORDER: readonly string[] = [
  'target-shielded', 'target-out-of-reach', 'target-flees', 'risen', 'charging-at-me', 'target-closing-fast',
  'target-low', 'enemies-near', 'target-elite', 'target-plated',
];

/** The crowd clips (§10.4: Scatter answers the Plains entry spike); the default always racks one. */
const CROWD_CLIPS: ReadonlySet<string> = new Set(['slinger-scatter', 'slinger-buckshot']);

/** Where a piece's current rank was taught in the kit's lesson order: the later, the newer. */
function lessonIndex(id: string, rank: number): number {
  let index = -1;
  SLINGER_KIT.lessons.forEach((lesson, i) => {
    if (lesson.pieceId === id && lesson.rank <= rank) index = i;
  });
  return index;
}

/**
 * The default rack (§10.13, "each clip type on its natural rule as it is learned"). Three roles keep
 * their slots, each with its newest clip: the crowd clip, the control clip (the twin guns default to
 * a damage clip and a control clip, §10.13: without Snare on the second gun the sim lost the T2 Cave
 * and Jungle bosses it won with it) and the boss clip (the one whose rule is "an elite or a boss":
 * Venom, Incendiary, Exploit; without it the sim's Trickshot lost the T2 Jungle boss 3/3). The rest
 * goes to the newest lessons (a learned clip or a rank-up), so the zone you are in has its own answer
 * racked when you meet its boss. Siege keeps no control slot and fills the rest with damage clips
 * first: its shell is made of what the drum fired (§10.13, "a damage clip in the drum"). PLACEHOLDER (OV2).
 */
function defaultRack(ctx: ClassConfigContext, slots: number): string[] {
  const owned = ownedPieces(SLINGER_KIT, ctx).filter((clip) => !clip.plain);
  const recency = (clip: SlingerPiece) => lessonIndex(clip.id, ctx.pieceRanks.get(clip.id) ?? 1);
  const siege = ctx.disciplineId === 'slinger-siege';
  const byRecency = [...owned].sort((a, b) => recency(b) - recency(a));
  const crowd = byRecency.find((clip) => CROWD_CLIPS.has(clip.id));
  const control = siege ? undefined : byRecency.find((clip) => clip.family === 'control');
  const boss = byRecency.find((clip) => NATURAL_RULES[clip.id]?.[0].id === 'target-elite');
  const kept = [crowd, control, boss].filter((clip): clip is SlingerPiece => clip !== undefined);
  const rest = byRecency
    .filter((clip) => !kept.includes(clip))
    .sort((a, b) => (siege ? Number(b.family === 'damage') - Number(a.family === 'damage') : 0) || recency(b) - recency(a));
  return [...kept, ...rest].slice(0, slots).map((clip) => clip.id);
}

/**
 * Siege reads plating before the boss clip: a Breaching drum fires the bunker-buster shell, and the
 * sim's Siege lost the T2 Cave boss 3/3 (boss 1% left) on a Venom drum and won it on Breaching.
 * PLACEHOLDER (OV2).
 */
const SIEGE_RULE_ORDER: readonly string[] = [
  ...RULE_ORDER.filter((id) => id !== 'target-plated' && id !== 'target-elite'), 'target-plated', 'target-elite',
];

/** The racked clips' natural rules, in `RULE_ORDER` (Siege's own order for the drum). */
function defaultRules(rack: readonly string[], siege: boolean): ClipRule[] {
  const order = siege ? SIEGE_RULE_ORDER : RULE_ORDER;
  const priority = (id: string) => {
    const at = order.indexOf(NATURAL_RULES[id][0].id);
    return at < 0 ? order.length : at;
  };
  return rack
    .filter((id) => NATURAL_RULES[id])
    .sort((a, b) => priority(a) - priority(b))
    .map((id) => ({ clip: id, conditions: NATURAL_RULES[id].map((ref) => ({ ...ref })) }));
}

/** Trickshot's default pick (§10.13): the enemy winding up, else the elite, else the lowest HP. */
const CALLED_SHOT_DEFAULT: readonly ConditionRef[] = [{ id: 'enemy-winds-up' }, { id: 'target-elite' }, { id: 'target-low' }];

export const SLINGER_SYSTEM: ClassSystemSpec<LoadoutConfig> = {
  kind: 'loadout',

  parse(raw) {
    const rack = stringArray(raw.rack);
    if (!rack || !Array.isArray(raw.doubleLoads) || !Array.isArray(raw.clipRules)) return null;
    const doubleLoads: [string, string][] = [];
    for (const pair of raw.doubleLoads) {
      const clips = stringArray(pair);
      if (!clips || clips.length !== 2) return null;
      doubleLoads.push([clips[0], clips[1]]);
    }
    const clipRules: ClipRule[] = [];
    for (const entry of raw.clipRules) {
      if (!isRecord(entry) || typeof entry.clip !== 'string') return null;
      const conditions = conditionRefs(entry.conditions);
      if (!conditions) return null;
      clipRules.push({ clip: entry.clip, conditions, ...(entry.switchEarly === true ? { switchEarly: true } : {}) });
    }
    if (typeof raw.reloadEarlyWhenSafe !== 'boolean' || typeof raw.neverReloadInTelegraph !== 'boolean') return null;
    const config: LoadoutConfig = {
      kind: 'loadout', rack, doubleLoads, clipRules,
      reloadEarlyWhenSafe: raw.reloadEarlyWhenSafe,
      neverReloadInTelegraph: raw.neverReloadInTelegraph,
    };
    if (raw.calledShot !== undefined) {
      const calledShot = conditionRefs(raw.calledShot);
      if (!calledShot) return null;
      config.calledShot = calledShot;
    }
    if (raw.deadeyeHold !== undefined) {
      const deadeyeHold = conditionRefs(raw.deadeyeHold);
      if (!deadeyeHold) return null;
      config.deadeyeHold = deadeyeHold;
    }
    return config;
  },

  defaults(ctx) {
    const { slots } = slingerRack(ctx.budget);
    const rack = defaultRack(ctx, slots);
    const config: LoadoutConfig = {
      kind: 'loadout', rack, doubleLoads: [], clipRules: defaultRules(rack, ctx.disciplineId === 'slinger-siege'),
      reloadEarlyWhenSafe: true, neverReloadInTelegraph: true,
    };
    if (ctx.disciplineId === 'slinger-trickshot') config.calledShot = CALLED_SHOT_DEFAULT.map((ref) => ({ ...ref }));
    return config;
  },

  validate(config, ctx) {
    const problems: string[] = [];
    const { slots, doubleLoads } = slingerRack(ctx.budget);
    if (config.rack.length > slots) problems.push(`the rack holds ${slots} clip${slots === 1 ? '' : 's'}`);
    const racked = new Set<string>();
    for (const id of config.rack) {
      const clip = ownedPiece(SLINGER_KIT, ctx, id);
      if (!clip || clip.plain) problems.push(`"${id}" is not a clip type you can rack`);
      if (racked.has(id)) problems.push(`"${id}" is racked twice`);
      racked.add(id);
    }
    if (config.doubleLoads.length > doubleLoads) problems.push(`${doubleLoads} double load${doubleLoads === 1 ? '' : 's'} available`);
    for (const [first, second] of config.doubleLoads) {
      if (!racked.has(first)) problems.push(`a double load starts from a racked clip, not "${first}"`);
      if (first === second || !ownedPiece(SLINGER_KIT, ctx, second)) problems.push(`"${second}" can't be the second property of "${first}"`);
    }
    const plain = SLINGER_KIT.pieces.find((clip) => clip.plain)?.id;
    for (const rule of config.clipRules) {
      if (!racked.has(rule.clip) && rule.clip !== plain) problems.push(`a clip rule loads "${rule.clip}", which isn't in the rack`);
      problems.push(...conditionProblems(rule.conditions, 'reload', `the rule for ${rule.clip}`));
    }
    problems.push(...conditionProblems(config.calledShot ?? [], 'reload', 'the called shot'));
    problems.push(...conditionProblems(config.deadeyeHold ?? [], 'reload', 'the held round'));
    return problems;
  },
};
