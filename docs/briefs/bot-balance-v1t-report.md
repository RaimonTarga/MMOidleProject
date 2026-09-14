# V1t — Volcano dungeon and boss validation

Status: completed once under the supplied frozen packet. Two independent runs
executed sequentially on one worker with one ordinary boss attempt per run,
first-death stop, zero automatic retries, no adaptive retry, no operator edit,
no extra arm, and no automatic winner selection. No gameplay or balance values
were changed during execution.

Both replicas reached the Volcanic dungeon, cleared its complete 12-guardian
gate, and progressed into the active named Cinder-Shell Magma-Salamander
encounter. Both died during the boss step before a named boss kill, victorious
attempt, `volcanic:3` progression marker, or safe return. This is diagnostic
combat evidence from a restored synthetic checkpoint, not canonical combat or
economy evidence. V1s's sampled farming and recovered-return result is not
undone by this boss failure.

## Frozen packet and session ledger

| Field | Value |
|---|---|
| Operator setup start | 2026-09-14T15:53:19.5690610+02:00 |
| Packet ceiling | 60 real minutes including image setup |
| Launch gate | Launched before the packet's 16:03 local cutoff |
| Experiment ID | `20260914t135355z-spirit-volcano-boss-t3-v1t` |
| Manifest created | 2026-09-14T13:55:13.658Z |
| Supervisor start / terminal | 2026-09-14T13:55:46.350Z / 2026-09-14T14:08:38.362Z |
| Report generated | 2026-09-14T14:09:13.726Z |
| Release | Automatic at 2026-09-14T14:08:39.174Z; CLI returned `already-released` |
| Frozen revision | `d3fb1eb4767c305ac3b6875e96fc7c36aacb70f7` |
| Frozen source tree | `f8b0a581eb98e176d875aba89bd03a0ad4687469` |
| Image | `mmo-idle-experiment:d3fb1eb4767c-d90e6996`; `sha256:e3f56835634b66407e887947926242fe91adab987b77abda670523b16d6d5be8` |
| Build ID | `9bbe140a51f8acaedd08f49a` |
| Tooling / runtime hashes | `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1` / `f77975c67c8a759e0a1e3039f1d3ae4cbe88f42de3e691282d69202814fb700f` |
| Mode / rewards / worker | `smoke-isolated` / 1x / one sequential worker |
| Replicas | 2 independent intended cases |
| Max run duration | 1,200,000 ms |
| Retry policy | Fast boss retry false; automatic retries 0 |
| Free C: space before create | 11,025,371,136 bytes (about 10.27 GiB) |
| Worker check before create | No other experiment worker; existing development services preserved |

The frozen commit's parent delta was limited to
`server/scripts/v1tPreflight.ts` (7 lines: 4 insertions and 3 deletions) to
match the development server item registry. No gameplay values changed in that
revision delta. The image build and experiment creation completed successfully;
no full repository test-suite claim is made.

The invoking checkout was dirty before creation. The manifest recorded these
unrelated changes, which were excluded from the immutable image and preserved:

```text
 M docs/README.md
 M docs/briefs/bot-balance-v1g-report.md
?? docs/briefs/bot-balance-v1q-report.md
?? docs/briefs/bot-balance-v1r-report.md
?? docs/briefs/bot-balance-v1s-report.md
?? server/runs/human-playtests/human-2026-09-13T16-53-11-299Z-e1f16cb8/events.jsonl
?? server/runs/human-playtests/human-2026-09-13T16-53-11-299Z-e1f16cb8/summary.json
```

## Input, provenance, and restore validation

The packet's first chronological V1s pursuit prepared checkpoint was used for
both replicas. No returned checkpoint, later V1s replica, or post-farming state
was selected:

```text
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t122828z-spirit-volcano-control-t3-v1s/runs/002-spirit-volcano-pursuit-t3-v1s-intended-r01/artifacts/spirit-volcano-pursuit-t3-v1s-intended-2026-09-14T12-36-05-203Z-633b2496/checkpoint-v1s-pursuit-prepared.json
```

The live input and staged input both have SHA-256
`db973d37bd7371212665e03d06adbb7e977fb9fa964acbd347ee49aa0944ec79`.
The packet-supplied setup-only parity artifact was verified on disk and was not
rerun during the live launch:

```text
C:/Users/osaif/AppData/Local/mmo-idle/validation/v1t-preflight-server-parity-20260914.json
SHA-256: cbe6d80b26dfc2a26054cd54363fc1b4f61010e7e4fee7a043ca73107faf9e6e
```

The input boundary is `v1s-pursuit-prepared`, with source revision
`b0e6619141cc6fd5fef230219308e1b35250ec92`, persistent state hash
`b001138205903a9cfe785eeaa9d60dec5e593ba7267acf3c96aeb7ed3a2c704c`, and
definitions hash
`92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.

Both live restores passed the same checks:

| Run | Restore | Normalized | Current capture revision | Changed definition sections | Setup / restore |
|---|---|---:|---|---|---:|
| r01 | `success=true`, `safe-rested-v1` | yes | `d3fb1eb4767c305ac3b6875e96fc7c36aacb70f7` | `[]` | 61 / 80 ms |
| r02 | `success=true`, `safe-rested-v1` | yes | `d3fb1eb4767c305ac3b6875e96fc7c36aacb70f7` | `[]` | 53 / 75 ms |

The restore result captured the same definitions hash and persistent state hash
listed above. Both records say the paid preparation was inherited and “not
earned or timed in this run.” Both runs retained the inherited provenance:
`canonicalAtCapture=false`, inherited reward multiplier 25, and the following
taints:

```text
RESTORED_PROGRESSION_CHECKPOINT
SYNTHETIC_TIER_ENTRY
NON_CANONICAL_REWARD_MULTIPLIER
```

Execution reward multiplier was 1. The two fresh boss-ready boundaries were
captured at Sanctuary center with full 236/236 HP, 132/132 barrier, no incoming
DoT, and the same V1s-paid build:

| Run | Boss-ready capture | Boundary | Checkpoint SHA-256 |
|---|---|---|---|
| r01 | 2026-09-14T13:55:55.587Z | `v1t-boss-ready` | `db41f73b87b399f88a3e7ca111160725ec25fc16927162eb90020fee8434e7c6` |
| r02 | 2026-09-14T14:03:10.309Z | `v1t-boss-ready` | `688b2a07d485961fd36c80360516e3bd0984a0e67d88b6dac52478dacd111f13` |

## Prepared build and encounter definition

Both runs used Wisp/Far with GM78, level 158, player Tier 3, and the inherited
31-RP combat / 28-RP travel preparation:

```text
Ruinous Axe +5
Cave Vest +5
Mountain Charm +5
Desert Boots +5
Tempered Core
Defensive stance
Sweep, Hamstring, Second Wind, Brace
```

The prepared derived profile was attack 102, speed 285, maximum HP 236,
recovery 13, plating 18, 19% damage reduction, and attack range 222. The
retained combat rune order was:

```text
Always -> Auto-path Enemy
Inside Telegraph -> Step Back
In Combat -> Orbit
Always -> Avoid Hazards
Always -> Wait for Regen
```

Travel retained the V1s `Avoid Enemies` and `Fight Back` rules. No new equipment,
ability, skill, or purchase was granted by V1t.

The dungeon definition had three guardian groups, each with one Magma Tortoise
definition (`magma-brute`, named Ember Warden) plus three Ember Scuttlers:
12 guardians total. The guardian modifiers were attack x1.25, attack speed
x1.1, and DoT x1.25.

The boss definition was Cinder-Shell Magma-Salamander: raw authored 11,462 HP,
attack 179, plating 8, 4% DR, and a 3-second base attack interval. The authored
shell starts at 85% HP, lasts 3.8 seconds, repeats on a 16-second clock, and
reduces direct damage to 30%. Its authored magma vent lasts 8 seconds at radius
190; the below-25% Final Eruption is an 8-second radius-2000 hazard with raw
650 damage. These are definition values, not observed boss HP or phase tracks.

## Approach, guardians, altar, and boss gates

Times below are run-relative event milliseconds. The `boss-attempt` event starts
before guardian clearance and is not counted as boss reach by itself.

| Run | Approach start | Dungeon arrival | Attempt / boss-attempt start | Guardian start -> clear | Guard duration | Death | Route result |
|---|---:|---:|---:|---:|---:|---:|---|
| r01 | 4,087 ms | 212,784 ms (travel 208,697 ms) | 215,796 / 215,797 ms | 12 -> 0 at 338,375 ms | 122,578 ms | 415,056 ms | 9/18 steps; boss-phase first-death stop |
| r02 | 4,060 ms | 101,658 ms (travel 97,598 ms) | 104,668 / 104,669 ms | 12 -> 0 at 235,775 ms | 131,106 ms | 318,372 ms | 9/18 steps; boss-phase first-death stop |

Both guardian gates cleared all 12 expected guardians in one start/end pair.
No guardian reformation event, second guard phase, or extra guardian count was
observed. The route reached the altar area after guardian clearance in both
cases.

No separately typed altar-activation event is emitted in the retained event
schema. The executor used the ordinary altar path; it did not use a forced boss
spawn, debug heal, Heat reset, suppression, or manual movement. Since each run
then retained named boss combat/death records after its guardian clear, normal
altar activation and boss spawning are supported by the event sequence, but the
exact altar activation timestamp is unavailable.

The named boss reach is supported by more than `boss-attempt`: the death records
name Cinder-Shell Magma-Salamander as the boss killer, the summaries record
outgoing damage against that named boss, boss diagnostics contain active boss
samples, and the retained incoming events include the boss's Magma Vent. There
was no named boss kill, `boss-defeated` event, victorious attempt, or
`volcanic:3` marker in either run.

| Gate | r01 | r02 | Cohort |
|---|---:|---:|---:|
| Normal approach to dungeon | pass | pass | 2/2 |
| 12-guardian clear | pass | pass | 2/2 |
| Active named boss reached | pass | pass | 2/2 |
| Named boss kill | no | no | 0/2 |
| Victorious boss attempt | no | no | 0/2 |
| `volcanic:3` progression marker | no | no | 0/2 |
| Return to Sanctuary | no | no | 0/2 |
| Center/recovery/returned checkpoint | no | no | 0/2 |

## Boss combat and failure traces

No continuous boss HP field or final boss HP was emitted. The values below are
aggregate player damage addressed to the named boss target, not observed boss
remaining HP and not a claim that the boss was at a corresponding percentage.

| Run | Boss-target damage | Boss diagnostics | Range evidence | Add pressure | Barrier evidence |
|---|---:|---:|---|---|---|
| r01 | 8,579 | 199 samples | 135 samples; mean 148.69, max 247.20; hugging .31, in reach .64, out of reach .04 | mean 3.42, max 12 | mean fraction .80; recharging .12, depleted .13 |
| r02 | 9,375 | 213 samples | 149 samples; mean 152.32, max 265.29; hugging .30, in reach .66, out of reach .04 | mean 4.49, max 12 | mean fraction .82; recharging .11, depleted .11 |

The observed Magma Vent contacts were:

| Run | Contact start times | Contacts / total contact duration / damage |
|---|---|---:|
| r01 | +360.475 s, +380.287 s, +400.100 s | 3 / 1,804 ms / 27 |
| r02 | +257.699 s, +277.711 s, +297.521 s, +317.329 s | 4 / 2,605 ms / 36 |

The event stream contains no explicit shell activation, shell break, phase
transition, or Final Eruption event. Shell uptime/count, exact boss HP reached,
Final Eruption timing, and environmental Volcano Heat stacks/decay are
unavailable. The prepared checkpoint exposes the class resource field
`heatPct=0`; that is not an environmental Volcano Heat measurement. No cooling
or post-clear tail was entered.

The retained death records keep terminal cause, largest hit, and the runner's
`killingBlow` field separate:

| Run | Death | Terminal cause | Largest recorded hit | Retained `killingBlow` field | Death-window dominant source / max attackers |
|---|---:|---|---|---|---|
| r01 | +415.056 s | Melee Cinder-Shell Magma-Salamander, 176.567 | Boss direct 150.134 at +396.898 s; 52.866 absorbed; HP 178.102 -> 27.968 | Boss direct 39 at +410.503 s; 132 absorbed; HP 104.915 -> 65.915 | Boss 189.134 / 1 |
| r02 | +318.372 s | Melee Cinder-Shell Magma-Salamander, 550 | Boss direct 39 at +307.525 s; 132 absorbed; HP 108.278 -> 69.278 | Magma Vent DoT 9 at +317.329 s; HP 155.311 -> 146.311 | Boss 39 / 1 |

The r02 retained `killingBlow` field is not a lethal amount and is not
substituted for the terminal cause. No run had more than one concurrent attacker
in the retained boss death window.

## Runes, abilities, and movement evidence

Full-run activation counts were:

| Run | Sweep | Hamstring | Second Wind | Brace | Hazard escape attempts / successes | Step Back attempts / successes |
|---|---:|---:|---:|---:|---:|---:|
| r01 | 45 | 24 | 7 | 8 | 9 / 9 | 0 / 0 |
| r02 | 37 | 28 | 4 | 4 | 8 / 8 | 1 / 0 |

The recorded movement/range evidence shows the intended Auto-path Enemy,
Orbit, Avoid Hazards, and Wait for Regen behavior, with successful hazard
escape pairs in both cases. The single r02 Step Back attempt was not recorded
as successful; r01 has no Step Back activation. No manual movement was issued.
There is no per-hit ordinary-attack event kind and no per-hit Sweep or Hamstring
effect/duration record, so attack cadence, Sweep secondary hits, and slow uptime
are unavailable rather than inferred.

## Full-route combat aggregates

The following values are full-route summaries and must not be read as a boss-only
damage or boss-only incoming table. The Volcanic segment values are shown
separately where available.

| Run | Volcanic time / travel / fight | Volcanic kills | Volcanic outgoing damage | Full-route outgoing damage | Damage taken / absorbed / healed / HP lost | Target switches |
|---|---:|---:|---:|---:|---:|---:|
| r01 | 386.018 s / 184.008 s / 228.014 s | 23 | 38,996 | 39,091 | 1,365.37 / 1,761.63 / 2,902.63 / 1,263.96 | 10 |
| r02 | 289.027 s / 73.003 s / 203.015 s | 17 | 31,435 | 31,435 | 433.74 / 882.26 / 1,202.26 / 420.44 | 2 |

Full-route outgoing damage by target was:

| Run | Target totals |
|---|---|
| r01 | Ember Scuttler 14,948; Cinder-Shell Magma-Salamander 8,579; Ember Warden 7,027; Ash Salamander 3,721; Magma Tortoise 3,066; Cinder Hound 1,750 |
| r02 | Ember Scuttler 12,472; Cinder-Shell Magma-Salamander 9,375; Ember Warden 7,576; Magma Tortoise 2,012 |

Full-route incoming-source totals were:

| Run | Incoming source totals |
|---|---|
| r01 | Ash Salamander 671; Cinder-Shell Magma-Salamander 400.97; Cinder Hound 141; Ember Scuttler 81.4; Ember Warden 44; Cinder-Shell Magma-Salamander — Magma Vent 27 |
| r02 | Cinder-Shell Magma-Salamander 397.74; Cinder-Shell Magma-Salamander — Magma Vent 36; Ember Scuttler 0 |

## Progression, economy, and isolation classification

Both runs ended with player Tier 3, global mastery 78, unchanged biome levels,
and the inherited eight-boss prefix. Neither changed progression or recorded
`volcanic:3`.

No new purchase or gear mutation occurred. Both summaries have empty craft,
upgrade, evolution, stance-craft, and equip timelines; `essenceSpentByType={}`;
and `totalBlockedOnResourceMs=0`.

| Run | Non-canonical route gains | Starting -> final red essence | Catalyst change |
|---|---|---:|---|
| r01 | +525 red essence | 2,873 -> 3,398 | +3 Heavy |
| r02 | +393 red essence | 2,873 -> 3,266 | +1 Swarming |

These restored-checkpoint loot and catalyst outputs are not economy evidence.
Both summaries are `canonical=false`, `combatEvidenceEligible=false`,
`economyEvidenceEligible=false`, and `treatmentValidity=not-asserted`. Execution
remained isolated and single-worker: r01 maximum observed concurrency was 6
and r02 was 5; no other player, contested sample, shared admission, or overlap
was observed.

## Decision gates and handoff

The prepared build passed the approach and guardian gates in both independent
cases and reached the actual boss encounter in both. It did not pass the boss
clear or recovered-return gates in either case. The failure phase is therefore
the boss phase, not travel, guardian preparation, restore, build, or
infrastructure.

This is a low-HP boss-failure screen with incomplete boss-phase telemetry, not a
case for an automatic boss nerf or reward change. The next decision should be a
phase/strategy review of Cinder-Shell pressure, direct damage windows, vent
counterplay, and the lack of successful Step Back evidence before any authorized
repeat. No automatic balance decision is made here, and no additional run,
retry, Tundra run, T4 run, farming rerun, or operator fix was performed.

Stop here per the packet. All experiment artifacts, checkpoints, databases and
release evidence remain retained.

## Retained artifacts and hashes

Artifact root:

```text
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t135355z-spirit-volcano-boss-t3-v1t
```

The manifest receipt content equals the manifest SHA-256. The network release
record reports `status=released` for `mmoexp-abc0f6073239-network`.

| Artifact | SHA-256 |
|---|---|
| `experiment.json` | `cb4022648d424973a267a31d3a6032ed6a2dfe0a523be758f359a7a750022e52` |
| `experiment.sha256` file | `360806cf7e9235c87183c3654e181ca3b522a143ae483c34628ebcd254c30b0d` |
| Receipt content (manifest SHA) | `cb4022648d424973a267a31d3a6032ed6a2dfe0a523be758f359a7a750022e52` |
| `cohort-summary.json` | `8a33bce3d165d849e51419de908465997f0a7769f7b74e899bcf3ee757a3f10c` |
| `state.json` | `b2f840fff02c05fac043239772d088beaca9d84b88a6dc393f3480da96ff7b09` |
| `supervisor-events.jsonl` | `46eb7b3027104ae0dfa580e409ac1ce26817ed27b4891d64b0baa95d88fc868c` |
| `network-release.json` | `93b8776003d052f114de7eef58565fe6b5d96ad387094e0054e1046c3d517455` |
| `inputs/tier-entry/checkpoint-v1s-pursuit-prepared.json` | `db973d37bd7371212665e03d06adbb7e977fb9fa964acbd347ee49aa0944ec79` |
| Packet-supplied V1t preflight JSON | `cbe6d80b26dfc2a26054cd54363fc1b4f61010e7e4fee7a043ca73107faf9e6e` |

Per-run artifact directories:

```text
r01: runs/001-spirit-volcano-boss-t3-v1t-intended-r01/artifacts/spirit-volcano-boss-t3-v1t-intended-2026-09-14T13-55-54-516Z-1e6eda66
r02: runs/002-spirit-volcano-boss-t3-v1t-intended-r02/artifacts/spirit-volcano-boss-t3-v1t-intended-2026-09-14T14-03-09-264Z-0de3167f
```

Per-run retained evidence hashes:

| Run | `checkpoint-restore.json` | `checkpoint-v1t-boss-ready.json` | `events.jsonl` | `summary.json` | `deaths.jsonl` | `snapshot-index.json` |
|---|---|---|---|---|---|---|
| r01 | `1f3e0594950790e71c735d2581f08f13df814674fafbba0065023df98204c5c7` | `db41f73b87b399f88a3e7ca111160725ec25fc16927162eb90020fee8434e7c6` | `ab17ef78fc40cdaf62265392c685f0e61cf0b173128f93fcf567d8befc6587a5` | `3239be849deb1c49373adf4d1442fdab8315bdd43d3c52fd1d27d32e33057311` | `8932f15be1dc40ebdc96ce0b930938c2391511bf5708ae7b7a5a14d5f965f1d9` | `1b00b6e217a808333c548bafbbcd95bdf030c031708dae3e90a11d1e5a4d39bd` |
| r02 | `0cd8ee75d2f5390d617eec8b8699fcf7f1f7db61872387913d1feef1dfe96abd` | `688b2a07d485961fd36c80360516e3bd0984a0e67d88b6dac52478dacd111f13` | `55f2116fbf1e873a4c35abdf7e57696ec0c6b64c6e82968b8e4c00ca20bc474c` | `23979fd00ba70460ea2560475110920df4fba7469e83f25c4e3c036481772d96` | `743dee4a8466f5295876629f291fef0397fd65fa3111a4b1cf0500dd7784c47c` | `887525527870e1f8c3b4cff616de8d580822e8398e52ce11ef4d239627c6ffc2` |

No returned checkpoint or Snapshot B was captured because both runs stopped on
their first boss-phase death. Each run also retains its `run-config.json`,
`worker-result.json`, `bot.log`, and `server.log`; the experiment root retains
the immutable image metadata, supervisor lifecycle, release receipt, and
volumes. No global Docker prune or unrelated service cleanup was performed.
