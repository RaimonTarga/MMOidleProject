# Luna handoff — Guard coverage 01

**Prepared and qualified; NOT launched. Execute only when assigned this packet.** User selected the 32-cell Endure matrix, superseding the alternative 20-cell Recuperate matrix. Ceiling: **32 new observations, zero reuse, zero extra pilots or retries**. No further preparation combat is needed.

Integrated fix: `214d28cd4375bd179219fe5964785df4978e3df6` on develop, exact tested five-file delta, parent `5b1305c33817d248648125e67dcb35d5d07e6b0a`. Normal Conduit R2 stays applied once. No deployment was performed. Frozen execution source: `15aef70b72bc0eead1511a32a93f72a97299ea7c`.

Read README.md, CHECKS.json, DEATH_MECHANISMS.md, ORDERED_CASES.tsv and REPORT_CONTRACT.json. `D:/mmo-idle/guard-coverage-01/packet` is the authoritative packet; the repository packet/ folder is a review mirror. Qualified receipts are at `D:/mmo-idle/guard-coverage-01/qualification/resolved-builds.json` and mirrored under qualification/. Do not change the frozen checkout, reinstall dependencies, reseal, requalify or apply another R2/session patch.

## Fixed arms and order

1. Berserker (Striker Heavy A): Inferno static, Inferno + Endure; 8 cells.
2. Juggernaut (Striker Heavy C): same arms; 8 cells.
3. Champion (Conduit Heavy B): Mountain static, Mountain + Endure, Inferno static, Inferno + Endure; 16 cells.

Within each identity: Desert-03 then Graveyard-03; seed 101009 then 101021; named arm order above. ORDERED_CASES.tsv and sealed manifest are exact. All remain Offensive, close, mature legal +5. Static arms are 40/47 RP; Endure arms 46/47. Guards remain Second Wind, Brace, Cleanse, with Endure appended. Native HP triggers and current Rune rules are preserved.

Every cell is one continuous life at 100 ms, cap 1,800,000 ms, first-death stop, same-life 5/15/30-minute checkpoints. Do not alter fixtures/packs, seeds, ability order, timing, equipment, source or numerical values. Deaths continue to the next cell; they are not process failures.

## Exact commands

These preparation verification paths passed. The run command is intentionally unexecuted. Run it once only; if the shell returns a running session, await that session rather than issue the command again.

```powershell
Set-Location 'D:/mmo-idle/guard-coverage-01/source'
if (Test-Path 'D:/mmo-idle/guard-coverage-01/run-01') { throw 'Output already exists; inspect, do not retry.' }
if (Test-Path 'D:/mmo-idle/guard-coverage-01/packet/run-launched.json') { throw 'Already launched; no retries.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=guard-coverage-01 --mode=verify --packet=D:/mmo-idle/guard-coverage-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=guard-coverage-01 --mode=run --packet=D:/mmo-idle/guard-coverage-01/packet --out=D:/mmo-idle/guard-coverage-01/run-01
```

One child at a time; storage floor 5 GiB, host RAM floor 1 GiB, child RSS ceiling 2 GiB, 120-second no-advancing-heartbeat stop. No fixed advancing-run wall cap. The common-source Guard coverage family stops on source/readback/process failure; retain completed, failed and not-run rows. Do not repair/retry or add an alternate family. Monitor at identity boundaries (8/16/32 completed) and real exceptions, not per-fight model commentary. Dispatcher PARTIAL.md, results-summary.json and child process logs provide status.

## Outputs and report

Output root: `D:/mmo-idle/guard-coverage-01/run-01`. Each case has `<case>/artifacts/<case>-s<seed>/` with ready.json, summary.json, events.jsonl, samples.jsonl, guard-events.jsonl and Conduit histories when applicable. Top-level results-summary.json, resolved-builds.json, raw-inventory.json and complete.json/partial.json reconcile the packet. Preserve raw histories outside Git.

Publish one readable `reports/player-fast-pass/guard-coverage-01/run-01/REPORT.md`, at most five findings and three decisions, plus the compact files in REPORT_CONTRACT.json. Copy source/manifest/seal/completion/build receipts; retain explicit arm/package/source/fixture/seed fields. Summarize each death's final damage/debuff/HP/barrier/Guard/recovery sequence and Champion's early payment context, pointing to external raw evidence. guards.lastIncomingPipeline captures synchronous mitigation state; distinguish this from pre/post-tick estimates and non-pipeline damage. Actual casts are activation events; sampled active time is not exact continuous uptime. Unsupported healing/overheal stays unavailable.

Keep lifetime completedKills separate from endpoint work.kills. Publish missing post-death 5/15/30-minute endpoints as null, never zero. Show HP work versus absorption, unfinished targets and interval progress. For Champion compare all four arms within each fixture/seed; preserve the adverse Desert 101021 counterexample. A cap without work is not a farming rescue; two seeds are not a reliability probability. All evidence is synthetic, economyEligible=false.

Close with adopt-as-reference / reject / matchup-specific / needs one identified correction, with real costs. If substantial Endure uptime still fails, identify the supported remaining mechanism and at most one targeted prospective correction; no automatic third variant, timer sweep, multiplier, further Apprentice tuning or next campaign. Keep the previous report unchanged.

## Scoped publication

Use `C:/Users/osaif/Documents/Claude/Projects/MMO idle` for publication. Inspect status and preserve unrelated files. Explicitly stage only the new compact result directory and any necessary scoped handoff updates. **Commit AND push** through develop's established upstream. Do not track raw JSONL histories, credentials, databases or unrelated stance/sustain artifacts. Verify the remote branch contains the publication and fetch/read its REPORT.md. Return branch, publication SHA, measured source SHA, integration SHA/status, report path, and new/reused/failed/omitted/not-run counts. If pushing fails, report that directly; never replay combat. Pushed source is not a verified deployment. Finish this packet and stop.
