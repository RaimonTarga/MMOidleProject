# Luna handoff — T4 specialization screen 01

Preparation complete, combat unrun. Read `REPORT.md`, `BRIEF.md`, and `ORDERED_CASES.tsv`. Execute only when assigned. Exactly **432 fresh lives**: 54 production specializations × four contexts × seeds 101009/101033. Established T4 snapshot: **GM148 / 45 RP / Mountain24**, ordinary T4 gear **+4**, cores/relics **+0**. No additional campaign, pilot, treatment or rescue arm.

Frozen execution SHA: `3b9067c4990fbbbd4c3a889414b0b33bf2c4d27e`. Checkout: `D:/mmo-idle/t4-specialization-screen-01/source`. Packet: `D:/mmo-idle/t4-specialization-screen-01/packet`. Both legacy arm contracts intentionally identify this same source; all cases are one-package observations, not a control/candidate ablation. Hitboxes: `D:/mmo-idle/t4-specialization-screen-01/hitboxes.json`, SHA-256 `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`. Runtime: Node v22.16.0. Full identity hashes are retained in the packet.

Committed Heat `a3adb0b2` and movement-only Hamstring `6b7e5268` (experiment cherry-pick `964ac7ed`) are included. Approved Spirit `d073dc19` remains integrated once. The later uncommitted Heat-cooling and Conduit ability-firing edits are excluded. No new Conduit tuning is present.

Qualification and receipt-check are complete at their final paths: **432/432 each, zero World ticks**, exact applied-receipt equality. Do not repeat, reseal, repair the source, move the checkout or execute from the publication mirror. The read-only verify command below passed. The run command is supplied for Luna and has **not** been executed:

```powershell
Set-Location 'D:/mmo-idle/t4-specialization-screen-01/source'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/t4-specialization.mjs --mode=verify --packet=D:/mmo-idle/t4-specialization-screen-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed. Stop and preserve evidence.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/t4-specialization.mjs --mode=run --packet=D:/mmo-idle/t4-specialization-screen-01/packet --out=D:/mmo-idle/t4-specialization-screen-01/run-01
```

The dispatcher uses the existing production farm/boss children and one worker. Within each seed, the frozen order round-robins roots with rotating frames, paths and contexts. F1 Volcano `node-t4-volcanic-01` and F2 Tundra `node-t4-tundra-01`: 600,000 ms cap, 300,000/600,000 ms endpoints. B1 Mountain `iron-crest-titan` and B2 Wasteland `charnel-crown-sovereign`: 300,000 ms cap. Every step is 100 ms. First player death or authoritative boss kill ends a life; preserve simultaneous terminals. No respawn, refill, extra seed, retry, cap extension, loadout change or automatic advancement/purchases. Mastery stays fixed; incidental reward counters are recorded, not used to alter the package.

Boss access is synthetic: guardians stripped, production dungeon spawning without a World tick. Formation initialization and boss opening scripts begin inside measurement. Do not label guardian/travel acquisition as tested. Initial stats, class path, paid prior purchases and seals, ability ranks/triggers, stance and ordered Rune costs are recorded in `applied-build-details.json` and `qualification/resolved-builds.json`. Exact receipts must replay unchanged.

Watchdogs: 5 GiB free disk, 1 GiB host free RAM, 2 GiB child RSS, 5-second polling, 120-second advancing-heartbeat limit; the boss child's existing wall ceiling also applies. Gameplay death continues the queue. A common operational fault blocks the affected family; source/receipt drift stops affected work. Preserve partial outputs and not-run rows. Existing launch marker/output forbids relaunch. Publication failure is never grounds to rerun combat.

## Interpretation and publication

For farms, report survival/time, lifetime completed kills, cumulative 5/10-minute work, first-kill delay, no-progress periods and terminal cause. Use recorded recovery/waiting/exposure when available; preserve missing/post-death endpoints as null. For bosses, retain authoritative kill evidence/time, supported remaining/removed boss HP, owner HP and barrier separately, add kills/first-add timing and important phase counterplay. Keep boss pressure separate from add work.

Use existing events, samples, guard streams and Conduit observations to distinguish mechanism opportunity, observed delivery and useful effect. Passive readback alone is not combat benefit. Missing exclusive damage/healing attribution stays unavailable. Two identical seed-labelled boss outcomes are duplicate scenario exposure, not independent robustness. Compare within the same context and checkpoint; do not pool unlike kill rates into a class tier list.

Publish the readable 54-path × four-context report at `reports/player-fast-pass/t4-specialization-screen-01/run-01/REPORT.md`, compact results, source/manifest/applied-build/terminal receipts and verified external raw inventory. Use publication checkout `D:/t4s1pub`, branch `codex/t4-specialization-screen-01-packet`; never execute from it. **Commit and push**, then verify remote ref and report blob. Keep bulky JSONL external. No merge to develop, force-push, release, deployment, numerical patch or extra campaign.

Keep the existing-evidence column and T2/T3 decision register from the preparation report. End with at most five findings and three immediate decisions, including healthy paths and excessive/weak whole packages without assuming a root coefficient defect. Return publication branch/full SHA, execution SHA, report path, and planned/completed/gameplay-death/operational-failure/omitted/not-run counts. At handoff: **432 / 0 / 0 / 0 / 0 / 432**. Qualification/replay counts are preparation, never completed combat.
