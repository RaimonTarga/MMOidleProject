# Bot Balance V1v Report — Tundra boss validation with Cleanse and Break Free

## Outcome

V1v completed the constrained Tundra validation prescribed by the operator packet.

- B1 and B2 both completed the audited Sanctuary → Tundra route, cleared all three Tundra guardians, produced the named `Frost-Plated Rime-Mammoth` kill, recorded a victorious Tundra boss attempt, added authoritative `tundra:3` progression, and returned to Sanctuary.
- Both runs finished with no deaths. The returned captures show `307/307` HP, `196/196` barrier, no incoming DoT, and `isDead=false`.
- The two replicas used the same restored Volcano-return entry state and each paid the prescribed `190` blue to learn `Break Free` before departure. The two named `v1v-tundra-ready` captures have the same progression state hash.
- This is a successful Tundra beatability and two-replica replication result. It is diagnostic gameplay evidence only: the cohort is smoke-isolated, inherits a restored/synthetic tier entry, and is non-canonical. It does not establish a canonical economy result, all-class viability, or a balance winner.
- No gameplay, balance, or source-definition change was made for V1v. The first chronological returned Tundra capture, B1, remains the retained progression input for later work.

## Frozen scope and validity

- Packet: `bot-balance-v1v-operator-packet.md`, prepared 2026-09-14.
- Frozen source revision: `36d7e418056a29e18f4eb440574653ae9bd7fb50`.
- Frozen source tree: `562f8d37723846e5f965c504b04caf145d7f6ec3`.
- Image: `mmo-idle-experiment:36d7e418056a-d90e6996` (`sha256:bae5d394461670f0c2617ec20ecc89bb91e5f5d6c760fa0547e35d5e623de2b6`).
- The invocation observed unrelated pre-existing worktree edits (`invocationDirty=true`), but `dirtyWorkingTreeIncluded=false`; the image was built from the explicit frozen revision/tree.
- Input checkpoint: `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t152219z-spirit-volcano-tempo-barrier-t/runs/001-spirit-volcano-tempo-barrier-t3-v1u2-intended-r01/artifacts/spirit-volcano-tempo-barrier-t3-v1u2-intended-2026-09-14T15-23-06-975Z-31d17012/checkpoint-v1u2-volcano-cleared-returned.json`.
- Input checkpoint SHA-256: `49afc1c9815457e7aac5ab10580c7e917d4359ca0e365f36ec9e7b9385f9a18a`.
- Input boundary: `v1u2-volcano-cleared-returned`; input persistent state hash: `42f98812fbec456349ca387249b89eefd300ff89d48c02e1279b78b391719fb5`.
- Input definitions hash: `92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.
- Qualification artifact: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1v-preflight-20260914.json`.
- Qualification artifact SHA-256: `99034e9ab8e403fe1904e34ebfdbed5e055e56f514340dc0ed91c3970b4c31a2`.
- Route: `spirit-tundra-boss-t3-v1v`, version `1.0.0`, one worker, two runs, ordinary `intended` policy, reward multiplier `1`, `maxRunMs=1800000`, no automatic retries, no fast boss retry.
- All runs retained `RESTORED_PROGRESSION_CHECKPOINT`, `SYNTHETIC_TIER_ENTRY`, and `NON_CANONICAL_REWARD_MULTIPLIER` taints. Both summaries report `canonicalAtCapture=false`, `combatEvidenceEligible=false`, and `economyEvidenceEligible=false`.

The packet-specific bot/diagnostics TypeScript pass and Tundra ability-control tests passed during preflight. The experiment image build, lifecycle, route assertions, and terminal artifact generation also completed successfully. The full repository suite was not run.

## Experiment lifecycle

Experiment root:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t155945z-spirit-tundra-boss-t3-v1v`

- `experiment:create` succeeded with the frozen revision/tree and exact input SHA.
- `experiment:launch` succeeded with one supervisor and one worker active at a time.
- `experiment:status` reached terminal state: supervisor `completed`, `2/2` runs `bot_completed`.
- `experiment:report` succeeded and produced `cohort-summary.json`.
- `experiment:release` completed; the follow-up release check returned `already-released`.
- Released network: `mmoexp-d6b4dc5c92fb-network`, ID `af2f44ad07c21f2ce471b18ab6a459efc20046665af956bd3c7e11e139b0c665`.
- No active experiment resources remained after release.

| Replica | Run artifact directory | Artifact duration | Terminal status |
|---|---|---:|---|
| B1 | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t155945z-spirit-tundra-boss-t3-v1v/runs/001-spirit-tundra-boss-t3-v1v-intended-r01/artifacts/spirit-tundra-boss-t3-v1v-intended-2026-09-14T16-01-56-200Z-8ba40748` | `444136ms` | `completed / bot_completed` |
| B2 | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t155945z-spirit-tundra-boss-t3-v1v/runs/002-spirit-tundra-boss-t3-v1v-intended-r02/artifacts/spirit-tundra-boss-t3-v1v-intended-2026-09-14T16-09-39-122Z-ec9b5b81` | `449639ms` | `completed / bot_completed` |

The supervisor ran B1 first and handed off to B2 only after B1 reached its terminal state. Both run summaries report route completion `35/35`, `treatmentValidity=valid`, no overlaps, no fallbacks, no lease contamination, and `maxConcurrency=1`.

## Restore, preparation, and build verification

Both replicas restored the exact V1u2 Volcano-return checkpoint:

- `checkpoint-restore.success=true`.
- Input checkpoint hash was `49afc1c9…9a18a` in both restore records.
- Restored state hash was `42f98812…19fb5` in both restore records.
- Restored revision was `36d7e418056a29e18f4eb440574653ae9bd7fb50`.
- Restored definitions were `92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.
- `changedDefinitionSections` was empty and the restore was normalized.
- The inherited preparation was explicitly marked `skippedPreparation`; it was not counted as earned in V1v.

The packet-prescribed preparation was identical in both replicas. Each run learned `Break Free` through the named route step `learn break-free (guard)`, with the same `381–885ms` route-step interval and a `190` blue wallet change (`9434 → 9244`). The event stream has no standalone purchase record, so the cost is reported from the before/after wallet snapshots rather than inferred from a missing event.

| Verified build | Stance | Techniques | Guards | Other rules | RP |
|---|---|---|---|---|---:|
| Travel | Defensive | Sweep, Hamstring | Second Wind, Brace, Cleanse, Break Free | Avoid Enemies, Fight Back | `38/38` |
| Tundra boss | Offensive | Frenzy, Hamstring | Second Wind, Brace, Cleanse, Break Free | Auto-path enemy; Step Back inside telegraphs; in-combat orbit; avoid hazards; wait for regen | `37/38` |

The common equipment was Heavy Spirit/Wisp, GM114, Cinderlash T3+5, Mountain armor T3+5, Mountain charm T3+5, Desert Boots T2+5, and Accelerant Core. The boss-time build was verified at dungeon arrival before the attempt; the final post-return summary correctly shows the travel build, so the boss-time event is the authoritative build record for this section.

Named ready captures:

| Replica | Capture path | Capture SHA-256 | Progression state hash |
|---|---|---|---|
| B1 | `.../runs/001-spirit-tundra-boss-t3-v1v-intended-r01/artifacts/spirit-tundra-boss-t3-v1v-intended-2026-09-14T16-01-56-200Z-8ba40748/checkpoint-v1v-tundra-ready.json` | `0dd24e6de11b7da58847c7dec9aa63dc693ebda49438b67cb1b12f7c04a4d226` | `93dc63ce61ce9e1ff2b3f415ed55ba272f35f6608c7cc65a180499aeade15ee1` |
| B2 | `.../runs/002-spirit-tundra-boss-t3-v1v-intended-r02/artifacts/spirit-tundra-boss-t3-v1v-intended-2026-09-14T16-09-39-122Z-ec9b5b81/checkpoint-v1v-tundra-ready.json` | `239a19d668d16254bbb55e8f7503b0d0c00dc84688a5010beb338cd3f12f1575` | `93dc63ce61ce9e1ff2b3f415ed55ba272f35f6608c7cc65a180499aeade15ee1` |

Both ready captures show GM114, known/equipped `Break Free`, the expected equipment, boss-time Offensive `37/38` configuration, `307/307` HP, `196/196` barrier, zero incoming DoT, and `isDead=false`.

## Audited route

The intended outbound route and exact reverse return were:

`node-t3-sanctuary` → `node-t3-swamp-05` → `node-t3-swamp-04` → `node-t3-desert-05` → `node-t3-cave-05` → `node-t3-cave-04` → `node-t3-mountain-02` → `node-t3-mountain-01` → `node-t3-mountain-05` → `node-t3-tundra-dungeon` → reverse exact order → `node-t3-sanctuary`.

There was no Volcano or ordinary Tundra transit. The route receipts completed `35/35` in both replicas.

### B1 node-enter trace

Elapsed milliseconds are relative to the artifact run start. Modifier is shown where the node-enter event supplied one.

```text
1382    node-t3-sanctuary
16385   node-t3-swamp-05           fortified
28387   node-t3-swamp-04           dominion
45388   node-t3-desert-05          dominion
62389   node-t3-cave-05            fortified
85392   node-t3-cave-04            dominion
102394  node-t3-mountain-02        swarming
128396  node-t3-mountain-05        heavy
150396  node-t3-tundra-dungeon
288418  node-t3-mountain-05        heavy
312423  node-t3-mountain-01        heavy
330424  node-t3-mountain-02        swarming
351430  node-t3-cave-04            dominion
368430  node-t3-cave-05            fortified
385435  node-t3-desert-05          dominion
402435  node-t3-swamp-04           dominion
419437  node-t3-swamp-05           fortified
420437  node-t3-sanctuary
```

The B1 route receipt for `travel node-t3-mountain-01` completed at `102653–127677ms`, but no separate node-enter event was emitted for that waypoint. The route receipt and the following `mountain-05` enter are retained rather than fabricating a missing event.

### B2 node-enter trace

```text
1381    node-t3-sanctuary
16381   node-t3-swamp-05           fortified
25382   node-t3-swamp-04           dominion
42385   node-t3-desert-05          dominion
59384   node-t3-cave-05            fortified
82389   node-t3-cave-04            dominion
99395   node-t3-mountain-02        swarming
134401  node-t3-mountain-01        heavy
136401  node-t3-mountain-05        heavy
156401  node-t3-tundra-dungeon
298410  node-t3-mountain-05        heavy
315412  node-t3-mountain-01        heavy
333409  node-t3-mountain-02        swarming
354411  node-t3-cave-04            dominion
371411  node-t3-cave-05            fortified
391410  node-t3-desert-05          dominion
408411  node-t3-swamp-04           dominion
425418  node-t3-sanctuary
```

The B2 return receipt for `travel node-t3-swamp-05` completed, but its separate return node-enter event was not emitted before the Sanctuary enter. This is the same recorder limitation pattern: route receipts are authoritative for authored-step completion, while node-enter telemetry is an observation stream and is not filled in by inference.

## Dungeon, guardians, boss, and return evidence

The packet required the named kill, a victorious `boss-attempt`, and `tundra:3` progression together. All three are present in both replicas. The raw named-kill records incorrectly carry `isBoss=false`; the named entity, victorious boss-attempt record, and authoritative `boss-defeated` milestone are the combined evidence used here.

| Replica | Guardian attempt | Guardian clear | Boss combat | Boss attempt result | Return capture |
|---|---|---|---|---|---|
| B1 | `153211ms`, 3 alive | `153211–191252ms`, 0 alive | `200260–283329ms` | `283830ms`, `victory`, `bossHpFraction=0` | `444114ms` |
| B2 | `158714ms`, 3 alive | `158714–196241ms`, 0 alive | `205251–280811ms` | `281312ms`, `victory`, `bossHpFraction=0` | `449619ms` |

Guardian and boss targeting evidence:

- B1 killed three named `Frost Warden` guardians at `166964`, `174972`, and `190785ms`; aggregate Frost Warden target damage was `5360`.
- B2 killed three named `Frost Warden` guardians at `172479`, `180686`, and `195895ms`; aggregate Frost Warden target damage was `5360`.
- B1 killed `Frost-Plated Rime-Mammoth` at `282872ms`, entity `node-t3-tundra-dungeon_monster-4`; boss target damage was `12966`.
- B2 killed `Frost-Plated Rime-Mammoth` at `280541ms`, entity `node-t3-tundra-dungeon_monster-4`; boss target damage was `12963`.
- B1 `boss-defeated` was emitted at `283831ms`; B2 at `281313ms`. Each milestone includes `tundra:3`.
- Return started at `286845ms` in B1 and `284322ms` in B2. Each run then completed the exact reverse route and captured its named returned checkpoint.

The boss target damage is reported separately from the three-guardian aggregate. It is not combined with travel or zone timing into a new total.

## Counterplay and survivability telemetry

| Metric | B1 | B2 |
|---|---:|---:|
| Sweep activations | 12 | 11 |
| Hamstring activations | 29 | 27 |
| Frenzy activations | 12 | 11 |
| Cleanse activations | 14 | 11 |
| Break Free activations | 2 (`257051`, `274062ms`) | 3 (`236516`, `253522`, `270533ms`) |
| Cleanse removed `tundra-chill` | 23 | 19 |
| Cleanse removed `antiheal` | 1 | 0 |
| Step Back attempts / successes | 8 / 7 | 6 / 6 |
| Step Back discarded | 1 | 0 |
| Generic telegraph-dodge events | 47 | 36 |
| Deaths | 0 | 0 |

All Step Back attempts recorded zero damage received. Persistent hazards were empty at terminal capture, and the route reported no hazard-escape event because no hazard escape was required (`0/0`).

The recorder does not expose a complete named Chill-stack time series. The Cleanse `removedEffects` fields are direct evidence of `tundra-chill` removal. It emitted no event named or keyed `freeze`, `shatter`, `shield`, or `boss-phase` in either run. Generic telegraph-dodge events had empty `trackedTelegraphIds`, so they cannot be attributed specifically to Deep Freeze or Shatter. Player barrier diagnostics are not evidence of a boss shield; the required boss-shield state/phase is unobserved.

Boss-window sampled HP and barrier diagnostics:

- B1 sampled boss-window HP remained at `1.0` fraction; run-wide top-level combat telemetry reports `totalDamageTaken=0` and `hpLost=0`, with `absorbed=482` and `healed=482`.
- B2 sampled boss-window HP reached `0.8827361563517915` at `242408ms` (about `271/307` HP); run-wide top-level combat telemetry reports `totalDamageTaken=36`, `hpLost=36`, `incomingDirect=36`, `absorbed=597`, and `healed=636`.
- Exact minimum player barrier was not emitted. B1 barrier diagnostics had mean fraction `1.0`, `depleted=0`; B2 had mean fraction `0.95`, `recharging=0.03`, `depleted=0.03`.
- B1 boss diagnostics had `131` samples, range samples `96`, mean range `198.34`, maximum `263.35`, in-range fraction `0.79`, and add-count maximum `3`.
- B2 had `122` samples, range samples `89`, mean range `201.11`, maximum `246.74`, in-range fraction `0.73`, and add-count maximum `3`.

B1 has a recorder discrepancy worth preserving: its Tundra zone row separately reports `damageTaken=36`, while the run-wide combat totals report zero unabsorbed damage and zero HP loss. The report does not reinterpret that zone value as a second exact incoming-damage total. The safe conclusion is that B1 ended at full HP with no death; B2 incurred the explicitly reported `36` HP loss and still completed the boss and return.

## Returned progression captures

| Replica | Capture path | Capture SHA-256 | Capture time | State hash | Terminal state |
|---|---|---|---|---|---|
| B1 | `.../runs/001-spirit-tundra-boss-t3-v1v-intended-r01/artifacts/spirit-tundra-boss-t3-v1v-intended-2026-09-14T16-01-56-200Z-8ba40748/checkpoint-v1v-tundra-cleared-returned.json` | `6f849c4c5686491156fa929c54862f59a2f90b61269abd505d59fa732f4f35e1` | `2026-09-14T16:09:20.322Z` | `ab0ca2e6bb1213492f8b2687c0e0eae915ae80e12944ad83abab79af6a28faf4` | GM114, `tundra:3`, `307/307` HP, `196/196` barrier |
| B2 | `.../runs/002-spirit-tundra-boss-t3-v1v-intended-r02/artifacts/spirit-tundra-boss-t3-v1v-intended-2026-09-14T16-09-39-122Z-ec9b5b81/checkpoint-v1v-tundra-cleared-returned.json` | `f522613767328842ab9bf7a19b0edf47a6b8e464af8bbb132f28b08b973576ca` | `2026-09-14T16:17:08.748Z` | `2be440a0adda21d04f9e679c9cc59ec7585041e8259db2d416edd29a3eb238c7` | GM114, `tundra:3`, `307/307` HP, `196/196` barrier |

Both returned captures report `incomingDot=0`, `isDead=false`, the same GM114 and tier progression, and the original restored/synthetic source taints. The differing post-boss state hashes are expected because each independent run produced its own progression capture.

## Zone telemetry

The recorder exposes `time`, `travelMs`, and `fightMs` by biome, but it does not attach every damage event to a route activity. `travelMs` and `fightMs` are overlapping recorder categories, not additive partitions; no travel/fight damage total is reconstructed.

### B1

| Biome | Time | `travelMs` | `fightMs` | Kills | Damage taken | Damage dealt | Essence |
|---|---:|---:|---:|---:|---:|---:|---|
| Sanctuary | 40384 | 9001 | 0 | 0 | 0 | 0 | — |
| Swamp | 43010 | 43010 | 0 | 0 | 0 | 0 | — |
| Desert | 34001 | 34001 | 0 | 0 | 0 | 0 | — |
| Cave | 77010 | 77010 | 6002 | 2 | 0 | 1704 | red 96 |
| Mountain | 111014 | 111014 | 29005 | 10 | 0 | 7840 | blue 433 |
| Tundra | 142009 | 13998 | 90010 | 4 | 36 | 18323 | blue 383 |

### B2

| Biome | Time | `travelMs` | `fightMs` | Kills | Damage taken | Damage dealt | Essence |
|---|---:|---:|---:|---:|---:|---:|---|
| Sanctuary | 39386 | 8001 | 0 | 0 | 0 | 0 | — |
| Swamp | 47006 | 47006 | 3000 | 1 | 0 | 552 | purple 29 |
| Desert | 34003 | 34003 | 0 | 0 | 0 | 0 | — |
| Cave | 74009 | 74009 | 5002 | 1 | 0 | 1211 | red 69 |
| Mountain | 111014 | 111014 | 24002 | 10 | 0 | 7785 | blue 458 |
| Tundra | 138021 | 1000 | 97016 | 4 | 0 | 18326 | blue 383 |

These zone rows remain descriptive telemetry. They must not be added to the run-wide totals as though their timing fields were disjoint.

## Diagnostic wallet and catalyst audit

The Stage B wallets are recorded for reproducibility, not as economy evidence. Both runs began from the same restored wallet: red `1221`, blue `9434`, green `5369`, yellow `15373`, purple `16423`; catalysts alacrity `50`, heavy `63`, swarming `41`, dominion `128`, fortified `329`.

| Replica | Final essence wallet | Final catalysts | Measured route gains | Spend observed |
|---|---|---|---|---|
| B1 | red `1290`, blue `10085`, green `5369`, yellow `15373`, purple `16452` | alacrity `50`, heavy `67`, swarming `43`, dominion `128`, fortified `331` | red `69`, blue `841`, purple `29`; fortified `2`, swarming `2`, heavy `4` | `190` blue Break Free learn before departure |
| B2 | red `1317`, blue `10060`, green `5369`, yellow `15373`, purple `16423` | alacrity `50`, heavy `64`, swarming `46`, dominion `128`, fortified `331` | red `96`, blue `816`; fortified `2`, swarming `5`, heavy `1` | `190` blue Break Free learn before departure |

No economy conclusion is drawn. The reward multiplier was `1`, but the experiment was still smoke-isolated and entered through a restored/synthetic progression checkpoint, so the summaries correctly keep economy eligibility false.

## Integrity ledger

Root artifact hashes:

| File | SHA-256 |
|---|---|
| `experiment.json` | `63c1d0579f602b34989ae9eaa67d4d22a5e7a567273c94c43196f080fca0936c` |
| `experiment.sha256` | `c4199e61a5cf0d53fefa8a1956a87849d54d562ab4a04b7abc06264fd3c9d91f` |
| `cohort-summary.json` | `78aeda6ee1d2422214e86bf2ecb340c364ab1eb58b9465a74b709a0356cb9a99` |
| `state.json` | `14c00a5f102b9bdffadb48a6c43cc0ee0287de08388e2a4f376b3effeacf2356` |
| `network-release.json` | `13e1684062d9bab7996b5300fcd172dddb677771bcf3e2a014ae9e340dad2c57` |

Selected run-artifact hashes:

| Replica | `checkpoint-restore.json` | `events.jsonl` | `summary.json` | `deaths.jsonl` |
|---|---|---|---|---|
| B1 | `622e6e666aa6a3f78e75346be5dcf766f4fa1ed83bf8296f711dbdaa224b0ccd` | `da1a8cf915aaf11dd31083885dcdafe3d76586eab43f6b69266775fa1d2f4353` | `265c4a515977d56a9d8be0ddf53cd2617274be31469f674bdd7ae05bc6c167af` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| B2 | `d8edff7d2ef6f4119d4f3df3ee12b0def18714dc9a9e0d700332cb98972934a4` | `a203c1cb470b12c69e740bf56fe11d2481283382ff3896b6bc6d5da0a40da014` | `0f3aff9dda60451be8d24ea5f59913358ecf1fa833e6403cbeb70dcd20d36ed7` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

Named capture hashes are listed in the preparation and returned-capture sections above. All run directories, event streams, summaries, snapshots, resource samples, and release records remain retained under the experiment root.

## Decision

V1v passes its declared gate: one eventual Tundra win establishes beatability for this fixed Heavy Spirit/Wisp configuration, and two independent wins add replication. The result supports carrying forward the first chronological returned B1 checkpoint for the next explicitly authored experiment.

It does not support a balance edit, a class-wide conclusion, a canonical economy claim, or a conclusion about Deep Freeze/Shatter/boss-shield telemetry that the recorder did not expose.
