# V1g — Plains coverage, Cave corrosion comparison, T2 progression

Status: complete. The supervisor completed 2026-09-13T12:37:18.812Z
(14:37:18.812+02:00), and the durable cohort report was generated at
2026-09-13T12:38:00.314Z. This is the durable operator ledger for
`bot-balance-v1g-operator-packet.md`. Gameplay and balance remain frozen; this
report is evidence-only and no result is a 1x economy conclusion.

## Session ledger

| Field | Value |
|---|---|
| Frozen revision | `d836321279ef3fa4927f293326a5483928f54378` |
| Frozen source tree | `ba46f02929faa48147c3a926f89a724673113952` |
| Session started before first create | 2026-09-13T10:52:23.1194487+02:00 |
| Hard session deadline | 2026-09-13T16:22:23.1194487+02:00 |
| Worker ceiling | 4h45m across 13 planned runs |
| Operator checkout | `C:\Users\osaif\Documents\Claude\Projects\MMO idle` |
| Exact clean validation checkout | `C:\Users\osaif\AppData\Local\mmo-idle\validation\v1f-integrated` (clean, detached) |
| Preflight | PASS on the exact frozen revision; harness validation only |
| Docker capacity | PASS: three empty local bridge probes coexisted and were removed by exact name |

## Input provenance

Phases A and B use the same unchanged original Night 1 kit. Phase C is
independent and uses synthetic clean T2 entry, with no tier-entry snapshot.

| Input | Value |
|---|---|
| Original kit snapshot | `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t233824z-striker-campaign-night-kit-t1\runs\001-striker-campaign-night-kit-t1-intended-r01\artifacts\striker-campaign-night-kit-t1-intended-2026-09-12T23-41-10-399Z-56ff9ea2\snapshot-b.json` |
| Kit SHA-256 | `1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755` |
| Cave study | `docs/briefs/bot-balance-v1g-cave-study.json` from the clean frozen checkout |
| Cave study SHA-256 | `e8b2eb7bb1fdef11fc46bf209d29003cd0ac59535aca4e86f25be2cbe9ff7863` |
| Source state | Frozen revision; no imported boss clears for A/B; C synthetic clean T2 entry |

## Capacity probe

Docker server `29.5.2` was available. These uniquely named empty bridge
networks coexisted with zero containers and were then removed by exact name;
historical networks and storage were untouched.

| Probe | Network ID | Result |
|---|---|---|
| `mmo-v1g-capacity-20260913-1052-1` | `69c3bfa29f9649096609af7ff8f5032c8cae8e8d42323c480a60c82ce7688114` | bridge, local, 0 containers; removed |
| `mmo-v1g-capacity-20260913-1052-2` | `ca97ac4d43b62ce13512d7fed876518eff43620eafacb1616f4720f5d5271420` | bridge, local, 0 containers; removed |
| `mmo-v1g-capacity-20260913-1052-3` | `36e5477dabd7c85f82547760d39b4566a262b1ab72034770c509ca4b15432590` | bridge, local, 0 containers; removed |

## Phase ledger

| Phase | Planned runs | Entry/source rule | Manifest | Disposition |
|---|---:|---|---|---|
| A — restore Plains question | 1 | Original kit snapshot; strict Plains Charm/Sweep/Second Wind entry | `20260913t085528z-striker-campaign-night-plains` — created, pre-launch validation passed | complete |
| B — Cave corrosion comparison | 6 | Original kit snapshot; sealed expose-wind/dual-guard order | `20260913t090242z-striker-campaign-night-cave-t1` — created, pre-launch validation passed | complete |
| C — six-class T2 screen | 6 | Synthetic clean T2 entry; no snapshot argument | `20260913t093354z-striker-t2-progression-squire` — created, pre-launch validation passed | complete |

One worker and one active manifest are allowed. There is no global queue,
automatic retry, fast boss retry, manifest rewrite, state rewrite, edit,
winner selection, or unplanned work. Terminal records, interrupted slots, and
never-started slots will be reported separately; they may overlap when a stop
is serviced after a next slot has started.

### Phase A manifest sealing

Created and validated before the one launch:

| Field | Value |
|---|---|
| Manifest | `20260913t085528z-striker-campaign-night-plains` |
| Created | 2026-09-13T08:56:28.903Z (10:56:28.903+02:00) |
| Source revision/tree | `d836321279ef3fa4927f293326a5483928f54378` / `ba46f02929faa48147c3a926f89a724673113952` |
| Invocation source | clean detached `v1f-integrated`; dirty files excluded |
| Image | `mmo-idle-experiment:d836321279ef-165579c7`, `sha256:14579c4c9264a81889503aeb455c0be670c94db95675fbdcefaf30b22a1c6719` |
| Image labels | revision `d836321279ef3fa4927f293326a5483928f54378`; build `5b28ead05a36566174eee1e9` |
| Tooling/runtime hashes | `165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f` / `f9e52b969e7ba64240115d4b13a78674de1f6e4f94ca76f007901692d032d472` |
| Manifest hash | `d4a36b2d3033e413712ff0f7d063be656e5a16539720e4570ac9788af3e3bac7` (record matches `experiment.json`) |
| Input hash | `1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755` |
| Isolation/policy | `smoke-isolated`, one worker, `intended`, `fastBossRetry=false`, automatic retries `0` |
| Run cap | 1 queued run, `maxRunMs=900000`, reward multiplier `25`, full gauntlet |
| Route | `striker-campaign-night-plains-t1` |

### Phase A terminal result

The single Plains case was entry-valid, isolated, treatment-valid, and
completed normally. Profile/spawn validation checked `215` assertions with
zero failures; `night:plains:ready` was reached and the route completed
`20/20` steps.

| Run | Disposition | Build and entry | Guardians; boss attempt | Boss result and authoritative clear | Player HP samples during boss | Ability and combat scope |
|---|---|---|---|---|---|---|
| `striker-campaign-night-plains-t1-intended-2026-09-13T08-57-22-125Z-f62212f2` | `bot_completed`; victory | Axe +5, Plains Vest +5, Plains Charm +5, Plains Boots +5; Sweep/Second Wind; observed `19/22` RP | `12/12` in `41,528 ms`; attempt `215,155 ms`, boss combat `52,029 ms` | Terminal boss HP `0%`; named `Tusked Razorback` kill at `217,243 ms` has raw `isBoss=false`; boss-attempt victory plus authoritative progression `plains:1` | Max HP `179`; last `73.5636%` (`131.679`) at `216,588 ms`; lowest sampled `60.1261%` (`107.626`) at `212,586 ms` | Sweep 13, Second Wind 2; `28` kills, player damage `3,920`, damage taken `454` (`430` direct/`24` dot), healed `385`; top incoming boss `378` |

The final loadout retained the expected Plains Charm and all required +5 gear
assertions. Boss telemetry recorded `61` range-window samples with mean/max
distance `49.86/56.29`, adds mean/max `3.98/12`, no barrier or summon samples,
zero in-reach fraction, and `1.0` out-of-reach fraction. These aggregates
include non-boss periods and omit hitbox reach, so they are not evidence of a
boss-kiting or add-pressure failure. The case is eligible as a T1 gameplay
observation only; reward multiplier `25` keeps it noncanonical.

### Phase B manifest sealing

Created and validated before the one launch:

| Field | Value |
|---|---|
| Manifest | `20260913t090242z-striker-campaign-night-cave-t1` |
| Created | 2026-09-13T09:02:47.583Z (11:02:47.583+02:00) |
| Source revision/tree | `d836321279ef3fa4927f293326a5483928f54378` / `ba46f02929faa48147c3a926f89a724673113952` |
| Invocation source | clean detached `v1f-integrated`; dirty files excluded |
| Image | `mmo-idle-experiment:d836321279ef-165579c7`, `sha256:14579c4c9264a81889503aeb455c0be670c94db95675fbdcefaf30b22a1c6719` |
| Image labels | revision `d836321279ef3fa4927f293326a5483928f54378`; build `5b28ead05a36566174eee1e9` |
| Tooling/runtime hashes | `165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f` / `f9e52b969e7ba64240115d4b13a78674de1f6e4f94ca76f007901692d032d472` |
| Manifest hash | `84028e1307577f1d0207a1a1229a6504eea4c1bda1a46e437f8d65a57b1dbff6` (record matches `experiment.json`) |
| Study hash | `e8b2eb7bb1fdef11fc46bf209d29003cd0ac59535aca4e86f25be2cbe9ff7863` from the clean frozen checkout |
| Input hash | `1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755` |
| Isolation/policy | `smoke-isolated`, one worker, `intended`, `fastBossRetry=false`, automatic retries `0` |
| Run cap | 6 queued runs, `maxRunMs=900000`, reward multiplier `25`, full gauntlet |
| Sealed order | `1 expose-wind, 2 dual-guard, 3 dual-guard, 4 expose-wind, 5 expose-wind, 6 dual-guard` |
| Arm routes | expose-wind → `striker-campaign-night-cave-t1`; dual-guard → `striker-campaign-cave-dual-guard-t1` |

### Phase B terminal cases

The supervisor completed all six declared slots. Every case was isolated,
treatment-valid, profile/spawn-valid with `215` checks and zero failures, and
reached its exact arm marker with `19/19` route steps. All six were valid
gameplay losses (`bot_partial`), so the study continued through the final
slot without retrying or stopping.

| Slot | Arm and run | Guardians; boss attempt | Boss result and authoritative clear | Player HP samples during boss | Abilities and corrosion telemetry | Run-wide combat scope |
|---|---|---|---|---|---|---|
| 001 | Expose/Wind; `…9eb2af3e` | `3/3` in `67,539 ms`; attempt `219,123 ms`, boss combat `31,514 ms` | Terminal boss HP `30.6286%`; one authored death by `Obsidian Broodmother` (`isBoss=true`, 45 damage); no boss kill; progression empty | Max HP `179`; last and lowest sampled `0%` (`0`) at `222,570 ms`; authored death at `222,232 ms` | Expose Weakness 6, Second Wind 6; no Cleanse | `4` kills, player damage `2,797`, damage taken `1,185` (direct), healed `920`; top incoming boss `504` |
| 002 | Dual-Guard; `…9046520d` | `3/3` in `94,558 ms`; attempt `356,221 ms`, boss combat `31,018 ms` | Terminal boss HP `34.4%`; deaths by Cave Lurker (`isBoss=false`) and Obsidian Broodmother (`isBoss=true`, 45 damage); no boss kill; progression empty | Max HP `179`; last and lowest sampled `7.3302%` (`13.121`) at `357,588 ms` | Second Wind 6, Cleanse 3; actual `plating-shred` removed `3` | `9` kills, player damage `4,033`, damage taken `1,973` (direct), healed `1,492`; top incoming boss `499` |
| 003 | Dual-Guard; `…f2ce7f0c` | `3/3` in `92,567 ms`; attempt `244,672 ms`, boss combat `31,019 ms` | Terminal boss HP `36.7429%`; one authored death by `Obsidian Broodmother` (`isBoss=true`, 45 damage); no boss kill; progression empty | Max HP `179`; last and lowest sampled `7.9932%` (`14.308`) at `246,579 ms` | Second Wind 6, Cleanse 3; actual `plating-shred` removed `3` | `3` kills, player damage `2,405`, damage taken `1,171` (direct), healed `905`; top incoming boss `499` |
| 004 | Expose/Wind; `…eb61e029` | `3/3` in `67,539 ms`; attempt `219,143 ms`, boss combat `31,013 ms` | Terminal boss HP `29.9429%`; one authored death by `Obsidian Broodmother` (`isBoss=true`, 45 damage); no boss kill; progression empty | Max HP `179`; last and lowest sampled `11.3788%` (`20.368`) at `221,580 ms` | Expose Weakness 6, Second Wind 6; no Cleanse | `4` kills, player damage `2,465`, damage taken `1,055` (direct), healed `800`; top incoming boss `506` |
| 005 | Expose/Wind; `…b1f9026b` | `3/3` in `91,572 ms`; attempt `243,681 ms`, boss combat `31,020 ms` | Terminal boss HP `32.9714%`; one authored death by `Obsidian Broodmother` (`isBoss=true`, 45 damage); no boss kill; progression empty | Max HP `179`; last and lowest sampled `5.1251%` (`9.174`) at `245,572 ms` | Expose Weakness 6, Second Wind 6; no Cleanse | `3` kills, player damage `2,313`, damage taken `1,008` (direct), healed `753`; top incoming boss `504` |
| 006 | Dual-Guard; `…e75ee10f` | `3/3` in `93,072 ms`; attempt `245,204 ms`, boss combat `31,529 ms` | Terminal boss HP `36.7429%`; one authored death by `Obsidian Broodmother` (`isBoss=true`, 44 damage); no boss kill; progression empty | Max HP `179`; last and lowest sampled `14.1708%` (`25.366`) at `247,592 ms` | Second Wind 6, Cleanse 4; actual `plating-shred` removed `4` | `3` kills, player damage `2,182`, damage taken `1,065` (direct), healed `810`; top incoming boss `498` |

The final build observations matched the packet: Expose/Wind used Axe +5,
Mountain Vest +5, Swamp Charm +5, Plains Boots +5 with `20/22` RP; Dual-Guard
used the same gear with `16/22` RP. All three dual-arm Cleanse cases emitted
actual `plating-shred` removal telemetry; the Expose/Wind cases had no Cleanse
activations. Damage and healing above are run-wide, including guardians and
the boss; boss-only attribution is not inferred. Player last and lowest
sampled HP are kept separate from the authored death records. Boss telemetry
was:

| Slot | Range samples; mean/max distance | Adds mean/max |
|---|---|---|
| 001 | `49`; `52.54` / `62.36` | `1.44` / `3` |
| 002 | `54`; `53.44` / `61.77` | `1.40` / `3` |
| 003 | `54`; `56.52` / `63.63` | `1.40` / `3` |
| 004 | `49`; `55.96` / `64.20` | `1.50` / `3` |
| 005 | `52`; `55.64` / `62.13` | `1.42` / `3` |
| 006 | `52`; `56.12` / `62.97` | `1.41` / `3` |

All six recorded zero in-reach and `1.0` out-of-reach fraction in the sampled
range window, with no barrier or summon samples. These aggregates include
non-boss periods and omit hitbox reach, so they do not support boss-kiting or
add-pressure claims.

| Arm | Planned | Started | Valid gameplay | Victories | Boss deaths | Invalid/interrupted/unstarted |
|---|---:|---:|---:|---:|---:|---:|
| Expose/Wind | 3 | 3 | 3 | 0 | 3 | 0 |
| Dual-Guard | 3 | 3 | 3 | 0 | 3 | 0 |

The candidate valid-boss success fractions are `0/3` for both arms. V1f's
single Cave death remains excluded. No infrastructure, treatment, isolation,
summary, or evidence failure occurred, so Phase C may open even though neither
Cave arm won.

### Phase C manifest sealing

Created and validated after Phase B completed without an infrastructure or
treatment failure. This manifest intentionally has no T1 snapshot input:
`tierEntrySnapshot=null`, `entryEconomy=clean`, and synthetic clean T2 entry
are part of the sealed configuration.

| Field | Value |
|---|---|
| Manifest | `20260913t093354z-striker-t2-progression-squire` |
| Created | 2026-09-13T09:34:04.219Z (11:34:04.219+02:00) |
| Source revision/tree | `d836321279ef3fa4927f293326a5483928f54378` / `ba46f02929faa48147c3a926f89a724673113952` |
| Invocation source | clean detached `v1f-integrated`; dirty files excluded |
| Image | `mmo-idle-experiment:d836321279ef-165579c7`, `sha256:14579c4c9264a81889503aeb455c0be670c94db95675fbdcefaf30b22a1c6719` |
| Image labels | revision `d836321279ef3fa4927f293326a5483928f54378`; build `5b28ead05a36566174eee1e9` |
| Tooling/runtime hashes | `165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f` / `f9e52b969e7ba64240115d4b13a78674de1f6e4f94ca76f007901692d032d472` |
| Manifest hash | `67c37d93747f990897c68c48e9db105208bf31e4b9be342717efe0165fe51322` (record matches `experiment.json`) |
| Entry/input | synthetic clean T2 entry; no T1 snapshot supplied; `tierEntrySnapshot=null` |
| Isolation/policy | `smoke-isolated`, one worker, `intended`, `fastBossRetry=false`, automatic retries `0` |
| Run cap | 6 queued runs, `maxRunMs=1800000`, reward multiplier `25`, full gauntlet |
| Sealed route order | Striker, Squire, Apprentice, Slinger, Spirit, Conduit T2 progression routes |

## Phase C terminal screens

The supervisor completed all six declared slots in the sealed order. Every
run ended with the exact prescribed `run exceeded maxRunMs (1800000ms)`
terminal reason after about 30 minutes; no run was retried or extended.
Each bot log recorded a passing profile and spawn template gate with zero
errors and zero warnings. The summary objects leave `templateValidation`
null for these synthetic screens, so the validation counts below are taken
from the durable bot logs rather than being presented as summary fields.

All six summaries are `isolationGrade=isolated`,
`treatmentValidity=not-asserted`, `soloBaselineEligible=false`,
`combatEvidenceEligible=false`, and `economyEvidenceEligible=false`; they
retain `concurrencyCohortEligible=true` only for the pipeline/cohort record.
Every run is tainted `SYNTHETIC_TIER_ENTRY` and
`NON_CANONICAL_REWARD_MULTIPLIER`. The carried `bossesCleared` values are
entry state from the synthetic screen, not new boss-combat evidence.

Biome shorthand in the table is `P/F/S/M/C/Cl/J` for Plains, Forest, Swamp,
Mountain, Cave, Clearing, and Jungle. Loadout order is weapon / armor /
recovery / mobility / core / relic; `—` means absent.

| Order / class | Entry validation | Terminal and progress | Final levels / GM | Final loadout; T2 upgrades | Deaths / recovery | Resource block |
|---|---|---|---|---|---|---:|
| 001 Striker | `striker-t1-t2-entry-clean`; profile `120`, spawn `104`, both PASS | Capped; `75/129`; last `gm-60` | `P12 F12 S12 M12 C12 Cl4`; GM `60` | `gale-needle / plains-vest-t2 / plains-charm-t2 / plains-boots-t2 / — / —`; Plains Vest/Charm/Boots and Gale Needle `+2` | `11` Cave deaths: Cave Troll `8`, Giant Spider `3`; all at `craft core-tempered` | `1,140,286 ms` |
| 002 Squire | `squire-t1-t2-entry-clean`; profile `120`, spawn `104`, both PASS | Capped; `94/129`; last `cave-t2-leg-complete` | `P12 F12 S12 M12 C12 Cl4 J2`; GM `62` | `quake-hammer / mountain-vest-t2 / swamp-charm-t2 / plains-boots-t2 / core-tempered / —`; Plains Vest/Charm/Boots, Swamp Charm, Quake Hammer, Mountain Vest `+3` | `0` deaths | `811,194 ms` |
| 003 Apprentice | `apprentice-t1-t2-entry-clean`; profile `128`, spawn `105`, both PASS | Capped; `61/125`; last `mountain-t2-entered` | `P12 F12 S12 M11 C6 Cl4`; GM `53` | `swamp-mirebrand / swamp-vest-t2 / plains-charm-t2 / plains-boots-t2 / — / —`; Plains Vest/Charm/Boots, Swamp Mirebrand, Swamp Vest `+2` | `6`: Plains `1`, Swamp `1`, Mountain `4`; reconstruction/farm loops for Swamp Mirebrand and Quake Hammer | `829,152 ms` |
| 004 Slinger | `slinger-t1-t2-entry-clean`; profile `128`, spawn `105`, both PASS | Capped; `67/133`; last `skip:mountain-vest-t2` | `P12 F12 S12 M11 C6 Cl4`; GM `53` | `gale-needle / forest-vest-t2 / plains-charm-t2 / plains-boots-t2 / — / —`; Plains Vest/Charm/Boots, Gale Needle, Forest Vest `+2` | `4`: Plains `2`, Mountain `2`; reconstruction of Plains Vest and Mountain farming | `1,117,160 ms` |
| 005 Spirit | `spirit-t1-t2-entry-clean`; profile `121`, spawn `104`, both PASS | Capped; `59/133`; last `mountain-t2-entered` | `P12 F12 S12 M12 C6 Cl4`; GM `54` | `gale-needle / plains-vest-t2 / plains-charm-t2 / plains-boots-t2 / — / —`; Plains Vest/Charm/Boots and Gale Needle `+2` | `6` Mountain deaths: Stone Eagle `3`, Boulder Thrower `3`; all at Mountain Charm T2 reconstruction | `1,285,240 ms` |
| 006 Conduit | `conduit-t1-t2-entry-clean`; profile `121`, spawn `104`, both PASS | Capped; `55/120`; last `mountain-t2-entered` | `P12 F12 S12 M9 C6 Cl4`; GM `51` | `chaotic-axe / plains-vest-t2 / plains-charm-t2 / plains-boots-t2 / — / —`; Plains Vest/Charm/Boots `+2` | `4`: Plains `1`, Mountain `3`; one `learn defensive-stance`, three Quake Hammer reconstruction deaths | `831,107 ms` |

The transition traces were consistent with the last-progress fields: Striker
reached Cave entry and GM60; Squire reached Cave max/leg complete; Apprentice,
Slinger, Spirit, and Conduit reached Mountain entry, with the latter three
stopping before their next Mountain acquisition gates. The repeated recovery
loops are recorded as behavior evidence, not as balance verdicts:

| Class | Key acquisition/skip trace and last blocking step |
|---|---|
| Striker | T2 entry → Plains/Forest/Swamp/Mountain max and leg complete → Cave entry → GM60; skipped Knight Steelsword, Forest Vest, Thorn Needle, Swamp Mirebrand, Swamp Vest, and Quake Hammer; blocked at `craft core-tempered`. |
| Squire | T2 entry → Plains/Forest/Swamp/Mountain max and leg complete → Cave max and leg complete; skipped Knight Steelsword, Gale Needle, Forest Vest, Swamp Mirebrand, and Cave Vest; no death recovery loop. |
| Apprentice | T2 entry → Plains/Forest/Swamp max and leg complete → Mountain entry; acquired Swamp Mirebrand, then repeated Quake Hammer reconstruction below the +3 gate. |
| Slinger | T2 entry → Plains/Forest/Swamp max and leg complete → Mountain entry; skipped Knight Steelsword, Thorn Needle, Swamp Vest, Quake Hammer, and Mountain Vest; spent three deaths farming Mountain T2 to level 12. |
| Spirit | T2 entry → Plains/Forest/Swamp max and leg complete → Mountain entry; skipped Knight Steelsword and Swamp Mirebrand; all six deaths were Mountain Charm T2 reconstruction attempts. |
| Conduit | T2 entry → Plains/Forest/Swamp max and leg complete → Mountain entry; skipped Knight Steelsword, Forest Vest, and Swamp Mirebrand; one death at Defensive Stance and three at Quake Hammer reconstruction. |

Ability and class-mechanic telemetry is retained for implementation follow-up
only. Ability columns are Expose Weakness / Second Wind / Sweep / Cleanse.

| Class | Ability activations | Actual Cleanse removals | Class-specific telemetry |
|---|---|---|---|
| Striker | `64 / 33 / 50 / 4` | `antiheal 1`; `stalker-venom 6` | Step Back `13` activations: `4` success / `9` failure; damage received `1,148` |
| Squire | `83 / 23 / 49 / 5` | `hydra-venom 7` | Step Back `19`: `14` success / `5` failure; damage received `925` |
| Apprentice | `68 / 14 / 56 / 17` | `hydra-venom 3`; `stalker-venom 8`; `swamp-rot 6`; `antiheal 5` | Apprentice Sweep `27` secondary targets and `27` stacks; Step Back `3/3` success |
| Slinger | `46 / 15 / 39 / 4` | `stalker-venom 2`; `antiheal 1`; `hydra-venom 2` | Slinger Sweep: `39` clips, `755` shots, `593` splash hits, `612` splash damage |
| Spirit | `45 / 11 / 72 / 3` | `hydra-venom 1`; `antiheal 2` | Step Back `1` activation, discarded `1` |
| Conduit | `62 / 22 / 40 / 3` | `swamp-rot 2`; `stalker-venom 2` | Formation: `102` arms, mean eligible summons `3.15`, `303` deliveries, `18` shares lost, secondary damage `1,554`; Step Back `4/4` success |

The post-run cohort report recorded the same six cap reasons and no supervisor
or worker health failure. Its resource envelope was Striker `194.8 MiB /
51% CPU / 44.2 ms event-loop P99`, Squire `194.2 / 52.2 / 244.6`, Apprentice
`195.6 / 72.9 / 403.7`, Slinger `194.0 / 41.9 / 41.4`, Spirit `192.5 /
59.0 / 293.1`, and Conduit `201.4 / 63.5 / 274.7`.

### Durable C artifacts

The generated cohort report is:
`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t093354z-striker-t2-progression-squire/cohort-summary.json`.
The manifest state is:
`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t093354z-striker-t2-progression-squire/state.json`.
The per-run summaries are:

| Class | Durable summary |
|---|---|
| Striker | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t093354z-striker-t2-progression-squire/runs/001-striker-t2-progression-intended-r01/artifacts/striker-t2-progression-intended-2026-09-13T09-35-22-097Z-436a90af/summary.json` |
| Squire | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t093354z-striker-t2-progression-squire/runs/002-squire-t2-progression-intended-r01/artifacts/squire-t2-progression-intended-2026-09-13T10-05-44-055Z-35fea5b9/summary.json` |
| Apprentice | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t093354z-striker-t2-progression-squire/runs/003-apprentice-t2-progression-intended-r01/artifacts/apprentice-t2-progression-intended-2026-09-13T10-36-04-342Z-c1ce1f16/summary.json` |
| Slinger | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t093354z-striker-t2-progression-squire/runs/004-slinger-t2-progression-intended-r01/artifacts/slinger-t2-progression-intended-2026-09-13T11-06-24-286Z-6385cc72/summary.json` |
| Spirit | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t093354z-striker-t2-progression-squire/runs/005-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T11-36-45-904Z-4c8d7df1/summary.json` |
| Conduit | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t093354z-striker-t2-progression-squire/runs/006-conduit-t2-progression-intended-r01/artifacts/conduit-t2-progression-intended-2026-09-13T12-07-06-400Z-98f526d8/summary.json` |

C is therefore closed as six isolated progression screens finalized at the fixed
cap, with no ranking, tuning, canonical economy, solo-baseline, or new boss
conclusion authorized by this packet.



## Mandatory outcome classification

Do not stop because a worker phase or status is `failed`. Read the exact
terminal reason, summary, eligibility, and evidence first. A complete,
entry-valid, treatment-valid, isolated summary with `bot_partial` and one
authored boss death is a valid gameplay loss; record it and continue the other
predeclared cases. Valid farming timeouts/stalls also continue after
classification without extending budgets or retrying.

Stop for invalid entry/build/assertions, treatment or isolation failure, server
exit/unhealthy, worker exception, missing/lost summary or evidence, or
supervisor failure. If a worker is finalizing, wait for its normal terminal
artifact before classifying. If the next slot starts before a justified stop
is serviced, preserve it as interrupted. Never stop DB/Redis or unrelated
resources.

## Evidence contract

For every T1 boss case, record readiness, deaths, guardians, total-attempt and
boss-combat time, player and boss HP, named kill, authoritative boss-clear
progression, ability activations, and run-wide damage/healing scope. Keep last
HP separate from lowest sampled HP. The raw kill flag is hardcoded false and
entity IDs are not catalogue type IDs; boss-attempt result plus progression
and named boss corroborate a clear. Expected bosses are Tusked Razorback in
Plains and Obsidian Broodmother in Cave. Forest Sentinel, Stone Warden, and
Cave Sentinel are guardians.

For B, record Cleanse activations and actual removed `plating-shred` stacks if
emitted, alongside Second Wind. Missing effect telemetry stays missing; do
not infer that every Cleanse removed corrosion or every heal came from Second
Wind. Range/add aggregates include non-boss periods and the range metric omits
hitbox reach, so they cannot support boss-kiting or boss-add-pressure claims.

For C, record profile/frame/build validation, route acquisition transitions,
final biome/mastery/build/gear, upgrades, resource blocks, deaths/recovery,
and last progress. Distinguish the 30-minute cap from an internal stall or
invalid build acquisition. Each class is a progression screen, not a ranking
or canonical economy study.

No balance edits or T3/T4 tests are authorized. Keep low TTK in T3/T4 flagged
for later tuning and do not relabel repaired boss functionality as broken.
