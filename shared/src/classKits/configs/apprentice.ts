/**
 * The Apprentice's Payoff rules (§9.3): payoffs dropped on moments of the enemy, each with
 * optional conditions, in priority order. Defaults from §9.13 (stand-in until the Apprentice
 * track, C-apprentice.2).
 */
import type { ClassConfigContext, PayoffPlacement, PayoffsConfig } from '../configTypes';
import { isMomentId, type MomentId } from '../moments';
import { APPRENTICE_KIT } from '../apprentice/kit';
import {
  conditionProblems,
  conditionRefs,
  isRecord,
  ownedPiece,
  type ClassSystemSpec,
} from './common';

/** A default placement, kept only under the disciplines it names, or under every discipline but those in `except`. */
type DefaultPlacement = PayoffPlacement & { discipline?: readonly string[]; except?: readonly string[] };

/**
 * The default (§9.13), in priority order, filtered to the pieces owned:
 * - T1: full → Spread with two or more enemies near, else Detonate; winds up → Seize; your HP low → Siphon.
 * - Poison: full → Detonate (the plague walks on its own; the Spread rule frees the moment), low → Wither.
 *   "Low" is your HP, after Siphon (PLACEHOLDER, OV2-APPRENTICE): on the target's low moment Wither
 *   spent the bar every cooldown through a boss's last third, so Detonate stopped and the T4 Caldera
 *   Sovereign's race was lost 3 times in 4 (sim); on your HP it is the floor when the fight turns.
 * - Fire: full → Detonate (the T1 Spread rule goes, so a full bar always sets the chain off), shell up → Fuse.
 * - Frost: winds up → Seize, frozen → Detonate (the Shatter), three or more near → Cold Snap. The T1
 *   Spread rule goes here too (PLACEHOLDER, OV2-APPRENTICE): while it held the full bar among two or
 *   more enemies a Frost Apprentice never detonated in a pack, and the T2 Jungle's nine guards killed
 *   it three times in seven minutes (live, lane 6) with its damage down to the ticks.
 * - Poison and Frost: Siphon also answers an enemy in melee with you once your HP is under half
 *   (PLACEHOLDER, OV2-APPRENTICE): at a quarter it came too late for the T2 Jungle dungeon's guard
 *   pack, three guards taking a full bar of HP in about seven seconds (live, both chains).
 * - Every later lesson on the moment it answers; Cinderfall (the Detonate sidegrade) takes a full
 *   bar among three or more enemies, Spore Burst (the Spread sidegrade) a target about to die,
 *   Transference a debuff landing on you once Recoil has answered it. Signal Fire and the
 *   rank-ups need no placement.
 * PLACEHOLDER (OV-APPRENTICE): the moments the bible leaves open (Cinderfall, Spore Burst,
 * Transference) follow the T3 and T4 bot routes' rules; "low" is the enemy card's moment.
 */
const DEFAULTS: readonly DefaultPlacement[] = [
  { moment: 'target-full', pieceId: 'apprentice-cinderfall', conditions: [{ id: 'enemies-near', param: 3 }] },
  { moment: 'target-full', pieceId: 'apprentice-cold-snap', conditions: [{ id: 'enemies-near', param: 3 }] },
  { moment: 'target-full', pieceId: 'apprentice-spread', conditions: [{ id: 'enemies-near', param: 2 }], except: ['apprentice-fire', 'apprentice-frost'] },
  { moment: 'target-full', pieceId: 'apprentice-detonate', conditions: [] },
  { moment: 'target-frozen', pieceId: 'apprentice-detonate', conditions: [], discipline: ['apprentice-frost'] },
  { moment: 'enemy-winds-up', pieceId: 'apprentice-seize', conditions: [] },
  { moment: 'touched', pieceId: 'apprentice-siphon', conditions: [{ id: 'hp-low', param: 0.5 }], discipline: ['apprentice-poison', 'apprentice-frost'] },
  { moment: 'hp-low', pieceId: 'apprentice-siphon', conditions: [] },
  { moment: 'hp-low', pieceId: 'apprentice-wither', conditions: [] },
  { moment: 'target-low', pieceId: 'apprentice-spore-burst', conditions: [{ id: 'enemies-near', param: 3 }] },
  // T2 lessons, each on the moment it answers.
  { moment: 'charging-at-me', pieceId: 'apprentice-blast-back', conditions: [] },
  { moment: 'target-shielded', pieceId: 'apprentice-frostcrack', conditions: [] },
  { moment: 'target-shielded', pieceId: 'apprentice-sear', conditions: [] },
  { moment: 'target-shielded', pieceId: 'apprentice-fuse', conditions: [] },
  { moment: 'target-out-of-reach', pieceId: 'apprentice-seep', conditions: [] },
  { moment: 'target-flees', pieceId: 'apprentice-snag', conditions: [] },
  { moment: 'debuff-landed', pieceId: 'apprentice-recoil', conditions: [] },
  { moment: 'debuff-landed', pieceId: 'apprentice-transference', conditions: [] },
  // T3 and T4 lessons that answer a moment of their own.
  { moment: 'chill-threshold', pieceId: 'apprentice-melt', conditions: [] },
  { moment: 'risen', pieceId: 'apprentice-pyre', conditions: [] },
];

export const APPRENTICE_SYSTEM: ClassSystemSpec<PayoffsConfig> = {
  kind: 'payoffs',

  parse(raw) {
    if (!Array.isArray(raw.placements)) return null;
    const placements: PayoffPlacement[] = [];
    for (const entry of raw.placements) {
      if (!isRecord(entry) || typeof entry.pieceId !== 'string' || typeof entry.moment !== 'string') return null;
      const conditions = conditionRefs(entry.conditions);
      if (!conditions) return null;
      placements.push({ moment: entry.moment as MomentId, pieceId: entry.pieceId, conditions });
    }
    return { kind: 'payoffs', placements };
  },

  defaults(ctx: ClassConfigContext) {
    return {
      kind: 'payoffs',
      placements: DEFAULTS
        .filter((entry) => ctx.pieceRanks.has(entry.pieceId)
          && (!entry.discipline || (ctx.disciplineId !== null && entry.discipline.includes(ctx.disciplineId)))
          && !(ctx.disciplineId && entry.except?.includes(ctx.disciplineId)))
        .map(({ moment, pieceId, conditions }) => ({ moment, pieceId, conditions: [...conditions] })),
    };
  },

  validate(config, ctx) {
    const problems: string[] = [];
    for (const placement of config.placements) {
      if (!isMomentId(placement.moment)) problems.push(`unknown moment "${placement.moment}"`);
      const piece = ownedPiece(APPRENTICE_KIT, ctx, placement.pieceId);
      if (!piece) problems.push(`"${placement.pieceId}" is not a payoff you know`);
      problems.push(...conditionProblems(placement.conditions, 'dot', piece?.name ?? placement.pieceId));
    }
    return problems;
  },
};
