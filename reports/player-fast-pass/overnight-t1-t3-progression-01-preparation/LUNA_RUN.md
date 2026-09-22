# Luna run handoff

Prepared and qualified only: **720/720 zero-tick cases; no combat launched**. Execute only when assigned. Read BRIEF.md, README.md and CATALOGUE.md. The attached brief's later execution/publication instructions are preserved for that assignment.

Frozen gameplay/runner SHA: `c14d62afa2267b57207e1ef8b65c3fd90144c0a6`. Execution checkout: `D:/mmo-idle/overnight-t1-t3-progression-01/source`. Packet: `D:/mmo-idle/overnight-t1-t3-progression-01/packet`. Qualification: `D:/mmo-idle/overnight-t1-t3-progression-01/qualification`. Publication checkout: `D:/op1pub` on `codex/overnight-t1-t3-progression-01-packet`. Keep execution HEAD fixed; never run from publication.

The following qualification command **already passed**, with the real child launchers. Do not repeat it or reseal:

```powershell
Set-Location 'D:/mmo-idle/overnight-t1-t3-progression-01/source'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-progression.mjs --mode=qualify --packet=D:/mmo-idle/overnight-t1-t3-progression-01/packet --out=D:/mmo-idle/overnight-t1-t3-progression-01/qualification
```

Verified preflight, followed by the **unexecuted** one-shot run command:

```powershell
Set-Location 'D:/mmo-idle/overnight-t1-t3-progression-01/source'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-progression.mjs --mode=verify --packet=D:/mmo-idle/overnight-t1-t3-progression-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop and preserve evidence.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-progression.mjs --mode=run --packet=D:/mmo-idle/overnight-t1-t3-progression-01/packet --out=D:/mmo-idle/overnight-t1-t3-progression-01/run-01
```

An existing run marker or output forbids relaunch. One child at a time, fixed order, no pilots/retries/extra seeds/tuning. The first case counts toward 720 and continues into the queue without another approval gate. Ordinary cap 1,200,000 ms; boss cap 300,000 ms; 100 ms World steps; first death terminates. Gameplay losses continue. Operational faults stop the affected farm family or boss species; source drift stops everything. Preserve failed and not-run rows. Do not repair, adapt or spend unused cases. If the queue finishes early, stop.

Watch compact PARTIAL.md/results-summary.json at block boundaries/exceptions. Watchdogs: 5 GiB output disk minimum, 1 GiB host free RAM minimum, 2 GiB child RSS ceiling, 5-second polls, 120-second advancing-heartbeat timeout. Existing boss runner also has a 300-second wall ceiling per case; a hit is operational censoring, not gameplay failure. The farm runner has no absolute wall ceiling while advancing. Do not reason per tick/case. No artificial sleeping.

Publish the morning report even after partial completion under `reports/player-fast-pass/overnight-t1-t3-progression-01/run-01/` in the publication checkout. Lead with at most five findings and three decisions, then tier/root/frame profiles. Answer the T1 Conduit, Spirit farm/boss and entry-bottleneck questions. Use complete progression packages, matched fixture/snapshot/seed/source comparisons, survivor denominators and null post-death windows. Use endpoint `work.kills` for 0–5, 5–10 and 10–20 minute rates; label partial exposure separately. Boss adds and progress stay separate. Read external summaries for terminal targets, Guard, sustain, Conduit and delivery evidence; do not infer exact overkill or exclusive charm healing.

Copy only compact report/results, packet/identity/snapshot/package/qualification/completion receipts and a reverified raw inventory. Raw events, samples, full target histories and full ready receipts remain at the external D: paths. Commit **and push** scoped publication, verify the remote full SHA and intended files, and return source SHA, publication SHA, report path, and completed/new/failed/omitted/not-run counts. Push failure never authorizes replay. No deployment, force-push, other class changes or automatic follow-up campaign.
