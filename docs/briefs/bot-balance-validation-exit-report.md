# Validation exit — execution report

Executed 2026-09-15 from the frozen
[validation-exit operator packet](bot-balance-validation-exit-operator-packet.md).
Both declared experiments ran once with one worker, one replica per route,
`smoke-isolated`, reward multiplier `1`, intended policy, zero automatic
retries and no adaptive tactics, source edits or balance changes.

## Decision summary

- Stage 1 completed and returned, but its productive-activity flag is
  **unresolved**. The diagnostic explains when the long gap occurred and
  records the authoritative state; it does not establish a hazard defect or a
  relic-DPS comparison.
- Stage 2 produced five valid named-boss wins with authoritative matching seals
  and rested returns. Jungle, Desert, Tundra, Trench and Graveyard can close as
  sampled viable T4 encounters for this prepared Voidwalker reference.
- Stage 2 Volcanic cleared all nine dungeon guardians, then stopped on the
  first death during the Caldera Sovereign screen. It has no named-boss win,
  seal or returned capture and remains the focused exception.
- Swamp T3 remains open. These restored, reward-one runs retain their
  non-canonical ancestry and do not certify canonical economy, pacing, relic
  balance or all-class balance.

The exit gate is therefore **partially complete**: five of six remaining T4
boss entries are closed as viable samples; the Volcanic exception, the
unresolved Stage 1 inactivity gap and Swamp T3 remain visible. No blanket mob,
item, class or economy balance change is justified by this execution.

## Frozen execution identity

| Item | Value |
|---|---|
| Source revision | `862448b6d8a6f298ead258447a0c5fa5aaeb9584` |
| Source tree | `33d2de038abb79950cd292e659b555ed5c7160f4` |
| Definition hash | `92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4` |
| Build image | `sha256:632c535df0bd16e2a6fda9517cf3ae48913b88c83eae3e9d5539df16bf7a07f5` |
| Build ID | `0d4882a2aac5c7941fe18774` |
| Setup preflight | `C:/Users/osaif/AppData/Local/mmo-idle/validation/t4-validation-exit-preflight-20260915-r2.json` |
| Setup preflight SHA256 | `E39D7D1B8645BFA41251B383737B39AE8EB7E548EA33555ADAA24F27754A8A60` |
| Runtime | `smoke-isolated`, reward `1`, intended, one worker, one replica, retries `0` |

The Stage 1 input was the exact V1z +2 prepared return, SHA256
`e6b357f51cadb344307e56aa7d43eb247b8755bf5284ba91e9342711942ae844`, state
hash `32ec146718e8e4635d624639155b560dc9a2bd93712e50012c6750ef023a8afb`.
The Stage 2 input was the exact first Night3 Mountain control return, SHA256
`866db03766d0e7cd4ceeeea48506bd9c11c2a9eaf0f72037e49a0cc20c052f98`, state
hash `c17fccd4238740778cc6b78c5561c6edc2b4771e17b298783cb1786eb39e8bff`.

Both inputs and every output carry `RESTORED_PROGRESSION_CHECKPOINT`,
`SYNTHETIC_TIER_ENTRY` and `NON_CANONICAL_REWARD_MULTIPLIER` ancestry. No
progression, seal, mastery, gear or wallet state was pooled between cases.

## Stage 1 — empty-relic Volcano diagnostic

Experiment `20260915t061822z-t4-exit-volcanic-control-diagn` completed with
reason `bot_completed` in 900,979 ms. Setup, ready capture, fixed approach,
measurement, reverse return and rested returned capture all succeeded. The
run finished at T4 Sanctuary at GM141, with 22/22 route steps completed.

The bounded activity recorder emitted one review window:

| Field | Evidence |
|---|---|
| Node | `node-t4-volcanic-05` |
| Flag threshold / duration | `60,000 ms` / `541,051 ms` |
| Window | `149,416` to `690,467` ms; first recorded at `209,422` ms |
| Records | `12` diagnostic records; start, sparse samples and end |
| Start reason | `Nearest eligible target`; structured auto intent was attack, but `target=null` |
| End reason | `No networked auto intent`; target remained null |
| Population | `38` monsters present; max attackers `0` |
| Combat progress | `0` kills, `0` damage in, `0` damage out during the flagged window |
| Player state | sampled HP `389/389`, barrier `265/265`, incoming DoT `0`, active contacts `0` |
| Movement/path | movement target varied; sampled distance reached `430.2` in the flagged period |
| Hazard state | hazard contacts `0`, escape attempts/successes `0/0` |
| Classification | **Unresolved productive inactivity** |

The recorder successfully contained the evidence surface, but the records do
not supply an authoritative reason for full-health, no-target inactivity while
monsters remained available. This is not a hazard-bug verdict. The run's
new-world seed and occupancy remain a confounder, and this diagnostic had no
relic comparison. Do not use its empty-relic kill/throughput totals as a
Night3 control-versus-Colossus result.

## Stage 2 — six independent T4 boss screens

Experiment `20260915t063808z-t4-exit-jungle-boss-t4-exit-de` used the exact six
routes in packet order. The supervisor reached terminal state with five
completed and one failed case; the failed case was the declared first-death
stop, not a shared setup or infrastructure failure.

| Route | Guardians | Named boss / attempt | Matching seal | Return | Boss combat | Result |
|---|---:|---|---|---|---:|---|
| Jungle | 9/9 | Verdant-Crown Predator / victory | `jungle:4` | rested returned | 30,036 ms | valid; 0 deaths |
| Desert | 3/3 | Dune-Throne Sovereign / victory | `desert:4` | rested returned | 32,520 ms | valid; 0 deaths |
| Tundra | 3/3 | Glacial Patriarch / victory | `tundra:4` | rested returned | 47,037 ms | valid; 0 deaths |
| Trench | 2/2 | Elder Trench Serpent / victory | `trench:4` | rested returned | 39,019 ms | valid; 0 deaths |
| Graveyard | 9/9 | Charnel-Crown Sovereign / victory | `graveyard:4` | rested returned | 43,522 ms | valid; 0 deaths |
| Volcanic | 9/9 | Caldera Sovereign / no result | none | no return | not reached | not asserted; 1 death |

For the five valid cases, the event log records the dungeon-guard phase ending
with `guardianAlive=0`, the named boss kill, a victorious one-attempt result,
the authoritative seal readback and the returned capture. Whole-run durations
were Jungle 276,514 ms, Desert 257,479 ms, Tundra 264,065 ms, Trench 465,633
ms and Graveyard 542,176 ms. These are route durations, not boss TTK.

The Volcanic case reached the `node-t4-volcanic-dungeon` boss step after
clearing all nine guardians. At 304,210 ms it stopped at route step 15,
`boss volcanic T4`, on a death record whose top-level cause was 549 damage from
Caldera Sovereign. The death context identifies `Caldera Sovereign — Magma
Vent` as the dominant source with 144 damage; its recorded killing blow was an
18-damage `ground-zone,toxic-pool,magma-vent` DoT at 303,531 ms. The encounter
also recorded two magma-vent contacts, 162 hazard damage received and one
hazard escape attempt with one success. The boss-attempt start exists, but
there is no named-boss kill, victory, seal or return capture. The report keeps
the top-level cause and killing-blow context separate rather than inferring a
single causal explanation.

All five successful treatment results are `valid`. The Volcanic result is
`not-asserted` because the route stopped before the named-boss acceptance
assertions.

## Evidence and release record

The complete retained roots are:

- [Stage 1 cohort summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t061822z-t4-exit-volcanic-control-diagn/cohort-summary.json>) — experiment `20260915t061822z-t4-exit-volcanic-control-diagn`; cohort SHA256 `F70B6639BD59EDF1ACB583615F072D5CFA89E86CA17CB04835AA8BADEC3DDC0C`.
- [Stage 1 run summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t061822z-t4-exit-volcanic-control-diagn/runs/001-t4-exit-volcanic-control-diagnostic-intended-r01/artifacts/t4-exit-volcanic-control-diagnostic-intended-2026-09-15T06-20-25-327Z-7df911bd/summary.json>) and [activity events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t061822z-t4-exit-volcanic-control-diagn/runs/001-t4-exit-volcanic-control-diagnostic-intended-r01/artifacts/t4-exit-volcanic-control-diagnostic-intended-2026-09-15T06-20-25-327Z-7df911bd/events.jsonl>).
- [Stage 2 cohort summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t063808z-t4-exit-jungle-boss-t4-exit-de/cohort-summary.json>) — experiment `20260915t063808z-t4-exit-jungle-boss-t4-exit-de`; cohort SHA256 `3F83B1D32992C6384A3E98BA72C8B67BD0255F455B49E2C1C7D0D9DD8E41AD5F`.
- [Stage 2 experiment manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t063808z-t4-exit-jungle-boss-t4-exit-de/experiment.json>) — the experiment root `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t063808z-t4-exit-jungle-boss-t4-exit-de` contains one `summary.json`, `events.jsonl`, ready checkpoint and, for the five completed cases, returned checkpoint per route.

Root release artifacts report `network-release.json` status `released` for both
experiments. The Stage 1 release artifact SHA256 is
`C22928B34683D9CB0F9B2ACA6643A8E67370E745EA5F27638163993A7360AA63`; Stage 2
is `B53AD46901D7E9E452F450188F764DFC0E2566881D53232A3778713447896C6E`.
Scoped databases/Redis and workers were released; the shared development
services remained healthy. No Docker restart, global prune, RAM-setting change
or retained-artifact deletion was performed.

## Next decision

Close the five clean T4 encounter entries for this prepared reference and keep
Volcanic, Swamp and the Stage 1 inactivity gap as explicit exceptions. A next
measurement pass may be scoped to clean encounters only when engagement and
downtime evidence is reliable; it must add the target-level evidence needed
for mob-role balance questions. First resolve the Volcanic counterplay/source
question with a focused source review or targeted playtest. Do not convert
these restored screens into canonical economy evidence or apply a blanket
balance edit.
