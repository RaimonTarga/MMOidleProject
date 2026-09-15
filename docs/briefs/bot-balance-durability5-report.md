# Durability 5 report — combined patch confirmation

Status: complete, synthetic benchmark evidence only. This report records one exact frozen run and returns the balance decision to the operator. It does not authorize a source patch, a balance patch, a client change, a live-play conclusion, or economy certification.

## Decision summary

- The frozen 32-cell batch completed exactly once: 160/160 observations, 0 failed observations, and no retries. The run used the requested authored Cave/Mountain values and the requested Stone Eagle 1.25x `Skyfall Rend` arm, with no definition overlay (`hpTreatment=[]` in all 160 observations).
- Named-target accounting produced 1,092 traces, 984 clean traces, 1,001 kills, 91 unfinished traces, and 35 observed HP-regain traces. Regain and kill counts can overlap. The eight player deaths were all T2 outcomes: one T2 Cave death and seven T2 Mountain deaths; T3 had 0/80 deaths.
- The authored combined values remain a plausible provisional candidate for ordinary Cave/Mountain durability. The named-elite outer clean medians were 10.4–21.6s in T2 Cave, 10.6–25.55s in T2 Mountain, 16.2–32s in T3 Cave, and 19.35–32s in T3 Mountain against contextual bands of 10–20s at T2 and 20–30s at T3. These bands are design context, not an automatic pass/fail gate.
- T2 Mountain is the limiting pressure result: 7/40 deaths, with deaths concentrated in Striker, Apprentice, Conduit baseline, and Slinger weapon-alt observations. This is companion/roster pressure evidence, not a reason to edit named-elite durability automatically. T3 Mountain is death-free, while T3 Cave's slowest rows are the Slinger weapon-alt and Conduit rows at roughly 30.5–32s.
- The batch did not reproduce the prior Conduit summon stall or a summon-damage floor: all positive owned-minion damage came from `minion:Consort`, with observed hit values 13–33 and no approximately 1-HP floor. No 4x class or DoT spread was observed. No monster heal event occurred.
- Exit: retain the authored combined values as a provisional candidate for the next gated validation step; do not broaden them to other biomes, do not make a local combat edit from this synthetic run, and route T2 Mountain attrition plus the upper-end T3 Cave rows to a separately scoped follow-up if more evidence is required. The result remains non-canonical for acquisition, travel, economy, client/browser presentation, and human feel.

## Frozen identity, treatment, and execution

| Item | Value |
|---|---|
| Frozen source revision | `3a0220aed0c6765e72ecbfae9cdc2de224b38a30` |
| Frozen source tree | `f7b6f937366c5c9b244687444822b4984441a939` |
| Untreated definitions hash | `447f3ff286e15aeda8be985a97baebac566813cf5a7e138bd1a5317f805a660d` |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitboxes SHA-256 | `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83` |
| Qualification index | [Durability 5 qualification index](<C:/Users/osaif/AppData/Local/mmo-idle/validation/durability5/qualification/index.json>) |
| Qualification index SHA-256 | `1CEEFC7C12FC04FB37779AD33A2EC97474FDD01C531932787B4E97EAAF737F2F` |
| Mode | `run`, synthetic `true`, economyEligible `false` |
| Time step / duration | 100ms / 300s per observation |
| Seeds | 173, 947, 2027, 4093, 5579 |
| Matrix | Four Cave/Mountain nodes × eight builds = 32 cells |
| Observations | 32 cells × 5 seeds = 160 |
| Qualification | All 32 cells were in the frozen qualification index. Diagnostic typecheck, qualification pilots, focused confirmation test, and report generation passed. Full suite, browser playtest, and human playtest were not run. |

The exact operator command was:

`pnpm --dir C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/source --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability5 --mode=run --revision=3a0220aed0c6765e72ecbfae9cdc2de224b38a30 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --out=C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/results`

Run window: `2026-09-15T17:25:01.7675101Z`–`2026-09-15T17:48:23.5971893Z` UTC; wall time `1,401.8296792s` (about 23m21.83s). One sequential process was used. No Docker, restart, retry, source edit, balance edit, adaptive rerun, or extra experiment was used. The wrapper's paired C: free-space values were blank, so disk consumption is not reported. Peak RSS was not sampled; the process exited 0 without a resource failure.

The detached checkout remained at the frozen revision/tree and clean after the run. The shared worktree contained unrelated user edits before and after the experiment; they were preserved.

## Integrity and artifact verification

An independent post-run scan found 32 manifest cells, 160 paired run directories, 160 paired `ready.json`/`summary.json`/`events.jsonl`/`samples.jsonl` observations, 0 `failed.json` files, and 645 recursive files. There were no duplicate, missing, or unexpected manifest pairs. Every observation was complete and synthetic. `geometryRosterHash` matched across every intended node/role/seed comparison group: 0 mismatches. `hpTreatment` was empty in all 160 observations.

| Artifact | SHA-256 / result |
|---|---|
| [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/results/manifest.json>) | `FA56D4AB983B33412FA02FC7F5686DD893A7C2E9443D0339CB35312F50A3486E` |
| [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/results/complete.json>) | `E1CC3ECEFA410CA7699448F9BDF51E608EFC9BCD6C07811B359081F08E0F4F61`; `{"cells":32,"runs":160,"mode":"run"}` |
| [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/results/index.json>) | `93CEAAF6DE0A424BE2F1FFDF2566C042C6301B5EFF94B5E497A588A369AB3A32` |
| [generated analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/results/analysis.json>) | `1C9F11F059AF59FF1CFB9A089D01B82168E41DFC18BE1CB879FC44E86582C7E1` |
| [generated analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/results/analysis.md>) | `99100E82C6042BC79DA3BDD46094174A1B95BA279F869DA637CC9A04A0B9E8A5` |
| Result structure | 160 run directories, 645 recursive files, 0 `failed.json`, 5 root files |

## Authored values, actual values, and build legality

The source definitions in the frozen checkout are the authored treatment. Actual stats below are the ready-state target stats after normal node modifiers recorded by the harness, before any experiment overlay. The four named values are at [cave.monsters.ts:103](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/source/shared/src/data/monsters/cave.monsters.ts:103>), [cave.monsters.ts:172](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/source/shared/src/data/monsters/cave.monsters.ts:172>), [mountain.monsters.ts:91](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/source/shared/src/data/monsters/mountain.monsters.ts:91>), and [mountain.monsters.ts:155](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/source/shared/src/data/monsters/mountain.monsters.ts:155>). Stone Eagle attack is 75; its dive multiplier is 1.25x in the selected frozen source. Granite Barrier is the existing 25%-threshold, 25%-ward, 8,000ms ability at [mountain.monsters.ts:107](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/source/shared/src/data/monsters/mountain.monsters.ts:107>) and [mountain.monsters.ts:169](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915/source/shared/src/data/monsters/mountain.monsters.ts:169>).

| Context | Node / named target | Authored HP / attack / plate / DR | Actual HP / attack / plate / DR | Target presence across five seeds |
|---|---|---:|---:|---:|
| T2 Cave | `node-t2-cave-02` / Cave Troll | 1320 / 86 / 1 / 0.264 | 1320 / 103 / 1 / 0.264 | 6–9 |
| T2 Mountain | `node-t2-mountain-04` / Granite Titan | 1380 / 105 / 0 / 0 | 1380 / 105 / 0 / 0.10 | 8–10 |
| T3 Cave | `node-t3-cave-02` / Cavern Troll | 3780 / 124 / 2 / 0.28 | 3780 / 161 / 2 / 0.28 | 4–8 |
| T3 Mountain | `node-t3-mountain-04` / Mountain Colossus | 4250 / 130 / 0 / 0 | 4250 / 130 / 0 / 0.15 | 6–8 |

All eight legal builds were run at each node with medium frames, close range for Striker/Squire, medium range for ranged classes, matching armor/charm, Mountain boots, Tempered Core, offensive stance, established abilities/runes, no relic, and no heavy Conduit profile.

| Build family | Exact T2 weapon | Exact T3 weapon |
|---|---|---|
| Striker solo baseline | `gale-needle` | `volcanic-cinderlash` |
| Squire solo baseline | `quake-hammer` | `mountain-avalanche-maul` |
| Apprentice small-group baseline | `ruinous-axe` | `cave-cataclysm-axe` |
| Slinger small-group baseline | `jungle-stinger-rapier` | `jungle-venomthorn-rapier` |
| Slinger small-group weapon-alt | `swamp-mirebrand` | `swamp-blightbrand` |
| Conduit small-group baseline | `ruinous-axe` | `cave-cataclysm-axe` |
| Conduit small-group weapon-alt | `jungle-stinger-rapier` | `jungle-venomthorn-rapier` |
| Spirit small-group baseline | `ruinous-axe` | `cave-cataclysm-axe` |

## Named-elite duration results

The named target is joined by node, role, build, and seed. In the seed token below, `seed: median / clean / kills / unfinished / regain` is used. TTK is seconds. The outer value is the median of available per-seed named-target medians, not a pooled-kill median. The parenthetical is `clean / kills / unfinished / regain` for the full cell. Clean excludes unfinished or HP-regain traces; kill and regain counts can overlap, so these categories are not additive.

The contextual bands are 10–20s at T2 and 20–30s at T3. They are not automatic pass/fail rules.

### T2 Cave — `node-t2-cave-02`, named elite `cave-troll`

| Exact cell ID | Actual HP/attack/plate/DR | Outer clean TTK | Seed: median/clean/kills/unfinished/regain |
|---|---:|---:|---|
| `dur5-t2-striker-solo-baseline` | 1320/103/1/0.264 | 21.6s (26/26/4/0) | 173: 21.8/5/5/1/0; 947: 21.7/5/5/1/0; 2027: 21.5/5/5/0/0; 4093: 20.2/6/6/1/0; 5579: 21.6/5/5/1/0 |
| `dur5-t2-squire-solo-baseline` | 1320/103/1/0.264 | 16.0s (30/30/2/0) | 173: 16/6/6/0/0; 947: 16/7/7/1/0; 2027: 15.7/6/6/0/0; 4093: 17.7/6/6/0/0; 5579: 16/5/5/1/0 |
| `dur5-t2-apprentice-solo-baseline` | 1320/103/1/0.264 | 13.1s (35/35/3/1) | 173: 13.1/6/6/0/0; 947: 13.5/11/11/0/0; 2027: 13.1/6/6/0/0; 4093: 12.7/4/4/2/1; 5579: 13.5/8/8/1/0 |
| `dur5-t2-slinger-solo-baseline` | 1320/103/1/0.264 | 10.4s (43/43/0/0) | 173: 11.1/9/9/0/0; 947: 10.3/11/11/0/0; 2027: 11/8/8/0/0; 4093: 10.4/7/7/0/0; 5579: 10.3/8/8/0/0 |
| `dur5-t2-slinger-solo-weapon-alt` | 1320/103/1/0.264 | 20.0s (27/27/0/0) | 173: 19.75/4/4/0/0; 947: 20/5/5/0/0; 2027: 20/5/5/0/0; 4093: 20/7/7/0/0; 5579: 19.75/6/6/0/0 |
| `dur5-t2-conduit-solo-baseline` | 1320/103/1/0.264 | 17.8s (37/37/3/0) | 173: 17.8/7/7/1/0; 947: 17.9/10/10/0/0; 2027: 17.9/7/7/0/0; 4093: 17.8/6/6/1/0; 5579: 17.7/7/7/1/0 |
| `dur5-t2-conduit-solo-weapon-alt` | 1320/103/1/0.264 | 14.9s (34/34/3/0) | 173: 14.9/7/7/0/0; 947: 14.9/9/9/1/0; 2027: 14.8/4/4/0/0; 4093: 14.8/7/7/0/0; 5579: 14.9/7/7/2/0 |
| `dur5-t2-spirit-solo-baseline` | 1320/103/1/0.264 | 11.9s (44/44/0/0) | 173: 11.2/8/8/0/0; 947: 11.9/10/10/0/0; 2027: 11.9/7/7/0/0; 4093: 12.2/7/7/0/0; 5579: 11.9/12/12/0/0 |

### T2 Mountain — `node-t2-mountain-04`, named elite `granite-titan`

| Exact cell ID | Actual HP/attack/plate/DR | Outer clean TTK | Seed: median/clean/kills/unfinished/regain |
|---|---:|---:|---|
| `dur5-t2-striker-small-group-baseline` | 1380/105/0/0.10 | 25.55s (19/19/2/0) | 173: 24.9/5/5/1/0; 947: 25.4/3/3/1/0; 2027: 29.7/1/1/0/0; 4093: 26.45/4/4/0/0; 5579: 25.55/6/6/0/0 |
| `dur5-t2-squire-small-group-baseline` | 1380/105/0/0.10 | 18.6s (33/33/1/0) | 173: 18.7/7/7/0/0; 947: 18.3/6/6/0/0; 2027: 21.3/5/5/1/0; 4093: 18.6/7/7/0/0; 5579: 18.3/8/8/0/0 |
| `dur5-t2-apprentice-small-group-baseline` | 1380/105/0/0.10 | 13.5s (29/29/2/0) | 173: 13.5/6/6/0/0; 947: 13.5/8/8/1/0; 2027: 13.5/4/4/0/0; 4093: 13.5/7/7/1/0; 5579: 13.5/4/4/0/0 |
| `dur5-t2-slinger-small-group-baseline` | 1380/105/0/0.10 | 10.6s (41/42/6/3) | 173: 10.6/11/11/1/0; 947: 12.3/7/7/2/1; 2027: 12.3/5/5/2/1; 4093: 10.6/10/11/1/1; 5579: 10.6/8/8/0/0 |
| `dur5-t2-slinger-small-group-weapon-alt` | 1380/105/0/0.10 | 18.0s (17/20/2/5) | 173: 18/7/7/0/0; 947: 18/1/1/0/0; 2027: 18/3/3/2/2; 4093: 19/3/4/0/1; 5579: 18/3/5/0/2 |
| `dur5-t2-conduit-small-group-baseline` | 1380/105/0/0.10 | 14.7s (14/15/3/2) | 173: 14.7/2/2/1/0; 947: 14.6/3/3/1/0; 2027: —/0/0/1/1; 4093: 14.85/6/6/0/0; 5579: 14.7/3/4/0/1 |
| `dur5-t2-conduit-small-group-weapon-alt` | 1380/105/0/0.10 | 11.85s (31/32/2/2) | 173: 11.8/8/8/0/0; 947: 11.85/6/6/0/0; 2027: 11.85/4/5/0/1; 4093: 11.85/6/6/0/0; 5579: 11.8/7/7/2/1 |
| `dur5-t2-spirit-small-group-baseline` | 1380/105/0/0.10 | 11.9s (44/46/4/4) | 173: 12.6/9/10/2/2; 947: 11.9/9/9/2/1; 2027: 12.6/9/9/0/0; 4093: 11.9/10/10/0/0; 5579: 11.9/7/8/0/1 |

### T3 Cave — `node-t3-cave-02`, named elite `cavern-troll`

| Exact cell ID | Actual HP/attack/plate/DR | Outer clean TTK | Seed: median/clean/kills/unfinished/regain |
|---|---:|---:|---|
| `dur5-t3-striker-solo-baseline` | 3780/161/2/0.28 | 18.0s (40/40/3/0) | 173: 18.2/6/6/0/0; 947: 16.7/8/8/1/0; 2027: 17.3/7/7/1/0; 4093: 18/9/9/1/0; 5579: 18.1/10/10/0/0 |
| `dur5-t3-squire-solo-baseline` | 3780/161/2/0.28 | 24.95s (32/32/3/0) | 173: 24.95/6/6/1/0; 947: 25.6/6/6/1/0; 2027: 24.5/6/6/0/0; 4093: 25.8/7/7/0/0; 5579: 24.3/7/7/1/0 |
| `dur5-t3-apprentice-solo-baseline` | 3780/161/2/0.28 | 19.5s (36/36/5/3) | 173: 18.2/7/7/1/1; 947: 19.5/6/6/3/2; 2027: 18.65/8/8/0/0; 4093: 19.5/7/7/0/0; 5579: 19.5/8/8/1/0 |
| `dur5-t3-slinger-solo-baseline` | 3780/161/2/0.28 | 20.65s (36/37/5/2) | 173: 21.2/8/9/1/1; 947: 20.65/8/8/0/0; 2027: 22.5/5/5/1/0; 4093: 20.55/8/8/1/0; 5579: 20.5/7/7/2/1 |
| `dur5-t3-slinger-solo-weapon-alt` | 3780/161/2/0.28 | 32.0s (22/23/6/3) | 173: 32/5/5/1/0; 947: 32/3/4/1/1; 2027: 32/5/5/1/0; 4093: 32/5/5/1/1; 5579: 33.35/4/4/2/1 |
| `dur5-t3-conduit-solo-baseline` | 3780/161/2/0.28 | 30.5s (26/26/2/0) | 173: 30.5/5/5/0/0; 947: 30.5/7/7/1/0; 2027: 30.5/4/4/0/0; 4093: 30.35/4/4/1/0; 5579: 30.6/6/6/0/0 |
| `dur5-t3-conduit-solo-weapon-alt` | 3780/161/2/0.28 | 31.6s (26/27/4/1) | 173: 31.6/5/5/1/0; 947: 31.6/5/5/0/0; 2027: 31.6/6/6/1/0; 4093: 31.6/5/6/1/1; 5579: 31.6/5/5/1/0 |
| `dur5-t3-spirit-solo-baseline` | 3780/161/2/0.28 | 16.2s (47/47/3/0) | 173: 15.4/7/7/1/0; 947: 16.7/11/11/1/0; 2027: 16.05/8/8/1/0; 4093: 16.2/11/11/0/0; 5579: 16.25/10/10/0/0 |

### T3 Mountain — `node-t3-mountain-04`, named elite `mountain-colossus`

| Exact cell ID | Actual HP/attack/plate/DR | Outer clean TTK | Seed: median/clean/kills/unfinished/regain |
|---|---:|---:|---|
| `dur5-t3-striker-small-group-baseline` | 4250/130/0/0.15 | 21.5s (31/31/3/0) | 173: 21.8/7/7/0/0; 947: 21.5/5/5/1/0; 2027: 21.4/6/6/0/0; 4093: 21.35/6/6/1/0; 5579: 21.7/7/7/1/0 |
| `dur5-t3-squire-solo-baseline` | 4250/130/0/0.15 | 28.4s (24/24/2/0) | 173: 28.4/5/5/1/0; 947: 28.3/5/5/0/0; 2027: 31.1/5/5/0/0; 4093: 29.8/5/5/0/0; 5579: 28.1/4/4/1/0 |
| `dur5-t3-apprentice-small-group-baseline` | 4250/130/0/0.15 | 22.5s (31/31/1/0) | 173: 22.5/6/6/0/0; 947: 22.5/6/6/1/0; 2027: 22.5/5/5/0/0; 4093: 22.5/7/7/0/0; 5579: 22.5/7/7/0/0 |
| `dur5-t3-slinger-small-group-baseline` | 4250/130/0/0.15 | 24.05s (28/30/3/2) | 173: 25.2/9/9/0/0; 947: 23.9/4/4/0/0; 2027: 24.05/6/6/0/0; 4093: 23.15/6/6/1/0; 5579: 24.7/3/5/2/2 |
| `dur5-t3-slinger-small-group-weapon-alt` | 4250/130/0/0.15 | 32.0s (19/22/5/5) | 173: 32/4/5/1/1; 947: 33.25/4/4/1/0; 2027: 32/5/5/1/0; 4093: 31.6/3/4/1/2; 5579: 33/3/4/1/2 |
| `dur5-t3-conduit-small-group-baseline` | 4250/130/0/0.15 | 26.85s (22/22/3/0) | 173: 26.85/4/4/1/0; 947: 26.9/4/4/1/0; 2027: 26.8/5/5/1/0; 4093: 27.05/4/4/0/0; 5579: 26.5/5/5/0/0 |
| `dur5-t3-conduit-small-group-weapon-alt` | 4250/130/0/0.15 | 27.2s (23/23/3/0) | 173: 27.2/4/4/1/0; 947: 27.2/5/5/0/0; 2027: 27/4/4/1/0; 4093: 26.9/5/5/1/0; 5579: 27.2/5/5/0/0 |
| `dur5-t3-spirit-small-group-baseline` | 4250/130/0/0.15 | 19.35s (37/38/3/2) | 173: 19.5/7/8/2/2; 947: 18.8/6/6/1/0; 2027: 19.4/8/8/0/0; 4093: 19.35/8/8/0/0; 5579: 19.2/8/8/0/0 |

## Durability 2 / Durability 3 comparison

The table compares the original three seeds (`173/947/2027`) using named-target medians. The Durability 2 arm was HP-high; the Durability 3 arm was the prior defense/DR treatment. Durability 3 is not identical to Durability 5: it used a different frozen source identity and an HP-trim/DR/attack overlay. This table is descriptive evidence, not a causal estimate or a merge of the trials. `—` means no clean named-target median was available for that seed.

| Context / build | Durability 5: 173 / 947 / 2027 / outer | Durability 2 HP-high: 173 / 947 / 2027 / outer | Durability 3 DR: 173 / 947 / 2027 / outer |
|---|---:|---:|---:|
| T2 Cave Striker | 21.8 / 21.7 / 21.5 / 21.6s | 22.4 / 22.35 / 22.6 / 22.4s | 21.8 / 21.7 / 21.5 / 21.7s |
| T2 Cave Squire | 16 / 16 / 15.7 / 16s | 15.85 / 16 / — / 15.925s | 16 / 16 / 15.7 / 16s |
| T2 Cave Apprentice | 13.1 / 13.5 / 13.1 / 13.1s | 14.2 / 14.3 / 14.2 / 14.2s | 13.1 / 13.5 / 13.1 / 13.1s |
| T2 Cave Slinger | 11.1 / 10.3 / 11 / 10.4s | 10.3 / 10.7 / 10.45 / 10.45s | 11.1 / 10.3 / 11 / 11s |
| T2 Cave Slinger alt | 19.75 / 20 / 20 / 20s | 20.3 / 20 / 19.75 / 20s | 19.75 / 20 / 20 / 20s |
| T2 Cave Conduit | 17.8 / 17.9 / 17.9 / 17.8s | 17.4 / 17.5 / 17.8 / 17.5s | 17.8 / 17.9 / 17.9 / 17.9s |
| T2 Cave Conduit alt | 14.9 / 14.9 / 14.8 / 14.9s | 14.4 / 14.3 / 14.3 / 14.3s | 14.9 / 14.9 / 14.8 / 14.9s |
| T2 Cave Spirit | 11.2 / 11.9 / 11.9 / 11.9s | 11.2 / 11.9 / 11.9 / 11.9s | 11.2 / 11.9 / 11.9 / 11.9s |
| T2 Mountain Striker | 24.9 / 25.4 / 29.7 / 25.55s | 24.9 / 25.4 / 25.4 / 25.4s | 24.9 / 25.4 / 25.4 / 25.4s |
| T2 Mountain Squire | 18.7 / 18.3 / 21.3 / 18.6s | 18.3 / 18.2 / 20.5 / 18.3s | 18.3 / 18.2 / 20.5 / 18.3s |
| T2 Mountain Apprentice | 13.5 / 13.5 / 13.5 / 13.5s | 13.5 / 13.5 / 13.5 / 13.5s | 12 / 11.2 / 12 / 12s |
| T2 Mountain Slinger | 10.6 / 12.3 / 12.3 / 10.6s | 12.3 / 12.3 / 10.6 / 12.3s | 10.9 / 12.6 / 11.75 / 11.75s |
| T2 Mountain Slinger alt | 18 / 18 / 18 / 18s | 19.5 / 18 / 18 / 18s | 19.75 / 18 / 18 / 18s |
| T2 Mountain Conduit | 14.7 / 14.6 / — / 14.7s | 14.7 / 14.6 / — / 14.65s | 14.8 / 14.8 / — / 14.8s |
| T2 Mountain Conduit alt | 11.8 / 11.85 / 11.85 / 11.85s | 11.8 / 12 / 11.9 / 11.9s | 11.5 / 11.7 / 11.4 / 11.5s |
| T2 Mountain Spirit | 12.6 / 11.9 / 12.6 / 11.9s | 11.9 / 11.9 / 12.25 / 11.9s | 11.9 / 11.9 / 12.25 / 11.9s |
| T3 Cave Striker | 18.2 / 16.7 / 17.3 / 18s | 18.2 / 16.7 / 17.3 / 17.3s | 18.2 / 16.7 / 17.3 / 17.3s |
| T3 Cave Squire | 24.95 / 25.6 / 24.5 / 24.95s | 24.95 / 25.6 / 24.5 / 24.95s | 24.95 / 25.6 / 24.5 / 24.95s |
| T3 Cave Apprentice | 18.2 / 19.5 / 18.65 / 19.5s | 22.5 / 21.8 / 21 / 21.8s | 18.2 / 19.5 / 18.65 / 18.65s |
| T3 Cave Slinger | 21.2 / 20.65 / 22.5 / 20.65s | 21.2 / 20.65 / 22.5 / 21.2s | 21.2 / 20.65 / 22.5 / 21.2s |
| T3 Cave Slinger alt | 32 / 32 / 32 / 32s | 30.8 / 32.2 / 32 / 32s | 32 / 32 / 32 / 32s |
| T3 Cave Conduit | 30.5 / 30.5 / 30.5 / 30.5s | 29.7 / 29.4 / 29.8 / 29.7s | 30.5 / 30.5 / 30.5 / 30.5s |
| T3 Cave Conduit alt | 31.6 / 31.6 / 31.6 / 31.6s | 30.45 / 30.25 / 30.5 / 30.45s | 31.6 / 31.6 / 31.6 / 31.6s |
| T3 Cave Spirit | 15.4 / 16.7 / 16.05 / 16.2s | 15.4 / 16.7 / 16.05 / 16.05s | 15.4 / 16.7 / 16.05 / 16.05s |
| T3 Mountain Striker | 21.8 / 21.5 / 21.4 / 21.5s | 21.8 / 21.5 / 21.4 / 21.5s | 21.8 / 21.8 / 21.5 / 21.8s |
| T3 Mountain Squire | 28.4 / 28.3 / 31.1 / 28.4s | 28.4 / 28.3 / 31.1 / 28.4s | 28.4 / 28.3 / 31.1 / 28.4s |
| T3 Mountain Apprentice | 22.5 / 22.5 / 22.5 / 22.5s | 22.5 / 22.5 / 22.5 / 22.5s | 19.2 / 18.9 / 19.5 / 19.2s |
| T3 Mountain Slinger | 25.2 / 23.9 / 24.05 / 24.05s | 25.2 / 23.9 / 24.05 / 24.05s | 25.2 / 23.9 / 24.05 / 24.05s |
| T3 Mountain Slinger alt | 32 / 33.25 / 32 / 32s | 32 / 33.25 / 32 / 32s | 32 / 32 / 32 / 32s |
| T3 Mountain Conduit | 26.85 / 26.9 / 26.8 / 26.85s | 26.85 / 26.9 / 26.8 / 26.85s | 27.2 / 27.65 / 27.1 / 27.2s |
| T3 Mountain Conduit alt | 27.2 / 27.2 / 27 / 27.2s | 27.2 / 27.2 / 27 / 27.2s | 26.5 / 26.5 / 26.6 / 26.5s |
| T3 Mountain Spirit | 19.5 / 18.8 / 19.4 / 19.35s | 19.5 / 18.8 / 19.4 / 19.4s | 19.5 / 18.8 / 19.4 / 19.4s |

The comparison supports continuity rather than a new balance decision: most Durability 5 medians stay close to the prior HP-high and DR arms, while differences in T2 Mountain and T3 Cave are explained by the selected authored values and should not be treated as a clean treatment effect. The prior raw indexes are [Durability 2 index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/index.json>) and [Durability 3 index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/index.json>); their reports are [Durability 2](<C:/Users/osaif/Documents/Claude/Projects/MMO%20idle/docs/briefs/bot-balance-durability2-report.md>) and [Durability 3](<C:/Users/osaif/Documents/Claude/Projects/MMO%20idle/docs/briefs/bot-balance-durability3-report.md>).

## Pressure and survival

The pressure token is `W` for a 300s window or `D@seconds` for player death, followed by `minHP fraction / largest single HP hit / largest damage in 1s / recovery-complete / recovery-interrupted`. The damage fields are HP damage, not absorbed damage. The complete/interrupted counts are event-level recovery outcomes from each observation.

| Exact cell ID | Five-seed pressure detail: seed: outcome/minHP/largestHit/max1s/complete/interrupted |
|---|---|
| `dur5-t2-striker-solo-baseline` | 173: W/.512/70/70/14/0; 947: W/.513/70/70/15/0; 2027: W/.512/70/70/16/1; 4093: W/.474/70/70/15/0; 5579: W/.445/70/70/16/0 |
| `dur5-t2-squire-solo-baseline` | 173: W/.440/151/151/19/0; 947: W/.403/151/151/15/0; 2027: W/.440/151/151/19/0; 4093: W/.419/151/151/22/0; 5579: D/0/151/302/15/0 |
| `dur5-t2-apprentice-solo-baseline` | 173: W/.363/151.2/157.2/19/0; 947: W/.423/72/75/17/0; 2027: W/.363/151.2/157.2/19/0; 4093: W/.085/151.2/156.2/15/0; 5579: W/.366/72/120.9/14/0 |
| `dur5-t2-slinger-solo-baseline` | 173: W/.634/83/83/26/0; 947: W/.234/174/174/24/0; 2027: W/.634/83/83/24/0; 4093: W/.610/83/83/28/0; 5579: W/.634/83/83/26/0 |
| `dur5-t2-slinger-solo-weapon-alt` | 173: W/.313/83/83/19/0; 947: W/.322/83/83/16/0; 2027: W/.330/83/83/17/0; 4093: W/.321/83/83/15/1; 5579: W/.328/83/83/16/1 |
| `dur5-t2-conduit-solo-baseline` | 173: W/.425/120/120/13/0; 947: W/.939/0/0/17/0; 2027: W/.542/57/57/12/0; 4093: W/.939/0/0/19/0; 5579: W/.939/0/0/18/0 |
| `dur5-t2-conduit-solo-weapon-alt` | 173: W/.595/57/57/19/0; 947: W/.939/0/0/19/0; 2027: W/.707/17/29/25/0; 4093: W/.939/0/0/21/0; 5579: W/.939/0/0/19/0 |
| `dur5-t2-spirit-solo-baseline` | 173: W/.474/114.75/114.75/22/8; 947: W/.514/106/106/22/4; 2027: W/.514/106/106/19/10; 4093: W/.514/106/106/19/10; 5579: W/.915/18.5/18.5/16/6 |
| `dur5-t2-striker-small-group-baseline` | 173: D/0/79/151/8/4; 947: W/.175/79/131/8/10; 2027: D/0/79/202/2/0; 4093: W/.261/79/131/11/4; 5579: W/.191/79/150/9/3 |
| `dur5-t2-squire-small-group-baseline` | 173: W/.361/85/85/14/3; 947: W/.382/85/139/13/6; 2027: W/.310/85/152/10/5; 4093: W/.510/85/85/11/7; 5579: W/.123/85/139/11/5 |
| `dur5-t2-apprentice-small-group-baseline` | 173: W/.379/81/84/14/4; 947: W/.440/81/129.1/13/2; 2027: W/.295/81/129.1/13/5; 4093: W/.142/81/84/12/5; 5579: D/0/85.5/129.1/10/4 |
| `dur5-t2-slinger-small-group-baseline` | 173: W/.661/62.4/62.4/16/11; 947: W/.583/81/81/7/10; 2027: W/.248/81/100/11/11; 4093: W/.559/81/81/14/9; 5579: W/.552/81/81/17/7 |
| `dur5-t2-slinger-small-group-weapon-alt` | 173: W/.148/98/98/7/5; 947: D/0/98/98/1/0; 2027: W/.162/98/127/11/2; 4093: D/0/96.45/154/8/3; 5579: W/.104/98/163/3/0 |
| `dur5-t2-conduit-small-group-baseline` | 173: D/0/68/68/4/0; 947: W/.707/45/45/22/0; 2027: D/0/56/146/0/0; 4093: W/.921/12/12/17/1; 5579: W/.595/45/45/15/0 |
| `dur5-t2-conduit-small-group-weapon-alt` | 173: W/.707/45/45/21/0; 947: W/.740/45/45/19/0; 2027: W/.326/56/101/11/0; 4093: W/.707/45/45/19/1; 5579: W/.595/45/45/10/0 |
| `dur5-t2-spirit-small-group-baseline` | 173: W/.513/64/112/1/0; 947: W/.108/80/95/10/8; 2027: W/.513/72.3/72.3/14/7; 4093: W/.513/97/97/14/13; 5579: W/.477/64/64/12/9 |
| `dur5-t3-striker-solo-baseline` | 173: W/.549/102/102/26/0; 947: W/.553/157/157/24/0; 2027: W/.567/157/157/25/0; 4093: W/.552/157/157/22/0; 5579: W/.550/157/157/21/0 |
| `dur5-t3-squire-solo-baseline` | 173: W/.512/200/200/19/0; 947: W/.759/100/100/21/0; 2027: W/.512/200/200/23/0; 4093: W/.759/100/100/19/0; 5579: W/.759/100/100/17/0 |
| `dur5-t3-apprentice-solo-baseline` | 173: W/.442/102.6/157.1/0/0; 947: W/.122/206.1/214.1/0/0; 2027: W/.440/102.6/148.2/3/0; 4093: W/.444/102.6/156.1/10/1; 5579: W/.432/102.6/157.1/5/0 |
| `dur5-t3-slinger-solo-baseline` | 173: W/.492/118/118/10/0; 947: W/.360/118/176/19/0; 2027: W/.639/118/118/21/0; 4093: W/.639/118/118/16/0; 5579: W/.639/118/118/5/0 |
| `dur5-t3-slinger-solo-weapon-alt` | 173: W/.342/118/131/13/0; 947: W/.344/118/118/12/0; 2027: W/.344/118/118/7/0; 4093: W/.340/118/118/12/0; 5579: W/.346/118/135/5/0 |
| `dur5-t3-conduit-solo-baseline` | 173: W/.940/0/0/16/0; 947: W/.940/0/0/10/0; 2027: W/.821/40/40/20/0; 4093: W/.643/40/120/17/0; 5579: W/.940/0/0/14/0 |
| `dur5-t3-conduit-solo-weapon-alt` | 173: W/.940/0/0/14/0; 947: W/.451/81/81/11/0; 2027: W/.940/0/0/12/0; 4093: W/.375/81/121/3/0; 5579: W/.940/0/0/13/0 |
| `dur5-t3-spirit-solo-baseline` | 173: W/.504/117/117/19/10; 947: W/.863/24/24/14/8; 2027: W/.863/24/24/18/8; 4093: W/.923/24/24/18/4; 5579: W/.923/24/24/18/8 |
| `dur5-t3-striker-small-group-baseline` | 173: W/.536/102/102/12/8; 947: W/.534/102/102/10/14; 2027: W/.577/102/102/9/9; 4093: W/.515/102/102/10/13; 5579: W/.515/102/102/5/15 |
| `dur5-t3-squire-small-group-baseline` | 173: W/.753/92/92/5/5; 947: W/.753/92/92/13/5; 2027: W/.753/92/92/10/8; 4093: W/.713/92/92/8/4; 5579: W/.713/92/92/14/6 |
| `dur5-t3-apprentice-small-group-baseline` | 173: W/.612/90.9/92.9/8/4; 947: W/.686/67.5/70.5/10/3; 2027: W/.620/76.5/79.5/13/3; 4093: W/.559/90.9/94.9/5/4; 5579: W/.477/90.9/94.9/12/4 |
| `dur5-t3-slinger-small-group-baseline` | 173: W/.599/90/90/0/0; 947: W/.745/90/90/23/3; 2027: W/.714/90/90/15/6; 4093: W/.830/60/60/15/4; 5579: W/.830/60/60/7/1 |
| `dur5-t3-slinger-small-group-weapon-alt` | 173: W/.414/90/90/1/0; 947: W/.830/60/60/3/1; 2027: W/.459/101/116/0/0; 4093: W/.584/90/90/7/2; 5579: W/.569/90/90/0/1 |
| `dur5-t3-conduit-small-group-baseline` | 173: W/.939/0/0/19/0; 947: W/.939/0/0/17/1; 2027: W/.939/0/0/15/0; 4093: W/.939/0/0/17/0; 5579: W/.939/0/0/16/0 |
| `dur5-t3-conduit-small-group-weapon-alt` | 173: W/.939/0/0/13/0; 947: W/.939/0/0/16/0; 2027: W/.939/0/0/15/0; 4093: W/.939/0/0/15/0; 5579: W/.939/0/0/16/0 |
| `dur5-t3-spirit-small-group-baseline` | 173: W/1/0/0/1/1; 947: W/.895/35.4/35.4/20/8; 2027: W/1/0/0/15/7; 4093: W/1/0/0/7/2; 5579: W/.847/51.6/51.6/0/1 |

Context aggregates:

| Context | Observations | Deaths | Min HP range / median | Max largest hit | Max damage in 1s | Recovery complete / interrupted |
|---|---:|---:|---:|---:|---:|---:|
| T2 Cave | 40 | 1 | 0–0.939 / 0.493 | 174 | 302 | 741 / 41 |
| T2 Mountain | 40 | 7 | 0–0.921 / 0.343 | 98 | 202 | 443 / 164 |
| T3 Cave | 40 | 0 | 0.122–0.940 / 0.552 | 206.1 | 214.1 | 572 / 39 |
| T3 Mountain | 40 | 0 | 0.414–1.000 / 0.753 | 102 | 116 | 417 / 143 |
| Total | 160 | 8 | — | — | — | 2,173 / 387 |

## Death attribution and exact damage windows

All eight deaths are retained as pressure evidence. The final 10s and 30s windows below are event-sourced positive `hpDamage` totals/counts by source. `melee`, `ranged`, and `debt` are the run's recorded death causes; they do not imply that the named elite was the only source of pressure.

| Cell / seed | Death time | Cause / killer | Final 10s damage | Final 30s damage |
|---|---:|---|---|---|
| `dur5-t2-apprentice-small-group-baseline` / 5579 | 247.8s | debt 3 / Stone Eagle | Stone Eagle 334.9 / 14 | Stone Eagle 454.15 / 23; Boulder Thrower 76.2 / 4 |
| `dur5-t2-conduit-small-group-baseline` / 173 | 105.0s | melee 64 / Stone Eagle | Stone Eagle 199 / 4; Granite Titan 68 / 1 | Stone Eagle 255 / 5; Granite Titan 116 / 3 |
| `dur5-t2-conduit-small-group-baseline` / 2027 | 27.4s | melee 45 / Stone Eagle | Stone Eagle 281 / 6; Boulder Thrower 56 / 1 | Stone Eagle 298 / 7; Boulder Thrower 56 / 1 |
| `dur5-t2-slinger-small-group-weapon-alt` / 4093 | 268.3s | melee 65 / Stone Eagle | Stone Eagle 345.6 / 7 | Stone Eagle 345.6 / 7; Granite Titan 36 / 1 |
| `dur5-t2-slinger-small-group-weapon-alt` / 947 | 66.6s | melee 65 / Stone Eagle | Stone Eagle 320 / 6 | Stone Eagle 404 / 8; Boulder Thrower 62.4 / 1 |
| `dur5-t2-squire-solo-baseline` / 5579 | 228.8s | melee 151 / Cave Troll | Cave Troll 302 / 2 | Cave Troll 590 / 6 |
| `dur5-t2-striker-small-group-baseline` / 173 | 275.6s | ranged 72 / Boulder Thrower | Boulder Thrower 216 / 3; Granite Titan 158 / 2 | Boulder Thrower 328.05 / 7; Granite Titan 158 / 2 |
| `dur5-t2-striker-small-group-baseline` / 2027 | 72.0s | melee 59 / Stone Eagle | Stone Eagle 260 / 4; Boulder Thrower 123.3 / 2 | Stone Eagle 260 / 4; Boulder Thrower 180.6 / 5 |

The deaths are T2 pressure outcomes, not evidence that the named-elite TTK itself requires a durability change. The T2 Mountain result merits a scoped pressure review before any wider adoption decision.

## Casts, wards, healing, and absorption

| Context | Recorded cast starts and paired FX ends | Monster absorption |
|---|---|---:|
| T2 Cave | Savage Rush 231; Ground Slam 280 / 266; Stalactite Shot 2 / 1 | 0 |
| T2 Mountain | Ground Slam 289 / 215; Granite Barrier 195 / 194; Huge Boulder 121 / 90; Skyfall Rend 290 / 289 | Granite Titan 54,543 |
| T3 Cave | Savage Rush 272; Ground Slam 274 / 244 | 0 |
| T3 Mountain | Ground Slam 285 / 280; Granite Barrier 179 / 179; Bombardment 41 / 24; Avalanche Ram 16 / 4 | Mountain Colossus 161,243 |

Across the batch there were 86,717 damage events, 2,475 monster-cast starts, 2,288 monster-cast ends, 3,907 absorb events, 108,598 heal events, and 8 player-death events. Monster `heal` count and amount were both zero. Player heal events numbered 107,773 for 204,409 total healing. Total absorb events were 3,907 for 320,863 absorbed damage; the named Mountain targets accounted for 215,786 of that absorption. The small cast-end differences are retained as harness trace facts; they are not silently converted into missing-damage or pathfinding claims.

## Conduit summon and damage audit

Positive damage totals were split as follows: direct 78,695, DoT 2,451, debt 1,472, AOE 202, and weapon-DoT 3,897. By actor type, player damage was 39,812, monster damage 5,653, and minion damage 41,252. Positive player outgoing damage to monsters was 35,481 events / 3,295,053 HP. Positive incoming damage was 4,885 events / 187,194.705 HP, with 105,078.25 incoming absorbed HP. Positive minion hits were 40,492 events / 826,880 HP; all were sourced by `minion:Consort`. Observed positive minion hit values ranged from 13 to 33, with median 19.

| Context / Conduit cell | Positive hits / HP total | Observed hit values |
|---|---:|---|
| T2 Cave baseline | 4,321 / 69,519 | 15 (3,383), 19 (462), 21 (476) |
| T2 Cave weapon-alt | 5,172 / 74,304 | 13 (3,580), 17 (892), 18 (700) |
| T2 Mountain baseline | 2,367 / 44,973 | 19 (all) |
| T2 Mountain weapon-alt | 4,529 / 76,993 | 17 (all) |
| T3 Cave baseline | 5,356 / 137,958 | 24 (4,310), 33 (1,046) |
| T3 Cave weapon-alt | 7,639 / 136,889 | 17 (6,546), 23 (625), 24 (468) |
| T3 Mountain baseline | 4,652 / 144,212 | 31 (all) |
| T3 Mountain weapon-alt | 6,456 / 142,032 | 22 (all) |

There was no approximately 1-HP summon floor, no T3 on-hit stall, and no 4x class/DoT spread. This closes the specific Conduit regression screen for the selected authored source but does not certify summon balance in other biomes, with other equipment, or in live play.

## Engagement and inactivity diagnostics

The sample stream contained 46,896 samples. `staticDamageContacts` was non-empty in 0 samples; `autoIntent` was present in 46,894 samples, with 2 samples lacking it. This is not a client or pathfinding certification. The server benchmark does not prove browser visuals, input feel, navigation, or human movement.

Across 1,092 named-target traces, the maximum gap between positive outgoing damage events had p50 1.5s, p90 3.3s, p99 44.5s, and maximum 271.2s. There were 21 gaps above 10s, 15 above 30s, and 7 above 60s. The longest gaps were mostly unfinished or HP-regain traces; a small number occurred in clean traces. These are retained as possible encounter/target-presence diagnostics, not interpreted as pathfinding defects without authoritative movement evidence.

## Exit decision and evidence boundary

1. Retain the authored Cave/Mountain values and the 1.25x Stone Eagle dive value as provisional candidates for the next gated validation step.
2. Do not broaden the durability values to other biomes or convert the contextual duration bands into a shipping threshold from this run.
3. Do not make an automatic local balance change. T2 Mountain's 7/40 deaths are a follow-up pressure question; T3 Cave's 30.5–32s Conduit/Slinger-alt rows are a local duration question. Both need their own scope if acted on.
4. Preserve the exact result root, manifest, index, summaries, events, samples, and generated analysis as synthetic evidence. Do not treat restored checkpoints, smoke-isolated runs, or this run as canonical combat/economy evidence.
5. Human/browser playtest, full repository suite, acquisition/travel, client presentation, network behavior, and economy effects remain unverified. No source or balance edit was made by Durability 5.
