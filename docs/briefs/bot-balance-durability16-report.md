# Durability 16 report — isolate Volcano anchor and gunner attack relief

Status: **complete frozen synthetic benchmark; no production balance change**.
The operator ran the exact Durability 16 matrix once and sequentially: 24 cells
/ 72 observations across T3 Volcanic 03 and 05, the pressure-sensitive
Apprentice / Slinger / Conduit roots, Sweep, four fixed attack-treatment arms,
and seeds 3911 / 6151 / 8089. The reporter completed, the verifier returned
`verified:true`, and the exposure audit completed. There were no retries,
restarts, adaptive changes, source edits, balance edits, or automatic winner
selections.

## Decision summary

- **Do not adopt any numeric balance change.** Durability16 isolated Tortoise
  and Ash Salamander attack relief while holding Tortoise at 3,000 HP and 420
  Molten Guard capacity. It is a useful candidate screen, not live-balance
  certification.
- **Keep `both80` as a local follow-up candidate overlay.** It produced no
  player deaths and raised the all-outcome runner minimum-HP median over the
  anchor150 reference in all four usable Apprentice / Slinger groups: +21.6,
  +13.2, +28.2, and +20.2 percentage points for V03 Apprentice, V03 Slinger,
  V05 Apprentice, and V05 Slinger. It retained comparable Tortoise duration
  in those groups, but it is not an automatic winner and still has Conduit
  exposure failures.
- **Neither single-species arm is a universal solution.** `tortoise80` has
  mixed usable-root minimum-HP deltas (+5.3, -2.1, +4.9, +2.5 pp), while
  `salamander80` also moves in opposite directions (-5.7, +8.0, +20.8,
  -8.1 pp). The combined result includes a positive interaction in the
  usable roots, so the two single arms remain diagnostic comparisons rather
  than adoption candidates.
- **Conduit remains unresolved.** V03 Conduit anchor150 / 8089 died, while
  V03 Conduit / 8089 and V05 Conduit / 3911 contain long quiet intervals in
  other arms. Do not convert those quiet survivors into balance success. Carry
  the targeted movement / minion investigation separately; do not launch
  another whole-matrix retry.
- **Preserve the one death, the one additional sub-20% survivor, and all seven
  exposure flags.** The death and low survivor are both V03 Conduit anchor150;
  their windows are retained below with incoming source attribution separate
  from Heat, lava-contact, and persisted DoT state.
- **Continue the broader plan with remaining T2/T3 role and roster gaps,
  including Forest.** Reconcile any eventual candidate with current combat
  changes and obtain fresh-seed confirmation before adoption. Slam / ability
  tuning, item / class balance, boss TTK, and T4 remain later.

No production combat, balance, route, economy, acquisition, or client source
was changed. This report returns the isolated attack-relief evidence to the
planner; it does not certify live balance, human feel, browser play, economy,
acquisition, or a complete tier / biome result.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability16-operator-packet.md](bot-balance-durability16-operator-packet.md) |
| Frozen revision | 1b0188d805e2357afdea3679e8886f6cace7faba |
| Frozen source tree | 637eadabf1a9ab1ff6ac3ff96ff33e8058860cfc |
| Definitions SHA-256 | 75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 |
| Hitboxes | C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json |
| Hitbox SHA-256 | 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83 |
| Detached checkout | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability16-20260916/source |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability16-20260916/results-volcano |
| Trial / mode | durability16 / run |
| Timestep / window | 100ms / 300s per observation |
| Seeds | 3911, 6151, 8089 |
| Synthetic / economy eligible | true / false |

The four fixed treatment arms were:

| Arm | Tortoise HP | Tortoise Molten Guard capacity | Tortoise attack | Salamander attack |
|---|---:|---:|---:|---:|
| anchor150 reference | 3,000 | 420 | 145 | 105 |
| tortoise80 | 3,000 | 420 | 116 | 105 |
| salamander80 | 3,000 | 420 | 145 | 84 |
| both80 | 3,000 | 420 | 116 | 84 |

The 3,000 HP / 420 capacity anchor is fixed in every arm; this experiment
does not retest HP2,000 or estimate the HP effect. Salamander HP1,330 and all
other stats and mechanics remained unchanged: Scuttlers, Hounds, Heat, plating,
damage reduction, shield percentage, pack behavior, abilities, equipment,
runes, stances, and natural ecology. Process-local overlays restored all
definitions after each observation. No artificial respawns, teleports, refills,
or target stripping were used.

The local preparation passed 24/24 setup qualifications, the four
Apprentice05 / 3911 arms passed a 30-second pilot with zero deaths and zero
long-quiet flags, the overlay isolation / restoration test passed, and the
frozen benchmark typecheck passed. Those checks were tooling evidence only and
were not rerun as balance samples. Full-suite tests and browser play were not
rerun. Concurrent shared-checkout combat, DoT, Detonate, and presentation edits
were excluded from the detached frozen run.

| Matrix block | Planned | Executed | Outcomes |
|---|---:|---:|---|
| Volcanic 03/05, Apprentice / Slinger / Conduit, four arms, Sweep | 24 cells / 72 runs | 24 / 72 | 71 window-ended, 1 player death |
| **Total** | **24 / 72** | **24 / 72** | **72 retained, 0 failed** |

The operator ledger records 2026-09-16T16:01:05.0139150Z through
2026-09-16T16:08:32.8414330Z: **7m27.827518s** wall time for **6h** of
simulated time. The results root contains **295 files / 260,709,634 bytes**
and no `failed.json`. The detached checkout remained at the frozen revision
and tree with no tracked working-tree changes.

## Artifact verification

The retained completion, verifier, and exposure output were:

    {"cells":24,"runs":72,"mode":"run"}
    {"trial":"durability16","cells":24,"runs":72,"verified":true}
    {"runs":72,"matchedSets":18,"longQuietRuns":7,"deaths":1}

| Artifact | SHA-256 |
|---|---|
| manifest.json | 60603BF877BF37FD3CD7C580FF613B2F70706799F0DF868B0D01C6F33B961A54 |
| index.json | 7B569DCB9EBC59B3F3D8D53DFCB17681E8CA65926C4E9B6CD3CBE4A8E59634B9 |
| complete.json | 461F7AA3B527BB71770A39F99AABF07ABA284DDDE900471D406209D5CEBCA105 |
| analysis.json | 1FF68417499A08F08C3322A4309325D26DDCE7E3BF51EDF883313795460E9920 |
| analysis.md | 15331C643E2A8EB2D05692397477E9A7397A9D04F1CF9F86A41FA56341B7F2F6 |
| exposure-audit.json | 57122A6215FC944853897E370A626319053D9D1F7CC4AC6AB06E3459FCF79591 |
| verification.log | 74F564C66D10B5C97800C124AB55A9D23559DD636E2B3742F9E64989E33D61D5 |

The raw artifacts are retained outside the repository at the results root
listed above. The generated `analysis.json`, `analysis.md`, completion record,
exposure audit, and verification log are not substitutes for the raw
`index.json`, per-run `events.jsonl`, and per-run `samples.jsonl`.

## READY and paired-geometry audit

All 72 `ready.json` records were synthetic, matched their manifest cell and
seed, and passed the expected arm overlay check. The configured treatment
values were visible in the READY `hpTreatment` records for all four arms.
All 18 class/node/seed four-arm sets had identical `geometryRosterHash` values
and identical equipment. The audit found 72/72 READY identity passes, 72/72
overlay passes, 18/18 geometry-equal sets, and 18/18 equipment-equal sets.

This confirms treatment setup and paired initial geometry. It does not claim
that later natural ecology exposed every treatment to the same targets, that
all fights maintained continuous outgoing damage, or that an unflagged run
proves perfect movement.

## Reproducibility against Durability15 bookends

Durability16 intentionally repeats the Durability15 anchor150 and combined
bookends for the same class/node/seed combinations. The comparison below
matched outcome, elapsed time, kills / censoring, minimum HP, attack beats,
target records, episodes, recovery, incoming damage, and clean TTK fields.

| Durability16 arm | Durability15 arm | Repeated observations | Exact index-field matches |
|---|---|---:|---:|
| anchor150 | anchor150 | 18 | 18/18 |
| both80 | anchor150-pressure80 | 18 | 18/18 |
| **Total** | **bookends** | **36** | **36/36** |

This is a reproducibility check, not independent confirmation: the paired
historical seeds and repeated bookends do not establish a new population rate.
The two single-species arms contain the new information.

## Exposure audit and matched sensitivity

The exposure audit flags any internal or terminal outgoing-damage gap of at
least 30 seconds. Seven observations were flagged:

| Cell / seed | Arm | Maximum quiet | Terminal quiet | Outcome |
|---|---|---:|---:|---|
| V03 Slinger / 3911 | anchor150 | 167.5s | 167.5s | window-ended |
| V03 Slinger / 3911 | tortoise80 | 167.5s | 167.5s | window-ended |
| V03 Conduit / 8089 | tortoise80 | 216.6s | 216.6s | window-ended |
| V03 Conduit / 8089 | salamander80 | 218.4s | 218.4s | window-ended |
| V03 Conduit / 8089 | both80 | 222.0s | 222.0s | window-ended |
| V05 Conduit / 3911 | salamander80 | 76.2s | 76.2s | window-ended |
| V05 Conduit / 3911 | both80 | 76.2s | 76.2s | window-ended |

The whole-four-arm sensitivity excludes an entire class/node/seed set if any
arm in that set has a long-quiet flag. Three of the 18 sets are excluded:

- V03 Slinger / 3911, because anchor150 and tortoise80 are flagged.
- V03 Conduit / 8089, because tortoise80, salamander80, and both80 are
  flagged; the anchor150 death is retained but is not itself a long-quiet
  flag.
- V05 Conduit / 3911, because salamander80 and both80 are flagged.

The matched screen therefore leaves 15 complete four-arm sets and 60 retained
observation rows. All-outcome tables retain every raw row; matched tables do
not convert excluded, unfinished, regained, or dead targets into zeros.

Each matched entry is eligible seeds; clean target records / all target
records; outer Magma Tortoise clean TTK. The Tortoise TTK remains descriptive
and can be missing when no clean Tortoise target is available.

| Node / class | anchor150 | tortoise80 | salamander80 | both80 |
|---|---:|---:|---:|---:|
| V03 Apprentice | 3; 118/133; 12.20s | 3; 122/150; 12.30s | 3; 128/146; 12.30s | 3; 126/151; 12.50s |
| V03 Slinger | 2; 94/114; 13.50s | 2; 88/109; 15.65s | 2; 82/99; 17.35s | 2; 81/100; 16.95s |
| V03 Conduit | 2; 52/70; 15.90s | 2; 54/71; 15.90s | 2; 55/76; 15.90s | 2; 53/71; 16.23s |
| V05 Apprentice | 3; 111/136; 14.25s | 3; 114/136; 14.80s | 3; 98/124; 13.50s | 3; 106/131; 14.25s |
| V05 Slinger | 3; 122/144; 13.60s | 3; 125/153; 13.60s | 3; 127/151; 18.10s | 3; 131/152; 16.90s |
| V05 Conduit | 2; 34/54; — | 2; 34/54; — | 2; 33/60; — | 2; 33/60; — |

The matched screen still has no eligible V03 Conduit / 8089 set and no
eligible V05 Conduit / 3911 set. Exposure exclusions are an interpretation
boundary, not proof that every retained set is mechanically clean.

## Clean TTK by species

Clean TTK is post-first-damage body time. Each entry is the clean median for
seeds 3911 / 6151 / 8089, followed by the outer median across available seed
medians, in seconds. Missing clean seed medians remain `—`. Unfinished targets
and observed HP-regain targets are excluded from this table; their counts
remain visible in the accounting table. Three seed values are descriptive and
do not establish a precise population failure rate.

### T3 Volcanic 03

| Class / arm | Ember Scuttler | Cinder Hound | Ash Salamander | Magma Tortoise |
|---|---:|---:|---:|---:|
| Apprentice / anchor150 | 2.45/2.80/2.80 -> 2.80 | 6.00/6.80/6.55 -> 6.55 | 5.30/5.00/5.00 -> 5.00 | 12.20/11.90/12.70 -> 12.20 |
| Apprentice / tortoise80 | 2.60/3.00/2.90 -> 2.90 | 6.40/7.35/6.00 -> 6.40 | 7.80/4.85/4.90 -> 4.90 | 13.60/11.90/12.30 -> 12.30 |
| Apprentice / salamander80 | 2.40/2.65/2.70 -> 2.65 | 6.00/6.50/9.90 -> 6.50 | 5.10/5.10/5.10 -> 5.10 | 12.30/11.70/14.55 -> 12.30 |
| Apprentice / both80 | 2.40/2.50/2.80 -> 2.50 | 6.75/6.60/9.90 -> 6.75 | 4.90/5.10/4.90 -> 4.90 | 12.10/12.50/14.10 -> 12.50 |
| Slinger / anchor150 | 2.80/3.10/2.80 -> 2.80 | 5.05/5.25/5.00 -> 5.05 | 4.70/4.40/4.45 -> 4.45 | —/12.40/14.60 -> 13.50 |
| Slinger / tortoise80 | 2.80/2.25/2.80 -> 2.80 | 5.05/5.10/5.00 -> 5.05 | 4.70/4.70/4.15 -> 4.70 | —/16.70/14.60 -> 15.65 |
| Slinger / salamander80 | 2.80/2.80/2.80 -> 2.80 | 4.60/6.60/4.40 -> 4.60 | 3.90/4.30/4.10 -> 4.10 | 12.90/11.90/22.80 -> 12.90 |
| Slinger / both80 | 2.80/1.90/2.80 -> 2.80 | 4.70/6.40/4.40 -> 4.70 | 4.30/4.70/4.10 -> 4.30 | 13.20/11.10/22.80 -> 13.20 |
| Conduit / anchor150 | 4.85/9.95/11.10 -> 9.95 | 16.20/13.95/— -> 15.07 | 11.40/9.00/7.20 -> 9.00 | 16.70/15.10/— -> 15.90 |
| Conduit / tortoise80 | 5.00/9.50/11.10 -> 9.50 | 19.50/13.95/— -> 16.73 | 7.40/9.00/5.40 -> 7.40 | 16.70/15.10/33.70 -> 16.70 |
| Conduit / salamander80 | 3.40/9.95/11.40 -> 9.95 | 12.60/13.95/— -> 13.28 | 21.30/9.00/5.40 -> 9.00 | 16.70/15.10/32.00 -> 16.70 |
| Conduit / both80 | 4.50/9.50/11.00 -> 9.50 | 17.55/13.95/— -> 15.75 | 10.40/9.00/5.40 -> 9.00 | 17.35/15.10/28.60 -> 17.35 |

### T3 Volcanic 05

| Class / arm | Ember Scuttler | Cinder Hound | Ash Salamander | Magma Tortoise |
|---|---:|---:|---:|---:|
| Apprentice / anchor150 | 3.00/3.00/3.00 -> 3.00 | 7.70/6.00/7.10 -> 7.10 | 5.80/5.70/5.80 -> 5.80 | 13.50/—/15.00 -> 14.25 |
| Apprentice / tortoise80 | 3.00/3.00/3.00 -> 3.00 | 7.90/7.15/6.50 -> 7.15 | 5.80/6.00/5.80 -> 5.80 | 13.50/16.50/14.80 -> 14.80 |
| Apprentice / salamander80 | 3.00/3.00/3.00 -> 3.00 | 7.25/7.20/6.90 -> 7.20 | 5.80/5.80/5.80 -> 5.80 | 13.50/16.50/13.50 -> 13.50 |
| Apprentice / both80 | 3.00/3.00/3.00 -> 3.00 | 7.30/6.60/8.20 -> 7.30 | 5.20/5.65/5.80 -> 5.65 | 13.50/15.00/14.25 -> 14.25 |
| Slinger / anchor150 | 2.80/2.50/3.55 -> 2.80 | 6.70/8.40/5.30 -> 6.70 | 5.05/5.30/4.70 -> 5.05 | 13.60/16.00/13.50 -> 13.60 |
| Slinger / tortoise80 | 2.80/3.00/2.90 -> 2.90 | 6.70/6.95/8.05 -> 6.95 | 5.05/5.00/4.70 -> 5.00 | 13.60/16.20/13.50 -> 13.60 |
| Slinger / salamander80 | 2.15/3.20/3.10 -> 3.10 | 6.15/6.70/8.30 -> 6.70 | 5.70/4.70/4.70 -> 4.70 | 14.00/18.50/18.10 -> 18.10 |
| Slinger / both80 | 2.80/3.20/2.90 -> 2.90 | 7.25/6.70/6.25 -> 6.70 | 4.90/4.70/4.55 -> 4.70 | 13.40/18.50/16.90 -> 16.90 |
| Conduit / anchor150 | 10.15/8.55/10.25 -> 10.15 | 19.60/—/15.95 -> 17.77 | 16.60/13.20/10.45 -> 13.20 | —/—/— -> — |
| Conduit / tortoise80 | 10.15/8.55/10.25 -> 10.15 | 19.60/—/15.95 -> 17.77 | 16.60/13.20/10.45 -> 13.20 | —/—/— -> — |
| Conduit / salamander80 | 8.95/7.00/12.40 -> 8.95 | 18.10/—/25.30 -> 21.70 | 11.45/13.20/10.70 -> 11.45 | —/—/— -> — |
| Conduit / both80 | 8.95/7.00/12.40 -> 8.95 | 18.10/—/25.30 -> 21.70 | 11.45/13.20/10.70 -> 11.45 | —/—/— -> — |

## All-outcome cell accounting

The body TTK column is the outer median of per-seed clean cell medians. The
records column counts every damaged target record. Kills, censored, and
observed HP-regain records are separate; regain can overlap killed or censored
and is not a partition. Minimum HP is the median / minimum runner fraction
across the three seeds. Incoming HP is the median / maximum per-run incoming
total. Attack beats are cooldown timestamp changes, not guaranteed hits.
Recovery is completed / interrupted recovery telemetry. Tortoise guard is the
configured 14% capacity. Cast counts are Molten Guard starts / fired ends.

| Node | Class | Arm | Body TTK | Tortoise HP/guard | Clean/records | Kills / censored / regained | D / LQ | MinHP med/min | Incoming HP med/max | Player/minion beats | Recovery done/int. | Casts start/fired |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| V03 | Apprentice | anchor150 | 3.40s | 3000/420 | 118/133 | 125 / 8 / 13 | 0 / 0 | 62.8%/56.2% | 2388.3/3061.6 | 819/0 | 1/0 | 9/9 |
| V03 | Apprentice | tortoise80 | 3.50s | 3000/420 | 122/150 | 142 / 8 / 27 | 0 / 0 | 68.1%/54.5% | 2104.0/2514.1 | 909/0 | 2/0 | 11/11 |
| V03 | Apprentice | salamander80 | 3.00s | 3000/420 | 128/146 | 140 / 6 / 15 | 0 / 0 | 57.1%/50.4% | 1370.2/2293.9 | 904/0 | 4/0 | 7/6 |
| V03 | Apprentice | both80 | 3.00s | 3000/420 | 126/151 | 140 / 11 / 23 | 0 / 0 | 84.4%/71.6% | 1153.6/1824.7 | 914/0 | 5/0 | 8/8 |
| V03 | Slinger | anchor150 | 3.20s | 3000/420 | 116/139 | 130 / 9 / 21 | 0 / 1 | 62.8%/49.2% | 1518.0/2629.0 | 1092/0 | 4/0 | 7/7 |
| V03 | Slinger | tortoise80 | 3.05s | 3000/420 | 110/134 | 127 / 7 / 20 | 0 / 1 | 60.7%/49.2% | 2210.0/2377.0 | 1095/0 | 4/0 | 7/7 |
| V03 | Slinger | salamander80 | 3.00s | 3000/420 | 126/150 | 143 / 7 / 23 | 0 / 0 | 70.8%/39.5% | 1628.0/1646.0 | 1223/0 | 1/0 | 8/8 |
| V03 | Slinger | both80 | 2.90s | 3000/420 | 128/155 | 146 / 9 / 26 | 0 / 0 | 76.0%/34.3% | 1195.0/1390.0 | 1280/0 | 1/0 | 9/9 |
| V03 | Conduit | anchor150 | 10.20s | 3000/420 | 58/80 | 68 / 12 / 17 | 1 / 0 | 2.1%/0.0% | 1779.0/2750.0 | 0/1739 | 5/0 | 6/5 |
| V03 | Conduit | tortoise80 | 9.95s | 3000/420 | 62/82 | 71 / 11 / 17 | 0 / 1 | 42.9%/37.1% | 1841.0/2222.0 | 0/1809 | 5/0 | 6/5 |
| V03 | Conduit | salamander80 | 9.95s | 3000/420 | 63/87 | 76 / 11 / 18 | 0 / 1 | 37.1%/29.2% | 1613.0/1865.0 | 0/1872 | 5/0 | 5/5 |
| V03 | Conduit | both80 | 9.95s | 3000/420 | 61/82 | 70 / 12 / 18 | 0 / 1 | 55.2%/53.1% | 1163.0/1843.0 | 0/1870 | 5/0 | 6/6 |
| V05 | Apprentice | anchor150 | 3.00s | 3000/420 | 111/136 | 123 / 13 / 21 | 0 / 0 | 57.3%/25.5% | 2564.5/3870.3 | 847/0 | 1/0 | 7/6 |
| V05 | Apprentice | tortoise80 | 3.00s | 3000/420 | 114/136 | 126 / 10 / 19 | 0 / 0 | 62.2%/58.2% | 2547.0/3024.2 | 873/0 | 4/0 | 9/9 |
| V05 | Apprentice | salamander80 | 3.20s | 3000/420 | 98/124 | 117 / 7 / 25 | 0 / 0 | 78.1%/55.5% | 1067.5/1622.2 | 847/0 | 1/0 | 7/7 |
| V05 | Apprentice | both80 | 3.00s | 3000/420 | 106/131 | 120 / 11 / 20 | 0 / 0 | 85.5%/80.0% | 867.9/1368.2 | 883/0 | 1/0 | 10/10 |
| V05 | Slinger | anchor150 | 4.00s | 3000/420 | 122/144 | 131 / 13 / 20 | 0 / 0 | 53.0%/44.9% | 2657.0/3037.0 | 1361/0 | 1/0 | 9/9 |
| V05 | Slinger | tortoise80 | 3.90s | 3000/420 | 125/153 | 138 / 15 / 27 | 0 / 0 | 55.5%/53.0% | 2494.0/2495.0 | 1345/0 | 1/0 | 8/8 |
| V05 | Slinger | salamander80 | 4.40s | 3000/420 | 127/151 | 141 / 10 / 21 | 0 / 0 | 44.9%/40.3% | 2010.0/2237.0 | 1352/0 | 1/0 | 9/8 |
| V05 | Slinger | both80 | 4.30s | 3000/420 | 131/152 | 142 / 10 / 19 | 0 / 0 | 73.2%/69.6% | 1662.0/1758.0 | 1362/0 | 1/0 | 9/8 |
| V05 | Conduit | anchor150 | 10.65s | 3000/420 | 56/84 | 74 / 10 / 27 | 0 / 0 | 75.8%/70.2% | 947.0/1833.0 | 0/1979 | 1/0 | 0/0 |
| V05 | Conduit | tortoise80 | 10.65s | 3000/420 | 56/84 | 74 / 10 / 27 | 0 / 0 | 75.8%/70.2% | 947.0/1833.0 | 0/1979 | 1/0 | 0/0 |
| V05 | Conduit | salamander80 | 9.40s | 3000/420 | 49/92 | 65 / 27 / 31 | 0 / 1 | 86.6%/85.5% | 655.0/1146.0 | 0/1810 | 1/0 | 0/0 |
| V05 | Conduit | both80 | 9.40s | 3000/420 | 49/92 | 65 / 27 / 31 | 0 / 1 | 86.6%/85.5% | 655.0/1146.0 | 0/1810 | 1/0 | 0/0 |

## Treatment contrasts

The values below are all-outcome descriptive paired contrasts. Each cell is
`minimum-HP delta in percentage points / incoming-HP delta / clean Tortoise
TTK delta`. Positive minimum HP is better durability; negative incoming HP is
lower observed pressure; positive Tortoise TTK is a longer anchor fight. The
first two columns isolate Tortoise attack relief at Salamander attacks 105 and
84. The next two isolate Salamander attack relief at Tortoise attacks 145 and
116. These are same-seed comparisons, not causal estimates.

| Node / class | Tortoise attack: tortoise80 - anchor150 | Tortoise attack: both80 - salamander80 | Salamander attack: salamander80 - anchor150 | Salamander attack: both80 - tortoise80 |
|---|---:|---:|---:|---:|
| V03 Apprentice | +5.3 / -284.3 / +0.10s | +27.2 / -216.6 / +0.20s | -5.7 / -1018.1 / +0.10s | +16.2 / -950.4 / +0.20s |
| V03 Slinger | -2.1 / +692.0 / +2.15s | +5.1 / -433.0 / +0.30s | +8.0 / +110.0 / -0.60s | +15.3 / -1015.0 / -2.45s |
| V03 Conduit | +40.8 / +62.0 / +0.80s | +18.1 / -450.0 / +0.65s | +35.0 / -166.0 / +0.80s | +12.2 / -678.0 / +0.65s |
| V05 Apprentice | +4.9 / -17.5 / +0.55s | +7.4 / -199.6 / +0.75s | +20.8 / -1497.0 / -0.75s | +23.4 / -1679.1 / -0.55s |
| V05 Slinger | +2.5 / -163.0 / +0.00s | +28.3 / -348.0 / -1.20s | -8.1 / -647.0 / +4.50s | +17.7 / -832.0 / +3.30s |
| V05 Conduit | +0.0 / +0.0 / — | +0.0 / +0.0 / — | +10.9 / -292.0 / — | +10.9 / -292.0 / — |

The two-factor interaction is `both80 - tortoise80 - salamander80 + anchor150`.
It is shown separately so the mixed single-arm results are not mistaken for
an additive model:

| Node / class | Interaction: minimum HP pp / incoming HP / Tortoise TTK |
|---|---:|
| V03 Apprentice | +21.9 / +67.7 / +0.10s |
| V03 Slinger | +7.3 / -1125.0 / -1.85s |
| V03 Conduit | -22.7 / -512.0 / -0.15s |
| V05 Apprentice | +2.5 / -182.1 / +0.20s |
| V05 Slinger | +25.8 / -185.0 / -1.20s |
| V05 Conduit | +0.0 / +0.0 / — |

The V03 and V05 Conduit values are exposure-limited and must not be treated
as a stable balance result. The `<20%` threshold is diagnostic, not a
universal pass/fail contract.

## Pressure, Heat, lava, and deaths

Across all 72 observations there were **2,968 target records**, **2,694
kills**, **274 censored / unfinished records**, **2,362 clean eligible
targets**, and **526 observed HP-regain records**. Regain overlaps other
categories and is not a partition. Runner minimum-HP quantiles using the same
nearest-upper quantile convention as the preceding durability reports were
p10 **40.3%**, p50 **65.1%**, and p90 **85.5%**, with an overall minimum of
0% from the death.

Incoming damage totaled **119,932.3 HP** in **8,089** event-stream damage
events: **5,800 direct events for 116,853.3 HP** and **2,289 Debt events for
3,079.0 HP**. Direct / Debt source totals were:

| Source | Direct HP | Debt HP |
|---|---:|---:|
| Ash Salamander | 72,972.8 | 2,141.0 |
| Magma Tortoise | 24,399.5 | 552.0 |
| Cinder Hound | 18,017.0 | 120.0 |
| Ember Scuttler | 1,464.0 | 266.0 |

All 72 runs reached Heat stack 6, represented by **1,403 Heat state events**.
The event stream recorded **157 Molten Guard cast starts** and **151 fired
cast-end events**, plus **1,176 hazard-escape events**. Persisted samples
contained **59 lava-burn contact samples across 28 observations** and nonzero
`incomingDot` state in **2,340 samples across 24 observations**, with a
maximum persisted value of 26. No incoming event was labelled `dot`, `lava`,
or `Heat`; persisted `incomingDot` and static contact fields are therefore
reported separately rather than silently reclassified as event damage.

The raw index summed **17,106 player attack beats** and **14,868 minion attack
beats**. Recovery telemetry contained **57 completed** and **0 interrupted**
windows. The player beat column is zero for Conduit while minion delivery
continues, so the two columns must remain separate.

### Death and sub-20% survivor

Runner minimum HP is evaluated on the 100ms simulation tick; persisted samples
are one second apart. Incoming windows below are event-stream HP damage in the
stated window. The low survivor is centered on its lowest retained sample;
the death is centered on the `player-death` event. Both rows had no lava-burn
contact sample and `incomingDot=0` in the relevant persisted window.

| Cell / seed | Outcome and cause | Runner minimum / retained sample | ±10s incoming sources | ±30s incoming sources | DoT / environmental state |
|---|---|---|---|---|---|
| V03 Conduit anchor150 / 8089 | Death at 72.1s; Magma Tortoise melee cause, 104 HP | 0%; lowest retained 69.0s sample 113.1 / 409 HP (27.7%) | Ash Salamander direct 354; Magma Tortoise direct 312 | Magma Tortoise direct 773; Ash Salamander direct 767; Ember Scuttler direct 2 | No contact; `incomingDot=0` |
| V03 Conduit anchor150 / 3911 | Window-ended survivor at 300s | Runner minimum 2.1%; lowest retained 144.0s sample 27.1 / 409 HP (6.6%) | Magma Tortoise direct 416; Ash Salamander direct 531 | Ash Salamander direct 944; Magma Tortoise direct 520; Cinder Hound direct 124 | No contact; `incomingDot=0` |

There were no other runner minima below 20%. The exposure audit still flags
quiet runs whose HP did not collapse; quiet survival is not sustained safety,
and a run without a flag is not proof of perfect movement or continuous target
exposure.

## Planner interpretation and exit boundary

| Decision area | Evidence-supported action | Boundary |
|---|---|---|
| Species attack relief | Retain `both80` as a local candidate overlay for an exposure-qualified follow-up. | It is a bundled two-species treatment, has no automatic winner status, and is not a production patch. |
| Tortoise-only relief | Keep `tortoise80` as a diagnostic arm. | It improves some runner tails but worsens V03 Slinger and leaves long-quiet V03 Slinger / 3911 and V03 Conduit / 8089 rows. |
| Salamander-only relief | Keep `salamander80` as a diagnostic arm. | Its minimum-HP effect is mixed and it leaves long-quiet V03 Conduit / 8089 and V05 Conduit / 3911 rows. |
| Combined treatment | Use the no-death, higher-tail result to focus the next narrow comparison. | V03 and V05 Conduit exposure exclusions prevent a global or whole-Volcano conclusion. |
| Conduit | Mark V03 Conduit balance conclusion unresolved and carry a targeted movement / minion investigation. | Do not treat the V03 anchor death or the other long-quiet survivors as a reason for a whole-matrix retry. |
| Reproducibility | Accept the 36/36 Durability15 bookend matches as a successful audit. | Repeated historical seeds are not independent confirmation. |
| Production | Make no source or numeric balance change. | Fresh-seed confirmation and reconciliation with current combat changes are required before adoption. |
| Next broad coverage | Return to remaining T2/T3 roles and roster gaps, including Forest. | Slam / ability tuning, items / classes, boss TTK, and T4 remain later. |

Durability16 supports a narrow candidate, not a universal balance prescription.
The combined arm retains anchor-level Tortoise duration in the usable
Apprentice / Slinger groups while avoiding the single-arm reversals, but the
positive interaction is descriptive and the Conduit tail is not identified.
Keep all four arms in any follow-up, retain the whole-four-arm exposure screen,
and do not remove only a failing treatment.

This was one exact frozen sequential pass using paired historical seeds, not
independent replication. Clean TTK is body time after first damage and does
not include approach, aggro, natural target order, recovery, cast, hazard, or
exposure timelines. Missing medians, unfinished rows, regained rows, deaths,
and long-quiet rows remain visible and are not converted to zero. No economy,
acquisition, live/browser, human-feel, complete-tier, or global-biome claim is
authorized here.
