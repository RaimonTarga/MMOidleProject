# Durability 7 report — T2 Mountain pressure attribution

Status: complete, synthetic benchmark evidence only. This report records one exact
frozen run and returns the balance decision to the operator. It does not authorize
a source patch, a balance patch, a client change, a live-play conclusion, or
economy certification.

## Decision summary

- The batch completed exactly once: 24/24 cells and 120/120 observations, with
  104 normal 300s window endings, 16 player deaths, 0 wall-ceiling censors,
  0 failed observations, and no retries.
- The three arms were isolated as specified: control (Stone Eagle 75 / Granite
  Titan 105), eagle-soft (60 / 105), and titan-soft (75 / 84). Titan HP stayed
  1,656, with authored plating 0 and node-added DR 0.1 in every arm. All other
  build, roster, geometry, player-view, defense, ability, cadence, and
  repopulation inputs matched.
- The named Granite Titan six-baseline cohort center was 17.20s in control,
  17.25s in eagle-soft, and 17.20s in titan-soft. All are inside the
  15–25s T2 context; Slinger and Conduit weapon alternatives are excluded from
  this center.
- The pressure screen favors titan-soft as the focused damage-reduction
  candidate: in the six-baseline matched pairs, deaths moved 6 to 3, the
  both-window paired incoming-damage median moved by -115.0, the both-window
  minimum-HP median moved by +6.8 percentage points, and the all-arm largest-hit
  median moved from 80.5 to 69.3. These are descriptive synthetic comparisons,
  not a precise five-seed death-rate estimate.
- Eagle-soft reduced six-baseline deaths from 6 to 2 and changed Conduit
  baseline seed 2027 from death to a 300s window ending, but its six-baseline
  both-window incoming-damage median moved only -27.0 and the corresponding
  minimum-HP median was unchanged. It remains useful comparison evidence, not
  the selected pressure arm.
- Decision: return **Titan reduction** for a focused follow-up. Do not apply it
  here, do not create a combined-soft arm, and keep live definitions at control
  values until that separately scoped decision is reviewed. After that review,
  broaden biome coverage. Retain Cave isolated attrition and T3 Cave 38–40s
  slow builds on the later-review list.
- The packet's Conduit baseline seed 2027 remains visible: control died at
  27.4s with no clean Titan median; titan-soft had the same 27.4s death and no
  clean median; eagle-soft survived the 300s window at 11.0% minimum HP and
  had a 31.65s per-seed clean Titan median from two clean traces.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability7-operator-packet.md](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability7-operator-packet.md>) |
| Frozen source revision | e538db33bcc8b5df9c828af53daaa2ab8c02325f |
| Frozen source tree | 297454cff84f7d918b916bdf7efdcce5bf8fb212 |
| Definitions SHA-256 | CC1DBBE1845182C5BA2FAEAF7890B4E27D5B694FEBE29A3A94C48DB60C4A5A2C |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitboxes SHA-256 | 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83 |
| Qualification directory | [durability7/qualification](<C:/Users/osaif/AppData/Local/mmo-idle/validation/durability7/qualification>) |
| Qualification index SHA-256 | 5F7389BFF3799074BC609A7A26524426FEEDDB8AE3DAC9870910D03C6F2D164C |
| Detached source worktree | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915/source |
| Results root | [durability7 results](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915/results>) |
| Mode / trial | run / durability7; synthetic true; economyEligible false |
| Node / time step | node-t2-mountain-04; 100ms |
| Window | 300s per observation; 10 simulated hours maximum |
| Seeds | 173, 947, 2027, 4093, 5579 |
| Matrix | 8 builds × 3 arms = 24 cells |
| Observations | 24 cells × 5 seeds = 120 |

The exact combat command was:

~~~powershell
pnpm --dir C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915/source --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability7 --mode=run "--revision=e538db33bcc8b5df9c828af53daaa2ab8c02325f" "--hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json" "--out=C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915/results"
~~~

Run window: 2026-09-15T19:55:53.4686067Z–2026-09-15T20:10:02.7788419Z
UTC; wall time 849.3102352s (about 14m09.310s). The single sequential
process exited 0. Paired C: free-space values were 45,617,721,344 bytes at
start and 44,993,818,624 bytes at end, a decrease of 623,902,720 bytes
(595.0 MiB). No resource failure was reported; peak RSS was not independently
sampled.

No Docker, database, restart, retry, source edit, balance edit, adaptive rerun,
or extra experiment was used. The detached checkout stayed at the frozen
revision/tree and clean after the run. Shared-worktree edits unrelated to this
experiment were preserved. The generated analysis was produced with:

~~~powershell
node C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915/source/scripts/ttk-survey-report.mjs C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915/results
~~~

Qualification was READY before launch: all 24 configurations passed in the
clean frozen source, including matching views/rosters/HP/geometry, exact arm
attack/defense values, frozen workspace and bench typecheck, overlay/restoration
coverage, Conduit pilots, and report generation. Full-suite validation and
human/browser playtest were not run.

## Arm identity and matched setup

| Arm | Stone Eagle attack | Granite Titan attack | Titan HP / plating / actual DR |
|---|---:|---:|---:|
| control | 75 | 105 | 1656 / 0 / 0.1 |
| eagle-soft | 60 | 105 | 1656 / 0 / 0.1 |
| titan-soft | 75 | 84 | 1656 / 0 / 0.1 |

The attack changes are base attack overrides, so Eagle dive (1.25x in all arms)
and Titan slam weaken proportionally before mitigation. They are not
ordinary-hit-only interventions. There was no combined-soft arm. The historical
hpTreatment field
recorded the attack changes while preserving HP:

- control: []
- eagle-soft: [{"type":"stone-eagle","before":340,"after":340,"beforeAttack":75,"afterAttack":60}]
- titan-soft: [{"type":"granite-titan","before":1656,"after":1656,"beforeAttack":105,"afterAttack":84}]

An independent post-run audit found 120 expected run directories, each with
ready.json, summary.json, events.jsonl, and samples.jsonl; 485 recursive
files total including the five root artifacts; 0 missing, unexpected, duplicate,
or failed observations. complete.json records {"cells":24,"runs":120,"mode":"run"}.
All manifest records are trial=durability7, mode=run, the exact frozen
revision, the definitions hash above, the hitbox hash above, dtMs=100,
durationMs=300000, synthetic=true, and economyEligible=false.

Across every matched class/alternate/arm/seed group:

- starting player views were byte-identical across the three arms, including HP,
  maximum HP, plating, damage reduction, equipment, passives, stance, abilities,
  runes, and combat state;
- starting geometry and initial roster hashes matched across the three arms;
- Titan roster HP was 1,656 in all arms, and every Titan retained plating 0 and
  node-added DR 0.1;
- the only intended state differences were Stone Eagle attack 75→60 in
  eagle-soft or Granite Titan attack 105→84 in titan-soft. All non-target
  species stats and all defenses matched.

The live definitions remain at the control values pending review.

## Build matrix

All builds used +5 gear, medium frames, normal class range, Mountain
armor/charm/boots, Tempered Core, offensive stance, existing survey
abilities/runes, fixed Sweep Tempo, and no Slam. No Desert weapons, other
biomes, bosses, compensation, or economy scope was included.

| Class | Alternate | Weapon | Class path |
|---|---|---|---|
| Striker | no | gale-needle | cadence-root / cadence-balanced |
| Squire | no | quake-hammer | cooldown-root / cooldown-balanced |
| Apprentice | no | ruinous-axe | dot-root / dot-balanced |
| Slinger | no | jungle-stinger-rapier | reload-root / reload-balanced |
| Slinger | yes | swamp-mirebrand | reload-root / reload-balanced |
| Conduit | no | ruinous-axe | summoner-root / summoner-balanced |
| Conduit | yes | jungle-stinger-rapier | summoner-root / summoner-balanced |
| Spirit | no | ruinous-axe | energy-root / energy-balanced |

The alternate rows are deliberately retained for diagnosis only and do not enter
the six-baseline duration center.

The exact manifest cell IDs used by the per-seed tables are:

| Class / alternate | control cell | eagle-soft cell | titan-soft cell |
|---|---|---|---|
| Striker / no | dur7-t2-striker-small-group-baseline-control | dur7-t2-striker-small-group-baseline-eagle-soft | dur7-t2-striker-small-group-baseline-titan-soft |
| Squire / no | dur7-t2-squire-small-group-baseline-control | dur7-t2-squire-small-group-baseline-eagle-soft | dur7-t2-squire-small-group-baseline-titan-soft |
| Apprentice / no | dur7-t2-apprentice-small-group-baseline-control | dur7-t2-apprentice-small-group-baseline-eagle-soft | dur7-t2-apprentice-small-group-baseline-titan-soft |
| Slinger / no | dur7-t2-slinger-small-group-baseline-control | dur7-t2-slinger-small-group-baseline-eagle-soft | dur7-t2-slinger-small-group-baseline-titan-soft |
| Slinger / yes | dur7-t2-slinger-small-group-weapon-alt-control | dur7-t2-slinger-small-group-weapon-alt-eagle-soft | dur7-t2-slinger-small-group-weapon-alt-titan-soft |
| Conduit / no | dur7-t2-conduit-small-group-baseline-control | dur7-t2-conduit-small-group-baseline-eagle-soft | dur7-t2-conduit-small-group-baseline-titan-soft |
| Conduit / yes | dur7-t2-conduit-small-group-weapon-alt-control | dur7-t2-conduit-small-group-weapon-alt-eagle-soft | dur7-t2-conduit-small-group-weapon-alt-titan-soft |
| Spirit / no | dur7-t2-spirit-small-group-baseline-control | dur7-t2-spirit-small-group-baseline-eagle-soft | dur7-t2-spirit-small-group-baseline-titan-soft |

## Artifact verification

| Artifact | SHA-256 / result |
|---|---|
| [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915/results/manifest.json>) | 91F566697E29CFE1D6DF49CAEC4897588271B433440840F246E5F75C38156439 |
| [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915/results/complete.json>) | AB050ED132EE91B8017BD92AE6F04094D55097945EEEAD3D75E670EBEF8CD15B; {"cells":24,"runs":120,"mode":"run"} |
| [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915/results/index.json>) | D2A0D5ADDC09AEB0F1E94E2225D172AFAF9532846160024F03841870AE8E636D |
| [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915/results/analysis.json>) | BE8ADB4FEA69B43199917FA654272AF4E610E3B6E7F7F71DFA702B7AB6FA0A50 |
| [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915/results/analysis.md>) | 08AABE86FD638E81B2F66F856ED22FAC3CD7F8AF6DEED2DC149D19829B3A8DC4 |
| Result structure | 120 run directories, 485 recursive files, 0 failed.json |
## Per-seed survival and pressure

The following table shows every seed for every exact class/alternate/arm cell.
Each seed entry is: outcome/time, minimum HP, largest single hit, maximum damage
in any one-second interval, recovery completed/interrupted/open, and total
incoming damage. W means the 300s window ended; D means player death. Recovery
counts are the summary recovery episodes, not a death-rate estimate.

### Striker baseline

| Arm | s173 | s947 | s2027 | s4093 | s5579 |
|---|---|---|---|---|---|
| control | W@300.0s / 45.3% / 79.0 / 79.0 / 11/4/1 / 1984.7 | W@300.0s / 36.1% / 79.0 / 131.0 / 10/6/0 / 2097.6 | D@178.9s / 0.0% / 79.0 / 138.0 / 4/3/0 / 1774.2 | D@49.8s / 0.0% / 79.0 / 131.0 / 1/0/0 / 853.1 | W@300.0s / 25.8% / 79.0 / 151.0 / 8/2/0 / 2275.9 |
| eagle-soft | W@300.0s / 42.9% / 79.0 / 115.0 / 11/5/0 / 1873.6 | W@300.0s / 4.3% / 79.0 / 133.0 / 7/6/0 / 2263.8 | W@300.0s / 27.9% / 79.0 / 122.0 / 9/5/0 / 2068.6 | D@51.2s / 0.0% / 79.0 / 126.0 / 1/0/0 / 810.1 | W@300.0s / 19.8% / 79.0 / 151.0 / 8/2/0 / 2209.9 |
| titan-soft | W@300.0s / 30.8% / 72.0 / 131.0 / 13/1/1 / 1771.5 | W@300.0s / 38.1% / 72.0 / 131.0 / 9/9/1 / 2015.7 | W@300.0s / 21.5% / 71.0 / 127.0 / 8/6/0 / 2243.0 | D@49.1s / 0.0% / 72.0 / 205.4 / 1/0/0 / 791.5 | W@300.0s / 37.5% / 71.0 / 118.0 / 8/5/0 / 1844.2 |

### Squire baseline

| Arm | s173 | s947 | s2027 | s4093 | s5579 |
|---|---|---|---|---|---|
| control | W@300.0s / 42.3% / 85.0 / 123.0 / 12/4/0 / 1509.2 | W@300.0s / 34.8% / 85.0 / 139.0 / 11/4/0 / 1726.7 | W@300.0s / 15.8% / 85.0 / 104.9 / 12/1/0 / 1817.9 | W@300.0s / 27.1% / 85.0 / 139.0 / 9/3/0 / 1811.3 | D@140.7s / 0.0% / 85.0 / 139.0 / 3/1/0 / 1069.7 |
| eagle-soft | D@203.0s / 0.0% / 85.0 / 154.0 / 10/2/0 / 1158.3 | W@300.0s / 42.7% / 85.0 / 85.0 / 11/8/1 / 1311.9 | W@300.0s / 32.1% / 85.0 / 85.0 / 10/4/1 / 1498.3 | W@300.0s / 28.9% / 85.0 / 133.0 / 11/3/0 / 1933.5 | W@300.0s / 8.5% / 85.0 / 124.0 / 10/4/0 / 1782.5 |
| titan-soft | W@300.0s / 40.0% / 67.0 / 67.0 / 11/6/0 / 1071.8 | W@300.0s / 46.3% / 67.0 / 117.0 / 9/8/1 / 1320.1 | W@300.0s / 27.6% / 67.0 / 121.0 / 9/3/0 / 1169.1 | D@167.7s / 0.0% / 67.0 / 121.0 / 5/2/0 / 1336.7 | W@300.0s / 71.3% / 63.0 / 63.0 / 7/8/0 / 971.6 |

### Apprentice baseline

| Arm | s173 | s947 | s2027 | s4093 | s5579 |
|---|---|---|---|---|---|
| control | W@300.0s / 39.9% / 78.1 / 81.1 / 13/1/0 / 1066.5 | W@300.0s / 24.7% / 85.5 / 98.4 / 12/3/1 / 1350.3 | D@277.5s / 0.0% / 85.5 / 157.8 / 12/6/0 / 1456.7 | W@300.0s / 31.3% / 85.5 / 88.5 / 12/3/1 / 1188.6 | D@215.0s / 0.0% / 85.5 / 97.4 / 6/5/0 / 1642.7 |
| eagle-soft | W@300.0s / 37.0% / 70.2 / 92.9 / 12/0/0 / 992.5 | W@300.0s / 30.2% / 85.5 / 120.0 / 2/1/0 / 1405.0 | W@300.0s / 27.8% / 85.5 / 159.2 / 9/8/0 / 1236.1 | W@300.0s / 32.3% / 84.0 / 88.0 / 12/6/0 / 1047.3 | W@300.0s / 43.4% / 85.5 / 87.5 / 9/10/0 / 1040.6 |
| titan-soft | W@300.0s / 54.9% / 64.8 / 66.8 / 1/1/0 / 936.2 | W@300.0s / 47.6% / 69.3 / 130.7 / 12/4/0 / 983.0 | W@300.0s / 48.0% / 55.9 / 58.8 / 10/8/0 / 1065.5 | W@300.0s / 32.1% / 69.3 / 72.3 / 8/7/1 / 1073.5 | W@300.0s / 23.1% / 69.3 / 72.3 / 8/6/0 / 1565.1 |

### Slinger baseline

| Arm | s173 | s947 | s2027 | s4093 | s5579 |
|---|---|---|---|---|---|
| control | W@300.0s / 58.3% / 81.0 / 81.0 / 15/8/0 / 603.3 | W@300.0s / 53.3% / 81.0 / 81.0 / 8/16/0 / 875.0 | W@300.0s / 53.3% / 98.0 / 98.0 / 14/9/0 / 789.1 | W@300.0s / 58.8% / 62.4 / 62.4 / 10/15/0 / 752.3 | W@300.0s / 54.1% / 62.4 / 62.4 / 13/11/1 / 668.5 |
| eagle-soft | W@300.0s / 66.1% / 62.4 / 62.4 / 16/8/0 / 451.1 | W@300.0s / 51.2% / 98.0 / 98.0 / 12/12/0 / 884.3 | W@300.0s / 58.3% / 100.0 / 100.0 / 13/14/1 / 762.1 | W@300.0s / 45.5% / 80.0 / 80.0 / 12/10/0 / 623.8 | W@300.0s / 66.9% / 80.0 / 80.0 / 11/17/0 / 762.2 |
| titan-soft | W@300.0s / 63.4% / 75.0 / 75.0 / 14/10/1 / 589.7 | W@300.0s / 66.1% / 76.3 / 76.3 / 12/9/0 / 559.6 | W@300.0s / 60.8% / 81.0 / 81.0 / 13/13/0 / 786.5 | W@300.0s / 64.2% / 75.0 / 75.0 / 12/8/0 / 419.0 | W@300.0s / 60.8% / 79.5 / 79.5 / 12/13/0 / 891.1 |

### Slinger weapon alternative

| Arm | s173 | s947 | s2027 | s4093 | s5579 |
|---|---|---|---|---|---|
| control | W@300.0s / 30.8% / 98.0 / 118.0 / 9/2/0 / 1684.7 | W@300.0s / 31.6% / 98.0 / 98.0 / 1/0/0 / 1755.2 | W@300.0s / 39.0% / 98.0 / 118.0 / 1/1/0 / 1597.7 | D@140.3s / 0.0% / 84.0 / 130.0 / 4/1/0 / 974.8 | D@216.8s / 0.0% / 98.0 / 118.0 / 0/0/0 / 1484.8 |
| eagle-soft | W@300.0s / 3.7% / 98.0 / 111.0 / 1/0/0 / 1533.0 | D@84.0s / 0.0% / 98.0 / 98.0 / 0/1/0 / 689.4 | W@300.0s / 50.0% / 84.0 / 84.0 / 10/2/0 / 1064.8 | W@300.0s / 11.6% / 103.1 / 111.0 / 3/4/0 / 1430.7 | D@286.8s / 0.0% / 98.0 / 157.3 / 1/0/0 / 1790.8 |
| titan-soft | W@300.0s / 27.2% / 81.0 / 81.0 / 1/0/0 / 1703.6 | W@300.0s / 29.7% / 81.0 / 88.0 / 2/0/0 / 1267.6 | W@300.0s / 27.4% / 81.0 / 88.0 / 11/1/0 / 1451.0 | D@77.6s / 0.0% / 81.0 / 146.0 / 1/2/0 / 590.5 | W@300.0s / 12.5% / 81.0 / 81.0 / 6/3/0 / 1209.8 |

### Conduit baseline

| Arm | s173 | s947 | s2027 | s4093 | s5579 |
|---|---|---|---|---|---|
| control | W@300.0s / 92.6% / 12.0 / 12.0 / 18/1/0 / 12.0 | W@300.0s / 70.7% / 45.0 / 45.0 / 18/1/0 / 150.0 | D@27.4s / 0.0% / 56.0 / 146.0 / 0/0/0 / 354.0 | W@300.0s / 47.5% / 56.0 / 101.0 / 11/1/0 / 373.0 | W@300.0s / 76.4% / 45.0 / 45.0 / 19/0/0 / 69.0 |
| eagle-soft | W@300.0s / 92.6% / 12.0 / 12.0 / 18/1/0 / 12.0 | W@300.0s / 58.6% / 38.0 / 38.0 / 18/0/0 / 158.0 | W@300.0s / 11.0% / 56.0 / 122.0 / 5/0/0 / 355.4 | W@300.0s / 52.5% / 41.0 / 53.0 / 6/0/0 / 305.0 | W@300.0s / 82.6% / 30.0 / 30.0 / 18/0/0 / 30.0 |
| titan-soft | W@300.0s / 92.6% / 12.0 / 12.0 / 18/1/0 / 12.0 | W@300.0s / 70.7% / 45.0 / 45.0 / 18/1/0 / 150.0 | D@27.4s / 0.0% / 56.0 / 146.0 / 0/0/0 / 354.0 | W@300.0s / 47.5% / 56.0 / 101.0 / 11/1/0 / 373.0 | W@300.0s / 76.4% / 45.0 / 45.0 / 19/0/0 / 69.0 |

### Conduit weapon alternative

| Arm | s173 | s947 | s2027 | s4093 | s5579 |
|---|---|---|---|---|---|
| control | W@300.0s / 94.2% / 12.0 / 12.0 / 20/0/0 / 12.0 | W@300.0s / 47.5% / 56.0 / 56.0 / 19/0/0 / 215.0 | W@300.0s / 32.6% / 56.0 / 101.0 / 19/0/0 / 253.0 | W@300.0s / 33.7% / 56.0 / 56.0 / 18/0/0 / 371.1 | W@300.0s / 75.2% / 45.0 / 45.0 / 5/0/0 / 74.0 |
| eagle-soft | W@300.0s / 94.2% / 12.0 / 12.0 / 20/0/0 / 12.0 | W@300.0s / 51.2% / 41.0 / 41.0 / 20/1/0 / 116.0 | W@300.0s / 59.0% / 41.0 / 74.0 / 14/1/0 / 275.0 | W@300.0s / 50.1% / 41.0 / 41.0 / 13/0/0 / 224.0 | W@300.0s / 85.1% / 30.0 / 30.0 / 5/0/0 / 30.0 |
| titan-soft | W@300.0s / 94.2% / 12.0 / 12.0 / 20/0/0 / 12.0 | W@300.0s / 47.5% / 56.0 / 56.0 / 19/0/0 / 215.0 | W@300.0s / 32.6% / 56.0 / 101.0 / 19/0/0 / 253.0 | W@300.0s / 33.7% / 56.0 / 56.0 / 18/0/0 / 371.1 | W@300.0s / 75.2% / 45.0 / 45.0 / 5/0/0 / 74.0 |

### Spirit baseline

| Arm | s173 | s947 | s2027 | s4093 | s5579 |
|---|---|---|---|---|---|
| control | W@300.0s / 44.3% / 80.0 / 80.0 / 7/15/1 / 343.1 | W@300.0s / 44.3% / 97.0 / 97.0 / 8/16/1 / 432.5 | W@300.0s / 37.0% / 97.0 / 97.0 / 16/6/0 / 232.7 | W@300.0s / 32.0% / 80.0 / 80.0 / 14/7/0 / 359.2 | W@300.0s / 44.3% / 97.0 / 97.0 / 8/5/0 / 267.6 |
| eagle-soft | W@300.0s / 44.3% / 80.0 / 80.0 / 10/13/0 / 449.1 | W@300.0s / 44.3% / 80.0 / 80.0 / 7/10/0 / 444.1 | W@300.0s / 53.4% / 48.0 / 48.0 / 9/16/0 / 261.0 | W@300.0s / 32.0% / 80.0 / 80.0 / 14/5/0 / 230.4 | W@300.0s / 41.1% / 80.0 / 80.0 / 10/17/0 / 378.7 |
| titan-soft | W@300.0s / 54.3% / 80.0 / 80.0 / 7/19/0 / 266.2 | W@300.0s / 54.3% / 80.0 / 80.0 / 4/11/0 / 199.3 | W@300.0s / 37.1% / 80.0 / 128.0 / 9/12/0 / 454.1 | W@300.0s / 42.0% / 80.0 / 80.0 / 12/10/0 / 152.0 | W@300.0s / 70.9% / 67.0 / 67.0 / 8/12/0 / 202.4 |
## Named Granite Titan TTK

This is the requested named-target measure. Each seed token is
clean-median-seconds / clean-count / kills / unfinished / HP-regain traces.
The outer value is the median of available per-seed clean medians; it is not a
pooled target median. A no-kill token means there was no usable clean median,
not zero seconds. Clean, kill, unfinished, and regain counts can overlap.

| Class / alternate | Arm | s173 | s947 | s2027 | s4093 | s5579 | Outer clean TTK |
|---|---|---|---|---|---|---|---:|
| Striker / no | control | 27.45/4/4/0/0 | 27.40/3/4/0/0 | 33.60/2/3/0/0 | 29.70/1/1/0/0 | 29.65/6/7/0/0 | 29.65s |
| Striker / no | eagle-soft | 27.60/3/3/0/0 | 29.40/4/5/0/0 | 29.90/4/5/0/0 | 29.70/1/1/0/0 | 29.60/6/7/0/0 | 29.60s |
| Striker / no | titan-soft | 28.90/4/4/0/0 | 29.20/3/3/0/0 | 30.45/4/5/0/0 | 29.70/1/1/0/0 | 29.50/5/5/0/0 | 29.50s |
| Squire / no | control | 25.10/5/6/0/0 | 25.40/5/6/0/0 | 25.40/5/5/0/0 | 25.05/6/6/0/0 | 24.50/3/4/0/0 | 25.10s |
| Squire / no | eagle-soft | 24.50/3/4/0/0 | 25.00/5/5/0/0 | 25.40/6/6/0/0 | 25.90/5/6/0/0 | 24.90/6/6/0/0 | 25.00s |
| Squire / no | titan-soft | 25.10/6/6/0/0 | 25.60/5/5/0/0 | 25.55/6/7/0/0 | 28.30/3/4/0/0 | 24.50/6/7/0/0 | 25.55s |
| Apprentice / no | control | 16.50/7/7/0/0 | 16.50/8/8/0/0 | 16.50/1/2/0/0 | 16.50/8/8/0/0 | 15.70/5/5/0/0 | 16.50s |
| Apprentice / no | eagle-soft | 16.50/5/7/0/1 | 16.50/5/7/0/2 | 16.50/6/6/0/0 | 16.50/6/6/0/0 | 15.35/6/7/0/0 | 16.50s |
| Apprentice / no | titan-soft | 15.75/6/7/0/1 | 16.50/6/7/0/0 | 16.50/6/6/0/0 | 15.75/6/6/0/0 | 16.50/5/6/0/0 | 16.50s |
| Slinger / no | control | 13.80/9/9/0/0 | 14.55/8/9/0/0 | 13.80/5/6/0/0 | 13.80/8/8/0/0 | 13.80/10/10/0/0 | 13.80s |
| Slinger / no | eagle-soft | 13.80/8/8/0/0 | 13.80/8/9/0/0 | 13.80/4/5/0/0 | 13.80/10/10/0/0 | 13.80/8/8/0/0 | 13.80s |
| Slinger / no | titan-soft | 13.80/8/8/0/0 | 14.35/8/8/0/0 | 13.80/7/8/0/0 | 13.80/11/11/0/0 | 13.95/8/8/0/0 | 13.80s |
| Slinger / yes | control | 21.00/1/4/0/3 | 23.50/6/6/0/0 | 21.00/5/7/0/1 | 21.00/3/3/0/0 | 21.50/2/3/0/1 | 21.00s |
| Slinger / yes | eagle-soft | 21.50/4/8/0/3 | 22.50/2/2/0/0 | 21.50/4/6/0/1 | 21.50/6/7/0/1 | 22.00/3/6/0/3 | 21.50s |
| Slinger / yes | titan-soft | 21.00/5/8/0/3 | 21.00/6/7/0/1 | 23.00/3/5/0/2 | 21.00/1/2/0/1 | 22.00/5/6/0/1 | 21.00s |
| Conduit / no | control | 17.80/6/6/0/0 | 18.00/3/4/0/0 | no-kill/0/1/0/1 | 24.50/5/5/0/0 | 17.90/5/6/0/0 | 17.90s |
| Conduit / no | eagle-soft | 17.80/6/6/0/0 | 17.95/4/4/0/0 | 31.65/2/3/0/1 | 18.05/4/6/0/1 | 18.00/5/5/0/0 | 18.00s |
| Conduit / no | titan-soft | 17.80/6/6/0/0 | 18.00/3/4/0/0 | no-kill/0/1/0/1 | 24.50/5/5/0/0 | 17.90/5/6/0/0 | 17.90s |
| Conduit / yes | control | 14.15/6/6/0/0 | 14.20/5/5/0/0 | 14.20/3/4/0/1 | 14.30/6/6/0/0 | 14.20/7/8/0/0 | 14.20s |
| Conduit / yes | eagle-soft | 14.15/6/6/0/0 | 14.10/5/6/0/0 | 14.15/4/6/0/1 | 14.20/5/6/0/1 | 14.20/7/8/0/0 | 14.15s |
| Conduit / yes | titan-soft | 14.15/6/6/0/0 | 14.20/5/5/0/0 | 14.20/3/4/0/1 | 14.30/6/6/0/0 | 14.20/7/8/0/0 | 14.20s |
| Spirit / no | control | 15.40/9/9/0/0 | 14.70/8/8/0/0 | 14.70/6/7/0/1 | 14.70/9/9/0/0 | 14.70/6/6/0/0 | 14.70s |
| Spirit / no | eagle-soft | 14.70/9/10/0/0 | 14.70/8/9/0/1 | 14.70/7/8/0/0 | 14.70/10/11/0/0 | 15.40/7/8/0/0 | 14.70s |
| Spirit / no | titan-soft | 14.70/9/9/0/0 | 15.05/8/10/0/1 | 14.70/6/8/0/1 | 14.70/9/10/0/0 | 14.70/11/12/0/0 | 14.70s |

### Six-baseline center and matched-arm screen

| Arm | Striker | Squire | Apprentice | Slinger | Conduit | Spirit | Six-baseline center |
|---|---:|---:|---:|---:|---:|---:|---:|
| control | 29.65s | 25.10s | 16.50s | 13.80s | 17.90s | 14.70s | 17.20s |
| eagle-soft | 29.60s | 25.00s | 16.50s | 13.80s | 18.00s | 14.70s | 17.25s |
| titan-soft | 29.50s | 25.55s | 16.50s | 13.80s | 17.90s | 14.70s | 17.20s |

The six-baseline centers use only the six rows marked alternate=no. The
six-baseline min/max centers were 13.80–29.65s for control, 13.80–29.60s for
eagle-soft, and 13.80–29.50s for titan-soft; all six baselines had an available
outer median. The two Slinger and Conduit alternate rows were excluded: their
outer medians were 21.00/21.50/21.00s and 14.20/14.15/14.20s for
control/eagle-soft/titan-soft respectively.

Matched-seed screen, with current same-batch control as the primary comparator:

| Scope | Treatment | Pairs | Deaths control → treatment | Windows control → treatment | Incoming median control → treatment | Paired incoming delta, both windows | Minimum-HP delta, both windows |
|---|---|---:|---:|---:|---:|---:|---:|
| six baselines | eagle-soft | 30 | 6 → 2 | 24 → 28 | 864.0 → 847.2 | -27.0 | 0.0 pp |
| six baselines | titan-soft | 30 | 6 → 3 | 24 → 27 | 864.0 → 841.3 | -115.0 | +6.8 pp |
| all cells | eagle-soft | 40 | 8 → 4 | 32 → 36 | 864.0 → 786.2 | -41.5 | +1.4 pp |
| all cells | titan-soft | 40 | 8 → 4 | 32 → 36 | 864.0 → 789.0 | -76.8 | +0.7 pp |

The incoming-damage and minimum-HP deltas are matched-seed summaries of the
observed runs. Earlier death can reduce exposure, so lower total incoming
damage alone is not equivalent to lower damage at matched exposure. The
titan-soft advantage is supported by the paired baseline pressure, lower
largest-hit distribution, and unchanged named-Titan duration center together;
it is not inferred from pooled all-enemy TTK.
## Death and severe near-death attribution

There were 16 exact player-death traces and 8 surviving traces with
minimum HP below 20%. For each trace below, the 10s and 30s damage entries are
summed positive player-targeted hpDamage by source, with hit count after x.
Casts are monster-cast-start records in the same window. Death anchors use the
exact summary death time. Surviving severe anchors use the nearest one-second
sample to the lowest observed sample HP; the summary minimum itself is computed
on the normal 100ms tick and can be lower than that displayed sample. This is
therefore an attribution window, not a claim that the last listed hit was the
sole cause. Eagle dive attribution from event timing remains approximate.

Source abbreviations: E = Stone Eagle, T = Granite Titan, B = Boulder Thrower.
Cast abbreviations: Sky = Skyfall Rend, Slam = Ground Slam, Barrier =
Granite Barrier, Boulder = Huge Boulder.

### Striker baseline

- control s2027: **death at 178.9s, minimum 0.0%**. 10s: T 158.0 x2,
  E 119.7 x2. 30s: T 353.3 x6, E 119.7 x2. Casts 10s: E Sky 169.9,
  T Slam 171.4. Casts 30s: T Slam 150.1 and 160.7, T Barrier 168.8,
  E Sky 169.9, T Slam 171.4.
- control s4093: **death at 49.8s, minimum 0.0%**. 10s: E 319.0 x5,
  B 75.0 x2. 30s: E 417.9 x7, T 237.0 x3, B 75.0 x2. Casts 10s:
  E Sky 42.1 and 43.9, B Boulder 45.6. Casts 30s: T Barrier 20.0,
  T Slam 23.6, E Sky 23.8, E Sky 42.1 and 43.9, B Boulder 45.6.
- eagle-soft s947: **survived 300.0s, minimum 4.3% at sample 153.0s**.
  10s: T 158.0 x2, E 43.0 x1. 30s: T 353.3 x6, E 97.0 x2.
  Casts 10s: T Slam 145.8. Casts 30s: T Slam 124.4 and 135.1,
  E Sky 140.9, T Barrier 142.7, T Slam 145.8.
- eagle-soft s4093: **death at 51.2s, minimum 0.0%**. 10s: E 237.0 x5,
  B 144.0 x2. 30s: E 302.9 x7, T 158.0 x2, B 147.0 x3. Casts
  10s: E Sky 43.1 and 43.9, B Boulder 44.6. Casts 30s: T Slam 23.6,
  E Sky 23.8, E Sky 43.1 and 43.9, B Boulder 44.6.
- eagle-soft s5579: **survived 300.0s, minimum 19.8% at sample 294.0s**.
  10s: T 158.0 x2, B 75.0 x2. 30s: T 158.0 x2, B 75.0 x2, E 28.0 x1.
  Casts 10s: T Slam 287.2, B Boulder 291.4. Casts 30s: E Sky 270.8,
  T Slam 287.2, B Boulder 291.4.
- titan-soft s4093: **death at 49.1s, minimum 0.0%**. 10s: E 251.4 x4,
  B 147.0 x3. 30s: E 350.3 x6, T 204.0 x3, B 147.0 x3. Casts
  10s: E Sky 43.1 and 43.9, B Boulder 44.0. Casts 30s: T Barrier 20.0,
  T Slam 23.6, E Sky 23.8, E Sky 43.1 and 43.9, B Boulder 44.0.

### Squire baseline

- control s2027: **survived 300.0s, minimum 15.8% at sample 32.0s**.
  10s: T 170.0 x2, E 92.1 x2. 30s: T 373.3 x6, E 159.1 x3.
  Casts 10s: T Barrier 22.6, E Sky 24.0, T Slam 24.5. Casts 30s:
  T Slam 3.1 and 13.7, E Sky 5.6 and 24.0, T Barrier 22.6,
  T Slam 24.5.
- control s5579: **death at 140.7s, minimum 0.0%**. 10s: T 170.0 x2,
  E 113.3 x2. 30s: T 375.3 x6, E 113.3 x2. Casts 10s: E Sky 132.0,
  T Slam 133.6. Casts 30s: T Slam 112.2 and 122.9, T Barrier 127.9,
  E Sky 132.0, T Slam 133.6.
- eagle-soft s173: **death at 203.0s, minimum 0.0%**. 10s: B 195.4 x3,
  T 170.0 x2. 30s: T 263.0 x4, B 195.4 x3. Casts 10s: T Slam 193.1,
  T Barrier 195.7, B Boulder 197.3. Casts 30s: T Slam 182.3 and 193.1,
  T Barrier 195.7, B Boulder 197.3.
- eagle-soft s5579: **survived 300.0s, minimum 8.5% at sample 141.0s**.
  10s: T 170.0 x2, E 79.3 x2. 30s: T 375.3 x6, E 79.3 x2. Casts
  10s: E Sky 132.0, T Slam 133.6. Casts 30s: T Slam 112.2 and 122.9,
  T Barrier 127.9, E Sky 132.0, T Slam 133.6.
- titan-soft s4093: **death at 167.7s, minimum 0.0%**. 10s: T 126.0 x2,
  E 108.0 x2. 30s: T 252.0 x4, E 206.0 x4. Casts 10s: T Slam 160.8,
  T Barrier 164.4. Casts 30s: E Sky 138.6 and 147.9, T Slam 149.2
  and 160.8, T Barrier 164.4.

### Apprentice baseline

- control s2027: **death at 277.5s, minimum 0.0%**. 10s: T 177.0 x5,
  E 139.0 x5. 30s: T 177.0 x5, E 139.0 x5, B 67.2 x6. Casts
  10s: T Slam 269.4, E Sky 270.4, T Barrier 273.8, E Sky 275.3.
  Casts 30s: B Boulder 252.3, T Slam 269.4, E Sky 270.4, T Barrier
  273.8, E Sky 275.3.
- control s5579: **death at 215.0s, minimum 0.0%**. 10s: B 222.6 x10,
  T 90.5 x3. 30s: B 222.6 x10, T 117.6 x5, E 59.8 x5. Casts
  10s: T Barrier 207.0, B Boulder 209.4. Casts 30s: T Slam 201.8,
  T Barrier 207.0, B Boulder 209.4.

### Slinger weapon alternative

- control s4093: **death at 140.3s, minimum 0.0%**. 10s: E 320.0 x6,
  T 36.0 x1. 30s: E 320.0 x6, T 72.0 x2. Casts 10s: E Sky 131.5
  and 132.0. Casts 30s: T Slam 121.1, T Barrier 128.2, T Slam 130.2,
  E Sky 131.5 and 132.0.
- control s5579: **death at 216.8s, minimum 0.0%**. 10s: E 296.0 x5.
  30s: E 320.0 x6, T 72.0 x2. Casts 10s: E Sky 209.1 and 216.3.
  Casts 30s: T Slam 193.9, T Barrier 199.6, T Slam 202.5, E Sky 203.7
  and 209.1, E Sky 216.3.
- eagle-soft s173: **survived 300.0s, minimum 3.7% at sample 175.0s**.
  10s: T 98.0 x1, B 70.9 x2. 30s: T 195.0 x2, B 151.9 x3,
  E 14.0 x1. Casts 10s: B Boulder 166.5, T Slam 167.4, T Barrier
  168.4. Casts 30s: E Sky 156.7, T Slam 157.2 and 167.4, B Boulder
  166.5, T Barrier 168.4.
- eagle-soft s947: **death at 84.0s, minimum 0.0%**. 10s: B 110.4 x3,
  E 109.0 x2. 30s: B 191.4 x4, T 122.3 x2, E 109.0 x2. Casts
  10s: B Boulder 77.9, E Sky 78.0. Casts 30s: T Slam 60.2, T Barrier
  67.3, T Slam 69.4, B Boulder 70.4 and 77.9, E Sky 78.0.
- eagle-soft s4093: **survived 300.0s, minimum 11.6% at sample 228.0s**.
  10s: T 201.1 x2. 30s: T 298.1 x3, E 14.0 x1. Casts 10s: T Slam
  224.0, T Barrier 226.2. Casts 30s: E Sky 210.2, T Slam 211.9 and
  224.0, T Barrier 226.2.
- eagle-soft s5579: **death at 286.8s, minimum 0.0%**. 10s: B 157.3 x2,
  E 61.0 x1, T 29.0 x1. 30s: B 200.3 x4, T 108.4 x2, E 61.0 x1.
  Casts 10s: T Barrier 278.5, T Slam 280.6, E Sky 285.3. Casts
  30s: T Slam 271.4, B Boulder 273.4, T Barrier 278.5, T Slam 280.6,
  E Sky 285.3.
- titan-soft s4093: **death at 77.6s, minimum 0.0%**. 10s: E 146.0 x2,
  B 91.0 x2. 30s: E 185.0 x4, B 91.0 x2, T 75.0 x1. Casts 10s:
  B Boulder 73.7, E Sky 75.8. Casts 30s: E Sky 62.6, T Slam 62.8,
  B Boulder 73.7, E Sky 75.8.
- titan-soft s5579: **survived 300.0s, minimum 12.5% at sample 155.0s**.
  10s: E 231.0 x4. 30s: E 253.4 x5, B 143.8 x3. Casts 10s:
  E Sky 147.3. Casts 30s: B Boulder 139.0, E Sky 143.1 and 147.3.

### Conduit baseline

- control s2027: **death at 27.4s, minimum 0.0%**. 10s: E 281.0 x6,
  B 56.0 x1. 30s: E 298.0 x7, B 56.0 x1. Casts 10s: E Sky 19.5.
  Casts 30s: E Sky 14.6 and 19.5.
- eagle-soft s2027: **survived 300.0s, minimum 11.0% at sample 32.0s**.
  10s: B 110.4 x2, E 99.0 x3. 30s: E 203.0 x6, B 110.4 x2.
  Casts 10s: B Boulder 29.8. Casts 30s: E Sky 14.6 and 19.5,
  B Boulder 29.8.
- titan-soft s2027: **death at 27.4s, minimum 0.0%**. 10s: E 281.0 x6,
  B 56.0 x1. 30s: E 298.0 x7, B 56.0 x1. Casts 10s: E Sky 19.5.
  Casts 30s: E Sky 14.6 and 19.5.

No Spirit trace crossed the severe-survivor threshold, so there is no omitted
Spirit attribution case. These windows show overlapping attackers; they do not
establish that the last listed source or cast alone caused a death. They also
do not support a pathfinding inference.
## Encounter, companion, and damage-gap audit

The audit counted event-level monster victims and owned-minion killers
separately. The victim counts below are across the 40 runs in each arm
(8 cells × 5 seeds); they are not player death counts. The output damage totals
are positive hpDamage dealt to each victim type across those same runs and are
exposure-dependent.

| Arm | Granite Titan victim kills | Boulder Thrower victim kills | Stone Eagle victim kills | Owned-minion killer kill events | Outgoing damage to Titan / Thrower / Eagle |
|---|---:|---:|---:|---:|---:|
| control | 217 | 218 | 290 | 0 | 70,063 / 17,919 / 18,009 |
| eagle-soft | 225 | 247 | 319 | 0 | 79,146 / 20,862 / 20,725 |
| titan-soft | 229 | 224 | 302 | 0 | 83,714 / 14,817 / 21,966 |

There were 0 kill events with an owned minion as the killer in every arm.
The companion-related damage and target-kill records therefore show encounter
victims, while normal kill events were attributed to the player actor. This
distinction is retained so that a change in target selection or exposure is not
mistaken for a direct balance effect.

The target-level maxDamageGapMs distribution was:

| Arm | Granite Titan gaps | Stone Eagle gaps | Boulder Thrower gaps |
|---|---|---|---|
| control | n=231; median 1.5s; p10 0.4s; p90 4.3s | n=299; median 1.0s; p10 0.3s; p90 2.0s | n=226; median 1.4s; p10 0.3s; p90 2.2s |
| eagle-soft | n=252; median 1.5s; p10 0.5s; p90 4.2s | n=325; median 1.0s; p10 0.3s; p90 2.0s | n=256; median 1.4s; p10 0.3s; p90 2.2s |
| titan-soft | n=250; median 1.5s; p10 0.4s; p90 4.2s | n=307; median 0.9s; p10 0.3s; p90 1.9s | n=231; median 1.4s; p10 0.3s; p90 2.2s |

The gap values are target damage-observation gaps, not pathfinding diagnostics.
The per-seed recovery counts above expose interrupted pulls directly. A target
still present at a 300s window end is unfinished for that trace, but that alone
does not prove it stalled; named clean TTK excludes such traces.

Across all three arms the retained event stream contained 2,615
monster-cast-start events, 2,433 cast-end events, 2,271 kill events, 53,316
damage events, 80,022 heal events, 7,574 telegraph-dodge events, and 16
player-death events. The prescribed casts observed in the combined stream were
925 Ground Slam, 747 Skyfall Rend, 551 Granite Barrier, and 392 Huge Boulder
starts.

## Cross-run context

Durability 6's selected-HP T2 Mountain control used only seeds 173, 947, and
2027. The current same-batch Durability 7 control reproduces those named-Titan
medians while adding seeds 4093 and 5579:

| Six-baseline build | Durability 6 selected-HP s173 / s947 / s2027 | Durability 7 control s173 / s947 / s2027 |
|---|---|---|
| Striker | 27.45s / 27.40s / 33.60s | 27.45s / 27.40s / 33.60s |
| Squire | 25.10s / 25.40s / 25.40s | 25.10s / 25.40s / 25.40s |
| Apprentice | 16.50s / 16.50s / 16.50s | 16.50s / 16.50s / 16.50s |
| Slinger | 13.80s / 14.55s / 13.80s | 13.80s / 14.55s / 13.80s |
| Conduit | 17.80s / 18.00s / no clean median | 17.80s / 18.00s / no clean median |
| Spirit | 15.40s / 14.70s / 14.70s | 15.40s / 14.70s / 14.70s |

Durability 6's full context is retained in
[bot-balance-durability6-report.md](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability6-report.md>).
This historical alignment is a control check only; the current same-batch
control is the primary comparator for the arm decision.

## Limitations and exit

This is synthetic prepared-combat evidence from a clean detached checkout. It
does not certify travel, acquisition, economy, client/network behavior,
browser presentation, live pacing, or human feel. Five seeds provide a
descriptive pressure screen, not a precise death-rate estimate. Lower incoming
damage can result from different exposure or an earlier death, so it is not
interpreted as a normalized damage-per-second measurement. Recovery and target
gap values are reported to make those exposure differences visible.

The experiment returned **Titan reduction** as the focused candidate. No winner
was applied, no live definition was changed, and no combined-soft trial was
invented. The next scoped step is a focused Granite Titan damage decision and
validation, followed by broader biome coverage if accepted. Cave isolated
attrition cases and T3 Cave 38–40s slow builds remain on the later-review list.
