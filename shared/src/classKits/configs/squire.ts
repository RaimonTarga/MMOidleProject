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
    return { kind: 'responses', rules, groundTelegraphs: 'step-out', holdSlam: [] };
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
