# V1g — Plains coverage, Cave corrosion comparison, T2 progression

Status: in progress. This is the durable operator ledger for
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
| A — restore Plains question | 1 | Original kit snapshot; strict Plains Charm/Sweep/Second Wind entry | `20260913t085528z-striker-campaign-night-plains` — created, pre-launch validation passed | ready |
| B — Cave corrosion comparison | 6 | Original kit snapshot; sealed expose-wind/dual-guard order | `20260913t090242z-striker-campaign-night-cave-t1` — created, pre-launch validation passed | ready |
| C — six-class T2 screen | 6 | Synthetic clean T2 entry; no snapshot argument | `20260913t093354z-striker-t2-progression-squire` — created, pre-launch validation passed | ready |

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
