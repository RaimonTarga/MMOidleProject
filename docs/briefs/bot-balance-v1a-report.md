# V1a execution report — Striker Plains boss probe

2026-09-12. Operator report for the [V1a operator packet](bot-balance-v1a-operator-packet.md).
This records the one exact frozen execution. No source, route, manifest, assertion,
gameplay, or harness changes were made. There was no retry, ceiling extension,
replacement, tactical intervention, Docker cleanup, or second launch.

## Result

**Disposition: preparation timeout; infrastructure-invalid supervisor lifecycle.**
The worker reached its own 900,000 ms ceiling while preparing the declared
loadout. It emitted a durable `timed-out` result, but the supervisor had already
failed on an atomic state-file rename and never finalized the run in
`state.json`. This is not a boss loss, boss pass, or economy result.

| Field | Recorded value |
|---|---|
| Experiment ID | `20260912t194203z-striker-campaign-plains-boss-t` |
| Route / version | `striker-campaign-plains-boss-t1` / `1.0.0` |
| Run | `001-striker-campaign-plains-boss-t1-intended-r01` |
| Requested / executed revision | `53769682648bf66f8e265ebbf05c924bc4373c3c` |
| Exported source tree | `c520ffe49afc4ba3a6efdced548b6714fb16a211` |
| Immutable image | `sha256:b5c042a86be1b5cc427c846c7f7a4bbebe0faf4b6cf954bce64014b6d24a9bc2` |
| Image tag / build identity | `mmo-idle-experiment:53769682648b-d90e6996` / `2393812e75fa3d4b4d05e6c7` |
| Manifest SHA-256 | `b07042b0de444801b0a53a62ae43bcdad7df58c4e8e9d2c70c13a33653ae7bd8` |
| Invocation | `develop`, dirty; dirty changes excluded from the image |
| Class root / progression | `cadence-root` (Striker); final player tier 1, GM30; Clearing level 4 and each Tier-1 biome level 6 |
| Config | `smoke-isolated`, one worker/run, `intended`, `rewardMultiplier=25`, `entryEconomy=clean` |
| Inputs | fresh entry; `tierEntrySnapshot=null`; `fastBossRetry=false` |
| Limit / retries | `maxRunMs=900000`; automatic retries `0`; manual retries `0` |
| Worker terminal | `timed_out` — `run exceeded maxRunMs (900000ms)` at 900,309 ms |
| Evidence flags | `canonical=false`, `combatEvidenceEligible=false`, `economyEvidenceEligible=false`, `treatmentValidity=not-asserted` |

The [sealed manifest](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/experiment.json>)
and [manifest hash](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/experiment.sha256>)
were checked before launch and match the packet's revision, source tree, image,
clean entry, null tier-entry snapshot, and retry settings.

## Preparation evidence

The run started from Clearing with no imported tier-entry state. It reached T1 at
119,561 ms, then recorded the authored progression milestones through GM30, with
Clearing at level 4 and all five Tier-1 biomes at level 6. The milestone sequence is preserved in the
[event stream](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/events.jsonl:191>):

| Run-relative time | Observed milestone |
|---:|---|
| 119,561 ms | T1 entered |
| 186,035 ms | Plains level 6 / GM6 |
| 256,110 ms | Forest level 6 / GM12 |
| 302,183 ms | Swamp level 6 / GM18 |
| 396,793 ms | Mountain level 6 / GM24 |
| 423,337 ms | All five Tier-1 biomes level 6 / GM30; Clearing remained level 4 |

The run summary records 88 of 106 route steps completed and a non-canonical
Snapshot A at GM30; there is no Snapshot B. The [GM30 milestone](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/events.jsonl:1025>)
and [run summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/summary.json>)
are the authoritative progression records.

The packet requested Sweep + Second Wind at 19/22 RP. That build and the five
requested Rune rules were verified at 417,821 ms ([event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/events.jsonl:992>)).
The authored route then changed the Technique to Expose Weakness and verified
Expose Weakness + Second Wind at 20/22 RP ([event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/events.jsonl:1003>)).
No `v1a:preparation-complete` marker was emitted.

At timeout, the final summary recorded Chaotic Axe +5, Mountain Vest T1 +4,
Swamp Charm T1 +4, and Plains Boots T1 +4, with no Core or Relic. Thus the
observed final equipment was not the packet's declared Plains Vest +5 state.
The final loadout, upgrades, abilities, Runes, and progression are preserved in
the [summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/summary.json>)
and [Snapshot A](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/snapshot-a.json>).

## Preparation stall and timeout

The run first blocked on `upgrade:chaotic-axe+5` at 423,353 ms, missing 11 Deep
essence and one Swarming catalyst. That block lasted 293,232 ms and the upgrade
then completed. It next blocked on `upgrade:plains-vest-t1+5` at 717,087 ms,
missing 98 Might essence and one Alacrity catalyst. At 900,308 ms the only
remaining missing resource was one Alacrity catalyst, after 183,221 ms in that
block ([block start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/events.jsonl:1575>), [block end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/events.jsonl:1871>)). The [run-end event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/events.jsonl:1874>) records the 900,000 ms ceiling.

This is preparation inability and a route-state mismatch, not encounter
performance. There were zero player deaths, so no guardian recovery or death
confound occurred.

## Encounter evidence

No encounter was reached.

| Required encounter record | Observation |
|---|---|
| Dungeon arrival / guardian clear | No event emitted |
| Altar activation | No event emitted |
| Tusked Razorback appearance / engagement | No event emitted |
| Boss attempts / victories | `0 / 0` in the run summary |
| Boss HP, phases, adds, targeting, Technique/Guard damage or recovery | Unobserved; boss diagnostics had `0` samples |
| Authoritative boss clear / final progression | None; `bossesCleared=[]` |

The event stream contains 60 ordinary kills and no boss-flagged kill. The
[boss summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/summary.json>),
[events](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/events.jsonl>),
and [deaths stream](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/artifacts/striker-campaign-plains-boss-t1-intended-2026-09-12T19-44-44-454Z-b4231083/deaths.jsonl>)
preserve this boundary. The run is not evidence that Striker can or cannot kill
Tusked Razorback.

## Supervisor failure and final artifacts

The supervisor started normally, launched the worker, and then failed at
19:44:42.147Z on `EPERM` while renaming its temporary `state.json` file. The
failure is preserved in [supervisor-events.jsonl](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/supervisor-events.jsonl:4>).
One stop request was issued at 19:46:12.215Z; no second stop, direct Docker
operation, cleanup, or retry was performed. The worker later independently
reached its ceiling and wrote [worker-result.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/worker-result.json>)
with `status=timed_out` and [worker-heartbeat.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/worker-heartbeat.json>)
with `phase=timed_out` and health `ok`.

Because the supervisor was dead, [state.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/state.json>)
still reports the run as `running`. The generated [cohort-summary.json](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/cohort-summary.json>)
inherits that stale state and is not the terminal authority for this run; use
`worker-result.json`, `worker-heartbeat.json`, and the run `summary.json` for the
durable worker outcome. The [resource samples](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t194203z-striker-campaign-plains-boss-t/runs/001-striker-campaign-plains-boss-t1-intended-r01/resource-samples.jsonl>)
record runtime health only (maximum reported memory 174.1 MiB, container CPU
46.2%, event-loop p99 83.6 ms); they are not gameplay evidence.

The run directory also contains a sensitive runtime configuration file; it is
intentionally not linked in this report.

## Evidence disposition

| Evidence class | Disposition |
|---|---|
| Preparation | Observed fresh route progression to GM30, then timeout while the declared armor upgrade remained resource-blocked; final build/equipment did not match the declared prepared state. |
| Gameplay / boss balance | Untested; no dungeon, guardian, altar, boss, HP, phase, or kill evidence. |
| Economy | Inadmissible: reward multiplier was 25x and the run timed out before the encounter. |
| Infrastructure | Invalid supervisor lifecycle due atomic state-write `EPERM`; worker artifacts preserved and classified separately. |

No tuning, nerf, buff, or class-wide conclusion is supported. Return to Astra
for the next decision on the preparation-route mismatch and supervisor failure
before authorizing another boss probe.
