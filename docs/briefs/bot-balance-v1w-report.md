# Bot Balance V1w Report — five remaining T3 boss screens

## Outcome

V1w completed its constrained five-case lifecycle with one sequential worker. The packet gate did not complete:

- Mountain, Cave, Desert, and Jungle each cleared every dungeon guardian, killed the named T3 boss, recorded a victorious boss attempt, and added the matching third T3 boss seal (`mountain:3`, `cave:3`, `desert:3`, or `jungle:3`). Each then failed the packet assertion `player tier >= 4`; the authoritative milestone still reported `playerTier=3`. These are verified diagnostic boss wins with an incomplete/invalid treatment handoff, not T4 results.
- Swamp cleared all six guardians, then stopped on the first death before a boss victory or `swamp:3` milestone. The death was a DoT kill from the Rot-Spore Croc-Behemoth scripted pool.
- No run reached the reverse return route. The retained `v1w-*-ready` captures are pre-departure Sanctuary checkpoints, not post-boss return captures.
- No T4 execution, skill unlock, balance edit, or automatic retry was performed. The next saved direction remains proposal-only.

The four boss wins are gameplay/encounter evidence only. Every run was `smoke-isolated`, restored a synthetic tier-entry checkpoint, and carried `RESTORED_PROGRESSION_CHECKPOINT`, `SYNTHETIC_TIER_ENTRY`, and `NON_CANONICAL_REWARD_MULTIPLIER` taints. All five summaries therefore report `canonicalAtCapture=false`, `combatEvidenceEligible=false`, and `economyEvidenceEligible=false`. V1w supplies no canonical economy result and no automatic winner.

## Frozen scope and validity

- Packet: `bot-balance-v1w-operator-packet.md`, prepared 2026-09-14.
- Frozen source revision: `d244eef2867cb4c6250c316df6c16379b11efc6b`.
- Frozen source tree: `fab39fb528bb5c7a8cf5034ee3d44e1164f4cfbf`.
- Image: `mmo-idle-experiment:d244eef2867c-d90e6996` (`sha256:b9346b72162b27916e39460375a6806c02b80dc007a13416c746f90a175c3572`).
- Input checkpoint: `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t155945z-spirit-tundra-boss-t3-v1v/runs/001-spirit-tundra-boss-t3-v1v-intended-r01/artifacts/spirit-tundra-boss-t3-v1v-intended-2026-09-14T16-01-56-200Z-8ba40748/checkpoint-v1v-tundra-cleared-returned.json`.
- Input checkpoint SHA-256: `6f849c4c5686491156fa929c54862f59a2f90b61269abd505d59fa732f4f35e1`.
- Input boundary: `v1v-tundra-cleared-returned`.
- Input persistent state hash: `ab0ca2e6bb1213492f8b2687c0e0eae915ae80e12944ad83abab79af6a28faf4`.
- Input source revision: `36d7e418056a29e18f4eb440574653ae9bd7fb50`; definitions hash: `92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`; changed definition sections: empty.
- Experiment mode: `smoke-isolated`; reward multiplier `1`; one worker; five total cases; one attempt per case; `maxRunMs=1800000`; automatic retries `0`; first-death stop; no fast retry.

The worktree contained unrelated pre-existing edits at invocation. The manifest records `invocationDirty=true` and `dirtyWorkingTreeIncluded=false`; the image used the explicit frozen revision/tree. Preflight found `5,472,595,968` free bytes on C:, below the packet's 6 GB advisory minimum. The user explicitly authorized proceeding; no prune or deletion was used, and the image build and lifecycle completed successfully.

## Experiment lifecycle

Experiment root:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t164434z-spirit-mountain-boss-t3-v1w-sp`

- The first `experiment:create` invocation was malformed by PowerShell comma parsing and sealed a one-route manifest under `20260914t164200z-spirit-mountain-boss-t3-v1w-sp`. It was never launched and produced no run evidence. It is retained for audit; no run was retried from it.
- The corrected create invocation sealed the five-route manifest above and reused the verified immutable image.
- `experiment:launch` ran B1 through B5 sequentially under one supervisor.
- `experiment:status` reached terminal state: supervisor `completed`, counts `{"failed":5}`.
- `experiment:report` succeeded and produced the cohort summary.
- `experiment:release` returned `already-released`; the root release record is `status=released` and no active experiment resources remained.

Released network: `mmoexp-a11753f93395-network`, ID `023df250f5ad0f1177a1b7c333e47e905132699fc4bf80d3b47ea7c2f39b3617`.

| Case | Artifact run directory | Duration | Route progress | Terminal status |
|---|---|---:|---:|---|
| B1 Mountain | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t164434z-spirit-mountain-boss-t3-v1w-sp/runs/001-spirit-mountain-boss-t3-v1w-intended-r01/artifacts/spirit-mountain-boss-t3-v1w-intended-2026-09-14T16-45-22-254Z-afec9220` | `247818ms` | `18/32` | `error / INVALID_TREATMENT: player tier >= 4` |
| B2 Cave | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t164434z-spirit-mountain-boss-t3-v1w-sp/runs/002-spirit-cave-boss-t3-v1w-intended-r01/artifacts/spirit-cave-boss-t3-v1w-intended-2026-09-14T16-49-48-188Z-8dea247d` | `302340ms` | `19/34` | `error / INVALID_TREATMENT: player tier >= 4` |
| B3 Swamp | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t164434z-spirit-mountain-boss-t3-v1w-sp/runs/003-spirit-swamp-boss-t3-v1w-intended-r01/artifacts/spirit-swamp-boss-t3-v1w-intended-2026-09-14T16-55-08-918Z-b12e94b9` | `190653ms` | `13/28` | `aborted / declared first-death stop` |
| B4 Desert | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t164434z-spirit-mountain-boss-t3-v1w-sp/runs/004-spirit-desert-boss-t3-v1w-intended-r01/artifacts/spirit-desert-boss-t3-v1w-intended-2026-09-14T16-58-38-205Z-cee25c2e` | `209307ms` | `18/32` | `error / INVALID_TREATMENT: player tier >= 4` |
| B5 Jungle | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t164434z-spirit-mountain-boss-t3-v1w-sp/runs/005-spirit-jungle-boss-t3-v1w-intended-r01/artifacts/spirit-jungle-boss-t3-v1w-intended-2026-09-14T17-02-26-427Z-d57d910e` | `257458ms` | `16/28` | `error / INVALID_TREATMENT: player tier >= 4` |

Resource sampling from `experiment:report` was complete for all cases: Mountain `170.5 MiB / 36.1% CPU / 22.6ms P99 / 50 samples`; Cave `170.7 MiB / 37.5% / 24.2ms / 61`; Swamp `156.5 MiB / 36.4% / 24.6ms / 39`; Desert `152.9 MiB / 39.6% / 22.9ms / 43`; Jungle `158.4 MiB / 51.0% / 24.9ms / 52`.

## Restore and builds

Each case restored the same V1v Tundra-return source checkpoint. The inherited state was GM114, Heavy Spirit/Wisp, Cinderlash T3+5, Mountain armor and charm T3+5, Desert Boots T2+5, Accelerant Core, two prior T3 seals for the relevant progression state, `playerTier=3`, and `skillPoints=0`. No purchases or unlocks were made.

All cases started from the packet's Defensive travel setup: Sweep and Hamstring; Second Wind, Brace, Cleanse, and Break Free; the prescribed travel and hazard rules; `38/38 RP`. At the target dungeon, the boss build was applied and verified before the boss attempt:

| Case | Boss stance | Techniques | Guards | RP |
|---|---|---|---|---:|
| Mountain | Offensive | Frenzy, Hamstring | Second Wind, Brace, Cleanse, Break Free | `37/38` |
| Cave | Offensive | Frenzy, Hamstring | Second Wind, Brace, Cleanse, Break Free | `37/38` |
| Swamp | Offensive | Frenzy, Sweep | Second Wind, Brace, Cleanse | `36/38` |
| Desert | Offensive | Frenzy, Hamstring | Second Wind, Brace, Cleanse, Break Free | `37/38` |
| Jungle | Offensive | Frenzy, Sweep, Hamstring | Second Wind, Cleanse | `35/38` |

The retained ready captures were all at `node-t3-sanctuary`, `307/307` HP, `196/196` barrier, `incomingDot=0`, `isDead=false`, and `skillPoints=0`:

| Case | Capture time | Capture SHA-256 | Progression state hash |
|---|---|---|---|
| Mountain | `2026-09-14T16:45:26.31Z` | `b575f26632b064864afee7ba28dd17789b06279cafd4f2aae2c6351bd4e6850b` | `b11249932764247e8b6769d536dec6eeec2e17d05bdd999012522b64b6839723` |
| Cave | `2026-09-14T16:49:52.26Z` | `f215d071b229f0a1fa11cd4c9c81d680a381c179f46381cc7c241ab74bc5f1ac` | `b11249932764247e8b6769d536dec6eeec2e17d05bdd999012522b64b6839723` |
| Swamp | `2026-09-14T16:55:12.987Z` | `c89c6b6b7a9b9f939f64d8dba266d6b38c7860475880f20e5da97cf853a18c12` | `746afcf335c87e629d7201a04143dc68fccf95d1fef63c3c33b39d476360bc28` |
| Desert | `2026-09-14T16:58:42.306Z` | `5c223639ff1a686a77119fcef19e95d41980dc313e492b1ecf8d462fb41f12d8` | `b11249932764247e8b6769d536dec6eeec2e17d05bdd999012522b64b6839723` |
| Jungle | `2026-09-14T17:02:30.672Z` | `8f014aa563c87cb3d2bf87a6ff98cb0518bd85ed8373cc7aac181625bfe7ace5` | `dbdf8ee1145eb5a1cd7fab0fcd60f3a9fd906de56d6f3d52f77b5bed8fb4040b` |

The differing ready state hashes reflect the route-specific boss-build state. No new T4 skill point was generated because every post-boss assertion observed `playerTier=3`; no skill point was spent.

## Actual outbound node traces

Times below are elapsed milliseconds from the corresponding artifact run start. All authored outbound node entries were observed. No reverse node-enter events occurred because the four post-victory runs halted at the T4 assertion and Swamp halted on death; this is an unstarted return route, not a filled-in or inferred trace.

### B1 Mountain

```text
1393   node-t3-sanctuary
16394  node-t3-swamp-05       fortified
24394  node-t3-swamp-04       dominion
41397  node-t3-desert-05       dominion
74400  node-t3-cave-05         fortified
95400  node-t3-cave-04         dominion
118401 node-t3-mountain-02     swarming
145403 node-t3-mountain-01     heavy
169411 node-t3-mountain-dungeon
```

Dungeon-arrival milestone: `169236ms`; guardian phase `172248–198269ms`; boss combat `206781–247316ms`.

### B2 Cave

```text
1388   node-t3-sanctuary
16388  node-t3-swamp-05        fortified
24395  node-t3-swamp-04        dominion
41392  node-t3-desert-05        dominion
85399  node-t3-cave-05          fortified
108402 node-t3-cave-04          dominion
130407 node-t3-mountain-02      swarming
151414 node-t3-cave-02          heavy
169414 node-t3-cave-01          alacrity
201420 node-t3-cave-dungeon
```

Dungeon-arrival milestone: `201243ms`; guardian phase `204255–241784ms`; boss combat `250292–301838ms`.

### B3 Swamp

```text
1395   node-t3-sanctuary
16398  node-t3-swamp-05        fortified
25397  node-t3-swamp-04        dominion
42400  node-t3-desert-05        dominion
85406  node-t3-desert-04        fortified
109407 node-t3-swamp-01         alacrity
132409 node-t3-swamp-dungeon
```

Dungeon-arrival milestone: `131712ms`; guardian phase `134723–153739ms`; boss phase started at `134723ms` but never produced a victorious boss-attempt end.

### B4 Desert

```text
1429   node-t3-sanctuary
16428  node-t3-swamp-05        fortified
24427  node-t3-swamp-04        dominion
41429  node-t3-desert-05        dominion
58430  node-t3-cave-05          fortified
82430  node-t3-cave-04          dominion
98431  node-t3-cave-03          swarming
116433 node-t3-desert-01        heavy
133437 node-t3-desert-dungeon
```

Dungeon-arrival milestone: `132720ms`; guardian phase `135729–163754ms`; boss combat `172263–208804ms`.

### B5 Jungle

```text
1501   node-t3-sanctuary
16504  node-t3-swamp-06        fortified
24505  node-t3-jungle-04        fortified
68510  node-t3-jungle-03        dominion
94512  node-t3-jungle-02        swarming
140524 node-t3-jungle-01        alacrity
175528 node-t3-jungle-dungeon
```

Dungeon-arrival milestone: `174885ms`; guardian phase `177895–213920ms`; boss combat `222928–256956ms`.

## Guardian, boss, and progression evidence

The packet evidence rule requires the named boss kill, a victorious `boss-attempt`, and the matching third seal together. The four successful boss screens satisfy that rule:

| Case | Guardians cleared | Named boss kill | Boss attempt | Seal milestone / T4 assertion |
|---|---|---|---|---|
| Mountain | Stone Warden x4, `172248–198269ms` | `Crag-Gorged Horn-Behemoth` at `247069ms` | `247816ms`, `victory`, HP fraction `0` | `mountain:3` at `247817ms`; boss-cleared passed, `playerTier >= 4` failed |
| Cave | Cave Sentinel x3, `204255–241784ms` | `Deep-Core Burrow-Gorger` at `301536ms` | `302339ms`, `victory`, HP fraction `0` | `cave:3` at `302340ms`; boss-cleared passed, `playerTier >= 4` failed |
| Swamp | Mire Keeper x3, Mire Hexer x2, Bog Lurker x1, `134723–153739ms` | none | no victorious end | no `swamp:3`; first-death stop |
| Desert | Dune Keeper x3, `135729–163754ms` | `Dune-Carapace Monarch` at `208716ms` | `209305ms`, `victory`, HP fraction `0` | `desert:3` at `209306ms`; boss-cleared passed, `playerTier >= 4` failed |
| Jungle | Jungle Stalker x3, Jungle Warden x3, Canopy Chameleon x3, `177895–213920ms` | `Apex Bramble-Slasher` at `256840ms` | `257456ms`, `victory`, HP fraction `0` | `jungle:3` at `257457ms`; boss-cleared passed, `playerTier >= 4` failed |

For the four wins, the raw named kill records carry `isBoss=false`; that flag is not used as the boss proof. The named entity, the victorious boss-attempt record, and the authoritative `boss-defeated` milestone are the combined evidence. The Swamp death record independently identifies `Rot-Spore Croc-Behemoth` as `isBoss=true`, but there is no boss kill, victory, or third seal in that case.

Guardian damage and boss damage remain separate:

| Case | Guardian damage by named type | Boss target damage | Boss combat duration | Run-wide damage taken / HP lost |
|---|---|---:|---:|---:|
| Mountain | Stone Warden `5191` | `12441` | `40535ms` | `0 / 0` |
| Cave | Cave Sentinel `3843` | `13161` | `51546ms` | `0 / 0` |
| Swamp | Mire Keeper `2557`; Mire Hexer `2367`; Bog Lurker `1020` | `10990` before death | no completed boss combat | `415 / 274.1` |
| Desert | Dune Keeper `5074` | `11971` | `36541ms` | `421.16 / 414.68` |
| Jungle | Jungle Warden `3632`; Jungle Stalker `10821`; Canopy Chameleon `8490` | `11743` | `34028ms` | `0 / 0` |

The four failed T4 assertions occurred immediately after the boss-defeated milestone, so the successful boss evidence is retained while the treatment remains invalid and no progression handoff is treated as complete.

## Death and counterplay telemetry

Swamp's first-death stop occurred at `190652ms` in `node-t3-swamp-dungeon`, route step `boss swamp T3`:

- Cause: DoT, `damage=55`, `stacks=3`, killer `Rot-Spore Croc-Behemoth`.
- Killing blow: `Rot-Spore Croc-Behemoth — Scripted Pool`, source `ground-zone,toxic-pool,scripted-pool`, DoT amount `15` at `190440ms`, with HP `36.19788 → 21.19788` before the death record.
- Largest recorded hit: direct `60`, with `6` absorbed, at `183234ms`.
- Dominant incoming source: Rot-Spore Croc-Behemoth, damage `376`; maximum concurrent attackers `1`.

| Case | Ability activations | Step Back attempts / successes / discarded | Generic telegraph-dodge events | Hazard contacts / escapes | Boss diagnostics: samples; range mean/max; in/out; add max; barrier mean/recharge/depleted |
|---|---|---|---:|---:|---|
| Mountain | Sweep `12`; Hamstring `22`; Frenzy `7` | `6 / 0 / 6` | `30` | `0 / 0` | `76`; `221.04 / 270.65`; `.45 / .52`; `4`; `1.00 / 0 / 0` |
| Cave | Sweep `11`; Hamstring `23`; Frenzy `8`; Cleanse `4` | `6 / 6 / 0` | `36` | `0 / 0` | `98`; `199.33 / 269.28`; `.85 / .10`; `3`; `1.00 / 0 / 0` |
| Swamp | Sweep `18`; Hamstring `9`; Frenzy `5`; Cleanse `6`; Second Wind `1`; Brace `1` | `3 / 2 / 0` | `14` | `5 / 4` raw events; summary `2 / 2` | `56`; `138.29 / 253.31`; `.37 / .16`; `6`; `.77 / .02 / .14` |
| Desert | Sweep `1`; Hamstring `11`; Frenzy `6`; Cleanse `4`; Second Wind `2`; Brace `1` | `4 / 0 / 4` | `17` | `0 / 0` | `73`; `218.01 / 267.51`; `.58 / .42`; `3`; `.68 / .11 / .15` |
| Jungle | Sweep `28`; Hamstring `28`; Frenzy `7`; Cleanse `1` | `0 / 0 / 0` | `0` | `0 / 0` | `79`; `204.84 / 284.23`; `.61 / .33`; `9`; `.85 / .10 / 0` |

The event stream contains no line named or keyed `freeze`, `shatter`, `shield`, or `boss-phase`. Generic telegraph records are not sufficient to attribute a mechanic-specific phase, and player barrier diagnostics are not evidence of a boss shield. No such claims are made here.

Desert was the closest successful screen by sampled survivability: its boss-window minimum sampled player HP fraction was `0.16428309446254` at `207449ms`. Mountain, Cave, and Jungle had no unabsorbed run-wide HP loss; Swamp died before a boss victory.

## Timing and economy boundaries

The recorder's `travelMs` and `fightMs` categories overlap. This report does not add them into a disjoint travel/fight total, and it does not infer damage totals from overlapping zone rows.

Wallet, essence, catalyst, and reward artifacts remain retained under the experiment root for reproducibility. They are not presented as economy evidence: the cases used a restored/synthetic entry, smoke isolation, and non-canonical treatment, even though the runtime reward multiplier was `1`. No economy conclusion, farming rate, or balance winner is inferred.

## Validation and source changes

Packet-specific bot/diagnostics and tier-seal preflight checks passed. The image build, sequential lifecycle, artifact report, release, and hash verification completed. The full repository suite was not run.

No source or balance file was changed for V1w. The only intended repository changes from this turn are this report and its `docs/README.md` index entry; unrelated pre-existing worktree changes were preserved.

## Integrity ledger

Root artifact hashes:

| File | SHA-256 |
|---|---|
| `experiment.json` | `1c3e5e4af2dc96b16c0c0f2118f769348ad4192a75b22ed590c3fcb0f225e6bf` |
| `experiment.sha256` | `d4c6bfbeb4a81a09c16a67b9e58b311b0a5b1b71a82591036b2cf12f6834dbac` |
| `cohort-summary.json` | `43c1bdd55ed1a459117b131a39a7b7feebae444b798ce8d8d4355b55bd534708` |
| `state.json` | `b78101bb8b7b372bea8b72950c373f7c9c9efad2ed929c460f061df876bd1a40` |
| `supervisor-events.jsonl` | `33da014f3c4f9bff873443b94b611ae626454d9f2a873577f57b632e41cc7786` |
| `network-release.json` | `c82d13f0eae2f21175c00a35b461b84ed6093dbe84f43c6d75b04e27ade1fd7c` |

Selected run-artifact hashes:

| Case | `checkpoint-restore.json` | ready checkpoint | `events.jsonl` | `summary.json` | `deaths.jsonl` |
|---|---|---|---|---|---|
| Mountain | `ae4111fb0620bce9290135457725a3c2d462f50e6df31461233e8cb3714c2bc2` | `b575f26632b064864afee7ba28dd17789b06279cafd4f2aae2c6351bd4e6850b` | `9806267d2d7f06108a18c2d861668d73b31599dc249343eed1272a869ec7631c` | `e6da9af5be0a3718087ae4729e1279df987670c305c174ccb6c122b1ae7dc0ee` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Cave | `dd7a57412e47bf94ce827b6fd89c50b8b86ac2b2371a4a55a4114b05ab403c07` | `f215d071b229f0a1fa11cd4c9c81d680a381c179f46381cc7c241ab74bc5f1ac` | `2da418024b11229a201abda25a8f0f93b487ca727998f2072efda3442b17fcc1` | `fe1c8694ecba0baf9f787817a4c73fe16df2b9105cf9feb8ce9ecbc938bfd0b4` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Swamp | `ace63bd5b2cc70540e2cb1071aec761af1648c0bda53b1fab8a76ce4fa9f5a53` | `c89c6b6b7a9b9f939f64d8dba266d6b38c7860475880f20e5da97cf853a18c12` | `48e68ec263e14140bc03dc0d2b72deacf53a15d1b25e57090cc0c12befa870c2` | `1e177ea97d563dc9786498cd3f8a555075b0e49c184405ca9da3934e5a870733` | `8b997b90081b622d1e87f5d217b43e1c2cf14bdb01fbc406bf0902d912998d0a` |
| Desert | `bd7e853e85a244ef53201947924952fdba28f442a641f1c98578b6ecdb17bed6` | `5c223639ff1a686a77119fcef19e95d41980dc313e492b1ecf8d462fb41f12d8` | `223f5dda29bd43d4007747e8ad062a7e378d3726e997357d64ad0fb78a7afe25` | `40d3110215aea643ee49ffa1026396d1fa557ddcbb3e0d2b1c71250cdcf3643c` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Jungle | `db616bd9bb9178ee98e1aa6c4ad5bbdabcf312bafc925a54fd4053e4a78d3050` | `8f014aa563c87cb3d2bf87a6ff98cb0518bd85ed8373cc7aac181625bfe7ace5` | `036e3d6b0105f789d0dab88ca6561d777909c69671e08d90c4518de0a445b911` | `975189713cd79b19ea2efe5064a89ed5c650d03dab3245c7338a3387e95222b8` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

All artifacts, including the failed treatment assertions, Swamp death, unused ready checkpoints, malformed never-launched manifest, and release record, remain retained under the experiment roots.
