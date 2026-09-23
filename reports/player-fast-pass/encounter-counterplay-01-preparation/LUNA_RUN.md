# Luna handoff — encounter counterplay 01

Preparation complete, combat unrun. Read `BRIEF.md`, `README.md`, and `ORDERED_CASES.tsv`. Run only after assignment. Approved Spirit is already integrated and pushed on develop at `d073dc19c4f9df9c90b4661899d2454972b2c5b3`; no further numerical approval or adoption work is needed. Conduit is unchanged.

Frozen execution SHA: `7c3bf6bc0035feff0c0e432b4cda4a4e804281ad`. Checkout: `D:/mmo-idle/encounter-counterplay-01/source`. Packet: `D:/mmo-idle/encounter-counterplay-01/packet`. The two arm contracts intentionally name this same source. Hitboxes: `D:/mmo-idle/encounter-counterplay-01/hitboxes.json`, SHA-256 `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`. Runtime: Node v22.16.0. The identity files retain every measured source hash.

Qualification and receipt-check are complete at their final paths, 24/24 each, zero World ticks. Do not repeat, reseal, move the checkout, or substitute the publication mirror. This exact read-only verify command passed; the subsequent run command is deliberately unexecuted:

```powershell
Set-Location 'D:/mmo-idle/encounter-counterplay-01/source'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/encounter-counterplay.mjs --mode=verify --packet=D:/mmo-idle/encounter-counterplay-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed. Stop and preserve evidence.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/encounter-counterplay.mjs --mode=run --packet=D:/mmo-idle/encounter-counterplay-01/packet --out=D:/mmo-idle/encounter-counterplay-01/run-01
```

The dispatcher resolves actual farm/boss child entrypoints from this checkout, requires exact applied receipts, and runs one child at a time. Order: J1, J2, V1, P1, M1, E1; each pair adjacent, control first on 101009 and treatment (`candidate`) first on 101033. Exactly 24 fresh lives. Farming cap 600,000 ms, endpoints 300,000/600,000; boss cap 300,000. All steps 100 ms. First death or authoritative boss kill ends the life. No respawn, refill, reset, pilot, retry, seed change, cap extension, loadout change or rescue arm.

Watchdogs: 5 GiB disk floor, 1 GiB host free RAM, 2 GiB child RSS ceiling, 5-second polling, 120-second advancing-heartbeat limit; boss child keeps its existing wall ceiling. Gameplay death is a result and the queue continues. Shared operational failure stops the affected farming family or boss species; source/receipt drift stops the queue. Preserve partials and all not-run rows. Existing run output/marker forbids relaunch. Publication trouble never justifies replay.

Only treatment deltas: J1/J2 Swamp armor -> Mountain armor, +3; V1 Offensive -> Defensive; P1 add native Brace; M1 add native Endure; E1 Sweep -> Detonate and replace the old Brace timing rule in place with Fully Afflicted -> Detonate, retaining native Brace and all other defenses. Exact paid ownership, ranks, upgrades, core, HP/passives, stance and ordered rules are in `qualification/resolved-builds.json` and must replay unchanged.

## Interpretation and publication

For every pair separate legally equipped, actually used, and useful effect. Farming: death/survival, equal live-window completed work, first kill, late progress, enemy exposure and HP/barrier pressure; no kills/minute ranking that rewards short lethal bursts. Preserve missing/post-death endpoints as null. Bosses: authoritative kill/time or supported HP progress, P1 first add kill/opening HP, M1 actual Guard states at charge/Cragbreaker, E1 actual owned max stacks, Detonate resolution and boss HP/Guard around Final Eruption. Native timing plus its declared RP/lost-tool tradeoff is the treatment; cast counts alone are insufficient. Read buffs at impacts, including Endure, rather than infer expiry from an early activation label.

Use existing `events.jsonl`, `samples.jsonl`, guard streams and boss combat snapshots. Missing exclusive healing or overkill attribution stays a limitation. No enemy/ability changes, extra telemetry project, unallocated combat or T4 launch.

Publish `reports/player-fast-pass/encounter-counterplay-01/run-01/REPORT.md`, `results-summary.json`, applied-build/source/terminal receipts and a verified raw-artifact inventory. Raw JSONL stays outside Git. Use publication checkout `D:/ec1pub`, branch `codex/encounter-counterplay-01-packet`; do not execute from there. Commit AND push only scoped compact results; verify remote ref and report blob. No merge to develop, force-push, release or deployment.

End with at most five substantive findings and three next decisions. Each priority gets one disposition: retain credible response, propose an exact supported correction, or ask one specific designer question. Report publication branch/full SHA, execution SHA, integrated Spirit SHA, report path, and planned/completed/gameplay-death/operational-failure/omitted/not-run counts. Ten-minute survival is not twenty-minute certification, and two seeds do not certify sibling classes or an entire biome.
