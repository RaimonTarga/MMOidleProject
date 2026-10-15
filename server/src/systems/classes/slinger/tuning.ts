/**
 * The Slinger's discipline numbers (bible §10.5), kept apart from the runtime that reads them
 * so the reload files can ask "how much does the discipline shift the clip" without importing
 * the Loadout. Every number here is a PLACEHOLDER: the bible gives the rules and the damage split
 * (Gunslinger ~85/15, Siege ~50/50, Trickshot ~60/40), not the values.
 */

export const GUNSLINGER = 'slinger-gunslinger';
export const SIEGE = 'slinger-siege';
export const TRICKSHOT = 'slinger-trickshot';

/**
 * The discipline shifts the clip by a flat amount (rounds) and the reload by a flat amount (ms),
 * never a multiplier, so a small gun never drops to a handful of rounds (§10.2).
 */
const CLIP_SHIFT: Readonly<Record<string, number>> = { [GUNSLINGER]: -2, [SIEGE]: 4 };
const RELOAD_SHIFT_MS: Readonly<Record<string, number>> = { [GUNSLINGER]: -400, [SIEGE]: 900 };

export function clipShiftFor(disciplineId: string | null | undefined): number {
  return (disciplineId && CLIP_SHIFT[disciplineId]) || 0;
}

export function reloadShiftMsFor(disciplineId: string | null | undefined): number {
  return (disciplineId && RELOAD_SHIFT_MS[disciplineId]) || 0;
}

/** Siege (§10.5): rounds deal this share of a normal round; each round banks its damage into the shell. */
export const SIEGE_ROUND_PCT = 0.5;
/** The shell's blast radius (px), and the multiplier a cluster (Scatter, Buckshot) shell widens it by. */
export const SHELL_RADIUS = 130;
export const SHELL_CLUSTER_MULT = 1.5;
/** Venom gas shell: ticks put on everything in the blast. */
export const SHELL_GAS_TICKS = 6;
/** Breaching bunker-buster: the share of plating the blast strips first, and for how long. */
export const SHELL_BUSTER_FRACTION = 0.75;
export const SHELL_BUSTER_MS = 2_000;
/** Snare and Stopping shells. */
export const SHELL_SNARE_SLOW = 0.3;
export const SHELL_SNARE_MS = 3_000;
export const SHELL_SHOVE_PX = 50;

/** Trickshot (§10.5): the Marksman's ×2.2, now the called shot's. */
export const CALLED_SHOT_MULT = 2.2;

/** Hunting Rifle: the distance at which "harder the farther" is fully paid (px). */
export const FAR_FULL_PX = 400;
