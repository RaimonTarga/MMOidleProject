import loudness from './musicLoudness.json';
import { BOSS_MUSIC, ZONE_MUSIC } from './musicCatalog';

export const ZONE_FADE_MS = 2600;
export const BATTLE_FADE_MS = 600;
const zones = new Set(Object.values(ZONE_MUSIC));
const approaches = new Set(Object.values(BOSS_MUSIC).map(suite => suite[0]));
const finales = new Set(Object.values(BOSS_MUSIC).map(suite => suite[3]).filter(Boolean));

/** Measured integrated loudness, preserving quiet approaches and a modest climax lift.
 * Static gain only: no compression, edits to the masters, or alteration of loop points.
 */
export function musicGain(track: string): number {
  const measured = (loudness as Record<string, { lufs: number; truePeakDb: number }>)[track];
  if (!measured) return 1;
  const target = zones.has(track) ? -22 : approaches.has(track) ? -27
    : track.includes('-cast-') || finales.has(track) ? -19 : -20;
  const db = Math.min(target - measured.lufs, -3 - measured.truePeakDb, 6);
  return Math.pow(10, db / 20);
}

export function musicVolume(master: number, gain: number, envelope: number): number {
  return Math.max(0, Math.min(1, master * gain * envelope));
}
