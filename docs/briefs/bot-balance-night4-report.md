
# Night 4 report — broad encounter coverage, Desert/Bear follow-up, and AoE screen

Status: complete, synthetic benchmark evidence only. This report records the
single exact frozen batch and returns a decision queue to the operator. It does
not authorize a source patch, live balance change, client change, economy claim,
human-play conclusion, winner selection, or another experiment.

## Decision summary

- The packet completed once, sequentially: A 168/168 cells and 504/504
  observations, B 48/48 and 144/144, and C 96/96 and 288/288. Every block
  exited 0; there were no failed.json artifacts and no wall-ceiling censors.
  There were 37 valid player deaths; deaths advanced the matrix as specified.
- A is a broad current-balance screen, not an elite calibration. The strongest
  six-class reference bodies were Cave Troll / Granite Titan in T2 and Cavern
  Troll / Mountain Colossus in T3. Their six-class medians are near the packet
  reference bands at the stronger nodes; most other biomes are materially
  faster. Desert and Mountain generated the clearest survival pressure, while
  Volcanic has an inactivity/overlap confound that must not be read as very
  long body TTK.
- B confirms a local Desert pressure signal: reducing the Gilded Scarab dealer
  to 80% at the same controller HP materially raises minimum player HP, while
  the six-class Dune/Basilisk medians stay essentially unchanged. The 3x HP +
  80% dealer arm makes controller duration longer and remains survivable for
  the six baseline classes, but the alternate Slinger still dies once. Return
  dealer relief and controller durability as separate review candidates; do
  not apply either globally.
- B Bear results scale cleanly from 12.80s to 14.45s to 17.38s for the
  six-class Bear median across the 1.5x, 2x, and 2.5x fixed-capacity-shell
  arms. Baseline Apprentice deaths increase from 0 to 1 to 2; the alternate
  Slinger dies in all three seeds at the upper two HP arms. Bear absorption is
  visible, but explicit shell break/shatter/vulnerability state is not emitted,
  so no shell mechanic conclusion is certified.
- C recorded all 2,565 Slam activations and all 5,481 Sweep activations across
  the corresponding runs; no run had a zero activation count for its equipped
  technique. Sweep's explicit adapter telemetry is strongest for Slinger,
  Conduit, and Apprentice; direct AoE damage telemetry is strongest for the
  other classes. Small-body TTK and clearance comparisons are mixed by tier
  and class, especially in Volcanic; no technique winner is selected.
- No live patch, class nerf, equipment swap, combined treatment, selected
  winner, or new follow-up run was made.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-night4-operator-packet.md](bot-balance-night4-operator-packet.md) |
| Frozen runtime revision | 115297985869598fe49b215a2c40e19b331b998f |
| Frozen source tree | 79d3f09d3988c9d736485fb62f43290055764a2c |
| Definitions SHA-256 | FFA732EF753525D381623E4F8CEFD131947357FFC1364445E63940CC5AAA59C0 |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitboxes SHA-256 | 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83 |
| Detached source worktree | C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/source |
| Results root | [night4 results](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916>) |
| Operator ledger | [operator-ledger.jsonl](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/operator-ledger.jsonl>) |
| Mode / timestep / window | run / 100ms / 300s per observation |
| Seeds | 173, 947, 2027 |
| Synthetic / economy | true / economyEligible=false |

The exact runner was executed from the detached checkout for each packet trial:

~~~powershell
pnpm --dir C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/source --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=<night4survey|night4followup|night4aoe> --mode=run --revision=115297985869598fe49b215a2c40e19b331b998f --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --out=C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-<trial>
~~~

The ledger timestamps are 2026-09-15 UTC (2026-09-16 00:13–01:16 CEST in
Madrid).

| Block | Cells / observations | Wall window UTC | Wall time | Simulated hours | Outcome | Target kills / unfinished | Clean / regained | Exit |
|---|---:|---|---:|---:|---|---:|---:|---:|
| A night4survey | 168 / 504 | 22:13:21.637–22:49:40.772 | 36m19.135s | 41.046h | 485 window / 19 deaths | 16,139 / 407 | 15,945 / 341 | 0 |
| B night4followup | 48 / 144 | 22:49:41.025–22:55:01.356 | 5m20.331s | 11.476h | 134 window / 10 deaths | 2,462 / 187 | 2,358 / 190 | 0 |
| C night4aoe | 96 / 288 | 22:55:01.492–23:16:16.572 | 21m15.080s | 23.646h | 280 window / 8 deaths | 12,353 / 237 | 12,184 / 293 | 0 |

The three blocks consumed 76.167h of simulated time and 62m54.934s of wall
time. The runner enforced the existing 120s per-observation, 4h per-block,
and 2GiB RSS ceilings; no limit-triggered stop occurred. Peak RSS was not
independently persisted. No Docker, database, service restart, retry, adaptive
rerun, or source/balance edit occurred.

## Artifact verification and treatment isolation

The qualification root was already READY before launch; qualification and
pilots were not repeated. The post-run audit found exactly 504, 144, and
288 directories with ready.json, summary.json, events.jsonl, and samples.jsonl
for A, B, and C respectively, and zero failed.json files. Each complete.json
matched the expected cell/run count.

| Block | manifest.json SHA-256 | index.json SHA-256 | complete.json |
|---|---|---|---|
| A | AF0A53250C4F7180D4B15F7ED1E84B4550BE89A991E8693C3BDC5429E1DF450F | F887C0414D5DBC54CF9841180D28E1BE39CDF63AC046E7E5ACE3BE0BC255AB91 | [complete](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4survey/complete.json>) |
| B | 4728D096B757927E7AAC965C91AA0CCC13CE1CA8047F0F39BFEFB2924D963710 | A6A6B5F19EEBE159BC74C21E96EFD362CFE894E68DA4BBFBBD3B5E1E6A7A3A87 | [complete](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4followup/complete.json>) |
| C | 7B29455E65858E2DF3150DA087E32CD76C9F3C598A49EBAB14B09579547A816B | 915DC1685DCFA7342D098BF8A387B0D38A2BA76AB2AD83EBCFD46DA2D37616F4 | [complete](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4aoe/complete.json>) |

The complete raw and generated artifacts are:

| Block | Raw index | Generated analysis |
|---|---|---|
| A | [A index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4survey/index.json>) | [A analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4survey/analysis.md>) / [A analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4survey/analysis.json>) |
| B | [B index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4followup/index.json>) | [B analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4followup/analysis.md>) / [B analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4followup/analysis.json>) |
| C | [C index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4aoe/index.json>) | [C analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4aoe/analysis.md>) / [C analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916/results-night4aoe/analysis.json>) |

The post-run READY audit preserved the paired setup. A has six baseline
classes on every node and no overlays. B has the six baselines plus only the
named Slinger/Conduit alternatives; Desert treatment fields change only
controller HP and the declared Gilded Scarab attack, and Tundra treatment
fields change only Bear HP plus the prescribed original-capacity shell
fraction. C has the same build, node, seed, roster and stats on each pair and
changes only the equipped sweep versus slam technique. The observed
species/rosters were the actual natural rosters below; no intended player role
was absent from the qualified six-class cells.

## Metric definition

The values in the selected tables below were recomputed from raw
index.json.targets, not copied from the reporter's pooled per-type display.
For each species/node/build/arm/technique cell, each seed's value is the
median of eligible target ttkMs values where clean=true,
hpRegainObserved=false, and ttkMs is finite. The reported value is the median
of the available seed medians. K/C/U/R/M means killed targets / clean targets /
unfinished targets (killedAtMs=null) / observed-regain targets / missing seed
medians. A missing seed median is absent, never encoded as zero. The
reporter's per-cell tables remain useful cross-checks, but use its pooled
display semantics; the raw links above are authoritative for rechecking every
species/node/build/arm record.

## A — current roster survey

### Actual species and role coverage

| Tier / biome | Actual species observed in the 36 A runs for the two nodes | Player roles |
|---|---|---|
| T2 Cave | Cave Gargoyle, Cave Troll, Giant Spider | Striker, Squire, Apprentice, Slinger, Conduit, Spirit |
| T2 Desert | Sand Scorpion, Stone Basilisk, Sun Scarab | six roles |
| T2 Forest | Dire Whelp, Dire Wolf, Ironclaw Badger, Thorn Spitter | six roles |
| T2 Jungle | Jungle Ape, Jungle Snake, Vine Chameleon | six roles |
| T2 Mountain | Boulder Thrower, Granite Titan, Stone Eagle | six roles |
| T2 Plains | Prairie Wolf, Prairie Yearling, Savanna Hawk, Stampede Bull | six roles |
| T2 Swamp | Bog Witch, Mire Stalker, Moss-Shell Snapper | six roles |
| T3 Cave | Cavern Troll, Crystal Gargoyle, Deep Spider | six roles |
| T3 Desert | Desert Basilisk, Dune Stalker, Gilded Scarab | six roles |
| T3 Jungle | Canopy Chameleon, Jungle Stalker, Silverback | six roles |
| T3 Mountain | Avalanche Ram, Crag Mortar, Mountain Colossus | six roles |
| T3 Swamp | Bog Lurker, Mire Hexer, Plague-Shell Snapper | six roles |
| T3 Tundra | Frost Lurker, Glacier Bear, Rime Caster | six roles |
| T3 Volcanic | Ash Salamander, Cinder Hound, Ember Scuttler, Magma Tortoise | six roles |

### Toughest-body reference screen

The reference screen is the median of six baseline class medians for the
toughest observed body at each node. It is not imposed on dealers, support
units, or swarm bodies. Each median [fast–slow] is seconds; the trailing
K/C/U/R/M is for the selected species across that node's six class cells.

| Tier / biome | Node 03 selected body | Node 05 selected body | Natural episodes S / small / swarm | p50 cleared body episode | p50 completed recovery / interrupted | Deaths / minimum HP | Largest hit / max 1s |
|---|---|---|---:|---:|---:|---:|---:|
| T2 Cave | Cave Troll 18.27 [13.20–25.40]; 110/109/6/2/0 | Cave Troll 19.48 [14.40–28.30]; 112/112/12/2/0 | 628 / 15 / 5 | 4.2s | 2.7s / 47 | 0 / 24.2% | 141 / 185.9 |
| T2 Desert | Sand Scorpion 7.55 [5.30–18.90]; 88/88/1/0/0 | Stone Basilisk 7.56 [6.30–20.60]; 90/90/2/0/2 | 10 / 238 / 30 | 12.5s | 4.4s / 10 | 8 / 0.0% | 56 / 101 |
| T2 Forest | Dire Wolf 3.90 [2.80–7.50]; 157/156/3/1/0 | Dire Wolf 3.02 [1.50–6.10]; 184/184/1/0/0 | 592 / 47 / 273 | 3.4s | 2.1s / 65 | 0 / 30.5% | 35 / 93 |
| T2 Jungle | Jungle Ape 5.75 [3.85–7.00]; 100/99/0/1/0 | Jungle Ape 4.38 [3.50–5.50]; 142/142/2/1/0 | 467 / 27 / 38 | 4.4s | 0.0s / 59 | 1 / 0.0% | 35 / 82 |
| T2 Mountain | Granite Titan 18.32 [14.40–31.20]; 104/103/10/4/0 | Granite Titan 15.00 [12.90–28.30]; 115/114/8/1/0 | 555 / 58 / 6 | 4.8s | 4.6s / 177 | 6 / 0.0% | 102 / 169.745 |
| T2 Plains | Stampede Bull 3.35 [1.40–4.75]; 238/237/1/1/0 | Stampede Bull 3.50 [1.20–5.80]; 200/199/3/1/0 | 509 / 111 / 340 | 4.1s | 0.0s / 32 | 0 / 90.1% | 9 / 18 |
| T2 Swamp | Moss-Shell Snapper 4.50 [1.90–7.30]; 251/251/2/0/0 | Moss-Shell Snapper 4.80 [3.80–7.50]; 236/236/1/0/0 | 1,226 / 65 / 1 | 3.0s | 0.0s / 84 | 0 / 52.1% | 33 / 68.88 |
| T3 Cave | Cavern Troll 24.65 [20.70–39.60]; 114/112/16/7/0 | Cavern Troll 28.38 [24.50–45.20]; 98/94/17/9/0 | 481 / 22 / 13 | 3.4s | 0.7s / 60 | 0 / 29.8% | 148.5 / 215 |
| T3 Desert | Desert Basilisk 7.53 [5.00–21.30]; 139/139/3/0/0 | Desert Basilisk 7.60 [5.00–21.75]; 148/148/4/0/0 | 8 / 312 / 24 | 8.9s | 3.4s / 8 | 1 / 0.0% | 190 / 190 |
| T3 Jungle | Silverback 4.60 [3.50–10.20]; 141/141/3/0/0 | Silverback 3.75 [2.50–12.45]; 216/216/2/0/0 | 1,076 / 52 / 5 | 3.8s | 0.0s / 192 | 0 / 50.8% | 99 / 175 |
| T3 Mountain | Mountain Colossus 27.80 [22.45–32.40]; 87/87/11/2/0 | Mountain Colossus 22.70 [17.30–27.35]; 112/110/11/2/0 | 510 / 25 / 12 | 3.7s | 2.9s / 159 | 1 / 0.0% | 144 / 225 |
| T3 Swamp | Plague-Shell Snapper 5.65 [3.40–6.90]; 316/315/2/1/0 | Plague-Shell Snapper 5.61 [4.50–7.20]; 293/293/7/0/1 | 1,137 / 116 / 7 | 3.2s | 0.0s / 222 | 0 / 80.6% | 28.8 / 70.6 |
| T3 Tundra | Glacier Bear 8.22 [5.10–15.40]; 136/136/5/0/0 | Glacier Bear 6.05 [3.80–9.90]; 172/172/2/0/0 | 988 / 3 / 0 | 4.7s | 0.0s / 281 | 0 / 36.2% | 189 / 189 |
| T3 Volcanic | Magma Tortoise 7.65 [5.60–22.05]; 43/31/11/21/2 | Magma Tortoise 9.47 [5.75–49.15]; 40/36/6/10/4 | 12 / 3 / 75 | 13.2s | 0.0s / 0 | 2 / 0.0% | 151 / 202.2 |

The T2 reference band is 15–25s; T2 Cave and Mountain fit it, while the
other five T2 biome groups are below it. The T3 reference band is 25–35s;
T3 Cave node 05 and Mountain node 03 fit it, while Mountain node 05 is below
and the other T3 groups are below. That is a roster/encounter-role signal, not
permission to raise every non-elite body.

Body TTK and natural encounter duration diverge most clearly in T2/T3 Desert
and T3 Volcanic. Desert's selected-body medians are about 7.5s, but the
median cleared episode is 12.5s in T2 and 8.9s in T3 with predominantly
small/overlapping natural episodes. Volcanic has only 90 observed episodes,
75 swarm episodes, 83 unfinished targets, and 153 observed-regain targets.
The raw samples contain lava contacts; these are encounter and
recovery/hazard interactions, not a clean body-duration estimate.

### A role-based decision queue

- Review controller/elite pressure as a role family around T2 Desert,
  T2 Mountain, T3 Desert, and T3 Mountain. Their deaths and low minimum HP
  are stronger signals than the faster Forest/Plains/Swamp bodies. Keep the
  Cave/Mountain reference bodies as calibration anchors.
- Review Conduit/support tails separately. Conduit is the slow tail on several
  tough bodies, but support units should not be assigned the elite reference
  band automatically; the raw A per-type rows and damage gaps need to be read
  with their role and encounter exposure.
- Treat Desert small/small-plus-swarm overlap as a local follow-up candidate,
  not a global HP rule. Treat Volcanic as a hazard/recovery/engagement
  diagnostic first. No numeric live adjustment is returned from A.

## B — Desert controllers and fixed-capacity Bear follow-up

### Desert controllers

The declared arms were hp2, hp2-dealer80, and hp3-dealer80. The six-class
outer-median centers below report Dune Stalker and Desert Basilisk separately;
the bracket is the fastest-to-slowest class median. Gilded Scarab is shown for
context only and is not given an elite durability band.

| Arm | Dune Stalker six-class center [fast–slow] | Desert Basilisk six-class center [fast–slow] | Gilded Scarab six-class center [fast–slow] |
|---|---:|---:|---:|
| hp2 | 13.65s [10.40–29.80] | 14.45s [10.80–32.35] | 2.45s [1.00–3.98] |
| hp2-dealer80 | 13.48s [10.40–30.80] | 14.45s [10.90–32.35] | 2.95s [1.40–12.10] |
| hp3-dealer80 | 21.15s [15.45–38.40] | 22.10s [17.30–43.80] | 2.60s [1.50–3.55] |

The per-class controller outer medians are:

| Class | hp2 Dune / Basilisk | hp2-dealer80 Dune / Basilisk | hp3-dealer80 Dune / Basilisk | Minimum HP / deaths at the three arms |
|---|---:|---:|---:|---|
| Striker | 10.40 / 10.80 | 10.40 / 10.90 | 15.45 / 17.30 | 0.8% / 0; 38.8% / 0; 14.6% / 0 |
| Squire | 16.00 / 16.20 | 16.35 / 16.40 | 24.20 / 25.00 | 43.9% / 0; 57.5% / 0; 55.9% / 0 |
| Apprentice | 13.50 / 14.30 | 13.50 / 14.40 | 21.00 / 21.70 | 17.9% / 0; 32.5% / 0; 41.5% / 0 |
| Slinger | 13.80 / 14.60 | 13.45 / 14.50 | 21.30 / 22.50 | 15.2% / 0; 47.3% / 0; 34.3% / 0 |
| Conduit | 29.80 / 32.35 | 30.80 / 32.35 | 38.40 / 43.80 | 20.0% / 0; 49.9% / 0; 42.0% / 0 |
| Spirit | 11.20 / 11.30 | 11.00 / 11.20 | 16.05 / 17.55 | 37.8% / 0; 51.4% / 0; 45.3% / 0 |

The named dealer's outer medians by class and arm were:

| Class | hp2 | hp2-dealer80 | hp3-dealer80 |
|---|---:|---:|---:|
| Striker | 1.85s | 12.10s | 2.00s |
| Squire | 3.20s | 2.90s | 3.20s |
| Apprentice | 3.00s | 3.00s | 2.40s |
| Slinger | 1.90s | 1.50s | 2.80s |
| Conduit | 3.98s | 3.80s | 3.55s |
| Spirit | 1.00s | 1.40s | 1.50s |

The full raw per-cell/per-species K/C/U/R/M counts are in the B index. The
key controller samples show why the counts must stay beside the medians:
Desert controller arms have target-level unfinished and regain observations,
especially among the Gilded Scarab swarm bodies; missing seed medians were
preserved in the raw calculation rather than treated as kills or zero TTK.

### Dealer exposure, kill ordering, and final damage windows

Damage-source grouping was calculated from the raw event streams for deaths
and runs whose minimum HP fell below 20%. The dominant late-window source was
Gilded Scarab ranged damage. Examples:

- Baseline Striker hp2 reached a minimum of 0.8% in all three seeds. Its
  final 30 seconds carried Gilded Scarab damage of 1,071, 1,228.9, and
  638, versus much smaller controller contributions in the same windows.
- Baseline Apprentice hp2, seed 947, reached 17.9% minimum HP but recovered to
  100% by the window end; its final 30 seconds were Gilded Scarab 212.4 plus
  Dune Stalker 93.4.
- Baseline Slinger hp2, seed 947, reached 15.2% minimum HP and ended at
  70.3%; its final 30 seconds were Gilded Scarab 357 plus Desert Basilisk
  81.
- Alternate Slinger hp3-dealer80, seed 173, died at 66.7s. The final 30
  seconds before death contained Gilded Scarab 416, Dune Stalker 125.2, and
  Desert Basilisk 119; the only kill was a Desert Basilisk at 38.6s, leaving
  the dealer active at death.

Regular kill sequences generally remove Dune/Basilisk controllers before the
dealer, and the death run confirms that killing one controller does not remove
dealer exposure. The same-HP hp2 to hp2-dealer80 comparison raises minimum HP
by 14–38 percentage points for the six baseline classes while leaving the two
controller centers effectively unchanged. That makes dealer relief a plausible
local pressure candidate and makes a longer controller duration more tolerable
in this screen, but not universally safe: the upper HP arm and alternate
Slinger remain exceptions.

Slow and Root buff gains/expiries are present in the event logs, but the
telemetry does not emit one semantic “control duration” field. Derived gain to
expire pairings are therefore diagnostic only; they should not be mistaken
for a clean controller-duration measure. The survival and final-window source
evidence is the safer direct comparison.

### Bear HP and shell chronology

All three Tundra arms used the packet's original-capacity shell fraction:
HP1.5x, HP2x, and HP2.5x, with the node modifier applied afterward. The six
baseline Bear medians were:

| Arm | Six-class Bear center [fast–slow] | Per-class medians, Striker / Squire / Apprentice / Slinger / Conduit / Spirit |
|---|---:|---:|
| hp1.5-fixed | 12.80s [8.05–16.45] | 8.05 / 13.60 / 13.50 / 12.10 / 16.45 / 9.80 |
| hp2-fixed | 14.45s [11.20–19.00] | 11.20 / 16.65 / 15.00 / 13.90 / 19.00 / 12.30 |
| hp2.5-fixed | 17.38s [12.40–20.35] | 12.40 / 20.35 / 18.00 / 16.75 / 19.45 / 14.30 |

The alternatives were kept separate: Slinger weapon-alt Bear medians were
27.00s / 34.00s / 42.00s across the three arms and Conduit weapon-alt was
18.85s / 18.90s / 22.20s. Baseline Apprentice had 0 / 1 / 2 deaths at
the three arms; alternate Slinger had 0 / 3 / 3. Conduit baseline had no
deaths and minimum HP 94.1% / 74.5% / 94.1%; the low incoming-damage tail
is an exposure/telemetry caveat, not proof of an automatically safe build.

Across all Tundra B event files, 10,106 absorb events targeted Glacier Bear.
The event vocabulary includes absorb, damage, casts, buffs, heals, kills, and
technique adapters, so absorption chronology is observable. There is no
explicit shatter, vulnerability, shell-state, or shell-break event in the
retained logs. No cast count is therefore interpreted as proof that an
automatic shell did not fire. The fixed shell's break self-damage and
vulnerability phase cannot be independently reconstructed from this batch.

Conduit's Tundra rows are a separate tail: baseline Conduit incoming damage
was 0, 135, and 0 across the three HP arms, while the alternate had zero
incoming damage in all three. Bear target maximum damage gaps were only about
0.7s baseline and 0.5s alternate. This means the long Conduit Bear TTK is not
explained by a damage-taken tail; the current logs do not separate target
access, offensive cadence, and support behavior sufficiently to select a
mechanic.

## C — Sweep versus Slam

The small body is Vine Chameleon in T2 Jungle, Prairie Yearling in T2 Plains,
Canopy Chameleon in T3 Jungle, and Ember Scuttler in T3 Volcanic. Each small
TTK cell is node 03 / node 05 seconds. In the compact columns below:

- K/C/U/R/M is small-body killed / clean / unfinished / regained / missing
  seed medians, aggregated across both nodes and three seeds per node.
- A/H/T is technique activations / logged effect hits / unique effect targets
  per run. For Sweep, effect hits include direct player damageType=aoe plus
  explicit adapter target events (slinger-splash-hit,
  apprentice-secondary-target, and conduit-secondary-damage). For Slam,
  effect hits are direct player AoE damage events. These are telemetry counts,
  not a claim that every semantic hit is exposed.
- D/HP is player deaths across the six runs / minimum HP percentage, and E is
  cleared episodes / observed episodes. S and L mean Sweep and Slam
  respectively.

| Tier / biome / class | Small TTK S / L | K/C/U/R/M S / L | A/H/T per run S / L | D / HP S / L | Cleared episodes E S / L |
|---|---:|---:|---:|---:|---:|
| T2 Jungle / Striker | 5.00/4.00 / 5.80/4.85 | 50/50/0/0/0 / 40/40/0/0/0 | 66.7/6.2/3.3 / 17.2/18.2/18.0 | 0/59.8 / 0/55.5 | 89/94 / 70/75 |
| T2 Jungle / Squire | 3.80/1.90 / 3.60/1.90 | 53/53/1/0/0 / 61/61/2/0/0 | 37.2/4.3/3.0 / 21.7/24.2/23.8 | 0/60.3 / 0/2.9 | 58/64 / 59/65 |
| T2 Jungle / Apprentice | 4.80/4.00 / 4.50/4.00 | 44/44/1/0/0 / 40/40/0/0/0 | 37.8/1.3/1.3 / 18.5/17.3/17.3 | 0/55.7 / 1/0.0 | 46/51 / 44/50 |
| T2 Jungle / Slinger | 3.50/1.50 / 3.10/3.20 | 54/54/0/0/0 / 60/60/0/0/0 | 17.8/179.5/24.5 / 18.8/19.0/19.0 | 0/58.2 / 0/62.4 | 75/80 / 118/124 |
| T2 Jungle / Conduit | 4.10/3.40 / 4.10/3.40 | 60/60/0/0/0 / 51/51/1/0/0 | 12.5/50.7/9.7 / 5.8/8.0/7.8 | 0/59.2 / 0/55.1 | 119/122 / 88/94 |
| T2 Jungle / Spirit | 2.80/2.80 / 2.80/2.80 | 56/56/0/0/0 / 63/63/0/0/0 | 39.3/1.0/1.0 / 18.8/19.3/19.3 | 1/0.0 / 0/57.7 | 116/121 / 103/106 |
| T2 Plains / Striker | 2.50/2.50 / 2.50/1.90 | 255/255/1/0/0 / 241/241/5/0/0 | 79.0/50.8/38.5 / 24.5/54.7/54.7 | 0/96.1 / 0/95.6 | 208/211 / 196/201 |
| T2 Plains / Squire | 0.00/1.90 / 0.00/0.00 | 228/228/1/0/0 / 242/242/0/0/0 | 48.2/23.3/19.7 / 22.8/47.0/47.0 | 0/99.0 / 0/99.1 | 181/184 / 230/234 |
| T2 Plains / Apprentice | 1.50/1.50 / 1.50/1.50 | 199/199/2/0/0 / 241/241/0/0/0 | 52.2/20.5/18.7 / 25.5/39.5/39.5 | 0/93.6 / 0/95.2 | 35/41 / 87/93 |
| T2 Plains / Slinger | 0.60/0.45 / 0.30/0.30 | 329/326/3/4/0 / 280/280/4/1/0 | 32.2/424.8/102.3 / 23.7/37.8/37.8 | 0/90.1 / 0/91.5 | 260/264 / 242/247 |
| T2 Plains / Conduit | 1.70/2.70 / 1.20/1.70 | 207/202/5/6/0 / 228/228/2/0/0 | 15.5/59.7/22.7 / 8.7/14.7/14.7 | 0/91.1 / 0/91.6 | 142/147 / 237/238 |
| T2 Plains / Spirit | 0.70/0.70 / 0.70/0.70 | 264/260/4/7/0 / 278/278/2/1/0 | 60.8/20.7/19.8 / 24.5/37.5/37.5 | 0/100.0 / 0/100.0 | 107/113 / 56/62 |
| T3 Jungle / Striker | 2.00/1.90 / 2.90/2.00 | 72/72/0/0/0 / 65/65/0/0/0 | 46.8/0.3/0.3 / 16.7/17.3/17.3 | 0/50.8 / 0/71.1 | 201/205 / 193/198 |
| T3 Jungle / Squire | 2.80/2.80 / 3.20/1.70 | 70/70/0/0/0 / 73/73/0/0/0 | 37.0/0.3/0.3 / 18.5/18.7/18.7 | 0/82.1 / 0/82.2 | 170/175 / 207/211 |
| T3 Jungle / Apprentice | 3.80/3.30 / 3.40/3.05 | 81/81/1/0/0 / 55/55/1/0/0 | 62.2/1.0/1.0 / 20.8/18.7/18.7 | 0/53.7 / 0/44.6 | 152/157 / 121/127 |
| T3 Jungle / Slinger | 3.65/3.15 / 3.70/3.20 | 54/54/1/0/0 / 96/96/1/0/0 | 25.7/221.5/27.5 / 24.0/24.2/24.0 | 0/70.6 / 0/49.5 | 158/164 / 213/218 |
| T3 Jungle / Conduit | 5.60/4.55 / 5.80/5.00 | 57/57/0/0/0 / 55/55/3/0/0 | 21.7/60.3/12.8 / 10.7/10.3/10.3 | 0/57.8 / 0/65.7 | 148/151 / 152/157 |
| T3 Jungle / Spirit | 2.50/2.00 / 2.90/2.00 | 99/99/0/0/0 / 100/100/1/0/0 | 60.2/0.0/0.0 / 23.0/23.0/23.0 | 0/80.8 / 0/50.4 | 278/281 / 283/289 |
| T3 Volcanic / Striker | 1.40/3.55 / 3.10/4.00 | 95/95/0/0/0 / 112/112/2/0/0 | 22.7/23.2/12.5 / 8.7/25.0/22.8 | 0/42.8 / 0/42.9 | 29/34 / 42/47 |
| T3 Volcanic / Squire | 1.40/2.80 / 1.70/3.50 | 70/70/0/0/0 / 128/128/1/0/0 | 15.7/13.8/9.0 / 11.3/28.5/25.5 | 0/72.0 / 0/72.0 | 23/26 / 48/54 |
| T3 Volcanic / Apprentice | 2.55/3.00 / 2.55/3.10 | 107/103/6/10/0 / 133/130/1/4/0 | 33.8/12.2/9.3 / 14.5/20.8/19.8 | 1/0.0 / 1/0.0 | 4/10 / 1/7 |
| T3 Volcanic / Slinger | 2.80/3.50 / 2.40/3.35 | 118/109/9/18/0 / 121/113/4/12/0 | 20.7/213.7/28.8 / 12.8/18.8/17.2 | 0/47.9 / 1/0.0 | 2/8 / 0/6 |
| T3 Volcanic / Conduit | 8.50/11.00 / 5.80/4.40 | 123/84/30/66/0 / 131/108/10/32/0 | 30.3/109.2/27.2 / 15.5/32.7/26.3 | 0/55.8 / 0/44.7 | 0/6 / 0/6 |
| T3 Volcanic / Spirit | 1.40/1.60 / 1.50/2.10 | 167/160/5/10/0 / 234/230/3/6/0 | 37.7/12.8/11.0 / 20.5/36.2/34.3 | 1/0.0 / 2/0.0 | 0/6 / 6/12 |

All 96 C cells had an activation for the equipped technique in every seed;
therefore the low Sweep effect counts for some class/biome pairs are not a
“technique did not fire” result. They reflect the event types exposed by that
technique/class path. Sweep adapter totals were 5,192 clip shots and 5,192
splash-hit events for Slinger, 1,284 delivery and 1,284 secondary-damage
events for Conduit, and 210 Apprentice secondary-target events. No
charge/interrupted-charge field or event was exposed in the C raw logs; that
measure is unavailable, not zero.

The slowest observed baseline attacker is Squire (1,855ms attack cooldown);
the fastest is Slinger (260ms). Slam helps the slow/large-hit path in some
cells—most visibly T2 Plains Squire and T3 Volcanic Squire—but not uniformly.
Fast Slinger has very high Sweep adapter-hit telemetry, yet its small-body TTK
advantage is mixed and it has a Volcanic Slam death. The paired screen is
therefore a technique-readability and follow-up queue, not an overpoweredness
decision.

## Inactivity, zero contact, and evidence boundary

The inactivity audit is kept separate from durability:

| Trial | All runs with attackBeats=0 | Runs with zero damaged targets | Runs with no episodes | Volcanic runs / zero attack | Volcanic lava-contact samples |
|---|---:|---:|---:|---:|---:|
| A | 84 / 504 | 0 | 0 | 6 / 36 | 24 |
| B | 36 / 144 | 0 | 0 | — | — |
| C | 48 / 288 | 0 | 0 | 12 / 72 | 51 |

Every run had at least one damaged target, so these are not empty no-contact
simulations. However, zero attack beats, low Volcanic episode counts,
unfinished/regained targets, and recorded lava-burn contacts show why a
missing or sparse combat window must not be called a long TTK. The raw
samples.jsonl movement, recovery, static-contact, and target fields are the
evidence for a separate Volcanic hazard/engagement investigation.

Qualification, automation, and this synthetic runner do not establish
acquisition, travel, economy, client/HUD presentation, browser visuals, human
feel, or live-play survivability. Full-suite validation and human/browser
playtest were not run for this packet.

## Decision queue

1. Keep the A Cave/Mountain reference bodies as calibration anchors and review
   Desert/Mountain controller pressure by encounter role rather than applying
   a roster-wide HP change.
2. Carry B's 80% Gilded Scarab dealer relief and Bear fixed-capacity shell
   behavior as separate, narrowly scoped candidates for a future authorized
   review. Preserve the alternate Slinger and Volcanic exceptions.
3. Keep C's Sweep/Slam pairs as diagnostic evidence. If another ability pass is
   authorized, preserve the distinction between technique activation,
   adapter/direct hit telemetry, small-body TTK, and natural episode clearance.
4. Instrument or diagnose Volcanic reachability, lava/recovery loops, and Bear
   shell break/vulnerability chronology before using those rows for balance
   decisions.

No live patch, class nerf, selected winner, source edit, balance edit, or new
experiment was authorized or performed.
