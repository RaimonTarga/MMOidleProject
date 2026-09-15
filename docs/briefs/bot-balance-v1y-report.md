# Bot Balance V1y Report — Voidwalker T4 entry and Mountain farming

## Outcome

V1y completed the prescribed one-character, one-worker continuation from the exact V1x T4 handoff. The run:

- unlocked Voidwalker through energy-heavy-t3-a while retaining the ranged Wisp selection, Cinderlash T3+5, Accelerant, and the authored ability/rune strategy;
- evolved and equipped Mountain T4 armor and recovery, reached Mountain24 and GM124, then bought exactly +1 on both T4 defense items;
- entered T4 through the exact authored waypoint route, completed a 301209 ms Mountain observation step against the natural T4 Mountain pool, returned to T4 Sanctuary, recovered, and captured v1y-mountain-qualified-returned;
- completed all 51/51 route steps with no death, no retry, no resource block, no boss attempt, and no source or balance edit.

The final returned capture is T4, currentSkillTier4, level704, GM124, Mountain24, Desert16, 367/367 HP, 246/246 barrier, incomingDoT=0, and isDead=false. The run is a successful T4 entry, affordable-defense, and sustained-Mountain-survival qualification.

This remains diagnostic evidence rather than canonical combat or economy certification. The continuation was smoke-isolated and inherited a restored, synthetic tier-entry checkpoint. The final summary reports canonical=false, combatEvidenceEligible=false, and economyEvidenceEligible=false. Swamp was only crossed at the authored T3 waypoint; no Swamp waiting or balance conclusion was attempted.

## Frozen scope and qualification

- Packet: docs/briefs/bot-balance-v1y-operator-packet.md, prepared 2026-09-14.
- Frozen source revision: 7bf4dd35bbdd8dfbf2062b775c239f295173f77d.
- Frozen source tree: 70c6ea93523bab0d4a065dffe79b8e70136cb196.
- Image tag: mmo-idle-experiment:7bf4dd35bbdd-d90e6996.
- Image ID: sha256:e05217ec326cbf64130f932c7d0a15380bc20820b030a72c5bc783560d6a7261.
- Build ID: 2ebb3d179ce19dea1f5509c9; tooling hash d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1; runtime hash f77975c67c8a759e0a1e3039f1d3ae4cbe88f42de3e691282d69202814fb700f.
- Exact input checkpoint: C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t174337z-spirit-t4-handoff-v1x/runs/001-spirit-t4-handoff-v1x-intended-r01/artifacts/spirit-t4-handoff-v1x-intended-2026-09-14T17-45-41-998Z-7289c541/checkpoint-v1x-t4-unlocked-returned.json.
- Input SHA-256: d910df5f3950ca5f28c39ded7ce770848bf60b1566edc894de1cab20f2f4409b.
- Input boundary: v1x-t4-unlocked-returned.
- Input persistent state hash: ef6cf62d0ad91910392d1569e7b4305cbc29162792b04f9fa50c52091d370d89.
- Input source revision: 4a6703f3f3a9e7dfb0d72c2a78789cffa884a1f6.
- Input and current definitions hash: 92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4.

The preflight qualification artifact was C:/Users/osaif/AppData/Local/mmo-idle/validation/v1y-preflight-qualified-20260914.json, SHA-256 f5e5cad5d9b0065b558907b601ef8d4a9cd19a7430b148c28efcae98c7bbd66a. It is setup-only-hypothetical-future-mastery with ticks=0. The packet-specific bot/diagnostics TypeScript, actual-input restoration, route/map validation, and observation/transit checks passed. Full repository tests and live/browser playtesting were not run for V1y.

The manifest recorded a dirty invocation worktree but dirtyWorkingTreeIncluded=false. No checkpoint was edited and all inherited, synthetic, and eligibility taints were preserved:

RESTORED_PROGRESSION_CHECKPOINT, SYNTHETIC_TIER_ENTRY, NON_CANONICAL_REWARD_MULTIPLIER.

Definition-section hashes were unchanged:

| Section | SHA-256 |
|---|---|
| config | 7827aa449db57109b4c23357f4646daf4aec59da5e49164e20aa02d6baca5355 |
| world | 1a43c8d6a452d25601c14e17029404c50e2da2c458e0973e18d2338d7c9cbcd0 |
| features | 31ca83b787038c80334757f444e52340c868c6e17c707ee2a0fdaf43ff10eedc |
| skills | 2229539f310217e86392dc17a3d715b9432bd7e6422713b081221db6d4137582 |
| items | 0baa4525b010d3408fff0d777fffcbd8828f7c56d9cebf1f1b8026af7f011ede |
| recipes | 39d3694329a9ef89700a43ff90d17a3192320936c8da0672d3dd3dbf6ef79e65 |
| abilities | 10cff5648352688bccb829ce1eea30df4127074bfe335ba845a893d07cf5c814 |
| runeRecipes | fd39e0431224dea99cf89d0a5e9f10daf9a7359324803edc34e933f299adb46f |
| monsters | 9dce216ba7959e6ce55260583b9619e6a4c1144f62d64fff23720e0cefa88698 |
| stances | dff6e1ce33e51f42ad36ea437858a300fa225499c02a228d921ebd8c3f1cdaa6 |
| rites | 80390485796a3b51dc387a716ca7e80571b148d3334402af068c3a8185f151f9 |

## Experiment lifecycle

Experiment ID:

20260914t183213z-voidwalker-mountain-entry-t4-v

Artifact root:

C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t183213z-voidwalker-mountain-entry-t4-v

The sealed configuration was smoke-isolated, full-gauntlet, one worker, one intended case, reward multiplier 1, worker memory limit 768m, maxRunMs=5400000, fastBossRetry=false, and automaticRetries=0. The manifest contained exactly one route: voidwalker-mountain-entry-t4-v1y.

- experiment:create succeeded from the frozen revision and sealed one case.
- The corrected launch started one supervisor and one worker. No additional replica or automatic retry was created.
- experiment:status reached supervisor=completed, run status completed, reason bot_completed.
- experiment:report succeeded and produced the cohort summary.
- experiment:release recorded status=released. A second release call returned already-released.
- The scoped Postgres and Redis containers exited with code 0; the experiment network was removed. The two stopped experiment database containers were retained by the release record. Shared mmo-gamedb, mmo-logdb, and mmo-redis remained healthy.

Run artifact directory:

C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t183213z-voidwalker-mountain-entry-t4-v/runs/001-voidwalker-mountain-entry-t4-v1y-intended-r01/artifacts/voidwalker-mountain-entry-t4-v1y-intended-2026-09-14T18-36-16-711Z-4f3c4531

| Run | Duration | Route progress | Terminal status |
|---|---:|---:|---|
| 001-voidwalker-mountain-entry-t4-v1y-intended-r01 | 604224 ms | 51/51 | completed / bot_completed |

The supervisor assigned the run at 2026-09-14T18:36:09.969Z; the bot run-start wall clock was 2026-09-14T18:36:16.719Z and the route run-end event was 2026-09-14T18:46:20.943Z at elapsed 604224 ms. The supervisor completed at 2026-09-14T18:46:33.430Z.

## Starting state and preparation

The restored V1x input was used exactly as supplied. Its authoritative starting state was:

| Field | Value |
|---|---|
| Node | node-t3-sanctuary |
| Tier / current skill tier | 4 / 3 |
| Level / skill points | 421 / 1 |
| Global mastery | 120 |
| Mountain / Desert | 22 / 14 |
| HP / barrier | 307/307 / 196/196 |
| Class | energy-root, heavy |
| Range | energy-range-far |
| Weapon | volcanic-cinderlash +5 |
| Armor | mountain-vest-t3 +5 |
| Recovery | mountain-charm-t3 +5 |
| Mobility / core | desert-boots-t2 +5 / core-accelerant |
| Essences | red 2199, blue 11019, green 5369, yellow 15583, purple 16481 |
| Catalysts | alacrity 53, heavy 69, swarming 49, dominion 131, fortified 333 |

Restore evidence reports result.success=true, normalized=true, changedDefinitionSections=[], setupMs=54, restoreMs=76, and skippedPreparation=inherited; not earned or timed in this run. The restored input's safe-rested boundary was retained; setup and inherited progress are not counted as V1y earnings.

Preparation receipts were:

| Operation | Evidence |
|---|---|
| Voidwalker unlock | energy-heavy-t3-a; skill points 1→0; energy-range-far remained selected; currentSkillTier advanced from 3 to 4 |
| Mountain armor evolution | mountain-vest-t3 → mountain-vest-t4; blue 256, red 64; no catalysts |
| Mountain recovery evolution | mountain-charm-t3 → mountain-charm-t4; blue 220, red 30; no catalysts |
| T4 base kit | Both items equipped; base evolution spend blue 476, red 94 |
| Mountain armor +1 | blue 132, red 33; success=true |
| Mountain recovery +1 | blue 57, red 8; success=true |
| T4 +1 total | blue 189, red 41; zero catalysts |
| Full V1y gear spend | blue 665, red 135; zero catalysts |

The authored travel build was Defensive stance with Sweep and Hamstring, Second Wind, Brace, Cleanse, Break Free, the existing Avoid Enemies and Fight Back travel rules, and the existing seven-rune rule set: 38 RP. Mountain farming used Offensive stance with Frenzy and Hamstring and the same guards: 37 RP. The post-observation return restored the Defensive 38 RP build. Every build was observed and verified with no build issues.

## Checkpoints and continuity

All capture files below are in the run artifact directory given above. Every V1y capture has source revision 7bf4dd35bbdd8dfbf2062b775c239f295173f77d, definitions hash 92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4, canonicalAtCapture=false, and the three preserved source taints.

| Boundary | File | Captured at | Elapsed | Capture SHA-256 | Progression state hash | State |
|---|---|---|---:|---|---|---|
| v1y-voidwalker-base-kit | checkpoint-v1y-voidwalker-base-kit.json | 2026-09-14T18:36:34.792Z | 18074 ms | eceeed26fde213385c6c8744678de4989fea437b11fa9aab19497c5180635020 | 9f7c0208bcddc55482b7ee3cf2589d9621972054b9951b39b9aabb6255cada31 | T4/current skill tier 4, GM120, level421, Mountain22, Desert14, 344/344 HP, 227/227 barrier, T4 base kit |
| v1y-t4-sanctuary-arrived | checkpoint-v1y-t4-sanctuary-arrived.json | 2026-09-14T18:39:23.608Z | 186890 ms | 0de53a4aa835b9a18a5eaed16580b43d304b4444fe3fa1bec0af257a88c9eaf5 | 0718fb80996d8a9abffe29b7da41dfe055fb328947fa5f88ad866cda87afdc47 | T4, GM122, Mountain22, Desert16, T4 Sanctuary, 344/344 HP, 227/227 barrier |
| v1y-mountain24-returned | checkpoint-v1y-mountain24-returned.json | 2026-09-14T18:40:19.835Z | 243118 ms | 973049f0ac5be06b71ea56425410afc9fe1cad93dd538c12225e3baf4061b1f1 | f690abe7a24f8bf358583e3a76f5633c0d2a5bf2b1ebcde860c88fc174b60855 | Mountain24, GM124, level467, T4 Sanctuary before +1 upgrades, 344/344 HP, 227/227 barrier |
| v1y-plus1-ready | checkpoint-v1y-plus1-ready.json | 2026-09-14T18:40:32.508Z | 255790 ms | 58e18177dc12de55e201f549c6901e4f30c8d42c5621abcfac70c5e3aa8287f2 | ac7230219ea84d43b8f2a3da550a923350726a23839209c71df47b544873312a | Both T4 defense items +1, T4 Sanctuary, 367/367 HP, 246/246 barrier |
| v1y-mountain-qualified-returned | checkpoint-v1y-mountain-qualified-returned.json | 2026-09-14T18:46:20.922Z | 604204 ms | f15a9997537cfabef079ab66f30ac51637ad08fe95a410f89b31f8ee37a2bf83 | 1b75a7961da6a1a27caef4808cb26dffc46731e405a537b8aaa95595df5b615d | T4/current skill tier 4, level704, GM124, Mountain24, T4 Sanctuary, 367/367 HP, 246/246 barrier, incomingDoT=0, isDead=false |

The final capture is the V1y deliverable. It is a noncanonical continuation checkpoint, not a canonical economy or combat sample.

## Actual route trace

The exact authored route was:

node-t3-sanctuary → node-t3-swamp-06 → node-t3-jungle-04 → node-t3-jungle-03 → node-t4-desert-04 → node-t4-desert-01 → node-t4-desert-02 → node-t4-desert-05 → node-t4-mountain-05 → node-t4-sanctuary

Actual node-entry events, with modifiers from the event context:

| Elapsed | Node | Biome | Modifier |
|---:|---|---|---|
| 1393 ms | node-t3-sanctuary | Sanctuary | none |
| 27400 ms | node-t3-swamp-06 | Swamp | fortified |
| 36402 ms | node-t3-jungle-04 | Jungle | fortified |
| 55404 ms | node-t3-jungle-03 | Jungle | dominion |
| 86406 ms | node-t4-desert-04 | Desert | fortified |
| 99407 ms | node-t4-desert-01 | Desert | heavy |
| 121411 ms | node-t4-desert-02 | Desert | swarming |
| 145415 ms | node-t4-desert-05 | Desert | dominion |
| 162416 ms | node-t4-sanctuary | Sanctuary | none |
| 195422 ms | node-t4-mountain-05 | Mountain | heavy |
| 219426 ms | node-t4-sanctuary | Sanctuary | none |
| 264436 ms | node-t4-mountain-05 | Mountain | heavy |
| 581467 ms | node-t4-sanctuary | Sanctuary | none |

The base-kit recovery farm completed at 17422 ms and its capture completed at 18085 ms. The first T4 Sanctuary arrival and recovery completed at 186890 ms. The first Mountain farm ran 198920–213435 ms and reached Mountain24 at the authoritative biome-level-up event at 212842 ms. The return/recovery capture completed at 243128 ms, the +1-ready capture at 255801 ms, and the +1 observation started at 267318 ms.

The required post-upgrade observation was the authored node-t4-mountain-05 farm step from 267318 to 568527 ms, duration 301209 ms. This is the only sustained-observation total reported here. It was followed by the Defensive rebuild, return travel 571536–581043 ms, Sanctuary movement, recovery farm 592554–603559 ms, and final capture 603559–604214 ms.

The route fields timeMs, travelMs, and fightMs are overlapping views of the same timeline; they are not added together.

## Progression, encounters, and combat

Final progression:

- player tier 4; currentSkillTier 4; level 704; global mastery 124;
- Mountain 22→24 and Desert 14→16; other biome levels were unchanged;
- 51/51 route steps completed;
- no new boss attempt and no new boss seal; the inherited Mountain3 and Cave3 seals remained unchanged;
- milestones recorded: t4-entry-start at 18085 ms, mountain-mastery-start at 198920 ms, and mountain-plus1-observation-start at 267318 ms.

The natural pool and kill records were:

| Biome / modifier | Encounters and kills | Kills | Essence | Biome XP |
|---|---|---:|---:|---:|
| Mountain / heavy | Avalanche Tyrant 21; Granite Mammoth 20; Cliffside Roc 20; Cragback Rhino 13 | 74 | blue 4617 | 3132 |
| Desert / fortified | Dune Tyrant 1; Sunshield Scarab 1 | 2 | yellow 157 | 1713 |
| Desert / heavy | Sand Viper 1; Sunshield Scarab 1 | 2 | yellow 72 | 789 |
| Desert / swarming | Dune Basilisk 1; Sunshield Scarab 1 | 2 | yellow 90 | 988 |
| Jungle / fortified | Canopy Chameleon 1 | 1 | green 22 | 196 |
| Jungle / dominion | Silverback 3 | 3 | green 96 | 819 |
| Swamp / fortified | No kill | 0 | none | 0 |

The run-wide combat summary reports 84 kills, 88074 player damage dealt, 0 summon damage, 120.65 total direct damage taken, 1830.35 absorbed, 2205.35 healed, and hpLost=307.65. incomingByDamageType contained direct=120.65 and no DoT component. There were five target switches, no deaths, and no boss attempts. The empty deaths file is retained.

Engagement-start events and per-target time-to-kill values were not emitted by this runner. The report therefore uses kill records, node/modifier context, and the summary's per-biome aggregates without inventing engagement starts or TTK.

Concurrency remained isolated: the summary recorded 603 concurrency samples, 441 unengaged, 146 solo, 16 with two attackers, and zero with three or more. The event samples saw no other players; maximum attacker concurrency was two. The run's coordination summary reports maximumSimultaneouslyProgressing=1, contaminated=false, sharedAdmissions=0, and no controlled overlaps.

## Counterplay and survivability telemetry

Ability activations were Sweep 11, Hamstring 58, Frenzy 30, and Cleanse 1. Cleanse removed one slow. Second Wind, Brace, and Break Free had no activation records. Hazard escape attempts were 0, Step Back activations were 0, and no discharge, boss-phase, or early-execute event was emitted. No boss diagnostics were collected because the packet explicitly made no boss attempt.

The final returned capture was full HP and full barrier with no incoming DoT and isDead=false. The five retained captures were all made after the prescribed safe recovery steps. The runner's concurrency samples expose HP fraction but not a complete barrier time series: minimum sampled HP fraction was 0.579437 at elapsed 5394 ms during setup, while the exact live barrier minimum was not emitted. The report does not infer a barrier minimum from absorbed damage. Total direct damage was 120.65 and total absorbed damage was 1830.35.

The observed 5-minute Mountain window had 157 concurrency samples at node-t4-mountain-05, 53 with one attacker, no samples with two attackers, and no other players. The Mountain summary recorded 130011 ms fightMs, 0 damage taken, and 74 kills; this fightMs value is not substituted for the authored 301209 ms observation step.

## Economy boundary

Wallet snapshots show:

| Essence | Start | Final | Net |
|---|---:|---:|---:|
| red | 2199 | 2064 | -135 |
| blue | 11019 | 14971 | +3952 |
| green | 5369 | 5487 | +118 |
| yellow | 15583 | 15902 | +319 |
| purple | 16481 | 16481 | 0 |

Run-earned essence, separated from spend, was:

- Mountain: blue 4617;
- Desert: yellow 319;
- Jungle: green 118;
- Swamp and Sanctuary: none.

The only recorded spend was the prescribed blue 665 and red 135 for two T4 evolutions and two +1 upgrades. Catalysts spent were zero. New catalyst gains were heavy 85, swarming 2, dominion 2, and fortified 3; alacrity did not change. No farming rate, economy winner, or canonical reward conclusion is drawn because the run inherited progression and is marked economyEvidenceEligible=false.

## Resource observations

These observations keep worker cgroup memory, shared-service Docker stats, and host WSL memory separate.

### Before launch

The preflight timestamp was 2026-09-14T20:31:41.4234156+02:00. Shared logdb, gamedb, and redis were healthy; vmmemWSL was approximately 1226.0 MiB; C: had approximately 77.6 GB free. No competing experiment worker was present.

### During the run

The resource sample file contains 122 samples. The report summary recorded maximum worker memory 193.1 MiB, maximum container CPU 38.1%, and maximum event-loop P99 110.7 ms. The final resource sample was 192.8 MiB with event-loop P99 20.86 ms. These values do not establish a leak or reconstruct total Docker Desktop memory.

### After release

Timestamp: 2026-09-14T20:54:19.1848768+02:00.

- mmo-gamedb: healthy, 29.5 MiB, 0.00% CPU;
- mmo-logdb: healthy, 26.96 MiB, 0.00% CPU;
- mmo-redis: healthy, 10.58 MiB, 3.17% CPU;
- vmmemWSL: 3028.3 MiB;
- C: used 858.30 GB, free 72.31 GB;
- no V1y experiment container was running; the scoped Postgres and Redis containers were retained stopped with exit code 0.

No Docker restart, RAM-setting change, global prune, or destructive cleanup was used.

## Next decision

V1y met its stop condition and this operator stops here. The next authorized Astra pass can extend mastery to other T4 biomes and gear before any boss screen. Swamp remains unresolved and should not be labeled a balance defect from this run.

## Integrity ledger

Root artifact hashes:

| File | SHA-256 |
|---|---|
| experiment.json | 17147e179957b8d26e76f6d0de7d97cfa001896fad3d7da7a28e2295e10ef53f |
| experiment.sha256 | 849212457e2cb7558bd1e2b21652f4d8f4905210b8644a51f5be6c6e4aa5f225 |
| cohort-summary.json | 012a9319c13db5c46e81194e96e46a1bc40964a14840fb959fac1c1f03418993 |
| state.json | 0457d9c7c16c3d8b0a8815f274eb5347bd9b55e01497672e138fcd02a9243bef |
| supervisor-events.jsonl | 4bfedde6c2174a81f0dc460b5ac0605bc867d57ae5157232ec3dfd429c8d837a |
| network-release.json | 7623b9290d7e4896e2cacd72d504319bb96bedec919e80c9bda9a8936d7d5daa |

Run artifact hashes:

| File | SHA-256 |
|---|---|
| checkpoint-restore.json | 8a288215bbd73dcce8ca9ebc0ccc17429c6533df722efb658d5ab2874869b63f |
| checkpoint-v1y-voidwalker-base-kit.json | eceeed26fde213385c6c8744678de4989fea437b11fa9aab19497c5180635020 |
| checkpoint-v1y-t4-sanctuary-arrived.json | 0de53a4aa835b9a18a5eaed16580b43d304b4444fe3fa1bec0af257a88c9eaf5 |
| checkpoint-v1y-mountain24-returned.json | 973049f0ac5be06b71ea56425410afc9fe1cad93dd538c12225e3baf4061b1f1 |
| checkpoint-v1y-plus1-ready.json | 58e18177dc12de55e201f549c6901e4f30c8d42c5621abcfac70c5e3aa8287f2 |
| checkpoint-v1y-mountain-qualified-returned.json | f15a9997537cfabef079ab66f30ac51637ad08fe95a410f89b31f8ee37a2bf83 |
| events.jsonl | 3be1dbcdcb7bd4cda8020719001897bbea7217732aee8a107980c6c1bcedc3f2 |
| summary.json | 6d8815753a04502d8528fe0218ac2d0a21c9a3356f47aed54dbd0a73e6a81111a7 |
| deaths.jsonl | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| resource-samples.jsonl | ba5ea17e15f2d8800edab856ef9d18d1b287d964b0add26dafc6a67191a01e4a |
| snapshot-b.json | e04c9be4ddbdcb7c80bd0a570502de366cb59137dd2c00e411a68270d3f105f8 |
| snapshot-index.json | d48f26dd2f3771d9f69e9d12ac6f4f9cc3e5956d2eaecad99e2e7067523f0a68 |

The qualification artifact, experiment manifest, restore record, all five V1y captures, route events, summary, resource samples, and release record remain retained under the experiment root. No follow-on agent or experiment was launched.
