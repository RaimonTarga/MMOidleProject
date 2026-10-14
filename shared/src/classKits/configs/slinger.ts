/**
 * The Slinger's Loadout (§10.3): the rack of clip types within the rack slots, the clip rules
 * read at each reload, double loads once the rack is full, and the free reload rules.
 * Defaults from §10.13 (stand-in until the Slinger track, C-slinger.2).
 */
import type { ClipRule, ConditionRef, LoadoutConfig } from '../configTypes';
import { SLINGER_KIT, slingerRack } from '../slinger/kit';
import {
  conditionProblems,
  conditionRefs,
  isRecord,
  ownedPiece,
  ownedPieces,
  stringArray,
  type ClassSystemSpec,
} from './common';

/** Each T1 clip's natural rule (§10.13); later clips have none until their track adds one. */
const NATURAL_RULES: Readonly<Record<string, ConditionRef[]>> = {
  'slinger-scatter': [{ id: 'enemies-near', param: 3 }],
  'slinger-snare': [{ id: 'target-closing-fast' }],
  'slinger-venom': [{ id: 'target-elite' }],
  'slinger-stopping': [{ id: 'charging-at-me' }],
  'slinger-breaching': [{ id: 'target-plated' }],
};

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
    const rack = ownedPieces(SLINGER_KIT, ctx).filter((clip) => !clip.plain).slice(0, slots).map((clip) => clip.id);
    const clipRules = rack
      .filter((id) => NATURAL_RULES[id])
      .map((id) => ({ clip: id, conditions: NATURAL_RULES[id].map((ref) => ({ ...ref })) }));
    return {
      kind: 'loadout', rack, doubleLoads: [], clipRules,
      reloadEarlyWhenSafe: true, neverReloadInTelegraph: true,
    };
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
