# Durability 11 report — fresh-seed confirmation of adopted balance

Status: **complete frozen synthetic benchmark; no live balance change**. The
operator ran the fixed Durability 11 matrix once in packet order: 42
configurations and 126 observations. The runner, reporter, and verifier all
completed successfully with exit 0. There were no failed observations,
observation retries, restarts, adaptive changes, source edits, or automatic
winners.

This is confirmation/generalization evidence, not a same-seed old/new causal
comparison. It is diagnostic combat evidence only. It does not certify
economy, acquisition, travel, client presentation, human feel, browser play,
or live balance.

## Decision summary

- **Glacier Bear:** The adopted 3,750-HP / 148-attack / 0.08-shield arm
  produced six-baseline centers of 17.30s on Tundra 03 and 14.40s on Tundra
  05. One new six-baseline observation died: Tundra 03 Apprentice, seed 8089.
  No other baseline target death occurred. The Slinger DoT alternative
  remained a severe duration tail at 42.50s / 26.00s, with no fresh death in
  this run; it remains separate from the baseline and does not erase the
  retained historical alternative failures. Keep the adopted Bear values in
  planning review; do not infer an attack or shield causal effect from this
  fresh-only arm.
- **Plague-Shell Snapper:** The adopted 2,320-HP arm produced six-baseline
  centers of 12.03s and 12.93s on Swamp 03/05, with no player deaths. These
  durations remain below the packet's 25–35s toughest-body reference. Shell,
  pool, and Plague exposure was present, so the result does not justify
  automatically adding more HP or a DoT resistance.
- **Jungle:** Defensive T2 Squire and T3 Conduit remained useful as targeted
  diagnostic inputs. T2 Squire's Jungle Ape median was 16.80s on both nodes
  with no deaths. T3 defensive Conduit remained the slow tail at 30.95s / 27.10s,
  with high target censoring and HP-regain exclusions but no Conduit player
  death. Keep the targeted stance inputs and other classes' offensive stance;
  do not generalize to a global stance change without a paired causal packet.
- **Engagement boundary:** One T3 Jungle 05 Squire run, seed 3911, never
  acquired a Silverback target. It is retained as an engagement limitation,
  not a combat success and not a TTK of zero. The earlier Durability 10 Swamp
  movement issue remains a separate unclosed investigation.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability11-operator-packet.md](bot-balance-durability11-operator-packet.md) |
| Frozen revision | `9f58ee4641c36bd39ed67c1d76bc5712e0c0b7ba` |
| Frozen source tree | `094c79f8f1973e3e722e52c8e475ed216d1e6ecb` |
| Definitions SHA-256 | `75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267` |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitbox SHA-256 | `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83` |
| Detached checkout | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916/source` |
| Qualification root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability11` |
| Results root | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916` |
| Mode / timestep / window | `run` / 100ms / 300s per observation |
| Fresh seeds | `3911`, `6151`, `8089` |
| Synthetic / economy eligible | `true` / `false` |

The run used fresh 300-second Worlds, natural ecology, and stopped on the
first player death. It did not replay the earlier `173`, `947`, or `2027`
seeds. The operator ledger is retained at
[operator-ledger.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916/operator-ledger.json>).

| Matrix block | Planned | Executed | Observation outcomes |
|---|---:|---:|---|
| T3 Tundra | 16 cells / 48 runs | 16 / 48 | 47 windows, 1 player death |
| T3 Swamp | 12 cells / 36 runs | 12 / 36 | 36 windows, 0 deaths |
| T3 Jungle | 12 cells / 36 runs | 12 / 36 | 35 windows, 1 player death |
| T2 Jungle | 2 cells / 6 runs | 2 / 6 | 6 windows, 0 deaths |
| **Total** | **42 / 126** | **42 / 126** | **124 windows, 2 deaths, 0 failed** |

The operator ledger records `2026-09-16T10:14:13.1814349Z` through
`2026-09-16T10:23:40.8954768Z`: **9m27.7140419s wall time** for 10.5 hours
of simulated time. The results root contains 510 files totaling 209,908,913
bytes. No `failed.json` exists, and no wall-ceiling or RSS-ceiling outcome was
recorded.

### Artifact hashes

| Artifact | SHA-256 |
|---|---|
| [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916/results/manifest.json>) | `A0E5CD03B0CE40E7A90468D740419C555A4A7232096756F7D7F31C5F77289643` |
| [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916/results/index.json>) | `6351D9809C2DDC66A3F0F666FC952BEDD13B489D5D75A6E51E6885F472613A13` |
| [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916/results/complete.json>) | `B8850273C7017897C15F512CA71BE1A26833C6E6AF9821A32E7F707E8E3A918A` |
| [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916/results/analysis.json>) | `470EED05591B70EA4E96AB9102661939BC55BB3B65948CFA7C11B8BD084A7182` |
| [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916/results/analysis.md>) | `65C60D449BFCB0BEE0E063C76B94750B4C28A570846DDF3B769643DE78566EC0` |
| [verification.log](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916/results/verification.log>) | `D362E4FFD465FA7E18CA2D44C23EE46BD867D138925FAA0835BF4F0F58DC9F2C` |

The verifier output was:

```text
{"cells":42,"runs":126,"mode":"run"}
{"trial":"durability11","cells":42,"runs":126,"verified":true}
```

## Qualification and READY-state verification

The pre-existing qualification receipt reports all 42 configurations
qualified, three 30-second tooling pilots passed, and report generation
passed. Its qualification index SHA-256 is
`4fbccf258e410f462ff1d69ddf2f8db62b07761adfd46810c00ecd99e2986dc4`.
Qualification was not rerun during the frozen experiment.

The actual READY views matched each manifest stance in all 126 observations.
The seeded target values below are the initial roster values after node
modifiers; they are not a replacement for the packet's authored treatment
values.

| Packet arm | Authored treatment | READY target initial roster | Actual stance |
|---|---|---|---|
| Glacier Bear | HP `1500 → 3750`; attack `185 → 148`; shield `0.20 → 0.08`; 300 authored shield capacity preserved; cadence, duration, shatter, and vulnerability unchanged | Tundra 03 Bear: 4,313 HP / 192 attack; Tundra 05 Bear: 3,750 HP / 192 attack | Offensive for all Tundra builds |
| Plague-Shell Snapper | HP `1160 → 2320`; attack 37; plating, shell, pool, poison, and support unchanged; no DoT resistance | 2,320 HP / 37 attack on both Swamp nodes | Offensive for all Swamp builds |
| Silverback | HP 2,090; ramp cap 45%; no Jungle enemy change in this packet | Jungle 03: 2,404 HP / 108 attack; Jungle 05: 2,090 HP / 83 attack | Defensive Conduit; offensive other T3 classes |
| Jungle Ape | No HP or attack change | Jungle 03: 1,320 HP / 40 attack; Jungle 05: 1,200 HP / 33 attack | Defensive T2 Squire |

The differences between node values are the frozen node modifiers. The
READY audit also preserved the packet-declared builds, equipment, support
rosters, and geometry; no overlay or unexpected stance was observed.

## Metric definition and data accounting

For every named target, each seed's value is the median of eligible raw target
records. Eligibility required `clean=true`, a finite `ttkMs`, a `killedAtMs`
value, and `hpRegainObserved !== true`. The displayed outer value is the
median of the available three seed medians. Missing seed medians are shown as
an em dash and are never treated as zero. TTK is post-first-damage body time;
it excludes pre-hit charging.

The tables use seed order **3911 / 6151 / 8089 → outer median**, in seconds.
`clean / records` counts eligible versus all records for that named target;
`kills / unfinished / regained` counts the raw target states; `NC / D` counts
no-named-target runs and player-death runs for the cell. A target record may
be unfinished or HP-regained even when another target in the same 300-second
World was killed.

### T3 Tundra — Glacier Bear

The Slinger DoT and Conduit on-hit weapon alternatives are shown separately
and are excluded from the six-baseline centers.

| Node | Build / arm | Seed medians → outer | Accounting: clean / records; kills / unfinished / regained; NC / D |
|---|---|---:|---:|
| Tundra 03 | Striker baseline | 12.00 / 12.40 / 12.30 → **12.30** | 23/24; 23 / 1 / 0; 0 / 0 |
| Tundra 03 | Squire baseline | 21.10 / 19.50 / 19.30 → **19.50** | 14/16; 14 / 2 / 0; 0 / 0 |
| Tundra 03 | Apprentice baseline | 17.80 / 18.00 / 18.00 → **18.00** | 13/15; 13 / 2 / 0; 0 / 1 |
| Tundra 03 | Slinger baseline | 16.60 / 17.10 / 16.60 → **16.60** | 18/19; 18 / 1 / 0; 0 / 0 |
| Tundra 03 | Slinger DoT alternative | 42.95 / 42.00 / 42.50 → **42.50** | 7/9; 7 / 2 / 0; 0 / 0 |
| Tundra 03 | Conduit baseline | 19.60 / 19.40 / 19.50 → **19.50** | 10/11; 10 / 1 / 0; 0 / 0 |
| Tundra 03 | Conduit on-hit alternative | 22.10 / 22.20 / 22.20 → **22.20** | 10/13; 10 / 3 / 0; 0 / 0 |
| Tundra 03 | Spirit baseline | 14.70 / 14.35 / 15.10 → **14.70** | 18/19; 18 / 1 / 0; 0 / 0 |
| Tundra 05 | Striker baseline | 11.00 / 11.00 / 11.15 → **11.00** | 24/25; 24 / 1 / 0; 0 / 0 |
| Tundra 05 | Squire baseline | 15.90 / 17.05 / 16.60 → **16.60** | 19/20; 19 / 1 / 0; 0 / 0 |
| Tundra 05 | Apprentice baseline | 15.00 / 15.00 / 15.00 → **15.00** | 21/23; 22 / 1 / 1; 0 / 0 |
| Tundra 05 | Slinger baseline | 13.65 / 14.30 / 13.80 → **13.80** | 18/20; 18 / 2 / 0; 0 / 0 |
| Tundra 05 | Slinger DoT alternative | 26.00 / 26.00 / 26.70 → **26.00** | 12/13; 12 / 1 / 0; 0 / 0 |
| Tundra 05 | Conduit baseline | 17.00 / 17.10 / 17.00 → **17.00** | 13/13; 13 / 0 / 0; 0 / 0 |
| Tundra 05 | Conduit on-hit alternative | 16.85 / 16.90 / 16.80 → **16.85** | 17/19; 17 / 2 / 0; 0 / 0 |
| Tundra 05 | Spirit baseline | 12.60 / 12.10 / 12.30 → **12.30** | 24/24; 24 / 0 / 0; 0 / 0 |

#### Tundra six-baseline centers

Class order is **Striker / Squire / Apprentice / Slinger / Conduit / Spirit**.

| Node | Six baseline medians | Center | Range |
|---|---|---:|---:|
| Tundra 03 | 12.30 / 19.50 / 18.00 / 16.60 / 19.50 / 14.70 | **17.30** | 12.30–19.50 |
| Tundra 05 | 11.00 / 16.60 / 15.00 / 13.80 / 17.00 / 12.30 | **14.40** | 11.00–17.00 |

The baseline failure was the Tundra 03 Apprentice death at seed 8089. The
fresh Slinger DoT alternatives had no player deaths, but their 42.50s / 26.00s
outer medians and unfinished records keep them outside the baseline conclusion.

### T3 Swamp — Plague-Shell Snapper

All cells use the adopted 2,320-HP arm. There is no control or 1,740-HP arm in
this confirmation, so these rows describe the adopted arm rather than an
old/new HP effect.

| Node | Build | Seed medians → outer | Accounting: clean / records; kills / unfinished / regained; NC / D |
|---|---|---:|---:|
| Swamp 03 | Striker | 11.70 / 11.20 / 11.00 → **11.20** | 30/31; 30 / 1 / 0; 0 / 0 |
| Swamp 03 | Squire | 12.10 / 12.75 / 12.50 → **12.50** | 25/26; 25 / 1 / 0; 0 / 0 |
| Swamp 03 | Apprentice | 11.75 / 12.00 / 11.40 → **11.75** | 24/25; 24 / 1 / 0; 0 / 0 |
| Swamp 03 | Slinger | 12.20 / 12.80 / 12.30 → **12.30** | 29/30; 29 / 1 / 0; 0 / 0 |
| Swamp 03 | Conduit | 16.90 / 17.00 / 17.00 → **17.00** | 23/23; 23 / 0 / 0; 0 / 0 |
| Swamp 03 | Spirit | 10.30 / 9.95 / 10.35 → **10.30** | 39/40; 40 / 0 / 1; 0 / 0 |
| Swamp 05 | Striker | 12.50 / 13.15 / 12.30 → **12.50** | 24/26; 24 / 2 / 0; 0 / 0 |
| Swamp 05 | Squire | 14.85 / 14.75 / 15.30 → **14.85** | 20/20; 20 / 0 / 0; 0 / 0 |
| Swamp 05 | Apprentice | 12.50 / 12.70 / 12.20 → **12.50** | 23/26; 23 / 3 / 0; 0 / 0 |
| Swamp 05 | Slinger | 14.10 / 12.90 / 13.35 → **13.35** | 24/26; 24 / 2 / 0; 0 / 0 |
| Swamp 05 | Conduit | 19.50 / 20.30 / 19.65 → **19.65** | 17/19; 17 / 2 / 0; 0 / 0 |
| Swamp 05 | Spirit | 11.45 / 11.40 / 11.40 → **11.40** | 31/33; 31 / 2 / 0; 0 / 0 |

#### Swamp six-baseline centers

| Node | Six baseline medians | Center | Range |
|---|---|---:|---:|
| Swamp 03 | 11.20 / 12.50 / 11.75 / 12.30 / 17.00 / 10.30 | **12.03** | 10.30–17.00 |
| Swamp 05 | 12.50 / 14.85 / 12.50 / 13.35 / 19.65 / 11.40 | **12.93** | 11.40–19.65 |

The target-event audit across the 36 Swamp runs recorded 697,324 HP damage
typed `direct`, 67,432 typed `dot`, and 1,767 typed `aoe` against Snapper
targets. Direct damage included 601,859 from players and 95,465 from
minions; DoT and AoE in this target audit were player-sourced. This is a
damage-type accounting result, not a resistance inference.

Shell and pool mechanics were exposed in the fresh Worlds: 322 `Shell Up`
starts, 326 toxic-pool contact events, and 968 HP damage tagged
`shell-pool`. Plague telemetry recorded 422 stack gains and 248 stack updates.
The run therefore checked existing shell/pool/poison exposure while retaining
the adopted HP, with no new player death or low-HP wall. The known Durability
10 Swamp 05 Striker/seed 173 movement artifact remains separate; a successful
fresh Striker engagement does not prove that movement issue resolved.

### T3 Jungle — Silverback

T3 Jungle used offensive stance for every class except Conduit, which used
defensive stance. Silverback HP 2,090 and ramp cap 45% were retained.

| Node | Build | Seed medians → outer | Accounting: clean / records; kills / unfinished / regained; NC / D |
|---|---|---:|---:|
| Jungle 03 | Striker, offensive | 7.20 / 7.00 / 7.00 → **7.00** | 38/38; 38 / 0 / 0; 0 / 0 |
| Jungle 03 | Squire, offensive | 11.40 / 11.75 / 11.40 → **11.40** | 18/19; 18 / 1 / 0; 0 / 0 |
| Jungle 03 | Apprentice, offensive | 10.50 / 10.80 / 10.50 → **10.50** | 13/15; 13 / 2 / 0; 0 / 1 |
| Jungle 03 | Slinger, offensive | 11.00 / 10.75 / 9.50 → **10.75** | 32/34; 33 / 1 / 2; 0 / 0 |
| Jungle 03 | Conduit, defensive | 24.60 / 30.95 / 38.25 → **30.95** | 9/18; 10 / 8 / 8; 0 / 0 |
| Jungle 03 | Spirit, offensive | 7.60 / 7.60 / 7.10 → **7.60** | 18/18; 18 / 0 / 0; 0 / 0 |
| Jungle 05 | Striker, offensive | 5.85 / 5.85 / 5.70 → **5.85** | 31/31; 31 / 0 / 0; 0 / 0 |
| Jungle 05 | Squire, offensive | — / 9.60 / 9.60 → **9.60** | 12/12; 12 / 0 / 0; **1 / 0** |
| Jungle 05 | Apprentice, offensive | 9.00 / 9.00 / 10.60 → **9.00** | 27/28; 27 / 1 / 0; 0 / 0 |
| Jungle 05 | Slinger, offensive | 7.90 / 7.90 / 7.90 → **7.90** | 32/32; 32 / 0 / 0; 0 / 0 |
| Jungle 05 | Conduit, defensive | 28.00 / 27.10 / 26.65 → **27.10** | 15/20; 15 / 5 / 4; 0 / 0 |
| Jungle 05 | Spirit, offensive | 5.50 / 6.20 / 6.40 → **6.20** | 23/23; 23 / 0 / 0; 0 / 0 |

#### T3 Jungle six-baseline centers

Conduit is shown with its actual defensive stance in the table but remains in
the six-class descriptive center; the center is not a causal stance delta.

| Node | Six baseline medians | Center | Range |
|---|---|---:|---:|
| Jungle 03 | 7.00 / 11.40 / 10.50 / 10.75 / 30.95 / 7.60 | **10.63** | 7.00–30.95 |
| Jungle 05 | 5.85 / 9.60 / 9.00 / 7.90 / 27.10 / 6.20 | **8.45** | 5.85–27.10 |

The T3 Jungle 03 Apprentice death was the only Jungle death. Defensive
Conduit had no fresh player death, but Jungle 03 had only 9 clean target
records out of 18, with 8 unfinished and 8 HP-regain exclusions; Jungle 05
had 15 clean out of 20, with 5 unfinished and 4 HP-regain exclusions. That is
useful exposure evidence and a slow-tail warning, not a claim that stance
alone caused the difference.

The Jungle 05 Squire seed 3911 is the required no-contact row: it ran to the
300s window, killed three Jungle Stalkers, but produced no Silverback target
record. Its sampled player position remained fixed at approximately
`(3664, 3536)` with a null target and empty static-damage contacts. It is not
combat success; the preserved evidence is in
[summary.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916/results/dur11-node-t3-jungle-05-squire-s3911/summary.json>)
and [samples.jsonl](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916/results/dur11-node-t3-jungle-05-squire-s3911/samples.jsonl>).

### T2 Jungle — Jungle Ape

Only Squire was run, with defensive stance. There is no T2 six-class center.

| Node | Build | Seed medians → outer | Accounting: clean / records; kills / unfinished / regained; NC / D |
|---|---|---:|---:|
| Jungle 03 | Squire, defensive | 16.80 / 16.80 / 18.90 → **16.80** | 15/15; 15 / 0 / 0; 0 / 0 |
| Jungle 05 | Squire, defensive | 16.80 / 16.80 / 16.80 → **16.80** | 10/12; 10 / 2 / 0; 0 / 0 |

Both T2 defensive cells were death-free. This supports retaining the
targeted Squire stance as a planning input, not a change to player defaults.

## Survival, pressure, recovery, and attribution

### Aggregate pressure

`minHpFraction` is the runner's 100ms-tick minimum; one-second samples are
retained for inspection. Quantiles below are over the 126 observations.

| Runs | Windows | Player deaths | Named-target records | Eligible clean | Unfinished | HP-regained | Incoming HP damage | Player / minion / total attack beats |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 126 | 124 | 2 | 923 | 863 | 56 | 16 | 295,788.71 | 25,554 / 24,621 / 50,175 |

Minimum-HP quantiles were **p10 33.22%**, **p50 78.24%**, and **p90
94.06%**, with an overall minimum of 0% from the two deaths. Recovery
telemetry contained **1,906 completed** and **694 interrupted** windows; the
median completed recovery gap was 100ms. Attack beats are cooldown timestamp
changes, not guaranteed hits. Conduit player-only attack beats must not be
read as inactivity; its minion beats and target damage are the relevant
measures.

### Player deaths

The minimum sample is the lowest persisted one-second player HP before the
recorded death. Source totals are HP damage in the stated window around the
death; Bear/caster and Silverback/Stalker/Chameleon sources remain separate.

| Cell / seed | Death | Minimum persisted sample | Largest hit / max 1s | Incoming | Cause | ±10s sources | ±30s sources |
|---|---:|---|---:|---:|---|---|---|
| T3 Jungle 03 Apprentice / 6151 | 147.6s | 31.4 HP at 146s (7.99%) | 108.9 / 162.6 | 2,749.3 | Silverback melee | Silverback 761.0 | Silverback 871.3; Canopy Chameleon 131.0 |
| T3 Tundra 03 Apprentice / 8089 | 143.4s | 27.2 HP at 133s (6.04%) | 135.0 / 256.6 | 2,678.6 | Rime Caster ranged | Glacier Bear 283.6; Rime Caster 135.0 | Glacier Bear 966.1; Rime Caster 232.1 |

The two deaths are separate source patterns: one Silverback-led Jungle
pressure event and one Rime Caster/Bear Tundra event. No fresh baseline
Slinger DoT alternative death occurred.

### Surviving observations below 20% minimum HP

The runner's minimum is evaluated every 100ms, while the artifact persists
one-second samples. The timestamp below is the nearest logged incoming-damage
event that reaches the persisted runner minimum; the adjacent persisted sample
is shown so the reporting limitation is explicit. Source totals are centered
on that logged event.

| Cell / seed | Runner minimum / inferred center | Nearest persisted sample | ±10s sources | ±30s sources |
|---|---|---|---|---|
| T3 Jungle 03 Slinger / 6151 | 17.21% at about 25.9s | 72.5 HP at 26.0s | Silverback 755.0 | Silverback 1,337.0; Canopy Chameleon 49.0 |
| T3 Jungle 05 Apprentice / 8089 | 17.39% at about 95.8s | 75.0 HP at 96.0s | Silverback 761.6; Jungle Stalker 115.5; Canopy Chameleon 45.7 | Silverback 1,524.5; Jungle Stalker 292.9; Canopy Chameleon 68.4 |
| T3 Jungle 05 Slinger / 3911 | 15.10% at about 216.2s | 83.7 HP at 217.0s | Silverback 679.0; Jungle Stalker 110.0 | Silverback 1,075.0; Jungle Stalker 178.0; Canopy Chameleon 5.0 |
| T3 Tundra 05 Slinger DoT alternative / 6151 | 19.49% at about 54.2s | 84.3 HP at 55.0s | Rime Caster 441.8; Glacier Bear 240.0 | Rime Caster 739.5; Glacier Bear 419.6 |

The low-HP survivors are therefore pressure tails rather than a new global
death wall. The Tundra DoT alternative remains a poor alternative on duration
and pressure exposure even without a fresh death; it is not pooled into the
successful six-baseline result.

### Conduit minion and slot snapshots

The new runtime recorded five Conduit summon slots, minion HP, positions,
targets, and last-attack timestamps. Across the 24 Conduit observations (8
cells, 7,200 one-second samples), 29,145 of 36,000 sampled slots were active
(81.0%), 4,499 samples had at least one targeted minion (62.5%), and targeted
samples averaged 3.59 targeted minions. 2,860 samples showed a damaged
minion, and 131 sampled minion entries were at zero HP. These are sampled
states, not event-certified death or respawn counts.

For the two targeted defensive T3 Jungle Conduit cells specifically, 5,963 of
9,000 slots were active (66.3%); 1,194 of 1,800 samples had a non-null minion
target (66.3%), averaging 2.62 targeted minions when any were present; and
1,516 samples (84.2%) showed a damaged minion. The pair generated 5,213
minion attack beats. This supports real minion delivery/exposure while
explaining the Conduit censoring tail; it does not support treating player
attack beats alone as inactivity.

## Retain, watch, and revisit

| Adopted input | Retain from this confirmation | Watch / revisit boundary |
|---|---|---|
| Glacier Bear HP 3,750 / attack 148 / shield 0.08 | Retain as the fresh-seed planning candidate. Six-baseline centers are 17.30s / 14.40s, with only one new baseline death. | Revisit Tundra 03 Apprentice pressure and the separate Slinger DoT alternative. A causal attack/shield judgment requires an explicitly paired packet. |
| Plague-Shell Snapper HP 2,320 | Retain as the adopted upper-bound planning candidate. It exposed shell/pool/Plague mechanics, had no deaths, and remained below the 25–35s reference. | Do not automatically add more HP. Keep shell/pool exposure and the historical Swamp movement stall as separate local investigations. |
| T2 Jungle Squire defensive stance | Retain as a targeted planning input; both Ape centers were 16.80s with no deaths. | No global player-default stance change. |
| T3 Jungle Conduit defensive stance | Retain as a targeted planning input; no fresh Conduit death, but 30.95s / 27.10s and high censor/regain remain a delivery/exposure watch. | Use a paired offensive/defensive Conduit packet before attributing the tail to stance. Preserve the T3 Jungle 05 Squire no-contact run separately. |
| Silverback HP 2,090 / ramp cap 45% | Retain unchanged for this confirmation. | No automatic ramp or enemy-stat change from this fresh-only screen. |

The earlier Durability 10 Swamp 05 Striker/seed 173 stall remains at
[its preserved artifact](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10swamp/dur10-node-t3-swamp-05-striker-control-s173>)
and is not resolved by a different fresh seed. The Durability 10 report is
[here](bot-balance-durability10-report.md).

## Limitations and exit boundary

- This is a one-pass fresh-seed confirmation, not a same-seed old/new
  comparison. Historical results are context, not controls for these values.
- Body TTK is post-first-damage and can span several natural pulls; it is not
  an authored isolated-pack duration.
- Named-target records come from natural ecology. Missing targets, unfinished
  targets, HP-regain exclusions, player deaths, and no-contact runs remain
  visible and are not converted to zeros.
- One-second minion snapshots can miss brief slot loss, death, respawn, or
  target changes. The 100ms runner minimum is not accompanied by a 100ms
  state stream, so survivor source windows use the nearest logged damage event
  and persisted sample.
- The old Durability 10 Swamp movement issue is not a balance or combat
  conclusion. No movement fix or retry was bundled here.
- No economy/acquisition, travel, client, browser, human-play, live-balance,
  or global class-default conclusion is authorized. Qualification, pilots,
  reporter output, and verifier output are tooling evidence, not balance
  evidence.

Return to the planner: hold production source unchanged; retain the adopted
Bear and Snapper values and targeted Jungle stances as planning inputs; keep
the Bear Slinger DoT tail, T3 Jungle Conduit exposure, no-contact Squire run,
and historical Swamp movement stall on the watch list. Any live change,
combined Jungle arm, or movement fix requires a new explicit packet.
