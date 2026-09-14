# V1p — Volcano swarm preparation and natural Tundra counterplay

Status: completed once under the supplied frozen packet. Part A was a valid
four-arm authoritative combat diagnostic: all four fixed three-monster Volcano
fixtures ended in gameplay death before a kill, so no post-clear tail was
entered. Part B was one valid isolated live route: it completed the prescribed
300-second Tundra farm with 22 natural Tundra kills, then stopped on its first
death during return transit to Sanctuary. The live run had no harness or
infrastructure failure; its supervisor `failed` status is the terminal encoding
of the packet's declared first-death stop.

No source or gameplay-rule changes were made: Heat, rites, monsters, target
selection, movement, and balance remained unchanged. No unrelated database or
service state was altered. No gameplay retry, extra arm,
adaptive build, downstream run, or cleanup beyond the packet-authorized
experiment-network release occurred. The one earlier `bot:preflight` failure
was a process-environment setup failure before any manifest, worker, or
gameplay existed. It was corrected once with the existing local development
URLs and the exact-source preflight then passed; it is not a gameplay retry.

## Decision

The tested anti-swarm kits did not clear the fixed Hound-plus-two-Scuttler
fixture in this one seed. Armor, barrier, Bramble Guard, and the Plains charm
changed the observed damage and terminal timing, but the packet does not support
a causal ranking, a normal-population conclusion, or a balance adjustment.

The live Tundra route demonstrated 300 seconds of natural farming and actual
kills under the explicitly non-canonical 25x pipeline multiplier. It did not
complete the return: the first death occurred in Tundra node 04 while traveling
back to Sanctuary after the farm and build restoration. That is a transit/build
state failure classification, not a Tundra farming viability result. No live
lava or hazard conclusion is supported because the run exposed no authoritative
hazard-escape evidence.

## Session ledger

| Field | Value |
|---|---|
| Recorded setup start | 2026-09-14T09:36:52.6180608Z |
| Packet ceiling | 120 minutes from recorded setup start |
| Packet deadline | 2026-09-14T11:36:52.6180608Z |
| Part B worker start | 2026-09-14T09:51:26.849Z |
| Part B worker terminal | 2026-09-14T10:00:55.831Z |
| Supervisor release event | 2026-09-14T10:00:59.240Z |
| Frozen execution revision | `7340037d6811ab2d956725b022dacdf0ba752429` |
| Frozen source tree | `c889112d0b50c1385565eaa6cc3be3baa6dfc449` |
| Validation checkout | `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1p-diagnostics-20260914` |
| Diagnostic runner | `server/scripts/v1pDiagnostics.ts` |
| Live route | `spirit-tundra-counterplay-t3-v1p` |
| Retained input | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json` |
| Input SHA-256 | `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144` |
| Node / pnpm | `v22.16.0` / `8.15.1` |
| Docker | `29.5.2` client/server |
| Lockfile SHA-256 | `513852d0b792b5e33920c64a704c6290f66c618cf67d9179fb8bb0eb8b22db10` |
| Dependency install | `pnpm install --frozen-lockfile`; exit 0; 19.6 seconds |
| Diagnostic TypeScript check | exit 0 |
| Main checkout at setup | `develop...origin/develop [ahead 11]`; pre-existing `M docs/briefs/bot-balance-v1g-report.md` and untracked human-playtest run preserved |

The isolated checkout was created fresh and detached at the exact frozen
revision. The required atlas input was copied into that checkout only to satisfy
the packet's content hash gate. Its only status entry was
`M client/public/assets/sprites.json`; the working-tree blob and frozen HEAD
blob were both `f3e81839d6b13806e1c549c53b9c31dbe10697b8`, and `git diff` was
empty. No source content was changed. The main worktree's pre-existing changes
were preserved.

## Frozen source, input, and runtime integrity

The retained V1m Snapshot B was used unchanged. It preserves the earned Wisp,
GM78, mastery, wallet, and provenance state. No V1n end state, diagnostic
fixture, or newly granted economy state was substituted.

| Input or runtime item | SHA-256 |
|---|---|
| Retained Snapshot B | `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144` |
| Main `client/public/assets/sprites.png` | `6ed9a1b7f7124cc2489d42239a73ed5f4a9382b3eeb51ce9be93a53722b72c22` |
| Main `client/public/assets/sprites.json` | `8611f8498a03b0dbd8b7366937ef670686b2bf911c0c6e4310d0ba9aae7c1156` |
| Isolated `client/public/assets/sprites.png` | `6ed9a1b7f7124cc2489d42239a73ed5f4a9382b3eeb51ce9be93a53722b72c22` |
| Isolated `client/public/assets/sprites.json` | `8611f8498a03b0dbd8b7366937ef670686b2bf911c0c6e4310d0ba9aae7c1156` |
| Required generated hitboxes | `7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf` |
| Frozen diagnostic runner | `788964e46c716bbc4f32500c50ae9dcdd953c6c2a1ba1e7ca11b17c28504dc46` |
| Frozen `scripts/bot-preflight.mjs` | `b112c930a46d908157f640f309aba5fd3b90c2d36c5110edd7ce2b84c125f719` |
| Frozen `pnpm-lock.yaml` | `513852d0b792b5e33920c64a704c6290f66c618cf67d9179fb8bb0eb8b22db10` |

The source HEAD and tree were rechecked after both parts:

```text
HEAD  7340037d6811ab2d956725b022dacdf0ba752429
tree  c889112d0b50c1385565eaa6cc3be3baa6dfc449
status M client/public/assets/sprites.json
git diff -- client/public/assets/sprites.json: empty
```

## Setup-only preflight

The fresh diagnostic directory was
`C:/Users/osaif/AppData/Local/mmo-idle/validation/v1p-preflight-operator-20260914`.
With `NODE_ENV=production`, the exact frozen diagnostic typecheck exited 0:

```text
pnpm --filter @mmo-idle/server exec tsc --noEmit -p tsconfig.diagnostics.json
```

The packet-authorized Part A preflight also exited 0:

```text
pnpm --filter @mmo-idle/server exec tsx --conditions=development scripts/v1pDiagnostics.ts --preflight "<retained Snapshot B>" "C:/Users/osaif/AppData/Local/mmo-idle/validation/v1p-preflight-operator-20260914"
```

Its stdout was:

```text
volcano-control: setup validated; no ticks
volcano-armor: setup validated; no ticks
volcano-armor-bramble: setup validated; no ticks
volcano-armor-bramble-charm: setup validated; no ticks
```

`complete.json` records `{"mode":"--preflight","cases":4}`. All four case
files and `tundra-purchase-preflight.json` are present. The preflight manifest
verified seed 173, 100 ms ticks, the 60,000 ms fight cap, 30,000 ms post-clear
cap, unchanged anti-kiting and Heat, reward 1x, canonical=false, the retained
input, the atlas and hitbox hashes, and the synthetic diagnostic fixture.

The RP correction was preserved in the artifacts: after travel-only rules are
removed, the four diagnostic kits cost 27 RP; the live travel build costs 28 RP;
the live Hamstring combat build costs 31 RP. The purchase preflight verified
ordinary Hamstring learning, Desert Boots craft and +1 through +5 upgrades,
both live build configurations, zero combat ticks, full diagnostic HP 236/236,
and barrier 132/132. Its post-purchase wallet was green 5,272, yellow 13,280,
and Dominion catalyst 17, with mastery 78.

### Part B harness preflight and operator checks

The first fresh exact-source `pnpm bot:preflight` attempt stopped before any
manifest or worker because the child process did not have the local process
environment it needed: the log database module reported missing
`LOG_DATABASE_URL`, followed by a child `tsx` resolution failure. No Docker
experiment network, database, worker, or gameplay was created by that attempt.

The existing local development endpoints were then supplied process-locally for
one corrected exact-source preflight (`DATABASE_URL`, `LOG_DATABASE_URL`,
`REDIS_URL`, and `AUTH_DEV_BYPASS`; `NODE_ENV=development`). The corrected run
exited 0 and reported:

```text
botBuildPreflight: ok
actual earned T3 checkpoint static/authoritative spawn qualification: PASS
humanPlaytestRecorder: ok
attunement: ok
harness/loadout/choices/experience/profiles/validate: ok
t1Routes/t2Routes/campaignReadiness/campaignBehavior/campaignBoss/campaignT2Boss/t1Snapshots: ok
release: ok (terminal gating, ownership, live worker refusal, retained volumes, idempotence)
experiment.test.mjs: ok
experience studies, timelines, pairing and calibration: ok
Bot preflight: PASS
```

This was process setup only. It did not modify the repository, databases,
containers, manifest state, or gameplay state. No full repository test suite is
claimed by this packet.

The read-only capacity and worker checks passed:

| Check | Result |
|---|---|
| C: free space | 15,834,247,168 bytes (14.75 GB) |
| Docker | server 29.5.2; 12 CPUs; 16,730,128,384 bytes memory |
| Existing services | `mmo-admin-dev`, `mmo-client-dev`, `mmo-server-dev`, `mmo-logdb`, `mmo-gamedb`, `mmo-redis` running; Postgres services healthy |
| Existing experiment worker before Part B | none |

The packet-authorized empty bridge capacity probe was created and removed once:

| Field | Value |
|---|---|
| Bridge name | `mmo-exp-v1p-capacity-20260914-0949-7f3a` |
| Bridge ID | `bd475f7888ee1950ee9ff0d108dddaf6a431ae818e79148fbe839e18bba179e3` |
| Inspect before removal | bridge; internal=false; containers=0; exit 0 |
| Removal | exact ID; exit 0 |
| Inspect after removal | exit 1; absent as required |

No unrelated service was stopped or pruned.

## Part A — Volcano diagnostic

### Authorized fixture

The single sequential execution used seed 173 and 100 ms samples. Each arm
used a fixed Cinder Hound plus two Ember Scuttlers, Alacrity, full authored Heat,
the unchanged anti-kite behavior, real node terrain, normal spawn projection,
and simultaneous ordinary aggro. The player began 220 px left of node center;
the monsters used the center and +60 px vertical placement from the packet.
There was no lava, natural recruitment, repopulation, chain-pulling, or new
population. Wisp, Ruinous Axe, Tempered Core, Plains Boots, and the retained
entry state were fixed; all authored gear was +5.

| Arm | Armor | Charm | Guards | Starting HP / barrier / plating / DR |
|---|---|---|---|---:|
| `volcano-control` | Cave Vest +5 | Mountain Charm +5 | Second Wind + Brace | 236 / 132 / 18 / 19% |
| `volcano-armor` | Plains Enduring Robe (`plains-vest-t2`) +5 | Mountain Charm +5 | Second Wind + Brace | 222 / 124 / 29 / 2% |
| `volcano-armor-bramble` | Plains Enduring Robe (`plains-vest-t2`) +5 | Mountain Charm +5 | Second Wind + Bramble Guard | 222 / 124 / 29 / 2% |
| `volcano-armor-bramble-charm` | Plains Enduring Robe (`plains-vest-t2`) +5 | Plains Stalwart Heart (`plains-charm-t2`) +5 | Second Wind + Bramble Guard | 222 / 67 / 29 / 2% |

All arms started with attack 102, recovery 13, speed 187, and an 801 ms attack
cooldown. Sweep, Orbit, Step Back, Avoid Hazards, and Recover First were
retained as required; travel-only rules were removed identically. Bramble's
ordinary three-aggro trigger was used in the two Bramble arms. The diagnostic
grants were limited to the runner's setup; progression was reported but no
normal economy was created.

### Execution gate and result

The exact packet execution command exited 0:

```text
pnpm --filter @mmo-idle/server exec tsx --conditions=development scripts/v1pDiagnostics.ts --execute "<retained Snapshot B>" "C:/Users/osaif/AppData/Local/mmo-idle/validation/v1p-execution-operator-20260914"
```

Stdout was:

```text
volcano-control: 9500ms complete
volcano-armor: 9500ms complete
volcano-armor-bramble: 9500ms complete
volcano-armor-bramble-charm: 8300ms complete
```

The execution directory contains four complete case journals, the copied
preflight purchase artifact, `complete.json` with `{"mode":"--execute","cases":4}`,
and the required hitbox and manifest files. All four case outcomes are
gameplay `death`; `firstClearMs` is null in every case.

| Arm | First / last incoming | Stop and cause | Peak simultaneous attackers |
|---|---:|---|---:|
| `volcano-control` | 2.8 s / 9.5 s | Death at 9.5 s; Cinder Hound melee 59 | 2 |
| `volcano-armor` | 2.8 s / 9.5 s | Death at 9.5 s; Cinder Hound melee 59 | 2 |
| `volcano-armor-bramble` | 2.8 s / 9.5 s | Death at 9.5 s; Cinder Hound melee 59 | 2 |
| `volcano-armor-bramble-charm` | 2.8 s / 8.3 s | Death at 8.3 s; Cinder Hound melee 56 | 2 |

The damage and sustain journal fields are kept separate. The gross field sum
below is a diagnostic mitigation-stage field, not final delivered damage; it
is not combined with unrelated mitigation fields.

| Arm | Incoming events / gross diagnostic field sum | Actual HP damage | Barrier absorbed | Explicit HP healing | Source HP damage: Scuttler / Hound | Outgoing events / HP |
|---|---:|---:|---:|---:|---:|---:|
| `volcano-control` | 12 / 810 | 319 | 132 | 70 across 35 events | 94 / 225 | 13 / 1,679 |
| `volcano-armor` | 12 / 810 | 303 | 124 | 70 across 35 events | 78 / 225 | 13 / 1,679 |
| `volcano-armor-bramble` | 12 / 810 | 326 | 124 | 70 across 35 events | 86 / 240 | 14 / 1,689 |
| `volcano-armor-bramble-charm` | 10 / 675 | 294 | 67 | 46 across 23 events | 75 / 219 | 15 / 1,052 |

Absorption occurred in 4 events for control and armor, 5 for armor-Bramble,
and 3 for armor-Bramble-charm. Every arm ended at HP 0 and barrier 0. Direct
outgoing damage was 1,480 in the first three arms and 823 in the Plains-charm
arm. Sweep contributed the same two observed area hits in every arm: Ember
Scuttler `m2` for 92 at 0.1 s and Cinder Hound `m1` for 107 at 7.3 s, 199 total.
Bramble added 10 in the armor-Bramble arm and 30 in the
armor-Bramble-charm arm. There was no summon or other proc damage.

The ability and Heat journals were:

| Arm | Ability activations | Bramble observations | Heat trajectory |
|---|---|---|---|
| `volcano-control` | Sweep 0.1 s; Second Wind 6.0 s; Sweep 6.1 s; Brace 6.1 s | none | 1 at 0.2 s, 2 at 3.2 s, 3 at 6.2 s, 4 at 9.2 s; peak 4 |
| `volcano-armor` | Sweep 0.1 s; Second Wind 6.0 s; Sweep 6.1 s; Brace 6.1 s | none | 1 at 0.2 s, 2 at 3.2 s, 3 at 6.2 s, 4 at 9.2 s; peak 4 |
| `volcano-armor-bramble` | Sweep 0.1 s; Bramble Guard 0.1 s; Second Wind 6.0 s; Sweep 6.1 s | +8 plating and 10 thorns at 0.1 s; expired at 5.1 s; one 10-damage proc at 4.7 s | 1 at 0.2 s, 2 at 3.2 s, 3 at 6.2 s, 4 at 9.2 s; peak 4 |
| `volcano-armor-bramble-charm` | Sweep 0.1 s; Bramble Guard 0.1 s; Second Wind 6.0 s; Sweep 6.1 s | +8 plating and 10 thorns at 0.1 s; expired at 5.1 s; 10-damage procs at 3.3, 4.2, and 4.7 s | 1 at 0.2 s, 2 at 3.2 s, 3 at 6.2 s; peak 3 |

### Targeting, Heat tail, and diagnostic limits

The shared early target sequence was `m1` at 0.1 s, `m2` at 2.4 s, `m3` at
2.9 s, `m1` at 3.1 s, `m3` at 3.4 s, and `m2` at 3.5 s, followed by `m1`/`m2`
churn until terminal death. No outgoing hit targeted `m3`; the only Sweep
secondary-target events were `m2` at 0.1 s and `m1` at 7.3 s. This is retained
as a fixed-seed observation, not evidence that the target selector always
behaves this way.

No arm cleared. Therefore the packet-authorized same-world 30-second tail was
not entered for any arm: there is no post-clear last-contact timestamp,
out-of-combat recovery interval, zero-Heat timestamp, Heat-decay trajectory,
or fully recovered post-clear state to report. `OUT_OF_COMBAT` at the terminal
death sample is not a post-clear recovery window. No natural recruitment or
repopulation occurred, and the diagnostic fixture contains no live lava
evidence.

## Part B — Natural Tundra counterplay route

### Sealed manifest and lifecycle

Part B began only after Part A completed without a setup, hash, or infrastructure
failure. Exactly one fresh manifest was created from the frozen committed
revision:

```text
pnpm experiment:create --revision=7340037d6811ab2d956725b022dacdf0ba752429 --routes=spirit-tundra-counterplay-t3-v1p --tierEntrySnapshot="<retained Snapshot B>" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=1800000
```

| Manifest field | Sealed value |
|---|---|
| Experiment ID | `20260914t094921z-spirit-tundra-counterplay-t3-v` |
| Route / policy | `spirit-tundra-counterplay-t3-v1p` / `intended` |
| Mode | `smoke-isolated`; `full-gauntlet`; clean entry economy |
| Requested revision / source tree | `7340037d6811ab2d956725b022dacdf0ba752429` / `c889112d0b50c1385565eaa6cc3be3baa6dfc449` |
| Workers / count | 1 / 1 |
| Automatic retries | 0 |
| Fast boss retry | false |
| Reward multiplier | 25x; non-canonical pipeline test |
| Max run | 1,800,000 ms |
| Input SHA-256 | `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144` |
| Image tag / image ID | `mmo-idle-experiment:7340037d6811-165579c7` / `sha256:162df6c31f7766e46aee7cc43edb2c1d837bc1d07276c1362bfd25b7407968a4` |
| Build ID | `45dd5560a3a9fb6078d0c22c` |
| Tooling hash | `165579c768f29ab31349f21df5699d4b72fab80158a6f735643e60b078237d1f` |
| Runtime hash | `eb51708fcfeebcd2cc7ce1cce2d5e0edcd5b5d4017cacfd5c49086a1bd1200e6` |
| Dirty source handling | invocation dirty only at `M client/public/assets/sprites.json`; `dirtyWorkingTreeIncluded=false`; atlas input was excluded from the immutable image because its Git content was unchanged |
| Published host ports | false |

The manifest `experiment.json` SHA-256 is
`5f08d5875e0501f591c1d6308d89c000c5ac14bb921d34182cbe53e57bc908b0`.
`experiment.sha256` declares that same manifest digest; the SHA-256 of the
checksum file itself is
`a0a6170fa6621ec713ec9017bc96994c0b9b675b768030db2bcc33fdada3cec9`.

The lifecycle was packet-complete:

| Operation | Evidence |
|---|---|
| Create | One sealed manifest; no extra case or worker |
| Launch | exit 0; supervisor PID 28484 |
| Status | one worker running, container `49ec94bb77272106f592644237e6901cb9fd67a4bf75f720a8c0961ded762556` |
| Terminal | one run, 550,858 ms; bot completion `aborted`; reason `declared first-death stop` |
| Report | exit 0; cohort summary generated; memory 168.5 MiB, CPU 32.8%, event-loop p99 24.7 ms |
| Release | supervisor auto-released; explicit release command returned `already-released` |

The exact terminal experiment network was
`mmoexp-d86ac800561e-network`, ID
`58e2985afdfaf515bb622317a4ced86b7e3a4614b4204253f8293f910a74fa3d`.
Post-release inspection failed as expected because the network was absent.
The two experiment-only database containers exited and were retained; no
volumes were deleted. The six unrelated development services remained up.

### Purchases and build receipts

The route began from the retained Snapshot B with the travel build. The initial
wallet was green 5,342, yellow 13,712, and Dominion catalyst 18; mastery was
78. The route learned Hamstring for 70 green essence, then crafted Desert Boots
and applied +1 through +5. The recorder contains authoritative craft, upgrade,
equip, wallet, treatment-assertion, and build-change evidence.

| Operation | Recorded result |
|---|---|
| Travel build preflight | 28 RP: Sweep; Second Wind + Brace; Defensive; AutoPath, Step Back, Orbit, Avoid Hazards, Wait for Regen, and travel Avoid Enemies/Fight Back |
| Hamstring | learned at 604–1,106 ms; green changed 5,342 to 5,272 by the pre-craft snapshot |
| Desert Boots craft | `desert-boots-t2`, success; yellow spend 58 |
| Desert Boots upgrades | +1 15 yellow; +2 37; +3 60; +4 97; +5 165 plus 1 Dominion catalyst; all success |
| Desert Boots equip and assertions | equipped at 5,119 ms; +5 and equipped assertions passed |
| Post-purchase wallet | green 5,272; yellow 13,280; Dominion catalyst 17 |
| Tundra combat build | Sweep + Hamstring; Second Wind + Brace; Defensive; five combat rules; authoritative 31 RP |
| Transit restoration | Hamstring removed and the 28 RP travel build restored before return |

The ordinary spend was 70 green essence, 432 yellow essence, and one Dominion
catalyst. There were no wallet grants and no prep farming or mastery grants in
the live route.

### Route windows and natural population

| Window | Elapsed route interval | Result |
|---|---:|---|
| Initial setup and purchases | 0.6–8.1 s | Authoritative travel and combat builds qualified |
| Tundra outbound | 11,142–131,730 ms; 120,588 ms | Resolved Tundra entry reached; first target node entered at 131,608 ms |
| Arrival/build | 131,730–134,740 ms | Tundra combat build active; `v1p:tundra:arrived` milestone |
| Prescribed farm | 134,740–435,949 ms; 301,209 ms | Farm-complete milestone; 22 natural Tundra kills; no death in farm window |
| Travel-build restoration | 435,949–438,955 ms | Travel build restored |
| Return | 438,955–550,857 ms | First death in Tundra node 04; return step did not complete |
| Required Sanctuary tail | Not entered | No recovered 20-second tail after return |

The actual path entered these relevant nodes and modifiers:

| Node | Modifier | Entry time | Observed kills |
|---|---|---:|---|
| `node-t3-tundra-01` | heavy | 131,608 ms | Frost Lurker 9; Glacier Bear 4; Rime Caster 6 |
| `node-t3-tundra-02` | swarming | 460,658 ms | Frost Lurker 1; Rime Caster 1 |
| `node-t3-tundra-03` | dominion | 501,665 ms | Frost Lurker 1 |
| `node-t3-tundra-04` | fortified | 535,668 ms | none before death |

The approach also passed Swamp 06 fortified, Tundra 05 heavy, Cave 06
Dominion, Mountain 04 fortified, and Mountain 03 Dominion. The incidental
Mountain combat produced Crag Mortar 2 and Mountain Colossus 1, for 3
non-Tundra kills. Total live kills were 25.

Tundra kill totals were:

| Species | Kills |
|---|---:|
| Frost Lurker | 11 |
| Rime Caster | 7 |
| Glacier Bear | 4 |
| **Tundra total** | **22** |

The route's Tundra biome summary records 437,060 ms in the biome, 130,013 ms
travel, 261,038 ms fight, 22 kills, 1,755.3 damage taken, 27,675 damage dealt,
7,560 mastery gained, 17,494 blue essence gained, average concurrency 0.6,
and maximum concurrency 2. The Mountain summary records 4 damage taken,
4,206 blue essence gained, and 3,399 player damage dealt across its incidental
combat.

### Live combat, recovery, and telemetry limits

Across the full route the recorder reports 25 kills, 1,759.3 direct damage
taken, 2,379.7 absorbed, 3,947.7 total healed, 1,684.01 HP lost, and 31,074
player damage dealt. Summon damage was 0. The 550 concurrency samples split
into 264 unengaged, 283 solo, 3 with two attackers, and 0 with three or more;
maximum observed attacker concurrency was 2.

The experience sample modes account for all 550 samples:

| Mode | Samples |
|---|---:|
| farm / combat | 210 |
| farm / idle | 91 |
| travel / combat | 73 |
| travel / travel | 160 |
| idle / combat | 3 |
| idle / idle | 12 |
| idle / unavailable | 1 |

Sampled HP fraction reached 1.0 after the farm's lower-HP interval; the farm
samples' minimum was 0.327316 and the travel samples' minimum was 0.166596.
`totalBlockedOnResourceMs` was 0. The recorder does not expose a separate
continuous recovery-downtime field or a distinct duration at full HP, so those
values are reported as unavailable rather than inferred from the sample count.

The observed mechanic counts were Sweep 54, Hamstring 39, Second Wind 9, and
Brace 8. The summary contains `persistentHazards={}`, zero hazard-escape
attempts, and zero Step Back activations, but the natural bot telemetry does not
provide enough movement/ambient evidence to conclude that hazards were absent
or escaped. Target-switch summary is 0 and there are no independent
target-switch events. Boss diagnostics, summons, and live lava evidence are
also absent. No live lava or hazard-balance conclusion follows.

### First-death evidence and classification

The single death occurred at 550,857 ms, after the farm-complete milestone and
after travel-build restoration:

| Field | Value |
|---|---|
| Cause | Rime Caster ranged hit |
| Amount | 123.1 at `node-t3-tundra-04`, modifier fortified |
| Route state | step 20, `travel node-t3-sanctuary`; return step unfinished |
| Killing-blow detail | 546,772 ms; direct 111; absorption 0; HP 148.1476 to 37.1476 |
| Death-window dominant source | Rime Caster, 201 damage; maximum concurrent attackers 1 |
| Final build | Ruinous Axe +5, Cave Vest +5, Mountain Charm +5, Desert Boots +5, Tempered Core; Sweep; Second Wind + Brace; Defensive |
| Final derived defensive stats | max HP 236; plating 18; damage reduction 19% |

This is classified as a valid gameplay first-death stop during transit/build
state, not an infrastructure failure and not a Tundra-farm failure. The route
completed 20 of 22 steps; the required 20-second recovered Sanctuary tail was
not reached. No alternate node, boss, retry, or downstream run was attempted.

### Progression and economy boundary

The live route reached these recorded milestones: combat-build-qualified, ready,
arrived, and farm-complete. It ended at player tier 3, global mastery 90,
Mountain level 18, Tundra level 6, with the eight inherited bosses unchanged.
Mastery was 78 at start, 84 at arrival, and 90 at farm-complete.

| Resource | Start | End | Recorded boundary |
|---|---:|---:|---|
| Red essence | 2,873 | 2,873 | no change |
| Blue essence | 1,020 | 22,720 | 21,700 route gain: Tundra 17,494 plus Mountain 4,206 |
| Green essence | 5,342 | 5,272 | 70 spent learning Hamstring |
| Yellow essence | 13,712 | 13,280 | 432 spent on craft/upgrades |
| Purple essence | 1,522 | 1,522 | no change |
| Dominion catalyst | 18 | 51 | 34 route gains less 1 upgrade spend |

Other modifier gains were Tundra heavy 221, swarming 19, and Dominion 9, plus
Mountain fortified 36 and Dominion 25. These are reward-25 route outputs. The
run is tainted `SYNTHETIC_TIER_ENTRY` and
`NON_CANONICAL_REWARD_MULTIPLIER`; its durable summary marks
`treatmentValidity=valid`, `isolationGrade=isolated`,
`soloBaselineEligible=false`, `concurrencyCohortEligible=false`,
`combatEvidenceEligible=false`, and `economyEvidenceEligible=false`.
The resource and catalyst totals therefore demonstrate candidate pipeline
activity only, not ordinary economy rates or progression balance.

## Interpretation and handoff

Part A is a single-seed screen against a deliberately fixed three-body swarm.
None of the four tested kits produced a kill. The armor and Bramble variants
changed actual HP damage, barrier absorption, thorns, and terminal timing, while
the Plains charm reduced starting barrier and ended earliest. Those are
observations for review, not a winner ranking or an automatic nerf signal.

Part B is a single isolated natural route with non-canonical reward scaling. It
survived the full 300-second Tundra farm window and recorded 22 natural Tundra
kills, but died while returning after the farm. That return death must remain
separate from the farm result. The run provides no clean economy evidence, no
hazard/lava evidence, and no canonical checkpoint.

No Heat edit, Swift Repose change, rite change, monster change, movement-engine
change, target-selection change, or balance proposal is approved by this
packet. The correct handoff is for Luna to state the exact next operation; stop
here.

## Retained artifacts and hashes

All paths below are retained on disk. Hashes are SHA-256. The diagnostic
preflight and execution artifacts are deliberately kept separate.

### Part A preflight

Root: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1p-preflight-operator-20260914`

| Artifact | SHA-256 |
|---|---|
| `complete.json` | `4939db4712357653cd9fec89c55a8deea76886d783f6cd38291ae69b372e7043` |
| `hitboxes.json` | `7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf` |
| `manifest.json` | `58303471caa6df836af3f4ed09920787d75cf74cacddf146b16ee5eb868f1307` |
| `tundra-purchase-preflight.json` | `fd9eeaaf6b3a6dac58b0697fa885a718db8f95573cd4f2f82a503c926957ffeb` |
| `volcano-control.json` | `5c828ed2e9b19d1e9b1d4ba7dee625425fd30510c61324cd0d74954d91865d8a` |
| `volcano-armor.json` | `b1f3f83ee2388ee331e322b58e710c6ac4bbc87601253b36c56589a24ce5e15c` |
| `volcano-armor-bramble.json` | `b2b4aca4e04059b7091418ef266b47e2c6aa617edaf9f7263b4bd4ee2b0a51c6` |
| `volcano-armor-bramble-charm.json` | `5d0b2a8dbff48c07c11509a6139b0738b2fcff5514478bd8245c052660ae39ec` |

### Part A execution

Root: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1p-execution-operator-20260914`

| Artifact | SHA-256 |
|---|---|
| `complete.json` | `04e0886720a5365375ba505af40924e7c2964357f19322860e495e358c7d0084` |
| `hitboxes.json` | `7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf` |
| `manifest.json` | `cdd2d274eaaff7c10941501d567789e226cf830066d2377234c19f566dc9c91d` |
| `tundra-purchase-preflight.json` | `fd9eeaaf6b3a6dac58b0697fa885a718db8f95573cd4f2f82a503c926957ffeb` |
| `volcano-control.json` | `b55473b1865ebfff6a0fe4b37e0aacd2f9a2380501916d927444a24234e9bfe9` |
| `volcano-armor.json` | `dc2b940b3f3a3098e25f5133658754d8dd02c6ba0c732401e82bea4f8749f2f2` |
| `volcano-armor-bramble.json` | `934217192c6f3c0815f24fdada0988c9e7058548bf38b6bb77a9ad586a8d0554` |
| `volcano-armor-bramble-charm.json` | `a4ec7a7ae7776ad491a9769e56480bea2bee731661e2b5c922e44e92b5e8d3bd` |

### Part B experiment

Experiment root:
`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t094921z-spirit-tundra-counterplay-t3-v`

| Artifact | SHA-256 |
|---|---|
| `experiment.json` | `5f08d5875e0501f591c1d6308d89c000c5ac14bb921d34182cbe53e57bc908b0` |
| `experiment.sha256` | `a0a6170fa6621ec713ec9017bc96994c0b9b675b768030db2bcc33fdada3cec9` |
| `inputs/tier-entry/snapshot-b.json` | `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144` |
| `cohort-summary.json` | `58784e01cb94a41b8202addb4486c669a9c5a40615e783ea3e78c07161707ae5` |
| `network-release.json` | `ead858d07c38bafbe8f9875b98f8fcda6583ce302d60b3e2eb363caa34471358` |
| `supervisor-events.jsonl` | `c2c4c9a83782c5c237469ed437ff89eadbfa621df155853e9061baa1db2084ad` |
| `state.json` | `86f981c1ca80a51f01aeaeb1df779edd92d528815811246b9a3a5a3cda0bced6` |

Run root:
`runs/001-spirit-tundra-counterplay-t3-v1p-intended-r01`

| Artifact | SHA-256 |
|---|---|
| `run-config.json` | `373cf1a6ae185f4fdfab8d508edbd46a73968ae9b4c2dce3fa4938accb9dfaf6` |
| `worker-result.json` | `bfeb11378982ad8aff313cf80f68e62b3c4b9dfeb58f2155d2eb8086c6da91f6` |
| `worker-heartbeat.json` | `6baec8968aefdbbeaa8406def4a4fe2cc5a82587e1e08754c969695367455a15` |
| `resource-samples.jsonl` | `d0931e1ef20baf61ada857d67beb60cd2d773df8a9360a0b8ca5f3ecdd889545` |
| `server.log` | `c652fdb7123f0d2ba2f747c9f316324597a4d13b8018e97e9f1432676f0ee7e6` |
| `bot.log` | `31830b227eee66097e10ed4c27a3647d7e9bda3a321a9981dc72130703ff47f3` |

Artifact run:
`runs/001-spirit-tundra-counterplay-t3-v1p-intended-r01/artifacts/spirit-tundra-counterplay-t3-v1p-intended-2026-09-14T09-51-34-080Z-82a5f88b`

| Artifact | SHA-256 |
|---|---|
| `summary.json` | `393b6199e532db8ce9592bddff754020615926304933173d3f45988ccd399216` |
| `events.jsonl` | `4120a555d53732ee2086986ab7ec80e4f6e1c83f9153f261cc02277506b81720` |
| `deaths.jsonl` | `bee5c66a35280a9b124d0fb11ae2c992e8f1ddadc858df99893d1c50f2b19c16` |
| `snapshot-index.json` | `4c5ba7b1236fc6f8959d13138480003b9755ccc813bc7a4947c75aa713db7c2d` |

The live report marked the cohort failed only because the run's first-death
stop is represented as a failed route. The run summary is explicit that the
completion was aborted, treatment validity was valid, isolation was isolated,
and both canonical economy and combat eligibility were false. All logs,
journals, resource samples, purchase receipts, progression milestones, and
network release evidence remain retained for review.
