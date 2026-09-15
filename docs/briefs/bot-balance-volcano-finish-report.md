# Bot balance — Volcano finishing comparison report

Executed 2026-09-15 from the frozen operator packet
[bot-balance-volcano-finish-operator-packet.md](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-volcano-finish-operator-packet.md>).

## Decision

The sampled Volcano finishing screen is resolved for the prepared Colossus
Heart reference: both Colossus cells cleared the Caldera Sovereign, reached
Volcano 4, and returned. Both Empty-relic cells stopped at first death before
the boss victory. Expose Weakness was not required for either Colossus win, and
Expose Weakness alone did not rescue either Empty-relic run.

This closes the sampled Volcano viability gap for the prepared Colossus
reference, not universal relic balance or causal attribution. The result is
one intended run per cell, every output is tainted by a restored synthetic
tier-entry checkpoint and non-canonical reward multiplier, and no balance edit
is justified by this comparison. The Empty-relic result remains a known
robustness exception; farming inactivity remains a separate question and
Swamp remains open.

## Frozen execution identity

| Field | Value |
|---|---|
| Experiment | `20260915t074612z-t4-volcano-finish-reference-em` |
| Experiment root | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em` |
| Source revision | `67a7722559c4e7b4063032bda179ed1e8796aa4d` |
| Source tree | `67798156542c8ddf0a795a03138d126907398f3a` |
| Container image | `sha256:e9a3b64774cb63e776f4bc8605b7b8a524d69cdcc26a68d0e4c000aec67e9506` |
| Build ID | `d3c80250aae2e90463dba29d` |
| Tooling hash | `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1` |
| Runtime hash | `f77975c67c8a759e0a1e3039f1d3ae4cbe88f42de3e691282d69202814fb700f` |
| Definitions hash | `92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4` |
| Input checkpoint | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t221002z-night3-mountain-control-r1-nig/runs/001-night3-mountain-control-r1-intended-r01/artifacts/night3-mountain-control-r1-intended-2026-09-14T22-12-28-393Z-15aeb7e3/checkpoint-night3-mountain-control-r1-returned.json` |
| Input SHA256 | `866db03766d0e7cd4ceeeea48506bd9c11c2a9eaf0f72037e49a0cc20c052f98` |
| Input state hash | `c17fccd4238740778cc6b78c5561c6edc2b4771e17b298783cb1786eb39e8bff` |
| Boundary | `night3-mountain-control-r1-returned` |
| Preflight | `C:/Users/osaif/AppData/Local/mmo-idle/validation/volcano-finish-preflight-frozen.json` |
| Preflight SHA256 | `7FBEF9AF2A6C12BDF7985FD7437B50753EA63F14D164F458AB14709F199009F2` |
| Runtime | Smoke-isolated, reward multiplier 1, one worker, one run per route, automatic retries 0, `maxRunMs=3600000`, `fastBossRetry=false` |
| Route order | `reference-empty`, `expose-empty`, `reference-colossus`, `expose-colossus` |

The manifest matched the packet exactly. The working tree was dirty, so the
experiment excluded unrelated working-tree changes as required; no checkout,
reset, source edit, balance edit, retry, relaunch, adaptation, or rebalance was
performed.

## Four-cell result

| Cell | Relic and treatment | Guardian result | Boss result | Volcano 4 / return | Overall |
|---|---|---|---|---|---|
| `t4-volcano-finish-reference-empty` | Empty; reference build, 35 RP | 9/9 cleared in 41,026 ms | First death at 439,244 ms; no boss victory | No / no | Aborted; treatment not asserted |
| `t4-volcano-finish-expose-empty` | Empty + Expose Weakness; 42 RP | 9/9 cleared in 36,535 ms | First death at 336,610 ms; no boss victory | No / no | Aborted; treatment not asserted |
| `t4-volcano-finish-reference-colossus` | Colossus Heart; reference build, 35 RP | 9/9 cleared in 44,540 ms | Caldera Sovereign victory; 37,534 ms boss combat | Yes / yes | Completed; valid |
| `t4-volcano-finish-expose-colossus` | Colossus Heart + Expose Weakness; 42 RP | 9/9 cleared in 42,034 ms | Caldera Sovereign victory; 35,528 ms boss combat | Yes / yes | Completed; valid |

The successful total boss-attempt durations were 92,087 ms and 88,071 ms,
including the approach/encounter window. All four cells were ready at the
encounter boundary. Only the two Colossus cells produced returned checkpoints.

## Controlled build and paid relic evidence

Every encounter used Offensive stance, Frenzy, Sweep, Hamstring, Second Wind,
and Cleanse. The Expose cells added Expose Weakness. Travel used Defensive
stance and 38 RP. No adaptive upgrade or extra purchase was made.

The two Colossus cells recorded the prescribed paid purchase before the
encounter: `relic-colossus-heart`, 3,300 blue essence and 10 heavy catalysts,
then equipped it in the relic slot. The Empty cells retained `relic: null`.

## Boss and final-phase evidence

The boss maximum HP was 20,646. The first boss sample and first retained sample
at or below 25% HP were:

| Cell | First boss sample | First sample at/below 25% | Player state at those samples |
|---|---|---|---|
| Reference + Empty | 408,435 ms; boss 20,039 | 432,437 ms; boss 4,845 (23.47%) | 389 HP / 265 barrier -> 337 / 0 |
| Expose + Empty | 305,433 ms; boss 20,096 | 329,434 ms; boss 4,985 (24.14%) | 389 / 265 -> 332 / 0 |
| Reference + Colossus | 235,419 ms; boss 20,427 | 266,424 ms; boss 4,995 (24.19%) | 389 / 265 -> 260 / 265 |
| Expose + Colossus | 222,424 ms; boss 20,436 | 250,429 ms; boss 4,671 (22.63%) | 389 / 265 -> 299 / 13.19 |

The final sampled tails show the separation at the same phase:

- Reference + Empty: boss HP `8,525 -> 6,402 -> 4,845 -> 4,302 -> 2,427`
  at 427,437, 430,437, 432,437, 434,438 and 437,436 ms; player HP ended
  `371 -> 363 -> 337 -> 293 -> 263.36` with no barrier after the first sample.
- Expose + Empty: boss HP `6,412 -> 4,985 -> 4,345 -> 3,663 -> 1,863`
  at 327,434, 329,434, 331,434, 333,434 and 335,434 ms; the player held at
  332 HP while barrier recovered from 0 to 265 before the terminal death.
- Reference + Colossus: boss HP `6,233 -> 5,737 -> 4,995 -> 2,416 -> 1,674`
  at 262,422, 264,423, 266,424, 269,423 and 271,423 ms; player HP was
  `278 -> 260 -> 260 -> 260 -> 260` and barrier recovered to 265.
- Expose + Colossus: boss HP `5,573 -> 4,671 -> 3,845 -> 1,716 -> 948`
  at 248,427, 250,429, 252,429, 254,429 and 256,429 ms; player HP was
  `335 -> 299 -> 263 -> 259.4 -> 334.03` and barrier was
  `21.19 -> 13.19 -> 13.19 -> 72.88 -> 205.45`.

The retained server attack markers advanced through each tail; they are
server-time fields and are not treated as direct differences from the
run-relative sample clock. The samples support a final-phase survival
comparison, not a full cast-by-cast damage model.

## Control, hazard, and death trace

| Cell | Boss-window actions | Magma Vent contacts | Escape evidence | Terminal trace |
|---|---|---|---|---|
| Reference + Empty | Frenzy 3; Hamstring 5; Sweep 6; Cleanse 3; Expose 0 | 2; 8,009 ms; 162 damage | Hazard escape 1/1; Step Back 1 attempt, 0 success | Top-level first death, melee 549, Caldera Sovereign; no named boss victory |
| Expose + Empty | Frenzy 3; Hamstring 5; Sweep 6; Cleanse 3; Expose 2 | 2; 1,200 ms; 36 damage | Hazard escape 1/1; Step Back 1 attempt, 0 success | Top-level first death, melee 549, Caldera Sovereign; no named boss victory |
| Reference + Colossus | Frenzy 3; Hamstring 7; Sweep 7; Cleanse 4; Expose 0 | 2; 5,006 ms; 108 damage | Hazard escape 3/3 | Named Caldera Sovereign kill and boss victory |
| Expose + Colossus | Frenzy 3; Hamstring 7; Sweep 7; Cleanse 3; Expose 3; Second Wind 1 | 2; 9,508 ms; 180 damage | Hazard escape 0; Step Back 1 attempt, discarded 1 | Named Caldera Sovereign kill and boss victory |

The two Empty deaths have separate terminal records naming a 549-damage melee
death from Caldera Sovereign. The last recorded Magma Vent events are
nonfatal 18-damage ground-zone DoT records: in the reference Empty run the
dominant-source total was 144 damage, and in the Expose Empty run it was 21.
Those rows must not be relabeled as the fatal hit. A `slam-telegraph` was
activated/attempted immediately before each Empty death, but no result was
recorded before the death. The telemetry therefore does not confirm a named
Cataclysm source or prove that the preceding telegraph caused the lethal melee
record; the visual animation/cancel interpretation remains a follow-up
playtest question.

In the successful Expose + Colossus run, the `slam-telegraph` result was
discarded because the caster disappeared before resolution and dealt zero
damage. That is post-kill cleanup evidence, not evidence of a successful
post-kill attack.

## Occupancy and evidence boundary

All four runs recorded `world.otherPlayersSeen=0` and
`contestedSamples=0`/`contestedFraction=0`. The retained summaries do not
expose a comparable world-seed identity, so this report does not claim that
the four runs used the same seed or make a seed-to-seed variance conclusion.

Every run carries `RESTORED_PROGRESSION_CHECKPOINT`, `SYNTHETIC_TIER_ENTRY`,
and `NON_CANONICAL_REWARD_MULTIPLIER` taints. The two Colossus wins establish
sampled encounter viability for this prepared reference; they do not certify
canonical rewards, economy, universal relic value, or population-wide balance.

## Release and resource cleanup

The generated cohort report was written before release. The release artifact
records `status: released` for network `mmoexp-218c86621b7b-network`; the
release command returned `already-released`, which is consistent with the
artifact state. The two scoped containers were stopped/exited and no scoped
network remained. Shared `gamedb` and `logdb` containers stayed healthy.

No Docker restart, global prune, shared-service change, RAM change, or artifact
deletion was performed. The next-stage resource check recorded 64,049,360,896
free bytes on C: and 4,559.9 MiB `vmmemWSL`; these are operational observations,
not gameplay evidence.

## Artifact index and hashes

Experiment root: [20260915t074612z-t4-volcano-finish-reference-em](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em>)

| Artifact | SHA256 |
|---|---|
| [cohort-summary.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/cohort-summary.json>) | `9E7372AE2DB4D1B91E7195A0C53A578F990544C2EE6227A7008C7F405386475A` |
| [experiment.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/experiment.json>) | `9156A12F4E716C486227CD94AB3D7FB996DD75561FAD9F629B9A784D827B55F2` |
| [experiment.sha256](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/experiment.sha256>) | `AB1382E472C853A6180FBE6B6642CD37A2745EE55730D7C99914C796673969FC` |
| [state.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/state.json>) | `70376DA0B9957405E898ECCBDE2CFA9C5EE76BA96B9C11230E1E2D1E79F41E79` |
| [supervisor-events.jsonl](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/supervisor-events.jsonl>) | `74F8495C64FFD049D9790EFE84663F2F2DF0AC8B60BF509F0D470381A0DA7DB7` |
| [network-release.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/network-release.json>) | `ED831DF9C1EC5684B59F25A856DCD989FAA3291C78948D621FC9ECB460AB88FE` |

The per-cell retained evidence is linked below. Ready checkpoints are present
for all four cells; returned checkpoints are present only for the two valid
Colossus cells.

| Cell | Summary | Events | Deaths | Ready checkpoint SHA256 | Returned checkpoint SHA256 |
|---|---|---|---|---|---|
| Reference + Empty | [summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/001-t4-volcano-finish-reference-empty-intended-r01/artifacts/t4-volcano-finish-reference-empty-intended-2026-09-15T07-48-08-802Z-1d4ed030/summary.json>) | [events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/001-t4-volcano-finish-reference-empty-intended-r01/artifacts/t4-volcano-finish-reference-empty-intended-2026-09-15T07-48-08-802Z-1d4ed030/events.jsonl>) | [deaths](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/001-t4-volcano-finish-reference-empty-intended-r01/artifacts/t4-volcano-finish-reference-empty-intended-2026-09-15T07-48-08-802Z-1d4ed030/deaths.jsonl>) | `3A253B7BFEC1DF25DEDF952F15DB0DDD1486FCD53D4F1BBD5CE1C8A958628559` | — |
| Expose + Empty | [summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/002-t4-volcano-finish-expose-empty-intended-r01/artifacts/t4-volcano-finish-expose-empty-intended-2026-09-15T07-55-46-686Z-b1ad7838/summary.json>) | [events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/002-t4-volcano-finish-expose-empty-intended-r01/artifacts/t4-volcano-finish-expose-empty-intended-2026-09-15T07-55-46-686Z-b1ad7838/events.jsonl>) | [deaths](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/002-t4-volcano-finish-expose-empty-intended-r01/artifacts/t4-volcano-finish-expose-empty-intended-2026-09-15T07-55-46-686Z-b1ad7838/deaths.jsonl>) | `9C18931D3DDEB9173A566121CB6B51294DBF0C1075180BFBC2469B679A599988` | — |
| Reference + Colossus | [summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/003-t4-volcano-finish-reference-colossus-intended-r01/artifacts/t4-volcano-finish-reference-colossus-intended-2026-09-15T08-01-41-295Z-6d9c7f58/summary.json>) | [events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/003-t4-volcano-finish-reference-colossus-intended-r01/artifacts/t4-volcano-finish-reference-colossus-intended-2026-09-15T08-01-41-295Z-6d9c7f58/events.jsonl>) | [deaths](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/003-t4-volcano-finish-reference-colossus-intended-r01/artifacts/t4-volcano-finish-reference-colossus-intended-2026-09-15T08-01-41-295Z-6d9c7f58/deaths.jsonl>) | `DAC3E68C891B673BF346D25BA8EBE85ED58142F9A4DCC502501C7FFA9F545DCE` | `04D55FDA187FDECE4633614941CC31C2CEBB944DEB6517A818250F247C3BDDC3` |
| Expose + Colossus | [summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/004-t4-volcano-finish-expose-colossus-intended-r01/artifacts/t4-volcano-finish-expose-colossus-intended-2026-09-15T08-09-38-246Z-d414ee28/summary.json>) | [events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/004-t4-volcano-finish-expose-colossus-intended-r01/artifacts/t4-volcano-finish-expose-colossus-intended-2026-09-15T08-09-38-246Z-d414ee28/events.jsonl>) | [deaths](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260915t074612z-t4-volcano-finish-reference-em/runs/004-t4-volcano-finish-expose-colossus-intended-r01/artifacts/t4-volcano-finish-expose-colossus-intended-2026-09-15T08-09-38-246Z-d414ee28/deaths.jsonl>) | `B725250C5BC49F92230BE799ECBB65EF9111C6538F15BFC8DF0D0490A1105816` | `A49769BC9C3C944F51E9D4B379C5DD5A017767877D0E6B4093CEE1441DA779E6` |

Per-cell event hashes are: reference Empty events
`787CCBB733038A1D2AF2C15D0F377E2F1D7CA19C9BF08DAA74CF9AD975C9723E`,
Expose Empty events
`C3D49EB2CE90C3DBDB82832E4C615E70811F98C7227786A6EBDC02D7C015205B`,
reference Colossus events
`EED519446C2E6ED51CC73726ACFF93CE01E46812E758F6D53E7BC50C2A9FECD2`,
and Expose Colossus events
`4C6A49C79BDD841666930908D98DEA4A47152EC37AC34EE6374F52533A0F0D90`.

## Next decision

Use the Colossus-prepared reference when Volcano is included in the next
scoped measurement. Do not spend another routine Volcano replica on the same
Empty-versus-Colossus finishing question. Keep the Empty first-death case as
a tracked robustness exception, retain the separate productive-inactivity
diagnostic, and continue the planned order of mobs -> items -> classes ->
canonical 1x economy. No balance or source change follows from this report.
