/**
 * The Striker's T4 leaves, the pick lookup and the numbers (class-first build plan T4-STRIKER;
 * bible §12.7). A leaf of the cadence runtime: it imports nothing from the other Striker files,
 * so `strikerGear.ts` (the DoT floor) and `strikerT4.ts` (the rules) can both build on it.
 *
 * A leaf is a Passive Tree pick (`player:unlockSkill`), so the pick is simply the id in
 * `usesSkills.unlockedSkills`; like the specialization lookup, it only counts while it is one
 * of the picked discipline's own.
 *
 * Every number is a PLACEHOLDER for the designer (the bible gives the shapes, not the figures).
 */
import { STRIKER_KIT, getCooldown, getCounter, isCooldownActive } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';

// ── Light: not being there ──
export const GHOSTSTEP = 'striker-ghoststep';
export const SLIP_THROUGH = 'striker-slip-through';
export const SHAKE_IT_OFF = 'striker-shake-it-off';
// ── Balanced: composure ──
export const READ_THE_BLOW = 'striker-read-the-blow';
export const CENTERED = 'striker-centered';
export const POISE = 'striker-poise';
// ── Heavy: endurance ──
export const UNBREAKABLE = 'striker-unbreakable';
export const IMMOVABLE = 'striker-immovable';
export const THICK_BLOOD = 'striker-thick-blood';

/** Ghoststep: a hit over this share of your max HP can miss. */
export const GHOSTSTEP_HIT_PCT = 0.25;
/** Ghoststep: once every this long. */
export const GHOSTSTEP_COOLDOWN_MS = 5000;
/** Slip Through: each enemy on you adds this much to the chance a hit misses, up to the cap (1 in 3). */
export const SLIP_PER_ENEMY = 0.1;
export const SLIP_MAX = 1 / 3;
/** Shake It Off: debuffs on you wear off this many times as fast. */
export const SHAKE_IT_OFF_RATE = 2;
/** Read the Blow: a telegraphed attack deals this share less. */
export const READ_THE_BLOW_CUT = 0.5;
/** Centered: while this many enemies attack you... */
export const CENTERED_ENEMIES = 3;
/** ...you take this share less damage. */
export const CENTERED_CUT = 0.2;
/** Poise: below this share of your HP... */
export const POISE_BELOW = 0.5;
/** ...your Recovery is multiplied by this. */
export const POISE_RECOVERY_X = 2;
/** Unbreakable: after the saving blow, nothing hurts you for this long. */
export const UNBREAKABLE_WINDOW_MS = 2000;
/** Thick Blood: damage over time on you is multiplied by this. */
export const THICK_BLOOD_DOT_MULT = 0.5;

/** `tracksCombat` scratch: Ghoststep's cooldown, Unbreakable's window (cooldowns), Unbreakable spent this fight (counter). */
export const GHOSTSTEP_COOLDOWN = 'striker.ghoststep';
export const UNBREAKABLE_WINDOW = 'striker.unbreakable.window';
export const UNBREAKABLE_SPENT = 'striker.unbreakable.spent';

/** Whether the player has picked this leaf (and it is one of their discipline's own). */
export function strikerLeaf(player: PlayerEntity, id: string): boolean {
  if (!player.usesSkills.unlockedSkills.includes(id)) return false;
  const leaf = STRIKER_KIT.leaves.find((entry) => entry.id === id);
  return leaf !== undefined && leaf.disciplineId === player.usesSkills.disciplineId;
}

/** Unbreakable: the saving blow's window is up, and nothing hurts you. */
export function strikerInvulnerableWindow(player: PlayerEntity): boolean {
  return isCooldownActive(player.tracksCombat, UNBREAKABLE_WINDOW);
}

/** Unbreakable was spent in this fight. */
export function strikerUnbreakableSpent(player: PlayerEntity): boolean {
  return getCounter(player.tracksCombat, UNBREAKABLE_SPENT) > 0;
}

/** What a damage-over-time tick on a Striker pays: nothing in the window, half with Thick Blood. */
export function strikerLeafDotDamage(player: PlayerEntity, hpDamage: number): number {
  if (strikerInvulnerableWindow(player)) return 0;
  if (strikerLeaf(player, THICK_BLOOD)) return Math.round(hpDamage * THICK_BLOOD_DOT_MULT);
  return hpDamage;
}

/** The window's remaining time, for tests and the HUD. */
export function strikerUnbreakableWindowMs(player: PlayerEntity): number {
  return getCooldown(player.tracksCombat, UNBREAKABLE_WINDOW);
}
