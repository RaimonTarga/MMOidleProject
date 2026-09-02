# T1 Economy Cohort Deep-Dive — Evidence Report

**Analysis date:** 2026-08-31  
**Scope:** six canonical T1 routes × three replicates in each of the 1× and 2× reward cohorts.  
**Purpose:** explain runtime differences from the lowest-level available telemetry. This report makes no balance or combat recommendations.

## Method and source precedence

The selected artifacts are:

- 1× batch: `bot/runs/t1-overnight-economy-2026-08-30/batch-2026-08-30T21-46-57-101Z/`
- 2× batch: `bot/runs/t1-day-x2-economy-2026-08-31/batch-2026-08-31T05-45-38-866Z/`
- Each run contributes `summary.json`, `events.jsonl`, and `deaths.jsonl`.
- The six routes are `striker-t1`, `squire-t1`, `slinger-v2-t1`, `spirit-v2-t1`, `apprentice-t1`, and `conduit-t1`.
- The aggregation helper is [tmp/analyze-t1-cohorts.mjs](../tmp/analyze-t1-cohorts.mjs).

There are exactly 18 selected runs per cohort. Two extra early striker artifacts exist elsewhere below the 1× experiment directory; they are not in the selected three-replicate batch and were excluded.

Event-level `blocked-on-resource` start/end spans are used for resource-block time. Compact summary blocked time is retained only as a reconciliation check because it is lower in every run. Route-step intervals are made mutually exclusive; resource-block spans replace the underlying route-step category while active. Death/recovery is reported as a summary activity overlay because these artifacts do not contain a matching respawn interval for every death.

## A. Cohort integrity

### Verdict

The experiment is clean enough to establish the directional mechanism of the 1×→2× difference, but it is not a clean isolated causal benchmark. The multiplier, revision, route IDs, route versions, policy, and run mix match; both cohorts ran in an uncontrolled shared world, on different wall-clock windows, with different observed ambient populations.

### Cohort-level metadata

| Cohort | Runs | Actual multiplier | Revision | Execution / per-run max concurrency | Batch metadata | Outcomes | Final tier | Contamination |
|---|---:|---:|---|---|---|---|---|---|
| 1× | 18 | 1× in all 18 run headers and run-start events | `721d2b57` | `uncontrolled-parallel` / 18 | `controlled:false`, batch `maxConcurrency:1`, max simultaneous progressing 1 | 17 completed, 1 stalled | 17 T2, 1 T1 | 0/18 contaminated |
| 2× | 18 | 2× in all 18 run headers and run-start events | `721d2b57` | `uncontrolled-parallel` / 18 | `controlled:false`, batch `maxConcurrency:1`, max simultaneous progressing 1 | 16 completed, 2 stalled | 16 T2, 2 T1 | 0/18 contaminated |

The batch-level `maxConcurrency:1` disagrees with the individual run headers’ `maxConcurrency:18` in both cohorts. The individual headers are the more direct run configuration evidence; this report uses them and flags the batch field as a reporting artifact.

### Route identity

| Route / class | Class root | Route version | Replicates per cohort |
|---|---|---:|---:|
| `striker-t1` / Striker | `cadence-root` | 3.0.0 | 3 |
| `squire-t1` / Squire | `cooldown-root` | 2.0.0 | 3 |
| `slinger-v2-t1` / Slinger | `reload-root` | 1.0.0 | 3 |
| `spirit-v2-t1` / Spirit | `energy-root` | 1.0.0 | 3 |
| `apprentice-t1` / Apprentice | `dot-root` | 2.1.0 | 3 |
| `conduit-t1` / Conduit | `summoner-root` | 2.0.0 | 3 |

The route IDs, versions, class roots, `intended` policy, and revision are identical between matched 1× and 2× runs. The material non-multiplier differences evidenced by the artifacts are:

- Different wall-clock/world windows: 1× started 2026-08-30 21:46:57Z–2026-08-31 00:36:57Z; 2× started 2026-08-31 05:45:39Z–08:35:39Z.
- Shared-world presence differed: mean `otherPlayersSeen` was 14.89 at 1× versus 11.78 at 2×; mean `contestedFraction` was 0.0289 versus 0.0100.
- 1× has `NON_CANONICAL_SHARED_WORLD` and `NON_CANONICAL_EARLY_STOP` taints. 2× has those plus `NON_CANONICAL_REWARD_MULTIPLIER`.
- No controlled overlap, transit co-presence, lease wait, or contaminated run was recorded in either selected batch.

### Per-run manifest

Times are UTC. `P+F` means Plains and Forest bosses cleared; `P+S`, `P+M`, and `P+Sw` mean Plains plus Swamp or Mountain. `other` is `otherPlayersSeen`; `cont.` is the run’s `contestedFraction`. All rows use `uncontrolled-parallel`, per-run `maxConcurrency=18`, coordination contaminated `false`, and one maximum simultaneously progressing bot.

| Cohort | Class / rep | Start | End | Runtime | State / tier | Bosses | Deaths | other | cont. |
|---|---|---|---|---:|---|---|---:|---:|---:|
| 1× | Striker 1 | 2026-08-30 21:46:57.253Z | 2026-08-30 23:24:11.968Z | 97.245m | completed / T2 | P+F | 4 | 8 | .01 |
| 1× | Striker 2 | 2026-08-30 22:46:57.259Z | 2026-08-31 00:42:49.046Z | 115.863m | completed / T2 | P+F | 8 | 14 | .03 |
| 1× | Striker 3 | 2026-08-30 23:46:57.258Z | 2026-08-31 01:42:22.075Z | 115.414m | completed / T2 | P+F | 4 | 16 | .03 |
| 1× | Squire 1 | 2026-08-30 21:56:57.259Z | 2026-08-30 23:56:55.088Z | 119.964m | completed / T2 | P+F | 12 | 11 | .01 |
| 1× | Squire 2 | 2026-08-30 22:56:57.258Z | 2026-08-31 00:53:51.186Z | 116.899m | completed / T2 | P+F | 6 | 16 | .04 |
| 1× | Squire 3 | 2026-08-30 23:56:57.260Z | 2026-08-31 02:22:36.884Z | 145.660m | completed / T2 | P+F | 12 | 15 | .03 |
| 1× | Apprentice 1 | 2026-08-30 22:26:57.267Z | 2026-08-31 01:00:08.273Z | 153.183m | completed / T2 | P+F | 16 | 17 | .02 |
| 1× | Apprentice 2 | 2026-08-30 23:26:57.258Z | 2026-08-31 02:06:53.175Z | 159.932m | completed / T2 | P+F | 15 | 16 | .04 |
| 1× | Apprentice 3 | 2026-08-31 00:26:57.258Z | 2026-08-31 02:53:46.553Z | 146.822m | completed / T2 | P+F | 13 | 15 | .01 |
| 1× | Spirit 1 | 2026-08-30 22:16:57.258Z | 2026-08-31 01:25:02.777Z | 188.092m | stalled / T1 | P only | 42 | 17 | .02 |
| 1× | Spirit 2 | 2026-08-30 23:16:57.257Z | 2026-08-31 01:29:57.638Z | 133.006m | completed / T2 | P+F | 32 | 16 | .04 |
| 1× | Spirit 3 | 2026-08-31 00:16:57.258Z | 2026-08-31 02:16:24.928Z | 119.461m | completed / T2 | P+F | 26 | 13 | .03 |
| 1× | Slinger 1 | 2026-08-30 22:06:57.269Z | 2026-08-31 01:50:01.606Z | 223.072m | completed / T2 | P+Sw | 63 | 17 | .02 |
| 1× | Slinger 2 | 2026-08-30 23:06:57.266Z | 2026-08-31 02:02:48.540Z | 175.855m | completed / T2 | P+F | 49 | 17 | .05 |
| 1× | Slinger 3 | 2026-08-31 00:06:57.269Z | 2026-08-31 03:51:10.971Z | 224.228m | completed / T2 | P+Sw | 67 | 14 | .02 |
| 1× | Conduit 1 | 2026-08-30 22:36:57.262Z | 2026-08-31 01:03:58.980Z | 147.029m | completed / T2 | P+F | 12 | 16 | .05 |
| 1× | Conduit 2 | 2026-08-30 23:36:57.264Z | 2026-08-31 02:05:10.195Z | 148.216m | completed / T2 | P+F | 7 | 16 | .05 |
| 1× | Conduit 3 | 2026-08-31 00:36:57.260Z | 2026-08-31 02:58:21.094Z | 141.397m | completed / T2 | P+F | 14 | 14 | .02 |
| 2× | Striker 1 | 2026-08-31 05:45:39.136Z | 2026-08-31 06:45:37.402Z | 59.971m | completed / T2 | P+F | 4 | 5 | .00 |
| 2× | Striker 2 | 2026-08-31 06:45:39.146Z | 2026-08-31 07:42:26.578Z | 56.791m | completed / T2 | P+F | 2 | 10 | .01 |
| 2× | Striker 3 | 2026-08-31 07:45:39.146Z | 2026-08-31 09:01:27.425Z | 75.805m | completed / T2 | P+F | 4 | 14 | .02 |
| 2× | Squire 1 | 2026-08-31 05:55:39.150Z | 2026-08-31 07:03:12.526Z | 67.556m | completed / T2 | P+F | 4 | 7 | .00 |
| 2× | Squire 2 | 2026-08-31 06:55:39.144Z | 2026-08-31 08:01:28.030Z | 65.815m | completed / T2 | P+F | 4 | 11 | .01 |
| 2× | Squire 3 | 2026-08-31 07:55:39.146Z | 2026-08-31 08:59:47.600Z | 64.141m | completed / T2 | P+F | 4 | 12 | .01 |
| 2× | Apprentice 1 | 2026-08-31 06:25:39.142Z | 2026-08-31 08:00:11.971Z | 94.547m | completed / T2 | P+F | 8 | 13 | .01 |
| 2× | Apprentice 2 | 2026-08-31 07:25:39.145Z | 2026-08-31 08:39:16.233Z | 73.618m | completed / T2 | P+F | 3 | 13 | .01 |
| 2× | Apprentice 3 | 2026-08-31 08:25:39.144Z | 2026-08-31 09:43:30.364Z | 77.854m | completed / T2 | P+F | 7 | 11 | .01 |
| 2× | Spirit 1 | 2026-08-31 06:15:39.151Z | 2026-08-31 08:34:45.372Z | 139.104m | stalled / T1 | P only | 34 | 16 | .00 |
| 2× | Spirit 2 | 2026-08-31 07:15:39.140Z | 2026-08-31 09:42:52.678Z | 147.226m | stalled / T1 | P only | 41 | 15 | .01 |
| 2× | Spirit 3 | 2026-08-31 08:15:39.140Z | 2026-08-31 09:14:35.171Z | 58.934m | completed / T2 | P+F | 6 | 10 | .03 |
| 2× | Slinger 1 | 2026-08-31 06:05:39.139Z | 2026-08-31 08:35:39.147Z | 150.000m | completed / T2 | P+Sw | 35 | 15 | .01 |
| 2× | Slinger 2 | 2026-08-31 07:05:39.151Z | 2026-08-31 09:24:54.531Z | 139.256m | completed / T2 | P+M | 37 | 15 | .02 |
| 2× | Slinger 3 | 2026-08-31 08:05:39.148Z | 2026-08-31 09:53:04.182Z | 107.417m | completed / T2 | P+F | 24 | 11 | .01 |
| 2× | Conduit 1 | 2026-08-31 06:35:39.149Z | 2026-08-31 07:54:12.816Z | 78.561m | completed / T2 | P+F | 7 | 11 | .00 |
| 2× | Conduit 2 | 2026-08-31 07:35:39.139Z | 2026-08-31 08:56:12.258Z | 80.552m | completed / T2 | P+F | 8 | 15 | .02 |
| 2× | Conduit 3 | 2026-08-31 08:35:39.140Z | 2026-08-31 10:14:53.009Z | 99.231m | completed / T2 | P+F | 10 | 8 | .00 |

## B. Executive evidence summary

1. The 2× multiplier is confirmed in every individual run header and `run-start` event: 18/18 runs at 1× and 18/18 at 2×.
2. Across all 18 runs, mean runtime falls from **148.408 minutes to 90.910 minutes**, a **57.498-minute reduction**.
3. The largest route-time reductions are **mastery-labeled farming: −33.322 minutes/run** and **explicit resource-block spans: −25.083 minutes/run**. Recipe/unlock farming falls another 4.319 minutes/run.
4. This is expected from the implementation: the server multiplier scales essence, biome XP, and catalyst progress on every kill. The event logs show roughly the same mastery totals reached with fewer kills and less elapsed farming time at 2×.
5. The economy bottleneck is not erased at 2×. Event-level resource blocks remain **24.608 minutes/run** overall, with 2× late +5 upgrades still producing multi-minute waits.
6. Swamp, Cave, Mountain, and Plains carry the largest resource-block loads. At 1×, cohort-total event blocks are 271.519m in Swamp, 226.711m in Cave, 187.912m in Plains, and 163.284m in Mountain.
7. Slinger is not a global economy representative: its boss/dungeon time is 44.755m at 1× and 48.399m at 2×, with about 10.3 boss attempts/run and 60→32 deaths/run. Its runtime remains high after economy waits shrink.
8. Spirit’s stalled runs are route/combat failures, not demonstrated economy stalls. The stalled Spirit runs reached all-biome mastery and +5 gear, then failed repeated boss attempts until the route exhausted.
9. Catalyst-involved blocks are usually mixed essence+catalyst waits. The bot selected the required modifier source for the catalyst-attributed spans; no wrong-source pattern was found. There is no evidence here for a broad catalyst-source routing error.
10. Final 2× wallets are mixed: stable roots retain low red/blue balances but much higher green/yellow balances, while Slinger and Spirit retain several hundred units of unused essence. The cohort does not show a uniform “all resources abundant” endpoint.

## C. Runtime decomposition

### Aggregate mean decomposition

The route decomposition is an exclusive wall-clock partition and reconciles to runtime within approximately 0.002 minutes per run. `Active fight` and `death overlay` come from compact biome telemetry and are not added to the route partition because the old artifacts do not provide enough interval boundaries to safely subtract them from route steps.

| Cohort | Runtime | Travel | Ordinary farming | Recipe/unlock farming | Recipe/unlock waiting | Mastery farming | Upgrade/setup | Boss/dungeon | Explicit resource block | Residual |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1× | 148.408m | 3.402m | 1.459m | 7.674m | 0.229m | 63.360m | 0.284m | 21.963m | 49.691m | 0.002m |
| 2× | 90.910m | 3.270m | 1.495m | 3.355m | 0.227m | 30.038m | 0.273m | 27.297m | 24.608m | 0.002m |

Independent summary activity means: active fight falls from 55.676m to 33.975m; death/recovery overlay falls from 0.754m to 0.451m. These are useful diagnostics, not additive components of the exclusive route partition.

### Per-class mean comparison

`Post-resource` is the exact event-block portion occurring after the relevant biome-max milestone. It is narrower than total post-mastery biome presence, which also includes later gear returns and boss positioning.

| Class | Runtime 1×→2× | Travel 1×→2× | Active fight 1×→2× | Mastery route time 1×→2× | Recipe farm 1×→2× | Resource block 1×→2× | Post-resource block 1×→2× | Boss/dungeon 1×→2× | Deaths 1×→2× |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Striker | 109.507→64.189 (−45.318) | 12.012→12.279 | 44.583→25.538 | 47.177→23.542 | 6.930→3.049 | 37.120→18.637 | 18.572→10.903 | 12.549→13.297 | 5→3 |
| Squire | 127.508→65.837 (−61.671) | 15.638→14.820 | 48.138→26.584 | 55.544→26.084 | 7.811→3.063 | 42.696→21.169 | 22.425→11.685 | 15.448→9.455 | 10→4 |
| Slinger | 207.718→132.225 (−75.493) | 26.114→28.137 | 63.631→40.532 | 93.498→43.090 | 7.329→3.227 | 56.673→32.413 | 39.908→23.795 | 44.755→48.399 | 60→32 |
| Spirit | 146.853→115.088 (−31.765) | 22.598→34.218 | 50.405→38.786 | 61.736→28.388 | 6.455→2.697 | 37.299→18.648 | 20.902→11.192 | 36.064→60.175 | 33→27 |
| Apprentice | 153.312→82.006 (−71.306) | 14.715→13.574 | 59.990→32.274 | 55.610→26.258 | 7.774→3.577 | 73.106→31.892 | 38.323→21.705 | 10.980→14.518 | 15→6 |
| Conduit | 145.547→86.115 (−59.432) | 12.482→13.991 | 67.308→40.137 | 66.593→32.866 | 9.745→4.516 | 51.249→24.889 | 23.409→12.417 | 11.984→17.938 | 11→8 |

The runtime ranges matter: 1× Slinger spans 175.855–224.228m and 1× Spirit spans 119.461–188.092m; 2× Slinger spans 107.417–150.000m and 2× Spirit spans 58.934–147.226m. The means for Spirit in particular combine completed and route-exhausted runs.

### Blocked-time reconciliation artifact

Across all 18 runs per cohort:

| Cohort | Summary blocked total | Event start/end total | Difference | Mean difference/run |
|---|---:|---:|---:|---:|
| 1× | 815.183m | 894.430m | +79.247m | +4.403m |
| 2× | 368.190m | 442.944m | +74.754m | +4.153m |

All 36 runs have this discrepancy. Event spans are the lower-level evidence and are used for the tables above. The summary undercount is classified as a reporting artifact, not as missing economy time in the run itself.

## D. Mastery/resource alignment

### Mastery milestones

The route emits biome-max milestones for Plains, Forest, Swamp, and Mountain, and `all-biomes-maxed` after the Cave leg. The final event is used as Cave completion for post-mastery attribution.

Mean minutes from run start across all six classes:

| Cohort | Plains max | Forest max | Swamp max | Mountain max | All biomes max | +5 gear | Plains boss clear |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1× | 22.980m | 41.746m | 70.220m | 91.675m | 102.616m | 126.388m | 130.114m |
| 2× | 11.699m | 21.663m | 34.224m | 45.017m | 50.304m | 63.551m | 68.372m |

The event milestones follow the Global Mastery sequence GM6, GM12, GM18, GM24, and GM30. The selected artifacts contain **no explicit GM-gate block span**: upgrade block starts that contain only `{blocked:1}` do not contain `globalMasteryNeeded`, while the route executor adds that field when GM is the cause. Thus GM controls when levels are eligible, but measured waiting time here is resource waiting after the relevant GM threshold, not a separately observed GM wait.

### Post-mastery presence versus pure resource farming

| Cohort | Total post-mastery biome presence mean | Exact post-mastery resource-block mean |
|---|---:|---:|
| 1× | 48.447m/run | 27.257m/run |
| 2× | 41.860m/run | 15.283m/run |

The presence measure is an upper bound on “continued farming”: it includes returns for later upgrades, gear positioning, and the boss route. The exact post-resource measure counts only `blocked-on-resource` time after the relevant biome-max event. It therefore avoids treating every later return as wasted farming.

### Per-biome aggregate

These are cohort totals across all 18 runs, not per-run means. Essence shorthand is R=red, B=blue, G=green, Y=yellow, P=purple. Catalyst shorthand is F=fortified, S=swarming, H=heavy, A=alacrity, D=dominion; `N` is the telemetry’s `none` modifier bucket. Catalyst gains/spends are shown as units.

| Cohort | Biome | Time | Active fight | Event block | Post presence / post block | Essence earned → spent in biome | Catalyst earned → spent in biome |
|---|---|---:|---:|---:|---:|---|---|
| 1× | Clearing | 204.136m | 21.749m | 0 | 0 / 0 | G955 → G502+B250+P120+Y230 | — |
| 1× | Plains | 581.393m | 275.243m | 187.912m | 244.657m / 148.895m | Y15,515 → Y7,560 | F87+H3+A26 → A15 |
| 1× | Forest | 451.279m | 236.407m | 45.003m | 129.602m / 23.817m | G10,070 → G2,565+Y1,305 | F67+A3+N1 → A3 |
| 1× | Swamp | 619.658m | 125.618m | 271.519m | 169.826m / 149.056m | P9,582 → P5,187+G1,680+Y2,010 | S51+F27+H3 → F6 |
| 1× | Mountain | 429.811m | 200.253m | 163.284m | 148.983m / 103.410m | B10,774 → B7,964+G1,625+P1,320+Y115 | H92 → H15 |
| 1× | Cave | 384.935m | 142.900m | 226.711m | 178.984m / 64.938m | R11,932 → R7,515 | F104+A2+S3+D3 → S15 |
| 2× | Clearing | 132.401m | 16.379m | 0 | 0 / 0 | G1,196 → G252+B250+P120+Y230 | — |
| 2× | Plains | 360.765m | 162.134m | 101.794m | 199.446m / 83.215m | Y19,130 → Y6,460 | F84+A26+H2 → A15 |
| 2× | Forest | 305.607m | 152.097m | 21.575m | 142.302m / 11.725m | G13,215 → G2,565+Y1,305 | F72+A2 → A3 |
| 2× | Swamp | 331.576m | 71.386m | 134.811m | 133.901m / 93.107m | P10,552 → P5,187+G1,680+Y2,130 | S51+F33+H4 → F6 |
| 2× | Mountain | 229.238m | 115.674m | 80.605m | 101.297m / 54.410m | B12,011 → B8,214+G1,875+P1,440+Y1,210 | H95 → H15 |
| 2× | Cave | 276.683m | 93.882m | 104.160m | 176.533m / 32.632m | R13,990 → R7,515+Y115 | F113+A1+S6+D6+H1 → S15 |

Biome readings from the evidence:

- **Clearing:** roughly aligned. It has no explicit resource-block span and no post-mastery farming; the opening setup spends starting resources across several colors.
- **Plains:** resource-starved in timing at 1× and still mildly resource-starved at 2×. It carries the yellow essence gates and the delayed +5 armor/boots actions.
- **Forest:** broadly aligned for the durable routes, with a smaller residual block. Slinger is the exception because its Forest Vest +5 is a real late affordability gate.
- **Swamp:** the strongest 1× shortage signal. Its block time is the largest of any biome and is concentrated in the rune, Cleanse, Swamp equipment, and late upgrade sequence. 2× halves but does not remove it.
- **Mountain:** resource-starved at 1× and still materially gated at 2×, especially by blue essence for Mountain Vest and by the Heavy catalyst on +5.
- **Cave:** resource-starved at both multipliers for the routes that use the Chaotic Axe or Cave-side abilities. The Cave post-block figure is specifically the late +5/ability resource wait after all-biome mastery.

## E. Craft and upgrade bottlenecks

### Route purchase structure

The authored route source confirms the main progression families:

- Durable melee routes: Iron Broadsword, Plains Vest, Plains Charm, Plains Boots, Flash Rapier, Swamp Charm, Mountain Vest, Chaotic Axe, then +1 through +5 upgrades.
- Apprentice adds Swamp Vest and upgrades it through +5.
- Spirit uses Mountain Charm as its standing late charm rather than Swamp Charm.
- Slinger uses Forest Vest and Ashbrand Blade, with Ashbrand +5 farmed in Swamp and Forest Vest +5 in Forest.

Successful event costs show the important +5 purchases:

| Item | Essence cost at +5 | Catalyst cost | Observed source context |
|---|---:|---:|---|
| Chaotic Axe | R205 | S1 | Cave, often a Fortified node when only essence was short |
| Plains Vest | Y200 | A1 | Plains Alacrity node |
| Mountain Vest | B205 | H1 | Mountain Heavy node |
| Swamp Vest | P200 | F1 | Swamp Fortified node |
| Ashbrand Blade | P200 | F1 | Swamp Fortified node |
| Forest Vest | G200 | A1 | Forest Alacrity node |
| Swamp Charm | P100 | none | Swamp |
| Mountain Charm | B100 | none | Mountain |
| Plains Boots | Y60 | none | Plains |

The event stream has no dedicated `recipe-unlocked` event. For crafts, recipe eligibility is therefore reconstructed from the end of the route’s “farm until recipe unlocked” step, while affordability is the following `blocked-on-resource` interval and the successful craft event.

### Largest delayed actions

The following are mean blocked minutes per run, ranked within each class. “Mixed” means the route evidence indicates both essence and the required catalyst source were being farmed; catalyst and essence time overlap and must not be added twice.

| Cohort | Class | Largest delayed actions |
|---|---|---|
| 1× | Striker | Plains Vest +5 5.682m mixed; Mountain Vest +5 5.430m mixed; Chaotic Axe +5 4.523m essence |
| 1× | Squire | Plains Vest +5 7.184m mixed; Mountain Vest +5 7.177m essence; Chaotic Axe +5 5.136m, mostly essence |
| 1× | Apprentice | Avoid Hazards rune 9.905m essence; Swamp Vest +5 7.946m essence; Plains Vest +5 6.354m mixed |
| 1× | Conduit | Plains Vest +5 8.131m mixed; Mountain Vest +5 6.689m essence; Chaotic Axe +5 4.574m essence |
| 1× | Slinger | Ashbrand Blade +5 13.357m mixed; Swamp Charm +5 10.832m essence; Forest Vest +5 7.939m mixed |
| 1× | Spirit | Mountain Vest +5 6.868m mixed; Plains Vest +5 5.564m mixed; Cleanse 3.336m essence |
| 2× | Striker | Plains Vest +5 3.953m mixed; Mountain Vest +5 3.157m mixed; Chaotic Axe +5 2.357m essence |
| 2× | Squire | Plains Vest +5 4.561m mixed; Mountain Vest +5 3.482m essence; Chaotic Axe +5 2.550m, mostly essence |
| 2× | Apprentice | Swamp Vest +5 4.397m essence; Plains Vest +5 4.347m mixed; Mountain Vest +5 3.496m essence |
| 2× | Conduit | Plains Vest +5 5.147m mixed; Mountain Vest +5 3.547m essence; Chaotic Axe +5 2.154m essence |
| 2× | Slinger | Swamp Charm +5 8.328m essence; Ashbrand Blade +5 7.366m mixed; Forest Vest +5 3.908m mixed |
| 2× | Spirit | Plains Vest +5 3.610m mixed; Mountain Vest +5 3.265m mixed; Chaotic Axe +5 1.602m essence |

The common durable routes have approximately 0.22–0.33 minutes/run of immediate `upgrade/setup` route time. Their multi-minute upgrade waits are represented in explicit resource-block time, not in this small immediate-action category.

### GM and route-order evidence

No measured block was attributable to a GM gate. Upgrade block starts use `{blocked:1}`; when the route executor knows GM is the blocker it adds `globalMasteryNeeded`. The successful upgrade events also occur after GM6/12/18/24/30 milestones. This is evidence against treating the observed multi-minute upgrade waits as pure mastery waits.

There is no reliable evidence that a specific delayed upgrade was already affordable and then held solely because of bot route ordering. The route does impose an authored sequence — for example, Chaotic Axe +5, Plains Vest +5, Mountain Vest +5, charm, then boots — but the old event artifacts do not record a complete opening/intermediate wallet. A route step beginning with a generic `{blocked:1}` proves the action was not currently accepted; it does not by itself prove which wallet predicate failed.

## F. Essence analysis

### What the reward multiplier changes

The server reward path applies the debug multiplier to essence, biome XP, and catalyst progress on every kill. This explains why mastery totals are similar while mastery elapsed time falls sharply. It also explains why late essence gates remain visible at 2×: fixed recipe/upgrade costs are reached sooner, but the route still has to earn them.

Event-level essence-involved block means across all classes are approximately **49.691m/run at 1×** and **24.537m/run at 2×**. The 2× value remains substantial; it is not a disappearance of the economy wait.

### Per-biome essence reading

The earned/spent table in section D is a transaction total for each biome across 18 runs. The dominant observations are:

- **Yellow / Plains:** 1× has 187.912m of event block time and 2× has 101.794m. Plains Vest +5 and Plains Boots +5 remain late yellow gates at 2×.
- **Green / Forest and opening:** Forest block time drops from 45.003m to 21.575m. Forest is not the global shortage center, although Slinger’s Forest Vest +5 is a specific exception.
- **Purple / Swamp:** 271.519m→134.811m is the largest 1×→2× biome block reduction. Avoid Hazards, Cleanse, Swamp Charm, Swamp Vest, and Slinger’s Ashbrand all draw on this leg.
- **Blue / Mountain:** 163.284m→80.605m. Mountain Vest +5 remains a repeated late gate at both multipliers.
- **Red / Cave:** 226.711m→104.160m. Chaotic Axe and Cave abilities remain delayed, even though 2× materially shortens the delay.

### Class-level shortage reading

The final wallet alone is misleading, but combined with event block time it supports this classification:

| Class | 1× reading | 2× reading | Evidence |
|---|---|---|---|
| Striker | Severe early/late timing shortage; low residual red/blue | Mild-to-moderate timing shortage with useful green/yellow residual | 37.120m→18.637m block; +5 armor/axe waits remain |
| Squire | Severe timing shortage | Mild-to-moderate timing shortage | 42.696m→21.169m block; low 1× red/blue/purple residual |
| Apprentice | Most severe of the stable roots | Still materially gated, but much less painful | 73.106m→31.892m block; Swamp Vest and Avoid Hazards dominate |
| Conduit | Severe timing shortage | Mild-to-moderate timing shortage | 51.249m→24.889m block |
| Slinger | Economy shortage exists, but total runtime is also combat-dominated | Economy wait shrinks; combat remains dominant | 56.673m→32.413m block, but 44.755m→48.399m boss time |
| Spirit | Economy wait exists, but stalled runs are not economy evidence | Economy wait shrinks; route/combat variance dominates | 37.299m→18.648m block; stalled runs had already completed gear |

These labels describe observed timing pressure, not a claim that every final wallet is empty. Several roots accumulate late surplus after paying the earlier gate.

### Intermediate wallets

Exact wallet-at-milestone reconstruction is not available in this artifact set. The old `run-start` headers and `summary.json` files do not contain the initial wallet fields, and there are no wallet-snapshot events. Transaction events do contain per-kill essence gains and successful purchase costs, so earned/spent totals and final wallets are reportable; wallet values at Plains max, all-biome max, or +5 gear cannot be reported without introducing an unverified opening state.

## G. Catalyst analysis

### Requirements and observed flows

Per run, most durable routes spend approximately Swarming 1, Alacrity 1, and Heavy 1 across their +5 path. Apprentice adds Fortified 1 for Swamp Vest +5. Slinger spends Fortified 1 and Alacrity 1 for Forest Vest/Ashbrand progression. Exact event totals across each three-replicate class group are available in the `catalyst-gain` and successful craft/upgrade records.

Aggregate catalyst transactions across all 18 runs in each cohort:

| Family | 1× earned | 1× spent | 2× earned | 2× spent |
|---|---:|---:|---:|---:|
| Fortified | 287 | 6 | 302 | 6 |
| Swarming | 54 | 15 | 57 | 15 |
| Heavy | 97 | 15 | 103 | 15 |
| Alacrity | 32 | 18 | 29 | 18 |
| Dominion | 2 | 0 | 5 | 0 |

The route consumes only a small fixed number of catalyst units relative to the observed final balances. Catalyst progress is earned from node modifier sources; the 2× cohort generally reaches similar or larger family totals with fewer kills because the multiplier also scales catalyst progress.

### Catalyst-block time

Catalyst-involved block time means any block attributed to catalyst shortage, including mixed essence+catalyst spans. It overlaps essence block time.

| Cohort | Catalyst-involved block mean | Essence-only block mean | Interpretation |
|---|---:|---:|---|
| 1× | 16.056m/run | 33.635m/run | Catalyst is present in a meaningful minority of waits, usually alongside essence |
| 2× | 9.193m/run | 15.344m/run | Catalyst waits shrink but do not disappear |

The only materially catalyst-only component is approximately 0.423m/run in 2× Conduit; nearly all other catalyst-involved time is mixed with an essence wait. There is no large pure-catalyst waiting pattern.

### Source selection

For catalyst-attributed upgrade blocks, the route’s selected farming node carried the required modifier family. Examples are Plains Alacrity for Plains Vest +5, Mountain Heavy for Mountain Vest +5, Swamp Fortified for Ashbrand/Swamp Vest +5, and Swarming when a route genuinely needed the Chaotic Axe catalyst. Chaotic Axe +5 often farms at a Fortified Cave node when Swarming is already sufficient, which is consistent with an essence-only wait rather than a wrong catalyst target.

No catalyst-attributed block showed a selected modifier different from the required family. Confidence is medium rather than high because the generic upgrade block event does not encode the failed `canUpgrade` predicate directly; source selection and subsequent success costs are the available evidence.

The artifacts therefore support fixed recipe/upgrade catalyst costs interacting with essence timing more strongly than they support a wrong-node routing problem, a clearly low drop rate, or a concurrency-induced catalyst starvation pattern. The low-level evidence cannot fully distinguish catalyst rate from catalyst cost when the block event is generic.

## H. 1× versus 2×

### Matched-class table

Values are cohort means. Negative differences mean the 2× value is smaller; catalyst time overlaps essence time.

| Class | Runtime 1× | Runtime 2× | Δ runtime | Travel 1×→2× | Resource block 1×→2× | Essence-involved block 1×→2× | Catalyst-involved block 1×→2× | Post-resource block 1×→2× | Boss time 1×→2× | Deaths 1×→2× |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Striker | 109.507m | 64.189m | −45.318m | 12.012→12.279 | 37.120→18.637 | 37.120→18.637 | 11.113→7.110 | 18.572→10.903 | 12.549→13.297 | 5→3 |
| Squire | 127.508m | 65.837m | −61.671m | 15.638→14.820 | 42.696→21.169 | 42.696→21.169 | 16.054→8.963 | 22.425→11.685 | 15.448→9.455 | 10→4 |
| Slinger | 207.718m | 132.225m | −75.493m | 26.114→28.137 | 56.673→32.413 | 56.673→32.413 | 21.297→11.275 | 39.908→23.795 | 44.755→48.399 | 60→32 |
| Spirit | 146.853m | 115.088m | −31.765m | 22.598→34.218 | 37.299→18.648 | 37.299→18.648 | 12.432→6.875 | 20.902→11.192 | 36.064→60.175 | 33→27 |
| Apprentice | 153.312m | 82.006m | −71.306m | 14.715→13.574 | 73.106→31.892 | 73.106→31.892 | 20.618→12.241 | 38.323→21.705 | 10.980→14.518 | 15→6 |
| Conduit | 145.547m | 86.115m | −59.432m | 12.482→13.991 | 51.249→24.889 | 51.249→24.466 | 14.821→8.694 | 23.409→12.417 | 11.984→17.938 | 11→8 |

### Exact shrinking chunks

The aggregate exclusive route partition changes as follows, in minutes per run:

| Category | 1× | 2× | Change |
|---|---:|---:|---:|
| Mastery-labeled farming | 63.360m | 30.038m | −33.322m |
| Explicit resource blocks | 49.691m | 24.608m | −25.083m |
| Recipe/unlock farming | 7.674m | 3.355m | −4.319m |
| Travel | 3.402m | 3.270m | −0.132m |
| Boss/dungeon | 21.963m | 27.297m | **+5.334m** |
| Other exclusive route categories | approximately unchanged | approximately unchanged | near zero |

The independent summary activity signal also shows active fight time falling 21.701m/run and death overlay falling 0.303m/run. The boss increase is not an economy benefit: it is driven by class-specific retry behavior and Spirit/Slinger outliers. The cleanest economy signal is therefore the combined reduction in mastery-labeled farming, recipe farming, and explicit resource blocks, not total runtime alone.

2× does not make all painful chunks disappear. The remaining 24.608m/run of explicit blocks, 15.283m/run of post-mastery resource blocks, and 27.297m/run of boss route time are all material.

## I. Final wallet health

Mean final wallets per run:

| Class | 1× essence (R/B/G/Y/P) | 2× essence (R/B/G/Y/P) | 1× catalysts | 2× catalysts |
|---|---|---|---|---|
| Striker | 13.67 / 5.67 / 256.33 / 174.33 / 60.33 | 23.67 / 18.67 / 361.33 / 478.33 / 65.67 | F15 / S2 / H4 / A0.67 | F15 / S2 / H4 / A1 |
| Squire | 38 / 13.67 / 261 / 194.33 / 48.33 | 15.67 / 43.33 / 359.33 / 343.67 / 79 | F15.67 / S1.67 / H4 / A1 | F16 / H4 / S1.67 / A1 |
| Slinger | 451 / 436 / 172 / 335 / 103.33 | 634.67 / 580.33 / 450.33 / 492.67 / 109 | F14 / S3.33 / H4 / A0.33 / D0.33 | F15.33 / S4 / H5 / A0.33 / D0.67 |
| Spirit | 273.67 / 98 / 272 / 190.67 / 423.67 | 764.67 / 298.33 / 469.33 / 396.33 / 670.67 | F16 / S2 / H7.33 / A1 / D0.33 | F18.33 / S2.33 / H7.67 / A1 / D1 |
| Apprentice | 36 / 15.33 / 219 / 199.33 / 9.67 | 49 / 30 / 380 / 452.33 / 30.67 | F18 / S2 / H5 / A1 | F18.67 / S2 / H4.67 / A0.33 |
| Conduit | 10 / 14.67 / 220.67 / 213 / 59.67 | 20.67 / 25 / 509.33 / 348.33 / 73.33 | F15 / S2 / H4 / A1 | F15.33 / S2 / H4.33 / A1 |

The endpoint pattern is mixed:

- Stable roots at 1× often finish with very low red/blue and modest yellow/purple balances despite long earlier waits. This is consistent with painful early affordability followed by late completion.
- At 2×, green and yellow balances are generally several hundred units, while red/blue are still low for Striker, Squire, and Conduit. The multiplier removes some waiting but does not create a uniformly large wallet across all colors.
- Slinger and Spirit retain large unused late balances at 2×, especially Spirit red/purple and Slinger red/blue. Their route/combat outcomes and alternative item costs make those wallets poor evidence for a global economy state.
- Catalyst endpoints are not depleted. Most classes finish with multiple units in the required families after spending only one unit per relevant +5 action. The catalyst pain is timing at the point of purchase, not an empty final wallet.

Exact intermediate wallets cannot be reported for the missing-state reason documented in section F.

## J. Route/combat/automation exclusions

### Spirit

Spirit is not a clean economy-duration observation.

- 1× has one stall at 188.092m; 2× has two stalls at 139.104m and 147.226m.
- Each stalled run ended T1 with only the Plains boss cleared and the summary stall reason `route steps exhausted without satisfying completion`.
- The stalled 1× run reached `all-biomes-maxed` at 82.732m and `gear-plus-5` at 103.276m before the route failed its boss sequence. The stalled 2× runs reached all-biome mastery at 42.674m and 53.188m and +5 gear at 54.239m and 62.933m.
- The stalled 1× run recorded Plains victory, then six Forest deaths, six Mountain deaths, six Swamp deaths, and six Cave deaths. The two stalled 2× runs show the same repeated post-Plains failure shape: six Forest deaths, six Mountain deaths, six Swamp deaths, and six Cave deaths after the initial Plains victory.
- The successful Spirit runs clear Plains and Forest after only a small number of attempts and complete. The difference is boss execution / route fallback, not demonstrated inability to afford the progression kit.

Spirit’s 2× mean runtime is therefore not a stable economy mean: one 58.934m completion is mixed with two 139–147m combat stalls.

### Slinger

Slinger’s extra runtime is strongly non-economy as well as economy:

- Mean boss time is 44.755m at 1× and 48.399m at 2×, versus 12.549m and 13.297m for Striker.
- Mean boss attempts are about 10.3/run in both cohorts, but victories remain 2/run. The extra attempts are repeated failures, not extra progression rewards.
- Mean deaths are 60→32 and summary death/recovery overlay is 2.012m→1.091m.
- Travel is 26.114m→28.137m, higher than the stable roots, because failed boss attempts send the route through additional dungeon nodes.
- Resource-block time still falls 56.673m→32.413m, so Slinger does have an economy component. It is not sufficient to explain the remaining runtime by itself.
- At 1×, two of three runs proceed beyond Forest to Mountain/Swamp boss nodes after repeated Forest failures; at 2×, one run proceeds to Swamp and one to Mountain. This is direct evidence of boss/route retry distortion.

### Other exclusions

No selected run shows meaningful lease wait, controlled overlap, or transit co-presence. Ambient shared-world contention exists at low fractions, but it is not isolated well enough to explain the systematic 1×→2× reduction. The class-level and biome-level economy results should therefore be read as directional evidence from a non-isolated shared-world harness, not as a pure solo benchmark.

## K. Issue classification

| Observed issue | Classification | Confidence | Evidence |
|---|---|---|---|
| 1× takes longer to reach biome mastery | Mastery pacing / reward rate | High | 1×→2× mastery milestone times approximately halve; server source scales biome XP with the kill multiplier; mastery totals are similar at completion |
| Long waits for recipe, ability, rune, and +5 actions | Reward rate interacting with recipe/upgrade cost | Medium-high | Event blocks are explicit and shrink at 2×; costs are fixed in successful events; missing initial wallet prevents a complete affordability ledger |
| Late +5 waits remain at 2× | Upgrade cost | High | Repeated 2× multi-minute blocks for Plains Vest, Mountain Vest, Chaotic Axe, Ashbrand, Swamp Charm, or Swamp Vest +5 |
| Catalyst-involved waits | Catalyst rate/cost | Medium | Mixed catalyst+essence blocks and fixed catalyst costs are observed; exact failed predicate is not encoded; no broad source mismatch |
| Spirit stalls after completing mastery and gear | Bot routing / automation / combat-boss execution | High | All-biome and +5 milestones precede route exhaustion; repeated boss deaths across every remaining dungeon |
| Slinger remains slow after 2× | Combat/boss execution and route retry behavior | High | 10.3 boss attempts/run, two victories, 32 deaths/run at 2×, and boss time larger than stable roots |
| Different shared-world ambient population | Concurrency artifact | Medium | Uncontrolled-parallel runs, different `otherPlayersSeen` and contested fractions; no controlled overlap or contamination |
| Batch `maxConcurrency` disagrees with individual headers | Reporting artifact | High | Both batch summaries say 1; all individual run headers say 18 |
| Summary blocked time lower than event start/end spans | Reporting artifact | High | All 36 runs disagree; event totals exceed summaries by 4.153–4.403m/run on average |
| Exact wallet-at-milestone state unavailable | Unclear / reporting artifact | High | Opening wallet fields and wallet snapshots are absent from the selected artifacts |

## L. Missing evidence

The current artifacts cannot answer the following with high confidence:

1. Exact opening wallet and wallet-at-milestone values. The current source supports initial wallet telemetry, but these older artifacts do not contain it.
2. Exact failed predicate for a generic upgrade block. `{blocked:1}` plus the route’s selected farm node allows a medium-confidence essence/catalyst attribution, but the event does not directly say which `canUpgrade` field failed.
3. Separate catalyst drop-rate versus catalyst-cost causality. Catalyst gains and costs are recorded, but no complete initial wallet and no per-poll wallet state are available.
4. Dedicated recipe-unlock timestamps. Recipe-unlock route steps are available; a standalone `recipe-unlocked` event is not.
5. Exact death-to-respawn intervals. Death records and summary `deadMs` exist, but the selected JSONL streams do not provide a complete respawn event pair for interval subtraction.
6. A clean solo causal estimate. The harness is uncontrolled and shared-world, and the cohorts ran in different ambient world windows.
7. Whether a resource was already affordable before an authored route step began. Route ordering is visible, but the missing wallet snapshots prevent proving an affordability delay caused solely by bot sequencing.

The evidence is sufficient to separate the major runtime chunks: 2× removes roughly half of mastery and resource-wait time, while Slinger and Spirit retain large route/combat artifacts. It is not sufficient to select a specific economy lever without a follow-up run carrying complete initial/intermediate wallet and explicit block-cause telemetry.
