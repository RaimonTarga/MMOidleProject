/**
 * The Apprentice's Payoff rules editor, as a view model (class-first build plan; bible §9.3): an
 * enemy card with its sigil ring and the moments around it, each holding the payoffs placed on it.
 * The class screen renders it; edits come back through `withPlacement`, `withoutPlacement` and
 * `withPlacementConditions`, and the shared validator's reasons are shown as they are.
 */
import { checkClassConfig, classConfigContextFromState } from './config';
import type { ClassConfig, ConditionRef, PayoffPlacement, PayoffsConfig } from './configTypes';
import { CLASS_STATE_CONDITIONS } from './configTypes';
import { APPRENTICE_KIT, type ApprenticePiece, type ApprenticeSchool, type ApprenticeTrophy } from './apprentice/kit';
import { MOMENTS, isMomentId, type MomentId } from './moments';
import type { ClassScreenInput } from './view';

export interface PayoffView {
  pieceId: string;
  name: string;
  family: ApprenticePiece['family'];
  rank: number;
  text: string;
  /** The moment this payoff answers: its own, or the one it is usually placed on. */
  moment: MomentId | null;
}

export interface PlacementView {
  /** Position in the config's priority order (what `withoutPlacement` takes). */
  index: number;
  payoff: PayoffView;
  moment: MomentId;
  /** The placement's extra conditions, in words. */
  conditions: string[];
}

export interface MomentView {
  moment: MomentId;
  /** The moment, in words ("the target carries a full bar of your marks"). */
  text: string;
  /** What is placed on it, in priority order: at the moment, the first whose conditions hold fires. */
  placements: PlacementView[];
}

/** The T2 pick as the Payoff rules show it: the sigils' school and what it changes. */
export interface PayoffsDisciplineView {
  id: string;
  name: string;
  school: ApprenticeSchool;
  /** The discipline's rules, in words. */
  text: string;
  /** The discipline's own payoff, the piece it adds. */
  pieceName: string;
}

/** The T3 pick as the Payoff rules show it: the specialization's rule, under the school it belongs to. */
export interface PayoffsSpecializationView {
  id: string;
  name: string;
  /** The rule, in words. */
  text: string;
}

/** The T4 leaf as the Payoff rules show it: the pick, under the school it belongs to. */
export interface PayoffsLeafView {
  id: string;
  name: string;
  /** What reaches you: the column the leaf answers (charger, ambusher or shooter). */
  column: string;
  /** The rule, in words. */
  text: string;
}

export interface PayoffsView {
  /** The sigil cap as the class budget plus the discipline's shift ("Sigils 6"). */
  sigils: { cap: number };
  /** Null until the T2 pick; the sigil colour follows its school. */
  discipline: PayoffsDisciplineView | null;
  /** Null until the T3 pick; its rule runs on every payoff and sigil. */
  specialization: PayoffsSpecializationView | null;
  /** Null until the T4 leaf pick; its rule runs on what reaches you. */
  leaf: PayoffsLeafView | null;
  /** The moments you can place payoffs on: those with a placement, plus every one a lesson you own uses. */
  moments: MomentView[];
  /** Every payoff you know, to place. */
  available: PayoffView[];
  /** The trophy: a payoff relic twists one payoff, a sigil relic twists the sigils. */
  relic: { trophyId: string | null; name: string; kind: ApprenticeTrophy['kind'] | 'none'; text: string };
  problems: string[];
}

const PIECES = new Map<string, ApprenticePiece>(APPRENTICE_KIT.pieces.map((piece) => [piece.id, piece]));
const TROPHIES = new Map<string, ApprenticeTrophy>(APPRENTICE_KIT.trophies.map((trophy) => [trophy.id, trophy]));

/** The moments a payoff naturally answers, so the card shows them once you own the lesson. */
const NATURAL_MOMENT: Readonly<Record<string, MomentId>> = {
  'apprentice-detonate': 'target-full',
  'apprentice-spread': 'target-full',
  'apprentice-numb': 'target-full',
  'apprentice-siphon': 'hp-low',
  'apprentice-seize': 'enemy-winds-up',
  'apprentice-converge': 'target-full',
  // The discipline pieces (§9.5) have no moment of their own: any moment will do, full is the usual one.
  'apprentice-wither': 'target-full',
  'apprentice-fuse': 'target-full',
  'apprentice-cold-snap': 'target-full',
  // T3: the Detonate-shaped lessons and Signal Fire go on the full bar; Melt names its own moment.
  'apprentice-spore-burst': 'target-full',
  'apprentice-signal-fire': 'target-full',
  'apprentice-cinderfall': 'target-full',
  // T4: Frostcrack and Pyre name their own moments; Transference answers the full bar like Detonate.
  'apprentice-transference': 'target-full',
};

function conditionText(condition: ConditionRef): string {
  const text = isMomentId(condition.id)
    ? MOMENTS[condition.id].text
    : (CLASS_STATE_CONDITIONS as Record<string, { text: string }>)[condition.id]?.text ?? condition.id;
  return condition.not ? `not when ${text}` : `when ${text}`;
}

function payoffView(piece: ApprenticePiece, rank: number): PayoffView {
  const lines = [piece.text, ...(piece.ranks ?? []).filter((entry) => entry.rank <= rank).map((entry) => entry.text)];
  return { pieceId: piece.id, name: piece.name, family: piece.family, rank, text: lines.join(' '), moment: piece.moment ?? NATURAL_MOMENT[piece.id] ?? null };
}

/** The Payoff rules editor for an Apprentice's screen, or null for anyone else. */
export function composePayoffsView(input: ClassScreenInput): PayoffsView | null {
  const ctx = classConfigContextFromState(input);
  const config = input.classConfig;
  if (!ctx || ctx.archetype !== 'dot' || config?.system.kind !== 'payoffs') return null;
  const system = config.system;

  const available = APPRENTICE_KIT.pieces
    .filter((piece) => ctx.pieceRanks.has(piece.id))
    .map((piece) => payoffView(piece, ctx.pieceRanks.get(piece.id) ?? 1));

  const momentIds: MomentId[] = [];
  const note = (moment: MomentId): void => { if (!momentIds.includes(moment)) momentIds.push(moment); };
  for (const entry of available) {
    // T2 payoffs bound to their own moment (Blast Back, Sear, Seep, Snag, Recoil) name it themselves.
    const natural = entry.moment;
    if (natural) note(natural);
  }
  for (const placement of system.placements) note(placement.moment);

  const moments: MomentView[] = momentIds.map((moment) => ({
    moment,
    text: MOMENTS[moment].text,
    placements: system.placements
      .map((placement, index) => ({ placement, index }))
      .filter(({ placement }) => placement.moment === moment)
      .flatMap(({ placement, index }) => {
        const piece = PIECES.get(placement.pieceId);
        if (!piece) return [];
        return [{ index, payoff: payoffView(piece, ctx.pieceRanks.get(piece.id) ?? 1), moment, conditions: placement.conditions.map(conditionText) }];
      }),
  }));

  const trophy = config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined;
  const check = checkClassConfig(config, ctx);
  const picked = APPRENTICE_KIT.disciplines.find((entry) => entry.id === ctx.disciplineId);
  const school = picked ? (picked.id.replace('apprentice-', '') as ApprenticeSchool) : null;
  const spec = ctx.specializationId ? APPRENTICE_KIT.specializations.find((entry) => entry.id === ctx.specializationId && entry.disciplineId === ctx.disciplineId) : undefined;
  const leafDef = input.leafId ? APPRENTICE_KIT.leaves.find((entry) => entry.id === input.leafId && entry.disciplineId === ctx.disciplineId) : undefined;
  const capShift = Math.round(picked?.params['capShift'] ?? 0);
  return {
    sigils: { cap: Math.max(1, ctx.budget + capShift) },
    discipline: picked && school
      ? { id: picked.id, name: picked.name, school, text: picked.text, pieceName: (picked.pieceId && PIECES.get(picked.pieceId)?.name) || picked.name }
      : null,
    specialization: spec ? { id: spec.id, name: spec.name, text: spec.text } : null,
    leaf: leafDef ? { id: leafDef.id, name: leafDef.name, column: leafDef.column, text: leafDef.text } : null,
    moments,
    available,
    relic: trophy
      ? { trophyId: trophy.id, name: trophy.name, kind: trophy.kind, text: trophy.text }
      : { trophyId: null, name: 'A plain payoff set', kind: 'none', text: 'Beat a boss and its trophy twists a payoff or your sigils.' },
    problems: check.ok ? [] : check.reasons,
  };
}

function withSystem(config: ClassConfig, system: PayoffsConfig): ClassConfig {
  return { ...config, mode: 'custom', system };
}

/** Place a payoff on a moment (last in that moment's priority), with optional extra conditions. */
export function withPlacement(config: ClassConfig, moment: MomentId, pieceId: string, conditions: ConditionRef[] = []): ClassConfig {
  if (config.system.kind !== 'payoffs') return config;
  const placement: PayoffPlacement = { moment, pieceId, conditions };
  return withSystem(config, { ...config.system, placements: [...config.system.placements, placement] });
}

/** Take a placement off (by its index in the priority order). */
export function withoutPlacement(config: ClassConfig, index: number): ClassConfig {
  if (config.system.kind !== 'payoffs') return config;
  return withSystem(config, { ...config.system, placements: config.system.placements.filter((_, i) => i !== index) });
}

/** Change a placement's extra conditions. */
export function withPlacementConditions(config: ClassConfig, index: number, conditions: ConditionRef[]): ClassConfig {
  if (config.system.kind !== 'payoffs') return config;
  return withSystem(config, { ...config.system, placements: config.system.placements.map((placement, i) => (i === index ? { ...placement, conditions } : placement)) });
}
