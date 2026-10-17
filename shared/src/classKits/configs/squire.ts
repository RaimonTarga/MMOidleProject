/**
 * The Squire's Response rules (§8.3): every response you own is carried, each on its natural
 * trigger, with optional extra conditions; hold or step out of ground telegraphs; hold the
 * slam. Defaults from §8.13 (stand-in until the Squire track, C-squire.2).
 */
import type { ResponseRule, ResponsesConfig } from '../configTypes';
import { SQUIRE_KIT } from '../squire/kit';
import {
  conditionProblems,
  conditionRefs,
  isRecord,
  oneOf,
  ownedPiece,
  ownedPieces,
  type ClassSystemSpec,
} from './common';

const ANSWERS = new Set(['guard', 'counter', 'hold', 'emergency']);

/**
 * How Resolve fills (§8.2). PLACEHOLDERS for the designer and the bots.
 * - `rawHitPipsPerMaxHp`: a landed hit's raw size (before armor) as a share of max HP, times
 *   this, in pips (4: a raw hit of a quarter of your HP fills one pip).
 * - `trickleEnemyPipsPerSec`: pips per second for each enemy engaged with you, hit or not.
 * - `bossCountsAs`: a boss feeds the trickle as this many enemies.
 */
export const SQUIRE_RESOLVE = {
  rawHitPipsPerMaxHp: 4,
  trickleEnemyPipsPerSec: 0.08,
  bossCountsAs: 3,
} as const;

/** The Juggernaut's auto default holds the slam while the target is below this share of its HP. PLACEHOLDER (OV2-SQUIRE). */
export const JUGGERNAUT_HOLD_SLAM_BELOW = 0.1;

export const SQUIRE_SYSTEM: ClassSystemSpec<ResponsesConfig> = {
  kind: 'responses',

  parse(raw) {
    if (!Array.isArray(raw.rules)) return null;
    const rules: ResponseRule[] = [];
    for (const entry of raw.rules) {
      if (!isRecord(entry) || typeof entry.pieceId !== 'string' || typeof entry.enabled !== 'boolean') return null;
      const conditions = conditionRefs(entry.conditions);
      if (!conditions) return null;
      rules.push({ pieceId: entry.pieceId, enabled: entry.enabled, conditions });
    }
    const groundTelegraphs = oneOf(raw.groundTelegraphs, ['hold', 'step-out'] as const);
    const holdSlam = conditionRefs(raw.holdSlam);
    if (!groundTelegraphs || !holdSlam) return null;
    return { kind: 'responses', rules, groundTelegraphs, holdSlam };
  },

  defaults(ctx) {
    const rules = ownedPieces(SQUIRE_KIT, ctx)
      .filter((piece) => ANSWERS.has(piece.family))
      .map((piece) => ({ pieceId: piece.id, enabled: true, conditions: [] }));
    // §8.13: the Juggernaut holds its one huge slam on a nearly dead target. The Avenger's
    // "Parry the melee telegraphs, Guard the rest, Bash what can be interrupted" is the runtime's
    // answer order. The Bulwark's "hold the slam for three or more" is not on (OV2-SQUIRE): the
    // verified Bulwark chain passed without it, and a held slam never fires on a lone boss.
    const holdSlam = ctx.disciplineId === 'squire-juggernaut' ? [{ id: 'target-low' as const, param: JUGGERNAUT_HOLD_SLAM_BELOW }] : [];
    return { kind: 'responses', rules, groundTelegraphs: 'step-out', holdSlam };
  },

  validate(config, ctx) {
    const problems: string[] = [];
    const seen = new Set<string>();
    for (const rule of config.rules) {
      const piece = ownedPiece(SQUIRE_KIT, ctx, rule.pieceId);
      if (!piece || !ANSWERS.has(piece.family)) problems.push(`"${rule.pieceId}" is not a response you know`);
      if (seen.has(rule.pieceId)) problems.push(`"${rule.pieceId}" has two rules`);
      seen.add(rule.pieceId);
      problems.push(...conditionProblems(rule.conditions, 'cooldown', piece?.name ?? rule.pieceId));
    }
    problems.push(...conditionProblems(config.holdSlam, 'cooldown', 'slam rule'));
    return problems;
  },
};
