# V1r — Short natural Volcano targeting and pursuit screens

Status: completed once under the supplied frozen packet. The three routes ran
sequentially on one worker with no retry, resume, adaptive edit, extra arm, or
automatic winner selection. No gameplay or balance values were changed by the
operator. The immutable experiment image was built from the packet revision;
the invoking checkout's unrelated changes were excluded from the image.

Control and pursuit both reached the natural target, completed the intended
approximately 60-second observation, returned to Sanctuary, recovered at the
interior center, and captured a safe/rested final checkpoint. Focus reached the
target but died after 57.825 seconds of measured combat. This is a useful
natural-population screen, not a causal ranking: the arms saw different
populations and travel histories, and pursuit is a two-part Hamstring plus
Desert Boots package.

The screen therefore does not authorize a balance edit. Pursuit is a positive
screen for a later separation of slow versus footwear; focus is not a clean
target-commitment result and would need a fixed-roster follow-up if that
hypothesis remains worth testing. No Hound tuning, Scuttler HP cut, Heat cut,
Tundra run, or T4 run was authored or proposed here.

## Frozen packet and session ledger

| Field | Value |
|---|---|
| Operator setup start | 2026-09-14T11:48:20.2875526Z |
| Packet ceiling | 60 real minutes including image setup |
| Packet deadline from recorded start | 2026-09-14T12:48:20.2875526Z |
| Experiment ID | `20260914t114901z-spirit-volcano-control-t3-v1r` |
| Manifest created | 2026-09-14T11:50:17.541Z |
| Supervisor start / terminal | 2026-09-14T11:50:55.121Z / 2026-09-14T12:04:07.873Z |
| Report generated | 2026-09-14T12:04:24.562Z |
| Release | Automatic at 2026-09-14T12:04:08.684Z; CLI returned `already-released` |
| Frozen revision | `01491a7ac2df8ef0bcf6e860b7077be9aaa08332` |
| Frozen source tree | `d64e29d1c0d771e5731b1b719ff84e152c24f7ec` |
| Image | `mmo-idle-experiment:01491a7ac2df-d90e6996`; `sha256:164149fed29f634e2bbff3d1de5e254c5ea208581e52108b725bb7b9e7c31985` |
| Build ID | `f7e3dbb23b75b0325915a128` |
| Mode / rewards / worker | `smoke-isolated` / 1x / one worker / one replica per route |
| Max run duration | 600,000 ms |
| Node / pnpm / Docker | `v22.16.0` / `8.15.1` / `29.5.2` |
| Free C: space before create | 8,760,532,992 bytes |
| Worker check before create | No other experiment worker; existing development services were preserved |

The main checkout was dirty before creation with these entries, all preserved:

```text
 M docs/README.md
 M docs/briefs/bot-balance-v1g-report.md
?? docs/briefs/bot-balance-v1q-report.md
?? server/runs/human-playtests/human-2026-09-13T16-53-11-299Z-e1f16cb8/
```

The frozen commit's parent delta was limited to the V1r route, registry and
setup-only validation surface: `bot/src/routes/campaignT3V1r.ts`,
`bot/src/routes/index.ts`, `server/scripts/v1rPreflight.ts`, and
`server/tsconfig.diagnostics.json` (114 insertions, 1 deletion). No gameplay
values changed in that source delta. The image build's shared build, server
build and bot TypeScript checks exited 0. No full repository test-suite claim is
made.

## Input, provenance, and preparation validation

The exact packet input was used for all three arms, not Snapshot B and not the
demonstration's Desert Boots end state:

```text
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t112129z-checkpoint-pre-volcano-capture/runs/001-checkpoint-pre-volcano-capture-intended-r01/artifacts/checkpoint-pre-volcano-capture-intended-2026-09-14T11-23-17-505Z-78b380cf/checkpoint-pre-volcano-rested.json
```

Its SHA-256 is
`015a40785122af6b2a684827e344f0d2465d1b4462d6866801fbc4d9dad5cf55`.
The staged copy inside the experiment has the same hash. The packet-supplied
setup-only validation at
`C:/Users/osaif/AppData/Local/mmo-idle/validation/v1r-preflight-20260914.json`
was verified on disk, with SHA-256
`f52b12e3a084db61e0e4bd381b36a75be531001409d9565c8868d7ca35d48743`.
It records setup-only mode, three cases, zero ticks in each case, shared
starting-state fidelity, and combat RP totals 27/30/31 with travel RP 28 in
each arm. It was not rerun during this launch because the packet supplied it
as already executed validation.

The input is a real capture of a legacy-imported V1m descendant. The inherited
provenance remains non-canonical and retains synthetic tier-entry and 25x
ancestry. Every run carries these taints:

```text
RESTORED_PROGRESSION_CHECKPOINT
SYNTHETIC_TIER_ENTRY
NON_CANONICAL_REWARD_MULTIPLIER
```

The inherited checkpoint source revision is
`e4ee4cb9b5ad800320fd61b30975c5a06c2dafc4`; its source persistent/state hash
is `d200fe6ebc012dd2dbef909350917c6370a43dd75e224865d8223cfb31bd4552`.
The inherited route is `spirit-wisp-travel-t2-bridge-v1m`, captured at
`canonicalAtCapture=false`, with inherited reward multiplier 25. Execution
itself used reward multiplier 1.

Each live restore reported `success=true`, `normalized=true`,
`restorePolicy=safe-rested-v1`, current source revision
`01491a7ac2df8ef0bcf6e860b7077be9aaa08332`, definitions hash
`92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`,
`changedDefinitionSections=[]`, and the same state hash above. All three
prepared checkpoints started at `node-t3-sanctuary` with 236/236 HP and
132/132 barrier. The normalization boundary was used only at Sanctuary, never
on Volcano arrival.

## Treatments, purchases, and builds

All arms retained Wisp/Far, Ruinous Axe +5, Cave Vest +5, Mountain Charm +5,
Tempered Core, Defensive stance, Sweep, Second Wind and Brace. The travel
build retained `Avoid Enemies`, `Fight Back` and `Avoid Hazards`; combat
removed only the two travel-only rules. The common combat rules were
`Always -> Auto-path Enemy`, `Inside Telegraph -> Step Back`,
`In Combat -> Orbit`, `Always -> Avoid Hazards`, and
`Always -> Wait for Regen`.

| Arm | Travel RP / combat RP | Declared treatment | Prepared checkpoint SHA-256 | Returned checkpoint SHA-256 |
|---|---:|---|---|---|
| `spirit-volcano-control-t3-v1r` | 28 / 27 | None; Plains Boots +5 | `a06ca8575a2ae792cc66c1157d9fd81059dfcded186a496f8cb178569b6ac3ef` | `545c755dafdfb19b339c68183e342900ff353e52d971bd87dd002221725c7553` |
| `spirit-volcano-focus-t3-v1r` | 28 / 30 | Craft Focus Lowest HP and append `In Combat -> Focus Lowest HP` | `db82603db1fb728e94669c4530e06d883db01afa20717ec17bea9b1bf0183cad` | Not reached after first death |
| `spirit-volcano-pursuit-t3-v1r` | 28 / 31 | Learn Hamstring; craft, upgrade and equip Desert Boots +5 | `b3470d8c8d6e9de2c11c965b0a95aadfbcf82104251014ebb15843dd8bf7a1cd` | `9f62902c60a27f221eb2a8640e1464a1fbb12e43a24cc4e04b708a1086d3c923` |

All prepared kits had attack 102, max HP 236, recovery 13, plating 18,
19% damage reduction, attack range 222 and the same Cave Vest/Mountain Charm
loadout except pursuit's Desert Boots +5. Pursuit's prepared speed was 285;
the control and focus prepared speed was 187. Focus's prepared combat rules
verified the additional focus action at 30 RP. Pursuit's prepared abilities
verified Sweep plus Hamstring with Second Wind and Brace at 31 RP.

The paid treatment ledger was:

| Arm | Purchase evidence | Debits before `approach-start` |
|---|---|---:|
| Control | No purchase or gear event | None |
| Focus | `craft rune rune-recipe-focus-lowest-hp` completed; wallet changed from purple 1,522 to 1,432 | 90 purple |
| Pursuit | Hamstring learning; Desert Boots craft (yellow 58), upgrades +1/+2/+3/+4/+5 (yellow 15/37/60/97/165), then equip | 70 green, 432 yellow, 1 Dominion catalyst |

The packet's two-part pursuit cost is therefore fully reflected in the wallet
delta. No resource farming, gear grant, class reset, earlier boss/unlock
prefix, or illegal focus-plus-pursuit combination was used.

## Phase completion and route evidence

Times below are run-relative event times in milliseconds. The intended farm
window was 60 seconds; the live route step remained within its 75-second step
ceiling and recorded approximately 61 seconds including boundary overhead.

| Arm | Setup / approach | Arrival build and measured window | Return / recovery | Terminal result |
|---|---|---|---|---|
| Control | `approach-start` 7,064; target arrival 109,153 at `node-t3-volcanic-01` | Baseline combat build, 27 RP; `measurement-start` 112,162; `measurement-end` 173,213; farm step 61,049 ms | `return-start` 176,219; Sanctuary 283,824; center 302,852; recovery farm through 313,861; returned checkpoint and full-HP/no-DoT assertion passed | `bot_completed`; run end 314,530 ms |
| Focus | `approach-start` 7,585; target arrival 109,671 at `node-t3-volcanic-01` | Focus Lowest HP combat build, 30 RP; `measurement-start` 112,680; no measurement-end marker | No return or recovery phase reached | First death at 170,505 ms; run end 170,506 ms; supervisor reason `declared first-death stop` |
| Pursuit | `approach-start` 11,590; target arrival 78,647 at `node-t3-volcanic-01` | Hamstring combat build, 31 RP; `measurement-start` 81,657; `measurement-end` 142,702; farm step 61,045 ms | `return-start` 145,712; Sanctuary 231,279; center 240,788; recovery farm through 251,799; returned checkpoint and full-HP/no-DoT assertion passed | `bot_completed`; run end 252,465 ms |

All three reached the exact target node. Control then continued naturally
through Volcanic Dungeon, Volcanic 02 (Heavy) and Volcanic 03 (Swarming) on
the return route. Pursuit also traversed the later natural Volcano nodes and
then Swamp 05 before Sanctuary. Focus died in Volcanic 01 and did not enter a
return path. No hazard or travel blocker prevented target observation.

## Natural population and measured combat screen

These are target-node observations only. The `monstersInNode` samples are the
natural node population, not a fixed pack size; concurrent attackers are the
engaged attackers reported by the bot. There were no other players or
contested samples in any arm, and no claim is made that the populations were
identical.

| Arm | Target-window kills | Time to first kill | Target-node population / max attackers | Target switches | Target-window status |
|---|---|---:|---:|---:|---|
| Control | 5 Ember Scuttlers, 1 Cinder Hound, 1 Ash Salamander | 10.690 s, Ember Scuttler | 35–40 / 4 | 5 | Full window, then returned |
| Focus | 3 Ember Scuttlers, 1 Cinder Hound | 15.764 s, Ember Scuttler | 35–41 / 4 | 5 | Death at 57.825 s |
| Pursuit | 2 Ash Salamanders, 3 Ember Scuttlers | 9.962 s, Ash Salamander | 35–40 / 5 | 4 | Full window, then returned |

Full-route summaries include later travel combat and therefore are not
substitutes for the target-window table:

| Arm | Full-route kills by species | Player damage dealt | Summary damage taken / absorbed / healed / HP lost |
|---|---|---:|---:|
| Control | 5 Ember Scuttlers, 2 Ash Salamanders, 1 Cinder Hound | 8,864 | 669 / 520 / 1,162 / 565.87 |
| Focus | 3 Ember Scuttlers, 1 Cinder Hound | 5,608 | 522 / 324 / 607 / 373.64 |
| Pursuit | 4 Ember Scuttlers, 3 Ash Salamanders, 1 Cinder Hound, 1 Mire Hexer (8 Volcanic and 1 Swamp) | 11,698 | 820 / 751 / 1,537 / 714.66 |

The summary's incoming-source totals are full-route aggregates:

| Arm | Incoming source totals |
|---|---|
| Control | Ash Salamander 456; Cinder Hound 166; Ember Scuttler 47 |
| Focus | Cinder Hound 353; Ember Scuttler 169 |
| Pursuit | Ash Salamander 513; Cinder Hound 307; Ember Scuttler 0; Mire Hexer 0 |

Focus's retained death record is phase-specific and should not be collapsed
into a single “killing hit” claim. It records death at 170,505 ms in
`node-t3-volcanic-01`, Alacrity, during the farm step, with a terminal cause of
Cinder Hound melee for 67. The largest recorded hit was also a Cinder Hound
67-damage hit at 166,065 ms with three concurrent attackers. The record's
preceding `killingBlow` field is an Ember Scuttler direct hit for 30 at 170,068
ms, taking HP from 42.0114 to 12.0114 with two concurrent attackers. Its
death-window damage records contain five Cinder Hound contacts (141 delivered,
130 absorbed) and seven Ember Scuttler contacts (169 delivered, 2 absorbed);
the summary's full-run aggregate remains Hound 353 versus Scuttler 169.

The raw target-switch events were retained, but those events carry entity IDs,
not species labels. Control switched at 126,390, 142,395, 143,395, 145,393
and 146,394 ms; focus at 164,426, 165,426, 167,426, 168,426 and 170,426 ms;
pursuit at 116,393, 117,393, 118,394 and 136,397 ms. Species-level target
assignment for every switch is unavailable in the retained live event schema;
the counts above are not an inferred commitment score.

## Ability delivery and telemetry limits

Within the measured target window, retained activation events show:

| Arm | Sweep | Hamstring | Second Wind | Brace |
|---|---:|---:|---:|---:|
| Control | 8 | 0 | 2 | 2 |
| Focus | 7 | 0 | 2 | 2 |
| Pursuit | 9 | 9 | 3 | 2 |

Full-route summary activation counts were Control Sweep 10 / Second Wind 3 /
Brace 3; Focus Sweep 7 / Second Wind 2 / Brace 2; and Pursuit Sweep 13 /
Hamstring 9 / Second Wind 4 / Brace 3. The pursuit Hamstring activations
occurred throughout its target measurement, with the last at 140,849 ms.

The live event stream has no ordinary-attack event kind and no per-hit Sweep
or Hamstring effect/duration record. Consequently, the report uses the
retained activation counts and full-route damage aggregates only; it does not
infer individual attack uptime, Sweep secondary hits, or slow application from
coarse samples. The checkpoint captures expose `heatPct=0` at prepared and
returned boundaries where that class-resource field is present, but no
in-combat Heat stack/decay time series or separate cooling telemetry was
emitted. No post-clear cooling tail was entered. A death reset is not cooling
evidence.

## Progression, economy, and coordination classification

All arms ended at player Tier 3, global mastery 78, unchanged biome levels and
the inherited eight-boss prefix. No arm changed mastery or tier. The observed
loot and catalyst gains were:

| Arm | Loot / catalyst gains after treatment |
|---|---|
| Control | +166 red essence; +2 Alacrity |
| Focus | +83 red essence; +1 Alacrity |
| Pursuit | +164 red essence, +29 purple essence; +2 Alacrity, +1 Fortified |

These are non-canonical run outputs from a restored synthetic checkpoint, not
economy evidence. The treatment debits are separated above from later route
loot. Coordination remained clean in every summary: execution mode `single`,
maximum simultaneously progressing `1`, `contaminated=false`, zero other
players, zero contested samples, and no shared-admission or overlap record.

## Decision gates and handoff

The first natural farming gate was met by Control and Pursuit: each stayed
alive through the intended 60-second target observation and recorded kills. The
successful recovered-return gate was also met separately by those two arms.
Focus did not meet either gate because its first death occurred before the
measurement window completed. None of these gates validates all Volcano,
larger-pack behavior, chain pulling, Heat cooling, or T4.

The positive pursuit screen is confounded by both Hamstring and Desert Boots,
as required by the packet. If a follow-up is authorized, separate the slow
effect from footwear before treating pursuit as a mechanic result. Focus's
natural screen does not isolate target commitment because the raw target IDs,
population and approach history differ; a fixed-roster commitment test would
be needed. The packet's Hound-tuning gate is not automatically entered, and no
Scuttler or Heat adjustment is recommended by this one-pass screen.

Stop here per the packet. T3 other-biome TTK, T4 low-TTK/balance, and the T4
Scuttler counterpart remain flagged; T1/T2 validation is not reopened.

## Retained artifacts and hashes

Artifact root:

```text
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t114901z-spirit-volcano-control-t3-v1r
```

The manifest, receipt, cohort report, release receipt, and staged input are
retained:

| Artifact | SHA-256 |
|---|---|
| `experiment.json` manifest | `c1213d426303b59e12ce1fbadccc16c95052597f780accd8d123f06f4e32425e` |
| `experiment.sha256` receipt file | `aa0986e0065f832d43d72244f8d70ccd2f4516e61e13d21878d69bbeb43d03b9` |
| Receipt content (manifest SHA) | `c1213d426303b59e12ce1fbadccc16c95052597f780accd8d123f06f4e32425e` |
| `cohort-summary.json` | `440142dc386f97c8f710ca329251c25cf3660e34aa10ec7b0161a4b4964a6e4b` |
| `state.json` | `1d857fbcc122c2f5dc120b80836f049324a03b9201b3775637960504d07299c8` |
| `supervisor-events.jsonl` | `8deecd4595d2fce01f705754225ad76db986b3c720e0831c760536e233900214` |
| `network-release.json` | `f4e7118c6e56b5627c4eb92a3eda1bbb00fb745ed2aa1de9010c43a744cba394` |
| `inputs/tier-entry/checkpoint-pre-volcano-rested.json` | `015a40785122af6b2a684827e344f0d2465d1b4462d6866801fbc4d9dad5cf55` |

Per-run retained evidence hashes:

| Run | `checkpoint-restore.json` | `events.jsonl` | `summary.json` | `deaths.jsonl` | `snapshot-index.json` |
|---|---|---|---|---|---|
| Control | `0578103a85829fdd7774d221988aecae48e71aeea2c1218fe51b95d14e43f91e` | `43382864fa6057c59766e5618147365f7a286e1d227bcac3503437fb4ed59183` | `15d47bb51a54f96501828ac2b657fa66eefbd2ee912e245cc724504c390a5b60` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `0819a8b577998a7085fa3f6c62680a09576f0ae8de9a89533e03132bfac9ccaf` |
| Focus | `3caac980761b843321aa767159d8974df8847f7bab1b5001954aca27984d4503` | `e806036dea66b982c5da2597e559626c57e7215d3f9af3ec70cc413220ffc1ea` | `573b854cba60a6f26a47e23347612f0f005b0943c748e97eb50a5ec510668697` | `b4475b3fe817cce8fb5a62e4a956106c77b48403b5d813e93672cf8ec9244999` | `e4cc243151572165a2e5fc4c26908c7f46a1424327cd30eeeede56f31874981` |
| Pursuit | `3820123721db03d51152a00c20285b3642a5fa4b85809f4352fe1e010d3a5245` | `35adca75e4719a5465d3d232e1c7b801dcfefc6c02f139f059b01511f1155ee4` | `cceb52c06f5d8d03460b449dd5479103f0f6ccaecfe9e7bb6dff3669d0aaf7ed` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `70dbdbdb1f0f9adb767b973c91eb47c03251790738a1d5d140e8d790ae1406e0` |

Checkpoint and final-state files:

| Run | Prepared checkpoint | Returned checkpoint | Snapshot B |
|---|---|---|---|
| Control | `checkpoint-v1r-control-prepared.json` — `a06ca8575a2ae792cc66c1157d9fd81059dfcded186a496f8cb178569b6ac3ef` | `checkpoint-v1r-control-returned.json` — `545c755dafdfb19b339c68183e342900ff353e52d971bd87dd002221725c7553` | `snapshot-b.json` — `5ec66a11c9598ccc201143299576737dc3f3f6c8ddceb69a4b9fa324e4957f95` |
| Focus | `checkpoint-v1r-focus-prepared.json` — `db82603db1fb728e94669c4530e06d883db01afa20717ec17bea9b1bf0183cad` | Not captured after death | Not captured after death |
| Pursuit | `checkpoint-v1r-pursuit-prepared.json` — `b3470d8c8d6e9de2c11c965b0a95aadfbcf82104251014ebb15843dd8bf7a1cd` | `checkpoint-v1r-pursuit-returned.json` — `9f62902c60a27f221eb2a8640e1464a1fbb12e43a24cc4e04b708a1086d3c923` | `snapshot-b.json` — `475c6dec08903eedcadca0c56b046206ee47ac8c5f0b799d350f5dcaa923c335` |

Each run also retains its `run-config.json` and `worker-result.json`; the
experiment root retains the immutable image metadata, supervisor lifecycle,
release receipt and all volumes/artifacts. No global Docker prune or unrelated
service cleanup was performed.
