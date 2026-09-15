# Bot Balance V1x Report — four-seal T4 handoff

## Outcome

V1x completed the prescribed one-character, sequential Mountain → Cave handoff. The progression gate passed end to end:

- The run started from the exact V1v Tundra-return checkpoint with the two relevant T3 seals already present: Volcano and Tundra. It kept the prescribed GM114 Heavy Spirit/Wisp build, zero purchases, zero skill unlocks, and the existing gear.
- Mountain cleared all four Stone Warden guardians, killed the named `Crag-Gorged Horn-Behemoth`, recorded a victorious Mountain boss attempt, and added `mountain:3`. The character returned to Sanctuary alive at full HP with no incoming DoT and wrote `v1x-mountain-three-seal-returned`.
- Cave then started from that recovered capture on the same character, cleared all three Cave Sentinel guardians, killed the named `Deep-Core Burrow-Gorger`, recorded a victorious Cave boss attempt, and added `cave:3`. The authoritative progression handler raised the character to T4 and granted one skill point.
- The exact reverse Cave route completed. The final `v1x-t4-unlocked-returned` capture is at T3 Sanctuary with `playerTier=4`, `skillPoints=1`, `307/307` HP, `196/196` barrier, `incomingDot=0`, and `isDead=false`. The skill point remains unspent.
- The full route completed `64/64` steps with no death, no automatic retry, no fast boss retry, no resource failure, and no source or balance edit.

This is a successful progression handoff and two-boss diagnostic result. It is not canonical combat or economy certification: the run was smoke-isolated and inherited a restored/synthetic checkpoint. The final summary therefore correctly reports `canonicalAtCapture=false`, `combatEvidenceEligible=false`, and `economyEvidenceEligible=false`. Swamp pool escape/re-entry, late-pool coverage, and DoT pressure remain unresolved and were not changed or retested here.

The run retained the exact ancestry taints `RESTORED_PROGRESSION_CHECKPOINT`, `SYNTHETIC_TIER_ENTRY`, and `NON_CANONICAL_REWARD_MULTIPLIER`; reward multiplier `1` does not remove those boundaries.

## Frozen scope and qualification

- Packet: `bot-balance-v1x-operator-packet.md`, prepared 2026-09-14.
- Frozen source revision: `4a6703f3f3a9e7dfb0d72c2a78789cffa884a1f6`.
- Frozen source tree: `464ad79a17c9fea62906dafd9ecca4971d858e91`.
- Image: `mmo-idle-experiment:4a6703f3f3a9-d90e6996`.
- Image ID: `sha256:c4c05b470653a5577d5778ef55d3ccf1e922a09c9ece16b80e8cbe60513cf6ae`.
- Build ID: `40064a82c561c9d93d1f8fa3`; tooling hash `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1`; runtime hash `f77975c67c8a759e0a1e3039f1d3ae4cbe88f42de3e691282d69202814fb700f`.
- Input checkpoint: `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t155945z-spirit-tundra-boss-t3-v1v/runs/001-spirit-tundra-boss-t3-v1v-intended-r01/artifacts/spirit-tundra-boss-t3-v1v-intended-2026-09-14T16-01-56-200Z-8ba40748/checkpoint-v1v-tundra-cleared-returned.json`.
- Input SHA-256: `6f849c4c5686491156fa929c54862f59a2f90b61269abd505d59fa732f4f35e1`.
- Input boundary: `v1v-tundra-cleared-returned`.
- Input persistent state hash: `ab0ca2e6bb1213492f8b2687c0e0eae915ae80e12944ad83abab79af6a28faf4`.
- Input source revision: `36d7e418056a29e18f4eb440574653ae9bd7fb50`.
- Input and current definitions hash: `92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.

The setup qualification artifact was `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1x-preflight-qualified-20260914.json`, SHA-256 `58e31169edb4957dc26aaf992e3304e3440c678a633c12649230a3b9bc42e735`. It is `setup-only` with `ticks=0`; it checked actual-input restoration, build legality, both authored paths, and the two/three/four-seal progression handler without exporting a gameplay checkpoint. The packet-specific bot/diagnostics TypeScript, actual-input preflight, and tier-seal checks passed.

Definition-section hashes resolved unchanged:

| Section | SHA-256 |
|---|---|
| `config` | `7827aa449db57109b4c23357f4646daf4aec59da5e49164e20aa02d6baca5355` |
| `world` | `1a43c8d6a452d25601c14e17029404c50e2da2c458e0973e18d2338d7c9cbcd0` |
| `features` | `31ca83b787038c80334757f444e52340c868c6e17c707ee2a0fdaf43ff10eedc` |
| `skills` | `2229539f310217e86392dc17a3d715b9432bd7e6422713b081221db6d4137582` |
| `items` | `0baa4525b010d3408fff0d777fffcbd8828f7c56d9cebf1f1b8026af7f011ede` |
| `recipes` | `39d3694329a9ef89700a43ff90d17a3192320936c8da0672d3dd3dbf6ef79e65` |
| `abilities` | `10cff5648352688bccb829ce1eea30df4127074bfe335ba845a893d07cf5c814` |
| `runeRecipes` | `fd39e0431224dea99cf89d0a5e9f10daf9a7359324803edc34e933f299adb46f` |
| `monsters` | `9dce216ba7959e6ce55260583b9619e6a4c1144f62d64fff23720e0cefa88698` |
| `stances` | `dff6e1ce33e51f42ad36ea437858a300fa225499c02a228d921ebd8c3f1cdaa6` |
| `rites` | `80390485796a3b51dc387a716ca7e80571b148d3334402af068c3a8185f151f9` |

The manifest recorded a dirty invocation worktree but `dirtyWorkingTreeIncluded=false`; the image used the explicit frozen revision/tree. Existing worktree changes were preserved. No checkpoint was edited.

## Experiment lifecycle

Experiment ID and artifact root:

`20260914t174337z-spirit-t4-handoff-v1x`

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t174337z-spirit-t4-handoff-v1x`

The sealed configuration was `smoke-isolated`, `full-gauntlet`, one worker, one case, intended policy, reward multiplier `1`, `maxRunMs=2700000`, `workerMemoryLimit=768m`, `fastBossRetry=false`, and `automaticRetries=0`. The route list contained exactly one `spirit-t4-handoff-v1x` route.

- `experiment:create` succeeded from the frozen revision and produced the exact one-case manifest.
- `experiment:launch` started one supervisor and one worker. The single run retained character ID `74c231c4-2dbb-40a0-ac56-724231f28d94` throughout both legs.
- `experiment:status` reached `supervisor=completed`, run status `completed`, reason `bot_completed`.
- `experiment:report` succeeded; its resource summary reported maximum worker memory `198.5 MiB`, CPU `32.7%`, and event-loop P99 `32ms`.
- `experiment:release` returned `already-released`; the root release record is `status=released` at `2026-09-14T18:00:03.168Z`.
- The experiment's Postgres and Redis containers exited with code `0`. Normal shared services remained running; no global prune, Docker restart, RAM-setting change, or destructive cleanup was used.

Released network: `mmoexp-131c8c4c9fe5-network`, Docker network ID `458aa3bf88346c0477451e0586d0610014326f0c58c488f02d31f712fcc1ad39`.

| Run artifact directory | Duration | Route progress | Terminal status |
|---|---:|---:|---|
| `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t174337z-spirit-t4-handoff-v1x/runs/001-spirit-t4-handoff-v1x-intended-r01/artifacts/spirit-t4-handoff-v1x-intended-2026-09-14T17-45-41-998Z-7289c541` | `848060ms` | `64/64` | `completed / bot_completed` |

## Resource observations

These observations keep worker cgroup memory, normal-service Docker stats, and host WSL memory separate. They do not establish a leak or reconstruct total Docker Desktop memory.

### Before launch

Timestamp: `2026-09-14T19:43:14.3852078+02:00`.

- Normal services: `mmo-logdb` healthy, `mmo-gamedb` healthy, `mmo-redis` healthy.
- Docker stats: `mmo-logdb 24.53 MiB`, `mmo-gamedb 27.28 MiB`, `mmo-redis 6.211 MiB`.
- Host process snapshot: `vmmemWSL 1726.1 MiB`; Docker backend/desktop processes were separately observed.
- C: used `920469704704`, free `78758207488` bytes (about `78.8 GB`).
- No competing experiment worker was present.

### After terminal release

Timestamp: `2026-09-14T20:00:53.1463195+02:00`.

- Normal services remained healthy.
- Docker stats: `mmo-logdb 27.28 MiB`, `mmo-gamedb 29.54 MiB`, `mmo-redis 5.945 MiB`.
- Host process snapshot: `vmmemWSL 3354.5 MiB`; this is a separate host-level observation, not worker memory.
- C: used `921521827840`, free `77706084352` bytes (about `77.7 GB`).
- No V1x experiment containers remained running; the scoped Postgres and Redis containers were exited.

## Restore, equipment, and build verification

`checkpoint-restore.json` reports the exact V1v checkpoint hash, `result.success=true`, `normalized=true`, `changedDefinitionSections=[]`, and `skippedPreparation=inherited; not earned or timed in this run`. The restored state was not counted as newly earned V1x preparation.

The common equipment remained unchanged across the run:

- GM114 Heavy Spirit/Wisp, `energy-root` / `energy-heavy` / `energy-range-far`.
- Weapon `volcanic-cinderlash` at `+5`.
- Armor `mountain-vest-t3` at `+5`.
- Recovery `mountain-charm-t3` at `+5`.
- Mobility `desert-boots-t2` at `+5`.
- Core `core-accelerant`.
- No crafts, upgrades, evolutions, stance crafts, equips, purchases, or skill unlocks occurred in the event stream.

The verified builds were:

| Phase | Stance | Techniques | Guards | RP |
|---|---|---|---|---:|
| Travel | Defensive | Sweep, Hamstring | Second Wind, Brace, Cleanse, Break Free | `38/38` |
| Mountain boss | Offensive | Frenzy, Hamstring | Second Wind, Brace, Cleanse, Break Free | `37/38` |
| Travel after Mountain | Defensive | Sweep, Hamstring | Second Wind, Brace, Cleanse, Break Free | `38/38` |
| Cave boss | Offensive | Frenzy, Hamstring | Second Wind, Brace, Cleanse, Break Free | `37/38` |
| Final returned state | Defensive | Sweep, Hamstring | Second Wind, Brace, Cleanse, Break Free | `38/38` |

## Checkpoints and continuity

All paths below are under the run artifact directory above. SHA-256 and progression state hashes are taken from the retained checkpoint files.

| Boundary | Capture path | Capture SHA-256 | Progression state hash | State at capture |
|---|---|---|---|---|
| `v1x-two-seal-ready` | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t174337z-spirit-t4-handoff-v1x/runs/001-spirit-t4-handoff-v1x-intended-r01/artifacts/spirit-t4-handoff-v1x-intended-2026-09-14T17-45-41-998Z-7289c541/checkpoint-v1x-two-seal-ready.json` | `048608a432c59769d1860f20de6a35e4f3e91a61499aafb36f0189ecd7638efa` | `b11249932764247e8b6769d536dec6eeec2e17d05bdd999012522b64b6839723` | T3, two relevant T3 seals, 0 points, Sanctuary, full HP/barrier |
| `v1x-mountain-three-seal-returned` | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t174337z-spirit-t4-handoff-v1x/runs/001-spirit-t4-handoff-v1x-intended-r01/artifacts/spirit-t4-handoff-v1x-intended-2026-09-14T17-45-41-998Z-7289c541/checkpoint-v1x-mountain-three-seal-returned.json` | `dc370b15df519640b8750b37c75ebcdfe6cfd2549be906e6e1f484522e8c7d58` | `46b661d5c9fa04a3772cc8e499a21f6c44ff23a50044c7403304a91227fafc00` | T3, Mountain added, 0 points, Sanctuary, full HP/barrier |
| `v1x-t4-unlocked-returned` | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t174337z-spirit-t4-handoff-v1x/runs/001-spirit-t4-handoff-v1x-intended-r01/artifacts/spirit-t4-handoff-v1x-intended-2026-09-14T17-45-41-998Z-7289c541/checkpoint-v1x-t4-unlocked-returned.json` | `d910df5f3950ca5f28c39ded7ce770848bf60b1566edc894de1cab20f2f4409b` | `ef6cf62d0ad91910392d1569e7b4305cbc29162792b04f9fa50c52091d370d89` | T4, Mountain and Cave added, 1 unspent point, Sanctuary, full HP/barrier |

Capture times are `2026-09-14T17:45:46.055Z`, `2026-09-14T17:52:11.070Z`, and `2026-09-14T17:59:50.047Z`, respectively. Every capture uses the frozen V1x source revision and definitions hash. The final capture is a legal T4-at-T3-Sanctuary handoff, not a T4 farming checkpoint.

## Actual route traces

Times are elapsed milliseconds from the run start. The authored route was:

`Sanctuary → swamp-05 → swamp-04 → desert-05 → cave-05 → cave-04 → mountain-02 → mountain-01 → Mountain dungeon → reverse exact path → Sanctuary → swamp-05 → swamp-04 → desert-05 → cave-05 → cave-04 → mountain-02 → cave-02 → cave-01 → Cave dungeon → reverse exact path → Sanctuary`.

### Mountain approach

```text
1386   node-t3-sanctuary
16388  node-t3-swamp-05        fortified
25393  node-t3-swamp-04        dominion
42399  node-t3-desert-05       dominion
59404  node-t3-cave-05         fortified
80407  node-t3-cave-04         dominion
97412  node-t3-mountain-02     swarming
114414 node-t3-mountain-01     heavy
136415 node-t3-mountain-dungeon
```

Mountain dungeon-arrival milestone: `135682ms`; the node-enter arrived at `136415ms`. The four-guardian phase began at `138692ms` and ended at `167720ms` with `guardianAlive=0`.

### Mountain return

```text
228436 node-t3-mountain-01     heavy
236439 node-t3-mountain-02     swarming
260448 node-t3-cave-04         dominion
277451 node-t3-cave-05         fortified
296453 node-t3-desert-05       dominion
332456 node-t3-swamp-04        dominion
349462 node-t3-swamp-05        fortified
365465 node-t3-sanctuary
```

The recovered capture was taken after Sanctuary movement/rest at `389073ms`, and its full-HP/no-DoT assertion passed at `389074ms`.

### Cave approach

The second leg began from the already occupied Sanctuary at milestone `389074ms`; no duplicate Sanctuary `node-enter` was inferred.

```text
398467 node-t3-swamp-05        fortified
407467 node-t3-swamp-04        dominion
424470 node-t3-desert-05       dominion
441469 node-t3-cave-05         fortified
460472 node-t3-cave-04         dominion
477475 node-t3-mountain-02     swarming
504478 node-t3-cave-02         heavy
525479 node-t3-cave-01         alacrity
547484 node-t3-cave-dungeon
```

Cave dungeon-arrival milestone: `546676ms`; the node-enter arrived at `547484ms`. The three-guardian phase began at `549684ms` and ended at `587704ms` with `guardianAlive=0`.

### Cave return

```text
660506 node-t3-cave-01         alacrity
684509 node-t3-cave-02         heavy
706513 node-t3-mountain-02     swarming
725516 node-t3-cave-04         dominion
744519 node-t3-cave-05         fortified
761524 node-t3-desert-05       dominion
788528 node-t3-swamp-04        dominion
805529 node-t3-swamp-05        fortified
824529 node-t3-sanctuary
```

The final Sanctuary move completed at `836385ms`, the ordinary farm/recovery step completed at `847397ms`, and the capture completed at `848051ms`, followed by the full-HP/no-DoT assertion and run end at `848060ms`. The route receipts report `64/64`; no node-enter gap was filled by inference.

## Dungeon, guardian, boss, and progression evidence

Guardian activation and boss activation are reported separately. The initial `boss-attempt` event marks the dungeon attempt envelope; the `dungeon-guard` phase is the guardian clear, and the actual boss combat interval is taken from the victorious attempt record.

| Leg | Guardian evidence | Boss combat | Named kill | Victorious attempt and seal |
|---|---|---|---|---|
| Mountain | `Stone Warden x4`, `138692–167720ms`, alive `4→0` | `176231–216266ms`, `40035ms` | `Crag-Gorged Horn-Behemoth` at `216066ms` | attempt ended `216768ms`, victory, HP fraction `0`; `mountain:3` at `216768ms` |
| Cave | `Cave Sentinel x3`, `549684–587704ms`, alive `3→0` | `595713–645741ms`, `50028ms` | `Deep-Core Burrow-Gorger` at `645343ms` | attempt ended `646241ms`, victory, HP fraction `0`; `cave:3` at `646242ms` |

For both bosses, the raw named kill record has `isBoss=false`. That flag is not used as a rejection or as sole proof. The named entity, the victorious `boss-attempt`, and the matching authoritative seal milestone are all present. Mountain's `mountain-boss-defeated` milestone reported T3; Cave's `cave-boss-defeated` milestone reported T4. The single `tier-up` event was `645343ms`, `newTier=4`, during final Cave boss resolution. The T4 assertion passed at `646242ms`.

Guardian and boss target damage remain separate:

| Leg | Guardian target damage | Boss target damage | Run-wide damage taken / HP lost |
|---|---:|---:|---:|
| Mountain | Stone Warden `6141` | Crag-Gorged Horn-Behemoth `12441` | `0 / 0` |
| Cave | Cave Sentinel `3843` | Deep-Core Burrow-Gorger `12957` | `0 / 0` |

The full run summary reports `36` kills, `59396` player damage dealt, `972` absorbed, `972` healed, `0` unabsorbed damage, and `0` HP loss. There were no deaths and `deaths.jsonl` is empty.

## Counterplay and telemetry

Across both legs the event stream recorded Sweep `27`, Hamstring `48`, Frenzy `14`, and Cleanse `5` activations. Cleanse removed `slow` four times and `antiheal` once. Step Back recorded `12` attempts, `5` successes, `7` discarded attempts, and `0` damage received. There were `64` generic telegraph-dodge events, no persistent hazard at terminal capture, and no hazard-escape events.

Boss-window diagnostics across both boss attempts:

- `174` samples; range samples `86`; mean distance `207.04`; maximum distance `267.09`.
- In-range fraction `.71`; out-of-range fraction `.27`; hugging fraction `.02`.
- Mean other-entity count `.91`; maximum `4`.
- Player barrier diagnostic mean fraction `1.00`; recharging fraction `0`; depleted fraction `0`.

No event line was named `freeze`, `shatter`, or `boss-phase`. The only `shield` text in the event stream was the unlocked T4 recipe ID `mountain-charm-t4-shieldmend`, not boss-shield telemetry. Player barrier diagnostics are not evidence of a boss shield. No mechanic-specific phase claim is made.

## Economy boundary and next decision

The run used reward multiplier `1`, but it inherited a restored/synthetic progression checkpoint and remained smoke-isolated. Wallet, essence, catalyst, and biome-reward artifacts are retained for reproducibility only; no farming rate, canonical economy result, or balance winner is inferred. The run made no purchases, crafts, upgrades, or skill unlocks.

The final handoff is ready for the next separately authorized preparation pass: normal Voidwalker unlock (`energy-heavy-t3-a`) while retaining ranged Wisp and the attack-speed strategy, followed by T4 travel/farming qualification and affordable upgrades. This operator run stopped after the required T4 return and did not launch that follow-on. Swamp T3 remains explicitly open for human playtest and a focused follow-up.

## Integrity ledger

Root artifact hashes:

| File | SHA-256 |
|---|---|
| `experiment.json` | `2508edf43512d151c94291a00966d0cb048614fbe5177f926f8a19f567af3b1c` |
| `experiment.sha256` | `8d9e4f6419a94ecf0e4f0d114b722f62adc989694eb40946a8b4c2c1eefe9cdc` |
| `cohort-summary.json` | `77ccd7ba640571549af96dfd91430f66b78b316b67d751e4f98a337aefd49f28` |
| `state.json` | `0dab73d108de12662a67eba7c3c8f3a2af845380eaf074d1d8d84748bf067e08` |
| `supervisor-events.jsonl` | `7be02c32c1d9fd573135fb02e92992698bbc11e45ec0b7aaae832ae9771c8120` |
| `network-release.json` | `94f2ff594179053a2c72a4714f4a952e0cbe0d6e6596205dc09c86145c32824b` |

Run artifact hashes:

| File | SHA-256 |
|---|---|
| `checkpoint-restore.json` | `669238e8001c45150fd881c1a892927e522f68e88e6f5a9ae4f6f52bcb32af0d` |
| `events.jsonl` | `93ffb21abc01b1eb6d52f704c5a824f80b5af7f62beaf39384b5a7ab78e6e579` |
| `summary.json` | `57ab0a479e7a171cd4575814493c05065097fc96161abe23567efe98e92d8176` |
| `deaths.jsonl` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `resource-samples.jsonl` | `206a4351d3b783502856d9bd77c24501f2096cbed2e6a6d7aaa0447b039734b9` |

All captures, restore records, route events, summaries, resource samples, and the released experiment network record remain retained under the experiment root. No pre-departure capture was promoted as the final handoff; the final T4 returned capture is the authoritative V1x deliverable.
