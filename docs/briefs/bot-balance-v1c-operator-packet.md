# V1c — Striker preparation acquisition only

2026-09-12. Astra prepares/interprets; Luna operates this one bounded run.
Frozen source: `3ad6dbdab621d6ffc1979ac25ffe7000dbab765e`.
Route: `striker-campaign-preparation-t1`, version 1.0.0.

## Question and treatment

Can a fresh Striker earn and verify the complete GM30/+5 Plains preparation within
30 minutes? Preparation and travel share 1,800,000 ms; setup/build is separate.
The [V1b assessment](bot-balance-v1b-assessment.md) explains this phase-specific
budget. This route has no dungeon attempt and stops after preparation verification.

One fresh character, intended policy, 25x rewards, smoke-isolated, one worker/run,
clean entry, no imported snapshot/profile, fastBossRetry=false. Earn GM30 and all
five T1 biome level-6 milestones; equip Chaotic Axe +5, Plains Vest T1 +5, Swamp
Charm T1 +5 and Plains Boots T1 +5, while remaining T1 without a frame.
Final exact build is Sweep + Second Wind, five ordered movement/hazard/recovery
Rune rules, 19/22 RP, no stance/Rite/Core/Relic. Expose is learned but not attuned.
Keep V1b's transit suppression and skip its unused spare Mountain Vest +5.
No resource injection, gate weakening, route edits, retries or budget extension.

## Execute

```powershell
pnpm experiment:create --revision=3ad6dbdab621d6ffc1979ac25ffe7000dbab765e --routes="striker-campaign-preparation-t1" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=1800000
```

Run preflight before launch. Verify sealed manifest/source/tree/image and record
hashes, one fresh run, null tier-entry snapshot, intended policy, 25x and retry
settings. Host tooling is copied from the invoking checkout: verify generated
`runtime/lib.mjs` retains the unique temporary filename and bounded rename retry
from the frozen revision; record its hash and manifest tooling/runtime hashes.
On unexpected drift, stop and report; do not edit runtime or substitute revisions.
Use only the exact returned ID for experiment:launch, status and report.

Completion requires all kit/tier/mastery assertions, successful exact build event
at `v1c:verified-plains-build`, `v1c:preparation-complete`, and the final
`v1c:final-readiness` assertion. A GM30 milestone or early build verification alone
does not qualify. Preserve the authoritative final summary/build/upgrade state,
character identity, all events and the experiment's persistent database volume.
Snapshot A remains an early GM30 capture, not a ready-state export. Do not import
it, resume this character, attempt a boss or create a follow-on experiment.

## Stops and report

Stop/report on treatment drift, failed assertions, infrastructure failure or lost
evidence. Use experiment:stop for the exact ID while the supervisor is alive.
Only if a durable supervisor-fatal event confirms its death, inspect the recorded
worker container and verify its experiment ownership label and worker role. If
still running, ONE `docker stop --timeout 20 <verified-worker>` is authorized.
Never apply this to DB/Redis or an uncertain owner. Preserve stale state and logs;
no reconciliation, cleanup, relaunch or automatic retry.

Write/index `docs/briefs/bot-balance-v1c-report.md` and return to Astra. Record:

- Exact provenance, flags, setup and run elapsed time; agreement among supervisor,
  worker result, heartbeat, summary and cohort terminal records.
- Time to GM30 and each required +5 item; missing resources at each block,
  supplier arrivals, travel versus farming time, gains and actual upgrades.
- Final equipped identities/levels, tier/root/frame, exact ordered build and RP;
  all final readiness markers and assertions, or the precise unreached boundary.
- Deaths, recovery and ability activations during acquisition. On timeout preserve
  partial progress without calling it an encounter failure.
- Confirm no dungeon/boss attempt and preserve database/artifact locations for
  future entry-state qualification. Do not expose runtime secrets in the report.

This accelerated acquisition probe is noncanonical and does not measure 1x
economy, boss balance, class-wide viability or boss-ready checkpoint restoration.
