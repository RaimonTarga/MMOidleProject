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
  // After cheat-death saves the player, restore this fraction of maxHp as a
  // heal-over-time spread across post-cheat-death-heal-ms. 0.30 = 30% of maxHp.
  'defense.post-cheat-death-heal-pct',
  // Duration (ms) of the post-cheat-death heal-over-time window.
  'defense.post-cheat-death-heal-ms',
  'defense.ramp-regen-start-pct',
  'defense.ramp-regen-max-pct',
  'defense.ramp-regen-ramptime-ms',
  'defense.hardening-per-sec',
  'defense.hardening-max',
  'defense.hardening-reset-pct',
  // While stationary, ramp damage-reduction up to this fraction (0.15 = +15% DR)
  // over stationary-dr-ramptime-ms. Moving erodes the ramp at the same rate
  // (symmetric decay), so brief steps barely dent it. ("Become the glacier.")
  'defense.stationary-dr-pct',
  'defense.stationary-dr-ramptime-ms',
  // ── T4 defensive mechanics ───────────────────────────────────────────────
  // Sustained-fight DR: while in combat, gain `bonus` DR every step, capping at
  // `dr-max`, reaching the cap over `ramptime-ms` (step = ramptime ÷ (max/bonus)).
  'defense.sustained-fight-dr-bonus',
  'defense.sustained-fight-dr-max',
  'defense.sustained-fight-ramptime-ms',
  // Absorb that ramps in combat from `start` to `max` over `ramptime-ms`
  // (replaces flat absorb-pct on the conversion).
  'defense.absorb-ramp-start-pct',
  'defense.absorb-ramp-max-pct',
  'defense.absorb-ramptime-ms',
  // Once per combat, if the damage-debt pool would exceed current HP, clear it.
  'defense.debt-cheat-death',
  // Heal when a cleanse pulse fires: per stack actually removed, or a flat heal
  // when there was nothing to cleanse.
  'defense.cleanse-empty-heal-pct',
  'defense.cleanse-per-stack-heal-pct',
  // Heal a fraction of a broken shield's max value when it fully breaks (two keys
  // for the charm and armor variants; summed).
  'defense.shield-break-heal-pct',
  'defense.shield-break-hp-recovery-pct',
  // 1 = when the damage cap triggers, immediately rearm the periodic shield.
  'defense.max-hit-rearms-shield',
  // At max hardening stacks, pulse +`bonus` DR for `ms`.
  'defense.hardening-max-dr-bonus',
  'defense.hardening-max-dr-ms',
  // Fraction of healing past max HP converted into a temporary shield.
  'defense.overheal-shield-pct',
  // Reactive plating: each hit taken grants +`per-stack` plating for `duration-ms`,
  // stacking (refreshing the timer) up to `max-stacks`.
  'defense.hit-plating-per-stack',
  'defense.hit-plating-max-stacks',
  'defense.hit-plating-duration-ms',
] as const;

export const CADENCE_KEYS = [
  'cadence.empowered-threshold',
  'cadence.empowered-mult',
  'cadence.threshold-mod',
  'cadence.damage-mult-add',
  'cadence.speed-stack',
  'cadence.trigger-count',
  'cadence.extra-trigger-damage-mult',
  'cadence.debuff-vuln-pct',
  'cadence.debuff-vuln-ms',
  'cadence.debuff-plating-shred',
  // Cursed Finale hard cap: max total flat plating this source can strip per target.
  'cadence.debuff-shred-cap',
  'cadence.momentum-buildup',
  'cadence.momentum-echo',
  'cadence.detonation',
  'cadence.hemorrhage',
  'cadence.charge-buildup',
  // T4 specs ─────────────────────────────────────────────────────────────────
  // Aftershock (light): after a finisher, the next N regular attacks fire on-hit twice.
  'cadence.aftershock',
  // Aftershock also grants flat on-hit damage scaling with player tier ((tier+1) × this).
  'cadence.aftershock-onhit-per-tier',
  // Metronome (balanced): each buildup attack adds flat damage to subsequent attacks + finisher.
  'cadence.metronome',
  'cadence.metronome-flat',
  // Rampage (heavy): each finisher stacks threshold-down / APS-up / atk-down / mult-up.
  'cadence.rampage',
  // Crescendo (heavy): in-combat time ramps a finisher multiplier (resets out of combat).
  'cadence.crescendo',
  // ── T4 spec tuning knobs (node-authored; constants are fallback defaults) ────
  // Shockblade: number of post-finisher regular attacks that fire on-hit twice.
  'cadence.aftershock-attacks',
  // Wavecrest: bonus damage fraction applied to each post-finisher echo hit.
  'cadence.momentum-echo-bonus',
  // Justicar: fraction of each finisher banked into the Verdict execution pool.
  'cadence.verdict-bank-pct',
  // Berserker rampage tuning: cap, threshold floor, per-stack APS/penalty/mult, OOC decay.
  'cadence.rampage-max-stacks',
  'cadence.rampage-threshold-floor',
  'cadence.rampage-aps-per-stack-ms',
  'cadence.rampage-atk-pen-per-stack',
  'cadence.rampage-mult-per-stack',
  'cadence.rampage-decay-interval-ms',
  // Hemomancer bleed: total-damage multiplier, tick count, tick interval.
  'cadence.hemorrhage-mult',
  'cadence.hemorrhage-ticks',
  'cadence.hemorrhage-tick-ms',
  // Juggernaut crescendo: ramp window (s), bonus across the ramp, post-ramp tail per second.
  'cadence.crescendo-ramp-seconds',
  'cadence.crescendo-ramp-mult',
  'cadence.crescendo-tail-per-sec',
] as const;

export const COOLDOWN_KEYS = [
  'cooldown.empowered-cd-ms',
  'cooldown.empowered-mult',
  'cooldown.overdrive',
  'cooldown.overdrive-duration-ms',
  'cooldown.overdrive-attack-speed-pct',
  'cooldown.eternal-cycle',
  'cooldown.eternal-cycle-flat',
  'cooldown.temporal-extension',
  'cooldown.acceleration-ms',
  'cooldown.battery',
  'cooldown.battery-stack-interval-ms',
  'cooldown.battery-damage-per-stack',
  'cooldown.alignment',
  'cooldown.entropy-collapse',
  'cooldown.singular-extraction',
  'cooldown.channeled-beam',
  // Devout Priest: damage per beam tick = player.attack × this (authored on the node).
  'cooldown.channeled-beam-mult',
  // Read-only tuning keys — no producer today, included for forward compat
  'cooldown.temporal-buff-init-ms',
  'cooldown.temporal-buff-max-ms',
  'cooldown.temporal-flat-dmg',
  'cooldown.entropy-base-damage',
  // T4 specs ─────────────────────────────────────────────────────────────────
  // Rupture (light): execution bypasses plating; brief window bypasses 50% on regulars.
  'cooldown.rupture',
  'cooldown.rupture-dr-pierce',
  // Reverb (balanced): attacks-between-executions charge the NEXT execution.
  'cooldown.reverb',
  'cooldown.reverb-bonus-per-attack',
  // Patience Paid (balanced): uninterrupted CD ramps attack + execution damage.
  'cooldown.patience-paid',
  'cooldown.patience-ramp-ms',
  'cooldown.patience-attack-max',
  'cooldown.patience-execution-max',
  // Vengeance (heavy): execution bonus from damage taken since last execution.
  'cooldown.vengeance',
  'cooldown.vengeance-mult',
  'cooldown.vengeance-floor',
  // ── T4 spec tuning knobs (node-authored; constants are fallback defaults) ────
  // Transcendant: ms of idle before banked stacks fall off.
  'cooldown.eternal-charge-duration-ms',
  // Sunderer: post-execution window (ms) + the plating multiplier applied during it.
  'cooldown.rupture-window-ms',
  'cooldown.rupture-window-plating-mult',
  // Destroyer: ms without a target before the primed execution cooldown resets.
  'cooldown.singular-no-target-ms',
  // Devout Priest: holy-beam channel duration and per-tick interval (ms).
  'cooldown.beam-duration-ms',
  'cooldown.beam-tick-ms',
] as const;

export const RELOAD_KEYS = [
  'reload.max-ammo',
  'reload.reload-time-ms',
  // Duelist: the last bullet of a clip fires as an empowered attack at this
  // multiplier (so shared.empowered-mult-add / weapon.empowered-mult-bonus apply).
  'reload.empowered-mult',
  'reload.laser',
  'reload.laser-damage-per-tick-pct',
  'reload.laser-heat-per-tick',
  'reload.laser-cool-per-tick',
  'reload.snipe',
  // Sniper hard-sets its firing cadence (ms between shots), ignoring weapon APS and
  // the attack-speed stat. The attack-speed stat is instead converted to attack
  // damage at this rate (bonus attack = attack × attackSpeedPct × rate).
  'reload.snipe-cadence-ms',
  'reload.snipe-as-to-dmg',
  'reload.snipe-fullhp-mult',
  // HP fraction at/above which a target counts as "full HP" for the snipe bonus.
  'reload.snipe-fullhp-threshold',
  'reload.gatling',
  'reload.exploding-clip',
  'reload.exploding-clip-mult',
  'reload.exploding-aoe-mult',
  'reload.hair-trigger',
  'reload.hair-trigger-pct-per-shot',
  'reload.hair-trigger-max-stacks',
  'reload.blunderbuss',
  'reload.blunderbuss-damage-mult',
  'reload.blunderbuss-spread-rad',
  'reload.blunderbuss-knockback-distance-per-pellet',
  'reload.blunderbuss-knockback-ms-per-pellet',
  // Fixed self-recoil distance the shooter takes per volley.
  'reload.blunderbuss-self-knockback-dist',
  'reload.reload-time-mult',
  'reload.death-mark',
  'reload.death-mark-detonate-mult',
  // Max Death Mark stacks a target can hold.
  'reload.death-mark-max',
  'reload.suppressing-fire',
  'reload.suppress-shred',
  'reload.suppress-max-stacks',
  'reload.cover-fire',
  'reload.cover-fire-dr',
  'reload.acquire-radius-mult',
  // T4 specs ─────────────────────────────────────────────────────────────────
  // Alternating Cadence (light): even shots = 2× attack, odd shots = 2× on-hit.
  'reload.alternating-cadence',
  // Dualslinger also grants flat on-hit damage scaling with player tier ((tier+1) × this).
  'reload.alternating-onhit-per-tier',
  // Even-shot attack multiplier / odd-shot on-hit multiplier.
  'reload.alternating-attack-mult',
  'reload.alternating-onhit-mult',
  // Momentum (balanced): each reload grants stacking attack speed (decays OOC).
  'reload.momentum',
  'reload.momentum-aps-per-stack',
  'reload.momentum-max-stacks',
  // Each stack also cuts reload time by this fraction (0.10 × 5 = 50% → ~1s at 2s base).
  'reload.momentum-reload-reduction',
  // OOC stacks shed one per this interval; reload reduction is floored at this fraction of base.
  'reload.momentum-decay-interval-ms',
  'reload.momentum-reload-reduction-floor',
  // Cannon (heavy): each shot banks attack × per-shot into a stored pool; reloading
  // charges for half the reload then fires the whole pool as one burst.
  'reload.cannon',
  'reload.cannon-damage-per-shot',
  // Fraction of the reload spent charging before the cannon fires.
  'reload.cannon-charge-fraction',
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
  // T4 specs ─────────────────────────────────────────────────────────────────
  'energy.overdrive',          // light: discharge → +ATK% mode, decays 100→0
  'energy.upkeep',             // light: no discharge; on-hit scales with upkeep timer
  'energy.binary-cycle',       // balanced: alternating charge/discharge states
  'energy.awakened-lightning', // balanced: discharge empowers next N attacks
  'energy.charge-state',       // balanced: attack damage scales with energy %
  'energy.critical-mass',      // heavy: consecutive discharges stack
  'energy.endless-storm',      // heavy: discharge applies a persistent storm DoT
  'energy.endless-storm-total-mult',
  // Voidwalker: per-tier flat addition to BASE max energy (resolveEnergyMax).
  'energy.max-bonus',
  'energy.flash-energy-per-hit',
  'energy.flash-max-damage-shift-pct',
  'energy.flash-max-speed-bonus-pct',
  'energy.flash-max-evasion-bonus-pct',
  'energy.flash-shift-decay-ms',
  'energy.overdrive-attack-damage-pct',
  'energy.overdrive-decay-per-sec',
  'energy.upkeep-stack-interval-ms',
  'energy.upkeep-decay-base',
  'energy.upkeep-decay-ramp-per-sec',
  'energy.upkeep-band-1-end',
  'energy.upkeep-band-2-end',
  'energy.upkeep-band-3-end',
  'energy.upkeep-band-1-onhit-per-tier',
  'energy.upkeep-band-2-onhit-per-tier',
  'energy.upkeep-band-3-onhit-per-tier',
  'energy.upkeep-overflow-onhit-per-tier',
  'energy.binary-charge-onhit-bonus',
  'energy.binary-charge-onhit-per-tier',
  'energy.binary-discharge-attack-bonus',
  'energy.binary-charge-gain-mult',
  'energy.binary-discharge-gain-mult',
  'energy.binary-charge-speed-factor',
  'energy.binary-discharge-speed-factor',
  'energy.binary-charge-discharge-mult',
  'energy.binary-discharge-discharge-mult',
  'energy.awakened-strike-count',
  'energy.awakened-damage-mult',
  'energy.charge-state-min-mult',
  'energy.charge-state-max-mult',
  'energy.singularity-gain-accel-scale',
  'energy.critical-mass-max-stacks',
  'energy.critical-mass-discharge-per-stack',
  'energy.critical-mass-gain-per-stack',
  'energy.critical-mass-reset-ms',
  'energy.endless-storm-tick-ms',
  'energy.endless-storm-duration-ms',
  'energy.endless-storm-extend-ms',
  'energy.endless-storm-max-ms',
] as const;

export const DOT_KEYS = [
  'dot.max-stacks',
  'dot.conversion-pct',
  'dot.mechanic-mult',
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
  'dot.frostbite-dot-taken-pct',
  'dot.frostbite-max-stacks',
  'dot.frostbite-duration-ms',
  'dot.poison-explosion-max-stacks',
  'dot.poison-explosion-burst-ticks',
  'dot.eternal-doom-full-stacks',
  'dot.eternal-doom-diminish-rate',
  'dot.eternal-doom-max-stacks',
  'dot.fan-the-flames-stacks-per-hit',
  'dot.fan-the-flames-stack-damage-mult',
  'dot.fan-the-flames-max-stack-bonus-mult',
  'dot.ignition-stack-damage-mult',
  'dot.conflagration-ticks',
  'dot.conflagration-tick-ms',
  'dot.conflagration-damage-factor',
  'dot.rimeshatter-dr-reduction',
  'dot.rimeshatter-duration-ms',
  'dot.chill-max-stacks',
  'dot.chill-move-slow-per-stack',
  'dot.chill-attack-slow-per-stack',
  'dot.chill-duration-ms',
  'dot.freeze-duration-ms',
  'dot.freeze-damage-taken-pct',
  'dot.freeze-move-slow-pct',
  'dot.freeze-attack-slow-pct',
  // T4 specs ─────────────────────────────────────────────────────────────────
  'dot.frenzy',         // poison: attack speed and on-hit damage while at max stacks
  'dot.frenzy-duration-ms',
  'dot.frenzy-attack-speed-pct',
  'dot.frenzy-onhit-per-tier',
  'dot.ignition',       // fire: front-load all stacks on a fresh target
  'dot.rimeshatter',    // frost: at max stacks, full direct + DR debuff
  'dot.wind-spirit',    // frost: max-stack hits apply Frostbite DoT vulnerability
] as const;

export const SHARED_KEYS = [
  'shared.empowered-mult-add',
  // Multiplicative bonus to the empowered-attack multiplier: final = base * (1 + bonus).
  // 0.25 = +25% to the whole empowered multiplier regardless of the spec's base, so
  // every spec gains the same %. (Distinct from the additive shared.empowered-mult-add.)
  'weapon.empowered-mult-bonus',
  // 1 = this attacker's debuffs/DoT stacks still land on an evaded hit (pierce evade).
  'shared.applies-through-evade',
  // Additive multiplier applied to final damage after plating/DR. 0.25 = +25%.
  'shared.damage-mult',
  // Damage multiplier applied on the very first hit ever landed on a fresh monster entity.
  'weapon.first-strike-mult',
  // Chaotic ("dead swing") cadence: every Nth player hit deals 0 damage but still
  // applies on-hit effects. Authored per-weapon on the recipe; read in runPlayerAttack.
  'weapon.dead-swing-interval',
  // Plague Axe: the dead swing applies `vulnerability` (+damage-taken) instead of
  // damage. -pct is the fraction added (0.20 = +20%), -ms the debuff duration.
  'weapon.dead-swing-vuln-pct',
  'weapon.dead-swing-vuln-ms',
  // Execute: hits vs targets at/below `execute-threshold-pct` HP deal ×`execute-dmg-mult`.
  'weapon.execute-threshold-pct',
  'weapon.execute-dmg-mult',
  // Brittle shatter: at `brittle-shatter-threshold` stacks, strip the target's
  // damage reduction entirely for `brittle-shatter-dr-strip-ms`.
  'weapon.brittle-shatter-threshold',
  'weapon.brittle-shatter-dr-strip-ms',
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
  'summoner.reconstruction-interval-mult',
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

// Guard-ability amplifiers (system rework Step 8). Carried by charms (recovery
// slot); only do anything while a Guard ability is equipped. Read at fire time in
// server/src/systems/player/abilities/abilityFiring.ts.
// Technique-ability amplifiers (abilities evolution §6). The OFFENSIVE sibling of
// GUARD_KEYS, carried by weapons/offensive gear rather than charms — the two
// namespaces stay separate so one stat can never buy both offence and defence
// (plan §3.3). Read at fire/resolve time in
// server/src/systems/player/abilities/ (abilityCooldowns, abilityCasting,
// abilityEffects). Deliberately NOT a universal "ability damage" multiplier:
// Technique Power only touches fields that opt in via TECHNIQUE_POWER_FIELDS.
export const TECHNIQUE_KEYS = [
  // Scale explicit offensive Technique payloads (splash, empower, cast damage)
  // by (1 + X). Never touches stun duration, dash distance, or slow percent.
  'technique.power-pct',
  // Shorten the Technique's cooldown by this fraction (capped 0.9).
  'technique.cooldown-reduction-pct',
  // Shorten a casted Technique's wind-up by this fraction (capped 0.6 — the
  // telegraph is the cost that makes casts a fair trade).
  'technique.cast-speed-pct',
] as const;

export const GUARD_KEYS = [
  // Shorten the Guard ability's cooldown by this fraction (fire it more often).
  'guard.cooldown-reduction-pct',
  // Scale the Guard effect magnitude (e.g. damage-reduction drPct) by (1 + X).
  'guard.potency-pct',
  // Extend the Guard buff duration by (1 + X).
  'guard.duration-pct',
  // Heal X% of maxHp into the recovery pool when the Guard fires.
  'guard.heal-on-fire-pct',
] as const;

// Core amplifiers. Carried by the `core` equipment slot (one core, always).
//
// The `*-mult` keys are percentage multipliers on the FINAL summed stat — sources
// add (two +10% = +20%), applied once in recalculatePlayerStats' core-multiplier
// pass. Negative values reduce (-0.15 = -15%).
//
// Keys whose consumer is NOT the stat rebuild are called out individually below.
// `core.dr-layer-pct` is a SEPARATE multiplicative damage-reduction layer applied
// in the combat pipeline (final = base × (1 − DR) × (1 − dr-layer)), clamped 0.9.
//
// NOTE there is deliberately no `core.dot-mult`. DoT damage per stack derives from
// `dealsDamage.attack`, which `core.attack-mult` already multiplies — so a DoT
// potency core is a second multiplier on the same number and lands as either a trap
// or a mandatory pick. See "Why there is no DoT core" in
// docs/cores-rework-implementation-plan.md before proposing one.
export const CORE_KEYS = [
  'core.attack-mult',
  'core.maxhp-mult',
  'core.plating-mult',
  'core.speed-mult',
  'core.attack-speed-mult',
  'core.dr-layer-pct',
  // Survivalist: ONE recovery number covering both halves of sustain — the passive
  // hpRegen stat (stat rebuild) and every heal routed through applyHealToPlayer
  // (regen burst, in-combat regen, ramp regen, kill burst, guard.heal-on-fire,
  // ability heals, the post-cheat-death HoT). Scaling only the passive stat would
  // make a Survivalist core read as a trap: the stat is the small half.
  'core.recovery-mult',
  // Duelist: extra damage vs monsters flagged `elite` or `isBoss`. Applied on the
  // player->monster onHit, after the base damage formula.
  'core.elite-damage-mult',
  // Catalyst: scales the flat on-hit term, which is added AFTER plating and DR.
  // That unmitigated placement is exactly why this is a real axis and not a
  // re-skin of core.attack-mult.
  'core.onhit-mult',
  // Controller: scales debuffs the player applies to monsters — duration, and the
  // potency fields explicitly listed in SCALABLE_DEBUFFS. Never a blanket
  // multiplier over every status effect; see systems/debuffScaling.ts for why.
  'core.debuff-duration-mult',
  'core.debuff-potency-mult',
  // Scout / Bruiser: both act on abilities tagged `mobility`, so both are inert
  // for a build carrying none. That is the magnifier rule, not an oversight.
  'core.mobility-cooldown-reduction-pct',
  'core.mobility-refund-on-kill-pct',
] as const;

// Rite OOC behaviors (system rework Step 11). Carried by equipped rites (always-on
// while equipped); fold into usesSkills.passives like any mechanicEffect, then read
// by the out-of-combat systems (not the in-combat stat path). See
// server/src/systems/player/rites/riteOoc.ts + server/src/systems/defense/index.ts.
export const RITE_KEYS = [
  // Quickened Breath: shorten the post-combat regen delay by this fraction (regen
  // resumes sooner). Read by the defense regen gate.
  'rite.ooc-regen-delay-reduction-pct',
  // Cleansing Breath: every `interval-ms` while OOC, strip this many stacks from
  // each debuff/DoT status effect on the player.
  'rite.ooc-cleanse-stacks',
  'rite.ooc-cleanse-interval-ms',
  // Lingering Momentum: slow the OOC decay of neutral buffs by this fraction
  // (extend their remaining duration each tick while out of combat).
  'rite.ooc-buff-decay-slowdown-pct',
  // Hunter's Instinct: on kill, grant a movement-haste buff of this magnitude for
  // this duration (reuses the mobility on-kill haste machinery).
  'rite.on-kill-haste-pct',
  'rite.on-kill-haste-ms',
] as const;

/** Universal Relic ratings. Resolved per root class in systems/relics.ts. */
export const RELIC_KEYS = [
  'relic.mechanic-frequency',
  'relic.mechanic-potency',
  'relic.mechanic-buff-effect',
  'relic.mechanic-debuff-effect',
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
export type TechniquePassiveKey = typeof TECHNIQUE_KEYS[number];
export type GuardPassiveKey    = typeof GUARD_KEYS[number];
export type CorePassiveKey     = typeof CORE_KEYS[number];
export type RitePassiveKey     = typeof RITE_KEYS[number];
export type RelicPassiveKey    = typeof RELIC_KEYS[number];

export type PassiveKey =
  | DefensePassiveKey | CadencePassiveKey | CooldownPassiveKey
  | ReloadPassiveKey  | EnergyPassiveKey  | DotPassiveKey
  | SharedPassiveKey  | SummonerPassiveKey | MobilityPassiveKey
  | GuardPassiveKey   | TechniquePassiveKey | CorePassiveKey | RitePassiveKey
  | RelicPassiveKey;

export type PassiveMap      = Partial<Record<PassiveKey, number>>;
export type MechanicEffects = Partial<Record<PassiveKey, number>>;

/** Flat array of every passive key — useful for client iteration / debug panels. */
export const ALL_PASSIVE_KEYS = [
  ...DEFENSE_KEYS, ...CADENCE_KEYS, ...COOLDOWN_KEYS,
  ...RELOAD_KEYS, ...ENERGY_KEYS, ...DOT_KEYS, ...SHARED_KEYS, ...SUMMONER_KEYS,
  ...MOBILITY_KEYS, ...GUARD_KEYS, ...TECHNIQUE_KEYS, ...CORE_KEYS, ...RITE_KEYS,
  ...RELIC_KEYS,
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
