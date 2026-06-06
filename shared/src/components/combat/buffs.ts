/**
 * Canonical list of every buff id that can appear on the wire.
 * Keep in sync with server/src/systems/buffSync.ts ALL_BUFFS.
 */
export const BUFF_IDS = [
  'cadence-accelerando',
  'cadence-echo',
  'cooldown-overdrive',
  'cooldown-eternal-charge',
  'cooldown-temporal-ext',
  'cooldown-battery',
  'cooldown-alignment',
  'cooldown-channel',
  'energy-overcharge',
  'energy-ac-charge',
  'energy-ac-discharge',
  'energy-reservoir',
  'energy-equilibrium',
  'energy-sm-pool',
  'dot-vigor',
  'dot-conflag',
  'dot-chill',
  'dot-frozen',
  'reload-snipe-ready',
  'reload-hair-trigger',
  'reload-cover-fire',
  'sacred-burst',
  'debuff-slow',
  'debuff-root',
  'debuff-frost-ramp',
  'defense-absorb',
  'defense-burst',
  'defense-debt',
  'defense-hardening',
  'summoner-howl-banner',
  'summoner-trample-boon',
  'summoner-debuff-immune',
  'debuff-stunned',
  // Mobility boots (see server/src/systems/world/mobility/mobilityBoots.ts)
  'mob-sprint',   // Plains — out-of-combat sprint
  'mob-haste',    // Forest — on-kill haste
  'mob-burst',    // Mountain — on-new-target burst
  'mob-grave',    // Graveyard — stacking on-kill speed + tenacity
  'mob-kite',     // Desert — moving-away-from-target speed
  'mob-rush',     // Tundra — continuous-move ramp
  'mob-volcanic', // Volcanic — passive speed (active while not suppressed)
  'mob-suppress', // Volcanic — speed suppressed after a direct hit
] as const;

export type BuffId = typeof BUFF_IDS[number];

export type BuffCategory =
  | 'cadence'
  | 'cooldown'
  | 'energy'
  | 'dot-poison'
  | 'dot-fire'
  | 'dot-frost'
  | 'dot-frozen'
  | 'weapon'
  | 'neutral'
  | 'summoner';

export type BuffShape = 'square' | 'circle' | 'diamond' | 'small-square';

/**
 * A single active buff entry, populated server-side each tick and sent to the
 * client for display. Only player buffs are tracked here — debuffs on monsters
 * are server-only.
 *
 * Resilience notes:
 *   - `id` will be used as the sprite key when icons are added later.
 *   - `durationPct` of -1 means the buff has no timer (permanent or count-based).
 *   - `stacks` of 1 means no stack badge is shown.
 *   - `color` is a CSS hex string used for the placeholder shape; replace with
 *     icon textures later without changing any other code.
 */
export interface PlayerBuff {
  /** Unique identifier — will double as the future icon sprite key. */
  id: BuffId;
  /** Short label shown beneath the icon (3–6 chars). */
  label: string;
  /** Stack count; 1 = single instance (no badge shown). */
  stacks: number;
  /** 0–100 remaining duration percentage; -1 = no timer. */
  durationPct: number;
  /**
   * Movement-speed multiplier this buff imposes (e.g. 0.5 = 50% slow, 0 = root,
   * 1.25 = +25% boon). Omitted for buffs that don't affect movement speed. The
   * client multiplies all present values to match the server's effective speed
   * so own-player position prediction doesn't over/under-extrapolate.
   */
  speedMult?: number;
  /** CSS hex color string for the placeholder shape, e.g. '#00ffaa'. */
  color: string;
  /** Buff bar category for CSS animation class. */
  category: BuffCategory;
  /** Future sprite key; defaults to `id` until icon textures land. */
  iconKey: string;
  /** Placeholder shape token for inline CSS styling. */
  shape: BuffShape;
  /** Optional world-log source label, e.g. "Cooldown", "Ridge Boar". */
  logSourceName?: string;
  /** Optional world-log source color side. */
  logSourceSide?: 'ally' | 'enemy' | 'neutral';
  /** Optional world-log effect summary, e.g. "+attack speed". */
  logDetail?: string;
  /** Optional world-log target override for target debuffs shown in the buff bar. */
  logTargetId?: string;
  logTargetName?: string;
  logTargetType?: 'player' | 'monster';
}
