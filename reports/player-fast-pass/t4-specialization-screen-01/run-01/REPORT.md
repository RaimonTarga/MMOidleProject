# T4 specialization screen 01 — completed run

Combat complete. Exactly 54 production paths, four packages per path and two seeds produced 432/432 completed observations. There were 178 death-classified terminals (99 player deaths in farm contexts and 79 bot deaths in boss contexts), with zero operational failures, omissions or not-run rows. This is a synthetic, economy-ineligible screen: it measures the sealed packages under the declared fixtures and does not certify live acquisition, economy progression or universal class balance.

Frozen execution source: 3b9067c4990fbbbd4c3a889414b0b33bf2c4d27e. Source tree SHA-256: 43cdc7c916b4467e3bc1f7156ae3dd1dafc90d7b07e56688e8cc8bbae51eb9a6.

The preparation packet and its 432/432 zero-tick qualification and exact receipt replay remain construction evidence, not combat evidence. The measured run used the unchanged frozen source, hitboxes SHA-256 08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83, Node v22.16.0, one worker, no retry and the declared caps/endpoints.

The fixed mastery table and build receipts remain in the preparation packet and compact run mirror. Historical catalogue recipes/build directions are inputs only; the current observations are the external run-01 results.

## Packages and encounter strategy

All contexts use Defensive Stance with persistent mitigation, Second Wind, Brace and Cleanse. Tundra adds native Break Free. Mountain adds native Endure as the declared tanking support while retaining telegraph escape; it does not reuse T3 cast timing. Its actual sequence is Titan Charge, conditional Earthshatter, delayed fault lines, then recovery. Wasteland prioritizes low-HP targets and repeated AoE alongside Expose Weakness for boss progress. Farming and boss worlds retain production ecology and scripts.

Medium Apprentice references use Plague Axe; Heavy uses Earthsunder Maul. Venomslinger, Cultist and Cinder Lord avoid an unsuitable Fully Afflicted Contagion rule because stacks auto-consume or have no ordinary cap; they use Sweep. Other Apprentice swarm packages copy owned DoTs with Contagion rather than consume them. Slam is gated by Surrounded, not cast automatically at a lone target. Channel/close exceptions omit Orbit; telegraph and hazard escape remain and can interrupt delivery. No Wait It Out, low-health Flee, extra life, pilot, automatic purchasing or performance-selected rescue is included.

Core/relic choices follow the inherited path mechanism. Equilibrium supplies +10% frequency/+10% potency; Colossus concentrates potency while sacrificing frequency/reconstruction; Hastebound favors repetition at a potency cost. Exact production passives/stats, ordered triggers, ability ranks, rule costs, paid ownership and unused RP are in `applied-build-details.json` and `qualification/resolved-builds.json`. Whole-package output cannot identify a class coefficient in isolation. Unused RP ranges from 1 to 14 and is not an assertion of exhaustive optimization.



## Verification and execution

Final checkout: D:\mmo-idle\t4-specialization-screen-01\source; packet: D:/mmo-idle/t4-specialization-screen-01/packet; publication checkout: D:/t4s1pub (never used for execution). The exact frozen verify command passed before launch: 432 cases, source, runtime and hitboxes verified.

The exact one-shot run completed with planned=432, completed=432, dead=178, failed=0, omitted=0, notRun=0. The terminal complete.json is present and the readback contains 432 result rows. No retry, reseal, repair, extra seed, extra cap or adaptive change was used.

Preparation qualification and receipt replay were 432/432 each with zero World ticks and exact receipt equality. They validate construction and provenance only. The raw external inventory contains 5,449 files totaling 2,269,526,634 bytes; every listed file matched its recorded size and SHA-256 during publication.

Focused checks and diff checks from preparation passed. Full test suite and browser play were not run. No deployment, develop integration or live/economy certification was performed.

## 54-path by four-context map

Cells show RP used / measured result pooled across the two seed-labelled rows for that identity/context. W is a full farm window, D is a terminal death (player-died in farms and bot-died in bosses), and K is an authoritative boss kill. Farm cells show observed kills at the 300,000/600,000 ms endpoints; death rows retain null endpoints. Boss cells show the median elapsed time among successful kills. The existing-evidence column is retained unchanged.


| Root / production specialization | Weapon | Core / relic | F1 Volcano | F2 Tundra | B1 Mountain | B2 Wasteland | Existing evidence |
|---|---|---|---|---|---|---|---|
| apprentice / Pyromancer (`dot-balanced-t3-a`) | graveyard-plague-axe | core-tempered / relic-equilibrium-shard | 41 / 2D; first kill 6.3s; endpoints null | 34 / 2W; 21/43.5 kills | 37 / 2K; kill 62.6s | 44 / 2D; no kill | Historical catalogue only; no current T4 result |
| apprentice / Firebrand (`dot-balanced-t3-b`) | graveyard-plague-axe | core-tempered / relic-equilibrium-shard | 41 / 2D; first kill 5.5s; endpoints null | 34 / 2W; 20/41 kills | 37 / 2K; kill 59.9s | 44 / 1K/1D; kill 62.7s | Historical catalogue only; no current T4 result |
| apprentice / Cinder Lord (`dot-balanced-t3-c`) | graveyard-plague-axe | core-tempered / relic-equilibrium-shard | 37 / 2D; first kill 6.8s; endpoints null | 34 / 2W; 23.5/47 kills | 37 / 2K; kill 48.3s | 40 / 1K/1D; kill 47.6s | Historical catalogue only; no current T4 result |
| apprentice / Icebreaker (`dot-heavy-t3-a`) | mountain-earthsunder-maul | core-tempered / relic-colossus-heart | 41 / 2D; first kill 11.7s; endpoints null | 34 / 2W; 6/12 kills | 37 / 2K; kill 75.9s | 44 / 2D; no kill | Historical catalogue only; no current T4 result |
| apprentice / Winter Warden (`dot-heavy-t3-b`) | mountain-earthsunder-maul | core-tempered / relic-colossus-heart | 41 / 2D; first kill 11.7s; endpoints null | 34 / 2W; 8.5/17.5 kills | 37 / 2K; kill 85.1s | 44 / 2D; no kill | Historical catalogue only; no current T4 result |
| apprentice / Wind Spirit (`dot-heavy-t3-c`) | mountain-earthsunder-maul | core-tempered / relic-colossus-heart | 38 / 2D; first kill 11.7s; endpoints null | 31 / 2W; 11/22 kills | 34 / 2K; kill 73.4s | 41 / 2D; no kill | Historical catalogue only; no current T4 result |
| apprentice / Venomslinger (`dot-light-t3-a`) | graveyard-plague-axe | core-accelerant / relic-hastebound-dial | 37 / 2D; first kill 6.5s; endpoints null | 34 / 2W; 20/39.5 kills | 37 / 2K; kill 68.6s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| apprentice / Cultist (`dot-light-t3-b`) | graveyard-plague-axe | core-accelerant / relic-equilibrium-shard | 37 / 2D; first kill 6.7s; endpoints null | 34 / 2W; 17.5/35 kills | 37 / 2K; kill 56.4s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| apprentice / Zealot (`dot-light-t3-c`) | graveyard-plague-axe | core-accelerant / relic-equilibrium-shard | 41 / 2D; first kill 6.5s; endpoints null | 34 / 2W; 17.5/37 kills | 37 / 2K; kill 77.8s | 44 / 2D; no kill | Historical catalogue only; no current T4 result |
| conduit / Marshal (`summoner-balanced-t3-a`) | jungle-deathfang-rapier | core-survivalist / relic-equilibrium-shard | 37 / 2D; first kill 9.3s; endpoints null | 34 / 2W; 10/20.5 kills | 37 / 2K; kill 261.8s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| conduit / Chorister (`summoner-balanced-t3-b`) | jungle-deathfang-rapier | core-survivalist / relic-equilibrium-shard | 37 / 2D; first kill 9.8s; endpoints null | 34 / 2W; 10.5/19.5 kills | 37 / 2K; kill 215s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| conduit / Ritualist (`summoner-balanced-t3-c`) | jungle-deathfang-rapier | core-survivalist / relic-equilibrium-shard | 37 / 2D; first kill 10.4s; endpoints null | 34 / 2W; 10/21.5 kills | 37 / 2K; kill 293.3s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| conduit / Covenanter (`summoner-heavy-t3-a`) | jungle-deathfang-rapier | core-survivalist / relic-colossus-heart | 37 / 2D; first kill 7s; endpoints null | 34 / 2W; 10.5/21 kills | 37 / 2K; kill 143.8s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| conduit / Champion (`summoner-heavy-t3-b`) | jungle-deathfang-rapier | core-survivalist / relic-colossus-heart | 34 / 2D; first kill 7s; endpoints null | 31 / 2W; 14/29 kills | 34 / 2K; kill 109.4s | 37 / 2D; no kill | Historical catalogue only; no current T4 result |
| conduit / Idolwright (`summoner-heavy-t3-c`) | jungle-deathfang-rapier | core-survivalist / relic-colossus-heart | 37 / 2D; first kill 6.7s; endpoints null | 34 / 2W; 1/2.5 kills | 37 / 2K; kill 111.7s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| conduit / Inquisitor (`summoner-light-t3-a`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 37 / 2D; first kill 6.7s; endpoints null | 34 / 2W; 13.5/27.5 kills | 37 / 2K; kill 190.2s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| conduit / Kilnmaster (`summoner-light-t3-b`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 37 / 2D; first kill 6.7s; endpoints null | 34 / 2W; 13/26.5 kills | 37 / 2K; kill 212.6s | 40 / 1K/1D; kill 110.9s | Historical catalogue only; no current T4 result |
| conduit / Iconoclast (`summoner-light-t3-c`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 37 / 2D; first kill 7.3s; endpoints null | 34 / 2W; 13.5/25.5 kills | 37 / 2K; kill 245.7s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| slinger / Bounty hunter (`reload-balanced-t3-a`) | jungle-deathfang-rapier | core-tempered / relic-equilibrium-shard | 37 / 2D; first kill 4.8s; endpoints null | 34 / 2W; 21.5/42 kills | 37 / 2K; kill 86s | 40 / 1K/1D; kill 78s | Historical catalogue only; no current T4 result |
| slinger / Blunderbuss (`reload-balanced-t3-b`) | jungle-deathfang-rapier | core-tempered / relic-equilibrium-shard | 34 / 2D; first kill 6.5s; endpoints null | 31 / 2W; 16/39 kills | 34 / 2K; kill 104.8s | 37 / 2D; no kill | Historical catalogue only; no current T4 result |
| slinger / Dualslinger (`reload-balanced-t3-c`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 37 / 2D; first kill 4s; endpoints null | 34 / 2W; 20/41.5 kills | 37 / 2K; kill 68s | 40 / 2K; kill 63.4s | Historical catalogue only; no current T4 result |
| slinger / Melter (`reload-heavy-t3-a`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 34 / 2D; first kill 3.6s; endpoints null | 31 / 2W; 29.5/57 kills | 34 / 2K; kill 30.6s | 37 / 1K/1D; kill 47.1s | Historical catalogue only; no current T4 result |
| slinger / Warmonger (`reload-heavy-t3-b`) | jungle-deathfang-rapier | core-tempered / relic-colossus-heart | 37 / 1W/1D; 50.5/46 kills | 34 / 2W; 10/20.5 kills | 37 / 2K; kill 63.4s | 40 / 2K; kill 65.8s | Historical catalogue only; no current T4 result |
| slinger / Cannoneer (`reload-heavy-t3-c`) | jungle-deathfang-rapier | core-tempered / relic-colossus-heart | 37 / 1W/1D; 40/61 kills | 34 / 2W; 18.5/37.5 kills | 37 / 2K; kill 65.8s | 40 / 2K; kill 76.1s | Historical catalogue only; no current T4 result |
| slinger / Duelist (`reload-light-t3-a`) | jungle-deathfang-rapier | core-tempered / relic-equilibrium-shard | 37 / 1W/1D; 67/127 kills | 34 / 2W; 19/39.5 kills | 37 / 2K; kill 69.2s | 40 / 2K; kill 69.4s | Historical catalogue only; no current T4 result |
| slinger / Desperado (`reload-light-t3-b`) | jungle-deathfang-rapier | core-tempered / relic-hastebound-dial | 37 / 1W/1D; 59/59 kills | 34 / 2W; 20.5/42 kills | 37 / 2K; kill 69s | 40 / 2K; kill 64.2s | Historical catalogue only; no current T4 result |
| slinger / Sniper (`reload-light-t3-c`) | mountain-earthsunder-maul | core-tempered / relic-equilibrium-shard | 40 / 2D; first kill 7.8s; endpoints null | 34 / 2W; 7.5/17 kills | 37 / 2K; kill 122.4s | 43 / 1K/1D; kill 135s | Historical catalogue only; no current T4 result |
| spirit / Equinox (`energy-balanced-t3-a`) | volcanic-eruption-lash | core-tempered / relic-equilibrium-shard | 37 / 2D; first kill 6.5s; endpoints null | 34 / 2W; 14/29.5 kills | 37 / 2K; kill 95.5s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| spirit / Stormbringer (`energy-balanced-t3-b`) | mountain-warmaul | core-tempered / relic-equilibrium-shard | 37 / 2D; first kill 13.3s; endpoints null | 34 / 2W; 5/11 kills | 37 / 2K; kill 190.8s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| spirit / Aetherist (`energy-balanced-t3-c`) | volcanic-eruption-lash | core-tempered / relic-equilibrium-shard | 37 / 2W; 65.5/124 kills | 34 / 2W; 14.5/31 kills | 37 / 2K; kill 72.8s | 40 / 1K/1D; kill 73.3s | Historical catalogue only; no current T4 result |
| spirit / Voidwalker (`energy-heavy-t3-a`) | volcanic-eruption-lash | core-tempered / relic-colossus-heart | 37 / 1W/1D; 62.5/134 kills | 34 / 2W; 21.5/44.5 kills | 37 / 2K; kill 50.4s | 40 / 1K/1D; kill 50.6s | Historical catalogue only; no current T4 result |
| spirit / Invoker (`energy-heavy-t3-b`) | volcanic-eruption-lash | core-tempered / relic-colossus-heart | 37 / 2D; first kill 6.5s; endpoints null | 34 / 2W; 17/37.5 kills | 37 / 2K; kill 64.4s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| spirit / Tempest (`energy-heavy-t3-c`) | mountain-earthsunder-maul | core-tempered / relic-colossus-heart | 40 / 2D; first kill 11.9s; endpoints null | 34 / 2W; 5.5/11 kills | 37 / 2K; kill 148s | 43 / 2D; no kill | Historical catalogue only; no current T4 result |
| spirit / Stormdancer (`energy-light-t3-a`) | jungle-deathfang-rapier | core-tempered / relic-equilibrium-shard | 37 / 2D; first kill 5s; endpoints null | 34 / 2W; 11.5/24 kills | 37 / 2K; kill 96.1s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| spirit / Surge (`energy-light-t3-b`) | mountain-earthsunder-maul | core-tempered / relic-equilibrium-shard | 40 / 2D; first kill 10.3s; endpoints null | 34 / 2W; 5/10 kills | 37 / 2K; kill 166.1s | 43 / 2D; no kill | Historical catalogue only; no current T4 result |
| spirit / Channeler (`energy-light-t3-c`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 34 / 2D; first kill 5.5s; endpoints null | 31 / 2W; 16/31.5 kills | 34 / 2K; kill 74.9s | 37 / 2D; no kill | Historical catalogue only; no current T4 result |
| squire / Reverb (`cooldown-balanced-t3-a`) | mountain-warmaul | core-arcanist / relic-equilibrium-shard | 37 / 2D; first kill 11.5s; endpoints null | 31 / 2W; 8/15.5 kills | 34 / 2K; kill 151.7s | 40 / 1K/1D; kill 117.5s | Historical catalogue only; no current T4 result |
| squire / Dynamo (`cooldown-balanced-t3-b`) | mountain-warmaul | core-arcanist / relic-equilibrium-shard | 37 / 2D; first kill 11.5s; endpoints null | 31 / 2W; 8.5/15.5 kills | 34 / 2K; kill 147.4s | 40 / 1K/1D; kill 111.5s | Historical catalogue only; no current T4 result |
| squire / Stalwart (`cooldown-balanced-t3-c`) | mountain-warmaul | core-arcanist / relic-equilibrium-shard | 37 / 2D; first kill 7.5s; endpoints null | 31 / 2W; 10.5/21.5 kills | 34 / 2K; kill 105.9s | 40 / 1K/1D; kill 93.5s | Historical catalogue only; no current T4 result |
| squire / Avenger (`cooldown-heavy-t3-a`) | mountain-warmaul | core-arcanist / relic-colossus-heart | 37 / 2D; first kill 13.6s; endpoints null | 31 / 2W; 11/23 kills | 34 / 2K; kill 73s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| squire / Destroyer (`cooldown-heavy-t3-b`) | mountain-warmaul | core-arcanist / relic-colossus-heart | 37 / 2D; first kill 4s; endpoints null | 31 / 2W; 10/21.5 kills | 34 / 2K; kill 75s | 40 / 2D; no kill | Historical catalogue only; no current T4 result |
| squire / Devout Priest (`cooldown-heavy-t3-c`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 34 / 2D; first kill 8.4s; endpoints null | 31 / 2W; 11/23.5 kills | 34 / 2K; kill 120s | 37 / 1K/1D; kill 118.3s | Historical catalogue only; no current T4 result |
| squire / Assassin (`cooldown-light-t3-a`) | jungle-deathfang-rapier | core-bruiser / relic-hastebound-dial | 34 / 2D; first kill 5.4s; endpoints null | 31 / 2W; 17.5/34.5 kills | 34 / 2K; kill 112s | 37 / 1K/1D; kill 74.7s | Historical catalogue only; no current T4 result |
| squire / Transcendant (`cooldown-light-t3-b`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / 2D; first kill 5.7s; endpoints null | 31 / 2W; 15.5/31.5 kills | 34 / 2K; kill 117.4s | 37 / 1K/1D; kill 73.5s | Historical catalogue only; no current T4 result |
| squire / Sunderer (`cooldown-light-t3-c`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / 1W/1D; 44/44 kills | 31 / 2W; 14/27.5 kills | 34 / 2K; kill 119.1s | 37 / 1K/1D; kill 84.9s | Historical catalogue only; no current T4 result |
| striker / Maestro (`cadence-balanced-t3-a`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / 2D; first kill 5s; endpoints null | 31 / 2W; 17.5/34.5 kills | 34 / 2K; kill 90.8s | 37 / 1K/1D; kill 66.5s | Historical catalogue only; no current T4 result |
| striker / Wavecrest (`cadence-balanced-t3-b`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / 2D; first kill 5s; endpoints null | 31 / 2W; 18/37.5 kills | 34 / 2K; kill 81.5s | 37 / 1K/1D; kill 50.7s | Historical catalogue only; no current T4 result |
| striker / Justicar (`cadence-balanced-t3-c`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / 2D; first kill 5.5s; endpoints null | 31 / 2W; 17/33.5 kills | 34 / 2K; kill 93.5s | 37 / 2D; no kill | Historical catalogue only; no current T4 result |
| striker / Berserker (`cadence-heavy-t3-a`) | mountain-warmaul | core-bruiser / relic-colossus-heart | 34 / 1W/1D; 25/25 kills | 31 / 2W; 12.5/26.5 kills | 34 / 2K; kill 123.2s | 37 / 2D; no kill | Historical catalogue only; no current T4 result |
| striker / Hemomancer (`cadence-heavy-t3-b`) | mountain-warmaul | core-bruiser / relic-colossus-heart | 34 / 2D; first kill 13.6s; endpoints null | 31 / 2W; 10/19 kills | 34 / 2K; kill 157.9s | 37 / 2D; no kill | Historical catalogue only; no current T4 result |
| striker / Juggernaut (`cadence-heavy-t3-c`) | mountain-warmaul | core-bruiser / relic-colossus-heart | 34 / 2D; first kill 13.6s; endpoints null | 31 / 2W; 9/18.5 kills | 34 / 2K; kill 142.6s | 37 / 2D; no kill | Historical catalogue only; no current T4 result |
| striker / Shockblade (`cadence-light-t3-a`) | jungle-deathfang-rapier | core-catalyst / relic-equilibrium-shard | 34 / 2D; first kill 5.2s; endpoints null | 31 / 2W; 17.5/37.5 kills | 34 / 2K; kill 101.7s | 37 / 2D; no kill | Historical catalogue only; no current T4 result |
| striker / Scrapper (`cadence-light-t3-b`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / 2D; first kill 4.8s; endpoints null | 31 / 2W; 18.5/36.5 kills | 34 / 2K; kill 82.6s | 37 / 1K/1D; kill 61.7s | Historical catalogue only; no current T4 result |
| striker / Swiftblade (`cadence-light-t3-c`) | jungle-deathfang-rapier | core-bruiser / relic-equilibrium-shard | 34 / 2D; first kill 4.8s; endpoints null | 31 / 2W; 19.5/38 kills | 34 / 2K; kill 87.7s | 37 / 1K/1D; kill 57.3s | Historical catalogue only; no current T4 result |



## Existing evidence and decision register

The published encounter-counterplay-01 report at source `7c3bf6bc0035feff0c0e432b4cda4a4e804281ad` was checked: 24/24 complete, 21 gameplay deaths, two Mountain kills, one ten-minute farm survivor, zero operational failures. These selected T2/T3 packages are context, never current T4 controls.

| Topic | Owner / status | Disposition or concrete pending decision |
|---|---|---|
| Spirit | Designer / adopted | Approved four-field patch retained once; no further tuning. |
| T2 Plains opening | Designer / unresolved, separate from T4 | Choose earlier reachable adds, reduced initial boss pressure, or a specified additional player defense. Brace failed before first add kill; unspent RP prevents claiming no legal solution. |
| T3 Jungle / first Volcano | Designer / unresolved | Retain Light Striker partial benefits; do not generalize to Apprentice. Specify intended setup or designer playtest if expected capability remains unclear. |
| T3 Apprentice Volcano | Command center / review, no new arm | Fully Afflicted Detonate resolved at 6.9/23.9/40.9 s and died at 47.7 s. Control reached Final Eruption at 61.8 s; Endure was active at its 62.2 s impact. Sweep removal plus changed Brace timing confounds the result. Reserved finishing burst remains distinct and untested. |
| Root Conduit | Designer / deferred | Retain 3,500 ms; no replacement number or inherited T4 treatment. Ability-firing work is separately identified at final source selection. |



## Execution results and interpretation

The run contract stayed fixed: seeds 101009/101033, 100 ms steps, 600,000 ms farm cap with 300,000/600,000 endpoints, 300,000 ms boss cap, first death or authoritative boss kill ends the life, and simultaneous terminal evidence is retained.

### Outcome matrix

| Seed | F1 Volcano | F2 Tundra | B1 Mountain | B2 Wasteland |
|---|---|---|---|---|
| 101009 | 50 player-died / 4 window-ended; endpoint median 61.5/92.5 kills | 54 window-ended; endpoint median 13/27.5 kills | 54 boss-killed; median 94.1s | 11 boss-killed / 43 bot-died; successful-kill median 67s |
| 101033 | 49 player-died / 5 window-ended; endpoint median 46/46 kills | 54 window-ended; endpoint median 14.5/29 kills | 54 boss-killed; median 94.5s | 18 boss-killed / 36 bot-died; successful-kill median 70.8s |

Across both seeds, F1 produced 9/108 full windows and 99/108 player deaths; F2 produced 108/108 full windows; B1 produced 108/108 boss kills; B2 produced 29/108 boss kills and 79/108 bot deaths. Farm endpoint medians are calculated only from rows with observed endpoints; B2 kill medians are calculated only from successful kills. A death-classified observation is a gameplay terminal, not an operational runner failure.

### Findings

1. Context pressure separated cleanly. B1 was uniformly killable in this screen, while B2 was the boss-side discriminator: 29/108 kills versus 79/108 bot deaths. F1 was the farm-side discriminator, with only 9/108 full-window survivors.
2. The screen contains healthy whole-package candidates without producing a class tier list. Slinger Duelist, Desperado, Warmonger and Cannoneer each recorded 4/4 boss kills across B1/B2 and at least one F1 survivor plus two F2 survivors across the two seeds.
3. Some whole packages were weak across multiple contexts. Conduit Iconoclast, Ritualist and Marshal each had 0/2 F1 survivors and 0/2 B2 kills; their B1 kills were near the 300-second cap for one or more paths. This is a package/context observation, not proof of a root coefficient defect.
4. Survival and throughput remain distinct. window-ended establishes survival to the farm cap and endpoint work, while post-death endpoints remain null. The endpoint and boss results should not be collapsed into a single pooled ranking or interpreted as economy progression.

### Immediate decisions

1. Retain this as the completed synthetic T4 specialization screen; make no automatic class, root-coefficient or numerical tuning change from this packet.
2. If follow-up work is authorized, use the healthy Slinger packages for targeted live/playtest or focused instrumentation and separately investigate F1 survival and B2 boss pressure; a new brief/arm is required.
3. Preserve the existing Root Conduit decision-register disposition (3,500 ms retained, replacement deferred) and do not infer a delivery or balance fix solely from these whole-package outcomes.

### Compact evidence and scope

Compact publication evidence is in this directory: REPORT.md, manifest.json, identity.json, seal.json, complete.json, results-summary.json, resolved-builds.json, applied-build-details.json, checks.json and publication-inventory.json. The runbook remains at ../t4-specialization-screen-01-preparation/LUNA_RUN.md.

Raw child artifacts and JSONL streams remain external at D:/mmo-idle/t4-specialization-screen-01/run-01; raw-inventory.json records the complete external inventory and was hash-verified. economyEligible=false; no live acquisition, deployment, browser or full-suite claim is made.
