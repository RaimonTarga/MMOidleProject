# Luna handoff — T3 Tundra class/frame recovery run 02

**Replacement packet prepared, qualified, and receipt-verified; combat NOT launched.** This is the authorized recovery of the same 52-case matrix. It is not a retry of `run-01`, and it reuses none of that failed attempt’s gameplay output.

Frozen execution source: `7d0dadb2b4397141c5a654ab9bb658871c56147b` at `D:/t3r/src`. Packet: `D:/t3r/packet`. The exact source, runtime, hitboxes, ledger, qualification receipt hash, and independent receipt-check hash are already fixed.

The replacement baseline includes movement-only Hamstring. Do not add the separate Heat work, restore Hamstring attack slow, add Endure, change a package, or follow later `develop` changes. Squire Slam remains excluded.

## Exact execution command

Run once only. If the command returns a running session, await that same session; never issue it again.

```powershell
Set-Location 'D:/t3r/src'
if (Test-Path 'D:/t3r/run-02') { throw 'run-02 already exists; inspect, do not retry.' }
if (Test-Path 'D:/t3r/packet/run-launched.json') { throw 'Replacement already launched; no retries.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=t3-tundra-class-frame-01 --mode=verify --packet=D:/t3r/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=t3-tundra-class-frame-01 --mode=run --packet=D:/t3r/packet --out=D:/t3r/run-02
```

The run command itself requires `receipt-verified.json` and rechecks its source, manifest, qualification receipt, and verification receipt hashes before creating combat output. The first normal child is observation 1; once its full receipt is accepted, the dispatcher continues automatically. There is no extra pilot.

One worker, 100 ms steps, first-death stop, 600,000 ms cap, zero retries. A valid gameplay death or cap completes a row and proceeds. Any source, packet, runtime, readback, child-process, storage, memory, or heartbeat failure stops the family; preserve completed, failed, and remaining not-run rows. Do not repair, replay, skip, extend, requalify, reseal, add seeds, or transplant receipts.

## Reporting and publication

Raw output remains at `D:/t3r/run-02`. Publish the compact result bundle under `reports/player-fast-pass/t3-tundra-class-frame-01/run-02/` according to `REPORT_CONTRACT.json`. Preserve `run-01` as a separate failed operational record.

Lead with completion and reconciled counts. Then show all 18 primary identities, followed by eight matched alternatives with seeds separate. Include survival/time-to-death, completed work, unfinished targets, and material terminal context. Distinguish cap survival from indefinite sustain. Do not count the old 42 kills, combine old/new Hamstring mechanics, revive Squire Slam, or treat a package alternative as universal proof.

Use relevant completed farming and boss summaries as contextual evidence with their source limits. Return at most five findings and three decisions or designer questions. No automatic follow-on campaign.

Commit and push only the compact report/supporting evidence and scoped handoff updates. Verify the remote ref and report bytes. Return branch, measured source SHA, publication SHA, report path, and planned/new-completed/failed/omitted/not-run counts. Push failure never authorizes another combat run. No deployment.
