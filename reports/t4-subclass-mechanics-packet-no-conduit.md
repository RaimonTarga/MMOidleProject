# MMO Idle T4 Subclass Mechanics Packet (No Conduit)

Generated from `tools/dps-report.ts --t4-subclass-mechanics`. This packet is meant for external LLM balance review and omits the full HTML report.

## Scope And Assumptions

- Report tier: T4; class unlock tier: 3; weapons: T4 at +3.
- Row set uses the HTML report's compact T4 rule: only the mid/balanced range node is included for each frame/path, avoiding close/far duplicate rows.
- Target baseline: 22 mobs from biome tier 3; HP 573, plating 0.91, DR 5.27%.
- Single-target theoretical steady-state only. Movement, sustain, enemy attacks, death, pathing, aggro, party effects, eHP, and real AoE target count are omitted.
- Dangerous-assumption flags are generated from subclass text and report formula notes. Treat them as review prompts, not final verdicts.

## Known Missing Context

- AoE and splash value are not modeled; they are treated as single-target unless the formula explicitly says otherwise.
- Uptime is often steady-state or averaged, especially buffs, cooldown windows, max-stack mechanics, reservoirs, and heat/cool cycles.
- Incoming damage is not modeled, so vengeance-like or defensive feedback loops use floors or are effectively ignored.
- Overkill, execute timing, target swapping, enemy count, and encounter length are approximated or amortized.
- Stack caps and infinite-fight assumptions can overstate classes that need ramp time or understate classes that burst early.

## T4 Subclass Nodes / Mechanics / Report Formula

| Class | Frame | Subclass | Node | Intended identity | Stat effects | Mechanic effects | Report formula approximation | Danger flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Striker | balanced | Justicar | cadence-balanced-t3-c | Each finisher banks 30% of its damage into a Verdict — a stored pool of execution power that persists across targets. When a target's remaining health is at or below your Verdict, your finisher executes it instantly and... | - | cadence.detonation=1.00 | cycle average of normal hits plus empowered finisher over threshold | - |
| Striker | balanced | Maestro | cadence-balanced-t3-a | Each regular attack in the buildup adds flat attack damage to every subsequent attack in that cycle, including the finisher. Stacks reset after each finisher. | - | cadence.metronome=1.00, cadence.metronome-flat=12.0 | cycle average of normal hits plus empowered finisher over threshold; metronome flat cycle estimate | - |
| Striker | balanced | Wavecrest | cadence-balanced-t3-b | Each attack building toward the finisher amplifies it by 20%. After a finisher, your next 4 attacks deal 50% bonus damage. | - | cadence.momentum-buildup=0.20, cadence.momentum-echo=4.00 | cycle average of normal hits plus empowered finisher over threshold; wavecrest resonance/echo steady estimate | high uptime assumed, AoE treated as single-target, infinite/stack cap approximation |
| Striker | heavy | Berserker | cadence-heavy-t3-a | Each finisher grants a Rampage stack (up to 10): −1 combo threshold (floor 2), faster attacks, weaker regular hits, and a stronger finisher multiplier. At 10 stacks the next finisher overloads and resets Rampage to 0. S... | - | cadence.rampage=1.00 | cycle average of normal hits plus empowered finisher over threshold | - |
| Striker | heavy | Hemomancer | cadence-heavy-t3-b | Your finisher deals no direct damage — instead it converts into a bleeding wound (non-stacking) dealing 150% of the finisher damage over 4 seconds. Re-triggering refreshes the wound. | - | cadence.hemorrhage=1.00 | cycle average of normal hits plus empowered finisher over threshold; hemorrhage converts finishers to bleed | - |
| Striker | heavy | Juggernaut | cadence-heavy-t3-c | Time in active combat ramps a Crescendo bonus that multiplies your finisher. The first several seconds give most of the bonus; it keeps climbing forever at a diminished rate. Resets instantly when you leave combat. Does... | - | cadence.crescendo=1.00 | cycle average of normal hits plus empowered finisher over threshold | - |
| Striker | light | Scrapper | cadence-light-t3-b | Your finisher curses the target: +25% damage taken for 5 seconds, and permanently reduces their flat plating by 5 (capped at 20 total per target). The triggering finisher benefits from the vulnerability. | - | cadence.debuff-plating-shred=5.00, cadence.debuff-shred-cap=20.0, cadence.debuff-vuln-ms=5000, cadence.debuff-vuln-pct=25.0 | cycle average of normal hits plus empowered finisher over threshold; cursed finale vulnerability treated as steady-state | high uptime assumed, incoming damage not modeled, infinite/stack cap approximation |
| Striker | light | Shockblade | cadence-light-t3-a | After your finisher, your next 3 regular attacks fire their on-hit damage twice. Gain extra scaling on-hit damage. | - | cadence.aftershock=1.00, cadence.aftershock-onhit-per-tier=10.0 | cycle average of normal hits plus empowered finisher over threshold | - |
| Striker | light | Swiftblade | cadence-light-t3-c | Your finisher strikes twice. Both hits apply the full multiplier. Neither hit counts toward the next combo. | - | cadence.trigger-count=2.00 | cycle average of normal hits plus empowered finisher over threshold | - |
| Squire | balanced | Dynamo | cooldown-balanced-t3-b | Every second your execution cooldown ticks down, you gain a stack of accumulated power that increases attack damage. The execution spends all stacks. | - | cooldown.battery=1.00 | execution DPS = execution hit / cooldown; replacement paths override direct hit model; execute averaged over final 20% HP; dead swing every 4 hits | execute averaged |
| Squire | balanced | Reverb | cooldown-balanced-t3-a | The attacks you land during one cooldown window charge your NEXT execution: each attack adds bonus damage to the following execution (the current one fires normally). The charge resets each execution. | - | cooldown.reverb=1.00, cooldown.reverb-bonus-per-attack=0.04 | execution DPS = execution hit / cooldown; replacement paths override direct hit model; reverb next-window bonus estimated | high uptime assumed |
| Squire | balanced | Stalwart | cooldown-balanced-t3-c | The longer your execution cooldown runs uninterrupted, the more both your attack damage and the execution's bonus ramp — peaking at the full natural 7s. Triggering early yields a proportionally smaller payoff. | - | cooldown.patience-paid=1.00 | execution DPS = execution hit / cooldown; replacement paths override direct hit model; execute averaged over final 20% HP; dead swing every 4 hits | execute averaged |
| Squire | heavy | Avenger | cooldown-heavy-t3-a | Your execution deals bonus damage equal to a portion of all damage you have taken since your last execution (with a minimum floor so it never feels dead). The fixed 9s window makes the payoff predictable. | - | cooldown.vengeance=1.00, cooldown.vengeance-floor=30.0, cooldown.vengeance-mult=1.50 | execution DPS = execution hit / cooldown; replacement paths override direct hit model; vengeance uses floor only; incoming damage is not modeled | incoming damage not modeled |
| Squire | heavy | Destroyer | cooldown-heavy-t3-b | Normal attacks deal no damage. Your execution fires on a greatly shortened cooldown (4s) and hits for far more (5× instead of 3×). On-hit gear and charm triggers still fire on regular attacks. Out of combat, your execut... | - | cooldown.empowered-cd-ms=-4000, cooldown.singular-extraction=1.00 | execution DPS = execution hit / cooldown; replacement paths override direct hit model; singular extraction: normal direct damage suppressed | - |
| Squire | heavy | Devout Priest | cooldown-heavy-t3-c | Your execution becomes a 3-second holy channel: you stand still and fire a continuous beam at your target, and every beam tick applies your on-hit effects (gear, charms, on-hit damage) — built for high on-hit over attac... | - | cooldown.channeled-beam=1.00, cooldown.channeled-beam-mult=1.00 | execution DPS = execution hit / cooldown; replacement paths override direct hit model; channeled beam estimated as six 500 ms ticks | high uptime assumed, AoE treated as single-target |
| Squire | light | Assassin | cooldown-light-t3-a | Your execution deals its normal damage and triggers a 2.5s burst of double attack speed (~half-uptime at the 5s cooldown). The timer keeps ticking through the burst. | - | cooldown.overdrive=1.00 | execution DPS = execution hit / cooldown; replacement paths override direct hit model; overdrive attack-speed buff averaged | high uptime assumed |
| Squire | light | Sunderer | cooldown-light-t3-c | Your execution bypasses 100% of the target's plating. For 2 seconds afterward, your regular attacks bypass 50% of plating and ignore 10% of the target's damage reduction. | - | cooldown.rupture=1.00, cooldown.rupture-dr-pierce=0.10 | execution DPS = execution hit / cooldown; replacement paths override direct hit model; execute averaged over final 20% HP; dead swing every 4 hits | execute averaged |
| Squire | light | Transcendant | cooldown-light-t3-b | Each attack banks a stack, and every attack deals bonus flat damage per banked stack — so your hits ramp the longer you go (stacks fall off after 10s idle). The execution adds the full stacked bonus on top, then clears... | - | cooldown.eternal-cycle=1.00, cooldown.eternal-cycle-flat=8.00 | execution DPS = execution hit / cooldown; replacement paths override direct hit model; execute averaged over final 20% HP; dead swing every 4 hits | execute averaged |
| Apprentice | balanced | Cinder Lord | dot-balanced-t3-c | When a target reaches max burn stacks, all stacks are consumed and replaced with Conflagration: a single raging blaze that delivers the same total damage as the full burn in a rapid-fire flurry of ticks. Cannot stack fu... | - | dot.conflagration=1.00 | DoT DPS = computeScaledDotDamage(max stacks) / tick interval; direct reduced by conversion pct | AoE treated as single-target |
| Apprentice | balanced | Firebrand | dot-balanced-t3-b | Your first attack on a fresh (or fully un-burned) target sears in all 6 fire stacks at once, at 60% tick value each. Once a target is fully branded, your attacks against it bypass the fire conversion entirely and land a... | - | dot.ignition=1.00 | DoT DPS = computeScaledDotDamage(max stacks) / tick interval; direct reduced by conversion pct; max-stack direct bypass treated as steady-state | high uptime assumed, infinite/stack cap approximation |
| Apprentice | balanced | Pyromancer | dot-balanced-t3-a | Each hit applies 2 burn stacks instead of 1, but each stack deals 50% of normal tick damage. Hitting a target already at max stacks deals bonus direct damage equal to 2× the max-stack DoT damage. | - | dot.fan-the-flames=1.00 | DoT DPS = computeScaledDotDamage(max stacks) / tick interval; direct reduced by conversion pct | infinite/stack cap approximation |
| Apprentice | heavy | Icebreaker | dot-heavy-t3-a | Below max frost stacks, attacks convert at the normal 70%. At max stacks (3), your direct attacks deal full damage (0% conversion) while the frost keeps ticking — and the target takes an 8% damage-reduction debuff, so t... | - | dot.rimeshatter=1.00 | DoT DPS = computeScaledDotDamage(max stacks) / tick interval; direct reduced by conversion pct; max-stack direct bypass treated as steady-state | high uptime assumed, infinite/stack cap approximation |
| Apprentice | heavy | Wind Spirit | dot-heavy-t3-c | Your frost conversion becomes total: 100% of attack damage is converted into DoT, with a stronger frost multiplier. Hitting a target already at max frost stacks applies Frostbite, increasing DoT damage taken by 3% per s... | - | dot.conversion-pct=0.30, dot.frostbite-dot-taken-pct=0.02, dot.frostbite-duration-ms=4000, dot.frostbite-max-stacks=10.0, dot.mechanic-mult=1.10, dot.wind-spirit=1.00 | DoT DPS = computeScaledDotDamage(max stacks) / tick interval; direct reduced by conversion pct; wind spirit frostbite estimated at 1.44 steady stacks | high uptime assumed, incoming damage not modeled, infinite/stack cap approximation |
| Apprentice | heavy | Winter Warden | dot-heavy-t3-b | Each hit also applies a Chill stack (up to 9), each reducing the target's movement and attack speed by 5%. At 9 Chill stacks the target is Frozen for 2 seconds — a severe slow (not full CC) that also makes it take 35% b... | - | dot.freezing-cold=1.00 | DoT DPS = computeScaledDotDamage(max stacks) / tick interval; direct reduced by conversion pct | - |
| Apprentice | light | Cultist | dot-light-t3-b | Your doom has no stack limit. The first 8 stacks deal full damage per tick. Each additional stack beyond 8 adds damage at 50% effectiveness, naturally plateauing around 30–40 stacks. Ticks twice as fast (same total dama... | - | dot.eternal-doom=1.00, dot.tick-interval-ms=500 | DoT DPS = computeScaledDotDamage(max stacks) / tick interval; direct reduced by conversion pct; eternal doom capped to 40 steady stacks for report sanity | high uptime assumed, infinite/stack cap approximation |
| Apprentice | light | Venomslinger | dot-light-t3-a | Your poison can stack up to 10 (overriding the 8-stack cap). Reaching 10 stacks instantly detonates them all for 10 full ticks of damage in a single burst, then clears all stacks. | - | dot.poison-explosion=1.00 | DoT DPS = computeScaledDotDamage(max stacks) / tick interval; direct reduced by conversion pct; poison explosion averaged every 10 stacks | infinite/stack cap approximation |
| Apprentice | light | Zealot | dot-light-t3-c | Hitting a target at max poison stacks grants Frenzy for 6s (refreshed on each such hit): a flat attack-speed bonus plus on-hit damage that scales per tier. Fast attacks keep stacks maxed and the buff up — a self-sustain... | - | dot.frenzy=1.00 | DoT DPS = computeScaledDotDamage(max stacks) / tick interval; direct reduced by conversion pct; frenzy estimated at high uptime; execute averaged over final 20% HP; dead swing every 4 hits | high uptime assumed, execute averaged |
| Spirit | balanced | Aetherist | energy-balanced-t3-c | Your attack damage oscillates with your current energy: 0.5× at empty, 1× at half (neutral), up to 2× at full. A continuous wave — strongest just before discharge, weakest right after. Neutral on average, all about timi... | - | energy.charge-state=1.00 | cycle average over energy charge hits plus empowered discharge; execute averaged over final 20% HP; dead swing every 4 hits | execute averaged |
| Spirit | balanced | Equinox | energy-balanced-t3-a | Each discharge flips you between two states. Charge State: slow energy gain, +on-hit damage (flat, scaling per tier), slower attacks, ending in a weak discharge. Discharge State: fast energy gain, +attack damage, faster... | - | energy.binary-cycle=1.00 | cycle average over energy charge hits plus empowered discharge; execute averaged over final 20% HP; dead swing every 4 hits | execute averaged |
| Spirit | balanced | Stormbringer | energy-balanced-t3-b | Discharge becomes a storm of 4 uniform empowered strikes (1.5× each) — the discharge itself is the first, then your next 3 regular attacks. Each is a real empowered attack, so on-hit and empowered-triggered gear all app... | - | energy.awakened-lightning=1.00 | cycle average over energy charge hits plus empowered discharge; awakened lightning next-three empowered hits included | AoE treated as single-target |
| Spirit | heavy | Invoker | energy-heavy-t3-b | Each consecutive discharge (no long gap between them) adds a stack, up to 3: more discharge damage AND faster energy gain. Stacks reset after 5 seconds without dealing damage. Rewards uninterrupted farming. | - | energy.critical-mass=1.00 | cycle average over energy charge hits plus empowered discharge | - |
| Spirit | heavy | Tempest | energy-heavy-t3-c | Discharge deals normal damage and brands the target with a Storm instead of a burst — a damage-over-time debuff worth 8× your attack over its base 4.5s, extended +1s by each normal attack (up to 7.5s, adding more total... | - | energy.endless-storm=1.00 | cycle average over energy charge hits plus empowered discharge; endless storm DoT budget included per discharge | high uptime assumed, AoE treated as single-target |
| Spirit | heavy | Voidwalker | energy-heavy-t3-a | Doubles your max energy (200), and +100 more for each tier beyond this one (300 next tier, 400 after, …). Energy generation accelerates the fuller the pool. If a basic hit would kill via the discharge's projected damage... | - | energy.max-bonus=100, energy.per-hit=20.0, energy.singularity-execute=1.00 | cycle average over energy charge hits plus empowered discharge | - |
| Spirit | light | Channeler | energy-light-t3-c | Discharge is suppressed. While energy stays above the threshold you build unlimited Flow stacks, each adding flat on-hit damage (not attack damage), scaling per tier with diminishing returns as stacks pile up. But energ... | - | energy.upkeep=1.00 | cycle average over energy charge hits plus empowered discharge; execute averaged over final 20% HP; dead swing every 4 hits | execute averaged |
| Spirit | light | Stormdancer | energy-light-t3-a | Your lightning condenses into daggers. Blue Shift at low energy hits harder; Red Shift at high energy hits lighter but attacks faster, moves faster, and evades more. Energy builds slowly while you Flash the same fight a... | evasion=0.25 | energy.flash=1.00 | cycle average over energy charge hits plus empowered discharge; execute averaged over final 20% HP; dead swing every 4 hits | execute averaged |
| Spirit | light | Surge | energy-light-t3-b | Discharge deals no damage — instead it triggers Overdrive: a significant attack-damage bonus (favouring high base-ATK weapons, not APS). Energy then decays from full to empty; when it empties, Overdrive ends and you reb... | - | energy.overdrive=1.00 | cycle average over energy charge hits plus empowered discharge; surge overdrive approximated as 35% steady attack gain | high uptime assumed |
| Slinger | balanced | Blunderbuss | reload-balanced-t3-b | Fires all 10 rounds at once as a point-blank volley, then reloads (2s). Close range mandatory — the reach penalty is preserved. Each pellet deals normal damage; the burst shoves enemies back. | attackRange=-100 | reload.blunderbuss=1.00, reload.blunderbuss-damage-mult=-0.50, reload.blunderbuss-knockback-distance-per-pellet=7.00, reload.blunderbuss-knockback-ms-per-pellet=14.0, reload.blunderbuss-spread-rad=0.65 | effective shots/s = ammo / (shot time + reload time); spec branches override as needed; blunderbuss modeled as full-magazine single-target volley at 50% pellet damage | AoE treated as single-target |
| Slinger | balanced | Bounty hunter | reload-balanced-t3-a | Each attack applies a Death Mark stack to the target (up to 10). Reloading detonates all stacks on the current target for attack × stacks × 0.65 bonus damage. | - | reload.death-mark=1.00, reload.death-mark-detonate-mult=0.65 | effective shots/s = ammo / (shot time + reload time); spec branches override as needed; death mark detonation averaged per clip; rimebrand-burn reservoir DoT from weapon profile | infinite/stack cap approximation |
| Slinger | balanced | Dualslinger | reload-balanced-t3-c | Even shots deal 2× attack damage with no on-hit damage; odd shots deal 2× on-hit damage with no attack damage. On-hit TRIGGERS (DoT, procs) still fire on every shot. Also grants scaling on-hit damage. Rewards a genuinel... | - | reload.alternating-cadence=1.00, reload.alternating-onhit-per-tier=20.0 | effective shots/s = ammo / (shot time + reload time); spec branches override as needed; dual shots averaged 50/50 | - |
| Slinger | heavy | Cannoneer | reload-heavy-t3-c | Every shot banks damage into your Cannon. When you reload, the cannon charges for half the reload, then fires the entire stored pool at your target as one massive burst — then the pool resets. Reward: empty big clips, t... | - | reload.cannon=1.00, reload.cannon-damage-per-shot=0.50 | effective shots/s = ammo / (shot time + reload time); spec branches override as needed; cannon stored pool averaged per shot; rimebrand-burn reservoir DoT from weapon profile | infinite/stack cap approximation |
| Slinger | heavy | Melter | reload-heavy-t3-a | Replaces your magazine with a continuous laser. It fires continuously while a target is in range, building Heat from 0% to 100%. At 100% Heat it overheats and cannot fire again until fully cooled. | - | reload.laser=1.00, reload.laser-cool-per-tick=2.50, reload.laser-damage-per-tick-pct=0.18, reload.laser-heat-per-tick=2.00 | effective shots/s = ammo / (shot time + reload time); spec branches override as needed; laser heat/cool duty cycle estimated | high uptime assumed |
| Slinger | heavy | Warmonger | reload-heavy-t3-b | Attack speed ramps up with every shot fired through the high-capacity clip, resetting on reload. | - | reload.hair-trigger=1.00, reload.hair-trigger-max-stacks=15.0, reload.hair-trigger-pct-per-shot=0.05, reload.max-ammo=20.0 | effective shots/s = ammo / (shot time + reload time); spec branches override as needed | infinite/stack cap approximation |
| Slinger | light | Desperado | reload-light-t3-b | Each reload completion grants a Momentum stack (up to 5): +6% attack speed and −10% reload time per stack (reaching ~1s reload at max). Stacks persist through combat and decay slowly out of combat. Rewards continuous, u... | - | reload.momentum=1.00, reload.momentum-aps-per-stack=0.06, reload.momentum-max-stacks=5.00, reload.momentum-reload-reduction=0.10 | effective shots/s = ammo / (shot time + reload time); spec branches override as needed | infinite/stack cap approximation |
| Slinger | light | Duelist | reload-light-t3-a | The last bullet of every clip fires as an empowered shot (3.5×) with a splash — and like all empowered attacks, it scales with empowered-damage gear and passives. | - | reload.empowered-mult=3.50, reload.exploding-clip=1.00, reload.max-ammo=1.00 | effective shots/s = ammo / (shot time + reload time); spec branches override as needed; rimebrand-burn reservoir DoT from weapon profile | AoE treated as single-target, infinite/stack cap approximation |
| Slinger | light | Sniper | reload-light-t3-c | Loads only 3 heavy shells and fires at a hard-set 0.5 APS, ignoring weapon attack speed entirely. Your bonus attack-speed stat is converted into per-shot damage instead, and shots deal 2× damage against full-health targ... | - | reload.max-ammo=-2.00, reload.snipe=1.00, reload.snipe-as-to-dmg=1.00, reload.snipe-cadence-ms=2000, reload.snipe-fullhp-mult=4.00 | effective shots/s = ammo / (shot time + reload time); spec branches override as needed; sniper full-HP bonus amortized once per report horizon | high uptime assumed, infinite/stack cap approximation |


## Best / Worst Weapon Per Subclass

| Class | Subclass | Kind | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- | --- | --- |
| Striker | Justicar | best | Eruption Lash | 351 | 1 |
| Striker | Justicar | worst | Plague Axe | 248 | 1 |
| Striker | Maestro | best | Eruption Lash | 522 | 1 |
| Striker | Maestro | worst | Earthsunder Maul | 281 | 1 |
| Striker | Wavecrest | best | Eruption Lash | 562 | 1 |
| Striker | Wavecrest | worst | Earthsunder Maul | 400 | 1 |
| Striker | Berserker | best | Eruption Lash | 337 | 1 |
| Striker | Berserker | worst | Earthsunder Maul | 241 | 1 |
| Striker | Hemomancer | best | Eruption Lash | 412 | 1 |
| Striker | Hemomancer | worst | Volcanic Blightbrand | 290 | 1 |
| Striker | Juggernaut | best | Eruption Lash | 337 | 1 |
| Striker | Juggernaut | worst | Earthsunder Maul | 241 | 1 |
| Striker | Scrapper | best | Eruption Lash | 504 | 1 |
| Striker | Scrapper | worst | Earthsunder Maul | 361 | 1 |
| Striker | Shockblade | best | Eruption Lash | 433 | 1 |
| Striker | Shockblade | worst | Plague Axe | 289 | 1 |
| Striker | Swiftblade | best | Eruption Lash | 538 | 1 |
| Striker | Swiftblade | worst | Earthsunder Maul | 385 | 1 |
| Squire | Dynamo | best | Abyssal Axe | 326 | 1 |
| Squire | Dynamo | worst | Plague Axe | 227 | 1 |
| Squire | Reverb | best | Warmaul | 350 | 1 |
| Squire | Reverb | worst | Plague Axe | 249 | 1 |
| Squire | Stalwart | best | Abyssal Axe | 326 | 1 |
| Squire | Stalwart | worst | Plague Axe | 227 | 1 |
| Squire | Avenger | best | Warmaul | 378 | 1 |
| Squire | Avenger | worst | Plague Axe | 233 | 1 |
| Squire | Destroyer | best | Warmaul | 503 | 1 |
| Squire | Destroyer | worst | Eruption Lash | 116 | 1 |
| Squire | Devout Priest | best | Earthsunder Maul | 524 | 1 |
| Squire | Devout Priest | worst | Deathfang Rapier | 318 | 1 |
| Squire | Assassin | best | Eruption Lash | 551 | 1 |
| Squire | Assassin | worst | Earthsunder Maul | 425 | 1 |
| Squire | Sunderer | best | Abyssal Axe | 376 | 1 |
| Squire | Sunderer | worst | Plague Axe | 255 | 1 |
| Squire | Transcendant | best | Abyssal Axe | 376 | 1 |
| Squire | Transcendant | worst | Plague Axe | 255 | 1 |
| Apprentice | Cinder Lord | best | Earthsunder Maul | 404 | 1 |
| Apprentice | Cinder Lord | worst | Volcanic Blightbrand | 202 | 1 |
| Apprentice | Firebrand | best | Earthsunder Maul | 508 | 1 |
| Apprentice | Firebrand | worst | Volcanic Blightbrand | 314 | 1 |
| Apprentice | Pyromancer | best | Earthsunder Maul | 404 | 1 |
| Apprentice | Pyromancer | worst | Volcanic Blightbrand | 202 | 1 |
| Apprentice | Icebreaker | best | Earthsunder Maul | 574 | 1 |
| Apprentice | Icebreaker | worst | Volcanic Blightbrand | 305 | 1 |
| Apprentice | Wind Spirit | best | Earthsunder Maul | 566 | 1 |
| Apprentice | Wind Spirit | worst | Deathfang Rapier | 130 | 1 |
| Apprentice | Winter Warden | best | Earthsunder Maul | 455 | 1 |
| Apprentice | Winter Warden | worst | Deathfang Rapier | 157 | 1 |
| Apprentice | Cultist | best | Earthsunder Maul | 364 | 1 |
| Apprentice | Cultist | worst | Volcanic Blightbrand | 233 | 1 |
| Apprentice | Venomslinger | best | Earthsunder Maul | 414 | 1 |
| Apprentice | Venomslinger | worst | Volcanic Blightbrand | 266 | 1 |
| Apprentice | Zealot | best | Abyssal Axe | 565 | 1 |
| Apprentice | Zealot | worst | Plague Axe | 422 | 1 |
| Spirit | Aetherist | best | Abyssal Axe | 388 | 1 |
| Spirit | Aetherist | worst | Plague Axe | 268 | 1 |
| Spirit | Equinox | best | Abyssal Axe | 388 | 1 |
| Spirit | Equinox | worst | Plague Axe | 268 | 1 |
| Spirit | Stormbringer | best | Eruption Lash | 474 | 1 |
| Spirit | Stormbringer | worst | Earthsunder Maul | 345 | 1 |
| Spirit | Invoker | best | Eruption Lash | 371 | 1 |
| Spirit | Invoker | worst | Earthsunder Maul | 272 | 1 |
| Spirit | Tempest | best | Eruption Lash | 567 | 1 |
| Spirit | Tempest | worst | Volcanic Blightbrand | 411 | 1 |
| Spirit | Voidwalker | best | Eruption Lash | 415 | 1 |
| Spirit | Voidwalker | worst | Earthsunder Maul | 304 | 1 |
| Spirit | Channeler | best | Abyssal Axe | 406 | 1 |
| Spirit | Channeler | worst | Plague Axe | 278 | 1 |
| Spirit | Stormdancer | best | Abyssal Axe | 406 | 1 |
| Spirit | Stormdancer | worst | Plague Axe | 278 | 1 |
| Spirit | Surge | best | Deathfang Rapier | 507 | 1 |
| Spirit | Surge | worst | Earthsunder Maul | 367 | 1 |
| Slinger | Blunderbuss | best | Earthsunder Maul | 533 | 1 |
| Slinger | Blunderbuss | worst | Eruption Lash | 202 | 1 |
| Slinger | Bounty hunter | best | Glacial Rimebrand | 523 | 1 |
| Slinger | Bounty hunter | worst | Eruption Lash | 375 | 1 |
| Slinger | Dualslinger | best | Deathfang Rapier | 349 | 1 |
| Slinger | Dualslinger | worst | Plague Axe | 221 | 1 |
| Slinger | Cannoneer | best | Glacial Rimebrand | 492 | 1 |
| Slinger | Cannoneer | worst | Plague Axe | 380 | 1 |
| Slinger | Melter | best | Earthsunder Maul | 489 | 1 |
| Slinger | Melter | worst | Deathfang Rapier | 111 | 1 |
| Slinger | Warmonger | best | Deathfang Rapier | 418 | 1 |
| Slinger | Warmonger | worst | Plague Axe | 248 | 1 |
| Slinger | Desperado | best | Deathfang Rapier | 394 | 1 |
| Slinger | Desperado | worst | Plague Axe | 251 | 1 |
| Slinger | Duelist | best | Glacial Rimebrand | 340 | 1 |
| Slinger | Duelist | worst | Plague Axe | 212 | 1 |
| Slinger | Sniper | best | Earthsunder Maul | 336 | 1 |
| Slinger | Sniper | worst | Deathfang Rapier | 101 | 1 |


## Top / Bottom Subclass Rows Grouped By Root Class

| Class | Group | Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Outlier | Danger flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Striker | top | Striker / Skirmisher / Lancer / Wavecrest | Eruption Lash +3 | 562 | 292 | 270 | 0.00 | 0.00 | - | high uptime assumed, AoE treated as single-target, infinite/stack cap approximation |
| Striker | top | Striker / Flurry / Lancer / Swiftblade | Eruption Lash +3 | 538 | 358 | 180 | 0.00 | 0.00 | - | - |
| Striker | top | Striker / Skirmisher / Lancer / Maestro | Eruption Lash +3 | 522 | 292 | 230 | 0.00 | 0.00 | - | - |
| Striker | top | Striker / Flurry / Lancer / Scrapper | Eruption Lash +3 | 504 | 358 | 146 | 0.00 | 0.00 | - | high uptime assumed, incoming damage not modeled, infinite/stack cap approximation |
| Striker | top | Striker / Flurry / Lancer / Shockblade | Eruption Lash +3 | 433 | 387 | 45.5 | 0.00 | 0.00 | - | - |
| Striker | bottom | Striker / Breaker / Lancer / Berserker | Eruption Lash +3 | 337 | 224 | 113 | 0.00 | 0.00 | - | - |
| Striker | bottom | Striker / Breaker / Lancer / Juggernaut | Eruption Lash +3 | 337 | 224 | 113 | 0.00 | 0.00 | - | - |
| Striker | bottom | Striker / Skirmisher / Lancer / Justicar | Eruption Lash +3 | 351 | 292 | 58.9 | 0.00 | 0.00 | - | - |
| Striker | bottom | Striker / Breaker / Lancer / Hemomancer | Eruption Lash +3 | 412 | 224 | -37.3 | 226 | 0.00 | - | - |
| Striker | bottom | Striker / Flurry / Lancer / Shockblade | Eruption Lash +3 | 433 | 387 | 45.5 | 0.00 | 0.00 | - | - |
| Squire | top | Squire / Warrior / Phalanx / Assassin | Eruption Lash +3 | 551 | 359 | 192 | 0.00 | 0.00 | - | high uptime assumed |
| Squire | top | Squire / Bulwark / Phalanx / Devout Priest | Earthsunder Maul +3 | 524 | 164 | 361 | 0.00 | 0.00 | - | high uptime assumed, AoE treated as single-target |
| Squire | top | Squire / Bulwark / Phalanx / Destroyer | Warmaul +3 | 503 | 0.00 | 503 | 0.00 | 0.00 | - | - |
| Squire | top | Squire / Bulwark / Phalanx / Avenger | Warmaul +3 | 378 | 167 | 210 | 0.00 | 0.00 | - | incoming damage not modeled |
| Squire | top | Squire / Warrior / Phalanx / Sunderer | Abyssal Axe +3 | 376 | 253 | 22.2 | 0.00 | 101 | - | execute averaged |
| Squire | bottom | Squire / Knight / Phalanx / Dynamo | Abyssal Axe +3 | 326 | 210 | 31.7 | 0.00 | 84.2 | - | execute averaged |
| Squire | bottom | Squire / Knight / Phalanx / Stalwart | Abyssal Axe +3 | 326 | 210 | 31.7 | 0.00 | 84.2 | - | execute averaged |
| Squire | bottom | Squire / Knight / Phalanx / Reverb | Warmaul +3 | 350 | 213 | 137 | 0.00 | 0.00 | - | high uptime assumed |
| Squire | bottom | Squire / Warrior / Phalanx / Sunderer | Abyssal Axe +3 | 376 | 253 | 22.2 | 0.00 | 101 | - | execute averaged |
| Squire | bottom | Squire / Warrior / Phalanx / Transcendant | Abyssal Axe +3 | 376 | 253 | 22.2 | 0.00 | 101 | - | execute averaged |
| Apprentice | top | Apprentice / Rime-Bound / Warlock / Icebreaker | Earthsunder Maul +3 | 574 | 171 | 0.00 | 404 | 0.00 | - | high uptime assumed, infinite/stack cap approximation |
| Apprentice | top | Apprentice / Rime-Bound / Warlock / Wind Spirit | Earthsunder Maul +3 | 566 | 0.00 | 0.00 | 566 | 0.00 | - | high uptime assumed, incoming damage not modeled, infinite/stack cap approximation |
| Apprentice | top | Apprentice / Venom vessel / Warlock / Zealot | Abyssal Axe +3 | 565 | 309 | 44.8 | 88.0 | 123 | - | high uptime assumed, execute averaged |
| Apprentice | top | Apprentice / Ember mage / Warlock / Firebrand | Earthsunder Maul +3 | 508 | 208 | 0.00 | 300 | 0.00 | - | high uptime assumed, infinite/stack cap approximation |
| Apprentice | top | Apprentice / Rime-Bound / Warlock / Winter Warden | Earthsunder Maul +3 | 455 | 51.1 | 0.00 | 404 | 0.00 | - | - |
| Apprentice | bottom | Apprentice / Venom vessel / Warlock / Cultist | Earthsunder Maul +3 | 364 | 172 | 0.00 | 192 | 0.00 | - | high uptime assumed, infinite/stack cap approximation |
| Apprentice | bottom | Apprentice / Ember mage / Warlock / Cinder Lord | Earthsunder Maul +3 | 404 | 104 | 0.00 | 300 | 0.00 | - | AoE treated as single-target |
| Apprentice | bottom | Apprentice / Ember mage / Warlock / Pyromancer | Earthsunder Maul +3 | 404 | 104 | 0.00 | 300 | 0.00 | - | infinite/stack cap approximation |
| Apprentice | bottom | Apprentice / Venom vessel / Warlock / Venomslinger | Earthsunder Maul +3 | 414 | 172 | 0.00 | 242 | 0.00 | - | infinite/stack cap approximation |
| Apprentice | bottom | Apprentice / Rime-Bound / Warlock / Winter Warden | Earthsunder Maul +3 | 455 | 51.1 | 0.00 | 404 | 0.00 | - | - |
| Spirit | top | Spirit / Phantasm / Shade / Tempest | Eruption Lash +3 | 567 | 255 | 116 | 196 | 0.00 | - | high uptime assumed, AoE treated as single-target |
| Spirit | top | Spirit / Spark / Shade / Surge | Deathfang Rapier +3 | 507 | 376 | 131 | 0.00 | 0.00 | - | high uptime assumed |
| Spirit | top | Spirit / Wraith / Shade / Stormbringer | Eruption Lash +3 | 474 | 347 | 127 | 0.00 | 0.00 | - | AoE treated as single-target |
| Spirit | top | Spirit / Phantasm / Shade / Voidwalker | Eruption Lash +3 | 415 | 255 | 160 | 0.00 | 0.00 | - | - |
| Spirit | top | Spirit / Spark / Shade / Channeler | Abyssal Axe +3 | 406 | 269 | 30.0 | 0.00 | 108 | - | execute averaged |
| Spirit | bottom | Spirit / Phantasm / Shade / Invoker | Eruption Lash +3 | 371 | 255 | 116 | 0.00 | 0.00 | - | - |
| Spirit | bottom | Spirit / Wraith / Shade / Aetherist | Abyssal Axe +3 | 388 | 250 | 37.3 | 0.00 | 100 | - | execute averaged |
| Spirit | bottom | Spirit / Wraith / Shade / Equinox | Abyssal Axe +3 | 388 | 250 | 37.3 | 0.00 | 100 | - | execute averaged |
| Spirit | bottom | Spirit / Spark / Shade / Channeler | Abyssal Axe +3 | 406 | 269 | 30.0 | 0.00 | 108 | - | execute averaged |
| Spirit | bottom | Spirit / Spark / Shade / Stormdancer | Abyssal Axe +3 | 406 | 269 | 30.0 | 0.00 | 108 | - | execute averaged |
| Slinger | top | Slinger / Marksman / Enforcer / Blunderbuss | Earthsunder Maul +3 | 533 | 533 | 0.00 | 0.00 | 0.00 | - | AoE treated as single-target |
| Slinger | top | Slinger / Marksman / Enforcer / Bounty hunter | Glacial Rimebrand +3 | 523 | 68.8 | 47.3 | 0.00 | 407 | - | infinite/stack cap approximation |
| Slinger | top | Slinger / Artillerist / Enforcer / Cannoneer | Glacial Rimebrand +3 | 492 | 71.6 | 37.8 | 0.00 | 383 | - | infinite/stack cap approximation |
| Slinger | top | Slinger / Artillerist / Enforcer / Melter | Earthsunder Maul +3 | 489 | 0.00 | 489 | 0.00 | 0.00 | - | high uptime assumed |
| Slinger | top | Slinger / Artillerist / Enforcer / Warmonger | Deathfang Rapier +3 | 418 | 418 | 0.00 | 0.00 | 0.00 | - | infinite/stack cap approximation |
| Slinger | bottom | Slinger / Scout / Enforcer / Sniper | Earthsunder Maul +3 | 336 | 300 | 0.00 | 0.00 | 36.0 | - | high uptime assumed, infinite/stack cap approximation |
| Slinger | bottom | Slinger / Scout / Enforcer / Duelist | Glacial Rimebrand +3 | 340 | 75.5 | 0.00 | 0.00 | 264 | - | AoE treated as single-target, infinite/stack cap approximation |
| Slinger | bottom | Slinger / Marksman / Enforcer / Dualslinger | Deathfang Rapier +3 | 349 | 349 | 0.00 | 0.00 | 0.00 | - | - |
| Slinger | bottom | Slinger / Scout / Enforcer / Desperado | Deathfang Rapier +3 | 394 | 394 | 0.00 | 0.00 | 0.00 | - | infinite/stack cap approximation |
| Slinger | bottom | Slinger / Artillerist / Enforcer / Warmonger | Deathfang Rapier +3 | 418 | 418 | 0.00 | 0.00 | 0.00 | - | infinite/stack cap approximation |

