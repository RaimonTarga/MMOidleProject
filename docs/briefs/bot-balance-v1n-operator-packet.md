# V1n — Independent Volcano and Tundra T3 pressure screens

Prepared 2026-09-14 for user-launched Luna. Nothing created or launched.
Read CLAUDE.md and this packet. Astra plans/reviews; Luna operates these two
cases only. No subagent dispatch, balance edits, build adaptation or retries.

## Frozen source and input

Revision `1cb668fd0b3c0a2720bed5d963831f32073025d7`;
tree `9db57fdc910c8a67f62cded56cc9182e3167883c`.
Changes preserve earned T3 range/skill state and current-tier mastery in explicit
checkpoint import, and add the two probe routes. Gameplay balance is unchanged.
The static-lava fix remains included. Bot preflight, typecheck and exact V1m
checkpoint authoritative in-memory spawn qualification pass. The optional full
repository suite was started then stopped before completion; no full-suite pass
is claimed. Repeat clean exact-source preflight before creating a manifest.

Both cases independently use this same unchanged input:
`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json`

SHA256 `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144`.
Spirit energy-heavy/Wisp, T3/currentSkillTier3, zero skill points, GM78,
Plains/Forest/Desert T2 seals, Volcano mastery6, full HP236 and barrier132,
no incoming DoT, T3 Sanctuary. Ruinous Axe/Cave Vest/Mountain Charm/Plains
Boots +5, Tempered Core, no relic. Preserve all recorded wallet/mastery state.
The original entry was synthetic and rewards25: retain false canonical,
combat/economy eligibility and provenance. Do not use the committed regression
fixture as execution input or reuse case A's output for case B.

## Fixed cases and limits

| Order | Route | Question |
|---|---|---|
| A | spirit-volcanic-t3-v1n | Can the inherited Wisp kit farm a normal Volcano node for five minutes and return safely? |
| B | spirit-tundra-t3-v1n | Can the same entry kit handle initial Tundra pressure and return safely? |

Separate manifests, one route each, intended policy, one worker, count1,
smoke-isolated, rewardMultiplier25, maxRunMs900000 (15 minutes),
automaticRetries0, fastBossRetry=false. Sequential, never concurrent.
Whole packet ceiling90 minutes from recorded setup start. Launch each case
only with at least25 minutes remaining. No extra case, replicate or rerun.

First death stops that case before respawn acknowledgement. A valid gameplay
death/timeout in A does not cancel independent B. Infrastructure, entry/build
invalidity, failed source/hash verification or missing evidence stops the whole
packet before B. If failure classification is uncertain, preserve and stop.

Build: Sweep; Second Wind and Brace; Defensive stance; 28RP. Keep inherited
Find Enemies, Step Back, Orbit, Avoid Hazards, Recover First, and While
Traveling→Avoid Enemies/Fight Back. No purchases, upgrades or branch reset.
Each route reconciles the build, recovers at Sanctuary, marks ready, travels
to the first resolved normal node of its biome, marks arrival, and farms.
Record the actual resolved node and modifier; do not choose a safer alternative.
The farm requires 300 seconds accumulated alive/auto time in the target area
and full recovery at its end, with a 420-second step cap. Recovery/target
downtime is part of the evidence; a zero-kill window is not farming viability.
Then return to T3 Sanctuary and observe a recovered20-second tail, cap180seconds.
Separate farming survival, farming completion, and safe return in the report.

## Operator lifecycle

Use an isolated clean checkout of the frozen revision; preserve unrelated edits.
Record source/tree/image labels/digest and host/runtime tooling hashes. Check
disk and conflicting workers. Before creation, create a uniquely named empty
Docker bridge capacity probe; inspect it empty and remove only its exact ID.
Record dependency setup if needed. No global prune, volume deletion, historical
resume or unrelated service stop.

```powershell
$v1nRevision = '1cb668fd0b3c0a2720bed5d963831f32073025d7'
$v1nSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json'
if ((Get-FileHash -LiteralPath $v1nSnapshot).Hash.ToLower() -ne 'c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144') { throw 'Input hash mismatch' }
pnpm experiment:create --revision=$v1nRevision --routes=spirit-volcanic-t3-v1n --tierEntrySnapshot="$v1nSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=900000
```

Inspect the sealed manifest before launch. Follow create→launch→status→report
and terminal network release for A. Only after its terminal evidence and release
are verified, and the continuation gate above passes, create B with the same
command except `--routes=spirit-tundra-t3-v1n`. Do not put this in a blind loop.
If necessary stop only the exact active ID. Verify released receipt and network
absence, retaining artifacts/volumes/service containers. Manual fallback is
`pnpm experiment:release --id=<exact-id>` after terminal state only. No clean.

## Report and interpretation

Write/index `docs/briefs/bot-balance-v1n-report.md`. Include both manifests,
clocks, input/source/runtime hashes, filename/hash ledger and release receipts.
Report initial profile validation and observed Wisp/frame/points/mastery/gear,
HP/barrier/DoT, build28RP convergence, resolved node/modifier and node sequence.
Extract arrival, farm completion and recovered-return windows independently.

For each leg retain kills by species, incoming direct/DoT damage and sources,
largest hits, HP minima, healing/barrier, ability use, recovery/target downtime,
and available enemy TTK/contact intervals. Do not equate whole-node time with
enemy TTK or invent missing geometry. Record progression during the window:
reward25 may rapidly raise mastery and survival; neither case is fixed-level
nor normal-speed economy evidence. Volcano starts at mastery6 while Tundra is
new, so do not rank raw results as an equal-mastery biome comparison.

Classify first death as outbound transit, farming or return transit. Preserve
authoritative cause/time and available casts, controls, attackers, hazard contact
and escape results; killingBlow fields may be stale. No lava contact means no
live lava-fix verdict. Tundra ambient Chill is distinct from discrete root/slow
effects; report observations before attributing a failure to missing Cleanse.

A clear proves a candidate under these conditions, not balanced T3 or all-class
viability. A loss does not by itself prove overtuning. No bosses are scheduled.
T3/T4 low mob eHP remains flagged; Volcano/Tundra damage is high-risk and open.
Preserve final snapshots unchanged but do not start any downstream experiment.

## Handoff prompt

Run only the V1n operator packet at
`C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-v1n-operator-packet.md`.
Operate its two independent cases sequentially, honor the continuation/stop
rules, write/index the report, preserve evidence and verify network release.
Do not modify source/builds, retry, tune balance or start further experiments.
