/**
 * The Squire's Response rules editor, as a view model (class-first build plan CQ.5; bible
 * §8.3). The class screen renders it; edits come back through `withRule`, `withGroundTelegraphs`
 * and `withHoldSlam`, and the shared validator's reasons are shown as they are.
 */
import { checkClassConfig, classConfigContextFromState } from './config';
import type { ClassConfig, ConditionRef, ResponseRule, ResponsesConfig } from './configTypes';
import { CLASS_STATE_CONDITIONS } from './configTypes';
import { MOMENTS, isMomentId } from './moments';
import { pieceParamsAt } from './registry';
import { SQUIRE_KIT, type SquirePiece, type SquireTrophy } from './squire/kit';
import type { ClassScreenInput } from './view';

export interface ResponseRuleView {
  pieceId: string;
  name: string;
  family: string;
  rank: number;
  lines: string[];
  /** The enemy action it answers, in words ("a telegraphed blow is aimed at you"). */
  answers: string;
  enabled: boolean;
  /** The rule's extra conditions, in words. */
  conditions: string[];
  /** What it costs and refunds when it lands, in pips (placeholders). */
  cost: number;
  refund: number;
}

export interface ResponsesView {
  rules: ResponseRuleView[];
  groundTelegraphs: ResponsesConfig['groundTelegraphs'];
  /** The slam rule, in words. */
  holdSlam: string[];
  slam: { trophyId: string | null; name: string; kind: 'plain' | 'slam' | 'resolve'; lines: string[] };
  problems: string[];
}

const PIECES = new Map<string, SquirePiece>(SQUIRE_KIT.pieces.map((p) => [p.id, p]));
const TROPHIES = new Map<string, SquireTrophy>(SQUIRE_KIT.trophies.map((t) => [t.id, t]));

function conditionText(c: ConditionRef): string {
  const text = isMomentId(c.id)
    ? MOMENTS[c.id].text
    : (CLASS_STATE_CONDITIONS as Record<string, { text: string }>)[c.id]?.text ?? c.id;
  return c.not ? `not when ${text}` : `when ${text}`;
}

function lines(text: string, ranks: readonly { rank: number; text: string }[] | undefined, rank: number): string[] {
  return [text, ...(ranks ?? []).filter((r) => r.rank <= rank).map((r) => r.text)];
}

/** The Response rules for a Squire's screen, or null for anyone else. */
export function composeResponsesView(input: ClassScreenInput): ResponsesView | null {
  const ctx = classConfigContextFromState(input);
  const config = input.classConfig;
  if (!ctx || ctx.archetype !== 'cooldown' || config?.system.kind !== 'responses') return null;
  const system = config.system;

  const rules: ResponseRuleView[] = [];
  for (const rule of system.rules) {
    const piece = PIECES.get(rule.pieceId);
    if (!piece) continue;
    const rank = ctx.pieceRanks.get(piece.id) ?? 1;
    const params = pieceParamsAt(piece, rank);
    rules.push({
      pieceId: piece.id,
      name: piece.name,
      family: piece.family,
      rank,
      lines: lines(piece.text, piece.ranks, rank),
      answers: piece.answers ? MOMENTS[piece.answers].text : '',
      enabled: rule.enabled,
      conditions: rule.conditions.map(conditionText),
      cost: params.cost ?? 0,
      refund: params.refund ?? 0,
    });
  }

  const trophy = config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined;
  const trophyRank = trophy ? ctx.trophyRanks.get(trophy.id) ?? 1 : 0;
  const plain = PIECES.get('squire-slam')!;
  const check = checkClassConfig(config, ctx);
  return {
    rules,
    groundTelegraphs: system.groundTelegraphs,
    holdSlam: system.holdSlam.map(conditionText),
    slam: trophy
      ? { trophyId: trophy.id, name: trophy.name, kind: trophy.kind, lines: lines(trophy.text, trophy.ranks, trophyRank) }
      : { trophyId: null, name: plain.name, kind: 'plain', lines: [plain.text] },
    problems: check.ok ? [] : check.reasons,
  };
}

function withSystem(config: ClassConfig, system: ResponsesConfig): ClassConfig {
  return { ...config, mode: 'custom', system };
}

/** The config with one rule changed (enabled, its conditions). */
export function withRule(config: ClassConfig, pieceId: string, patch: Partial<Pick<ResponseRule, 'enabled' | 'conditions'>>): ClassConfig {
  if (config.system.kind !== 'responses') return config;
  const rules = config.system.rules.map((r) => (r.pieceId === pieceId ? { ...r, ...patch } : r));
  return withSystem(config, { ...config.system, rules });
}

/** Hold ground telegraphs (guard them and keep swinging) or step out like every class. */
export function withGroundTelegraphs(config: ClassConfig, choice: ResponsesConfig['groundTelegraphs']): ClassConfig {
  if (config.system.kind !== 'responses') return config;
  return withSystem(config, { ...config.system, groundTelegraphs: choice });
}

/** The slam rule: hold the slam while these hold. */
export function withHoldSlam(config: ClassConfig, holdSlam: ConditionRef[]): ClassConfig {
  if (config.system.kind !== 'responses') return config;
  return withSystem(config, { ...config.system, holdSlam });
}
