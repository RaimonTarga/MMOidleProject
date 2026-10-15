/**
 * The Striker's Order editor and beat strip, as view models (class-first build plan CS.5;
 * bible §12.2–§12.3). The class screen's Order editor and the HUD strip render these; edits
 * go back through `withBeat` / `withRelic` and the shared validator, so the screen shows the
 * server's own reasons.
 */
import { checkClassConfig, classConfigContextFromState } from './config';
import type { ClassConfig, OrderConfig } from './configTypes';
import { MOMENTS, isMomentId } from './moments';
import { STRIKER_KIT, type StrikerPiece, type StrikerTrophy } from './striker/kit';
import { strikerMasteredBeats, strikerSlots } from './configs/striker';
import type { ClassScreenInput } from './view';

export interface OrderBeatView {
  index: number;
  /** The opener (first beat) and the wind-up (the beat before the finisher) take casts. */
  position: 'opener' | 'beat' | 'windup';
  pieceId: string | null;
  pieceName: string | null;
  family: string | null;
  cast: 'opener' | 'windup' | null;
  /** This technique pays no price (gold on the strip). */
  mastered: boolean;
}

export interface OrderTechniqueView {
  id: string;
  name: string;
  family: string;
  cast: 'opener' | 'windup' | null;
  rank: number;
  lines: string[];
  /** The beat it sits on, if any. */
  placedAt: number | null;
  /** The beats it may go on (a cast, only its own position). */
  allowedBeats: number[];
}

export interface OrderFinisherView {
  /** Null for the plain finisher (no trophy yet, or none equipped). */
  trophyId: string | null;
  name: string;
  kind: 'plain' | 'spark' | 'weight';
  rank: number;
  lines: string[];
}

export interface OrderView {
  beats: OrderBeatView[];
  finisher: OrderFinisherView;
  /** Techniques you own, in kit order. */
  techniques: OrderTechniqueView[];
  /** "Open, then master": how many beats may carry a technique, and how many are mastered. */
  slots: { open: number; used: number; mastered: number };
  /** The finisher hold rule, in words. */
  holdFinisher: string[];
  /** Why the current Order can't be used, if it can't (normally empty). */
  problems: string[];
}

const PIECES = new Map<string, StrikerPiece>(STRIKER_KIT.pieces.map((p) => [p.id, p]));
const TROPHIES = new Map<string, StrikerTrophy>(STRIKER_KIT.trophies.map((t) => [t.id, t]));

function lines(text: string, ranks: readonly { rank: number; text: string }[] | undefined, rank: number): string[] {
  return [text, ...(ranks ?? []).filter((r) => r.rank <= rank).map((r) => r.text)];
}

/** The Order for a Striker's screen and strip, or null for anyone else. */
export function composeOrderView(input: ClassScreenInput): OrderView | null {
  const ctx = classConfigContextFromState(input);
  const config = input.classConfig;
  if (!ctx || ctx.archetype !== 'cadence' || config?.system.kind !== 'order') return null;
  const order = config.system;
  const last = order.beats.length - 1;
  const { open, mastered } = strikerSlots(ctx.budget, order.beats.length);
  const masteredBeats = strikerMasteredBeats(order.beats, mastered);

  const beats: OrderBeatView[] = order.beats.map((id, index) => {
    const piece = id ? PIECES.get(id) : undefined;
    return {
      index,
      position: index === 0 ? 'opener' : index === last ? 'windup' : 'beat',
      pieceId: piece?.id ?? null,
      pieceName: piece?.name ?? null,
      family: piece?.family ?? null,
      cast: piece?.cast ?? null,
      mastered: masteredBeats.has(index),
    };
  });

  const techniques: OrderTechniqueView[] = [];
  for (const piece of STRIKER_KIT.pieces) {
    const rank = ctx.pieceRanks.get(piece.id);
    if (rank === undefined || piece.finisher) continue;
    const placed = order.beats.indexOf(piece.id);
    techniques.push({
      id: piece.id,
      name: piece.name,
      family: piece.family,
      cast: piece.cast ?? null,
      rank,
      lines: lines(piece.text, piece.ranks, rank),
      placedAt: placed >= 0 ? placed : null,
      allowedBeats: piece.cast === 'opener' ? [0] : piece.cast === 'windup' ? [last] : order.beats.map((_, i) => i),
    });
  }

  const trophy = config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined;
  const trophyRank = trophy ? ctx.trophyRanks.get(trophy.id) ?? 1 : 0;
  const plain = PIECES.get('striker-finisher')!;
  const finisher: OrderFinisherView = trophy
    ? { trophyId: trophy.id, name: trophy.name, kind: trophy.kind, rank: trophyRank, lines: lines(trophy.text, trophy.ranks, trophyRank) }
    : { trophyId: null, name: plain.name, kind: 'plain', rank: 1, lines: [plain.text] };

  const check = checkClassConfig(config, ctx);
  return {
    beats,
    finisher,
    techniques,
    slots: { open, used: order.beats.filter((id) => id !== null).length, mastered },
    holdFinisher: order.holdFinisher.map((c) => {
      const text = isMomentId(c.id) ? MOMENTS[c.id].text : c.id;
      return c.not ? `not when ${text}` : `when ${text}`;
    }),
    problems: check.ok ? [] : check.reasons,
  };
}

/**
 * The config with `pieceId` on beat `index` (null clears it). A technique already on another
 * beat moves. The result is `custom`: the player has edited it.
 */
export function withBeat(config: ClassConfig, index: number, pieceId: string | null): ClassConfig {
  if (config.system.kind !== 'order') return config;
  const beats = config.system.beats.map((id) => (pieceId !== null && id === pieceId ? null : id));
  if (index >= 0 && index < beats.length) beats[index] = pieceId;
  const system: OrderConfig = { ...config.system, beats };
  return { ...config, mode: 'custom', system };
}

/** The config with this trophy (or none) as the finisher. */
export function withRelic(config: ClassConfig, trophyId: string | null): ClassConfig {
  return { ...config, mode: 'custom', relic: trophyId ? [trophyId] : [] };
}

