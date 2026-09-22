# Luna handoff — T3 Tundra class/frame 01

**Prepared and zero-tick qualified; NOT launched. Execute only when assigned this packet.** Ceiling: 52 observations, one worker, zero retries, no extra seeds, arms, pilots, or cap extensions.

Read `README.md`, `PACKAGES.md`, `CHECKS.json`, `REPORT_CONTRACT.json`, and the sealed manifest. The user's correction supersedes the source brief: Squire Slam is out of scope. Do not add A1 or any substitute.

Frozen execution source is `ce9ae8d14da009034996c055e3bfa5d96422e80d` with sealed source SHA-256 `652607c303d600a4339eefef37c91d4ff72f857d614de69c3968fbe9faeaf132`. The frozen worktree contains the sealed Windows byte materialization; Git may describe line-ending-only worktree differences even though `git diff --quiet` and the strict packet verifier pass. Do not normalize, reset, checkout files, reinstall dependencies, or reseal.

## Exact command

Run once only. If the shell returns a running session, await that same session; never issue the command again.

```powershell
Set-Location 'D:/mmo-idle/t3-tundra-class-frame-01/source'
if (Test-Path 'D:/mmo-idle/t3-tundra-class-frame-01/run-01') { throw 'Output already exists; inspect, do not retry.' }
if (Test-Path 'D:/mmo-idle/t3-tundra-class-frame-01/packet/run-launched.json') { throw 'Already launched; no retries.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=t3-tundra-class-frame-01 --mode=verify --packet=D:/mmo-idle/t3-tundra-class-frame-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=t3-tundra-class-frame-01 --mode=run --packet=D:/mmo-idle/t3-tundra-class-frame-01/packet --out=D:/mmo-idle/t3-tundra-class-frame-01/run-01
```

The order is fixed in the sealed manifest. Seed 101009 places a paired primary before its alternative; seed 101021 reverses the pair. This checks order sensitivity without changing the declared cases. Every observation is one continuous life at 100 ms, with 5- and 10-minute endpoints and first-death stop.

The dispatcher must remain sequential. A valid death or cap completes a gameplay row and proceeds. A source, packet, runtime, readback, child-process, storage, memory, or heartbeat failure stops the family; preserve completed, failed, and remaining not-run rows. Do not repair, retry, skip ahead, requalify, reseal, add a seed, or launch a follow-on family.

## Reporting

Raw output remains at `D:/mmo-idle/t3-tundra-class-frame-01/run-01`. Publish only the compact files required by `REPORT_CONTRACT.json` under `reports/player-fast-pass/t3-tundra-class-frame-01/run-01/`.

Report the 18 primary identities first, then each matched alternative within fixture and seed. Keep death-shortened rates, caps, no-contact intervals, and missing post-death endpoints explicit. Two seeds are screening repeats, not a probability estimate. Synthetic mature ownership is not acquisition, economy, or live-player evidence.

Use at most five findings and three decisions. Do not collapse the result into a universal class, frame, weapon, or ability winner. In particular, no result can revive the excluded Squire Slam question.

For publication, use the main repository checkout, inspect status, and explicitly stage only the compact result directory plus necessary scoped handoff updates. Commit and push through `develop`, verify the remote ref and report bytes, and return branch, publication SHA, measured source SHA, report path, and planned/new-completed/failed/omitted/not-run counts. A push failure does not authorize a combat replay. No deployment or automatic follow-on.
