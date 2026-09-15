# Bot Balance V1z Report — Voidwalker T4 Jungle/Desert farming and +2 preparation

## Outcome

V1z completed the prescribed one-character, one-worker continuation from the exact V1y Mountain qualification checkpoint. The run:

- restored the V1y checkpoint at T4 Sanctuary under the explicit-current-revision policy, preserving its inherited, synthetic, and non-canonical taints;
- kept the authored Voidwalker energy-heavy far-range build, Cinderlash T3+5, Accelerant, and the T4 Mountain armor/recovery at +1;
- farmed the natural T4 Jungle pool from Jungle12 to Jungle18, completed the separate 5-minute observation, returned to T4 Sanctuary, recovered, and captured `v1z-jungle-qualified-returned`;
- farmed the natural T4 Desert pool from Desert16 to Desert18, completed the separate 5-minute observation, returned through the authored Mountain waypoint to T4 Sanctuary, recovered, and captured `v1z-desert-qualified-returned`;
- bought exactly +2 on `mountain-vest-t4` and `mountain-charm-t4` after GM132, recovered again, and captured `v1z-plus2-prepared-returned`;
- completed all 36/36 route steps with zero deaths, zero retries, zero resource blocks, no boss attempt, and no source or balance edit.

The final returned +2 capture is T4/currentSkillTier4, level1136, GM132, Jungle18, Desert18, Mountain24, 389/389 HP, 265/265 barrier, `incomingDoT=0`, `isDead=false`, and stationary at T4 Sanctuary. The +2 capture is setup evidence only; both farming windows used the fixed +1 kit.

This is diagnostic evidence rather than canonical combat or economy certification. The continuation is smoke-isolated and inherited a restored, synthetic tier-entry checkpoint. The run reports `canonical=false`, `combatEvidenceEligible=false`, `economyEvidenceEligible=false`, and `treatmentValidity=valid`. Swamp remains open; no complete T3/T4 balance or canonical economy claim is made.

## Frozen scope and qualification

- Packet: `docs/briefs/bot-balance-v1z-operator-packet.md`, prepared 2026-09-14.
- Frozen source revision: `146ad0ced0d521e7313005578ab45e7b4ff1c461`.
- Frozen source tree: `d08c19defc84e387b87fa1d8b90deedd3cf08914`.
- Image tag: `mmo-idle-experiment:146ad0ced0d5-d90e6996`.
- Image ID: `sha256:9adf602a24d267d768272b70830a019633edb657908b19c9085103a8e76f868e`.
- Build ID: `1d955886f377383266c367e0`.
- Tooling hash: `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1`.
- Runtime hash: `f77975c67c8a759e0a1e3039f1d3ae4cbe88f42de3e691282d69202814fb700f`.
- Exact input checkpoint: `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t183213z-voidwalker-mountain-entry-t4-v/runs/001-voidwalker-mountain-entry-t4-v1y-intended-r01/artifacts/voidwalker-mountain-entry-t4-v1y-intended-2026-09-14T18-36-16-711Z-4f3c4531/checkpoint-v1y-mountain-qualified-returned.json`.
- Input SHA-256: `f15a9997537cfabef079ab66f30ac51637ad08fe95a410f89b31f8ee37a2bf83`.
- Input boundary: `v1y-mountain-qualified-returned`.
- Input persistent state hash: `1b75a7961da6a1a27caef4808cb26dffc46731e405a537b8aaa95595df5b615d`.
- Input source revision: `7bf4dd35bbdd8dfbf2062b775c239f295173f77d`.
- Input and current definitions hash: `92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.

The V1z qualification artifact was `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1z-preflight-20260914.json`, SHA-256 `452bd3e4f286c503bd0f59b68972aed757741d8c4acc8d64d3f8450a90354ad4`. It is `setup-only-hypothetical-earned-mastery` with `ticks=0`, two qualification stages, and two upgrade receipts. It modeled future Jungle18/Desert18 gate state only; it did not grant playable mastery, alter the input, or fabricate a runnable checkpoint. Packet-specific bot/diagnostics TypeScript, actual-input restoration, route/map, and observation/transit checks passed. Full repository tests and live/browser playtesting were not run for V1z.

The manifest recorded a dirty invocation worktree but `dirtyWorkingTreeIncluded=false`. No checkpoint was edited. All inherited taints remained present:

`RESTORED_PROGRESSION_CHECKPOINT`, `SYNTHETIC_TIER_ENTRY`, `NON_CANONICAL_REWARD_MULTIPLIER`.

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

`20260914t210709z-voidwalker-jungle-desert-t4-v1`

Artifact root:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t210709z-voidwalker-jungle-desert-t4-v1`

The sealed configuration was smoke-isolated, full-gauntlet, one worker, one intended case, reward multiplier 1, worker memory limit 768m, `maxRunMs=5400000`, `fastBossRetry=false`, and `automaticRetries=0`. The manifest contained exactly one route: `voidwalker-jungle-desert-t4-v1z`.

- `experiment:create` succeeded from the frozen revision and sealed one case.
- The invocation checkout was dirty, but its uncommitted changes were excluded from the immutable image.
- `experiment:launch` started one supervisor and one worker. No additional replica or automatic retry was created.
- `experiment:status` reached supervisor completed, run status `completed`, reason `bot_completed`.
- `experiment:report` succeeded and produced the cohort summary.
- `experiment:release` returned `already-released`; the terminal release record reports `released`.
- The isolated worker container and its Postgres/Redis containers exited with code 0. The experiment network was released and the two scoped database containers were retained by the release record. Shared `mmo-gamedb`, `mmo-logdb`, and `mmo-redis` remained healthy.

Run artifact directory:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t210709z-voidwalker-jungle-desert-t4-v1/runs/001-voidwalker-jungle-desert-t4-v1z-intended-r01/artifacts/voidwalker-jungle-desert-t4-v1z-intended-2026-09-14T21-09-00-375Z-253ef36e`

| Run | Duration | Route progress | Terminal status |
|---|---:|---:|---|
| 001-voidwalker-jungle-desert-t4-v1z-intended-r01 | 819516 ms | 36/36 | completed / bot_completed |

The supervisor started at `2026-09-14T21:08:53.501Z`; it assigned the worker at `2026-09-14T21:08:54.846Z`. The bot run began at `2026-09-14T21:09:00.381Z`, the route ended at elapsed 819516 ms, the worker result ended at `2026-09-14T21:22:39.955Z`, and the supervisor recorded terminal completion at `2026-09-14T21:22:51.774Z`. The release event was recorded at `2026-09-14T21:22:54.322Z`.

## Starting state, restore, and fixed builds

The V1y input was used exactly as supplied. Its authoritative starting state at `v1z-two-biome-ready` was:

| Field | Value |
|---|---|
| Node / tier | `node-t4-sanctuary` / 4 |
| Current skill tier / skill points | 4 / 0 |
| Level / global mastery | 704 / 124 |
| Jungle / Desert / Mountain | 12 / 16 / 24 |
| HP / barrier | 367/367 / 246/246 |
| Class / frame / range | `energy-root` / `energy-heavy` / `energy-range-far` |
| Weapon | `volcanic-cinderlash` +5 |
| Armor / recovery | `mountain-vest-t4` +1 / `mountain-charm-t4` +1 |
| Mobility / core | `desert-boots-t2` +5 / `core-accelerant` |
| Essences | red 2064, blue 14971, green 5487, yellow 15902, purple 16481 |
| Catalysts | alacrity 53, heavy 154, swarming 51, dominion 133, fortified 336 |

The restore record reports `success=true`, `normalized=true`, `changedDefinitionSections=[]`, `setupMs=46`, `restoreMs=58`, and `skippedPreparation=inherited; not earned or timed in this continuation`. The continuation used the packet's explicit-current-revision policy and retained the V1y safe-rested boundary.

The exact fixed builds were observed and verified with no issues:

- Travel: Defensive stance, Sweep and Hamstring, Second Wind/Brace/Cleanse/Break Free, 38 RP.
- Jungle farming: Offensive stance, Frenzy/Sweep/Hamstring, Second Wind/Cleanse, 35 RP, `alacrity` target modifier.
- Desert farming: Offensive stance, Frenzy/Hamstring, Second Wind/Brace/Cleanse/Break Free, 37 RP, `dominion` target modifier.
- Existing travel rules remained equipped: Auto Path Enemy, Step Back inside telegraphs, Orbit in combat, Avoid Hazards, Wait for Regen, Avoid Enemies while traveling, and Fight Back while traveling.

The authored continuation paths were exactly:

`node-t4-sanctuary → node-t4-jungle-05`

`node-t4-sanctuary → node-t4-mountain-05 → node-t4-desert-05`

The Desert route's Mountain node was transit only. No ordinary Mountain, Volcano, Tundra, Trench, or Graveyard farm was added.

## Phase-separated progression and economy

The phase intervals below use the route-step boundaries. They keep inherited state, approach, mastery, observation, return/recovery, and +2 preparation separate. Route `timeMs`, `travelMs`, and `fightMs` are overlapping views and are not added together.

| Phase | Elapsed interval | Result and newly recorded activity |
|---|---:|---|
| Inherited/ready capture | 0–1014 ms | V1y state retained: GM124, Jungle12, Desert16, Mountain24, +1 kit; no earned continuation progress. |
| Jungle approach/build | 1014–12533 ms | Reached `node-t4-jungle-05` with `alacrity`; no kills or essence; authored build verified. |
| Jungle mastery | 12533–55062 ms (42529 ms) | Jungle12→18, GM124→130, 12 kills, 8022 biome XP, 736 green essence; target modifier `alacrity`. |
| Jungle observation | 55063–356253 ms (301190 ms) | Prescribed 300000 ms window completed; 43 kills, 2465 green essence, no further XP, alive throughout. |
| Jungle return/recovery | 356253–398440 ms (42187 ms) | Returned to T4 Sanctuary, recovered, and captured; travel Fight Back produced 3 Jungle kills and 202 green essence, recorded separately from the observation. |
| Desert approach/build | 398440–418456 ms (20016 ms) | Crossed the authored Mountain transit waypoint into Desert; no kills or essence; authored build verified. |
| Desert mastery | 418456–454982 ms (36526 ms) | Desert16→18, GM130→132, 5 kills, 3710 biome XP, 340 yellow essence; target modifier `dominion`. |
| Desert observation | 454983–756160 ms (301177 ms) | Prescribed 300000 ms window completed; 61 kills, 3736 yellow essence, no further XP, alive throughout. |
| Desert return/recovery | 756160–806856 ms (50696 ms) | Returned through Mountain transit to T4 Sanctuary and recovered; one Mountain `Cliffside Roc` kill yielded 48 blue essence, recorded separately from Desert farming. |
| +2 preparation/recovery | 806856–819516 ms (12660 ms) | Bought exactly the two requested +2 upgrades, recovered at Sanctuary, and captured the final checkpoint; no farming was added for the purchases. |

The summary's biome aggregates are:

| Biome aggregate | Time | Travel | Fight | Kills | Damage taken | Mastery XP | Essence | Max attackers |
|---|---:|---:|---:|---:|---:|---:|---|---:|
| Jungle / alacrity | 366050 ms | 17005 ms | 122020 ms | 58 | 0 | 8022 | green 3403 | 1 |
| Desert / dominion | 360043 ms | 17001 ms | 153020 ms | 66 | 570.68 | 3710 | yellow 4076 | 2 |
| Mountain transit / heavy | 15000 ms | 15000 ms | 1999 ms | 1 | 0 | 0 | blue 48 | 1 |
| Sanctuary | 78370 ms | 18366 ms | 0 ms | 0 | 0 | 0 | none | 0 |

The 3 Jungle return kills and 1 Mountain transit kill explain why biome aggregates exceed the two mastery-plus-observation kill totals. They are not included in either observation result.

Wallet accounting, separated from spend, was:

| Essence | Start | New continuation gain | Prescribed spend | Final | Net |
|---|---:|---:|---:|---:|---:|
| red | 2064 | 0 | 102 | 1962 | -102 |
| blue | 14971 | 48 | 474 | 14545 | -426 |
| green | 5487 | 3403 | 0 | 8890 | +3403 |
| yellow | 15902 | 4076 | 0 | 19978 | +4076 |
| purple | 16481 | 0 | 0 | 16481 | 0 |

The two actual upgrade receipts were:

| Item | From → to | Blue | Red | Catalysts |
|---|---:|---:|---:|---:|
| `mountain-vest-t4` | +1 → +2 | 331 | 83 | 0 |
| `mountain-charm-t4` | +1 → +2 | 143 | 19 | 0 |

Catalyst gains were alacrity +61, dominion +74, and heavy +1; swarming and fortified did not change. No catalyst was spent. The restored economy and non-canonical continuation boundary mean these wallet changes are not a canonical economy sample or farming-rate claim.

## Checkpoints and continuity

All named captures below are safe-rested stationary captures at `node-t4-sanctuary`, with the same current source revision, definitions hash, `canonicalAtCapture=false`, and the three preserved source taints.

| Boundary | Captured at | Elapsed | Progression state hash | Capture SHA-256 | State |
|---|---|---:|---|---|---|
| `v1z-two-biome-ready` | 2026-09-14T21:09:01.384Z | 1004 ms | `1b75a7961da6a1a27caef4808cb26dffc46731e405a537b8aaa95595df5b615d` | `48d32a62b5365bb995ff941ccf418ce11658e33654441dc9043290f66a83a8ca` | GM124, Jungle12, Desert16, 367/367 HP, 246/246 barrier, +1/+1 |
| `v1z-jungle-qualified-returned` | 2026-09-14T21:15:38.811Z | 398432 ms | `e3ba08d3f8a0ac8971112a63342397a8979e111a29af7c25cea8c9db4ccf75fc` | `cad03c04ceb98bdbf6ee2b31db69b16250365a307a808991f5176f05bf066e0a` | GM130, Jungle18, Desert16, 367/367 HP, 246/246 barrier, +1/+1 |
| `v1z-desert-qualified-returned` | 2026-09-14T21:22:27.227Z | 806847 ms | `013f4c2ac60aa5258e3f437c4aa5e277fc0e7100ebc96ecad5d6c9cab503636c` | `418df39b6e340bf99e3c098d63b5c45914ced02e7dce51735eae832e2688dae4` | GM132, Jungle18, Desert18, 367/367 HP, 246/246 barrier, +1/+1 |
| `v1z-plus2-prepared-returned` | 2026-09-14T21:22:39.881Z | 819501 ms | `32ec146718e8e4635d624639155b560dc9a2bd93712e50012c6750ef023a8afb` | `e6b357f51cadb344307e56aa7d43eb247b8755bf5284ba91e9342711942ae844` | GM132, Jungle18, Desert18, 389/389 HP, 265/265 barrier, +2/+2 |

Every capture has `incomingDoT=0`, `isDead=false`, position `(2400,2400)`, and the expected Defensive stance at capture. The Desert-qualified capture precedes the upgrades and therefore remains a +1 combat-state handoff. The +2 capture's final loadout is still Cinderlash T3+5, Mountain T4 armor/recovery, Desert Boots T2+5, and Accelerant.

## Observation telemetry

The two observation route steps were authored with `elapsedMs0` and `observeForMs=300000`. The recorded step spans are the evidence for actual alive/auto-enabled duration; the small overrun reflects the runner's tick and step completion boundary.

| Window | Actual span | Experience samples | Combat / idle activity | Kills by target | Explicit concurrency samples | HP sample | Abilities / movement |
|---|---:|---:|---:|---|---|---|---|
| Jungle, `node-t4-jungle-05`, alacrity | 301190 ms | 301043 ms | 90 combat / 211 idle | Emerald Constrictor 14; Apex Silverback 13; Thornback Chameleon 9; Hunting Panther 7 | 103 unengaged, 41 with one attacker, max 1; other players 0 | minimum `hpFraction=1.0`; barrier time series unavailable | Frenzy 18, Hamstring 29, Sweep 32, Cleanse 4; Cleanse removed 4 slows; no Step Back/hazard escape |
| Desert, `node-t4-desert-05`, dominion | 301177 ms | 301034 ms | 139 combat / 162 idle | Sunshield Scarab 31; Sand Viper 13; Dune Tyrant 9; Dune Basilisk 8 | 74 unengaged, 28 with one attacker, 38 with two attackers, max 2; other players 0 | minimum `hpFraction=0.802347411444142`; barrier time series unavailable | Frenzy 28, Hamstring 32; no Cleanse activation in this window; no Step Back/hazard escape |

The explicit window records show the bot remained alive for the entire authored duration. The runner emitted no per-hit damage event, no engagement-start event, no target TTK, no discharge, and no early-execute event. Accordingly:

- the exact damage split inside each 300-second window is unavailable;
- the available biome aggregate is Jungle `damageTaken=0` and Desert `damageTaken=570.68`, with run-wide `incomingByDamageType.direct=570.68` and no DoT component;
- the only low-health evidence is the explicit Desert observation minimum HP fraction above; no barrier minimum is inferred from absorbed damage;
- no TTK or late low-EHP conclusion is drawn.

Run-wide combat totals were 125 kills, 176095 player damage dealt, 0 summon damage, 570.68 total direct damage taken, 7168.32 absorbed, 7758.32 healed, `hpLost=570.68`, and 27 target switches. Ability totals were Frenzy 53, Sweep 43, Hamstring 74, and Cleanse 4. Second Wind, Brace, and Break Free had no activation records. Hazard escape attempts and Step Back activations were both zero.

The summary's whole-run concurrency distribution was 819 samples: 543 unengaged, 195 solo, 81 with two attackers, and 0 with three or more. Maximum attacker concurrency was two. No other players were seen, no contested samples were recorded, and coordination remained isolated: `maximumSimultaneouslyProgressing=1`, `contaminated=false`, `sharedAdmissions=0`, and no controlled overlap.

No boss attempt or boss diagnostic was collected. The inherited boss seals remained unchanged.

## Resource observations

These observations keep worker cgroup memory, shared-service Docker stats, and host WSL memory separate. No Docker restart, RAM-setting change, global prune, or destructive cleanup was used.

### Before launch

Timestamp: `2026-09-14T21:06:56.1281053Z` (`2026-09-14T23:06:56.1746197+02:00`).

- `mmo-gamedb`: healthy, 29.29 MiB, 0.00% CPU;
- `mmo-logdb`: healthy, 26.97 MiB, 0.00% CPU;
- `mmo-redis`: healthy, 10.41 MiB, 2.73% CPU;
- `vmmemWSL`: 1014243328 bytes, approximately 967.3 MiB;
- C: free 80514801664 bytes, used 918713110528 bytes;
- no competing running experiment worker was present.

### During the run

The resource sample file contains 165 samples. The cohort summary recorded maximum worker memory 183.1 MiB, maximum container CPU 30.6%, and maximum event-loop P99 21.5 ms. The final sample was 191963136 bytes (about 183.1 MiB), with server heap 35.65 MiB and event-loop P99 20.76 ms. The final worker heartbeat was healthy with zero consecutive health failures. These values do not establish a leak or reconstruct total Docker Desktop memory.

### After release

Timestamp: `2026-09-14T21:23:35.4100122Z` (`2026-09-14T23:23:35.4563404+02:00`).

- experiment containers `mmoexp-752fc7845f77-redis` and `mmoexp-752fc7845f77-postgres`: exited 0; no worker container remained running;
- `mmo-gamedb`: healthy, 29.55 MiB, 0.00% CPU;
- `mmo-logdb`: healthy, 27.52 MiB, 2.73% CPU;
- `mmo-redis`: healthy, 10.57 MiB, 0.30% CPU;
- `vmmemWSL`: 3213066240 bytes, approximately 3064.2 MiB;
- C: free 79636619264 bytes, used 919591292928 bytes.

The WSL figure is a host-level observation and is not treated as the worker's memory. The scoped release record and stopped experiment database containers remain retained under the experiment root.

## Next decision

V1z met its stop condition. The next authorized pass can inspect the first T4 boss candidate and the remaining T4 farming biomes (Tundra, Volcano, Graveyard, and Trench), selecting from the returned +2 checkpoint. There is no requirement to grind every remaining biome before a boss candidate. Swamp remains unresolved and should not be labeled a balance defect from V1z. Canonical 1x economy work remains separate.

## Integrity ledger

Qualification artifact:

| File | SHA-256 |
|---|---|
| `v1z-preflight-20260914.json` | `452bd3e4f286c503bd0f59b68972aed757741d8c4acc8d64d3f8450a90354ad4` |

Root artifact hashes:

| File | SHA-256 |
|---|---|
| `experiment.json` | `8e0519ca1b8ebb2bfb6b81627a4f53330c2968f70f502007d399b4201b8f4153` |
| `experiment.sha256` | `224d1ed7619bf00937c0eea9a6e931841ddd972479d749c32e9411566ac361fb` |
| `cohort-summary.json` | `cd6ed57cfb1ace69c6c622d862ecbecec0852196d259789112e9fda5935057b5` |
| `state.json` | `16bad39d1b86790206ff266b6d44fa8a36c2c80b2c1de05abadd0d0baa45a23b` |
| `supervisor-events.jsonl` | `0e6a198fc2a85e8908854fbb96c4b7e4fdfe5ead34cbe795567f3551fa2f3c0a` |
| `network-release.json` | `67b56e140a37e9811ddd8b8e496bd5a9c850c9cc7b70461379be6039c73aba76` |

Run-level hashes:

| File | SHA-256 |
|---|---|
| `run-config.json` | `77087dc5feafbfa085d04da59b1ce98191f98d6cc492c2d9c71d79a5e74dfd6b` |
| `worker-result.json` | `e35a3107524737eff3d0f10978ef495a12e033ee13937bcd9faeb4efce2fce70` |
| `worker-heartbeat.json` | `19b151e287c807f2d595eb7b31e0ce49637b1cbdcf9041bcda6d5518ce500565` |
| `resource-samples.jsonl` | `f2338fa803dee57189b5d98906708d1755dd3415eeb9625fe27f1174fef8d690` |
| `bot.log` | `1ac61defd9a09694eb9d461d64b5c3632e4ce4ecf853987f1f0f23998e966477` |
| `server.log` | `e8253efc892355b564dd2db04ba139650099140419caae2c8927491f8114f8ac` |

Run artifact hashes:

| File | SHA-256 |
|---|---|
| `checkpoint-restore.json` | `11d341c0db81f0a53bd26e61c6feb34ccf76498d640ec296443319dbcfd2bfa8` |
| `checkpoint-v1z-two-biome-ready.json` | `48d32a62b5365bb995ff941ccf418ce11658e33654441dc9043290f66a83a8ca` |
| `checkpoint-v1z-jungle-qualified-returned.json` | `cad03c04ceb98bdbf6ee2b31db69b16250365a307a808991f5176f05bf066e0a` |
| `checkpoint-v1z-desert-qualified-returned.json` | `418df39b6e340bf99e3c098d63b5c45914ced02e7dce51735eae832e2688dae4` |
| `checkpoint-v1z-plus2-prepared-returned.json` | `e6b357f51cadb344307e56aa7d43eb247b8755bf5284ba91e9342711942ae844` |
| `events.jsonl` | `ccc51f196ade69bf3ce82be5fcc6ced06f0e465105ec25a4a845b77194cc68ee` |
| `summary.json` | `796cfefcbfec7e193c19af697a6b970f83f93888320cc21a7e04a591aa9ff266` |
| `deaths.jsonl` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `snapshot-b.json` | `da1eb38b1805dbf3a9a2d9050f9c8408721968e281e9fad2982b7746aeeb5a46` |
| `snapshot-index.json` | `41dea2ed0e885b3af0f7e1a7edfc4bbf2eab5ba1392e5763b2efc85f558fee94` |

The qualification artifact, manifest, restore record, all four V1z named captures, route events, summary, empty deaths file, resource samples, and release record remain retained under the experiment root. No follow-on agent or experiment was launched.
