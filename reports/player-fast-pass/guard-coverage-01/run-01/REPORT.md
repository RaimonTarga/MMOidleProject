# Guard coverage 01 — run 01

## Short answer

The one-time sealed 32-cell run completed successfully: 32/32 fresh observations, 22 lives reached the 1,800,000 ms cap, and 10 ended at first death. There were no process failures, retries, reused rows, omissions, or unstarted rows. The measured source was the frozen `15aef70b72bc0eead1511a32a93f72a97299ea7c` checkout, and every result is synthetic with `economyEligible=false`.

Endure was a strong matchup-specific survival intervention for the two Striker packages: it converted all four Desert deaths into cap survivors and kept all four Graveyard lives alive, but it did not guarantee more work. Champion is mixed across all four arms: Endure rescued both Desert seeds, while Mountain + Endure still died in Graveyard seed `101021` at 29.5 seconds to Hound Plague DoT. These are fixed-package references, not universal class, Guard, or economy conclusions.

## Five findings

1. **The sealed coverage and evidence contract completed cleanly.** The run receipt reconciles 32 planned, 32 completed, 32 new, 0 reused, 0 failed, 0 omitted, and 0 not-run. The dispatcher exited 0 after the exact ordered ledger. The raw inventory contains 490 unique paths and 1,426,180,023 bytes; the 32 zero-byte entries are the expected empty Conduit streams for non-Conduit cases. No raw histories are included in this publication.

2. **Endure materially extends Striker survival, but not uniformly the work.** Berserker and Juggernaut static Desert rows died at 213.8–478.1 seconds with 18–30 lifetime kills; every corresponding Endure row reached the cap with 111–160 kills. All four Striker Graveyard rows reached the cap. Juggernaut gained 7 endpoint work kills in each Graveyard seed; Berserker tied at seed `101009` and trailed at seed `101021` (365 versus 373 endpoint work kills). The relevant cost is 6/47 RP instead of 40/47 and Guard decision/cooldown priority, not a free durability increase.

3. **Champion is a four-arm matchup result, not a single-arm ranking.** In Desert seed `101009`, Mountain static died at 715.2 seconds with 53 kills, while Mountain + Endure, Inferno static, and Inferno + Endure reached the cap with 135, 130, and 142 kills. In Desert seed `101021`, both Endure arms reached the cap (130 and 138 kills), while Mountain static died at 88 seconds and Inferno static died at 42.9 seconds. In Graveyard seed `101009`, all four arms reached the cap, with Inferno static highest at 438 kills; in Graveyard seed `101021`, Mountain + Endure died at 29.5 seconds while both Inferno arms reached 431 kills. The adverse Graveyard counterexample is preserved, not repaired or averaged away.

4. **The remaining Endure failure is a supported DoT/Cleanse timing question.** The failed Champion Mountain + Endure Graveyard `101021` row cast Endure once and recorded 8,300 ms sampled Endure-active time; the pre-terminal sample still showed Endure with 1,800 ms remaining and a 5,800 ms cooldown, while the terminal event was 53 Hound Plague DoT with `monster-dot:hound-plague` still present. Brace was on a 3,500 ms cooldown at the terminal sample. This identifies one prospective correction to inspect—Guard ordering/cadence around Hound Plague and Cleanse—not authorization for a coefficient change, timer sweep, or third variant. The synchronous incoming-pipeline sample is supporting mitigation state, not a replacement for the lethal DoT event.

5. **Champion's early replacement payment is observable and remains separate from owner damage.** In Desert seed `101021`, Inferno static paid the first 418 HP replacement at 40.5 seconds and died at 42.9 seconds after direct 71 HP damage; Inferno + Endure paid 418 HP at 40.9 seconds and continued to the cap with 138 kills and 25 recorded replacement payments. Mountain static had no replacement payment before its 88-second death; Mountain + Endure's first payment was at 87.3 seconds and it reached the cap. The 418 HP payment is a Conduit/minion receipt, not owner HP damage, and does not by itself establish causation.

## Three decisions

1. **Adopt as a bounded reference:** retain Inferno + Endure as a practical Guard-package reference for the tested Striker Desert/Graveyard settings, and retain the Champion Endure arms that reached the cap as matchup references. Carry the real 46/47 RP cost, Guard priority, and package-specific scope with the reference.

2. **Reject universal adoption or ranking:** do not declare Endure, Inferno, Mountain, Berserker, Juggernaut, or Champion globally best from two seeds. The Berserker Graveyard `101021` work regression and Champion Mountain + Endure Graveyard `101021` death are explicit counterevidence.

3. **Needs one identified correction:** if follow-up work is authorized, inspect the existing Cleanse/Guard decision ordering against Hound Plague during the Champion Mountain + Endure Graveyard failure. Do not implement it, add another arm, retune damage, infer a survival probability, or launch another campaign from this report alone.

## Frozen execution identity

| Field | Value |
| --- | --- |
| Experiment | `guard-coverage-01` |
| Frozen execution source | `15aef70b72bc0eead1511a32a93f72a97299ea7c` |
| Source tree SHA-256 | `8084f511c2510b926a4c6e71b8af1d547ec631d78198963d8b581dc6fa01c6c3` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Fixed checkout | `D:/mmo-idle/guard-coverage-01/source` |
| Packet | `D:/mmo-idle/guard-coverage-01/packet` |
| Launch receipt | `D:/mmo-idle/guard-coverage-01/packet/run-launched.json` |
| Run root | `D:/mmo-idle/guard-coverage-01/run-01` |
| Step / cap | `100 ms / 1,800,000 ms` |
| Stop rule | first player death; otherwise cap |
| Seeds | `101009`, `101021` |
| Workers / retries | `1 / 0` |
| Watchdogs | 5 GiB disk floor; 1 GiB host-RAM floor; 2 GiB child RSS ceiling; 120 s heartbeat timeout |
| Synthetic / economy eligible | `true / false` |
| Integration commit | `214d28cd4375bd179219fe5964785df4978e3df6` |
| Deployment | not performed |

The integration commit is the prepared five-file session correction; no gameplay coefficient, enemy shield value, or reconstruction cost was changed for this run. The execution checkout remained detached and separate from the publication checkout.

## Coverage and reconciliation

| Count | Value |
| --- | ---: |
| Planned | 32 |
| New completed | 32 |
| Reused | 0 |
| Failed | 0 |
| Omitted | 0 |
| Not run | 0 |
| Window-ended cap survivors | 22 |
| Player deaths | 10 |
| Lifetime `completedKills` | 6,269 |
| Endpoint `work.kills` | 6,274 |
| Work `hpDamage` | 19,654,646 |
| Work `absorbed` | 134,549 |
| Incoming HP damage | 1,544,808.475 |
| Unfinished targets | 67 |
| Target regain count | 0 |

`complete.json` is the terminal receipt. The run's `PARTIAL.md` is retained externally as dispatcher status, not used as a substitute for the completion receipt. Lifetime `completedKills` and endpoint `work.kills` remain separate; the five-kill difference is preserved.

## Matched outcome ledger

`work @300/900/1800` is endpoint `work.kills`; a missing post-death endpoint is `null`, never zero. `end HP` is the endpoint owner HP at 1,800,000 ms when present. `HP work / absorbed` separates owner HP damage dealt from absorption. Guard values are sampled active milliseconds as `Brace / Endure / overlap`; activation events remain in external `guard-events.jsonl`. Static arms use 40/47 RP; Endure arms use 46/47 RP.

| Package | Fixture | Seed | Arm | Result / elapsed | Lifetime kills | Work @300/900/1800 | End HP | HP work / absorbed | Unfinished | Guard active B/E/O ms |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: | ---: |
| Berserker A | Desert-03 | 101009 | Inferno static (40/47) | player-died / 1548.4 s | 136 | 28/80/null | null | 842998 / 10950 | 2 | 196000/0/0 |
| Berserker A | Desert-03 | 101009 | Inferno + Endure (46/47) | window-ended / 1800 s | 154 | 24/76/154 | 674 | 950765 / 12750 | 2 | 56000/985100/32800 |
| Berserker A | Desert-03 | 101021 | Inferno static (40/47) | player-died / 213.8 s | 18 | null/null/null | null | 118585 / 1500 | 2 | 35000/0/0 |
| Berserker A | Desert-03 | 101021 | Inferno + Endure (46/47) | window-ended / 1800 s | 160 | 25/80/160 | 674 | 971411 / 13200 | 0 | 70000/950000/47600 |
| Berserker A | Graveyard-03 | 101009 | Inferno static (40/47) | window-ended / 1800 s | 373 | 64/192/375 | 674 | 1348586 / 0 | 7 | 3500/0/0 |
| Berserker A | Graveyard-03 | 101009 | Inferno + Endure (46/47) | window-ended / 1800 s | 373 | 64/192/375 | 674 | 1348586 / 0 | 7 | 7000/120000/3600 |
| Berserker A | Graveyard-03 | 101021 | Inferno static (40/47) | window-ended / 1800 s | 373 | 55/183/373 | 674 | 1355101 / 0 | 6 | 7000/0/0 |
| Berserker A | Graveyard-03 | 101021 | Inferno + Endure (46/47) | window-ended / 1800 s | 364 | 55/180/365 | 674 | 1309020 / 0 | 4 | 10500/180000/5200 |
| Juggernaut C | Desert-03 | 101009 | Inferno static (40/47) | player-died / 425.9 s | 30 | 22/null/null | null | 139763 / 2100 | 2 | 49000/0/0 |
| Juggernaut C | Desert-03 | 101009 | Inferno + Endure (46/47) | window-ended / 1800 s | 111 | 18/56/111 | 674 | 578504 / 9150 | 1 | 99900/1020000/52900 |
| Juggernaut C | Desert-03 | 101021 | Inferno static (40/47) | player-died / 478.1 s | 30 | 18/null/null | null | 157307 / 2400 | 1 | 73500/0/0 |
| Juggernaut C | Desert-03 | 101021 | Inferno + Endure (46/47) | window-ended / 1800 s | 112 | 18/56/112 | 503.2 | 582545 / 9450 | 1 | 119000/950500/66200 |
| Juggernaut C | Graveyard-03 | 101009 | Inferno static (40/47) | window-ended / 1800 s | 296 | 52/150/296 | 674 | 784938 / 0 | 4 | 3500/0/0 |
| Juggernaut C | Graveyard-03 | 101009 | Inferno + Endure (46/47) | window-ended / 1800 s | 303 | 52/153/303 | 674 | 789864 / 0 | 3 | 3500/150000/3500 |
| Juggernaut C | Graveyard-03 | 101021 | Inferno static (40/47) | window-ended / 1800 s | 273 | 39/134/273 | 652.1 | 721869 / 0 | 5 | 21000/0/0 |
| Juggernaut C | Graveyard-03 | 101021 | Inferno + Endure (46/47) | window-ended / 1800 s | 280 | 39/134/280 | 674 | 743529 / 0 | 5 | 17500/270000/4700 |
| Champion B | Desert-03 | 101009 | Mountain static (40/47) | player-died / 715.2 s | 53 | 22/null/null | null | 236401 / 5075 | 0 | 60800/0/0 |
| Champion B | Desert-03 | 101009 | Mountain + Endure (46/47) | window-ended / 1800 s | 135 | 22/66/135 | 316.6 | 604931 / 12709 | 1 | 128700/1013100/62200 |
| Champion B | Desert-03 | 101009 | Inferno static (40/47) | window-ended / 1800 s | 130 | 22/62/130 | 537.2 | 593011 / 12665 | 1 | 126000/0/0 |
| Champion B | Desert-03 | 101009 | Inferno + Endure (46/47) | window-ended / 1800 s | 142 | 24/74/142 | 373.6 | 618714 / 14255 | 2 | 66500/814800/62300 |
| Champion B | Desert-03 | 101021 | Mountain static (40/47) | player-died / 88 s | 4 | null/null/null | null | 29924 / 415 | 1 | 10500/0/0 |
| Champion B | Desert-03 | 101021 | Mountain + Endure (46/47) | window-ended / 1800 s | 130 | 20/66/130 | 520.8 | 601352 / 13630 | 1 | 115500/990000/58200 |
| Champion B | Desert-03 | 101021 | Inferno static (40/47) | player-died / 42.9 s | 2 | null/null/null | null | 17551 / 265 | 2 | 3500/0/0 |
| Champion B | Desert-03 | 101021 | Inferno + Endure (46/47) | window-ended / 1800 s | 138 | 20/64/138 | 568 | 618154 / 14035 | 0 | 87500/860000/55600 |
| Champion B | Graveyard-03 | 101009 | Mountain static (40/47) | player-died / 177.7 s | 33 | null/null/null | null | 55141 / 0 | 1 | 3500/0/0 |
| Champion B | Graveyard-03 | 101009 | Mountain + Endure (46/47) | window-ended / 1800 s | 377 | 61/192/377 | 568 | 622380 / 0 | 1 | 14000/390000/14000 |
| Champion B | Graveyard-03 | 101009 | Inferno static (40/47) | window-ended / 1800 s | 438 | 70/219/438 | 568 | 723756 / 0 | 1 | 42000/0/0 |
| Champion B | Graveyard-03 | 101009 | Inferno + Endure (46/47) | window-ended / 1800 s | 428 | 66/208/428 | 568 | 714908 / 0 | 0 | 28000/170000/27200 |
| Champion B | Graveyard-03 | 101021 | Mountain static (40/47) | player-died / 28.4 s | 5 | null/null/null | null | 10105 / 0 | 2 | 3500/0/0 |
| Champion B | Graveyard-03 | 101021 | Mountain + Endure (46/47) | player-died / 29.5 s | 6 | null/null/null | null | 10605 / 0 | 1 | 3500/8300/3500 |
| Champion B | Graveyard-03 | 101021 | Inferno static (40/47) | window-ended / 1800 s | 431 | 68/217/431 | 568 | 727478 / 0 | 1 | 28000/0/0 |
| Champion B | Graveyard-03 | 101021 | Inferno + Endure (46/47) | window-ended / 1800 s | 431 | 68/216/431 | 534.4 | 726864 / 0 | 0 | 35000/200000/34200 |

All 32 rows carry `measuredSourceCommit`, `fixture`, `seed`, `arm`, `runicPoints`, `guards`, `deathEvidence`, `conduit`, `initialRosterHash`, and the full `evidenceDirectory` in `results-summary.json`. The exact raw artifact directory for an observation is:

```text
D:\mmo-idle\guard-coverage-01\run-01\<observationId>\artifacts\<observationId>-s<seed>
```

This is the external evidence root for `events.jsonl`, `samples.jsonl`, `guard-events.jsonl`, `summary.json`, `index.json`, and the applicable Conduit histories.

## Champion four-arm comparison

The values below are `outcome / lifetime completedKills`; `cap` means the 1,800,000 ms endpoint. All four arms are shown within each fixture and seed.

| Fixture / seed | Mountain static | Mountain + Endure | Inferno static | Inferno + Endure |
| --- | --- | --- | --- | --- |
| Desert-03 / 101009 | player-died / 53 at 715.2 s | cap / 135 | cap / 130 | cap / 142 |
| Desert-03 / 101021 | player-died / 4 at 88.0 s | cap / 130 | player-died / 2 at 42.9 s | cap / 138 |
| Graveyard-03 / 101009 | player-died / 33 at 177.7 s | cap / 377 | cap / 438 | cap / 428 |
| Graveyard-03 / 101021 | player-died / 5 at 28.4 s | player-died / 6 at 29.5 s | cap / 431 | cap / 431 |

## Death review

The following table summarizes the final 15,000 ms using world events plus Guard recorder data. `HP/abs` is incoming player HP damage versus absorption from `damage` events. `heal events/recorded HP` is the existing rounded heal stream, not source-specific effective healing. Guard strings are actual activation counts in that window. `before` is the pre-terminal sampled state; `pipeline` is the synchronous incoming-pipeline receipt and is not necessarily the lethal event.

| Case | Death event | Last 15 s incoming HP/abs; recorded heals | Debuff / recovery context; Guard activations | Before terminal; pipeline receipt |
| --- | --- | --- | --- | --- |
| Berserker A Desert 101009 static | melee Dune Tyrant 136 at 1548.4 s | 1694 / 0; 111 / 1010 | slow gained/expired; pulse 3.1 s at 30%; Cleanse 2, Second Wind 1, Brace 1 | HP 273.2, barrier 0; Brace 0 ms / 1.3 s cooldown; pipeline 136 at 1548.4 s, state HP 122.2, Brace cooldown 1.2 s |
| Berserker A Desert 101021 static | ranged Sunshield Scarab 151 at 213.8 s | 1694 / 0; 108 / 1010 | slow remained in terminal sample; pulse 2.7 s at 30%; Cleanse 2, Second Wind 1, Brace 1 | HP 137.2, barrier 0; Brace 0 / 1.3 s; pipeline 151 at 213.8 s, state HP 137.2, Brace cooldown 1.2 s |
| Juggernaut C Desert 101009 static | ranged Sunshield Scarab 151 at 425.9 s | 1694 / 0; 108 / 1006 | slow gained/expired; pulse 2.8 s at 30%; Cleanse 2, Second Wind 1, Brace 1 | HP 137.2, barrier 0; Brace 0 / 1.1 s; pipeline 151 at 425.9 s, state HP 137.2, Brace cooldown 1.0 s |
| Juggernaut C Desert 101021 static | ranged Sunshield Scarab 151 at 478.1 s | 1805 / 0; 120 / 1127 | slow remained in terminal sample; pulse 2.0 s at 30%; Cleanse 2, Second Wind 1, Brace 1 | HP 150.5, barrier 0; Brace 0 / 0.9 s; pipeline 151 at 478.1 s, state HP 150.5, Brace cooldown 0.8 s |
| Champion B Desert 101009 Mountain static | ranged Sunshield Scarab 20 at 715.2 s | 637 / 239; 96 / 568 | root/sundered remained; no recovery window; Cleanse 2, Second Wind 1, Brace 2 | HP 0.6, barrier 0; Brace 2.3 s / 8.8 s; pipeline 20 at 715.2 s, state HP 0.6, Brace cooldown 8.7 s |
| Champion B Desert 101021 Mountain static | ranged Sunshield Scarab 172 at 88.0 s | 1345 / 239; 217 / 1113 | root/sundered/slow; no recovery window; Cleanse 1, Second Wind 1, Brace 1 | HP 92.0, barrier 0; Brace 0 / 1.2 s; pipeline 172 at 88.0 s, state HP 94.9, Brace cooldown 1.1 s |
| Champion B Desert 101021 Inferno static | ranged Sunshield Scarab 71 at 42.9 s | 992 / 0; 168 / 905 | slow/mob-burst; no recovery window; Cleanse 1, Second Wind 1, Brace 1 | HP 67.0, barrier 0; Brace 0 / 2.7 s; pipeline 71 at 42.9 s, state HP 67.0, Brace cooldown 2.6 s |
| Champion B Graveyard 101009 Mountain static | DoT Plague Hound 53 at 177.7 s | 979 / 239; 40 / 400 | Hound Plague DoT; no recovery window; Cleanse 2, Second Wind 1, Brace 1 | HP 39.6, barrier 0; Brace 0 / 3.5 s; pipeline 18 at 177.2 s, state HP 57.6, Brace cooldown 3.9 s; lethal DoT followed the pipeline sample |
| Champion B Graveyard 101021 Mountain static | DoT Plague Hound 53 at 28.4 s | 978.2 / 70.8; 40 / 400 | Hound Plague DoT; no recovery window; Cleanse 2, Second Wind 1, Brace 1 | HP 40.4, barrier 0; Brace 0 / 4.6 s; pipeline 18 at 27.8 s, state HP 58.4, Brace cooldown 5.1 s; lethal DoT followed the pipeline sample |
| Champion B Graveyard 101021 Mountain + Endure | DoT Plague Hound 53 at 29.5 s | 1000.2 / 24.8; 40 / 400 | Hound Plague DoT plus slow; no recovery window; Cleanse 2, Second Wind 1, Brace 1, Endure 1 | HP 18.4, barrier 0; Brace 0 / 3.5 s; Endure 1.8 s remaining / 5.8 s cooldown; pipeline 13 at 27.8 s, state HP 104.4, Endure 3.4 s remaining / 7.4 s cooldown |

The exact `deathEvidence`, terminal `guards` state, recovery windows, last incoming pipeline receipt, source/target IDs, and raw event directory are preserved in `results-summary.json` and the external case artifacts. The recorder's active time is based on 100 ms post-tick samples; it is not exact continuous uptime. Unsupported source-specific healing and overheal remain `null`.

## Champion Desert 101021 replacement-payment context

`replacement-paid` is read from each case's external `conduit-events.jsonl`. The 418 HP value is the fixed Conduit replacement payment and is not owner HP damage.

| Arm | First replacement payment | Early owner/death context | Final result |
| --- | --- | --- | --- |
| Mountain static | none before death | Player died at 88.0 s with 4 kills; no replacement payment was recorded before the terminal event | player-died / 4 |
| Mountain + Endure | 87.3 s, 418 HP | Continued after the first payment; 8 replacement payments were recorded; 300 s endpoint owner HP 370.8 | cap / 130 |
| Inferno static | 40.5 s, 418 HP | Owner samples were 517.2 HP at 40.0 s, 78.4 HP at 41.0 s, and 42.3 HP at 42.0 s; the row died at 42.9 s to a direct 71 HP Scarab hit | player-died / 2 |
| Inferno + Endure | 40.9 s, 418 HP | Continued through repeated payments; 25 replacement payments were recorded; first 300/900/1800 endpoint work was 20/64/138 | cap / 138 |

The payment receipt establishes timing and amount only. It does not prove that the payment caused owner damage, and the report does not reconstruct a counterfactual without that payment.

## Integrity and publication files

The publication directory contains only the readable report, compact result/identity/build receipts, completion receipt, seal, and a bundle-local `* -text` rule to preserve evidence bytes. Raw JSONL histories, databases, credentials, and unrelated worktree artifacts remain outside Git.

| File | SHA-256 |
| --- | --- |
| `results-summary.json` | `f627053e2157793ac2a3732a969ab551bd85cb55aae418a44aa0b9ee423fb248` |
| `complete.json` | `6269ee194cae79a50e3ab78d0303f28815062942ec5da577bb8787a87c38ac2a` |
| `manifest.json` | `e675ce7dd837b5e70f08fb08539bd150586b38d9f94496282f0fb8979b7da21d` |
| `identity.json` | `7cde89c2c2ee85baf717c35749e3948a17e1c26af18d090f8c944d49fed9fe14` |
| `resolved-builds.json` | `d70c15f34c54c4f4a7fada1866c9cc670266eda06222f5ec3fc11f88b147b28a` |
| `raw-inventory.json` | `1ce1b268cb1ca6f6c7b9eb6aa9a40bb7d5a6f9ba2c943902f45a646297be8e3d` |
| `seal.json` | `3b0b1f42f8b5a1dd5d49d8de6d5f7253d5c48cb6a5d54d8963c64c285d206d99` |

The copied `manifest.json` and `identity.json` match the sealed packet hashes. `resolved-builds.json` is the build/readback receipt; it retains each package's equipment, mastery, stance, Rune rules, ability package, RP, initial roster, and sustain state. `results-summary.json` is the machine-readable row contract and is the authoritative index into external raw evidence.

## Interpretation limits

- This is synthetic combat evidence only. It is not live playtest, player acquisition, economy calibration, deployment verification, or a universal balance proof.
- Endpoint rows are continuous-life checkpoints at 300,000 / 900,000 / 1,800,000 ms. A death before a checkpoint has `null` for that checkpoint; it is not a zero-work observation.
- `completedKills` is the lifetime counter. `endpoints[].work.kills` is interval/cumulative endpoint work. The report preserves both, including the 373-versus-375-style discrepancies.
- `hpDamage` and `absorbed` are separate. Absorption is not HP progress, and a cap without unfinished-target context is not a farming rescue.
- `guards.lastIncomingPipeline` is a synchronous production-mitigation capture. It may not represent non-pipeline damage such as the recorded lethal DoT; it must be matched to authoritative `events.jsonl` and `deathEvidence`.
- Actual Guard casts are activation events. Sampled active milliseconds are not exact continuous uptime, and opportunity counters are not exact firing decisions.
- Source-specific effective healing, overheal, counterfactual damage lost, and counterfactual healing remain unavailable.
- No deployment, source edit, numerical tuning, retry, alternate family, or follow-up run was performed.
