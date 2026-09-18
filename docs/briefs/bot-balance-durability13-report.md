# Durability 13 report — sustained-engagement gate stopped before Volcano technique comparison

Status: **complete gate-stopped frozen synthetic run; no live balance change**.
The operator ran the fixed Durability 13 movement block once and sequentially:
5 cells / 15 observations, all with 300-second windows. The runner exited 0,
the movement verifier returned `verified:true`, and the prescribed engagement
gate returned `passed:false`. The gate stopped the experiment before the
72-observation `durability13swarm` block; that block was not launched.

There were no retries, restarts, adaptive changes, source edits, balance edits,
or automatic technique winners. Existing output was not overwritten.

## Decision summary

- **Hold all balance values.** This packet is an exposure check, not a reason
  to change HP, attack, plating, resistance, weapons, abilities, classes,
  runes, spawn rules, or Heat.
- **Keep the movement issue on the planner watch list.** The gate failed only
  on T3 Swamp 05 Striker seed 6151: a sampled 83.2-second outgoing-damage gap
  from 216.7s to the 300s window end. The player selected a full-health Mire
  Hexer, but `target` stayed null; the player continued an approach loop. No
  explicit `blockedApproach` reason or hazard contact was recorded in that
  interval, so this is retained as an unresolved movement/approach or range
  resolution failure rather than attributed automatically to a valid blocked
  state, recovery, casting, death, or hazard.
- **Do not interpret Sweep versus Slam strength from this run.** The Volcano
  technique comparison was conditional on all 15 movement observations passing.
  Since the gate stopped expansion, there are no authorized block-2
  per-class/node/seed deltas, minion or charge-time comparison, or technique
  winner.
- The other 14 movement observations reached their full windows with no death
  and maximum sampled quiet intervals from 6.6s through 17.8s. That supports
  retaining the current balance inputs while exposure remains unresolved.

No production source or balance overlay was changed. Return to the planner with
the Swamp Striker/6151 exposure failure; any movement repair or resumed
technique screen requires a new explicit packet.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability13-operator-packet.md](bot-balance-durability13-operator-packet.md) |
| Frozen revision | `8cf9cb73e59862e5f3e1dbb9a392a92ba5bff269` |
| Frozen source tree | `5762bd013cf2061cd983c76dab378a79a589f529` |
| Definitions SHA-256 | `75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267` |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitbox SHA-256 | `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83` |
| Detached checkout | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability13-20260916/source` |
| Qualification root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability13/` |
| Results root | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability13-20260916/` |
| Mode / timestep / window | `run` / 100ms / 300s per movement observation |
| Movement seeds | `173, 3911, 6151` |
| Synthetic / economy eligible | `true` / `false` |

The detached checkout was verified at the frozen revision and tree with clean
tracked files. The shared checkout had unrelated dirty changes; those changes,
including concurrent status, heat/chill/death, and combat-presentation work,
were excluded from this run.

| Matrix block | Planned | Executed | Result |
|---|---:|---:|---|
| Movement: Jungle 05 Squire, Swamp 05 Striker, Volcano 03 Spirit Sweep, Volcano 05 Squire Sweep/Slam | 5 cells / 15 runs | 5 / 15 | 15 full windows, 0 deaths; verifier true |
| Conditional swarm: Volcano 03/05, six roots, Sweep/Slam | 24 cells / 72 runs | 0 / 72 | Not launched after movement gate failure |
| **Total** | **29 cells / 87 runs** | **5 / 15** | **Gate-stopped; 72 runs unexecuted** |

The operator ledger records the movement block from
`2026-09-16T13:18:05.3656928Z` through
`2026-09-16T13:20:27.2010311Z`: 141.8353383 seconds of wall time for
1h15m of simulated time. The movement results contain 67 files and
349,111,750 bytes; there is no `failed.json`. No swarm result directory or
second ledger entry was created.

The frozen packet's qualification receipt remains preparation evidence only:
frozen typecheck and the nine listed focused tests passed before launch. The
candidate replays under the qualification root were not used as independent
confirmation and were not rerun.

### Artifact hashes

| Artifact | SHA-256 |
|---|---|
| `manifest.json` | `A207911B8CBED42B03FE7A1A752814F08BCDB05200C148E99D7E0F1E0C3FF31A` |
| `index.json` | `BF2CF5856417F951287412ADF352C5DB4BE4F590FD05C64461E666891C24FB5F` |
| `complete.json` | `30828EEA69CA5FBC160776CEA26B2270A9236EE3E121B33E86CC9F31AF53FBFD` |
| `analysis.json` | `A3824AD593176C78F062EB58C159C16B243D7164CDCBAF851E8C3120572DE52B` |
| `analysis.md` | `2FEA8699E9C04AF727F376DD8BBCB93978CE1507011A7DBC958F45FBF9F1808E` |
| `engagement-gate.json` | `FE151B9B192152B6E8FBD70F4A74BE432D966EBDE1F7734E8C0B8859718801EE` |
| `verification.log` | `95666A5C3AC9F61C6E02F1B5277570DB14FBFD28BFAD9F4A7800822BDB71102E` |

## READY and initial-roster audit

All 15 `ready.json` artifacts matched their manifest cell and seed, were
synthetic, matched the corresponding `index.json` initial-roster hash, and
matched the manifest equipment. This audit was `15/15` for cell/seed,
synthetic flag, roster hash, and equipment.

The Volcano 05 Squire Sweep/Slam rows use the same build and identical initial
rosters within each seed. This is a readiness/geometry check only; it does not
turn the movement rows into the unexecuted block-2 comparison.

| Seed | Sweep initial-roster hash | Slam initial-roster hash | Geometry hash | Match |
|---:|---|---|---|---|
| 173 | `f77dffa73585e00ecb12f0232835fbcbd87ac57b58bddfe90af7330a4e7a513b` | `f77dffa73585e00ecb12f0232835fbcbd87ac57b58bddfe90af7330a4e7a513b` | `fcbc76a493edf8892b632724dde39c2aaa775b6fd7fb2a98e57494e7dce58eb7` | exact |
| 3911 | `14b8e4a1c3b8960d7a1f525328c76f809cd9c402a9383c55305ef9488a13a6f4` | `14b8e4a1c3b8960d7a1f525328c76f809cd9c402a9383c55305ef9488a13a6f4` | `baf7dcdfd68918d9e89bfde40406a8964028f740aef5bc5ea30c664de883708b` | exact |
| 6151 | `02ba410f0c05de36a3772a5aa93781b6038349e061c895542c49b85e8f99466f` | `02ba410f0c05de36a3772a5aa93781b6038349e061c895542c49b85e8f99466f` | `3d014ce21de088e1d6a2889e6b201929746c00364023d37d4c559d18bb1952bc` | exact |

## Engagement-gate receipt

The gate requires all 15 runs to reach the full window with no sampled
outgoing-damage gap of 30 seconds or more. Every observation ended at 300s;
the asterisk marks the one failing gate row.

| Case | Seed | Outcome | Maximum sampled quiet interval | Gate |
|---|---:|---|---:|---|
| T3 Jungle 05 Squire | 173 | `window-ended` | 6.6s | pass |
| T3 Jungle 05 Squire | 3911 | `window-ended` | 9.3s | pass |
| T3 Jungle 05 Squire | 6151 | `window-ended` | 6.9s | pass |
| T3 Swamp 05 Striker | 173 | `window-ended` | 8.3s | pass |
| T3 Swamp 05 Striker | 3911 | `window-ended` | 12.3s | pass |
| **T3 Swamp 05 Striker** | **6151** | **`window-ended`** | **83.2s*** | **fail** |
| T3 Volcano 03 Spirit Sweep | 173 | `window-ended` | 11.8s | pass |
| T3 Volcano 03 Spirit Sweep | 3911 | `window-ended` | 10.3s | pass |
| T3 Volcano 03 Spirit Sweep | 6151 | `window-ended` | 11.0s | pass |
| T3 Volcano 05 Squire Sweep | 173 | `window-ended` | 11.9s | pass |
| T3 Volcano 05 Squire Sweep | 3911 | `window-ended` | 17.8s | pass |
| T3 Volcano 05 Squire Sweep | 6151 | `window-ended` | 12.7s | pass |
| T3 Volcano 05 Squire Slam | 173 | `window-ended` | 14.6s | pass |
| T3 Volcano 05 Squire Slam | 3911 | `window-ended` | 13.7s | pass |
| T3 Volcano 05 Squire Slam | 6151 | `window-ended` | 12.9s | pass |

## Movement telemetry audit

The table preserves selected-target and combat-target behavior rather than
equating selection with contact. `Selected` and `combat` show distinct
non-null target IDs / sampled state-transition count; combat transitions count
the transitions through `null`. `Player-contact IDs` counts distinct monsters
that received player damage in the observation. `Static samples` counts samples
with non-empty `staticDamageContacts`. `Returning snapshots` counts sampled
monster awareness states of `returning`, not a player movement state.

| Case | Seed | Selected | Combat | Player-contact IDs | Static samples | Returning snapshots | Kills / censored | Min sampled HP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Jungle 05 Squire | 173 | 41 / 41 | 36 / 71 | 41 | 0 | 0 | 40 / 1 | 87.4% |
| Jungle 05 Squire | 3911 | 38 / 37 | 31 / 61 | 38 | 0 | 0 | 37 / 1 | 88.5% |
| Jungle 05 Squire | 6151 | 34 / 34 | 29 / 58 | 33 | 0 | 0 | 33 / 0 | 88.4% |
| Swamp 05 Striker | 173 | 28 / 40 | 28 / 91 | 28 | 29 | 0 | 27 / 1 | 89.4% |
| Swamp 05 Striker | 3911 | 28 / 33 | 26 / 80 | 26 | 72 | 581 | 26 / 0 | 87.9% |
| **Swamp 05 Striker** | **6151** | **23 / 28** | **23 / 66** | **23** | **111** | **421** | **23 / 0** | **87.1%** |
| Volcano 03 Spirit Sweep | 173 | 75 / 219 | 72 / 171 | 72 | 25 | 2,304 | 70 / 2 | 71.4% |
| Volcano 03 Spirit Sweep | 3911 | 78 / 201 | 75 / 172 | 76 | 9 | 1,715 | 73 / 3 | 68.8% |
| Volcano 03 Spirit Sweep | 6151 | 73 / 163 | 72 / 157 | 71 | 6 | 1,649 | 67 / 4 | 71.4% |
| Volcano 05 Squire Sweep | 173 | 58 / 67 | 47 / 93 | 64 | 6 | 0 | 63 / 1 | 78.9% |
| Volcano 05 Squire Sweep | 3911 | 48 / 55 | 44 / 94 | 52 | 2 | 0 | 52 / 0 | 80.6% |
| Volcano 05 Squire Sweep | 6151 | 52 / 59 | 47 / 98 | 68 | 0 | 0 | 66 / 2 | 77.5% |
| Volcano 05 Squire Slam | 173 | 55 / 73 | 53 / 112 | 64 | 4 | 0 | 61 / 3 | 70.9% |
| Volcano 05 Squire Slam | 3911 | 59 / 70 | 49 / 96 | 59 | 4 | 0 | 59 / 0 | 80.6% |
| Volcano 05 Squire Slam | 6151 | 57 / 65 | 50 / 102 | 60 | 2 | 0 | 60 / 0 | 72.5% |

All 45,000 movement samples had an empty `blockedApproach` field. The
non-failing runs show real player damage against their selected encounter
targets. The three Swamp runs recorded 30 shell-pool entry/leave pairs and 83
hazard-escape attempts, all with successful escape results. The Volcanic rows
recorded 58 lava-burn escape attempts, all successful. These hazard episodes
are separate from the final failing quiet interval.

### Failing Swamp Striker / seed 6151

The final outgoing damage event was at 216.7s against Bog Lurker
`node-t3-swamp-05_monster-5`, which was then cleared. At 216.8s the selected
target changed to Mire Hexer `node-t3-swamp-05_monster-14` at full 510 HP. From
216.8s through the final 299.9s sample:

- `selectedTargetId` remained monster 14 while `target` remained `null`; no
  player outgoing damage reached that target.
- The auto intent stayed `attack` for a Mire Hexer, with `auto-path-enemy` and
  `avoid-hazards` matched. `blockedApproach` and `dynamicHazardSignature` were
  empty.
- The player continued movement. At selection the target was about 598 units
  away; later samples brought the player to about 70 units, then the sampled
  approach goals and direction reversed repeatedly while the target remained
  selected. The Mire Hexer awareness state changed among wandering, attacking,
  and chasing, but never became the combat target.
- The last hazard event was at 215.2s. There was no hazard event or static
  contact in the 216.7–299.9s quiet interval. `incomingDot` was zero after the
  short preceding episode, and the player stayed alive with an 87.1% minimum
  sampled HP fraction.

This is not evidence of a death, a long recovery, a cast lock, or a hazard
contact. It is a reproducible-looking exposure symptom in this seed, but the
packet does not authorize a source diagnosis or repair from this result alone.

## Descriptive movement TTK

The following medians are recomputed from the raw `index.json.targets`: first,
the median of eligible clean target TTKs per seed; then the outer median across
the three available seed medians. `K/C/R` means killed / censored or unfinished
target records / observed HP-regain records. These are separate reported
categories; a target can contribute to more than one exclusion category. No
movement observation died, and no clean seed median was missing.

| Movement cell | Seed 173 clean median (n) | Seed 3911 clean median (n) | Seed 6151 clean median (n) | Outer median | Clean N | K/C/R by seed |
|---|---:|---:|---:|---:|---:|---|
| Jungle 05 Squire | 3.0s (40) | 2.8s (37) | 4.6s (33) | 3.0s | 110 | 40/1/0; 37/1/0; 33/0/0 |
| Swamp 05 Striker | 12.4s (27) | 4.8s (26) | 1.8s (23) | 4.8s | 76 | 27/1/0; 26/0/0; 23/0/0 |
| Volcano 03 Spirit Sweep | 1.5s (64) | 1.9s (71) | 2.0s (61) | 1.9s | 196 | 70/2/8; 73/3/3; 67/4/7 |
| Volcano 05 Squire Sweep | 3.6s (63) | 3.6s (52) | 4.2s (66) | 3.6s | 181 | 63/1/0; 52/0/0; 66/2/0 |
| Volcano 05 Squire Slam | 4.9s (61) | 4.4s (59) | 3.55s (60) | 4.4s | 180 | 61/3/0; 59/0/0; 60/0/0 |

### Encounter target types

These are incidental target records from the movement block, not the
unexecuted six-root swarm screen. The type-level medians are clean medians;
the kill/censor counts remain visible.

| Movement cell | Enemy | Killed / censored | Median clean TTK |
|---|---|---:|---:|
| Jungle 05 Squire | Jungle Stalker | 35 / 0 | 3.20s |
| Jungle 05 Squire | Canopy Chameleon | 43 / 0 | 1.80s |
| Jungle 05 Squire | Silverback | 32 / 2 | 9.60s |
| Swamp 05 Striker | Plague-Shell Snapper | 30 / 1 | 13.15s |
| Swamp 05 Striker | Mire Hexer | 26 / 0 | 1.50s |
| Swamp 05 Striker | Bog Lurker | 20 / 0 | 2.00s |
| Volcano 03 Spirit Sweep | Ember Scuttler | 148 / 5 | 1.40s |
| Volcano 03 Spirit Sweep | Cinder Hound | 17 / 0 | 3.90s |
| Volcano 03 Spirit Sweep | Magma Tortoise | 15 / 2 | 5.95s |
| Volcano 03 Spirit Sweep | Ash Salamander | 30 / 2 | 2.80s |
| Volcano 05 Squire Sweep | Ember Scuttler | 127 / 2 | 3.60s |
| Volcano 05 Squire Sweep | Magma Tortoise | 15 / 1 | 11.40s |
| Volcano 05 Squire Sweep | Ash Salamander | 23 / 0 | 3.60s |
| Volcano 05 Squire Sweep | Cinder Hound | 16 / 0 | 8.20s |
| Volcano 05 Squire Slam | Ember Scuttler | 119 / 2 | 3.10s |
| Volcano 05 Squire Slam | Magma Tortoise | 12 / 0 | 13.30s |
| Volcano 05 Squire Slam | Ash Salamander | 29 / 0 | 3.60s |
| Volcano 05 Squire Slam | Cinder Hound | 20 / 1 | 6.60s |

The Volcano 05 Squire Sweep/Slam movement rows share READY rosters per seed,
but they are not used as a technique verdict. The intended comparison block
would have supplied the six-root, paired, 72-observation context and was not
run.

## Pressure and safety boundary

All 15 movement observations ended at the 300s window with zero player deaths.
The lowest sampled HP fraction was 68.8% in Volcano 03 Spirit seed 3911; there
was no below-20% survivor. Movement summaries recorded 3,846 player attack
beats and approximately 35,657.2 incoming HP damage across the block, but the
gate result is driven by outgoing-damage telemetry, not by a durability
threshold. There are no block-2 death, 30-second-quiet, sub-20%-survivor, or
technique-delivery results to interpret.

## Limitations and exit boundary

- This is synthetic prepared-combat evidence only. It does not certify
  economy, acquisition, travel, client/UI presentation, browser play, human
  feel, live balance, or complete-tier behavior.
- Qualification and focused tests were pre-run preparation evidence. The full
  suite and live playtest were not rerun for this packet.
- The shared checkout's newer concurrent changes were outside the frozen
  revision and were not validated here.
- The gate failure is preserved as evidence; no retry, alternate seed,
  adaptive build, source edit, or automatic attribution was made.
- The 72-run Volcano Sweep/Slam block remains unexecuted. Do not report its
  absent observations as missing combat data or as a technique failure.

Recommendation: keep production source and all balance values unchanged,
retain the Swamp Striker/6151 selected-versus-combat-target loop for a new
movement-focused packet, and resume the wider Volcano technique comparison only
after a newly authorized engagement gate confirms sustained exposure.

## Planner follow-up — Swamp boundary loop diagnosed and repaired

The frozen diagnostic replay reproduced Swamp05 Striker/6151 exactly:
23 kills, last outgoing damage216.7s, initial roster hash
`f7b086db596545593fd2ee3a2aebc9a954276941d54029f89b69995caec774c2`.
The issue was hazard-clearance handoff, despite no actual player hazard contact
in the final loop. The Hexer repeatedly moved across the64px clearance envelope
of `rot_pool_1`. At220.5s the player retreated toward (1483.61,3515.11); by221.5s
the target was just outside that envelope and the player reversed toward
(1193.16,3568.79), abandoning the unfinished retreat. The Hexer backed toward
the pool as the player closed. This repeated without reaching melee contact.

Normal chase also cleared the hazard-approach attempt, restarting its15s timer
on every cycle. The timeout therefore never expired and no blocked reason was
emitted. Empty `blockedApproach` did not establish successful approach behavior.

Repair `6be18a7b6974bc10df5fe2cb31cf24a628b784de` retains a chosen safe retreat
until arrival even when the target briefly leaves the clearance envelope.
Actual attack contact still releases the pull. The timeout survives ordinary
chase interleaved with hazard pulling; target change, contact, damage or disabling
avoidance can reset it. No numeric balance, spawn or monster ability changes.

The seven-case candidate replay kept outgoing damage through295.6–299.9s.
Swamp6151 had27 kills, an11.2s largest sampled quiet interval, and actual contact
with monster14 (the previously stalled Hexer), rather than merely skipping it.
These are diagnostic candidate results, not independent balance observations.
Baseline and candidate artifacts are under
`C:/Users/osaif/AppData/Local/mmo-idle/validation/durability14/`.
Frozen follow-up qualification completed15/15 full300s windows with zero deaths
and maximum quiet gaps6.3–16.4s. Swamp6151's maximum is11.7s; its Hexer14 was killed
at176.0s after first damage174.8s. The matrix verifier and engagement gate passed.
[Durability14](bot-balance-durability14-operator-packet.md) records exact hashes
and resumes only the pending72 Volcano comparisons; that comparison is not launched.
