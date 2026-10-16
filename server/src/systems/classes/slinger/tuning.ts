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
// Siege +4 → +8 rounds (OV2): fewer stationary reloads per fight; sim, T2 Cave boss 5/6 → 6/6 (HP left
// 16-20% → 33%), the thin T2 bosses' margins up (Forest 23% → 45%, Mountain 11-69% → 66%).
const CLIP_SHIFT: Readonly<Record<string, number>> = { [GUNSLINGER]: -2, [SIEGE]: 8 };
// Siege +900 → +400 ms (OV2): the T2 Cave boss's eruptions land in the stationary reload; sim, Drum Gun:
// 3/6 wins at +900, 5/6 at +400. Still the longest reload of the three.
const RELOAD_SHIFT_MS: Readonly<Record<string, number>> = { [GUNSLINGER]: -400, [SIEGE]: 400 };

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
// Deadeye's longest wait 4 s -> 2 s (OV2): on enemies that never wind up or drop low (the T3 Mountain
// dungeon's Stone Wardens) every clip waited the whole hold; the live Trickshot gave up on the four guards
// after 15 minutes. Sim, T3 Mountain guards, 300 s: 2 kills at 4 s, 8 at 2 s (8 without Deadeye).
export const DEADEYE_HOLD_MS = 2_000;
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

// ── Tier 4 (T4-SLINGER; bible §10.7, §10.16): every number is a PLACEHOLDER ─────────────────

export const LIGHT_HANDS = 'slinger-light-hands';
export const SLIP_AWAY = 'slinger-slip-away';
export const QUICK_SWAP = 'slinger-quick-swap';
export const BUNKER = 'slinger-bunker';
export const STAKES = 'slinger-stakes';
export const FRESH_POWDER = 'slinger-fresh-powder';
export const COOL_RELOAD = 'slinger-cool-reload';
export const STEADY_NERVE = 'slinger-steady-nerve';
export const IMPROVISE = 'slinger-improvise';

/** Light Hands: while reloading, the first hit in this window (ms) deals this share. */
export const LIGHT_HANDS_EVERY_MS = 4_000;
export const LIGHT_HANDS_MULT = 0.5;
/** Slip Away: the speed layer while an enemy is in melee with you. */
export const SLIP_AWAY_MULT = 1.25;
/** Bunker: damage taken while reloading. */
export const BUNKER_MULT = 0.75;
/** Stakes: an enemy this close (px) and charging is stopped dead and held (ms); once per enemy per window (ms). */
export const STAKES_PX = 90;
export const STAKES_HOLD_MS = 800;
export const STAKES_EVERY_MS = 6_000;
/** Cool Reload: a telegraphed hit aimed at you while reloading deals this share. */
export const COOL_RELOAD_MULT = 0.5;
/** Steady Nerve: how long each refresh of the stun guard lasts (ms). */
export const STEADY_NERVE_MS = 400;
/** Improvise: the called shot hits this much harder when the loaded clip did nothing to its target. */
export const IMPROVISE_MULT = 1 + 1 / 3;
/** A monster this resistant to damage over time counts as immune to poison (Improvise). */
export const DOT_IMMUNE_AT = 0.9;

/** Shell ids that read as obsidian (Thermite's double). */
export const OBSIDIAN_WARD_IDS: readonly string[] = ['magma-obsidian-shell'];
export const OBSIDIAN_MONSTERS: readonly string[] = ['obsidian-tortoise', 'magma-salamander'];
