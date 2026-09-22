# Luna run handoff — prepared, unexecuted

Run once only when assigned. Read README.md, PACKAGES.md, SPIRIT_SOURCE.md and REPORT_CONTRACT.json. Fixed allocation: five T2 representatives x Forest/Mountain x seeds 101009/101021 = 20 new observations; no reused rows or pilots. The manifest alternates bosses for each identity and reverses identities in seed block two.

Frozen execution checkout: `D:/mmo-idle/t2-spirit-boss-contrast-01/source`, SHA `3a1488a7c78bb47f4a90e20ec06db1652594fe16`. Do not use the publication checkout to run. The command below for verify was tested during preparation; the run command is intentionally unexecuted. Qualification and independent receipt checking passed 20/20 through the exact child launcher with zero World ticks; resolved receipts are byte-identical. Do not rerun preparation, install dependencies, change source, or add smokes.

```powershell
Set-Location 'D:/mmo-idle/t2-spirit-boss-contrast-01/source'
if (Test-Path 'D:/mmo-idle/t2-spirit-boss-contrast-01/run-01') { throw 'Output exists; preserve evidence, no retry.' }
if (Test-Path 'D:/mmo-idle/t2-spirit-boss-contrast-01/packet/run-launched.json') { throw 'Already launched; no retry.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=t2-spirit-boss-contrast-01 --mode=verify --packet=D:/mmo-idle/t2-spirit-boss-contrast-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=t2-spirit-boss-contrast-01 --mode=run --packet=D:/mmo-idle/t2-spirit-boss-contrast-01/packet --out=D:/mmo-idle/t2-spirit-boss-contrast-01/run-01
if ($LASTEXITCODE -ne 0) { throw 'Preserve partial output; no repair or replay.' }
```

One child at a time, 100 ms World steps, 300000 ms simulated cap; stop a case at authoritative boss kill, first owner death, simultaneous terminal or cap. A valid death continues the queue. A shared source, process, receipt or watchdog failure stops it with affected/not-run rows preserved. Existing child five-minute wall ceiling is an operational failure, not a death. No revival, loadout changes, tuning, reroll, extra seed, health refill or cap extension. Await the same process session if execution is asynchronous.

Report the full twenty-row ledger, at most five substantive findings and three decisions. Confirm kills from boss-specific events; preserve simultaneous terminals. Use 60/120/300-second snapshots only where populated; post-terminal values remain null. Events use tick-start atMs, while elapsedMs/endpoints use completed tick time. Keep boss HP and barrier absorption separate. Count canonical delivered empowered hits once; do not call whole-strike payload useful/incremental discharge damage. Inspect raw chronology for Technique deliveries, Brace/Second Wind, Forest ramp and Mountain shield breaks/charge outcomes. Initial RNG state and encounter bodies are recorded even when seeds produce identical outcomes.

Compare existing farming context in HISTORICAL_CONTEXT.md without replay. Heavy's weapon and Forest support differences limit causal frame claims. If supported, propose one exact Spirit parameter/interaction with current/proposed values, expected effect and risk; otherwise leave values unchanged with one precise unresolved question. Do not implement a proposal or start another campaign.

Publish from `D:/sbc1pub`, branch `codex/t2-spirit-boss-contrast-01-packet`. Stage only `reports/player-fast-pass/t2-spirit-boss-contrast-01/run-01` and necessary handoff status. Include REPORT.md, compact results-summary.json, resolved builds/initial states, manifest, identity, seal, completion/partial and external raw inventory. Keep raw events/samples under the external run root. Use `* -text` for byte-stable compact evidence. Commit AND push, verify remote SHA and file/blob presence, and return branch, full publication SHA, measured SHA, report path and planned/completed/new/failed/not-run counts. No force-push, merge, deployment or combat replay after a publication error.
