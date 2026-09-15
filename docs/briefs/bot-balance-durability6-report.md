# Durability 6 report — typical-duration adjustment

Status: complete, synthetic benchmark evidence only. This report records one exact frozen run and returns the balance decision to the operator. It does not authorize a source patch, a balance patch, a client change, a live-play conclusion, or economy certification.

## Decision summary

- The frozen 64-cell batch completed exactly once: 192/192 observations, 0 failed observations, no retries, 180 normal 300s window endings, and 12 player deaths. There was no tooling failure or wall-ceiling censor.
- The selected authored HP values were 1,584 for the T2 Cave Troll (+20%), 1,656 for the T2 Granite Titan (+20%), 4,725 for the T3 Cavern Troll (+25%), and 4,675 for the T3 Mountain Colossus (+10%). Attack, plating, damage reduction, mechanics, Eagle attack 75, and Eagle dive multiplier 1.25 remained fixed.
- Raw named-target accounting produced 1,229 traces, 1,107 clean traces, 1,129 kills, 100 unfinished targets, and 35 observed HP-regain traces. Regain and kill counts can overlap. Clean TTK is never converted to zero when a seed has no usable clean median.
- The six-baseline cohort centers moved from 14.75s to 18.2s in T2 Cave, 14.075s to 17.2s in T2 Mountain, 20.35s to 24.8s in T3 Cave, and 23.275s to 25.75s in T3 Mountain. These are within the approved cohort-center context of 15–25s at T2 and 25–35s at T3, except that T3 Cave sits 0.2s below the lower context edge.
- Retain all four selected values as provisional candidates. Slow rows remain separately visible: the selected T3 Cave Conduit baseline is 38.1s and the two T3 Cave alternatives are 39.6s and 39.35s; these are upper-tail build evidence, not automatic failure of the six-class center.
- Attrition limits confidence in adoption but does not establish a rollback: the current-code previous-HP arm had 7/96 deaths and the selected-HP arm had 5/96; T2 Mountain had 9/48 deaths across both arms. Three seeds are a pressure screen, not a death-rate estimate. Run a focused T2 Mountain pressure pass before wider adoption or additional-biome generalization.
- The batch did not show a monster heal, a positive owned-minion one-HP floor, a T3 Conduit on-hit stall, or a static damage contact. Sweep was held constant and Slam was not equipped; this run does not isolate or tune either ability.
- Exit: preserve the exact result root and generated analysis as synthetic evidence, make no source or balance edit from this run, do not broaden the values to other biomes, and route any next work to a separately scoped T2 Mountain pressure test or class/weapon follow-up.

## Frozen identity, treatment, and execution

| Item | Value |
|---|---|
| Frozen source revision | 7398e25bce92e1c2efac4bc1bda8c715ef542ef7 |
| Frozen source tree | af40c6b1acfdea9c48dbf37bf9c3fb9f9749b124 |
| Untreated definitions SHA-256 | CC1DBBE1845182C5BA2FAEAF7890B4E27D5B694FEBE29A3A94C48DB60C4A5A2C |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitboxes SHA-256 | 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83 |
| Qualification directory | [durability6/qualification](<C:/Users/osaif/AppData/Local/mmo-idle/validation/durability6/qualification>) |
| Qualification index SHA-256 | B4B954DBF42D497E09874EA91F27D861098409D571999E77324D1F66B5CEBAA3 |
| Mode | run, synthetic true, economyEligible false |
| Time step / duration | 100ms / 300s per observation |
| Seeds | 173, 947, 2027 |
| Matrix | Four Cave/Mountain nodes × eight builds × two HP arms = 64 cells |
| Observations | 64 cells × 3 seeds = 192 |
| Qualification | All 64 cells were qualified in the clean frozen checkout. Packet qualification recorded diagnostic typecheck, shared build, pilots, overlay/restoration coverage, historical Durability5 contract coverage, and report generation as passed. Full suite and human playtest were not run. |

The exact operator command was:

pnpm --dir C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/source --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability6 --mode=run "--revision=7398e25bce92e1c2efac4bc1bda8c715ef542ef7" "--hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json" "--out=C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/results"

Run window: 2026-09-15T18:45:59.7368734Z–2026-09-15T19:08:18.2998398Z UTC; wall time 1,338.5629664s (about 22m18.563s). The single sequential process exited 0. Paired C: free-space values were 47,687,544,832 bytes at start and 47,444,197,376 bytes at end, a decrease of 243,347,456 bytes (about 232.0 MiB). Peak RSS was not sampled; no resource failure was reported.

No Docker, database, restart, retry, source edit, balance edit, adaptive rerun, or extra experiment was used. The detached checkout remained at the frozen revision/tree and clean after the run. Shared-worktree edits unrelated to this experiment were preserved.

## Integrity and artifact verification

An independent post-run scan found 64 manifest cells, 192 expected run directories, 192 paired ready.json/summary.json/events.jsonl/samples.jsonl observations, 0 failed.json files, 773 recursive files, and 5 root files. All manifest pairs were present exactly once; there were 0 missing, unexpected, duplicate, or failed pairs. complete.json records {"cells":64,"runs":192,"mode":"run"}. All observations were synthetic and complete.

Treatment and state checks found 0 HP-treatment mismatches, 0 geometry-roster mismatches across 96 intended comparison groups, 0 non-HP stat mismatches across 96 groups, and 0 build-setup mismatches. The previous arm used a process-local absolute HP override on the current frozen executable; it was not a replay of the old Durability5 executable. The selected arm used the authored HP in the frozen source.

| Artifact | SHA-256 / result |
|---|---|
| [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/results/manifest.json>) | 7A014E3AB739EB4013ED6A396BDFD55D80DCBF36A0CC42CD4D13C000826327ED |
| [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/results/complete.json>) | 78DCC83FB40043AEF0CF02883474862EF7BC8E19378C3955B37E04176EE45088; {"cells":64,"runs":192,"mode":"run"} |
| [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/results/index.json>) | FB086CBE806118E989BB866D42C4A8B178AD8B7DF77D8B34E8B00E0A4DCAAB54 |
| [generated analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/results/analysis.json>) | 2AAF3E50F9FBDCF11372992E89EDFEEB503CC6A2993C79326E10D9C5FA33D141 |
| [generated analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/results/analysis.md>) | 0EC7742744E28550AD63D322EA948557EDE69B676B6E6089566DF895FD02D37D |
| Result structure | 192 run directories, 773 recursive files, 0 failed.json, 5 root files |

## Authored values, actual values, wards, and legal setup

The selected definitions are recorded in [cave.monsters.ts:103](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/source/shared/src/data/monsters/cave.monsters.ts:103>), [cave.monsters.ts:172](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/source/shared/src/data/monsters/cave.monsters.ts:172>), [mountain.monsters.ts:91](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/source/shared/src/data/monsters/mountain.monsters.ts:91>), and [mountain.monsters.ts:155](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/source/shared/src/data/monsters/mountain.monsters.ts:155>). Granite Barrier is the existing 25%-threshold, 25%-of-max-HP ward with a 1,000ms cast and 8,000ms duration at [mountain.monsters.ts:107](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/source/shared/src/data/monsters/mountain.monsters.ts:107>) and [mountain.monsters.ts:169](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/source/shared/src/data/monsters/mountain.monsters.ts:169>).

| Context | Node / named target | Authored HP previous → selected | Authored attack / plate / DR | Actual ready HP / attack / plate / DR previous → selected | Named-target presence per seed | Ward treatment |
|---|---|---:|---:|---:|---:|---|
| T2 Cave | node-t2-cave-02 / Cave Troll | 1320 → 1584 | 86 / 1 / 0.264 | 1320/103/1/0.264 → 1584/103/1/0.264 | 6–9 | none |
| T2 Mountain | node-t2-mountain-04 / Granite Titan | 1380 → 1656 | 105 / 0 / 0 | 1380/105/0/0.1 → 1656/105/0/0.1 | 8–10 | Granite Barrier; capacity 345 → 414 HP |
| T3 Cave | node-t3-cave-02 / Cavern Troll | 3780 → 4725 | 124 / 2 / 0.28 | 3780/161/2/0.28 → 4725/161/2/0.28 | 4–6 | none |
| T3 Mountain | node-t3-mountain-04 / Mountain Colossus | 4250 → 4675 | 130 / 0 / 0 | 4250/130/0/0.15 → 4675/130/0/0.15 | 6–7 | Granite Barrier; capacity 1062.5 → 1168.75 HP |

Actual HP, attack, plating and DR matched within every node/class/seed arm pair. The ward capacities are the direct 25% max-HP result for the paired target HP values; event traces below confirm Granite Barrier casts and absorption on both Mountain elites.

All eight legal builds used +5 gear, matching armor/charm, Mountain boots, Tempered Core, medium frame, normal close/mid range, offensive stance, established abilities and runes, no relic, and no heavy Conduit profile. No Slam was equipped. Sweep was already present in the baselines and was held constant across both arms.

| Build family | T2 weapon | T3 weapon |
|---|---|---|
| Striker baseline | gale-needle | volcanic-cinderlash |
| Squire baseline | quake-hammer | mountain-avalanche-maul |
| Apprentice baseline | ruinous-axe | cave-cataclysm-axe |
| Slinger baseline | jungle-stinger-rapier | jungle-venomthorn-rapier |
| Slinger weapon alternative | swamp-mirebrand | swamp-blightbrand |
| Conduit baseline | ruinous-axe | cave-cataclysm-axe |
| Conduit weapon alternative | jungle-stinger-rapier | jungle-venomthorn-rapier |
| Spirit baseline | ruinous-axe | cave-cataclysm-axe |

## Named-elite duration results

Each row is a named target joined by node, build, arm, and seed. The token seed: median / clean / kills / unfinished / regain is in seconds and counts. The outer value is the median of available per-seed named-target medians, not a pooled-kill median. Clean excludes unfinished or HP-regain traces; kill and regain counts can overlap. The generated analysis groups per-type kills, so the tables below deliberately recompute the requested named medians from raw index.targets.

### node-t2-cave-02 — cave-troll

| Exact cell ID | Arm HP | Actual HP/attack/plate/DR | Outer clean TTK | Seed: median/clean/kills/unfinished/regain |
|---|---:|---:|---:|---|
| `dur6-t2-striker-solo-baseline-previous-hp` | 1320 | 1320/103/1/0.264 | 21.7s | 173: 21.8/5/5/1/0; 947: 21.7/5/5/1/0; 2027: 21.5/5/5/0/0 |
| `dur6-t2-striker-solo-baseline-selected-hp` | 1584 | 1584/103/1/0.264 | 25.3s | 173: 25.4/3/3/0/0; 947: 25.3/6/6/1/0; 2027: 25.1/5/5/1/0 |
| `dur6-t2-squire-solo-baseline-previous-hp` | 1320 | 1320/103/1/0.264 | 16s | 173: 16/6/6/0/0; 947: 16/7/7/1/0; 2027: 15.7/6/6/0/0 |
| `dur6-t2-squire-solo-baseline-selected-hp` | 1584 | 1584/103/1/0.264 | 21.4s | 173: 21.4/7/7/0/0; 947: 21.5/7/7/0/0; 2027: 20.8/5/5/0/0 |
| `dur6-t2-apprentice-solo-baseline-previous-hp` | 1320 | 1320/103/1/0.264 | 13.5s | 173: 13.1/6/6/0/0; 947: 13.5/11/11/0/0; 2027: 13.5/10/10/0/0 |
| `dur6-t2-apprentice-solo-baseline-selected-hp` | 1584 | 1584/103/1/0.264 | 15s | 173: 15/7/7/0/0; 947: 14.9/3/3/2/0; 2027: 15/10/10/0/0 |
| `dur6-t2-slinger-solo-baseline-previous-hp` | 1320 | 1320/103/1/0.264 | 11s | 173: 11.1/9/9/0/0; 947: 10.3/11/11/0/0; 2027: 11/8/8/0/0 |
| `dur6-t2-slinger-solo-baseline-selected-hp` | 1584 | 1584/103/1/0.264 | 13.2s | 173: 13.2/8/8/0/0; 947: 13.2/8/8/0/0; 2027: 13.2/8/8/0/0 |
| `dur6-t2-slinger-solo-weapon-alt-previous-hp` | 1320 | 1320/103/1/0.264 | 20s | 173: 19.75/4/4/0/0; 947: 20/5/5/0/0; 2027: 20/5/5/0/0 |
| `dur6-t2-slinger-solo-weapon-alt-selected-hp` | 1584 | 1584/103/1/0.264 | 24s | 173: 24/6/6/0/0; 947: 24/6/6/0/0; 2027: 25.75/2/2/0/0 |
| `dur6-t2-conduit-solo-baseline-previous-hp` | 1320 | 1320/103/1/0.264 | 17.9s | 173: 17.8/7/7/1/0; 947: 17.9/10/10/0/0; 2027: 17.9/7/7/0/0 |
| `dur6-t2-conduit-solo-baseline-selected-hp` | 1584 | 1584/103/1/0.264 | 21.4s | 173: 21.4/5/5/1/0; 947: 21.5/7/7/1/0; 2027: 21.3/7/7/1/0 |
| `dur6-t2-conduit-solo-weapon-alt-previous-hp` | 1320 | 1320/103/1/0.264 | 14.9s | 173: 14.9/7/7/0/0; 947: 14.9/9/9/1/0; 2027: 14.8/4/4/0/0 |
| `dur6-t2-conduit-solo-weapon-alt-selected-hp` | 1584 | 1584/103/1/0.264 | 17.7s | 173: 17.8/6/6/0/0; 947: 17.7/8/8/1/0; 2027: 17.7/8/8/0/0 |
| `dur6-t2-spirit-solo-baseline-previous-hp` | 1320 | 1320/103/1/0.264 | 11.9s | 173: 11.2/8/8/0/0; 947: 11.9/10/10/0/0; 2027: 11.9/7/7/0/0 |
| `dur6-t2-spirit-solo-baseline-selected-hp` | 1584 | 1584/103/1/0.264 | 14s | 173: 14/9/9/0/0; 947: 14/10/10/0/0; 2027: 14.4/8/8/0/0 |

### node-t2-mountain-04 — granite-titan

| Exact cell ID | Arm HP | Actual HP/attack/plate/DR | Outer clean TTK | Seed: median/clean/kills/unfinished/regain |
|---|---:|---:|---:|---|
| `dur6-t2-striker-small-group-baseline-previous-hp` | 1380 | 1380/105/0/0.1 | 26s | 173: 24.9/5/5/1/0; 947: 26/5/5/1/0; 2027: 29.2/1/1/0/0 |
| `dur6-t2-striker-small-group-baseline-selected-hp` | 1656 | 1656/105/0/0.1 | 27.45s | 173: 27.45/4/4/0/0; 947: 27.4/3/3/1/0; 2027: 33.6/2/2/1/0 |
| `dur6-t2-squire-small-group-baseline-previous-hp` | 1380 | 1380/105/0/0.1 | 18.7s | 173: 18.7/7/7/0/0; 947: 18.55/6/6/0/0; 2027: 18.7/5/5/0/0 |
| `dur6-t2-squire-small-group-baseline-selected-hp` | 1656 | 1656/105/0/0.1 | 25.4s | 173: 25.1/5/5/1/0; 947: 25.4/5/5/1/0; 2027: 25.4/5/5/0/0 |
| `dur6-t2-apprentice-small-group-baseline-previous-hp` | 1380 | 1380/105/0/0.1 | 13.5s | 173: 13.5/6/6/0/0; 947: 13.5/8/8/1/0; 2027: 13.5/3/3/0/0 |
| `dur6-t2-apprentice-small-group-baseline-selected-hp` | 1656 | 1656/105/0/0.1 | 16.5s | 173: 16.5/7/7/0/0; 947: 16.5/8/8/0/0; 2027: 16.5/1/1/1/0 |
| `dur6-t2-slinger-small-group-baseline-previous-hp` | 1380 | 1380/105/0/0.1 | 12.3s | 173: 10.6/11/11/1/0; 947: 12.3/7/7/2/1; 2027: 12.3/5/5/2/1 |
| `dur6-t2-slinger-small-group-baseline-selected-hp` | 1656 | 1656/105/0/0.1 | 13.8s | 173: 13.8/9/9/0/0; 947: 14.55/8/8/1/0; 2027: 13.8/5/5/1/0 |
| `dur6-t2-slinger-small-group-weapon-alt-previous-hp` | 1380 | 1380/105/0/0.1 | 18s | 173: 18/7/7/0/0; 947: 18/1/1/0/0; 2027: 18/3/3/2/2 |
| `dur6-t2-slinger-small-group-weapon-alt-selected-hp` | 1656 | 1656/105/0/0.1 | 21s | 173: 21/1/4/0/3; 947: 23.5/6/6/0/0; 2027: 21/5/6/1/1 |
| `dur6-t2-conduit-small-group-baseline-previous-hp` | 1380 | 1380/105/0/0.1 | 14.65s | 173: 14.7/2/2/1/0; 947: 14.6/3/3/1/0; 2027: —/0/0/1/1 |
| `dur6-t2-conduit-small-group-baseline-selected-hp` | 1656 | 1656/105/0/0.1 | 17.9s | 173: 17.8/6/6/0/0; 947: 18/3/3/1/0; 2027: —/0/0/1/1 |
| `dur6-t2-conduit-small-group-weapon-alt-previous-hp` | 1380 | 1380/105/0/0.1 | 11.85s | 173: 11.8/8/8/0/0; 947: 11.85/6/6/0/0; 2027: 11.85/4/5/0/1 |
| `dur6-t2-conduit-small-group-weapon-alt-selected-hp` | 1656 | 1656/105/0/0.1 | 14.2s | 173: 14.15/6/6/0/0; 947: 14.2/5/5/0/0; 2027: 14.2/3/4/0/1 |
| `dur6-t2-spirit-small-group-baseline-previous-hp` | 1380 | 1380/105/0/0.1 | 12.6s | 173: 12.6/9/10/1/2; 947: 11.9/9/9/2/1; 2027: 12.6/7/7/1/0 |
| `dur6-t2-spirit-small-group-baseline-selected-hp` | 1656 | 1656/105/0/0.1 | 14.7s | 173: 15.4/9/9/0/0; 947: 14.7/8/8/0/0; 2027: 14.7/6/7/0/1 |

### node-t3-cave-02 — cavern-troll

| Exact cell ID | Arm HP | Actual HP/attack/plate/DR | Outer clean TTK | Seed: median/clean/kills/unfinished/regain |
|---|---:|---:|---:|---|
| `dur6-t3-striker-solo-baseline-previous-hp` | 3780 | 3780/161/2/0.28 | 17.3s | 173: 18.2/6/6/0/0; 947: 16.7/8/8/1/0; 2027: 17.3/7/7/1/0 |
| `dur6-t3-striker-solo-baseline-selected-hp` | 4725 | 4725/161/2/0.28 | 23.1s | 173: 23.9/6/6/0/0; 947: 22.65/8/8/0/0; 2027: 23.1/6/6/1/0 |
| `dur6-t3-squire-solo-baseline-previous-hp` | 3780 | 3780/161/2/0.28 | 24.95s | 173: 24.95/6/6/1/0; 947: 25.6/6/6/1/0; 2027: 24.5/6/6/0/0 |
| `dur6-t3-squire-solo-baseline-selected-hp` | 4725 | 4725/161/2/0.28 | 31.9s | 173: 31.65/4/4/1/0; 947: 32.2/6/6/1/0; 2027: 31.9/5/5/1/0 |
| `dur6-t3-apprentice-solo-baseline-previous-hp` | 3780 | 3780/161/2/0.28 | 19.5s | 173: 19.5/5/5/1/1; 947: 19.5/5/7/1/2; 2027: 18.65/8/8/0/0 |
| `dur6-t3-apprentice-solo-baseline-selected-hp` | 4725 | 4725/161/2/0.28 | 24s | 173: 24/5/6/1/1; 947: 24/5/6/0/1; 2027: 23.8/5/5/0/0 |
| `dur6-t3-slinger-solo-baseline-previous-hp` | 3780 | 3780/161/2/0.28 | 21.2s | 173: 21.2/8/9/1/1; 947: 20.65/8/8/0/0; 2027: 22.5/5/5/1/0 |
| `dur6-t3-slinger-solo-baseline-selected-hp` | 4725 | 4725/161/2/0.28 | 25.6s | 173: 25.5/5/5/0/0; 947: 25.75/6/7/1/1; 2027: 25.6/7/7/1/0 |
| `dur6-t3-slinger-solo-weapon-alt-previous-hp` | 3780 | 3780/161/2/0.28 | 32s | 173: 32/5/5/1/0; 947: 32/3/4/1/1; 2027: 32/5/5/1/0 |
| `dur6-t3-slinger-solo-weapon-alt-selected-hp` | 4725 | 4725/161/2/0.28 | 39.6s | 173: 41.6/3/4/1/2; 947: 39.6/3/4/1/1; 2027: 38/5/5/0/0 |
| `dur6-t3-conduit-solo-baseline-previous-hp` | 3780 | 3780/161/2/0.28 | 30.5s | 173: 30.5/5/5/0/0; 947: 30.5/7/7/1/0; 2027: 30.5/4/4/0/0 |
| `dur6-t3-conduit-solo-baseline-selected-hp` | 4725 | 4725/161/2/0.28 | 38.1s | 173: 38.2/4/4/1/0; 947: 38.1/4/4/1/0; 2027: 37.9/5/5/1/0 |
| `dur6-t3-conduit-solo-weapon-alt-previous-hp` | 3780 | 3780/161/2/0.28 | 31.6s | 173: 31.6/5/5/1/0; 947: 31.6/5/5/0/0; 2027: 31.6/6/6/1/0 |
| `dur6-t3-conduit-solo-weapon-alt-selected-hp` | 4725 | 4725/161/2/0.28 | 39.35s | 173: 39.35/4/4/0/0; 947: 39.1/5/5/1/0; 2027: 39.5/4/4/1/0 |
| `dur6-t3-spirit-solo-baseline-previous-hp` | 3780 | 3780/161/2/0.28 | 16.05s | 173: 15.4/7/7/1/0; 947: 16.4/11/11/2/2; 2027: 16.05/8/8/1/0 |
| `dur6-t3-spirit-solo-baseline-selected-hp` | 4725 | 4725/161/2/0.28 | 21s | 173: 21/8/8/0/0; 947: 20.6/9/9/0/0; 2027: 21.45/6/6/1/0 |

### node-t3-mountain-04 — mountain-colossus

| Exact cell ID | Arm HP | Actual HP/attack/plate/DR | Outer clean TTK | Seed: median/clean/kills/unfinished/regain |
|---|---:|---:|---:|---|
| `dur6-t3-striker-small-group-baseline-previous-hp` | 4250 | 4250/130/0/0.15 | 21.5s | 173: 21.8/7/7/0/0; 947: 21.5/5/5/1/0; 2027: 21.4/6/6/0/0 |
| `dur6-t3-striker-small-group-baseline-selected-hp` | 4675 | 4675/130/0/0.15 | 23.4s | 173: 23.4/7/7/0/0; 947: 23.3/5/5/1/0; 2027: 23.75/6/6/1/0 |
| `dur6-t3-squire-small-group-baseline-previous-hp` | 4250 | 4250/130/0/0.15 | 28.4s | 173: 28.4/5/5/1/0; 947: 28.3/5/5/0/0; 2027: 31.1/5/5/0/0 |
| `dur6-t3-squire-small-group-baseline-selected-hp` | 4675 | 4675/130/0/0.15 | 31.4s | 173: 32.4/6/6/1/0; 947: 31/5/5/1/0; 2027: 31.4/5/5/1/0 |
| `dur6-t3-apprentice-small-group-baseline-previous-hp` | 4250 | 4250/130/0/0.15 | 22.5s | 173: 22.5/6/6/0/0; 947: 23.25/4/5/0/1; 2027: 22.5/6/6/0/0 |
| `dur6-t3-apprentice-small-group-baseline-selected-hp` | 4675 | 4675/130/0/0.15 | 24.85s | 173: 24.85/6/6/1/0; 947: 24/5/5/1/0; 2027: 24.9/5/5/1/0 |
| `dur6-t3-slinger-small-group-baseline-previous-hp` | 4250 | 4250/130/0/0.15 | 24.05s | 173: 25.2/9/9/0/0; 947: 23.9/4/4/0/0; 2027: 24.05/6/6/0/0 |
| `dur6-t3-slinger-small-group-baseline-selected-hp` | 4675 | 4675/130/0/0.15 | 26.65s | 173: 26/5/5/1/0; 947: 27.4/6/6/1/0; 2027: 26.65/6/6/1/0 |
| `dur6-t3-slinger-small-group-weapon-alt-previous-hp` | 4250 | 4250/130/0/0.15 | 32s | 173: 32/4/5/1/1; 947: 33.25/4/4/1/0; 2027: 32/5/5/1/0 |
| `dur6-t3-slinger-small-group-weapon-alt-selected-hp` | 4675 | 4675/130/0/0.15 | 35s | 173: 34.65/4/5/0/1; 947: 35.1/3/4/0/1; 2027: 35/5/5/0/0 |
| `dur6-t3-conduit-small-group-baseline-previous-hp` | 4250 | 4250/130/0/0.15 | 26.85s | 173: 26.85/4/4/1/0; 947: 26.9/4/4/1/0; 2027: 26.8/5/5/1/0 |
| `dur6-t3-conduit-small-group-baseline-selected-hp` | 4675 | 4675/130/0/0.15 | 29.5s | 173: 29.2/5/5/1/0; 947: 29.55/4/4/1/0; 2027: 29.5/4/4/0/0 |
| `dur6-t3-conduit-small-group-weapon-alt-previous-hp` | 4250 | 4250/130/0/0.15 | 27.2s | 173: 27.2/4/4/1/0; 947: 27.2/5/5/0/0; 2027: 27/4/4/1/0 |
| `dur6-t3-conduit-small-group-weapon-alt-selected-hp` | 4675 | 4675/130/0/0.15 | 29.95s | 173: 30/6/6/0/0; 947: 29.95/4/4/0/0; 2027: 29.85/4/4/1/0 |
| `dur6-t3-spirit-small-group-baseline-previous-hp` | 4250 | 4250/130/0/0.15 | 19.1s | 173: 19.1/7/8/0/1; 947: 18.75/4/4/0/0; 2027: 19.4/8/8/0/0 |
| `dur6-t3-spirit-small-group-baseline-selected-hp` | 4675 | 4675/130/0/0.15 | 20.9s | 173: 21.2/7/7/2/1; 947: 20.9/7/7/0/0; 2027: 20.9/5/5/1/0 |

## Cohort centers and paired HP-arm changes

The cohort center is the median of exactly the six baseline class medians, equally weighted: Striker, Squire, Apprentice, Slinger, Conduit, and Spirit. Weapon alternatives are shown separately and are not included in the center. The approved 15–25s T2 and 25–35s T3 bands are context, not per-build gates.


| Context / arm | Six baseline class medians | Cohort center | Baseline min–max | Alternatives |
|---|---|---:|---:|---|
| node-t2-cave-02 / previous-hp | striker 21.7s; squire 16s; apprentice 13.5s; slinger 11s; conduit 17.9s; spirit 11.9s | 14.75s | 11–21.7s | slinger t2-slinger-weapon-alt: 20s; conduit t2-conduit-weapon-alt: 14.9s |
| node-t2-cave-02 / selected-hp | striker 25.3s; squire 21.4s; apprentice 15s; slinger 13.2s; conduit 21.4s; spirit 14s | 18.2s | 13.2–25.3s | slinger t2-slinger-weapon-alt: 24s; conduit t2-conduit-weapon-alt: 17.7s |
| node-t2-mountain-04 / previous-hp | striker 26s; squire 18.7s; apprentice 13.5s; slinger 12.3s; conduit 14.65s; spirit 12.6s | 14.075s | 12.3–26s | slinger t2-slinger-weapon-alt: 18s; conduit t2-conduit-weapon-alt: 11.85s |
| node-t2-mountain-04 / selected-hp | striker 27.45s; squire 25.4s; apprentice 16.5s; slinger 13.8s; conduit 17.9s; spirit 14.7s | 17.2s | 13.8–27.45s | slinger t2-slinger-weapon-alt: 21s; conduit t2-conduit-weapon-alt: 14.2s |
| node-t3-cave-02 / previous-hp | striker 17.3s; squire 24.95s; apprentice 19.5s; slinger 21.2s; conduit 30.5s; spirit 16.05s | 20.35s | 16.05–30.5s | slinger t3-slinger-weapon-alt: 32s; conduit t3-conduit-weapon-alt: 31.6s |
| node-t3-cave-02 / selected-hp | striker 23.1s; squire 31.9s; apprentice 24s; slinger 25.6s; conduit 38.1s; spirit 21s | 24.8s | 21–38.1s | slinger t3-slinger-weapon-alt: 39.6s; conduit t3-conduit-weapon-alt: 39.35s |
| node-t3-mountain-04 / previous-hp | striker 21.5s; squire 28.4s; apprentice 22.5s; slinger 24.05s; conduit 26.85s; spirit 19.1s | 23.275s | 19.1–28.4s | slinger t3-slinger-weapon-alt: 32s; conduit t3-conduit-weapon-alt: 27.2s |
| node-t3-mountain-04 / selected-hp | striker 23.4s; squire 31.4s; apprentice 24.85s; slinger 26.65s; conduit 29.5s; spirit 20.9s | 25.75s | 20.9–31.4s | slinger t3-slinger-weapon-alt: 35s; conduit t3-conduit-weapon-alt: 29.95s |

| Context | Previous center | Selected center | Paired change |
|---|---:|---:|---:|
| T2 Cave | 14.75s | 18.2s | +3.45s / +23.4% |
| T2 Mountain | 14.075s | 17.2s | +3.125s / +22.2% |
| T3 Cave | 20.35s | 24.8s | +4.45s / +21.9% |
| T3 Mountain | 23.275s | 25.75s | +2.475s / +10.6% |

| Context | Striker Δ | Squire Δ | Apprentice Δ | Slinger Δ | Conduit Δ | Spirit Δ |
|---|---:|---:|---:|---:|---:|---:|
| T2 Cave | +3.6s | +5.4s | +1.5s | +2.2s | +3.5s | +2.1s |
| T2 Mountain | +1.45s | +6.7s | +3s | +1.5s | +3.25s | +2.1s |
| T3 Cave | +5.8s | +6.95s | +4.5s | +4.4s | +7.6s | +4.95s |
| T3 Mountain | +1.9s | +3s | +2.35s | +2.6s | +2.65s | +1.8s |

The selected arm moves the centers in the intended direction. T2 Cave and T2 Mountain remain below the middle of the approved T2 context because favorable classes are included; T3 Cave is centered at 24.8s while its slow Conduit and weapon-alternative rows remain above 35s. This is a reason to track build-specific pacing, not to apply a target-wide rollback from this run.

## Durability 5 same-seed comparison

This is a descriptive control comparison between Durability 6 previous-HP on the current frozen code and original Durability 5 on the same seeds 173/947/2027. Durability 6 includes current Sweep Tempo; the previous arm is a process-local HP override, not the old executable. Ability/source differences prevent attributing any difference solely to HP. No old-five-seed versus new-three-seed outer median is used.


| Context / build | Durability 6 previous-HP: 173 / 947 / 2027 / outer | Durability 5 original: 173 / 947 / 2027 / outer |
|---|---:|---:|
| t2-striker-solo-baseline | 21.8 / 21.7 / 21.5 / 21.7s | 21.8 / 21.7 / 21.5 / 21.7s |
| t2-squire-solo-baseline | 16 / 16 / 15.7 / 16s | 16 / 16 / 15.7 / 16s |
| t2-apprentice-solo-baseline | 13.1 / 13.5 / 13.5 / 13.5s | 13.1 / 13.5 / 13.1 / 13.1s |
| t2-slinger-solo-baseline | 11.1 / 10.3 / 11 / 11s | 11.1 / 10.3 / 11 / 11s |
| t2-slinger-solo-weapon-alt | 19.75 / 20 / 20 / 20s | 19.75 / 20 / 20 / 20s |
| t2-conduit-solo-baseline | 17.8 / 17.9 / 17.9 / 17.9s | 17.8 / 17.9 / 17.9 / 17.9s |
| t2-conduit-solo-weapon-alt | 14.9 / 14.9 / 14.8 / 14.9s | 14.9 / 14.9 / 14.8 / 14.9s |
| t2-spirit-solo-baseline | 11.2 / 11.9 / 11.9 / 11.9s | 11.2 / 11.9 / 11.9 / 11.9s |
| t2-striker-small-group-baseline | 24.9 / 26 / 29.2 / 26s | 24.9 / 25.4 / 29.7 / 25.4s |
| t2-squire-small-group-baseline | 18.7 / 18.55 / 18.7 / 18.7s | 18.7 / 18.3 / 21.3 / 18.7s |
| t2-apprentice-small-group-baseline | 13.5 / 13.5 / 13.5 / 13.5s | 13.5 / 13.5 / 13.5 / 13.5s |
| t2-slinger-small-group-baseline | 10.6 / 12.3 / 12.3 / 12.3s | 10.6 / 12.3 / 12.3 / 12.3s |
| t2-slinger-small-group-weapon-alt | 18 / 18 / 18 / 18s | 18 / 18 / 18 / 18s |
| t2-conduit-small-group-baseline | 14.7 / 14.6 / — / 14.65s | 14.7 / 14.6 / — / 14.65s |
| t2-conduit-small-group-weapon-alt | 11.8 / 11.85 / 11.85 / 11.85s | 11.8 / 11.85 / 11.85 / 11.85s |
| t2-spirit-small-group-baseline | 12.6 / 11.9 / 12.6 / 12.6s | 12.6 / 11.9 / 12.6 / 12.6s |
| t3-striker-solo-baseline | 18.2 / 16.7 / 17.3 / 17.3s | 18.2 / 16.7 / 17.3 / 17.3s |
| t3-squire-solo-baseline | 24.95 / 25.6 / 24.5 / 24.95s | 24.95 / 25.6 / 24.5 / 24.95s |
| t3-apprentice-solo-baseline | 19.5 / 19.5 / 18.65 / 19.5s | 18.2 / 19.5 / 18.65 / 18.65s |
| t3-slinger-solo-baseline | 21.2 / 20.65 / 22.5 / 21.2s | 21.2 / 20.65 / 22.5 / 21.2s |
| t3-slinger-solo-weapon-alt | 32 / 32 / 32 / 32s | 32 / 32 / 32 / 32s |
| t3-conduit-solo-baseline | 30.5 / 30.5 / 30.5 / 30.5s | 30.5 / 30.5 / 30.5 / 30.5s |
| t3-conduit-solo-weapon-alt | 31.6 / 31.6 / 31.6 / 31.6s | 31.6 / 31.6 / 31.6 / 31.6s |
| t3-spirit-solo-baseline | 15.4 / 16.4 / 16.05 / 16.05s | 15.4 / 16.7 / 16.05 / 16.05s |
| t3-striker-small-group-baseline | 21.8 / 21.5 / 21.4 / 21.5s | 21.8 / 21.5 / 21.4 / 21.5s |
| t3-squire-small-group-baseline | 28.4 / 28.3 / 31.1 / 28.4s | 28.4 / 28.3 / 31.1 / 28.4s |
| t3-apprentice-small-group-baseline | 22.5 / 23.25 / 22.5 / 22.5s | 22.5 / 22.5 / 22.5 / 22.5s |
| t3-slinger-small-group-baseline | 25.2 / 23.9 / 24.05 / 24.05s | 25.2 / 23.9 / 24.05 / 24.05s |
| t3-slinger-small-group-weapon-alt | 32 / 33.25 / 32 / 32s | 32 / 33.25 / 32 / 32s |
| t3-conduit-small-group-baseline | 26.85 / 26.9 / 26.8 / 26.85s | 26.85 / 26.9 / 26.8 / 26.85s |
| t3-conduit-small-group-weapon-alt | 27.2 / 27.2 / 27 / 27.2s | 27.2 / 27.2 / 27 / 27.2s |
| t3-spirit-small-group-baseline | 19.1 / 18.75 / 19.4 / 19.1s | 19.5 / 18.8 / 19.4 / 19.4s |

Most rows are identical or close. The small differences in T2 Mountain and T3 Cave are retained as contextual continuity evidence, not a causal HP estimate.

## Pressure and survival

The pressure token is W for a normal 300s window ending or D@seconds for player death, followed by minimum HP fraction / largest single HP hit / largest damage in 1s / recovery-complete / recovery-interrupted. Damage fields are HP damage, not absorbed damage. The per-seed table is the complete 64-cell pressure screen.


| Exact cell ID | Seed: outcome/minHP/largestHit/max1s/recovery-complete/recovery-interrupted |
|---|---|
| `dur6-t2-striker-solo-baseline-previous-hp` | 173: W/0.512/70/70/14/0; 947: W/0.513/70/70/15/0; 2027: W/0.512/70/70/16/1 |
| `dur6-t2-striker-solo-baseline-selected-hp` | 173: W/0.512/70/70/19/0; 947: W/0.537/70/70/14/0; 2027: W/0.446/70/70/16/0 |
| `dur6-t2-squire-solo-baseline-previous-hp` | 173: W/0.44/151/151/19/0; 947: W/0.403/151/151/15/0; 2027: W/0.44/151/151/19/0 |
| `dur6-t2-squire-solo-baseline-selected-hp` | 173: W/0.584/72/72/14/0; 947: W/0.521/72/72/13/0; 2027: W/0.44/151/151/20/0 |
| `dur6-t2-apprentice-solo-baseline-previous-hp` | 173: W/0.363/151.2/157.2/19/0; 947: W/0.423/72/75/17/0; 2027: W/0.085/151.2/157.2/15/0 |
| `dur6-t2-apprentice-solo-baseline-selected-hp` | 173: W/0.363/151.2/157.2/15/0; 947: D@175.7/0/151.2/157.2/9/0; 2027: W/0.363/151.2/157.2/17/0 |
| `dur6-t2-slinger-solo-baseline-previous-hp` | 173: W/0.634/83/83/26/0; 947: W/0.234/174/174/24/0; 2027: W/0.634/83/83/24/0 |
| `dur6-t2-slinger-solo-baseline-selected-hp` | 173: W/0.634/83/83/21/0; 947: W/0.634/83/83/22/0; 2027: W/0.634/83/83/21/0 |
| `dur6-t2-slinger-solo-weapon-alt-previous-hp` | 173: W/0.313/83/83/19/0; 947: W/0.322/83/83/16/0; 2027: W/0.33/83/83/17/0 |
| `dur6-t2-slinger-solo-weapon-alt-selected-hp` | 173: W/0.314/83/83/13/0; 947: W/0.32/83/83/14/0; 2027: D@99.1/0/83/135/4/0 |
| `dur6-t2-conduit-solo-baseline-previous-hp` | 173: W/0.425/120/120/13/0; 947: W/0.939/0/0/17/0; 2027: W/0.542/57/57/12/0 |
| `dur6-t2-conduit-solo-baseline-selected-hp` | 173: W/0.425/120/120/15/0; 947: W/0.939/0/0/17/0; 2027: W/0.939/0/0/15/1 |
| `dur6-t2-conduit-solo-weapon-alt-previous-hp` | 173: W/0.595/57/57/19/0; 947: W/0.939/0/0/19/0; 2027: W/0.707/17/29/25/0 |
| `dur6-t2-conduit-solo-weapon-alt-selected-hp` | 173: W/0.595/57/57/20/0; 947: W/0.541/57/57/11/0; 2027: W/0.939/0/0/19/0 |
| `dur6-t2-spirit-solo-baseline-previous-hp` | 173: W/0.474/114.75/114.75/22/8; 947: W/0.514/106/106/22/4; 2027: W/0.514/106/106/19/10 |
| `dur6-t2-spirit-solo-baseline-selected-hp` | 173: W/0.474/114.75/114.75/13/11; 947: W/0.514/106/106/14/8; 2027: W/0.147/171/171/14/12 |
| `dur6-t2-striker-small-group-baseline-previous-hp` | 173: D@275.6/0/79/151/8/4; 947: W/0.353/79/138/10/3; 2027: D@72/0/79/202/2/1 |
| `dur6-t2-striker-small-group-baseline-selected-hp` | 173: W/0.453/79/79/11/4; 947: W/0.361/79/131/10/6; 2027: D@178.9/0/79/138/4/3 |
| `dur6-t2-squire-small-group-baseline-previous-hp` | 173: W/0.361/85/85/14/3; 947: W/0.382/85/139/12/7; 2027: W/0.316/85/123/11/7 |
| `dur6-t2-squire-small-group-baseline-selected-hp` | 173: W/0.423/85/123/12/4; 947: W/0.348/85/139/11/4; 2027: W/0.158/85/104.9/12/1 |
| `dur6-t2-apprentice-small-group-baseline-previous-hp` | 173: W/0.379/81/84/14/4; 947: W/0.44/81/129.1/13/2; 2027: D@202/0/81/139.045/9/2 |
| `dur6-t2-apprentice-small-group-baseline-selected-hp` | 173: W/0.399/78.075/81.075/13/1; 947: W/0.247/85.5/98.4/12/3; 2027: D@277.5/0/85.5/157.8/12/6 |
| `dur6-t2-slinger-small-group-baseline-previous-hp` | 173: W/0.661/62.4/62.4/16/11; 947: W/0.583/81/81/7/10; 2027: W/0.248/81/100/11/11 |
| `dur6-t2-slinger-small-group-baseline-selected-hp` | 173: W/0.583/81/81/15/8; 947: W/0.533/81/81/8/16; 2027: W/0.533/98/98/14/9 |
| `dur6-t2-slinger-small-group-weapon-alt-previous-hp` | 173: W/0.148/98/98/7/5; 947: D@66.6/0/98/98/1/0; 2027: W/0.162/98/127/11/2 |
| `dur6-t2-slinger-small-group-weapon-alt-selected-hp` | 173: W/0.308/98/118/9/2; 947: W/0.316/98/98/1/0; 2027: W/0.39/98/118/1/1 |
| `dur6-t2-conduit-small-group-baseline-previous-hp` | 173: D@105/0/68/68/4/0; 947: W/0.707/45/45/22/0; 2027: D@27.4/0/56/146/0/0 |
| `dur6-t2-conduit-small-group-baseline-selected-hp` | 173: W/0.926/12/12/18/1; 947: W/0.707/45/45/18/1; 2027: D@27.4/0/56/146/0/0 |
| `dur6-t2-conduit-small-group-weapon-alt-previous-hp` | 173: W/0.707/45/45/21/0; 947: W/0.74/45/45/19/0; 2027: W/0.326/56/101/11/0 |
| `dur6-t2-conduit-small-group-weapon-alt-selected-hp` | 173: W/0.942/12/12/20/0; 947: W/0.475/56/56/19/0; 2027: W/0.326/56/101/19/0 |
| `dur6-t2-spirit-small-group-baseline-previous-hp` | 173: W/0.513/80/112/1/0; 947: W/0.108/80/95/10/8; 2027: W/0.513/80/80/19/3 |
| `dur6-t2-spirit-small-group-baseline-selected-hp` | 173: W/0.443/80/80/7/15; 947: W/0.443/97/97/8/16; 2027: W/0.37/97/97/16/6 |
| `dur6-t3-striker-solo-baseline-previous-hp` | 173: W/0.549/102/102/26/0; 947: W/0.553/157/157/24/0; 2027: W/0.567/157/157/25/0 |
| `dur6-t3-striker-solo-baseline-selected-hp` | 173: W/0.552/157/157/24/0; 947: W/0.553/157/157/18/0; 2027: W/0.55/157/157/22/0 |
| `dur6-t3-squire-solo-baseline-previous-hp` | 173: W/0.512/200/200/19/0; 947: W/0.759/100/100/21/0; 2027: W/0.512/200/200/23/0 |
| `dur6-t3-squire-solo-baseline-selected-hp` | 173: W/0.512/200/200/21/0; 947: W/0.512/200/200/16/0; 2027: W/0.512/200/200/19/0 |
| `dur6-t3-apprentice-solo-baseline-previous-hp` | 173: W/0.442/102.6/106.6/0/0; 947: D@256.1/0/206.1/355.6/0/0; 2027: W/0.44/102.6/148.2/3/0 |
| `dur6-t3-apprentice-solo-baseline-selected-hp` | 173: W/0.067/206.1/212.1/2/1; 947: W/0.122/206.1/215.1/6/0; 2027: W/0.247/102.6/155.2/17/2 |
| `dur6-t3-slinger-solo-baseline-previous-hp` | 173: W/0.492/118/118/10/0; 947: W/0.36/118/176/19/0; 2027: W/0.639/118/118/21/0 |
| `dur6-t3-slinger-solo-baseline-selected-hp` | 173: W/0.465/118/176/13/0; 947: W/0.34/118/118/2/0; 2027: W/0.344/118/118/18/0 |
| `dur6-t3-slinger-solo-weapon-alt-previous-hp` | 173: W/0.342/118/131/13/0; 947: W/0.344/118/118/12/0; 2027: W/0.344/118/118/7/0 |
| `dur6-t3-slinger-solo-weapon-alt-selected-hp` | 173: W/0.342/118/118/4/0; 947: W/0.335/118/118/1/0; 2027: W/0.34/118/118/12/1 |
| `dur6-t3-conduit-solo-baseline-previous-hp` | 173: W/0.94/0/0/16/0; 947: W/0.94/0/0/10/0; 2027: W/0.821/40/40/20/0 |
| `dur6-t3-conduit-solo-baseline-selected-hp` | 173: W/0.94/0/0/14/0; 947: W/0.94/0/0/15/0; 2027: W/0.94/0/0/12/0 |
| `dur6-t3-conduit-solo-weapon-alt-previous-hp` | 173: W/0.94/0/0/14/0; 947: W/0.451/81/81/11/0; 2027: W/0.94/0/0/12/0 |
| `dur6-t3-conduit-solo-weapon-alt-selected-hp` | 173: W/0.94/0/0/16/0; 947: W/0.94/0/0/10/0; 2027: W/0.94/0/0/14/0 |
| `dur6-t3-spirit-solo-baseline-previous-hp` | 173: W/0.504/117/117/19/10; 947: W/0.863/26.775/26.775/6/5; 2027: W/0.863/24/24/18/8 |
| `dur6-t3-spirit-solo-baseline-selected-hp` | 173: W/0.776/70/70/10/13; 947: W/0.599/70/116/9/10; 2027: W/0.923/24/24/12/12 |
| `dur6-t3-striker-small-group-baseline-previous-hp` | 173: W/0.536/102/102/12/8; 947: W/0.534/102/102/10/14; 2027: W/0.577/102/102/9/9 |
| `dur6-t3-striker-small-group-baseline-selected-hp` | 173: W/0.502/102/102/6/6; 947: W/0.583/102/102/11/13; 2027: W/0.662/102/102/8/9 |
| `dur6-t3-squire-small-group-baseline-previous-hp` | 173: W/0.753/92/92/5/5; 947: W/0.753/92/92/13/5; 2027: W/0.753/92/92/10/8 |
| `dur6-t3-squire-small-group-baseline-selected-hp` | 173: W/0.713/92/92/7/2; 947: W/0.713/92/92/14/2; 2027: W/0.713/92/92/11/6 |
| `dur6-t3-apprentice-small-group-baseline-previous-hp` | 173: W/0.612/90.9/92.9/8/4; 947: W/0.686/67.5/70.5/14/3; 2027: W/0.387/90.9/95.9/6/3 |
| `dur6-t3-apprentice-small-group-baseline-selected-hp` | 173: W/0.343/90.9/140.967/2/1; 947: W/0.488/90.9/172.4/17/3; 2027: W/0.385/90.9/94.9/15/0 |
| `dur6-t3-slinger-small-group-baseline-previous-hp` | 173: W/0.599/90/90/0/0; 947: W/0.745/90/90/23/3; 2027: W/0.714/90/90/15/6 |
| `dur6-t3-slinger-small-group-baseline-selected-hp` | 173: W/0.508/101/110/0/0; 947: W/0.83/60/60/16/3; 2027: W/0.771/81/81/14/3 |
| `dur6-t3-slinger-small-group-weapon-alt-previous-hp` | 173: W/0.414/90/90/1/0; 947: W/0.83/60/60/3/1; 2027: W/0.459/101/116/0/0 |
| `dur6-t3-slinger-small-group-weapon-alt-selected-hp` | 173: W/0.448/90/90/2/1; 947: W/0.723/90/90/3/1; 2027: W/0.378/95/95/0/0 |
| `dur6-t3-conduit-small-group-baseline-previous-hp` | 173: W/0.939/0/0/19/0; 947: W/0.939/0/0/17/1; 2027: W/0.939/0/0/15/0 |
| `dur6-t3-conduit-small-group-baseline-selected-hp` | 173: W/0.939/0/0/11/0; 947: W/0.939/0/0/17/0; 2027: W/0.939/0/0/17/0 |
| `dur6-t3-conduit-small-group-weapon-alt-previous-hp` | 173: W/0.939/0/0/13/0; 947: W/0.939/0/0/16/0; 2027: W/0.939/0/0/15/0 |
| `dur6-t3-conduit-small-group-weapon-alt-selected-hp` | 173: W/0.843/37/37/10/0; 947: W/0.898/37/37/19/0; 2027: W/0.939/0/0/16/0 |
| `dur6-t3-spirit-small-group-baseline-previous-hp` | 173: W/0.831/57/57/1/1; 947: W/0.895/35.4/35.4/24/7; 2027: W/1/0/0/15/7 |
| `dur6-t3-spirit-small-group-baseline-selected-hp` | 173: W/0.382/99/99/0/0; 947: W/0.346/87/152/19/4; 2027: W/0.831/57/57/25/6 |

| Context | Observations | Deaths | Minimum HP range / median | Max largest hit | Max damage in 1s | Recovery complete / interrupted |
|---|---:|---:|---:|---:|---:|---:|
| T2 Cave | 48 | 2 | 0–0.939 / 0.512 | 174 | 174 | 813 / 55 |
| T2 Mountain | 48 | 9 | 0–0.942 / 0.365 | 98 | 202 | 523 / 190 |
| T3 Cave | 48 | 1 | 0–0.940 / 0.530 | 206.1 | 355.6 | 656 / 62 |
| T3 Mountain | 48 | 0 | 0.343–1.000 / 0.718 | 102 | 172.4 | 524 / 145 |
| Total | 192 | 12 | — | — | — | 2,516 / 452 |

The selected arm had 5/96 deaths and the process-local previous arm had 7/96. By context, T2 Cave had 2 deaths (both selected), T2 Mountain had 9 deaths (6 previous, 3 selected), T3 Cave had 1 death (previous), and T3 Mountain had 0. These three-seed arm counts are a pressure screen only; they do not estimate a stable death rate or prove that the HP increase improves survival.

## Death attribution and exact damage windows

All 12 deaths are retained as pressure evidence. Final-window entries are positive event-sourced HP damage totals/counts by source. melee, ranged, and debt-style fields are the recorded death causes; the killer is not treated as the only pressure source. Eagles, Throwers, trolls, gargoyles, and the raw Unknown source remain separate.

| Cell / seed | Death time | Cause / killer | Final 10s damage | Final 30s damage |
|---|---:|---|---|---|
| dur6-t2-apprentice-solo-baseline-selected-hp / 947 | 175.7s | melee 151.2 / Cave Troll | Cave Troll 305.2 / 10 | Cave Troll 383.2 / 16 |
| dur6-t2-slinger-solo-weapon-alt-selected-hp / 2027 | 99.1s | ranged 52 / Cave Gargoyle | Cave Gargoyle 148 / 3; Cave Troll 108 / 2 | Cave Gargoyle 200 / 4; Cave Troll 191 / 3 |
| dur6-t2-striker-small-group-baseline-previous-hp / 173 | 275.6s | ranged 72 / Boulder Thrower | Boulder Thrower 216 / 3; Granite Titan 158 / 2 | Boulder Thrower 328.05 / 7; Granite Titan 158 / 2 |
| dur6-t2-striker-small-group-baseline-previous-hp / 2027 | 72.0s | melee 59 / Stone Eagle | Stone Eagle 260 / 4; Boulder Thrower 123.3 / 2 | Stone Eagle 260 / 4; Boulder Thrower 180.6 / 5 |
| dur6-t2-striker-small-group-baseline-selected-hp / 2027 | 178.9s | melee 79 / Granite Titan | Granite Titan 158 / 2; Stone Eagle 119.65 / 2 | Granite Titan 353.25 / 6; Stone Eagle 119.65 / 2 |
| dur6-t2-apprentice-small-group-baseline-previous-hp / 2027 | 202.0s | ranged 70.2 / Boulder Thrower | Stone Eagle 206.8 / 10; Boulder Thrower 143.4 / 3 | Stone Eagle 206.8 / 10; Boulder Thrower 143.4 / 3; Granite Titan 27.1 / 2 |
| dur6-t2-apprentice-small-group-baseline-selected-hp / 2027 | 277.5s | melee 69.3 / Stone Eagle | Granite Titan 177 / 5; Stone Eagle 139 / 5 | Granite Titan 177 / 5; Stone Eagle 139 / 5; Boulder Thrower 67.18 / 6 |
| dur6-t2-slinger-small-group-weapon-alt-previous-hp / 947 | 66.6s | melee 65 / Stone Eagle | Stone Eagle 320 / 6 | Stone Eagle 404 / 8; Boulder Thrower 62.4 / 1 |
| dur6-t2-conduit-small-group-baseline-previous-hp / 173 | 105.0s | melee 64 / Stone Eagle | Stone Eagle 199 / 4; Granite Titan 68 / 1 | Stone Eagle 255 / 5; Granite Titan 116 / 3 |
| dur6-t2-conduit-small-group-baseline-previous-hp / 2027 | 27.4s | melee 45 / Stone Eagle | Stone Eagle 281 / 6; Boulder Thrower 56 / 1 | Stone Eagle 298 / 7; Boulder Thrower 56 / 1 |
| dur6-t2-conduit-small-group-baseline-selected-hp / 2027 | 27.4s | melee 45 / Stone Eagle | Stone Eagle 281 / 6; Boulder Thrower 56 / 1 | Stone Eagle 298 / 7; Boulder Thrower 56 / 1 |
| dur6-t3-apprentice-solo-baseline-previous-hp / 947 | 256.1s | ranged 49.5 / Crystal Gargoyle | Crystal Gargoyle 254.5 / 10; Cavern Troll 206.1 / 1; Deep Spider 85.2 / 6; Unknown 33 / 3 | Crystal Gargoyle 307 / 14; Cavern Troll 206.1 / 1; Deep Spider 85.2 / 6; Unknown 33 / 3 |

The final windows point to combined roster pressure: Stone Eagle and Boulder Thrower account for several T2 Mountain deaths, while the Cave Troll/Cavern Troll, gargoyles, and other roster members also appear. The recorded killing blow is not evidence that a single named elite or companion owns the whole death.

## Casts, wards, healing, and absorption

| Node | Recorded monster cast starts |
|---|---|
| T2 Cave | Savage Rush 269; Ground Slam 357; Stalactite Shot 3 |
| T2 Mountain | Ground Slam 349; Granite Barrier 220; Huge Boulder 160; Skyfall Rend 313 |
| T3 Cave | Savage Rush 283; Ground Slam 341 |
| T3 Mountain | Ground Slam 341; Granite Barrier 207; Bombardment 59; Avalanche Ram 20 |

Across the batch, cast starts were: Savage Rush 552, Ground Slam 1,388, Stalactite Shot 3, Granite Barrier 427, Huge Boulder 160, Skyfall Rend 313, Bombardment 59, and Avalanche Ram 20. Recorded cast-end FX totals were dive-bomb 864, ground-slam 1,293, stalactite-shot 2, shield 423, huge-boulder 114, bombardment 40, and avalanche-ram 9. End/start differences are retained trace facts and are not converted into pathfinding or missing-damage claims.

| Named Mountain target | Monster absorption | Expected ward capacity previous → selected |
|---|---:|---:|
| Granite Titan | 64,584 | 345 → 414 HP |
| Mountain Colossus | 195,037 | 1,062.5 → 1,168.75 HP |

The event stream contained 104,199 damage events, 131,562 heal events, 2,922 monster-cast starts, 2,745 monster-cast ends, 4,754 absorb events, 3,650 kill events, 9,282 telegraph-dodge events, 10,631 ability activations, 9,377 buff gains, 9,229 buff expirations, 1,305 buff updates, 32,119 technique-adapter events, and 12 player-death events. Monster heal count and amount were both zero. Total HP damage was 5,176,764.27 and total recorded absorbed damage was 388,513.

| Damage type | HP damage |
|---|---:|
| Direct | 4,504,236.27 |
| DoT | 358,656 |
| Debt | 2,077 |
| Weapon-DoT | 305,777 |
| AOE | 6,018 |

| Actor type | Damage events / HP damage |
|---|---:|
| Player | 47,972 / 3,956,146 |
| Monster | 6,666 / 227,775.27 |
| Minion | 49,561 / 992,843 |

Positive player outgoing damage to monsters was 42,807 events / 3,956,146 HP. Positive incoming damage was 5,738 events / 227,775.27 HP. The named-target clean exclusions include 35 HP-regain traces; these are not silently treated as ordinary clean kills.

## Conduit summon and damage audit

All positive owned-minion damage was sourced by minion:Consort. Global positive minion damage was 48,654 hits / 992,843 HP. No observed positive minion hit was an approximately 1-HP floor; no 4× class or DoT spread was observed.

| Context / Conduit build | Previous-HP positive hits / HP | Selected-HP positive hits / HP | Observed hit values |
|---|---:|---:|---|
| T2 Cave baseline | 2,638 / 42,008 | 2,607 / 41,867 | 15, 19, 21 |
| T2 Cave weapon-alt | 3,092 / 44,664 | 3,442 / 47,946 | 13, 17, 18 |
| T2 Mountain baseline | 1,018 / 19,342 | 1,548 / 29,412 | 19 |
| T2 Mountain weapon-alt | 2,635 / 44,795 | 2,555 / 43,435 | 17 |
| T3 Cave baseline | 3,200 / 82,326 | 3,257 / 83,172 | 24, 33 |
| T3 Cave weapon-alt | 4,530 / 81,794 | 4,617 / 83,443 | 17, 23, 24 |
| T3 Mountain baseline | 2,868 / 88,908 | 2,833 / 87,823 | 31 |
| T3 Mountain weapon-alt | 3,778 / 83,116 | 4,036 / 88,792 | 22 |

The T2 Mountain Conduit baseline has no clean named-target median at seed 2027 in either arm (— in the named table), but that is an unavailable median, not a zero. Its pressure/death evidence is retained separately. The summon audit does not certify other biomes, other equipment, or live play.

## Engagement and inactivity diagnostics

The sample stream contained 55,771 samples. staticDamageContacts was non-empty in 0 samples; autoIntent was missing in 3 samples. This is not client or pathfinding certification.

Across the 1,229 named-target traces with a finite positive-outgoing-damage gap, the gap distribution was p50 1.5s, p90 3.4s, p99 35.3s, maximum 234.2s, with 21 gaps above 10s, 14 above 30s, and 9 above 60s. Long gaps and unfinished targets are retained as chronology diagnostics; inactivity alone does not support a pathfinding assertion. A target unfinished at the normal 300s window is not necessarily stalled.

Possible outliers requiring separate scope include the T2 Mountain Conduit baseline seed 2027 with no clean named median and death pressure at 27.4s, the T2 Mountain Slinger weapon-alt rows with HP-regain/unfinished accounting, and the selected T3 Cave Conduit/Slinger-alt upper-tail medians around 38–40s. None is converted into a new global balance patch here.

## Exit decision and evidence boundary

| Named target | Selected HP | Decision | Limitation / next gate |
|---|---:|---|---|
| T2 Cave Troll | 1584 (+20%) | Retain provisionally | Center 18.2s; two selected-arm deaths in the pressure screen require no causal rollback but keep adoption gated. |
| T2 Granite Titan | 1656 (+20%) | Retain provisionally | Center 17.2s; T2 Mountain is the pressure limit with 9/48 total deaths. Run a focused T2 Mountain pressure pass before wider adoption. |
| T3 Cavern Troll | 4725 (+25%) | Retain provisionally | Center 24.8s; Conduit and weapon-alt slow rows exceed 35s and should be handled as build-specific follow-up. |
| T3 Mountain Colossus | 4675 (+10%) | Retain provisionally | Center 25.75s, no deaths in 48 observations, and the slowest alternative is 35s; no other-biome inference. |

1. Retain the four selected values as provisional Cave/Mountain candidates; do not apply a new shared-source or balance edit from this synthetic run.
2. Treat T2 Mountain attrition as the next decision gate. If more evidence is wanted, run a separately scoped pressure pass there with explicit death attribution; do not infer an HP rollback from this three-seed screen.
3. Do not broaden these values to Desert, Jungle, Swamp, Tundra, Volcano, or other biomes. The pending Desert weapon rework and any other-biome tuning are outside this packet.
4. Keep Sweep/Slam effects separate: Sweep was held constant, Slam was not equipped, and this experiment cannot choose an ability adjustment.
5. Preserve [the Durability 6 result root](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915/results>), manifest, index, summaries, events, samples, and generated analysis as synthetic evidence. It is not canonical combat/economy evidence.
6. Full repository suite, browser/client presentation, input feel, network behavior, acquisition, travel, economy impact, and human playtest remain unverified. No source or balance edit was made by Durability 6.
