# V1b execution report — Revised Striker Plains boss probe

2026-09-12. Operator report for the [V1b operator packet](bot-balance-v1b-operator-packet.md).
This records the one exact frozen execution. No source, route, manifest, assertion,
gameplay, or harness changes were made. There was no retry, ceiling extension,
replacement, tactical intervention, Docker stop, cleanup, or second launch.

## Result

**Disposition: preparation timeout; supervisor finalization valid; boss untested.**
The fresh run reached T1, GM30, all five Tier-1 biome level-6 milestones, the
verified 19/22 RP Striker build, and Chaotic Axe +5. It then timed out while the
required Plains Vest +5 upgrade remained blocked on 45 Might essence and one
Alacrity catalyst. The required full kit was not reached, so the authored Plains
guardian/boss probe never began. The repaired supervisor finalized the run normally
and agrees with the worker result and run summary.

| Field | Recorded value |
|---|---|
| Experiment ID | `20260912t202234z-striker-campaign-plains-boss-v` |
| Route / version | `striker-campaign-plains-boss-v1b-t1` / `1.0.0` |
| Run | `001-striker-campaign-plains-boss-v1b-t1-intended-r01` |
| Requested / executed revision | `cf562ecee118fece0e4a0311da03ca0d4f18ee30` |
| Exported source tree | `24c565b4021cb4340c377dcae1466b5806f8a834` |
| Immutable image | `sha256:1b6f24b7c8167c3fda20630a3389e442c5b4d24e1fbdc64b8441824a069db10a` |
| Image tag / build identity | `mmo-idle-experiment:cf562ecee118-d90e6996` / `09d5b6ec783e199b0a32d591` |
| Manifest SHA-256 | `aad449e2be571888222cd0a7e14f7b69bb9a0ed27c87b7f6fe2c2d0c5648b34e` |
| Tooling / copied runtime hashes | `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1` / `8e48ec4278c22f820a90de56886aafeb25e34f0e780411d763bb38ae60259c40` |
| Invocation | `develop`, clean; dirty changes excluded from the image |
| Class / final progression | Striker (`cadence-root`); player tier 1, GM30; Clearing 4 and each Tier-1 biome 6 |
| Config | `smoke-isolated`, one worker/run, `intended`, `rewardMultiplier=25`, `entryEconomy=clean` |
| Inputs | fresh Clearing entry; `tierEntrySnapshot=null`; `fastBossRetry=false` |
| Limit / retries | `maxRunMs=900000`; automatic retries `0`; manual retries `0` |
| Worker terminal | `timed_out` — `run exceeded maxRunMs (900000ms)` at 900,303 ms |
| Supervisor terminal | `completed`; final state agrees with worker-result, heartbeat, summary, and cohort summary |
| Evidence flags | `canonical=false`, `soloBaselineEligible=false`, `combatEvidenceEligible=false`, `economyEvidenceEligible=false`, `treatmentValidity=not-asserted` |

The [sealed manifest](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/experiment.json>)
and [manifest hash](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/experiment.sha256>)
were checked before launch and match the packet's revision, source tree, image,
clean entry, null tier-entry snapshot, and retry settings. The copied
[runtime](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runtime/lib.mjs:70>)
contained a unique temporary filename and bounded rename retry; its tree hash
matched the sealed manifest.

`pnpm bot:preflight` passed before launch. That is harness and semantic validation,
not balance evidence. The exact create command produced one run, and the exact
returned experiment ID was launched once.

## Preparation evidence

The worker started at Clearing with tier 0, zero essences, no inventory or crafted
recipes, and no imported tier-entry state. The run summary's Snapshot A is a
non-canonical output snapshot captured at GM30; it was not an input profile. The
run completed 88 of 105 route steps before the timeout and emitted no
`v1b:verified-plains-build`, `v1b:preparation-complete`, or `v1b:plains-attempt`
marker.

| Run-relative time | Observed progression |
|---:|---|
| 119,488 ms | T1 entered |
| 120,427 ms | Tier-0 quest complete |
| 128,449 ms | Clearing set complete |
| 180,041 ms | Plains level 6 / GM6 |
| 244,617 ms | Forest level 6 / GM12 |
| 276,668 ms | Swamp level 6 / GM18 |
| 390,791 ms | Mountain level 6 / GM24 |
| 424,333 ms | All five Tier-1 biomes level 6 / GM30; Clearing remained level 4 |

The [milestone sequence](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/events.jsonl:191>)
and [run summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/summary.json>)
are the authoritative progression records. Snapshot A is preserved [here](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/snapshot-a.json>).

At 420,824 ms the loadout reached the requested verified preparation build:
Sweep + Second Wind, five requested Rune rules, and 19/22 RP. The
[verified loadout event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/events.jsonl:984>)
records the authoritative observed state. The authored Expose Weakness learn step
completed at 421,325 ms, but Expose Weakness was not selected or activated; the
run retained Sweep as intended for late preparation. After GM30 there were 27
Sweep activations and 10 Second Wind activations, beginning with the [late Sweep
activation](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/events.jsonl:1107>).
The [final activation](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/events.jsonl:1563>)
still used Sweep.

The final observed state was:

| Required assertion | Observation |
|---|---|
| GM30 | Reached at 424,333 ms |
| Chaotic Axe +5 | Reached at 724,698 ms |
| Plains Vest T1 +5 | Not reached; remained +4 |
| Swamp Charm T1 +5 | Not reached; remained +4 |
| Plains Boots T1 +5 | Not reached; remained +4 |
| Technique / Guard | Sweep / Second Wind |
| Runes | `auto-path-enemy`, `step-back`, `chase-enemy`, `avoid-hazards`, `wait-for-regen` |
| RP / budget | 19 / 22 |
| Stance, Rite, Frame, Core, Relic | None observed/equipped |

The final equipped loadout was Chaotic Axe, Mountain Vest T1, Swamp Charm T1,
and Plains Boots T1, with no Core or Relic. Final upgrade levels were
Iron Broadsword +1, Plains Vest +4, Plains Charm +2, Plains Boots +4,
Flash Rapier +4, Swamp Charm +4, Mountain Vest +4, and Chaotic Axe +5. The
[final equipment and build summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/summary.json>)
is authoritative.

The upgrade order was:

| Phase | Recorded order |
|---|---|
| Plains / Forest | Iron Broadsword +1; Plains Vest, Charm, and Boots +1; Flash Rapier +1/+2; Plains Vest, Charm, and Boots +2 |
| Swamp | Swamp Charm +1/+2/+3; Flash Rapier +3; Plains Vest and Boots +3 |
| Mountain | Mountain Vest +1/+2/+3/+4; Flash Rapier +4; Swamp Charm +4; Plains Vest +4 |
| Plains supplier return | Plains Boots +4 after its resource block |
| Cave / GM30 | Chaotic Axe +1/+2/+3/+4, then equip; all-biomes-maxed milestone |
| Late preparation | Chaotic Axe +5 after the Swarming supplier block; Plains Vest +5 was next and timed out |

## Resource stalls and transit

The route recorded three distinct resource blocks. Their route-level durations
include the time spent traveling while the blocked objective remained active.

| Objective | Block start | Missing at start | Supplier target / observed result |
|---|---:|---|---|
| Plains Boots +4 | 376,773 ms | 31 Might essence | Plains fortified node entered at 382,383 ms; block ended after 13,516 ms and the upgrade completed |
| Chaotic Axe +5 | 424,347 ms | 11 Deep essence and 1 Swarming catalyst | Cave dominion entered at 450,387 ms, Cave swarming at 480,391 ms; Swarming catalyst gained at 724,437 ms, block ended after 300,350 ms, and +5 completed |
| Plains Vest +5 | 725,200 ms | 45 Might essence and 1 Alacrity catalyst | Cave 06, Forest 04, Swamp 03, Swamp 01, Swamp 04, then Plains alacrity at 895,457 ms; timeout ended the 175,101 ms block with both resources still missing |

The [Axe block start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/events.jsonl:1013>),
[Swarming catalyst gain](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/events.jsonl:1570>),
[Axe upgrade](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/events.jsonl:1574>),
[Vest block start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/events.jsonl:1577>),
and [timeout block end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/events.jsonl:1846>)
preserve the resource evidence.

The Axe objective spent its first 56,044 ms in travel from Cave 05 through Cave
04 to Cave 03. From 480,391 ms until the catalyst gain, the event stream records
the blocked objective farming and combat in Cave 03 Swarming. After the Axe
upgrade, the Vest objective traveled through Cave 06, Forest 04, Swamp 03,
Swamp 01, and Swamp 04 before entering Plains 01 Alacrity for roughly five
seconds. Travel samples are marked as `purpose=travel`; supplier farming samples
are marked `purpose=blocked`. The route therefore did not convert the Vest block
into a completed supplier-farming result before the ceiling. The missing Alacrity
catalyst is preserved as an observation, not by itself a routing or economy
conclusion.

The run recorded 46 ordinary kills, zero deaths, one Swarming catalyst gained
and spent, and no boss-flagged kill. The accelerated 25x reward multiplier taints
the run as `NON_CANONICAL_REWARD_MULTIPLIER`; the summary consequently marks
economy and combat evidence ineligible. Runtime telemetry remained healthy:
the cohort summary reports maximum memory 183.9 MiB, container CPU 43.3%, and
event-loop p99 28.1 ms. The [empty deaths stream](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/deaths.jsonl>)
and [resource samples](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/resource-samples.jsonl>)
preserve the death and runtime-health boundaries.

## Encounter evidence

No encounter was reached.

| Required encounter record | Observation |
|---|---|
| Dungeon arrival / ordinary guardian clear | No event emitted |
| Altar activation | No event emitted |
| Tusked Razorback appearance / engagement | No event emitted |
| Boss attempts / victories | `0 / 0` in the run summary |
| Boss HP, phases, adds, targeting, Technique/Guard damage or recovery | Unobserved; boss diagnostics had `0` samples |
| Guardian deaths / boss deaths | None; deaths stream is empty |
| Authoritative boss clear / final progression | None; `bossesCleared=[]` |

The [boss summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/summary.json>)
and [event stream](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/artifacts/striker-campaign-plains-boss-v1b-t1-intended-2026-09-12T20-26-14-266Z-a5c5fbef/events.jsonl:1849>)
preserve this boundary. This run is not evidence that Striker can or cannot kill
Tusked Razorback.

## Supervisor and final artifacts

The supervisor started normally, launched the one worker, recorded the terminal
timeout, and completed. The [supervisor event log](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/supervisor-events.jsonl:4>)
records the run terminal event; the following [completion event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/supervisor-events.jsonl:5>)
records supervisor finalization. The [state](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/state.json>)
reports the same `timed_out` run status.

The [worker result](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/worker-result.json>)
and [worker heartbeat](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/runs/001-striker-campaign-plains-boss-v1b-t1-intended-r01/worker-heartbeat.json>)
both record `phase/status=timed_out`, with the last health status `ok`. The
[cohort summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t202234z-striker-campaign-plains-boss-v/cohort-summary.json>)
agrees with those terminal artifacts. The worker had exited, so the packet's
supervisor-fatal worker-stop contingency was not needed. No database or Redis
container was stopped, and no artifact cleanup or state reconciliation was done.

The run directory contains sensitive runtime configuration; `runtime-secrets.json`
and `run-config.json` are intentionally not linked here.

## Evidence disposition

| Evidence class | Disposition |
|---|---|
| Preparation | Fresh route reached GM30, the requested build verified, and Chaotic Axe +5 completed; timeout left Plains Vest, Swamp Charm, and Plains Boots below +5. |
| Gameplay / boss balance | Untested; no dungeon, guardian, altar, boss, HP, phase, or kill evidence. |
| Economy | Inadmissible: 25x reward multiplier, and the run timed out before the encounter. |
| Infrastructure | Valid finalization; repaired supervisor state writes completed normally and terminal records agree. |

No tuning, nerf, buff, DPS, economy, or class-wide conclusion is supported. Return
to Astra for the next decision on the remaining full-kit preparation gate before
authorizing another boss probe.
