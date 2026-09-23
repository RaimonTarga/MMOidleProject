# T4 specialization screen 01 — sealed preparation

**Preparation complete; combat unrun.** Exactly 54 production paths, four packages per path and two seeds: **432 planned lives**. All 432 final child receipts passed qualification and exact replay at the execution path, with **zero World ticks** enforced by tripwires. The 216 unique identity/context packages fit GM148/45 RP, ordinary +4 and core/relic +0. Give Luna `LUNA_RUN.md`; this report supplies the build map and interpretation context.

Frozen execution source: `3b9067c4990fbbbd4c3a889414b0b33bf2c4d27e`. Source tree SHA-256: `43cdc7c916b4467e3bc1f7156ae3dd1dafc90d7b07e56688e8cc8bbae51eb9a6`.

Recommended checkpoint: established T4, Mountain24, GM148, 45 RP. The fixed mastery table is in BRIEF.md, packet/manifest.json and applied-build-details.json. Trench0 grants no Trench ownership. Selected gear is paid through finite synthetic production-priced crafting/reconstruction/upgrade receipts, leaving zero initial purse. This proves assumed affordability, not acquisition time. Prior earned seals are explicitly assumed and production-validated: forest:1, mountain:1; plains:2, swamp:2, desert:2; cave:3, mountain:3, jungle:3, desert:3. These satisfy the 2/3/4-seal advancement gates without inventing T4 clears. No required item boss-clear gate is bypassed. Class purchases use production unlockSkill and fit the four earned class skill points; no scaffold points survive.

## Committed baseline and initialization

The user selected the committed Heat and Hamstring fixes. Heat commit `a3adb0b2cac11f3988c57a25f862e7d410b7a580` is already in the playtest baseline `80ecbd9d3188d9f2998a15da7e2212d1dd899b50`. Movement-only Hamstring from `6b7e5268fd3cae1200b52e38b40448d2920a43f4` was cherry-picked as `964ac7ed` into this experiment. Adopted Spirit `d073dc19c4f9df9c90b4661899d2454972b2c5b3` remains unchanged. No merge or deployment to develop occurred.

Heat adds a stack per 3,000 ms engaged exposure, with production accumulation modifiers. Effective damage stacks are linear through 10, then `10 + 5 * log1p((stacks - 10) / 5)`; each effective stack adds 3% outgoing and 4.5% incoming damage. Disengaged cooling is `3000 / max(1, stacks / 10)` ms per removed stack, subject to production floor/exit behavior. The later uncommitted doubling of cooling is excluded. Hamstring slows movement only and does not lengthen enemy attack cooldown.

Conduit uses the committed pre-in-progress ability-firing implementation and accepted formation/reconstruction tuning, including the original 3,500 ms root baseline. Concurrent local ability-firing work was not imported. Its exclusion is source provenance, not a claim that delivery fixes can never change observed output.

Benchmark support came separately from `7c3bf6bc0035feff0c0e432b4cda4a4e804281ad`. The only authoritative-code differences from reviewed develop are the committed Hamstring correction and the existing opt-in fixed-mastery bench support. No rejected combined class candidate or numerical treatment was imported.

T4 boss initialization uses production `tickDungeons` to spawn the boss after the accepted synthetic guard removal. It executes zero World ticks, in both qualification and the eventual measured child. Formation initialization and boss opening scripts occur during measurement. This avoids the legacy runner's unmeasured wake-up World tick. All qualification worlds have a tick tripwire; farm ecology and boss spawning are checked by the actual child. Guardian/travel acquisition is excluded.

## Verification and handoff

Final checkout: `D:/mmo-idle/t4-specialization-screen-01/source`; packet: `D:/mmo-idle/t4-specialization-screen-01/packet`. Qualification and receipt replay: 432/432 each, zero combat observations, exact matching `resolved-builds.json` SHA-256. Runtime Node v22.16.0; hitboxes SHA-256 `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`. `LUNA_RUN.md` has the verified preflight and unexecuted run command. The publication mirror at `D:/t4s1pub` is not an execution checkout.

Workspace/benchmark typechecks, focused abilityControl and ambientRamp tests, and diff checks passed. Final child qualification validates source identity, hitboxes, lawful purchase/readback, HP/barrier, fixture setup and zero ticks. Full test suite and browser play were not run; no combat balance result is claimed. `checks.json` and the terminal receipts retain this distinction.

## Packages and encounter strategy

All contexts use Defensive Stance with persistent mitigation, Second Wind, Brace and Cleanse. Tundra adds native Break Free. Mountain adds native Endure as the declared tanking support while retaining telegraph escape; it does not reuse T3 cast timing. Its actual sequence is Titan Charge, conditional Earthshatter, delayed fault lines, then recovery. Wasteland prioritizes low-HP targets and repeated AoE alongside Expose Weakness for boss progress. Farming and boss worlds retain production ecology and scripts.

Medium Apprentice references use Plague Axe; Heavy uses Earthsunder Maul. Venomslinger, Cultist and Cinder Lord avoid an unsuitable Fully Afflicted Contagion rule because stacks auto-consume or have no ordinary cap; they use Sweep. Other Apprentice swarm packages copy owned DoTs with Contagion rather than consume them. Slam is gated by Surrounded, not cast automatically at a lone target. Channel/close exceptions omit Orbit; telegraph and hazard escape remain and can interrupt delivery. No Wait It Out, low-health Flee, extra life, pilot, automatic purchasing or performance-selected rescue is included.

Core/relic choices follow the inherited path mechanism. Equilibrium supplies +10% frequency/+10% potency; Colossus concentrates potency while sacrificing frequency/reconstruction; Hastebound favors repetition at a potency cost. Exact production passives/stats, ordered triggers, ability ranks, rule costs, paid ownership and unused RP are in `applied-build-details.json` and `qualification/resolved-builds.json`. Whole-package output cannot identify a class coefficient in isolation. Unused RP ranges from 1 to 14 and is not an assertion of exhaustive optimization.

## 54-path by four-context map

Cells show **RP used / new result**. All new work, boss results and mechanic expression remain **not run**. Ordinary gear is T4 +4; supports +0. Full gear IDs are in the receipts. Historical catalogue recipes/build directions are inputs only, not new measurements.

| Root / production specialization | Weapon | Core / relic | F1 Volcano | F2 Tundra | B1 Mountain | B2 Wasteland | Existing evidence |
|---|---|---|---|---|---|---|---|
| apprentice / Pyromancer (`dot-balanced-t3-a`) | graveyard-plague-axe | core-tempered / relic-equilibrium-shard | 41 / not run | 34 / not run | 37 / not run | 44 / not run | Historical catalogue only; no current T4 result |
| apprentice / Firebrand (`dot-balanced-t3-b`) | graveyard-plague-axe | core-tempered / relic-equilibrium-shard | 41 / not run | 34 / not run | 37 / not run | 44 / not run | Historical catalogue only; no current T4 result |
| apprentice / Cinder Lord (`dot-balanced-t3-c`) | graveyard-plague-axe | core-tempered / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| apprentice / Icebreaker (`dot-heavy-t3-a`) | mountain-earthsunder-maul | core-tempered / relic-colossus-heart | 41 / not run | 34 / not run | 37 / not run | 44 / not run | Historical catalogue only; no current T4 result |
| apprentice / Winter Warden (`dot-heavy-t3-b`) | mountain-earthsunder-maul | core-tempered / relic-colossus-heart | 41 / not run | 34 / not run | 37 / not run | 44 / not run | Historical catalogue only; no current T4 result |
| apprentice / Wind Spirit (`dot-heavy-t3-c`) | mountain-earthsunder-maul | core-tempered / relic-colossus-heart | 38 / not run | 31 / not run | 34 / not run | 41 / not run | Historical catalogue only; no current T4 result |
| apprentice / Venomslinger (`dot-light-t3-a`) | graveyard-plague-axe | core-accelerant / relic-hastebound-dial | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| apprentice / Cultist (`dot-light-t3-b`) | graveyard-plague-axe | core-accelerant / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| apprentice / Zealot (`dot-light-t3-c`) | graveyard-plague-axe | core-accelerant / relic-equilibrium-shard | 41 / not run | 34 / not run | 37 / not run | 44 / not run | Historical catalogue only; no current T4 result |
| conduit / Marshal (`summoner-balanced-t3-a`) | jungle-deathfang-rapier | core-survivalist / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| conduit / Chorister (`summoner-balanced-t3-b`) | jungle-deathfang-rapier | core-survivalist / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| conduit / Ritualist (`summoner-balanced-t3-c`) | jungle-deathfang-rapier | core-survivalist / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| conduit / Covenanter (`summoner-heavy-t3-a`) | jungle-deathfang-rapier | core-survivalist / relic-colossus-heart | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| conduit / Champion (`summoner-heavy-t3-b`) | jungle-deathfang-rapier | core-survivalist / relic-colossus-heart | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| conduit / Idolwright (`summoner-heavy-t3-c`) | jungle-deathfang-rapier | core-survivalist / relic-colossus-heart | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| conduit / Inquisitor (`summoner-light-t3-a`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| conduit / Kilnmaster (`summoner-light-t3-b`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| conduit / Iconoclast (`summoner-light-t3-c`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| slinger / Bounty hunter (`reload-balanced-t3-a`) | jungle-deathfang-rapier | core-tempered / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| slinger / Blunderbuss (`reload-balanced-t3-b`) | jungle-deathfang-rapier | core-tempered / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| slinger / Dualslinger (`reload-balanced-t3-c`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| slinger / Melter (`reload-heavy-t3-a`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| slinger / Warmonger (`reload-heavy-t3-b`) | jungle-deathfang-rapier | core-tempered / relic-colossus-heart | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| slinger / Cannoneer (`reload-heavy-t3-c`) | jungle-deathfang-rapier | core-tempered / relic-colossus-heart | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| slinger / Duelist (`reload-light-t3-a`) | jungle-deathfang-rapier | core-tempered / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| slinger / Desperado (`reload-light-t3-b`) | jungle-deathfang-rapier | core-tempered / relic-hastebound-dial | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| slinger / Sniper (`reload-light-t3-c`) | mountain-earthsunder-maul | core-tempered / relic-equilibrium-shard | 40 / not run | 34 / not run | 37 / not run | 43 / not run | Historical catalogue only; no current T4 result |
| spirit / Equinox (`energy-balanced-t3-a`) | volcanic-eruption-lash | core-tempered / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| spirit / Stormbringer (`energy-balanced-t3-b`) | mountain-warmaul | core-tempered / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| spirit / Aetherist (`energy-balanced-t3-c`) | volcanic-eruption-lash | core-tempered / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| spirit / Voidwalker (`energy-heavy-t3-a`) | volcanic-eruption-lash | core-tempered / relic-colossus-heart | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| spirit / Invoker (`energy-heavy-t3-b`) | volcanic-eruption-lash | core-tempered / relic-colossus-heart | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| spirit / Tempest (`energy-heavy-t3-c`) | mountain-earthsunder-maul | core-tempered / relic-colossus-heart | 40 / not run | 34 / not run | 37 / not run | 43 / not run | Historical catalogue only; no current T4 result |
| spirit / Stormdancer (`energy-light-t3-a`) | jungle-deathfang-rapier | core-tempered / relic-equilibrium-shard | 37 / not run | 34 / not run | 37 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| spirit / Surge (`energy-light-t3-b`) | mountain-earthsunder-maul | core-tempered / relic-equilibrium-shard | 40 / not run | 34 / not run | 37 / not run | 43 / not run | Historical catalogue only; no current T4 result |
| spirit / Channeler (`energy-light-t3-c`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| squire / Reverb (`cooldown-balanced-t3-a`) | mountain-warmaul | core-arcanist / relic-equilibrium-shard | 37 / not run | 31 / not run | 34 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| squire / Dynamo (`cooldown-balanced-t3-b`) | mountain-warmaul | core-arcanist / relic-equilibrium-shard | 37 / not run | 31 / not run | 34 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| squire / Stalwart (`cooldown-balanced-t3-c`) | mountain-warmaul | core-arcanist / relic-equilibrium-shard | 37 / not run | 31 / not run | 34 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| squire / Avenger (`cooldown-heavy-t3-a`) | mountain-warmaul | core-arcanist / relic-colossus-heart | 37 / not run | 31 / not run | 34 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| squire / Destroyer (`cooldown-heavy-t3-b`) | mountain-warmaul | core-arcanist / relic-colossus-heart | 37 / not run | 31 / not run | 34 / not run | 40 / not run | Historical catalogue only; no current T4 result |
| squire / Devout Priest (`cooldown-heavy-t3-c`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| squire / Assassin (`cooldown-light-t3-a`) | jungle-deathfang-rapier | core-bruiser / relic-hastebound-dial | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| squire / Transcendant (`cooldown-light-t3-b`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| squire / Sunderer (`cooldown-light-t3-c`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| striker / Maestro (`cadence-balanced-t3-a`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| striker / Wavecrest (`cadence-balanced-t3-b`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| striker / Justicar (`cadence-balanced-t3-c`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| striker / Berserker (`cadence-heavy-t3-a`) | mountain-warmaul | core-bruiser / relic-colossus-heart | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| striker / Hemomancer (`cadence-heavy-t3-b`) | mountain-warmaul | core-bruiser / relic-colossus-heart | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| striker / Juggernaut (`cadence-heavy-t3-c`) | mountain-warmaul | core-bruiser / relic-colossus-heart | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| striker / Shockblade (`cadence-light-t3-a`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| striker / Scrapper (`cadence-light-t3-b`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |
| striker / Swiftblade (`cadence-light-t3-c`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / not run | 31 / not run | 34 / not run | 37 / not run | Historical catalogue only; no current T4 result |

## Existing evidence and decision register

The published encounter-counterplay-01 report at source `7c3bf6bc0035feff0c0e432b4cda4a4e804281ad` was checked: 24/24 complete, 21 gameplay deaths, two Mountain kills, one ten-minute farm survivor, zero operational failures. These selected T2/T3 packages are context, never current T4 controls.

| Topic | Owner / status | Disposition or concrete pending decision |
|---|---|---|
| Spirit | Designer / adopted | Approved four-field patch retained once; no further tuning. |
| T2 Plains opening | Designer / unresolved, separate from T4 | Choose earlier reachable adds, reduced initial boss pressure, or a specified additional player defense. Brace failed before first add kill; unspent RP prevents claiming no legal solution. |
| T3 Jungle / first Volcano | Designer / unresolved | Retain Light Striker partial benefits; do not generalize to Apprentice. Specify intended setup or designer playtest if expected capability remains unclear. |
| T3 Apprentice Volcano | Command center / review, no new arm | Fully Afflicted Detonate resolved at 6.9/23.9/40.9 s and died at 47.7 s. Control reached Final Eruption at 61.8 s; Endure was active at its 62.2 s impact. Sweep removal plus changed Brace timing confounds the result. Reserved finishing burst remains distinct and untested. |
| Root Conduit | Designer / deferred | Retain 3,500 ms; no replacement number or inherited T4 treatment. Ability-firing work is separately identified at final source selection. |

## Execution/reporting contract

Two seeds 101009/101033; 100 ms steps; farm caps 600,000 ms with 300,000/600,000 endpoints; bosses 300,000 ms. First death or authoritative kill ends the life, retaining simultaneous terminals. One child, no retry, fixed broad-coverage-first order. Disk floor 5 GiB, host free memory 1 GiB, child RSS ceiling 2 GiB, 5-second polling and 120-second advancing-heartbeat watchdog remain.

Luna must report lifetime completed kills, equal-checkpoint work, first-kill delay and no-progress periods; retain post-death endpoints as null. Boss HP progress, adds, owner HP and barrier stay separate. Existing event/guard/summon streams can establish opportunities and observed expression; exclusive attribution remains unavailable where the recorder cannot provide it. Two identical seed-labelled boss outcomes are duplicate scenario exposure, not independent robustness. Final report: at most five findings and three immediate decisions, no pooled class tier list or automatic tuning.

Preparation counts: planned **432**, completed **0**, dead **0**, operational combat failures **0**, omitted **0**, not run **432**. Unique package construction: **216/216**; final child qualification **432/432**; exact receipt replay **432/432**, all zero World ticks. No main combat, deployment or develop integration performed.
