# T1–T3 fight-duration survey — execution report

Executed 2026-09-15 from the frozen
[bot-balance-ttk-survey-operator-packet.md](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-ttk-survey-operator-packet.md>).
The generated analysis was produced first and is the primary summary source:
[analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/analysis.md>)
and [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/analysis.json>).
The tables below interpret those outputs; raw event streams were opened only
for the specific outliers and hypotheses called out in this report.

## Outcome

The survey completed all 66 cells and 198 predeclared observations with exit
code 0. There were 190 `window-ended` observations and 8 `player-died`
observations; no `failed.json` was produced. Deaths ended only their current
observation, and no replicate was retried.

The most useful result is a qualification boundary, not a target duration:

- Individual TTK falls substantially from T1 to T3 in the same-biome Cave and
  Mountain screens for every baseline class when comparing T1 with T3, although
  Squire and Slinger rise from T2 to T3 in both locations.
- T3 Volcano is a different biome/ecology as well as a higher tier. Most
  individual TTK medians remain short, but group clears become slow or censored:
  baseline Slinger clears only 2 of 5 observed swarm episodes, while baseline
  and alternate Conduit clear none of their 3 observed swarm episodes.
- The Slinger DoT alternatives emitted the expected `weapon-dot` damage and
  were slower than the on-hit-rapier baselines in every paired T2/T3 role.
  T2/T3 Conduit weapon alternatives were mixed: faster in all T2 roles, roughly
  neutral in T3 Cave/Mountain, and slower in the T3 Volcano swarm. That is a
  build/encounter screen, not a universal weapon ranking.
- The six templates remain descriptive candidates. No target TTK, monster
  balance edit, or follow-on experiment is chosen automatically.

All evidence is synthetic combat evidence from an in-process `World`: no travel,
acquisition, persistence, network/client fidelity, earned progression, normal
economy, or average-player readiness is measured. The 300-second window is a
censoring boundary, not a gameplay timeout.

## Frozen identity and execution record

| Field | Value |
|---|---|
| Source revision | `60817047ffec3065cfd9807dd09868aa08f9b2b4` |
| Source tree | `297553dc950d20b791c79cca9161a306bc29e471` |
| Detached source worktree | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/source` |
| Survey definition hash | `40158eea807ae06a5b531fe40d7ad05fb74eed79900a26503f7ee58f394f3ab1` |
| Frozen hitboxes | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Hitbox SHA256 | `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83` |
| Qualification directory | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/frozen-qualification` |
| Qualification index SHA256 | `7A2573FF3CE1FEA9FA79F795033508CDDE873A94903EBE5DCEC207D5139C9C84` |
| Instrumentation pilot | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/frozen-instrumentation-pilot` |
| Pilot index SHA256 | `A47F60E61D596AC9CB28079A8C3417E753579FC5D9E5D9D026849376CBF9EE61` |
| Mode | `run`; synthetic `true`; economy eligible `false` |
| Simulation | `dtMs=100`; `durationMs=300000`; one sequential process |
| Seeds | `173`, `947`, `2027` |
| Results root | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results` |

The detached worktree resolved the exact revision/tree and remained clean after
offline dependency installation. The shared checkout stayed untouched by the
benchmark. No `experiment:create`, Docker worker, database write, service
restart, or resource cleanup workflow was used.

Execution timing and resources recorded by the operator wrapper:

| Measurement | Value |
|---|---:|
| Start UTC | `2026-09-15T09:12:08.1885435Z` |
| End UTC | `2026-09-15T09:32:18.4785068Z` |
| Wall duration | `1210.088 s` |
| C: capacity | `999227912192 bytes` |
| C: free at start / end | `63368409088 / 63100833792 bytes` |
| Wrapper working set at start / end | `95301632 / 98344960 bytes` |

The memory values are PowerShell-wrapper snapshots; the child Node runner's
peak RSS was not persisted by the harness. No Docker resources were created.

## Measurement rules

TTK starts at the first positive player or owned-summon damage/absorption and
ends at the authoritative kill. A same-tick kill is therefore `0 ms`, not a
literal zero-duration attack. Damaged survivors at window end are censored;
observed HP regain removes a target from the clean median but remains in raw
elapsed evidence. Engagement duration includes all recorded participants and
late joins; recovery is the post-clear interval to full HP/barrier with no
incoming DoT.

The `Median clean TTK` values below are medians of available seed medians. In
the seed column, `m/cN/W` means that seed's median in seconds, `N` censored
targets, and `W=window-ended`; `D=player-died`. The cell-level `K/C` column is
killed/censored target count across its three seeds, and `Deaths` is the number
of player-death observations. A median excludes unfinished targets and observed
HP-regain targets; `0.00` is the defined same-tick window.

## Baseline class-by-tier/node table

| Tier | Role | Node | Class | Median clean TTK (s) | Seed median / censor / outcome | K/C | Deaths | Median recovery (s) |
|---|---|---|---|---:|---|---:|---:|---:|
| T1 | small-group | `node-t1-mountain-04` | Apprentice | 4.80 | `173:4.80/c2/D; 947:5.10/c1/W; 2027:4.50/c1/W` | 59/4 | 1 | 0.00 |
| T1 | small-group | `node-t1-mountain-04` | Conduit | 5.40 | `173:4.80/c1/D; 947:6.40/c3/W; 2027:5.40/c1/W` | 56/5 | 1 | 1.70 |
| T1 | small-group | `node-t1-mountain-04` | Slinger | 6.00 | `173:6.00/c0/W; 947:6.00/c0/W; 2027:6.00/c1/W` | 74/1 | 0 | 5.30 |
| T1 | small-group | `node-t1-mountain-04` | Spirit | 4.05 | `173:3.60/c1/W; 947:4.05/c0/W; 2027:4.10/c1/W` | 100/2 | 0 | 0.00 |
| T1 | small-group | `node-t1-mountain-04` | Squire | 4.40 | `173:4.40/c0/W; 947:2.20/c1/D; 2027:4.40/c0/W` | 70/1 | 1 | 6.90 |
| T1 | small-group | `node-t1-mountain-04` | Striker | 3.60 | `173:4.20/c0/W; 947:3.60/c0/W; 2027:3.60/c0/W` | 86/0 | 0 | 6.80 |
| T1 | solo | `node-t1-cave-02` | Apprentice | 5.40 | `173:5.40/c0/W; 947:5.40/c0/W; 2027:5.40/c1/W` | 66/1 | 0 | 0.00 |
| T1 | solo | `node-t1-cave-02` | Conduit | 12.55 | `173:12.55/c1/W; 947:10.10/c0/W; 2027:13.00/c0/W` | 46/1 | 0 | 4.75 |
| T1 | solo | `node-t1-cave-02` | Slinger | 7.00 | `173:7.60/c1/W; 947:7.00/c0/W; 2027:7.00/c0/W` | 58/1 | 0 | 3.30 |
| T1 | solo | `node-t1-cave-02` | Spirit | 5.40 | `173:5.40/c0/W; 947:5.40/c1/W; 2027:5.40/c1/W` | 63/2 | 0 | 6.45 |
| T1 | solo | `node-t1-cave-02` | Squire | 4.40 | `173:4.40/c1/W; 947:6.60/c1/W; 2027:4.40/c0/W` | 53/2 | 0 | 4.10 |
| T1 | solo | `node-t1-cave-02` | Striker | 4.80 | `173:4.80/c0/W; 947:6.50/c1/W; 2027:4.80/c0/W` | 58/1 | 0 | 4.00 |
| T1 | swarm | `node-t1-plains-03` | Apprentice | 2.10 | `173:2.10/c1/W; 947:2.10/c1/W; 2027:2.10/c0/W` | 193/2 | 0 | 0.00 |
| T1 | swarm | `node-t1-plains-03` | Conduit | 1.70 | `173:1.70/c0/W; 947:1.15/c0/W; 2027:1.80/c0/W` | 219/0 | 0 | 0.00 |
| T1 | swarm | `node-t1-plains-03` | Slinger | 3.00 | `173:3.00/c1/W; 947:2.20/c1/W; 2027:3.00/c1/W` | 161/3 | 0 | 0.00 |
| T1 | swarm | `node-t1-plains-03` | Spirit | 0.00 | `173:0.00/c0/W; 947:0.00/c1/W; 2027:0.00/c0/W` | 276/1 | 0 | 0.00 |
| T1 | swarm | `node-t1-plains-03` | Squire | 0.00 | `173:0.00/c0/W; 947:0.00/c0/W; 2027:0.00/c0/W` | 227/0 | 0 | 0.00 |
| T1 | swarm | `node-t1-plains-03` | Striker | 1.20 | `173:1.20/c0/W; 947:1.20/c0/W; 2027:1.20/c0/W` | 288/0 | 0 | 0.00 |
| T2 | small-group | `node-t2-mountain-04` | Apprentice | 4.00 | `173:4.00/c0/W; 947:4.10/c1/W; 2027:3.70/c0/W` | 75/1 | 0 | 6.80 |
| T2 | small-group | `node-t2-mountain-04` | Conduit | 4.35 | `173:4.30/c1/W; 947:4.35/c1/W; 2027:4.90/c2/W` | 71/4 | 0 | 1.05 |
| T2 | small-group | `node-t2-mountain-04` | Slinger | 2.90 | `173:2.90/c1/W; 947:1.80/c0/W; 2027:2.90/c0/W` | 112/1 | 0 | 0.00 |
| T2 | small-group | `node-t2-mountain-04` | Spirit | 2.80 | `173:2.80/c1/W; 947:2.80/c0/W; 2027:2.80/c1/W` | 113/2 | 0 | 0.00 |
| T2 | small-group | `node-t2-mountain-04` | Squire | 1.90 | `173:1.90/c0/W; 947:1.90/c0/W; 2027:1.90/c1/D` | 76/1 | 1 | 5.85 |
| T2 | small-group | `node-t2-mountain-04` | Striker | 3.50 | `173:3.50/c0/W; 947:5.05/c0/W; 2027:3.50/c0/W` | 73/0 | 0 | 6.70 |
| T2 | solo | `node-t2-cave-02` | Apprentice | 4.50 | `173:4.50/c0/W; 947:4.00/c0/W; 2027:4.50/c0/W` | 70/0 | 0 | 2.90 |
| T2 | solo | `node-t2-cave-02` | Conduit | 4.30 | `173:4.30/c0/W; 947:4.30/c0/W; 2027:4.25/c1/W` | 81/1 | 0 | 0.10 |
| T2 | solo | `node-t2-cave-02` | Slinger | 2.50 | `173:2.50/c1/D; 947:2.50/c1/D; 2027:2.90/c0/W` | 72/2 | 2 | 0.00 |
| T2 | solo | `node-t2-cave-02` | Spirit | 2.80 | `173:2.80/c0/W; 947:2.80/c0/W; 2027:2.80/c0/W` | 115/0 | 0 | 0.00 |
| T2 | solo | `node-t2-cave-02` | Squire | 1.90 | `173:1.90/c0/W; 947:1.90/c1/W; 2027:1.90/c0/W` | 77/1 | 0 | 2.30 |
| T2 | solo | `node-t2-cave-02` | Striker | 4.00 | `173:4.00/c0/W; 947:4.00/c0/W; 2027:4.00/c1/W` | 66/1 | 0 | 3.20 |
| T2 | swarm | `node-t2-plains-03` | Apprentice | 2.20 | `173:2.20/c0/W; 947:2.20/c1/W; 2027:2.00/c0/W` | 209/1 | 0 | 0.00 |
| T2 | swarm | `node-t2-plains-03` | Conduit | 3.35 | `173:3.40/c2/W; 947:3.35/c6/W; 2027:2.80/c0/W` | 199/8 | 0 | 0.00 |
| T2 | swarm | `node-t2-plains-03` | Slinger | 1.20 | `173:1.20/c1/W; 947:1.20/c1/W; 2027:1.20/c0/W` | 317/2 | 0 | 0.00 |
| T2 | swarm | `node-t2-plains-03` | Spirit | 1.40 | `173:1.40/c0/W; 947:1.40/c0/W; 2027:1.40/c0/W` | 267/0 | 0 | 0.00 |
| T2 | swarm | `node-t2-plains-03` | Squire | 0.00 | `173:0.00/c0/W; 947:0.00/c0/W; 2027:0.00/c0/W` | 249/0 | 0 | 0.00 |
| T2 | swarm | `node-t2-plains-03` | Striker | 2.00 | `173:2.50/c0/W; 947:2.00/c0/W; 2027:2.00/c1/W` | 241/1 | 0 | 0.00 |
| T3 | small-group | `node-t3-mountain-04` | Apprentice | 3.00 | `173:3.00/c0/W; 947:3.10/c0/W; 2027:3.00/c0/W` | 93/0 | 0 | 0.00 |
| T3 | small-group | `node-t3-mountain-04` | Conduit | 4.10 | `173:4.10/c0/W; 947:3.60/c1/W; 2027:4.15/c0/W` | 78/1 | 0 | 0.00 |
| T3 | small-group | `node-t3-mountain-04` | Slinger | 3.30 | `173:3.30/c0/W; 947:3.20/c1/W; 2027:3.40/c0/W` | 105/1 | 0 | 0.00 |
| T3 | small-group | `node-t3-mountain-04` | Spirit | 2.20 | `173:2.30/c0/W; 947:2.05/c0/W; 2027:2.20/c1/W` | 135/1 | 0 | 0.00 |
| T3 | small-group | `node-t3-mountain-04` | Squire | 2.10 | `173:1.80/c1/W; 947:2.10/c0/W; 2027:3.45/c1/W` | 93/2 | 0 | 2.80 |
| T3 | small-group | `node-t3-mountain-04` | Striker | 2.00 | `173:2.00/c0/W; 947:2.00/c1/W; 2027:2.00/c0/W` | 107/1 | 0 | 4.50 |
| T3 | solo | `node-t3-cave-02` | Apprentice | 3.00 | `173:3.00/c1/W; 947:3.00/c0/W; 2027:3.00/c1/W` | 87/2 | 0 | 1.50 |
| T3 | solo | `node-t3-cave-02` | Conduit | 4.20 | `173:4.20/c0/W; 947:4.20/c0/W; 2027:4.20/c0/W` | 84/0 | 0 | 0.70 |
| T3 | solo | `node-t3-cave-02` | Slinger | 3.00 | `173:3.05/c0/W; 947:3.00/c0/W; 2027:3.00/c1/W` | 123/1 | 0 | 0.00 |
| T3 | solo | `node-t3-cave-02` | Spirit | 2.25 | `173:2.05/c0/W; 947:2.40/c0/W; 2027:2.25/c0/W` | 147/0 | 0 | 0.00 |
| T3 | solo | `node-t3-cave-02` | Squire | 2.80 | `173:2.80/c0/W; 947:3.00/c0/W; 2027:2.80/c0/W` | 108/0 | 0 | 0.90 |
| T3 | solo | `node-t3-cave-02` | Striker | 2.00 | `173:1.95/c1/W; 947:2.00/c0/W; 2027:2.00/c0/W` | 109/1 | 0 | 0.90 |
| T3 | swarm | `node-t3-volcanic-03` | Apprentice | 2.85 | `173:2.85/c0/D; 947:3.45/c0/W; 2027:2.80/c1/W` | 107/1 | 1 | — |
| T3 | swarm | `node-t3-volcanic-03` | Conduit | 8.80 | `173:10.40/c8/W; 947:8.60/c7/W; 2027:8.80/c8/W` | 84/23 | 0 | — |
| T3 | swarm | `node-t3-volcanic-03` | Slinger | 2.95 | `173:3.00/c3/W; 947:2.95/c3/W; 2027:2.90/c4/W` | 140/10 | 0 | 0.00 |
| T3 | swarm | `node-t3-volcanic-03` | Spirit | 1.50 | `173:1.50/c2/W; 947:1.40/c1/W; 2027:1.50/c1/W` | 137/4 | 0 | — |
| T3 | swarm | `node-t3-volcanic-03` | Squire | 3.20 | `173:3.20/c0/W; 947:3.10/c0/W; 2027:3.20/c0/W` | 48/0 | 0 | 0.00 |
| T3 | swarm | `node-t3-volcanic-03` | Striker | 2.20 | `173:2.00/c0/W; 947:2.20/c0/W; 2027:3.10/c0/W` | 106/0 | 0 | 0.00 |

The `0.00` T1 swarm medians are concentrated same-tick kills, not zero-time
attacks. For example, the inspected T1 Squire seed 173 had 45 zero-TTK targets
out of 78, and the inspected T1 Spirit seed 173 had 49 out of 95; their
`firstDamageMs`, `lastDamageMs` and `killedAtMs` were equal with one damage event
for those targets. The generated `oneHitWindow` field is the correct same-tick
indicator and is not an attack-count estimate.

## Observed engagement duration and population mix

The intended role is not always the observed group role. The table reports
observed solo/small/swarm episode counts across the six baseline classes at each
tier/node. The duration columns are medians of the available per-cell medians
within each observed category; `—` means no clean clear median was available.

| Tier | Intended node/role | Observed solo / small / swarm | Clears / censored | Median clear duration (s), solo / small / swarm | Player deaths |
|---|---|---:|---:|---:|---:|
| T1 | `node-t1-cave-02` / solo | 344 / 4 / 0 | 340 / 8 | 6.20 / 16.30 / — | 0 |
| T1 | `node-t1-mountain-04` / small-group | 299 / 43 / 6 | 337 / 11 | 5.85 / 11.05 / 24.20 | 3 |
| T1 | `node-t1-plains-03` / swarm | 1079 / 133 / 1 | 1203 / 10 | 1.60 / 4.98 / 12.10 | 0 |
| T2 | `node-t2-cave-02` / solo | 486 / 0 / 0 | 481 / 5 | 3.68 / — / — | 2 |
| T2 | `node-t2-mountain-04` / small-group | 437 / 34 / 2 | 464 / 9 | 4.05 / 8.80 / 42.60 | 1 |
| T2 | `node-t2-plains-03` / swarm | 252 / 71 / 164 | 472 / 15 | 2.00 / 5.53 / 8.45 | 0 |
| T3 | `node-t3-cave-02` / solo | 660 / 2 / 0 | 656 / 6 | 3.30 / 8.25 / — | 0 |
| T3 | `node-t3-mountain-04` / small-group | 608 / 5 / 0 | 606 / 7 | 3.55 / 36.00 / — | 0 |
| T3 | `node-t3-volcanic-03` / swarm | 9 / 0 / 44 | 36 / 17 | 2.73 / — / 37.05 | 1 |

The T3 Volcano result is the clearest swarm pressure boundary: most individual
targets die in roughly 1.5–3.2 seconds for the baseline classes, but full swarm
episodes are sparse and often censored. Conduit baseline had 84 kills and 23
censored targets with no full swarm clear; its alternate had 42 kills and 19
censored targets with no full swarm clear. This is not evidence that Volcano
monster HP alone is wrong: it also contains natural population, pulling,
summon, and recovery interactions.

## Enemy-type TTK and HP

This table aggregates the generated per-type rows across cells. HP is the
authoritative maximum HP observed for that type; TTK is the range of clean
per-cell medians in seconds, omitting a cell/type that had no clean median.
`Damaged/killed/censored` and `casts started/fired` are summed across the
matching per-type rows. The linked `analysis.json` retains the cell-level and
seed-level records.

| Type | Name | Max HP | Cells | Clean TTK range (s) | Damaged / killed / censored | Casts started / fired |
|---|---|---:|---:|---:|---:|---:|
| `ash-slinger` | Ash Salamander | 1330 | 8 | 2.60–12.75 | 80 / 75 / 5 | 0 / 0 |
| `avalanche-ram` | Avalanche Ram | 610 | 8 | 1.80–6.00 | 315 / 315 / 0 | 24 / 3 |
| `boar` | Boar | 100 | 6 | 1.20–3.00 | 718 / 712 / 6 | 0 / 0 |
| `cave-brute` | Cave Brute | 250 | 6 | 5.40–8.00 | 161 / 157 / 4 | 66 / 58 |
| `cave-gargoyle` | Cave Gargoyle | 415 | 8 | 1.50–6.00 | 208 / 208 / 0 | 0 / 0 |
| `cave-lurker` | Cave Lurker | 225 | 6 | 4.20–13.40 | 191 / 187 / 4 | 0 / 0 |
| `cave-troll` | Cave Troll | 550 | 8 | 2.80–8.00 | 217 / 213 / 4 | 328 / 294 |
| `cavern-troll` | Cavern Troll | 945 | 8 | 2.75–7.30 | 284 / 281 / 3 | 323 / 321 |
| `cinder-hound` | Cinder Hound | 1440 | 8 | 3.10–19.40 | 65 / 62 / 3 | 0 / 0 |
| `cliff-hopper` | Cliff Hopper | 190 | 6 | 2.20–6.00 | 271 / 266 / 5 | 126 / 40 |
| `crag-mortar` | Crag Mortar | 685 | 8 | 1.40–6.00 | 230 / 226 / 4 | 25 / 10 |
| `crystal-gargoyle` | Crystal Gargoyle | 700 | 8 | 1.40–5.50 | 267 / 263 / 4 | 0 / 0 |
| `deep-spider` | Deep Spider | 610 | 8 | 0.70–5.20 | 269 / 267 / 2 | 0 / 0 |
| `ember-scuttler` | Ember Scuttler | 650 | 8 | 1.40–11.60 | 582 / 539 / 43 | 0 / 0 |
| `giant-spider` | Giant Spider | 350 | 8 | 1.90–5.50 | 214 / 212 / 2 | 0 / 0 |
| `granite-titan` | Granite Titan | 460 | 8 | 3.50–7.10 | 226 / 222 / 4 | 216 / 133 |
| `magma-brute` | Magma Tortoise | 2000 | 8 | 5.50–25.40 | 81 / 63 / 18 | 40 / 34 |
| `mountain-colossus` | Mountain Colossus | 850 | 8 | 2.50–7.00 | 234 / 228 / 6 | 226 / 138 |
| `peak-archer` | Boulder Thrower | 385 | 8 | 1.90–6.00 | 215 / 209 / 6 | 107 / 72 |
| `plains-slime` | Field Hare | 50 | 6 | 0.00–1.80 | 653 / 652 / 1 | 0 / 0 |
| `prairie-wolf` | Prairie Wolf | 260 | 8 | 1.90–6.50 | 345 / 338 / 7 | 0 / 0 |
| `prairie-yearling` | Prairie Yearling | 130 | 8 | 0.00–3.00 | 1028 / 1006 / 22 | 0 / 0 |
| `ridge-archer` | Ridge Ambusher | 240 | 6 | 4.20–7.00 | 187 / 179 / 8 | 171 / 145 |
| `savanna-hawk` | Savanna Hawk | 250 | 8 | 0.70–4.50 | 294 / 291 / 3 | 265 / 264 |
| `stampede-bull` | Stampede Bull | 330 | 8 | 1.20–5.50 | 283 / 280 / 3 | 0 / 0 |
| `stone-eagle` | Stone Eagle | 340 | 8 | 1.20–5.00 | 242 / 238 / 4 | 206 / 206 |

Cast opportunities were concentrated in named cast-capable enemies. Cave Brute,
Cave Troll and Cavern Troll fired most starts; Mountain Colossus, Granite Titan,
Boulder Thrower and Stone Eagle also fired. T2 Plains' Savanna Hawk fired 264
of 265 starts. In T3 Volcano, the inspected cast opportunity was almost
entirely Magma Tortoise (40 starts/34 fired); Ember Scuttler, Cinder Hound and
Ash Salamander had no cast starts in the generated per-type totals. A start that
does not fire is retained as an interrupted/not-fired opportunity, not silently
treated as an absent mechanic.

## Survival, pressure, and recovery

The following screen aggregates the baseline class cells by intended tier/node
role. `Minimum sampled HP` is the lowest one-second sample fraction across all
three seeds and six classes in that group. Incoming pressure columns use raw
summary values, including absorbed pressure separately in the underlying run
records; barrier and HP are also retained in `samples.jsonl`.

| Tier / intended role | Node | Cell-seed deaths | Minimum sampled HP fraction | Max incoming HP damage | Max single hit | Max 1s HP damage | Median recovery (s) | Recovery interruptions |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| T1 solo | `node-t1-cave-02` | 0 | 0.35 | 1932.00 | 66.00 | 66.00 | 4.05 | 9 |
| T1 small-group | `node-t1-mountain-04` | 3 | 0.00 | 1614.00 | 81.30 | 145.32 | 3.50 | 93 |
| T1 swarm | `node-t1-plains-03` | 0 | 0.94 | 157.00 | 4.00 | 8.00 | 0.00 | 7 |
| T2 solo | `node-t2-cave-02` | 2 | 0.00 | 2564.00 | 240.00 | 240.00 | 1.20 | 39 |
| T2 small-group | `node-t2-mountain-04` | 1 | 0.00 | 2223.58 | 113.00 | 165.00 | 3.45 | 139 |
| T2 swarm | `node-t2-plains-03` | 0 | 0.90 | 269.00 | 9.00 | 18.00 | 0.00 | 17 |
| T3 solo | `node-t3-cave-02` | 0 | 0.39 | 3060.00 | 206.10 | 215.10 | 0.80 | 45 |
| T3 small-group | `node-t3-mountain-04` | 0 | 0.63 | 600.00 | 90.00 | 90.00 | 0.00 | 123 |
| T3 swarm | `node-t3-volcanic-03` | 1 | 0.00 | 5636.00 | 151.00 | 192.00 | 0.00 | 0 |

The eight deaths were concentrated in T1 Mountain small-group (three), T2 Cave
solo Slinger (two), and one each in T1 Mountain Apprentice/Conduit, T2
Mountain Squire, T2 Mountain Conduit alternate, and T3 Volcano Apprentice
swarm. The two inspected T2 Slinger solo deaths both recorded a fired Cave
Troll ground slam and a 240-damage direct hit at the same simulation timestamp;
their `telegraph-dodge` result was `failure`. This is a confirmed pressure/death
trace for those observations, not a general Slinger balance verdict.

## Conduit and Slinger weapon comparisons

The alternatives change only the weapon inside each paired class/tier/role
screen. `K/C/D` means kills/censored targets/player deaths across the three
seeds. Each median is supported by the per-seed detail in the following table;
the baseline seed detail is also present in the baseline table above.

| Tier / role / node | Class | Baseline weapon -> alternate | Baseline median (s) | Alternate median (s) | Baseline K/C/D | Alternate K/C/D |
|---|---|---|---:|---:|---:|---:|
| T2 solo / `node-t2-cave-02` | Conduit | `ruinous-axe` -> `jungle-stinger-rapier` | 4.30 | 3.70 | 81/1/0 | 85/0/0 |
| T2 small / `node-t2-mountain-04` | Conduit | `ruinous-axe` -> `jungle-stinger-rapier` | 4.35 | 3.65 | 71/4/0 | 76/3/1 |
| T2 swarm / `node-t2-plains-03` | Conduit | `ruinous-axe` -> `jungle-stinger-rapier` | 3.35 | 1.90 | 199/8/0 | 240/5/0 |
| T3 solo / `node-t3-cave-02` | Conduit | `cave-cataclysm-axe` -> `jungle-venomthorn-rapier` | 4.20 | 4.45 | 84/0/0 | 82/2/0 |
| T3 small / `node-t3-mountain-04` | Conduit | `cave-cataclysm-axe` -> `jungle-venomthorn-rapier` | 4.10 | 4.20 | 78/1/0 | 77/3/0 |
| T3 swarm / `node-t3-volcanic-03` | Conduit | `cave-cataclysm-axe` -> `jungle-venomthorn-rapier` | 8.80 | 13.45 | 84/23/0 | 42/19/0 |
| T2 solo / `node-t2-cave-02` | Slinger | `jungle-stinger-rapier` -> `swamp-mirebrand` | 2.50 | 6.00 | 72/2/2 | 67/1/0 |
| T2 small / `node-t2-mountain-04` | Slinger | `jungle-stinger-rapier` -> `swamp-mirebrand` | 2.90 | 6.00 | 112/1/0 | 73/2/0 |
| T2 swarm / `node-t2-plains-03` | Slinger | `jungle-stinger-rapier` -> `swamp-mirebrand` | 1.20 | 4.00 | 317/2/0 | 193/18/0 |
| T3 solo / `node-t3-cave-02` | Slinger | `jungle-venomthorn-rapier` -> `swamp-blightbrand` | 3.00 | 6.00 | 123/1/0 | 71/3/0 |
| T3 small / `node-t3-mountain-04` | Slinger | `jungle-venomthorn-rapier` -> `swamp-blightbrand` | 3.30 | 6.00 | 105/1/0 | 81/1/0 |
| T3 swarm / `node-t3-volcanic-03` | Slinger | `jungle-venomthorn-rapier` -> `swamp-blightbrand` | 2.95 | 5.00 | 140/10/0 | 75/12/0 |

Alternate-cell seed detail:

| Cell | Seed median / censor / outcome |
|---|---|
| T2 Conduit solo | `173:4.20/c0/W; 947:3.70/c0/W; 2027:3.70/c0/W` |
| T2 Conduit small | `173:3.80/c1/W; 947:3.65/c2/D; 2027:3.35/c0/W` |
| T2 Conduit swarm | `173:1.90/c0/W; 947:1.90/c5/W; 2027:2.00/c0/W` |
| T3 Conduit solo | `173:4.50/c1/W; 947:4.45/c0/W; 2027:4.40/c1/W` |
| T3 Conduit small | `173:4.20/c1/W; 947:3.80/c1/W; 2027:4.45/c1/W` |
| T3 Conduit swarm | `173:10.50/c8/W; 947:13.45/c6/W; 2027:15.85/c5/W` |
| T2 Slinger solo | `173:6.00/c0/W; 947:6.00/c0/W; 2027:6.00/c1/W` |
| T2 Slinger small | `173:6.00/c1/W; 947:6.00/c0/W; 2027:5.55/c1/W` |
| T2 Slinger swarm | `173:4.75/c5/W; 947:4.00/c3/W; 2027:3.75/c10/W` |
| T3 Slinger solo | `173:5.60/c1/W; 947:6.00/c1/W; 2027:7.00/c1/W` |
| T3 Slinger small | `173:7.00/c0/W; 947:6.00/c1/W; 2027:6.00/c0/W` |
| T3 Slinger swarm | `173:5.80/c8/W; 947:5.00/c1/W; 2027:4.80/c3/W` |

### Hypothesis event audit

Raw `events.jsonl` confirms the Slinger alternate is a real weapon-DoT path:
across all three seeds, alternate `weapon-dot` damage-event counts were 427,
427 and 739 for T2 solo, small and swarm, and 420, 533 and 452 for T3 solo,
small and swarm. The corresponding baseline cells emitted zero
`weapon-dot` events. The alternate also emitted the ordinary direct/AoE events;
the comparison therefore measures the complete build behavior, not only the
DoT ticks.

Conduit raw streams expose `conduit-arm`, `conduit-delivery` and
`conduit-secondary-damage` events in T2 and in most group/swarm screens. The
T2 alternate changed secondary-event totals in solo (11 -> 11, same), small
(61 -> 45, fewer) and swarm (83 -> 104, more), while its TTK improved in all
three roles. T3 solo baseline emitted no conduit-adapter events in the retained
stream while its alternate emitted five deliveries/secondary events in the
inspected seed; this node/population exposure difference prevents a clean
on-hit proc-DPS attribution. No Conduit weapon conclusion is promoted beyond
the paired descriptive medians.

## Specific raw outliers inspected

| Question | Retained raw evidence |
|---|---|
| Same-tick `0 ms` T1 swarm kills | [T1 Squire seed 173 summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t1-squire-swarm-baseline-s173/summary.json>) and [events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t1-squire-swarm-baseline-s173/events.jsonl>); [T1 Spirit seed 173 summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t1-spirit-swarm-baseline-s173/summary.json>) and [events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t1-spirit-swarm-baseline-s173/events.jsonl>) |
| T2 Slinger solo deaths | [seed 173 summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t2-slinger-solo-baseline-s173/summary.json>) and [events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t2-slinger-solo-baseline-s173/events.jsonl>); [seed 947 summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t2-slinger-solo-baseline-s947/summary.json>) and [events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t2-slinger-solo-baseline-s947/events.jsonl>) |
| T2 alternate Slinger swarm censoring | [seed 173 summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t2-slinger-swarm-weapon-alt-s173/summary.json>) and [events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t2-slinger-swarm-weapon-alt-s173/events.jsonl>) |
| T3 Volcano Conduit swarm censoring | [baseline seed 173 summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t3-conduit-swarm-baseline-s173/summary.json>) and [events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t3-conduit-swarm-baseline-s173/events.jsonl>); [alternate seed 947 summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t3-conduit-swarm-weapon-alt-s947/summary.json>) and [events](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/ttk-t3-conduit-swarm-weapon-alt-s947/events.jsonl>) |

The inspected T3 Conduit baseline seed ended at 300,000 ms with one active
episode, 35 damaged targets, 27 kills and 8 censored targets while the player
remained alive at 0.603 HP fraction. The alternate seed ended at the same
window with 13 damaged targets, 7 kills and 6 censored targets at 0.912 HP
fraction. These are censored slow/low-engagement outcomes, not silent success
or proof of an enemy reset.

## Initial rosters, casts, and evidence limits

The run index contains 27 tier/node/seed roster groups. For each group, all
class variants shared the same `initialRosterHash`; the verification found zero
mismatch groups. The three fixed seeds still consume subsequent randomness
differently as builds behave differently, so matching initial rosters do not
make the whole event stream identical.

No browser playtest or full game test was run for this tooling execution. The
benchmark covers emitted server combat casts, not every passive mechanic.
Monster HP, encounter design, target TTK, or the proposed ground-slam/AoE
design should not be changed from this survey alone. The earlier Volcano
farming-inactivity question and Swamp T3 viability remain separate open
questions.

## Artifact verification

The root contains 797 files: manifest, completion marker, generated analysis,
the aggregate run index, and 198 run artifact sets containing events, samples,
ready records and summaries.

| Artifact | SHA256 |
|---|---|
| [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/manifest.json>) | `91AFBEEE1E0E109AFCD864AC3C3AAB7341F6FBC7B702AB3D37269D4E605142A7` |
| [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/complete.json>) | `D1BB5A0112F56A8AAF73DBB18A1178EF1FA7C164C29232E6D3D5BE0C8D018A70` |
| [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/analysis.json>) | `4CD254053F414E6183CFE8E2F4880B802005C2ED322D5A84B5BFA06C65DC5033` |
| [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/analysis.md>) | `6DDB25489A74921C0FEAFC488267EA2FBBF2BA2F5354B4E601C0D7DD01827FB6` |
| [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/ttk-survey-20260915/results/index.json>) | `3BA5D00540D5993C750648174308AE5800076E7ED73BE18B4836A1F0EFCF78E8` |

## Decision for the campaign

Treat this as a completed descriptive TTK survey and qualification input:

- Keep the six templates provisional. T1/T2/T3 Cave and Mountain medians are
  useful baseline bands, with explicit censor/death and recovery context.
- Do not rank Slinger or Conduit alternatives from successful TTK alone. Slinger
  DoT alternatives are slower and more censored here; Conduit alternatives are
  mixed and event exposure is not uniform enough for a proc-cause claim.
- Treat T3 Volcano swarms as the current slow-build qualification boundary, not
  an automatic monster-HP defect. Conduit requires a mechanics/build review
  before any balance decision; the high censored count is the primary signal.
- Keep target-duration selection, the ground-slam/AoE option, Swamp viability,
  Volcano farming inactivity, and all balance edits for discussion after this
  evidence. No follow-on experiment was launched by this packet.
