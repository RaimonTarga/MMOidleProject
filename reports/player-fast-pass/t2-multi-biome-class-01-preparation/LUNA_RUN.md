# Luna handoff — T2 multi-biome class screen 01

**Prepared and twice checked with zero combat ticks; NOT launched. Execute only when assigned this packet.** A=216, B=12, D=36, total 264. D is explicitly authorized by the user's Desert rune move and midpoint adoption decision. The original brief's prohibition on that change is superseded. Desert unlock is level **4**, not 8.

Read README.md, PACKAGES.md, CLASS_ASSESSMENT.md, CHECKS.json, REPORT_CONTRACT.json and packet/manifest.json. Final source commit is `41b3d35961bf4393beeea6e70aabfe2ae43ad810`. Source hash is `32b44f4faec8ad7e52d9f0f4b97b12bd3f3b22f537043dcb29ed7b0bb6220e94`. Use the existing execution checkout and packet, not this publication checkout. Do not normalize/reinstall/reset the frozen files or copy receipts between checkouts. Location provenance is retained; receipt equality compares semantic source/build fields.

## Exact execution command

Verification, preparation and receipt-check commands were exercised successfully in this final checkout. The run command below is intentionally unexecuted during preparation. Run it once when assigned; if the terminal returns a session ID, await that same session instead of launching again.

```powershell
Set-Location 'D:/mmo-idle/t2-multi-biome-class-01/source'
if (Test-Path 'D:/mmo-idle/t2-multi-biome-class-01/run-01') { throw 'Output already exists; inspect, do not retry.' }
if (Test-Path 'D:/mmo-idle/t2-multi-biome-class-01/packet/run-launched.json') { throw 'Already launched; no retries.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=t2-multi-biome-class-01 --mode=verify --packet=D:/mmo-idle/t2-multi-biome-class-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=t2-multi-biome-class-01 --mode=run --packet=D:/mmo-idle/t2-multi-biome-class-01/packet --out=D:/mmo-idle/t2-multi-biome-class-01/run-01
if ($LASTEXITCODE -ne 0) { throw 'Preserve partial artifacts and report; no retry.' }
```

One worker, 100 ms steps, 600,000 ms cap, first death ends each life. Seeds 101009 and 101021; order exactly as sealed. Roots and biomes interleave; matched B pairs are adjacent and reverse order across seeds. First live case counts toward 264; no pilot or extra approval checkpoint. Valid deaths continue. Any shared operational/identity/readback/process/watchdog failure stops the common family; publish the failure and remaining not-run rows. No retry, repair, reseal, new seed, extension, adaptive build or balance patch during measurement.

Melee means Striker and Squire at T2: 12 Desert lives. All begin without Focus Lowest HP and with a declared 90-yellow reserve at mature Desert level 6. At exactly 300,000 ms (after the first endpoint), a surviving character makes one production craft attempt against the real Desert >=4 gate and cost, then validates/equips In Combat -> Focus Lowest HP. Preserve focus-adoption.json and summary.focusAdoption. No health, barrier, ecology or target reset. Early deaths remain not-reached; failed gates/payment remain craft-unavailable, never silently replaced with a granted rune. Ranged Desert lives keep native Keep Distance and do not receive the midpoint rule.

## Report and publication

Write one readable REPORT.md and the compact contract files under reports/player-fast-pass/t2-multi-biome-class-01/run-01/. Seed CLASS_ASSESSMENT.md from this packet and append the 18-by-seven map and six-root findings. Lead with the decisions and return up to three actionable balance priorities. Keep A, B and D distinct and comparisons within fixture/seed. Report both five-minute work windows, first-kill latency, unfinished targets, significant gaps, HP/barrier pressure, counterplay/Guard evidence and actual enemy exposure. Do not treat pre-adoption Desert deaths as evidence the rune failed, or survivor-selected second halves as randomized rune effects.

Use existing external raw streams for concise consequential-outlier traces. Keep per-tick data external at D:/mmo-idle/t2-multi-biome-class-01/run-01. Reconcile planned/completed/failed/deferred/not-run counts; D has zero deferred rows. No post-death imputation, cross-biome kill leaderboard, boss certification, acquisition/economy claim, automatic correction or follow-on survey.

Publish from `D:/mmo-idle/t2-multi-biome-class-01/publication` on `codex/t2-multi-biome-class-01-packet`; inspect git status, explicitly stage only the compact result directory and necessary handoff updates, commit AND push the scoped report. Never force-push or stage unrelated work. Verify the remote full SHA and intended files/hashes. Return branch, full publication SHA, measured SHA, report path and reconciled counts. A publication failure does not authorize combat replay. Stop after the report/publication.
