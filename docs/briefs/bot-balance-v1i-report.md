# V1i — prepared T2 boss coverage

Status: complete. The three sequential supervisors started and reached a
terminal artifact for all eight declared slots by
2026-09-13T17:23:46.555Z (19:23:46.555+02:00). This is the durable operator
ledger for bot-balance-v1i-operator-packet.md. Gameplay and balance remained
frozen. Reward multiplier 25 and synthetic/prepared T2 entry make these
noncanonical observations; they are not economy evidence or a balance verdict.

The useful result is two-part. Phase A closed both V1h wrong-resource
progression gates with the corrected selector and reached GM72/all T2 maxed.
Phase B produced two valid prepared-Plains Axe victories and two valid
Gale-Needle boss deaths. Phase C produced two valid prepared-Forest Axe
victories. No automatic follow-on, T3/T4 work, balance edit, retry, extension,
or fast boss retry was used.

## Session ledger

| Field | Value |
|---|---|
| Frozen revision | 61080e54b2849857055b76a9b4f6d058f40e577d |
| Frozen source tree | 4abc6784a7e796aa7cd81c0e6f76ea8206844425 |
| Operator session timestamp | 2026-09-13T18:07:34.1069811+02:00, recorded at the preflight boundary after isolated checkout setup |
| Hard session deadline | 2026-09-13T22:07:34.1069811+02:00 |
| Worker ceiling | 3h00m ceiling; one worker and one active manifest |
| Operator checkout | C:/Users/osaif/Documents/Claude/Projects/MMO idle |
| Exact clean validation checkout | C:/Users/osaif/AppData/Local/mmo-idle/validation/v1i-integrated, detached, clean |
| Preflight | Final PASS on the exact frozen revision; tooling and harness validation only |
| Planned / started / terminal | 8 / 8 / 8 |
| Session disposition | complete; no unstarted slots, supervisor failure, worker exception, infrastructure stop, treatment stop, or evidence-loss stop |

The timestamp was recorded conservatively at the preflight boundary; no
experiment manifest was created before it. The clean validation checkout
resolved to the frozen revision and tree above at final audit.

## Input provenance

The packet required the V1h prepared-T2 direction and explicitly prohibited
repairing or relabelling its input. The V1h Spirit Snapshot B was copied
unchanged into each prepared-T2 manifest.

| Input | Value |
|---|---|
| Assessment read before execution | C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-v1h-assessment.md |
| Operator study | C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-v1i-plains-study.json |
| Operator study SHA-256 | 8f99b1322cfb92f4bd3e59eb2884e22496053e09ea278e7a7e8030d2c5973901 |
| Frozen validation study SHA-256 | 6d816f765dd9d8ae59423d9b6922b74345787402203bf37f825e47dd3619e037 |
| Study normalization | Equal after line-ending normalization; the frozen arm order was axe, needle, needle, axe |
| Spirit source Snapshot B | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json |
| Spirit source Snapshot B SHA-256 | 4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6 |
| Source snapshot state | GM72, Tier 2, prepared-t2 handoff, no current-tier boss clear, canonicalAtCapture false |
| Phase A entry | Synthetic clean T2 entry; no tier-entry snapshot |

The prepared source retained its spend skill point/root/frame and strict
tier-entry checks. HP and cooldowns reset normally. No validation bypass,
manual boss clear, item injection, or snapshot relabelling was used.

## Preparation and frozen runtime

The first isolated preflight attempt stopped at a missing package-local
typescript executable because the initial frozen offline install had not
materialized package-local node_modules. This was repaired only in the
isolated validation checkout with a forced frozen offline install
(pnpm --filter bot exec tsc --version returned 5.9.3). The final
pnpm bot:preflight passed all required build, entry, harness, profile,
loadout, route, study, timeline, pairing, calibration, snapshot, and semantic
gates, including:

campaignT2Boss: ok (resource selection, reselection and declared boss routes)

The setup failure created no experiment ID, run, or gameplay artifact and is
not experiment evidence.

| Field | Value |
|---|---|
| Docker server | 29.5.2 |
| Image | mmo-idle-experiment:61080e54b284-165579c7 |
| Image digest | sha256:8394942b4978001d8cf5d18c69a50bf167362ec523dad010a40ea30da16b0a87 |
| Image build ID | efd4e950683264440bc201a2 |
| Tooling hash | 165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f |
| Runtime hash | f9e52b969e7ba64240115d4b13a78674de1f6e4f94ca76f007901692d032d472 |
| Docker build note | warning only: SecretsUsedInArgOrEnv AUTH_DEV_BYPASS |
| Runtime write fix | frozen atomic JSON writer verified with EPERM/EACCES/EBUSY retry through attempt 20 |
| Experiment controls | smoke-isolated, one worker, rewardMultiplier 25, automaticRetries 0, fastBossRetry false |

Historical V1h Postgres/Redis receipt containers were not resumed or removed.
V1i used fresh experiment-prefixed resources. At final audit each V1i network
was a local bridge with its Postgres and Redis pair still running and healthy;
worker containers were terminal and no active worker remained.

### Capacity probes

The three temporary probes were uniquely named, confirmed as empty local
bridge networks, and removed by exact ID before manifest creation.

| Probe | Network/container ID | Result |
|---|---|---|
| mmo-v1i-capacity-20260913-181057-1 | c5a9a36d96662e169a8b689dff286f9d3eea49ced575c2d37befbca9053e34a3 | bridge, local, 0 containers; removed |
| mmo-v1i-capacity-20260913-181057-2 | fc42113268e4a93683d4c24cbc8798c5e74b2647597592d9da3d43276d9a3f63 | bridge, local, 0 containers; removed |
| mmo-v1i-capacity-20260913-181057-3 | 168558fd4baca6dbd4d9d220d88d674d0b16565a9fc39d8f5a16ded643542dba | bridge, local, 0 containers; removed |

## Manifest ledger

Each manifest was created once and launched once. The manifest hash is the
SHA-256 of the durable experiment.json after creation.

| Phase | Manifest; created | Supervisor | Sealed configuration | Manifest SHA-256 | Terminal |
|---|---|---|---|---|---|
| A — corrected resource routes | 20260913t161141z-striker-t2-progression-squire; 2026-09-13T16:13:12.429Z | PID 2388; 16:14:09.501Z–16:53:18.640Z | smoke-isolated, one worker, Striker/Squire routes, clean synthetic T2, maxRunMs 1800000, reward 25, intended, count 1, no retries | 8444c02c92494c45cbc2692ebe8bcadee4040141906290a2da5d9bb1e2f086cc | completed 2/2 |
| B — prepared Plains study | 20260913t165614z-spirit-campaign-plains-ruinous; 2026-09-13T16:56:23.673Z | PID 44884; 16:57:10.955Z–17:14:01.964Z | smoke-isolated, one worker, prepared snapshot, sealed axe/needle study, maxRunMs 1200000, reward 25, count 2, no retries | 36476ac793e974bd8cdd57bfc76b8be6c4eb9be9d0bc322d30b1698e54453f59 | completed 4/4; 2 bot_completed, 2 bot_partial |
| C — prepared Forest coverage | 20260913t171504z-spirit-campaign-forest-ruinous; 2026-09-13T17:15:13.052Z | PID 34256; 17:15:47.966Z–17:23:46.555Z | smoke-isolated, one worker, prepared snapshot, Ruinous Axe route, maxRunMs 1200000, reward 25, count 2, no retries | 3ba3abb20e793de8383721ed54ffa3ad284e70bb98a50da19eb77d1c73400330 | completed 2/2 |

Status failed on the two Needle rows is the supervisor's normal
bot_partial terminal state after a valid boss death. It was not an
infrastructure, treatment, or evidence failure.

## Phase A — corrected T2 resource selection

Phase A used fresh synthetic T2 entry for the Striker and Squire authored
routes. Both profiles passed 224 profile/spawn assertions. The target was to
reproduce the V1h wrong-resource blocks and verify that the corrected
resource selector and reselection close them; no T2 boss was authorized.

| Slot | Terminal; progress | Target block and selector evidence | Closure and final state |
|---|---|---|---|
| 001 Striker | completed/bot_completed; 116/129; GM72; last gm-72-all-t2-maxed | upgrade:ruinous-axe+4; node-t2-cave-01; red 137 / required 287, missing 150; 647312→777416 ms. Reselected jungle-03 dominion, jungle-02 swarming, desert-03 dominion, swamp-03 swarming, then cave-01 alacrity. | Missing became empty; upgrade 3→4 at 777417 ms, spent red 287 and swarming 1. Final Ruinous Axe / Cave Vest T2 / Plains Charm T2 / Plains Boots T2 / Tempered Core; no T2 boss. |
| 002 Squire | completed/bot_completed; 115/129; GM72; last gm-72-all-t2-maxed | upgrade:mountain-vest-t2+4; node-t2-mountain-01; blue 115 / required 276, missing 161; 924069→984127 ms. Reselected jungle-03 dominion, then mountain-01 heavy. | Missing became empty; upgrade 3→4 at 984128 ms, spent blue 276 and heavy 1. Final Quake Hammer / Mountain Vest T2 / Swamp Charm T2 / Plains Boots T2 / Tempered Core; no T2 boss. |

### A wallet evidence

| Class | Essence wallet before → after | Catalyst wallet before → after |
|---|---|---|
| Striker | red 137, blue 750, green 264, yellow 775, purple 1162 → red 558, blue 750, green 416, yellow 775, purple 1162 | alacrity 15, heavy 9, swarming 21, dominion 1, fortified 17 → alacrity 20, heavy 9, swarming 23, dominion 1, fortified 17 |
| Squire | red 329, blue 115, green 827, yellow 1649, purple 1384 → red 329, blue 390, green 1019, yellow 1649, purple 1384 | alacrity 13, heavy 14, swarming 26, dominion 2, fortified 23 → alacrity 13, heavy 17, swarming 26, dominion 2, fortified 26 |

Both known V1h target gates closed and both routes reached GM72/all T2
maxed. These are synthetic progression diagnostics, not canonical
acquisition timing, economy, or boss-readiness evidence.

## Phase B — prepared Plains boss study

Both arms used the same prepared Spirit package except for weapon:
Ruinous Axe +5 versus Gale Needle +5; Cave Vest +5, Mountain Charm +5,
Plains Boots +5, Tempered Core, defensive stance, Expose Weakness plus
Second Wind, the ordered orbit/Step Back/avoid-hazards/wait-for-regen rules,
and 29/30 RP. Each run reached its exact ready marker and the prepared
snapshot was independently copied with SHA-256
4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6.

Every run emitted a 12-guardian dungeon phase with
guardianTotal 12 and guardianAlive 0 at the cleared end event. The aggregate
ordinary guardian names include Prairie Defender; exact per-guardian
attribution is not emitted.

### B terminal run ledger

The timing tuple is pre-wrapper-to-guardian, guardian duration, named-boss
combat duration, and total boss-attempt duration. These clocks are kept
separate.

| Slot / arm | Run ID | Terminal; marker | Timing ms | HP samples; boss HP | Authoritative outcome |
|---|---|---|---|---|---|
| 001 Axe r1 | spirit-campaign-plains-ruinous-axe-t2-intended-2026-09-13T16-57-20-166Z-441434fa | completed/bot_completed; 35/35; v1i:spirit:plains:ruinous-axe:ready | 115161 / 53044 / 57056 / 235272 | sampled lowest/last 37.7797% / 37.7797%; Snapshot B 87.271080/231; terminal boss 0% | Gorging Razortusk victory; progression plains:2 |
| 002 Needle r1 | spirit-campaign-plains-gale-needle-t2-intended-2026-09-13T17-01-41-697Z-41c5ffbe | failed/bot_partial; 35/35; v1i:spirit:plains:gale-needle:ready | 126642 / 58058 / 33042 / 225752 | sampled lowest/last 17.3870% / 17.3870%; no Snapshot B after death; terminal boss 56.45% | Gorging Razortusk death; no plains:2 clear |
| 003 Needle r2 | spirit-campaign-plains-gale-needle-t2-intended-2026-09-13T17-05-55-158Z-ab9ca599 | failed/bot_partial; 35/35; v1i:spirit:plains:gale-needle:ready | 122139 / 59049 / 23568 / 214267 | sampled lowest/last 0% / 0%; no Snapshot B after death; terminal boss 70.4% | Gorging Razortusk death; no plains:2 clear |
| 004 Axe r2 | spirit-campaign-plains-ruinous-axe-t2-intended-2026-09-13T17-09-56-482Z-988ced2c | completed/bot_completed; 35/35; v1i:spirit:plains:ruinous-axe:ready | 114251 / 46101 / 58561 / 228431 | sampled lowest/last 18.6810% / 52.5408%; Snapshot B 133.381180/231; terminal boss 0% | Gorging Razortusk victory; progression plains:2 |

Player HP samples are concurrency-sample telemetry, not a complete
per-damage-event series. Snapshot B is reported separately from those
samples. The two Axe summaries were treatment-valid isolated packages; the
two Needle summaries were also treatment-valid isolated packages despite
their normal valid-death bot_partial terminal state. All four were tainted
SYNTHETIC_TIER_ENTRY and NON_CANONICAL_REWARD_MULTIPLIER, with
combatEvidenceEligible false and economyEvidenceEligible false.

### B abilities and run-wide combat

Damage, healing, and ability counts below are run-wide and include ordinary
farming, guardians, and the boss. The boss-target damage entry is the
run-wide damagePerTarget aggregate, not a boss-only combat interval.

| Slot | Abilities | Counterplay | Run-wide combat |
|---|---|---|---|
| Axe r1 | Sweep 16, Expose Weakness 8, Second Wind 3 | Step Back 0; no Brace or Cleanse telemetry | 44 kills; player damage 14566; taken 363.28; absorbed 372.72; healed 623.72; top incoming Razortusk 354.28; Razortusk damage aggregate 4048 |
| Needle r1 | Sweep 13, Expose Weakness 7, Second Wind 2 | Step Back 0; no Brace or Cleanse telemetry | 24 kills; player damage 7354; taken 394.12; absorbed 354.88; healed 522.88; top incoming Razortusk 388.12; Razortusk damage aggregate 1742 |
| Needle r2 | Sweep 10, Expose Weakness 6, Second Wind 1 | Step Back 0; no Brace or Cleanse telemetry | 28 kills; player damage 7771; taken 330; absorbed 259; healed 347; top incoming Razortusk 328; Razortusk damage aggregate 1210 |
| Axe r2 | Sweep 15, Expose Weakness 8, Second Wind 4 | Step Back 0; no Brace or Cleanse telemetry | 51 kills; player damage 17947; taken 414.62; absorbed 477.38; healed 833.38; top incoming Razortusk 406.07; Razortusk damage aggregate 4082 |

No B/C event emitted an Energy, empowered, charge, or dead-swing field.
No frequency, empowerment, charge-hit, or dead-swing conclusion is inferred.
The raw boss kill record used monsterTypeId
node-t2-plains-dungeon_monster-13 and reported isBoss=false; the named
boss summary, boss-attempt outcome, and progression plains:2 are retained as
the authoritative victory corroboration for the two Axe cases.

### B arm disposition

| Arm | Planned | Started | Valid gameplay | Victories | Boss deaths | Invalid / interrupted / unstarted |
|---|---:|---:|---:|---:|---:|---:|
| Ruinous Axe | 2 | 2 | 2 | 2 | 0 | 0 |
| Gale Needle | 2 | 2 | 2 | 0 | 2 | 0 |

This is a two-replicate, noncanonical candidate observation under a shared
prepared package. It is not a weapon ranking, balance verdict, or reason to
change the package without a newly authorized experiment.

## Phase C — prepared Forest boss coverage

Phase C used the same unchanged Spirit prepared snapshot independently for
two Ruinous Axe runs. The fixed package was Ruinous Axe +5, Cave Vest +5,
Mountain Charm +5, Plains Boots +5, Tempered Core, Expose Weakness, Second
Wind, Brace, defensive stance, the ordered orbit/Step Back/avoid-hazards/
wait-for-regen rules, and the v1i:spirit:forest:ruinous-axe:ready marker.

Both runs passed 339 profile/spawn assertions, completed 36/36 route steps,
and cleared the ordinary 12-guardian phase. The aggregate ordinary guardian
name includes Forest Sentinel; exact per-guardian attribution is not emitted.

| Slot | Run ID | Terminal; marker | Timing ms | HP samples; boss HP | Authoritative outcome |
|---|---|---|---|---|---|
| 001 Axe r1 | spirit-campaign-forest-ruinous-axe-t2-intended-2026-09-13T17-15-57-149Z-760dd87b | completed/bot_completed; 36/36; v1i:spirit:forest:ruinous-axe:ready | 109105 / 58060 / 27024 / 204702 | sampled lowest/last 46.4962% / 62.1508%; Snapshot B 151.376144/231; terminal boss 0% | Apex Timberclaw victory; progression forest:2 |
| 002 Axe r2 | spirit-campaign-forest-ruinous-axe-t2-intended-2026-09-13T17-19-50-517Z-67d12e59 | completed/bot_completed; 36/36; v1i:spirit:forest:ruinous-axe:ready | 117715 / 62053 / 25020 / 215300 | sampled lowest/last 41.9616% / 41.9616%; Snapshot B 124.012358/231; terminal boss 0% | Apex Timberclaw victory; progression forest:2 |

### C abilities, counterplay, and combat scope

| Slot | Abilities | Counterplay | Run-wide combat |
|---|---|---|---|
| Axe r1 | Expose Weakness 7, Second Wind 1, Brace 1 | Step Back 3/3 activations/attempts, 2 successes, 1 discarded, 0 failures, 0 damage | 26 kills; player damage 12459; taken 157.85; absorbed 345.15; healed 439.15; top incoming Apex 157.85; Apex damage aggregate 3771; Forest Sentinel 1174 |
| Axe r2 | Expose Weakness 7, Second Wind 1, Brace 1 | Step Back 3/3 activations/attempts, 2 successes, 1 discarded, 0 failures, 0 damage | 19 kills; player damage 10915; taken 179.17; absorbed 341.83; healed 429.83; top incoming Apex 179.17; Apex damage aggregate 3825; Forest Sentinel 1555 |

Brace activation was emitted, but no direct Brace mitigation amount was
emitted; activation is not treated as effectiveness. Range, barrier, and add
counts remain aggregate diagnostics across the run and were not used to infer
kiting, add pressure, or boss-only damage. No C event emitted Energy,
empowered, charge, or dead-swing telemetry.

The raw Apex kill record used monsterTypeId
node-t2-forest-dungeon_monster-13 and reported isBoss=false. Named
Apex Timberclaw, boss-attempt victory, and progression forest:2 provide the
authoritative clear corroboration.

## Durable artifacts

| Phase | Cohort report | State | Run evidence |
|---|---|---|---|
| A | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t161141z-striker-t2-progression-squire/cohort-summary.json | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t161141z-striker-t2-progression-squire/state.json | Runs 001–002; summary.json and events.jsonl under each run's artifacts directory |
| B | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t165614z-spirit-campaign-plains-ruinous/cohort-summary.json | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t165614z-spirit-campaign-plains-ruinous/state.json | Runs 001–004; summary.json and events.jsonl under each run's artifacts directory |
| C | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t171504z-spirit-campaign-forest-ruinous/cohort-summary.json | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t171504z-spirit-campaign-forest-ruinous/state.json | Runs 001–002; summary.json and events.jsonl under each run's artifacts directory |

### Snapshot B hashes

The last HP column is the runtime HP/max HP captured in the durable snapshot,
not the lowest or last concurrency sample.

| Phase / slot | Snapshot B path | SHA-256 | Node; GM; last HP / max HP |
|---|---|---|---|
| A / Striker | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t161141z-striker-t2-progression-squire/runs/001-striker-t2-progression-intended-r01/artifacts/striker-t2-progression-intended-2026-09-13T16-14-17-170Z-39186f97/snapshot-b.json | 0dea871f7e0ee8d098f6aa40d591683b42f95b1ec798bd3fa528aeed4bc21920 | node-t2-desert-03; GM72; 41.325504 / 244 |
| A / Squire | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t161141z-striker-t2-progression-squire/runs/002-squire-t2-progression-intended-r01/artifacts/squire-t2-progression-intended-2026-09-13T16-35-10-143Z-9d6d71de/snapshot-b.json | f7f6a884f4f03798ee5c1019a3f49a6e18ecd4fb82f6bc357d00642f9b44d344 | node-t2-desert-04; GM72; 272.800048 / 307 |
| B / Axe r1 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t165614z-spirit-campaign-plains-ruinous/runs/001-axe-r1/artifacts/spirit-campaign-plains-ruinous-axe-t2-intended-2026-09-13T16-57-20-166Z-441434fa/snapshot-b.json | d00fc998cfd6b54cc802e67eb3738f536ae11b438707f8e1e1eb48dfb9994fac | node-t2-plains-dungeon; GM72; 87.271080 / 231 |
| B / Axe r2 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t165614z-spirit-campaign-plains-ruinous/runs/004-axe-r2/artifacts/spirit-campaign-plains-ruinous-axe-t2-intended-2026-09-13T17-09-56-482Z-988ced2c/snapshot-b.json | 80c5462c0b3b9c7227775662f3ad5d3149d4f6195f268966a5add7f318ba4b69 | node-t2-plains-dungeon; GM72; 133.381180 / 231 |
| C / Axe r1 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t171504z-spirit-campaign-forest-ruinous/runs/001-spirit-campaign-forest-ruinous-axe-t2-intended-r01/artifacts/spirit-campaign-forest-ruinous-axe-t2-intended-2026-09-13T17-15-57-149Z-760dd87b/snapshot-b.json | 60e6b89600fdf54a2d9a72c55019f663f53c5c3af8154524cd66b6d11800c9d0 | node-t2-forest-dungeon; GM72; 151.376144 / 231 |
| C / Axe r2 | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t171504z-spirit-campaign-forest-ruinous/runs/002-spirit-campaign-forest-ruinous-axe-t2-intended-r02/artifacts/spirit-campaign-forest-ruinous-axe-t2-intended-2026-09-13T17-19-50-517Z-67d12e59/snapshot-b.json | ef2a8e9bf1ea4f909a99754aa3bda88bb369127d9de392ab811d50f7f8d0edd4 | node-t2-forest-dungeon; GM72; 124.012358 / 231 |

The B Needle runs ended in valid boss deaths before Snapshot B emission.
The input snapshot hash is recorded in Input provenance and was independently
verified in both prepared manifests.

### Resource envelopes

The generated cohort reports contained healthy resource samples; no resource
or supervisor-health stop was indicated.

| Phase / slot | Memory MiB | CPU % | Event-loop P99 ms |
|---|---:|---:|---:|
| A / Striker | 188.4 | 45.5 | 37.8 |
| A / Squire | 184.5 | 40.8 | 39.2 |
| B / Axe r1 | 154.1 | 48.6 | 41.3 |
| B / Needle r1 | 161.0 | 41.3 | 39.0 |
| B / Needle r2 | 161.4 | 42.7 | 38.1 |
| B / Axe r2 | 168.4 | 44.1 | 32.2 |
| C / Axe r1 | 153.6 | 48.5 | 39.1 |
| C / Axe r2 | 150.5 | 43.3 | 67.6 |

## Mandatory outcome classification and disposition

| Evidence class | Result | Boundary |
|---|---|---|
| A resource reselection | Striker and Squire each closed the V1h-targeted missing-resource block and reached GM72/all T2 maxed | synthetic clean T2 progression; not canonical acquisition or economy evidence |
| B prepared Plains | Ruinous Axe 2/2 victories; Gale Needle 2/2 valid boss deaths | treatment-valid isolated gameplay observations under reward 25 and two replicates; no weapon ranking or balance verdict |
| C prepared Forest | Ruinous Axe 2/2 victories against Apex Timberclaw; forest:2 corroborated | treatment-valid isolated prepared-T2 gameplay observations; no canonical economy conclusion and no T3/T4 inference |

All eight planned slots started and reached durable terminal artifacts. The
two Needle bot_partial rows continued to their terminal state because they
were valid ready-marker boss deaths, as required by the packet. No stop rule
fired. No manifest was prematurely stopped, no run was retried, and no worker
or database resource was directly stopped.

No balance edits, source edits, boss tuning, fast retry, T3/T4 test, automatic
winner selection, or automatic downstream action was authorized or performed.
Return to a newly authorized packet for any weapon follow-up, longer
replication, canonical economy work, or balance decision.
