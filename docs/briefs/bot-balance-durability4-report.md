# Durability 4 report — Conduit equipment counter and Eagle dive isolation

Status: complete, synthetic benchmark evidence only. This report records one exact frozen run and returns the balance decision to the user/Astra. It does not authorize a live patch, penetration mechanic, summon compensation, DoT resistance, class change, or economy certification.

## Decision summary

- The frozen 60-cell batch completed exactly once: 300/300 observations, 0 failed observations, 37 player-death outcomes, and no retries.
- The heavy weapon is the best Conduit counter at the highest plating arm in relative terms, but it does not make that arm a credible ordinary-enemy duration. At T2, heavy +8 lands at 41.35–41.60s versus the 10–20s context band; at T3, heavy +16 lands at 100.10–121.70s versus the 20–30s context band. Heavy is also already 36.80–41.95s at T3 with no added plating.
- Added plating is therefore not a safe ordinary-enemy default in the tested range. At the high arm, axe/on-hit/heavy produce 26.90/32.30/41.35s in T2 Cave, 28.28/32.40/41.60s in T2 Mountain, and 56.35/178.80/100.10s in T3 Cave. In T3 Mountain, axe is 82.05s, heavy is 121.70s, and on-hit has no clean named-target median in any of the five seeds; its positive Conduit summon hits are 1 damage in 96.33% of that cell's 9,702 hits.
- The heavy weapon counters the extreme on-hit stall in T3 Cave and is the only tested profile with repeatable clean medians at T3 Mountain +16, but those kills are sparse and far outside the intended band. This is evidence to keep ordinary enemy plating below the tested added-plating threshold, not evidence for penetration, compensation, or a resistance exception.
- The Eagle multiplier-only intervention is a credible experimental candidate: the median first positive hit associated with the opening `Skyfall Rend` falls from 1.75x to 1.25x by about 17–30% across the eight builds, while Stone Eagle ordinary attack remains 75. Survival is not monotonic: deaths improve only for Spirit (2/5 to 0/5), stay unchanged for most builds, and worsen for Striker (1/5 to 2/5). Treat 1.25x as a follow-up tuning candidate, not a shipping decision.
- Natural episodes, late joins, HP regain, wards/absorption, and damage gaps are retained. Censored or unfinished named fights are not counted as successful kills. No client, pathfinding, network, human-feel, travel, acquisition, or economy claim is made.

## Frozen identity, treatment, and execution

| Item | Value |
|---|---|
| Frozen source revision | `ac4595442d93e81f5e3eebc72e5ce4538ff6c94f` |
| Frozen source tree | `48ccedb44b4c885658f362c9a242e14d9dd73dfc` |
| Untreated definitions hash | `40158eea807ae06a5b531fe40d7ad05fb74eed79900a26503f7ee58f394f3ab1` |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitboxes SHA-256 | `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83` |
| Qualification index | [Durability 4 frozen qualification index](<C:/Users/osaif/AppData/Local/mmo-idle/validation/durability4/frozen-qualification/index.json>) |
| Qualification index SHA-256 | `BBE1A29561C708C4E25098A262D6AAD09808278757A8409AD5B1507F2F2AF45E` |
| Mode | `run`, synthetic `true`, economyEligible `false` |
| Time step / duration | 100ms / 300s per observation |
| Seeds | 173, 947, 2027, 4093, 5579 |
| Matrix | 36 Conduit weapon/plating cells + 24 Stone Eagle dive cells |
| Observations | 60 cells × 5 seeds = 300 |
| Qualification | All 60 cells were in the frozen qualification index. Diagnostic typecheck, qualification pilots, overlay/restoration checks, and report generation passed. Full suite and browser playtest were not run. |

The exact run command was: `pnpm --dir C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/source --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability4 --mode=run --revision=ac4595442d93e81f5e3eebc72e5ce4538ff6c94f --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --out=C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/results`

Run window: `2026-09-15T15:34:30.9834500Z`–`2026-09-15T15:57:27.8277422Z` UTC; wall time `1,376.844s`. C: free space was `58,404,343,808` bytes at start and `58,103,984,128` bytes at end. The wrapper did not retain a peak process working-set sample, so the 2 GiB RSS ceiling is not independently measured here; the process exited 0 without a resource failure. One sequential process was used. No Docker, restart, retry, source edit, balance edit, or adaptive rerun was used.

## Integrity and artifact verification

An independent post-run scan found 60 manifest cells, 300 paired run directories, 300 paired `ready.json`/`summary.json`/`events.jsonl`/`samples.jsonl` observations, 0 `failed.json` files, and 1,205 recursive files. `geometryRosterHash` was stable across every intended comparison group (`experiment + node + role + seed`): 0 mismatches. The four Conduit contexts have one geometry hash per seed; the Eagle matrix has one geometry hash per seed. Treatment-owned full roster hashes vary as expected.

- All 180 Conduit rows had complete named-target HP/attack/plating treatment fields and actual initial stats.
- All 120 Eagle rows had `beforeDive: 1.75` and the exact requested `afterDive` multiplier.
- All 120 Eagle rows had actual Stone Eagle attack 75; all had Granite Titan max HP 1,380 and attack 105. The Eagle intervention did not alter ordinary attack, Granite Titan, or Boulder Thrower definitions.
- The 442 logged `Skyfall Rend` starts had `castMs: 1000`; 440 had a paired cast-end at exactly 1,000ms. Of those opening-sequence records, 439 had a positive first incoming hit. The log exposed no empowered-hit flag on the incoming damage event.

| Artifact | SHA-256 / result |
|---|---|
| [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/results/manifest.json>) | `215BABA4F4BBBC12E9DF7A870B3D06D3AA704EF9016763A502D08E223CC1C816` |
| [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/results/complete.json>) | `F644E5CFCBD1977B65B960B55611AE87ED1C16F2C644B70EC81413A420731585`; `{"cells":60,"runs":300,"mode":"run"}` |
| [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/results/index.json>) | `6CE1C5A53DE173DF154001D68DB4E462A80819DF549AC77A5477723ED06A4245` |
| [generated analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/results/analysis.json>) | `76B93578B6ECA22CB4B6998A3282691564093826F1944993F158B3BB3E0EC49B` |
| [generated analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/results/analysis.md>) | `1F30BA82D1989FE20B1FDDF49CB2E3C9BF04C7299F2A43ED730EC66A6A53B1E7` |
| Result structure | 300 run directories, 1,205 recursive files, 0 `failed.json`, 5 root files |

The detached source checkout remained at the frozen revision/tree and clean after the run.

## Matrix A — Conduit equipment counter

The Conduit named elite is joined by exact manifest cell ID and seed. In the seed token below, `seed: medianTTK / cleanN / kills / censored / HP-regain / D` is used. TTK is seconds and is the median of clean named-target medians for that seed; `cleanN` excludes unfinished or HP-regained fights. The outer value is the median of the available seed medians, never a pooled-kill median. `D` is the number of player-death outcomes in that cell. A `—` median means no clean named-target median was available.

The intended duration context is 10–20s at T2 and 20–30s at T3. Those bands are context, not an automatic pass/fail rule.

### T2 Cave — `node-t2-cave-02`, named elite `cave-troll`

Actual initial named-elite stats are HP 1,320, attack 103, DR 0.08, with actual plating 1/5/9 at added plating 0/4/8. The overlay records `550→1320` HP, `115→86` attack, and `1→1/5/9` plating before normal node scaling.

| Exact cell ID | weaponProfile | platingAdd | actual HP/attack/plate/DR | outer clean TTK | seed: median/cleanN/kills/censored/regain/D |
|---|---:|---:|---:|---:|---|
| `dur4-t2-solo-conduit-axe-plate0` | axe | 0 | 1320/103/1/0.08 | 14.00s | 173: 14.1/6/6/1/0/D0; 947: 14.1/10/10/0/0/D0; 2027: 14/7/7/1/0/D0; 4093: 13.9/8/8/0/0/D0; 5579: 14/9/9/1/0/D0 |
| `dur4-t2-solo-conduit-axe-plate4` | axe | 4 | 1320/103/5/0.08 | 19.30s | 173: 19.2/6/6/0/0/D0; 947: 19.3/7/7/1/0/D0; 2027: 19.15/6/6/0/0/D0; 4093: 19.3/6/6/0/0/D0; 5579: 19.3/7/7/0/0/D0 |
| `dur4-t2-solo-conduit-axe-plate8` | axe | 8 | 1320/103/9/0.08 | 26.90s | 173: 26.9/5/5/0/0/D0; 947: 28.45/6/6/1/0/D0; 2027: 26.8/6/6/0/0/D0; 4093: 26.9/1/1/2/0/D1; 5579: 27.1/6/6/1/0/D0 |
| `dur4-t2-solo-conduit-on-hit-plate0` | on-hit | 0 | 1320/103/1/0.08 | 11.35s | 173: 11.2/8/8/0/0/D0; 947: 11.4/9/9/1/0/D0; 2027: 11.4/7/7/1/0/D0; 4093: 11.35/8/8/1/0/D0; 5579: 11.3/7/7/2/1/D0 |
| `dur4-t2-solo-conduit-on-hit-plate4` | on-hit | 4 | 1320/103/5/0.08 | 15.90s | 173: 16/5/5/1/0/D0; 947: 15.9/8/8/0/0/D0; 2027: 15.9/8/8/0/0/D0; 4093: 15.9/6/6/0/0/D0; 5579: 16/6/6/0/0/D0 |
| `dur4-t2-solo-conduit-on-hit-plate8` | on-hit | 8 | 1320/103/9/0.08 | 32.30s | 173: 32.4/5/5/1/0/D0; 947: 32/6/6/1/0/D0; 2027: 32.3/5/5/0/0/D0; 4093: 32.3/4/4/1/1/D0; 5579: 32.4/6/6/0/0/D0 |
| `dur4-t2-solo-conduit-heavy-plate0` | heavy | 0 | 1320/103/1/0.08 | 23.05s | 173: 23/4/4/1/0/D0; 947: 23.3/5/5/0/0/D0; 2027: 23.05/6/6/0/0/D0; 4093: 23/1/1/2/0/D1; 5579: 23.2/5/5/0/0/D0 |
| `dur4-t2-solo-conduit-heavy-plate4` | heavy | 4 | 1320/103/5/0.08 | 32.60s | 173: 32.6/4/4/1/0/D0; 947: 32.2/3/3/1/0/D0; 2027: 32.65/4/5/1/1/D0; 4093: 32.4/4/4/1/0/D0; 5579: 32.7/4/4/1/0/D0 |
| `dur4-t2-solo-conduit-heavy-plate8` | heavy | 8 | 1320/103/9/0.08 | 41.35s | 173: 41.4/4/4/1/0/D0; 947: 41.35/4/4/1/0/D0; 2027: 40.75/4/4/0/0/D0; 4093: 41.3/5/5/0/0/D0; 5579: 41.45/4/4/1/0/D0 |

### T2 Mountain — `node-t2-mountain-04`, named elite `granite-titan`

Actual initial named-elite stats are HP 1,104, attack 105, DR 0.10, with actual plating 0/5/10 at added plating 0/4/8. The overlay records `460→1104` HP, `105→105` attack, and `0→0/4/8` plating before normal node scaling.

| Exact cell ID | weaponProfile | platingAdd | actual HP/attack/plate/DR | outer clean TTK | seed: median/cleanN/kills/censored/regain/D |
|---|---:|---:|---:|---:|---|
| `dur4-t2-small-group-conduit-axe-plate0` | axe | 0 | 1104/105/0/0.10 | 12.05s | 173: 12.15/8/8/1/0/D0; 947: 12/3/4/0/1/D0; 2027: —/0/0/1/1/D1; 4093: 12.1/7/7/1/0/D0; 5579: 12/8/8/0/0/D0 |
| `dur4-t2-small-group-conduit-axe-plate4` | axe | 4 | 1104/105/5/0.10 | 16.18s | 173: 16.1/7/7/0/0/D0; 947: 16.2/5/5/0/0/D0; 2027: —/0/0/1/1/D1; 4093: 16.15/8/8/0/0/D0; 5579: 16.2/6/6/0/0/D0 |
| `dur4-t2-small-group-conduit-axe-plate8` | axe | 8 | 1104/105/10/0.10 | 28.28s | 173: 28.2/5/5/0/0/D0; 947: 28.25/2/2/1/1/D0; 2027: —/0/0/1/1/D1; 4093: 28.3/5/5/0/0/D0; 5579: 28.4/5/5/0/0/D0 |
| `dur4-t2-small-group-conduit-on-hit-plate0` | on-hit | 0 | 1104/105/0/0.10 | 9.30s | 173: 9.3/7/7/0/0/D0; 947: 9.3/6/6/0/0/D0; 2027: 9.4/4/5/0/1/D0; 4093: 9.3/7/7/0/0/D0; 5579: 9.2/9/9/0/0/D0 |
| `dur4-t2-small-group-conduit-on-hit-plate4` | on-hit | 4 | 1104/105/5/0.10 | 13.40s | 173: 13.4/8/8/0/0/D0; 947: 13.4/7/7/0/0/D0; 2027: 13.4/5/6/0/1/D0; 4093: 13.4/7/7/0/0/D0; 5579: 13.4/6/6/1/0/D0 |
| `dur4-t2-small-group-conduit-on-hit-plate8` | on-hit | 8 | 1104/105/10/0.10 | 32.40s | 173: 32.3/3/3/0/0/D0; 947: 32.4/4/4/1/0/D0; 2027: 32.5/4/5/1/1/D0; 4093: 32.4/4/4/2/1/D0; 5579: 32.4/3/3/1/0/D0 |
| `dur4-t2-small-group-conduit-heavy-plate0` | heavy | 0 | 1104/105/0/0.10 | 18.65s | 173: 18.9/3/3/0/0/D1; 947: 18.9/3/3/0/0/D0; 2027: —/0/0/1/1/D1; 4093: 18.4/6/6/1/1/D0; 5579: 18.35/4/4/1/0/D0 |
| `dur4-t2-small-group-conduit-heavy-plate4` | heavy | 4 | 1104/105/5/0.10 | 27.32s | 173: 27.25/6/6/1/1/D0; 947: 27.8/4/4/1/0/D0; 2027: —/0/0/1/1/D1; 4093: 26.8/1/1/1/1/D1; 5579: 27.4/5/5/0/0/D0 |
| `dur4-t2-small-group-conduit-heavy-plate8` | heavy | 8 | 1104/105/10/0.10 | 41.60s | 173: 41.15/2/2/0/0/D1; 947: 41.5/3/3/1/0/D0; 2027: —/0/0/1/1/D1; 4093: 41.8/3/3/1/1/D0; 5579: 41.7/1/1/0/0/D1 |

### T3 Cave — `node-t3-cave-02`, named elite `cavern-troll`

Actual initial named-elite stats are HP 3,780, attack 161, DR 0.10, with actual plating 2/10/18 at added plating 0/8/16. The overlay records `945→3780` HP, `124→124` attack, and `2→2/10/18` plating before normal node scaling.

| Exact cell ID | weaponProfile | platingAdd | actual HP/attack/plate/DR | outer clean TTK | seed: median/cleanN/kills/censored/regain/D |
|---|---:|---:|---:|---:|---|
| `dur4-t3-solo-conduit-axe-plate0` | axe | 0 | 3780/161/2/0.10 | 23.40s | 173: 23.4/5/5/1/0/D0; 947: 23.5/7/7/0/0/D0; 2027: 23.4/5/5/1/0/D0; 4093: 23.4/6/6/1/0/D0; 5579: 23.5/6/6/0/0/D0 |
| `dur4-t3-solo-conduit-axe-plate8` | axe | 8 | 3780/161/10/0.10 | 33.20s | 173: 33.3/5/5/1/0/D0; 947: 33.15/4/4/1/0/D0; 2027: 33.2/6/6/0/0/D0; 4093: 33.2/4/4/1/0/D0; 5579: 33.2/5/5/1/0/D0 |
| `dur4-t3-solo-conduit-axe-plate16` | axe | 16 | 3780/161/18/0.10 | 56.35s | 173: 56.5/3/3/0/0/D0; 947: 56.15/4/4/1/0/D0; 2027: 56.5/4/4/1/0/D0; 4093: 56.35/4/4/0/0/D0; 5579: 56.3/3/3/1/0/D0 |
| `dur4-t3-solo-conduit-on-hit-plate0` | on-hit | 0 | 3780/161/2/0.10 | 24.45s | 173: 24.45/6/6/0/0/D0; 947: 24.4/7/7/0/0/D0; 2027: 24.5/6/6/0/0/D0; 4093: 24.4/6/6/2/1/D0; 5579: 24.5/6/6/1/0/D0 |
| `dur4-t3-solo-conduit-on-hit-plate8` | on-hit | 8 | 3780/161/10/0.10 | 44.70s | 173: 44.85/4/4/0/0/D0; 947: 44.6/4/4/1/0/D0; 2027: 44.7/5/5/0/0/D0; 4093: 44.8/3/4/1/1/D0; 5579: 44.65/4/4/3/2/D0 |
| `dur4-t3-solo-conduit-on-hit-plate16` | on-hit | 16 | 3780/161/18/0.10 | 178.80s | 173: 179.6/1/1/1/0/D0; 947: 178.7/1/1/1/0/D0; 2027: 178.9/1/1/1/0/D0; 4093: —/0/0/2/2/D1; 5579: 178.7/1/1/1/0/D0 |
| `dur4-t3-solo-conduit-heavy-plate0` | heavy | 0 | 3780/161/2/0.10 | 41.95s | 173: 41.9/4/4/0/0/D0; 947: 41.95/4/4/0/0/D0; 2027: 42.25/4/4/1/0/D0; 4093: 50.45/2/3/1/1/D0; 5579: 41.65/4/4/1/0/D0 |
| `dur4-t3-solo-conduit-heavy-plate8` | heavy | 8 | 3780/161/10/0.10 | 60.50s | 173: 60.5/3/3/0/0/D0; 947: 61.1/3/3/1/0/D0; 2027: 60.5/3/3/1/0/D0; 4093: 59.95/2/2/3/2/D0; 5579: 62.15/2/2/1/0/D0 |
| `dur4-t3-solo-conduit-heavy-plate16` | heavy | 16 | 3780/161/18/0.10 | 100.10s | 173: 102.1/2/2/1/0/D0; 947: 100.1/2/2/1/0/D0; 2027: 100.6/2/2/1/0/D0; 4093: 98/1/1/3/2/D0; 5579: 99.85/2/2/0/0/D0 |

### T3 Mountain — `node-t3-mountain-04`, named elite `mountain-colossus`

Actual initial named-elite stats are HP 3,400, attack 130, DR 0.15, with actual plating 0/10/21 at added plating 0/8/16. The overlay records `850→3400` HP, `130→130` attack, and `0→0/8/16` plating before normal node scaling.

| Exact cell ID | weaponProfile | platingAdd | actual HP/attack/plate/DR | outer clean TTK | seed: median/cleanN/kills/censored/regain/D |
|---|---:|---:|---:|---:|---|
| `dur4-t3-small-group-conduit-axe-plate0` | axe | 0 | 3400/130/0/0.15 | 21.20s | 173: 21.2/5/5/1/0/D0; 947: 21.2/4/4/1/0/D0; 2027: 21.2/5/5/1/0/D0; 4093: 21.35/4/4/0/0/D0; 5579: 21.2/5/5/0/0/D0 |
| `dur4-t3-small-group-conduit-axe-plate8` | axe | 8 | 3400/130/10/0.15 | 31.20s | 173: 31.2/5/5/1/0/D0; 947: 31/5/5/0/0/D0; 2027: 31.2/3/3/0/0/D0; 4093: 31.9/3/3/1/0/D0; 5579: 31.3/5/5/0/0/D0 |
| `dur4-t3-small-group-conduit-axe-plate16` | axe | 16 | 3400/130/21/0.15 | 82.05s | 173: 81.5/3/3/1/0/D0; 947: 81.75/2/2/1/0/D0; 2027: 82.35/2/2/1/0/D0; 4093: 83/1/1/1/0/D0; 5579: 82.05/2/2/0/0/D0 |
| `dur4-t3-small-group-conduit-on-hit-plate0` | on-hit | 0 | 3400/130/0/0.15 | 21.80s | 173: 21.8/5/5/1/0/D0; 947: 21.8/5/5/0/0/D0; 2027: 21.9/5/5/0/0/D0; 4093: 21.9/4/4/0/0/D0; 5579: 21.7/6/6/1/0/D0 |
| `dur4-t3-small-group-conduit-on-hit-plate8` | on-hit | 8 | 3400/130/10/0.15 | 39.90s | 173: 39.85/4/4/1/0/D0; 947: 40.5/3/3/1/0/D0; 2027: 39.9/3/3/1/0/D0; 4093: 39.95/4/4/1/0/D0; 5579: 39.8/5/5/1/0/D0 |
| `dur4-t3-small-group-conduit-on-hit-plate16` | on-hit | 16 | 3400/130/21/0.15 | — | 173: —/0/0/1/0/D0; 947: —/0/0/1/0/D0; 2027: —/0/0/1/0/D0; 4093: —/0/0/1/0/D0; 5579: —/0/0/1/0/D0 |
| `dur4-t3-small-group-conduit-heavy-plate0` | heavy | 0 | 3400/130/0/0.15 | 36.80s | 173: 36.5/5/5/1/0/D0; 947: 37.1/3/3/1/0/D0; 2027: 36.65/4/4/0/0/D0; 4093: 36.8/3/3/0/0/D0; 5579: 36.9/5/5/0/0/D0 |
| `dur4-t3-small-group-conduit-heavy-plate8` | heavy | 8 | 3400/130/10/0.15 | 55.50s | 173: 55.5/3/3/0/0/D0; 947: 56.2/2/2/0/0/D0; 2027: 54.95/2/2/2/1/D0; 4093: 55.1/3/3/0/0/D0; 5579: 55.5/2/2/1/0/D0 |
| `dur4-t3-small-group-conduit-heavy-plate16` | heavy | 16 | 3400/130/21/0.15 | 121.70s | 173: 121.65/2/2/0/0/D0; 947: 123.5/1/1/1/0/D0; 2027: 121.7/1/1/1/0/D0; 4093: 121.2/1/1/1/0/D0; 5579: 122.7/1/1/1/0/D0 |

### Weapon counter comparison

These are same-context, same-plating comparisons. Each `axe / on-hit / heavy` entry is an outer clean named-target median; `—` is no available clean median.

| Context | Added plating 0: axe / on-hit / heavy | Highest tested plating: axe / on-hit / heavy | Heavy / own +0 |
|---|---:|---:|---:|
| T2 Cave | 14.00 / 11.35 / 23.05s | 26.90 / 32.30 / 41.35s | 1.79x |
| T2 Mountain | 12.05 / 9.30 / 18.65s | 28.28 / 32.40 / 41.60s | 2.23x |
| T3 Cave | 23.40 / 24.45 / 41.95s | 56.35 / 178.80 / 100.10s | 2.39x |
| T3 Mountain | 21.20 / 21.80 / 36.80s | 82.05 / — / 121.70s | 3.31x |

Heavy is the best relative counter only where the other weapon profile is stalled, especially T3 Cave on-hit +16 and T3 Mountain on-hit +16. In absolute duration it remains slower than axe at every highest-plating context and is outside the contextual T3 band even at +0. The appropriate exit is to keep ordinary enemy plating below the tested added range; do not add penetration or special compensation from this evidence.

### Conduit summon damage, damage floors, and intervals

All Matrix A positive minion damage was owned by the Conduit `Consort / minion` source. Across the 180 Matrix A observations there were 162,759 positive summon-hit events, 9,346 exact 1-HP hits (5.742%), and 2,614,563 HP+absorbed owned-summon contribution. The T3 Mountain on-hit +16 cell accounts for 9,346 of those 1-HP hits: 96.33% of its 9,702 positive hits. The other 35 cells had no exact 1-HP positive hits.

The hit distribution uses positive `hpDamage` after mitigation; `1-dmg` is the fraction with `hpDamage === 1`. `p10/p50/p90/max` are the per-hit HP-damage distribution. `interval p50/p90/max` is the time between consecutive owned-minion damage events in the raw observation, in milliseconds; natural pull/repopulation gaps are retained rather than merged away. `owned total` is the sum of `hpDamage + absorbed` for all owned-minion events in the five seeds of that exact cell.

| Exact cell ID | hits | 1-dmg | HP hit p10/p50/p90/max | interval p50/p90/max ms | owned total |
|---|---:|---:|---:|---:|---:|
| `dur4-t2-solo-conduit-axe-plate0` | 4043 | 0% | 19/19/21/21 | 200/500/15100 | 77701 |
| `dur4-t2-solo-conduit-axe-plate4` | 4238 | 0% | 14/14/21/21 | 200/500/12500 | 66118 |
| `dur4-t2-solo-conduit-axe-plate8` | 3926 | 0% | 10/10/19/21 | 200/500/13300 | 45805 |
| `dur4-t2-solo-conduit-on-hit-plate0` | 4835 | 0% | 17/17/18/18 | 100/400/15200 | 82855 |
| `dur4-t2-solo-conduit-on-hit-plate4` | 5202 | 0% | 12/12/18/18 | 100/400/13800 | 70334 |
| `dur4-t2-solo-conduit-on-hit-plate8` | 6794 | 0% | 6/6/17/18 | 100/400/11100 | 51313 |
| `dur4-t2-solo-conduit-heavy-plate0` | 2131 | 0% | 21/21/22/22 | 200/1300/12700 | 45489 |
| `dur4-t2-solo-conduit-heavy-plate4` | 2629 | 0% | 15/15/22/22 | 200/1200/13300 | 44601 |
| `dur4-t2-solo-conduit-heavy-plate8` | 3072 | 0% | 12/12/22/22 | 200/1100/11500 | 42654 |
| `dur4-t2-small-group-conduit-axe-plate0` | 2775 | 0% | 19/19/19/19 | 200/600/18600 | 52725 |
| `dur4-t2-small-group-conduit-axe-plate4` | 3134 | 0% | 14/14/19/19 | 200/600/13300 | 49101 |
| `dur4-t2-small-group-conduit-axe-plate8` | 3445 | 0% | 8/8/19/19 | 200/600/14700 | 38923 |
| `dur4-t2-small-group-conduit-on-hit-plate0` | 4056 | 0% | 17/17/17/17 | 100/400/22000 | 68952 |
| `dur4-t2-small-group-conduit-on-hit-plate4` | 4680 | 0% | 12/12/17/17 | 100/400/16100 | 63220 |
| `dur4-t2-small-group-conduit-on-hit-plate8` | 5970 | 0% | 5/5/17/17 | 100/400/13900 | 44586 |
| `dur4-t2-small-group-conduit-heavy-plate0` | 1637 | 0% | 22/22/22/22 | 200/1300/14100 | 36014 |
| `dur4-t2-small-group-conduit-heavy-plate4` | 1763 | 0% | 15/15/22/22 | 200/1200/12900 | 30127 |
| `dur4-t2-small-group-conduit-heavy-plate8` | 1474 | 0% | 10/10/22/22 | 200/1200/16900 | 20020 |
| `dur4-t3-solo-conduit-axe-plate0` | 4903 | 0% | 31/31/33/33 | 100/600/10900 | 154245 |
| `dur4-t3-solo-conduit-axe-plate8` | 5470 | 0% | 22/22/33/33 | 100/600/12300 | 129470 |
| `dur4-t3-solo-conduit-axe-plate16` | 6258 | 0% | 13/13/33/33 | 100/500/13400 | 94034 |
| `dur4-t3-solo-conduit-on-hit-plate0` | 6821 | 0% | 22/22/23/24 | 100/400/11000 | 151983 |
| `dur4-t3-solo-conduit-on-hit-plate8` | 8050 | 0% | 12/12/23/24 | 100/300/11000 | 106395 |
| `dur4-t3-solo-conduit-on-hit-plate16` | 8245 | 0% | 3/3/3/24 | 100/300/9600 | 33800 |
| `dur4-t3-solo-conduit-heavy-plate0` | 3001 | 0% | 33/33/36/36 | 300/950/12900 | 100728 |
| `dur4-t3-solo-conduit-heavy-plate8` | 3201 | 0% | 23/23/36/36 | 300/900/13400 | 79655 |
| `dur4-t3-solo-conduit-heavy-plate16` | 3477 | 0% | 14/14/14/36 | 400/800/10500 | 54860 |
| `dur4-t3-small-group-conduit-axe-plate0` | 4238 | 0% | 31/31/31/31 | 100/600/18500 | 131378 |
| `dur4-t3-small-group-conduit-axe-plate8` | 4582 | 0% | 21/21/31/31 | 100/500/18100 | 107372 |
| `dur4-t3-small-group-conduit-axe-plate16` | 6042 | 0% | 8/8/31/31 | 100/500/15000 | 65931 |
| `dur4-t3-small-group-conduit-on-hit-plate0` | 6007 | 0% | 22/22/22/22 | 100/400/24900 | 132154 |
| `dur4-t3-small-group-conduit-on-hit-plate8` | 7443 | 0% | 12/12/22/22 | 100/400/13500 | 101956 |
| `dur4-t3-small-group-conduit-on-hit-plate16` | 9702 | 96.33% | 1/1/1/22 | 100/400/7600 | 17178 |
| `dur4-t3-small-group-conduit-heavy-plate0` | 3010 | 0% | 33/33/33/33 | 200/900/13200 | 99330 |
| `dur4-t3-small-group-conduit-heavy-plate8` | 2980 | 0% | 22/22/33/33 | 300/900/17500 | 76461 |
| `dur4-t3-small-group-conduit-heavy-plate16` | 3525 | 0% | 10/10/33/33 | 300/800/10500 | 47095 |

Matrix A named-target totals were: T2 Cave 284 traces, 256 kills, 28 censored, 3 HP-regain; T2 Mountain 220, 198, 22, 16; T3 Cave 207, 168, 39, 11; T3 Mountain 166, 136, 30, 1. Across all four contexts this is 877 named-target traces, 758 kills, 119 censored, 31 HP-regain, and 751 clean traces. Kills and HP-regain are not mutually exclusive; a target killed after regain remains a kill but is excluded from the clean median.

## Matrix B — Stone Eagle dive-only pressure

The 24 Eagle cells all use `node-t2-mountain-04`, `small-group`, full Granite Titan HP/defense, unchanged Boulder Thrower, and one of eight existing synthetic builds: Striker baseline, Squire baseline, Apprentice baseline, Slinger baseline, Slinger weapon-alt, Conduit baseline, Conduit weapon-alt, and Spirit baseline. Only the Stone Eagle `Skyfall Rend` multiplier changes: 1.75x, 1.50x, or 1.25x. Stone Eagle ordinary attack remains 75 in every row.

For the exact per-seed pressure records below, `seed: survival / minHP / largestHP / max1sHP / recovery-complete / recovery-interrupted / opening-casts / opening-hits / mean-cast-to-first-hit-ms / mean-first-hit-total` is used. `minHP` is the minimum player HP fraction; the two damage fields are HP damage, while the final opening field is `hpDamage + absorbed` for the first positive hit associated with the opening dive. A `DEAD@ms` survival token retains the death time. The opening sequence is identified by `Skyfall Rend` cast start/end and the first positive Stone Eagle damage from that cast's monster ID.

| Exact cell ID | weaponProfile / diveMultiplier | Five-seed pressure detail |
|---|---|---|
| `dur4-eagle-striker-baseline-dive1.75` | baseline / 1.75 | 173: DEAD@275800/min0/hit79/1s151/rec8/int4/o2/2/300ms/86; 947: alive/min0.063/hit86/1s131/rec8/int7/o3/3/366.67ms/86; 2027: alive/min0.087/hit86/1s138/rec8/int4/o5/5/480ms/86; 4093: alive/min0.205/hit86/1s138/rec9/int5/o5/5/840ms/86; 5579: alive/min0.135/hit86/1s165/rec9/int3/o2/2/650ms/86 |
| `dur4-eagle-striker-baseline-dive1.5` | baseline / 1.50 | 173: DEAD@275600/min0/hit79/1s151/rec8/int4/o2/2/300ms/78; 947: alive/min0.123/hit79/1s131/rec9/int9/o5/5/500ms/78; 2027: DEAD@72000/min0/hit79/1s209/rec2/int0/o4/4/700ms/78; 4093: alive/min0.123/hit79/1s138/rec8/int2/o5/5/1000ms/78; 5579: alive/min0.165/hit79/1s157/rec9/int3/o2/2/650ms/78 |
| `dur4-eagle-striker-baseline-dive1.25` | baseline / 1.25 | 173: DEAD@275600/min0/hit79/1s151/rec8/int4/o2/2/300ms/71; 947: alive/min0.175/hit79/1s131/rec8/int10/o6/6/500ms/71; 2027: DEAD@72000/min0/hit79/1s202/rec2/int0/o4/4/700ms/71; 4093: alive/min0.261/hit79/1s131/rec11/int4/o7/7/585.71ms/71; 5579: alive/min0.191/hit79/1s150/rec9/int3/o2/2/650ms/71 |
| `dur4-eagle-squire-baseline-dive1.75` | baseline / 1.75 | 173: alive/min0.295/hit87/1s103/rec12/int5/o2/2/450ms/95; 947: alive/min0.21/hit89.23/1s139/rec11/int7/o6/6/483.33ms/95; 2027: alive/min0.095/hit95/1s139/rec10/int2/o5/5/780ms/95; 4093: alive/min0.242/hit95/1s139/rec10/int8/o7/7/500ms/95; 5579: alive/min0.552/hit85/1s85/rec11/int5/o2/2/450ms/95 |
| `dur4-eagle-squire-baseline-dive1.5` | baseline / 1.50 | 173: alive/min0.327/hit85/1s85/rec12/int8/o4/4/550ms/81; 947: alive/min0.439/hit85/1s85/rec11/int6/o4/4/450ms/81; 2027: alive/min0.215/hit85/1s139/rec8/int7/o6/6/650ms/81; 4093: DEAD@140700/min0/hit85/1s139/rec2/int7/o5/5/500ms/81; 5579: alive/min0.071/hit85/1s139/rec11/int5/o3/3/566.67ms/81 |
| `dur4-eagle-squire-baseline-dive1.25` | baseline / 1.25 | 173: alive/min0.361/hit85/1s85/rec14/int3/o4/4/650ms/67; 947: alive/min0.382/hit85/1s139/rec13/int6/o4/4/425ms/67; 2027: alive/min0.31/hit85/1s152/rec10/int5/o8/8/712.5ms/67; 4093: alive/min0.51/hit85/1s85/rec11/int7/o7/6/500ms/67; 5579: alive/min0.123/hit85/1s139/rec11/int5/o3/3/566.67ms/67 |
| `dur4-eagle-apprentice-baseline-dive1.75` | baseline / 1.75 | 173: alive/min0.002/hit97.2/1s155/rec11/int3/o2/2/800ms/100.5; 947: alive/min0.357/hit97.2/1s101.2/rec11/int5/o2/2/700ms/100.5; 2027: alive/min0.293/hit97.2/1s129/rec14/int5/o6/6/616.67ms/102.1; 4093: alive/min0.2/hit97.2/1s101.2/rec12/int6/o5/5/540ms/101.29; 5579: DEAD@20300/min0/hit94.23/1s98.23/rec0/int0/o2/2/700ms/100.66 |
| `dur4-eagle-apprentice-baseline-dive1.5` | baseline / 1.50 | 173: alive/min0.314/hit82.8/1s86.8/rec13/int5/o2/2/800ms/86.1; 947: alive/min0.104/hit81/1s152.06/rec9/int4/o2/2/450ms/89.4; 2027: alive/min0.472/hit81/1s84/rec14/int5/o7/7/485.71ms/88.43; 4093: alive/min0.333/hit82.8/1s142.6/rec14/int3/o7/7/471.43ms/86.57; 5579: DEAD@199300/min0/hit85.5/1s131/rec7/int1/o7/7/642.86ms/87.56 |
| `dur4-eagle-apprentice-baseline-dive1.25` | baseline / 1.25 | 173: alive/min0.379/hit81/1s84/rec14/int4/o3/3/700ms/73.7; 947: alive/min0.44/hit81/1s129.1/rec13/int2/o1/1/400ms/75.9; 2027: alive/min0.295/hit81/1s129.1/rec13/int5/o7/7/528.57ms/74.44; 4093: alive/min0.142/hit81/1s84/rec12/int5/o4/4/425ms/74.25; 5579: DEAD@247800/min0/hit85.5/1s129.1/rec10/int4/o6/6/616.67ms/73.42 |
| `dur4-eagle-slinger-baseline-dive1.75` | baseline / 1.75 | 173: alive/min0.661/hit62.4/1s62.4/rec18/int8/o3/3/500ms/113; 947: alive/min0.332/hit113/1s113/rec20/int7/o5/5/600ms/113; 2027: alive/min0.555/hit88.2/1s88.2/rec18/int8/o9/9/588.89ms/113; 4093: alive/min0.661/hit62.4/1s62.4/rec6/int1/o5/5/760ms/113; 5579: alive/min0.348/hit113/1s113/rec14/int5/o4/4/750ms/113 |
| `dur4-eagle-slinger-baseline-dive1.5` | baseline / 1.50 | 173: alive/min0.47/hit98/1s98/rec17/int10/o2/2/450ms/98; 947: alive/min0.59/hit84.05/1s84.05/rec14/int11/o3/3/600ms/98; 2027: alive/min0.64/hit80.95/1s80.95/rec18/int10/o7/7/471.43ms/98; 4093: alive/min0.579/hit82.5/1s82.5/rec17/int5/o6/6/450ms/98; 5579: alive/min0.473/hit98/1s117/rec15/int7/o5/5/540ms/98 |
| `dur4-eagle-slinger-baseline-dive1.25` | baseline / 1.25 | 173: alive/min0.661/hit62.4/1s62.4/rec16/int11/o3/3/533.33ms/81; 947: alive/min0.583/hit81/1s81/rec7/int10/o7/7/685.71ms/81; 2027: alive/min0.248/hit81/1s100/rec11/int11/o8/8/575ms/81; 4093: alive/min0.559/hit81/1s81/rec14/int9/o4/4/500ms/81; 5579: alive/min0.552/hit81/1s81/rec17/int7/o5/5/600ms/81 |
| `dur4-eagle-slinger-weapon-alt-dive1.75` | weapon-alt / 1.75 | 173: alive/min0.014/hit113/1s113/rec9/int1/o3/3/1000ms/86.67; 947: alive/min0.351/hit98/1s104.1/rec7/int6/o2/2/450ms/113; 2027: alive/min0.249/hit102.15/1s102.15/rec10/int5/o5/5/520ms/113; 4093: DEAD@120700/min0/hit113/1s113/rec1/int3/o6/6/716.67ms/99.83; 5579: DEAD@246100/min0/hit113/1s113/rec5/int2/o4/4/900ms/93.25 |
| `dur4-eagle-slinger-weapon-alt-dive1.5` | weapon-alt / 1.50 | 173: DEAD@107400/min0/hit98/1s192/rec1/int2/o2/2/900ms/98; 947: alive/min0.155/hit98/1s117.35/rec8/int5/o7/6/466.67ms/98; 2027: alive/min0.146/hit98/1s98/rec4/int4/o6/6/533.33ms/75; 4093: DEAD@115500/min0/hit98/1s118/rec1/int3/o3/3/700ms/98; 5579: alive/min0.125/hit98/1s98/rec0/int0/o4/4/1025ms/80.75 |
| `dur4-eagle-slinger-weapon-alt-dive1.25` | weapon-alt / 1.25 | 173: alive/min0.148/hit98/1s98/rec7/int5/o3/3/566.67ms/62; 947: DEAD@66600/min0/hit98/1s98/rec1/int0/o3/3/733.33ms/62; 2027: alive/min0.162/hit98/1s127/rec11/int2/o7/7/685.71ms/64.71; 4093: DEAD@268300/min0/hit96.45/1s154/rec8/int3/o9/9/588.89ms/74.67; 5579: alive/min0.104/hit98/1s163/rec3/int0/o7/7/971.43ms/64.71 |
| `dur4-eagle-conduit-baseline-dive1.75` | baseline / 1.75 | 173: DEAD@103300/min0/hit78/1s78/rec4/int0/o1/1/1100ms/97; 947: alive/min0.616/hit45/1s45/rec22/int0/o0; 2027: DEAD@25200/min0/hit78/1s146/rec0/int0/o2/2/750ms/95; 4093: alive/min0.921/hit12/1s12/rec17/int1/o0; 5579: alive/min0.518/hit45/1s45/rec14/int0/o1/1/700ms/97 |
| `dur4-eagle-conduit-baseline-dive1.5` | baseline / 1.50 | 173: DEAD@105000/min0/hit68/1s68/rec4/int0/o1/1/1100ms/86; 947: alive/min0.661/hit45/1s45/rec22/int0/o0; 2027: DEAD@25200/min0/hit67/1s146/rec0/int0/o2/2/750ms/81.5; 4093: alive/min0.921/hit12/1s12/rec17/int1/o0; 5579: alive/min0.563/hit45/1s45/rec14/int0/o1/1/800ms/86 |
| `dur4-eagle-conduit-baseline-dive1.25` | baseline / 1.25 | 173: DEAD@105000/min0/hit68/1s68/rec4/int0/o1/1/1100ms/75; 947: alive/min0.707/hit45/1s45/rec22/int0/o0; 2027: DEAD@27400/min0/hit56/1s146/rec0/int0/o2/2/750ms/68; 4093: alive/min0.921/hit12/1s12/rec17/int1/o0; 5579: alive/min0.595/hit45/1s45/rec15/int0/o1/1/1000ms/75 |
| `dur4-eagle-conduit-weapon-alt-dive1.75` | weapon-alt / 1.75 | 173: alive/min0.616/hit45/1s45/rec21/int0/o0; 947: alive/min0.616/hit45/1s45/rec20/int1/o1/1/1000ms/97; 2027: alive/min0.103/hit112/1s161/rec17/int0/o3/3/633.33ms/100.67; 4093: alive/min0.616/hit45/1s45/rec19/int1/o2/2/1000ms/97; 5579: alive/min0.504/hit45/1s45/rec10/int0/o0 |
| `dur4-eagle-conduit-weapon-alt-dive1.5` | weapon-alt / 1.50 | 173: alive/min0.661/hit45/1s45/rec22/int0/o0; 947: alive/min0.671/hit45/1s45/rec15/int0/o0; 2027: alive/min0.215/hit67/1s112/rec18/int0/o2/2/750ms/81.5; 4093: alive/min0.661/hit45/1s45/rec19/int0/o1/1/900ms/86; 5579: alive/min0.549/hit45/1s45/rec10/int0/o0 |
| `dur4-eagle-conduit-weapon-alt-dive1.25` | weapon-alt / 1.25 | 173: alive/min0.707/hit45/1s45/rec21/int0/o0; 947: alive/min0.74/hit45/1s45/rec19/int0/o0; 2027: alive/min0.326/hit56/1s101/rec11/int0/o3/3/633.33ms/72; 4093: alive/min0.707/hit45/1s45/rec19/int1/o1/1/900ms/75; 5579: alive/min0.595/hit45/1s45/rec10/int0/o1/1/900ms/75 |
| `dur4-eagle-spirit-baseline-dive1.75` | baseline / 1.75 | 173: alive/min0.796/hit47/1s47/rec1/int0/o4/4/825ms/112; 947: DEAD@37700/min0/hit112/1s112/rec0/int2/o3/3/666.67ms/112; 2027: alive/min0.243/hit112/1s112/rec16/int12/o9/9/744.44ms/112; 4093: DEAD@198200/min0/hit97/1s161/rec11/int5/o5/5/540ms/112; 5579: alive/min0.239/hit112/1s175/rec14/int6/o4/4/600ms/112 |
| `dur4-eagle-spirit-baseline-dive1.5` | baseline / 1.50 | 173: alive/min0.147/hit96/1s96/rec1/int0/o4/4/700ms/96; 947: DEAD@37700/min0/hit96/1s96/rec0/int2/o3/3/666.67ms/96; 2027: alive/min0.443/hit88.3/1s88.3/rec8/int1/o7/6/666.67ms/96; 4093: alive/min0.365/hit80/1s80/rec14/int11/o7/7/528.57ms/96; 5579: alive/min0.336/hit96/1s96/rec11/int7/o5/5/620ms/96 |
| `dur4-eagle-spirit-baseline-dive1.25` | baseline / 1.25 | 173: alive/min0.513/hit64/1s112/rec1/int0/o4/4/725ms/80; 947: alive/min0.108/hit80/1s95/rec10/int8/o7/7/571.43ms/80; 2027: alive/min0.513/hit72.3/1s72.3/rec14/int7/o6/6/700ms/80; 4093: alive/min0.513/hit97/1s97/rec14/int13/o8/8/637.5ms/80; 5579: alive/min0.477/hit64/1s64/rec12/int9/o4/4/825ms/80 |

### Opening dive chronology

Across the Eagle matrix, the raw log contained 442 `Skyfall Rend` starts. Four hundred and forty had a matching end record with exactly 1,000ms elapsed, and 439 had a positive first incoming hit. All 442 were the first logged Skyfall for their spawned Eagle ID; no same-ID subsequent Skyfall was observed before that Eagle was removed or the observation ended. This means the requested opening/subsequent split is supported only as `opening` versus no observed `subsequent` episode in this batch. The log has no empowered flag for the hit, so “opening hit” means cast-sequence-associated, not definitively empowered.

In the table, `O/H` is opening casts/opening positive hits; `Δ p50/p90/max` is cast-end to first positive hit in milliseconds; `total p50/p90/max` is first-hit `hpDamage + absorbed`. These are pooled cast-associated distributions within the exact cell, not a new pass threshold.

| Exact cell ID | diveMultiplier | O/H | Δ p50/p90/max ms | first-hit total p50/p90/max |
|---|---:|---:|---:|---:|
| `dur4-eagle-striker-baseline-dive1.75` | 1.75 | 17/17 | 400/940/1400 | 86/86/86 |
| `dur4-eagle-striker-baseline-dive1.5` | 1.50 | 18/18 | 700/1000/1500 | 78/78/78 |
| `dur4-eagle-striker-baseline-dive1.25` | 1.25 | 21/21 | 400/900/900 | 71/71/71 |
| `dur4-eagle-squire-baseline-dive1.75` | 1.75 | 22/22 | 400/890/1100 | 95/95/95 |
| `dur4-eagle-squire-baseline-dive1.5` | 1.50 | 22/22 | 400/800/1100 | 81/81/81 |
| `dur4-eagle-squire-baseline-dive1.25` | 1.25 | 26/25 | 500/900/1300 | 67/67/67 |
| `dur4-eagle-apprentice-baseline-dive1.75` | 1.75 | 17/17 | 400/1140/1400 | 103.8/103.8/103.8 |
| `dur4-eagle-apprentice-baseline-dive1.5` | 1.50 | 25/25 | 400/960/1200 | 89.4/89.4/89.4 |
| `dur4-eagle-apprentice-baseline-dive1.25` | 1.25 | 21/21 | 400/1000/1200 | 75.9/75.9/75.9 |
| `dur4-eagle-slinger-baseline-dive1.75` | 1.75 | 26/26 | 500/1050/1400 | 113/113/113 |
| `dur4-eagle-slinger-baseline-dive1.5` | 1.50 | 23/23 | 500/780/800 | 98/98/98 |
| `dur4-eagle-slinger-baseline-dive1.25` | 1.25 | 27/27 | 500/880/1300 | 81/81/81 |
| `dur4-eagle-slinger-weapon-alt-dive1.75` | 1.75 | 20/20 | 700/1100/1200 | 113/113/113 |
| `dur4-eagle-slinger-weapon-alt-dive1.5` | 1.50 | 22/21 | 500/1100/1300 | 98/98/98 |
| `dur4-eagle-slinger-weapon-alt-dive1.25` | 1.25 | 29/29 | 600/1120/1400 | 81/81/81 |
| `dur4-eagle-conduit-baseline-dive1.75` | 1.75 | 4/4 | 850/1070/1100 | 97/107.5/112 |
| `dur4-eagle-conduit-baseline-dive1.5` | 1.50 | 4/4 | 900/1070/1100 | 86/93/96 |
| `dur4-eagle-conduit-baseline-dive1.25` | 1.25 | 4/4 | 1000/1070/1100 | 75/78.5/80 |
| `dur4-eagle-conduit-weapon-alt-dive1.75` | 1.75 | 6/6 | 950/1050/1100 | 97/112/112 |
| `dur4-eagle-conduit-weapon-alt-dive1.5` | 1.50 | 3/3 | 900/980/1000 | 86/94/96 |
| `dur4-eagle-conduit-weapon-alt-dive1.25` | 1.25 | 5/5 | 900/960/1000 | 75/80/80 |
| `dur4-eagle-spirit-baseline-dive1.75` | 1.75 | 25/25 | 500/1100/1400 | 112/112/112 |
| `dur4-eagle-spirit-baseline-dive1.5` | 1.50 | 26/25 | 500/1060/1300 | 96/96/96 |
| `dur4-eagle-spirit-baseline-dive1.25` | 1.25 | 29/29 | 500/1120/1300 | 80/80/80 |

The 1.25x arm reduces the pooled first-hit median relative to 1.75x for all eight builds: Striker 86→71, Squire 95→67, Apprentice 103.8→75.9, Slinger baseline 113→81, Slinger weapon-alt 113→81, Conduit baseline 97→75, Conduit weapon-alt 97→75, and Spirit 112→80. The reduction is a treatment effect on the opening sequence; it does not prove a universal survival improvement.

### Pressure comparison by build

| Build | 1.75x deaths / minHP min–median–max / max 1s HP | 1.50x deaths / minHP min–median–max / max 1s HP | 1.25x deaths / minHP min–median–max / max 1s HP |
|---|---|---|---|
| Striker baseline | 1/5; 0–0.10–0.21; 165 | 2/5; 0–0.08–0.17; 209 | 2/5; 0–0.18–0.26; 202 |
| Squire baseline | 0/5; 0.10–0.28–0.55; 139 | 1/5; 0–0.21–0.44; 139 | 0/5; 0.12–0.36–0.51; 152 |
| Apprentice baseline | 1/5; 0–0.17–0.36; 155 | 1/5; 0–0.24–0.47; 152.06 | 1/5; 0–0.30–0.44; 129.1 |
| Slinger baseline | 0/5; 0.33–0.51–0.66; 113 | 0/5; 0.47–0.55–0.64; 117 | 0/5; 0.25–0.56–0.66; 100 |
| Slinger weapon-alt | 2/5; 0–0.12–0.35; 113 | 2/5; 0–0.09–0.16; 192 | 2/5; 0–0.08–0.16; 163 |
| Conduit baseline | 2/5; 0–0.41–0.92; 146 | 2/5; 0–0.43–0.92; 146 | 2/5; 0–0.44–0.92; 146 |
| Conduit weapon-alt | 0/5; 0.10–0.49–0.62; 161 | 0/5; 0.21–0.55–0.67; 112 | 0/5; 0.33–0.61–0.74; 101 |
| Spirit baseline | 2/5; 0–0.26–0.80; 175 | 1/5; 0–0.26–0.44; 96 | 0/5; 0.11–0.43–0.51; 112 |

The 1.25x arm improves the five-seed median minimum HP for 7 of 8 build comparisons, but death counts are unchanged for six builds, improve for Spirit, and worsen for Striker. The path-dependent survival result is insufficient for a live global pressure claim; 1.25x remains an isolated experimental candidate only.

### Final damage windows for Eagle deaths

The following rows are every Eagle player-death observation. The 10s and 30s windows are anchored at the logged `player-death` timestamp. Entries are `source/damageType = hpDamage + absorbed total [event count]`; debt damage is retained as its own damage type. Survivors have no death-window row.

| Exact cell ID | seed / deathAtMs | final 10s sources | final 30s sources |
|---|---:|---|---|
| `dur4-eagle-apprentice-baseline-dive1.25` | 5579 / 247800 | Stone Eagle/direct=381.9 [6]; Stone Eagle/debt=19 [8] | Stone Eagle/direct=508.65 [8]; Boulder Thrower/direct=70.2 [1]; Stone Eagle/debt=28 [15]; Boulder Thrower/debt=6 [3] |
| `dur4-eagle-apprentice-baseline-dive1.5` | 5579 / 199300 | Stone Eagle/direct=221.4 [3]; Boulder Thrower/direct=144.36 [2]; Stone Eagle/debt=13 [6]; Boulder Thrower/debt=2 [2] | Stone Eagle/direct=221.4 [3]; Boulder Thrower/direct=144.36 [2]; Granite Titan/direct=92.1 [1]; Stone Eagle/debt=13 [6]; Boulder Thrower/debt=2 [2]; Granite Titan/debt=1 [1] |
| `dur4-eagle-apprentice-baseline-dive1.75` | 5579 / 20300 | Stone Eagle/direct=153.33 [2]; Granite Titan/direct=85.5 [1]; Stone Eagle/debt=10 [6]; Granite Titan/debt=6 [4] | Stone Eagle/direct=312.93 [4]; Granite Titan/direct=85.5 [1]; Stone Eagle/debt=13 [9]; Granite Titan/debt=6 [4] |
| `dur4-eagle-conduit-baseline-dive1.25` | 173 / 105000 | Stone Eagle/direct=199 [4]; Granite Titan/direct=68 [1] | Stone Eagle/direct=255 [5]; Granite Titan/direct=242 [3] |
| `dur4-eagle-conduit-baseline-dive1.25` | 2027 / 27400 | Stone Eagle/direct=281 [6]; Boulder Thrower/direct=56 [1] | Stone Eagle/direct=361 [7]; Boulder Thrower/direct=56 [1] |
| `dur4-eagle-conduit-baseline-dive1.5` | 173 / 105000 | Stone Eagle/direct=199 [4]; Granite Titan/direct=68 [1] | Stone Eagle/direct=266 [5]; Granite Titan/direct=242 [3] |
| `dur4-eagle-conduit-baseline-dive1.5` | 2027 / 25200 | Stone Eagle/direct=343 [6]; Boulder Thrower/direct=56 [1] | Stone Eagle/direct=343 [6]; Boulder Thrower/direct=56 [1] |
| `dur4-eagle-conduit-baseline-dive1.75` | 173 / 103300 | Stone Eagle/direct=213 [4]; Granite Titan/direct=68 [1] | Granite Titan/direct=242 [3]; Stone Eagle/direct=213 [4] |
| `dur4-eagle-conduit-baseline-dive1.75` | 2027 / 25200 | Stone Eagle/direct=370 [6]; Boulder Thrower/direct=56 [1] | Stone Eagle/direct=370 [6]; Boulder Thrower/direct=56 [1] |
| `dur4-eagle-slinger-weapon-alt-dive1.25` | 947 / 66600 | Stone Eagle/direct=320 [6] | Stone Eagle/direct=466 [8]; Boulder Thrower/direct=81 [1] |
| `dur4-eagle-slinger-weapon-alt-dive1.25` | 4093 / 268300 | Stone Eagle/direct=389 [7] | Stone Eagle/direct=389 [7]; Granite Titan/direct=98 [1] |
| `dur4-eagle-slinger-weapon-alt-dive1.5` | 173 / 107400 | Stone Eagle/direct=346 [5]; Granite Titan/direct=29 [1] | Stone Eagle/direct=346 [5]; Granite Titan/direct=225 [3] |
| `dur4-eagle-slinger-weapon-alt-dive1.5` | 4093 / 115500 | Stone Eagle/direct=163 [2]; Boulder Thrower/direct=81 [1]; Granite Titan/direct=29 [1] | Stone Eagle/direct=281 [4]; Granite Titan/direct=225 [3]; Boulder Thrower/direct=81 [1] |
| `dur4-eagle-slinger-weapon-alt-dive1.75` | 4093 / 120700 | Stone Eagle/direct=345 [5] | Stone Eagle/direct=345 [5]; Boulder Thrower/direct=162 [2]; Granite Titan/direct=98 [1] |
| `dur4-eagle-slinger-weapon-alt-dive1.75` | 5579 / 246100 | Stone Eagle/direct=246 [3]; Boulder Thrower/direct=162 [2] | Boulder Thrower/direct=324 [4]; Stone Eagle/direct=246 [3]; Granite Titan/direct=29 [1] |
| `dur4-eagle-spirit-baseline-dive1.5` | 947 / 37700 | Stone Eagle/direct=192 [2]; Boulder Thrower/direct=80 [1] | Boulder Thrower/direct=320 [4]; Stone Eagle/direct=192 [2] |
| `dur4-eagle-spirit-baseline-dive1.75` | 947 / 37700 | Stone Eagle/direct=224 [2]; Boulder Thrower/direct=80 [1] | Boulder Thrower/direct=320 [4]; Stone Eagle/direct=224 [2] |
| `dur4-eagle-spirit-baseline-dive1.75` | 4093 / 198200 | Stone Eagle/direct=176 [2]; Boulder Thrower/direct=160 [2]; Granite Titan/direct=97 [1] | Stone Eagle/direct=288 [3]; Boulder Thrower/direct=160 [2]; Granite Titan/direct=97 [1] |
| `dur4-eagle-squire-baseline-dive1.5` | 4093 / 140700 | Stone Eagle/direct=216 [4]; Granite Titan/direct=170 [2] | Stone Eagle/direct=297 [5]; Granite Titan/direct=255 [3]; Boulder Thrower/direct=69 [1] |
| `dur4-eagle-striker-baseline-dive1.25` | 173 / 275600 | Boulder Thrower/direct=216 [3]; Granite Titan/direct=158 [2] | Boulder Thrower/direct=504 [7]; Granite Titan/direct=158 [2] |
| `dur4-eagle-striker-baseline-dive1.25` | 2027 / 72000 | Stone Eagle/direct=260 [4]; Boulder Thrower/direct=144 [2] | Boulder Thrower/direct=360 [5]; Stone Eagle/direct=260 [4] |
| `dur4-eagle-striker-baseline-dive1.5` | 173 / 275600 | Boulder Thrower/direct=216 [3]; Granite Titan/direct=158 [2] | Boulder Thrower/direct=504 [7]; Granite Titan/direct=158 [2] |
| `dur4-eagle-striker-baseline-dive1.5` | 2027 / 72000 | Stone Eagle/direct=274 [4]; Boulder Thrower/direct=144 [2] | Boulder Thrower/direct=360 [5]; Stone Eagle/direct=274 [4] |
| `dur4-eagle-striker-baseline-dive1.75` | 173 / 275800 | Boulder Thrower/direct=216 [3]; Granite Titan/direct=158 [2] | Boulder Thrower/direct=504 [7]; Granite Titan/direct=158 [2] |

## Diagnostics, evidence gaps, and exit recommendation

The raw batch contained 526,521 events: 214,219 damage, 255,801 heal, 4,655 kill, 2,918 cast-start, 2,519 cast-end, 20,920 technique-adapter, 7,881 telegraph-dodge, 4,056 buff-gain, 3,996 buff-expire, 4,732 absorb, 498 buff-update, and 37 player-death events. There were 186,270 minion damage events across all Conduit rows, totaling 2,981,067 HP+absorbed contribution; this includes the 30 Conduit Eagle observations in addition to Matrix A. All 4,655 logged kills shared a timestamp with a positive outgoing damage event. No static-damage-contact event occurred.

Natural episode boundaries and late joins are retained in each `summary.json`; the raw analysis does not merge away long gaps or treat a 300s window-end as a successful unfinished fight. HP regain, Granite Barrier absorption, debt damage, and wards are retained in pressure calculations. No long-gap observation is used to claim client/pathfinding behavior.

The decisions from this experiment are:

1. Do not promote T2 +8 or T3 +16 added plating as ordinary enemy defaults. The tested high arms either move all weapons outside the contextual duration band, create sparse multi-minute Conduit outliers, or floor a large fraction of owned summon hits at 1 damage.
2. The heavy weapon is a useful equipment counter signal, but its high-plating kills are not acceptable ordinary pacing and do not justify penetration, summon compensation, or a special resistance rule. If plating remains an investigated axis, keep ordinary enemy plating below the tested added range and audit any future higher-plating elite separately.
3. Retain 1.25x as the isolated Stone Eagle multiplier candidate for a future controlled decision. It clearly lowers the opening sequence's observed damage while leaving ordinary attack at 75, but the five-seed survival outcomes are path-dependent and do not authorize a live change.
4. Do not change Stone Eagle ordinary attacks, Boulder Thrower, Granite Titan, Troll/root/slam, Slam/Sweep, other biomes, bosses, economy, or client behavior from this evidence. No operator-selected next attempt is authorized by this report.

## Artifact links

- [Generated analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/results/analysis.md>)
- [Generated analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/results/analysis.json>)
- [Run manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/results/manifest.json>)
- [Run index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/results/index.json>)
- [Completion marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915/results/complete.json>)
- [Durability 4 operator packet](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability4-operator-packet.md>)

All source and live-play boundaries above are intentional. No economy state, build definition, balance parameter, or runtime logic was changed by this experiment.
