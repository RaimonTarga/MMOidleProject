# Bot Balance V1u2 Report — audited tempo/barrier preparation and Volcano replicas

## Outcome

V1u2 completed the constrained resume prescribed by the operator packet.

- Stage A completed all `62/62` route steps in one fresh, one-worker, `25x` smoke-isolated preparation run.
- Stage A had no deaths, reached `GM114`, retained all eight original boss clears, and captured the required final Sanctuary checkpoint with the intended tempo/barrier kit equipped at `+5`.
- Stage B was then created from that exact named final checkpoint and ran two fresh ordinary `1x` replicas.
- B1 and B2 both cleared all 12 Volcano guardians, produced the named `Cinder-Shell Magma-Salamander` kill, recorded a victorious boss attempt, added authoritative `volcanic:3` progression, and returned to Sanctuary safely.
- Both returned captures show full HP, full barrier, and no persistent DoT.

This is a successful preparation and boss-clear replication result. It is diagnostic gameplay evidence only: both stages are smoke-isolated, inherit a restored/synthetic tier entry, and are non-canonical. It does not establish a canonical economy result, an isolated item/cost attribution, or a balance winner. No gameplay or balance source change was made for V1u2.

## Frozen scope and validity

- Packet: `bot-balance-v1u2-operator-packet.md`, prepared 2026-09-14; it superseded V1u after the V1u resolver-path failure.
- Frozen source revision: `0275d223b1bf3a86ad816a72df27bfe8a4523eb6`.
- Frozen source tree: `ed4cf12c1ce6ff41dae3a853c0e5df3f20da4265`.
- Image: `mmo-idle-experiment:0275d223b1bf-d90e6996` (`sha256:e4c1c7423455137764f870895942bf4bbf5568a4289582186d8b285612a360c0`).
- Input checkpoint: `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t144523z-spirit-volcano-preparation-t3/runs/001-spirit-volcano-preparation-t3-v1u-intended-r01/artifacts/spirit-volcano-preparation-t3-v1u2-intended-2026-09-14T14-47-25-496Z-718f4e38/checkpoint-v1u-mastery-mountain.json`.
- Input checkpoint SHA-256: `b28d4db869876eaa67ea2bd4d9af796797608051f1b09634bc8af97a435bec14`.
- Qualification artifact: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1u2-preflight-final-20260914.json`.
- Qualification artifact SHA-256: `8dc04d42c8dd7169931c9f4d27e65cc2d3002d6da414de5ed0d708df90bd5bd8`.
- Qualification mode: `setup-only-with-hypothetical-earned-gates`; ticks `0`; it was not a live checkpoint or combat result.
- A route: `spirit-volcano-preparation-t3`, version `1.0.0`, one worker, reward multiplier `25`, `maxRunMs=5400000`, no retry, first-death policy.
- B route: `spirit-volcano-tempo-barrier-t3-v1u2`, one worker, two runs, reward multiplier `1`, `maxRunMs=1200000`, no retry, ordinary intended policy.
- All runs retained `RESTORED_PROGRESSION_CHECKPOINT`, `SYNTHETIC_TIER_ENTRY`, and `NON_CANONICAL_REWARD_MULTIPLIER` taints. All captures have `canonicalAtCapture=false`; combat and economy evidence flags remain false for the isolated cohort.

The full repository suite was not run. The packet-specific bot/diagnostics TypeScript pass completed during preflight, and experiment image build, lifecycle, route assertions, and terminal artifact generation completed successfully.

## Experiment lifecycle

### Stage A

Experiment root:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t151233z-spirit-volcano-preparation-t3`

- `experiment:create` succeeded with the frozen revision/tree and exact input SHA.
- `experiment:launch` succeeded with one supervisor and one worker.
- `experiment:status` reached terminal state: supervisor `completed`, run `bot_completed`, route `62/62`, no deaths.
- `experiment:report` succeeded.
- `experiment:release` completed; the subsequent release check returned `already-released`.
- Released network: `mmoexp-6384a8ef5736-network`, ID `1503247a59a43bd8f6c4278f05b60c1ddef6547691d5c95f88e80ab29faf5912`.

Run artifact directory:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t151233z-spirit-volcano-preparation-t3/runs/001-spirit-volcano-preparation-t3-v1u2-intended-r01/artifacts/spirit-volcano-preparation-t3-v1u2-intended-2026-09-14T15-14-37-475Z-26599f53`

Run duration was `352028ms`; it ended at `2026-09-14T15:20:29.527Z`.

### Stage B

Experiment root:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t152219z-spirit-volcano-tempo-barrier-t`

- B was created only after Stage A passed its final gate, using the named A final checkpoint rather than an intermediate, `snapshotB`, or boss-return capture.
- `experiment:create`, `experiment:launch`, `experiment:status`, `experiment:report`, and `experiment:release` all succeeded.
- Terminal status: supervisor `completed`, `2/2` runs `bot_completed`.
- Released network: `mmoexp-8833f9738d9a-network`, ID `635c55c8143cc2055332d04780da4348688a25ebc9dbc1ec500a618eafc64eeb`.
- B1 ran `251036ms` and B2 ran `313033ms`; both ended normally after the declared return checkpoint.

## Stage A preparation trajectory

The V1u2 route used explicit audited waypoints. It did not use the resolver’s `pick:first` behavior and did not transit Tundra during the Jungle or Desert legs.

| Segment | Explicit route | Result |
|---|---|---|
| Jungle | `node-t3-jungle-05`, then return to Sanctuary | Jungle reached `12`; named `v1u2-mastery-jungle` captured at `GM102`; return completed. |
| Desert | `node-t3-swamp-05` → `node-t3-swamp-04` → `node-t3-desert-05`, then reverse return | Desert reached `12`; named `v1u2-mastery-desert` captured at `GM108`; return completed. |
| Tundra | `node-t3-swamp-06` → `node-t3-tundra-05`, then reverse return | Tundra reached `6`; named `v1u2-mastery-tundra` captured at `GM114`; return completed. |

Exact node-enter sequence, with elapsed milliseconds and node modifier where present:

```text
1641    node-t3-sanctuary
12642   node-t3-jungle-05          alacrity
43643   node-t3-sanctuary
100656  node-t3-swamp-05           fortified
108654  node-t3-swamp-04           dominion
125656  node-t3-desert-05           dominion
147656  node-t3-swamp-04           dominion
172658  node-t3-swamp-05           fortified
175660  node-t3-sanctuary
221671  node-t3-swamp-06           fortified
255672  node-t3-tundra-05           heavy
280672  node-t3-swamp-06           fortified
312673  node-t3-sanctuary
```

Named preparation captures:

| Capture | GM / location | SHA-256 |
|---|---|---|
| `checkpoint-v1u2-mastery-jungle.json` | `GM102`, Sanctuary, full recovery | `cf54fdef4d89636d8cc3648016c9921c2c99c746336407fc28381ed8420093f9` |
| `checkpoint-v1u2-intermediate-kit.json` | `GM102`, Sanctuary, Cinderlash/Accelerant and T3 Mountain kit equipped | `2fa390b750aca15b3e7309c0368113e0f4933a6ac4b17490e233ff13ae654c3d` |
| `checkpoint-v1u2-mastery-desert.json` | `GM108`, Sanctuary, full recovery | `923fc0815a34c59d61aa02a9e8443eb3eb6dbbc7706ccffbc427d984a3fb410f` |
| `checkpoint-v1u2-pre-tundra-upgraded.json` | `GM108`, Sanctuary, the three new items at `+4` | `2e5ff31b663a8a2f95c739a6097d9bb0d5c838d7fb21eae0eab4e4836c80019e` |
| `checkpoint-v1u2-mastery-tundra.json` | `GM114`, Sanctuary, full recovery | `e8355fb17101316c6db2cabaf374da4777c7080d2f1565f58d116c9445067595` |
| `checkpoint-v1u2-tempo-barrier-prepared.json` | `GM114`, Sanctuary, final boss-ready state | `8644d3c319d244e5f69c88cb64ba8236833981a04541a99b4e0c48b2108e4be4` |

The final named checkpoint has state hash `a334e1b817da0005d9377ea7d05d70f2b71352c2157585fac5591d6ec4755b69`, source revision `0275d223b1bf3a86ad816a72df27bfe8a4523eb6`, boundary `v1u2-tempo-barrier-prepared`, and `checkpointSourceNode=node-t3-sanctuary`. It records `GM114`, Jungle/Desert/Tundra at `12/12/6`, all eight original boss clears, Cinderlash, Mountain Vest T3, Mountain Charm T3, Desert Boots T2, and Core Accelerant. Runtime state is Sanctuary HP `307/307`, barrier `196/196`, with no DoT.

## Stage A progression and purchase receipts

The route-step receipt for `learn frenzy (technique)` completed at `64911–65414ms`. The final checkpoint and subsequent B boss-ready builds contain Frenzy. The event stream does not emit a standalone `learnAbility` economy record with a cost, so no Frenzy cost is inferred here.

Craft and evolution receipts:

- `volcanic-cinderlash`: crafted for red `140`.
- `core-accelerant`: crafted for green `1150` and alacrity catalyst `5`.
- `mountain-vest-t2`: evolved for blue `52`.
- `mountain-vest-t3`: evolved for blue `116` and red `29`.
- `mountain-charm-t3`: evolved for blue `100` and red `25`.

The three new items were upgraded in the prescribed stages. Costs below are the recorded per-level receipts.

| Item | Upgrade receipts through `+5` |
|---|---|
| Mountain Vest T2 | `0→1` blue `42`; `1→2` blue `106`; `2→3` blue `170`; `3→4` blue `276` + heavy `1`; `4→5` blue `468` + heavy `2`. |
| Cinderlash | `0→1` red `96`; `1→2` red `240`; `2→3` red `384`; `3→4` red `624` + swarming `2`; `4→5` red `1056` + swarming `3`. |
| Mountain Vest T3 | `0→1` blue `66` + red `17`; `1→2` blue `166` + red `42`; `2→3` blue `266` + red `67`; `3→4` blue `434` + red `108` + heavy `2`; `4→5` blue `734` + red `183` + heavy `3`. |
| Mountain Charm T3 | `0→1` blue `26` + red `6`; `1→2` blue `65` + red `16`; `2→3` blue `104` + red `26`; `3→4` blue `169` + red `42`; `4→5` blue `286` + red `71` + heavy `2`. |

The +3 intermediate kit was equipped at `76952–79954ms`. The +4 kit was complete before `checkpoint-v1u2-pre-tundra-upgraded`; the +5 finish occurred after the Tundra return. Final A build configuration was `37/38RP`, Offensive stance, Frenzy/Sweep/Hamstring techniques, Second Wind and Brace guards, plus the packet’s boss counter-runes. No boss attempt was started in Stage A.

## Stage A combat and damage scope

Run-wide A totals:

- Kills `19`; player damage dealt `15499`; summon damage `0`.
- Damage taken `208`; absorbed `801`; healed `857`; HP lost `185`.
- Incoming damage was direct `88` and DoT `120`.
- Sweep activated `17` times; Hamstring activated `17` times; Frenzy activated `0` times because A did not enter a boss.
- Hazard escape succeeded `2/2`; Step Back activations `0`.
- Boss diagnostics `0`; persistent hazards empty at terminal capture.

The recorder exposes `travelMs` and `fightMs` by biome, but it does not attach each damage event to a route activity. Therefore an exact travel-versus-farm damage split is unavailable and is not reconstructed from timestamps.

| Biome | Time | `travelMs` | `fightMs` | Kills | Damage taken | Damage dealt |
|---|---:|---:|---:|---:|---:|---:|
| Sanctuary | 154667 | 27002 | 0 | 0 | 0 | 0 |
| Swamp | 119008 | 119008 | 38002 | 12 | 120 | 7533 |
| Jungle | 31001 | 15001 | 18000 | 2 | 88 | 2695 |
| Tundra | 24999 | 6000 | 11000 | 3 | 0 | 2816 |
| Desert | 22000 | 3000 | 13001 | 2 | 0 | 2455 |

`travelMs` and `fightMs` are overlapping recorder categories, not additive partitions. The safe interpretation is zone-level damage and separate travel/fight timing only.

## Stage B route and boss evidence

Both replicas used the same explicit approach and reverse return:

`node-t3-sanctuary` → `node-t3-swamp-05` (`fortified`) → `node-t3-volcanic-03` (`swarming`) → `node-t3-volcanic-02` (`heavy`) → `node-t3-volcanic-dungeon` → reverse return.

### B1

Run artifact directory:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t152219z-spirit-volcano-tempo-barrier-t/runs/001-spirit-volcano-tempo-barrier-t3-v1u2-intended-r01/artifacts/spirit-volcano-tempo-barrier-t3-v1u2-intended-2026-09-14T15-23-06-975Z-31d17012`

Node-enter trace:

```text
1435    node-t3-sanctuary
13435   node-t3-swamp-05           fortified
37442   node-t3-volcanic-03        swarming
55443   node-t3-volcanic-02        heavy
72448   node-t3-volcanic-dungeon
169460  node-t3-volcanic-02        heavy
186462  node-t3-volcanic-03        swarming
210461  node-t3-swamp-05           fortified
227462  node-t3-sanctuary
```

Boss and return evidence:

- Dungeon guardian attempt started at `75199ms`; `12/12` guardians were alive at start.
- Guardian clear ended at `122737ms`, with `0` alive.
- Boss combat ran `131750–158280ms`.
- Boss attempt ended at `158780ms` with outcome `victory` and terminal `bossHpFraction=0`.
- Named kill at `158217ms`: `Cinder-Shell Magma-Salamander`, entity `node-t3-volcanic-dungeon_monster-13`. The raw event has `isBoss=false`; the name, victorious attempt, and authoritative progression milestone are the corroborating evidence.
- `boss-defeated` milestone at `158781ms` includes `volcanic:3`.
- Return began at `161791ms`; named return capture completed at `251020ms`.
- Return capture SHA-256: `49afc1c9815457e7aac5ab10580c7e917d4359ca0e365f36ec9e7b9385f9a18a`.
- Return capture state hash: `42f98812fbec456349ca387249b89eefd300ff89d48c02e1279b78b391719fb5`.

### B2

Run artifact directory:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t152219z-spirit-volcano-tempo-barrier-t/runs/002-spirit-volcano-tempo-barrier-t3-v1u2-intended-r02/artifacts/spirit-volcano-tempo-barrier-t3-v1u2-intended-2026-09-14T15-27-37-280Z-d8d43caf`

Node-enter trace:

```text
1406    node-t3-sanctuary
13409   node-t3-swamp-05           fortified
47414   node-t3-volcanic-03        swarming
78419   node-t3-volcanic-02        heavy
120423  node-t3-volcanic-dungeon
214434  node-t3-volcanic-02        heavy
231436  node-t3-volcanic-03        swarming
256441  node-t3-swamp-05           fortified
289441  node-t3-sanctuary
```

Boss and return evidence:

- Dungeon guardian attempt started at `123203ms`; `12/12` guardians were alive at start.
- Guardian clear ended at `165234ms`, with `0` alive.
- Boss combat ran `173740–200257ms`.
- Boss attempt ended at `200758ms` with outcome `victory` and terminal `bossHpFraction=0`.
- Named kill at `199932ms`: `Cinder-Shell Magma-Salamander`, entity `node-t3-volcanic-dungeon_monster-13`. Again, raw `isBoss=false` is superseded by the named kill plus victorious attempt and authoritative progression milestone.
- `boss-defeated` milestone at `200759ms` includes `volcanic:3`.
- Return began at `203769ms`; named return capture completed at `313016ms`.
- Return capture SHA-256: `279ae52b0c672423e1fa85fb5eb96116c03782ece01bf5af8c6f561434808e16`.
- Return capture state hash: `a122d6a9a9f823074828f05e8ac70e576a3845a51dc0c0c8f2016626a1539521`.

The authoritative boss evidence is the combined tuple of named kill, victorious `boss-attempt`, and `volcanic:3` progression. No `boss-phase` event or phase-specific HP series was emitted, so Final Eruption timing/HP behavior is unobserved and no phase conclusion is drawn.

## Stage B build, combat, and resource telemetry

The replicas temporarily used the packet’s defensive travel configuration, then restored the exact `37/38RP` Offensive/Frenzy boss configuration at the dungeon before each guardian/boss attempt. The final summary loadout after each run shows the post-return defensive travel build; it must not be used to reconstruct boss-time configuration. The `v1u2-boss-ready` captures and build-change events verify the boss-time build.

| Metric | B1 | B2 |
|---|---:|---:|
| Duration | 251036ms | 313033ms |
| Kills | 15 | 36 |
| Player damage dealt | 28486 | 44886 |
| Damage taken | 31 | 156 |
| Absorbed | 375 | 1161 |
| Healed | 408 | 1035 |
| HP lost | 31 | 151.35 |
| Incoming direct / DoT | 5 / 26 | 28 / 128 |
| Sweep / Frenzy / Hamstring activations | 15 / 7 / 12 | 28 / 7 / 10 |
| Magma Vent contacts / damage | 2 / 26 | 2 / 26 |
| Hazard escape | 1/1 | 5/5 |
| Step Back activations | 0 | 0 |
| Boss diagnostic samples | 84 | 78 |
| Boss range mean / max | 176.11 / 261.66 | 173.08 / 265.10 |
| Boss range bands: hugging / in reach / out of reach | 0.12 / 0.80 / 0.08 | 0.16 / 0.76 / 0.08 |
| Adds mean / max | 3.57 / 12 | 3.88 / 12 |
| Barrier mean fraction / recharge fraction / depleted | 0.94 / 0.05 / 0 | 0.93 / 0.05 / 0 |

Zone aggregates are retained below. As in Stage A, they do not provide an exact travel-versus-farm damage partition.

| Run | Biome | Time | `travelMs` | `fightMs` | Kills | Damage taken | Damage dealt |
|---|---|---:|---:|---:|---:|---:|---:|
| B1 | Volcanic | 173020 | 83008 | 57007 | 14 | 31 | 27898 |
| B1 | Swamp | 41008 | 41008 | 7002 | 1 | 0 | 0 |
| B1 | Sanctuary | 36435 | 8999 | 0 | 0 | 0 | 0 |
| B2 | Volcanic | 209026 | 125020 | 87004 | 26 | 51 | 38138 |
| B2 | Swamp | 67007 | 67007 | 28006 | 10 | 105 | 6748 |
| B2 | Sanctuary | 36409 | 10003 | 0 | 0 | 0 | 0 |

## Economy and attribution limits

The runs retain economy snapshots for auditability, but the evidence is not canonical economy evidence. Stage A used the packet’s synthetic `25x` reward multiplier, and Stage B inherited the restored/synthetic tier entry even at `1x`; both stages are smoke-isolated and tainted.

- A diagnostic initial-to-final delta: red `-3347`, blue `-1628`, green `+97`, yellow `+2093`, purple `+11797`; recorded final wallet was red `671`, blue `9434`, green `5369`, yellow `15373`, purple `16369` after the prescribed purchases and rewards. Recorded catalyst gains were alacrity `18`, dominion `53`, fortified `146`, heavy `29`; spending included alacrity `5`, heavy `10`, and swarming `5`.
- B1 had no spend; diagnostic gains were volcanic red `550` and Swamp purple `54`.
- B2 had no spend; diagnostic gains were volcanic red `789` and Swamp purple `448`, with recorded catalyst gains fortified `6`, heavy `2`, and swarming `1`.

The A final wallet’s red delta is deliberately not presented as a single economy rate because it includes restored progression, synthetic multiplier rewards, and prescribed item/ability preparation costs. These values must not tune costs, drop rates, or reward multipliers.

## Integrity ledger

### Sealed experiment roots

| Stage | Artifact | SHA-256 |
|---|---|---|
| A | `experiment.json` | `58d549fe404460bd9f7759f7189a92a0bd9ff57461219aa205e58800b9fe4351` |
| A | `experiment.sha256` | `16d9980a3a9e2ff83dc2ebf2ba7d6484989277c44093d21c9443c74a7dfb7b52` |
| A | `cohort-summary.json` | `89b1e62ff966de7c895fe1c9cf44bff3bf633102e85bad4739e1a39ae96d1af9` |
| A | `state.json` | `41bb3478eda603d9ea3a709e0f464e479b03a11f84a2bd6273cc47ba3352acba` |
| A | `supervisor-events.jsonl` | `140552c0b39c9e4bdd8b38521059c1bcfadf34bfad53bf2dc50c6a1d6aebab71` |
| A | `network-release.json` | `b6191456794f987a3286860b39b5343f57c40b9963bdefa2617dedc42b0c7cfe` |
| B | `experiment.json` | `133db3ed6168a06849617591e3b32882cdd64299290fc2c8771cccbfd062319e` |
| B | `experiment.sha256` | `580d9a87ae4045df8bac10e53a29f38078ebf27516f4e85295493dec58f32ca4` |
| B | `cohort-summary.json` | `114a896a70e6f3a177e98dd1d703bde525761060bdec54f36f5a904eb4b6a6aa` |
| B | `state.json` | `1df22a6f2f58ae9833d0204bdde272998ee31531b98bc1cad5e48f81e4c4fb26` |
| B | `supervisor-events.jsonl` | `06c9efea335cc5c91bbe78a43966e3a0298e08c12d0f20dbe236d1a6ed8755d0` |
| B | `network-release.json` | `306df69ae0c1a08e38e9a75937ac7d3158ed665114903869fc9997a0e0f1a2d7` |

### Nested run artifacts

| Run | Artifact | SHA-256 |
|---|---|---|
| A | `events.jsonl` | `7ea8e612706ee03ad67d98b859cfedaea60ec87da8e208d399c30df2de403453` |
| A | `summary.json` | `5f9e3b145d5f78fa51d40f1e1e2696c7111c7c0ec3bc9076d31d012ea9c686b3` |
| A | `deaths.jsonl` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| A | `snapshot-index.json` | `637e1b6b71e26b84f7c2e738a30590339ab1125710a394f6ef2da2d0314f76c3` |
| A | `checkpoint-restore.json` | `490b44878a6b8632f35baab2811663447229c70584e3190787aa84a03623d34c` |
| A | `checkpoint-v1u2-tempo-barrier-prepared.json` | `8644d3c319d244e5f69c88cb64ba8236833981a04541a99b4e0c48b2108e4be4` |
| B1 | `events.jsonl` | `74ca7926b350424272f875ab98d8d8e47b991e99c2aeb311cd52ee82db8a3d96` |
| B1 | `summary.json` | `7a20bea63c506cde513ca3f51eba70e8db143fcf45921143d0a8d60c715e3061` |
| B1 | `deaths.jsonl` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| B1 | `snapshot-index.json` | `09e6900880f980bcbe090dca73b1caff606c85be2260582981ad6b323c3614c3` |
| B1 | `checkpoint-restore.json` | `8a14eaded7bb1e5c5c1784eabf2ff0f90017e10e2d2b9704083486eead92d629` |
| B1 | `checkpoint-v1u2-boss-ready.json` | `2dcdfca8a934bfae13503a77c322ce573b562b332ddbaec11a5b06cc76d4aa65` |
| B1 | `checkpoint-v1u2-volcano-cleared-returned.json` | `49afc1c9815457e7aac5ab10580c7e917d4359ca0e365f36ec9e7b9385f9a18a` |
| B2 | `events.jsonl` | `54df230371c0fef82d0dee3625a7cb8fb990f81713f9f6069bf1816ae5fc5b97` |
| B2 | `summary.json` | `cef4f703e30689c70108f7fc59e82f7d69010a77baa444cbbb522b497a446949` |
| B2 | `deaths.jsonl` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| B2 | `snapshot-index.json` | `3bfacbba21f8c618f4aff3db50adcad2b3d8cbf85b0b4843ee69a44cdcad3e49` |
| B2 | `checkpoint-restore.json` | `2d5cd382358c19d8077d6a891f0d3a1f2c024473745b10d631c84374f3b757c6` |
| B2 | `checkpoint-v1u2-boss-ready.json` | `892910f2ef601e62c93d967aa902ebf6d2a7feba3946c17bc63473efbda59a7e` |
| B2 | `checkpoint-v1u2-volcano-cleared-returned.json` | `279ae52b0c672423e1fa85fb5eb96116c03782ece01bf5af8c6f561434808e16` |

All terminal artifacts and released-network receipts were retained. No pruning or cleanup was performed.

## Recommendation and boundary

Treat V1u2 as acceptance of the audited explicit preparation route and a replicated diagnostic Volcano clear under the existing tempo/barrier build. The result supports continuing source review or a separately scoped next experiment, but it does not authorize changing the global resolver, boss balance, reward multiplier, economy costs, or item attribution. Phase-specific boss behavior and exact activity-tagged damage remain unobserved.
