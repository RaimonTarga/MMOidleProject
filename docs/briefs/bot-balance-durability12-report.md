# Durability 12 report — hazard approach verification and Sweep/Slam swarm comparison

Status: **complete frozen synthetic benchmark; no live balance change**. The
operator ran the fixed Durability 12 matrix once, sequentially, in packet order:
2 movement cells / 4 observations followed by 48 swarm cells / 144
observations. Both runner blocks completed with exit 0, both verifiers returned
verified true, and there were no retries, restarts, adaptive changes, source
edits, or automatic winners.

## Decision summary

- **Movement gate passed, but movement is not closed.** All four movement
  observations damaged the required named elite. Swamp 05 Striker produced
  11 and 9 distinct Shell Pool entry/leave episodes with continued outgoing
  damage and no 30-second inactivity gap. The Jungle 05 Squire seed 173 run
  still parked on an unengaged Canopy Chameleon for 211.9 sampled seconds:
  attack intent remained set, the target stayed selected, the combat target was
  null, HP stayed full, and the player stopped moving. This is a remaining
  blocked-path/range-release failure, not a solved movement result.
- **Hold current swarm numbers for now.** The 144-run screen produced 7,966
  eligible clean target records, 8,135 target kills, 155 unfinished target
  records, and 243 HP-regain exclusions across 8,290 target records. There were
  three player deaths, all in Volcanic runs; no window-ended survivor fell below
  20% HP. This is enough to retain the adopted swarm durability as a planning
  input, but not enough to authorize a global HP, attack, plating, resistance,
  or item change.
- **Treat technique differences as local signals, not a winner.** Sweep/Slam
  deltas change by class, node, species, and seed. Fast Striker and slow Squire
  are kept separate. T3 Volcanic 05 Conduit Slam is faster than Sweep on the
  clean outer medians for all four target species, but its result is coupled to
  minion delivery and heavy censoring; isolate that ability/minion interaction
  in a later packet rather than patching it here.
- **Volcanic pressure is enemy- and Heat-mediated, not lava damage in these
  deaths.** The three deaths were caused by Magma Tortoise melee twice and Ash
  Salamander ranged once. Heat was present in all 72 Volcanic runs and reached
  stack 6 in 71; lava-burn contact/escape telemetry was present, but no death
  window contained persisted lava contact and no incoming damage event was
  sourced as lava, Heat, or DoT.

No balance source was changed. The adopted Bear and Snapper values and the
targeted Jungle preparations remain untouched.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability12-operator-packet.md](bot-balance-durability12-operator-packet.md) |
| Frozen revision | <code>7b37b3938937dcbb177bbd5b24ebfd762b941f6e</code> |
| Frozen source tree | <code>ef3d93eff805f97da42bdd60732ac5f338017f4e</code> |
| Definitions SHA-256 | <code>75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267</code> |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitbox SHA-256 | <code>08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83</code> |
| Detached checkout | <code>C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability12-20260916/source</code> |
| Qualification root | <code>C:/Users/osaif/AppData/Local/mmo-idle/validation/durability12</code> |
| Results root | <code>C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability12-20260916</code> |
| Mode / timestep / window | <code>run</code> / 100ms / 300s per observation |
| Fresh seeds | Movement <code>173, 3911</code>; swarm <code>3911, 6151, 8089</code> |
| Synthetic / economy eligible | <code>true</code> / <code>false</code> |

The shared checkout contained concurrent heat/chill cleanup, killing-blow
metadata, status presentation, and other work. It was preserved and was not
included in the frozen revision. This run therefore does not validate those
newer shared-checkout behaviors.

| Matrix block | Planned | Executed | Observation outcomes |
|---|---:|---:|---|
| T3 Swamp 05 / T3 Jungle 05 movement | 2 cells / 4 runs | 2 / 4 | 4 windows, 0 deaths |
| T2 Plains 03/05, six classes, Sweep/Slam | 24 cells / 72 runs | 24 / 72 | 72 windows, 0 deaths |
| T3 Volcanic 03/05, six classes, Sweep/Slam | 24 cells / 72 runs | 24 / 72 | 69 windows, 3 deaths |
| **Total** | **50 / 148** | **50 / 148** | **145 windows, 3 deaths, 0 failed** |

The operator ledger records movement from
2026-09-16T11:50:53.1652027Z through
2026-09-16T11:51:27.2370646Z (34.0718619s), then swarm from
2026-09-16T11:51:27.5310414Z through
2026-09-16T12:05:51.2683084Z (14m23.7372670s). The elapsed wall time from
the first start to the final end was **14m58.1031057s** for 12h20m of
simulated time. The movement root contains 22 files / 54,191,711 bytes; the
swarm root contains 582 files / 377,202,019 bytes. Neither root contains
failed.json, and no wall-ceiling or RSS-ceiling outcome was recorded.

### Artifact hashes

| Artifact | Movement SHA-256 | Swarm SHA-256 |
|---|---|---|
| manifest.json | <code>8FD84FC69DC20981C44ED4F5120D8C56E77AAD057BC4A1817769E3BD130E2BB0</code> | <code>CF1F82DA8E726915A02D844852287DC953A1AC5DEB0828138991C2090B2597B6</code> |
| index.json | <code>A54414C4F083B245063929CB69EE47776CA77C9CB3825DB6E9BCB0BE32858C36</code> | <code>C2107C2359F7F2768CE71B893ECD66171B4FB377F941EBC09BF176A6EEC136D8</code> |
| complete.json | <code>E0429D6F45B60034DBD14BBC1EE416BAE974BBB3D282949A4097BDB33ECBE779</code> | <code>52E62DB9E7D570436F0EEA3C90E817DD5776D129F319B3E2406DA3B0EF809A0C</code> |
| analysis.json | <code>2EBC806BBF7E0A63C3BCE60A50E92FF32C44BC602F004EA864647982AA4EC1BB</code> | <code>C8ED10E0D52B14478F2521C61025D60D904D2CF45345CF361CBE04A0A98C0CE7</code> |
| analysis.md | <code>4412900BB6F9C38A35DB5AEB843EC99547F87B2F1E854DA5F52FFA0AE1AC58B4</code> | <code>A4EC42533EFAC3F195157575E15006E1C0B84798B54118E2C14F83F7429D32ED</code> |
| verification.log | <code>BC878539E8401FF6F496F8268D96E0D88160221F5DC324A9DDFACC590688476D</code> | <code>DB4F19442198B002BC71C3D2863CC0AC9ACF6413B33AA8481457BAE838EAF8B4</code> |

The retained verifier output was:

~~~text
{"cells":2,"runs":4,"mode":"run"}
{"trial":"durability12movement","cells":2,"runs":4,"verified":true}
{"cells":48,"runs":144,"mode":"run"}
{"trial":"durability12swarm","cells":48,"runs":144,"verified":true}
~~~

### READY and pair audit

All 148 READY records matched the manifest equipment, offensive stance,
intended technique, and no-overlay preparation. The movement block used the
packet's default Sweep technique; the 144 swarm records matched their
Sweep/Slam assignment. All 72 Sweep/Slam pairs matched both the initial roster
hash and geometry roster hash. The frozen source checkout was at the packet
revision/tree and was clean.

Qualification and pilots were retained and were not rerun. The packet's
preparation receipt records all 50 configurations qualified, four 30-second
tooling pilots passed, report generators/verifier tests passed, and the frozen
typechecks/focused movement tests passed. Its clean frozen full-suite result
was 214/218: the two older balance assertions (Moss-Shell Snapper ecology
relationship and a fixed-shell floating-point comparison), the legacy
tier1Snapshot unsupported-range fixture, and the obsolete/unowned
spirit-volcano-control-t3-v1r harness. These are outside the runner result;
do not call the full suite green.

## Movement audit

The four 100ms movement streams were inspected directly, including selected
targets, positions, attack intent, outgoing damage, hazard events, and HP
state.
<code>attack beats</code> below are cooldown timestamp changes, not guaranteed hits.

| Cell / seed | First named elite damage | Kills | Attack beats | Deaths | Terrain contacts | Longest attack-intent gap with no outgoing damage |
|---|---:|---:|---:|---:|---|---|
| T3 Jungle 05 Squire / 173 | Silverback 28.4s | 13 | 43 | 0 | none | **211.9s**, 88.0–299.9s |
| T3 Jungle 05 Squire / 3911 | Silverback 27.8s | 34 | 138 | 0 | none | 7.8s, 17.5–25.3s |
| T3 Swamp 05 Striker / 173 | Plague-Shell Snapper 32.7s | 28 | 280 | 0 | 11 Shell Pool enters / 11 leaves | 8.1s, 261.9–270.0s |
| T3 Swamp 05 Striker / 3911 | Plague-Shell Snapper 30.8s | 26 | 231 | 0 | 9 Shell Pool enters / 9 leaves | 9.2s, 250.1–259.3s |

The Jungle Squire/173 interval is a real remaining stall. From 88.0s
through the final 299.9s sample, the selected target stayed on
Canopy Chameleon entity 31, but the combat target stayed null. The player
settled at approximately (3312, 3408), the target stayed near
(3531, 3346), HP stayed at the 459-HP maximum, and there were no static
hazard contacts. The stream showed an initial approach and then a stationary
range-lock; it did not look like oscillation, recovery, or leash movement.
The target remained at full 720 HP. This is not a combat success and not a
zero TTK.

The Swamp contact gate was positive but deliberately weak. Seed 173 entered
11 different Shell Pool IDs and seed 3911 entered 9 different IDs; every
entry had a matching leave, with 0.5–0.8s recorded contact durations and
77 / 63 contact damage respectively. The 20 entries were distinct pool IDs;
no same-ID re-entry was observed. Hazard escape events were 24/24 and 29/29
attempt/result pairs, all successful. The new contacts therefore verify
exposure and continued attack delivery, but they do not erase the Jungle
late stall or prove all movement paths solved.

Raw movement evidence:
[Jungle Squire/173 summary](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability12-20260916/results-durability12movement/dur12-movement-node-t3-jungle-05-squire-s173/summary.json>),
[100ms samples](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability12-20260916/results-durability12movement/dur12-movement-node-t3-jungle-05-squire-s173/samples.jsonl>),
and
[Swamp Striker/173 samples](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability12-20260916/results-durability12movement/dur12-movement-node-t3-swamp-05-striker-s173/samples.jsonl>).

## Swarm audit

Each swarm observation was a fresh synthetic 300-second World with natural
ecology. A target's clean eligibility was exactly: clean true, killedAtMs
present, finite ttkMs, and hpRegainObserved not true. TTK is post-first-damage
body time. FirstDamageMs is retained separately because approach, pull,
casting, and engagement delay occur before body TTK; those delays must not be
mistaken for a faster technique.

Across 144 observations there were 141 window-ended runs and 3 player-death
runs. The 8,290 recorded target rows all had firstDamageMs; 8,135 were killed,
155 were unfinished at the stop/window boundary, 243 carried an HP-regain
flag, and 7,966 were clean eligible. The regained counter is an exclusion
indicator and may overlap a killed or unfinished row; it is not a partition.
Missing clean seed medians remain shown as an em dash in the tables and are
never converted to zero. Natural episodes can merge pulls, so these are not
authored isolated-pack TTKs.

### Per-species TTK

The compact tables below show each target species for every node/class. Within
each cell, S is Sweep and L is Slam; each triplet is the clean seed median in
seed order 3911 / 6151 / 8089, followed by the outer median, in seconds.
Plains separates the three small bodies (Yearling, Hawk, Wolf) from the Bull
anchor; Volcanic separates Scuttler, Hound, Salamander, and Tortoise. A zero
is a valid clean one-hit body TTK; an em dash is missing clean data.


### T2 Plains 03
| Class | Yearling | Hawk | Wolf | Bull |
|---|---:|---:|---:|---:|
| Striker | S 3.00/2.00/2.50→2.50; L 1.90/2.50/1.50→1.90 | S 2.00/2.00/2.00→2.00; L 2.00/3.10/3.10→3.10 | S 2.50/4.00/4.00→4.00; L 3.10/4.35/2.90→3.10 | S 5.00/5.00/5.00→5.00; L 5.95/5.30/5.60→5.60 |
| Squire | S 0.00/0.00/0.00→0.00; L 0.00/0.00/0.00→0.00 | S 1.90/1.90/0.00→1.90; L 1.50/1.50/0.00→1.50 | S 0.00/2.85/1.90→1.90; L 1.80/1.80/1.80→1.80 | S 5.70/5.70/5.70→5.70; L 5.00/3.80/3.80→3.80 |
| Apprentice | S 1.50/1.50/1.60→1.50; L 1.50/0.85/0.90→0.90 | S 3.00/3.00/3.00→3.00; L 1.95/2.20/2.30→2.20 | S 3.00/2.50/3.00→3.00; L 2.35/1.70/2.20→2.20 | S 4.50/4.80/4.80→4.80; L 3.70/4.50/4.50→4.50 |
| Slinger | S 0.90/0.90/0.30→0.90; L 0.30/0.30/0.30→0.30 | S 0.90/0.90/0.90→0.90; L 1.80/2.20/0.90→1.80 | S 2.10/2.90/1.80→2.10; L 2.60/1.20/1.20→1.20 | S 3.50/3.50/3.50→3.50; L 3.50/3.40/3.10→3.40 |
| Conduit | S 1.90/1.40/3.70→1.90; L 1.55/1.55/1.30→1.55 | S 2.35/2.40/2.10→2.35; L 1.85/1.70/1.70→1.70 | S 4.80/3.25/8.90→4.80; L 4.30/3.80/3.20→3.80 | S 4.90/5.00/6.10→5.00; L 5.05/7.15/4.75→5.05 |
| Spirit | S 0.70/0.70/0.70→0.70; L 0.70/0.70/0.00→0.70 | S 0.70/0.70/0.70→0.70; L 0.70/0.70/0.70→0.70 | S 2.10/2.10/1.40→2.10; L 2.15/2.10/1.40→2.10 | S 3.50/3.50/3.50→3.50; L 2.80/3.60/2.80→2.80 |

### T2 Plains 05
| Class | Yearling | Hawk | Wolf | Bull |
|---|---:|---:|---:|---:|
| Striker | S 1.50/1.50/1.75→1.50; L 2.30/1.90/1.50→1.90 | S 2.50/2.50/2.50→2.50; L 3.10/2.50/2.50→2.50 | S 3.00/3.50/2.50→3.00; L 3.65/3.40/3.40→3.40 | S 5.50/5.50/5.50→5.50; L 6.10/6.50/6.10→6.10 |
| Squire | S 1.90/1.90/1.90→1.90; L 0.00/0.00/0.00→0.00 | S 1.90/1.90/1.90→1.90; L 1.85/1.50/1.80→1.80 | S 3.80/3.80/3.80→3.80; L 1.80/1.80/1.80→1.80 | S 5.70/3.80/4.75→4.75; L 3.80/3.80/3.80→3.80 |
| Apprentice | S 1.60/1.50/1.50→1.50; L 1.50/0.20/0.80→0.80 | S 3.00/3.00/2.20→3.00; L 3.00/2.25/3.00→3.00 | S 3.00/2.50/3.85→3.00; L 2.20/2.20/2.20→2.20 | S 4.50/4.65/4.65→4.65; L 4.60/4.30/4.50→4.50 |
| Slinger | S 0.30/0.30/0.90→0.30; L 0.30/0.60/0.30→0.30 | S 0.90/0.90/0.90→0.90; L 1.45/2.40/0.90→1.45 | S 1.50/2.10/1.50→1.50; L 2.20/1.45/1.40→1.45 | S 2.10/3.80/3.80→3.80; L 5.10/3.50/3.90→3.90 |
| Conduit | S 2.80/1.95/3.35→2.80; L 1.60/1.40/1.30→1.40 | S 3.30/3.45/3.30→3.30; L 2.50/2.20/4.00→2.50 | S 3.85/10.20/7.50→7.50; L 4.50/4.50/6.20→4.50 | S 5.00/5.00/15.70→5.00; L 7.25/13.80/5.50→7.25 |
| Spirit | S 0.70/0.70/0.70→0.70; L 0.70/0.70/0.35→0.70 | S 1.40/1.40/1.40→1.40; L 1.70/1.80/2.10→1.80 | S 2.80/2.10/1.40→2.10; L 1.75/1.55/1.70→1.70 | S 3.15/3.50/2.80→3.15; L 3.35/3.90/3.40→3.40 |

### T3 Volcanic 03
| Class | Scuttler | Hound | Salamander | Tortoise |
|---|---:|---:|---:|---:|
| Striker | S 1.50/1.70/1.40→1.50; L 2.10/2.55/2.80→2.55 | S 4.20/5.00/3.90→4.20; L 4.30/4.50/4.35→4.35 | S 2.50/2.90/2.50→2.50; L 3.25/3.85/4.10→3.85 | S 5.55/7.20/6.80→6.80; L 8.30/8.90/7.30→8.30 |
| Squire | S 1.40/3.40/1.80→1.80; L 1.80/2.25/3.15→2.25 | S 5.00/6.40/5.40→5.40; L 6.50/5.90/5.00→5.90 | S 3.60/4.60/3.00→3.60; L 3.60/4.60/2.00→3.60 | S 11.40/9.60/10.30→10.30; L 10.55/9.50/6.70→9.50 |
| Apprentice | S 3.00/3.00/2.70→3.00; L 2.40/2.40/2.55→2.40 | S 6.00/—/6.00→6.00; L 5.90/6.00/7.60→6.00 | S 5.15/4.80/5.00→5.00; L 4.70/4.70/5.10→4.70 | S —/—/—→—; L 8.00/7.70/7.30→7.70 |
| Slinger | S 2.80/2.85/3.05→2.85; L 3.10/2.80/2.75→2.80 | S 5.00/5.40/5.20→5.20; L 5.80/—/4.90→5.35 | S 4.50/4.70/4.10→4.50; L 5.50/4.00/4.50→4.50 | S —/11.80/10.80→11.30; L 9.00/—/6.90→7.95 |
| Conduit | S 7.05/9.70/8.90→8.90; L 6.20/6.40/6.20→6.20 | S 16.10/25.00/15.40→16.10; L 14.05/12.90/15.40→14.05 | S 7.40/7.40/7.70→7.40; L 8.10/7.40/7.40→7.40 | S 16.00/—/—→16.00; L 16.55/16.35/—→16.45 |
| Spirit | S 1.40/1.30/1.40→1.40; L 1.70/1.40/1.40→1.40 | S 4.00/—/3.50→3.75; L 3.55/4.50/4.00→4.00 | S 2.60/2.70/2.90→2.70; L 2.50/3.05/2.85→2.85 | S 4.40/—/6.35→5.38; L 6.50/5.60/7.65→6.50 |

### T3 Volcanic 05
| Class | Scuttler | Hound | Salamander | Tortoise |
|---|---:|---:|---:|---:|
| Striker | S 2.00/2.00/2.00→2.00; L 5.60/2.50/2.60→2.60 | S 4.20/6.10/6.20→6.10; L 5.70/5.70/4.90→5.70 | S 3.80/3.25/3.40→3.40; L 4.65/4.25/4.30→4.30 | S 12.00/10.90/7.60→10.90; L 10.25/10.25/7.40→10.25 |
| Squire | S 3.60/3.60/3.20→3.60; L 3.00/3.05/2.75→3.00 | S 6.40/8.60/7.85→7.85; L 7.35/8.40/5.60→7.35 | S 3.60/6.40/4.30→4.30; L 5.60/5.30/3.40→5.30 | S 12.10/11.80/12.75→12.10; L 8.10/13.30/11.60→11.60 |
| Apprentice | S 3.00/3.00/3.00→3.00; L 2.80/3.00/3.00→3.00 | S 7.90/6.15/6.25→6.25; L 6.75/8.70/6.05→6.75 | S 5.40/5.20/5.40→5.40; L 6.95/5.20/5.75→5.75 | S 12.40/—/11.55→11.97; L 9.00/—/9.10→9.05 |
| Slinger | S 3.00/3.30/2.95→3.00; L 2.90/2.90/2.85→2.90 | S 5.60/4.80/8.20→5.60; L 7.25/6.20/—→6.72 | S 4.90/4.70/4.80→4.80; L 8.15/5.20/6.00→6.00 | S —/11.60/9.70→10.65; L 9.65/7.60/12.00→9.65 |
| Conduit | S 10.70/15.40/11.70→11.70; L 7.00/6.90/8.60→7.00 | S 22.20/—/20.90→21.55; L 16.90/—/—→16.90 | S 10.40/—/10.25→10.32; L 5.60/13.20/7.70→7.70 | S 28.50/—/—→28.50; L 24.60/26.10/24.00→24.60 |
| Spirit | S 1.50/1.40/1.90→1.50; L 1.75/1.80/1.50→1.75 | S 4.60/4.20/4.30→4.30; L 3.50/3.60/5.35→3.60 | S 3.00/4.10/3.50→3.50; L 3.95/3.30/3.50→3.50 | S 6.65/4.70/6.10→6.10; L 10.40/7.05/6.60→7.05 |

### Paired deltas (Slam minus Sweep; seconds)

#### Plains
| Node / class | Yearling | Hawk | Wolf | Bull |
|---|---:|---:|---:|---:|
| T2 Plains 03 / Striker | -1.10/0.50/-1.00→-1.00 | 0.00/1.10/1.10→1.10 | 0.60/0.35/-1.10→0.35 | 0.95/0.30/0.60→0.60 |
| T2 Plains 03 / Squire | 0.00/0.00/0.00→0.00 | -0.40/-0.40/0.00→-0.40 | 1.80/-1.05/-0.10→-0.10 | -0.70/-1.90/-1.90→-1.90 |
| T2 Plains 03 / Apprentice | 0.00/-0.65/-0.70→-0.65 | -1.05/-0.80/-0.70→-0.80 | -0.65/-0.80/-0.80→-0.80 | -0.80/-0.30/-0.30→-0.30 |
| T2 Plains 03 / Slinger | -0.60/-0.60/0.00→-0.60 | 0.90/1.30/0.00→0.90 | 0.50/-1.70/-0.60→-0.60 | 0.00/-0.10/-0.40→-0.10 |
| T2 Plains 03 / Conduit | -0.35/0.15/-2.40→-0.35 | -0.50/-0.70/-0.40→-0.50 | -0.50/0.55/-5.70→-0.50 | 0.15/2.15/-1.35→0.15 |
| T2 Plains 03 / Spirit | 0.00/0.00/-0.70→0.00 | 0.00/0.00/0.00→0.00 | 0.05/0.00/0.00→0.00 | -0.70/0.10/-0.70→-0.70 |
| T2 Plains 05 / Striker | 0.80/0.40/-0.25→0.40 | 0.60/0.00/0.00→0.00 | 0.65/-0.10/0.90→0.65 | 0.60/1.00/0.60→0.60 |
| T2 Plains 05 / Squire | -1.90/-1.90/-1.90→-1.90 | -0.05/-0.40/-0.10→-0.10 | -2.00/-2.00/-2.00→-2.00 | -1.90/0.00/-0.95→-0.95 |
| T2 Plains 05 / Apprentice | -0.10/-1.30/-0.70→-0.70 | 0.00/-0.75/0.80→0.00 | -0.80/-0.30/-1.65→-0.80 | 0.10/-0.35/-0.15→-0.15 |
| T2 Plains 05 / Slinger | 0.00/0.30/-0.60→0.00 | 0.55/1.50/0.00→0.55 | 0.70/-0.65/-0.10→-0.10 | 3.00/-0.30/0.10→0.10 |
| T2 Plains 05 / Conduit | -1.20/-0.55/-2.05→-1.20 | -0.80/-1.25/0.70→-0.80 | 0.65/-5.70/-1.30→-1.30 | 2.25/8.80/-10.20→2.25 |
| T2 Plains 05 / Spirit | 0.00/0.00/-0.35→0.00 | 0.30/0.40/0.70→0.40 | -1.05/-0.55/0.30→-0.55 | 0.20/0.40/0.60→0.40 |

#### Volcanic
| Node / class | Scuttler | Hound | Salamander | Tortoise |
|---|---:|---:|---:|---:|
| T3 Volcanic 03 / Striker | 0.60/0.85/1.40→0.85 | 0.10/-0.50/0.45→0.10 | 0.75/0.95/1.60→0.95 | 2.75/1.70/0.50→1.70 |
| T3 Volcanic 03 / Squire | 0.40/-1.15/1.35→0.40 | 1.50/-0.50/-0.40→-0.40 | 0.00/0.00/-1.00→0.00 | -0.85/-0.10/-3.60→-0.85 |
| T3 Volcanic 03 / Apprentice | -0.60/-0.60/-0.15→-0.60 | -0.10/—/1.60→0.75 | -0.45/-0.10/0.10→-0.10 | —/—/—→— |
| T3 Volcanic 03 / Slinger | 0.30/-0.05/-0.30→-0.05 | 0.80/—/-0.30→0.25 | 1.00/-0.70/0.40→0.40 | —/—/-3.90→-3.90 |
| T3 Volcanic 03 / Conduit | -0.85/-3.30/-2.70→-2.70 | -2.05/-12.10/0.00→-2.05 | 0.70/0.00/-0.30→0.00 | 0.55/—/—→0.55 |
| T3 Volcanic 03 / Spirit | 0.30/0.10/0.00→0.10 | -0.45/—/0.50→0.02 | -0.10/0.35/-0.05→-0.05 | 2.10/—/1.30→1.70 |
| T3 Volcanic 05 / Striker | 3.60/0.50/0.60→0.60 | 1.50/-0.40/-1.30→-0.40 | 0.85/1.00/0.90→0.90 | -1.75/-0.65/-0.20→-0.65 |
| T3 Volcanic 05 / Squire | -0.60/-0.55/-0.45→-0.55 | 0.95/-0.20/-2.25→-0.20 | 2.00/-1.10/-0.90→-0.90 | -4.00/1.50/-1.15→-1.15 |
| T3 Volcanic 05 / Apprentice | -0.20/0.00/0.00→0.00 | -1.15/2.55/-0.20→-0.20 | 1.55/0.00/0.35→0.35 | -3.40/—/-2.45→-2.92 |
| T3 Volcanic 05 / Slinger | -0.10/-0.40/-0.10→-0.10 | 1.65/1.40/—→1.52 | 3.25/0.50/1.20→1.20 | —/-4.00/2.30→-0.85 |
| T3 Volcanic 05 / Conduit | -3.70/-8.50/-3.10→-3.70 | -5.30/—/—→-5.30 | -4.80/—/-2.55→-3.67 | -3.90/—/—→-3.90 |
| T3 Volcanic 05 / Spirit | 0.25/0.40/-0.40→0.25 | -1.10/-0.60/1.05→-0.60 | 0.95/-0.80/0.00→0.00 | 3.75/2.35/0.50→2.35 |

### Cell accounting / pressure
| Node | Class | Tech | clean/records | kills / unfinished / regained | D | incoming med/max | minHP med/min | player/minion beats | recovery done / interrupted |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| T2 Plains 03 | Striker | sweep | 229/232 | 229 / 3 / 0 | 0 | 274.0 / 321.0 | 0.974 / 0.963 | 1118 / 0 | 102 / 0 |
| T2 Plains 03 | Striker | slam | 195/199 | 195 / 4 / 0 | 0 | 258.0 / 309.0 | 0.979 / 0.956 | 2105 / 0 | 95 / 0 |
| T2 Plains 03 | Squire | sweep | 222/223 | 222 / 1 / 0 | 0 | 187.0 / 205.0 | 0.995 / 0.990 | 342 / 0 | 96 / 0 |
| T2 Plains 03 | Squire | slam | 238/240 | 238 / 2 / 0 | 0 | 181.0 / 189.0 | 0.994 / 0.984 | 1234 / 0 | 108 / 0 |
| T2 Plains 03 | Apprentice | sweep | 223/227 | 223 / 4 / 1 | 0 | 209.7 / 240.3 | 0.949 / 0.936 | 686 / 0 | 43 / 0 |
| T2 Plains 03 | Apprentice | slam | 218/219 | 218 / 1 / 0 | 0 | 163.8 / 166.5 | 0.964 / 0.956 | 1641 / 0 | 28 / 0 |
| T2 Plains 03 | Slinger | sweep | 294/301 | 295 / 6 / 1 | 0 | 205.0 / 258.0 | 0.966 / 0.958 | 986 / 0 | 122 / 0 |
| T2 Plains 03 | Slinger | slam | 266/269 | 267 / 2 / 1 | 0 | 233.0 / 253.0 | 0.958 / 0.958 | 1973 / 0 | 119 / 0 |
| T2 Plains 03 | Conduit | sweep | 196/200 | 198 / 2 / 4 | 0 | 70.0 / 76.0 | 0.913 / 0.913 | 0 / 2019 | 78 / 4 |
| T2 Plains 03 | Conduit | slam | 206/207 | 206 / 1 / 0 | 0 | 36.0 / 42.0 | 0.939 / 0.939 | 0 / 2176 | 98 / 7 |
| T2 Plains 03 | Spirit | sweep | 240/242 | 242 / 0 / 2 | 0 | 0.0 / 0.0 | 1.000 / 1.000 | 698 / 0 | 24 / 23 |
| T2 Plains 03 | Spirit | slam | 268/269 | 268 / 1 / 0 | 0 | 0.0 / 0.0 | 1.000 / 1.000 | 1790 / 0 | 43 / 31 |
| T2 Plains 05 | Striker | sweep | 222/223 | 222 / 1 / 0 | 0 | 283.0 / 296.0 | 0.975 / 0.970 | 1131 / 0 | 102 / 0 |
| T2 Plains 05 | Striker | slam | 202/203 | 202 / 1 / 0 | 0 | 284.0 / 312.0 | 0.975 / 0.970 | 2064 / 0 | 87 / 0 |
| T2 Plains 05 | Squire | sweep | 199/203 | 199 / 4 / 0 | 0 | 228.0 / 277.0 | 0.990 / 0.988 | 351 / 0 | 86 / 0 |
| T2 Plains 05 | Squire | slam | 236/236 | 236 / 0 / 0 | 0 | 178.0 / 198.0 | 0.993 / 0.991 | 1173 / 0 | 101 / 0 |
| T2 Plains 05 | Apprentice | sweep | 190/195 | 191 / 4 / 3 | 0 | 191.7 / 213.3 | 0.952 / 0.952 | 615 / 0 | 42 / 0 |
| T2 Plains 05 | Apprentice | slam | 195/198 | 196 / 2 / 1 | 0 | 145.8 / 154.8 | 0.968 / 0.960 | 1556 / 0 | 55 / 0 |
| T2 Plains 05 | Slinger | sweep | 261/265 | 262 / 3 / 1 | 0 | 210.0 / 264.0 | 0.958 / 0.944 | 923 / 0 | 129 / 0 |
| T2 Plains 05 | Slinger | slam | 237/237 | 237 / 0 / 0 | 0 | 193.0 / 236.0 | 0.958 / 0.897 | 1879 / 0 | 103 / 0 |
| T2 Plains 05 | Conduit | sweep | 157/171 | 165 / 6 / 11 | 0 | 111.0 / 141.0 | 0.905 / 0.827 | 0 / 2020 | 45 / 1 |
| T2 Plains 05 | Conduit | slam | 176/185 | 181 / 4 / 7 | 0 | 75.0 / 84.0 | 0.897 / 0.883 | 0 / 2175 | 10 / 0 |
| T2 Plains 05 | Spirit | sweep | 237/244 | 240 / 4 / 3 | 0 | 0.0 / 0.0 | 1.000 / 1.000 | 745 / 0 | 19 / 8 |
| T2 Plains 05 | Spirit | slam | 248/250 | 248 / 2 / 0 | 0 | 0.0 / 0.0 | 1.000 / 1.000 | 1741 / 0 | 17 / 13 |
| T3 Volcanic 03 | Striker | sweep | 135/135 | 135 / 0 / 0 | 0 | 2401.0 / 3891.0 | 0.515 / 0.475 | 645 / 0 | 49 / 0 |
| T3 Volcanic 03 | Striker | slam | 206/206 | 206 / 0 / 0 | 0 | 4911.0 / 6785.0 | 0.520 / 0.489 | 1925 / 0 | 65 / 0 |
| T3 Volcanic 03 | Squire | sweep | 175/175 | 175 / 0 / 0 | 0 | 2644.0 / 3425.0 | 0.752 / 0.747 | 315 / 0 | 56 / 0 |
| T3 Volcanic 03 | Squire | slam | 137/137 | 137 / 0 / 0 | 0 | 2099.0 / 2253.0 | 0.750 / 0.743 | 949 / 0 | 45 / 0 |
| T3 Volcanic 03 | Apprentice | sweep | 63/75 | 69 / 6 / 12 | 0 | 563.9 / 2500.9 | 0.669 / 0.577 | 420 / 0 | 1 / 0 |
| T3 Volcanic 03 | Apprentice | slam | 129/140 | 138 / 2 / 10 | 0 | 1773.5 / 2595.6 | 0.650 / 0.590 | 1733 / 0 | 9 / 0 |
| T3 Volcanic 03 | Slinger | sweep | 125/142 | 135 / 7 / 17 | 0 | 2720.0 / 4044.0 | 0.555 / 0.417 | 1051 / 0 | 9 / 0 |
| T3 Volcanic 03 | Slinger | slam | 91/99 | 97 / 2 / 7 | 0 | 2598.0 / 2891.0 | 0.387 / 0.348 | 1510 / 0 | 1 / 0 |
| T3 Volcanic 03 | Conduit | sweep | 63/90 | 76 / 14 / 22 | 0 | 1013.0 / 1938.0 | 0.721 / 0.566 | 0 / 1630 | 1 / 0 |
| T3 Volcanic 03 | Conduit | slam | 91/114 | 108 / 6 / 21 | 0 | 1920.0 / 2458.0 | 0.581 / 0.529 | 0 / 1778 | 5 / 0 |
| T3 Volcanic 03 | Spirit | sweep | 135/143 | 139 / 4 / 5 | 0 | 1091.8 / 2298.8 | 0.444 / 0.410 | 610 / 0 | 4 / 4 |
| T3 Volcanic 03 | Spirit | slam | 167/176 | 173 / 3 / 8 | 1 | 1238.6 / 2278.4 | 0.567 / 0.000 | 1608 / 0 | 4 / 1 |
| T3 Volcanic 05 | Striker | sweep | 109/111 | 109 / 2 / 0 | 0 | 3872.0 / 4615.0 | 0.792 / 0.410 | 614 / 0 | 47 / 0 |
| T3 Volcanic 05 | Striker | slam | 113/113 | 113 / 0 / 0 | 0 | 1855.0 / 5222.0 | 0.554 / 0.407 | 1239 / 0 | 40 / 0 |
| T3 Volcanic 05 | Squire | sweep | 167/169 | 167 / 2 / 0 | 0 | 3011.0 / 4485.0 | 0.764 / 0.762 | 383 / 0 | 51 / 0 |
| T3 Volcanic 05 | Squire | slam | 83/85 | 83 / 2 / 0 | 0 | 1527.0 / 1549.0 | 0.770 / 0.733 | 667 / 0 | 25 / 0 |
| T3 Volcanic 05 | Apprentice | sweep | 67/82 | 75 / 7 / 14 | 0 | 1245.0 / 2273.7 | 0.628 / 0.580 | 476 / 0 | 4 / 0 |
| T3 Volcanic 05 | Apprentice | slam | 80/96 | 91 / 5 / 14 | 0 | 1196.2 / 2189.5 | 0.653 / 0.650 | 1271 / 0 | 6 / 0 |
| T3 Volcanic 05 | Slinger | sweep | 72/86 | 81 / 5 / 14 | 0 | 1657.0 / 1997.0 | 0.542 / 0.490 | 746 / 0 | 3 / 0 |
| T3 Volcanic 05 | Slinger | slam | 84/96 | 95 / 1 / 12 | 0 | 2211.0 / 3201.0 | 0.508 / 0.449 | 1689 / 0 | 6 / 0 |
| T3 Volcanic 05 | Conduit | sweep | 39/59 | 49 / 10 / 12 | 1 | 1575.0 / 2382.0 | 0.692 / 0.000 | 0 / 1436 | 1 / 0 |
| T3 Volcanic 05 | Conduit | slam | 62/91 | 79 / 12 / 28 | 0 | 1164.0 / 1465.0 | 0.746 / 0.692 | 0 / 1784 | 9 / 0 |
| T3 Volcanic 05 | Spirit | sweep | 111/119 | 117 / 2 / 8 | 1 | 1030.1 / 1250.3 | 0.296 / 0.000 | 573 / 0 | 1 / 1 |
| T3 Volcanic 05 | Spirit | slam | 107/113 | 108 / 5 / 4 | 0 | 385.6 / 2221.9 | 0.637 / 0.539 | 1186 / 0 | 0 / 1 |


### Reading the accounting table

The accounting table is aggregated over all four species in each
node/class/technique cell. Its clean/records column is the eligible count over
all raw target records. Kills, unfinished, and regained are shown separately;
regained can overlap the other state counters. Incoming pressure is median /
maximum HP damage over the three seeds. Minimum HP is median / minimum
runner fraction. Recovery is completed / interrupted telemetry windows.
Conduit's player attack-beat column is zero because its damage delivery is
represented by minion beats and minion damage.

## Technique, cast, and damage-delivery audit

The raw event stream recorded the following outbound delivery across all 144
swarm observations:

| Source | Damage type | Events | HP damage |
|---|---|---:|---:|
| Player | direct | 24,949 | 3,099,365 |
| Player | AoE | 4,976 | 815,193 |
| Player | DoT | 2,358 | 222,691 |
| Minions | direct | 15,019 | 412,193 |

The runner recorded 44,361 player attack beats and 15,018 minion attack
beats. Conduit therefore has real delivery telemetry even when its player
attack-beat count is zero. Sweep adapter events included 3,184 Slinger
clip-shot/splash-hit records, 536 Conduit delivery/secondary-damage records,
and 225 Apprentice secondary-target records. Slam delivery appeared through
its ability activation and damage events rather than a technique-adapter
record in this stream; that logging difference is not treated as a power
claim.

Monster cast exposure was:

| Biome block | Cast | Starts | Fired |
|---|---|---:|---:|
| T2 Plains | Dive Bomb | 1,123 | 1,120 |
| T3 Volcanic | Molten Guard | 131 | 115 |

No event labelled Charge appeared as a player activation or monster cast in
the 144 swarm event logs. This is an event-stream observation, not proof that
any unlogged internal charge state was absent. Body TTK interpretation still
uses FirstDamageMs and the cast/approach timeline rather than only
post-first-hit duration.

### Paired Sweep/Slam deltas

The paired delta tables above are raw Slam minus Sweep differences, in seconds,
in seed order 3911 / 6151 / 8089 followed by the outer median. Negative means
Slam killed the clean target faster; positive means slower. Missing values mean
one side had no clean seed median. The comparison is descriptive within each
node/class/species/seed. Fast Striker and slow Squire were not pooled.

Notable patterns are mixed: T2 Plains 05 Squire Slam is consistently faster
for Yearling and Wolf, while T2 Plains 05 Striker is slightly slower for the
same small bodies and Bull. Volcanic 05 Conduit Slam is faster on all four
species by the clean outer medians, but with substantial target censoring,
HP-regain exclusions, and one Sweep death. These are candidate follow-ups, not
automatic technique winners.

## Pressure, Heat, lava, and deaths

Across the 144 swarm runs, runner minimum-HP quantiles were p10 **48.96%**,
p50 **89.47%**, and p90 **99.59%**, with an overall 0% minimum from the three
deaths. Incoming damage totaled **148,541.9 HP** in 15,991 direct events and
893 debt events for 1,224 HP. No incoming DoT event was recorded. Recovery
telemetry contained 2,194 completed and 94 interrupted windows out of 2,289
recorded recovery windows.

All 72 Volcanic runs exposed Heat; 71 reached stack 6 and one reached stack 5,
with 2,127 Heat state events. Lava-burn telemetry recorded 2,051 escape
attempts and 2,048 successful results; 211 persisted lava-burn contact samples
appeared in 58 observations. None of the three death windows had a lava
contact sample. Heat modifies damage taken but did not appear as a damage
source in the incoming damage events.

### Player deaths and sub-20% runs

There were no window-ended survivors below 20% HP. All three rows below are
player deaths; source totals are HP damage within the stated event window.
The persisted sample is one-second telemetry, while the runner's minimum HP
is evaluated on the 100ms simulation tick.

| Cell / seed | Death / cause | Minimum persisted sample | ±10s enemy sources | ±30s enemy sources | Heat / lava context |
|---|---|---|---|---|---|
| T3 Volcanic 03 Spirit Slam / 8089 | 297.3s, Magma Tortoise melee 151 | 8.6 / 383 HP at 297.0s (2.25%) | Tortoise 428.0; Salamander 112.0 | Tortoise 428.0; Salamander 275.0 | Heat 5→6 near; no lava sample |
| T3 Volcanic 05 Conduit Sweep / 6151 | 77.7s, Magma Tortoise melee 104 | 91.4 / 409 HP at 66.0s (22.36%); final sub-20 crossing was between persisted samples | Tortoise 312.0; Salamander 295.0 | Tortoise 788.0; Salamander 787.0 | Heat reached 6 within 30s; no lava sample |
| T3 Volcanic 05 Spirit Sweep / 6151 | 158.0s, Ash Salamander ranged 75 | 0 / 383 HP at 158.0s (0%) | Tortoise 420.0; Salamander 353.0 | Tortoise 420.0; Salamander 353.0 | Heat 5→6 near; no lava sample |

The death-cause event and surrounding direct-hit windows identify enemy
species as the immediate sources: Tortoise is the anchor pressure in two
deaths, while Salamander is the ranged finishing source in the third. The
small Ember Scuttler contribution in these windows was zero or negligible.
There is no evidence here for a lava damage or incoming DoT death. Heat was
present as an amplifying status, so the results do not show that Volcanic is
safe when Heat exposure is removed.

## Paired interpretation and decisions

| Decision area | Evidence-supported action | Boundary |
|---|---|---|
| Current swarm durability | Hold current enemy/player numbers as planning inputs; no automatic HP, attack, plating, resistance, or item patch. | Plains was death-free, while Volcanic anchor/censor tails and three deaths need targeted review. |
| Small bodies vs anchors | Keep Yearling/Hawk/Wolf and Scuttler/Hound/Salamander separate from Bull/Tortoise. | Do not apply a toughest-anchor conclusion to every swarm member. |
| Technique response | Retain paired Sweep/Slam deltas descriptively; keep Striker and Squire separate. | No global Sweep/Slam winner from natural-ecology runs. |
| Volcanic Conduit | Flag Volcanic 05 Conduit Slam versus Sweep for a later minion-delivery/ability packet. | Its faster Slam medians are confounded by minion delivery, censoring, regain exclusions, and one Sweep death. |
| Movement | Isolate Jungle 05 Squire/seed 173's stationary Canopy Chameleon range-lock and inspect the safe attack-range release/path. | The four-run contact gate is not a navigation certification. |
| Next balance stage | Continue with remaining T2/T3 roster gaps, including Forest, then wider item/class/ability work. | No economy, boss, T4 propagation, or live-feel conclusion is authorized by this packet. |

## Limitations and exit boundary

- This was one exact frozen sequential pass. It is not a same-seed old/new
  causal comparison. The fresh seeds are not controls for older runs.
- TTK is post-first-damage body time; natural ecology may merge encounter
  episodes and creates pre-hit approach, pull, cast, and engagement delay.
  Missing clean seed medians, unfinished rows, HP-regain rows, and death rows
  remain visible and are not zeros.
- The 100ms movement stream supports direct stall/oscillation inspection. The
  swarm stream persists one-second samples; runner minimum HP and event windows
  therefore have finer timing than the retained sampled state.
- Attack beats are cooldown timestamp changes, not guaranteed hits. Minion
  attack beats and minion damage must be used for Conduit interpretation.
- No movement fix, balance overlay, source edit, retry, or winner selection was
  performed after launch. The concurrent shared-checkout heat/chill,
  killing-blow, and status presentation changes were not part of the frozen
  run.
- Qualification, pilots, and full-suite diagnostics are tooling evidence, not
  combat or release evidence. Known legacy failures are retained rather than
  edited around.
- The run is synthetic prepared-combat evidence only. It does not certify
  economy, acquisition, travel, client/UI presentation, browser play,
  human feel, live balance, complete-tier coverage, or death cleanup.

Return to the planner: hold production source unchanged; retain the current
swarm numbers as planning inputs; preserve the Volcanic pressure/censor tail,
Volcanic 05 Conduit technique-delivery signal, and Jungle Squire movement
failure on the watch list. Any balance edit, combined Jungle change, or
movement follow-up requires a new explicit packet.

## Planner review — wider engagement limitation found in raw artifacts

Movement/swarm manifest and index hashes were checked against the table above
and matched. The fixed experiment completed, but the next priority changes after
examining combat exposure beyond the four dedicated movement observations.

Across the144 swarm index rows, compute each window-ended run's terminal quiet
period as elapsedMs minus the maximum target lastDamageMs. There are29 runs
with at least30s of terminal quiet time, all in the72-run Volcano block:
16 Sweep and13 Slam. Their final samples show attack intent in28 cases; the
remaining Spirit Slam case shows hazard escape. None occur in Plains. The
quiet periods total3971.4s and range up to259.2s. This is a terminal-gap screen,
not a complete count of internal interruptions or29 proven instances of one bug.

Two concrete cases materially limit technique and survival interpretation:

- Volcanic03 Spirit Sweep/6151 last dealt damage at40.8s, killed9 enemies,
  and survived at full minimum HP. At299s it still selected an Ember Scuttler,
  with attack intent, null combat target and a movement path. Its259.2s quiet
  tail is not evidence of robust sustained combat.
- Volcanic05 Squire Slam/6151 last dealt damage at106.5s. It remained stationary
  for183 consecutive one-second sample intervals and ended with an Ember
  Scuttler selected, attack intent and no movement/combat target. The paired
  Sweep run dealt damage through297.2s. The24 versus67 kills cannot be assigned
  to Slam's combat power or charge cost without resolving this exposure gap.

Both original failing combinations improved: Swamp Striker/173 and Jungle
Squire/3911 continued combat. Jungle Squire/173's late stall remains as reported.
The planner's contact-only gate was too weak to establish sustained engagement;
the operator followed it correctly. Root causes of the additional Volcano cases
are not yet proven, including whether they predate or were exposed by the fix.

Plains gives the cleaner technique signal. Squire Slam killed238 versus222
enemies on03 and236 versus199 on05 over equal900s totals. Striker Sweep killed
229 versus195 on03 and222 versus202 on05. This supports the intended slow/fast
weapon distinction locally. Plains was low-pressure for these optimized builds;
its Bull still generally lasts only3–7s and is not a validated toughest-elite
duration target. No blanket swarm HP increase follows from these observations.
Spot-check correction: Plains05 Squire Slam/8089's raw clean Bull median is3.9s,
not3.8s as printed above; the three-seed outer median remains3.8s.

Recommended next step: reproduce Jungle Squire/173 plus representative Volcano
stationary and moving/no-damage cases, inspect target reach and hazard-pull
ownership/release, and qualify a small full-window movement regression packet.
Use100ms state including aggro/leash, selected and combat targets, cast state,
hazard ownership and actual outgoing damage. Retain the successful Swamp case
as a regression control. Flag long damage-free attack intent even after an
initial elite kill; resolve or explain it before interpreting sustained safety.
Then revisit affected technique pairs and continue remaining T2/T3 roster gaps,
including Forest. Hold balance numbers meanwhile; Tortoise/Salamander pressure
is worth tracking, but neither a Heat nerf nor a Conduit/Slam winner is established.

## Direct investigation — 2026-09-16

Four diagnostic replays on the exact frozen runtime reproduced the original
initial roster hashes, elapsed times, kill counts and last outgoing damage times.
They were repeated with finer observational logging; all four signatures remained
identical. These are deterministic reproductions, not eight independent trials.
No gameplay, build or balance changes were made for this investigation.

| Case | Seed | Kills | Last outgoing damage | Finding |
| --- | --- | --- | --- | --- |
| Jungle05 Squire | 173 | 13 | 87.9s | Retreat goal inside another bush; ranged standoff |
| Volcano03 Spirit Sweep | 6151 | 9 | 40.8s | Idle targets deep inside lava repeatedly selected |
| Volcano05 Squire Slam | 6151 | 24 | 106.5s | Reacquisition/leash oscillation |
| Swamp05 Striker control | 173 | 28 | 293.6s | Sustained engagement retained |

### Jungle: invalid retreat destination, not failure to acquire aggro

At91s the retained pull goal is (3171.5669,3548.9562), inside
`jungle_bush_5` (center2945,3739; radius452). It was chosen radially away from
`jungle_bush_2`, without validating the destination against all other hazards.
Hazard-avoiding navigation ends at (3312,3408), short of that goal. The player
stops there by93s, while the retained goal continues to be requested.

The Chameleon DOES have aggro from90.3s onward. At the final standoff its hitbox
gap is181.6px: inside its190px attack range, outside Squire's12px range. It does
not need to move farther, while Squire cannot complete its chosen retreat.
This corrects the earlier description of an unengaged enemy. Relevant source:
`autoTarget.ts` hazard pull destination and retained pull state; path completion
at a reachable endpoint is insufficient to establish arrival at the requested goal.

### Volcano03: unsafe engagement plans are treated as reachable targets

At290s Spirit selects an idle Ash Salamander at (885.6819,2140.1146), on a fixed
hold post with zero wander radius. It lies about209.6px from the center of a
678px-radius lava vent. Ordinary230px pull range cannot bridge that depth from
the safe perimeter. The sampled player remains outside, out of its own attack
range and without enemy aggro, and continues traveling around the vent.

Target selection tests ordinary physical reachability; approach movement uses
hazard avoidance. These disagree about whether the selected engagement can be
completed. A path ending at the vent rim does not make the target attackable.
This is an engagement feasibility problem, not evidence of safe sustained farming.
Lava contact is the full shape plus its contact band, not just an annulus.
Whether every quiet Volcano case has this cause remains unproven.

### Volcano05: a real leash oscillation beneath the stationary player

The100ms trace from290.0–290.9s alternates the selected Scuttler between
(911.6918,1718.6386) and (912.3315,1746.6049), straddling its620px spawn leash.
Its `lastAggroAt` advances every100ms, but post-tick state is repeatedly returning
with null aggro. Squire remains at (884.9551,1573.2845), outside melee reach.

Monster AI scans for proximity aggro whenever it has no target, including while
returning, then checks the leash and drops that target again. The retreat policy
and this re-engagement loop never produce melee contact. One-second samples
concealed the monster's oscillation. The current evidence proves the loop;
it does not establish that the hazard patch introduced the underlying leash rule.

### Recommended repair and qualification

Hold balance values. Repair movement before another Sweep/Slam comparison:

1. Validate pull destinations against all relevant hazards and physical geometry,
   and verify the actual reachable endpoint provides the intended standoff.
   An unreachable retained goal needs an alternate route/goal or explicit failure,
   rather than indefinite reissue. Preserve the earlier fixed-goal oscillation fix.
2. Make engagement feasibility agree with the equipped hazard-avoidance policy.
   After a bounded failed approach, release/defer an unreachable target and seek
   another valid one. If none exist, report a blocked engagement explicitly.
   Do not silently walk into damaging lava, certify an idle survivor, or alter
   spawn positions to hide this condition. Any later spawn-layout change is a
   separate decision.
3. Give leash return a coherent completion/re-engagement policy and ensure the
   player does not keep waiting on a target that is resetting. Preserve intended
   retaliation and boss behavior with focused tests; do not globally enlarge leashes.

First qualification: the same four300s cases, plus Jungle3911 and the paired
Volcano05 Squire Sweep6151 control. Require full-window progress or an accurately
reported blocked state, not merely first contact. Check100ms boundary traces,
damage-free intervals, actual destination arrival, aggro/leash state and hazard
ownership. Distinguish retargeting around unavailable enemies from solving those
encounters. Only after this passes, rerun affected Volcano Sweep/Slam pairs on
the existing three seeds. Do not repeat the completed broad roster yet.

Artifacts: `C:/Users/osaif/AppData/Local/mmo-idle/validation/hazard-investigation12/`
contains `baseline/` and `fine/` manifests and per-case JSON. Runtime remains
`7b37b3938937dcbb177bbd5b24ebfd762b941f6e`; tracked frozen source is unchanged.
Replay tool: `server/scripts/hazardApproachProbe.ts`, copied as an untracked
diagnostic into the frozen checkout. It uses the original hitbox artifact and
does not change game state beyond normal survey preparation and world ticks.
No new operator packet or full balance experiment has been launched. These
replays remain synthetic prepared-combat evidence, with no live/UI validation.
