/**
 * The Spirit's Thresholds (§11.3): the floor you never spend below, each spend's band above
 * it, and the phase (gather or hover). Defaults from §11.13 (stand-in until the Spirit track,
 * C-spirit.2).
 */
import type { SpendBand, ThresholdsConfig } from '../configTypes';
import { SPIRIT_KIT, type SpiritPiece } from '../spirit/kit';
import {
  finiteNumber,
  isRecord,
  oneOf,
  ownedPiece,
  ownedPieces,
  type ClassSystemSpec,
} from './common';

const DEFAULT_FLOOR_PCT = 30;
/** The top band holds the big strikes; spends that wait for a moment sit in the middle. */
const TOP_BAND_PCT = 80;
const MIDDLE_BAND_PCT = 50;
const MAX_FLOOR_PCT = 95;

/**
 * Each discipline's default (§11.13): Overflow puts the floor at the brim (the highest floor the
 * gauge allows) and hovers, spending only what spills past it; Tide keeps a 20% floor (the tide
 * sets the phase); Reservoir keeps a 40% floor and holds Cloudburst at the top mark, released
 * early by the "enough" rule. PLACEHOLDER numbers.
 */
const DISCIPLINE_DEFAULTS: Readonly<Record<string, { floorPct: number; phase: 'gather' | 'hover' }>> = {
  'spirit-overflow': { floorPct: MAX_FLOOR_PCT, phase: 'hover' },
  'spirit-tide': { floorPct: 20, phase: 'gather' },
  'spirit-reservoir': { floorPct: 40, phase: 'gather' },
};
const RESERVOIR_MARK_PCT = 100;

function defaultBand(piece: SpiritPiece, floorPct: number, disciplineId: string | null): number {
  if (piece.atFloor || piece.id === 'spirit-bolt') return floorPct;
  if (disciplineId === 'spirit-overflow') return floorPct;
  if (piece.id === 'spirit-cloudburst') return RESERVOIR_MARK_PCT;
  if (piece.family === 'strike') return Math.max(floorPct, TOP_BAND_PCT);
  return Math.max(floorPct, MIDDLE_BAND_PCT);
}

export const SPIRIT_SYSTEM: ClassSystemSpec<ThresholdsConfig> = {
  kind: 'thresholds',

  parse(raw) {
    const floorPct = finiteNumber(raw.floorPct);
    const phase = oneOf(raw.phase, ['gather', 'hover'] as const);
    if (floorPct === null || !phase || !Array.isArray(raw.bands)) return null;
    const bands: SpendBand[] = [];
    for (const entry of raw.bands) {
      const atLeastPct = isRecord(entry) ? finiteNumber(entry.atLeastPct) : null;
      if (!isRecord(entry) || typeof entry.pieceId !== 'string' || atLeastPct === null) return null;
      bands.push({ pieceId: entry.pieceId, atLeastPct });
    }
    return { kind: 'thresholds', floorPct, bands, phase };
  },

  defaults(ctx) {
    const shape = (ctx.disciplineId ? DISCIPLINE_DEFAULTS[ctx.disciplineId] : undefined) ?? { floorPct: DEFAULT_FLOOR_PCT, phase: 'gather' as const };
    const bands = ownedPieces(SPIRIT_KIT, ctx).map((piece) => ({
      pieceId: piece.id,
      atLeastPct: defaultBand(piece, shape.floorPct, ctx.disciplineId),
    }));
    return { kind: 'thresholds', floorPct: shape.floorPct, bands, phase: shape.phase };
  },

  validate(config, ctx) {
    const problems: string[] = [];
    if (config.floorPct < 0 || config.floorPct > MAX_FLOOR_PCT) problems.push(`the floor sits between 0% and ${MAX_FLOOR_PCT}%`);
    const seen = new Set<string>();
    for (const band of config.bands) {
      if (!ownedPiece(SPIRIT_KIT, ctx, band.pieceId)) problems.push(`"${band.pieceId}" is not a piece you know`);
      if (seen.has(band.pieceId)) problems.push(`"${band.pieceId}" sits in two bands`);
      seen.add(band.pieceId);
      if (band.atLeastPct < 0 || band.atLeastPct > 100) problems.push(`a band sits between 0% and 100%`);
    }
    return problems;
  },
};
