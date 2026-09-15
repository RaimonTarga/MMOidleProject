# Bot Balance V1u Report — T3 tempo/barrier preparation

## Outcome

V1u Stage A was executed as one fresh, one-worker, 25x smoke-isolated preparation run and stopped at the declared first gameplay death. The run passed the Mountain mastery/blue-essence gate and safely captured `v1u-mastery-mountain`, but died during the next ordinary travel step before Jungle mastery, the earned T3 tempo/barrier kit, the final preparation checkpoint, or any Volcano boss attempt.

Stage B was not created or attempted. This is a preparation failure, not a boss result, and it does not support a new balance winner or a balance edit.

## Frozen scope and validity

- Packet: `bot-balance-v1u-operator-packet.md`, prepared 2026-09-14.
- Frozen source revision: `bbba7c2d576a43e45f2a1825abd188b25cf1b18b`, tree `0ba2f2dddc731cd730db32cbe5c5fa87715ddf33`.
- Frozen V1u commit: `Prepare earned T3 tempo and barrier Volcano validation routes` (four files, 202 insertions, one deletion). It adds the V1u route/preflight harness and does not author a balance-value change.
- Qualification artifact: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1u-preflight-qualified-20260914.json`.
- Qualification SHA-256: `562e4d6202439086865224b81e2232d1f17f214969bf991f68ea0e6807a8cfcb`.
- Qualification mode: `setup-only-with-hypothetical-earned-gates`; ticks `0`; no live execution or checkpoint was claimed by the preflight.
- V1s tier-entry input SHA-256: `db973d37bd7371212665e03d06adbb7e977fb9fa964acbd347ee49aa0944ec79`.
- The run retained the inherited V1s restore taints: `RESTORED_PROGRESSION_CHECKPOINT`, `SYNTHETIC_TIER_ENTRY`, and `NON_CANONICAL_REWARD_MULTIPLIER`.
- `canonicalAtCapture=false`, `combatEvidence=false`, `economyEvidence=false`, and `treatmentValidity=not-asserted`.

The run used the required `spirit-volcano-preparation-t3-v1u` route, version `1.0.0`, with one worker, `--maxRunMs=7200000`, first-death stop, no retry, and reward multiplier `25`. The image build and experiment lifecycle completed successfully; the broader harness/full repository suite was not treated as passing evidence.

## Experiment lifecycle

Experiment root:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t144523z-spirit-volcano-preparation-t3`

- `experiment:create` succeeded.
- `experiment:launch` succeeded with one supervisor and one worker.
- `experiment:status` reached terminal state: supervisor `completed`, run `failed`, reason `declared first-death stop`.
- `experiment:report` succeeded.
- `experiment:release` returned `already-released`; the release receipt records the network as released.
- No Stage B experiment root was created.

Run artifact directory:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t144523z-spirit-volcano-preparation-t3/runs/001-spirit-volcano-preparation-t3-v1u-intended-r01/artifacts/spirit-volcano-preparation-t3-v1u-intended-2026-09-14T14-47-25-496Z-718f4e38`

## Stage A trajectory

The route completed 10 of 76 steps before the terminal death.

| Route section | Evidence | Result |
|---|---|---|
| Travel Mountain T3 | Ordinary transit completed | Continued to Sanctuary |
| Mountain gate | `Mountain=18`, blue essence threshold met; farm step was already satisfied | Passed |
| Sanctuary recovery/capture | `v1u-mastery-mountain` captured at Sanctuary with full HP and full barrier | Passed |
| Travel Jungle T3 | Death at `node-t3-tundra-05`, `heavy`, route label `travel jungle T3` | Failed at first death |
| Jungle mastery/final GM gate | Jungle remained `6`; final GM was `96`, not the required full-route `114` | Not reached |
| Earned T3 tempo/barrier kit | No Frenzy learning, purchases, evolutions, upgrades, or equipment changes occurred | Not reached |
| Final preparation checkpoint | `checkpoint-v1u-tempo-barrier-prepared.json` was not captured | Not reached |
| Stage B boss attempts | No B1/B2 run was created | Not applicable |

The run also gained incidental transit progression before the death: Swamp reached 18 and Cave reached 18. Those levels came from ordinary route combat, not completed V1u farming gates, and should not be treated as a successful preparation sequence.

The successful named capture was:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t144523z-spirit-volcano-preparation-t3/runs/001-spirit-volcano-preparation-t3-v1u-intended-r01/artifacts/spirit-volcano-preparation-t3-v1u-intended-2026-09-14T14-47-25-496Z-718f4e38/checkpoint-v1u-mastery-mountain.json`

At capture, the player was at Sanctuary with HP `236/236`, barrier `132/132`, tier `3`, GM `96`, Mountain `18`, Swamp `18`, Cave `18`, and full recovery state. The capture had state hash `170c24f778e45d8bdea50debe3e0b154e7e625aa35326e369d286a1caa1c3839`.

## First-death evidence

The death artifact records:

- Time: `353670ms`.
- Node: `node-t3-tundra-05`.
- Biome/modifier: Tundra / `heavy`.
- Route step: index `10`, label `travel jungle T3`.
- Reported cause: non-boss Rime Caster, ranged damage `148`.
- Loadout: Ruinous Axe +5, Cave Vest T2 +5, Mountain Charm T2 +5, Desert Boots T2 +5, Tempered Core, Defensive stance.
- Max HP `236`, plating `18`, damage reduction `0.19`.
- Maximum concurrent attackers: `1`.
- Stalls: none; blocked time: `0ms`.

The nested death window also records a prior Rime Caster hit of `16` with `132` absorbed, followed by a direct `148` hit whose recorded `hpAfter` is `74.1476`. Because the artifact labels that hit as `killingBlow` while its own `hpAfter` remains positive, terminal damage sequencing is an observability issue and should not be simplified into a one-hit-kill mechanic conclusion.

## Build and progression state

No V1u preparation purchase or mutation occurred. The gear timeline records empty craft, upgrade, evolution, stance-craft, and equip arrays; essence spending is empty; and the final equipment remained the inherited V1s setup:

- Weapon: Ruinous Axe +5.
- Armor: Cave Vest T2 +5.
- Recovery/charm: Mountain Charm T2 +5.
- Mobility: Desert Boots T2 +5.
- Core: Tempered Core.
- Stance: Defensive.
- Active abilities observed: Sweep, Second Wind, Brace.
- Frenzy, Cinderlash, Accelerant, T3 Mountain armor, and T3 Mountain charm were not learned, purchased, evolved, upgraded, or equipped.

The run therefore provides no evidence about the intended Cinderlash/Accelerant tempo build, the T3 Mountain damage-reduction threshold, or the T3 charm barrier in boss combat.

## Combat and mechanic telemetry

Run-wide summary evidence:

- Kills: `16`.
- Player damage dealt: `13309`; summon damage: `0`.
- Damage taken: `331.7`; absorbed: `1144.3`; healed: `1244.3`; HP lost: `325.28`.
- Incoming damage types: direct `321.7`, DoT `10`.
- Ability activations: Sweep `28`, Second Wind `2`, Brace `1`.
- Hazard escape: `1/1` successful; Step Back activations `0`.
- Boss diagnostic samples: `0`.
- Persistent hazards: none recorded.
- Maximum combat concurrency: solo only; no samples with two or more attackers.

The largest recorded per-source totals were Rime Caster `164` and Crag Mortar `157.7`. These are preparation-route observations, not Volcano boss or Final Eruption evidence.

## Economy evidence

The synthetic 25x run is not economy evidence. For completeness, the run began with red `2873`, blue `1020`, green `5272`, yellow `13280`, purple `1522`; it ended with red `4018`, blue `11062`, green `5272`, yellow `13280`, purple `6488`. Reported gains were Mountain blue `10042`, Swamp purple `4966`, and Cave red `1145`, with catalyst gains fortified `160`, dominion `58`, and heavy `13`.

These values are retained for artifact completeness only. They must not be used to tune costs, farming rates, or reward multipliers.

## Integrity ledger

The sealed experiment and nested run artifacts were retained and hashed after terminal release.

| Artifact | SHA-256 |
|---|---|
| `experiment.json` | `ccc689730a90f4ed927816743291ba508288c1b1d843d1bfdd1c93d2dd65eba3` |
| `experiment.sha256` file | `c6cb49a4c54997da02dbd29d6f970ce5a155bb3202a6a24f42b18d3ff08c4c12` |
| `cohort-summary.json` | `3ef80b5ec615864eba2a3da285069076505715e67bbb88a72e3440fcc82ff33a` |
| `state.json` | `93e54d8d460fa6c0c7cf518d8fbb15e8ac32c2992fd81e947e46c0fd7d09e884` |
| `supervisor-events.jsonl` | `f8a3f3df05a98fa86f25fd4c0f325545a73b5927e8edadb8d479db132394fcff` |
| `network-release.json` | `9e88781bee29a043631ce67652a6b8f363432375fb68705e40336a14135ec928` |
| staged V1s input | `db973d37bd7371212665e03d06adbb7e977fb9fa964acbd347ee49aa0944ec79` |
| `checkpoint-restore.json` | `cc7e32e7c2bef393f9e2881f3a79c4bec5e17536ec94f425b581de50eb7737ea` |
| `checkpoint-v1u-mastery-mountain.json` | `b28d4db869876eaa67ea2bd4d9af796797608051f1b09634bc8af97a435bec14` |
| `events.jsonl` | `b534aebb03a2e3ab440538ad543d7b5ce7dd9ed5355baa9210095dd8d649453f` |
| `summary.json` | `c5b281e820854acd49ded7e13e401fc537674b2347ff59c2fd7a3f9f46b1cc2c` |
| `deaths.jsonl` | `7f5172b61430c485ff6758b56c396c0897d1b8d5c5071238ff969a5a804f9a16` |
| `snapshot-index.json` | `fb4df44669255bfe6865830be9cab630009bd19c2be6c157e8b830a794236235` |

The experiment manifest records `invocationDirty=true` and `dirtyWorkingTreeIncluded=false`; the pre-existing dirty worktree was preserved. No gameplay source or balance files were edited during execution. The only current-turn repository additions are this report and its README index entry.

## Disposition

Retain V1u as a sealed, non-canonical preparation failure. Before proposing another balance change, review the Jungle travel route, the heavy Tundra/Rime Caster interaction, and the death-event sequencing discrepancy. Preserve V1s as the current farming evidence and do not infer Volcano boss behavior, Final Eruption behavior, or economy conclusions from this run.
