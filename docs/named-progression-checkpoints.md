# Named progression checkpoints

Development-only infrastructure for a captured progression boundary and a separately authored continuation. This extends the existing `T1CharacterSnapshot` artifact, `--tierEntrySnapshot`, route executor, authoritative player attachment, and experiment input sealing. Existing Snapshot A/B and specialized checkpoint imports retain their existing rules.

## Author a boundary

If the preceding travel ends at a gate, author `{ type: 'moveWithinNode', nodeId: 'node-t3-sanctuary', position: { x: 2400, y: 2400 } }` first. This uses ordinary movement and requires the authoritative view to confirm stationary arrival; it is not relocation during capture.

Insert `{ type: 'captureCheckpoint', boundaryId: 'pre-volcano-rested' }` after ordinary travel and recovery. Identifiers contain lowercase letters, digits and hyphens (maximum 80 characters). Each identifier can be captured once per run. Multiple names write independent `checkpoint-<name>.json` files and entries in `snapshot-index.json`. Reusing a name or artifact directory fails instead of overwriting evidence.

The step disables auto and traversal, then requests a synchronous authoritative server capture after 600ms. It does not teleport or heal the character. Capture fails unless alive, stationary, full HP, out of combat, without incoming DoT, temporary buffs, casts or environmental effects. A route must explicitly wait for those conditions; a failure is not retried automatically.

Allowed locations are an earned, visited Sanctuary (including an earlier tier's hub) or a safe point in Clearing. The actual node and point are retained. The point must be inside node boundaries, outside blocked terrain and at least 600px from every monster. Clearing has no guaranteed safe population: a fresh restore can reject its point. No monsters are deleted and no alternate location is silently selected. There is no arbitrary mid-combat or full-world replay.

## Persistent schema and normalization

The server synchronously clones the actual `TracksProgression`, `HoldsInventory`, `UsesSkills`, `HasPosition`, optional persisted `SummonsMinions`, and composed `PlayerView`. This follows the component-shaped `PersistedPlayerSlices`/`saveCharacter` schema:

- Entire progression is preserved: XP/mastery, level, unspent points, tier, seals, quest progress, visited/cleared nodes, unlocked recipes, all wallets and partial catalyst progress, learned/attuned abilities and stances, Rites and ordered Rune rules/ownership/recipes.
- Entire inventory and upgrade history is preserved, including still-valid historical upgrade entries for items no longer owned. Root/frame/range and later specialization unlocks are preserved in order.
- Character/account/socket identity is new in each run. Position node/coordinates are preserved; speed, passives, HP maximum and other derived combat stats are recomputed by normal authoritative formulas. Old computed values remain audit evidence.
- Runtime stance resets to the saved default. Auto, navigation, attacks, party, engagement, ability cooldowns, buffs, Heat/Chill, DoT, targets and transient combat markers reset. HP and ordinary barrier start full under the declared `safe-rested-v1` policy.
- Class slices use their ordinary fresh initializers and stat recalculation: no imported Energy, Cadence, execution/charge counters or other banked power. Reload readiness follows its normal initializer/recalculation. Warm-up belongs in the continuation; a restored character is not asserted to have all combat abilities precharged.
- Summoner logical slot IDs/roles are retained and checked against the authoritative class profile. Minion entities are fresh/absent at the receipt; reconstruction progress, queue, timers, target, cursors and charges reset to ordinary initial state. Allow an explicit readiness observation if an encounter requires a rebuilt formation.

The source `runtimeEvidence` and view expose normalization. A short approach must establish travel attrition or warm Heat/Chill when those are the subject of the experiment. Do not compare normalized entry to uninterrupted progression without labeling the difference.

## Author a continuation

Use a separate route containing only the remaining steps, and declare:

```ts
progressionEntry: {
  boundaryId: 'pre-volcano-rested',
  nodeId: 'node-t3-sanctuary',
  tier: 3,
  revisionPolicy: 'same-revision',
  prerequisites: [{ type: 'playerTierAtLeast', tier: 3 }, { type: 'fullyRecovered' }],
}
```

Supply exactly one named artifact through `--tierEntrySnapshot`. No directory selection, generic tier-entry template or fallback is permitted. The server requires a fresh character, checks state integrity and current progression/build definitions, validates legal placement, stages ordinary attachment/recalculation, and compares persistent readback before replacing the fresh character. The bot then checks the authoritative receipt, expected class/boundary/node/tier and prerequisites before executing the continuation.

`checkpoint-restore.json` records input SHA256, both revisions, source and actual restored state, normalized policy, inherited provenance, source route/version/policy/choices, new continuation/version/policy/choices, setup/restore timing and changed definition-hash sections. Put `measurement-start` after treatment/approach/readiness; route-step timing separates these from measurement. Header/summary retain checkpoint and inherited taints and starting wallets. Inherited catalysts are seeded as the telemetry baseline, not counted as freshly earned. Skipped preparation has unknown/inherited cost, never zero full-route cost.

The default requires the same source revision and definitions digest. To intentionally test a newer balance revision, author `revisionPolicy: 'explicit-current-revision'` on that continuation and select the newer revision in `experiment:create`. Both revisions and changed definition sections remain visible; full current-definition validation still runs. No saved skills, loadout, upgrade levels or progression are rewritten to make an old checkpoint valid. Definition sections include monster data, so a monster-only HP change is detectable without requiring the preparation again.

Treatment comes after the common restore receipt. Equipping owned items uses ordinary intents. An unowned alternative must pass an explicit `canCraft` assertion and ordinary purchase/upgrade gates and costs. No counter-gear or wallet grants are introduced by named restoration.

## Bounded real-loop demonstration

These are infrastructure demonstration routes, not new Volcano balance experiments:

1. `checkpoint-pre-volcano-capture`: imports the actual V1m Snapshot B via the existing earned-T3 path, walks through the ordinary movement intent from the legacy gate spawn to the Sanctuary center, observes two seconds of safe recovery, captures `pre-volcano-rested` and `pre-volcano-rested-second`.
2. `checkpoint-pre-volcano-baseline`: restores the first artifact and observes three seconds at the preserved safe boundary.
3. `checkpoint-pre-volcano-desert-boots`: restores that identical artifact, asserts ordinary affordability, crafts and equips T2 Desert Boots at **+0**, then observes the same three seconds. It does not inherit or grant +5 Boots.

The seed is the actual campaign artifact documented in `docs/briefs/bot-balance-v1q-operator-packet.md`, SHA256 `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144`. Its synthetic/25x origins remain inherited. The new capture is an actual server observation of a legacy-imported descendant, not a newly uninterrupted preparation run. Legacy import normalization remains discoverable in that source provenance.

From the reviewed implementation revision, in PowerShell:

```powershell
$checkpointRevision = (git rev-parse HEAD).Trim()
$checkpointSeed = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json'
pnpm experiment:create --revision=$checkpointRevision --routes=checkpoint-pre-volcano-capture --tierEntrySnapshot=$checkpointSeed --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=1 --policies=intended --maxRunMs=60000
pnpm experiment:launch --id=<returned-capture-id>
pnpm experiment:status --id=<returned-capture-id>
pnpm experiment:report --id=<returned-capture-id>
pnpm experiment:release --id=<returned-capture-id>
```

Locate `checkpoint-pre-volcano-rested.json` beneath that manifest's run artifact directory, preserve its hash, then:

```powershell
$checkpointInput = '<absolute captured checkpoint-pre-volcano-rested.json>'
pnpm experiment:create --revision=$checkpointRevision --routes=checkpoint-pre-volcano-baseline,checkpoint-pre-volcano-desert-boots --tierEntrySnapshot=$checkpointInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=1 --policies=intended --maxRunMs=60000
pnpm experiment:launch --id=<returned-restore-id>
pnpm experiment:status --id=<returned-restore-id>
pnpm experiment:report --id=<returned-restore-id>
pnpm experiment:release --id=<returned-restore-id>
```

One worker, three short runs total. Any setup incompatibility stops that case; preserve artifacts rather than fixing or retrying a frozen packet. Compare both `checkpoint-restore.json` receipts before treatment, excluding fresh identity and capture timestamps, and verify treatment purchase debits/equipped state and no prefix steps. Keep input hashes and source artifacts. Release terminal services, retain volumes/artifacts under existing campaign policy.

## Checks and remaining acceptance

Executed focused tests: named server capture/readback, T4 specialization/unspent points, ordered Rune/Rite build, summoner slots/runtime reset, two independent worlds, immutable artifacts, unsafe/corrupt/wrong-boundary/current-definition rejection, production guard, failed-stage atomicity, and actual continuation executor behavior. Existing tier-entry bootstrap and Snapshot A/B tests remain covered.

Live runner/server demonstration is deliberately delegated to command-center acceptance after integration; unit tests do not substitute for it. Its results belong in `docs/briefs/named-checkpoint-acceptance.md`. No live experiment was launched by the implementation worker.

After infrastructure acceptance, propose a separately approved short Volcano route: same rested checkpoint, ordinary swarm build preparation, explicit safe-hub approach, `measurement-start` on target arrival, up to 60 seconds of natural farming, first-death stop and bounded recovery if alive. Compare the common start before treatments. The current frozen V1q experiment is untouched, and this feature changes no gameplay values.
