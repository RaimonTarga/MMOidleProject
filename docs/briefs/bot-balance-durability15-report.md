# Durability 15 report — Volcano anchor durability and pressure

Status: **complete frozen synthetic benchmark; no production balance change**.
The operator ran the exact Durability 15 matrix once and sequentially: 48 cells
/ 144 observations across T3 Volcanic 03 and 05, six class roots, Sweep, four
fixed treatment arms, and seeds 3911 / 6151 / 8089. The reporter completed, the
verifier returned verified:true, and the exposure audit completed. There were no
retries, restarts, adaptive changes, source edits, balance edits, or automatic
winner selections.

## Decision summary

- **Do not adopt anchor150 as a blanket production balance change.** The
  Tortoise treatment correctly increased its configured body HP from 2,000 to
  3,000 and its 14% Molten Guard capacity from 280 to 420. Tortoise clean body
  TTK generally increased, but attrition did not close: Volcanic 03 Conduit
  anchor150 contained a 2.1% runner-minimum survivor and a repeated 8089 death,
  while other class tails moved in mixed directions.
- **Pressure80 is a local follow-up candidate, not a production adoption.**
  It raised the runner minimum-HP median in all 12 class/node comparisons and
  produced no player deaths in this pass, but it reduces both Tortoise and
  Salamander attack together, and eight observations still carried long
  outgoing-damage gaps. The paired evidence is therefore not an isolated
  species effect or a sustained-exposure certification.
- **The combined arm is the strongest durability screen, with an exposure
  qualification caveat.** A150+P80 restored much of the pressure relief lost
  under anchor150 in the class tails, but long quiet flags remain in Volcanic
  03 Conduit / 8089 and Volcanic 05 Conduit / 3911. Keep it as a candidate
  overlay for a narrower follow-up, not as an automatic winner.
- **Preserve all three deaths and both additional sub-20% survivors.** The
  three deaths were Volcanic 03 Conduit control / 8089, Volcanic 03 Conduit
  anchor150 / 8089, and Volcanic 05 Apprentice control / 6151. The extra
  low-HP survivors were Volcanic 03 Conduit anchor150 / 3911 at 2.1% and
  Volcanic 05 Slinger control / 8089 at 14.0%.
- **Use a smaller follow-up before any patch.** Split Tortoise and Salamander
  attack relief into separate treatments, rerun only the pressure-sensitive
  Conduit/Apprentice/Slinger tails after the four-arm exposure gap is closed,
  and keep the anchor HP/guard treatment descriptive until that test is clean.

No production combat, balance, route, economy, acquisition, or client source
was changed. This report returns the four-arm evidence to the planner; it does
not certify live balance, human feel, browser play, or a complete-tier result.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability15-operator-packet.md](bot-balance-durability15-operator-packet.md) |
| Frozen revision | df86303f8921260845f7ffecc656b9f70764f30b |
| Frozen source tree | 716b46157a2f93916dd5539482ac20385a6bff2f |
| Definitions SHA-256 | 75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 |
| Hitboxes | C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json |
| Hitbox SHA-256 | 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83 |
| Detached checkout | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability15-20260916/source |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability15-20260916/results-volcano |
| Trial / mode | durability15 / run |
| Timestep / window | 100ms / 300s per observation |
| Seeds | 3911, 6151, 8089 |
| Synthetic / economy eligible | true / false |

The four treatment arms were:

| Arm | Tortoise HP | Tortoise Molten Guard capacity | Tortoise attack | Salamander attack |
|---|---:|---:|---:|---:|
| control | 2,000 | 280 | 145 | 105 |
| pressure80 | 2,000 | 280 | 116 | 84 |
| anchor150 | 3,000 | 420 | 145 | 105 |
| anchor150-pressure80 | 3,000 | 420 | 116 | 84 |

The guard capacity is the fixed 14% of the treated Tortoise HP from the packet;
it is a configured overlay value, not a separately sampled monster barrier
telemetry field. Salamander HP, Scuttlers, Hounds, plating, DR, Heat, packs,
weapons, classes, abilities, runes, and stances were unchanged. The attack
relief intentionally bundles Tortoise and Salamander attack, so it cannot
identify their separate effects.

The local preparation qualified 48 configurations. Its Squire Volcanic 05 /
3911 pilot passed with zero deaths and no long-quiet flag, but it was tooling
validation rather than balance evidence and was not rerun. The exact overlay
restoration test and frozen typecheck passed during preparation. Full-suite
tests and live/browser play were not rerun. Concurrent shared-checkout
combat, Detonate, status, Heat/chill, death, and presentation changes were
excluded from the detached frozen run.

| Matrix block | Planned | Executed | Outcomes |
|---|---:|---:|---|
| Volcanic 03/05, six classes, four arms, Sweep | 48 cells / 144 runs | 48 / 144 | 141 window-ended, 3 player deaths |
| **Total** | **48 / 144** | **48 / 144** | **144 retained, 0 failed** |

The operator ledger records 2026-09-16T15:03:41.5869100Z through
2026-09-16T15:26:25.3400072Z: **22m43.7530972s** wall time for **12h** of
simulated time. The results root contains 583 files / 498,243,671 bytes and no
failed.json. The ledger records no wall- or RSS-ceiling failure.

## Artifact verification

The retained completion and verifier output were:

    {"cells":48,"runs":144,"mode":"run"}
    {"trial":"durability15","cells":48,"runs":144,"verified":true}

| Artifact | SHA-256 |
|---|---|
| manifest.json | C36CD19BCB54C6B3452C0C0DDC820D4BDED710E02F280D731D6E9366E3958B6F |
| index.json | E48FD6098CA89F4C90CCE46180424AD5E418CF261C6E9E965E0F3357F86449D0 |
| complete.json | 52E62DB9E7D570436F0EEA3C90E817DD5776D129F319B3E2406DA3B0EF809A0C |
| analysis.json | D23E2D3D96B29C876E9D67A68009BABDBA7E6D650A86F75856869C573381A23B |
| analysis.md | FBC53FE20001A7D8869AC92B34DBF41D76AF796F9E4FA5A78EA9B8657F33CD98 |
| exposure-audit.json | 138935266670D5AA6936499219D7FCF4809F4E18F13B61BC299479C35FDC25A1 |
| verification.log | CC1783CB6C97EEDD07D4F33D91B7842B2EBAA978273000DAFE6E14FC28BE5004 |

The detached checkout remained at the frozen revision and tree with no tracked
working-tree changes.

## READY and paired-geometry audit

All 144 ready.json records were synthetic and matched their manifest cell and
seed. All overlay READY checks passed:

- control: Tortoise 2,000 HP / 145 attack; Salamander 105 attack;
- pressure80: Tortoise 2,000 HP / 116 attack; Salamander 84 attack;
- anchor150: Tortoise 3,000 HP / 145 attack; Salamander 105 attack;
- anchor150-pressure80: Tortoise 3,000 HP / 116 attack; Salamander 84 attack.

The READY initial roster and initial stats carried those values into every run.
All 36 class/node/seed four-arm sets had matching geometryRosterHash values and
matching equipment. No READY overlay mismatch, geometry mismatch, or equipment
mismatch was found.

This confirms treatment setup and paired geometry. It does not claim that later
natural ecology exposed every treatment to the same targets or that a long
quiet interval was mechanically resolved.

## Exposure audit and matched sensitivity

The exposure audit flags any internal or terminal outgoing-damage gap of at
least 30 seconds. Eight observations were flagged:

| Cell / seed | Maximum quiet | Terminal quiet |
|---|---:|---:|
| V03 Slinger control / 3911 | 167.5s | 167.5s |
| V03 Slinger anchor150 / 3911 | 167.5s | 167.5s |
| V03 Conduit pressure80 / 3911 | 53.9s | 53.9s |
| V03 Conduit pressure80 / 6151 | 55.7s | 55.7s |
| V03 Conduit pressure80 / 8089 | 37.4s | 1.5s |
| V03 Conduit anchor150-pressure80 / 8089 | 222.0s | 222.0s |
| V05 Conduit pressure80 / 3911 | 76.2s | 76.2s |
| V05 Conduit anchor150-pressure80 / 3911 | 76.2s | 76.2s |

The matched-exposure sensitivity excludes an entire four-arm class/node/seed
set if any arm in that set has a long-quiet flag. Five of the 36 sets were
excluded, leaving 31 complete four-arm sets and 124 retained observations.
All-outcome tables below retain every raw row; matched tables do not convert
excluded or missing targets into zeros. The flag is an exclusion warning, not
proof that every unflagged fight is mechanically clean.

## Clean TTK by species

Clean TTK is post-first-damage body time. Each entry is the clean median for
seeds 3911 / 6151 / 8089, followed by the outer median across available seed
medians, in seconds. Missing clean seed medians remain —. Unfinished targets
and observed HP-regain targets are excluded from this table; their counts remain
visible in the accounting table.

### T3 Volcanic 03

| Class / arm | Ember Scuttler | Cinder Hound | Ash Salamander | Magma Tortoise |
|---|---:|---:|---:|---:|
| Striker / control | 1.50/1.45/1.50 -> 1.50 | 4.20/2.90/4.30 -> 4.20 | 2.50/3.00/3.00 -> 3.00 | 6.10/6.80/5.90 -> 6.10 |
| Striker / pressure80 | 1.50/1.50/1.50 -> 1.50 | 4.50/2.90/4.30 -> 4.30 | 2.75/2.75/2.50 -> 2.75 | 7.10/6.90/6.20 -> 6.90 |
| Striker / anchor150 | 1.50/1.50/1.90 -> 1.50 | 3.80/3.60/3.35 -> 3.60 | 2.60/2.75/2.75 -> 2.75 | 9.50/9.60/10.00 -> 9.60 |
| Striker / anchor150-pressure80 | 1.55/1.20/1.55 -> 1.55 | 4.50/3.40/3.50 -> 3.50 | 2.50/2.75/2.70 -> 2.70 | 8.40/9.80/10.00 -> 9.80 |
| Squire / control | 1.80/2.80/1.80 -> 1.80 | 5.30/4.10/6.00 -> 5.30 | 3.20/2.80/4.60 -> 3.20 | 11.40/11.40/9.70 -> 11.40 |
| Squire / pressure80 | 1.80/1.80/1.80 -> 1.80 | 5.30/3.60/3.40 -> 3.60 | 3.20/3.60/4.60 -> 3.60 | 11.00/9.80/8.60 -> 9.80 |
| Squire / anchor150 | 1.80/1.80/2.30 -> 1.80 | 5.65/6.00/7.10 -> 6.00 | 3.40/4.25/3.40 -> 3.40 | 11.70/12.45/12.90 -> 12.45 |
| Squire / anchor150-pressure80 | 1.40/1.80/1.80 -> 1.80 | 5.30/4.20/6.40 -> 5.30 | 3.20/4.20/3.60 -> 3.60 | 13.80/11.80/13.00 -> 13.00 |
| Apprentice / control | 2.80/2.80/2.70 -> 2.80 | 6.00/5.70/6.00 -> 6.00 | 5.40/5.10/5.10 -> 5.10 | 10.30/8.70/9.50 -> 9.50 |
| Apprentice / pressure80 | 2.70/2.40/3.00 -> 2.70 | 6.75/7.05/6.00 -> 6.75 | 5.30/5.10/5.20 -> 5.20 | 7.40/8.40/9.95 -> 8.40 |
| Apprentice / anchor150 | 2.45/2.80/2.80 -> 2.80 | 6.00/6.80/6.55 -> 6.55 | 5.30/5.00/5.00 -> 5.00 | 12.20/11.90/12.70 -> 12.20 |
| Apprentice / anchor150-pressure80 | 2.40/2.50/2.80 -> 2.50 | 6.75/6.60/9.90 -> 6.75 | 4.90/5.10/4.90 -> 4.90 | 12.10/12.50/14.10 -> 12.50 |
| Slinger / control | 2.80/2.80/2.35 -> 2.80 | 5.05/5.00/6.05 -> 5.05 | 4.70/4.55/4.25 -> 4.55 | —/—/8.00 -> 8.00 |
| Slinger / pressure80 | 2.80/2.80/2.80 -> 2.80 | 5.70/5.85/4.85 -> 5.70 | 4.15/4.65/4.10 -> 4.15 | 8.40/10.75/20.00 -> 10.75 |
| Slinger / anchor150 | 2.80/3.10/2.80 -> 2.80 | 5.05/5.25/5.00 -> 5.05 | 4.70/4.40/4.45 -> 4.45 | —/12.40/14.60 -> 13.50 |
| Slinger / anchor150-pressure80 | 2.80/1.90/2.80 -> 2.80 | 4.70/6.40/4.40 -> 4.70 | 4.30/4.70/4.10 -> 4.30 | 13.20/11.10/22.80 -> 13.20 |
| Conduit / control | 4.60/9.50/11.10 -> 9.50 | 21.00/9.90/— -> 15.45 | 10.60/7.40/7.20 -> 7.40 | 10.60/9.20/— -> 9.90 |
| Conduit / pressure80 | 4.05/9.90/9.95 -> 9.90 | 21.00/9.90/15.90 -> 15.90 | 10.60/10.75/7.35 -> 10.60 | 16.05/9.20/22.10 -> 16.05 |
| Conduit / anchor150 | 4.85/9.95/11.10 -> 9.95 | 16.20/13.95/— -> 15.08 | 11.40/9.00/7.20 -> 9.00 | 16.70/15.10/— -> 15.90 |
| Conduit / anchor150-pressure80 | 4.50/9.50/11.00 -> 9.50 | 17.55/13.95/— -> 15.75 | 10.40/9.00/5.40 -> 9.00 | 17.35/15.10/28.60 -> 17.35 |
| Spirit / control | 1.40/1.50/1.40 -> 1.40 | 4.20/4.75/3.45 -> 4.20 | 2.90/2.80/2.80 -> 2.80 | 5.60/4.90/5.50 -> 5.50 |
| Spirit / pressure80 | 1.40/1.45/1.40 -> 1.40 | 3.50/4.20/4.20 -> 4.20 | 2.90/2.80/3.20 -> 2.90 | 6.25/5.20/6.20 -> 6.20 |
| Spirit / anchor150 | 1.40/1.40/1.40 -> 1.40 | 4.20/3.60/3.50 -> 3.60 | 3.00/2.60/2.50 -> 2.60 | 6.30/7.10/7.00 -> 7.00 |
| Spirit / anchor150-pressure80 | 1.50/1.40/1.40 -> 1.40 | 3.80/3.45/4.10 -> 3.80 | 2.90/2.70/3.00 -> 2.90 | —/7.30/9.30 -> 8.30 |

### T3 Volcanic 05

| Class / arm | Ember Scuttler | Cinder Hound | Ash Salamander | Magma Tortoise |
|---|---:|---:|---:|---:|
| Striker / control | 2.95/2.40/2.00 -> 2.40 | 4.10/5.45/6.20 -> 5.45 | 3.50/3.30/3.50 -> 3.50 | 10.00/10.00/8.15 -> 10.00 |
| Striker / pressure80 | 2.00/2.00/2.00 -> 2.00 | 4.70/4.70/4.80 -> 4.70 | 3.80/3.40/3.45 -> 3.45 | 10.00/9.20/8.40 -> 9.20 |
| Striker / anchor150 | 2.00/3.00/1.65 -> 2.00 | 4.70/4.30/5.90 -> 4.70 | 3.20/3.40/3.50 -> 3.40 | 12.40/13.60/11.30 -> 12.40 |
| Striker / anchor150-pressure80 | 1.65/3.75/2.00 -> 2.00 | 4.00/4.40/5.20 -> 4.40 | 3.40/3.30/3.40 -> 3.40 | 12.45/12.40/10.95 -> 12.40 |
| Squire / control | 3.60/3.60/2.80 -> 3.60 | 6.40/7.10/6.60 -> 6.60 | 6.00/3.30/3.60 -> 3.60 | 13.00/11.60/12.80 -> 12.80 |
| Squire / pressure80 | 3.60/3.50/3.35 -> 3.50 | 5.70/8.00/8.20 -> 8.00 | 4.75/3.60/3.60 -> 3.60 | 14.20/13.90/11.40 -> 13.90 |
| Squire / anchor150 | 3.60/3.60/3.25 -> 3.60 | 6.60/8.20/11.40 -> 8.20 | 6.00/4.60/4.10 -> 4.60 | 21.60/14.80/17.90 -> 17.90 |
| Squire / anchor150-pressure80 | 3.60/3.20/3.45 -> 3.45 | 5.70/7.00/9.10 -> 7.00 | 4.60/6.40/3.60 -> 4.60 | 22.60/16.00/18.65 -> 18.65 |
| Apprentice / control | 3.00/3.00/3.00 -> 3.00 | 8.45/6.80/6.75 -> 6.80 | 5.80/5.60/5.80 -> 5.80 | 8.50/—/10.50 -> 9.50 |
| Apprentice / pressure80 | 3.00/3.00/3.00 -> 3.00 | 8.45/6.60/6.80 -> 6.80 | 5.75/5.60/5.80 -> 5.75 | 12.55/10.55/8.85 -> 10.55 |
| Apprentice / anchor150 | 3.00/3.00/3.00 -> 3.00 | 7.70/6.00/7.10 -> 7.10 | 5.80/5.70/5.80 -> 5.80 | 13.50/—/15.00 -> 14.25 |
| Apprentice / anchor150-pressure80 | 3.00/3.00/3.00 -> 3.00 | 7.30/6.60/8.20 -> 7.30 | 5.20/5.65/5.80 -> 5.65 | 13.50/15.00/14.25 -> 14.25 |
| Slinger / control | 2.15/2.80/2.90 -> 2.80 | 6.70/7.70/5.75 -> 6.70 | 4.70/5.10/4.75 -> 4.75 | 9.60/10.30/8.80 -> 9.60 |
| Slinger / pressure80 | 2.70/3.00/2.90 -> 2.90 | 6.70/7.90/5.50 -> 6.70 | 4.50/6.10/4.80 -> 4.80 | 9.90/8.80/13.60 -> 9.90 |
| Slinger / anchor150 | 2.80/2.50/3.55 -> 2.80 | 6.70/8.40/5.30 -> 6.70 | 5.05/5.30/4.70 -> 5.05 | 13.60/16.00/13.50 -> 13.60 |
| Slinger / anchor150-pressure80 | 2.80/3.20/2.90 -> 2.90 | 7.25/6.70/6.25 -> 6.70 | 4.90/4.70/4.55 -> 4.70 | 13.40/18.50/16.90 -> 16.90 |
| Conduit / control | 10.15/7.70/10.25 -> 10.15 | 19.60/—/15.95 -> 17.77 | 16.60/16.10/10.45 -> 16.10 | —/—/— -> — |
| Conduit / pressure80 | 8.95/3.90/12.40 -> 8.95 | 18.10/19.10/25.30 -> 19.10 | 11.45/10.20/10.70 -> 10.70 | —/20.90/— -> 20.90 |
| Conduit / anchor150 | 10.15/8.55/10.25 -> 10.15 | 19.60/—/15.95 -> 17.77 | 16.60/13.20/10.45 -> 13.20 | —/—/— -> — |
| Conduit / anchor150-pressure80 | 8.95/7.00/12.40 -> 8.95 | 18.10/—/25.30 -> 21.70 | 11.45/13.20/10.70 -> 11.45 | —/—/— -> — |
| Spirit / control | 1.70/1.20/1.40 -> 1.40 | 4.55/4.30/4.30 -> 4.30 | 3.00/3.30/3.00 -> 3.00 | 4.70/6.30/6.80 -> 6.30 |
| Spirit / pressure80 | 1.40/1.40/1.40 -> 1.40 | 4.60/4.85/4.45 -> 4.60 | 3.20/3.00/3.40 -> 3.20 | 5.40/5.60/11.60 -> 5.60 |
| Spirit / anchor150 | 1.40/1.50/1.40 -> 1.40 | 3.95/4.95/5.00 -> 4.95 | 3.10/3.40/3.50 -> 3.40 | 11.10/9.60/10.50 -> 10.50 |
| Spirit / anchor150-pressure80 | 1.50/1.50/1.40 -> 1.50 | 4.10/4.00/4.90 -> 4.10 | 3.45/3.65/3.40 -> 3.45 | 13.85/11.30/10.70 -> 11.30 |

## All-outcome cell accounting

The body TTK column is the outer median of per-seed clean cell medians. The
records column counts all damaged target records. Kills, censored, and regained
are separate; regained can overlap killed or censored and is not a partition.
Minimum HP is the median / minimum runner fraction across the three seeds.
Incoming HP is the median / maximum per-run incoming total. Attack beats are
cooldown timestamp changes, not guaranteed hits. Recovery is completed /
interrupted recovery telemetry. Tortoise guard is the configured 14% capacity.
Cast counts are Tortoise Molten Guard starts / fired ends.

| Node | Class | Arm | Body TTK | Tortoise HP/guard | Clean/records | Kills / censored / regained | D / LQ | MinHP med/min | Incoming HP med/max | Player/minion beats | Recovery done/int. | Casts start/fired |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| V03 | Striker | control | 2.40 | 2000/280 | 248/248 | 248 / 0 / 0 | 0 / 0 | 51.3%/49.2% | 4863.0/5284.0 | 1124/0 | 83/0 | 17/15 |
| V03 | Striker | pressure80 | 2.40 | 2000/280 | 261/262 | 261 / 1 / 0 | 0 / 0 | 80.6%/75.1% | 2553.0/2616.0 | 1173/0 | 81/0 | 24/22 |
| V03 | Striker | anchor150 | 2.40 | 3000/420 | 253/253 | 253 / 0 / 0 | 0 / 0 | 51.2%/47.3% | 4907.0/6104.0 | 1197/0 | 75/0 | 22/22 |
| V03 | Striker | anchor150-pressure80 | 2.40 | 3000/420 | 242/244 | 242 / 2 / 0 | 0 / 0 | 78.3%/76.4% | 2536.0/2997.0 | 1208/0 | 78/0 | 23/23 |
| V03 | Squire | control | 3.20 | 2000/280 | 199/201 | 199 / 2 / 0 | 0 / 0 | 76.0%/72.0% | 3598.0/4309.0 | 395/0 | 60/0 | 18/18 |
| V03 | Squire | pressure80 | 2.80 | 2000/280 | 202/202 | 202 / 0 / 0 | 0 / 0 | 88.3%/88.0% | 1128.0/1503.0 | 390/0 | 67/0 | 17/17 |
| V03 | Squire | anchor150 | 3.30 | 3000/420 | 185/186 | 185 / 1 / 0 | 0 / 0 | 73.1%/70.5% | 3340.0/4212.0 | 392/0 | 68/0 | 13/12 |
| V03 | Squire | anchor150-pressure80 | 2.80 | 3000/420 | 188/191 | 188 / 3 / 0 | 0 / 0 | 87.6%/86.2% | 1417.0/1777.0 | 414/0 | 62/0 | 18/16 |
| V03 | Apprentice | control | 3.00 | 2000/280 | 131/149 | 139 / 10 / 18 | 0 / 0 | 63.6%/54.7% | 1591.3/2770.9 | 837/0 | 1/0 | 5/2 |
| V03 | Apprentice | pressure80 | 3.40 | 2000/280 | 140/158 | 155 / 3 / 18 | 0 / 0 | 80.7%/72.9% | 1183.1/1821.0 | 939/0 | 9/0 | 9/6 |
| V03 | Apprentice | anchor150 | 3.40 | 3000/420 | 118/133 | 125 / 8 / 13 | 0 / 0 | 62.8%/56.2% | 2388.3/3061.6 | 819/0 | 1/0 | 9/9 |
| V03 | Apprentice | anchor150-pressure80 | 3.00 | 3000/420 | 126/151 | 140 / 11 / 23 | 0 / 0 | 84.4%/71.6% | 1153.6/1824.7 | 914/0 | 5/0 | 8/8 |
| V03 | Slinger | control | 3.20 | 2000/280 | 121/147 | 137 / 10 / 23 | 0 / 1 | 62.8%/49.0% | 1498.0/3289.0 | 1096/0 | 11/0 | 3/2 |
| V03 | Slinger | pressure80 | 3.15 | 2000/280 | 141/167 | 158 / 9 / 24 | 0 / 0 | 77.3%/34.3% | 1635.0/1638.0 | 1281/0 | 1/0 | 6/2 |
| V03 | Slinger | anchor150 | 3.20 | 3000/420 | 116/139 | 130 / 9 / 21 | 0 / 1 | 62.8%/49.2% | 1518.0/2629.0 | 1092/0 | 4/0 | 7/7 |
| V03 | Slinger | anchor150-pressure80 | 2.90 | 3000/420 | 128/155 | 146 / 9 / 26 | 0 / 0 | 76.0%/34.3% | 1195.0/1390.0 | 1280/0 | 1/0 | 9/9 |
| V03 | Conduit | control | 9.35 | 2000/280 | 55/77 | 65 / 12 / 17 | 1 / 0 | 55.1%/0.0% | 1445.0/1779.0 | 0/1543 | 5/0 | 3/3 |
| V03 | Conduit | pressure80 | 9.80 | 2000/280 | 73/98 | 82 / 16 / 20 | 0 / 3 | 78.9%/55.2% | 647.0/1788.0 | 0/1828 | 3/0 | 2/2 |
| V03 | Conduit | anchor150 | 10.20 | 3000/420 | 58/80 | 68 / 12 / 17 | 1 / 0 | 2.1%/0.0% | 1779.0/2750.0 | 0/1739 | 5/0 | 6/5 |
| V03 | Conduit | anchor150-pressure80 | 9.95 | 3000/420 | 61/82 | 70 / 12 / 18 | 0 / 1 | 55.2%/53.1% | 1163.0/1843.0 | 0/1870 | 5/0 | 6/6 |
| V03 | Spirit | control | 2.00 | 2000/280 | 192/216 | 206 / 10 / 17 | 0 / 0 | 71.4%/68.8% | 1027.6/1430.9 | 881/0 | 5/5 | 0/0 |
| V03 | Spirit | pressure80 | 2.00 | 2000/280 | 200/223 | 215 / 8 / 20 | 0 / 0 | 81.3%/80.9% | 331.1/455.3 | 957/0 | 5/4 | 1/1 |
| V03 | Spirit | anchor150 | 1.80 | 3000/420 | 190/216 | 208 / 8 / 22 | 0 / 0 | 68.8%/23.6% | 1073.4/1206.3 | 929/0 | 0/1 | 5/2 |
| V03 | Spirit | anchor150-pressure80 | 2.00 | 3000/420 | 192/217 | 210 / 7 / 22 | 0 / 0 | 83.1%/76.9% | 313.8/738.5 | 979/0 | 0/1 | 3/3 |
| V05 | Striker | control | 3.30 | 2000/280 | 217/218 | 217 / 1 / 0 | 0 / 0 | 48.0%/45.7% | 4426.0/5810.0 | 1212/0 | 77/0 | 16/16 |
| V05 | Striker | pressure80 | 3.35 | 2000/280 | 226/228 | 226 / 2 / 0 | 0 / 0 | 78.3%/76.8% | 2310.0/2813.0 | 1271/0 | 70/0 | 21/21 |
| V05 | Striker | anchor150 | 3.30 | 3000/420 | 218/222 | 218 / 4 / 0 | 0 / 0 | 49.0%/41.9% | 5534.0/5996.0 | 1312/0 | 74/0 | 17/17 |
| V05 | Striker | anchor150-pressure80 | 3.30 | 3000/420 | 211/214 | 211 / 3 / 0 | 0 / 0 | 77.2%/77.0% | 2291.0/2443.0 | 1281/0 | 77/0 | 17/17 |
| V05 | Squire | control | 4.20 | 2000/280 | 181/189 | 181 / 8 / 0 | 0 / 0 | 77.5%/75.8% | 3585.0/3750.0 | 408/0 | 54/0 | 14/13 |
| V05 | Squire | pressure80 | 4.00 | 2000/280 | 174/178 | 174 / 4 / 0 | 0 / 0 | 88.6%/87.8% | 1246.0/1303.0 | 403/0 | 59/0 | 12/12 |
| V05 | Squire | anchor150 | 3.90 | 3000/420 | 164/168 | 164 / 4 / 0 | 0 / 0 | 73.5%/72.0% | 3252.0/3969.0 | 410/0 | 47/0 | 18/16 |
| V05 | Squire | anchor150-pressure80 | 4.60 | 3000/420 | 169/174 | 169 / 5 / 0 | 0 / 0 | 88.6%/88.3% | 1200.0/1995.0 | 418/0 | 52/0 | 22/20 |
| V05 | Apprentice | control | 3.00 | 2000/280 | 96/113 | 106 / 7 / 14 | 1 / 0 | 61.0%/0.0% | 2160.3/2405.5 | 676/0 | 4/4 | 4/4 |
| V05 | Apprentice | pressure80 | 3.00 | 2000/280 | 109/130 | 124 / 6 / 19 | 0 / 0 | 83.4%/77.9% | 687.2/1396.4 | 813/0 | 1/0 | 6/6 |
| V05 | Apprentice | anchor150 | 3.00 | 3000/420 | 111/136 | 123 / 13 / 21 | 0 / 0 | 57.3%/25.5% | 2564.5/3870.3 | 847/0 | 1/0 | 7/6 |
| V05 | Apprentice | anchor150-pressure80 | 3.00 | 3000/420 | 106/131 | 120 / 11 / 20 | 0 / 0 | 85.5%/80.0% | 867.9/1368.2 | 883/0 | 1/0 | 10/10 |
| V05 | Slinger | control | 3.55 | 2000/280 | 128/157 | 140 / 17 / 28 | 0 / 0 | 48.1%/14.0% | 2627.0/3119.0 | 1293/0 | 1/0 | 7/6 |
| V05 | Slinger | pressure80 | 3.40 | 2000/280 | 129/161 | 145 / 16 / 30 | 0 / 0 | 77.8%/75.8% | 1543.0/1641.0 | 1330/0 | 1/0 | 7/6 |
| V05 | Slinger | anchor150 | 4.00 | 3000/420 | 122/144 | 131 / 13 / 20 | 0 / 0 | 53.0%/44.9% | 2657.0/3037.0 | 1361/0 | 1/0 | 9/9 |
| V05 | Slinger | anchor150-pressure80 | 4.30 | 3000/420 | 131/152 | 142 / 10 / 19 | 0 / 0 | 73.2%/69.6% | 1662.0/1758.0 | 1362/0 | 1/0 | 9/8 |
| V05 | Conduit | control | 10.65 | 2000/280 | 57/88 | 73 / 15 / 30 | 0 / 0 | 70.2%/57.9% | 1065.0/1833.0 | 0/2015 | 1/0 | 1/1 |
| V05 | Conduit | pressure80 | 9.40 | 2000/280 | 49/86 | 63 / 23 / 29 | 0 / 1 | 85.5%/82.9% | 1146.0/1146.0 | 0/1842 | 1/0 | 1/1 |
| V05 | Conduit | anchor150 | 10.65 | 3000/420 | 56/84 | 74 / 10 / 27 | 0 / 0 | 75.8%/70.2% | 947.0/1833.0 | 0/1979 | 1/0 | 0/0 |
| V05 | Conduit | anchor150-pressure80 | 9.40 | 3000/420 | 49/92 | 65 / 27 / 31 | 0 / 1 | 86.6%/85.5% | 655.0/1146.0 | 0/1810 | 1/0 | 0/0 |
| V05 | Spirit | control | 2.10 | 2000/280 | 176/192 | 188 / 4 / 14 | 0 / 0 | 57.9%/25.6% | 1464.9/1878.1 | 894/0 | 1/4 | 2/0 |
| V05 | Spirit | pressure80 | 1.95 | 2000/280 | 188/210 | 204 / 6 / 20 | 0 / 0 | 90.1%/82.7% | 352.0/503.0 | 937/0 | 13/18 | 1/0 |
| V05 | Spirit | anchor150 | 1.90 | 3000/420 | 173/194 | 185 / 9 / 17 | 0 / 0 | 65.0%/64.3% | 1015.5/1148.1 | 962/0 | 0/3 | 8/7 |
| V05 | Spirit | anchor150-pressure80 | 2.05 | 3000/420 | 179/199 | 196 / 3 / 18 | 0 / 0 | 88.3%/76.1% | 251.8/508.9 | 953/0 | 6/6 | 9/8 |

## Matched-exposure sensitivity

Each arm entry is eligible runs; clean/records; outer Magma Tortoise clean TTK.
The table keeps the same seed-level median rule after removing entire
four-arm sets with any long-quiet flag. It is a sensitivity screen, not a new
experiment.

| Node / class | control | pressure80 | anchor150 | anchor150-pressure80 |
|---|---:|---:|---:|---:|
| V03 Striker | 3; 248/248; 6.10 | 3; 261/262; 6.90 | 3; 253/253; 9.60 | 3; 242/244; 9.80 |
| V03 Squire | 3; 199/201; 11.40 | 3; 202/202; 9.80 | 3; 185/186; 12.45 | 3; 188/191; 13.00 |
| V03 Apprentice | 3; 131/149; 9.50 | 3; 140/158; 8.40 | 3; 118/133; 12.20 | 3; 126/151; 12.50 |
| V03 Slinger | 2; 99/122; 8.00 | 2; 89/105; 15.38 | 2; 94/114; 13.50 | 2; 81/100; 16.95 |
| V03 Conduit | 0; —; — | 0; —; — | 0; —; — | 0; —; — |
| V03 Spirit | 3; 192/216; 5.50 | 3; 200/223; 6.20 | 3; 190/216; 7.00 | 3; 192/217; 8.30 |
| V05 Striker | 3; 217/218; 10.00 | 3; 226/228; 9.20 | 3; 218/222; 12.40 | 3; 211/214; 12.40 |
| V05 Squire | 3; 181/189; 12.80 | 3; 174/178; 13.90 | 3; 164/168; 17.90 | 3; 169/174; 18.65 |
| V05 Apprentice | 3; 96/113; 9.50 | 3; 109/130; 10.55 | 3; 111/136; 14.25 | 3; 106/131; 14.25 |
| V05 Slinger | 3; 128/157; 9.60 | 3; 129/161; 9.90 | 3; 122/144; 13.60 | 3; 131/152; 16.90 |
| V05 Conduit | 2; 35/58; — | 2; 33/54; 20.90 | 2; 34/54; — | 2; 33/60; — |
| V05 Spirit | 3; 176/192; 6.30 | 3; 188/210; 5.60 | 3; 173/194; 10.50 | 3; 179/199; 11.30 |

The matched screen leaves Volcanic 03 Conduit with no complete four-arm
class/node/seed set. Volcanic 03 Slinger loses seed 3911 from all four arms,
and Volcanic 05 Conduit loses seed 3911 from all four arms. The all-outcome
Volcanic 03 Slinger pressure80 signal therefore changes materially when its
quiet seed is removed; it is not a stable global effect.

## Treatment contrasts

The following all-outcome contrasts use outer runner-minimum-HP median,
incoming-HP median, and Magma Tortoise clean TTK. Positive minimum-HP delta is
better durability; negative incoming-HP delta is lower observed pressure;
positive Tortoise TTK delta is a longer anchor fight. They are descriptive
paired contrasts, not causal estimates.

| Node / class | pressure80 - control: minHP pp / incoming HP | combined - anchor150: minHP pp / incoming HP | anchor150 - control: minHP pp / Tortoise TTK | combined - pressure80: minHP pp / Tortoise TTK |
|---|---:|---:|---:|---:|
| V03 Striker | +29.3 / -2310.0 | +27.1 / -2371.0 | -0.1 / +3.50s | -2.3 / +2.90s |
| V03 Squire | +12.3 / -2470.0 | +14.5 / -1923.0 | -2.9 / +1.05s | -0.7 / +3.20s |
| V03 Apprentice | +17.1 / -408.2 | +21.6 / -1234.7 | -0.8 / +2.70s | +3.7 / +4.10s |
| V03 Slinger | +14.5 / +137.0 | +13.2 / -323.0 | 0.0 / +5.50s | -1.3 / +2.45s |
| V03 Conduit | +23.8 / -798.0 | +53.1 / -616.0 | -53.0 / +6.00s | -23.7 / +1.30s |
| V03 Spirit | +9.9 / -696.5 | +14.3 / -759.6 | -2.5 / +1.50s | +1.9 / +2.10s |
| V05 Striker | +30.2 / -2116.0 | +28.2 / -3243.0 | +1.0 / +2.40s | -1.1 / +3.20s |
| V05 Squire | +11.2 / -2339.0 | +15.2 / -2052.0 | -4.0 / +5.10s | 0.0 / +4.75s |
| V05 Apprentice | +22.5 / -1473.1 | +28.2 / -1696.6 | -3.7 / +4.75s | +2.1 / +3.70s |
| V05 Slinger | +29.7 / -1084.0 | +20.2 / -995.0 | +4.9 / +4.00s | -4.6 / +7.00s |
| V05 Conduit | +15.2 / +81.0 | +10.9 / -292.0 | +5.5 / no clean Tortoise median | +1.2 / no clean Tortoise median |
| V05 Spirit | +32.2 / -1112.9 | +23.4 / -763.8 | +7.1 / +4.20s | -1.8 / +5.70s |

Pressure80 raised the minimum-HP median in every all-outcome class/node pair,
but the Volcanic 03 Slinger incoming result flips direction in the matched
screen, and Conduit remains exposure-limited. Anchor150 lengthened Tortoise
body TTK where clean medians existed, but its minimum-HP effect was mixed and
included the deepest low survivor.

## Pressure, Heat, lava, and deaths

Across all 144 observations there were 8,055 target records, 7,671 kills, 384
censored/unfinished records, 7,239 clean eligible targets, and 676 observed
HP-regain records. Regain overlaps other categories and is not a partition.
Runner minimum-HP quantiles were p10 **48.1%**, p50 **75.8%**, p90 **88.3%**,
with an overall minimum of 0% from the three deaths.

Incoming damage totaled **277,663.5 HP** in **21,204** event-stream damage
events: 19,126 direct events for 274,874.4 HP and 2,078 Debt events for
2,789.0 HP. By source, Ash Salamanders delivered 147,572.8 direct HP,
Magma Tortoises 92,257.7 direct HP, Cinder Hounds 26,909.9 direct HP, and
Ember Scuttlers 8,134.0 direct HP. Debt was 2,012 HP from Salamanders, 375
from Tortoises, 290 from Scuttlers, and 112 from Hounds.

All 144 runs reached Heat stack 6, represented by 3,143 Heat state events.
The event stream recorded 452 Molten Guard cast starts and 416 fired cast-end
events. It recorded 1,914 hazard-escape events. Persisted samples contained
109 lava-burn contact samples across 61 observations and nonzero incomingDot
state in 2,119 samples across 24 observations, with a maximum persisted value
of 26. No incoming event was labelled damageType:dot, lava, or Heat. The
persisted incomingDot and static contact fields are therefore reported
separately rather than silently reclassified as event damage.

The raw index summed 37,323 player attack beats and 14,626 minion attack beats.
Recovery telemetry contained 1,177 completed and 42 interrupted windows. The
minion beat column is essential for Conduit, whose player attack-beat count is
zero while minion delivery continues.

### Deaths and sub-20% survivors

Source totals below are event-stream HP damage in the stated window. Runner
minimum HP is evaluated on the 100ms simulation tick; persisted samples are
one second apart. The two Volcanic 03 Conduit 8089 deaths are separate
observations with the same death timing and source pattern.

| Cell / seed | Outcome and cause | Runner minimum / persisted sample | ±10s incoming sources | ±30s incoming sources | DoT / environmental state |
|---|---|---|---|---|---|
| V03 Conduit control / 8089 | Death at 72.1s; Magma Tortoise melee cause, 104 HP | 0%; lowest retained 69.0s sample 113.1 / 409 HP | Salamander direct 354; Tortoise direct 312 | Tortoise direct 773; Salamander direct 767; Scuttler direct 2 | No contact; incomingDot 0 |
| V03 Conduit anchor150 / 8089 | Death at 72.1s; same Magma Tortoise melee cause, 104 HP | 0%; lowest retained 69.0s sample 113.1 / 409 HP | Salamander direct 354; Tortoise direct 312 | Tortoise direct 773; Salamander direct 767; Scuttler direct 2 | No contact; incomingDot 0 |
| V03 Conduit anchor150 / 3911 | Window-ended survivor at 300s | Runner minimum **2.1%**; closest retained 144.0s sample 27.1 / 409 HP | Salamander direct 531; Tortoise direct 416 | Salamander direct 944; Tortoise direct 520; Hound direct 124 | No contact; incomingDot 0 |
| V05 Apprentice control / 6151 | Death at 135.3s; Debt cause recorded 7 HP from Magma Tortoise on the same tick as a 114.3-HP direct Tortoise hit | 0%; lowest retained 135.0s sample 111.5 / 422 HP | Tortoise 336.6 direct + 7 Debt; Salamander 318.6 direct + 43 Debt; Scuttler 6.3 direct + 9 Debt | Tortoise 455.4 direct + 7 Debt; Salamander 450.9 direct + 48 Debt; Scuttler 9 direct + 9 Debt | One lava-burn contact at 119.0s in the ±30s window; incomingDot 14–26 in the final persisted 10s, with no incoming damageType:dot event |
| V05 Slinger control / 8089 | Window-ended survivor at 300s | Runner minimum **14.0%**; closest retained 129.0s sample 79.0 / 400 HP (19.75%) | Salamander direct 522; Tortoise direct 303; Scuttler direct 6 | Salamander direct 1,058; Tortoise direct 452; Scuttler direct 10 | No contact; incomingDot 0 |

These rows justify tracking Tortoise anchor pressure and Salamander ranged
pressure as local tails. They do not justify a blanket HP, attack, guard, or
Heat patch. Heat stack 6 is common to every run and its causal contribution
cannot be quantified by this packet.

## Planner interpretation and exit boundary

| Decision area | Evidence-supported action | Boundary |
|---|---|---|
| Anchor durability | Reject anchor150 as a blanket adoption; retain its +50% HP / guard overlay as a local comparison input. | It lengthens Tortoise TTK but does not remove the V03 Conduit low/death tail and has mixed minimum-HP effects. |
| Attack relief | Carry pressure80 forward as a smaller follow-up candidate. | It bundles Tortoise and Salamander attacks and still contains long quiet observations, so no production patch follows. |
| Combined treatment | Keep anchor150-pressure80 for focused exposure-qualified replay. | It improves many runner tails but has V03/V05 Conduit quiet failures and no automatic winner status. |
| Exposure repair | Reproduce the eight long-quiet rows with selected/combat target, returning/leash state, approach goal, and actual outgoing damage visible. | The Durability14 movement receipt does not close this natural-ecology exposure boundary. |
| T3 design region | Keep the provisional 20–30s Tortoise design region as a planning reference, not a universal requirement. | Most clean Tortoise medians remain below 20s even under anchor150; attrition and exposure limitations prevent repeated HP buffs from being inferred. |
| Next balance stage | Continue remaining T2/T3 role and roster gaps, including Forest, then items/classes/abilities, boss TTK, and T4. | No economy, acquisition, travel, browser, human-feel, complete-tier, or live-balance conclusion is authorized here. |

This was one exact frozen sequential pass using paired historical seeds, not
independent replication. The same-seed overlay comparisons are descriptive and
can be affected by natural target ordering, approach, aggro, recovery, cast,
hazard, and exposure differences. Clean TTK is body time after first damage and
does not include those timelines. Missing medians, unfinished rows, regained
rows, deaths, and long-quiet rows remain visible and are not converted to zero.

Planner exit: keep production source and numeric balance unchanged. Authorize
only a smaller exposure-qualified pressure follow-up that separates Tortoise
from Salamander attack relief and preserves the complete four-arm matrix
boundary.
