# V1u2 - Resume preparation with audited travel

Prepared 2026-09-14; **not launched**. User launches Luna. Read CLAUDE.md.
This packet supersedes V1u execution instructions; V1u remains immutable history.
One preparation run, then only after success two independent boss attempts.
No balance changes, adaptive retries, manual steering or further experiments.

## Diagnosis

V1u died in Tundra while instructed to travel to Jungle. The authored biome
`pick: first` selects the first numbered node, not the nearest. Jungle-01 is
five hops from Sanctuary along the ordinary shortest path, through Tundra-05,
Cave-06 and Tundra-03. Jungle-05 is directly adjacent to Sanctuary. The trace
matches that unnecessary outbound route until death. This is an Astra route
selection error; the pathfinder was following the requested destination.

The resolver already documents this exact risk. Future preparation review must
check the actual destination, intermediate nodes and reverse path, not just
purchases/RP. Do not silently change the global meaning of first for frozen
experiments. Shortest-hop distance alone also does not guarantee safer terrain.

V1u saved a safe checkpoint before the failed trip: GM96, Mountain/Swamp/Cave18,
full HP/barrier, unchanged V1s gear and no V1u purchases. Reuse that exact state;
incidental earned mastery is legitimate diagnostic progression, not proof of
successful farming gates or canonical economy. The intended boss kit was never
tested. Rime Caster's 148 terminal damage and a positive-HP earlier trace entry
must not be described as a confirmed one-shot or a Volcano failure.

## Frozen source/input

Revision `0275d223b1bf3a86ad816a72df27bfe8a4523eb6`.
Tree `ed4cf12c1ce6ff41dae3a853c0e5df3f20da4265`.

```powershell
$v1u2Revision = '0275d223b1bf3a86ad816a72df27bfe8a4523eb6'
$v1u2Input = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t144523z-spirit-volcano-preparation-t3/runs/001-spirit-volcano-preparation-t3-v1u-intended-r01/artifacts/spirit-volcano-preparation-t3-v1u-intended-2026-09-14T14-47-25-496Z-718f4e38/checkpoint-v1u-mastery-mountain.json'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1u2Input
```

SHA256 `b28d4db869876eaa67ea2bd4d9af796797608051f1b09634bc8af97a435bec14`.
Boundary `v1u-mastery-mountain`; state hash
`170c24f778e45d8bdea50debe3e0b154e7e625aa35326e369d286a1caa1c3839`.
Restore uses explicit-current-revision; expect definitions hash
`92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`
and no changed definition sections. Retain all ancestral synthetic-entry,
checkpoint-restore and 25x taints; never edit the snapshot or grant progression.

## A - Three remaining mastery legs, equipment between legs

Route `spirit-volcano-preparation-t3-v1u2`, version1.0.0. One worker/one run,
25x smoke-isolated, no retries, first-death stop, maximum90 minutes.
Whole packet ceiling180 minutes including setup; require150 minutes remaining
before A and50 before B. Otherwise retain artifacts and stop.

Explicit paths below are followed hop by hop and reversed for return:

| Leg | Outbound nodes after Sanctuary | Goal |
|---|---|---|
| Jungle | jungle-05 | Jungle12, then return |
| Desert | swamp-05, swamp-04, desert-05 | Desert12, then return |
| Tundra | swamp-06, tundra-05 | Tundra6, then return |

All names use `node-t3-` prefixes. No Tundra transit for Jungle or Desert.
Do not replace these waypoints with one long navigate or another biome node.
Tundra is intentionally tested only on its own leg, after equipment preparation.
Travel uses Sweep/Hamstring/Second Wind/Brace, Defensive stance and the existing
Avoid Enemies/Fight Back travel rules, **32RP**, legal at the restored GM96.
Farming uses the existing 31RP pursuit build. No engine or Rune behavior changed;
Avoid Enemies reduces exposure but cannot guarantee no ranged hit.

After Jungle, GM102: perform the original ordinary Frenzy/Cinderlash/Accelerant
purchases and Mountain armor/charm evolutions, with the new T3 items upgraded
to **+3** immediately. Keep Desert Boots T2+5. Capture `v1u2-intermediate-kit`.
After Desert, GM108: upgrade those three items to **+4** before Tundra, recover
and capture `v1u2-pre-tundra-upgraded`. After Tundra, GM114: finish **+5**, recover,
configure the original 37/38RP Offensive/Frenzy boss build and capture
`checkpoint-v1u2-tempo-barrier-prepared.json`. No boss attempt in A.

Each returned mastery leg also captures its own checkpoint. No refarming already
mastered Mountain/Swamp/Cave or extra essence farming is planned: actual retained
wallet/catalysts cover all purchases without modeled currency grants. Actual
farm rewards may add more. Thirty-minute farm caps and first-death stop remain.
Per-hop travel uses existing executor behavior; global cap is authoritative.

```powershell
pnpm experiment:create --revision=$v1u2Revision --routes=spirit-volcano-preparation-t3-v1u2 --tierEntrySnapshot=$v1u2Input --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=5400000
```

Require successful completion, no deaths, full HP/noDoT at Sanctuary center,
GM114, Cinderlash/Mountain armor/Mountain charm all T3+5 and equipped,
Accelerant/Desert Boots, legal boss build, earned Wisp retained, eight original
boss clears and no `volcanic:3`. Failure stops this packet; no automatic resume.

## B - Original boss question, two fresh replicas

Only after A passes: find its single final checkpoint via snapshot-index.json.
Record absolute path, SHA256, source/definitions/state hashes and ancestry.
Never substitute an intermediate or a boss-return checkpoint. Same-revision
restore is required. Both replicas must start from identical persistent state.

```powershell
$v1u2Prepared = '<verified-absolute-path-to-checkpoint-v1u2-tempo-barrier-prepared.json>'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1u2Prepared
pnpm experiment:create --revision=$v1u2Revision --routes=spirit-volcano-tempo-barrier-t3-v1u2 --tierEntrySnapshot=$v1u2Prepared --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=2 --policies=intended --maxRunMs=1200000
```

Boss build, ordinary guardian/altar handling, one attempt per run, first-death stop,
20-minute caps and recovered return match V1u. This is not a new treatment arm.
A gameplay failure in B1 permits the planned fresh B2; setup/restore/infrastructure
failure stops. No balance edits, forced activation, Heat reset, debug healing,
manual movement, changes to the build, or retry after the planned two replicas.

## Lifecycle / reporting

Check free disk >=6GB, no other experiment worker and remaining wall clock.
Inspect each sealed manifest: exact source/tree, reward, count, worker/caps,
fastBossRetry=false and zero automatic retries. Record immutable image/hash.
For each experiment: create -> launch -> status -> report -> release after terminal.
Use experiment:stop at deadline or infrastructure failure, then report/release.
Release A before creating B; automatic release/already-released is expected.
Retain volumes/artifacts/checkpoints; no global Docker prune or unrelated edits.

Write/index `docs/briefs/bot-balance-v1u2-report.md`. Report actual node-enter
sequence against both outbound and return waypoints, travel versus farming damage,
Hamstring activations, mastery and purchase receipts, intermediate/final captures.
Any pre-boss death is a preparation/travel outcome. For B require named boss kill,
victorious attempt and `volcanic:3` marker together, with return a separate gate.
Keep guardian and boss phases separate; mark missing boss HP or death sequencing.
All evidence remains diagnostic; no canonical economy or isolated item attribution.

## Qualification

`server/scripts/v1u2Preflight.ts` restored the actual checkpoint and verified its
hash, persistent equality, definitions and starting builds. It checked every
waypoint's adjacency and two-node shortest path in both directions, adjacent
Jungle and no Tundra node in Jungle/Desert paths. It then modeled only future
mastery, testing ordinary purchases/upgrades at GM102/108/114 using the **actual
retained wallet**, with no additional currency. Zero combat ticks, no exported
checkpoint: farming survival is not yet validated.

Bot and diagnostics TypeScript pass. Artifact:
`C:/Users/osaif/AppData/Local/mmo-idle/validation/v1u2-preflight-final-20260914.json`.
Full repository suite not run; prior V1u harness limitation remains documented.
No experiment launched by Astra, no gameplay balance changes.

Handoff: "Operate bot-balance-v1u2-operator-packet.md exactly. Resume the verified
GM96 checkpoint, follow explicit waypoints, earn and save the upgraded kit, then
only after qualification run two 1x boss replicas. Report, release and stop."
