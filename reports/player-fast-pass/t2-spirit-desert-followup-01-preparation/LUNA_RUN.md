# Luna handoff — executed and compact publication prepared

> Execution completed on 2026-09-22 from the exact frozen source: 32/32 fresh combat observations, 27 cap outcomes, 5 valid gameplay deaths, 0 reused/failed/not-run rows. Compact output is in reports/player-fast-pass/t2-spirit-desert-followup-01/run-01; raw histories remain at D:/mmo-idle/t2-spirit-desert-followup-01/run-01.

Execute only when assigned this packet. Read README.md, PACKAGES.md, ENTRY_PROFILE_APPENDIX.md and REPORT_CONTRACT.json. Fixed allocation: A24 + B8 = 32 fresh cells, zero reused. No pilot. Preparation source is `3e27da0bdecd442b0a40e2c2ab41afbf013f6fa6`; source/hitbox hashes are in packet/identity.json. Keep the actual frozen source checkout unchanged.

Preparation and independent receipt check passed 32/32 through the actual child with zero ticks. At handoff the verify command had been exercised and the run command was intentionally unexecuted; it was launched only after assignment. Do not rerun preparation, qualification, receipt checks or install dependencies as part of execution.

```powershell
Set-Location 'D:/mmo-idle/t2-spirit-desert-followup-01/source'
if (Test-Path 'D:/mmo-idle/t2-spirit-desert-followup-01/run-01') { throw 'Output exists; inspect, do not retry.' }
if (Test-Path 'D:/mmo-idle/t2-spirit-desert-followup-01/packet/run-launched.json') { throw 'Already launched; no retry.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=t2-spirit-desert-followup-01 --mode=verify --packet=D:/mmo-idle/t2-spirit-desert-followup-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=t2-spirit-desert-followup-01 --mode=run --packet=D:/mmo-idle/t2-spirit-desert-followup-01/packet --out=D:/mmo-idle/t2-spirit-desert-followup-01/run-01
if ($LASTEXITCODE -ne 0) { throw 'Preserve partial artifacts and report; no retry.' }
```

One worker; existing disk/memory/heartbeat watchdogs; exact sealed order. If a terminal session ID is returned, await that same session. Valid deaths continue; first player death ends each life. A shared identity/process/receipt/watchdog failure stops the common family and leaves remaining rows not-run. No revival, refill, reset, retry, extra seed, extension, adaptive gear/Guard/stance or numerical tuning.

B candidate crafting/equipping happens before the first World tick; both arms have the declared initial 90-yellow reserve and neither has a scheduled midpoint edit. Preserve the opening craft receipt in the build and focusAdoption summary. Never grant the rune or force a dealer target after a failed craft. Historical rows are references only; do not merge any as reuse.

Report up to five findings and three priority decisions in `reports/player-fast-pass/t2-spirit-desert-followup-01/run-01/REPORT.md`, with compact results, builds, identities, completion/partial receipt and external raw inventory. Use endpoint `work.kills` for equal-window comparisons and keep post-death endpoints null. Include first kill, progress gaps, unfinished targets, HP/barrier and recovery/Guard activity. Use existing Spirit discharge/energy evidence where available; exact overkill/source attribution may be unavailable. For Desert, use actual bond membership and distinguish selection, eligibility, landed damage and kill order. Do not sum overlapping bond pressure.

Keep whole-weapon/core context explicit. Do not infer Heavy boss strength, T1 Conduit balance, first-entry viability or universal root coefficients. No nerf quota: any proposed Spirit adjustment must identify the implicated frame/root/item interaction and intended tradeoff. Preserve later Heavy/boss, Conduit T1/T2, T3 Apprentice and Jungle DoT questions. Consequential unexplained failures return to the designer with evidence, without an invented rescue or next campaign.

Publish from `D:/t2sdpub`, branch `codex/t2-spirit-desert-followup-01-packet`. Inspect status; stage only the compact result directory and necessary handoff status updates; add a local `* -text` .gitattributes for byte-stable evidence. Commit AND push the report and compact evidence, verify remote branch SHA and intended file/blob hashes, and return branch, full publication SHA, measured SHA, report path, 32-cell reconciled new/reused/failed/not-run counts and reuse IDs (empty). Keep raw histories outside Git under the run root. No force-push, deployment or unrelated files. A publication failure never permits combat replay. Stop after reporting/publication.
