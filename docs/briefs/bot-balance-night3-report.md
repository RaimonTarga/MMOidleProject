# Bot Balance Night3 Report — T4 Colossus Heart comparison and farming coverage

## 12-case execution matrix

| # | Arm | Ready / approach / guardian / measurement / return | Observed duration | Kills | Death / stall / actual failure node | Returned capture / resource validity |
|---:|---|---|---|---|---|---|
| 1 | night3-mountain-control-r1 | done / done / cleared / victory done / done | Boss combat 44.037 s; route 288.494 s | 14 route kills | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 177 MiB max, 40.3% P99 CPU |
| 2 | night3-mountain-colossus-r1 | done / done / cleared / victory done / done | Boss combat 50.041 s; route 302.986 s | 14 route kills | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 165.1 MiB max, 35.7% P99 CPU |
| 3 | night3-mountain-control-r2 | done / done / cleared / victory done / done | Boss combat 44.022 s; route 286.432 s | 14 route kills | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 164.6 MiB max, 64.8% P99 CPU |
| 4 | night3-mountain-colossus-r2 | done / done / cleared / victory done / done | Boss combat 49.029 s; route 339.521 s | 22 route kills | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 168.6 MiB max, 64.7% P99 CPU |
| 5 | night3-tundra-control | done / done / not applicable / farm done / done | Farm 901.104 s; route 1024.450 s | 169 target-window / 180 route | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 178.8 MiB max, 63.6% P99 CPU |
| 6 | night3-tundra-colossus | done / done / not applicable / farm done / done | Farm 901.117 s; route 1030.960 s | 164 target-window / 173 route | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 175.4 MiB max, 47.5% P99 CPU |
| 7 | night3-trench-control | done / done / not applicable / farm done / done | Farm 901.112 s; route 957.891 s | 71 target-window / 72 route | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 172.7 MiB max, 27.9% P99 CPU |
| 8 | night3-trench-colossus | done / done / not applicable / farm done / done | Farm 901.180 s; route 961.498 s | 67 target-window / 68 route | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 174.2 MiB max, 24.8% P99 CPU |
| 9 | night3-graveyard-control | done / done / not applicable / farm done / done | Farm 901.084 s; route 1228.639 s | 145 target-window / 163 route | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 185.2 MiB max, 32.4% P99 CPU |
| 10 | night3-graveyard-colossus | done / done / not applicable / farm done / done | Farm 901.101 s; route 1231.664 s | 122 target-window / 133 route | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 187.7 MiB max, 32.9% P99 CPU |
| 11 | night3-volcanic-control | done / done / not applicable / farm done / done | Farm 901.109 s; route 1089.036 s | 91 target-window / 99 route | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 179.1 MiB max, 30.4% P99 CPU |
| 12 | night3-volcanic-colossus | done / done / not applicable / farm done / done | Farm 901.101 s; route 1075.492 s | 221 target-window / 229 route | none / none / none | yes; sanctuary, 389/389 HP, 265/265 barrier, alive; resource valid, 176.9 MiB max, 32.6% P99 CPU |

## Outcome

The frozen Night3 batch completed 12/12 cases in the prescribed order with one worker, count 1, no automatic retries, no deaths, no stalls, and no route-step failures. All four Mountain cases cleared the guardian sequence and produced an authoritative T4 boss victory. All eight farming cases reached their target node, completed the full 15-minute observation window, and returned to Sanctuary.

This is a sampled viability and coverage result for the frozen package. It does not establish a relic winner, canonical economy behavior, per-target TTK, per-hit damage, discharge behavior, or an overnight balance change. No gameplay, balance, or source-code changes were made by this run. Empty or unreached windows were not treated as losses; there were no empty or unreached windows in this batch.

## Frozen scope and experiment identity

The operator packet specified one smoke-isolated batch, with no subagents:

- Experiment ID: 20260914t221002z-night3-mountain-control-r1-nig
- Frozen revision: f6e94e3ebae10d07f1b600cce3f84046600120a1
- Frozen source tree: 295317f42c6dca389e8b374632beff8a3bdf5630
- Image digest: sha256:df31e2b7d2e58adc3c038e3e523c05e7bcf44c6efea759cbc83040048288f11d
- Image tag: mmo-idle-experiment:f6e94e3ebae1-d90e6996
- Build ID: 0032a48211a19554f86e6bbc
- Tooling hash: d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1
- Runtime hash: f77975c67c8a759e0a1e3039f1d3ae4cbe88f42de3e691282d69202814fb700f
- Mode: smoke-isolated; worker concurrency 1; memory limit 768 MiB; max run 1,800,000 ms
- Reward multiplier: 1; completion mode full-gauntlet; automatic retries 0; fast boss retry false
- Dirty invocation was recorded, but dirty working-tree files were not included in the frozen source tree.

The exact prescribed route order was:

1. night3-mountain-control-r1
2. night3-mountain-colossus-r1
3. night3-mountain-control-r2
4. night3-mountain-colossus-r2
5. night3-tundra-control
6. night3-tundra-colossus
7. night3-trench-control
8. night3-trench-colossus
9. night3-graveyard-control
10. night3-graveyard-colossus
11. night3-volcanic-control
12. night3-volcanic-colossus

The artifact root is C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260914t221002z-night3-mountain-control-r1-nig. All run artifacts, checkpoints, logs, resource samples, and release metadata remain retained there.

## Input checkpoint and arm qualification

Every case restored the same packet-supplied input checkpoint:

C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260914t210709z-voidwalker-jungle-desert-t4-v1\runs\001-voidwalker-jungle-desert-t4-v1z-intended-r01\artifacts\voidwalker-jungle-desert-t4-v1z-intended-2026-09-14T21-09-00-375Z-253ef36e\checkpoint-v1z-plus2-prepared-returned.json

- Input SHA-256: e6b357f51cadb344307e56aa7d43eb247b8755bf5284ba91e9342711942ae844
- Boundary: v1z-plus2-prepared-returned
- Input state hash: 32ec146718e8e4635d624639155b560dc9a2bd93712e50012c6750ef023a8afb
- Input source revision: 146ad0ced0d521e7313005578ab45e7b4ff1c461
- Definitions hash: 92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4
- Retained ancestry flags: RESTORED_PROGRESSION_CHECKPOINT, SYNTHETIC_TIER_ENTRY, NON_CANONICAL_REWARD_MULTIPLIER

The common input was T4, GM132, Mountain24/Jungle18/Desert18, Voidwalker with ranged Wisp, currentSkillTier4, and skillPoints0. The restored character had 389/389 HP and a 265 barrier after normal recovery. The fixed equipment was Cinderlash T3+5, Titan’s Keep T4+2, Fortress Heart T4+2, Desert Boots T2+5, and Accelerant. No relic control was used. Colossus cases crafted and equipped the ordinary Colossus Heart from each fresh case wallet, paying exactly 3300 blue essence and 10 heavy catalysts; costs were not cumulative. No upgrades, evolutions, or skill unlocks were recorded.

The qualified profile used for the arm check was:

| Arm | Max energy | Base energy gain per hit | Full-discharge multiplier | Relic modifiers |
|---|---:|---:|---:|---|
| Empty control | 200 | 20 | 6 | none |
| Colossus Heart | 280 | 14 | 8 | mechanic frequency −30%; mechanic potency +40% |

Those energy values are the qualified profile, not measured per-hit telemetry from this run. The event stream does not emit a reliable per-hit or full-discharge record, so this report makes no claim about observed discharge timing or damage.

The setup preflight verified the actual input file, ordinary relic purchase and energy effects, and all 12 build/path combinations with zero simulated ticks. Every returned state matched the frozen source revision and definitions hash. Every returned state remained non-canonical and retained all three ancestry flags; the reward multiplier of 1 does not convert this restored progression into canonical economy or combat evidence.

## Lifecycle and resource hygiene

The lifecycle completed as create → launch → status → report → release. Status reported supervisor completed and 12 completed route workers, each with bot_completed. Release was idempotent and returned already-released after the release receipt had recorded status released at 2026-09-15T00:59:36.008Z.

The scoped experiment network was mmoexp-ce2fcc4d3677-network, network ID 8549be8a602450dee38336013e13ff1cbd43d66b3aa766017c5c4035c5b94fc5, with the scoped Postgres and Redis containers recorded in the release receipt:

- mmoexp-ce2fcc4d3677-postgres, container ID 9d271e4183b46a3942a99632c87fce5def85dd6d5f20805217a17e6335300166
- mmoexp-ce2fcc4d3677-redis, container ID 14172d7951cc56da5f3a3845698a2258780637e7f01932f30b524a3deeb17d38

Those scoped containers exited and were retained in the receipt; their volumes and all experiment artifacts were preserved. No running mmoexp worker or matching experiment network remained after release. The shared services mmo-client-dev, mmo-admin-dev, mmo-server-dev, mmo-gamedb, mmo-logdb, and mmo-redis remained running and healthy. No prune, restart, WSL memory change, or global cleanup was performed.

Host snapshots were captured separately from worker cgroup measurements:

| Snapshot | UTC | C: free space | VmmemWSL working set | VmmemWSL private bytes |
|---|---|---:|---:|---:|
| Before launch | 2026-09-14T22:09:43.7973952Z | about 70.92 GiB | about 5.72 GiB | about 6.60 GiB |
| After release | 2026-09-15T01:14:08.1919596Z | 62.68 GiB | about 5.77 GiB | about 8.55 GiB |

After release, Docker stats for the shared services were client 217.8 MiB / 43.66% CPU, admin 151.2 MiB / 5.62% CPU, server 246.2 MiB / 43.03% CPU, gamedb 23.38 MiB / 0% CPU, logdb 37.37 MiB / 0.05% CPU, and redis 4.375 MiB / 3.47% CPU. These are separate from the per-worker cgroup values in the matrix and resource table.

## Mountain T4 boss proof

| Arm | Guardian result | Guardian clear | Named kill event | Authoritative victory proof | Boss combat |
|---|---|---:|---|---|---:|
| control r1 | 4/4 guardians cleared | 24.011 s | Iron-Crest Titan present | victorious boss attempt, 1/1 victory, bossHpFraction 0, milestone mountain:4 | 44.037 s |
| Colossus r1 | 4/4 guardians cleared | 26.514 s | Iron-Crest Titan present | victorious boss attempt, 1/1 victory, bossHpFraction 0, milestone mountain:4 | 50.041 s |
| control r2 | 4/4 guardians cleared | 23.514 s | Iron-Crest Titan present | victorious boss attempt, 1/1 victory, bossHpFraction 0, milestone mountain:4 | 44.022 s |
| Colossus r2 | 4/4 guardians cleared | 24.020 s | Iron-Crest Titan present | victorious boss attempt, 1/1 victory, bossHpFraction 0, milestone mountain:4 | 49.029 s |

The named-kill event carries raw isBoss:false in the frozen telemetry. It was not used as sole proof: each case also has the victorious boss-attempt record and the progression milestone containing mountain:4. The full boss-attempt elapsed durations were 77.563 s, 85.565 s, 77.045 s, and 82.058 s in route order.

Mountain combat-control telemetry was present and readable. Control r1 recorded Sweep 10, Hamstring 19, Frenzy 7, and Step Back 7 attempts with 0 successes and 7 discarded attempts. Colossus r1 recorded Sweep 10, Hamstring 23, Frenzy 8, and Step Back 8 attempts with 0 successes and 8 discarded attempts. Control r2 recorded Sweep 9, Hamstring 20, Frenzy 7, and Step Back 7 attempts with 0 successes and 7 discarded attempts. Colossus r2 recorded Sweep 20, Hamstring 29, Frenzy 7, and Step Back 8 attempts with 0 successes and 8 discarded attempts. No Cleanse, ability Guard, or hazard-contact event was needed or logged in these Mountain boss routes.

The Mountain boss diagnostics showed full barrier observations for the recorded samples: barrier mean fraction 1, depleted samples 0, and no recharge samples. This supports the returned and boss-route survivability observation, but it is not a substitute for a farm-window barrier series.

## Farming coverage

Each farm step used the frozen 900,000 ms observation target. The farm executor set the character to farm activity, enabled auto, and stopped auto in cleanup. Experience samples were admitted only while the character was alive, auto-enabled, and on the target node. Every farm case produced 901 experience samples covering about 901 seconds, with no death or stall. The target-window kills below are not the whole-route kill totals in the matrix.

| Arm | Target and modifier | Window evidence | Target-window kills by monster | Concurrency and HP | Pressure and essence |
|---|---|---|---|---|---|
| Tundra control | t4-tundra-05; heavy | 901.104 s window; 901 samples; 901.063 s sampled duration | 169: Permafrost 45, Glacial Dire-Bear 44, Rime-Tusk 41, Hoarfrost Yeti 39 | max attackers 1; 14–16 monsters; 0 other players; HP fraction 0.802–1.000 | route-level direct 375.61, DoT 0; blue essence 16,124 |
| Tundra Colossus | t4-tundra-05; heavy | 901.117 s window; 901 samples; 901.127 s sampled duration | 164: Glacial Dire-Bear 47, Hoarfrost Yeti 45, Rime-Tusk 36, Permafrost 36 | max attackers 1; 14–16 monsters; 0 other players; HP fraction 0.802–1.000 | route-level direct 289.68, DoT 0; blue essence 14,808 |
| Trench control | t4-trench-05; fortified | 901.112 s window; 901 samples; 901.075 s sampled duration | 71: Elder Leviathan 31, Abyssal 20, Hadal 20 | max attackers 2; 9–10 monsters; 0 other players; HP fraction 1.000 | route-level direct 0, DoT 0; green essence 14,985 |
| Trench Colossus | t4-trench-05; fortified | 901.180 s window; 901 samples; 901.151 s sampled duration | 67: Hadal 29, Elder Leviathan 20, Abyssal 18 | max attackers 4; 9–10 monsters; 0 other players; HP fraction 0.782–1.000 | route-level direct 84.68, DoT 0; green essence 12,898 |
| Graveyard control | t4-graveyard-05; fortified | 901.084 s window; 901 samples; 901.077 s sampled duration | 145: Bone Crawler 66, Carrion Vulture 20, Bone Rat 19, Gravewright 19, Plague Hound 16, Risen Bone Crawler 2, Risen Plague Hound 2, Risen Bone Rat 1 | max attackers 7; 26–32 monsters; 0 other players; HP fraction 0.644–1.000 | route-level direct 1,700.22, DoT 96; purple essence 3,687 |
| Graveyard Colossus | t4-graveyard-05; fortified | 901.101 s window; 901 samples; 901.083 s sampled duration | 122: Bone Crawler 49, Bone Rat 25, Plague Hound 17, Gravewright 13, Carrion Vulture 10, Risen Bone Crawler 2, Risen Carrion Vulture 2, Risen Gravewright 2, Risen Bone Rat 1, Risen Plague Hound 1 | max attackers 5; 26–32 monsters; 0 other players; HP fraction 0.099–1.000 | route-level direct 2,237.42, DoT 0; purple essence 2,886 |
| Volcanic control | t4-volcanic-05; fortified | 901.109 s window; 901 samples; 901.065 s sampled duration | 91: Ember Skink 65, Ashspitter 10, Obsidian Tortoise 8, Magma Salamander 4, Infernal Direhound 4 | max attackers 6; 33–40 monsters; 0 other players; HP fraction 0.535–1.000 | route-level direct 374, DoT 303; red essence 3,920 |
| Volcanic Colossus | t4-volcanic-05; fortified | 901.101 s window; 901 samples; 901.102 s sampled duration | 221: Ember Skink 152, Ashspitter 29, Obsidian Tortoise 16, Magma Salamander 14, Infernal Direhound 10 | max attackers 6; 34–41 monsters; 0 other players; HP fraction 0.382–1.000 | route-level direct 759, DoT 821; red essence 9,748 |

The direct and DoT pressure values in this table are route-level summary totals, not isolated farm-window damage splits. The event stream does not provide a trustworthy window-specific direct/DoT split or outgoing damage-source split. Farm-window concurrency is the isolated observation evidence; there were no other players in any recorded window. Per-window barrier samples are not serialized in the farm experience or concurrency records. Ready and returned captures were full at 265/265 barrier, and the Mountain boss diagnostics were full for their recorded samples.

## Farm ability, recovery, debuff, and movement evidence

| Arm | Ability and recovery evidence | Debuff, hazard, and movement evidence |
|---|---|---|
| Tundra control | Sweep 10; Hamstring 153; Frenzy 83; Cleanse 90; guard-slot activations 90; absorbed 6,695.39; healed 7,090.39; HP lost 375.61 | Cleanse removed tundra-chill 123 times; target switches 3 |
| Tundra Colossus | Sweep 9; Hamstring 157; Frenzy 85; Cleanse 89; guard-slot activations 89; absorbed 7,770.32; healed 8,074.32; HP lost 289.68 | Cleanse removed tundra-chill 114 times; target switches 2 |
| Trench control | Sweep absent; Hamstring 148; Frenzy 85; Cleanse 0; no guard-slot activation; absorbed and healed 3,583; HP lost 0 | target switches 1; no hazard escape/contact record |
| Trench Colossus | Sweep 0; Hamstring 143; Frenzy 85; Cleanse 3; guard-slot activations 3; absorbed 6,013.32; healed 6,102.32; HP lost 84.68 | Cleanse removed slow 3 times; Step Back 1 attempt was discarded; target switches 4 |
| Graveyard control | Sweep 188; Hamstring 171; Frenzy 82; Cleanse 9; Second Wind 4; guard-slot activations 13; absorbed 9,230.78; healed 11,058.78; HP lost 1,484.18 | Cleanse removed slow 1 and hound-plague 9; hazard escape 10/10; one death-pool contact lasted 5.907 s and dealt 96 damage; target switches 79 |
| Graveyard Colossus | Sweep 179; Hamstring 166; Frenzy 80; Cleanse 13; Second Wind 6; guard-slot activations 19; absorbed 8,135.58; healed 10,517.58; HP lost 1,802.05 | Cleanse removed slow 2, hound-plague 10, and antiheal 1; hazard escape 3/3; target switches 55 |
| Volcanic control | Sweep 67; Hamstring 63; Frenzy 30; Cleanse 36; Second Wind 1; guard-slot activations 37; absorbed 3,588; healed 3,715; HP lost 569.92 | Cleanse removed slow 1, ashspitter-burn 7, and lava-burn 1; hazard escape 13/13; target switches 59 |
| Volcanic Colossus | Sweep 142; Hamstring 131; Frenzy 72; Cleanse 87; Second Wind 3; guard-slot activations 90; absorbed 9,935; healed 9,725; HP lost 1,366.36 | Cleanse removed ashspitter-burn 24 and ember-burn 1; hazard escape 24/24; target switches 126 |

No Heat events were logged. Chill evidence was limited to Tundra’s tundra-chill removal records. Recovery and debuff carryover between cases were not asserted because carryover telemetry was not emitted. These logs show control and hazard handling, not a per-target time-to-kill model.

## Phase separation and arm comparison

The following phase times keep approach, measurement, and return separate. Farm times are the target observation windows. Mountain measurement includes the boss attempt, with boss combat duration reported separately above. Route-level aggregate kill and damage fields can overlap phase boundaries and were not added together.

| Arm | Approach | Measurement | Return after return-start | Route total |
|---|---:|---:|---:|---:|
| Mountain control r1 | 90.586 s | boss attempt 77.563 s; combat 44.037 s | 102.248 s | 288.494 s |
| Mountain Colossus r1 | 81.557 s | boss attempt 85.565 s; combat 50.041 s | 116.258 s | 302.986 s |
| Mountain control r2 | 86.557 s | boss attempt 77.047 s; combat 44.022 s | 104.757 s | 286.432 s |
| Mountain Colossus r2 | 119.600 s | boss attempt 82.060 s; combat 49.029 s | 118.260 s | 339.521 s |
| Tundra control | 47.042 s | farm 901.104 s | 58.212 s | 1024.450 s |
| Tundra Colossus | 38.035 s | farm 901.117 s | 72.200 s | 1030.960 s |
| Trench control | 8.506 s | farm 901.112 s | 30.192 s | 957.891 s |
| Trench Colossus | 9.013 s | farm 901.180 s | 31.707 s | 961.498 s |
| Graveyard control | 134.114 s | farm 901.084 s | 175.328 s | 1228.639 s |
| Graveyard Colossus | 161.135 s | farm 901.101 s | 149.783 s | 1231.664 s |
| Volcanic control | 79.062 s | farm 901.109 s | 90.761 s | 1089.036 s |
| Volcanic Colossus | 42.540 s | farm 901.101 s | 112.252 s | 1075.492 s |

Raw target-window comparison is directional only:

| Target | Empty control | Colossus Heart | Full-route totals |
|---|---:|---:|---|
| Tundra t4-tundra-05 | 169 | 164 | 180 vs 173 |
| Trench t4-trench-05 | 71 | 67 | 72 vs 68 |
| Graveyard t4-graveyard-05 | 145 | 122 | 163 vs 133 |
| Volcanic t4-volcanic-05 | 91 | 221 | 99 vs 229 |

The two Mountain replicas both cleared T4. Their boss-combat samples were 44.037 s and 44.022 s for control versus 50.041 s and 49.029 s for Colossus, but this is only two exploratory replicas per arm and does not establish a winner. The farm observations move in different directions by target: Colossus is lower in the sampled Tundra, Trench, and Graveyard windows and higher in the sampled Volcanic window. Differences in deterministic route seed, encounter scheduling, attacker concurrency, and the relic’s altered mechanic profile confound a one-case arm comparison. No buff, nerf, or relic recommendation is justified from this batch.

## Resource measurements

| Route | Max memory | CPU average | CPU P99 |
|---|---:|---:|---:|
| Mountain control r1 | 177.0 MiB | 35.2% | 40.3% |
| Mountain Colossus r1 | 165.1 MiB | 35.2% | 35.7% |
| Mountain control r2 | 164.6 MiB | 34.5% | 64.8% |
| Mountain Colossus r2 | 168.6 MiB | 36.0% | 64.7% |
| Tundra control | 178.8 MiB | 35.4% | 63.6% |
| Tundra Colossus | 175.4 MiB | 36.5% | 47.5% |
| Trench control | 172.7 MiB | 35.6% | 27.9% |
| Trench Colossus | 174.2 MiB | 35.1% | 24.8% |
| Graveyard control | 185.2 MiB | 36.0% | 32.4% |
| Graveyard Colossus | 187.7 MiB | 42.2% | 32.9% |
| Volcanic control | 179.1 MiB | 37.1% | 30.4% |
| Volcanic Colossus | 176.9 MiB | 35.5% | 32.6% |

All worker measurements stayed below the 768 MiB cgroup limit. No capacity failure, infrastructure failure, coordination contamination, or multi-worker overlap was recorded. These worker measurements do not prove canonical server capacity or economy safety.

## Validation and limitations

The packet-specific runtime preflight passed against the actual input checkpoint and verified ordinary Colossus purchase/energy effects plus all 12 builds and paths with zero ticks. Focused relic, core integration, range-gate, tier-entry bootstrap, and earned T3 checkpoint qualification tests passed. Bot TypeScript diagnostics passed with pnpm --filter @mmo-idle/bot exec tsc --noEmit.

The general pnpm bot:preflight command reported an unrelated failure in the older route spirit-volcano-control-t3-v1r: MISSING_UNLOCK, MALFORMED_BUILD, and INSUFFICIENT_RP. That route was not part of Night3 and the packet-specific preflight passed. Server diagnostics still report the pre-existing frozen-source strictness error in scripts/night3Preflight.ts at line 54, where a number | undefined is passed where number is required. The frozen source was not edited. Git diff --check passed apart from the pre-existing line-ending warning in docs/briefs/bot-balance-v1g-report.md.

There was no browser or human playtest in this operator batch. The evidence is bot telemetry and checkpoint evidence only. The event stream does not support TTK, per-hit damage, full-discharge timing, early-execute timing, outgoing direct/DoT attribution, or farm-window barrier time series. The farm executor’s alive/auto/target predicate and 901 samples per case support that the intended observation windows ran, but they do not remove environment or seed confounds. No combined seal or mastery claim was made.

## Decision and preserved sequence

Accept the sampled T4 Mountain boss viability for this package: four of four cases cleared Iron-Crest Titan with the required victory and mountain:4 marker. Keep the eight farm cases as directional coverage data, not a relic balance decision. Preserve the later Swamp T3 human playtest and the downstream mobs → items → classes → canonical 1x economy sequence. No overnight balance change is warranted.

## Integrity ledger

### Experiment-level hashes

| Artifact | SHA-256 |
|---|---|
| Input checkpoint | e6b357f51cadb344307e56aa7d43eb247b8755bf5284ba91e9342711942ae844 |
| Night3 preflight output, 20260915 | 0B9C3522218C71AAE5ED1DCD11DC9D37BD2E3186C58A59728BC843A984A202D7 |
| experiment.json | 6fa13f3e017b0a5d36a61c0f3feafb67c6d393e7d033ceacb85cd343a00d12bf |
| experiment.sha256 file | de8b88d63c25ad95bd3e9906c5eaf8b019c538749ab54582ec6972070a085b38 |
| cohort-summary.json | d260fea96690f35009e2ab62b625fe4ac2d60e511bce490fb34596e1749e760b |
| state.json | a2dc35a5b90b29438a0e137e40d454285a1c4c23bb907a629b052014d7453868 |
| supervisor-events.jsonl | dea3366cc14d5092881d1ea7eb8a05f86a6dedddfbc5264d599bf24581dc0cfd |
| network-release.json | 99ecdb193cb2d1a105fbe79a8b51e85a0a3fcc832efaf1f7a9f2061e1deabdee |
| Common empty deaths.jsonl | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |

The experiment.sha256 file records the experiment.json digest 6fa13f3e017b0a5d36a61c0f3feafb67c6d393e7d033ceacb85cd343a00d12bf. The common empty deaths hash is listed once because it was identical across all 12 runs; returned capture and state hashes are listed separately below.

### Returned capture and state hashes

Every row below has source revision f6e94e3ebae10d07f1b600cce3f84046600120a1, definitions hash 92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4, node-t4-sanctuary, 389/389 HP, 265/265 barrier, isDead false, canonicalAtCapture false, and the three retained ancestry flags.

| Arm | Ready capture SHA | Returned capture SHA | Returned state hash | Ancestry |
|---|---|---|---|---|
| night3-mountain-control-r1 | db31816a56d7b540f95b2a708ae4d9717ac141e8a4542ec72c4eb3248e405034 | 866db03766d0e7cd4ceeeea48506bd9c11c2a9eaf0f72037e49a0cc20c052f98 | c17fccd4238740778cc6b78c5561c6edc2b4771e17b298783cb1786eb39e8bff | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |
| night3-mountain-colossus-r1 | ea1f370ee420527c0b07b962f3241148d2a53d998a85c066b284f8e72ceaed7a | 968f24ac7a93fb6d7d01c56ee446ffa0eccf951e24adc6c7ada61b7affe77940 | cb8b2ccd4b8f51311d86d9656d10044a4e52c887aad058af5985304ff208996b | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |
| night3-mountain-control-r2 | 80c0f5b1aa1a5b2a70167a2685915bb2889d7ac190383299a38e3380e6fcc74d | e3f632075049ed0e7e7e4bd64faeaf54f57fae231174af69543b36c77008838b | 2c1582c341789f1ce2f259fb0ea47d1fe254cf03b0e4fea5d8df414e3e116191 | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |
| night3-mountain-colossus-r2 | 33fba4559e82aaf27d6025839f8e0a4cb98d135adcaf84b151718fc61c7e84b6 | 234753ba556f5e3bb64ef1db6ac4a933e80893ea8eeb63a4f13276d6616a92f7 | 742ef701bffa78210865da5fd6c1c9962f59a4ce6b6cf1cfe5f42ebd5a28076a | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |
| night3-tundra-control | cc1fee69ef89c91b9809c6bf54117860735308dfc6086828476bb912ef3b8b8a | 216c1af4e5e6019e554f5291c82fd8ffd7558718fcc924965601cd35e057d8e6 | 5ccbe31ec3dc008fda235c5f08203f937cf19857ccc6308015a08d50268e7535 | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |
| night3-tundra-colossus | df542c878be61c41e6ffd41729a41401b7fe34d6bd4868b659cb0e02b08009d0 | 071c3d5926cc1259c135885d02e8605dd4e62d8ef0bbb046d8034ebc3d7d9ff6 | 0dde5e274bf2bff16525db3d5aeb9cf5d104bf639b9979a36878b9ee327b7d60 | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |
| night3-trench-control | 40f32465403439039c69288faff2d0b65f434dc0b5444c87160dea831c9b5c4b | b8566512118a83ef5e4b7ff344b783f28395c4d5e1e0fad312c34f83c988b809 | 6aa6bdd5c49dd7b969e58772b35cfed228f29a62726b375fee65ee3b79741f03 | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |
| night3-trench-colossus | f6fc6b15c2179c64eb1ff45d0e9a771dfb829c6c7d6a6944df78b0505010d4b7 | 0f5a7a69b8e2f65b651d279b05c1e145508f0a2689b48c15596ace65de9694b0 | e21f28ef0dbcedee4bfae4cd31f07a2d3e0f551041f847bc6c55da86553e9d8b | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |
| night3-graveyard-control | fdc9614536bf8edebef734823e46c2fd15322e3907c7359c2c1c58a11154d0f7 | d81a667ea4c1e75769728aeef846fe4f4fc232ca4cc6e6dc212c76a3b35ac3a5 | 2eaf2667ca643a6f967ff7da1aa694ef738e08810e04aec6661271cb7c4b17fa | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |
| night3-graveyard-colossus | 7e40a134d1a06aaf8f2a87d3a5e9dc4c9d7c0f9dd1179735580c9562e48f203e | d68ffbf8f7d8704231db51f21d40e44c6bdf14baec30072a125b5914e88d4cf9 | 2eaa9e3e29fbe16023e6fc22900810b118510f2b96658237aebec80832caa0e4 | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |
| night3-volcanic-control | 1a465a28323fffb74065597566d0492a484b4e6c3850adffdfd581bc9c48c5fe | 5074862d2972026b3c3a35d1fec872b664e889876e0ef8b4f2c387e0950c68e7 | 6ad2164f40cb27dd3f31c4984bdaac6b1ee2baa29b59b7c2f900a81a673cc563 | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |
| night3-volcanic-colossus | 37bcc7fca6914f9a010577a7787cf4fafa1b22177db2a05368ceb0ef78459069 | be7bf3524f8de2f69668010055fece41dcf01bca162409f3deda7cd6f4c01c92 | 5f4aa5825fa516ae58dc1a298e8c6876ddf5bc61043e6010ae5486bfeb206221 | RESTORED_PROGRESSION_CHECKPOINT; SYNTHETIC_TIER_ENTRY; NON_CANONICAL_REWARD_MULTIPLIER |

The returned capture hashes and state hashes are intentionally kept as separate per-case evidence. No returned states were combined into a seal, mastery claim, canonical progression claim, or economy result.
