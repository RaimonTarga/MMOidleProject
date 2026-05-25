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
