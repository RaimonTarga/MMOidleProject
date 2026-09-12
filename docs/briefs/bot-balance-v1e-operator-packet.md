# V1e — Earned T1 entry and first Plains encounter

2026-09-13. Astra prepares/interprets; Luna operates this one bounded packet.
Frozen revision: `40f0ebb7dd0f4c557a640f974388823d8ef713f1`.
Route: `striker-campaign-plains-entry-t1`, version 1.0.0.

## Question

Can V1d's earned T1 Striker, with the affordable Plains Charm swap, clear the
Plains dungeon and Tusked Razorback? Live snapshot restoration is a prerequisite,
not a separate automatically expanded study. No fresh mastery/kit acquisition.

Final treatment: Chaotic Axe +5, Plains Vest +5, Plains Stone +5, Fleet Boots +5;
Sweep / Second Wind; Always → Find Enemies, Inside Telegraph → Step Back,
In Combat → Chase Enemy, Always → Avoid Hazards, Always → Recover First.
Expected 19/22 RP, T1, GM30, no frame/stance/Rite/Core/Relic. The root-only
snapshot import initially restores Murk Eye +5 exactly; ordinary upgrade/equip
steps then replace it with the already-owned Plains Stone, upgraded +2 to +5.
Any unexpected resource farming at this boundary is drift: stop/report.

## Exact input and creation

Use only V1d's original final file, unchanged. Expected SHA-256:
`7917f16cd5ad24534934472a4f9a57e35d0fb40c88b21fd706dd099ea12f5f29`.
Its legacy snapshotKind remains `tier2-handoff`; the new route explicitly imports
the actual T1 state. Never relabel or edit it, substitute Snapshot A, import a
directory, or use a synthetic profile.

```powershell
$snapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/snapshot-b.json'
if ((Get-FileHash -LiteralPath $snapshot -Algorithm SHA256).Hash.ToLower() -ne '7917f16cd5ad24534934472a4f9a57e35d0fb40c88b21fd706dd099ea12f5f29') { throw 'V1d snapshot hash mismatch' }
pnpm experiment:create --revision=40f0ebb7dd0f4c557a640f974388823d8ef713f1 --routes="striker-campaign-plains-entry-t1" --tierEntrySnapshot="$snapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=900000
```

Run preflight before launch. Verify sealed source/tree/image and snapshot hash,
runtime/tooling hashes, one worker/run, intended policy, 25x, fastBossRetry=false
and 900,000 ms. Host tooling is copied from the invoking checkout; verify the
copied runtime retains the bounded atomic rename retry. On unexpected drift,
stop/report without rewriting runtime or substituting revisions.
Use only the returned ID for one experiment:launch and subsequent status/report.
Do not resume V1d's old character or services.

## Readiness, encounter and limits

First require profile/spawn validation success. Existing console prefixes say
`T2_ENTRY_TEMPLATE_VALIDATION`; inspect the recorded profile and actual tier 1,
not that legacy prefix. Require root-only skills, level 127, GM30, exact imported
equipment/upgrades/wallet/abilities/rules, full HP, no target/buffs, and auto off.
The ordinary charm swap must succeed, with final equipped Plains Stone +5 and
`v1e:verified-plains-build`, then `v1e:encounter-entry-ready` before the attempt.

Start at Clearing and use ordinary travel, guardian clearing and altar activation.
One authored attempt cycle, no fast retry/guardian bypass/manual intervention.
Guardian recovery inside the existing cycle is not an additional operator retry.
The 15-minute overall cap includes restoration, charm swap, travel, guardians and
boss; setup/build time is separate. Internal waits keep their existing bounds.
No budget extension or follow-on run. Stop/report failed assertions, treatment
drift, infrastructure failure or lost evidence. A pre-engagement failure leaves
the boss untested; a failed candidate is not proof of impossibility.

Use experiment:stop on this exact ID if needed while its supervisor is alive.
Only after a durable supervisor-fatal event confirms death may Luna inspect the
recorded worker, verify exact experiment label and worker role, and issue ONE
`docker stop --timeout 20 <verified-worker>` if still running. Never stop DB/Redis
under that contingency. Preserve stale state, logs and artifacts; no cleanup,
reconciliation, relaunch, automatic retry or second treatment.

## Report

Write/index `docs/briefs/bot-balance-v1e-report.md`. Preserve:

- Provenance, source snapshot hash, entry validation results, initial and final
  equipped/build state, charm costs and actual level/GM/stats at boss engagement.
- Separate travel, guardians/deaths, altar activation, boss appearance and actual
  engagement boundaries. Do not equate the authored cycle counter with fights.
- Boss HP/phase progress, add presence/kills, Sweep/Second Wind activations,
  damage/healing/death evidence and target behavior. For Plains Charm, show kill
  timing and recovery activation/window evidence if exposed. If attribution is
  absent, say so; do not infer charm healing from aggregate healing alone.
- Authoritative `tusked-razorback` kill plus `plains:1` clear, if achieved. Route
  completion alone is insufficient. Preserve lowest/last HP semantics accurately.
- Supervisor/run state, worker result, heartbeat, summary and cohort agreement;
  elapsed time and whether each boundary was reached, failed or unobserved.

Both the source and run use accelerated rewards. Preserve noncanonical and
eligibility flags; this is no 1x economy or class-wide balance claim. One valid
kill demonstrates possibility for this declared candidate; replication and charm
comparisons require a later decision. Return to Astra after this one run.
