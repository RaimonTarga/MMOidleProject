import { GAME_CONFIG } from './config/gameConfig';

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
  // ── Recovery access ──────────────────────────────────────────────────────
  // Recovery is the canonical HP-restoration RATE: 1 point = 1% of maxHp per
  // second at 100% active Recovery, held on `HasHealth.recovery`. Out of combat
  // (past the OOC delay) the player runs at 100%. In combat, effects do NOT
  // invent their own %-maxHp heals — they ACTIVATE a fraction of that one rate,
  // and fractions from different sources ADD (see recoveryFraction()).
  //
  // `-active-pct` is permanent-while-in-combat access (Squire).
  'defense.recovery-active-pct',
  // Periodic pulse: every `interval-ms`, activate `pulse-pct` of Recovery for
  // `duration-ms`. The pulse refreshes its own timer rather than stacking a
  // second copy. Duration falls back to GAME_CONFIG.RECOVERY_PULSE_MS.
  'defense.recovery-pulse-pct',
  'defense.recovery-pulse-interval-ms',
  'defense.recovery-pulse-duration-ms',
  // On kill, activate `on-kill-pct` of Recovery for `on-kill-ms` (default
  // GAME_CONFIG.RECOVERY_ON_KILL_MS). Further kills REFRESH the window; they do
  // not stack another copy, which is what makes it a chain-farming mechanic that
  // is deliberately weak against bosses and isolated enemies.
  'defense.recovery-on-kill-pct',
  'defense.recovery-on-kill-ms',
  // Multiplies the fraction activated by Recovery-TAGGED SKILLS only (abilities
  // carrying the `recovery` tag, e.g. Second Wind). Deliberately does NOT touch
  // passive Recovery access — Squire, the pulse, on-kill, ramp — nor Barrier,
  // Ward, Absorb, Cleanse or damage reduction.
  'defense.recovery-skill-potency',
  // ── Barrier: the permanent, self-recharging absorb pool ──────────────────
  // Pool size as a fraction of maxHp. Presence of a non-zero value is what
  // attaches HasBarrier. The two companions override GAME_CONFIG defaults:
  // recharge-pct is the fraction of MAX refilled per second, delay-ms is how
  // long the player must go undamaged (direct hits AND DoT ticks) before it
  // starts. There is no interval or duration — the barrier never expires.
  'defense.barrier-pct',
  'defense.barrier-recharge-pct',
  'defense.barrier-delay-ms',
  // Tundra charm: while holding position in active combat, the barrier recharges
  // this fraction of its max per second even while being hit (no undamaged delay).
  'defense.barrier-stationary-recharge-pct',
  'defense.dot-resistance',
  'defense.hit-to-dot-pct',
  'defense.absorb-pct',
  // Cave charm: extra absorb while a Mitigation Guard buff (Brace, Endure,
  // Bramble) is active.
  'defense.absorb-guard-bonus-pct',
  'defense.debuff-resistance',
  'defense.max-hit-pct',
  'defense.max-hit-mult',
  // Additive bonus (0..1) to the fraction of damage avoided on an evade, on top
  // of GAME_CONFIG.EVADE_MITIGATION_BASE. Final value is clamped to [0,1].
  'defense.evade-mitigation',
  // Ramping Recovery access: climbs from `start` to `max` over `ramptime-ms` of
  // continuous combat, then holds. Same units as the other access keys.
  'defense.recovery-ramp-start-pct',
  'defense.recovery-ramp-max-pct',
  'defense.recovery-ramp-ramptime-ms',
  // Stationary DR applied multiplicatively to remaining damage; builds only under
  // incoming attacks. Movement gets 250 ms grace, then a full ramp decays in one
  // second; without attacks it decays over two.
  'defense.stationary-dr-pct',
  'defense.engagement-dr-pct',
  'defense.engagement-dr-ms',
  'defense.overheal-ward-cap-pct',
  // Diagnostic record of summed item DR before the class/item multiplicative
  // grouping in stats.ts.
  'defense.item-dr-base',
  'defense.stationary-dr-ramptime-ms',
  // ── T4 defensive mechanics ───────────────────────────────────────────────
  // Absorb that ramps in combat from `start` to `max` over `ramptime-ms`
  // (replaces flat absorb-pct on the conversion).
  'defense.absorb-ramp-start-pct',
  'defense.absorb-ramp-max-pct',
  'defense.absorb-ramptime-ms',
  // Heal a fraction of the barrier's max value when it is emptied, or of a ward's
  // max value when that ward breaks (two keys for the charm and armor variants;
  // summed). Barrier depletion is a routine event under the recharge model, so
  // both are gated by GAME_CONFIG.BARRIER_BREAK_RIDER_CD_MS.
  'defense.barrier-break-heal-pct',
  'defense.barrier-break-hp-recovery-pct',
  // 1 = when the damage cap triggers, immediately refill the barrier to full
  // (same cooldown gate as the break heal).
  'defense.max-hit-refills-barrier',
  // Fraction of healing past max HP converted into a temporary ward.
  'defense.overheal-ward-pct',
  // Charm wards (S7): a ward of this share of max HP for GAME_CONFIG.CHARM_WARD_MS, raised by a
  // hit over a quarter of max HP (Mountain) or when the Chill freezes you (Tundra).
  'defense.ward-hit-pct',
  'defense.ward-freeze-pct',
  // Reactive plating: each hit taken adds a +`per-stack` plating stack up to
  // `max-stacks`; stacks hold for `duration-ms` after the last hit, then fade singly.
  'defense.hit-plating-per-stack',
  'defense.hit-plating-max-stacks',
  'defense.hit-plating-duration-ms',
  // ── Class lines' generic defenses (class-first build plan CS.4) ─────────────
  // Out-of-combat healing runs this much faster (a Striker's Deep Breath).
  'defense.ooc-recovery-pct',
  'defense.recovery-rhythm-max',      // Rhythm: the longer the fight, the more the Recovery share is multiplied, up to this
  'defense.recovery-rhythm-ms',       // Rhythm: the fight length that reaches the maximum
  'conduit.command',  // Weapon: adds (or removes) Command
  'conduit.damage-pct',  // Summon damage
  'conduit.hp-pct',  // Summon HP
  'conduit.cooldown-pct',  // Summon attack interval
  'conduit.ability-pct',  // Weapon: summon abilities (shots, acid) hit harder
  'conduit.poison-stacks',  // Poison Staff: poison stacks per summon hit
  'conduit.plating-share',  // Shared Plating: extra plating the summons copy from you
  'conduit.herd-pct',  // Herd: faster out-of-combat rebuilds
  'conduit.rebuild-speed-pct',  // Deep Reserve: faster rebuilds (stand-in for two at once)
  'conduit.thorns',  // Bramble: flat damage a summon returns per hit taken
  'conduit.sapbark-ms',  // Sapbark: summons regenerate after this long unhit
  'conduit.poison-shift',  // Poison Shift: poison on you moves to a summon
  'conduit.bloodtithe-pct',  // Bloodtithe: share of the rebuild HP cost returned when a summon dies
  'conduit.intercept-pct',  // Big-Hit Intercept: a hit over this share of your HP goes to the nearest tank
  // Conduit T2 (T2-CONDUIT)
  'conduit.first-strike-pct',  // First Strike: a summon's first hit on a new target hits this much harder
  'conduit.longshot-pct',  // Longshot: ranged summons hit this much harder and fire from further back; melee summons hit this much softer
  'conduit.sentinel',  // Sentinel: the first hit each enemy lands on you is taken by the nearest summon
  'conduit.bloomlink-pct',  // Bloomlink: a support summon's heal also heals you for this share
  'conduit.sandveil-pct',  // Sandveil: ranged hits deal this much less to you and your summons
  'conduit.purge-ms',  // Purge: every this long, the most debuffed body loses one debuff
  // Conduit T3 (T3-CONDUIT)
  'conduit.icebound-pct',  // Icebound: summons hit this much harder against slowed, rooted or chilled enemies
  'conduit.berserk-pct',  // Berserk: a summon hits up to this much harder the more wounded it is
  'conduit.permafrost',  // Permafrost: tank summons cannot be slowed, rooted or frozen
  'conduit.hibernate-ms',  // Hibernate: a summon under a quarter of its HP encases itself in ice this long
  'conduit.fireproof-pct',  // Fireproof: damage over time on you and your summons is cut by this share
  'conduit.emberglow-pct',  // Emberglow: your Recovery also heals the summons near you at this share
  // Conduit T4 (T4-CONDUIT)
  'conduit.cleave-pct',  // Cleave: summon hits splash this share of their damage to the enemies around the target
  'conduit.exploit-pct',  // Exploit: summons hit this much harder for each different debuff on their target
  'conduit.grave-pact-ms',  // Grave Pact: a hit that would kill you kills a summon instead; this long between uses
  'conduit.requiem-pct',  // Requiem: when a summon dies, the others heal this share of its max HP
  'conduit.pressure-seal-ms',  // Pressure Seal: every this long, each body ignores the next debuff it would receive
  'conduit.tidewater-pct',  // Tidewater: your Recovery rises this much while you carry three or more debuffs
  'slinger.reload-walk-pct',  // Quickdraw: walk at this share of speed while reloading
  'slinger.elbow-room',  // Elbow Room: reload faster while three or more enemies are near
  'slinger.breathing-room',  // Breathing Room: Recovery rises with the distance to the nearest enemy
  'slinger.fleet',  // Fleet: Recovery share multiplied while you move
  'slinger.snake-oil',  // Snake Oil: Recovery share multiplied while you carry poison or bleed and no enemy is near
  'slinger.oilskin',  // Oilskin: share of damage over time on you shrugged off while reloading
  'slinger.dig-in',  // Dig In: while reloading, no single hit takes more than this share of your HP
  'slinger.hunker',  // Hunker: plating multiplied while reloading
  'slinger.regroup-speed-pct',  // Regroup: speed after a hit over a quarter of your HP
  'slinger.scatter-extra',  // Pepperbox: Scatter nicks this many more enemies
  'slinger.opener-pct',  // Carbine: the first rounds of a clip hit this much harder
  'slinger.poison-long-pct',  // Snakebite Pistol: your poison lasts this much longer
  'slinger.last-vs-poisoned-pct',  // Snakebite Pistol: the last round hits a poisoned target this much harder
  'slinger.last-round-pct',  // Hand Cannon: the last round hits this much harder
  'slinger.ramp-pct',  // Drum Gun: each round of a clip hits this much harder than the last
  // Slinger T2 gear (class-first build plan T2-SLINGER)
  'slinger.far-pct',  // Hunting Rifle: rounds hit this much harder at full reach, scaling with distance
  'slinger.damage-pct',  // Glass Duster: every round hits this much harder
  'slinger.reload-faster-pct',  // Glass Duster: reloads take this much less time
  'slinger.lookout',  // Lookout: an enemy that ambushes you while you reload is slowed this much and revealed
  'slinger.undergrowth',  // Undergrowth: Recovery share multiplied while no enemy is targeting you
  'slinger.shade',  // Shade: every this many ms a mark or slow on you ends
  // Slinger T3 gear (class-first build plan T3-SLINGER)
  'slinger.cold-pct',  // Frostlock Rifle: rounds hit chilled, slowed or rooted enemies this much harder
  'slinger.heat-pct',  // Firebrand Pistol: rounds hit this much harder per step of the fight's Heat
  'slinger.warm-hands',  // Warm Hands: the Chill on you does not build while you reload
  'slinger.thaw',  // Thaw: Recovery share multiplied while you are chilled or slowed
  'slinger.asbestos',  // Asbestos Coat: the Heat's extra damage does not apply to you while you reload
  'slinger.heatsink',  // Heatsink: Recovery rises by this share per step of Heat while no enemy is near you
  'spirit.area-extra',  // Forked Rod: area spends reach this many more enemies
  'spirit.cost-mult',  // Weapon: spends cost this much (1 = normal)
  'spirit.damage-mult',  // Weapon: spends hit this much (1 = normal)
  'spirit.single-pct',  // Lodestone Orb: single-target spends hit this much harder
  'spirit.area-pct',  // Lodestone Orb: area spends hit this much harder (negative: softer)
  'spirit.soak-pct',  // Drenching Staff: spends soak the target; spends on a soaked target hit this much harder
  'spirit.ooc-flow-pct',  // Still Air: the storm gathers this much faster out of combat
  'spirit.clear-sky-pct',  // Clear Sky: the storm gathers this much faster while no enemy touches you
  'spirit.static-skin',  // Static Skin: an enemy that strikes your storm is charged; your next spend on it hits this much harder
  'spirit.sealed-vessel',  // Sealed Vessel: damage over time drains the storm at this share of cost
  'spirit.petrichor-pct',  // Petrichor: a Downpour heals you this share of max HP
  'spirit.grounded',  // Grounded: no knockback while the storm is at or above your floor
  'spirit.afterstorm-x',  // Afterstorm: after a big hit the storm gathers this many times as fast for a few seconds
  'spirit.ironbound',  // Ironbound: plating multiplied while your storm is empty
  'spirit.capacitor',  // Capacitor: the flow wasted at a full storm heals you (this share)
  'spirit.first-free',  // Lurker's Rod: your first spend on each new target costs nothing
  'spirit.reach-x',  // Sirocco Staff: your spends reach this many times as far
  'spirit.stormsense',  // Stormsense: an ambush cannot drain the storm below your floor
  'spirit.monsoon-x',  // Monsoon: after an ambush hits you, the storm gathers this many times as fast for a few seconds
  'spirit.ranged-cost',  // Sandshroud: ranged hits drain the storm at this share of cost
  'spirit.oasis-pct',  // Oasis: while you are marked or slowed, the storm gathers this much faster
  // Spirit T3 gear (class-first build plan T3-SPIRIT)
  'spirit.shell-pct',  // Rime Staff: spends hit shelled targets (barrier, Ice Armor, shell-up) this much harder
  'spirit.empty-pct',  // Ember Rod: spends hit up to this much harder, the emptier the storm
  'spirit.chill-build',  // Insulated: the Chill builds this much slower while the storm is above the floor
  'spirit.chill-flow-pct',  // Aurora: while chilled, the storm gathers this much faster
  'spirit.fire-cost',  // Flash Steam: fire hits drain the storm at this share of cost
  'spirit.heat-flow-pct',  // Thermal: each step of the Heat makes the storm gather this much faster
  'apprentice.branching',  // Branching Wand: each hit also lays a sigil on the nearest other enemy
  'apprentice.tick-speed',  // Thornwood Rod: sigils tick this many times as fast, for the inverse as long
  'apprentice.linger',  // Bog Censer: sigils last this many times as long
  'apprentice.sigils-per-hit',  // Runestone Staff: sigils laid per hit (1 normally)
  'apprentice.cap-extra',  // Runestone Staff: more sigils every enemy can hold
  'apprentice.payoff-pct',  // Deep Grimoire: payoffs pay this much more
  'apprentice.tick-mult',  // Deep Grimoire: sigils tick this much (1 = normal)
  'apprentice.siphon-pct',  // Bog Censer / Bitter Tonic: Siphon heals this much more
  'apprentice.siphon-cd-pct',  // Bitter Tonic: Siphon comes back this much sooner
  'apprentice.warding',  // Warding Sigils: damage you take is reduced this much per enemy carrying your sigils
  'apprentice.feeding',  // Feeding Swarm: Recovery rises this much per enemy carrying your sigils
  'apprentice.give-ground',  // Give Ground: speed while an enemy carrying your sigils is in melee reach
  'apprentice.numbing-calm',  // Numbing Calm: Recovery multiplied while two or more enemies near you are numbed
  'apprentice.still-mind',  // Still Mind: Recovery multiplied after a Seize breaks a wind-up
  'apprentice.sigil-weight',  // Sigil Weight: a winding-up enemy's blow is weaker per sigil it carries (up to a third)
  'apprentice.long-draw',  // Long Draw: Recovery multiplied while an elite or boss carries a full bar of your sigils
  // Apprentice T2 (bible §9.16): the Jungle and Desert jobs.
  'apprentice.flee-tick',  // Stalker's Rod: sigils on a fleeing or kiting enemy tick this many times as fast
  'apprentice.far-linger',  // Dune Staff: sigils last this much longer on far enemies
  'apprentice.second-skin',  // Second Skin: the first hit each ambusher lands on you is this much weaker
  'apprentice.patient-hunter',  // Patient Hunter: Recovery multiplied while every enemy within your reach carries your sigils
  'apprentice.sun-ward',  // Sun-Ward: marks and slows on you are this much shorter per enemy carrying your sigils (capped)
  'apprentice.cool-draught',  // Cool Draught: a mark or slow ending on you heals you this share of max HP
  'apprentice.chill-linger',  // Glacial Wand: sigils on a chilled or slowed enemy last this many times as long
  'apprentice.heat-tick',  // Magma Censer: sigils tick this much harder for each step of the Heat
  'apprentice.ice-veil',  // Ice Veil: when the Chill on you reaches its threshold, enemies carrying your sigils are numbed
  'apprentice.cold-comfort',  // Cold Comfort: Recovery multiplied while an enemy carrying your sigils is frozen or brittle
  'apprentice.ashguard',  // Ashguard: a burning hit on you lays a sigil on its shooter
  'apprentice.banked-coals',  // Banked Coals: Recovery rises this much per step of the Heat while three or more enemies carry your sigils
  'defense.recovery-hit-pct',         // Cairnstone: a hit over this share of max HP...
  'defense.recovery-hit-x',           // ...multiplies the Recovery share by this for a few seconds
  'squire.recovery-riposte-x',        // Counterbalance: after a Riposte, the Recovery share is multiplied by this
  'squire.recovery-caught-x',         // Stone Patience: after a caught telegraph, by this
  // Stuns, roots, knockdowns and slows on you are this much shorter (Unbroken).
  'defense.control-duration-cut-pct',
  // Every `interval-ms`, the poison or bleed on you with the most time left ends (Antidote).
  'defense.dot-cleanse-interval-ms',
] as const;

/**
 * The Striker's weapon jobs and armor/charm lines (class-first build plan CS.4, bible §12.4).
 * Read by the Order runtime (`classes/archetypes/cadence/`). Numbers are placeholders.
 */
export const STRIKER_KEYS = [
  // Weapons
  'striker.nick-pct',              // Broadblade: every beat also nicks the nearest other enemy
  'striker.extra-strike-pct',      // Twin Fangs: each hit strikes once more, lightly
  'striker.dot-duration-pct',      // Hooked Sickle: your bleeds and rot last longer
  'striker.finisher-vs-dot-pct',   // Hooked Sickle: the finisher hits a bleeding or rotting target harder
  'striker.finisher-pct',          // Maul: a much bigger finisher
  'striker.windup-speed-pct',      // Maul: wind-ups (Coil, Skyfall) are shorter
  'striker.technique-damage-pct',  // Bastard Sword: damage techniques and the finisher hit harder
  'striker.setup-duration-cut-pct', // Bastard Sword: setups wear off sooner
  // Armor lines
  'striker.plating-per-enemy',     // Shoulder Through: plating per extra enemy on you
  'striker.dot-floor-pct',         // Bloodless: while attacking, DoTs can't take you below this share
  'striker.cast-unbreakable',      // Braced Cast: nothing interrupts your casts
  'striker.cast-cap-cut-pct',      // Braced Cast: the damage cap is lower while you cast
  'striker.bulk-pct',              // Weighty: more max HP
  'striker.beat-slow-pct',         // Weighty: slower beats
  // Charm lines
  'striker.grit-pct',              // Grit: this share of every hit heals back while you keep attacking
  'striker.grit-ms',               // Grit: over this long
  // ── Tier 2 jobs and lines (§12.16) ──
  'striker.first-strike-pct',      // Hunter's Blade: your first beat on a new target hits this much harder
  'striker.execute-pct',           // Executioner's Blade: damage techniques and the finisher hit harder below half HP
  'striker.ambush-proof',          // Watchful: an ambush can't interrupt a cast or break your resource
  'striker.closing-recovery-x',    // Chase: Recovery is multiplied by this while you close on a target
  'striker.close-in-speed-pct',    // Close In: while a ranged enemy hits you, you move this much faster toward it
  'striker.shake-off-interval-ms', // Shake Off: every interval, a mark or slow on you ends
  // ── Tier 3 jobs and lines (§12.16) ──
  'striker.cold-pct',              // Rimeblade: beats hit this much harder against slowed, rooted or chilled enemies
  'striker.low-hp-pct',            // Bloodfire Axe: beats hit up to this much harder as your HP runs out
  'striker.chill-build-cut-pct',   // Winter Coat: the Chill builds this much slower while you keep attacking
  'striker.chilled-recovery-x',    // Frostbite Mend: Recovery is multiplied by this while you are chilled or slowed
  'striker.heat-ward',             // Cinderskin: the Heat's extra damage taken is off while you keep attacking
  'striker.heat-recovery-pct',     // Fuel: Recovery rises this much per stack of Heat
] as const;

/**
 * The Squire's weapon jobs and lines (class-first build plan CQ.4, bible §8.4), read by its
 * runtime (`classes/archetypes/cooldown/squire.ts`). Numbers are placeholders.
 */
export const SQUIRE_KEYS = [
  'squire.slam-damage-pct',          // Warhammer: a bigger slam
  'squire.slam-radius-pct',          // Flanged Mace: the slam's circle is wider
  'squire.counter-damage-pct',       // Arming Sword: counters hit harder
  'squire.bash-stun-pct',            // Tower Shield: Shield Bash stuns longer
  'squire.bash-cost-cut-pct',        // Tower Shield: Shield Bash costs less
  'squire.steel-will-cost-cut-pct',  // Iron Gut: Steel Will costs less
  'squire.slam-bleed-pct',           // Spiked Flail: the slam leaves a bleed (this share of it)
  'squire.slam-after-guard-pct',     // Warhammer: a slam soon after a caught telegraph hits harder
  'squire.slam-after-guard-ms',      // Warhammer: how soon
  'squire.shove-weaken-pct',         // Rampart: enemies you shoved deal less damage
  'squire.shove-weaken-ms',          // Rampart: for this long
  'squire.dodge-fills',              // Turn Aside: a dodged hit fills Resolve as if it had landed
  'squire.guard-steadfast',          // Planted: while braced, no knockback or stun
  'squire.shred-regrow-ms',          // Reforged: one stack of corrosion on you comes off this often
  'squire.shred-fill-pips',          // Reforged: each stack stripped from you fills this much Resolve
  'squire.shove-heal-pct',           // Breather: a landed Shove heals this share of max HP per enemy
  'squire.cleanse-heal-pct',         // Purifying Breath: a shaken-off DoT heals this share of what it had left
  // T2 jobs (T2-SQUIRE)
  'squire.slam-hook-px',             // Hooked Glaive: the slam hooks fleeing enemies within this many px back into its ring
  'squire.throw-damage-pct',         // Throwing Shield: out of reach, your swing throws the shield for this share of a swing
  'squire.throw-range-px',           // Throwing Shield: how far the shield flies
  'squire.ambush-steadfast',         // Unflinching: an ambush can't stun or knock you down
  'squire.watchful-heal-pct',        // Watchman's Ease: an ambush Watchful catches heals this share of the hit it stopped
  'squire.ranged-fill-x',            // Arrow Catcher: ranged hits on you fill Resolve this many times over
  'squire.challenge-heal-pct',       // Called Out: each enemy a Challenge pulls heals this share of max HP
  // T3 jobs (T3-SQUIRE)
  'squire.slam-frost-px',            // Glacier Mace: the slam leaves frozen ground this many px wide
  'squire.slam-frost-slow-pct',      // Glacier Mace: enemies on it are slowed by this share
  'squire.slam-frost-ms',            // Glacier Mace: for this long
  'squire.slam-heat-pct',            // Forge Hammer: the slam is this much bigger per stack of Heat on you
  'squire.chill-fill-pips',          // Frozen Resolve: each stack of Chill gained fills this much Resolve
  'squire.frostward-heal-pct',       // Hearth: while Frostward holds, heals this share of max HP per second
  'squire.heat-fill-x',              // Stoked: the Heat's extra damage on a hit fills Resolve this many times over (on top)
  'squire.backdraft-heal-pct',       // Cooling Breath: each Backdraft that lands heals this share of max HP
] as const;

export const CADENCE_KEYS = [
  // The finisher's base threshold and multiplier (the Order sets the live threshold).
  // The frame-loop and T3 path keys were deleted with the frame loop and the paths
  // (class-first build plan CS7).
  'cadence.empowered-threshold',
  'cadence.empowered-mult',
  'cadence.threshold-mod',
  'cadence.damage-mult-add',
  // ── Range nodes (progression rework Phase 3, `rangeMechanics.ts`) ───────────
  // Lancer (mid): every hit on a target held AT BAY — inside the player's reach
  // and outside the target's own — applies a short movement slow.
  'cadence.range-mid-at-bay-slow-pct',
  'cadence.range-mid-at-bay-slow-ms',
  // Phantom-Blade (far): the first hit on a fresh body landed from the outer
  // `-max-reach-pct` band of the player's reach is an opening strike worth
  // `-opener-pct` more, folded into `empoweredMultiplier` (one multiplier per hit).
  'cadence.range-far-max-reach-pct',
  'cadence.range-far-opener-pct',
] as const;

export const COOLDOWN_KEYS = [
  // The slam's multiplier. `empowered-cd-ms` is the old clock's length: the relic
  // preview still reads it. The runtime slam fills on Resolve (class-first CQ7).
  // The frame-loop and T3 path keys were deleted with the paths.
  'cooldown.empowered-cd-ms',
  'cooldown.empowered-mult',
  // ── Range nodes (progression rework Phase 3, `rangeMechanics.ts`) ───────────
  // Phalanx (mid): the at-bay slow, plus a stagger when the EXECUTION lands on a
  // target held at bay (the stun ladder's shortest rung).
  'cooldown.range-mid-at-bay-slow-pct',
  'cooldown.range-mid-at-bay-slow-ms',
  'cooldown.range-mid-execution-stagger-ms',
  // Sentinel (far): an execution from the outer `-max-reach-pct` band of reach
  // opens a vulnerability window on the target. Shared `vulnerability` record,
  // max-wins (design §18.1).
  'cooldown.range-far-max-reach-pct',
  'cooldown.range-far-vuln-pct',
  'cooldown.range-far-vuln-ms',
] as const;

export const RELOAD_KEYS = [
  'reload.max-ammo',
  'reload.reload-time-ms',
  // The reload root's empowered multiplier (shared.empowered-mult-add /
  // weapon.empowered-mult-bonus apply on top). No path authors it since the T3
  // review retired the Duelist's exploding last bullet (design §22.5).
  'reload.empowered-mult',
  // The multiplier an Empowered `mechanic-proxy` lands at on this reload spec, read
  // by the proxy ONLY (the live empowered hit and the HUD/DPS readers keep reading
  // `reload.empowered-mult`). The Duelist authors 3.5 (design §22.12); every other
  // reload spec takes the proxy's fallback.
  'reload.mechanic-proxy-mult',
  // The root still grants this (and skillTreeMechanicCopy pins the ×2.5 sentence).
  'reload.acquire-radius-mult',
] as const;

// Retained readers outside the energy runtime: ranged-combatant classification and
// the shared range listener. No current skill-tree node authors these legacy keys.
export const ENERGY_KEYS = [
  'energy.flash',
  'energy.range-mid-discharge-stagger-ms',
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
  // Incoming HARMFUL status resistance. Both are fractions REMOVED (0.5 = half),
  // capped below 1 so a status is always shortened/softened, never nullified.
  // `-duration-resist` scales the duration an incoming debuff/CC is applied with;
  // `-potency-resist` scales an incoming DoT's per-stack damage. Read through
  // `server/src/systems/combat/status/harmfulStatus.ts`, which is the ONE writer —
  // it folds these together with mobility tenacity so sources cannot ratchet.
  'shared.status-duration-resist',
  'shared.status-potency-resist',
  // Damage multiplier applied on the very first hit ever landed on a fresh monster entity.
  'weapon.first-strike-mult',
  // Alpha window (Desert Falchion): the same opener also grants the wielder
  // `Sunlight`, a final damage-dealt window. -pct is the fraction added
  // (0.15 = +15%), -ms its duration. The window NEVER refreshes or extends while
  // it is already running, so opening on a fresh target mid-window still pays that
  // target its opener multiplier but does not reset the clock. See
  // shared/src/systems/alphaWindow.ts.
  'weapon.first-strike-buff-damage-pct',
  'weapon.first-strike-buff-duration-ms',
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
  // Mountain — continuous gap closing: extra speed while moving TOWARD the
  // current combat target and still further away than APPROACH_MIN_DISTANCE.
  // No proc, no cooldown, no benefit while retreating or already in contact —
  // the mirror image of Desert's `kite-speed-pct`.
  'mobility.approach-speed-pct',
  // Cave — stealth: reduces enemies' effective detection radius vs the player.
  'mobility.stealth-pct',
  // Swamp — slow resistance: reduces the MAGNITUDE of soft movement slows (a
  // 50% slow at 30% resistance becomes a 35% slow). Deliberately distinct from
  // `tenacity-pct`, which shortens hard-CC DURATION: a root is control, not a
  // slow, and slow resistance never touches it. See T1_ITEM_DESIGN_PHILOSOPHY §24.
  'mobility.slow-resistance',
  // Graveyard/Trench — tenacity: reduces incoming slow/CC DURATION.
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
  // KATA (Desert technique staff, T4): each strike Technique fired adds a stack
  // (up to kata-stacks); a strike Technique fired AT full stacks spends them and
  // resolves with +kata-power-pct Technique Power. Instant self-buffs (Frenzy)
  // neither build nor spend it. See server/src/systems/player/abilities/abilityKata.ts.
  'technique.kata-power-pct',
  'technique.kata-stacks',
] as const;

export const GUARD_KEYS = [
  // Shorten the Guard ability's cooldown by this fraction (fire it more often).
  'guard.cooldown-reduction-pct',
  // Applies to Cleanse-tagged abilities, additive with family CDR under its cap.
  'cleanse.cooldown-reduction-pct',
  // Scale the Guard effect magnitude (e.g. damage-reduction drPct) by (1 + X).
  'guard.potency-pct',
  // Extend the Guard buff duration by (1 + X).
  'guard.duration-pct',
  // When the Guard fires, activate X% of Recovery for `on-fire-ms` (default
  // GAME_CONFIG.RECOVERY_ON_GUARD_MS). Recovery access, not a flat maxHp heal.
  'guard.recovery-on-fire-pct',
  'guard.recovery-on-fire-ms',
  // ── Charm Guard hooks (2026-09-26). Guards only: Techniques never trigger them.
  // Mountain: a Mitigation Guard firing restores this fraction of barrier max.
  'guard.barrier-refill-pct',
  // Tundra: a Control Guard (Break Free) firing restores this fraction of barrier max.
  'guard.barrier-refill-on-control-pct',
  // Swamp/Graveyard: a Cleanse Guard firing starts the Recovery pulse now and
  // restarts its interval (1 = on).
  'guard.cleanse-pulse',
  // Jungle: any Guard firing advances the ramping-Recovery timer by this many ms.
  'guard.recovery-ramp-advance-ms',
  // Trench: shorter Recovery-skill cooldowns (Second Wind, Recuperate), additive
  // with family CDR under its cap.
  'recovery.cooldown-reduction-pct',
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
export type SharedPassiveKey   = typeof SHARED_KEYS[number];
export type SummonerPassiveKey = typeof SUMMONER_KEYS[number];
export type MobilityPassiveKey = typeof MOBILITY_KEYS[number];
export type TechniquePassiveKey = typeof TECHNIQUE_KEYS[number];
export type GuardPassiveKey    = typeof GUARD_KEYS[number];
export type RelicPassiveKey    = typeof RELIC_KEYS[number];
export type StrikerPassiveKey  = typeof STRIKER_KEYS[number];
export type SquirePassiveKey   = typeof SQUIRE_KEYS[number];

export type PassiveKey =
  | DefensePassiveKey | CadencePassiveKey | CooldownPassiveKey
  | ReloadPassiveKey  | EnergyPassiveKey
  | SharedPassiveKey  | SummonerPassiveKey | MobilityPassiveKey
  | GuardPassiveKey   | TechniquePassiveKey
  | RelicPassiveKey   | StrikerPassiveKey | SquirePassiveKey;

export type PassiveMap      = Partial<Record<PassiveKey, number>>;
export type MechanicEffects = Partial<Record<PassiveKey, number>>;

/** Flat array of every passive key — useful for client iteration / debug panels. */
export const ALL_PASSIVE_KEYS = [
  ...DEFENSE_KEYS, ...CADENCE_KEYS, ...COOLDOWN_KEYS,
  ...RELOAD_KEYS, ...ENERGY_KEYS, ...SHARED_KEYS, ...SUMMONER_KEYS,
  ...MOBILITY_KEYS, ...GUARD_KEYS, ...TECHNIQUE_KEYS,
  ...RELIC_KEYS, ...STRIKER_KEYS, ...SQUIRE_KEYS,
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

// The Recovery pulse is a paired mechanic: every `interval-ms`, activate
// `pulse-pct` of Recovery for `duration-ms`. Naively summing the interval is
// wrong — adding intervals makes stacked sources proc *less* often (a nerf).
// Instead these keys are resolved through a PulseAccumulator (see below) so
// stacked sources keep the highest frequency and combine their Recovery
// throughput. They are excluded from the generic additive/multiplicative merge
// whenever an accumulator is supplied.
const PULSE_PCT_KEY: PassiveKey      = 'defense.recovery-pulse-pct';
const PULSE_INTERVAL_KEY: PassiveKey = 'defense.recovery-pulse-interval-ms';
const PULSE_DURATION_KEY: PassiveKey = 'defense.recovery-pulse-duration-ms';

export function mergePassives(
  target: PassiveMap,
  source: MechanicEffects | undefined,
  pulseAcc?: PulseAccumulator,
): void {
  if (!source) return;
  for (const [key, val] of Object.entries(source) as [PassiveKey, number][]) {
    // When an accumulator is threaded through, the pulse triple is resolved
    // separately (frequency-weighted) and must not be summed here.
    if (
      pulseAcc &&
      (key === PULSE_PCT_KEY || key === PULSE_INTERVAL_KEY || key === PULSE_DURATION_KEY)
    ) continue;
    if (MULTIPLICATIVE_PASSIVES.has(key)) {
      target[key] = (target[key] ?? 1) * val;
    } else {
      target[key] = (target[key] ?? 0) + val;
    }
  }
  if (pulseAcc) accruePulse(pulseAcc, source);
}

/**
 * Order-independent accumulator for the Recovery-pulse triple. Combining
 * stacked sources by raw summation would slow the proc cadence; instead we
 * preserve total Recovery throughput at the highest available frequency:
 *
 *   final interval = min interval across full (pct + interval) sources
 *   final duration = min duration across full sources (shortest active window)
 *   final pct      = throughput × final interval / final duration + flat pct
 *
 * where `throughput = Σ (pct_i × duration_i) / interval_i` over full sources —
 * i.e. the average Recovery fraction each source contributes across its whole
 * cycle — and `flatPct` is the sum of pct-only sources, which carry no cadence
 * of their own and simply boost whatever pulse is active.
 *
 * Note the units: unlike the old %-maxHp burst, `pct` here is a fraction of the
 * player's Recovery RATE, so duration is load-bearing and has to ride along.
 */
export interface PulseAccumulator {
  throughput: number;   // Σ (pct_i × duration_i) / interval_i  over full sources
  minInterval: number;  // highest frequency = smallest interval among full sources
  minDuration: number;  // shortest active window among full sources
  flatPct: number;      // Σ pct  over pct-only sources (no cadence of their own)
}

export function makePulseAccumulator(): PulseAccumulator {
  return { throughput: 0, minInterval: Infinity, minDuration: Infinity, flatPct: 0 };
}

function accruePulse(acc: PulseAccumulator, source: MechanicEffects): void {
  const pct      = source[PULSE_PCT_KEY] ?? 0;
  const interval = source[PULSE_INTERVAL_KEY] ?? 0;
  if (pct > 0 && interval > 0) {
    // A source may omit duration and inherit the engine default; resolve it here
    // so throughput is computed against the window the pulse will actually run.
    const duration = source[PULSE_DURATION_KEY] ?? GAME_CONFIG.RECOVERY_PULSE_MS;
    acc.throughput  += (pct * duration) / interval;
    acc.minInterval  = Math.min(acc.minInterval, interval);
    acc.minDuration  = Math.min(acc.minDuration, duration);
  } else if (pct > 0) {
    // pct-only source: no cadence, just adds magnitude at the active interval.
    acc.flatPct += pct;
  }
  // interval/duration-only (pct <= 0) is inert: the mechanic needs a pct to fire.
}

/** Write the resolved pulse pct/interval/duration back onto the passive map. */
export function finalizePulse(acc: PulseAccumulator, target: PassiveMap): void {
  if (acc.minInterval !== Infinity) {
    target[PULSE_INTERVAL_KEY] = acc.minInterval;
    target[PULSE_DURATION_KEY] = acc.minDuration;
    target[PULSE_PCT_KEY]      =
      (acc.throughput * acc.minInterval) / acc.minDuration + acc.flatPct;
  } else if (acc.flatPct > 0) {
    // pct sources but no cadence source: store pct; interval stays 0 so the
    // mechanic remains inactive (the pulse requires interval > 0).
    target[PULSE_PCT_KEY] = acc.flatPct;
  }
}
