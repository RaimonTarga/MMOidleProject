# Autonomous Night 2 packet A — Cave timing and Jungle

Astra prepares and interprets; Luna operates only this packet. User activated the [night plan](bot-balance-autonomous-night-plan.md). Six cases in two sequential manifests; one worker, one active manifest. No retries or balance edits. Evidence/source rationale: [active ledger](bot-balance-night2-ledger.md).

Freeze: supplied exact commit and tree in Astra's dispatch after preparation checks. Record both in report and verify the checkout. Do not execute from an uncommitted working tree or silently use newer HEAD.

Preparation: working-checkout `pnpm typecheck` and `pnpm bot:preflight` passed (17 suites plus experiment tooling). Focused route regression passed again after adding the ordinary shared-rule derivation check: Brace and Step Back both respond to Inside Telegraph even with Enemy Charging=false, and neither triggers outside it. RP24/26/25, equal Cave acquisition, Hamstring learned before final configuration, one attempt and bounded tail verified. Pure planner produced ABBA. Live gameplay remains untested; Luna repeats exact-checkout preflight.

## Bounds and source

Four Cave cases (two per arm, ABBA), followed by two Jungle cases. Per-case cap1200000ms (20minutes); packet deadline three hours after recorded setup start, and never beyond the night deadline2026-09-14 05:04:42 UTC. Reserve final30 minutes of the night; do not start a case whose cap cannot fit. New manifest requires at least25minutes before packet deadline. No extra slots, fast boss retries, direct boss spawning, manual rescues, alternate input or source edits.

Repeat `pnpm bot:preflight` on a clean checkout of the dispatched exact frozen revision; offline dependency repair is setup-only and must be recorded. Use current committed host tooling with copied runtime checksums and automatic `release.mjs`; verify image digest/revision/tree and tooling manifest. Check available disk before creation; stop on insufficient space/build failures without broad cleanup.

Before each create, confirm capacity using one uniquely named empty bridge probe, inspect/remove only its exact verified empty ID. Preserve historical experiments, containers, volumes and images. Never globally prune. Follow create→launch→status→report, stop exact active ID only when needed. Verify completed supervisor plus released network receipt and absence of that network. On terminal release failure, use `pnpm experiment:release --id=<exact-id>`; unresolved release blocks next create. No `experiment:clean`.

## Input and commands

Both manifests independently use this original Spirit checkpoint (no downstream seals merged):

```powershell
$spiritSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json'
if ((Get-FileHash -LiteralPath $spiritSnapshot).Hash.ToLower() -ne '4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6') { throw 'Input hash mismatch' }
# Set $night2Revision to the exact dispatched frozen commit.
pnpm experiment:create --revision=$night2Revision --study="docs/briefs/bot-balance-night2-cave-study.json" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --maxRunMs=1200000
# Only after Cave terminal report/release, and absent a packet stop:
pnpm experiment:create --revision=$night2Revision --routes="spirit-jungle-hamstring-t2-night2" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --policies=intended --maxRunMs=1200000
```

Verify policy intended, reward25, smoke-isolated, retries0, fastBossRetry=false, one worker, exact input/revision/tree, count/order/caps before launch. Four Cave slots are default-brace,telegraph-brace,telegraph-brace,default-brace. Independent RNG, not paired seeds. Strict prepared-T2 import: GM72, Energy Heavy, no range branch, no T2 seals. Preserve synthetic/accelerated provenance and false combat/economy eligibility.

## Builds and readiness

Common kit: Ruinous Axe/Cave Vest/Mountain Charm/Plains Boots all ordinarily upgraded from+4 to+5; Tempered Core, no relic. Existing V1k preparation retained (including learning Brace and ensuring Cleanse); resource-aware costs and actual loadout reconciliation must pass. Defensive stance attuned/default; no rites. Ordered common rules: Always→Find Enemies, Inside Telegraph→Step Back, In Combat→Keep Distance, Always→Avoid Hazards, Always→Recover First.

Cave control `spirit-cave-control-t2-night2`: no Techniques; Guards Second Wind,Cleanse,Brace, ordinary default timing;24RP. Marker `night2:spirit:cave-control:ready`.

Cave candidate `spirit-cave-telegraph-brace-t2-night2`: same kit/acquisition/ability order; adds Inside Telegraph→Use Ability targeting Brace after the common rules;26RP. Marker `night2:spirit:cave-telegraph-brace:ready`. This overrides only Brace's low-HP default and gives it Rune priority. Do not substitute Enemy Charging; the source does not expose the eruption impact through that condition. It may miss alternate eruptions due to cooldown, which is an outcome to measure.

Jungle `spirit-jungle-hamstring-t2-night2`: ordinarily learn Hamstring (Jungle3,70green) before final build; technique Hamstring; guards Second Wind,Brace; common rules,25RP. Marker `night2:spirit:jungle-hamstring:ready`. Cleanse learned but not attuned. No special Brace trigger. This tests a whole encounter package, not an isolated estimate of Hamstring's benefit.

Each case makes one normal guardian-inclusive boss attempt (Cave Chitinous Dreadbore / Jungle Dread-Gorger), then20seconds alive/auto observation capped60seconds if cleared. Clear facts `cave:2` or `jungle:2`. Failed attempt skips tail; no new altar interaction. Pending final assertion prevents completion bypass.

## Outcomes and stopping

Valid profile/spawn, acquisition, final verified configureBuild and ready marker are mandatory. Before those, death/timeout is preparation or guardian evidence, not a treatment-valid boss loss. A valid boss death, ordinary bounded acquisition timeout or post-clear observation cap continues to the next independent declared slot. Stop the packet on invalid entry/build/isolation, actual worker exception, unhealthy server, supervisor failure, missing terminal evidence or unexpected assertion regression. Failed worker status alone is insufficient: inspect terminal reason and summary. Never rewrite a started slot or improvise a retry. Return blockers to Astra.

Report boss defeat (named kill + boss-attempt outcome + progression) separately from safe survival (no death from kill through completed tail), and incomplete observation separately. Record kill-to-tail-start gap. Do not count a post-kill death as a boss loss or respawn as safe survival. Raw `isBoss=false` may need the established named-entity corroboration.

Cave: join telegraph attempts/results with Brace/SW/Cleanse timestamps, actual removed effects, HP/barrier context if emitted. Measure how often Brace precedes a slam within its duration; explicitly note missing buff-consumption telemetry. Do not infer all-slam coverage or compare raw damages as equal-defense trials. **Death `killingBlow` can be stale**: cross-check timestamp against death; prefer authoritative death cause and label preceding damage window. Absorb-like heal records with unchanged HP are not effective HP healing. Do not use run-wide totals as boss-window totals.

Jungle: record Hamstring activations, named kill, boss elapsed time and available flee/shield/ambush evidence. Absence of shield-break/slow-contact telemetry is unobserved, not proof of a counter. Separate staying alive from maintaining attack delivery. No automatic winner or numerical balance proposal from two trials.

Write `docs/briefs/bot-balance-night2-a-report.md`, index it in docs/README.md, and send concise completion to Astra with all dispositions, exact manifests, hashes, artifact/snapshot paths, readiness, encounter clocks, death/tail distinctions and network-release evidence. Do not commit, change templates or launch downstream work; Astra reviews and dispatches the next packet.
