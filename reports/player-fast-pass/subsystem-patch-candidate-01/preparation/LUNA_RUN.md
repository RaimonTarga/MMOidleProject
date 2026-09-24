# Subsystem patch candidate 01 — runbook

Prepared only. Execute the combat command once only after a separate explicit assignment. Read REPORT.md, BRIEF.md, PATCH_DECISION.md, validation.json and the resolved receipts first.

## Fixed paths and identities

- Starting develop: `2930d58fdd008329027e93be8564669bed461452`.
- Control: `48951bebb60400fc5a6a420f46fe96bb5cb2f546`, `D:/mmo-idle/subsystem-patch-candidate-01/control`.
- Combined candidate: `fa72a310be573d167474f36b393edb38e747398d`, `D:/mmo-idle/subsystem-patch-candidate-01/candidate`.
- Packet: `D:/mmo-idle/subsystem-patch-candidate-01/packet`.
- Qualification/replay: sibling `qualification` and `receipt-check` directories.
- Reserved fresh combat directory: `D:/mmo-idle/subsystem-patch-candidate-01/run-01`.
- Publication: `D:/spc1pub`, branch `codex/subsystem-patch-candidate-01`.

Do not install, build, checkout, edit, reseal, or publish inside either frozen source. Both sources have their own local dependencies. Absolute paths are part of the applied receipt contract. Do not repeat qualification or replay; the retained completions are already required by the dispatcher. Read-only verification may be repeated.

## Later authorized command

```powershell
Set-Location D:/mmo-idle/subsystem-patch-candidate-01/control
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/subsystem-patch.mjs --mode=verify --packet=D:/mmo-idle/subsystem-patch-candidate-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/subsystem-patch.mjs --mode=run --packet=D:/mmo-idle/subsystem-patch-candidate-01/packet --out=D:/mmo-idle/subsystem-patch-candidate-01/run-01
```

Run one child at a time in manifest order: A Reverb/Idolwright, B desert-ranger/Flash, C Swamp T2/T3; each package has seeds 101009 then 101033, control then candidate. No Tempered arm or budget filler. 24 observations maximum; one 600000ms farming life each at 100ms ticks. First owner death stops that life. Fixed mastery and synthetic prior paid ownership; no purchases, build changes, Rune changes, rescue or economy inference.

Use one durable supervised terminal. The launcher writes a no-retry marker; do not clear it. Watchdogs require 5 GiB disk, 1 GiB host free RAM, at most 2 GiB child RSS and progress within 120 seconds. The eight-hour scheduling ceiling finishes the active observation and preserves remaining rows as not-run. Do not extend it automatically.

Gameplay deaths are valid observations. Source/runtime/receipt/process failures stop the common farm family; preserve failed and not-run rows. No retries, reseeds, tuning, pilots, repair, replacement cases or follow-on combat. Publication problems never authorize combat replay.

## Report after terminal execution

Publish a readable REPORT.md and compact results-summary.json under `reports/player-fast-pass/subsystem-patch-candidate-01/run-01/`. Include exact resolved builds, both source identities/trees, candidate diff, compatibility checks, terminal counts and an inventory of external raw streams. Keep raw JSONL external. Reconcile all 24 planned cells, including deaths, failed and not-run rows. Preserve missing/post-death endpoints as null.

The read-only `summarize-run.mjs` helper accepts the terminal run directory and a fresh output JSON path. It was checked against one retained historical Reverb event stream (47,617 player-source AoE HP damage at 600 seconds); that check created no combat observations. It retains null endpoints and explicit sampling/attribution limits. Measurements and interpretation are prescribed in preparation REPORT.md. Use existing events to count Technique starts/fires/aborts and player-source AoE HP damage, retaining attribution limits. Include owner minimum HP/damage taken, sampled slow/root exposure, sampled active kiting/away-motion, and recorded delivery gaps where available. Do not manufacture unrecorded metrics.

Replace the three pending numerical decisions with independent adopt/revise/reject recommendations justified by matched evidence. Keep Blood Offering retirement ready/blocked with an exact reason, separate from combat outcomes. Commit and push scoped evidence to the experiment branch and verify the remote SHA and report blob. Do not merge to develop or deploy. Stop after publication.
