# V1k — Swamp armor, Cave and Desert

2026-09-13. Astra prepares and interprets; Luna operates this packet only. Read [V1j assessment](bot-balance-v1j-assessment.md).

Frozen revision: `a419a7ff89728fcfdc4e98ebbe0e46709d7b9819`.
Frozen tree: `0f54eef3de4d43de1425184dbbce328238a55182`.
This includes automatic terminal network release and Mountain entrance variation. Concurrent uncommitted Bog Lurker changes are excluded; do not incorporate them into this experiment.

## Execution contract

Eight runs in three sequential manifests, one worker and one active manifest. A: four cases at 25 minutes each. B and C: two cases each at 20 minutes. Worker ceilings total three hours; hard session deadline four hours after the timestamp recorded before setup. Do not start a new phase with less than 30 minutes left. Stop naturally when complete. No retries, extension, fast boss retry, balance changes, T3/T4, source edits, extra arms or automatic follow-on. Astra has not created or launched any manifest.

Use a clean validation checkout of the exact revision/tree and run `pnpm bot:preflight` before create. Use current committed host create/launch tooling, preserving and checking copied runtime hashes, image digest, atomic-write retry and `release.mjs`. Do not reuse an older runtime image by assumption.

Before each create, confirm one additional bridge can be allocated using one uniquely named empty probe; inspect and remove only its exact verified empty ID. If unavailable, stop before create. Do not globally prune Docker or resume historical resources. Each terminal supervisor should release its own network; verify its receipt/event. If release fails after terminal finalization, use `pnpm experiment:release --id=<exact-id>` from current host tooling. An unresolved release failure stops before the next create. Do not use destructive `experiment:clean` as routine cleanup.

For every create verify exact revision/tree, input hash, intended policy, smoke-isolated reward25, workers1, retries0, fastBossRetry=false, route/arm order, declared count and cap. Use create → launch → status → report → stop as needed. Launch each returned exact ID once; never hand-edit manifests/state.

## Original independent input

All eight cases import the original V1h Spirit Snapshot B independently. Do not use V1i/V1j outputs, merge seals, inject items/currency, alter class/frame or relabel the source.

```powershell
$v1kRevision = 'a419a7ff89728fcfdc4e98ebbe0e46709d7b9819'
$spiritSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json'
if ((Get-FileHash -LiteralPath $spiritSnapshot).Hash.ToLower() -ne '4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6') { throw 'Spirit input mismatch' }
```

T2, GM72, Energy Heavy, no range branch, no T2 seals; synthetic accelerated origin. Strict prepared-T2 import remains required, with normal HP/cooldown reset. Preserve actual treatment validity, eligibility and taints; false combat/economy eligibility stays false.

## A — Swamp armor comparison (four runs)

```powershell
pnpm experiment:create --revision=$v1kRevision --study="docs/briefs/bot-balance-v1k-swamp-study.json" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --maxRunMs=1500000
```

Study SHA-256 at preparation: `c03c12287adb7eefc520a5e72c4fc36848fb242be03092dbb481f38f4c005097`. If checkout line endings differ, verify normalized JSON identity and record both hashes. Order is cave-armor, swamp-armor, swamp-armor, cave-armor; independent RNG, not paired seeds.

Both arms follow the qualified ordinary preparation: upgrade Axe/Cave Vest/Mountain Charm/Plains Boots to +5, learn Brace and Cleanse, reconstruct/upgrade Bog Eye to +5 and equip it. Then both reconstruct Bog Wrappings and upgrade it to +5 while wearing Cave Vest. All costs/gates are ordinary and resource-aware. Only the final armor differs.

Final kit: Ruinous Axe +5, **Cave Vest +5 or Bog Wrappings +5**, Bog Eye +5, Plains Boots +5, Tempered Core, no relic. Techniques: Expose Weakness. Guards: Second Wind, Cleanse. Defensive stance attuned/default, no Rite. Ordered rules in every V1k case: Always → Find Enemies; Inside Telegraph → Step Back; In Combat → Keep Distance; Always → Avoid Hazards; Always → Recover First. Total26/30RP. Do not spend the remainder.

Markers: `v1k:spirit:swamp:cave-vest-t2:ready` and `v1k:spirit:swamp:swamp-vest-t2:ready`.
One normal guardian-inclusive cycle against Mire-Gorged Behemoth; clear corroboration `swamp:2`.

Primary question: does the anti-DoT armor package reduce poison failure and improve survival after the kill? Record lethal source, stacks, direct/DoT/deferred damage, Cleanse removal identity, SW activations and HP if emitted. Compare equal-stack tick sizes only when context supports it; do not label whole-run aggregates boss-only or infer pool exposure from missing telemetry. A reduction in poison deaths accompanied by more direct-hit deaths is an informative tradeoff.

## B — Cave candidate (two runs)

```powershell
pnpm experiment:create --revision=$v1kRevision --routes="spirit-campaign-cave-cave-vest-t2-v1k" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --policies=intended --maxRunMs=1200000
```

Axe, Cave Vest, Mountain Charm, Plains Boots all +5; Tempered Core, no relic. Learn Brace and ensure Cleanse is learned. Final Techniques: none. Guards: Second Wind, Cleanse, Brace. Same stance/rules, no Rite; total24/30RP. This deliberately preserves ordinary/empowered attack delivery while reserving three defensive functions. No added offensive ability or altered trigger.

Marker `v1k:spirit:cave:cave-vest-t2:ready`. One normal cycle against Chitinous Dreadbore; corroboration `cave:2`. Record corrosion/removals, eruption/telegraph response and exposed/untargetable periods when emitted. T2 on-hit corrosion remains authored; do not assume the T1 Breach-only nerf applies. Survival failure and insufficient damage during exposed windows are different outcomes.

## C — Desert candidate (two runs)

```powershell
pnpm experiment:create --revision=$v1kRevision --routes="spirit-campaign-desert-cave-vest-t2-v1k" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --policies=intended --maxRunMs=1200000
```

Same +5 Axe/Cave Vest/Mountain Charm/Plains Boots and Core. Final Expose Weakness; Second Wind, Cleanse; defensive stance and same ordered rules, no Rite; total26/30RP. Brace is learned during shared preparation but not attuned here.

Marker `v1k:spirit:desert:cave-vest-t2:ready`. One normal cycle against Dune-Stalker Emperor; corroboration `desert:2`. Record mark/slow, what Cleanse removes, Execution and movement outcomes when emitted. Ordinary Cleanse policy is fixed; the operator cannot manually select the removed debuff or time it. Mark removal is not cancellation of Execution.

## Post-clear observation and outcome rules

After a successful boss attempt, each route observes ordinary auto behavior in the same dungeon for **20 seconds of alive/auto time**, capped at60 seconds. It then asserts the existing clear. The pending assertion prevents route completion from bypassing this observation. The tail is skipped when the sole boss attempt fails; it does not activate another boss.

Report three separate outcomes:

1. Boss defeated: named kill + attempt + progression corroboration, regardless of subsequent death.
2. Post-clear survival: completed observation and zero deaths from named kill through the end of the observation. A death followed by respawn and completion is NOT safe survival.
3. Observation incomplete: timeout, interruption or missing tail evidence. Keep any established kill; do not relabel it a pre-kill boss loss.

Record the kill-to-tail-start gap, tail start/end, any intervening deaths and terminal HP/DoT/debt if emitted. The observation starts after the attempt wrapper; do not claim an exact20-second window starting at the kill. A boss-entry HP snapshot still is not guaranteed by the recorder; sanctuary header HP is not a substitute.

## Stop and evidence contract

Successful profile/spawn validation, resource acquisition, exact final configureBuild reconciliation and the ready marker are prerequisites for a treatment-valid boss result. Preparation failure/timeout is not a boss loss. Preserve slots; no manual correction or retry.

Valid ready-marker boss deaths, post-kill deaths and ordinary observation/preparation caps continue to independent cases. A failed worker status is not by itself infrastructure failure; inspect the durable terminal reason/summary. Stop on actual worker exception, unhealthy server, supervisor failure, missing terminal evidence, invalid entry/build/isolation or unexpected assertion regression. Keep post-observation cap distinct from these stops. At the deadline, stop the exact active manifest, allow finalization/release, and list unstarted slots. Do not stop unrelated services.

Write and index `docs/briefs/bot-balance-v1k-report.md`. Include all eight dispositions, input/source/tooling/artifact hashes, release receipts, exact builds, readiness and separate preparation/guardian/boss/whole-attempt/post-clear clocks. Preserve sampled versus snapshot HP distinctions. Raw `isBoss=false`/entity-style IDs require the existing corroboration, not an invented guardian victory. Keep absent empowerment, pool, barrier-break and kiting telemetry explicitly unobserved. No automatic winner selection, balance edit or downstream runs.

## Preparation checks

Working-checkout `pnpm typecheck` and `pnpm bot:preflight` PASS, including17 suites plus experiment/experience checks. Route regression exercises final RP legality, identical Swamp preparation and the real executor's post-clear completion/failed-prerequisite behavior. Actual original input passed166 offline checks. Pure planner yielded the declared four-arm order without creating a manifest. Unrelated dirty gameplay files were present during local checks; operator must repeat preflight on the clean exact frozen checkout. Full gameplay suite, Docker capacity probes and live boss trials were not run by Astra during preparation.
