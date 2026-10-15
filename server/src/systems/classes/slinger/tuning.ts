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

// ── Tier 3 (T3-SLINGER; bible §10.6, §10.16): every number is a PLACEHOLDER ─────────────────

export const FAN_THE_HAMMER = 'slinger-fan-the-hammer';
export const CROSSFIRE = 'slinger-crossfire';
export const GUN_KATA = 'slinger-gun-kata';
export const DEATHMARK = 'slinger-deathmark';
export const ENTRENCHED = 'slinger-entrenched';
export const ROLLING_FIRE = 'slinger-rolling-fire';
export const RICOCHET = 'slinger-ricochet';
export const PIERCE = 'slinger-pierce';
export const DEADEYE = 'slinger-deadeye';

/** Fan the Hammer: after a reload, this many rounds (three per gun) fire at triple rate (+200% haste). */
export const FAN_ROUNDS = 6;
export const FAN_HASTE_PCT = 2;

/** Crossfire: two different guns on one target within this window empower each other's effects. */
export const CROSSFIRE_WINDOW_MS = 1_500;
export const CROSSFIRE_EFFECT_MULT = 1.5;

/** Gun Kata: "in melee with you" is this close (px, both guns fire); rounds within `KATA_CLOSE_PX` hit this much harder. */
export const KATA_MELEE_PX = 90;
export const KATA_CLOSE_PX = 160;
export const KATA_CLOSE_MULT = 1.8;

/** Deathmark: a mark lasts this long (ms); each marked enemy takes this share of the whole shell. */
export const DEATHMARK_MS = 8_000;
export const DEATHMARK_SHELL_SHARE = 0.7;

/** Entrenched: standing still this long (ms) reaches the cap; the cap's fire-rate haste and shell bonus. */
export const ENTRENCH_FULL_MS = 8_000;
export const ENTRENCH_MAX_HASTE = 0.5;
export const ENTRENCH_MAX_SHELL = 0.75;

/** Rolling Fire: a small shell goes off every this many rounds (and on the last, so the reload carries none). */
export const ROLLING_EVERY_ROUNDS = 3;

/** Ricochet: the called shot bounces on to this many more enemies, each taking this share of it. */
export const RICOCHET_BOUNCES = 2;
export const RICOCHET_SHARE = 0.7;

/** Pierce: how far (px) from the line of fire an enemy still counts as "in the way". */
export const PIERCE_WIDTH_PX = 44;

/** Deadeye: the longest the last round waits (ms), what a held round hits for, and "below a third". */
export const DEADEYE_HOLD_MS = 4_000;
export const DEADEYE_HELD_MULT = 1.6;
export const DEADEYE_LOW_HP = 1 / 3;

/** Seeker's reach on a hidden target is the gun's own; Tether ends a getaway by rooting for this long (ms). */
export const TETHER_ROOT_MS = 600;

/** Rime Round: how long a slow lingers on an enemy standing on the frozen ground (ms). */
export const RIME_SLOW_MS = 800;

/** Frostlock Rifle: the damage bonus is the `slinger.cold-pct` passive. Firebrand Pistol: `slinger.heat-pct` per Heat stack. */
export const HEAT_STACKS_MAX = 15;

/** Effect numbers a Crossfire pair scales (clip params that make a clip's effect bigger). */
export const CROSSFIRE_KEYS: readonly string[] = [
  'nickPct', 'pelletPct', 'slowPerRound', 'tickShare', 'shovePx', 'shredPerRound', 'movePerChill', 'attackPerChill', 'burnShare', 'fleeSlowPct',
];
