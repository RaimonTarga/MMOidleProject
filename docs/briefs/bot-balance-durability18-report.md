# Durability 18 report — Forest03 Wolf attack versus defensive stance

Durability18 completed the frozen 8-cell / 24-observation Forest03 experiment
comparing a Dire Wolf attack reduction with a defensive player stance for
Striker and Apprentice. The retained result is synthetic combat evidence only.
No source, balance, item, class, ability, or production data was changed.

## Decision summary

- All 8 cells and 24 observations completed with exit code 0: 23
  window-ended runs and 1 player death.
- The exposure audit found no internal or terminal outgoing-damage quiet run.
  All 6 class/seed four-arm matched sets are retained.
- The only death was Striker/reference/9029. The other two Striker/reference
  seeds ended below 20% minimum HP without dying. No Wolf22 or defensive arm
  produced a sub-20% runner minimum in this screen.
- The two single-axis Striker arms both removed the death: Wolf22 did so while
  retaining offensive stance, and defensive stance did so while retaining the
  Wolf27 overlay. The combined arm had the strongest aggregate durability, but
  this experiment does not show that both requirements are necessary.

Role-specific recommendation:

| Role | Bounded candidate to carry forward | Evidence and boundary |
|---|---|---|
| Striker | Carry Wolf22 as the lower-cost localized adult-Wolf pressure candidate; carry defensive stance as a viable player-build answer with an explicit tempo cost. | Wolf22 improved matched median minimum HP by 34.9 percentage points and reduced incoming HP by 536.0 while shortening body TTK by 3.25s versus reference. Defensive stance improved minimum HP by 45.7 points and reduced incoming HP by 447.0, but added 5.00s of body TTK. Neither is a production adoption. |
| Apprentice | Carry Wolf22 as a bounded second pressure comparison; keep defensive and combined stance arms as optional build follow-up, not a universal stance rule. | There were no deaths in any Apprentice arm. Wolf22 changed the matched minimum-HP median by +7.3 points and incoming HP by -125.9 with no body-TTK change. Defensive and combined arms improved durability but retained more censored/regained records and alter damage/tempo. |

The most useful next decision is whether the Forest candidate should be a
localized adult-Wolf pressure adjustment or a player-build option. Source
reconciliation and fresh confirmation are required before adoption. Minimum
HP20% remains diagnostic, not a universal balance rule. This report does not
validate the live runtime, every Forest node, any other tier, economy or
acquisition, human feel, browser presentation, or complete-tier balance.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability18-operator-packet.md](bot-balance-durability18-operator-packet.md) |
| Frozen revision | e8d4a6bd3cd126c2a646319b30b51f5759b1e1e7 |
| Frozen branch retained | codex/durability18-frozen |
| Frozen source tree | ac995a65a82238f4bf695aa27ea959a1b752d080 |
| Definitions SHA-256 | 75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 |
| Hitbox SHA-256 | 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83 |
| Detached checkout | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability18-20260916/source |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability18-20260916/results-forest |
| Trial / mode | durability18 / run |
| Seeds | 9029, 10427, 12007 |
| Declared dimensions | 8 cells / 24 runs / 3 seeds |
| Timestep / maximum | 100 ms / 300 s per observation |
| Synthetic / economy eligible | true / false |
| Start / end | 2026-09-16T17:59:06.6716996Z / 2026-09-16T18:00:34.5588836Z |
| Operator wall time | 1m 27.8869s |
| Operator exit | 0; no relaunch, retry, or adaptive rerun |
| Operator ledger SHA-256 | FB6498FA1346CB3F41C6A882B61AA864FFAE687556D6B397593FF27378C45508 |

The prescribed sequence was used once: the detached checkout was verified,
dependencies were installed offline, the frozen runner completed, and the
reporter, verifier, and manifest-driven exposure audit passed. The initial
operator command contained a local path typo and was stopped before any
simulation; it was corrected before the single recorded run. No simulation
case was rerun.

## Matrix and treatments

The matrix was Forest03 only, two classes, four arms, and three seeds: 8 cells
and 24 observations. Each arm used the same medium frame, +5 configured gear,
Sweep, Second Wind/Cleanse, recovery rules, movement rules, natural ecology,
100ms tick, and 300s maximum. No travel or acquisition was included.

| Arm | Wolf attack overlay | Badger attack overlay | Player stance |
|---|---:|---:|---|
| reference | 27 | 25 | offensive |
| wolf22 | 22 | 25 | offensive |
| defensive | 27 | 25 | defensive |
| wolf22-defensive | 22 | 25 | defensive |

Adult HP was fixed at the packet candidate anchor: Wolf 1575 and Badger 945.
The Wolf22 change is an 18.5% reduction from the prior Wolf27 candidate; it is
not a blanket reduction to every adult or every Forest enemy. Whelp HP/attack,
Spitter HP/attack, Howl, Barrage, pack sizes, ecology, and all player
equipment/class/ability choices were unchanged. The defensive stance changes
player damage, mitigation, and cooldown values as recorded below.

## Completion, verification, and retained artifacts

| Check | Result |
|---|---|
| Planned matrix | 8 cells / 24 runs |
| Completed matrix | 8 cells / 24 runs |
| Result outcomes | 23 window-ended / 1 player-died |
| Verifier | passed: 8 cells / 24 runs / verified true |
| Exposure audit | 24 runs / 6 matched sets / 0 long-quiet runs / 1 death |
| Raw result inventory | 103 files / 66,975,879 bytes / 24 run directories |

The result root retains 7 top-level artifacts plus ready.json, summary.json,
events.jsonl, and samples.jsonl in each of the 24 run directories. The raw
artifacts remain outside the repository and were not deleted or rewritten.

Top-level result hashes:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| manifest.json | 7,583 | 70D691FB1416AB447E8FD539C56C4E5DCB53A559EE7A12554FF897061522A4FB |
| index.json | 445,873 | 2E9ADF5C238B476046F41A1EB84908FDA02EBFF631609A6A5D7E012F38E2C794 |
| complete.json | 34 | 88AA0E424FEAFE23477B003494A26702007EB986E3EDDCCC851943084E8546F6 |
| analysis.json | 34,735 | 5CD0F9B217BAA7368C261D3121474CF4B380B04E78C8916EA3B8D49D95CDF777 |
| analysis.md | 4,147 | 3817A0DBA4B91B520EE771D5E946A593E117131AAD28A5E0F3455B6C2F46750A |
| exposure-audit.json | 7,435 | 3793D55D9E09D06CE0E6B5EC048E8B94DB34A6C8D9AE20786C8593573A229DD5 |
| verification.log | 62 | 9A28AFD251C0D530259D57615619F16CA34605C54175EA03EE9CDBD49BCD5686 |

## READY and paired geometry/equipment audit

The following are the actual Forest03 spawned values recorded in READY. Node
scaling turns the underlying Wolf27/Wolf22 and Badger25 overlays into the
integer attack values shown.

| Arm | Wolf HP / attack | Badger HP / attack | Whelp HP / attack | Spitter HP / attack |
|---|---:|---:|---:|---:|
| reference | 1733 / 32 | 1040 / 30 | 171 / 17 | 330 / 37 |
| wolf22 | 1733 / 26 | 1040 / 30 | 171 / 17 | 330 / 37 |
| defensive | 1733 / 32 | 1040 / 30 | 171 / 17 | 330 / 37 |
| wolf22-defensive | 1733 / 26 | 1040 / 30 | 171 / 17 | 330 / 37 |

The READY HP treatment was before 525/315 and after 1575/945 for adult
Wolf/Badger in every arm. Whelp and Spitter values stayed fixed. The
wolf22-defensive label is the combined arm used in the tables below.

Player READY values were:

| Class / stance | Max HP | Attack | Plating | DR | Dodge | Evade mitigation | Final damage dealt | Final damage taken | Range | Cooldown | Speed | Recovery |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Striker / offensive | 251 | 33 | 11 | 0.02 | 0.30 | 0.50 | 1.288 | 1.10 | 12 | 490 ms | 168 | 18 |
| Striker / defensive | 251 | 33 | 13 | 0.02 | 0.30 | 0.50 | 0.952 | 0.90 | 12 | 535 ms | 168 | 18 |
| Apprentice / offensive | 240 | 94 | 11 | 0 | 0.30 | 0.50 | 1.288 | 1.10 | 72 | 724 ms | 162 | 18 |
| Apprentice / defensive | 240 | 94 | 13 | 0 | 0.30 | 0.50 | 0.952 | 0.90 | 72 | 793 ms | 162 | 18 |

Thus the stance costs +2 plating, final damage dealt multiplier 1.288 to
0.952, final damage taken multiplier 1.10 to 0.90, and a cooldown increase of
45ms for Striker or 69ms for Apprentice. Range, player attack, speed, dodge,
and evade mitigation were unchanged.

The legal setup audit passed:

| Class | Known abilities | Attuned techniques | Guards | Known / attuned stances | Runes owned / equipped | Hitbox rects |
|---|---:|---|---|---:|---:|---:|
| Striker | 12 | 1: Sweep | 2: Second Wind, Cleanse | 3 / 1 | 30 / 4 | 6 |
| Apprentice | 12 | 1: Sweep | 2: Second Wind, Cleanse | 3 / 1 | 31 / 5 | 6 |

All 6 class/seed sets retained all four arms. The geometry and equipment
audits both passed 6/6, as did the fixed follower-stat audit and adult
treatment-presence audit. Geometry hashes by seed were:

| Seed | Geometry hash | Initial roster hash |
|---:|---|---|
| 9029 | 33f7bc72590482242910d97e6ed7d9fa5599bbf2e7e63809444d5a08e4e75769 | a4eb0b8922f4ed0d65197252753034de7842ea5c43b5db1c5288d6958f0a3f67 |
| 10427 | fe6c7df2dcb630133dd3b89b4f22b9740ea8b912a4f7f4b84a9fed7033c91590 | a6fc9f94b5eedaea3248bd0ce40ff1e2376c34d1987102626f75b1ff05ceebf6 |
| 12007 | 94e5a3fb5fe3f686535682599e7a16df4deb3c29464421beb2f57e598cf3e8c7 | f117f517676bd2c878b62e6ff1d4ac6841c48f7dedb025c24621c6c734d4db5d |

Each hash was stable across the four arms of the relevant class/seed set.
These audits confirm the intended treatment boundary; they do not turn
synthetic combat into production-valid evidence.

## Measurement rules

Clean TTK is computed separately for each target species within each run from
targets that were killed, had no observed HP regain, and were not unfinished
or censored. The per-seed value is the median of clean target TTKs. The
displayed outer value is the median of the three per-seed medians. The
all-outcome counts remain visible beside the clean values.

The notation in the species tables is:

[K/U/R/M] = killed target records / unfinished or censored records /
observed HP-regain records / missing clean-seed median.

Regain can overlap killed or unfinished records and is not a partition. All
species had a clean value for all three seeds in this run, so M is 0
throughout. The all-outcome body TTK below is the outer median of each run's
clean all-target median. It is not a pack-clear duration. Player and minion
attack beats are cooldown timestamp changes, not guaranteed hits.

## Clean TTK by species

Values are in seconds and use seed order 9029 / 10427 / 12007, followed by the
outer median.

### Striker

| Arm | Dire Wolf | Ironclaw Badger | Dire Whelp | Thorn Spitter |
|---|---:|---:|---:|---:|
| reference | 18.50 [2/1/0/0] / 20.00 [6/0/0/0] / 19.25 [4/1/0/0] -> 19.25 | 10.50 [3/0/0/0] / 10.50 [5/0/0/0] / 10.50 [5/0/0/0] -> 10.50 | 4.00 [9/0/0/0] / 3.25 [18/0/0/0] / 5.00 [14/1/0/0] -> 4.00 | 3.50 [3/0/0/0] / 3.50 [1/0/0/0] / 3.50 [7/0/0/0] -> 3.50 |
| wolf22 | 20.00 [4/0/0/0] / 21.50 [6/0/0/0] / 19.50 [5/0/0/0] -> 20.00 | 10.50 [5/1/0/0] / 10.50 [6/0/0/0] / 10.25 [4/0/0/0] -> 10.50 | 2.00 [12/0/0/0] / 3.00 [18/0/0/0] / 2.00 [15/0/0/0] -> 2.00 | 3.50 [8/0/0/0] / 3.50 [1/0/0/0] / 3.50 [6/0/0/0] -> 3.50 |
| defensive | 32.10 [4/0/0/0] / 29.70 [4/0/0/0] / 30.60 [3/1/0/0] -> 30.60 | 16.80 [4/0/0/0] / 17.40 [3/1/0/0] / 16.80 [5/0/0/0] -> 16.80 | 5.10 [12/0/0/0] / 8.40 [12/0/0/0] / 3.00 [12/0/0/0] -> 5.10 | 5.40 [3/0/0/0] / 5.40 [3/0/0/0] / 5.40 [1/0/0/0] -> 5.40 |
| wolf22-defensive | 31.80 [3/0/0/0] / 29.10 [4/1/0/0] / 30.60 [3/1/0/0] -> 30.60 | 16.80 [3/1/0/0] / 17.40 [2/0/0/0] / 17.10 [4/0/0/0] -> 17.10 | 5.40 [9/0/0/0] / 10.50 [14/1/0/0] / 7.50 [12/0/0/0] -> 7.50 | 5.40 [7/0/0/0] / 5.40 [4/0/0/0] / 5.40 [2/0/0/0] -> 5.40 |

### Apprentice

| Arm | Dire Wolf | Ironclaw Badger | Dire Whelp | Thorn Spitter |
|---|---:|---:|---:|---:|
| reference | 15.00 [3/0/0/0] / 14.95 [5/0/1/0] / 14.75 [4/0/0/0] -> 14.95 | 8.20 [7/1/0/0] / 9.00 [6/0/0/0] / 9.00 [6/0/0/0] -> 9.00 | 1.60 [11/1/1/0] / 1.50 [15/0/0/0] / 1.55 [14/1/1/0] -> 1.55 | 3.20 [8/0/0/0] / 3.20 [4/0/0/0] / 3.20 [7/0/0/0] -> 3.20 |
| wolf22 | 15.90 [4/1/1/0] / 15.00 [4/1/0/0] / 15.00 [4/1/0/0] -> 15.00 | 9.00 [7/0/0/0] / 9.00 [7/0/0/0] / 9.00 [2/0/0/0] -> 9.00 | 2.40 [15/0/0/0] / 1.50 [17/0/0/0] / 1.70 [15/0/0/0] -> 1.70 | 3.20 [6/0/0/0] / 3.20 [4/0/0/0] / 3.20 [11/0/0/0] -> 3.20 |
| defensive | 20.25 [3/1/2/0] / 19.50 [6/0/0/0] / 19.80 [4/1/2/0] -> 19.80 | 12.00 [6/0/0/0] / 12.00 [3/1/0/0] / 11.60 [4/0/0/0] -> 12.00 | 3.00 [17/1/1/0] / 3.00 [18/2/3/0] / 2.40 [15/2/2/0] -> 3.00 | 4.50 [5/0/0/0] / 3.70 [1/0/0/0] / 4.50 [3/1/0/0] -> 4.50 |
| wolf22-defensive | 20.00 [2/1/1/0] / 19.50 [3/2/4/0] / 18.70 [5/1/1/0] -> 19.50 | 12.00 [5/0/0/0] / 12.00 [5/0/0/0] / 12.00 [3/0/0/0] -> 12.00 | 1.60 [14/0/0/0] / 2.40 [18/0/1/0] / 2.70 [18/1/0/0] -> 2.40 | 4.50 [8/0/0/0] / 4.10 [2/0/0/0] / 3.70 [3/0/0/0] -> 4.10 |

The low-zero TTK values are retained as observed outputs. They may represent
single-hit kills; they are not interpreted as zero engagement time.

## All-outcome cell accounting

This table retains every target record, including unfinished/censored and
regained records. Minimum HP is the median / minimum runner fraction across
the three seeds. Incoming HP is the median / maximum per-run incoming total.
Recovery is completed / interrupted telemetry with its median completed-window
duration. Pack counts are observed episode member counts: solo / small (2–3) /
swarm (4+). They are not body TTK and are not used as exact pack-clear
durations.

| Class | Arm | Body TTK | Clean / records | K / U / R | Deaths / LQ | MinHP median / min | Incoming HP median / max | Player / minion beats | Recovery done / int. | Howl start / fired | Packs solo / small / swarm | Episodes |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Striker | reference | 10.00s | 77 / 80 | 77 / 3 / 0 | 1 / 0 | 1.7% / 0.0% | 3924.0 / 4286.0 | 928 / 0 | 36 / 0 (3.35s) | 27 / 27 | 24 / 0 / 14 | 38 |
| Striker | wolf22 | 6.75s | 90 / 91 | 90 / 1 / 0 | 0 / 0 | 36.7% / 30.7% | 3388.0 / 4011.0 | 1128 / 0 | 44 / 0 (3.30s) | 30 / 30 | 31 / 0 / 15 | 46 |
| Striker | defensive | 15.00s | 66 / 68 | 66 / 2 / 0 | 0 / 0 | 47.4% / 42.6% | 3477.0 / 3550.0 | 1121 / 0 | 32 / 0 (3.40s) | 35 / 34 | 23 / 1 / 11 | 35 |
| Striker | wolf22-defensive | 14.70s | 67 / 71 | 67 / 4 / 0 | 0 / 0 | 55.0% / 47.8% | 2846.0 / 2884.0 | 1049 / 0 | 32 / 0 (3.40s) | 34 / 34 | 23 / 0 / 12 | 35 |
| Apprentice | reference | 3.20s | 89 / 93 | 90 / 3 / 3 | 0 / 0 | 41.8% / 39.0% | 1600.7 / 1630.8 | 656 / 0 | 33 / 1 (4.00s) | 34 / 30 | 25 / 2 / 9 | 36 |
| Apprentice | wolf22 | 3.20s | 96 / 99 | 96 / 3 / 1 | 0 / 0 | 49.0% / 47.8% | 1474.8 / 1544.3 | 643 / 0 | 37 / 0 (3.70s) | 37 / 34 | 27 / 0 / 13 | 40 |
| Apprentice | defensive | 3.35s | 81 / 94 | 85 / 9 / 10 | 0 / 0 | 53.1% / 45.7% | 1470.5 / 1522.2 | 735 / 0 | 15 / 0 (3.40s) | 58 / 58 | 9 / 1 / 8 | 18 |
| Apprentice | wolf22-defensive | 3.20s | 81 / 91 | 86 / 5 / 7 | 0 / 0 | 57.2% / 56.5% | 938.7 / 1221.3 | 698 / 0 | 14 / 0 (4.15s) | 53 / 53 | 9 / 1 / 7 | 17 |

Across the matrix there were 687 target records: 657 kills, 30
unfinished/censored records, and 21 records with observed HP regain. There
were 647 clean records. Regain can overlap killed or unfinished records and
is not a partition.

## Matched four-arm sensitivity

Matched sensitivity retains a complete class/seed set only when all four arms
are present and none has an internal or terminal outgoing-damage quiet
interval of at least 30 seconds. All six sets passed this gate:

| Matched set | Arms retained | Geometry | Equipment / upgrades | Follower stats | Long quiet |
|---|---:|---:|---:|---:|---:|
| Striker / 9029 | 4 / 4 | pass | pass | pass | none |
| Striker / 10427 | 4 / 4 | pass | pass | pass | none |
| Striker / 12007 | 4 / 4 | pass | pass | pass | none |
| Apprentice / 9029 | 4 / 4 | pass | pass | pass | none |
| Apprentice / 10427 | 4 / 4 | pass | pass | pass | none |
| Apprentice / 12007 | 4 / 4 | pass | pass | pass | none |

The following contrasts are differences of matched aggregate medians across
the three seed sets for that class. Δ is left arm minus right arm: positive
minimum HP is better, negative incoming HP is lower exposure, and positive
body TTK is slower. Combined means wolf22-defensive.

| Class | Contrast | Δ median minimum HP | Δ median incoming HP | Δ body TTK | Deaths left vs right |
|---|---|---:|---:|---:|---:|
| Striker | wolf22 - reference | +34.9 pp | -536.0 HP | -3.25s | 0 vs 1 |
| Striker | wolf22-defensive - defensive | +7.6 pp | -631.0 HP | -0.30s | 0 vs 0 |
| Striker | defensive - reference | +45.7 pp | -447.0 HP | +5.00s | 0 vs 1 |
| Striker | wolf22-defensive - wolf22 | +18.3 pp | -542.0 HP | +7.95s | 0 vs 0 |
| Apprentice | wolf22 - reference | +7.3 pp | -125.9 HP | 0.00s | 0 vs 0 |
| Apprentice | wolf22-defensive - defensive | +4.2 pp | -531.8 HP | -0.15s | 0 vs 0 |
| Apprentice | defensive - reference | +11.3 pp | -130.2 HP | +0.15s | 0 vs 0 |
| Apprentice | wolf22-defensive - wolf22 | +8.2 pp | -536.1 HP | 0.00s | 0 vs 0 |

The primary packet comparisons are therefore retained without partial-arm
repair: wolf22/reference and combined/defensive measure attack relief within
each stance, while defensive/reference and combined/wolf22 measure the stance
tradeoff. The combined arm has the best Striker aggregate minimum-HP median
(55.0%) and lowest incoming median (2846.0 HP), but its body TTK is 14.70s
versus 6.75s for Wolf22 offensive. That is a tradeoff, not evidence that the
two changes must ship together.

## Pressure sources, casts, recovery, and pack overlap

Incoming damage came from direct and debt components. No incoming event was
labelled as dot. The raw event stream recorded:

| Source | Incoming events | Direct HP | Debt HP | Total HP |
|---|---:|---:|---:|---:|
| Dire Wolf | 2,058 | 26,708.9 | 152.0 | 26,860.9 |
| Ironclaw Badger | 933 | 14,513.1 | 2.0 | 14,515.1 |
| Dire Whelp | 1,988 | 8,834.4 | 27.0 | 8,861.4 |
| Thorn Spitter | 342 | 6,039.6 | 88.0 | 6,127.6 |
| Total | 5,321 | 56,096.0 | 269.0 | 56,365.0 |

Duration and exposure are read together: a longer-lived run can accumulate
more total incoming damage, so a lower or higher total is not by itself a
per-hit claim. The matched tables retain both body TTK and incoming HP for
that reason.

The largest individual incoming event was 28 HP and the largest rolling
one-second incoming total was 75 HP. Persisted samples contained 7,062 rows;
402 had nonzero incomingDot, with a maximum of 8. This state telemetry is
reported separately and was not reclassified as event damage. There were zero
staticDamageContacts and zero blockedApproach samples.

The outgoing event stream recorded 8,265 player-to-monster damage events
totalling 406,403 HP:

| Damage type | Events | HP |
|---|---:|---:|
| Direct | 6,279 | 279,162 |
| AOE | 458 | 12,994 |
| DoT | 1,528 | 114,247 |
| Total | 8,265 | 406,403 |

Striker contributed 4,226 direct events / 176,228 HP and 458 AOE events /
12,994 HP. Apprentice contributed 2,053 direct events / 102,934 HP and 1,528
DoT events / 114,247 HP.

Raw activation and monster-cast telemetry was:

| Class / arm | Sweep activations | Second Wind activations | Howl starts / fired | Barrage starts / fired |
|---|---:|---:|---:|---:|
| Striker / reference | 174 | 39 | 27 / 27 | 0 / 0 |
| Striker / wolf22 | 212 | 46 | 30 / 30 | 0 / 0 |
| Striker / defensive | 240 | 41 | 35 / 34 | 8 / 8 |
| Striker / wolf22-defensive | 230 | 30 | 34 / 34 | 13 / 13 |
| Apprentice / reference | 157 | 19 | 34 / 30 | 2 / 2 |
| Apprentice / wolf22 | 156 | 15 | 37 / 34 | 4 / 0 |
| Apprentice / defensive | 169 | 23 | 58 / 58 | 17 / 2 |
| Apprentice / wolf22-defensive | 165 | 10 | 53 / 53 | 13 / 1 |

Across the matrix there were 1,503 Sweep activations, 223 Second Wind
activations, 308 Howl starts with 300 fired ends, and 57 Barrage starts with
26 fired ends. Cast starts and fired ends come from raw monster cast events;
the target-level analysis can undercount casts that occur before a target's
first registered damage. Cast counts were not inferred from attack beats.

Recovery telemetry contained 243 completed windows and 1 interrupted window.
Across 264 usable episodes, the episode-start to first-damage approach proxy
had a 0.5s median and an observed 0–1.7s range. This is not pathfinding proof.
There were 265 episodes in total: 171 solo, 5 small, and 89 swarm. The one
second sampling resolution can miss brief overlap, and no pack-clear duration
is substituted for these counts or for body TTK.

Forest03 has no lava or Heat mechanic in scope. No environmental-contact
explanation was present in the retained samples.

## Death and sub-20% survivor audit

The runner minimum is evaluated on the 100ms simulation tick; persisted
samples are one second apart. Incoming windows below are event-stream HP
damage in the stated interval, centered on the death event or the lowest
persisted sample. The nearest sample is context, not the authoritative runner
minimum.

| Case | Outcome / cause | Runner minimum / nearest persisted sample | ±10s incoming sources | ±30s incoming sources | DoT / environment |
|---|---|---|---|---|---|
| F03 Striker reference / 9029 | Death at 161.2s; Dire Wolf melee, 23 HP | 0%; 161.0s: 21.2/251 (8.4%) | Wolf 173; Whelp 101 | Wolf 416; Whelp 191 | incomingDot 0; no contacts |
| F03 Striker reference / 10427 | Window-ended survivor | 18.4%; 252.0s: 47.0/251 (18.7%) | Wolf 278; Whelp 65 | Wolf 636; Whelp 216; Badger 180 | incomingDot 0; no contacts |
| F03 Striker reference / 12007 | Window-ended survivor | 1.7%; 102.0s: 11.4/251 (4.5%) | Wolf 232; Whelp 89 | Wolf 613; Whelp 345; Spitter 56 | incomingDot 0; no contacts |

All deaths and sub-20% runner minima were in the Striker reference arm. The
death's final recorded hit was a 23 HP Dire Wolf melee event; the persisted
sample immediately before it is not substituted for the authoritative event.
Wolf22 and defensive stance each resolved this tail in the fixed Forest03
screen, while their exposure and tempo costs differed. This is a focused
diagnostic, not proof that all Forest nodes or all classes need the same
change.

## Planner interpretation and exit boundary

The Wolf22 arm is the cleaner localized pressure candidate when the desired
intervention is to reduce adult-Wolf incoming damage while leaving offensive
player behavior intact. In the Striker matched screen it removed the only
death, raised median minimum HP from the reference by 34.9 points, reduced
incoming HP by 536.0, and did not add a defensive stance damage penalty. Its
effect is specifically the adult Wolf attack overlay; it should not be
generalized to Badger, Whelp, Spitter, every Forest adult, or every tier
without new evidence.

Defensive stance is independently a viable build answer at Wolf27 in this
screen. It removed the Striker death and raised matched median minimum HP by
45.7 points, but its final damage dealt multiplier fell from 1.288 to 0.952,
its cooldown increased, and body TTK increased by 5.00s. It should be
reported as a player-choice tradeoff, not as proof that offensive stance must
always survive. The combined arm improves aggregate durability further, but
both single-axis arms already had zero deaths, so this packet does not support
requiring both changes together.

Apprentice is a second pressure-sensitive comparison, not a retest of the
other class roots. All four Apprentice arms survived, so its smaller
differences are descriptive. Defensive and combined arms show stronger
minimum-HP medians but also more censored or regained target records; that
limits a simple winner claim. Apprentice does not justify a universal stance
rule or a global Forest multiplier.

No production adoption, additional frozen rerun, source balance patch,
economy/acquisition run, route certification, browser playtest, human-feel
claim, Volcano conclusion, or T4 conclusion follows from this packet. The
next stage is current-source reconciliation and fresh confirmation of the
bounded Forest choice alongside the parked Volcano candidate. Do not lower
all mob duration solely for another class, force every fast class to a common
floor, or infer ability contribution from beat counts alone.

Planner correction (2026-09-16): the spawned adult attack table was corrected
against raw ready.json: Wolf32/26, Badger30. Base overlays27/22 and25 were
correct; this was a report transcription error, not a failed treatment. Use
species TTK for tempo: Striker Wolf19.25s reference,20s Wolf22,30.6s defensive.
The mixed-body median decrease under Wolf22 does not mean Wolves died faster.
