/**
 * The Slinger's Loadout editor, as a view model (class-first build plan CL.5; bible §10.3). The
 * class screen renders it; edits come back through `withRack`, `withClipRule` and `withFreeRules`,
 * and the shared validator's reasons are shown as they are.
 */
import { checkClassConfig, classConfigContextFromState } from './config';
import type { ClassConfig, ClipRule, ConditionRef, LoadoutConfig } from './configTypes';
import { CLASS_STATE_CONDITIONS } from './configTypes';
import { MOMENTS, isMomentId } from './moments';
import { SLINGER_KIT, slingerRack, type SlingerPiece, type SlingerTrophy } from './slinger/kit';
import type { ClassScreenInput } from './view';

export interface ClipView {
  pieceId: string;
  name: string;
  family: SlingerPiece['family'];
  /** The ammo ring's colour for this clip. */
  color: string;
  rank: number;
  text: string;
  plain: boolean;
}

export interface ClipRuleView {
  clip: ClipView;
  /** The rule's conditions, in words ("when several enemies are near you"); empty means no rule. */
  conditions: string[];
  switchEarly: boolean;
}

export interface LoadoutView {
  /** Rack slots as pips: used of total, and the double loads available once the rack is full. */
  rack: { used: number; slots: number; doubleLoads: number };
  /** The racked clips, in order. The plain clip is always there and is not listed. */
  racked: ClipView[];
  /** Every clip you own and can rack (not the plain one). */
  available: ClipView[];
  /** The rules, in priority order; none matching loads the plain clip. */
  rules: ClipRuleView[];
  freeRules: { reloadEarlyWhenSafe: boolean; neverReloadInTelegraph: boolean };
  /** The trophy round that closes every clip, or none yet. */
  lastRound: { trophyId: string | null; name: string; text: string };
  problems: string[];
}

const PIECES = new Map<string, SlingerPiece>(SLINGER_KIT.pieces.map((piece) => [piece.id, piece]));
const TROPHIES = new Map<string, SlingerTrophy>(SLINGER_KIT.trophies.map((trophy) => [trophy.id, trophy]));

function conditionText(condition: ConditionRef): string {
  const text = isMomentId(condition.id)
    ? MOMENTS[condition.id].text
    : (CLASS_STATE_CONDITIONS as Record<string, { text: string }>)[condition.id]?.text ?? condition.id;
  return condition.not ? `not when ${text}` : `when ${text}`;
}

function clipView(piece: SlingerPiece, rank: number): ClipView {
  const lines = [piece.text, ...(piece.ranks ?? []).filter((entry) => entry.rank <= rank).map((entry) => entry.text)];
  return { pieceId: piece.id, name: piece.name, family: piece.family, color: piece.color, rank, text: lines.join(' '), plain: piece.plain === true };
}

/** The Loadout editor for a Slinger's screen, or null for anyone else. */
export function composeLoadoutView(input: ClassScreenInput): LoadoutView | null {
  const ctx = classConfigContextFromState(input);
  const config = input.classConfig;
  if (!ctx || ctx.archetype !== 'reload' || config?.system.kind !== 'loadout') return null;
  const system = config.system;
  const { slots, doubleLoads } = slingerRack(ctx.budget);

  const view = (id: string): ClipView | null => {
    const piece = PIECES.get(id);
    return piece ? clipView(piece, ctx.pieceRanks.get(id) ?? 1) : null;
  };
  const racked = system.rack.map(view).filter((clip): clip is ClipView => !!clip);
  const available = SLINGER_KIT.pieces.filter((piece) => !piece.plain && ctx.pieceRanks.has(piece.id)).map((piece) => clipView(piece, ctx.pieceRanks.get(piece.id) ?? 1));
  const rules: ClipRuleView[] = [];
  for (const rule of system.clipRules) {
    const clip = view(rule.clip);
    if (clip) rules.push({ clip, conditions: rule.conditions.map(conditionText), switchEarly: rule.switchEarly === true });
  }
  const trophy = config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined;
  const check = checkClassConfig(config, ctx);
  return {
    rack: { used: racked.length, slots, doubleLoads },
    racked,
    available,
    rules,
    freeRules: { reloadEarlyWhenSafe: system.reloadEarlyWhenSafe, neverReloadInTelegraph: system.neverReloadInTelegraph },
    lastRound: trophy
      ? { trophyId: trophy.id, name: trophy.name, text: trophy.text }
      : { trophyId: null, name: 'A plain last round', text: 'Beat a boss and its trophy becomes the last round of every clip.' },
    problems: check.ok ? [] : check.reasons,
  };
}

function withSystem(config: ClassConfig, system: LoadoutConfig): ClassConfig {
  return { ...config, mode: 'custom', system };
}

/** The config with this rack (clip ids in order). Rules for a clip that left the rack are dropped. */
export function withRack(config: ClassConfig, rack: readonly string[]): ClassConfig {
  if (config.system.kind !== 'loadout') return config;
  const plain = SLINGER_KIT.pieces.find((piece) => piece.plain)?.id;
  const clipRules = config.system.clipRules.filter((rule) => rule.clip === plain || rack.includes(rule.clip));
  return withSystem(config, { ...config.system, rack: [...rack], clipRules });
}

/** The config with one clip's rule set (its conditions, whether it switches early), added if it had none. */
export function withClipRule(config: ClassConfig, clip: string, patch: Partial<Pick<ClipRule, 'conditions' | 'switchEarly'>>): ClassConfig {
  if (config.system.kind !== 'loadout') return config;
  const existing = config.system.clipRules.find((rule) => rule.clip === clip);
  const next: ClipRule = { clip, conditions: [], ...existing, ...patch };
  const clipRules = existing
    ? config.system.clipRules.map((rule) => (rule.clip === clip ? next : rule))
    : [...config.system.clipRules, next];
  return withSystem(config, { ...config.system, clipRules });
}

/** The config with a rule removed (the clip then loads only by the rack's other rules). */
export function withoutClipRule(config: ClassConfig, clip: string): ClassConfig {
  if (config.system.kind !== 'loadout') return config;
  return withSystem(config, { ...config.system, clipRules: config.system.clipRules.filter((rule) => rule.clip !== clip) });
}

/** The two free reload rules. */
export function withFreeRules(config: ClassConfig, patch: Partial<Pick<LoadoutConfig, 'reloadEarlyWhenSafe' | 'neverReloadInTelegraph'>>): ClassConfig {
  if (config.system.kind !== 'loadout') return config;
  return withSystem(config, { ...config.system, ...patch });
}
