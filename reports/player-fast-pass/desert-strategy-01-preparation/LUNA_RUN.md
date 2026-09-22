# Luna handoff — Desert strategy 01

**Qualified; main experiment NOT launched.** Execute once when assigned. Scope: six T4 representatives × two native targeting policies × two seeds = **24 fresh observations / 12 pairs**. One worker, zero retries, no extra pilots. All cases use the same canonical source, including the user-requested formation targeting fix. No Endure, added kiting arm, coefficient change, or deployment.

## Frozen identity and scope change

- Execution and formation-fix commit: `0cfa240338e364bcd7bccb499cb6301d3bdb96cb`.
- Source SHA-256: `694ff2d3d04e78922638d5a1c57fc6bd1800b391f97e15962389223e5e9633bb`.
- Hitboxes SHA-256: `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`.
- Frozen checkout: `D:/mmo-idle/desert-strategy-01-r1/source`.
- Authoritative packet: `D:/mmo-idle/desert-strategy-01-r1/packet`; this repository's packet folder is a review mirror.
- Qualification: `D:/mmo-idle/desert-strategy-01-r1/qualification`: 24/24, **zero combat observations**. Actual child revision/source/runtime/shared-module/hitbox checks passed. Do not reinstall, reseal or requalify.

The original `D:/mmo-idle/desert-strategy-01` packet is **superseded and unrun**. Never launch it. The user superseded the earlier indirect-only Champion decision by explicitly requesting formation inheritance, commit/push and canonical use in this test. Read `DESIGNER_DECISION.json` and `NATIVE_POLICY.md`; publish this change with the results. Both arms use fixed code; this is not an old-code versus new-code efficacy experiment. R2 and the prior session correction remain applied once. Actual dealer-first kills remain a measurement, not guaranteed by the fix.

## Matrix and packages

Read `ORDERED_CASES.tsv` / `ORDERED_CASES.json` and the sealed manifest. Seed 101009 cycles Berserker, Avenger, Icebreaker, Melter, Champion, Voidwalker with **A then B** adjacent. Seed 101021 cycles the same six with **B then A**. A=`baseline-targeting`; B=`lowhp-targeting`. Use `arm` and `comparisonId` for analysis; the dispatcher's inherited `block` field is the historical reference family. Fixture `node-t4-desert-03`, natural production ecology, 100ms steps, 600,000ms cap, first death stops that life; same-life endpoints at 300,000 and 600,000ms. Deaths continue to the next case.

Six historical base readbacks: `BASE_PACKAGES.json`. Twelve applied-arm readbacks: `APPLIED_ARMS.json`. Full 24 qualification/roster/identity receipts: `qualification/resolved-builds.json`. `PACKAGE_EQUIVALENCE.json` confirms exact historical package-to-baseline equality. All preserve learned skills, +5 ordinary gear, core/relic levels, ability resolution, Offensive stance, Second Wind/Brace/Cleanse and existing movement rules. Only Icebreaker/Voidwalker retain Orbit. B prepends the native `in-combat -> focus-lowest-hp` rule and pays 3 RP: 40→43/47 for Berserker, Avenger, Melter, Champion; 43→46/47 for Icebreaker/Voidwalker. Spare RP stays unused. Every paired initial roster hash matches.

Validation: typecheck, focused tests and post-fix server build passed. Full suite: 261/275 passed; all 14 failures reproduced on the pre-fix source and are recorded in CHECKS.json / BASELINE_FAILURES.json. Packet-specific child qualification passed; do not repair unrelated legacy suites as a launch prerequisite.

## Exact launch

The command below is **not yet executed**. Run it once; if a tool returns a running session, await that session, never issue the run again.

```powershell
Set-Location 'D:/mmo-idle/desert-strategy-01-r1/source'
if (Test-Path 'D:/mmo-idle/desert-strategy-01-r1/run-01') { throw 'Output exists; inspect, do not retry.' }
if (Test-Path 'D:/mmo-idle/desert-strategy-01-r1/packet/run-launched.json') { throw 'Already launched; no retries.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=desert-strategy-01 --mode=verify --packet=D:/mmo-idle/desert-strategy-01-r1/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=desert-strategy-01 --mode=run --packet=D:/mmo-idle/desert-strategy-01-r1/packet --out=D:/mmo-idle/desert-strategy-01-r1/run-01
```

Resource limits remain 5GiB disk floor, 1GiB host free RAM floor, 2GiB child RSS ceiling, 120s without advancing heartbeat, no fixed wall cap for an advancing run. Source/readback/process failure stops the common-source family; preserve completed/failed/not-run rows. Monitor dispatcher `PARTIAL.md`, `results-summary.json`, child process logs and heartbeat. No repair, retry, reseed, extra arm or alternative source mid-run. Gameplay loss alone is not an operational failure.

## Evidence and report

Read `REPORT_CONTRACT.json`, `NATIVE_POLICY.md`, and `CLASS_EVIDENCE.md` before reporting. Case evidence is `<run-root>/<case>/artifacts/<case>-s<seed>/`. Preserve all raw streams outside Git; the dispatcher hashes an inventory. The added `strategy-events.jsonl` contains real pack membership and pre/post owner/minion/formation targets, HP, control, positions and Cleanse activations. Summary `strategy.bonds` separates kill order, exposure, ambiguous membership and unfinished pairs. Exact path eligibility is unavailable with a reason; presence is not proven eligibility. Same-tick kills do not establish order. No pair exposure is uninformative. Do not infer summon damage from summon survival.

Use `completedKills` for lifetime kills and `work.kills` for endpoint/interval work, preserving differences. Render missing post-death endpoints as null. Separate owner HP damage, barrier absorption and replacement payments. Review actual Cleanse/control/position changes and final death context. Ten-minute cap survival is not thirty-minute endurance, economy proof or a population survival probability.

Publish one `reports/player-fast-pass/desert-strategy-01/run-01/REPORT.md`, compact results/build/identity/completion/seal receipts and external raw inventory. Copy `DESIGNER_DECISION.json` alongside them. Add its canonical integration source and `native-owner-target-inheritance` interpretation to Champion rows in the **publication copy** of results-summary.json; preserve the dispatcher's external originals. Append 12 paired comparisons and update the six-root evidence table. Evaluate policy effectiveness separately from combat effectiveness. Historical Conduit evidence predates the new targeting fix; pre-session-fix rows are older still. Boss and farming results remain separate.

At most five findings and three decisions/questions. Flag strong and weak outliers without equalizing all throughput. A better policy reference is not a class-stat buff. If cause or intended strategy is unclear, return a specific designer question rather than inventing another build or experiment. No automatic Endure add-back; its opportunity cost remains deferred. Distinguish proposed, measured, accepted-as-reference, integrated and deployed.

## Publication and stop

Use `C:/Users/osaif/Documents/Claude/Projects/MMO idle` for publication, separate from frozen execution. Preserve unrelated stance/sustain artifacts. Explicitly stage only the compact new result directory and necessary scoped handoff updates. **Commit AND push** through develop's established upstream, verify the remote contains the commit and read the remote `REPORT.md`. Return branch, publication SHA, measured execution SHA, report path and new/completed/failed/omitted/not-run counts. If publication fails, report the actual error and local path; never rerun combat for a publication problem. Do not commit raw JSONL gigabytes, credentials or databases. No deployment. Stop after this packet.
