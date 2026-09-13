# Night 2 packet C — earned T3 transit with ordinary travel combat

Execute only on Astra's exact frozen revision/tree dispatch. One new case, one
worker, one manifest, no retries or replicates. Setup/execution deadline75minutes
from setup, case cap45minutes, always bounded by finalization at2026-09-14
04:34:42 UTC. This is the third of at most four packets tonight.

## Question and treatment

Packet B earned all three T2 seals and natural T3 but died in Volcano transit:
five attackers, full231HP at first incoming hit, and no ability activation during
the crossing. Its movement-only configuration lacked the ordinary Fight Back
travel rule. That is not a qualified T3 farming viability test.

Route `spirit-travel-t2-bridge-night2` repeats the exact B acquisition and
Plains/Forest/Desert builds from the original unmodified Spirit input. After
all three seals only, configure Sweep, Second Wind, Brace, defensive stance,
the common ranged-orbit rules plus While Traveling→Avoid Enemies and While
Traveling→Fight Back (28RP). All are already known/owned through the unchanged
preparation. No new item or debug grant. Recover to full HP/no incoming DoT
inside the cleared T2 Desert dungeon, cap180seconds, then emit
`night2:travel:ready` and navigate to T3 Sanctuary. Observe20seconds alive/auto
and fully recovered, cap180seconds, before final assertion and export.

Keep the earned range point unspent. The bot's legacy transit combat remains
suppressed; the shipped Fight Back Rune itself pauses traversal and enables
ordinary combat abilities, then resumes after combat/recovery. Avoid Enemies
is local pathing, not guaranteed avoidance. This tests the combined transit
package, not a causal estimate for any individual Rune or Guard.

## Frozen execution

Use all capacity/isolation/checksum/preflight/release controls from
[packet B](bot-balance-night2-b-operator-packet.md) and
[packet A](bot-balance-night2-a-operator-packet.md). Original input SHA256
`4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6`.
Clean exact-revision `pnpm bot:preflight` must pass before creation. Record
setup clock, actual commit/tree/image and copied host tooling hashes. No source
edits, balance edits, historical resumes or improvised treatments.

```powershell
$spiritSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json'
pnpm experiment:create --revision=$night2Revision --routes="spirit-travel-t2-bridge-night2" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=2700000
```

Stop at first death anywhere; route aborts before respawn acknowledgement.
No recovery retry, new seed or second case. Missing seals, recovery timeout,
invalid build/entry, infrastructure or evidence failure returns to Astra.
Terminal network release only: preserve artifacts, containers, volumes and
unrelated resources. Verify release receipt and exact network absence.

## Report

Write/index `docs/briefs/bot-balance-night2-c-report.md`. Preserve hashes for
manifest, cohort, receipt and each run artifact. Report all three boss windows,
clear/tier facts, exact travel build/RP/readiness, recovery windows, transit
node sequence, incoming HP damage, ability activations and kills during travel,
attacker count and death cause if applicable. Do not sum duplicated concurrent
damage snapshots or infer effective healing from unchanged-HP absorb events.
Keep false eligibility and synthetic/reward25 provenance explicit.

Only a completed, recovered run yields the actual final `snapshot-b.json`
path/hash. Report tier,currentSkillTier,one unspent point,no range selection,
root/frame,GM,biome levels,three T2 seals,equipment/upgrades,wallet,node,HP/DoT
and canonical flag. Never edit or relabel the snapshot. No downstream run
without Astra's review and final packet dispatch.
