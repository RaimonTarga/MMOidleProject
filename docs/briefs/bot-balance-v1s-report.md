# V1s — Repeated five-minute Volcano farming and recovered returns

Status: completed once under the supplied frozen packet. Six fresh sequential
runs executed on one worker with zero retry, resume, adaptive edit, balance
change, extra arm, or automatic winner selection. All six replicas reached the
exact target node `node-t3-volcanic-01`. The control arm died during target
farming in all three replicas. The pursuit arm completed the fixed five-minute
target window and returned to Sanctuary for recovery in all three replicas.

This is a natural-population replication screen, not a causal ranking. The
worlds were fresh and not matched seeds, and pursuit is a combined Hamstring
plus Desert Boots +5 package. The observed route-level difference is useful for
the next decision, but it does not authorize a balance edit. No Hound, Scuttler,
Heat, Tundra, or T4 adjustment was authored or proposed here.

## Frozen packet and session ledger

| Field | Value |
|---|---|
| Operator setup start | 2026-09-14T14:27:43.9531438+02:00 |
| Packet ceiling | 120 real minutes including image setup |
| Packet deadline | 2026-09-14T16:27:43.9531438+02:00 |
| Experiment ID | `20260914t122828z-spirit-volcano-control-t3-v1s` |
| Manifest created | 2026-09-14T12:29:52.136Z |
| Supervisor start / terminal | 2026-09-14T12:30:36.876Z / 2026-09-14T13:07:32.088Z |
| Report generated | 2026-09-14T13:07:42.008Z |
| Release | Automatic at 2026-09-14T13:07:32.941Z; CLI returned `already-released` |
| Frozen revision | `b0e6619141cc6fd5fef230219308e1b35250ec92` |
| Frozen source tree | `8a25b84d2eb55cff0fe23272d51c7d1bdf9ac406` |
| Image | `mmo-idle-experiment:b0e6619141cc-d90e6996`; `sha256:fbe4c247cf8bead51da635c827cd32748ca358ea1b11385131cb3f2e178e9c1a` |
| Build ID | `7ccbc3b85e25a24987431eab` |
| Mode / rewards / worker | `smoke-isolated` / 1x / one sequential worker |
| Replicas | 3 control + 3 pursuit |
| Max run duration | 900,000 ms |
| Retry policy | Fast boss retry false; automatic retries 0 |
| Free C: space before create | 7,428,587,520 bytes (about 6.92 GB) |
| Worker check before create | No other experiment worker; existing development services preserved |

The frozen commit adds only the V1s route definitions and registry entries:
`bot/src/routes/campaignT3V1s.ts` and `bot/src/routes/index.ts`. The image
passed the shared build, server build, and bot TypeScript checks. No full
repository test-suite claim is made.

The invoking checkout was dirty before creation. These unrelated changes were
preserved and excluded from the immutable image:

```text
 M docs/README.md
 M docs/briefs/bot-balance-v1g-report.md
?? docs/briefs/bot-balance-v1q-report.md
?? server/runs/human-playtests/human-2026-09-13T16-53-11-299Z-e1f16cb8/events.jsonl
?? server/runs/human-playtests/human-2026-09-13T16-53-11-299Z-e1f16cb8/summary.json
```

## Input, provenance, and restore validation

The exact packet input was used for every replica:

```text
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t112129z-checkpoint-pre-volcano-capture/runs/001-checkpoint-pre-volcano-capture-intended-r01/artifacts/checkpoint-pre-volcano-capture-intended-2026-09-14T11-23-17-505Z-78b380cf/checkpoint-pre-volcano-rested.json
```

Its SHA-256 is
`015a40785122af6b2a684827e344f0d2465d1b4462d6866801fbc4d9dad5cf55`.
The staged copy inside the experiment has the same hash. The checkpoint's
source revision is
`e4ee4cb9b5ad800320fd61b30975c5a06c2dafc4`; its persistent-state hash is
`d200fe6ebc012dd2dbef909350917c6370a43dd75e224865d8223cfb31bd4552`.

The checkpoint is an inherited V1m descendant captured with
`canonicalAtCapture=false` and inherited reward multiplier 25. Every live run
retained these taints:

```text
RESTORED_PROGRESSION_CHECKPOINT
SYNTHETIC_TIER_ENTRY
NON_CANONICAL_REWARD_MULTIPLIER
```

Execution reward multiplier was 1. All six restores reported
`success=true`, `normalized=true`, `restorePolicy=safe-rested-v1`, current
revision `b0e6619141cc6fd5fef230219308e1b35250ec92`, definitions hash
`92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`,
`changedDefinitionSections=[]`, and the same inherited state hash. Each
prepared boundary began at `node-t3-sanctuary` with 236/236 HP and 132/132
barrier. Normalization was applied at Sanctuary only, never on Volcano arrival.

## Treatments and prepared builds

Both arms retained Wisp/Far, Ruinous Axe +5, Cave Vest +5, Mountain Charm +5,
Tempered Core, Defensive stance, Sweep, Second Wind, and Brace. Neither arm
used Focus. The common combat runes were:

```text
Always -> Auto-path Enemy
Inside Telegraph -> Step Back
In Combat -> Orbit
Always -> Avoid Hazards
Always -> Wait for Regen
```

Travel also retained `While Traveling -> Avoid Enemies` and
`While Traveling -> Fight Back`.

| Arm | Combat RP / travel RP | Mobility | Declared treatment | Prepared combat profile |
|---|---:|---|---|---|
| Control | 27 / 28 | Plains Boots +5 | None; no purchase | Attack 102, speed 187, max HP 236, recovery 13, plating 18, 19% DR, range 222 |
| Pursuit | 31 / 28 | Desert Boots +5 | Learn Hamstring; craft, upgrade, and equip Desert Boots +5 | Same combat stats; speed 285; Sweep + Hamstring + Second Wind + Brace |

The pursuit treatment was paid independently in every replica: Desert Boots t2
craft for 58 yellow essence; upgrades +1/+2/+3/+4/+5 for 15/37/60/97/165
yellow essence, with the final upgrade also costing 1 Dominion; and 70 green
essence for the Hamstring package. The net preparation debit before approach
was 70 green, 432 yellow, and 1 Dominion per pursuit run. Control made no
purchase or preparation debit.

Prepared and returned checkpoint hashes are listed in the retained-artifact
section below. Pursuit captured a returned checkpoint in all three replicas;
control did not reach return after its first death.

## Route milestones and gate outcomes

Times are run-relative event milliseconds. For survivors, the fixed target
window is exactly 300,000 ms after `measurement-start`; the later
`measurement-end` event includes about 1.2 seconds of boundary overhead. For
controls, exposure ends at the first death. No boundary-overhead kill is
counted.

| Run | Approach start -> target arrival | Measurement start -> end/death | Target exposure | Return / recovery | Route and terminal result |
|---|---:|---:|---:|---|---|
| Control r01 | 7,087 -> 109,179 | 112,190 -> death 302,008 | 189.818 s | Not reached | 10/18 steps; first-death stop in target farm |
| Pursuit r01 | 11,608 -> 92,194 | 95,206 -> measurement-end 396,415 | 300.000 s | Return 399,425; Sanctuary 485,994; center 498,501; recovered 509,506; returned checkpoint 510,171 | 25/25 steps; completed |
| Control r02 | 7,068 -> 108,657 | 111,668 -> death 120,700 | 9.032 s | Not reached | 10/18 steps; first-death stop in target farm |
| Pursuit r02 | 11,595 -> 78,634 | 81,643 -> measurement-end 382,881 | 300.000 s | Return 385,892; Sanctuary 522,992; center 533,998; recovered 545,007; returned checkpoint 545,658 | 25/25 steps; completed |
| Control r03 | 7,061 -> 109,154 | 112,162 -> death 143,122 | 30.960 s | Not reached | 10/18 steps; first-death stop in target farm |
| Pursuit r03 | 11,567 -> 78,623 | 81,632 -> measurement-end 382,885 | 300.000 s | Return 385,895; Sanctuary 456,944; center 469,452; recovered 480,464; returned checkpoint 481,116 | 25/25 steps; completed |

All three pursuit returned-checkpoint assertions passed with full HP and no
incoming DoT. The control deaths were gameplay deaths rather than hazard or
travel blockers.

Aggregate gates:

| Arm | Reached exact target | Survived full 5m | Returned/recovered | First-death stop |
|---|---:|---:|---:|---:|
| Control | 3/3 | 0/3 | 0/3 | 3/3 |
| Pursuit | 3/3 | 3/3 | 3/3 | 0/3 |

## Fixed target-window kill bins

The bins below are relative to each run's `measurement-start`. `AS` = Ash
Salamander, `CH` = Cinder Hound, `ES` = Ember Scuttler, and `MT` = Magma
Tortoise. A dash means no exposure in that bin. A parenthesized duration marks
a partial final bin caused by first death.

| Run | 0–60 s | 60–120 s | 120–180 s | 180–240 s | 240–300 s | Target kills |
|---|---|---|---|---|---|---:|
| Control r01 | AS 1, CH 1, ES 2 | ES 6 | CH 1, ES 5, MT 1 | ES 2 (9.818 s) | — | 19 |
| Pursuit r01 | AS 1, CH 1, ES 4 | AS 1, ES 7 | ES 7 | ES 4, MT 1 | ES 6, MT 1 | 33 |
| Control r02 | none (9.032 s) | — | — | — | — | 0 |
| Pursuit r02 | CH 1, ES 7 | AS 1, CH 1, ES 5, MT 1 | AS 1, ES 4 | AS 1, CH 1, ES 4 | AS 1, CH 1, ES 7 | 36 |
| Control r03 | AS 1, ES 1 (30.960 s) | — | — | — | — | 2 |
| Pursuit r03 | AS 1, ES 6 | AS 1, CH 1, ES 7 | AS 1, ES 6 | AS 1, ES 1, MT 2 | CH 1, ES 2, MT 1 | 31 |

| Run | First kill | Longest no-kill interval | Target samples | Population range / max attackers | Other players | Target switches |
|---|---|---:|---:|---:|---:|---:|
| Control r01 | Ash Salamander at +13.121 s | 21.007 s | 89 | 34–41 / 6 | 0 | 18 |
| Pursuit r01 | Ash Salamander at +11.509 s | 17.622 s | 138 | 35–41 / 6 | 0 | 16 |
| Control r02 | None | 9.032 s | 5 | 36–36 / 5 | 0 | 4 |
| Pursuit r02 | Ember Scuttler at +8.795 s | 18.214 s | 144 | 34–41 / 6 | 0 | 21 |
| Control r03 | Ash Salamander at +10.171 s | 14.411 s | 15 | 37–39 / 6 | 0 | 0 |
| Pursuit r03 | Ember Scuttler at +13.866 s | 27.423 s | 140 | 35–40 / 5 | 0 | 25 |

## HP, barrier, concurrency, and ability telemetry

The retained target-node `concurrency-sample` events provide player
`hpFraction`, natural population, and engaged attackers. The target-window HP
sample trajectory was:

| Run | HP fraction samples (n) | Min | Mean | Max |
|---|---:|---:|---:|---:|
| Control r01 | 89 | 0.0721 | 0.8779 | 1.0000 |
| Pursuit r01 | 138 | 0.3796 | 0.9687 | 1.0000 |
| Control r02 | 5 | 0.0199 | 0.6757 | 1.0000 |
| Pursuit r02 | 144 | 0.2682 | 0.9146 | 1.0000 |
| Control r03 | 15 | 0.4341 | 0.7922 | 1.0000 |
| Pursuit r03 | 140 | 0.2439 | 0.9287 | 1.0000 |

There is no continuous barrier series in the retained event schema. Prepared
boundaries began at 132/132 barrier, and each successful returned boundary was
full HP with no incoming DoT. Control terminal state is represented by the
retained death trace rather than a post-death barrier snapshot.

Target-window ability activations were:

| Run | Sweep | Hamstring | Second Wind | Brace |
|---|---:|---:|---:|---:|
| Control r01 | 24 | 0 | 6 | 6 |
| Pursuit r01 | 42 | 39 | 1 | 1 |
| Control r02 | 2 | 0 | 1 | 1 |
| Pursuit r02 | 43 | 40 | 4 | 4 |
| Control r03 | 4 | 0 | 2 | 2 |
| Pursuit r03 | 40 | 36 | 5 | 5 |

All target windows had zero other players and no contested population sample.
The runs used natural population, recruitment, lava, repopulation, and
recovery behavior; they were not fixed-roster or matched-seed experiments.

The stream has no ordinary-attack event kind and no per-hit Sweep or Hamstring
effect/duration record. This report therefore uses retained activation counts
and aggregate damage only. It does not infer ordinary attack cadence, Sweep
secondary hits, or slow uptime. `heatPct=0` is visible at prepared and
returned boundaries, but no in-combat Heat stack/decay series or post-clear
cooling tail was emitted. A death reset is not cooling evidence.

## Death and lethal-source traces

Only the control arm produced death records. The phase and trace fields are
kept separate because the dominant incoming source is not necessarily the
recorded terminal cause or killing blow.

| Run | Death | Terminal cause | Dominant incoming source | Largest recorded hit | Killing blow | Max attackers |
|---|---:|---|---|---|---|---:|
| Control r01 | +302.008 s, target farm | Ranged Ash Salamander 93 | Ash Salamander 237 | Ash Salamander 93 at +295.789 s, 5 attackers | Ash Salamander 93 at +300.390 s | 5 |
| Control r02 | +120.700 s, target farm | Melee Cinder Hound 56 | Ember Scuttler 186 | Cinder Hound 52 at +117.015 s, 5 attackers | Ember Scuttler 14 at +120.218 s | 5 |
| Control r03 | +143.122 s, target farm | Ranged Ash Salamander 93 | Ash Salamander 219 | Ash Salamander 88 at +139.742 s, 6 attackers | Ash Salamander 51 at +141.545 s | 6 |

No pursuit death trace exists because all three pursuit replicas completed the
target window and recovered safely.

## Full-route combat summaries

Full-route counts include natural combat after the target window, including
return-path combat for survivors. They must not be substituted for the fixed
target-window bins.

| Run | Full-route kills by species | Player damage dealt | Damage taken / absorbed / healed / HP lost | Target switches |
|---|---|---:|---:|---:|
| Control r01 | ES 15, CH 2, AS 1, MT 1 | 20,411 | 1,183.44 / 1,395.57 / 2,314.56 / 985.93 | 18 |
| Pursuit r01 | ES 30, MT 2, CH 2, AS 2, Mire Hexer 3 | 42,364 | 543.60 / 1,555.40 / 2,080.40 / 502.80 | 18 |
| Control r02 | None | 2,007 | 298.00 / 132.00 / 202.00 / 231.30 | 4 |
| Pursuit r02 | ES 35, CH 4, AS 4, MT 1, Bog Lurker 2, Mire Hexer 1, Plague-Shell Snapper 1 | 50,608 | 812.87 / 2,147.13 / 2,853.13 / 754.82 | 27 |
| Control r03 | ES 1, AS 1 | 3,350 | 412.00 / 264.00 / 513.00 / 336.79 | 0 |
| Pursuit r03 | ES 22, AS 5, MT 3, CH 2 | 40,371 | 1,215.43 / 2,027.57 / 3,192.57 / 1,073.46 | 25 |

Full-route incoming-source totals:

| Run | Incoming source totals |
|---|---|
| Control r01 | Ash Salamander 430; Ember Scuttler 440; Cinder Hound 275.07; Magma Tortoise 38.37 |
| Pursuit r01 | Ash Salamander 263; Cinder Hound 205.8; Magma Tortoise 42; Ember Scuttler 32.8; Mire Hexer 0 |
| Control r02 | Ember Scuttler 186; Cinder Hound 112 |
| Pursuit r02 | Ash Salamander 631.87; Ember Scuttler 88; Cinder Hound 67; Bog Lurker 26; Unknown 0; Mire Hexer 0 |
| Control r03 | Ash Salamander 412; Ember Scuttler 0 |
| Pursuit r03 | Ash Salamander 1,049.57; Cinder Hound 136; Ember Scuttler 22.87; Environment 7 |

The target-switch events retain entity IDs but do not label each switch with a
species. Their counts are therefore descriptive event counts, not an inferred
target-commitment score.

## Progression, economy, and isolation classification

All six runs retained player Tier 3, global mastery 78, unchanged biome levels,
and the inherited eight-boss prefix. The following wallet changes are
non-canonical outputs from the restored synthetic checkpoint and are not
economy evidence.

| Run | Essence gains | Catalyst gains / debits | Treatment debits |
|---|---|---|---|
| Control r01 | +412 red | +6 Alacrity | None |
| Pursuit r01 | +778 red, +79 purple | +12 Alacrity, +1 Heavy, -1 Dominion | -70 green, -432 yellow, -1 Dominion |
| Control r02 | None | None | None |
| Pursuit r02 | +910 red, +177 purple | +12 Alacrity, +1 Swarming, +3 Fortified, -1 Dominion | -70 green, -432 yellow, -1 Dominion |
| Control r03 | +42 red | +1 Alacrity | None |
| Pursuit r03 | +728 red | +11 Alacrity, -1 Dominion | -70 green, -432 yellow, -1 Dominion |

Every run was isolated and single-worker. No other player was observed, no
contested samples occurred, and no shared-admission or overlap record exists.
Pursuit summaries can be marked concurrency-cohort eligible by the harness,
but combat and economy evidence remain ineligible because of the inherited
checkpoint taints and synthetic reward ancestry.

## Decision gates and handoff

The repeated route screen met the target-farming and recovered-return gates for
pursuit at 3/3. Control met target arrival at 3/3 but met neither full-window
survival nor recovered return. The three control deaths occurred at different
partial exposures (9.032 s, 30.960 s, and 189.818 s), so they are gameplay
pressure observations rather than an infrastructure failure or a declared
stall condition.

Across these fresh natural worlds, pursuit produced the stronger operational
screen. That observation is confounded by the combined Hamstring and Desert
Boots package, differing populations, and differing travel histories. It is not
a clean mechanic ranking, does not establish a winner automatically, and does
not authorize a nerf or buff. If a follow-up is authorized, separate the slow
effect from footwear before treating the result as a mechanic conclusion.

Stop here per the packet. No balance, encounter, Heat, reward, or route code
was changed during execution.

## Retained artifacts and hashes

Artifact root:

```text
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t122828z-spirit-volcano-control-t3-v1s
```

The manifest receipt content equals the manifest SHA-256.

| Artifact | SHA-256 |
|---|---|
| `experiment.json` | `6567e1ac8d10deecef7e8a2dab701efb9fb5190bfbac1c566c4062434d32b5bb` |
| `experiment.sha256` file | `12c0b62ce9ae0bd1185494b5b17de73dedbdf359512966b9afc76aa726d27588` |
| Receipt content (manifest SHA) | `6567e1ac8d10deecef7e8a2dab701efb9fb5190bfbac1c566c4062434d32b5bb` |
| `cohort-summary.json` | `a0724de809933387a9ce2dcebf0b00ea331aa8dce5f471e0efd2f88cc2bc92ab` |
| `state.json` | `c6c5ab4db5b2eaa8884d6e6c15d4a95ab662caa5a81f58b85c97fa3bc0f5c8fd` |
| `supervisor-events.jsonl` | `e3a08f266025e2c6c748fc3e3dfcd5a4527b86a5c1f98e729cfcfc483b35286a` |
| `network-release.json` | `92881018c75717bf9aaa24e72ec8a6b667cbd709a39fa4e61dedce08cee970cc` |
| `inputs/tier-entry/checkpoint-pre-volcano-rested.json` | `015a40785122af6b2a684827e344f0d2465d1b4462d6866801fbc4d9dad5cf55` |

Per-run retained evidence hashes:

| Run | `checkpoint-restore.json` | `events.jsonl` | `summary.json` | `deaths.jsonl` | `snapshot-index.json` |
|---|---|---|---|---|---|
| Control r01 | `f39691e0201de4deced45d54bbdbaa98743c5471aa4a99d1bb0cebf6687a7a30` | `7dfe1799568e77024917fbe6d3cb3fee68b711871eb1924f75b8c3fc1c92fc85` | `55edd488ee75f7e639b98a67dcaa891cace44446ac8ed3af7aa589cb537a057a` | `8b1950918a7f58cdc23690d470a3b346aea952d1199a5a6f283d8fbf579b393a` | `8a1085fb4843ce729bf468a69fc1a3ebaac7083efa2cd02b403aa2916ecacdc0` |
| Pursuit r01 | `2fd62ae21fac0e8e19f532dc5230ac0651edada2d69e0447ec752a98e092cb1e` | `5cb793fd73e58b15dee87323899288daf7949a70c516f0bb72eb27800b6b6d42` | `04099136770518de4d20deea818a84e59ba16ff2d491a6109662cf1905975e1a` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `1341d49ae5137b2fb5f60cfbfe0f19a2c8c69a567a59c35628e9baea756308d5` |
| Control r02 | `b0ab30ad46f8a6d030fa0e0130399af85d935bdb407eee9743df43983b8d089a` | `8bfbb83d4aef62846c7df233c915efa1db2342e2628b4b674d01c298206132a0` | `3655286e3421a0231377e23c00f89f16e2f231e8a7c48d0e6aa14a6f2e34124d` | `b1b230fc0afec9719d321955e8135a44e7afc146532e2938b92df8c295e32d5f` | `ce0c3bf874163a2f9380e3023e87a9598636dad5795719658e6d378b6a43f6bf` |
| Pursuit r02 | `2aae43030304100e40f03f491195b26d08acd25333ffb84d077308db650becec` | `b5ccef01bfcf70cf82720e72b08f2efd99af988463217f90def109b8d6eea69c` | `b22f8e42cf29b2f94e14c0d15699600682a10bfbee54f22bb9f501ee0b529b32` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `ea115bc99f0120dfe0909ee60ad22637c4cd869bca865314cc5734b3eeda100b` |
| Control r03 | `94b0ca12c3fbfebe3c744c9758ee556ffd57537783a2e10f66840b9570f099b4` | `0b096ca73ac5d87b7bf1c9ccf2054045c1654668ec2b616c5f7455e7f76ac805` | `fe03e19170cb07846665d1a6dd5348f6ff74fdbacd7fa0a927d821f51dca59a0` | `be5fd845272a7767856c1a5bc5fdc498812fcd6587786cb6af4efa10d83ef848` | `94a11bd7f64c4f307fc3b420186c9a79258bdf01a311aa61e50a2a7146a41e47` |
| Pursuit r03 | `bf1d4331b2c412fdcc8d397e49b14b7a65d9cb61139b8ba1950abe3406353825` | `b94cfe465959ef633afee6a1fe668fe7226ad031203804ab2c5ff584a0a716b9` | `4c0b5a5d9f3c760575dccbabdd1e50484217eab201a9154433ac8f2838fd2b06` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `9147132d5e6a371c49aecb4f50969d2eb082853ac94efb625f6e3668fc513dea` |

Checkpoint files:

| Run | Prepared checkpoint | Returned checkpoint | Snapshot B |
|---|---|---|---|
| Control r01 | `checkpoint-v1s-control-prepared.json` — `63dbb7eda69bc241a842d58a0b5e854c9410816eceadf6eb2b21c28aed814f23` | Not captured after death | Not captured |
| Pursuit r01 | `checkpoint-v1s-pursuit-prepared.json` — `db973d37bd7371212665e03d06adbb7e977fb9fa964acbd347ee49aa0944ec79` | `checkpoint-v1s-pursuit-returned.json` — `34c2d2672cc292414247552ed10fc1fe58facc1b0f2707d1fc0d105cc0ec0c23` | `snapshot-b.json` — `5a0feab32d2b5c51c36fabb61b6f94fbbe7f79518e6c7e7e27d08eaed068ea02` |
| Control r02 | `checkpoint-v1s-control-prepared.json` — `a407883cc803136ea687434973f26e4034ec69db2a0835f6823db9521c13b767` | Not captured after death | Not captured |
| Pursuit r02 | `checkpoint-v1s-pursuit-prepared.json` — `32f72f4612b27945fc109dc5bf480edcb9a6bdda9c84dda77d01552a8ae5e4a6` | `checkpoint-v1s-pursuit-returned.json` — `14018b968d2e3282cbd9b20c8edde609b4c29122cc2a2cb2b437bafd0847a2d8` | `snapshot-b.json` — `789653574780d2615f9dbd331383458e0f1c5dc227669fb4992339f11c9a7373` |
| Control r03 | `checkpoint-v1s-control-prepared.json` — `ab18d6d0c2e134e2d624f47e43c04ecc4e3f042903ae42a69c025a5bfce76a06` | Not captured after death | Not captured |
| Pursuit r03 | `checkpoint-v1s-pursuit-prepared.json` — `7946a7bcefe1e8b5db745c1537628eb39d24a62937621fc3a6254cc6e4a7f108` | `checkpoint-v1s-pursuit-returned.json` — `2c6d2e91b065bdf0581087518f23bbab251e73311994b7eeca320493191cbecd` | `snapshot-b.json` — `0ade35d27c55be14256712f51ead0c5a0aa6be41ad4aa6b05b2eefa6881f7963` |

The released network, containers, volumes, supervisor logs, run configs,
worker results, resource samples, events, summaries, deaths, and checkpoints
remain retained under the artifact root. No global Docker prune or unrelated
service cleanup was performed.
