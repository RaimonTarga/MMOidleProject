# T4 closing pass build catalogue

54 production paths, three role templates with declared biome support changes, 216 primary packages. Exact ordered rules, abilities, upgrades, checkpoint and notes are in manifest.json; actual stats and paid ownership are in resolved-builds.json. These are constructed credible packages, not measured winners.

## Mechanism choices

| Stable path ID | Path | Weapon | Core | Relic | Reason |
|---|---|---|---|---|---|
| cadence-light-t3-a | Shockblade | jungle-deathfang-rapier | core-catalyst | relic-equilibrium-shard | Aftershock repeats actual on-hit damage. |
| cadence-light-t3-b | Scrapper | volcanic-eruption-lash | core-duelist | relic-equilibrium-shard | Fast regular cycles maintain vulnerability and plating shred. |
| cadence-light-t3-c | Swiftblade | volcanic-eruption-lash | core-duelist | relic-equilibrium-shard | Fast regular attacks deliver successive doubled finishers. |
| cadence-balanced-t3-a | Maestro | volcanic-eruption-lash | core-duelist | relic-equilibrium-shard | Metronome adds flat damage during regular-hit cycles. |
| cadence-balanced-t3-b | Wavecrest | volcanic-eruption-lash | core-duelist | relic-equilibrium-shard | Buildup and post-finisher echo require repeated regular attacks. |
| cadence-balanced-t3-c | Justicar | graveyard-plague-axe | core-duelist | relic-equilibrium-shard | High Attack funds finisher Verdict banking; dead swings trade delivery for vulnerability. |
| cadence-heavy-t3-a | Berserker | mountain-warmaul | core-duelist | relic-equilibrium-shard | Empowered payload with 0.55 APS rather than 0.4; Frenzy supports Rampage construction. |
| cadence-heavy-t3-b | Hemomancer | mountain-warmaul | core-duelist | relic-colossus-heart | Empowered finisher becomes a non-stacking bleed; potency accepted with slower repeats. |
| cadence-heavy-t3-c | Juggernaut | mountain-warmaul | core-duelist | relic-equilibrium-shard | Crescendo amplifies finishers during maintained engagement. |
| cooldown-light-t3-a | Assassin | mountain-warmaul | core-arcanist | relic-hastebound-dial | Empowered weapon and Power Strike; frequent execution windows, reduced relic potency. |
| cooldown-light-t3-b | Transcendant | volcanic-eruption-lash | core-duelist | relic-equilibrium-shard | Explicit cadence exception: regular attacks build and spend Eternal Cycle flat stacks. |
| cooldown-light-t3-c | Sunderer | mountain-warmaul | core-arcanist | relic-equilibrium-shard | Execution bypasses plating; useful Power Strike gives Arcanist an actual cast. |
| cooldown-balanced-t3-a | Reverb | mountain-warmaul | core-arcanist | relic-equilibrium-shard | Execution payload plus useful casts; Frenzy supplies more attacks for the next Reverb. |
| cooldown-balanced-t3-b | Dynamo | mountain-warmaul | core-arcanist | relic-equilibrium-shard | Battery accrues by cooldown time, supports real cast damage. |
| cooldown-balanced-t3-c | Stalwart | mountain-warmaul | core-arcanist | relic-equilibrium-shard | Keep the native execution window; no early-trigger Rune that erases patience. |
| cooldown-heavy-t3-a | Avenger | mountain-warmaul | core-arcanist | relic-colossus-heart | Taken-damage execution with durable support; potency trades frequency. |
| cooldown-heavy-t3-b | Destroyer | mountain-warmaul | core-arcanist | relic-equilibrium-shard | Normal-hit damage is suppressed; empowered execution and useful Technique payloads matter. |
| cooldown-heavy-t3-c | Devout Priest | jungle-deathfang-rapier | core-catalyst | relic-equilibrium-shard | Devout Priest beam applies on-hit each tick; no cast Technique or incidental Orbit. |
| dot-light-t3-a | Venomslinger | graveyard-plague-axe | core-accelerant | relic-hastebound-dial | Medium weapon plus Accelerant supports auto-consuming poison; no max-stack condition. |
| dot-light-t3-b | Cultist | graveyard-plague-axe | core-accelerant | relic-equilibrium-shard | Medium weapon supports sustained uncapped doom; no maximum-stack gate. |
| dot-light-t3-c | Zealot | graveyard-plague-axe | core-accelerant | relic-equilibrium-shard | Medium weapon plus cadence supports max-stack on-hit Frenzy without consuming stacks. |
| dot-balanced-t3-a | Pyromancer | graveyard-plague-axe | core-tempered | relic-equilibrium-shard | Medium weapon, two-stack application and full-stack direct payoff; no Detonate. |
| dot-balanced-t3-b | Firebrand | graveyard-plague-axe | core-tempered | relic-equilibrium-shard | Medium Attack supports fresh-target brand and subsequent full direct hits. |
| dot-balanced-t3-c | Cinder Lord | graveyard-plague-axe | core-tempered | relic-equilibrium-shard | Auto-conflagration consumes max stacks; Sweep replaces unreachable max-stack Contagion. |
| dot-heavy-t3-a | Icebreaker | mountain-warmaul | core-tempered | relic-equilibrium-shard | Genuinely heavy 0.55 APS supports reaching and maintaining full-stack direct damage. |
| dot-heavy-t3-b | Winter Warden | mountain-warmaul | core-tempered | relic-equilibrium-shard | Heavy but not slowest: repeated hits maintain six-second Chill and reach nine stacks. |
| dot-heavy-t3-c | Wind Spirit | mountain-earthsunder-maul | core-tempered | relic-equilibrium-shard | High Attack sustains total frost conversion; stationary policy, no stack-consuming Detonate. |
| reload-light-t3-a | Duelist | jungle-deathfang-rapier | core-catalyst | relic-equilibrium-shard | On-hit clip delivery with native empowered last round. |
| reload-light-t3-b | Desperado | jungle-deathfang-rapier | core-catalyst | relic-hastebound-dial | On-hit delivery and faster reload cycles build Momentum. |
| reload-light-t3-c | Sniper | mountain-earthsunder-maul | core-tempered | relic-equilibrium-shard | Fixed two-second shot ignores weapon APS; high Attack supports the Sniper exception. |
| reload-balanced-t3-a | Bounty hunter | jungle-deathfang-rapier | core-catalyst | relic-equilibrium-shard | Repeated actual hits build death marks; on-hit weapon remains useful. |
| reload-balanced-t3-b | Blunderbuss | graveyard-plague-axe | core-bruiser | relic-equilibrium-shard | Close-range volley Attack payload; medium weapon trades dead swings for large Attack. |
| reload-balanced-t3-c | Dualslinger | jungle-deathfang-rapier | core-catalyst | relic-equilibrium-shard | Alternating on-hit shot and Attack shot; Catalyst supports real on-hit half. |
| reload-heavy-t3-a | Melter | jungle-deathfang-rapier | core-catalyst | relic-equilibrium-shard | Continuous laser ticks apply on-hit; no magazine/frequency assumption, no Frenzy or casts. |
| reload-heavy-t3-b | Warmonger | jungle-deathfang-rapier | core-catalyst | relic-equilibrium-shard | Long clip regular delivery builds hair-trigger speed. |
| reload-heavy-t3-c | Cannoneer | graveyard-plague-axe | core-tempered | relic-equilibrium-shard | Medium Attack supplies native cannon blast without forcing the slowest weapon. |
| summoner-light-t3-a | Inquisitor | jungle-deathfang-rapier | core-catalyst | relic-equilibrium-shard | Full formation unique-slot marks with normalized on-hit support. |
| summoner-light-t3-b | Kilnmaster | jungle-deathfang-rapier | core-catalyst | relic-equilibrium-shard | Kilnmaster secondary budget is 1.30 for the formation, not eight full proc budgets. |
| summoner-light-t3-c | Iconoclast | graveyard-plague-axe | core-survivalist | relic-equilibrium-shard | Weapon-scaled natural and scheduled shatter; Recovery supports replacement costs. |
| summoner-balanced-t3-a | Marshal | graveyard-plague-axe | core-survivalist | relic-equilibrium-shard | Formation Attack supports openings and coordinated strikes; Recovery supports payments. |
| summoner-balanced-t3-b | Chorister | graveyard-plague-axe | core-survivalist | relic-equilibrium-shard | Attack-scaled chorus voices need living slots and sustained focus. |
| summoner-balanced-t3-c | Ritualist | graveyard-plague-axe | core-survivalist | relic-equilibrium-shard | Ritual charges need living slots and attack opportunities; Frenzy reaches summons. |
| summoner-heavy-t3-a | Covenanter | graveyard-plague-axe | core-survivalist | relic-equilibrium-shard | Concentrated twin Attack budgets with owner Recovery for reconstruction. |
| summoner-heavy-t3-b | Champion | mountain-warmaul | core-duelist | relic-equilibrium-shard | Owner-attacking close Champion exception; real owner hit support and linked contributions. |
| summoner-heavy-t3-c | Idolwright | graveyard-plague-axe | core-survivalist | relic-equilibrium-shard | Designer authorized medium Plague Axe plus Equilibrium direction in this preparation; keep durable supports and add summon-delivered Power Strike/Frenzy. |
| energy-light-t3-a | Stormdancer | volcanic-eruption-lash | core-tempered | relic-equilibrium-shard | Fast actual hits express Flash shifts; no discharge-payload assumption. |
| energy-light-t3-b | Surge | mountain-earthsunder-maul | core-tempered | relic-equilibrium-shard | High Attack supports Overdrive; Frenzy helps charging and usable hits, Equilibrium avoids negative frequency. |
| energy-light-t3-c | Channeler | jungle-deathfang-rapier | core-catalyst | relic-equilibrium-shard | Flow is on-hit damage; repeated hits fund upkeep, no incidental Orbit. |
| energy-balanced-t3-a | Equinox | jungle-deathfang-rapier | core-catalyst | relic-equilibrium-shard | Charge phase has real on-hit flat and multiplier, alternate phase has Attack. |
| energy-balanced-t3-b | Stormbringer | mountain-warmaul | core-tempered | relic-equilibrium-shard | Four sequential empowered strikes need four real opportunities; Warmaul supplies empowered modifier and Frenzy cadence. |
| energy-balanced-t3-c | Aetherist | graveyard-plague-axe | core-tempered | relic-equilibrium-shard | Medium Attack expresses energy-dependent hit magnitude without extra timing automation. |
| energy-heavy-t3-a | Voidwalker | mountain-warmaul | core-tempered | relic-equilibrium-shard | Heavy Attack and 0.55 APS fund stored-energy and early execution opportunities. |
| energy-heavy-t3-b | Invoker | mountain-warmaul | core-tempered | relic-equilibrium-shard | Avoid slowest weapon and negative frequency; five-second inactivity reset requires delivery. |
| energy-heavy-t3-c | Tempest | mountain-earthsunder-maul | core-tempered | relic-equilibrium-shard | Storm captures Attack and normal hits extend its duration; Frenzy helps charge and extension. |

Duelist changes to Bruiser for swarm melee packages. Transcendant uses Slam/Bruiser only in swarms and its cadence package in single-target contexts. Arcanist is attached to actual Slam or Power Strike delivery; no cast-empty single-target Arcanist reference.

## Encounter packages

| Path | Context | Armor / charm / boots | Stance | Ordered Techniques | Guards | RP used/free |
|---|---|---|---|---|---|---|
| Shockblade | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Reverb | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 39/6 |
| Icebreaker | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | defensive-stance | contagion, frenzy | second-wind, brace, cleanse | 40/5 |
| Desperado | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Chorister | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Invoker | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Maestro | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 42/3 |
| Avenger | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 39/6 |
| Cultist | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Blunderbuss | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Champion | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 43/2 |
| Channeler | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Berserker | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 45/0 |
| Transcendant | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | defensive-stance | slam, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Firebrand | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Warmonger | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Iconoclast | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 42/3 |
| Aetherist | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Scrapper | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Dynamo | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 43/2 |
| Winter Warden | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Sniper | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Ritualist | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 42/3 |
| Tempest | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Wavecrest | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Destroyer | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 39/6 |
| Zealot | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | defensive-stance | contagion, frenzy | second-wind, brace, cleanse | 40/5 |
| Dualslinger | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Idolwright | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Stormdancer | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Hemomancer | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 42/3 |
| Sunderer | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 39/6 |
| Cinder Lord | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Cannoneer | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Inquisitor | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Equinox | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Swiftblade | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 45/0 |
| Stalwart | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | defensive-stance | slam, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Wind Spirit | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Duelist | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Marshal | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 43/2 |
| Voidwalker | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Justicar | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Devout Priest | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | expose-weakness, quick-strike | second-wind, brace, cleanse, break-free, endure | 42/3 |
| Venomslinger | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Bounty hunter | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Covenanter | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 42/3 |
| Surge | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Juggernaut | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Assassin | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 43/2 |
| Pyromancer | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Melter | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | expose-weakness, quick-strike | second-wind, brace, cleanse, break-free, endure | 42/3 |
| Kilnmaster | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 42/3 |
| Stormbringer | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Shockblade | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 42/3 |
| Reverb | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 39/6 |
| Icebreaker | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Desperado | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Chorister | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 43/2 |
| Invoker | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Maestro | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 45/0 |
| Avenger | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | defensive-stance | slam, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Cultist | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Blunderbuss | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Champion | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 39/6 |
| Channeler | V | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Berserker | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Transcendant | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 42/3 |
| Firebrand | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Warmonger | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Iconoclast | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 42/3 |
| Aetherist | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Scrapper | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Dynamo | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 39/6 |
| Winter Warden | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | defensive-stance | contagion, frenzy | second-wind, brace, cleanse | 40/5 |
| Sniper | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Ritualist | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Tempest | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Wavecrest | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 42/3 |
| Destroyer | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 39/6 |
| Zealot | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Dualslinger | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Idolwright | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 43/2 |
| Stormdancer | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Hemomancer | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 45/0 |
| Sunderer | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | defensive-stance | slam, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Cinder Lord | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Cannoneer | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Inquisitor | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 43/2 |
| Equinox | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Swiftblade | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Stalwart | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 43/2 |
| Wind Spirit | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Duelist | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Marshal | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 42/3 |
| Voidwalker | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Justicar | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Devout Priest | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | expose-weakness, quick-strike | second-wind, brace, cleanse, break-free, endure | 45/0 |
| Venomslinger | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Bounty hunter | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Covenanter | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 42/3 |
| Surge | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Juggernaut | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 42/3 |
| Assassin | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 39/6 |
| Pyromancer | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | defensive-stance | contagion, frenzy | second-wind, brace, cleanse | 40/5 |
| Melter | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | expose-weakness, quick-strike | second-wind, brace, cleanse, break-free, endure | 42/3 |
| Kilnmaster | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Stormbringer | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Shockblade | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 45/0 |
| Reverb | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | defensive-stance | slam, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Icebreaker | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Desperado | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Chorister | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 42/3 |
| Invoker | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Maestro | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Avenger | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 43/2 |
| Cultist | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Blunderbuss | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 42/3 |
| Champion | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 39/6 |
| Channeler | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 39/6 |
| Berserker | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Transcendant | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 45/0 |
| Firebrand | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | defensive-stance | contagion, frenzy | second-wind, brace, cleanse | 40/5 |
| Warmonger | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Iconoclast | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Aetherist | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Scrapper | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 42/3 |
| Dynamo | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 39/6 |
| Winter Warden | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Sniper | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Ritualist | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 43/2 |
| Tempest | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Wavecrest | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 45/0 |
| Destroyer | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | defensive-stance | slam, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Zealot | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Dualslinger | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Idolwright | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 42/3 |
| Stormdancer | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Hemomancer | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Sunderer | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 43/2 |
| Cinder Lord | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Cannoneer | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Inquisitor | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 42/3 |
| Equinox | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Swiftblade | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Stalwart | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 39/6 |
| Wind Spirit | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | defensive-stance | contagion, frenzy, expose-weakness | second-wind, brace, cleanse | 44/1 |
| Duelist | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Marshal | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 42/3 |
| Voidwalker | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Justicar | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 42/3 |
| Devout Priest | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | expose-weakness, quick-strike | second-wind, brace, cleanse, endure | 39/6 |
| Venomslinger | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Bounty hunter | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Covenanter | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Surge | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Juggernaut | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 45/0 |
| Assassin | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 39/6 |
| Pyromancer | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Melter | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | expose-weakness, quick-strike | second-wind, brace, cleanse, endure | 39/6 |
| Kilnmaster | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 43/2 |
| Stormbringer | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Shockblade | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Reverb | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 43/2 |
| Icebreaker | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Desperado | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Chorister | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 42/3 |
| Invoker | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Maestro | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Avenger | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 39/6 |
| Cultist | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Blunderbuss | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 45/0 |
| Champion | V | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Channeler | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Berserker | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 42/3 |
| Transcendant | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Firebrand | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Warmonger | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Iconoclast | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 43/2 |
| Aetherist | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Scrapper | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 45/0 |
| Dynamo | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | defensive-stance | slam, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Winter Warden | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Sniper | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Ritualist | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 42/3 |
| Tempest | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Wavecrest | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Destroyer | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 43/2 |
| Zealot | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Dualslinger | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Idolwright | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 42/3 |
| Stormdancer | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Hemomancer | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | offensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 40/5 |
| Sunderer | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 39/6 |
| Cinder Lord | V | volcanic-vest-t4 / volcanic-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Cannoneer | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Inquisitor | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 42/3 |
| Equinox | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Swiftblade | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 42/3 |
| Stalwart | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, endure | 39/6 |
| Wind Spirit | T | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 39/6 |
| Duelist | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Marshal | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Voidwalker | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Justicar | D | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, break-free | 45/0 |
| Devout Priest | V | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | sweep, expose-weakness | second-wind, brace, cleanse, endure | 40/5 |
| Venomslinger | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 42/3 |
| Bounty hunter | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Covenanter | T | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 43/2 |
| Surge | M | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy | second-wind, brace, cleanse, endure | 41/4 |
| Juggernaut | M | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | quick-strike, frenzy, expose-weakness | second-wind, brace, cleanse, endure | 45/0 |
| Assassin | V | volcanic-vest-t4 / volcanic-charm-t4 / mountain-boots-t4 | defensive-stance | slam, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |
| Pyromancer | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | quick-strike, frenzy, hamstring | second-wind, brace, cleanse, break-free | 45/0 |
| Melter | V | mountain-vest-t4 / mountain-charm-t4 / mountain-boots-t4 | defensive-stance | sweep, expose-weakness | second-wind, brace, cleanse, endure | 40/5 |
| Kilnmaster | D | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | power-strike, frenzy | second-wind, brace, cleanse, break-free | 42/3 |
| Stormbringer | V | mountain-vest-t4 / mountain-charm-t4 / desert-boots-t4 | defensive-stance | sweep, frenzy, expose-weakness | second-wind, brace, cleanse | 43/2 |

All ordinary items +4 and core/relic +0. RP headroom is assessed after defining offense and counterplay; optional Expose is added only if affordable. Channels also receive Endure where affordable. All stances are permanent paid base stances: no destinations, no fallback switch, no rites. Cleanse is not a Heat cleanse; Hamstring changes movement only.

## Fixed optional tail

- summoner-balanced-t3-c: change only relic to relic-hastebound-dial; Tundra and Mountain, seeds 101009/101033. Ritualist reconstruction frequency versus potency; no direct DPS multiplier inference.
- energy-balanced-t3-b: change only weapon to volcanic-eruption-lash; Tundra and Mountain, seeds 101009/101033. Stormbringer cadence versus empowered payload across four sequential strikes.
- energy-light-t3-b: change only weapon to graveyard-plague-axe; Tundra and Mountain, seeds 101009/101033. Surge medium cadence and dead swings versus slow high-Attack reference.
- energy-heavy-t3-c: change only weapon to graveyard-plague-axe; Tundra and Mountain, seeds 101009/101033. Tempest charge/extension opportunities versus slow weapon; whole weapon tradeoff.
- dot-heavy-t3-a: change only weapon to mountain-earthsunder-maul; Tundra and Mountain, seeds 101009/101033. Icebreaker slower heavier Attack versus maintaining direct-hit windows.
- reload-heavy-t3-a: change only core to core-tempered; Tundra and Mountain, seeds 101009/101033. Melter on-hit amplification versus general damage and owner HP.
- cooldown-balanced-t3-a: change only weapon to volcanic-eruption-lash; Tundra and Mountain, seeds 101009/101033. Reverb attacks bank next execution; faster delivery versus empowered weapon payload.

All other package fields, native initialization policy, seeds, caps, fixtures, ordered rules and paid abilities stay unchanged within each pair. One weapon change is a whole-weapon tradeoff, not an isolated Attack or APS treatment. Primary controls are not duplicated. Idolwright alternative omitted: the authorized revised primary is sufficient; there is no obligation to fill eight alternatives.

## Explicit limitations

- Melter uses the native nearest-in-range laser target selection, not dealer-first targeting. Its stationary exception omits Orbit; actual hazard and telegraph escape remain. No claim that its controller/dealer order matches the other Desert builds.
- All existing close/mid choices are preserved, including close Blunderbuss and Champion. No range search.
- Channel paths use armed adapters and omit wind-up casts; Melter omits Frenzy because its laser cadence is not ordinary APS.
- Tundra armor moving-stack behavior is not used. Swamp and Jungle supports remain lawful menu options but are not additional arms.
- Idolwright revised direction was expressly authorized in this task: medium Plague Axe + Equilibrium + useful Technique/Frenzy with durable support. No optimal-build claim or numerical verdict is made in preparation.
