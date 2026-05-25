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
  'energy-acc',
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
  'sacred-burst',
  'defense-absorb',
  'defense-burst',
  'defense-debt',
] as const;

export type BuffId = typeof BUFF_IDS[number];

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
  /** CSS hex color string for the placeholder shape, e.g. '#00ffaa'. */
  color: string;
}
