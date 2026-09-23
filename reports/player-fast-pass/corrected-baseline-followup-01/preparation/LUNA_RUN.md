# Luna handoff — corrected baseline follow-up 01

Preparation complete: qualification 32/32 and receipt replay 32/32 passed with identical receipt SHA256; combat observations 0. Typecheck (including bench), server build and diff checks passed. Full suite was not run.

Preparation only. Execute exactly 32 fresh observations once after the user assigns execution. Do not run preparation again, change the source, replace a package, retry a life, or launch the historical 432-case runner. The attached BRIEF.md supplies the full reporting contract; this file supplies the concrete launcher and paths.

## Frozen paths and identities

- Execution source: `D:/mmo-idle/corrected-baseline-followup-01/source`
- Execution SHA: `22a349bf7dab6e42a412a231444fa4b8df41f28e`
- Correction baseline: `f58359036bca3cfeebe482e5bfdd1f9cbb355c0a`
- Packet: `D:/mmo-idle/corrected-baseline-followup-01/packet`
- Qualification: `D:/mmo-idle/corrected-baseline-followup-01/qualification`
- Receipt replay: `D:/mmo-idle/corrected-baseline-followup-01/receipt-check`
- Reserved fresh combat output: `D:/mmo-idle/corrected-baseline-followup-01/run-01`
- Publication checkout: `D:/cbf1pub`, branch `codex/corrected-baseline-followup-01-packet`
- Publication destination after combat: `reports/player-fast-pass/corrected-baseline-followup-01/run-01/`
- Node: `v22.16.0`; hitboxes: `D:/mmo-idle/corrected-baseline-followup-01/hitboxes.json`
- Hitbox SHA256: `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Do not check out, install, build, normalize files, or publish from the execution source after sealing. Its source identity includes file bytes and checkout provenance. Use the separate publication checkout. A different machine/path requires a new preparation decision, not an operator workaround.

## Commands

Preparation commands below were used during preparation and must NOT be repeated against the existing packet/output directories. All modes use the actual launcher; qualification and receipt-check invoke its child runners with zero World ticks. The combat run branch has not been exercised during preparation.

```powershell
Set-Location D:/mmo-idle/corrected-baseline-followup-01/source
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/corrected-baseline-followup.mjs --mode=prepare --packet=D:/mmo-idle/corrected-baseline-followup-01/packet --control=D:/mmo-idle/corrected-baseline-followup-01/source --candidate=D:/mmo-idle/corrected-baseline-followup-01/source --hitboxes=D:/mmo-idle/corrected-baseline-followup-01/hitboxes.json
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/corrected-baseline-followup.mjs --mode=qualify --packet=D:/mmo-idle/corrected-baseline-followup-01/packet --out=D:/mmo-idle/corrected-baseline-followup-01/qualification
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/corrected-baseline-followup.mjs --mode=receipt-check --packet=D:/mmo-idle/corrected-baseline-followup-01/packet --out=D:/mmo-idle/corrected-baseline-followup-01/receipt-check
```

For execution, run these sequentially, checking the exit code. Verification is read-only and may be repeated. The run command is listed for Luna; Astra has not launched it.

```powershell
Set-Location D:/mmo-idle/corrected-baseline-followup-01/source
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/corrected-baseline-followup.mjs --mode=verify --packet=D:/mmo-idle/corrected-baseline-followup-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/corrected-baseline-followup.mjs --mode=run --packet=D:/mmo-idle/corrected-baseline-followup-01/packet --out=D:/mmo-idle/corrected-baseline-followup-01/run-01
```

`control` and `candidate` identity entries are legacy launcher aliases for the same source. Every case uses `control`; there is one correction baseline and no fresh numerical control arm. The per-case duration is authoritative: C4 farm/V4 600 seconds, C4 boss 300 seconds, C1 1,200 seconds. C1 retains 5/10/20-minute endpoints; T4 retains 5/10. One worker, 100 ms steps, seeds 101009 and 101033, fixed manifest order interleaving C4/C1/V4 within each seed. First death ends the life; boss kill, simultaneous terminal or cap also ends a boss life.

## Stop and evidence rules

5 GiB disk free, 1 GiB host RAM free, 2 GiB child RSS, 5-second polling and 120-second heartbeat watchdog. A valid gameplay death continues. Operational family failures preserve partial outputs and block that family; shared source/runtime integrity failure stops the queue. Never clear launch markers, rerun, reseed, refill, resurrect, extend caps or optimize a build. Preserve completed/failed/not-run counts and exact errors. Publication failure never authorizes rerunning combat.

Read `complete.json` or `partial.json`, `results-summary.json`, `resolved-builds.json` and `raw-inventory.json`. Complete means 32 valid fresh observations, including valid gameplay deaths; qualified rows are not combat outcomes. Retain raw JSONL outside Git and publish exact path/size/hash inventory. Missing historical details do not authorize combat replay.

## Comparison and publication

Use the ordered manifest, `historical-comparison.json`, `applied-build-details.json` and `SOURCE_COMPARISON.md`. The committed `server/bench/balance/correctedBaselineReferences.json` contains the selected completed historical rows, applied receipts, original case definitions and measured source IDs. Compare by exact fixture, seed, package and checkpoint; label each compatible correction-set comparison, partial/contextual comparison, or unavailable. Later exposure may diverge despite matching seeds. Check current roster hashes against preparation and preserve null post-death endpoints.

Write one readable REPORT.md with three block summaries, all 32 outcome/matching rows, at most five substantive findings and three priority decisions. Follow sections 6–8 of BRIEF.md. Save compact results-summary.json, historical-comparison.json, manifest, source and applied-build receipts, completion/partial receipt and external raw inventory. Preserve owner HP versus barrier, lifetime versus checkpoint work, interval-specific rates, actual ability delivery, formation availability, terminal pressure and Volcano disengagement opportunities. Unsupported damage attribution stays unavailable. No inferred casts, per-summon healing, or body-count multiplication of one Technique payload.

Update the class decision register additively in the new report bundle. Spirit's adopted patch remains recorded; root reconstruction stays 3,500 ms; Wasteland is excluded by designer intent and pending encounter work, without invalidating old evidence or blocking this screen. T2/T3 unresolved issues stay separate. T4 Conduit tests Expose Weakness/native engagement only; T1 Plains tests Sweep and Cave has no offensive Technique. Ask the designer about a specific weak setup before proposing a rescue build. No numerical adoption is authorized.

Commit and push only the new compact report bundle on the publication branch. Verify remote SHA and report blob. Return execution/publication SHAs, branch, report path and planned/new-completed/gameplay-dead/failed/omitted/not-run counts. Stop at 32; no second experiment, merge, deployment, force-push or edits to old reports.
