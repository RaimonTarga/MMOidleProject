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
  'defense.max-hit-mult',
  // Additive bonus (0..1) to the fraction of damage avoided on an evade, on top
  // of GAME_CONFIG.EVADE_MITIGATION_BASE. Final value is clamped to [0,1].
  'defense.evade-mitigation',
  'defense.cheat-death',
  'defense.ramp-regen-start-pct',
  'defense.ramp-regen-max-pct',
  'defense.ramp-regen-ramptime-ms',
  'defense.hardening-per-sec',
  'defense.hardening-max',
  'defense.hardening-reset-pct',
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
  'reload.exploding-clip',
  'reload.exploding-clip-mult',
  'reload.exploding-aoe-mult',
  'reload.hair-trigger',
  'reload.hair-trigger-pct-per-shot',
  'reload.hair-trigger-max-stacks',
  'reload.blunderbuss',
  'reload.blunderbuss-spread-rad',
  'reload.blunderbuss-knockback-distance-per-pellet',
  'reload.blunderbuss-knockback-ms-per-pellet',
  'reload.reload-time-mult',
  'reload.death-mark',
  'reload.death-mark-detonate-mult',
  'reload.suppressing-fire',
  'reload.suppress-shred',
  'reload.suppress-max-stacks',
  'reload.cover-fire',
  'reload.cover-fire-dr',
  'reload.acquire-radius-mult',
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

export const SHARED_KEYS = [
  'shared.empowered-mult-add',
  // 1 = this attacker's debuffs/DoT stacks still land on an evaded hit (pierce evade).
  'shared.applies-through-evade',
  // Additive multiplier applied to final damage after plating/DR. 0.25 = +25%.
  'shared.damage-mult',
  // Damage multiplier applied on the very first hit ever landed on a fresh monster entity.
  'weapon.first-strike-mult',
  // Brittle armor-shred debuff: flat plating reduction per stack applied on hit.
  'weapon.brittle-plating',
  // Brittle armor-shred debuff: damage-reduction fraction removed per stack applied on hit.
  'weapon.brittle-dr',
  // Brittle armor-shred debuff: maximum stacks the debuff can reach.
  'weapon.brittle-stacks',
  // Flurry: attack-speed fraction granted per stack (0.06 = +6% per stack).
  'weapon.flurry-pct',
  // Flurry: maximum attack-speed stacks the buff can reach.
  'weapon.flurry-stacks',
] as const;

export const SUMMONER_KEYS = [
  'summoner.minion-count',
  'summoner.minion-count-mult',
  'summoner.minion-count-cap',
  'summoner.minion-damage-pct',
  'summoner.minion-damage-mult',
  'summoner.minion-hp-pct',
  'summoner.minion-speed-mult',
  'summoner.minion-size-mult',
  'summoner.minion-respawn-ms',
  'summoner.minion-range',
  'summoner.minion-attack-cooldown',
  'summoner.damage-sponge-pct',
  'summoner.leash-mult',
  'summoner.minion-as-cave-lurker',
  'summoner.minion-as-plains-slime',
  'summoner.minion-as-boar',
  'summoner.minion-as-mud-toad',
  'summoner.minion-as-cliff-hopper',
  'summoner.minion-as-ridge-archer',
  'summoner.minion-as-crag-behemoth',
  'summoner.predators-howl',
  'summoner.howl-pct-per-stack',
  'summoner.howl-cap',
  'summoner.swarm',
  'summoner.overwhelmed-pct-per-attacker',
  'summoner.overwhelmed-ms',
  'summoner.acid-brood',
  'summoner.acid-cap',
  'summoner.acid-plating-per-stack',
  'summoner.acid-wet-pct',
  'summoner.acid-duration-ms',
  'summoner.acid-lurker-lifetime-ms',
  'summoner.acid-explosion-radius',
  'summoner.acid-explosion-damage-pct',
  'summoner.acid-explosion-corrosion-stacks',
  'summoner.grazing-field',
  'summoner.grazing-interval-ms',
  'summoner.grazing-pct',
  'summoner.grazing-ooc-mult',
  'summoner.trampled-path',
  'summoner.trample-speed-pct',
  'summoner.trample-charge-cd-ms',
  'summoner.trample-charge-speed-mult',
  'summoner.trample-stun-ms',
  'summoner.vital-burst',
  'summoner.vital-burst-immunity-ms',
  'summoner.stone-sentinel',
  'summoner.stone-sentinel-count',
  'summoner.sentinel-respawn-mult',
  'summoner.sentinel-tether-mult',
  'summoner.sentinel-slow-speed-mult',
  'summoner.sentinel-slow-atk-mult',
  'summoner.rockslide-cover',
  'summoner.rockslide-pct',
  'summoner.mountain-guardian',
  'summoner.guardian-plating-share-pct',
  'summoner.guardian-dr-share-pct',
] as const;

// Mobility / boot mechanics. Strictly on the speed + positioning axis — these
// keys NEVER grant eHP/DR/plating/HP; the only base stat a boot reduces (to "buy"
// utility within its tier's speed budget) is the `speed` statModifier. Read at
// runtime by server/src/systems/world/mobility/mobilityBoots.ts.
export const MOBILITY_KEYS = [
  // Plains — OOC speed that collapses the moment combat starts.
  'mobility.ooc-speed-pct',
  // Forest — on-kill haste (chain through packs).
  'mobility.kill-speed-pct',
  'mobility.kill-speed-ms',
  // Mountain — on-new-target burst, cooldown-gated.
  'mobility.acquire-speed-pct',
  'mobility.acquire-speed-ms',
  'mobility.acquire-cooldown-ms',
  // Cave — stealth: reduces enemies' effective detection radius vs the player.
  'mobility.stealth-pct',
  // Swamp — tenacity: reduces incoming slow/CC duration.
  'mobility.tenacity-pct',
  // Jungle — aggro-pull: increases enemies' effective detection radius vs the player.
  'mobility.aggro-pull-pct',
  // Desert — extra speed while moving away from the active target (kite/re-ambush).
  'mobility.kite-speed-pct',
  // Tundra — speed ramps while moving continuously toward a cap; bleeds off on stop.
  'mobility.ramp-speed-pct',
  'mobility.ramp-rate',
  // Volcanic — high passive speed, suppressed for a window when taking a direct hit.
  'mobility.passive-speed-pct',
  'mobility.suppress-ms',
  // Graveyard — on-kill speed + tenacity, stacking (high-density ramp).
  'mobility.kill-stack-speed-pct',
  'mobility.kill-stack-tenacity-pct',
  'mobility.kill-stack-ms',
] as const;

// ── Derived types (zero duplication) ──────────────────────────────────────────

export type DefensePassiveKey  = typeof DEFENSE_KEYS[number];
export type CadencePassiveKey  = typeof CADENCE_KEYS[number];
export type CooldownPassiveKey = typeof COOLDOWN_KEYS[number];
export type ReloadPassiveKey   = typeof RELOAD_KEYS[number];
export type EnergyPassiveKey   = typeof ENERGY_KEYS[number];
export type DotPassiveKey      = typeof DOT_KEYS[number];
export type SharedPassiveKey   = typeof SHARED_KEYS[number];
export type SummonerPassiveKey = typeof SUMMONER_KEYS[number];
export type MobilityPassiveKey = typeof MOBILITY_KEYS[number];

export type PassiveKey =
  | DefensePassiveKey | CadencePassiveKey | CooldownPassiveKey
  | ReloadPassiveKey  | EnergyPassiveKey  | DotPassiveKey
  | SharedPassiveKey  | SummonerPassiveKey | MobilityPassiveKey;

export type PassiveMap      = Partial<Record<PassiveKey, number>>;
export type MechanicEffects = Partial<Record<PassiveKey, number>>;

/** Flat array of every passive key — useful for client iteration / debug panels. */
export const ALL_PASSIVE_KEYS = [
  ...DEFENSE_KEYS, ...CADENCE_KEYS, ...COOLDOWN_KEYS,
  ...RELOAD_KEYS, ...ENERGY_KEYS, ...DOT_KEYS, ...SHARED_KEYS, ...SUMMONER_KEYS,
  ...MOBILITY_KEYS,
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPassive(map: PassiveMap, key: PassiveKey): number {
  return map[key] ?? 0;
}

export function hasPassive(map: PassiveMap, key: PassiveKey): boolean {
  return (map[key] ?? 0) > 0;
}

// Passives that represent multiplicative pass-through factors: each source
// compounds as a product (identity = 1) rather than a sum (identity = 0).
const MULTIPLICATIVE_PASSIVES = new Set<PassiveKey>(['defense.max-hit-mult']);

// Regen burst is a paired mechanic: every `interval-ms`, heal `pct × maxHp`.
// Naively summing both keys is wrong — adding intervals makes stacked sources
// proc *less* often (a nerf). Instead these two keys are resolved through a
// BurstAccumulator (see below) so stacked sources keep the highest frequency
// and combine their healing throughput. They are excluded from the generic
// additive/multiplicative merge whenever an accumulator is supplied.
const BURST_PCT_KEY: PassiveKey      = 'defense.regen-burst-pct';
const BURST_INTERVAL_KEY: PassiveKey = 'defense.regen-burst-interval-ms';

export function mergePassives(
  target: PassiveMap,
  source: MechanicEffects | undefined,
  burstAcc?: BurstAccumulator,
): void {
  if (!source) return;
  for (const [key, val] of Object.entries(source) as [PassiveKey, number][]) {
    // When an accumulator is threaded through, the burst pair is resolved
    // separately (frequency-weighted) and must not be summed here.
    if (burstAcc && (key === BURST_PCT_KEY || key === BURST_INTERVAL_KEY)) continue;
    if (MULTIPLICATIVE_PASSIVES.has(key)) {
      target[key] = (target[key] ?? 1) * val;
    } else {
      target[key] = (target[key] ?? 0) + val;
    }
  }
  if (burstAcc) accrueBurst(burstAcc, source);
}

/**
 * Order-independent accumulator for the regen-burst pair. Combining stacked
 * sources by raw summation would slow the proc cadence; instead we preserve
 * total healing throughput at the highest available frequency:
 *
 *   final interval = min interval across full (pct + interval) sources
 *   final pct      = throughput × final interval + flat pct
 *
 * where `throughput = Σ pct_i / interval_i` over full sources and `flatPct`
 * is the sum of pct-only sources (which carry no cadence of their own and
 * simply boost the magnitude of whatever burst is active).
 */
export interface BurstAccumulator {
  throughput: number;   // Σ pct_i / interval_i  over sources that define both
  minInterval: number;  // highest frequency = smallest interval among full sources
  flatPct: number;      // Σ pct  over pct-only sources (no interval of their own)
}

export function makeBurstAccumulator(): BurstAccumulator {
  return { throughput: 0, minInterval: Infinity, flatPct: 0 };
}

function accrueBurst(acc: BurstAccumulator, source: MechanicEffects): void {
  const pct      = source[BURST_PCT_KEY] ?? 0;
  const interval = source[BURST_INTERVAL_KEY] ?? 0;
  if (pct > 0 && interval > 0) {
    acc.throughput  += pct / interval;
    acc.minInterval  = Math.min(acc.minInterval, interval);
  } else if (pct > 0) {
    // pct-only source: no cadence, just adds magnitude at the active interval.
    acc.flatPct += pct;
  }
  // interval-only (pct <= 0) is inert: the mechanic needs both to fire.
}

/** Write the resolved burst pct/interval back onto the passive map. */
export function finalizeBurst(acc: BurstAccumulator, target: PassiveMap): void {
  if (acc.minInterval !== Infinity) {
    target[BURST_INTERVAL_KEY] = acc.minInterval;
    target[BURST_PCT_KEY]      = acc.throughput * acc.minInterval + acc.flatPct;
  } else if (acc.flatPct > 0) {
    // pct sources but no cadence source: store pct; interval stays 0 so the
    // mechanic remains inactive (runRegenBurst requires interval > 0).
    target[BURST_PCT_KEY] = acc.flatPct;
  }
}
