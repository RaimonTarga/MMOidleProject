# Durability 14 report — repaired-runtime Volcano Sweep/Slam comparison

Status: **complete frozen synthetic benchmark; no live balance change**. The
operator ran the exact pending Durability 14 comparison once and sequentially:
24 cells / 72 observations across T3 Volcanic 03 and 05, six class roots,
Sweep/Slam, and seeds 3911 / 6151 / 8089. The existing movement qualification
receipt was identity-verified first. The runner exited 0, the reporter
completed, and the final verifier returned `verified:true`. There were no
retries, restarts, adaptive changes, source edits, balance edits, or automatic
technique winners.

## Decision summary

- **Hold all numeric balance and equipment values.** This is a synthetic
  prepared-combat screen, not a reason to change HP, attack, plating,
  resistance, weapons, abilities, classes, runes, spawn rules, or Heat.
- **The repaired movement qualification enabled the comparison, but sustained
  exposure is not closed.** Four of the 72 comparison observations had a
  terminal outgoing-damage gap of at least 30 seconds: one Sweep and three
  Slam runs. Their final samples retained attack intent while the combat
  target was null; three selected returning enemies and the fourth oscillated
  against an idle ranged target. These quiet survivors cannot support a
  sustained-safety or technique-strength claim.
- **Preserve the two deaths and the separate low-HP survivor.** The deaths
  were Volcanic 03 Conduit Sweep / 8089 at 72.1s and Volcanic 05 Apprentice
  Sweep / 6151 at 135.3s. Volcanic 05 Slinger Sweep / 8089 survived but
  reached a runner minimum of 14.0%. The Sweep association is descriptive
  only: censoring, natural target exposure, recovery, and the terminal quiet
  tails prevent a causal Sweep-versus-Slam conclusion.
- **Technique signals are local and mixed.** Volcanic 05 Conduit Slam has a
  lower aggregate clean outer median than Sweep (7.70s versus 10.65s), but
  both cells are heavily censored and the Slam/6151 run has an 89.6s terminal
  quiet tail. No global Sweep/Slam winner follows.
- **Volcanic pressure remains enemy- and status-mediated in the observed
  events.** Both deaths were finished by Magma Tortoise pressure, with the
  Apprentice death's cause metadata recording a 7-HP Tortoise Debt hit on the
  same tick as a 114.3-HP direct hit. Heat reached stack 6 in all 72 runs.
  No incoming event was labelled lava, Heat, or `damageType:dot`; persisted
  `incomingDot` state is retained separately and is not treated as proof that
  no unlogged DoT existed.

No production combat or balance source was changed. Return to the planner with
the four residual exposure cases, the two deaths, the Volcanic 05 low-HP
survivor, and the local Conduit signal on the watch list.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability14-operator-packet.md](bot-balance-durability14-operator-packet.md) |
| Frozen revision | `6be18a7b6974bc10df5fe2cb31cf24a628b784de` |
| Frozen source tree | `ba4104ea9b2d9431d647b337b083515d73cba62c` |
| Definitions SHA-256 | `75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267` |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitbox SHA-256 | `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83` |
| Detached checkout | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability14-20260916/source` |
| Qualification root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability14/movement-confirmation` |
| Results root | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability14-20260916/results-volcano` |
| Trial identifier | `durability13swarm` retained intentionally by the packet |
| Mode / timestep / window | `run` / 100ms / 300s per observation |
| Fresh seeds | `3911, 6151, 8089` |
| Synthetic / economy eligible | `true` / `false` |

The trial identifier is inherited from the pending Durability 13 matrix; the
output is a new Durability 14 root and does not extend or overwrite Durability
13 artifacts. The shared checkout contained concurrent combat, Detonate,
status, Heat/chill, death, and presentation changes. They were excluded from
the detached frozen run.

| Matrix block | Planned | Executed | Observation outcomes |
|---|---:|---:|---|
| T3 Volcanic 03/05, six roots, Sweep/Slam | 24 cells / 72 runs | 24 / 72 | 70 window-ended, 2 player deaths |
| **Total** | **24 / 72** | **24 / 72** | **72 retained, 0 failed** |

The operator ledger records the run from
`2026-09-16T14:00:07.8786521Z` through
`2026-09-16T14:09:35.3231197Z`: **9m27.4444676s** wall time for **6h** of
simulated time. The results root contains 294 files / 247,822,310 bytes and
contains no `failed.json`. No wall-ceiling or RSS-ceiling outcome was recorded
by the operator ledger.

### Qualification receipt

The pre-existing movement qualification was verified, not rerun. It records
15/15 full 300-second windows, zero deaths, a passed exposure gate, and the
repair control killing the previously stalled Swamp 6151 monster. The
identity verifier returned:

~~~text
{"trial":"durability13movement","cells":5,"runs":15,"verified":true}
~~~

The packet's frozen typecheck and six focused movement tests were retained as
preparation evidence. The full suite and live/browser playtest were not rerun.

| Qualification artifact | SHA-256 |
|---|---|
| `movement-confirmation/manifest.json` | `ED9DBB40DEC9B22C4E6AAFF754354939AA0A4B55D69F11FE7CA0D8BF737461F1` |
| `movement-confirmation/index.json` | `C9DC7B2C105FD97FC4FE734D24F3ACB810D15AADC3FD04E2C87237B6CD5DF3DB` |
| `movement-confirmation/engagement-gate.json` | `B77396FD608B17CBB911D5262EA87F7605ABCCF14CC525F0A3A491E4CBD651DC` |

### Artifact hashes

| Artifact | SHA-256 |
|---|---|
| `manifest.json` | `9363FDD8B4DCA6A49DFC7D9C9938969E10ED1F13BA2591C40325EFA8FCB08A26` |
| `index.json` | `D22C88B089393EE7069FB9248BBF5E95C0518E0EFFC7A17A0157204AB0A5FEA6` |
| `complete.json` | `461F7AA3B527BB71770A39F99AABF07ABA284DDDE900471D406209D5CEBCA105` |
| `analysis.json` | `DD8D21858A4F51963AE86CE92EFA9AD7FC35EEF19FDE09665475DD4072E2346E` |
| `analysis.md` | `9458E41F252E3FAA1EC341D23CF2F9F7DCE3BFC19F0AF6D9CDB9290299A47820` |
| `verification.log` | `208A22FD80B86DED5D336D9CADC676F3768196F53247E284F8709E3726B5494B` |

The retained completion and verifier output were:

~~~text
{"cells":24,"runs":72,"mode":"run"}
{"trial":"durability13swarm","cells":24,"runs":72,"verified":true}
~~~

## READY and paired-roster audit

All 72 `ready.json` records matched their manifest cell and seed, were marked
synthetic, and matched the corresponding `index.json` initial-roster hash and
manifest equipment fields. All 36 unique Sweep/Slam pairs matched initial
roster hash, geometry-roster hash, equipment, and technique assignment. This
is a readiness and paired-geometry result, not a claim that later natural
ecology exposed the same targets equally.

## Exposure audit

The terminal quiet screen uses the packet-compatible raw-index measure:
`elapsedMs - max(target.lastDamageMs)`. A target's post-first-damage body TTK
is kept separate from this exposure measure. Four observations had terminal
quiet of at least 30 seconds; their final one-second samples are summarized
below. In all four, `blockedApproach` was empty and the combat target was
null.

| Cell / seed | Last target damage | Terminal quiet | Final sampled exposure state |
|---|---:|---:|---|
| T3 Volcanic 03 Slinger Sweep / 3911 | 132.5s | **167.5s** | Attack intent; Ember Scuttler selected, returning at 613 HP; combat target null; player still moving |
| T3 Volcanic 05 Slinger Slam / 3911 | 179.2s | **120.8s** | Attack intent; idle Ash Salamander selected; combat target null; sampled movement oscillated between short and long approach legs |
| T3 Volcanic 05 Conduit Slam / 6151 | 210.4s | **89.6s** | Consort minion last dealt damage; selected Scuttler later returned/chased; combat target null; player stationary |
| T3 Volcanic 05 Striker Slam / 6151 | 260.6s | **39.4s** | Attack intent; returning Ember Scuttler selected; combat target null; player stationary |

The four terminal gaps total 417.3 seconds: one Sweep and three Slam. The
remaining 68 observations ended with shorter terminal gaps. The raw samples
also show returning-enemy states in the quiet examples, but do not by
themselves prove whether each case is the same movement defect. A new
100ms, full-window exposure packet is required before using these rows as
sustained safety or technique evidence.

Hazard telemetry recorded 998 `hazard-escape` events and 40 persisted
`staticDamageContacts` samples across 29 observations. The contacts were
labelled `lava-burn`; they are separate from the incoming damage event stream.

## Swarm accounting

The 3,944 target records all received first damage. There were 3,766 kills and
178 unfinished records; 294 records carried an observed HP-regain flag, and
3,583 records were eligible for the clean TTK filter. The regain count can
overlap killed or unfinished records and is not a partition. There were 70
window-ended observations and two player-death observations.

Clean TTK is post-first-damage body time. The tables below show the clean seed
medians in seed order `3911 / 6151 / 8089`, followed by the outer median in
seconds. `S` is Sweep and `L` is Slam; `—` means no clean seed median. Natural
ecology may merge pulls, so these are not authored isolated-pack TTKs.

### T3 Volcanic 03

| Class | Scuttler | Hound | Salamander | Tortoise |
|---|---:|---:|---:|---:|
| Striker | S 1.50/1.45/1.50→1.50; L 1.80/2.50/2.25→2.25 | S 4.20/2.90/4.30→4.20; L 4.60/4.55/5.00→4.60 | S 2.50/3.00/3.00→3.00; L 3.60/3.80/3.95→3.80 | S 6.10/6.80/5.90→6.10; L 5.90/6.25/7.70→6.25 |
| Squire | S 1.80/2.80/1.80→1.80; L 1.70/1.70/1.75→1.70 | S 5.30/4.10/6.00→5.30; L 4.20/5.30/4.50→4.50 | S 3.20/2.80/4.60→3.20; L 3.55/4.10/3.00→3.55 | S 11.40/11.40/9.70→11.40; L 10.30/9.50/8.80→9.50 |
| Apprentice | S 2.80/2.80/2.70→2.80; L 2.80/2.45/2.55→2.55 | S 6.00/5.70/6.00→6.00; L 5.40/7.50/6.00→6.00 | S 5.40/5.10/5.10→5.10; L 4.50/4.65/4.80→4.65 | S 10.30/8.70/9.50→9.50; L —/8.10/9.80→8.95 |
| Slinger | S 2.80/2.80/2.35→2.80; L 2.50/3.20/2.80→2.80 | S 5.05/5.00/6.05→5.05; L 5.80/5.30/6.65→5.80 | S 4.70/4.55/4.25→4.55; L 4.50/5.80/5.40→5.40 | S —/—/8.00→8.00; L 7.45/9.20/8.90→8.90 |
| Conduit | S 4.60/9.50/11.10→9.50; L 4.60/5.50/5.90→5.50 | S 21.00/9.90/—→15.45; L 14.55/13.20/12.50→13.20 | S 10.60/7.40/7.20→7.40; L 10.30/8.30/6.30→8.30 | S 10.60/9.20/—→9.90; L —/—/21.00→21.00 |
| Spirit | S 1.40/1.50/1.40→1.40; L 1.40/1.40/1.40→1.40 | S 4.20/4.75/3.45→4.20; L 3.50/3.50/4.20→3.50 | S 2.90/2.80/2.80→2.80; L 2.80/3.30/3.10→3.10 | S 5.60/4.90/5.50→5.50; L 4.80/4.80/5.70→4.80 |

### T3 Volcanic 05

| Class | Scuttler | Hound | Salamander | Tortoise |
|---|---:|---:|---:|---:|
| Striker | S 2.95/2.40/2.00→2.40; L 4.50/3.00/2.50→3.00 | S 4.10/5.45/6.20→5.45; L 4.55/4.90/4.95→4.90 | S 3.50/3.30/3.50→3.50; L 4.60/4.65/4.20→4.60 | S 10.00/10.00/8.15→10.00; L 10.20/9.20/7.90→9.20 |
| Squire | S 3.60/3.60/2.80→3.60; L 2.50/3.50/3.15→3.15 | S 6.40/7.10/6.60→6.60; L 6.70/4.10/5.90→5.90 | S 6.00/3.30/3.60→3.60; L 3.00/3.60/3.55→3.55 | S 13.00/11.60/12.80→12.80; L 13.30/13.30/11.60→13.30 |
| Apprentice | S 3.00/3.00/3.00→3.00; L 3.00/2.80/3.00→3.00 | S 8.45/6.80/6.75→6.80; L 7.50/6.80/6.30→6.80 | S 5.80/5.60/5.80→5.80; L 6.00/5.55/5.60→5.60 | S 8.50/—/10.50→9.50; L 8.45/8.25/8.10→8.25 |
| Slinger | S 2.15/2.80/2.90→2.80; L 2.95/3.00/3.10→3.00 | S 6.70/7.70/5.75→6.70; L 6.70/7.70/7.30→7.30 | S 4.70/5.10/4.75→4.75; L 5.80/5.90/6.00→5.90 | S 9.60/10.30/8.80→9.60; L 8.60/10.20/10.30→10.20 |
| Conduit | S 10.15/7.70/10.25→10.15; L 8.20/6.00/6.70→6.70 | S 19.60/—/15.95→17.77; L 12.90/—/17.20→15.05 | S 16.60/16.10/10.45→16.10; L 12.45/14.60/8.20→12.45 | S —/—/—→—; L 20.80/23.80/—→22.30 |
| Spirit | S 1.70/1.20/1.40→1.40; L 1.70/1.90/1.95→1.90 | S 4.55/4.30/4.30→4.30; L 4.80/5.30/4.00→4.80 | S 3.00/3.30/3.00→3.00; L 4.00/4.45/4.10→4.10 | S 4.70/6.30/6.80→6.30; L 7.60/7.50/6.50→7.50 |

### Paired deltas (Slam minus Sweep; seconds)

Negative means Slam's clean median was faster; positive means slower. Deltas
are shown in seed order `3911 / 6151 / 8089`, followed by the outer median.

#### Volcanic 03

| Node / class | Scuttler | Hound | Salamander | Tortoise |
|---|---:|---:|---:|---:|
| T3 Volcanic 03 / Striker | +0.30/+1.05/+0.75→+0.75 | +0.40/+1.65/+0.70→+0.70 | +1.10/+0.80/+0.95→+0.95 | -0.20/-0.55/+1.80→-0.20 |
| T3 Volcanic 03 / Squire | -0.10/-1.10/-0.05→-0.10 | -1.10/+1.20/-1.50→-1.10 | +0.35/+1.30/-1.60→+0.35 | -1.10/-1.90/-0.90→-1.10 |
| T3 Volcanic 03 / Apprentice | +0.00/-0.35/-0.15→-0.15 | -0.60/+1.80/+0.00→+0.00 | -0.90/-0.45/-0.30→-0.45 | —/-0.60/+0.30→-0.15 |
| T3 Volcanic 03 / Slinger | -0.30/+0.40/+0.45→+0.40 | +0.75/+0.30/+0.60→+0.60 | -0.20/+1.25/+1.15→+1.15 | —/—/+0.90→+0.90 |
| T3 Volcanic 03 / Conduit | +0.00/-4.00/-5.20→-4.00 | -6.45/+3.30/—→-1.58 | -0.30/+0.90/-0.90→-0.30 | —/—/—→— |
| T3 Volcanic 03 / Spirit | +0.00/-0.10/+0.00→+0.00 | -0.70/-1.25/+0.75→-0.70 | -0.10/+0.50/+0.30→+0.30 | -0.80/-0.10/+0.20→-0.10 |

#### Volcanic 05

| Node / class | Scuttler | Hound | Salamander | Tortoise |
|---|---:|---:|---:|---:|
| T3 Volcanic 05 / Striker | +1.55/+0.60/+0.50→+0.60 | +0.45/-0.55/-1.25→-0.55 | +1.10/+1.35/+0.70→+1.10 | +0.20/-0.80/-0.25→-0.25 |
| T3 Volcanic 05 / Squire | -1.10/-0.10/+0.35→-0.10 | +0.30/-3.00/-0.70→-0.70 | -3.00/+0.30/-0.05→-0.05 | +0.30/+1.70/-1.20→+0.30 |
| T3 Volcanic 05 / Apprentice | +0.00/-0.20/+0.00→+0.00 | -0.95/+0.00/-0.45→-0.45 | +0.20/-0.05/-0.20→-0.05 | -0.05/—/-2.40→-1.22 |
| T3 Volcanic 05 / Slinger | +0.80/+0.20/+0.20→+0.20 | +0.00/+0.00/+1.55→+0.00 | +1.10/+0.80/+1.25→+1.10 | -1.00/-0.10/+1.50→-0.10 |
| T3 Volcanic 05 / Conduit | -1.95/-1.70/-3.55→-1.95 | -6.70/—/+1.25→-2.73 | -4.15/-1.50/-2.25→-2.25 | —/—/—→— |
| T3 Volcanic 05 / Spirit | +0.00/+0.70/+0.55→+0.55 | +0.25/+1.00/-0.30→+0.25 | +1.00/+1.15/+1.10→+1.10 | +2.90/+1.20/-0.30→+1.20 |

### Cell accounting / pressure

`clean/records` is the eligible clean count over all raw target records in the
cell. `kills / unfinished / regained` are separate counters; regained can
overlap. `D` is player deaths. Incoming and minimum HP are median / maximum
or median / minimum across the three runner summaries. Recovery is completed /
interrupted recovery telemetry. Attack beats are cooldown timestamp changes,
not guaranteed hits.

| Node | Class | Tech | clean/records | kills / unfinished / regained | D | incoming HP med/max | minHP med/min | player/minion beats | recovery done / interrupted |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| T3 Volcanic 03 | Striker | sweep | 248/248 | 248 / 0 / 0 | 0 | 4863.0 / 5284.0 | 0.513 / 0.492 | 1124 / 0 | 83 / 0 |
| T3 Volcanic 03 | Striker | slam | 222/224 | 222 / 2 / 0 | 0 | 5749.0 / 6176.0 | 0.498 / 0.498 | 2155 / 0 | 74 / 0 |
| T3 Volcanic 03 | Squire | sweep | 199/201 | 199 / 2 / 0 | 0 | 3598.0 / 4309.0 | 0.760 / 0.720 | 395 / 0 | 60 / 0 |
| T3 Volcanic 03 | Squire | slam | 188/188 | 188 / 0 / 0 | 0 | 3403.0 / 3429.0 | 0.725 / 0.705 | 1348 / 0 | 68 / 0 |
| T3 Volcanic 03 | Apprentice | sweep | 131/149 | 139 / 10 / 18 | 0 | 1591.3 / 2770.9 | 0.636 / 0.547 | 837 / 0 | 1 / 0 |
| T3 Volcanic 03 | Apprentice | slam | 137/150 | 146 / 4 / 13 | 0 | 2850.9 / 3572.7 | 0.408 / 0.387 | 1841 / 0 | 4 / 0 |
| T3 Volcanic 03 | Slinger | sweep | 121/147 | 137 / 10 / 23 | 0 | 1498.0 / 3289.0 | 0.628 / 0.490 | 1096 / 0 | 11 / 0 |
| T3 Volcanic 03 | Slinger | slam | 124/149 | 141 / 8 / 19 | 0 | 2235.0 / 2816.0 | 0.491 / 0.221 | 2270 / 0 | 6 / 0 |
| T3 Volcanic 03 | Conduit | sweep | 55/77 | 65 / 12 / 17 | 1 | 1445.0 / 1779.0 | 0.551 / 0.000 | 0 / 1543 | 5 / 0 |
| T3 Volcanic 03 | Conduit | slam | 98/127 | 110 / 17 / 24 | 0 | 2397.0 / 3049.0 | 0.497 / 0.273 | 0 / 1874 | 2 / 0 |
| T3 Volcanic 03 | Spirit | sweep | 192/216 | 206 / 10 / 17 | 0 | 1027.6 / 1430.9 | 0.714 / 0.688 | 881 / 0 | 5 / 5 |
| T3 Volcanic 03 | Spirit | slam | 199/211 | 207 / 4 / 10 | 0 | 1225.8 / 1804.8 | 0.566 / 0.377 | 1889 / 0 | 3 / 2 |
| T3 Volcanic 05 | Striker | sweep | 217/218 | 217 / 1 / 0 | 0 | 4426.0 / 5810.0 | 0.480 / 0.457 | 1212 / 0 | 77 / 0 |
| T3 Volcanic 05 | Striker | slam | 192/196 | 192 / 4 / 0 | 0 | 5047.0 / 5498.0 | 0.475 / 0.445 | 2005 / 0 | 60 / 0 |
| T3 Volcanic 05 | Squire | sweep | 181/189 | 181 / 8 / 0 | 0 | 3585.0 / 3750.0 | 0.775 / 0.758 | 408 / 0 | 54 / 0 |
| T3 Volcanic 05 | Squire | slam | 178/183 | 178 / 5 / 0 | 0 | 3672.0 / 4000.0 | 0.749 / 0.725 | 1404 / 0 | 60 / 0 |
| T3 Volcanic 05 | Apprentice | sweep | 96/113 | 106 / 7 / 14 | 1 | 2160.3 / 2405.5 | 0.610 / 0.000 | 676 / 0 | 1 / 0 |
| T3 Volcanic 05 | Apprentice | slam | 121/132 | 127 / 5 / 10 | 0 | 2080.1 / 2560.7 | 0.622 / 0.568 | 1765 / 0 | 5 / 0 |
| T3 Volcanic 05 | Slinger | sweep | 128/157 | 140 / 17 / 28 | 0 | 2627.0 / 3119.0 | 0.481 / 0.140 | 1293 / 0 | 1 / 0 |
| T3 Volcanic 05 | Slinger | slam | 101/117 | 113 / 4 / 14 | 0 | 1408.0 / 1594.0 | 0.542 / 0.542 | 2032 / 0 | 8 / 0 |
| T3 Volcanic 05 | Conduit | sweep | 57/88 | 73 / 15 / 30 | 0 | 1065.0 / 1833.0 | 0.702 / 0.579 | 0 / 2015 | 1 / 0 |
| T3 Volcanic 05 | Conduit | slam | 56/95 | 70 / 25 / 34 | 0 | 1342.0 / 2155.0 | 0.674 / 0.509 | 0 / 1655 | 1 / 0 |
| T3 Volcanic 05 | Spirit | sweep | 176/192 | 188 / 4 / 14 | 0 | 1464.9 / 1878.1 | 0.579 / 0.256 | 894 / 0 | 1 / 4 |
| T3 Volcanic 05 | Spirit | slam | 166/177 | 173 / 4 / 9 | 0 | 1200.5 / 1449.6 | 0.659 / 0.425 | 1902 / 0 | 4 / 3 |

The incoming columns are computed from the three raw `index.json` summaries;
the detailed direct/debt source accounting and death windows are audited below.

## Technique, cast, and damage-delivery audit

The event stream recorded the following outbound delivery across all 72
observations:

| Source | Damage type | Events | HP damage |
|---|---|---:|---:|
| Player | direct | 16,267 | 2,955,465 |
| Player | AoE | 2,916 | 695,564 |
| Player | DoT | 1,422 | 189,299 |
| Minions | direct | 7,088 | 267,010 |

The raw index sums 27,427 player attack beats and 7,087 minion attack beats.
Conduit therefore has real minion delivery even when its player attack-beat
count is zero. Technique adapter telemetry included:

| Adapter event | Count |
|---|---:|
| Slinger clip created | 217 |
| Slinger clip shot / splash hit | 1,657 / 1,657 |
| Apprentice secondary target | 123 |
| Conduit arm / delivery / secondary damage | 147 / 337 / 337 |
| Conduit share lost | 8 |

Ability activations were `Sweep` 1,863, `Slam` 806, `Frenzy` 1,812,
`Cleanse` 2,114, and `Second Wind` 72. Monster cast exposure was 193
`Molten Guard` starts and 174 fired cast-end events. The packet held Slam's
charge time fixed; no separate charge-duration telemetry was emitted in these
logs, so activation counts are not used as a charge-cost verdict.

## Pressure, Heat, lava, and deaths

Across the 72 runs, runner minimum-HP quantiles were p10 **38.9%**, p50
**57.9%**, and p90 **75.8%**, with an overall minimum of 0% from the two
deaths. Incoming damage totaled **187,073.3 HP** in **10,960** damage events:
9,611 direct events for 185,076.3 HP and 1,349 Debt events for 1,997 HP.
The event stream contained no incoming `damageType:dot` event and no incoming
damage source labelled lava or Heat. Persisted `incomingDot` is a separate
one-second state field and was present near the Apprentice death; it is not
silently reclassified as event damage.

All 72 Volcanic runs reached Heat stack 6, represented by 6,174 Heat state
events. The 40 persisted lava-burn contact samples across 29 observations were
not present in either death window.

### Player deaths and the sub-20% survivor

Source totals below are HP damage in the stated event window. The runner
minimum is evaluated on the 100ms simulation tick; persisted samples are one
second apart.

| Cell / seed | Outcome and cause | Minimum state | ±10s source totals | ±30s source totals | Heat / lava / DoT context |
|---|---|---|---|---|---|
| T3 Volcanic 03 Conduit Sweep / 8089 | Death at 72.1s; `player-death` cause was Magma Tortoise melee, 104 HP | Runner min 0%; 72.0s sample was 146.9 HP | Tortoise direct 312; Salamander direct 354 | Tortoise direct 773; Salamander direct 767; Scuttler direct 2 | Heat 6 near death; no lava contact; incomingDot sample 0 |
| T3 Volcanic 05 Apprentice Sweep / 6151 | Death at 135.3s; cause metadata was Magma Tortoise Debt, 7 HP, on the tick with a 114.3-HP direct Tortoise hit | Runner min 0%; 135.0s sample was 111.5 HP | Tortoise 336.6 direct + 7 debt; Salamander 318.6 direct + 43 debt; Scuttler 6.3 direct + 9 debt | Tortoise 455.4 direct + 7 debt; Salamander 450.9 direct + 48 debt; Scuttler 9 direct + 9 debt | Heat 6; no lava contact; incomingDot 14–26 in final persisted 10s, not an incoming `damageType:dot` event |
| T3 Volcanic 05 Slinger Sweep / 8089 | Window-ended survivor; no death event | Runner min **14.0%**; closest persisted sample 79.0 / 400 HP at 129.0s (19.75%) | Around that sample: Tortoise 303; Salamander 522; Scuttler 6 | Tortoise 452; Salamander 1,058; Scuttler 9 | No contact at the low sample; no event-stream lava/DoT damage |

The two deaths identify enemy species as immediate sources, with Magma Tortoise
anchor pressure present in both. The low survivor also saw a 149-HP Tortoise
hit and repeated Salamander ranged hits in the surrounding 30-second window.
These observations justify tracking anchor/ranged pressure, but do not justify
a blanket HP or Heat adjustment. The low survivor's 14.0% minimum was a fine
simulation-tick value; the one-second stream did not capture the exact trough.

## Paired interpretation and decisions

| Decision area | Evidence-supported action | Boundary |
|---|---|---|
| Current swarm durability | Hold current enemy/player numbers as planning inputs. | Two deaths, one sub-20% survivor, and four terminal exposure gaps remain unresolved. |
| Technique response | Retain the paired Sweep/Slam deltas descriptively and keep classes and species separate. | No global winner; clean body TTK excludes approach, charge, recovery, and some natural-ecology exposure. |
| Volcanic Conduit | Flag the Volcanic 05 Conduit Slam signal for a later minion-delivery/engagement packet. | Slam's lower median is coupled to censoring, regain exclusions, minion delivery, and its 89.6s quiet tail. |
| Enemy pressure | Keep Scuttlers/Hounds/Salamanders separate from Magma Tortoise anchors; track Tortoise plus Salamander windows. | No blanket HP, attack, plating, resistance, or Heat patch follows from these runs. |
| Exposure repair | Reproduce the four terminal quiet cases with 100ms selected/combat target, aggro/leash/returning state, approach goal, hazard ownership, and actual outgoing damage. | The current 15-run movement qualification passed, but this 72-run natural-ecology block exposed residual reach/reacquisition limits. |
| Next balance stage | Continue remaining T2/T3 roster and role durability/pressure gaps, including Forest, then items/classes/abilities, boss TTK, and T4. | No economy, acquisition, travel, browser, human-feel, or complete-tier conclusion is authorized here. |

## Limitations and exit boundary

- This was one exact frozen sequential pass. Fresh seeds are not same-seed
  old/new controls and the result is descriptive, not a causal treatment
  estimate.
- TTK is post-first-damage body time. Natural ecology merges pulls and adds
  approach, aggro, cast, hazard, recovery, and Slam charge timelines before
  body TTK. Missing clean medians, unfinished rows, HP-regain rows, and death
  rows remain visible and are not converted to zero.
- The raw index uses 100ms simulation ticks, while persisted samples are
  one-second telemetry. Runner minimum HP, death timing, and some incoming
  state therefore have finer timing than the retained samples.
- Attack beats are cooldown timestamp changes, not guaranteed hits. Conduit
  interpretation must include minion beats, minion damage, and delivery/share
  events.
- The movement qualification receipt, typecheck, and focused tests are
  preparation/tooling evidence. Full-suite status and live/browser play remain
  unverified for this packet.
- No movement fix, balance overlay, source edit, retry, or winner selection
  was performed after launch. Durability 13 artifacts were not extended.
- This is synthetic prepared-combat evidence only. It does not certify
  economy, acquisition, travel, client/UI presentation, browser play, human
  feel, live balance, complete-tier behavior, or death cleanup.

Planner exit: keep production source and numeric balance unchanged. Retain the
four terminal exposure cases, two deaths, one sub-20% survivor, Volcanic
Tortoise/Salamander pressure, and the local Conduit signal for the next
explicitly authorized packet.
