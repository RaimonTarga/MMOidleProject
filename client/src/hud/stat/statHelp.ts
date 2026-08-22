// Central explanatory copy for every stat, passive and mechanic the player can
// read. Keyed by a stable id (core stats use short keys; passives use their
// passive id). Kept in one place so the wording — especially the load-bearing
// math nuances — stays consistent and is easy to edit.
//
// Consumed by the Character panel's stat rows AND by `ui/describe`, which drives
// skill-node detail, loadout slots and recipe details. A passive key with no
// entry here still shows its number, derived from the key's grammar; adding an
// entry upgrades that row from "labelled number" to "explained number", so this
// table is worth growing whenever a mechanic proves confusing in playtest.

export const STAT_HELP: Record<string, string> = {
  // ── Core ──────────────────────────────────────────────────────────────────
  hp: 'Your health. At 0 you die and respawn at the clearing, leaving a corpse at the death site. Bar layers: blue strip above = barrier (on its own scale); red = HP that pending damage (damage-over-time + deferred debt) will remove; dark green = healing queued from regen/absorb.',
  attack:
    'Base damage per hit before the target’s defenses. Final hit = (Attack − their Plating) × (1 − their Damage Reduction), floored at 1.',
  onHitDamage:
    'Flat bonus damage added to every hit AFTER the target’s defenses — it ignores Plating and Damage Reduction entirely, so each hit deals at least this much. Comes from certain weapons and passives (e.g. Shockblade).',
  dps:
    'Estimated damage per second, worked out from your class mechanic — a Striker’s finisher, a Slinger’s reload downtime, a DoT build’s converted stacks, a Summoner’s minions. A planning number, not a measurement: it is before enemy plating and damage reduction, and it cannot see positioning, procs, abilities, or the spec behaviours that only exist mid-fight. Hover the figure in the character panel for its full working.',
  atkSpeed:
    'How often you attack, shown as attacks-per-second and the cooldown between swings. Attack-speed bonuses add up, then set cooldown = base ÷ (1 + total).',
  plating:
    'Flat damage removed from every incoming hit, subtracted BEFORE damage reduction. Best against many small hits, weak against a few big ones. Does not reduce damage-over-time at all.',
  damageReduction:
    'Percentage of damage removed, applied AFTER plating. Full value against direct hits, but only HALF value against damage-over-time (which also ignores plating entirely).',
  attackRange:
    'How far you can attack from. Sets melee vs ranged positioning and where auto-combat stops approaching.',
  speed: 'Movement speed (pixels/second). Affects chasing, kiting, and escaping.',
  classAffinity:
    'A class affinity: a percentage of the stat you already have, rather than a flat number. Every affinity your class tree grants for a stat is added together, then applied once to your gear-built total — root +30%, frame +22% and range +10% Max HP is +62%, not three separate multiplications. Because it scales with your equipment, your class keeps the same shape at every tier instead of being drowned out by better gear.',
  hpRegen:
    'Health restored per second. Only applies out of combat unless you have an in-combat regen passive.',

  // ── Evasion ───────────────────────────────────────────────────────────────
  dodgeRate:
    'Chance to dodge a hit. Deterministic, not random — sources combine so 20% reliably fires every 5th hit.',
  evadeMitigation:
    'How much of a hit a dodge removes. A dodge isn’t always a full block — by default it avoids half the damage unless boosted.',

  // ── Defense passives ────────────────────────────────────────────────────────
  'defense.in-combat-regen-pct':
    'Fraction of your HP regen that keeps working while in combat (normally regen pauses in combat).',
  'defense.regen-burst-pct': 'Heals a burst of max HP on a fixed timer while fighting.',
  'defense.barrier-pct':
    'A permanent pool worth this % of max HP that absorbs damage before your health does. It never expires: once you have gone 4 seconds without taking damage (hits and damage-over-time both count), it refills at 25% of its size per second. In a sustained fight it will not recharge — it is the buffer you open each engagement with.',
  'defense.absorb-pct':
    'Diverts part of incoming damage into a pool that heals back over time. You still take the hit, then recover some of it gradually.',
  'defense.dot-resistance':
    'Reduces damage-over-time specifically, stacking on top of the half-value DR that already applies to DoT. Capped at 90%.',
  'defense.hit-to-dot-pct':
    'Defers part of each incoming hit into a “damage debt” that ticks onto you over time instead of all at once (drains 25% of the pool per second). Softens burst — it doesn’t remove the damage.',
  'defense.debuff-resistance': 'Shortens and weakens non-DoT debuffs such as slows and roots.',
  'defense.cleanse-stacks': 'Periodically strips debuff stacks off you on a timer.',
  'defense.max-hit-pct':
    'Caps a single hit relative to your max HP, shaving the excess off very large hits.',
  'defense.kill-burst':
    'A kill restores this share of your max HP, spread over the next few seconds.',
  'defense.evade-mitigation':
    'Added to how much damage an evade avoids, on top of the base. An evade is not automatically a full block — this is what pushes it toward one.',
  'reload.acquire-radius':
    'Multiplies how far you look for a target before committing to one.',

  // ── Mobility passives ────────────────────────────────────────────────────────
  'mobility.ooc-speed-pct': 'Extra move speed while out of combat — faster travel between fights.',
  'mobility.kill-speed-pct': 'A burst of move speed for a short time after each kill.',
  'mobility.acquire-speed-pct':
    'A move-speed burst when you lock onto a new target, on its own cooldown.',
  'mobility.kite-speed-pct':
    'Extra move speed while retreating from your current target — for kiting.',
  'mobility.ramp-speed-pct': 'Move speed that builds the longer you keep moving.',
  'mobility.passive-speed-pct': 'A flat move-speed bonus, briefly lost after taking a direct hit.',
  'mobility.kill-stack-speed-pct':
    'Stacking move speed and faster slow/root recovery on kills, up to a few stacks.',
  'mobility.stealth-pct': 'Enemies notice you from closer — easier to slip past.',
  'mobility.aggro-pull-pct': 'Enemies notice you from farther — pulls more onto you.',
  'mobility.tenacity-pct': 'Slows and roots wear off faster.',

  // ── Shared / weapon mechanics ───────────────────────────────────────────────
  'shared.damage-mult':
    'Multiplies your final damage AFTER the target’s plating and damage reduction, so it is never eaten by armor.',
  'shared.empowered-mult-add':
    'Added directly to your empowered attack’s multiplier (finisher / execution / discharge). Additive: +0.25 turns ×2.0 into ×2.25.',
  'shared.applies-through-evade':
    'Your debuffs and damage-over-time still land on a hit the target evaded. Normally an evaded hit applies nothing.',
  'weapon.empowered-mult-bonus':
    'Multiplies the WHOLE empowered multiplier, so every spec gains the same percentage rather than a flat amount.',
  'weapon.first-strike-mult':
    'The very first hit ever landed on a fresh enemy deals this multiple. Rewards opening on new targets rather than finishing wounded ones.',
  'weapon.dead-swing-interval':
    'Every Nth swing deals no damage at all — but still fires every on-hit effect. Chaotic weapons trade raw damage for proc density.',
  'weapon.execute-threshold-pct':
    'Enemies at or below this share of their health take execute damage from you.',
  'weapon.execute-dmg-mult': 'Damage multiplier applied to enemies under the execute threshold.',
  'weapon.brittle-plating': 'Each hit strips this much flat plating from the target, stacking.',
  'weapon.brittle-dr': 'Each hit strips this much of the target’s damage reduction, stacking.',
  'weapon.flurry-pct': 'Attack speed gained per stack of Flurry as you keep attacking.',

  // ── Cadence (build hits, then land a finisher) ──────────────────────────────
  'cadence.empowered-threshold':
    'How many regular attacks you must land before your finisher arms. Lower means finishers come around faster.',
  'cadence.threshold-mod':
    'Changes the number of hits needed to arm your finisher. Negative is faster — it subtracts from the threshold.',
  'cadence.empowered-mult': 'The damage multiplier your armed finisher hits for.',
  'cadence.damage-mult-add': 'Added to the finisher’s multiplier on top of its base value.',
  'cadence.trigger-count': 'How many finisher hits fire once the cadence completes.',
  'cadence.extra-trigger-damage-mult': 'Damage multiplier for each finisher hit after the first.',
  'cadence.speed-stack': 'Attack speed gained per buildup hit, resetting when the finisher fires.',
  'cadence.debuff-vuln-pct': 'The finisher leaves the target taking this much extra damage.',
  'cadence.debuff-plating-shred': 'The finisher strips this much flat plating from the target.',
  'cadence.debuff-shred-cap': 'Hard ceiling on total plating this effect can strip from one target.',
  'cadence.momentum-buildup': 'Buildup attacks feed the finisher rather than only counting toward it.',
  'cadence.momentum-echo': 'After a finisher, following attacks echo part of its damage.',
  'cadence.detonation': 'The finisher detonates on the target instead of landing as a single blow.',
  'cadence.hemorrhage': 'The finisher opens a bleed that ticks its damage out over time.',
  'cadence.crescendo': 'Time spent in one continuous fight ramps your finisher multiplier; it resets out of combat.',
  'cadence.rampage': 'Each finisher stacks a berserk state: faster and harder-hitting finishers, weaker regular attacks.',
  'cadence.metronome': 'Every buildup attack adds flat damage to the attacks and finisher that follow it.',
  'cadence.aftershock': 'For a few attacks after a finisher, your on-hit effects fire twice.',

  // ── Cooldown (bank a timer, spend it as an execution) ───────────────────────
  'cooldown.empowered-cd-ms': 'How long your execution takes to come back up.',
  'cooldown.empowered-mult': 'The damage multiplier your execution hits for.',
  'cooldown.acceleration-ms': 'Shortens the execution cooldown, so executions come around sooner.',
  'cooldown.overdrive': 'Firing an execution drops you into overdrive: a burst of attack speed.',
  'cooldown.eternal-cycle': 'Time spent without executing banks charge that adds to the next one.',
  'cooldown.temporal-extension': 'Executions extend your active buffs rather than only dealing damage.',
  'cooldown.battery': 'Waiting between executions charges a battery that adds damage per stack.',
  'cooldown.channeled-beam': 'The execution becomes a channelled beam that ticks damage over its duration.',
  'cooldown.channeled-beam-mult': 'Damage per beam tick, as a multiple of your attack.',
  'cooldown.rupture': 'Executions bypass the target’s plating, and briefly weaken it against your regular attacks too.',
  'cooldown.reverb': 'Regular attacks landed between executions charge the next execution.',
  'cooldown.patience-paid': 'An uninterrupted cooldown ramps both your attack and your execution damage.',
  'cooldown.vengeance': 'Damage taken since your last execution is paid back into the next one.',

  // ── Reload (magazine and heat management) ──────────────────────────────────
  'reload.max-ammo': 'Shots in your magazine before you must reload.',
  'reload.reload-time-ms': 'How long a reload takes. You do not attack while reloading.',
  'reload.reload-time-mult': 'Multiplies your reload time — below 1 is faster.',
  'reload.empowered-mult': 'The last bullet in the magazine fires as an empowered shot at this multiplier.',
  'reload.laser': 'Continuous fire instead of discrete shots, managed by heat rather than ammo.',
  'reload.snipe': 'A fixed, slow firing cadence that ignores weapon attack speed — attack speed becomes damage instead.',
  'reload.snipe-fullhp-mult': 'Damage multiplier against targets still at (or near) full health.',
  'reload.gatling': 'Sustained fire that spins up the longer you keep shooting.',
  'reload.exploding-clip': 'Emptying the magazine detonates the last shot in an area.',
  'reload.hair-trigger': 'Each shot in a magazine fires faster than the last.',
  'reload.blunderbuss': 'Each volley fires multiple pellets in a spread, knocking targets back — and you with them.',
  'reload.death-mark': 'Shots stack a mark on the target that detonates for bonus damage.',
  'reload.suppressing-fire': 'Sustained fire shreds the target’s defenses as it stacks.',
  'reload.cover-fire': 'Firing grants you damage reduction while you keep it up.',
  'reload.alternating-cadence': 'Shots alternate: even shots hit for attack damage, odd shots for on-hit damage.',
  'reload.momentum': 'Each reload stacks attack speed and shortens the next reload. Stacks decay out of combat.',
  'reload.cannon': 'Every shot banks damage into a pool; reloading charges, then fires the whole pool as one burst.',

  // ── Energy (charge on hits, spend on a discharge) ───────────────────────────
  'energy.per-hit': 'Energy gained per landed hit.',
  'energy.empowered-mult': 'The damage multiplier your discharge hits for at full energy.',
  'energy.max-bonus': 'Raises your maximum energy, so each discharge holds more.',
  'energy.flash': 'Full energy flashes into a temporary shift: bonus damage, speed or evasion that decays.',
  'energy.micro-venting': 'Bleeds energy off continuously instead of holding it to a full discharge.',
  'energy.polarity-decay': 'Held energy decays over time, rewarding spending it promptly.',
  'energy.alternating-currents': 'Charge and discharge alternate, each state changing how you fight.',
  'energy.harmonic-equilibrium': 'Sitting near a balanced energy level is itself a bonus.',
  'energy.capacitor-shunt': 'Excess energy is shunted rather than wasted when you overflow.',
  'energy.singularity-execute': 'A full-energy discharge executes weakened targets outright.',
  'energy.cascading-induction': 'Discharges chain, each one feeding the next.',
  'energy.superconducting-mass': 'Energy is stored more efficiently the more of it you are holding.',
  'energy.overdrive': 'Discharging drops you into an attack-damage mode that decays from full to nothing.',
  'energy.upkeep': 'You never discharge; instead your on-hit damage scales with how long you have held the charge.',
  'energy.binary-cycle': 'You alternate between a charging state and a discharging state, each with its own bonuses.',
  'energy.awakened-lightning': 'A discharge empowers your next several attacks instead of one big hit.',
  'energy.charge-state': 'Your attack damage scales continuously with how full your energy is.',
  'energy.critical-mass': 'Consecutive discharges stack, each stronger than the last.',
  'energy.endless-storm': 'Discharging leaves a persistent storm on the target that keeps ticking.',

  // ── Damage over time ───────────────────────────────────────────────────────
  'dot.max-stacks': 'How many stacks of your damage-over-time a single target can carry.',
  'dot.conversion-pct':
    'The share of each direct hit converted into damage over time instead of landing immediately. Damage per stack is derived from your attack, this percentage, and your max stacks.',
  'dot.mechanic-mult': 'Overall multiplier on your damage-over-time output.',
  'dot.tick-interval-ms': 'How often your damage-over-time deals a tick.',
  'dot.duration-ms': 'How long your damage-over-time lasts before falling off.',
  'dot.chill-max-stacks': 'How many stacks of Chill a target can hold. Each stack slows its movement and attacks.',
  'dot.chill-move-slow-per-stack': 'Movement speed removed from the target per stack of Chill.',
  'dot.chill-attack-slow-per-stack': 'Attack speed removed from the target per stack of Chill.',
  'dot.freeze-duration-ms': 'How long a fully-chilled target stays frozen.',
  'dot.freeze-damage-taken-pct': 'Extra damage a frozen target takes.',
  'dot.poison-explosion': 'A target at max stacks bursts, spreading its poison to nearby enemies.',
  'dot.eternal-doom': 'Stacks past the normal cap keep applying, with diminishing returns.',
  'dot.invigorating-toxins': 'Your poison feeds you as it ticks.',
  'dot.fan-the-flames': 'Hitting a burning target adds stacks faster and burns hotter.',
  'dot.smoldering-ember': 'Burns keep smoldering after the target would normally shake them off.',
  'dot.conflagration': 'A fully-burning target erupts, dealing a burst of its remaining burn at once.',
  'dot.permafrost': 'Chill no longer decays on its own — it has to be broken.',
  'dot.freezing-cold': 'Chill reaches freeze faster and holds the target longer.',
  'dot.glacial-fracture': 'Frozen targets shatter for bonus damage when the freeze breaks.',
  'dot.frenzy': 'While a target is at max stacks you gain attack speed and on-hit damage.',
  'dot.ignition': 'A fresh target takes your full stack count immediately instead of building up.',
  'dot.rimeshatter': 'At max stacks the target takes the whole remaining burn as direct damage and loses damage reduction.',
  'dot.wind-spirit': 'Hits at max stacks leave the target more vulnerable to further damage over time.',

  // ── Summoner ───────────────────────────────────────────────────────────────
  // Keyed on the feature stem as well as the authored key, so a node that tunes
  // `-mult` and a node that tunes `-pct` both find the same explanation.
  'summoner.minion-range': 'How far your minions can attack from.',
  'summoner.minion-size': 'Minion body size. Bigger minions are easier to hit and block more for you; smaller ones slip through crowds.',
  'summoner.minion-speed': 'How fast your minions move — how quickly the pack reaches the next fight.',
  'summoner.minion-damage': 'Each minion’s damage, as a share of your own attack.',
  'summoner.minion-hp': 'Each minion’s health, as a share of your own max HP.',
  'summoner.minion-attack-cooldown': 'Time between each minion’s attacks. Lower is faster.',
  'summoner.minion-count': 'How many minions you keep alive at once.',
  'summoner.minion-damage-pct': 'Each minion’s damage, as a share of your own attack.',
  'summoner.minion-hp-pct': 'Each minion’s health, as a share of your own max HP.',
  'summoner.minion-respawn-ms': 'How long a dead minion takes to return.',
  'summoner.damage-sponge-pct': 'Share of damage aimed at you that your minions absorb instead.',
  'summoner.leash-mult': 'How far minions will roam from you before returning.',

  // ── Technique / Guard (ability scaling) ────────────────────────────────────
  'technique.power-pct':
    'Scales the explicit offensive payload of your Techniques — splash, empower and cast damage. Never touches dash distance, stun length or slow percentages.',
  'technique.cooldown-reduction-pct': 'Shortens your Technique’s cooldown. Capped at 90%.',
  'technique.cast-speed-pct':
    'Shortens a casted Technique’s wind-up. Capped at 60% — the telegraph is the cost that makes casting a fair trade.',
  'guard.cooldown-reduction-pct': 'Shortens your Guard’s cooldown, so it fires more often. Capped at 90%.',
  'guard.potency-pct': 'Scales your Guard’s magnitude, e.g. the damage reduction its buff grants.',
  'guard.duration-pct': 'Extends how long your Guard’s buff lasts.',
  'guard.heal-on-fire-pct': 'Firing your Guard also heals this share of your max HP, over time.',

  // ── Core amplifiers ────────────────────────────────────────────────────────
  'core.attack-mult': 'Percentage multiplier on your final attack, applied after everything else adds up.',
  'core.maxhp-mult': 'Percentage multiplier on your final max HP.',
  'core.plating-mult': 'Percentage multiplier on your final plating.',
  'core.speed-mult': 'Percentage multiplier on your final move speed.',
  'core.attack-speed-mult': 'Percentage multiplier on your final attack speed.',
  'core.recovery-mult':
    'Percentage multiplier on ALL of your recovery — passive HP regen plus every heal you receive, including regen bursts and healing from abilities.',
  'core.dr-layer-pct':
    'A SEPARATE multiplicative damage-reduction layer, applied after your normal DR rather than added to it. Capped at 90%.',
  'core.elite-damage-mult': 'Extra damage against elite monsters and bosses.',
  'core.onhit-mult':
    'Percentage multiplier on your flat on-hit damage. On-hit ignores enemy plating and damage reduction, so this is separate from your attack.',
  'core.debuff-duration-mult': 'Debuffs you apply to enemies last longer.',
  'core.debuff-potency-mult': 'Debuffs you apply to enemies hit harder.',
  'core.mobility-cooldown-reduction-pct':
    'Shortens the cooldown of mobility abilities. Does nothing unless you have one equipped.',
  'core.mobility-refund-on-kill-pct':
    'Each kill returns part of your mobility ability’s cooldown. Does nothing unless you have one equipped.',

  // ── Rites (between-fight behavior) ─────────────────────────────────────────
  'rite.ooc-regen-delay-reduction-pct': 'Health regeneration resumes sooner after a fight ends.',
  'rite.ooc-cleanse-stacks': 'Debuff and damage-over-time stacks stripped from you on each pulse while out of combat.',
  'rite.ooc-buff-decay-slowdown-pct': 'Your buffs fade more slowly once a fight ends.',
  'rite.on-kill-haste-pct': 'Move speed granted by a fresh kill, to carry you to the next fight.',
};
