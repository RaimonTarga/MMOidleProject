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

/** The default (§9.13; T1, then the T2 pieces): full → Spread with two or more enemies near, else Detonate; winds up → Seize; your HP low → Siphon. */
const T1_DEFAULTS: readonly PayoffPlacement[] = [
  { moment: 'target-full', pieceId: 'apprentice-spread', conditions: [{ id: 'enemies-near', param: 2 }] },
  // T2: each discipline's own payoff takes the full-stack moment before Detonate (only one is owned).
  { moment: 'target-full', pieceId: 'apprentice-wither', conditions: [] },
  { moment: 'target-full', pieceId: 'apprentice-fuse', conditions: [] },
  { moment: 'target-full', pieceId: 'apprentice-cold-snap', conditions: [] },
  { moment: 'target-full', pieceId: 'apprentice-detonate', conditions: [] },
  { moment: 'enemy-winds-up', pieceId: 'apprentice-seize', conditions: [] },
  { moment: 'hp-low', pieceId: 'apprentice-siphon', conditions: [] },
  // T2 lessons, each on the moment it answers.
  { moment: 'charging-at-me', pieceId: 'apprentice-blast-back', conditions: [] },
  { moment: 'target-shielded', pieceId: 'apprentice-sear', conditions: [] },
  { moment: 'target-out-of-reach', pieceId: 'apprentice-seep', conditions: [] },
  { moment: 'target-flees', pieceId: 'apprentice-snag', conditions: [] },
  { moment: 'debuff-landed', pieceId: 'apprentice-recoil', conditions: [] },
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
      placements: T1_DEFAULTS
        .filter((placement) => ctx.pieceRanks.has(placement.pieceId))
        .map((placement) => ({ ...placement, conditions: [...placement.conditions] })),
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
