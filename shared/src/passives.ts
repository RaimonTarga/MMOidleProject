// ── Passive keys: declare-once source of truth ────────────────────────────────
//
// Each namespace is a single `as const` array. Type unions are derived via
// `typeof KEYS[number]`. Adding a new passive = one new array entry; the union,
// autocomplete, and any namespace iteration all update from that single edit.
//
// Passives are runtime-only (never persisted — rebuilt by recalculatePlayerStats
// from skill nodes + equipment on every recalc). This migration is therefore
// compile-time only with no schema migration required.

export const DEFENSE_KEYS = [
  'defense.in-combat-regen-pct',
  'defense.regen-burst-pct',
  'defense.regen-burst-interval-ms',
  'defense.kill-burst-pct',
  'defense.shield-pct',
  'defense.shield-interval-ms',
  'defense.shield-duration-ms',
  'defense.dot-resistance',
  'defense.hit-to-dot-pct',
  'defense.absorb-pct',
  'defense.debuff-resistance',
  'defense.cleanse-stacks',
  'defense.cleanse-interval-ms',
  'defense.max-hit-pct',
] as const;

export const CADENCE_KEYS = [
  'cadence.empowered-threshold',
  'cadence.empowered-mult',
  'cadence.threshold-mod',
  'cadence.damage-mult-add',
  'cadence.speed-stack',
  'cadence.trigger-count',
  'cadence.debuff-vuln-pct',
  'cadence.debuff-vuln-ms',
  'cadence.debuff-plating-shred',
  'cadence.momentum-buildup',
  'cadence.momentum-echo',
  'cadence.detonation',
  'cadence.hemorrhage',
  'cadence.charge-buildup',
] as const;

export const COOLDOWN_KEYS = [
  'cooldown.empowered-cd-ms',
  'cooldown.empowered-mult',
  'cooldown.overdrive',
  'cooldown.eternal-cycle',
  'cooldown.temporal-extension',
  'cooldown.acceleration-ms',
  'cooldown.battery',
  'cooldown.alignment',
  'cooldown.entropy-collapse',
  'cooldown.singular-extraction',
  'cooldown.channeled-beam',
  // Read-only tuning keys — no producer today, included for forward compat
  'cooldown.temporal-buff-init-ms',
  'cooldown.temporal-buff-max-ms',
  'cooldown.temporal-flat-dmg',
  'cooldown.entropy-base-damage',
] as const;

export const RELOAD_KEYS = [
  'reload.max-ammo',
  'reload.reload-time-ms',
  'reload.laser',
  'reload.laser-damage-per-tick-pct',
  'reload.laser-heat-per-tick',
  'reload.laser-cool-per-tick',
  'reload.snipe',
  'reload.snipe-cooldown-ms',
  'reload.snipe-baseline-cd-ms',
  'reload.snipe-fullhp-mult',
  'reload.gatling',
  // Designed but not implemented (write-only in skill tree today)
  'reload.exploding-clip',
  'reload.preemptive-strike',
  'reload.high-powered',
  'reload.death-mark',
  'reload.cont-firing',
  'reload.finishing-strike',
] as const;

export const ENERGY_KEYS = [
  'energy.per-hit',
  'energy.empowered-mult',
  'energy.flash',
  'energy.micro-venting',
  'energy.polarity-decay',
  'energy.alternating-currents',
  'energy.harmonic-equilibrium',
  'energy.capacitor-shunt',
  'energy.singularity-execute',
  'energy.cascading-induction',
  'energy.superconducting-mass',
] as const;

export const DOT_KEYS = [
  'dot.max-stacks',
  'dot.conversion-pct',
  'dot.tick-interval-ms',
  'dot.duration-ms',
  'dot.poison-explosion',
  'dot.eternal-doom',
  'dot.invigorating-toxins',
  'dot.fan-the-flames',
  'dot.smoldering-ember',
  'dot.conflagration',
  'dot.permafrost',
  'dot.freezing-cold',
  'dot.glacial-fracture',
] as const;

// ── Derived types (zero duplication) ──────────────────────────────────────────

export type DefensePassiveKey  = typeof DEFENSE_KEYS[number];
export type CadencePassiveKey  = typeof CADENCE_KEYS[number];
export type CooldownPassiveKey = typeof COOLDOWN_KEYS[number];
export type ReloadPassiveKey   = typeof RELOAD_KEYS[number];
export type EnergyPassiveKey   = typeof ENERGY_KEYS[number];
export type DotPassiveKey      = typeof DOT_KEYS[number];

export type PassiveKey =
  | DefensePassiveKey | CadencePassiveKey | CooldownPassiveKey
  | ReloadPassiveKey  | EnergyPassiveKey  | DotPassiveKey;

export type PassiveMap      = Partial<Record<PassiveKey, number>>;
export type MechanicEffects = Partial<Record<PassiveKey, number>>;

/** Flat array of every passive key — useful for client iteration / debug panels. */
export const ALL_PASSIVE_KEYS = [
  ...DEFENSE_KEYS, ...CADENCE_KEYS, ...COOLDOWN_KEYS,
  ...RELOAD_KEYS, ...ENERGY_KEYS, ...DOT_KEYS,
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPassive(map: PassiveMap, key: PassiveKey): number {
  return map[key] ?? 0;
}

export function hasPassive(map: PassiveMap, key: PassiveKey): boolean {
  return (map[key] ?? 0) > 0;
}

export function mergePassives(target: PassiveMap, source: MechanicEffects | undefined): void {
  if (!source) return;
  for (const [key, val] of Object.entries(source) as [PassiveKey, number][]) {
    target[key] = (target[key] ?? 0) + val;
  }
}
