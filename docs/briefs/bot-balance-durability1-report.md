# Durability 1 — broad T3 HP response trial — execution report

Executed 2026-09-15 from the frozen
[bot-balance-durability1-operator-packet.md](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability1-operator-packet.md>).
The generated analysis was produced first and is the primary summary source:
[analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/analysis.md>)
and [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/analysis.json>).
The tables below interpret those outputs. Raw event and sample streams were
opened only for the inactivity/death outliers called out in this report.

## Outcome

The trial completed all 192 cells and 576 predeclared observations with exit
code 0. There were 563 window-ended observations and 13 player-death
observations. No failed.json was produced, no replicate was retried, and all
declared deaths advanced to the next cell.

The descriptive result is a response screen, not a balance verdict:

- Enemy-type evidence shows the HP overlays landed as intended. Cave,
  Mountain, Swamp, Tundra and the Desert controllers show progressively longer
  clean TTK bands; Jungle and Volcano show smaller but visible type-level
  lifetime changes. Desert Sandweaver/Gilded Scarab HP stayed unchanged.
- At class/build level, +25%/+50% HP usually lengthened TTK in Cave, Mountain,
  Swamp, Tundra and Desert. Tundra high contains extreme but real Glacier Bear
  lifetimes; the separate movement/inactivity audit prevents treating every
  long wall interval as combat performance.
- Slinger alternatives remained slower and more censored than the on-hit
  baseline in every T3 node/treatment. Conduit alternatives were mixed in
  Cave, Mountain, Swamp, Jungle and Desert, but were consistently slower and
  more censored in the Volcano screen.
- T3 Desert and Volcano group engagements were sparse and frequently
  non-clearing; Volcano had long end-of-observation gaps with targetless
  movement/intent states. Those are qualification boundaries and possible
  pacing contamination, not proof that the HP treatment is safe.

All evidence is synthetic in-process World combat: no travel, acquisition,
earned progression, persistence, economy, network/client fidelity, browser
feel, or average-player readiness is measured. The 300-second window is a
censoring boundary, not a gameplay timeout. No live definitions, damage,
defenses, rewards, population or mechanics were edited.

## Frozen identity and execution record

| Field | Value |
|---|---|
| Source revision | bc559b0228ed4a2d08b1f0f721d99ed873d6056a |
| Source tree | 705adbc5661fd99b507685e296ecd5965db0db15 |
| Detached source worktree | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/source |
| Untreated definitions hash | 40158eea807ae06a5b531fe40d7ad05fb74eed79900a26503f7ee58f394f3ab1 |
| Frozen hitboxes | C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json |
| Hitbox SHA256 | 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83 |
| Zero-tick qualification | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability-trial/frozen-qualification |
| Qualification index SHA256 | 700C133C65FCC26EBEF55C137257810CB9CBC841061AA5078AD7A16C7008FFA6 |
| Mode / trial | run / durability |
| Synthetic / economy eligible | true / false |
| Simulation | dtMs=100; durationMs=300000; one sequential process |
| Seeds | 173, 947, 2027 |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results |

The isolated checkout resolved the exact revision/tree and remained clean
after offline dependency installation. The shared checkout was not used by
the runner. No Docker worker, experiment lease, database write, service
restart, or cleanup workflow was used.

| Measurement | Value |
|---|---:|
| Start UTC | 2026-09-15T10:23:16.6873047Z |
| End UTC | 2026-09-15T11:07:57.5587035Z |
| Wall duration | 2680.871 s (44m 40.871s) |
| C: capacity | 999227912192 bytes |
| C: free at start / end | 62639349760 / 61816385536 bytes |
| Wrapper working set at start / end | 91136000 / 94355456 bytes |
| Results root files / run directories | 5 / 576 |
| Recursive result files | 2309 |

The memory values are PowerShell-wrapper snapshots; the child Node runner's
peak RSS was not persisted by the harness. The packet's 2 GiB RSS and
four-hour batch ceilings therefore remain stated harness constraints, not
independent peak-RSS measurements from this invocation.

## Trial design and measurement rules

The 168 T3 cells are seven natural biome nodes × eight builds (six baselines
plus Slinger and Conduit weapon alternatives) × three treatments. The 24
untreated T1/T2 Cave/Mountain cells are reference anchors. Each cell has the
three fixed seeds, so every cell-level median below is a median of available
seed medians, not a pooled median of hundreds of independent kills.

T3 treatments are control, hp-low, and hp-high. Cave, Mountain, Swamp, Tundra
and Desert controllers use +25%/+50% definition HP; Jungle and Volcano use
+10%/+20%. Desert treatment applies only to Dune Stalker and Desert Basilisk.
Sandweaver remains at control HP. HP rounds to the nearest integer before
normal spawn scaling.

TTK starts at the first positive player or owned-summon damage and ends at the
authoritative kill. A same-tick kill is 0 ms. A damaged survivor at window end
is censored. An observed HP-regain target is excluded from the clean median
but remains in raw elapsed evidence. Engagements include all participants and
late joins and are not authored-pack clears. The seed notation is
seed:medianTTK/cN/outcome, where W is window-ended and D is player-died; cN is
the censored target count for that seed. K/C/D in cell tables is
killed/censored/player-death observations. The generated JSON also retains
per-seed p10/p90, minimum HP, largest hit and one-second damage.

## Qualification and HP-overlay integrity

The preparation check covered 112 T3 build/node treatment-control pairs, or
336 seed-level pairings for each of hp-low and hp-high:

- geometryRosterHash matched in 336/336 pairings;
- initial roster identities and positions matched in 336/336 pairings;
- HP-inclusive initialRosterHash differed in 336/336 treated pairings, as
  expected;
- all 1008 listed enemy-type treatment groups had the expected actual spawned
  HP change; no unlisted enemy type changed;
- ready.hpTreatment before/after values matched the frozen overlay definitions
  and the initialRoster actual HP showed the same treatment after normal spawn
  scaling;
- the Desert Sandweaver/Gilded Scarab actual spawned HP was unchanged in all
  48 Desert treatment-control seed pairings.

The generated [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/analysis.md>)
contains the complete 192-cell table. The following enemy-type table comes
before node-wide aggregates, as required. It aggregates each T3 node/treatment
across its eight builds and 24 seed observations. HP is actual spawned
initialRoster.maxHp; K/C is total killed/censored targets; the TTK field is
the range of cell-level clean-median TTK values; casts are starts/fired.

## Enemy-type results

| Node | Enemy | Control | HP-low | HP-high |
|---|---|---|---|---|
| node-t3-cave-02 | Cavern Troll | HP 945 · K/C 281/3 · TTK 2.75–7.30s · casts 323/321 | HP 1181 · K/C 239/4 · TTK 3.65–9.00s · casts 277/275 | HP 1418 · K/C 212/2 · TTK 4.90–10.90s · casts 257/257 |
| node-t3-cave-02 | Crystal Gargoyle | HP 700 · K/C 263/4 · TTK 1.40–5.50s · casts 0/0 | HP 875 · K/C 226/1 · TTK 1.50–6.40s · casts 0/0 | HP 1050 · K/C 203/2 · TTK 2.80–8.00s · casts 0/0 |
| node-t3-cave-02 | Deep Spider | HP 610 · K/C 267/2 · TTK 0.70–5.20s · casts 0/0 | HP 763 · K/C 248/3 · TTK 1.80–6.00s · casts 0/0 | HP 915 · K/C 226/2 · TTK 1.80–7.00s · casts 0/0 |
| node-t3-mountain-04 | Avalanche Ram | HP 610 · K/C 315/0 · TTK 1.80–6.00s · casts 24/3 | HP 763 · K/C 269/2 · TTK 2.30–6.80s · casts 37/17 | HP 915 · K/C 246/3 · TTK 2.70–8.00s · casts 44/37 |
| node-t3-mountain-04 | Crag Mortar | HP 685 · K/C 226/4 · TTK 1.40–6.00s · casts 25/10 | HP 856 · K/C 200/1 · TTK 1.40–7.00s · casts 40/19 | HP 1028 · K/C 189/4 · TTK 3.30–9.00s · casts 55/51 |
| node-t3-mountain-04 | Mountain Colossus | HP 850 · K/C 228/6 · TTK 2.50–7.00s · casts 226/138 | HP 1063 · K/C 221/4 · TTK 3.40–10.00s · casts 224/114 | HP 1275 · K/C 187/4 · TTK 3.55–10.50s · casts 217/134 |
| node-t3-swamp-03 | Bog Lurker | HP 490 · K/C 282/4 · TTK 1.20–5.00s · casts 220/209 | HP 613 · K/C 232/3 · TTK 1.40–5.20s · casts 184/180 | HP 735 · K/C 170/4 · TTK 1.65–6.00s · casts 136/133 |
| node-t3-swamp-03 | Mire Hexer | HP 510 · K/C 349/3 · TTK 1.20–4.80s · casts 298/240 | HP 638 · K/C 279/3 · TTK 1.40–4.50s · casts 256/224 | HP 765 · K/C 243/6 · TTK 1.60–6.00s · casts 258/247 |
| node-t3-swamp-03 | Plague-Shell Snapper | HP 580 · K/C 394/3 · TTK 3.60–6.85s · casts 367/335 | HP 725 · K/C 339/8 · TTK 4.25–7.80s · casts 331/330 | HP 870 · K/C 295/8 · TTK 5.60–8.60s · casts 301/298 |
| node-t3-tundra-03 | Frost Lurker | HP 1093 · K/C 198/3 · TTK 3.20–9.50s · casts 165/165 | HP 1366 · K/C 153/5 · TTK 4.20–12.00s · casts 128/128 | HP 1639 · K/C 125/2 · TTK 5.10–13.30s · casts 123/122 |
| node-t3-tundra-03 | Glacier Bear | HP 1725 · K/C 169/7 · TTK 5.10–19.00s · casts 0/0 | HP 2156 · K/C 162/8 · TTK 7.20–24.00s · casts 0/0 | HP 2588 · K/C 103/12 · TTK 8.70–144.20s · casts 0/0 |
| node-t3-tundra-03 | Rime Caster | HP 1012 · K/C 174/2 · TTK 2.80–8.30s · casts 2/1 | HP 1265 · K/C 146/3 · TTK 3.80–11.20s · casts 8/3 | HP 1518 · K/C 112/2 · TTK 4.80–12.40s · casts 17/9 |
| node-t3-desert-03 | Desert Basilisk | HP 1552 · K/C 168/4 · TTK 4.90–21.60s · casts 168/142 | HP 1941 · K/C 147/2 · TTK 6.70–24.40s · casts 184/163 | HP 2329 · K/C 132/3 · TTK 8.70–27.80s · casts 200/177 |
| node-t3-desert-03 | Dune Stalker | HP 1552 · K/C 157/6 · TTK 4.80–20.10s · casts 199/188 | HP 1941 · K/C 139/10 · TTK 6.20–23.35s · casts 232/225 | HP 2329 · K/C 138/6 · TTK 7.70–25.40s · casts 247/230 |
| node-t3-desert-03 | Gilded Scarab (Sandweaver) | HP 587 · K/C 278/33 · TTK 2.10–6.40s · casts 196/158 | HP 587 · K/C 232/28 · TTK 1.50–5.10s · casts 126/99 | HP 587 · K/C 213/34 · TTK 1.80–9.30s · casts 109/89 |
| node-t3-jungle-03 | Canopy Chameleon | HP 828 · K/C 243/2 · TTK 2.15–6.80s · casts 126/66 | HP 911 · K/C 202/1 · TTK 2.45–7.00s · casts 103/59 | HP 994 · K/C 171/3 · TTK 2.50–8.55s · casts 105/70 |
| node-t3-jungle-03 | Jungle Stalker | HP 908 · K/C 234/3 · TTK 2.50–7.65s · casts 0/0 | HP 999 · K/C 201/7 · TTK 2.55–10.00s · casts 0/0 | HP 1090 · K/C 186/4 · TTK 2.80–9.25s · casts 0/0 |
| node-t3-jungle-03 | Silverback | HP 1202 · K/C 191/6 · TTK 3.30–16.10s · casts 0/0 | HP 1323 · K/C 168/6 · TTK 3.70–15.60s · casts 0/0 | HP 1442 · K/C 147/7 · TTK 3.70–17.85s · casts 0/0 |
| node-t3-volcanic-03 | Ash Salamander | HP 1330 · K/C 75/5 · TTK 2.60–12.75s · casts 0/0 | HP 1463 · K/C 72/8 · TTK 3.00–12.20s · casts 0/0 | HP 1596 · K/C 64/11 · TTK 3.50–17.75s · casts 0/0 |
| node-t3-volcanic-03 | Cinder Hound | HP 1440 · K/C 62/3 · TTK 3.10–19.40s · casts 0/0 | HP 1584 · K/C 57/5 · TTK 3.90–20.85s · casts 0/0 | HP 1728 · K/C 51/5 · TTK 3.80–22.10s · casts 0/0 |
| node-t3-volcanic-03 | Ember Scuttler | HP 650 · K/C 539/43 · TTK 1.40–11.60s · casts 0/0 | HP 715 · K/C 455/56 · TTK 1.40–9.80s · casts 0/0 | HP 780 · K/C 511/34 · TTK 1.40–14.10s · casts 0/0 |
| node-t3-volcanic-03 | Magma Tortoise | HP 2000 · K/C 63/18 · TTK 5.50–25.40s · casts 40/34 | HP 2200 · K/C 53/11 · TTK 6.70–26.75s · casts 40/34 | HP 2400 · K/C 53/22 · TTK 7.80–31.60s · casts 38/32 |

## T3 class/build treatment results

Each row compares the same node, class, weapon path and seed set. Values are
median clean TTK in seconds, followed by delta from control in parentheses and
cell-level K/C/D. Baseline Slinger uses the on-hit rapier and baseline Conduit
uses the axe; the alternate rows use the packet's Slinger DoT and Conduit
on-hit alternatives.

| Node | Class/build | Control | HP-low | HP-high |
|---|---|---|---|---|
| node-t3-cave-02 | Striker baseline | 2.00; 109/1/0 | 2.40 (+0.40); 100/1/0 | 2.80 (+0.80); 92/0/0 |
| node-t3-cave-02 | Squire baseline | 2.80; 108/0/0 | 1.80 (-1.00); 101/0/0 | 3.60 (+0.80); 89/0/0 |
| node-t3-cave-02 | Apprentice baseline | 3.00; 87/2/0 | 4.20 (+1.20); 77/2/0 | 4.50 (+1.50); 70/0/0 |
| node-t3-cave-02 | Slinger baseline | 3.00; 123/1/0 | 3.80 (+0.80); 98/2/0 | 3.60 (+0.60); 97/0/0 |
| node-t3-cave-02 | Slinger alternate | 6.00; 71/3/0 | 6.80 (+0.80); 67/0/0 | 8.00 (+2.00); 58/1/0 |
| node-t3-cave-02 | Conduit baseline | 4.20; 84/0/0 | 5.15 (+0.95); 71/1/0 | 6.50 (+2.30); 62/2/0 |
| node-t3-cave-02 | Conduit alternate | 4.45; 82/2/0 | 6.45 (+2.00); 68/1/0 | 6.80 (+2.35); 60/1/0 |
| node-t3-cave-02 | Spirit baseline | 2.25; 147/0/0 | 2.80 (+0.55); 131/1/0 | 3.50 (+1.25); 113/2/0 |
| node-t3-mountain-04 | Striker baseline | 2.00; 107/1/0 | 2.50 (+0.50); 103/1/0 | 3.40 (+1.40); 83/0/0 |
| node-t3-mountain-04 | Squire baseline | 2.10; 93/2/0 | 3.40 (+1.30); 83/0/0 | 4.20 (+2.10); 74/1/0 |
| node-t3-mountain-04 | Apprentice baseline | 3.00; 93/0/0 | 4.50 (+1.50); 86/1/0 | 4.50 (+1.50); 86/2/0 |
| node-t3-mountain-04 | Slinger baseline | 3.30; 105/1/0 | 4.00 (+0.70); 98/1/0 | 4.40 (+1.10); 93/1/0 |
| node-t3-mountain-04 | Slinger alternate | 6.00; 81/1/0 | 7.00 (+1.00); 68/2/0 | 8.00 (+2.00); 61/2/0 |
| node-t3-mountain-04 | Conduit baseline | 4.10; 78/1/0 | 5.90 (+1.80); 65/0/0 | 6.20 (+2.10); 63/2/0 |
| node-t3-mountain-04 | Conduit alternate | 4.20; 77/3/0 | 5.50 (+1.30); 62/1/0 | 6.20 (+2.00); 52/1/0 |
| node-t3-mountain-04 | Spirit baseline | 2.20; 135/1/0 | 2.90 (+0.70); 125/1/0 | 3.50 (+1.30); 110/2/0 |
| node-t3-swamp-03 | Striker baseline | 1.50; 117/1/0 | 2.30 (+0.80); 77/1/0 | 3.70 (+2.20); 52/2/0 |
| node-t3-swamp-03 | Squire baseline | 1.60; 120/0/0 | 2.30 (+0.70); 72/1/0 | 3.50 (+1.90); 25/1/0 |
| node-t3-swamp-03 | Apprentice baseline | 2.85; 122/3/0 | 3.00 (+0.15); 117/1/0 | 4.50 (+1.65); 109/3/0 |
| node-t3-swamp-03 | Slinger baseline | 2.80; 140/1/0 | 3.20 (+0.40); 124/1/0 | 3.80 (+1.00); 117/2/0 |
| node-t3-swamp-03 | Slinger alternate | 5.00; 106/2/0 | 5.20 (+0.20); 100/2/0 | 6.00 (+1.00); 84/4/0 |
| node-t3-swamp-03 | Conduit baseline | 2.60; 127/1/0 | 3.45 (+0.85); 109/3/0 | 4.50 (+1.90); 99/2/0 |
| node-t3-swamp-03 | Conduit alternate | 3.00; 120/1/0 | 3.70 (+0.70); 101/1/0 | 4.20 (+1.20); 88/2/0 |
| node-t3-swamp-03 | Spirit baseline | 1.40; 173/1/0 | 1.70 (+0.30); 150/4/0 | 2.50 (+1.10); 134/2/0 |
| node-t3-jungle-03 | Striker baseline | 2.50; 77/0/0 | 3.00 (+0.50); 69/0/0 | 3.00 (+0.50); 55/0/0 |
| node-t3-jungle-03 | Squire baseline | 3.60; 73/0/0 | 4.40 (+0.80); 79/1/0 | 3.60 (+0.00); 77/1/0 |
| node-t3-jungle-03 | Apprentice baseline | 4.40; 92/2/0 | 4.50 (+0.10); 69/0/0 | 4.60 (+0.20); 62/0/0 |
| node-t3-jungle-03 | Slinger baseline | 4.00; 75/1/0 | 4.10 (+0.10); 65/1/0 | 4.30 (+0.30); 77/1/0 |
| node-t3-jungle-03 | Slinger alternate | 7.00; 78/2/0 | 8.40 (+1.40); 76/3/0 | 8.50 (+1.50); 57/1/0 |
| node-t3-jungle-03 | Conduit baseline | 8.20; 71/1/0 | 9.65 (+1.45); 62/4/0 | 8.65 (+0.45); 62/2/0 |
| node-t3-jungle-03 | Conduit alternate | 7.40; 64/4/0 | 9.40 (+2.00); 63/4/0 | 11.30 (+3.90); 45/9/1 |
| node-t3-jungle-03 | Spirit baseline | 3.00; 138/1/0 | 2.80 (-0.20); 88/1/0 | 3.45 (+0.45); 69/0/0 |
| node-t3-tundra-03 | Striker baseline | 3.20; 77/1/0 | 4.20 (+1.00); 72/2/0 | 5.05 (+1.85); 71/2/0 |
| node-t3-tundra-03 | Squire baseline | 4.90; 67/2/0 | 6.90 (+2.00); 53/3/0 | 7.60 (+2.70); 47/1/0 |
| node-t3-tundra-03 | Apprentice baseline | 4.75; 76/1/0 | 6.20 (+1.45); 61/1/0 | 7.50 (+2.75); 42/2/2 |
| node-t3-tundra-03 | Slinger baseline | 4.40; 80/2/0 | 6.55 (+2.15); 72/1/0 | 7.50 (+3.10); 64/2/0 |
| node-t3-tundra-03 | Slinger alternate | 10.00; 45/2/0 | 16.85 (+6.85); 36/3/0 | 13.15 (+3.15); 31/2/1 |
| node-t3-tundra-03 | Conduit baseline | 7.40; 54/2/0 | 9.70 (+2.30); 45/2/0 | 11.40 (+4.00); 9/3/0 |
| node-t3-tundra-03 | Conduit alternate | 7.50; 53/1/0 | 12.00 (+4.50); 44/2/0 | 82.55 (+75.05); 7/3/0 |
| node-t3-tundra-03 | Spirit baseline | 3.60; 89/1/0 | 5.00 (+1.40); 78/2/0 | 5.70 (+2.10); 69/1/0 |
| node-t3-desert-03 | Striker baseline | 5.15; 111/4/0 | 6.55 (+1.40); 89/3/0 | 8.30 (+3.15); 86/1/0 |
| node-t3-desert-03 | Squire baseline | 8.20; 90/2/0 | 8.10 (-0.10); 89/2/0 | 9.60 (+1.40); 78/2/0 |
| node-t3-desert-03 | Apprentice baseline | 7.40; 81/3/0 | 8.40 (+1.00); 50/6/1 | 10.50 (+3.10); 64/7/0 |
| node-t3-desert-03 | Slinger baseline | 7.30; 91/5/0 | 8.70 (+1.40); 77/10/0 | 10.10 (+2.80); 68/6/0 |
| node-t3-desert-03 | Slinger alternate | 12.90; 51/11/0 | 15.00 (+2.10); 48/7/0 | 18.00 (+5.10); 42/10/0 |
| node-t3-desert-03 | Conduit baseline | 19.60; 42/7/0 | 21.70 (+2.10); 39/7/0 | 25.00 (+5.40); 33/7/0 |
| node-t3-desert-03 | Conduit alternate | 20.05; 38/9/0 | 22.30 (+2.25); 36/4/0 | 25.60 (+5.55); 34/4/0 |
| node-t3-desert-03 | Spirit baseline | 5.00; 99/2/0 | 6.80 (+1.80); 90/1/0 | 8.40 (+3.40); 78/6/0 |
| node-t3-volcanic-03 | Striker baseline | 2.20; 106/0/0 | 3.00 (+0.80); 44/0/0 | 2.60 (+0.40); 48/0/0 |
| node-t3-volcanic-03 | Squire baseline | 3.20; 48/0/0 | 3.20 (+0.00); 68/0/0 | 3.90 (+0.70); 68/0/0 |
| node-t3-volcanic-03 | Apprentice baseline | 2.85; 107/1/1 | 3.00 (+0.15); 90/2/0 | 3.10 (+0.25); 90/3/0 |
| node-t3-volcanic-03 | Slinger baseline | 2.95; 140/10/0 | 3.30 (+0.35); 122/15/0 | 3.30 (+0.35); 121/12/0 |
| node-t3-volcanic-03 | Slinger alternate | 5.00; 75/12/0 | 5.00 (+0.00); 89/16/0 | 5.80 (+0.80); 83/12/0 |
| node-t3-volcanic-03 | Conduit baseline | 8.80; 84/23/0 | 9.15 (+0.35); 59/23/0 | 9.80 (+1.00); 78/23/0 |
| node-t3-volcanic-03 | Conduit alternate | 13.45; 42/19/0 | 14.05 (+0.60); 56/21/0 | 14.60 (+1.15); 51/19/0 |
| node-t3-volcanic-03 | Spirit baseline | 1.50; 137/4/0 | 1.50 (+0.00); 109/3/1 | 1.50 (+0.00); 140/3/0 |

The complete seed-level first-damage-to-kill medians, censor counts and
observation outcomes for all 168 T3 cells are listed below. A long or
non-monotonic cell median is retained rather than smoothed away.

| Node | Class/build | Control seeds | HP-low seeds | HP-high seeds |
|---|---|---|---|---|
| node-t3-cave-02 | Striker baseline | 173:1.95/c1/W; 947:2.00/c0/W; 2027:2.00/c0/W | 173:2.10/c1/W; 947:2.40/c0/W; 2027:2.50/c0/W | 173:2.80/c0/W; 947:2.95/c0/W; 2027:2.80/c0/W |
| node-t3-cave-02 | Squire baseline | 173:2.80/c0/W; 947:3.00/c0/W; 2027:2.80/c0/W | 173:1.80/c0/W; 947:3.25/c0/W; 2027:1.80/c0/W | 173:3.20/c0/W; 947:3.60/c0/W; 2027:3.60/c0/W |
| node-t3-cave-02 | Apprentice baseline | 173:3.00/c1/W; 947:3.00/c0/W; 2027:3.00/c1/W | 173:4.20/c1/W; 947:4.40/c0/W; 2027:3.45/c1/W | 173:4.50/c0/W; 947:4.50/c0/W; 2027:4.50/c0/W |
| node-t3-cave-02 | Slinger baseline | 173:3.05/c0/W; 947:3.00/c0/W; 2027:3.00/c1/W | 173:3.85/c0/W; 947:3.80/c1/W; 2027:3.60/c1/W | 173:3.60/c0/W; 947:3.90/c0/W; 2027:3.60/c0/W |
| node-t3-cave-02 | Slinger alternate | 173:5.60/c1/W; 947:6.00/c1/W; 2027:7.00/c1/W | 173:7.00/c0/W; 947:6.80/c0/W; 2027:6.40/c0/W | 173:8.00/c1/W; 947:8.80/c0/W; 2027:8.00/c0/W |
| node-t3-cave-02 | Conduit baseline | 173:4.20/c0/W; 947:4.20/c0/W; 2027:4.20/c0/W | 173:5.10/c1/W; 947:6.60/c0/W; 2027:5.15/c0/W | 173:6.50/c1/W; 947:6.40/c0/W; 2027:6.60/c1/W |
| node-t3-cave-02 | Conduit alternate | 173:4.50/c1/W; 947:4.45/c0/W; 2027:4.40/c1/W | 173:5.65/c0/W; 947:6.45/c1/W; 2027:7.25/c0/W | 173:6.80/c0/W; 947:8.80/c1/W; 2027:6.80/c0/W |
| node-t3-cave-02 | Spirit baseline | 173:2.05/c0/W; 947:2.40/c0/W; 2027:2.25/c0/W | 173:2.80/c1/W; 947:2.50/c0/W; 2027:2.80/c0/W | 173:3.50/c1/W; 947:3.50/c0/W; 2027:3.10/c1/W |
| node-t3-mountain-04 | Striker baseline | 173:2.00/c0/W; 947:2.00/c1/W; 2027:2.00/c0/W | 173:2.50/c0/W; 947:2.50/c1/W; 2027:2.50/c0/W | 173:3.55/c0/W; 947:3.30/c0/W; 2027:3.40/c0/W |
| node-t3-mountain-04 | Squire baseline | 173:1.80/c1/W; 947:2.10/c0/W; 2027:3.45/c1/W | 173:3.40/c0/W; 947:4.60/c0/W; 2027:3.00/c0/W | 173:3.95/c0/W; 947:4.30/c1/W; 2027:4.20/c0/W |
| node-t3-mountain-04 | Apprentice baseline | 173:3.00/c0/W; 947:3.10/c0/W; 2027:3.00/c0/W | 173:4.40/c1/W; 947:4.50/c0/W; 2027:4.50/c0/W | 173:4.50/c1/W; 947:4.75/c0/W; 2027:4.50/c1/W |
| node-t3-mountain-04 | Slinger baseline | 173:3.30/c0/W; 947:3.20/c1/W; 2027:3.40/c0/W | 173:4.00/c0/W; 947:3.80/c1/W; 2027:4.00/c0/W | 173:4.40/c0/W; 947:4.50/c1/W; 2027:4.15/c0/W |
| node-t3-mountain-04 | Slinger alternate | 173:7.00/c0/W; 947:6.00/c1/W; 2027:6.00/c0/W | 173:7.00/c0/W; 947:7.00/c1/W; 2027:7.00/c1/W | 173:8.60/c0/W; 947:8.00/c1/W; 2027:8.00/c1/W |
| node-t3-mountain-04 | Conduit baseline | 173:4.10/c0/W; 947:3.60/c1/W; 2027:4.15/c0/W | 173:5.90/c0/W; 947:6.00/c0/W; 2027:5.20/c0/W | 173:7.50/c1/W; 947:5.80/c0/W; 2027:6.20/c1/W |
| node-t3-mountain-04 | Conduit alternate | 173:4.20/c1/W; 947:3.80/c1/W; 2027:4.45/c1/W | 173:5.50/c0/W; 947:5.00/c1/W; 2027:5.60/c0/W | 173:7.80/c1/W; 947:6.10/c0/W; 2027:6.20/c0/W |
| node-t3-mountain-04 | Spirit baseline | 173:2.30/c0/W; 947:2.05/c0/W; 2027:2.20/c1/W | 173:2.80/c0/W; 947:2.90/c0/W; 2027:2.90/c1/W | 173:3.50/c1/W; 947:3.10/c1/W; 2027:3.50/c0/W |
| node-t3-swamp-03 | Striker baseline | 173:1.60/c0/W; 947:1.50/c1/W; 2027:1.50/c0/W | 173:2.00/c1/W; 947:4.65/c0/W; 2027:2.30/c0/W | 173:3.70/c1/W; 947:6.00/c0/W; 2027:2.50/c1/W |
| node-t3-swamp-03 | Squire baseline | 173:1.80/c0/W; 947:1.40/c0/W; 2027:1.60/c0/W | 173:2.30/c0/W; 947:0.90/c1/W; 2027:3.20/c0/W | 173:5.50/c1/W; 947:2.80/c0/W; 2027:3.50/c0/W |
| node-t3-swamp-03 | Apprentice baseline | 173:3.00/c1/W; 947:2.65/c1/W; 2027:2.85/c1/W | 173:3.00/c0/W; 947:3.80/c0/W; 2027:3.00/c1/W | 173:5.40/c2/W; 947:4.50/c0/W; 2027:3.60/c1/W |
| node-t3-swamp-03 | Slinger baseline | 173:2.60/c0/W; 947:2.80/c1/W; 2027:2.90/c0/W | 173:3.20/c1/W; 947:3.80/c0/W; 2027:3.20/c0/W | 173:3.80/c1/W; 947:4.10/c0/W; 2027:3.60/c1/W |
| node-t3-swamp-03 | Slinger alternate | 173:5.00/c0/W; 947:5.00/c1/W; 2027:5.00/c1/W | 173:5.00/c0/W; 947:5.60/c1/W; 2027:5.20/c1/W | 173:6.00/c2/W; 947:6.00/c1/W; 2027:6.50/c1/W |
| node-t3-swamp-03 | Conduit baseline | 173:2.60/c1/W; 947:2.60/c0/W; 2027:2.60/c0/W | 173:3.40/c1/W; 947:6.80/c1/W; 2027:3.45/c1/W | 173:3.60/c1/W; 947:7.40/c1/W; 2027:4.50/c0/W |
| node-t3-swamp-03 | Conduit alternate | 173:2.70/c0/W; 947:3.10/c1/W; 2027:3.00/c0/W | 173:4.10/c1/W; 947:3.70/c0/W; 2027:3.40/c0/W | 173:4.10/c0/W; 947:8.30/c1/W; 2027:4.20/c1/W |
| node-t3-swamp-03 | Spirit baseline | 173:1.40/c1/W; 947:1.40/c0/W; 2027:1.40/c0/W | 173:1.70/c1/W; 947:1.50/c2/W; 2027:2.10/c1/W | 173:2.50/c0/W; 947:2.60/c1/W; 2027:2.50/c1/W |
| node-t3-jungle-03 | Striker baseline | 173:2.50/c0/W; 947:2.50/c0/W; 2027:2.50/c0/W | 173:3.00/c0/W; 947:3.25/c0/W; 2027:2.90/c0/W | 173:3.00/c0/W; 947:3.50/c0/W; 2027:3.00/c0/W |
| node-t3-jungle-03 | Squire baseline | 173:3.85/c0/W; 947:3.00/c0/W; 2027:3.60/c0/W | 173:2.80/c0/W; 947:4.40/c1/W; 2027:4.60/c0/W | 173:3.60/c1/W; 947:3.60/c0/W; 2027:3.60/c0/W |
| node-t3-jungle-03 | Apprentice baseline | 173:4.40/c0/W; 947:4.50/c1/W; 2027:4.20/c1/W | 173:4.50/c0/W; 947:4.50/c0/W; 2027:4.50/c0/W | 173:4.60/c0/W; 947:5.10/c0/W; 2027:4.50/c0/W |
| node-t3-jungle-03 | Slinger baseline | 173:3.70/c1/W; 947:4.00/c0/W; 2027:4.40/c0/W | 173:4.10/c1/W; 947:4.10/c0/W; 2027:4.10/c0/W | 173:4.50/c0/W; 947:4.30/c0/W; 2027:4.25/c1/W |
| node-t3-jungle-03 | Slinger alternate | 173:7.00/c0/W; 947:8.40/c1/W; 2027:7.00/c1/W | 173:8.30/c2/W; 947:8.70/c0/W; 2027:8.40/c1/W | 173:8.50/c1/W; 947:9.00/c0/W; 2027:8.00/c0/W |
| node-t3-jungle-03 | Conduit baseline | 173:9.40/c0/W; 947:8.20/c1/W; 2027:5.90/c0/W | 173:9.65/c1/W; 947:9.95/c3/W; 2027:9.20/c0/W | 173:8.65/c0/W; 947:8.10/c1/W; 2027:8.70/c1/W |
| node-t3-jungle-03 | Conduit alternate | 173:7.40/c1/W; 947:5.95/c3/W; 2027:8.45/c0/W | 173:9.40/c1/W; 947:12.20/c1/W; 2027:9.30/c2/W | 173:11.30/c2/W; 947:17.40/c6/D; 2027:9.65/c1/W |
| node-t3-jungle-03 | Spirit baseline | 173:2.70/c1/W; 947:3.00/c0/W; 2027:3.00/c0/W | 173:3.00/c1/W; 947:2.80/c0/W; 2027:2.70/c0/W | 173:3.25/c0/W; 947:3.45/c0/W; 2027:3.50/c0/W |
| node-t3-tundra-03 | Striker baseline | 173:2.90/c1/W; 947:3.20/c0/W; 2027:3.20/c0/W | 173:4.20/c0/W; 947:6.70/c1/W; 2027:4.20/c1/W | 173:4.80/c1/W; 947:5.05/c0/W; 2027:5.20/c1/W |
| node-t3-tundra-03 | Squire baseline | 173:4.90/c0/W; 947:4.90/c1/W; 2027:5.00/c1/W | 173:6.90/c1/W; 947:6.95/c1/W; 2027:6.90/c1/W | 173:7.40/c1/W; 947:7.60/c0/W; 2027:8.90/c0/W |
| node-t3-tundra-03 | Apprentice baseline | 173:4.80/c0/W; 947:4.55/c0/W; 2027:4.75/c1/W | 173:6.00/c0/W; 947:6.20/c0/W; 2027:6.35/c1/W | 173:7.50/c0/W; 947:15.00/c1/D; 2027:7.50/c1/D |
| node-t3-tundra-03 | Slinger baseline | 173:4.40/c1/W; 947:4.05/c0/W; 2027:4.60/c1/W | 173:5.05/c0/W; 947:6.55/c1/W; 2027:6.55/c0/W | 173:7.50/c1/W; 947:9.15/c0/W; 2027:7.50/c1/W |
| node-t3-tundra-03 | Slinger alternate | 173:9.90/c0/W; 947:10.00/c1/W; 2027:10.00/c1/W | 173:21.70/c1/W; 947:16.85/c1/W; 2027:12.50/c1/W | 173:13.30/c1/W; 947:13.15/c1/D; 2027:13.10/c0/W |
| node-t3-tundra-03 | Conduit baseline | 173:7.25/c0/W; 947:7.50/c1/W; 2027:7.40/c1/W | 173:14.45/c1/W; 947:9.30/c0/W; 2027:9.70/c1/W | 173:142.40/c1/W; 947:11.10/c1/W; 2027:11.40/c1/W |
| node-t3-tundra-03 | Conduit alternate | 173:7.40/c0/W; 947:7.60/c1/W; 2027:7.50/c0/W | 173:12.00/c1/W; 947:19.60/c1/W; 2027:9.70/c0/W | 173:144.20/c1/W; 947:82.55/c1/W; 2027:12.90/c1/W |
| node-t3-tundra-03 | Spirit baseline | 173:3.60/c0/W; 947:3.80/c0/W; 2027:3.60/c1/W | 173:5.00/c1/W; 947:5.00/c0/W; 2027:4.80/c1/W | 173:5.70/c0/W; 947:5.70/c1/W; 2027:5.10/c0/W |
| node-t3-desert-03 | Striker baseline | 173:5.10/c1/W; 947:5.15/c2/W; 2027:5.15/c1/W | 173:6.40/c1/W; 947:6.60/c0/W; 2027:6.55/c2/W | 173:8.30/c1/W; 947:8.05/c0/W; 2027:8.35/c0/W |
| node-t3-desert-03 | Squire baseline | 173:7.80/c0/W; 947:8.20/c0/W; 2027:8.20/c2/W | 173:8.20/c1/W; 947:8.10/c1/W; 2027:7.50/c0/W | 173:9.60/c0/W; 947:9.60/c1/W; 2027:10.00/c1/W |
| node-t3-desert-03 | Apprentice baseline | 173:7.50/c0/W; 947:7.10/c1/W; 2027:7.40/c2/W | 173:8.40/c3/W; 947:8.55/c1/W; 2027:8.40/c2/D | 173:10.50/c2/W; 947:10.50/c2/W; 2027:10.50/c3/W |
| node-t3-desert-03 | Slinger baseline | 173:7.30/c1/W; 947:6.75/c3/W; 2027:7.60/c1/W | 173:8.70/c5/W; 947:9.00/c2/W; 2027:8.60/c3/W | 173:10.10/c2/W; 947:9.70/c2/W; 2027:10.50/c2/W |
| node-t3-desert-03 | Slinger alternate | 173:12.90/c5/W; 947:12.00/c3/W; 2027:13.40/c3/W | 173:15.00/c3/W; 947:14.50/c1/W; 2027:15.00/c3/W | 173:18.00/c4/W; 947:17.00/c1/W; 2027:18.00/c5/W |
| node-t3-desert-03 | Conduit baseline | 173:15.45/c4/W; 947:19.60/c2/W; 2027:20.55/c1/W | 173:20.10/c2/W; 947:21.75/c4/W; 2027:21.70/c1/W | 173:26.80/c3/W; 947:23.40/c3/W; 2027:25.00/c1/W |
| node-t3-desert-03 | Conduit alternate | 173:20.20/c1/W; 947:20.05/c6/W; 2027:18.70/c2/W | 173:24.00/c2/W; 947:22.30/c0/W; 2027:19.45/c2/W | 173:16.50/c1/W; 947:25.60/c2/W; 2027:26.80/c1/W |
| node-t3-desert-03 | Spirit baseline | 173:5.00/c0/W; 947:4.70/c1/W; 2027:5.05/c1/W | 173:6.50/c0/W; 947:6.80/c0/W; 2027:6.95/c1/W | 173:8.40/c1/W; 947:7.70/c4/W; 2027:8.40/c1/W |
| node-t3-volcanic-03 | Striker baseline | 173:2.00/c0/W; 947:2.20/c0/W; 2027:3.10/c0/W | 173:2.00/c0/W; 947:3.00/c0/W; 2027:3.40/c0/W | 173:2.00/c0/W; 947:2.60/c0/W; 2027:3.50/c0/W |
| node-t3-volcanic-03 | Squire baseline | 173:3.20/c0/W; 947:3.10/c0/W; 2027:3.20/c0/W | 173:3.20/c0/W; 947:3.60/c0/W; 2027:3.20/c0/W | 173:3.20/c0/W; 947:5.00/c0/W; 2027:3.90/c0/W |
| node-t3-volcanic-03 | Apprentice baseline | 173:2.85/c0/D; 947:3.45/c0/W; 2027:2.80/c1/W | 173:3.00/c1/W; 947:3.45/c1/W; 2027:3.00/c0/W | 173:3.10/c3/W; 947:3.15/c0/W; 2027:3.00/c0/W |
| node-t3-volcanic-03 | Slinger baseline | 173:3.00/c3/W; 947:2.95/c3/W; 2027:2.90/c4/W | 173:2.90/c3/W; 947:3.30/c7/W; 2027:3.70/c5/W | 173:3.50/c6/W; 947:3.30/c4/W; 2027:3.30/c2/W |
| node-t3-volcanic-03 | Slinger alternate | 173:5.80/c8/W; 947:5.00/c1/W; 2027:4.80/c3/W | 173:5.00/c4/W; 947:7.60/c9/W; 2027:5.00/c3/W | 173:5.70/c4/W; 947:5.80/c4/W; 2027:8.00/c4/W |
| node-t3-volcanic-03 | Conduit baseline | 173:10.40/c8/W; 947:8.60/c7/W; 2027:8.80/c8/W | 173:9.15/c10/W; 947:9.50/c10/W; 2027:6.90/c3/W | 173:11.60/c9/W; 947:9.20/c6/W; 2027:9.80/c8/W |
| node-t3-volcanic-03 | Conduit alternate | 173:10.50/c8/W; 947:13.45/c6/W; 2027:15.85/c5/W | 173:14.40/c10/W; 947:14.05/c7/W; 2027:10.65/c4/W | 173:13.95/c6/W; 947:15.65/c9/W; 2027:14.60/c4/W |
| node-t3-volcanic-03 | Spirit baseline | 173:1.50/c2/W; 947:1.40/c1/W; 2027:1.50/c1/W | 173:1.50/c2/W; 947:1.40/c1/W; 2027:1.50/c0/D | 173:1.50/c2/W; 947:1.50/c0/W; 2027:1.40/c1/W |

## Untreated T1/T2 reference cells

These 24 cells were unchanged controls used to anchor the tier comparison.
They are not evidence for a T2 HP buff.

| Tier | Role | Node | Class | Median TTK s | Seed medians / censor / outcome | K/C | Deaths | Recovery s |
|---|---|---|---|---:|---|---:|---:|---:|
| T1 | solo | node-t1-cave-02 | Striker | 4.80 | 173:4.80/c0/W; 947:6.50/c1/W; 2027:4.80/c0/W | 58/1 | 0 | 4.00 |
| T1 | solo | node-t1-cave-02 | Squire | 4.40 | 173:4.40/c1/W; 947:6.60/c1/W; 2027:4.40/c0/W | 53/2 | 0 | 4.10 |
| T1 | solo | node-t1-cave-02 | Apprentice | 5.40 | 173:5.40/c0/W; 947:5.40/c0/W; 2027:5.40/c1/W | 66/1 | 0 | 0.00 |
| T1 | solo | node-t1-cave-02 | Slinger | 7.00 | 173:7.60/c1/W; 947:7.00/c0/W; 2027:7.00/c0/W | 58/1 | 0 | 3.30 |
| T1 | solo | node-t1-cave-02 | Conduit | 12.55 | 173:12.55/c1/W; 947:10.10/c0/W; 2027:13.00/c0/W | 46/1 | 0 | 4.75 |
| T1 | solo | node-t1-cave-02 | Spirit | 5.40 | 173:5.40/c0/W; 947:5.40/c1/W; 2027:5.40/c1/W | 63/2 | 0 | 6.45 |
| T1 | small-group | node-t1-mountain-04 | Striker | 3.60 | 173:4.20/c0/W; 947:3.60/c0/W; 2027:3.60/c0/W | 86/0 | 0 | 6.80 |
| T1 | small-group | node-t1-mountain-04 | Squire | 4.40 | 173:4.40/c0/W; 947:2.20/c1/D; 2027:4.40/c0/W | 70/1 | 1 | 6.90 |
| T1 | small-group | node-t1-mountain-04 | Apprentice | 4.80 | 173:4.80/c2/D; 947:5.10/c1/W; 2027:4.50/c1/W | 59/4 | 1 | 0.00 |
| T1 | small-group | node-t1-mountain-04 | Slinger | 6.00 | 173:6.00/c0/W; 947:6.00/c0/W; 2027:6.00/c1/W | 74/1 | 0 | 5.30 |
| T1 | small-group | node-t1-mountain-04 | Conduit | 5.40 | 173:4.80/c1/D; 947:6.40/c3/W; 2027:5.40/c1/W | 56/5 | 1 | 1.70 |
| T1 | small-group | node-t1-mountain-04 | Spirit | 4.05 | 173:3.60/c1/W; 947:4.05/c0/W; 2027:4.10/c1/W | 100/2 | 0 | 0.00 |
| T2 | solo | node-t2-cave-02 | Striker | 4.00 | 173:4.00/c0/W; 947:4.00/c0/W; 2027:4.00/c1/W | 66/1 | 0 | 3.20 |
| T2 | solo | node-t2-cave-02 | Squire | 1.90 | 173:1.90/c0/W; 947:1.90/c1/W; 2027:1.90/c0/W | 77/1 | 0 | 2.30 |
| T2 | solo | node-t2-cave-02 | Apprentice | 4.50 | 173:4.50/c0/W; 947:4.00/c0/W; 2027:4.50/c0/W | 70/0 | 0 | 2.90 |
| T2 | solo | node-t2-cave-02 | Slinger | 2.50 | 173:2.50/c1/D; 947:2.50/c1/D; 2027:2.90/c0/W | 72/2 | 2 | 0.00 |
| T2 | solo | node-t2-cave-02 | Conduit | 4.30 | 173:4.30/c0/W; 947:4.30/c0/W; 2027:4.25/c1/W | 81/1 | 0 | 0.10 |
| T2 | solo | node-t2-cave-02 | Spirit | 2.80 | 173:2.80/c0/W; 947:2.80/c0/W; 2027:2.80/c0/W | 115/0 | 0 | 0.00 |
| T2 | small-group | node-t2-mountain-04 | Striker | 3.50 | 173:3.50/c0/W; 947:5.05/c0/W; 2027:3.50/c0/W | 73/0 | 0 | 6.70 |
| T2 | small-group | node-t2-mountain-04 | Squire | 1.90 | 173:1.90/c0/W; 947:1.90/c0/W; 2027:1.90/c1/D | 76/1 | 1 | 5.85 |
| T2 | small-group | node-t2-mountain-04 | Apprentice | 4.00 | 173:4.00/c0/W; 947:4.10/c1/W; 2027:3.70/c0/W | 75/1 | 0 | 6.80 |
| T2 | small-group | node-t2-mountain-04 | Slinger | 2.90 | 173:2.90/c1/W; 947:1.80/c0/W; 2027:2.90/c0/W | 112/1 | 0 | 0.00 |
| T2 | small-group | node-t2-mountain-04 | Conduit | 4.35 | 173:4.30/c1/W; 947:4.35/c1/W; 2027:4.90/c2/W | 71/4 | 0 | 1.05 |
| T2 | small-group | node-t2-mountain-04 | Spirit | 2.80 | 173:2.80/c1/W; 947:2.80/c0/W; 2027:2.80/c1/W | 113/2 | 0 | 0.00 |

## Engagement duration and participant mix

Episodes are observed combat intervals, not authored-pack clears. They can
combine repopulation and successive pulls. In each cell below,
n=clear/non-clear episodes; d=median duration for all/clear/non-clear
episodes in seconds; i/l=median initial members/late joiners; m=maximum
members in one episode. Non-clear includes a window-ended or death-ended
episode and is not automatically a combat failure.

| Node | Treatment | Solo | Small | Swarm |
|---|---|---|---|---|
| node-t3-cave-02 | control | 818=807/11; d3.60/3.60/1.30; i/l1/0; m1 | 2=2/0; d8.25/8.25/-; i/l1/1; m2 | — |
| node-t3-cave-02 | hp-low | 721=711/10; d4.30/4.30/1.85; i/l1/0; m1 | 1=1/0; d10.40/10.40/-; i/l1/1; m2 | — |
| node-t3-cave-02 | hp-high | 641=635/6; d5.00/5.00/3.80; i/l1/0; m1 | 2=1/1; d7.55/11.30/3.80; i/l1/1; m2 | 1=1/0; d53.00/53.00/-; i/l1/3; m4 |
| node-t3-mountain-04 | control | 764=754/10; d3.80/3.80/2.25; i/l1/0; m1 | 8=7/1; d11.80/12.80/4.60; i/l1/1; m2 | — |
| node-t3-mountain-04 | hp-low | 641=632/9; d4.60/4.60/1.30; i/l1/0; m1 | 8=8/0; d9.90/9.90/-; i/l1/1; m2 | 5=3/2; d72.80/55.50/145.50; i/l1/6; m21 |
| node-t3-mountain-04 | hp-high | 559=549/10; d5.30/5.40/3.30; i/l1/0; m1 | 6=6/0; d17.75/17.75/-; i/l1/1; m2 | 7=4/3; d101.10/87.50/140.70; i/l1/8; m14 |
| node-t3-swamp-03 | control | 837=829/8; d3.00/3.00/2.50; i/l1/0; m1 | 65=63/2; d6.30/6.30/30.15; i/l1/1; m2 | 10=8/2; d12.70/10.15/164.90; i/l1/2; m27 |
| node-t3-swamp-03 | hp-low | 693=681/12; d3.80/3.80/3.40; i/l1/0; m1 | 62=57/5; d8.15/8.10/123.60; i/l1/1; m2 | 12=11/1; d10.50/10.10/95.80; i/l1/2; m19 |
| node-t3-swamp-03 | hp-high | 592=578/14; d4.40/4.40/3.85; i/l1/0; m1 | 54=50/4; d8.75/8.70/158.60; i/l1/1; m2 | 4=2/2; d103.55/14.95/201.90; i/l1/3; m20 |
| node-t3-tundra-03 | control | 549=535/14; d5.70/5.70/3.70; i/l1/0; m1 | 1=1/0; d20.20/20.20/-; i/l1/1; m2 | 1=1/0; d65.30/65.30/-; i/l1/3; m4 |
| node-t3-tundra-03 | hp-low | 471=455/16; d7.70/7.70/5.85; i/l1/0; m1 | 1=1/0; d19.20/19.20/-; i/l1/1; m2 | 1=1/0; d83.60/83.60/-; i/l1/3; m4 |
| node-t3-tundra-03 | hp-high | 338=326/12; d7.90/7.90/2.75; i/l1/0; m1 | 2=0/2; d23.10/-/23.10; i/l1/1; m2 | 5=2/3; d78.30/58.85/300.00; i/l1/3; m5 |
| node-t3-desert-03 | control | 1=0/1; d4.10/-/4.10; i/l1/1/0; m1 | 157=151/6; d8.90/9.00/6.05; i/l1/1/1; m2 | 17=3/14; d296.00/169.10/298.00; i/l1/19; m32 |
| node-t3-desert-03 | hp-low | 7=6/1; d1.50/5.90/0.20; i/l1/1/0; m1 | 112=106/6; d10.85/11.00/7.95; i/l1/1/1; m2 | 21=5/16; d295.20/65.30/296.00; i/l1/15; m31 |
| node-t3-desert-03 | hp-high | — | 85=82/3; d12.10/12.15/5.80; i/l1/1/1; m2 | 20=2/18; d298.05/194.10/298.25; i/l1/17; m32 |
| node-t3-jungle-03 | control | 582=567/15; d4.40/4.40/14.50; i/l1/1/0; m1 | 22=20/2; d11.70/11.20/53.40; i/l1/1/1; m2 | 10=8/2; d26.85/14.85/58.75; i/l1/2.5; m15 |
| node-t3-jungle-03 | hp-low | 410=398/12; d4.60/4.50/79.40; i/l1/1/0; m1 | 31=28/3; d14.90/13.70/19.40; i/l1/1/1; m2 | 15=9/6; d80.80/45.70/154.30; i/l1/5; m25 |
| node-t3-jungle-03 | hp-high | 377=364/13; d5.10/5.10/91.10; i/l1/1/0; m1 | 26=25/1; d14.85/14.00/164.10; i/l1/1/1; m2 | 14=8/6; d84.95/38.25/161.65; i/l1/4.5; m24 |
| node-t3-volcanic-03 | control | 9=9/0; d2.70/2.70/-; i/l1/1/0; m1 | — | 50=27/23; d22.90/13.00/297.50; i/l1/5; m69 |
| node-t3-volcanic-03 | hp-low | 7=7/0; d3.40/3.40/-; i/l1/0; m1 | — | 42=19/23; d215.60/16.90/297.50; i/l1/5; m75 |
| node-t3-volcanic-03 | hp-high | 9=7/2; d3.40/2.80/214.50; i/l1/0; m1 | 2=2/0; d5.70/5.70/-; i/l1/1/1; m2 | 41=20/21; d237.10/18.50/297.50; i/l1/5; m63 |

## Pressure, recovery, and casts

These aggregates cover 24 observations per T3 node/treatment: eight builds and
three seeds. K/C is the total killed/censored target count, while deaths is the
number of player-death observations. HP-regain targets are target traces with
observed regeneration and are retained outside the clean TTK median. Same-tick
kills are zero-millisecond target kills. Minimum HP is the minimum and median
of each run's reported minimum player HP fraction. Peak hit and peak one-second
damage are the generated incoming-pressure summaries. Recovery is the median
and maximum completed recovery interval; interrupted is the count of recovery
intervals cut short by the next pull. Cast totals are target cast starts/fires.

| Node | Treatment | K/C | Deaths | HP-regain targets | Same-tick kills | Min HP min/median | Peak hit median/max | Peak 1s median/max | Recovery median/max s | Recovery interrupted | Casts started/fired |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| node-t3-cave-02 | control | 811/9 | 0 | 0 | 36 | 0.390/0.746 | 58.00/206.10 | 58.00/215.10 | 0.50/7.60 | 45 | 323/321 |
| node-t3-cave-02 | hp-low | 713/8 | 0 | 0 | 0 | 0.304/0.639 | 58.00/206.10 | 80.00/215.10 | 0.00/7.30 | 43 | 277/275 |
| node-t3-cave-02 | hp-high | 641/6 | 0 | 1 | 0 | 0.299/0.620 | 58.00/206.10 | 113.30/215.10 | 0.60/7.70 | 34 | 257/257 |
| node-t3-mountain-04 | control | 769/10 | 0 | 0 | 14 | 0.635/0.837 | 48.70/90.00 | 50.70/90.00 | 0.00/7.70 | 132 | 275/151 |
| node-t3-mountain-04 | hp-low | 690/7 | 0 | 1 | 0 | 0.609/0.834 | 55.65/102.00 | 56.30/158.00 | 0.00/7.70 | 130 | 301/150 |
| node-t3-mountain-04 | hp-high | 622/11 | 0 | 2 | 0 | 0.583/0.818 | 67.50/92.00 | 67.50/162.00 | 0.00/7.60 | 144 | 316/222 |
| node-t3-swamp-03 | control | 1025/10 | 0 | 1 | 36 | 0.763/0.873 | 20.75/28.80 | 39.80/70.60 | 0.00/5.10 | 141 | 885/784 |
| node-t3-swamp-03 | hp-low | 850/14 | 0 | 3 | 29 | 0.743/0.900 | 20.70/28.80 | 38.35/70.60 | 0.00/9.10 | 102 | 771/734 |
| node-t3-swamp-03 | hp-high | 708/18 | 0 | 3 | 0 | 0.764/0.876 | 20.70/28.80 | 33.05/72.60 | 0.00/5.00 | 86 | 695/678 |
| node-t3-tundra-03 | control | 541/12 | 0 | 1 | 0 | 0.362/0.549 | 146.50/189.00 | 148.00/189.00 | 0.80/7.80 | 131 | 167/166 |
| node-t3-tundra-03 | hp-low | 461/16 | 0 | 0 | 0 | 0.071/0.519 | 149.40/189.00 | 150.90/221.00 | 0.30/7.90 | 152 | 136/131 |
| node-t3-tundra-03 | hp-high | 340/16 | 3 | 0 | 0 | 0.000/0.375 | 150.30/189.00 | 155.65/319.00 | 4.60/7.80 | 134 | 140/131 |
| node-t3-desert-03 | control | 603/43 | 0 | 58 | 13 | 0.152/0.420 | 147.00/190.00 | 159.35/190.00 | 3.40/7.70 | 3 | 563/488 |
| node-t3-desert-03 | hp-low | 518/40 | 1 | 61 | 17 | 0.000/0.420 | 131.13/190.00 | 140.50/196.00 | 3.45/7.10 | 1 | 542/487 |
| node-t3-desert-03 | hp-high | 483/43 | 0 | 73 | 13 | 0.132/0.405 | 133.00/190.00 | 139.85/209.00 | 3.20/6.50 | 0 | 556/496 |
| node-t3-jungle-03 | control | 668/11 | 0 | 1 | 0 | 0.311/0.639 | 94.00/124.00 | 94.00/175.00 | 0.40/5.30 | 114 | 126/66 |
| node-t3-jungle-03 | hp-low | 571/14 | 0 | 9 | 0 | 0.338/0.660 | 94.00/120.00 | 94.00/133.00 | 0.30/7.00 | 78 | 103/59 |
| node-t3-jungle-03 | hp-high | 504/14 | 1 | 11 | 0 | 0.000/0.683 | 94.00/128.00 | 95.00/233.00 | 0.20/7.50 | 78 | 105/70 |
| node-t3-volcanic-03 | control | 739/69 | 1 | 127 | 0 | 0.000/0.633 | 98.00/151.00 | 114.00/192.00 | 0.00/0.50 | 0 | 40/34 |
| node-t3-volcanic-03 | hp-low | 637/80 | 1 | 140 | 0 | 0.000/0.653 | 93.00/133.00 | 108.50/190.00 | 0.00/0.40 | 0 | 40/34 |
| node-t3-volcanic-03 | hp-high | 679/72 | 0 | 161 | 9 | 0.530/0.708 | 90.50/125.10 | 104.00/188.00 | 0.00/0.70 | 1 | 38/32 |

The pressure screen is most stable in Cave and Mountain, where no player death
occurred and the HP treatments reduce target throughput without creating long
targetless gaps. Tundra high is materially different: three player deaths and
the 319 damage one-second maximum require a defensive-path review before any
defense identity is evaluated. Desert and Volcano have many HP-regain and
window-ended target traces, so their apparent pressure changes are inseparable
from their long-lived group context.

## Slinger and Conduit alternate-weapon comparison

The following pairs isolate each packet weapon alternative from its same-class
baseline. Each entry is clean-median TTK / K/C/D for the cell. The delta is
alternate minus baseline in seconds; it is descriptive and does not rank
weapons outside this frozen screen.

| Node | Treatment | Slinger base (TTK/K/C/D) | Slinger alt (TTK/K/C/D) | Δ alt-base s | Conduit base (TTK/K/C/D) | Conduit alt (TTK/K/C/D) | Δ alt-base s |
|---|---|---:|---:|---:|---:|---:|---:|
| node-t3-cave-02 | control | 3.00s/123/1/0 | 6.00s/71/3/0 | 3.00 | 4.20s/84/0/0 | 4.45s/82/2/0 | 0.25 |
| node-t3-cave-02 | hp-low | 3.80s/98/2/0 | 6.80s/67/0/0 | 3.00 | 5.15s/71/1/0 | 6.45s/68/1/0 | 1.30 |
| node-t3-cave-02 | hp-high | 3.60s/97/0/0 | 8.00s/58/1/0 | 4.40 | 6.50s/62/2/0 | 6.80s/60/1/0 | 0.30 |
| node-t3-mountain-04 | control | 3.30s/105/1/0 | 6.00s/81/1/0 | 2.70 | 4.10s/78/1/0 | 4.20s/77/3/0 | 0.10 |
| node-t3-mountain-04 | hp-low | 4.00s/98/1/0 | 7.00s/68/2/0 | 3.00 | 5.90s/65/0/0 | 5.50s/62/1/0 | -0.40 |
| node-t3-mountain-04 | hp-high | 4.40s/93/1/0 | 8.00s/61/2/0 | 3.60 | 6.20s/63/2/0 | 6.20s/52/1/0 | 0.00 |
| node-t3-swamp-03 | control | 2.80s/140/1/0 | 5.00s/106/2/0 | 2.20 | 2.60s/127/1/0 | 3.00s/120/1/0 | 0.40 |
| node-t3-swamp-03 | hp-low | 3.20s/124/1/0 | 5.20s/100/2/0 | 2.00 | 3.45s/109/3/0 | 3.70s/101/1/0 | 0.25 |
| node-t3-swamp-03 | hp-high | 3.80s/117/2/0 | 6.00s/84/4/0 | 2.20 | 4.50s/99/2/0 | 4.20s/88/2/0 | -0.30 |
| node-t3-tundra-03 | control | 4.40s/80/2/0 | 10.00s/45/2/0 | 5.60 | 7.40s/54/2/0 | 7.50s/53/1/0 | 0.10 |
| node-t3-tundra-03 | hp-low | 6.55s/72/1/0 | 16.85s/36/3/0 | 10.30 | 9.70s/45/2/0 | 12.00s/44/2/0 | 2.30 |
| node-t3-tundra-03 | hp-high | 7.50s/64/2/0 | 13.15s/31/2/0 | 5.65 | 11.40s/9/3/0 | 82.55s/7/3/0 | 71.15 |
| node-t3-desert-03 | control | 7.30s/91/5/0 | 12.90s/51/11/0 | 5.60 | 19.60s/42/7/0 | 20.05s/38/9/0 | 0.45 |
| node-t3-desert-03 | hp-low | 8.70s/77/10/0 | 15.00s/48/7/0 | 6.30 | 21.70s/39/7/0 | 22.30s/36/4/0 | 0.60 |
| node-t3-desert-03 | hp-high | 10.10s/68/6/0 | 18.00s/42/10/0 | 7.90 | 25.00s/33/7/0 | 25.60s/34/4/0 | 0.60 |
| node-t3-jungle-03 | control | 4.00s/75/1/0 | 7.00s/78/2/0 | 3.00 | 8.20s/71/1/0 | 7.40s/64/4/0 | -0.80 |
| node-t3-jungle-03 | hp-low | 4.10s/65/1/0 | 8.40s/76/3/0 | 4.30 | 9.65s/62/4/0 | 9.40s/63/4/0 | -0.25 |
| node-t3-jungle-03 | hp-high | 4.30s/77/1/0 | 8.50s/57/1/0 | 4.20 | 8.65s/62/2/0 | 11.30s/45/9/1 | 2.65 |
| node-t3-volcanic-03 | control | 2.95s/140/10/0 | 5.00s/75/12/0 | 2.05 | 8.80s/84/23/0 | 13.45s/42/19/0 | 4.65 |
| node-t3-volcanic-03 | hp-low | 3.30s/122/15/0 | 5.00s/89/16/0 | 1.70 | 9.15s/59/23/0 | 14.05s/56/21/0 | 4.90 |
| node-t3-volcanic-03 | hp-high | 3.30s/121/12/0 | 5.80s/83/12/0 | 2.50 | 9.80s/78/23/0 | 14.60s/51/19/0 | 4.80 |

Slinger alternate is slower in all 21 paired rows, with the largest median
penalties in Tundra low (+10.30s) and Tundra high (+5.65s). It remains slower
in Volcano (+1.70s to +2.50s) despite the smaller HP overlay. Conduit is mixed:
it is faster in Mountain low, Swamp high, Jungle control and Jungle low, and
near-neutral in several other rows, but is slower in every Volcano treatment.
The Tundra-high Conduit-alternate 82.55s cell median is a Glacier Bear outlier
and must not be generalized beyond this screen. No alternate weapon is selected
for a live change.

## Independent inactivity audit

This audit is separate from TTK. The longest gap is the maximum interval from
observation start, between outgoing damage events, or from the last outgoing
damage event to observation end. Outgoing damage includes positive damage or
absorption from the player or an owned minion to a monster. A long gap is a
diagnostic signal, not proof that the client was idle or that movement was
blocked between samples. `>60s` and `>120s` count observations crossing those
thresholds. Last-kill values are seconds from the observation start, and the
remaining count is the median number of monsters in the final sample.

| Node | Treatment | Runs | Median longest gap s | Max longest gap s | >60s | >120s | Median last kill s | Last-kill range s | Median remaining at last sample | Static-contact runs/entries | Deaths |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| node-t3-cave-02 | control | 24 | 10.95 | 16.40 | 0 | 0 | 295.20 | 289.00–299.80 | 16 | 0/0 | 0 |
| node-t3-cave-02 | hp-low | 24 | 11.05 | 18.50 | 0 | 0 | 292.15 | 285.00–299.10 | 16 | 0/0 | 0 |
| node-t3-cave-02 | hp-high | 24 | 11.55 | 18.50 | 0 | 0 | 295.20 | 285.70–299.30 | 16 | 0/0 | 0 |
| node-t3-desert-03 | control | 24 | 12.95 | 16.90 | 0 | 0 | 291.15 | 278.10–299.40 | 14 | 0/0 | 0 |
| node-t3-desert-03 | hp-low | 24 | 13.80 | 246.60 | 1 | 1 | 291.95 | 49.10–299.90 | 14 | 0/0 | 1 |
| node-t3-desert-03 | hp-high | 24 | 14.05 | 18.90 | 0 | 0 | 292.30 | 269.00–299.80 | 14 | 0/0 | 0 |
| node-t3-jungle-03 | control | 24 | 12.35 | 275.40 | 6 | 3 | 290.55 | 24.60–298.10 | 35 | 0/0 | 0 |
| node-t3-jungle-03 | hp-low | 24 | 21.70 | 279.50 | 10 | 7 | 281.45 | 20.50–299.10 | 35 | 0/0 | 0 |
| node-t3-jungle-03 | hp-high | 24 | 75.45 | 279.00 | 13 | 9 | 240.65 | 21.00–297.50 | 35 | 0/0 | 1 |
| node-t3-mountain-04 | control | 24 | 13.95 | 50.80 | 0 | 0 | 293.95 | 285.20–299.80 | 24 | 0/0 | 0 |
| node-t3-mountain-04 | hp-low | 24 | 13.05 | 58.70 | 0 | 0 | 293.95 | 249.00–299.70 | 24 | 0/0 | 0 |
| node-t3-mountain-04 | hp-high | 24 | 14.75 | 116.40 | 1 | 0 | 295.20 | 183.60–299.50 | 24 | 0/0 | 0 |
| node-t3-swamp-03 | control | 24 | 11.00 | 97.20 | 1 | 0 | 296.70 | 266.10–299.80 | 22.5 | 24/257 | 0 |
| node-t3-swamp-03 | hp-low | 24 | 10.45 | 184.20 | 5 | 5 | 295.20 | 112.80–299.60 | 23 | 24/238 | 0 |
| node-t3-swamp-03 | hp-high | 24 | 10.95 | 256.00 | 6 | 5 | 292.35 | 44.00–298.90 | 23 | 23/199 | 0 |
| node-t3-tundra-03 | control | 24 | 11.70 | 17.70 | 0 | 0 | 292.10 | 278.10–298.10 | 14 | 0/0 | 0 |
| node-t3-tundra-03 | hp-low | 24 | 11.25 | 17.40 | 0 | 0 | 290.50 | 276.30–299.40 | 14 | 0/0 | 0 |
| node-t3-tundra-03 | hp-high | 24 | 11.65 | 187.60 | 3 | 2 | 292.65 | 81.40–299.00 | 14 | 0/0 | 3 |
| node-t3-volcanic-03 | control | 24 | 88.40 | 284.30 | 13 | 11 | 277.90 | 15.70–299.50 | 44 | 12/19 | 1 |
| node-t3-volcanic-03 | hp-low | 24 | 70.60 | 283.40 | 13 | 10 | 241.80 | 16.60–299.40 | 44 | 10/20 | 1 |
| node-t3-volcanic-03 | hp-high | 24 | 32.40 | 281.90 | 10 | 9 | 289.50 | 18.10–299.80 | 44 | 12/20 | 0 |

Swamp sample telemetry recorded static-damage contacts in 24/24 control,
24/24 low and 23/24 high observations, with 257/238/199 sampled contact
entries. The raw event streams recorded 274/232/202 hazard-contact events and
1227/1028/892 hazard-escape attempts, with 1224/1027/888 results; the four
high-treatment escape failures warrant review, but do not establish a causal
movement defect. Volcano sample contacts occurred in 12/24, 10/24 and 12/24
observations, with 19/20/20 sampled entries. All 59 observed Volcano contacts
were lava-burn samples on `lava_vent_0/1/2`. Volcano emitted 206/200/188
hazard-escape attempts and matching results, but no `hazard-contact` event
lines; one-second sampling can miss brief contact and the absence of an event
does not rule out path blockage.

Selected raw outliers were inspected only to bound interpretation:

- `dur-t3-volcanic-striker-baseline-control-s173` ended its last outgoing
  damage and kill at 15.7s, then retained 45 monsters at the final sample with
  a targetless attack intent and no static contact. See [events.jsonl:219](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-volcanic-striker-baseline-control-s173/events.jsonl:219>), [samples.jsonl:300](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-volcanic-striker-baseline-control-s173/samples.jsonl:300>) and [summary.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-volcanic-striker-baseline-control-s173/summary.json>).
- `dur-t3-volcanic-apprentice-baseline-control-s173` died at 253.5s to an
  Ash Salamander ranged hit after a sampled lava-burn contact at 174.0s; the
  final sample still had 42 monsters and a targetless attack intent. See [events.jsonl:2009](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-volcanic-apprentice-baseline-control-s173/events.jsonl:2009>), [samples.jsonl:175](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-volcanic-apprentice-baseline-control-s173/samples.jsonl:175>) and [samples.jsonl:254](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-volcanic-apprentice-baseline-control-s173/samples.jsonl:254>).
- `dur-t3-volcanic-conduit-weapon-alt-control-s947` stopped receiving
  outgoing owned-minion damage at 160.1s after its last kill, while movement
  and hazard-escape records continued; the final sample had 44 monsters and no
  target. See [events.jsonl:939](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-volcanic-conduit-weapon-alt-control-s947/events.jsonl:939>), [events.jsonl:182](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-volcanic-conduit-weapon-alt-control-s947/events.jsonl:182>) and [samples.jsonl:300](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-volcanic-conduit-weapon-alt-control-s947/samples.jsonl:300>).
- Tundra Conduit baseline high-treatment seed 173 produced two clean Glacier
  Bear kills at actual HP 2588 with TTKs of 142.2s and 142.6s and a maximum
  damage gap of 1.6s. This is an enemy-lifetime outlier, not an inactivity gap.
  Its [summary.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-tundra-conduit-baseline-hp-high-s173/summary.json>) is retained with the run artifacts.
- `dur-t3-desert-apprentice-baseline-hp-low-s2027` died at 53.5s to a ranged
  Sandweaver/Gilded Scarab hit; that dealer's HP was unchanged by treatment.
  See [events.jsonl:409](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-desert-apprentice-baseline-hp-low-s2027/events.jsonl:409>) and [samples.jsonl:54](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-desert-apprentice-baseline-hp-low-s2027/samples.jsonl:54>).
- `dur-t3-jungle-conduit-weapon-alt-hp-high-s947` is the Jungle high death
  outlier: six censored targets after the clean subset and a final Silverback
  target, with no static-contact samples. See [summary.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/dur-t3-jungle-conduit-weapon-alt-hp-high-s947/summary.json>).

## Censored and failed slots

All 192 cells have all three declared seeds represented in the per-seed tables.
Across 576 observations, 563 ended at the 300-second window and 13 ended in a
player death. Target traces contain 15,363 kills and 558 censors; 661 target
traces recorded HP regain and are not included in clean TTK medians. The T3
slice contains seven player-death observations; the six reference deaths are
shown in the T1/T2 table above.

| T3 cell | Death seed(s) | Outcome context |
|---|---|---|
| dur-t3-jungle-conduit-weapon-alt-hp-high | 947 | Player death; target and movement context retained in raw artifacts. |
| dur-t3-tundra-apprentice-baseline-hp-high | 947, 2027 | Two player deaths; high-treatment pressure includes the Tundra high minimum-HP floor. |
| dur-t3-tundra-slinger-weapon-alt-hp-high | 947 | Player death in the Slinger alternate high-treatment cell. |
| dur-t3-desert-apprentice-baseline-hp-low | 2027 | Death attributed to unchanged Sandweaver/Gilded Scarab dealer context. |
| dur-t3-volcanic-apprentice-baseline-control | 173 | Death after a sampled lava-burn contact and later ranged pressure. |
| dur-t3-volcanic-spirit-baseline-hp-low | 2027 | Player death in the Volcano low-treatment reference build. |

There was no `failed.json`, runner failure or retry. A death is an observed
run outcome, not an execution failure; each declared death advanced to the next
cell as required by the packet.

## Artifact verification

The completion marker and generated report were checked after the single run:

| Artifact | SHA256 / value |
|---|---|
| [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/manifest.json>) | F9DD5027AC0E072823D635E8A32F3CBC2C2EBE8F4E8910266CB55377BF6F723A |
| [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/complete.json>) | AC64FE9659F2B27278E4878F4DC45F93F3ED001DB654C88173305C3131704544; `{"cells":192,"runs":576,"mode":"run"}` |
| [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/analysis.json>) | 79039F55E9A73AFFEC34C1263DE143A8C358451F3FF07962DFF68669C8BD9ABA |
| [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/analysis.md>) | 634FC18E0BC9D2F9C58E08A55E36DD1C08442AF832165E3E3E041916C1017783 |
| [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915/results/index.json>) | DD8985673E653BA76AA6371BDB64A9391D64B8372562639A9C165E821107BDD1 |

The results root contains five root files, 576 run directories and 2,309
recursive files. The completion marker declares 192 cells and 576 runs. The
detached source worktree still resolves to revision
`bc559b0228ed4a2d08b1f0f721d99ed873d6056a`, tree
`705adbc5661fd99b507685e296ecd5965db0db15`, with a clean status. The shared
checkout's pre-existing modified campaign/docs files and human-playtest
artifacts were not included in the run or altered by it.

## Decision for Astra and user review

This trial is sufficient to screen HP response and to choose what deserves a
later defense-profile comparison. It is not sufficient to select a live
balance value or to certify player readiness.

| Biome | Readout | Review disposition |
|---|---|---|
| Cave | Controller enemy TTK bands lengthened with HP; no deaths and no >60s inactivity gaps. | Keep as a clean HP-response candidate for later defense comparison. |
| Mountain | Controller TTK and cast exposure generally rose; high had longer swarm episodes but no deaths. | Keep as a candidate, with group/kiting behavior reviewed alongside defense. |
| Swamp | HP response is visible, while static contacts, hazard escapes and high-treatment non-clear swarms make pacing part of the result. | Review damage/hazard interaction before defense comparison; do not auto-promote. |
| Tundra | HP-high produced three deaths, minimum HP 0.000 in the aggregate, and extreme Glacier Bear lifetimes up to 144.20s. | Hold high treatment; audit damage paths and enemy-specific pacing first. |
| Desert | Dune Stalker/Basilisk responded while Sandweaver/Gilded Scarab stayed unchanged; group swarms were mostly non-clear and the low death came from unchanged dealer context. | Treat as confounded; review controller/dealer separation before any defense screen. |
| Jungle | Type response was smaller, but high had one death and 13/24 observations with >60s longest gaps; group episodes remained mixed. | Hold for movement/engagement review; no safe HP conclusion. |
| Volcano | Swarms were sparse and mostly non-clear (27/23, 19/23, 20/21 clear/non-clear); long gaps and lava-burn samples remain unexplained by a single root cause. | Hold; audit movement/static hazard behavior before using survival or censoring as balance evidence. |

The Slinger alternate is not selected: it was slower in every paired row. The
Conduit alternate is mixed, with a consistent Volcano penalty and an isolated
Tundra-high outlier. No target TTK, defense profile, damage reduction,
DoT-resistance, ability, population, build adaptation, or live balance patch is
authorized by this result. The next stage, if approved after review, should
compare selected plating/DR/DoT-resistance treatments against the HP-only
reference while preserving the same synthetic/evidence boundary and auditing
the actual incoming-damage paths.

Automated qualification and focused overlay/restoration checks passed, but the
full repository suite and live/browser playtests were not run for this packet.
Those remain separate validation requirements.
